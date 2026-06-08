const mongoose = require('mongoose');

const presetSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['installation_led', 'complaint_led', 'complaint_cooler'],
      required: true,
    },
    name: { type: String, required: true, trim: true },   // e.g., "Standard LED Installation"
    modelNo: { type: String, default: '', trim: true },   // User-confirmed: product model number
    price: { type: Number, required: true },              // Fixed amount in rupees
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Preset', presetSchema);
