import { useState } from 'react';
import useBilling from '../../hooks/useBilling';
import BillingTable from '../../components/billing/BillingTable';
import MonthlyInvoice from '../../components/billing/MonthlyInvoice';

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const YEARS = ['2026', '2027', '2028'];

const selectCls =
  'rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition w-full';
const labelCls = 'text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block';

export default function SCBilling() {
  const currentMonth = (new Date().getMonth() + 1).toString();
  const currentYear = new Date().getFullYear().toString();

  const [filters, setFilters] = useState({
    month: currentMonth,
    year: currentYear,
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
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm max-w-md">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelCls}>Month</label>
            <select
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              className={selectCls}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Year</label>
            <select
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className={selectCls}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
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
            No invoice summary available for this month.
          </div>
        ) : (
          <MonthlyInvoice invoice={invoice} />
        )}
      </div>

      {/* Itemized Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground">Itemized Bills (This Month)</h3>
        <BillingTable bills={bills} loading={loading} />
      </div>
    </div>
  );
}
