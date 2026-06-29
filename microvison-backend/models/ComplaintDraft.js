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

module.exports = mongoose.model('ComplaintDraft', complaintDraftSchema);
