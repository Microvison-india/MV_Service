import React, { useState, useEffect } from 'react';
import useBilling from '../../hooks/useBilling';
import BillingTable from '../../components/billing/BillingTable';
import MonthlyInvoice from '../../components/billing/MonthlyInvoice';
import api from '../../api/axios';

const selectCls =
  'rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition w-full';
const labelCls = 'text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block';

export default function Billing() {
  // Get date defaults
  const todayStr = new Date().toISOString().split('T')[0];
  const monthStartStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [filters, setFilters] = useState({
    dateFrom: monthStartStr,
    dateTo: todayStr,
    assignedCentreId: '',
    product: '',
    warrantyStatus: '',
    paymentStatus: '',
  });

  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' or 'invoice'
  const [scs, setScs] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [markActionLoading, setMarkActionLoading] = useState(false);
  const [showUnpaidWarning, setShowUnpaidWarning] = useState(false);

  const { bills, invoice, loading, error, refresh } = useBilling(filters);

  // Fetch all service centres (limit: 200, no active-only status filter per spec)
  useEffect(() => {
    api.get('/api/service-centres', { params: { limit: 200 } })
      .then(({ data }) => setScs(data.serviceCentres || []))
      .catch(() => {});
  }, []);

  const [prevBills, setPrevBills] = useState(bills);
  if (bills !== prevBills) {
    setPrevBills(bills);
    setSelectedIds([]);
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({
      dateFrom: monthStartStr,
      dateTo: todayStr,
      assignedCentreId: '',
      product: '',
      warrantyStatus: '',
      paymentStatus: '',
    });
  };

  // Selection handlers
  const handleSelectId = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const visibleIds = bills.map((b) => b._id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Mark as Paid
  const handleMarkPaid = async (ids) => {
    setMarkActionLoading(true);
    try {
      await api.patch('/api/billing/mark-paid', { billIds: ids });
      setSelectedIds([]);
      refresh();
    } catch (err) {
      console.error('Failed to mark paid:', err);
    } finally {
      setMarkActionLoading(false);
    }
  };

  // Mark as Unpaid triggers modal warning
  const handleMarkUnpaid = () => {
    setShowUnpaidWarning(true);
  };

  const confirmMarkUnpaid = async () => {
    setShowUnpaidWarning(false);
    setMarkActionLoading(true);
    try {
      await api.patch('/api/billing/mark-unpaid', { billIds: selectedIds });
      setSelectedIds([]);
      refresh();
    } catch (err) {
      console.error('Failed to mark unpaid:', err);
    } finally {
      setMarkActionLoading(false);
    }
  };

  // Mark All as Paid (current filtered view unpaid bills only)
  const handleMarkAllPaid = async () => {
    setMarkActionLoading(true);
    try {
      await api.patch('/api/billing/mark-paid', {
        filters: {
          assignedCentreId: filters.assignedCentreId || undefined,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          product: filters.product || undefined,
          warrantyStatus: filters.warrantyStatus || undefined,
        },
      });
      setSelectedIds([]);
      refresh();
    } catch (err) {
      console.error('Failed to mark all paid:', err);
    } finally {
      setMarkActionLoading(false);
    }
  };

  // Group bills client-side for "All Service Centres" monthly invoice rollup
  const groupBillsBySC = () => {
    const groups = {};
    bills.forEach((bill) => {
      const sc = bill.assignedCentreId;
      if (!sc) return;
      const scId = sc._id;
      if (!groups[scId]) {
        groups[scId] = {
          serviceCentreId: scId,
          businessName: sc.businessName,
          ownerName: sc.ownerName,
          totalOwed: 0,
          totalPaid: 0,
          totalUnpaid: 0,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          complaints: [],
        };
      }
      const total = bill.billing?.total || 0;
      groups[scId].totalOwed += total;
      if (bill.paymentStatus === 'paid') {
        groups[scId].totalPaid += total;
      } else {
        groups[scId].totalUnpaid += total;
      }
      groups[scId].complaints.push({
        _id: bill._id,
        complaintId: bill.complaintId,
        customerName: bill.customerName,
        product: bill.product,
        warrantyStatus: bill.warrantyStatus,
        createdAt: bill.createdAt,
        billLockedAt: bill.billLockedAt,
        paymentStatus: bill.paymentStatus,
        paidAt: bill.paidAt,
        paidBy: bill.paidBy,
        total,
        preset: bill.billing?.preset || 0,
        petrol: bill.billing?.petrol || 0,
        extrasTotal: bill.billing?.extrasTotal || 0,
        customerPaymentAmount: bill.billing?.customerPaymentAmount || 0,
      });
    });
    return Object.values(groups);
  };

  const hasUnpaidBills = bills.some((b) => b.paymentStatus === 'unpaid');
  const groupedInvoices = groupBillsBySC();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track invoices, payouts, and billing breakdown across all service centres.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
            {/* Service Centre select */}
            <div className="space-y-1">
              <label className={labelCls}>Service Centre</label>
              <select
                name="assignedCentreId"
                value={filters.assignedCentreId}
                onChange={handleFilterChange}
                className={selectCls}
              >
                <option value="">All Service Centres</option>
                {scs.map((sc) => (
                  <option key={sc._id} value={sc._id}>
                    {sc.isUnregistered ? `[UNREGISTERED] ${sc.businessName}` : sc.businessName} ({sc.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div className="space-y-1">
              <label className={labelCls}>From Date</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition w-full"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1">
              <label className={labelCls}>To Date</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition w-full"
              />
            </div>

            {/* Product select */}
            <div className="space-y-1">
              <label className={labelCls}>Product</label>
              <select
                name="product"
                value={filters.product}
                onChange={handleFilterChange}
                className={selectCls}
              >
                <option value="">All Products</option>
                <option value="led">LED</option>
                <option value="cooler">Cooler</option>
              </select>
            </div>

            {/* Warranty Status select */}
            <div className="space-y-1">
              <label className={labelCls}>Warranty</label>
              <select
                name="warrantyStatus"
                value={filters.warrantyStatus}
                onChange={handleFilterChange}
                className={selectCls}
              >
                <option value="">All Warranty Status</option>
                <option value="in_warranty">In Warranty</option>
                <option value="out_of_warranty">Out of Warranty</option>
              </select>
            </div>

            {/* Payment Status select */}
            <div className="space-y-1">
              <label className={labelCls}>Payment Status</label>
              <select
                name="paymentStatus"
                value={filters.paymentStatus}
                onChange={handleFilterChange}
                className={selectCls}
              >
                <option value="">All Payment Status</option>
                <option value="paid">Paid Only</option>
                <option value="unpaid">Unpaid Only</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground underline transition"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'complaints'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            📋 Per Complaint Bills
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'invoice'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            💰 Monthly Invoice Summaries
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Tab Contents */}
        <div className="pt-2">
          {activeTab === 'complaints' ? (
            <div className="space-y-4">
              {/* Mark All as Paid bulk action button */}
              {bills.length > 0 && hasUnpaidBills && (
                <div className="flex justify-end">
                  <button
                    onClick={handleMarkAllPaid}
                    disabled={markActionLoading}
                    className="px-4 py-2 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl transition shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    {markActionLoading ? 'Processing...' : 'Mark All Filtered Unpaid as Paid'}
                  </button>
                </div>
              )}
              <BillingTable
                bills={bills}
                loading={loading}
                isAdmin={true}
                selectedIds={selectedIds}
                onSelectId={handleSelectId}
                onSelectAll={handleSelectAll}
                onMarkPaid={handleMarkPaid}
                onMarkUnpaid={handleMarkUnpaid}
                actionLoading={markActionLoading}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="bg-card border border-border rounded-xl p-6 h-36 animate-pulse" />
              ) : filters.assignedCentreId ? (
                // Specific SC selected
                !invoice ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground italic">
                    No monthly invoice data available.
                  </div>
                ) : (
                  <MonthlyInvoice invoice={invoice} />
                )
              ) : (
                // All SCs selected -> group bills client-side and render list of SC invoices
                groupedInvoices.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                    <p className="text-3xl mb-2">🏢</p>
                    <p className="font-semibold text-foreground">No invoices generated for this selection</p>
                    <p className="text-xs mt-1">
                      There are no closed complaints or bills found in the selected date range.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupedInvoices.map((inv) => (
                      <MonthlyInvoice key={inv.serviceCentreId} invoice={inv} />
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reversal Warning Modal */}
      {showUnpaidWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-foreground text-base">Mark as Unpaid?</h3>
            <p className="text-sm text-muted-foreground">
              This will mark <strong>{selectedIds.length}</strong> paid bill(s) as unpaid.
              This action is reversible but will affect payment records. Continue?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowUnpaidWarning(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-muted text-foreground hover:bg-muted/80 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmMarkUnpaid}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm"
              >
                Yes, Mark Unpaid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
