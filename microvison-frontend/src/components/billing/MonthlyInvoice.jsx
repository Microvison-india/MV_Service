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
      // Change 6A: Use unified customerPaidToSC from billingCalculator
      customerPaidToSC: c.customerPaidToSC,
      toSCPayments: c.toSCPayments || c.billing?.toSCPayments || [],
      toMVPayments: c.toMVPayments || c.billing?.toMVPayments || [],
      // Legacy fields kept for backward compatibility
      customerPaymentAmount: c.customerPaymentAmount,
      customerChargePaidToSCAmount: c.customerChargePaidToSCAmount,
      customerChargeReason: c.customerChargeReason,
    },
  }));