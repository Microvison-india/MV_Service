import { useState } from 'react';
import BillingTable from './BillingTable';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlyInvoice({ invoice }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!invoice) return null;

  const monthLabel = MONTH_NAMES[invoice.month - 1] || invoice.month;

  // Format complaints in invoice to match billing structure
  const formattedComplaints = (invoice.complaints || []).map((c) => ({
    _id: c._id,
    complaintId: c.complaintId,
    customerName: c.customerName,
    product: c.product,
    warrantyStatus: c.warrantyStatus,
    createdAt: c.createdAt,
    billing: {
      preset: c.preset,
      petrol: c.petrol,
      extrasTotal: c.extrasTotal,
      total: c.total,
      customerPaymentAmount: c.customerPaymentAmount,
    },
  }));

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-5 space-y-4">
      {/* Invoice Overview Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Monthly Invoicerollup
          </span>
          <h3 className="text-lg font-bold text-foreground mt-0.5">
            {invoice.businessName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {invoice.ownerName} · {monthLabel} {invoice.year}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Complaints</p>
            <p className="text-lg font-bold text-foreground">{invoice.complaintCount}</p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Owed by MV</p>
            <p className="text-2xl font-extrabold text-primary">₹{invoice.totalOwed}</p>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-muted transition text-foreground"
          >
            {isExpanded ? 'Hide Details ▴' : 'View Details ▾'}
          </button>
        </div>
      </div>

      {/* Expandable Table Details */}
      {isExpanded && (
        <div className="pt-4 border-t border-border animate-in fade-in duration-200">
          <h4 className="text-sm font-bold text-foreground mb-3">Itemized Complaint Bills</h4>
          <BillingTable bills={formattedComplaints} />
        </div>
      )}
    </div>
  );
}
