import React from 'react';

const PRODUCT_LABELS = {
  led: 'LED',
  cooler: 'Cooler',
  both: 'LED + Cooler',
};

/** Format a rupee amount — shows negative with ₹- prefix and red styling hint */
function fmtRupee(amount) {
  if (amount === null || amount === undefined) return '—';
  const n = Number(amount);
  if (n < 0) return `-₹${Math.abs(n)}`;
  return `₹${n}`;
}

/** Indian date format: e.g. "29 Jun 2026" */
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BillingTable({
  bills = [],
  loading = false,
  isAdmin = false,
  selectedIds = [],
  onSelectId = () => {},
  onSelectAll = () => {},
  onMarkPaid = () => {},
  onMarkUnpaid = () => {},
  actionLoading = false,
}) {
  // Footer rollup — use actual values (not zeroed for out-of-warranty)
  const totalPreset   = bills.reduce((sum, b) => sum + (b.billing?.preset       ?? 0), 0);
  const totalPetrol   = bills.reduce((sum, b) => sum + (b.billing?.petrol       ?? 0), 0);
  const totalExtras   = bills.reduce((sum, b) => sum + (b.billing?.extrasTotal  ?? 0), 0);
  const totalOwed     = bills.reduce((sum, b) => sum + (b.billing?.total        ?? 0), 0);
  const totalCustomerPaid = bills.reduce((sum, b) => sum + (b.billing?.customerPaidToSC ?? 0), 0);

  // Running totals — negative bills are real (SC owes MV money); they still count in the sum
  const totalAll    = bills.reduce((s, b) => s + (b.billing?.total ?? 0), 0);
  const totalUnpaid = bills
    .filter(b => b.paymentStatus !== 'paid')
    .reduce((s, b) => s + (b.billing?.total ?? 0), 0);

  const allSelected = bills.length > 0 && bills.every(b => selectedIds.includes(b._id));

  return (
    <div className="space-y-4">
      {/* Admin Bulk Action Bar */}
      {isAdmin && selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-semibold text-foreground">{selectedIds.length} bill(s) selected</span>
          <button
            onClick={() => onMarkPaid(selectedIds)}
            disabled={actionLoading}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition shadow-sm"
          >
            Mark Selected as Paid
          </button>
          <button
            onClick={() => onMarkUnpaid(selectedIds)}
            disabled={actionLoading}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition shadow-sm"
          >
            Mark Selected as Unpaid
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-foreground">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                {isAdmin && (
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onSelectAll}
                      className="w-4 h-4 rounded border-gray-300 accent-primary cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-4 py-3 font-semibold">Complaint ID</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Warranty</th>
                <th className="px-4 py-3 font-semibold text-right">Preset (₹)</th>
                <th className="px-4 py-3 font-semibold text-right">Petrol (₹)</th>
                <th className="px-4 py-3 font-semibold text-right">Extras (₹)</th>
                <th className="px-4 py-3 font-semibold text-right">Total (₹)</th>
                <th className="px-4 py-3 font-semibold">Payment Status</th>
                <th className="px-4 py-3 font-semibold">Paid On</th>
                <th className="px-4 py-3 font-semibold text-right">Deducted from Bill (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-border">
                    {Array.from({ length: isAdmin ? 12 : 11 }).map((_, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 12 : 11} className="px-4 py-12 text-center text-muted-foreground italic">
                    No billing records found for this selection.
                  </td>
                </tr>
              ) : (
                bills.map((b) => {
                  const isWarranty = b.warrantyStatus === 'in_warranty';
                  const isSelected = selectedIds.includes(b._id);
                  const netTotal   = b.billing?.total ?? 0;
                  const isNegative = netTotal < 0; // SC owes MV money

                  return (
                    <tr key={b._id} className={`hover:bg-muted/30 transition ${isSelected ? 'bg-primary/5' : ''}`}>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelectId(b._id)}
                            className="w-4 h-4 rounded border-gray-300 accent-primary cursor-pointer"
                          />
                        </td>
                      )}
                      {/* Complaint ID */}
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-muted-foreground">
                        {b.complaintId}
                      </td>
                      {/* Customer */}
                      <td className="px-4 py-3 font-medium text-foreground">
                        {b.customerName}
                      </td>
                      {/* Product */}
                      <td className="px-4 py-3 text-xs font-medium">
                        {PRODUCT_LABELS[b.product] || b.product}
                      </td>
                      {/* Warranty badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${
                          isWarranty
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40'
                            : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/40'
                        }`}>
                          {isWarranty ? 'In Warranty' : 'Out Warranty'}
                        </span>
                      </td>
                      {/* Preset — show for all warranty types */}
                      <td className="px-4 py-3 text-right font-medium">
                        {(b.billing?.preset ?? 0) > 0 ? `₹${b.billing.preset}` : '₹0'}
                      </td>
                      {/* Petrol — show for all warranty types */}
                      <td className="px-4 py-3 text-right font-medium text-muted-foreground">
                        {(b.billing?.petrol ?? 0) > 0 ? `₹${b.billing.petrol}` : '₹0'}
                      </td>
                      {/* Extra Charges */}
                      <td className="px-4 py-3 text-right font-medium text-muted-foreground">
                        {(b.billing?.extrasTotal ?? 0) > 0 ? `₹${b.billing.extrasTotal}` : '₹0'}
                      </td>
                      {/* Net Total (can be negative) */}
                      <td className={`px-4 py-3 text-right font-bold ${isNegative ? 'text-red-600' : 'text-foreground'}`}>
                        {isNegative ? (
                          <span title="SC received more from customer than what MV owes — SC should return the difference">
                            −₹{Math.abs(netTotal)}
                          </span>
                        ) : `₹${netTotal}`}
                      </td>
                      {/* Payment Status */}
                      <td className="px-4 py-3">
                        {b.paymentStatus === 'paid' ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40">
                            {isNegative ? 'Settled' : 'Paid'}
                          </span>
                        ) : isNegative ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40">
                            SC Owes MV
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40">
                            Unpaid
                          </span>
                        )}
                      </td>
                      {/* Paid On — Indian date format */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {b.paymentStatus === 'paid' && b.paidAt ? fmtDate(b.paidAt) : '—'}
                      </td>
                      {/* Deducted from Bill (customer paid to SC) */}
                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        {(() => {
                          const toSCPayments     = b.billing?.toSCPayments || [];
                          const customerPaidToSC = b.billing?.customerPaidToSC || 0;
                          if (toSCPayments.length > 0) {
                            return (
                              <div className="space-y-0.5 text-right">
                                {toSCPayments.map((p, i) => (
                                  <div key={i} className="text-xs">
                                    <span className="font-bold">−₹{p.amount}</span>
                                    {p.reason && (
                                      <span className="text-muted-foreground ml-1 font-normal">— {p.reason}</span>
                                    )}
                                  </div>
                                ))}
                                {toSCPayments.length > 1 && (
                                  <div className="text-[10px] font-bold border-t border-dashed border-red-200 pt-0.5">
                                    Total: −₹{customerPaidToSC}
                                  </div>
                                )}
                              </div>
                            );
                          } else if (customerPaidToSC > 0) {
                            return <span>−₹{customerPaidToSC}</span>;
                          }
                          return <span className="text-muted-foreground">—</span>;
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {bills.length > 0 && !loading && (
              <tfoot className="bg-muted/30 border-t border-border font-bold text-foreground">
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-4 py-3">Total Rollup</td>
                  <td className="px-4 py-3 text-right text-foreground">₹{totalPreset}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">₹{totalPetrol}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">₹{totalExtras}</td>
                  <td className={`px-4 py-3 text-right text-lg ${totalOwed < 0 ? 'text-red-600' : 'text-primary'}`}>
                    {fmtRupee(totalOwed)}
                  </td>
                  <td colSpan="2" className="px-4 py-3" />
                  <td className="px-4 py-3 text-right text-red-600">
                    {totalCustomerPaid > 0 ? `−₹${totalCustomerPaid}` : '—'}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Running Totals Cards */}
      {bills.length > 0 && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
              Net Total (all bills in view)
            </p>
            <p className={`text-2xl font-extrabold mt-1 ${totalAll < 0 ? 'text-red-600' : 'text-foreground'}`}>
              {fmtRupee(totalAll)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalAll < 0
                ? 'SC collectively owes Microvison the difference'
                : 'Paid + Unpaid combined (MV owes SC)'}
            </p>
          </div>
          <div className={`rounded-xl p-4 shadow-sm border ${
            totalUnpaid < 0
              ? 'bg-red-50 border-red-200 dark:bg-red-950/10 dark:border-red-900/40'
              : 'bg-amber-50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/40'
          }`}>
            <p className={`text-xs uppercase tracking-wide font-semibold ${
              totalUnpaid < 0 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
            }`}>
              {totalUnpaid < 0 ? 'SC Owes Microvison' : 'Unpaid Total (MV → SC)'}
            </p>
            <p className={`text-2xl font-extrabold mt-1 ${
              totalUnpaid < 0 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
            }`}>
              {fmtRupee(totalUnpaid)}
            </p>
            <p className={`text-xs mt-0.5 ${
              totalUnpaid < 0 ? 'text-red-600 dark:text-red-500' : 'text-amber-600 dark:text-amber-500'
            }`}>
              {totalUnpaid < 0
                ? 'SC collected more than billed — return the difference'
                : 'What Microvison still owes the SC(s)'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
