import { useState } from 'react';
import api from '../../api/axios';


// GRD Section 10.1 — The complaint card used in New Requests AND My Complaints
// mode = 'new-request' → shows Accept/Reject buttons
// mode = 'my-complaint' → shows "Open Details" button

const STATUS_COLORS = {
  assigned: 'bg-blue-100 text-blue-800',
  accepted: 'bg-indigo-100 text-indigo-800',
  going: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-800',
  not_done: 'bg-red-100 text-red-800',
  part_pending: 'bg-orange-100 text-orange-800',
  part_received: 'bg-teal-100 text-teal-800',
  rejected_by_sc: 'bg-gray-100 text-gray-800',
  closed: 'bg-gray-200 text-gray-700',
};

const PRODUCT_LABELS = { led: 'LED', cooler: 'Cooler', both: 'LED + Cooler' };

export default function SCComplaintCard({ complaint: c, mode, onAction, onOpenDetail }) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acting, setActing] = useState(false);

  const handleAccept = async () => {
    setActing(true);
    await onAction(c._id, 'accept');
    setActing(false);
    setShowAcceptModal(false);
  };

  const handleReject = async () => {
    setActing(true);
    await onAction(c._id, 'reject', rejectNote);
    setActing(false);
    setShowRejectModal(false);
  };

  const statusKey = c.status;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1">{c.complaintId}</p>
          <p className="font-semibold text-foreground text-base">{c.customerName}</p>
          <p className="text-sm text-muted-foreground">
            {c.localAddress}, {c.city}, {c.district}
          </p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[statusKey] || 'bg-gray-100 text-gray-700'}`}>
          {statusKey.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>

      {/* ── Tags row ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full">
          {PRODUCT_LABELS[c.product] || c.product}
        </span>
        <span className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full capitalize">
          {c.complaintType}
        </span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          c.warrantyStatus === 'in_warranty'
            ? 'bg-green-100 text-green-800'
            : 'bg-orange-100 text-orange-800'
        }`}>
          {c.warrantyStatus === 'in_warranty' ? '✅ In Warranty' : '⚠️ Out of Warranty'}
        </span>
      </div>

      {/* ── Preset info (in-warranty only) ── */}
      {c.warrantyStatus === 'in_warranty' && c.presetName && (
        <div className="bg-muted/50 rounded-lg px-4 py-3 mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Pricing</p>
          <p className="text-sm font-medium text-foreground">
            {c.presetName} — <span className="font-bold">₹{c.presetPrice}</span>
            {c.petrolAdmin != null && (
              <span className="text-muted-foreground"> + ₹{c.petrolAdmin} petrol est.</span>
            )}
          </p>
        </div>
      )}

      {/* ── Admin notes ── */}
      {c.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">Admin Note</p>
          <p className="text-sm text-yellow-900">{c.notes}</p>
        </div>
      )}

      {/* ── Voice note ── */}
      {c.voiceNoteUrl && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Voice Note</p>
          <audio src={c.voiceNoteUrl} controls className="w-full rounded-lg" />
        </div>
      )}

      {/* ── Admin photos ── */}
      {c.adminPhotos?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Admin Photos</p>
          <div className="flex gap-3 flex-wrap">
            {c.adminPhotos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt={`Admin photo ${i + 1}`}
                  className="w-24 h-24 object-cover rounded-lg border border-border hover:opacity-80 transition"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      {mode === 'new-request' && (
        <div className="flex gap-3 pt-2 border-t border-border mt-2">
          <button
            id={`accept-btn-${c._id}`}
            onClick={() => setShowAcceptModal(true)}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
          >
            ✓ Accept
          </button>
          <button
            id={`reject-btn-${c._id}`}
            onClick={() => setShowRejectModal(true)}
            className="flex-1 py-2.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition"
          >
            ✕ Reject
          </button>
        </div>
      )}

      {mode === 'my-complaint' && (
        <div className="pt-2 border-t border-border mt-2">
          <button
            onClick={onOpenDetail}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition"
          >
            Open Details →
          </button>
        </div>
      )}

      {/* ── Accept Confirm Modal ── */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-border">
            <p className="text-lg font-bold text-foreground mb-2">Accept Complaint?</p>
            <p className="text-sm text-muted-foreground mb-6">
              You are accepting <strong>{c.complaintId}</strong> for <strong>{c.customerName}</strong>.
              You will be responsible for completing this job.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAcceptModal(false)}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={acting}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition"
              >
                {acting ? 'Accepting...' : 'Yes, Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-border">
            <p className="text-lg font-bold text-foreground mb-2">Reject Complaint?</p>
            <p className="text-sm text-muted-foreground mb-4">
              This will send the complaint back to the admin for reassignment. Optionally tell them why.
            </p>
            <textarea
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={acting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
              >
                {acting ? 'Rejecting...' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
