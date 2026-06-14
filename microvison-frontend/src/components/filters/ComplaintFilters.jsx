import { useState, useEffect } from 'react';
import api from '../../api/axios';

const PRODUCT_OPTIONS = [
  { value: 'led', label: 'LED' },
  { value: 'cooler', label: 'Cooler' },
];

const COMPLAINT_TYPE_OPTIONS = [
  { value: 'installation', label: 'Installation' },
  { value: 'complaint', label: 'Complaint' },
];

const WARRANTY_OPTIONS = [
  { value: 'in_warranty', label: 'In Warranty' },
  { value: 'out_of_warranty', label: 'Out of Warranty' },
];

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected_by_sc', label: 'Rejected by SC' },
  { value: 'going', label: 'Going' },
  { value: 'done', label: 'Done' },
  { value: 'not_done', label: 'Not Done' },
  { value: 'part_pending', label: 'Part Pending' },
  { value: 'replacement', label: 'Replacement' },
  { value: 'reopened', label: 'Reopened' },
  { value: 'closed', label: 'Closed' },
];

const CAPABILITY_OPTIONS = [
  { value: 'led_only', label: 'LED Only' },
  { value: 'cooler_only', label: 'Cooler Only' },
  { value: 'both', label: 'Both' },
];

const inputCls =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';
const selectCls =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';
const labelCls = 'text-xs font-semibold text-muted-foreground uppercase tracking-wide';

