export default function BillSummary({ complaint }) {
  if (!complaint || !complaint.billGenerated) return null;

  const isWarranty = complaint.warrantyStatus === 'in_warranty';

  // 1. Preset base price
  const presetPrice = isWarranty ? (complaint.presetPrice ?? 0) : 0;
  const presetName = isWarranty ? (complaint.presetName || 'Default Preset') : '';

  // 2. Petrol logic (strict null checks to preserve 0)
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

  // 3. Approved Extra charges
  const approvedExtras = (complaint.extraCharges || [])
    .filter((ec) => ec.status === 'approved');
  
  const extrasTotal = approvedExtras.reduce((sum, ec) => sum + (ec.amount || 0), 0);

  // 4. Calculate total
  const total = isWarranty 
    ? presetPrice + petrol + extrasTotal 
    : extrasTotal;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      <div className="border-b border-border pb-2">
        <h4 className="font-bold text-foreground">Bill Summary</h4>
        <p className="text-xs text-muted-foreground">
          Generated on {complaint.billLockedAt ? new Date(complaint.billLockedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Closed Date'}
        </p>
      </div>

      <div className="space-y-2.5 text-sm">
        {/* In Warranty specific lines */}
        {isWarranty && (
          <>
            <div className="flex justify-between text-foreground">
              <span className="text-muted-foreground">Preset: <span className="text-xs text-foreground font-medium">({presetName})</span></span>
              <span className="font-medium">₹{presetPrice}</span>
            </div>
            <div className="flex justify-between text-foreground">
              <span className="text-muted-foreground">Petrol Allowance:</span>
              <span className="font-medium">₹{petrol}</span>
            </div>
          </>
        )}

        {/* Approved Extras list */}
        {approvedExtras.length > 0 && (
          <div className="space-y-1.5 pt-1.5 border-t border-dashed border-border/60">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Approved Extras</p>
            {approvedExtras.map((ec, i) => (
              <div key={i} className="flex justify-between text-foreground text-xs pl-2">
                <span className="text-muted-foreground">• {ec.label}</span>
                <span className="font-medium">₹{ec.amount}</span>
              </div>
            ))}
            <div className="flex justify-between text-foreground font-medium text-xs pt-1.5">
              <span>Extras Total:</span>
              <span>₹{extrasTotal}</span>
            </div>
          </div>
        )}

        {/* Final Total Owed by MV */}
        <div className="flex justify-between text-foreground font-bold text-base pt-3 border-t border-border">
          <span>Total Owed by Microvision:</span>
          <span className="text-primary">₹{total}</span>
        </div>

        {/* Out of Warranty direct collection */}
        {!isWarranty && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center text-green-900 font-medium">
            <span className="text-xs">Collected from Customer directly:</span>
            <span className="text-base font-bold">₹{complaint.customerPaymentAmount || 0}</span>
          </div>
        )}
      </div>
    </div>
  );
}
