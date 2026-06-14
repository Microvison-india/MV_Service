const Complaint = require('../models/Complaint');

/**
 * Generates a unique Complaint ID in the format M + I/C + DDMMYY + 4-digit daily counter + W/O.
 * The daily counter resets to 0001 each new day.
 * Legacy IDs are preserved and ignored by the daily regex scanner.
 * @param {string} complaintType - 'installation' or 'complaint'
 * @param {string} warrantyStatus - 'in_warranty' or 'out_of_warranty'
 */
const generateComplaintId = async (complaintType, warrantyStatus) => {
  const typeCode = complaintType === 'installation' ? 'I' : 'C';
  const warrantyCode = warrantyStatus === 'in_warranty' ? 'W' : 'O';

  // Format today's date as DDMMYY
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date();
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const yearStr = String(d.getFullYear()).slice(-2);
  const dateStr = `${day}${month}${yearStr}`; // e.g. "150626"

  // Regex to find today's complaints in the new format: M + [IC] + DDMMYY + 4 digits + [WO]
  const regex = new RegExp(`^M[IC]${dateStr}\\d{4}[WO]$`);

  // We scan the last 10 complaints matching today's pattern to find the highest daily sequence number
  const todayComplaints = await Complaint.find({
    complaintId: { $regex: regex }
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(10)
    .select('complaintId')
    .lean();

  let maxNum = 0;
  for (const c of todayComplaints) {
    if (c.complaintId) {
      // e.g. MC1506260003O -> substring(8, 12) is "0003"
      const numStr = c.complaintId.substring(8, 12);
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNumber = maxNum + 1;
  const paddedNumber = String(nextNumber).padStart(4, '0');

  return `M${typeCode}${dateStr}${paddedNumber}${warrantyCode}`;
};

module.exports = generateComplaintId;
