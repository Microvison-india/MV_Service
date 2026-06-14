/**
 * Calculates the warranty status based on Addendum v1.2 logic.
 * 
 * @param {Date|null} billDate - The invoice date provided
 * @param {String} complaintType - 'installation' or 'complaint'
 * @param {String|null} manualSelection - 'in_warranty' or 'out_of_warranty' explicitly set by admin
 * @returns {Object} { warrantyStatus, warrantyExpiryDate, warrantySource }
 */
const calculateWarranty = (billDate, complaintType, manualSelection) => {
  // 1. If we have a bill date, it overrides everything and auto-calculates
  if (billDate) {
    const bDate = new Date(billDate);
    const expiryDate = new Date(bDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    const today = new Date();
    // Normalize to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    
    // Normalize expiry to end of day to give full final day
    const expiryEndOfDay = new Date(expiryDate);
    expiryEndOfDay.setHours(23, 59, 59, 999);

    const status = today <= expiryEndOfDay ? 'in_warranty' : 'out_of_warranty';

    return {
      warrantyStatus: status,
      warrantyExpiryDate: expiryDate, // Store standard date
      warrantySource: 'auto_calculated'
    };
  }

  // 2. If no bill date, but manual selection is provided
  if (manualSelection) {
    return {
      warrantyStatus: manualSelection,
      warrantyExpiryDate: null,
      warrantySource: 'manual'
    };
  }

  // 3. Fallbacks if neither provided
  if (complaintType === 'installation') {
    // Brand new installation gets in_warranty by default
    return {
      warrantyStatus: 'in_warranty',
      warrantyExpiryDate: null,
      warrantySource: 'manual'
    };
  } else {
    // Any other complaint (LED/Cooler) with no bill gets out_of_warranty
    return {
      warrantyStatus: 'out_of_warranty',
      warrantyExpiryDate: null,
      warrantySource: 'manual'
    };
  }
};

module.exports = { calculateWarranty };
