import React from 'react';

const PRODUCT_LABELS = {
  led: 'LED',
  cooler: 'Cooler',
  both: 'LED + Cooler',
};

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
  // Calculations for summary footer
  const totalPreset = bills.reduce((sum, b) => sum + (b.billing?.preset || 0), 0);
  const totalPetrol = bills.reduce((sum, b) => sum + (b.billing?.petrol || 0), 0);
  const totalExtras = bills.reduce((sum, b) => sum + (b.billing?.extrasTotal || 0), 0);
  const totalOwed = bills.reduce((sum, b) => sum + (b.billing?.total || 0), 0);
  // SC-visible deduction: OOW customer payment + Critical Action paid_to_sc amount
  const totalCustomerPaid = bills.reduce((sum, b) =>
    sum + (b.billing?.customerPaymentAmount || 0) + (b.billing?.customerChargePaidToSCAmount || 0), 0);

  // Client-side running totals
  const totalAll = bills.reduce((s, b) => s + (b.billing?.total || 0), 0);
  const totalUnpaid = bills.filter(b => b.paymentStatus === 'unpaid').reduce((s, b) => s + (b.billing?.total || 0), 0);

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
                <th className="px-4 py-3 font-semibold text-right">Customer Paid (₹)</th>
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
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-muted-foreground">
                        {b.complaintId}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {b.customerName}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">
                        {PRODUCT_LABELS[b.product] || b.product}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${
                            isWarranty
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40'
                              : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/40'
                          }`}
                        >
                          {isWarranty ? 'In Warranty' : 'Out Warranty'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {isWarranty ? `₹${b.billing?.preset}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-muted-foreground">
                        {isWarranty ? `₹${b.billing?.petrol}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-muted-foreground">
                        {b.billing?.extrasTotal > 0 ? `₹${b.billing?.extrasTotal}` : '₹0'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        ₹{b.billing?.total}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            b.paymentStatus === 'paid'
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40'
                          }`}
                        >
                          {b.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {b.paymentStatus === 'paid' && b.paidAt
                          ? new Date(b.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-700">
                        {/* Show OOW customer payment + Critical Action paid_to_sc deduction */}
                        {(() => {
                          const oow = !isWarranty && (b.billing?.customerPaymentAmount || 0);
                          const crit = b.billing?.customerChargePaidToSCAmount || 0;
                          const total = (oow || 0) + crit;
                          if (total > 0) {
                            return (
                              <div className="flex flex-col items-end gap-0.5">
                                <span>-₹{total}</span>
                                {crit > 0 && b.billing?.customerChargeReason && (
                                  <span className="text-[10px] text-red-500 italic font-normal">{b.billing.customerChargeReason}</span>
                                )}
                              </div>
                            );
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
                  <td className="px-4 py-3 text-right text-lg text-primary">₹{totalOwed}</td>
                  <td colSpan="2" className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right text-green-700">₹{totalCustomerPaid}</td>
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
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Total (all bills in view)</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">₹{totalAll}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Paid + Unpaid combined</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm dark:bg-amber-950/10 dark:border-amber-900/40">
            <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide font-semibold">Unpaid Total</p>
            <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">₹{totalUnpaid}</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">What Microvision still owes the SC(s)</p>
          </div>
        </div>
      )}
    </div>
  );
}
