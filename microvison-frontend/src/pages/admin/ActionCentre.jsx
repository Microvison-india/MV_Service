import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

// GRD Section 11.1 — Action Centre
// Tab 1 of the Admin Dashboard. Shows items requiring admin attention, ordered newest first.
// Currently (Phase 5): shows pending SC registrations.
// Phase 7+ will add: complaints done/not-done/rejected-by-sc + extra charge requests.

export default function ActionCentre() {
  const navigate = useNavigate();
  const [pendingSCs, setPendingSCs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [messages, setMessages] = useState({});

  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/service-centres/pending');
      setPendingSCs(data);
    } catch (err) {
      console.error('Failed to load pending SCs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const performAction = async (id, action) => {
    setActionLoading((prev) => ({ ...prev, [id]: action }));
    setMessages((prev) => ({ ...prev, [id]: '' }));
    try {
      const { data } = await api.patch(`/api/service-centres/${id}/${action}`);
      setMessages((prev) => ({ ...prev, [id]: data.message }));
      // Remove from pending list after action
      setPendingSCs((prev) => prev.filter((sc) => sc._id !== id));
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Action Centre</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Items requiring your attention, ordered newest first.
          </p>
        </div>

        {/* Pending SC Registrations */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-foreground">Pending Registrations</h2>
            {!loading && pendingSCs.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500 text-white text-xs font-bold">
                {pendingSCs.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : pendingSCs.length === 0 ? (
            <div className="bg-card border border-border rounded-xl px-6 py-10 text-center">
              <p className="text-muted-foreground text-sm">No pending registrations. All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSCs.map((sc) => (
                <div
                  key={sc._id}
                  className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div
                    className="cursor-pointer flex-1"
                    onClick={() => navigate(`/admin/service-centres/${sc._id}`)}
                  >
                    <p className="font-semibold text-foreground">{sc.businessName}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {sc.ownerName} · {sc.city}, {sc.district}, {sc.state}
                    </p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>📞 {sc.phone1}</span>
                      <span>✉ {sc.email1}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {CAPABILITY_LABELS[sc.productCapability]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Registered: {new Date(sc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {messages[sc._id] && (
                      <p className="text-xs text-green-700 mt-1">{messages[sc._id]}</p>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      id={`action-approve-${sc._id}`}
                      disabled={!!actionLoading[sc._id]}
                      onClick={() => performAction(sc._id, 'approve')}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      {actionLoading[sc._id] === 'approve' ? '...' : '✓ Approve'}
                    </button>
                    <button
                      id={`action-reject-${sc._id}`}
                      disabled={!!actionLoading[sc._id]}
                      onClick={() => performAction(sc._id, 'reject')}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      {actionLoading[sc._id] === 'reject' ? '...' : '✕ Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Phase 7+ placeholder sections */}
        <section className="mt-8">
          <h2 className="text-base font-semibold text-foreground mb-4">Complaints Needing Review</h2>
          <div className="bg-card border border-border rounded-xl px-6 py-10 text-center">
            <p className="text-muted-foreground text-sm">
              Complaint actions (done review, rejected-by-SC reassignment, extra charge requests) will appear here once Phase 7 is complete.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
