import React, { useState } from 'react';
import useBilling from '../../hooks/useBilling';
import BillingTable from '../../components/billing/BillingTable';
import MonthlyInvoice from '../../components/billing/MonthlyInvoice';

const labelCls = 'text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block';

export default function SCBilling() {
  const todayStr = new Date().toISOString().split('T')[0];
  const monthStartStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [filters, setFilters] = useState({
    dateFrom: monthStartStr,
    dateTo: todayStr,
    scId: 'me', // backend automatically resolves this to the logged-in SC
  });

  const { bills, invoice, loading, error } = useBilling(filters);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Billing & Invoices</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          View your per-complaint bills and monthly payouts from Microvision.
        </p>
      </div>

      {/* Date Selectors */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Invoice Card */}
      <div>
        {loading ? (
          <div className="bg-card border border-border rounded-xl p-6 h-24 animate-pulse" />
        ) : !invoice ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
            No invoice summary available for the selected range.
          </div>
        ) : (
          <MonthlyInvoice invoice={invoice} />
        )}
      </div>

      {/* Itemized Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground">Itemized Bills</h3>
        <BillingTable bills={bills} loading={loading} isAdmin={false} />
      </div>
    </div>
  );
}
