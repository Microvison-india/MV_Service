import { useState, useEffect } from 'react';
import api from '../../api/axios';
import SCComplaintCard from '../../components/complaint/SCComplaintCard';
import SCComplaintDetail from '../../components/complaint/SCComplaintDetail';

// GRD Section 10.2 — My Complaints tab
// All complaints assigned to this SC — all statuses — with filters

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'going', label: 'Going' },
  { value: 'done', label: 'Done' },
  { value: 'not_done', label: 'Not Done' },
  { value: 'part_pending', label: 'Part Pending' },
  { value: 'part_received', label: 'Part Received' },
  { value: 'rejected_by_sc', label: 'Rejected by Me' },
  { value: 'closed', label: 'Closed' },
];

const PRODUCT_OPTIONS = [
  { value: '', label: 'All Products' },
  { value: 'led', label: 'LED' },
  { value: 'cooler', label: 'Cooler' },
];

const COMPLAINT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'installation', label: 'Installation' },
  { value: 'complaint', label: 'Complaint' },
];

const WARRANTY_OPTIONS = [
  { value: '', label: 'All Warranty' },
  { value: 'in_warranty', label: 'In Warranty' },
  { value: 'out_of_warranty', label: 'Out of Warranty' },
];

const selCls =
  'rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [filters, setFilters] = useState({
    status: 'accepted,going,not_done,part_received',
    product: '',
    complaintType: '',
    warrantyStatus: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    let active = true;
    const fetchComplaints = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filters.status) params.status = filters.status;
        if (filters.product) params.product = filters.product;
        if (filters.complaintType) params.complaintType = filters.complaintType;
        if (filters.warrantyStatus) params.warrantyStatus = filters.warrantyStatus;
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;

        const { data } = await api.get('/api/complaints/my', { params });
        if (active) setComplaints(data.complaints || []);
      } catch {
        if (active) setComplaints([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchComplaints();
    return () => { active = false; };
  }, [filters]);

  // Exposed for detail panel refresh
  const triggerRefresh = () => {
    setFilters({ ...filters }); // simple trick to re-trigger effect
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">My Complaints</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All complaints assigned to your service centre.
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-card border border-border rounded-xl">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className={selCls}
        >
          <option value="accepted,going">Active Jobs</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={filters.product}
          onChange={(e) => handleFilterChange('product', e.target.value)}
          className={selCls}
        >
          {PRODUCT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={filters.complaintType}
          onChange={(e) => handleFilterChange('complaintType', e.target.value)}
          className={selCls}
        >
          {COMPLAINT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={filters.warrantyStatus}
          onChange={(e) => handleFilterChange('warrantyStatus', e.target.value)}
          className={selCls}
        >
          {WARRANTY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          className={selCls}
          title="From date"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          className={selCls}
          title="To date"
        />
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-border">
          <p className="text-4xl mb-3">📂</p>
          <p className="text-foreground font-medium">No complaints found</p>
          <p className="text-sm text-muted-foreground mt-1">Try changing your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <SCComplaintCard
              key={c._id}
              complaint={c}
              mode="my-complaint"
              onOpenDetail={() => setActiveComplaint(c)}
            />
          ))}
        </div>
      )}

      {/* ── Detail Slide Panel ── */}
      {activeComplaint && (
        <SCComplaintDetail
          complaint={activeComplaint}
          onClose={() => setActiveComplaint(null)}
          onUpdated={() => {
            triggerRefresh();
          }}
        />
      )}
    </div>
  );
}
