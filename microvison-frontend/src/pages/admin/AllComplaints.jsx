import { useState } from 'react';
import useComplaints from '../../hooks/useComplaints';
import ComplaintFilters from '../../components/filters/ComplaintFilters';
import AdminComplaintDetail from '../../components/complaint/AdminComplaintDetail';

const STATUS_BADGE_STYLES = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  unassigned: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  assigned: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  accepted: 'bg-purple-100 text-purple-800 border-purple-200',
  rejected_by_sc: 'bg-red-100 text-red-800 border-red-200',
  going: 'bg-pink-100 text-pink-800 border-pink-200',
  done: 'bg-green-100 text-green-800 border-green-200',
  not_done: 'bg-red-100 text-red-800 border-red-200',
  part_pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reopened: 'bg-amber-100 text-amber-800 border-amber-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
};

const PRODUCT_LABELS = {
  led: 'LED',
  cooler: 'Cooler',
  both: 'LED + Cooler',
};

export default function AllComplaints() {
  const [filters, setFilters] = useState({
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
    page: 1,
    limit: 10,
  });

  const { complaints, loading, error, pagination, refresh } = useComplaints(filters);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Complaints Portal</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {pagination.total} total complaints in system
            </p>
          </div>
        </div>

        {/* Search & Filter Panel */}
        <ComplaintFilters filters={filters} onChange={handleFilterChange} />

        {/* Error State */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        {/* Complaints Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-foreground">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Complaint ID</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Warranty</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Assigned SC</th>
                  <th className="px-4 py-3 font-semibold">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  // Skeleton rows
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-border">
                      {Array.from({ length: 9 }).map((_, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-3">
                          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center text-muted-foreground">
                      No complaints found matching your filters.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr
                      key={c._id}
                      onClick={() => setSelectedComplaintId(c._id)}
                      className="border-b border-border hover:bg-muted/40 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-muted-foreground">
                        {c.complaintId}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {c.customerName}
                      </td>
                      <td className="px-4 py-3">
                        <span>{c.city}</span>
                        <span className="text-muted-foreground text-xs">, {c.district}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">
                        {PRODUCT_LABELS[c.product] || c.product}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {c.complaintType}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                            c.warrantyStatus === 'in_warranty'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}
                        >
                          {c.warrantyStatus === 'in_warranty' ? 'In Warranty' : 'Out Warranty'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                            STATUS_BADGE_STYLES[c.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {c.assignedCentreId?.businessName || (
                          <span className="text-red-500 font-semibold italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
              <p className="text-sm text-muted-foreground">
                Showing page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Review Panel */}
      {selectedComplaintId && (
        <AdminComplaintDetail
          complaintId={selectedComplaintId}
          onClose={() => setSelectedComplaintId(null)}
          onUpdated={() => {
            setSelectedComplaintId(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
