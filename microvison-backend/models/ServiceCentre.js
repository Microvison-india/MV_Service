const mongoose = require('mongoose');

const serviceCentreSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String, required: true, trim: true },
    businessName: { type: String, required: true, trim: true },
    phone1: { type: String, required: true, trim: true },
    phone2: { type: String, default: '', trim: true },
    email1: { type: String, required: true, lowercase: true, trim: true }, // Primary / login email
    email2: { type: String, default: '', lowercase: true, trim: true },    // Optional CC
    fullAddress: { type: String, required: true, trim: true },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceCentre', serviceCentreSchema);
