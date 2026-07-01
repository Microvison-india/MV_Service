const mongoose = require('mongoose');

const complaintDraftSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currentStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const ComplaintDraft = mongoose.model('ComplaintDraft', complaintDraftSchema);

// Automatically sync indexes with this schema (this will drop any old unique indexes on createdBy if they exist)
ComplaintDraft.syncIndexes().catch(console.error);

module.exports = ComplaintDraft;
