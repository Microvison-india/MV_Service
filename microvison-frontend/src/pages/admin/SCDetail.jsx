import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { X } from 'lucide-react';
import useComplaints from '../../hooks/useComplaints';
import AdminComplaintDetail from '../../components/complaint/AdminComplaintDetail';
import Pagination from '../../components/ui/Pagination';

const CAPABILITY_LABELS = {
  led_only: 'LED Only',
  cooler_only: 'Cooler Only',
  both: 'LED + Cooler',
};

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

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  inactive: 'bg-gray-100 text-gray-600',
};

export default function SCDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sc, setSc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('info');

  // Unregistered link flow states
  const [unregisteredSCs, setUnregisteredSCs] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedUnregSCId, setSelectedUnregSCId] = useState('');
  const [linkSearch, setLinkSearch] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkingLoading, setLinkingLoading] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Complaints history state
  const [complaintFilters, setComplaintFilters] = useState({
    assignedCentreId: id,
    page: 1,
    limit: 10,
  });

  const { complaints, loading: complaintsLoading, error: complaintsError, pagination, refresh: refreshComplaints } = useComplaints(complaintFilters);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  // Sync filters when ID parameter changes
  useEffect(() => {
    setComplaintFilters((prev) => ({
      ...prev,
      assignedCentreId: id,
      page: 1,
    }));
  }, [id]);

  useEffect(() => {
    let active = true;
    const fetchSC = async () => {
      setError('');
      try {
        const { data } = await api.get(`/api/service-centres/${id}`);
        if (active) {
          setSc(data);
          setEditData({
            ownerName: data.ownerName,
            businessName: data.businessName,
            phone1: data.phone1,
            phone2: data.phone2,
            email2: data.email2,
            fullAddress: data.fullAddress,
            city: data.city,
            district: data.district,
            state: data.state,
            productCapability: data.productCapability,
          });
        }
      } catch {
        if (active) setError('Failed to load service centre details.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSC();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    const fetchUnreg = async () => {
      try {
        const { data } = await api.get('/api/service-centres?isUnregistered=true&limit=1000');
        if (active) setUnregisteredSCs(data.serviceCentres || []);
      } catch {
        // fail silently
      }
    };
    fetchUnreg();
    return () => { active = false; };
  }, []);

  const performAction = async (action) => {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.patch(`/api/service-centres/${id}/${action}`);
      setSc(data.sc);
      setSuccessMsg(data.message);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} service centre.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkConfirm = async () => {
    if (!selectedUnregSCId || !sc) return;
    setLinkingLoading(true);
    setLinkError('');
    try {
      const newSCId = sc._id;
      // 1. Approve
      await api.patch(`/api/service-centres/${newSCId}/approve`);
      // 2. Link
      await api.patch(`/api/service-centres/${newSCId}/link-to-registered`, {
        unregisteredSCId: selectedUnregSCId
      });

      setSuccessMsg('Successfully approved registration and linked to existing unregistered SC.');
      setShowLinkModal(false);
      
      // Reload page to reflect updated active status/details
      window.location.reload();
    } catch (err) {
      setLinkError(err.response?.data?.message || 'Failed to link service centres.');
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.put(`/api/service-centres/${id}`, editData);
      setSc(data.sc);
      setSuccessMsg('Details updated successfully.');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update details.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !sc) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button onClick={() => navigate('/admin/service-centres')} className="text-primary underline text-sm">
            Back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          id="sc-back-btn"
          onClick={() => navigate('/admin/service-centres')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-5"
        >
          ← Back to Service Centres
        </button>

        {/* Header Card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{sc.businessName}</h1>
              <p className="text-muted-foreground text-sm mt-1">{sc.ownerName} · {sc.city}, {sc.district}, {sc.state}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[sc.status]}`}>
                  {sc.status}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {CAPABILITY_LABELS[sc.productCapability]}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {sc.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUnregSCId('');
                      setLinkSearch('');
                      setLinkError('');
                      setShowLinkModal(true);
                    }}
                    className="px-3.5 py-2 rounded-lg border border-border text-foreground hover:bg-muted text-sm font-semibold transition flex items-center gap-1.5"
                  >
                    🔗 Link Unregistered
                  </button>
                  <button
                    id="sc-approve-btn"
                    disabled={actionLoading}
                    onClick={() => performAction('approve')}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {actionLoading ? 'Processing...' : '✓ Approve'}
                  </button>
                  <button
                    id="sc-reject-btn"
                    disabled={actionLoading}
                    onClick={() => performAction('reject')}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {actionLoading ? 'Processing...' : '✕ Reject'}
                  </button>
                </>
              )}
              {sc.status === 'active' && (
                <button
                  id="sc-deactivate-btn"
                  disabled={actionLoading}
                  onClick={() => performAction('deactivate')}
                  className="px-4 py-2 rounded-lg bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 transition"
                >
                  {actionLoading ? 'Processing...' : 'Deactivate'}
                </button>
              )}
              {sc.status === 'rejected' && (
                <button
                  id="sc-reapprove-btn"
                  disabled={actionLoading}
                  onClick={() => performAction('approve')}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {actionLoading ? 'Processing...' : 'Re-Approve'}
                </button>
              )}
              {!isEditing && (
                <button
                  id="sc-edit-btn"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition"
                >
                  Edit Details
                </button>
              )}
            </div>
          </div>

          {/* Success / Error messages */}
          {successMsg && (
            <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
              {successMsg}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-5">
          {['info', 'complaints'].map((tab) => (
            <button
              key={tab}
              id={`sc-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium capitalize transition border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'complaints' ? 'Complaints' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="bg-card border border-border rounded-xl p-6">
            {isEditing ? (
              // ---- EDIT FORM ----
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-foreground mb-4">Edit Service Centre Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Owner Name', key: 'ownerName' },
                    { label: 'Business Name', key: 'businessName' },
                    { label: 'Phone 1', key: 'phone1' },
                    { label: 'Phone 2', key: 'phone2' },
                    { label: 'Email 2 (CC)', key: 'email2' },
                    { label: 'City', key: 'city' },
                    { label: 'District', key: 'district' },
                    { label: 'State', key: 'state' },
                  ].map(({ label, key }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-sm font-medium text-foreground">{label}</label>
                      <input
                        id={`sc-edit-${key}`}
                        type="text"
                        value={editData[key] || ''}
                        onChange={(e) => setEditData((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                      />
                    </div>
                  ))}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">Full Address</label>
                    <input
                      id="sc-edit-fullAddress"
                      type="text"
                      value={editData.fullAddress || ''}
                      onChange={(e) => setEditData((prev) => ({ ...prev, fullAddress: e.target.value }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Product Capability</label>
                    <select
                      id="sc-edit-capability"
                      value={editData.productCapability || ''}
                      onChange={(e) => setEditData((prev) => ({ ...prev, productCapability: e.target.value }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                    >
                      <option value="led_only">LED Only</option>
                      <option value="cooler_only">Cooler Only</option>
                      <option value="both">Both (LED + Cooler)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    id="sc-save-edit-btn"
                    disabled={actionLoading}
                    onClick={handleSaveEdit}
                    className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    id="sc-cancel-edit-btn"
                    onClick={() => { setIsEditing(false); setError(''); }}
                    className="px-5 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // ---- READ-ONLY INFO ----
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: 'Owner / Contact Name', value: sc.ownerName },
                  { label: 'Business Name', value: sc.businessName },
                  { label: 'Phone 1 (Primary)', value: sc.phone1 },
                  { label: 'Phone 2', value: sc.phone2 || '—' },
                  { label: 'Login Email', value: sc.email1 },
                  { label: 'CC Email', value: sc.email2 || '—' },
                  { label: 'City', value: sc.city },
                  { label: 'District', value: sc.district },
                  { label: 'State', value: sc.state },
                  { label: 'Product Capability', value: CAPABILITY_LABELS[sc.productCapability] },
                  { label: 'Full Address', value: sc.fullAddress },
                  { label: 'Registered On', value: new Date(sc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm text-foreground break-words">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {complaintsError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {complaintsError}
              </div>
            )}

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
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
                      <th className="px-4 py-3 font-semibold">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {complaintsLoading ? (
                      // Skeleton rows
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="border-b border-border">
                          {Array.from({ length: 8 }).map((_, cellIdx) => (
                            <td key={cellIdx} className="px-4 py-3">
                              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : complaints.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-12 text-center text-muted-foreground">
                          No complaints assigned to this service centre.
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
                          <td className="px-4 py-3 text-xs font-medium uppercase">
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

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-border">
                {complaintsLoading ? (
                  // Mobile skeleton card
                  Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="p-4 space-y-3 bg-card">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                        <div className="h-5 bg-muted rounded animate-pulse w-1/4" />
                      </div>
                      <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                      <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                    </div>
                  ))
                ) : complaints.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground bg-card">
                    No complaints assigned to this service centre.
                  </div>
                ) : (
                  complaints.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => setSelectedComplaintId(c._id)}
                      className="p-4 hover:bg-muted/30 cursor-pointer transition bg-card flex flex-col gap-2.5"
                    >
                      {/* Top Row: ID & Status */}
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-mono text-xs font-bold text-muted-foreground bg-muted/65 px-2 py-0.5 rounded border border-border/40">
                          {c.complaintId}
                        </span>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                            STATUS_BADGE_STYLES[c.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Customer & Location */}
                      <div>
                        <h3 className="font-bold text-foreground text-sm leading-tight">{c.customerName}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          📍 {c.city}, {c.district}
                        </p>
                      </div>

                      {/* Product & Warranty */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-medium uppercase">
                          {PRODUCT_LABELS[c.product] || c.product}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="capitalize">{c.complaintType}</span>
                        <span className="text-muted-foreground">•</span>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${
                            c.warrantyStatus === 'in_warranty'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}
                        >
                          {c.warrantyStatus === 'in_warranty' ? 'In Warranty' : 'Out Warranty'}
                        </span>
                      </div>

                      {/* Date Row */}
                      <div className="flex justify-end text-xs border-t border-border/30 pt-2 mt-0.5">
                        <div className="text-muted-foreground font-medium text-[10px]">
                          {new Date(c.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination Controls */}
              {!complaintsLoading && pagination && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  limit={pagination.limit || complaintFilters.limit}
                  onPageChange={(newPage) => setComplaintFilters((prev) => ({ ...prev, page: newPage }))}
                  onLimitChange={(newLimit) => setComplaintFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }))}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Link to Unregistered SC Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 border border-border shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowLinkModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold mb-1 text-foreground">Link to Unregistered SC</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Select the unregistered service centre record to merge with this new registration. All past complaints will be migrated.
            </p>

            <div className="space-y-4">
              {/* Search unregistered SCs */}
              <div>
                <label className="text-xs font-semibold block mb-1 text-foreground">Search Unregistered SCs</label>
                <input
                  type="text"
                  placeholder="Search by name, phone, city..."
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                />
              </div>

              {/* Candidates List */}
              <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-2 bg-muted/10">
                {unregisteredSCs
                  .filter((unreg) => {
                    const s = linkSearch.toLowerCase();
                    return (
                      unreg.businessName.toLowerCase().includes(s) ||
                      unreg.phone1.includes(s) ||
                      (unreg.city && unreg.city.toLowerCase().includes(s)) ||
                      (unreg.district && unreg.district.toLowerCase().includes(s))
                    );
                  })
                  .map((unreg) => {
                    const isSelected = selectedUnregSCId === unreg._id;
                    return (
                      <div
                        key={unreg._id}
                        onClick={() => setSelectedUnregSCId(unreg._id)}
                        className={`p-3 rounded-lg border cursor-pointer transition ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:border-ring'
                        }`}
                      >
                        <p className="font-semibold text-sm text-foreground">{unreg.businessName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {unreg.city}, {unreg.district} · Phone: {unreg.phone1}
                        </p>
                      </div>
                    );
                  })}
              </div>

              {linkError && <p className="text-xs text-destructive">{linkError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={linkingLoading || !selectedUnregSCId}
                  onClick={handleLinkConfirm}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/95 disabled:opacity-50 transition"
                >
                  {linkingLoading ? 'Linking...' : 'Confirm & Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Review Panel */}
      {selectedComplaintId && (
        <AdminComplaintDetail
          complaintId={selectedComplaintId}
          onClose={() => setSelectedComplaintId(null)}
          onUpdated={() => {
            setSelectedComplaintId(null);
            refreshComplaints();
          }}
        />
      )}
    </div>
  );
}
