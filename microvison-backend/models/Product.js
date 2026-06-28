const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    trackingId: { type: String, required: true, unique: true }, // e.g., PT-000142
    serialNumber: {
      type: String,
      sparse: true,
      unique: true, // Only unique if present
    },
    hasSerial: { type: Boolean, default: false },
    product: { type: String, enum: ['led', 'cooler'], required: true }, // Locked once set

    // Customer / Location Data (Latest)
    customerName: { type: String, required: true, trim: true },
    phone1: { type: String, required: true },
    phone2: { type: String, default: '' },
    localAddress: { type: String, required: true, trim: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    locationText: { type: String, default: '' },

    // Bill & Warranty Details (Latest)
    billPhoto: { type: String, default: '' }, // Cloudinary URL
    billDate: { type: Date, default: null },
    shopName: { type: String, default: '' },
    modelNumber: { type: String, default: '' },
    warrantyStatus: {
      type: String,
      enum: ['in_warranty', 'out_of_warranty'],
      required: true,
    },
    warrantyExpiryDate: { type: Date, default: null },
    warrantySource: {
      type: String,
      enum: ['auto_calculated', 'manual', 'forced', 'revoked'],
      required: true,
    },
    warrantyForceReason: { type: String, default: '' },

    // ── Revocation (set when admin revokes from a complaint — Change 5) ─────
    revocationReason: { type: String, default: '' },
    revocationDate: { type: Date, default: null },
    revocationComplaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
    missingFieldsWarning: [{ type: String }],

    // Timeline History
    complaintHistory: [
      {
        complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
        mvId: { type: String, required: true }, // The string MV-XXXX-XXXXX
        type: { type: String, enum: ['installation', 'complaint'], required: true },
        status: { type: String, required: true },
        date: { type: Date, required: true },
        assignedCentreId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCentre', default: null } // Optional, for SC view filtering
      },
    ],
    lastComplaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
    lastComplaintDate: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes to speed up lookups during Step 1 search
productSchema.index({ phone1: 1 });
productSchema.index({ phone2: 1 });

module.exports = mongoose.model('Product', productSchema);
