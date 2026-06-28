import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import SCFilters from '../../components/filters/SCFilters';
import Pagination from '../../components/ui/Pagination';

const CAPABILITY_LABELS = {
  led_only: 'LED Only',
  cooler_only: 'Cooler Only',
  both: 'LED + Cooler',
};

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  inactive: 'bg-gray-100 text-gray-600',
};

export default function ServiceCentres() {
  const navigate = useNavigate();
  const [serviceCentres, setServiceCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 20 });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    state: '',
    district: '',
    productCapability: '',
    isUnregistered: '',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    let active = true;
    const fetchSCs = async () => {
      setError('');
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) params.append(k, v); });
        const { data } = await api.get(`/api/service-centres?${params.toString()}`);
        if (active) {
          setServiceCentres(data.serviceCentres);
          setPagination({ total: data.total, page: data.page, totalPages: data.totalPages, limit: data.limit || 20 });
        }
      } catch {
        if (active) setError('Failed to load service centres. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSCs();
    return () => { active = false; };
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Service Centres</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination.total} total service centres registered
          </p>
        </div>

        {/* Filters */}
        <SCFilters filters={filters} onChange={handleFilterChange} />

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-4">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Business Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Owner</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">City / District</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Capability</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registered</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Loading skeleton rows
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : serviceCentres.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No service centres found matching your filters.
                    </td>
                  </tr>
                ) : (
                  serviceCentres.map((sc) => (
                    <tr
                      key={sc._id}
                      onClick={() => navigate(`/admin/service-centres/${sc._id}`)}
                      className="border-b border-border hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{sc.businessName}</span>
                          {sc.isUnregistered && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              UNREGISTERED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">{sc.ownerName || 'Admin Maintained'}</td>
                      <td className="px-4 py-3 text-foreground">
                        <span>{sc.city}</span>
                        <span className="text-muted-foreground">, {sc.district}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {sc.isUnregistered ? 'LED + Cooler' : (CAPABILITY_LABELS[sc.productCapability] || sc.productCapability)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[sc.status] || 'bg-gray-100 text-gray-600'}`}>
                          {sc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(sc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              limit={pagination.limit || filters.limit}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
