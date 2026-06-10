const Complaint = require('../models/Complaint');

/**
 * Checks if a reopen-eligible complaint exists for this customer.
 *
 * Per GRD Section 8 — All of the following must be true for a reopen:
 *  1. Same phone1 (customer matched by primary phone)
 *  2. Same product (led / cooler / both)
 *  3. Same complaintType (installation / complaint)
 *  4. Original complaint was created within the last 30 days
 *  5. Original complaint status is 'done' or 'not_done'
 *
 * @param {string} phone1 - Customer's primary phone number
 * @param {string} product - Product type: 'led' | 'cooler' | 'both'
 * @param {string} complaintType - Type: 'installation' | 'complaint'
 * @returns {Object|null} - Matching complaint doc or null
 */
const findReopenEligible = async (phone1, product, complaintType) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Find the most recent closed complaint for this customer/product within 30 days
  const existing = await Complaint.findOne({
    phone1,
    product,
    complaintType,
    status: 'closed',
    createdAt: { $gte: thirtyDaysAgo },
  })
    .sort({ createdAt: -1 })
    .select('complaintId customerName city status createdAt')
    .lean();

  if (existing) {
    // Dynamically require ComplaintUpdate to prevent circular imports if any
    const ComplaintUpdate = require('../models/ComplaintUpdate');
    
    // Find the update log when it was closed
    const updateLog = await ComplaintUpdate.findOne({
      complaintId: existing._id,
      newStatus: 'closed',
    })
      .sort({ createdAt: -1 })
      .lean();

    // Only eligible if the status before closing was 'done' or 'not_done'
    if (updateLog && ['done', 'not_done'].includes(updateLog.oldStatus)) {
      return existing;
    }
  }

  return null;
};

module.exports = { findReopenEligible };
