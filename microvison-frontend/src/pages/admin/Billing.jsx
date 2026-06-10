import { useState, useEffect } from 'react';
import useBilling from '../../hooks/useBilling';
import BillingTable from '../../components/billing/BillingTable';
import MonthlyInvoice from '../../components/billing/MonthlyInvoice';
import api from '../../api/axios';

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

export default function Billing() {
  const currentMonth = (new Date().getMonth() + 1).toString();
  const currentYear = new Date().getFullYear().toString();

  const [filters, setFilters] = useState({
    month: currentMonth,
    year: currentYear,
    assignedCentreId: '',
    product: '',
    warrantyStatus: '',
  });

  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' or 'invoice'
  const [scs, setScs] = useState([]);
  const { bills, invoice, loading, error, refresh } = useBilling(filters);

  // Fetch active service centres
  useEffect(() => {
    api.get('/api/service-centres', { params: { status: 'active', limit: 100 } })
      .then(({ data }) => setScs(data.serviceCentres || []))
      .catch(() => {});
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({
      month: currentMonth,
      year: currentYear,
      assignedCentreId: '',
      product: '',
      warrantyStatus: '',
    });
  };

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
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
                    {sc.businessName} ({sc.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Month select */}
            <div className="space-y-1">
              <label className={labelCls}>Month</label>
              <select
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
                className={selectCls}
              >
                <option value="">All Months</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Year select */}
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
            <BillingTable bills={bills} loading={loading} />
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="bg-card border border-border rounded-xl p-6 h-36 animate-pulse" />
              ) : !filters.assignedCentreId || !filters.month || !filters.year ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                  <p className="text-3xl mb-2">🏢</p>
                  <p className="font-semibold text-foreground">Select filters to view rollup</p>
                  <p className="text-xs mt-1">
                    Please select a specific **Service Centre**, **Month**, and **Year** in the filters bar above to load their monthly invoice card.
                  </p>
                </div>
              ) : !invoice ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground italic">
                  No monthly invoice data available.
                </div>
              ) : (
                <MonthlyInvoice invoice={invoice} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
