const Product = require('../models/Product');
const ComplaintUpdate = require('../models/ComplaintUpdate');
const generateTrackingId = require('../utils/generateTrackingId');
const { calculateWarranty } = require('../utils/warrantyCalculator');

// Helper to generate flexible regex pattern string for matching complaint IDs (e.g. MV-2026-00005, MV005, 00005)
const makeComplaintIdPattern = (term) => {
  if (!term) return '';
  const clean = term.trim().toLowerCase();
  
  if (clean.startsWith('m')) {
    const pattern = clean.replace(/[^a-z0-9]/g, '.*');
    return pattern;
  }
  
  const digits = clean.replace(/[^0-9]/g, '');
  if (digits) {
    if (digits.startsWith('20') && digits.length >= 9) {
      const year = digits.slice(0, 4);
      const serial = digits.slice(4);
      return year + '.*' + serial;
    } else {
      return digits;
    }
  }
  return clean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

// ─────────────────────────────────────────────────────────────
// @desc    Search products by any identifier
// @route   GET /api/products/search
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const searchProducts = async (req, res) => {
  try {
    const { phone, serial, name, address, trackingId } = req.query;
    
    // Build query dynamically
    let query = {};
    const orConditions = [];

    if (trackingId) {
      orConditions.push({ trackingId: { $regex: trackingId, $options: 'i' } });
    }
    
    if (serial) {
      orConditions.push({ serialNumber: { $regex: serial, $options: 'i' } });
    }
    
    if (phone) {
      orConditions.push({ phone1: { $regex: phone, $options: 'i' } });
      orConditions.push({ phone2: { $regex: phone, $options: 'i' } });
    }
    
    if (name) {
      orConditions.push({ customerName: { $regex: name, $options: 'i' } });
    }
    
    if (address) {
      orConditions.push({ localAddress: { $regex: address, $options: 'i' } });
    }

    // Support searching by linked complaint ID (e.g. MV001, MV-2026-00001)
    const potentialComplaintId = trackingId || serial;
    if (potentialComplaintId) {
      const complaintPattern = makeComplaintIdPattern(potentialComplaintId);
      orConditions.push({ 'complaintHistory.mvId': { $regex: complaintPattern, $options: 'i' } });
    }

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    // If no query parameters, return empty
    if (Object.keys(query).length === 0) {
      return res.status(200).json({ products: [] });
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(20) // Cap results to avoid massive payloads
      .lean();

    res.status(200).json({ products });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Server error while searching products.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get full product detail by tracking ID
// @route   GET /api/products/:trackingId
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ trackingId: req.params.trackingId }).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.status(200).json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error while fetching product.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Create new product record (can also be called internally)
// @route   POST /api/products
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const createProduct = async (req, res) => {
  try {
    const {
      serialNumber,
      product: productType,
      customerName,
      phone1,
      phone2,
      localAddress,
      city,
      district,
      state,
      billPhoto,
      billDate,
      warrantyStatus, // manual fallback if passed
      complaintType // used for default calc
    } = req.body;

    if (serialNumber) {
      const existing = await Product.findOne({ serialNumber });
      if (existing) {
        return res.status(400).json({ message: `Serial number already exists on Product ${existing.trackingId}.` });
      }
    }

    const trackingId = await generateTrackingId(productType);
    
    // Calculate warranty using new utility
    const { warrantyStatus: calcStatus, warrantyExpiryDate, warrantySource } = calculateWarranty(
      billDate,
      complaintType || 'complaint',
      warrantyStatus
    );

    const productRecord = await Product.create({
      trackingId,
      serialNumber: serialNumber || undefined,
      hasSerial: !!serialNumber,
      product: productType,
      customerName,
      phone1,
      phone2: phone2 || '',
      localAddress,
      city,
      district,
      state,
      billPhoto: billPhoto || '',
      billDate: billDate || null,
      warrantyStatus: calcStatus,
      warrantyExpiryDate,
      warrantySource,
      complaintHistory: [],
    });

    res.status(201).json({ message: 'Product created', product: productRecord });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error while creating product.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Update product record
// @route   PUT /api/products/:trackingId
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const updateProduct = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const {
      customerName,
      phone1,
      phone2,
      localAddress,
      city,
      district,
      state,
      billPhoto,
      billDate,
      warrantyStatus,
      complaintType, // used for recalculation context
      serialNumber
    } = req.body;

    const product = await Product.findOne({ trackingId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (serialNumber && serialNumber !== product.serialNumber) {
      const existing = await Product.findOne({ serialNumber });
      if (existing && existing.trackingId !== trackingId) {
        return res.status(400).json({ message: `Serial number already exists on Product ${existing.trackingId}.` });
      }
      product.serialNumber = serialNumber;
      product.hasSerial = true;
    }

    if (customerName) product.customerName = customerName;
    if (phone1) product.phone1 = phone1;
    if (phone2 !== undefined) product.phone2 = phone2;
    if (localAddress) product.localAddress = localAddress;
    if (city) product.city = city;
    if (district) product.district = district;
    if (state) product.state = state;

    // Recalculate warranty if bill info or manual override is provided
    if (billDate !== undefined || warrantyStatus !== undefined) {
      product.billDate = billDate || product.billDate;
      product.billPhoto = billPhoto || product.billPhoto;
      
      const { warrantyStatus: calcStatus, warrantyExpiryDate, warrantySource } = calculateWarranty(
        product.billDate,
        complaintType || 'complaint',
        warrantyStatus || product.warrantyStatus
      );
      
      product.warrantyStatus = calcStatus;
      product.warrantyExpiryDate = warrantyExpiryDate;
      product.warrantySource = warrantySource;
    }

    await product.save();
    res.status(200).json({ message: 'Product updated', product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error while updating product.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Check reopen eligibility for a given product
// @route   GET /api/products/:trackingId/reopen-check
// @access  Private (Admin + SC)
// ─────────────────────────────────────────────────────────────
const getReopenCheck = async (req, res) => {
  try {
    const { trackingId } = req.params;
    
    const product = await Product.findOne({ trackingId })
      .populate('lastComplaintId')
      .lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (!product.lastComplaintId) {
      return res.status(200).json({ reopenEligible: false, reason: 'No complaint history.' });
    }

    const lastComplaint = product.lastComplaintId;
    
    // Eligibility 1: Must be closed
    if (lastComplaint.status !== 'closed') {
      return res.status(200).json({
        reopenEligible: false,
        reason: 'Last complaint is not closed.',
        lastComplaint
      });
    }

    // Eligibility 2: Must be within 30 days of creation/closure 
    // (Using lastComplaintDate as snapshotted on the product, or complaint's createdAt/updatedAt)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (product.lastComplaintDate < thirtyDaysAgo) {
      return res.status(200).json({
        reopenEligible: false,
        reason: 'Last complaint is older than 30 days.',
        lastComplaint
      });
    }

    // Eligibility 3: Must have been resolved as done or not_done
    const updateLog = await ComplaintUpdate.findOne({
      complaintId: lastComplaint._id,
      newStatus: 'closed',
    }).sort({ createdAt: -1 }).lean();

    if (!updateLog || !['done', 'not_done'].includes(updateLog.oldStatus)) {
      return res.status(200).json({
        reopenEligible: false,
        reason: 'Last complaint was not resolved as Done or Not Done.',
        lastComplaint
      });
    }

    // Fully eligible
    return res.status(200).json({
      reopenEligible: true,
      lastComplaint,
      warrantyStatus: product.warrantyStatus,
      warrantyExpiryDate: product.warrantyExpiryDate
    });

  } catch (error) {
    console.error('Error checking reopen eligibility:', error);
    res.status(500).json({ message: 'Server error while checking reopen eligibility.' });
  }
};

module.exports = {
  searchProducts,
  getProduct,
  createProduct,
  updateProduct,
  getReopenCheck
};
