export default function BillSummary({ complaint, isAdmin = false }) {
  if (!complaint || !complaint.billGenerated) return null;

  const isWarranty = complaint.warrantyStatus === 'in_warranty';

  // 1. Preset base price
  const presetOriginal = complaint.presetPrice ?? 0;
  const presetPrice =
    complaint.presetPriceOverride !== null && complaint.presetPriceOverride !== undefined
      ? complaint.presetPriceOverride
      : presetOriginal;
  const presetName = complaint.presetName || 'Default Preset';

  // 2. Petrol logic (strict null checks to preserve 0)
  let petrol = 0;
  if (complaint.petrolFinal !== null && complaint.petrolFinal !== undefined) {
    petrol = complaint.petrolFinal;
  } else if (complaint.petrolSC !== null && complaint.petrolSC !== undefined) {
    petrol = complaint.petrolSC;
  } else if (complaint.petrolAdmin !== null && complaint.petrolAdmin !== undefined) {
    petrol = complaint.petrolAdmin;
  }

  // 3. Approved Extra charges
  const approvedExtras = (complaint.extraCharges || []).filter((ec) => ec.status === 'approved');
  const extrasTotal = approvedExtras.reduce((sum, ec) => sum + (ec.amount || 0), 0);

  // 4. Gross total
  const grossTotal = presetPrice + petrol + extrasTotal;

  // 5. Change 6A: Multi-stage customer payments
  const payments = complaint.customerPayments || [];
  const toSCPayments = payments.filter(p => p.route === 'to_sc');
  const toMVPayments = payments.filter(p => p.route === 'to_microvison');
  const newCustomerPaidToSC = toSCPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const newCustomerPaidToMV = toMVPayments.reduce((s, p) => s + (p.amount || 0), 0);

  // Legacy field fallback for old complaints without customerPayments array
  const legacySinglePaidToSC = complaint.customerPaymentAmount || 0;
  const criticalActionPaidToSC = complaint.customerChargePaidToSCAmount || 0;
  const legacyPaidToMV = complaint.customerPaymentToMicrovison || 0;

  const customerPaidToSC = (payments.length > 0 ? newCustomerPaidToSC : legacySinglePaidToSC) + criticalActionPaidToSC;
  const customerPaidToMV = payments.length > 0 ? newCustomerPaidToMV : legacyPaidToMV;

  // 6. Net total owed to SC (can be negative — SC owes Microvison if customer paid more to SC than SC's bill)
  const total = grossTotal - customerPaidToSC;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      <div className="border-b border-border pb-2">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-foreground">Bill Summary</h4>
          {complaint.engineerName && (
            <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded font-medium">
              Engineer: {complaint.engineerName}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Generated on {complaint.billLockedAt ? new Date(complaint.billLockedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Closed Date'}
        </p>
      </div>

      <div className="space-y-2.5 text-sm">
        {/* Preset and Petrol lines (now for all warranty types) */}
        <div className="flex justify-between text-foreground">
          <span className="text-muted-foreground">Preset: <span className="text-xs text-foreground font-medium">({presetName})</span></span>
          <span className="font-medium">
            {complaint.presetPriceOverride !== null && complaint.presetPriceOverride !== undefined && (
              <span className="line-through text-muted-foreground mr-2 text-xs">₹{presetOriginal}</span>
            )}
            ₹{presetPrice}
          </span>
        </div>
        {complaint.presetPriceOverrideReason && (
          <div className="text-[10px] text-muted-foreground -mt-1 ml-4 italic">
            Override reason: {complaint.presetPriceOverrideReason}
          </div>
        )}
        <div className="flex justify-between text-foreground">
          <span className="text-muted-foreground">Petrol Allowance:</span>
          <span className="font-medium">₹{petrol}</span>
        </div>

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

        {/* Gross Total (if deductions exist) */}
        {customerPaidToSC > 0 && (
          <div className="flex justify-between text-muted-foreground font-medium text-xs pt-1.5 border-t border-border">
            <span>Gross Total:</span>
            <span>₹{grossTotal}</span>
          </div>
        )}

        {/* Change 6A: Deductions — Paid to SC entries (itemised) */}
        {toSCPayments.length > 0 && (
          <div className="space-y-1 pt-1">
            {toSCPayments.map((p, i) => (
              <div key={i} className="flex justify-between text-red-600 dark:text-red-400 text-xs">
                <span>− Customer paid to SC{p.reason ? `: ${p.reason}` : ''}:</span>
                <span>−₹{p.amount}</span>
              </div>
            ))}
            <div className="flex justify-between text-red-600 dark:text-red-400 font-medium text-xs border-t border-dashed border-red-200 pt-1">
              <span>Total deducted from SC bill:</span>
              <span>−₹{customerPaidToSC}</span>
            </div>
          </div>
        )}

        {/* Legacy single-field deduction (old complaints) */}
        {payments.length === 0 && customerPaidToSC > 0 && (
          <div className="flex justify-between text-red-600 dark:text-red-400 font-medium text-xs">
            <span>- Customer paid to SC:</span>
            <span>-₹{customerPaidToSC}</span>
          </div>
        )}

        {/* Final Total Owed by MV */}
        <div className={`flex justify-between font-bold text-base pt-3 border-t border-border ${total < 0 ? 'text-red-600' : 'text-foreground'}`}>
          <span>{total < 0 ? '⚠ SC Owes Microvison:' : 'Total Owed by Microvison:'}</span>
          <span className={total < 0 ? 'text-red-600' : 'text-primary'}>₹{total}</span>
        </div>
        {total < 0 && (
          <p className="text-[10px] text-red-500 text-right italic mt-0.5">Customer paid more than SC's bill — SC must return ₹{Math.abs(total)} to Microvison.</p>
        )}

        {/* Change 6A: Informational — Customer paid Microvison (admin-only internal record) */}
        {isAdmin && customerPaidToMV > 0 && (
          <div className="mt-2 space-y-1">
            {toMVPayments.length > 0 ? (
              toMVPayments.map((p, i) => (
                <div key={i} className="p-2 bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 rounded flex justify-between items-center text-green-700 dark:text-green-400">
                  <span className="text-[11px] font-medium">For record: Customer paid Microvison{p.reason ? ` — ${p.reason}` : ''}</span>
                  <span className="text-sm font-bold">₹{p.amount}</span>
                </div>
              ))
            ) : (
              <div className="mt-2 p-2 bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 rounded flex justify-between items-center text-green-700 dark:text-green-400">
                <span className="text-[11px] font-medium">For record: Customer paid Microvison</span>
                <span className="text-sm font-bold">₹{customerPaidToMV}</span>
              </div>
            )}
          </div>
        )}

        {/* Informational: Critical Action Notes */}
        {complaint.criticalActionEnabled && (
          <div className="mt-2 space-y-1.5 p-2 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30 rounded text-rose-700 dark:text-rose-400">
            {complaint.warrantyRevoked && (
              <div className="text-[11px] font-medium flex gap-1 items-center">
                <span>⚠ Warranty revoked from {new Date(complaint.warrantyRevocationDate).toLocaleDateString('en-IN')}</span>
              </div>
            )}
            {complaint.customerChargePaymentMode === 'paid_to_microvison' && (
              <div className="text-[11px] font-medium flex justify-between items-center">
                <span>For record: Customer paid Microvison (critical action)</span>
                <span className="font-bold">₹{complaint.customerExtraCharge}</span>
              </div>
            )}
          </div>
        )}

        {/* Payment Status Row */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-3 border-t border-border/80 text-sm">
          <span className="text-muted-foreground font-semibold">Payment Status:</span>
          <div className="flex items-center gap-2">
            {complaint.paymentStatus === 'paid' ? (
              <>
                <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 text-xs font-bold rounded-full uppercase">
                  Paid
                </span>
                <span className="text-xs text-muted-foreground">
                  on {complaint.paidAt ? new Date(complaint.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </>
            ) : (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 text-xs font-bold rounded-full uppercase">
                Unpaid
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
