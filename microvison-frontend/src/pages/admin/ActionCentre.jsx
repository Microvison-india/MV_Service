import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import AdminComplaintDetail from '../../components/complaint/AdminComplaintDetail';

// GRD Section 11.1 — Action Centre
// Tab 1 of the Admin Dashboard. Shows items requiring admin attention, ordered newest first.

export default function ActionCentre() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // SC Registration Actions
  const [actionLoading, setActionLoading] = useState({});
  const [messages, setMessages] = useState({});
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');

  // Slide Panel State
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchActionItems = async () => {
      // Intentionally NOT calling setLoading(true) synchronously here to satisfy React compiler.
      // The initial state of loading is already true.
      try {
        const res = await api.get('/api/complaints/action-items');
        if (active) setData(res.data);
      } catch (err) {
        console.error('Failed to load action items', err);
      } finally {
        if (active) setLoading(false); // Asynchronous
      }
    };

    fetchActionItems();

    return () => {
      active = false;
    };
  }, []);

  const performSCAction = async (id, action) => {
    setActionLoading((prev) => ({ ...prev, [id]: action }));
    setMessages((prev) => ({ ...prev, [id]: '' }));
    try {
      const res = await api.patch(`/api/service-centres/${id}/${action}`);
      setMessages((prev) => ({ ...prev, [id]: res.data.message }));
      // Optimistically remove from list
      setData((prev) => ({
        ...prev,
        pendingSCRegistrations: prev.pendingSCRegistrations.filter((sc) => sc._id !== id),
        counts: {
          ...prev.counts,
          pendingSCRegistrations: prev.counts.pendingSCRegistrations - 1,
        }
      }));
    } catch (err) {
      setMessages((prev) => ({
        ...prev,
        [id]: err.response?.data?.message || `Failed to ${action}.`,
      }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const CAPABILITY_LABELS = {
    led_only: 'LED Only',
    cooler_only: 'Cooler Only',
    both: 'LED + Cooler',
  };

  const renderComplaintCard = (c) => (
    <div
      key={c._id}
      onClick={() => setSelectedComplaintId(c._id)}
      className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-primary/50 transition"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-muted-foreground">{c.complaintId}</span>
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            {c.status.replace(/_/g, ' ')}
          </span>
        </div>
        <p className="font-semibold text-foreground text-sm">{c.customerName} · {c.city}</p>
        <p className="text-xs text-muted-foreground mt-1">
          SC: <span className="font-medium text-foreground">{c.assignedCentreId?.businessName || 'Unassigned'}</span>
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">
          {new Date(c.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
        <button className="text-xs font-semibold text-primary mt-2">Review &rarr;</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Action Centre</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Items requiring your attention, ordered newest first.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/new-complaint')}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition shrink-0"
          >
            + New Complaint
          </button>
        </div>

        {successMessage && (
          <div className="mb-5 rounded-xl bg-green-50 border border-green-300 px-4 py-3 text-sm text-green-800 font-medium flex items-center justify-between">
            <span>✓ {successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800 font-bold ml-4">✕</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-24 bg-muted rounded-xl animate-pulse" />
            <div className="h-24 bg-muted rounded-xl animate-pulse" />
          </div>
        ) : !data ? (
          <div className="bg-card border border-border rounded-xl px-6 py-10 text-center text-muted-foreground">
            Failed to load data.
          </div>
        ) : (
          <div className="space-y-10">
            {/* 1. SC Registrations */}
            {data.pendingSCRegistrations.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-base font-semibold text-foreground">Pending SC Registrations</h2>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500 text-white text-xs font-bold">
                    {data.counts.pendingSCRegistrations}
                  </span>
                </div>
                <div className="space-y-3">
                  {data.pendingSCRegistrations.map((sc) => (
                    <div key={sc._id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="cursor-pointer flex-1" onClick={() => navigate(`/admin/service-centres/${sc._id}`)}>
                        <p className="font-semibold text-foreground">{sc.businessName}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{sc.ownerName} · {sc.city}, {sc.district}</p>
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span>📞 {sc.phone1}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                            {CAPABILITY_LABELS[sc.productCapability]}
                          </span>
                        </div>
                        {messages[sc._id] && <p className="text-xs text-green-700 mt-1">{messages[sc._id]}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          disabled={!!actionLoading[sc._id]}
                          onClick={() => performSCAction(sc._id, 'approve')}
                          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          {actionLoading[sc._id] === 'approve' ? '...' : '✓ Approve'}
                        </button>
                        <button
                          disabled={!!actionLoading[sc._id]}
                          onClick={() => performSCAction(sc._id, 'reject')}
                          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          {actionLoading[sc._id] === 'reject' ? '...' : '✕ Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 2. Extra Charge Approvals */}
            {data.pendingExtraApprovals.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-base font-semibold text-foreground">Extra Charge Requests</h2>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">
                    {data.counts.pendingExtraApprovals}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {data.pendingExtraApprovals.map(renderComplaintCard)}
                </div>
              </section>
            )}

            {/* 3. Pending Confirmations */}
            {data.pendingConfirmations.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-base font-semibold text-foreground">Jobs Ready for Confirmation</h2>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold">
                    {data.counts.pendingConfirmations}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {data.pendingConfirmations.map(renderComplaintCard)}
                </div>
              </section>
            )}

            {/* Pending Part Sourcing / Deliveries */}
            {data.partPendingComplaints && data.partPendingComplaints.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-base font-semibold text-foreground">Pending Part Sourcing & Deliveries</h2>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold">
                    {data.counts.partPendingComplaints}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {data.partPendingComplaints.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => setSelectedComplaintId(c._id)}
                      className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between gap-3 cursor-pointer hover:border-orange-500/50 transition relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full pointer-events-none transition-colors group-hover:bg-orange-500/10" />
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-mono text-muted-foreground">{c.complaintId}</span>
                          <span className="bg-orange-100 text-orange-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Part Pending
                          </span>
                        </div>
                        <p className="font-semibold text-foreground text-sm">{c.customerName} · {c.city}</p>
                        
                        {c.partDetails && (
                          <div className="mt-2 text-xs bg-orange-50/50 border border-orange-100/60 p-2 rounded-lg text-orange-950 font-medium">
                            <span className="text-[10px] text-orange-800 uppercase block font-bold tracking-wide">Requested Part:</span>
                            {c.partDetails}
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          SC: <span className="font-medium text-foreground">{c.assignedCentreId?.businessName || 'Unassigned'}</span>
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-border mt-1">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Updated: {new Date(c.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-xs font-bold text-orange-600 group-hover:text-orange-700 transition flex items-center gap-1">
                          Source & Dispatch &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Rejected by SC */}
            {data.rejectedBySC.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-base font-semibold text-foreground">Rejected by Service Centre</h2>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                    {data.counts.rejectedBySC}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {data.rejectedBySC.map(renderComplaintCard)}
                </div>
              </section>
            )}

            {/* Empty State if absolutely nothing requires attention */}
            {data.counts.pendingSCRegistrations === 0 &&
             data.counts.pendingConfirmations === 0 &&
             data.counts.rejectedBySC === 0 &&
             data.counts.pendingExtraApprovals === 0 &&
             (!data.counts.partPendingComplaints || data.counts.partPendingComplaints === 0) && (
              <div className="bg-card border border-border rounded-xl px-6 py-12 text-center">
                <span className="text-4xl">🎉</span>
                <h3 className="text-lg font-bold text-foreground mt-4">Inbox Zero!</h3>
                <p className="text-muted-foreground mt-1">No action items require your attention right now.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide Panel */}
      {selectedComplaintId && (
        <AdminComplaintDetail
          complaintId={selectedComplaintId}
          onClose={() => setSelectedComplaintId(null)}
          onUpdated={() => {
            setSelectedComplaintId(null);
            // Quick window reload is the easiest way to refresh all action centre lists 
            // after closing the panel, avoiding complex prop drilling of fetchActionItems
            window.location.reload(); 
          }}
        />
      )}
    </div>
  );
}
