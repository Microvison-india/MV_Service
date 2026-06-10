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

  // 1. Preset base price
  const presetPrice = isWarranty ? (complaint.presetPrice ?? 0) : 0;
  const presetName = isWarranty ? (complaint.presetName || '') : '';

  // 2. Petrol logic (In warranty only, check for strict null/undefined to preserve 0)
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

  // 3. Approved Extra charges (both warranty types)
  const approvedExtras = (complaint.extraCharges || [])
    .filter((ec) => ec.status === 'approved');
  
  const extrasTotal = approvedExtras.reduce((sum, ec) => sum + (ec.amount || 0), 0);

  // 4. Calculate total
  const total = isWarranty 
    ? presetPrice + petrol + extrasTotal 
    : extrasTotal;

  return {
    preset: presetPrice,
    presetName,
    petrol,
    extrasTotal,
    extrasList: approvedExtras.map((ec) => ({ label: ec.label, amount: ec.amount })),
    total,
    customerPaymentAmount: complaint.customerPaymentAmount || 0,
  };
}

module.exports = { calcBill };
