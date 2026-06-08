const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: { type: String, required: true },        // e.g., "Jaipur"
  district: { type: String, required: true },     // e.g., "Jaipur"
  state: { type: String, required: true },        // e.g., "Rajasthan"
});

citySchema.index({ name: 1 });

module.exports = mongoose.model('City', citySchema);
