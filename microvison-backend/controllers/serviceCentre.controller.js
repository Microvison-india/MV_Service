const ServiceCentre = require('../models/ServiceCentre');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const City = require('../models/City');
const Complaint = require('../models/Complaint');
const { toTitleCase } = require('./city.controller');

// @desc    Get all Service Centres with filters + pagination
// @route   GET /api/service-centres
// @access  Admin
const getAll = async (req, res) => {
  try {
    const { city, district, state, status, productCapability, search, isUnregistered, showArchived, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (district) filter.district = { $regex: district, $options: 'i' };
    if (state) filter.state = { $regex: state, $options: 'i' };
    if (status) filter.status = status;
    if (productCapability) filter.productCapability = productCapability;

    if (isUnregistered === 'true') {
      filter.isUnregistered = true;
    } else if (isUnregistered === 'false') {
      filter.isUnregistered = { $ne: true };
    }

    if (showArchived === 'true') {
      // Include archived
    } else {
      filter.isArchived = { $ne: true };
    }

    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { phone1: { $regex: search, $options: 'i' } },
        { phone2: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ServiceCentre.countDocuments(filter);
    const serviceCentres = await ServiceCentre.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      serviceCentres,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('getAll SC error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pending Service Centres only
// @route   GET /api/service-centres/pending
// @access  Admin
const getPending = async (req, res) => {
  try {
    const pending = await ServiceCentre.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single Service Centre by ID
// @route   GET /api/service-centres/:id
// @access  Admin
const getById = async (req, res) => {
  try {
    const sc = await ServiceCentre.findById(req.params.id);
    if (!sc) return res.status(404).json({ message: 'Service Centre not found' });
    res.status(200).json(sc);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve a Service Centre
// @route   PATCH /api/service-centres/:id/approve
// @access  Admin
const approve = async (req, res) => {
  try {
    const sc = await ServiceCentre.findById(req.params.id);
    if (!sc) return res.status(404).json({ message: 'Service Centre not found' });

    sc.status = 'active';
    await sc.save();

    // Also activate the user account
    if (sc.userId) {
      await User.findByIdAndUpdate(sc.userId, { status: 'active' });
    }

    // Notify SC owner via email
    if (sc.email1) {
      try {
        await sendEmail({
          to: sc.email1,
          subject: 'Your Microvison Service Centre Account is Approved!',
          htmlContent: `
            <h2>Congratulations, ${sc.ownerName}!</h2>
            <p>Your service centre <strong>${sc.businessName}</strong> has been approved by the Microvison admin team.</p>
            <p>You can now log in to your account using your registered email and password.</p>
            <p>Welcome aboard!</p>
            <br/>
            <p>— Microvison Team</p>
          `,
        });
      } catch (emailErr) {
        console.error('Approval email failed:', emailErr.message);
        // Don't fail the whole request if email fails
      }
    }

    // Check for matching unregistered SCs by phone number
    const phones = [];
    if (sc.phone1) phones.push(sc.phone1);
    if (sc.phone2) phones.push(sc.phone2);

    let unregisteredMatchSuggestions = [];
    if (phones.length > 0) {
      unregisteredMatchSuggestions = await ServiceCentre.find({
        isUnregistered: true,
        isArchived: { $ne: true },
        $or: [
          { phone1: { $in: phones } },
          { phone2: { $in: phones } }
        ]
      });
    }

    res.status(200).json({
      message: 'Service Centre approved successfully',
      sc,
      unregisteredMatchSuggestions
    });
  } catch (error) {
    console.error('Approve SC error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject a Service Centre
// @route   PATCH /api/service-centres/:id/reject
// @access  Admin
const reject = async (req, res) => {
  try {
    const sc = await ServiceCentre.findById(req.params.id);
    if (!sc) return res.status(404).json({ message: 'Service Centre not found' });

    sc.status = 'rejected';
    await sc.save();

    if (sc.userId) {
      await User.findByIdAndUpdate(sc.userId, { status: 'rejected' });
    }

    // Notify SC owner via email
    if (sc.email1) {
      try {
        await sendEmail({
          to: sc.email1,
          subject: 'Update on Your Microvison Service Centre Registration',
          htmlContent: `
            <h2>Dear ${sc.ownerName},</h2>
            <p>Thank you for registering <strong>${sc.businessName}</strong> with Microvison.</p>
            <p>After review, we are unable to approve your account at this time. Please contact the Microvison admin team for more information.</p>
            <br/>
            <p>— Microvison Team</p>
          `,
        });
      } catch (emailErr) {
        console.error('Rejection email failed:', emailErr.message);
      }
    }

    res.status(200).json({ message: 'Service Centre rejected', sc });
  } catch (error) {
    console.error('Reject SC error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a Service Centre's details
// @route   PUT /api/service-centres/:id
// @access  Admin
const update = async (req, res) => {
  try {
    const sc = await ServiceCentre.findById(req.params.id);
    if (!sc) return res.status(404).json({ message: 'Service Centre not found' });

    const allowedFields = ['ownerName', 'businessName', 'phone1', 'phone2', 'email2', 'fullAddress', 'city', 'district', 'state', 'productCapability'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        sc[field] = req.body[field];
      }
    });

    await sc.save();
    res.status(200).json({ message: 'Service Centre updated', sc });
  } catch (error) {
    console.error('Update SC error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Deactivate a Service Centre
// @route   PATCH /api/service-centres/:id/deactivate
// @access  Admin
const deactivate = async (req, res) => {
  try {
    const sc = await ServiceCentre.findById(req.params.id);
    if (!sc) return res.status(404).json({ message: 'Service Centre not found' });

    sc.status = 'inactive';
    await sc.save();
    if (sc.userId) {
      await User.findByIdAndUpdate(sc.userId, { status: 'inactive' });
    }

    res.status(200).json({ message: 'Service Centre deactivated', sc });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get stats for a single SC (complaint counts by status)
// @route   GET /api/service-centres/:id/stats
// @access  Admin
const getStats = async (req, res) => {
  try {
    // Placeholder — will be populated in Phase 7 when Complaint model is built
    res.status(200).json({
      total: 0,
      pending: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create an unregistered Service Centre on the spot
// @route   POST /api/service-centres/unregistered
// @access  Admin
const createUnregistered = async (req, res, next) => {
  try {
    const { name, phone1, phone2, city, district, state, fullAddress, productCapability } = req.body;

    if (!name || !phone1 || !city || !state) {
      return res.status(400).json({ message: 'Business Name, Phone 1, City, and State are required.' });
    }

    const normalizedCity = toTitleCase(city);
    const normalizedDistrict = toTitleCase(district || city);
    const normalizedState = toTitleCase(state);

    // If city does not exist in cities collection, create it on the spot
    let cityDoc = await City.findOne({
      name: { $regex: new RegExp(`^${normalizedCity}$`, 'i') },
      district: { $regex: new RegExp(`^${normalizedDistrict}$`, 'i') },
      state: { $regex: new RegExp(`^${normalizedState}$`, 'i') }
    });

    if (!cityDoc) {
      cityDoc = await City.create({
        name: normalizedCity,
        district: normalizedDistrict,
        state: normalizedState
      });
    }

    const newSC = await ServiceCentre.create({
      businessName: name.trim(),
      phone1: phone1.trim(),
      phone2: phone2 ? phone2.trim() : '',
      city: normalizedCity,
      district: normalizedDistrict,
      state: normalizedState,
      fullAddress: fullAddress ? fullAddress.trim() : '',
      productCapability: productCapability || 'both',
      isUnregistered: true,
      status: 'active',
      userId: null
    });

    res.status(201).json(newSC);
  } catch (error) {
    console.error('createUnregistered error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Link unregistered SC to registered SC (Upgrade flow)
// @route   PATCH /api/service-centres/:id/link-to-registered
// @access  Admin
const linkToRegistered = async (req, res, next) => {
  try {
    const { id } = req.params; // new registered SC ID
    const { unregisteredSCId } = req.body;

    if (!unregisteredSCId) {
      return res.status(400).json({ message: 'unregisteredSCId is required' });
    }

    const newSC = await ServiceCentre.findById(id);
    if (!newSC) {
      return res.status(404).json({ message: 'New registered Service Centre not found' });
    }

    const oldSC = await ServiceCentre.findById(unregisteredSCId);
    if (!oldSC) {
      return res.status(404).json({ message: 'Unregistered Service Centre not found' });
    }

    // Migrate all complaint records
    const migrationResult = await Complaint.updateMany(
      { assignedCentreId: unregisteredSCId },
      { $set: { assignedCentreId: newSC._id } }
    );

    // Archive the unregistered SC
    oldSC.isArchived = true;
    oldSC.archivedAt = new Date();
    oldSC.linkedRegisteredSCId = newSC._id;
    await oldSC.save();

    // Ensure the new SC does not have the isUnregistered flag
    newSC.isUnregistered = false;
    await newSC.save();

    res.status(200).json({
      message: 'Unregistered Service Centre linked successfully',
      migratedCount: migrationResult.modifiedCount || migrationResult.nModified || 0,
      newSC,
      oldSC
    });
  } catch (error) {
    console.error('linkToRegistered error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAll,
  getPending,
  getById,
  approve,
  reject,
  update,
  deactivate,
  getStats,
  createUnregistered,
  linkToRegistered
};
