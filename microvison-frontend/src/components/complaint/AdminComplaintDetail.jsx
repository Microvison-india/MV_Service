import { useState, useEffect } from 'react';
import api from '../../api/axios';
import ExtraChargesList from './ExtraChargesList';
import StatusTimeline from './StatusTimeline';
import PetrolEditField from './PetrolEditField';

// GRD Section 11.1 / TBP Phase 9
// Admin slide-out review panel for a complaint.
// Allows Admin to view SC work, approve extras, confirm/dispute the job, and edit final petrol.

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';
const labelCls = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1';

export default function AdminComplaintDetail({ complaintId, onClose, onUpdated }) {
  const [c, setC] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin action states
  const [disputeNote, setDisputeNote] = useState('');
  const [adminNote, setAdminNote] = useState(''); // For confirm
  const [petrolFinal, setPetrolFinal] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  
  useEffect(() => {
    let active = true;
    const fetchDetail = async () => {
      // Intentionally NOT calling setLoading(true) synchronously here to satisfy React compiler.
      // The initial state of loading is already true.
      try {
        const { data } = await api.get(`/api/complaints/${complaintId}`);
        if (active) {
          setC(data.complaint);
          setUpdates(data.updates);
          if (data.complaint.petrolFinal !== undefined) {
            setPetrolFinal(data.complaint.petrolFinal);
          }
          setError(''); // Cleared asynchronously on success
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Failed to load details.');
      } finally {
        if (active) setLoading(false); // Asynchronous
      }
    };

    fetchDetail();

    return () => {
      active = false;
    };
  }, [complaintId, refreshTick]);

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-background shadow-2xl flex items-center justify-center z-50">
        <p className="text-muted-foreground animate-pulse">Loading details...</p>
      </div>
    );
  }

  if (!c) {
    return null;
  }

  const isInWarranty = c.warrantyStatus === 'in_warranty';
  const PRODUCT_LABELS = { led: 'LED', cooler: 'Cooler', both: 'LED + Cooler' };
  const canConfirmOrDispute = ['done', 'not_done', 'part_pending', 'replacement'].includes(c.status);

  const handleConfirm = async () => {
    setActionLoading('confirm');
    setError('');
    try {
      const body = { note: adminNote };
      if (isInWarranty && !c.petrolLocked && petrolFinal !== '') {
        body.petrolFinal = Number(petrolFinal);
      }

      await api.patch(`/api/complaints/${c._id}/confirm-done`, body);
      setSuccess('Job confirmed and closed successfully!');
      setTimeout(onUpdated, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm job.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeNote.trim()) {
      setError('Please provide a reason for disputing.');
      return;
    }
    setActionLoading('dispute');
    setError('');
    try {
      await api.patch(`/api/complaints/${c._id}/dispute-done`, { note: disputeNote });
      setSuccess('Job disputed and sent back to SC!');
      setTimeout(onUpdated, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispute job.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-background shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-muted-foreground font-mono">{c.complaintId}</p>
            <h2 className="text-lg font-bold text-foreground">Review Job: {c.customerName}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>

        <div className="flex-1 p-6 space-y-8">
          {/* Status & Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase">
              {c.status.replace(/_/g, ' ')}
            </span>
            <span className="bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1 rounded-full">
              {PRODUCT_LABELS[c.product]}
            </span>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${isInWarranty ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
              {isInWarranty ? '✅ In Warranty' : '⚠️ Out of Warranty'}
            </span>
          </div>

          {/* Assigned SC Info */}
          {c.assignedCentreId && (
            <div className="rounded-xl border border-border p-4 bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Service Centre</p>
              <p className="font-semibold">{c.assignedCentreId.businessName}</p>
              <p className="text-sm text-muted-foreground">{c.assignedCentreId.ownerName} · {c.assignedCentreId.phone1}</p>
            </div>
          )}

          {/* Proof Photos & SC Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">SC Submission Details</h3>
            
            {c.scNotes && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">SC Note</p>
                <p className="text-sm text-blue-900">{c.scNotes}</p>
              </div>
            )}

            {!isInWarranty && c.customerPaymentAmount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">Customer Payment Collected</p>
                <p className="text-lg font-bold text-green-900">₹{c.customerPaymentAmount}</p>
              </div>
            )}

            {c.proofPhotos?.length > 0 ? (
              <div>
                <p className={labelCls}>Proof Photos</p>
                <div className="flex gap-3 flex-wrap">
                  {c.proofPhotos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt="" className="w-24 h-24 object-cover rounded-lg border border-border hover:opacity-80 transition" />
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No proof photos uploaded.</p>
            )}
          </div>

          {/* Petrol Review */}
          {isInWarranty && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">Petrol History</h3>
              <PetrolEditField
                petrolAdmin={c.petrolAdmin}
                petrolSC={c.petrolSC}
                petrolFinal={petrolFinal}
                editCount={c.petrolEditCount}
                locked={c.petrolLocked}
                userRole="admin"
                onSave={(val) => setPetrolFinal(val)}
              />
            </div>
          )}

          {/* Extra Charges */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Extra Charges</h3>
            <ExtraChargesList 
              complaintId={c._id} 
              extraCharges={c.extraCharges} 
              onUpdate={() => setRefreshTick(t => t + 1)} 
            />
          </div>

          {/* Status Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Activity Timeline</h3>
            <StatusTimeline updates={updates} />
          </div>

          {/* Admin Confirm / Dispute Actions */}
          {canConfirmOrDispute ? (
            <div className="pt-6 border-t border-border space-y-6">
              <h3 className="font-bold text-lg text-foreground">Admin Decision</h3>
              
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
              {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">{success}</p>}

              <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
                <label className={labelCls}>Confirm & Close Job</label>
                <input
                  type="text"
                  placeholder="Optional confirmation note..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className={inputCls}
                />
                <button
                  onClick={handleConfirm}
                  disabled={!!actionLoading}
                  className="w-full py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {actionLoading === 'confirm' ? 'Confirming...' : '✓ Confirm & Close'}
                </button>
              </div>

              <div className="space-y-3 p-4 bg-red-50/50 rounded-xl border border-red-100">
                <label className="block text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Dispute & Return to SC</label>
                <input
                  type="text"
                  placeholder="Reason for dispute (Required)..."
                  value={disputeNote}
                  onChange={(e) => setDisputeNote(e.target.value)}
                  className={`${inputCls} border-red-200 focus:ring-red-500`}
                />
                <button
                  onClick={handleDispute}
                  disabled={!!actionLoading}
                  className="w-full py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {actionLoading === 'dispute' ? 'Disputing...' : '✕ Dispute Job'}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-6 border-t border-border">
              <div className="bg-muted p-4 rounded-xl text-center">
                <p className="text-sm font-medium text-foreground">Action not available</p>
                <p className="text-xs text-muted-foreground mt-1">This complaint is in '{c.status.replace(/_/g, ' ')}' status.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
