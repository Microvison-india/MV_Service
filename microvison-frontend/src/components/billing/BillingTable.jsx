const PRODUCT_LABELS = {
  led: 'LED',
  cooler: 'Cooler',
  both: 'LED + Cooler',
};

export default function BillingTable({ bills = [], loading = false }) {
  // Calculations for summary footer
  const totalPreset = bills.reduce((sum, b) => sum + (b.billing?.preset || 0), 0);
  const totalPetrol = bills.reduce((sum, b) => sum + (b.billing?.petrol || 0), 0);
  const totalExtras = bills.reduce((sum, b) => sum + (b.billing?.extrasTotal || 0), 0);
  const totalOwed = bills.reduce((sum, b) => sum + (b.billing?.total || 0), 0);
  const totalCustomerPaid = bills.reduce((sum, b) => sum + (b.billing?.customerPaymentAmount || 0), 0);

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-foreground">
          <thead className="bg-muted/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold">Complaint ID</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Warranty</th>
              <th className="px-4 py-3 font-semibold text-right">Preset (₹)</th>
              <th className="px-4 py-3 font-semibold text-right">Petrol (₹)</th>
              <th className="px-4 py-3 font-semibold text-right">Extras (₹)</th>
              <th className="px-4 py-3 font-semibold text-right">Total (₹)</th>
              <th className="px-4 py-3 font-semibold text-right">Customer Paid (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="border-b border-border">
                  {Array.from({ length: 9 }).map((_, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : bills.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-12 text-center text-muted-foreground italic">
                  No billing records found for this selection.
                </td>
              </tr>
            ) : (
              bills.map((b) => {
                const isWarranty = b.warrantyStatus === 'in_warranty';
                return (
                  <tr key={b._id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-muted-foreground">
                      {b.complaintId}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {b.customerName}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      {PRODUCT_LABELS[b.product] || b.product}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isWarranty
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200'
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
                    <td className="px-4 py-3 text-right font-medium text-green-700">
                      {!isWarranty && b.billing?.customerPaymentAmount > 0 
                        ? `₹${b.billing?.customerPaymentAmount}` 
                        : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {bills.length > 0 && !loading && (
            <tfoot className="bg-muted/30 border-t border-border font-bold text-foreground">
              <tr>
                <td colSpan="4" className="px-4 py-3">Total Rollup</td>
                <td className="px-4 py-3 text-right text-foreground">₹{totalPreset}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">₹{totalPetrol}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">₹{totalExtras}</td>
                <td className="px-4 py-3 text-right text-lg text-primary">₹{totalOwed}</td>
                <td className="px-4 py-3 text-right text-green-700">₹{totalCustomerPaid}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
