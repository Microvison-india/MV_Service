import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

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

export default function SCDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sc, setSc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [refreshTick, setRefreshTick] = useState(0);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

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
  }, [id, refreshTick]);

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
              {tab === 'complaints' ? 'Complaints (Phase 7)' : tab}
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
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground text-sm">
              Complaint history for this service centre will be shown here once Phase 7 is complete.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
