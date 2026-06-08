const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    serviceCentreId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCentre', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    totalAmount: { type: Number, required: true, default: 0 },
    complaintCount: { type: Number, default: 0 },
    complaints: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }],
    status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  },
  { timestamps: true }
);

// Ensure one invoice per SC per month+year
invoiceSchema.index({ serviceCentreId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
