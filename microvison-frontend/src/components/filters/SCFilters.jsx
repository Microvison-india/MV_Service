import { useState, useEffect } from 'react';
import api from '../../api/axios';

const CAPABILITY_OPTIONS = [
  { value: 'led_only', label: 'LED Only' },
  { value: 'cooler_only', label: 'Cooler Only' },
  { value: 'both', label: 'Both (LED + Cooler)' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'inactive', label: 'Inactive' },
];

export default function SCFilters({ filters, onChange }) {
  const [cities, setCities] = useState([]);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Load cities for the city dropdown
  useEffect(() => {
    api.get('/api/cities').then(({ data }) => setCities(data)).catch(() => {});
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ ...filters, search: searchInput, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const uniqueDistricts = [...new Set(
    cities
      .filter((c) => (filters.state ? c.state === filters.state : true))
      .map((c) => c.district)
  )].sort();

  const uniqueStates = [...new Set(cities.map((c) => c.state))].sort();

  const handleSelect = (e) => {
    const { name, value } = e.target;
    // If state changes, reset district
    if (name === 'state') {
      onChange({ ...filters, state: value, district: '', page: 1 });
    } else {
      onChange({ ...filters, [name]: value, page: 1 });
    }
  };

  const handleReset = () => {
    setSearchInput('');
    onChange({ search: '', city: '', district: '', state: '', status: '', productCapability: '', page: 1 });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
        {/* Search */}
        <div className="xl:col-span-2 space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Search</label>
          <input
            id="sc-search"
            type="text"
            placeholder="Name, owner, or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
          />
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
          <select
            id="sc-filter-status"
            name="status"
            value={filters.status || ''}
            onChange={handleSelect}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">State</label>
          <select
            id="sc-filter-state"
            name="state"
            value={filters.state || ''}
            onChange={handleSelect}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
          >
            <option value="">All States</option>
            {uniqueStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* District */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">District</label>
          <select
            id="sc-filter-district"
            name="district"
            value={filters.district || ''}
            onChange={handleSelect}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
          >
            <option value="">All Districts</option>
            {uniqueDistricts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Product Capability */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Capability</label>
          <select
            id="sc-filter-capability"
            name="productCapability"
            value={filters.productCapability || ''}
            onChange={handleSelect}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
          >
            <option value="">All Types</option>
            {CAPABILITY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reset */}
      <div className="mt-3 flex justify-end">
        <button
          id="sc-filter-reset"
          onClick={handleReset}
          className="text-xs text-muted-foreground hover:text-foreground underline transition"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
