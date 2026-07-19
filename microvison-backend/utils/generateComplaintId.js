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