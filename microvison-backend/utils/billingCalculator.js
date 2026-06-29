/**
 * Calculates itemized billing details for a complaint.
 * 
 * Change 6A (v2.0): Multi-stage customer payment tracking.
 *  - customerPayments[] array: each entry has { amount, route ('to_sc'|'to_microvison') }
 *  - 'to_sc' entries are summed and subtracted from the SC bill
 *  - 'to_microvison' entries are tracked separately (internal only, not in SC bill)
 *
 * Petrol priority order: petrolFinal, then petrolSC, then petrolAdmin, default 0.
 * Zero (0) is a valid price and should not trigger fallback.
 *
 * @param {Object} complaint - The complaint document.
 * @returns {Object} - Itemized breakdown and total.
 */
function calcBill(complaint) {
  const isWarranty = complaint.warrantyStatus === 'in_warranty';

  // 1. Preset — use override if explicitly set, else original snapshot
  const presetOriginal = complaint.presetPrice ?? 0;
  const effectivePreset =
    (complaint.presetPriceOverride !== null && complaint.presetPriceOverride !== undefined)
      ? complaint.presetPriceOverride
      : presetOriginal;
  const presetName = complaint.presetName || '';

  // 2. Petrol — strict null checks to preserve 0
  let petrol = 0;
  if (complaint.petrolFinal !== null && complaint.petrolFinal !== undefined) {
    petrol = complaint.petrolFinal;
  } else if (complaint.petrolSC !== null && complaint.petrolSC !== undefined) {
    petrol = complaint.petrolSC;
  } else if (complaint.petrolAdmin !== null && complaint.petrolAdmin !== undefined) {
    petrol = complaint.petrolAdmin;
  }

  // 3. Approved extra charges
  const approvedExtras = (complaint.extraCharges || []).filter((ec) => ec.status === 'approved');
  const extrasTotal = approvedExtras.reduce((sum, ec) => sum + (ec.amount || 0), 0);

  // 4. Gross total before deductions
  const grossTotal = effectivePreset + petrol + extrasTotal;

  // 5. Change 6A: Multi-stage customer payments
  const payments = complaint.customerPayments || [];
  
  // Amounts paid directly to SC — subtracted from SC bill
  const toSCEntries = payments.filter(p => p.route === 'to_sc');
  const customerPaidToSC = toSCEntries.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  // Amounts paid to Microvison — internal tracking only, not in SC bill
  const toMVEntries = payments.filter(p => p.route === 'to_microvison');
  const customerPaidToMicrovison = toMVEntries.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Legacy field compatibility (for old complaints that used single fields)
  const legacyToSC = (complaint.customerPaymentAmount || 0) + (complaint.customerChargePaidToSCAmount || 0);
  const legacyToMV = complaint.customerPaymentToMicrovison || 0;

  // Use new array if it has entries, else fall back to legacy fields
  const effectiveCustomerPaidToSC = payments.length > 0 ? customerPaidToSC : legacyToSC;
  const effectiveCustomerPaidToMV = payments.length > 0 ? customerPaidToMicrovison : legacyToMV;

  // 6. Net SC total (can be negative if customer paid more to SC than SC's bill)
  const netTotal = grossTotal - effectiveCustomerPaidToSC;

  return {
    preset: effectivePreset,
    presetOriginal,
    presetOverrideReason: complaint.presetPriceOverrideReason || null,
    presetName,
    petrol,
    extrasTotal,
    extrasList: approvedExtras.map((ec) => ({ label: ec.label, amount: ec.amount })),
    // Change 6A: itemized payment lists
    toSCPayments: toSCEntries.map(p => ({ amount: p.amount, reason: p.reason, recordedAt: p.recordedAt })),
    toMVPayments: toMVEntries.map(p => ({ amount: p.amount, reason: p.reason, recordedAt: p.recordedAt })),
    customerPaidToSC: effectiveCustomerPaidToSC,
    customerPaidToMicrovison: effectiveCustomerPaidToMV,
    grossTotal,
    total: netTotal, // what Microvison actually pays SC
  };
}

module.exports = { calcBill };
