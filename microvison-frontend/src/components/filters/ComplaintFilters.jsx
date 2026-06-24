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
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected_by_sc', label: 'Rejected by SC' },
  { value: 'going', label: 'Going' },
  { value: 'done', label: 'Done' },
  { value: 'not_done', label: 'Not Done' },
  { value: 'part_pending', label: 'Part Pending' },
  { value: 'part_received', label: 'Part Received' },
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
  const [qInput, setQInput] = useState(filters.q || '');
  const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [activeDateShortcut, setActiveDateShortcut] = useState('');

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
      onChange({ ...filters, q: qInput, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput]);

  // Keep input in sync with external changes (like Reset)
  useEffect(() => {
    setQInput(filters.q || '');
  }, [filters.q]);

  // Format date helper (YYYY-MM-DD)
  const getLocalYYYYMMDD = (date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  };

  // Sync date shortcuts with actual date filters
  useEffect(() => {
    if (!filters.dateFrom && !filters.dateTo) {
      setActiveDateShortcut('');
      return;
    }
    const today = getLocalYYYYMMDD(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalYYYYMMDD(yesterday);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = getLocalYYYYMMDD(sevenDaysAgo);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = getLocalYYYYMMDD(thirtyDaysAgo);

    if (filters.dateFrom === today && filters.dateTo === today) {
      setActiveDateShortcut('today');
    } else if (filters.dateFrom === yesterdayStr && filters.dateTo === yesterdayStr) {
      setActiveDateShortcut('yesterday');
    } else if (filters.dateFrom === sevenDaysAgoStr && filters.dateTo === today) {
      setActiveDateShortcut('7days');
    } else if (filters.dateFrom === thirtyDaysAgoStr && filters.dateTo === today) {
      setActiveDateShortcut('30days');
    } else {
      setActiveDateShortcut('custom');
    }
  }, [filters.dateFrom, filters.dateTo]);

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

  const handleStatusToggle = (val) => {
    const current = filters.status || [];
    let next;
    if (current.includes(val)) {
      next = current.filter((x) => x !== val);
    } else {
      next = [...current, val];
    }
    onChange({ ...filters, status: next, page: 1 });
  };

  const handleDateShortcut = (shortcut) => {
    if (activeDateShortcut === shortcut) {
      setActiveDateShortcut('');
      onChange({ ...filters, dateFrom: '', dateTo: '', page: 1 });
      return;
    }

    setActiveDateShortcut(shortcut);
    const today = new Date();
    
    if (shortcut === 'today') {
      const todayStr = getLocalYYYYMMDD(today);
      onChange({ ...filters, dateFrom: todayStr, dateTo: todayStr, page: 1 });
    } else if (shortcut === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = getLocalYYYYMMDD(yesterday);
      onChange({ ...filters, dateFrom: yesterdayStr, dateTo: yesterdayStr, page: 1 });
    } else if (shortcut === '7days') {
      const prev = new Date();
      prev.setDate(today.getDate() - 7);
      onChange({ ...filters, dateFrom: getLocalYYYYMMDD(prev), dateTo: getLocalYYYYMMDD(today), page: 1 });
    } else if (shortcut === '30days') {
      const prev = new Date();
      prev.setDate(today.getDate() - 30);
      onChange({ ...filters, dateFrom: getLocalYYYYMMDD(prev), dateTo: getLocalYYYYMMDD(today), page: 1 });
    } else if (shortcut === 'custom') {
      // Keep values as custom
    } else {
      onChange({ ...filters, dateFrom: '', dateTo: '', page: 1 });
    }
  };

  const handleReset = () => {
    setQInput('');
    onChange({
      q: '',
      status: [],
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
      reopenedOnly: '',
      originalOnly: '',
      trackingId: '',
      serialNumber: '',
      page: 1,
      limit: 10,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.state) count++;
    if (filters.district) count++;
    if (filters.trackingId) count++;
    if (filters.serialNumber) count++;
    if (filters.city) count++;
    if (filters.complaintType) count++;
    if (filters.warrantyStatus) count++;
    if (filters.scCapability) count++;
    if (filters.assignedCentreId) count++;
    if (filters.reopenedOnly || filters.originalOnly) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6 shadow-sm">
      {/* Search and Core Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Text Search */}
        <div className="md:col-span-4 space-y-1.5">
          <label className={labelCls}>Search Complaints</label>
          <input
            type="text"
            placeholder="Search by name, phone, complaint ID, serial no, product ID..."
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Status Dropdown (Multi-Select Checkboxes) */}
        <div className="md:col-span-3 space-y-1.5">
          <label className={labelCls}>Status</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className={`${selectCls} flex items-center justify-between text-left`}
            >
              <span>
                {filters.status?.length > 0
                  ? `Status (${filters.status.length} selected)`
                  : 'All Statuses'}
              </span>
              <span className="text-xs text-muted-foreground">▾</span>
            </button>
            {statusDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setStatusDropdownOpen(false)}
                />
                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-md z-20 p-2 space-y-1">
                  {STATUS_OPTIONS.map((o) => {
                    const checked = filters.status?.includes(o.value);
                    return (
                      <label
                        key={o.value}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleStatusToggle(o.value)}
                          className="rounded border-input text-primary focus:ring-ring"
                        />
                        <span>{o.label}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
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
            {showAdvanceFilters
              ? 'Hide Filters ▴'
              : `More Filters ${activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''} ▾`}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground transition underline"
          >
            Reset All
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
              placeholder="e.g. PL000001"
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
              name="reopenStatus"
              value={filters.reopenedOnly === 'true' ? 'reopened' : filters.originalOnly === 'true' ? 'original' : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'reopened') {
                  onChange({ ...filters, reopenedOnly: 'true', originalOnly: '', page: 1 });
                } else if (val === 'original') {
                  onChange({ ...filters, reopenedOnly: '', originalOnly: 'true', page: 1 });
                } else {
                  onChange({ ...filters, reopenedOnly: '', originalOnly: '', page: 1 });
                }
              }}
              className={selectCls}
            >
              <option value="">All Complaints</option>
              <option value="reopened">Reopened Only</option>
              <option value="original">Original Only</option>
            </select>
          </div>

          {/* Date Range & Shortcut Buttons */}
          <div className="space-y-1.5 col-span-1 sm:col-span-2">
            <label className={labelCls}>Date Range</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7days', label: 'Last 7 Days' },
                { id: '30days', label: 'Last 30 Days' },
                { id: 'custom', label: 'Custom' },
              ].map((btn) => {
                const isActive = activeDateShortcut === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => handleDateShortcut(btn.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background text-muted-foreground border-input hover:bg-muted'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
            {activeDateShortcut === 'custom' && (
              <div className="flex gap-2">
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom || ''}
                  onChange={handleSelect}
                  className={inputCls}
                />
                <span className="self-center text-muted-foreground text-xs font-medium">to</span>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo || ''}
                  onChange={handleSelect}
                  className={inputCls}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