export default function ComplaintFilters({ filters, onChange }) {
  const [cities, setCities] = useState([]);
  const [scs, setScs] = useState([]);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);

  // Load cities and active service centres
  useEffect(() => {
    api.get('/api/cities').then(({ data }) => setCities(data)).catch(() => {});
    api.get('/api/service-centres', { params: { status: 'active', limit: 100 } })
      .then(({ data }) => setScs(data.serviceCentres || []))
      .catch(() => {});
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ ...filters, search: searchInput, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Derived location arrays
  const uniqueStates = [...new Set(cities.map((c) => c.state))].sort();

  const uniqueDistricts = [...new Set(
    cities
      .filter((c) => (filters.state ? c.state === filters.state : true))
      .map((c) => c.district)
  )].sort();

  const uniqueCities = [...new Set(
    cities
      .filter((c) => {
        if (filters.state && c.state !== filters.state) return false;
        if (filters.district && c.district !== filters.district) return false;
        return true;
      })
      .map((c) => c.name)
  )].sort();

  const handleSelect = (e) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value, page: 1 });
  };

  const handleCascadingSelect = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      onChange({ ...filters, state: value, district: '', city: '', page: 1 });
    } else if (name === 'district') {
      if (value) {
        const matching = cities.find((c) => c.district === value);
        onChange({ ...filters, district: value, state: matching ? matching.state : filters.state, city: '', page: 1 });
      } else {
        onChange({ ...filters, district: '', city: '', page: 1 });
      }
    } else if (name === 'city') {
      if (value) {
        const matching = cities.find((c) => c.name === value);
        onChange({
          ...filters,
          city: value,
          district: matching ? matching.district : filters.district,
          state: matching ? matching.state : filters.state,
          page: 1,
        });
      } else {
        onChange({ ...filters, city: '', page: 1 });
      }
    }
  };

  const handleReset = () => {
    setSearchInput('');
    onChange({
      search: '',
      status: '',
      product: '',
      complaintType: '',
      warrantyStatus: '',
      state: '',
      district: '',
      city: '',
      assignedCentreId: '',
      scCapability: '',
      dateFrom: '',
      dateTo: '',
      isReopened: '',
      trackingId: '',
      serialNumber: '',
      page: 1,
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6 shadow-sm">
      {/* Search and Core Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Text Search */}
        <div className="md:col-span-4 space-y-1.5">
          <label className={labelCls}>Search Complaints</label>
          <input
            type="text"
            placeholder="Name, phone, or complaint ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Status */}
        <div className="md:col-span-3 space-y-1.5">
          <label className={labelCls}>Status</label>
          <select
            name="status"
            value={filters.status || ''}
            onChange={handleSelect}
            className={selectCls}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Product */}
        <div className="md:col-span-2 space-y-1.5">
          <label className={labelCls}>Product</label>
          <select
            name="product"
            value={filters.product || ''}
            onChange={handleSelect}
            className={selectCls}
          >
            <option value="">All Products</option>
            {PRODUCT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="md:col-span-3 flex gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanceFilters(!showAdvanceFilters)}
            className="flex-1 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-muted transition text-foreground"
          >
            {showAdvanceFilters ? 'Hide Filters ▴' : 'More Filters ▾'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground transition underline"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Advanced Filters Expandable Section */}
      {showAdvanceFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border animate-in fade-in duration-200">
          {/* State */}
          <div className="space-y-1.5">
            <label className={labelCls}>State</label>
            <select
              name="state"
              value={filters.state || ''}
              onChange={handleCascadingSelect}
              className={selectCls}
            >
              <option value="">All States</option>
              {uniqueStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div className="space-y-1.5">
            <label className={labelCls}>District</label>
            <select
              name="district"
              value={filters.district || ''}
              onChange={handleCascadingSelect}
              className={selectCls}
            >
              <option value="">All Districts</option>
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Tracking ID */}
          <div className="space-y-1.5">
            <label className={labelCls}>Tracking ID</label>
            <input
              type="text"
              name="trackingId"
              placeholder="e.g. PT-000001"
              value={filters.trackingId || ''}
              onChange={handleSelect}
              className={inputCls}
            />
          </div>

          {/* Serial Number */}
          <div className="space-y-1.5">
            <label className={labelCls}>Serial Number</label>
            <input
              type="text"
              name="serialNumber"
              placeholder="e.g. SN-12345"
              value={filters.serialNumber || ''}
              onChange={handleSelect}
              className={inputCls}
            />
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <label className={labelCls}>City</label>
            <select
              name="city"
              value={filters.city || ''}
              onChange={handleCascadingSelect}
              className={selectCls}
            >
              <option value="">All Cities</option>
              {uniqueCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Complaint Type */}
          <div className="space-y-1.5">
            <label className={labelCls}>Complaint Type</label>
            <select
              name="complaintType"
              value={filters.complaintType || ''}
              onChange={handleSelect}
              className={selectCls}
            >
              <option value="">All Types</option>
              {COMPLAINT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Warranty Status */}
          <div className="space-y-1.5">
            <label className={labelCls}>Warranty</label>
            <select
              name="warrantyStatus"
              value={filters.warrantyStatus || ''}
              onChange={handleSelect}
              className={selectCls}
            >
              <option value="">All Warranty</option>
              {WARRANTY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Service Centre Capability */}
          <div className="space-y-1.5">
            <label className={labelCls}>SC Capability</label>
            <select
              name="scCapability"
              value={filters.scCapability || ''}
              onChange={handleSelect}
              className={selectCls}
            >
              <option value="">All Capabilities</option>
              {CAPABILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Assigned Service Centre */}
          <div className="space-y-1.5">
            <label className={labelCls}>Assigned SC</label>
            <select
              name="assignedCentreId"
              value={filters.assignedCentreId || ''}
              onChange={handleSelect}
              className={selectCls}
            >
              <option value="">All Service Centres</option>
              {scs.map((sc) => (
                <option key={sc._id} value={sc._id}>{sc.businessName}</option>
              ))}
            </select>
          </div>

          {/* Reopened Toggle */}
          <div className="space-y-1.5">
            <label className={labelCls}>Reopen Status</label>
            <select
              name="isReopened"
              value={filters.isReopened || ''}
              onChange={handleSelect}
              className={selectCls}
            >
              <option value="">All Complaints</option>
              <option value="true">Reopened Only</option>
              <option value="false">New Complaints Only</option>
            </select>
          </div>

          {/* Date From */}
          <div className="space-y-1.5">
            <label className={labelCls}>From Date</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom || ''}
              onChange={handleSelect}
              className={inputCls}
            />
          </div>

          {/* Date To */}
          <div className="space-y-1.5">
            <label className={labelCls}>To Date</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo || ''}
              onChange={handleSelect}
              className={inputCls}
            />
          </div>
        </div>
      )}
    </div>
  );
}
