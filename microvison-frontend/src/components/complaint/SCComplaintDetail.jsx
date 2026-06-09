import { useState } from 'react';
import api from '../../api/axios';
import ImageUploader from '../forms/ImageUploader';
import PetrolEditField from './PetrolEditField';

// GRD Section 10.2 — SC Complaint Detail slide panel
// Opened from MyComplaints when SC clicks "Open Details"
// SC can: mark going, upload proof, submit final status, adjust petrol, request extra charge, add notes

const FINAL_STATUS_OPTIONS = [
  { value: 'done', label: '✅ Done — Work Completed' },
  { value: 'not_done', label: '❌ Not Done — Could Not Complete' },
  { value: 'part_pending', label: '⚙️ Part Pending — Follow-up Needed' },
  { value: 'replacement', label: '🔄 Replacement — Product Needs Replacing' },
];

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';
const labelCls = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1';

export default function SCComplaintDetail({ complaint: initial, onClose, onUpdated }) {
  const [c, setC] = useState(initial);
  const [proofPhotos, setProofPhotos] = useState(c.proofPhotos || []);
  const [scNotes, setScNotes] = useState(c.scNotes || '');
  const [finalStatus, setFinalStatus] = useState('done');
  const [petrolSC, setPetrolSC] = useState('');
  const [extraLabel, setExtraLabel] = useState('');
  const [extraAmount, setExtraAmount] = useState('');
  const [customerPayment, setCustomerPayment] = useState(c.customerPaymentAmount || '');
  const [submitting, setSubmitting] = useState(false);
  const [markingGoing, setMarkingGoing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isInWarranty = c.warrantyStatus === 'in_warranty';
  const canMarkGoing = c.status === 'accepted';
  const canSubmitFinal = ['accepted', 'going'].includes(c.status);
  const alreadyFinished = ['done', 'not_done', 'part_pending', 'replacement', 'closed'].includes(c.status);

  const PRODUCT_LABELS = { led: 'LED', cooler: 'Cooler', both: 'LED + Cooler' };

  const handleMarkGoing = async () => {
    setMarkingGoing(true);
    setError('');
    try {
      const { data } = await api.patch(`/api/complaints/${c._id}/going`);
      setC(data.complaint);
      setSuccess('Status updated to Going! 🚗');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update status.');
    } finally {
      setMarkingGoing(false);
    }
  };

  const handleSubmitFinal = async () => {
    setError('');
    if (finalStatus === 'done' && proofPhotos.length === 0) {
      setError('Please upload at least one proof photo before marking as done.');
      return;
    }
    if (finalStatus === 'done' && c.warrantyStatus === 'out_of_warranty' && !customerPayment) {
      setError('Please enter the amount collected from the customer.');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        newStatus: finalStatus,
        proofPhotos,
        scNotes,
        customerPaymentAmount: c.warrantyStatus === 'out_of_warranty' ? Number(customerPayment) : undefined,
      };

      // Petrol SC edit (only if in-warranty and it's SC's turn)
      if (isInWarranty && c.petrolEditCount === 1 && petrolSC) {
        body.petrolSC = Number(petrolSC);
      }

      // Extra charge request
      if (extraLabel.trim() && extraAmount) {
        body.extraChargeRequest = { label: extraLabel.trim(), amount: Number(extraAmount) };
      }

      const { data } = await api.patch(`/api/complaints/${c._id}/status`, body);
      setC(data.complaint);
      setSuccess(`Complaint marked as "${finalStatus.replace(/_/g, ' ')}" successfully!`);
      setTimeout(onUpdated, 1200);
    } catch (err) {
      setError(err?.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Slide panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-background shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-muted-foreground font-mono">{c.complaintId}</p>
            <h2 className="text-lg font-bold text-foreground">{c.customerName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground text-xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* ── Status & tags ── */}
          <div className="flex flex-wrap gap-2">
            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase">
              {c.status.replace(/_/g, ' ')}
            </span>
            <span className="bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1 rounded-full">
              {PRODUCT_LABELS[c.product]}
            </span>
            <span className="bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1 rounded-full capitalize">
              {c.complaintType}
            </span>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${isInWarranty ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
              {isInWarranty ? '✅ In Warranty' : '⚠️ Out of Warranty'}
            </span>
          </div>

          {/* ── Customer info ── */}
          <div className="rounded-xl border border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Customer</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Phone 1</p>
                <p className="font-medium">{c.phone1}</p>
              </div>
              {c.phone2 && (
                <div>
                  <p className="text-muted-foreground text-xs">Phone 2</p>
                  <p className="font-medium">{c.phone2}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">Address</p>
                <p className="font-medium">{c.localAddress}, {c.city}, {c.district}, {c.state}</p>
              </div>
            </div>
          </div>

          {/* ── Pricing (in-warranty) ── */}
          {isInWarranty && (
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pricing</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Preset</p>
                  <p className="font-medium">{c.presetName || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Preset Price</p>
                  <p className="font-bold text-lg">₹{c.presetPrice ?? '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Admin notes & media ── */}
          {c.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">Admin Note</p>
              <p className="text-sm text-yellow-900">{c.notes}</p>
            </div>
          )}
          {c.voiceNoteUrl && (
            <div>
              <p className={labelCls}>Voice Note from Admin</p>
              <audio src={c.voiceNoteUrl} controls className="w-full rounded-lg" />
            </div>
          )}
          {c.adminPhotos?.length > 0 && (
            <div>
              <p className={labelCls}>Admin Photos</p>
              <div className="flex gap-3 flex-wrap">
                {c.adminPhotos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt="" className="w-24 h-24 object-cover rounded-lg border border-border" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── Petrol field (in-warranty) ── */}
          {isInWarranty && (
            <PetrolEditField
              petrolAdmin={c.petrolAdmin}
              petrolSC={c.petrolSC}
              petrolFinal={c.petrolFinal}
              editCount={c.petrolEditCount}
              locked={c.petrolLocked}
              userRole="service_centre"
              onSave={(val) => setPetrolSC(val)}
            />
          )}

          {/* ── Action Section ── */}
          {alreadyFinished ? (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-center">
              <p className="text-green-800 font-semibold">Job submitted!</p>
              <p className="text-sm text-green-700 mt-1">
                Status: <strong>{c.status.replace(/_/g, ' ')}</strong>. Waiting for admin to confirm.
              </p>
            </div>
          ) : (
            <>
              {/* Mark Going */}
              {canMarkGoing && (
                <button
                  onClick={handleMarkGoing}
                  disabled={markingGoing}
                  className="w-full py-3 bg-yellow-500 text-white rounded-xl text-sm font-semibold hover:bg-yellow-600 disabled:opacity-50 transition"
                >
                  {markingGoing ? 'Updating...' : '🚗 Mark as Going (On the Way)'}
                </button>
              )}

              {/* Final submission form */}
              {canSubmitFinal && (
                <div className="space-y-5 rounded-xl border border-border p-5">
                  <p className="text-sm font-bold text-foreground">Submit Job Result</p>

                  {/* Proof photos */}
                  <div>
                    <label className={labelCls}>
                      Proof Photos {finalStatus === 'done' && <span className="text-red-500">*</span>}
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Upload up to 5 photos. {finalStatus === 'done' ? '(Required for completed jobs)' : '(Optional)'}
                    </p>
                    <ImageUploader
                      maxFiles={5}
                      uploadedUrls={proofPhotos}
                      onUpload={setProofPhotos}
                    />
                  </div>

                  {/* Final status selector */}
                  <div>
                    <label className={labelCls}>Final Status <span className="text-red-500">*</span></label>
                    <select
                      value={finalStatus}
                      onChange={(e) => setFinalStatus(e.target.value)}
                      className={inputCls}
                    >
                      {FINAL_STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Out-of-warranty: customer payment */}
                  {!isInWarranty && (
                    <div>
                      <label className={labelCls}>
                        Amount Collected from Customer (₹) {finalStatus === 'done' && <span className="text-red-500">*</span>}
                      </label>
                      <p className="text-xs text-muted-foreground mb-2">
                        This is the total cash or UPI amount paid directly by the customer. {finalStatus === 'done' ? 'Required.' : 'Optional.'}
                      </p>
                      <input
                        type="number"
                        min="0"
                        value={customerPayment}
                        onChange={(e) => setCustomerPayment(e.target.value)}
                        placeholder="e.g. 800"
                        className={`${inputCls} max-w-xs`}
                      />
                    </div>
                  )}

                  {/* Petrol SC input (if it's SC's turn and in-warranty) */}
                  {isInWarranty && c.petrolEditCount === 1 && (
                    <div>
                      <label className={labelCls}>Actual Petrol / Diesel (₹) — Your Turn</label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Admin estimated ₹{c.petrolAdmin ?? 0}. Enter your actual travel cost.
                      </p>
                      <input
                        type="number"
                        min="0"
                        value={petrolSC}
                        onChange={(e) => setPetrolSC(e.target.value)}
                        placeholder={`Was ₹${c.petrolAdmin ?? 0}`}
                        className={`${inputCls} max-w-xs`}
                      />
                    </div>
                  )}

                  {/* Extra charge request */}
                  <div>
                    <label className={labelCls}>Request Extra Charge (Optional)</label>
                    <p className="text-xs text-muted-foreground mb-2">
                      If you incurred an extra cost (e.g. spare part), request admin approval here.
                    </p>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={extraLabel}
                        onChange={(e) => setExtraLabel(e.target.value)}
                        placeholder="Label (e.g. Motor part)"
                        className={`${inputCls} flex-1`}
                      />
                      <input
                        type="number"
                        min="0"
                        value={extraAmount}
                        onChange={(e) => setExtraAmount(e.target.value)}
                        placeholder="₹ Amount"
                        className={`${inputCls} w-28`}
                      />
                    </div>
                  </div>

                  {/* SC Notes */}
                  <div>
                    <label className={labelCls}>Your Notes (Optional)</label>
                    <textarea
                      rows={3}
                      value={scNotes}
                      onChange={(e) => setScNotes(e.target.value)}
                      placeholder="Any notes about the visit or what was done..."
                      className={inputCls}
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                      {success}
                    </div>
                  )}

                  <button
                    onClick={handleSubmitFinal}
                    disabled={submitting}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition"
                  >
                    {submitting ? 'Submitting...' : '✓ Submit Job Result'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
