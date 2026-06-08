const Complaint = require('../models/Complaint');

/**
 * Generates a unique complaint ID in the format MV-YYYY-XXXXX.
 * Resets the 5-digit counter each calendar year.
 * Example: MV-2026-00001, MV-2026-00002, ..., MV-2027-00001
 */
const generateComplaintId = async () => {
  const currentYear = new Date().getFullYear();

  // Find the most recently created complaint for this year
  const lastComplaint = await Complaint.findOne({
    complaintId: new RegExp(`^MV-${currentYear}-`),
  })
    .sort({ createdAt: -1 })
    .select('complaintId')
    .lean();

  let nextNumber = 1;

  if (lastComplaint) {
    // Extract the 5-digit number from the last ID and increment
    const parts = lastComplaint.complaintId.split('-');
    const lastNumber = parseInt(parts[2], 10);
    nextNumber = lastNumber + 1;
  }

  // Pad to 5 digits: 1 → '00001'
  const paddedNumber = String(nextNumber).padStart(5, '0');
  return `MV-${currentYear}-${paddedNumber}`;
};

module.exports = generateComplaintId;
