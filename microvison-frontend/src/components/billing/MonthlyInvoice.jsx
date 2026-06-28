import React, { useState } from 'react';
import BillingTable from './BillingTable';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function MonthlyInvoice({ invoice }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!invoice) return null;

  // Format date range label
  let dateRangeLabel = '';
  if (invoice.dateFrom || invoice.dateTo) {
    const from = invoice.dateFrom ? formatDate(invoice.dateFrom) : 'Beginning';
    const to = invoice.dateTo ? formatDate(invoice.dateTo) : 'Today';
    dateRangeLabel = `${from} — ${to}`;
  } else if (invoice.month && invoice.year) {
    const monthLabel = MONTH_NAMES[invoice.month - 1] || invoice.month;
    dateRangeLabel = `${monthLabel} ${invoice.year}`;
  }

  // Format complaints in invoice to match billing structure
  const formattedComplaints = (invoice.complaints || []).map((c) => ({
    _id: c._id,
    complaintId: c.complaintId,
    customerName: c.customerName,
    product: c.product,
    warrantyStatus: c.warrantyStatus,
    createdAt: c.createdAt,
    billLockedAt: c.billLockedAt,
    paymentStatus: c.paymentStatus || 'unpaid',
    paidAt: c.paidAt,
    paidBy: c.paidBy,
    billing: {
      preset: c.preset,
      petrol: c.petrol,
      extrasTotal: c.extrasTotal,
      total: c.total,
      customerPaymentAmount: c.customerPaymentAmount,
      // Change 5: Critical Action deduction visible to SC (spec §7)
      customerChargePaidToSCAmount: c.customerChargePaidToSCAmount,
      customerChargeReason: c.customerChargeReason,
    },
  }));

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-5 space-y-4">
      {/* Invoice Overview Card */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Invoice Rollup
          </span>
          <h3 className="text-lg font-bold text-foreground mt-0.5">
            {invoice.businessName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {invoice.ownerName} {dateRangeLabel ? `· ${dateRangeLabel}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-left">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Complaints</p>
            <p className="text-lg font-bold text-foreground">{invoice.complaintCount}</p>
          </div>

          <div className="text-left">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Total Owed by MV</p>
            <p className="text-lg font-bold text-primary">₹{invoice.totalOwed}</p>
          </div>

          <div className="text-left">
            <p className="text-xs text-green-700 dark:text-green-400 uppercase tracking-wide font-semibold">Total Paid</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{invoice.totalPaid ?? 0}</p>
          </div>

          <div className="text-left">
            <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide font-semibold">Total Unpaid</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">₹{invoice.totalUnpaid ?? 0}</p>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-muted transition text-foreground whitespace-nowrap"
          >
            {isExpanded ? 'Hide Details ▴' : 'View Details ▾'}
          </button>
        </div>
      </div>

      {/* Expandable Table Details */}
      {isExpanded && (
        <div className="pt-4 border-t border-border animate-in fade-in duration-200">
          <h4 className="text-sm font-bold text-foreground mb-3">Itemized Complaint Bills</h4>
          <BillingTable bills={formattedComplaints} isAdmin={false} />
        </div>
      )}
    </div>
  );
}
