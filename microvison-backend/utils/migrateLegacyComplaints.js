const Complaint = require('../models/Complaint');
const Product = require('../models/Product');
const generateTrackingId = require('./generateTrackingId');

const migrateLegacyComplaints = async () => {
  try {
    console.log('[Migration] Checking for legacy complaints to migrate...');
    
    // Clean up any serialNumber: null on existing products/complaints to ensure sparse unique index works properly
    await Product.updateMany({ serialNumber: null }, { $unset: { serialNumber: "" } });
    await Complaint.updateMany({ serialNumber: null }, { $unset: { serialNumber: "" } });

    // 1. Find all legacy complaints (trackingId is null or doesn't exist)
    const legacyComplaints = await Complaint.find({
      $or: [
        { trackingId: null },
        { trackingId: { $exists: false } }
      ]
    }).sort({ createdAt: 1 });

    if (legacyComplaints.length === 0) {
      console.log('[Migration] No legacy complaints to migrate.');
      return;
    }

    console.log(`[Migration] Found ${legacyComplaints.length} legacy complaints to migrate.`);

    // 2. Group legacy complaints by phone number + product type
    // This is the correct grouping: 1 Product ID = 1 physical device/installation per customer phone
    const groups = {};
    for (const complaint of legacyComplaints) {
      const phone = (complaint.phone1 || '').trim();
      if (!phone) continue;
      
      let productType = complaint.product;
      if (productType === 'both') {
        productType = 'led'; // fallback default
      }

      const key = `${phone}_${productType}`;
      if (!groups[key]) {
        groups[key] = {
          phone,
          productType,
          complaints: []
        };
      }
      groups[key].complaints.push(complaint);
    }

    // 3. Process each group
    for (const key in groups) {
      const { phone, productType, complaints } = groups[key];

      // Find if a Product record already exists for this phone and product type
      let productRecord = await Product.findOne({
        $or: [
          { phone1: phone },
          { phone2: phone }
        ],
        product: productType
      });

      if (!productRecord) {
        // Create a new product tracking record using the latest complaint's data
        const latestComplaint = complaints[complaints.length - 1];
        const trackingId = await generateTrackingId();

        productRecord = new Product({
          trackingId,
          serialNumber: latestComplaint.serialNumber || undefined,
          hasSerial: !!latestComplaint.serialNumber,
          product: productType,
          customerName: latestComplaint.customerName,
          phone1: latestComplaint.phone1,
          phone2: latestComplaint.phone2 || '',
          localAddress: latestComplaint.localAddress,
          city: latestComplaint.city,
          district: latestComplaint.district,
          state: latestComplaint.state,
          billPhoto: latestComplaint.billPhoto || '',
          billDate: latestComplaint.billDate || null,
          warrantyStatus: latestComplaint.warrantyStatus || 'out_of_warranty',
          warrantyExpiryDate: latestComplaint.warrantyExpiryDate || null,
          warrantySource: latestComplaint.warrantySource || 'manual',
          complaintHistory: []
        });

        await productRecord.save();
        console.log(`[Migration] Created new Product ${trackingId} for phone ${phone} (${productType})`);
      }

      // Link complaints to the product record and add to history
      for (const complaint of complaints) {
        complaint.trackingId = productRecord._id;
        if (!complaint.serialNumber && productRecord.serialNumber) {
          complaint.serialNumber = productRecord.serialNumber;
        }
        await complaint.save();

        const exists = productRecord.complaintHistory.some(
          h => String(h.complaintId) === String(complaint._id)
        );
        if (!exists) {
          productRecord.complaintHistory.push({
            complaintId: complaint._id,
            mvId: complaint.complaintId,
            type: complaint.complaintType || 'complaint',
            status: complaint.status,
            date: complaint.createdAt,
            assignedCentreId: complaint.assignedCentreId || null
          });
        }
      }

      // Sort history chronologically by date ascending
      productRecord.complaintHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Update last complaint reference
      if (productRecord.complaintHistory.length > 0) {
        const lastEntry = productRecord.complaintHistory[productRecord.complaintHistory.length - 1];
        productRecord.lastComplaintId = lastEntry.complaintId;
        productRecord.lastComplaintDate = lastEntry.date;
      }

      await productRecord.save();
      console.log(`[Migration] Updated Product ${productRecord.trackingId} - ${productRecord.complaintHistory.length} entries in timeline`);
    }

    console.log('[Migration] Migration complete.');
  } catch (err) {
    console.error('[Migration] Migration failed:', err);
  }
};

module.exports = migrateLegacyComplaints;
