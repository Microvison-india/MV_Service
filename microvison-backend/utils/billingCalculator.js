/**
 * Calculates itemized billing details for a complaint.
 * 
 * Per GRD Section 13 & TBP Phase 11:
 *  - In-Warranty: Preset price + petrol + approved extra charges.
 *  - Out-of-Warranty: Approved extra charges only.
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
  const presetOriginal = isWarranty ? (complaint.presetPrice ?? 0) : 0;
  const effectivePreset =
    (complaint.presetPriceOverride !== null && complaint.presetPriceOverride !== undefined)
      ? complaint.presetPriceOverride
      : presetOriginal;
  const presetName = isWarranty ? (complaint.presetName || '') : '';

  // 2. Petrol — in-warranty only, strict null checks to preserve 0
  let petrol = 0;
  if (isWarranty) {
    if (complaint.petrolFinal !== null && complaint.petrolFinal !== undefined) {
      petrol = complaint.petrolFinal;
    } else if (complaint.petrolSC !== null && complaint.petrolSC !== undefined) {
      petrol = complaint.petrolSC;
    } else if (complaint.petrolAdmin !== null && complaint.petrolAdmin !== undefined) {
      petrol = complaint.petrolAdmin;
    }
  }

  // 3. Approved extra charges (both warranty types)
  const approvedExtras = (complaint.extraCharges || []).filter((ec) => ec.status === 'approved');
  const extrasTotal = approvedExtras.reduce((sum, ec) => sum + (ec.amount || 0), 0);

  // 5. Gross total before deductions
  const grossTotal = isWarranty
    ? effectivePreset + petrol + extrasTotal
    : extrasTotal;

  // 6. Deductions from SC bill: customer amounts SC already collected
  //    Source 1: Standard OOW customer payment (existing field)
  //    Source 2: Critical Action in-warranty customer payment collected by SC
  const customerPaidToSC =
    (complaint.customerPaymentAmount || 0) +
    (complaint.customerChargePaidToSCAmount || 0);

  // 7. Net SC total (can be negative if customer paid more to SC than SC's bill)
  const netTotal = grossTotal - customerPaidToSC;

  return {
    preset: effectivePreset,
    presetOriginal,
    presetOverrideReason: complaint.presetPriceOverrideReason || null,
    presetName,
    petrol,
    extrasTotal,
    extrasList: approvedExtras.map((ec) => ({ label: ec.label, amount: ec.amount })),
    mvExtras: 0,
    customerPaidToSC,         // total deducted from SC (shown on SC bill)
    customerPaymentToMicrovison: complaint.customerPaymentToMicrovison || 0,  // record only
    grossTotal,
    total: netTotal,           // what Microvison actually pays SC
  };
}

module.exports = { calcBill };
