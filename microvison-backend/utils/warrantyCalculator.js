/**
 * Calculates the warranty status based on Addendum v1.3 logic.
 * 
 * @param {Object} options
 * @param {Date|null} options.billDate - The invoice date provided
 * @param {String} options.complaintType - 'installation' or 'complaint'
 * @param {String|null} options.manualSelection - 'in_warranty' or 'out_of_warranty' explicitly set by admin
 * @param {String|null} options.manualReason - reason text for manual selection
 * @param {Boolean|null} options.forceOverride - whether admin overrides calculated status
 * @param {String|null} options.forceReason - reason text for force override
 * @param {String|null} options.warrantySource - existing warranty source on the product (for revocation check)
 * @param {Boolean} options.overrideRevoke - when true, admin explicitly un-revokes; skip the permanent revoke guard
 * @returns {Object} { warrantyStatus, warrantyExpiryDate, warrantySource, warrantyForceReason }
 */
const calculateWarranty = ({
  billDate,
  complaintType,
  manualSelection,
  manualReason,
  forceOverride,
  forceReason,
  warrantySource,
  overrideRevoke = false,
}) => {
  // Rule 0: Revoked status is permanent — overrides everything including force
  // Exception: if admin explicitly passes overrideRevoke=true, skip this guard
  if (warrantySource === 'revoked' && !overrideRevoke) {
    return {
      warrantyStatus: 'out_of_warranty',
      warrantyExpiryDate: null,
      warrantySource: 'revoked',
      warrantyForceReason: '',
    };
  }

  // Rule 4 (Force override) takes precedence over all other rules
  if (forceOverride === true || forceOverride === 'true') {
    return {
      warrantyStatus: manualSelection || 'out_of_warranty',
      warrantyExpiryDate: null,
      warrantySource: 'forced',
      warrantyForceReason: forceReason || '',
    };
  }

  // Rule 1 (Bill Date present)
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
      warrantyExpiryDate: expiryDate,
      warrantySource: 'auto_calculated',
      warrantyForceReason: '',
    };
  }

  // Rule 2 (No bill date, manual selection)
  if (manualSelection) {
    return {
      warrantyStatus: manualSelection,
      warrantyExpiryDate: null,
      warrantySource: 'manual',
      warrantyForceReason: '',
    };
  }

  // Rule 3 (LED Installation, nothing provided)
  if (complaintType === 'installation') {
    return {
      warrantyStatus: 'in_warranty',
      warrantyExpiryDate: null,
      warrantySource: 'manual',
      warrantyForceReason: '',
    };
  }

  // Default fallback (e.g. cooler complaint with nothing provided)
  return {
    warrantyStatus: 'out_of_warranty',
    warrantyExpiryDate: null,
    warrantySource: 'manual',
    warrantyForceReason: '',
  };
};

module.exports = { calculateWarranty };
