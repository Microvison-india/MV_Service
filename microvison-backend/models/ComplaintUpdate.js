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
    voiceUrl: { type: String, default: '' },

    // Status-specific Snapshot Fields
    parentUpdateId: { type: mongoose.Schema.Types.ObjectId, ref: 'ComplaintUpdate' },
    partDetails: { type: String, default: '' },
    partDeliveredAt: { type: Date },
    partDeliveredNote: { type: String, default: '' },
    partReceivedAt: { type: Date },
    notDoneReason: { type: String, default: '' },
    scNotes: { type: String, default: '' },
    totalVisits: { type: Number },
    distanceTravelled: { type: Number },

    // Petrol & Extra Charges Snapshots
    petrolAdmin: { type: Number },
    petrolSC: { type: Number },
    petrolFinal: { type: Number },
    extraCharges: [
      {
        label: { type: String, required: true },
        amount: { type: Number, required: true },
        requestedBy: { type: String, enum: ['admin', 'sc'], required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        approvedAt: { type: Date }
      }
    ],
  },
  { timestamps: true }
);

complaintUpdateSchema.index({ complaintId: 1, createdAt: 1 });

module.exports = mongoose.model('ComplaintUpdate', complaintUpdateSchema);
