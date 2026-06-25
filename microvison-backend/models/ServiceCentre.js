const mongoose = require('mongoose');

const serviceCentreSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    ownerName: { type: String, trim: true },
    businessName: { type: String, required: true, trim: true },
    phone1: { type: String, required: true, trim: true },
    phone2: { type: String, default: '', trim: true },
    email1: { type: String, lowercase: true, trim: true }, // Primary / login email
    email2: { type: String, default: '', lowercase: true, trim: true },    // Optional CC
    fullAddress: { type: String, trim: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    productCapability: {
      type: String,
      enum: ['led_only', 'cooler_only', 'both'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'rejected', 'inactive'],
      default: 'pending',
    },
    isUnregistered: { type: Boolean, default: false },
    linkedRegisteredSCId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCentre', default: null },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceCentre', serviceCentreSchema);
