const mongoose = require('mongoose');

const complaintUpdateSchema = new mongoose.Schema(
  {
    complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'service_centre'], required: true },
    oldStatus: { type: String, default: '' },
    newStatus: { type: String, required: true },
    note: { type: String, default: '' },
    images: [{ type: String }],       // Cloudinary URLs — SC proof photos uploaded at this status update
  },
  { timestamps: true }
);

complaintUpdateSchema.index({ complaintId: 1, createdAt: 1 });

module.exports = mongoose.model('ComplaintUpdate', complaintUpdateSchema);
