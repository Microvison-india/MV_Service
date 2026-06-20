import { useState, useEffect } from 'react';
import api from '../../api/axios';
import ImageUploader from '../forms/ImageUploader';
import PetrolEditField from './PetrolEditField';
import BillSummary from './BillSummary';
import VoiceRecorder from '../forms/VoiceRecorder';

// GRD Section 10.2 — SC Complaint Detail slide panel
// Opened from MyComplaints when SC clicks "Open Details"
// SC can: mark going, upload proof, submit final status, adjust petrol, request extra charge, add notes

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';
const labelCls = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1';

export default function SCComplaintDetail({ complaint: initial, onClose, onUpdated }) {
  const [c, setC] = useState(initial);
  const [proofPhotos, setProofPhotos] = useState(c.proofPhotos || []);
  const [scNotes, setScNotes] = useState(c.scNotes || '');
  const [activeForm, setActiveForm] = useState('done'); // 'done' | 'not_done' | 'part_pending'
  const [petrolSC, setPetrolSC] = useState('');
  const [customerPayment, setCustomerPayment] = useState(c.customerPaymentAmount || '');
  const [submitting, setSubmitting] = useState(false);
  const [markingGoing, setMarkingGoing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [productTimeline, setProductTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  // SC Flow v1.1 State Variables
  const [doneVoiceUrl, setDoneVoiceUrl] = useState('');
  const [notDoneReason, setNotDoneReason] = useState('');
  const [notDoneVoiceUrl, setNotDoneVoiceUrl] = useState('');
  const [partDetails, setPartDetails] = useState('');
  const [partPendingVoiceUrl, setPartPendingVoiceUrl] = useState('');
  const [totalVisits, setTotalVisits] = useState(1);
  const [distanceTravelled, setDistanceTravelled] = useState('');
  const [extraCharges, setExtraCharges] = useState([]);
  const [markingReceived, setMarkingReceived] = useState(false);

  // Sibling timeline expand state variables (lazy-loading)
  const [expandedComplaintId, setExpandedComplaintId] = useState(null);
  const [loadedDetails, setLoadedDetails] = useState({});
  const [loadingHistoryDetails, setLoadingHistoryDetails] = useState(null);

  const handleToggleExpand = async (compId) => {
    if (expandedComplaintId === compId) {
      setExpandedComplaintId(null);
      return;
    }
    setExpandedComplaintId(compId);

    if (compId === c?._id) return;
    if (loadedDetails[compId]) return;

    setLoadingHistoryDetails(compId);
    try {
      const { data } = await api.get(`/api/complaints/${compId}`);
      setLoadedDetails((prev) => ({
        ...prev,
        [compId]: {
          complaint: data.complaint,
          updates: data.updates,
        },
      }));
    } catch (err) {
      console.error('Failed to load historical complaint details', err);
    } finally {
      setLoadingHistoryDetails(null);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchDetail = async () => {
      try {
        const { data } = await api.get(`/api/complaints/${initial._id}`);
        if (active) {
          setC(data.complaint);
          setProductTimeline(data.productTimeline || []);
        }
      } catch (err) {
        console.error('Failed to load full complaint details', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDetail();
    return () => { active = false; };
  }, [initial._id]);

  const isInWarranty = c.warrantyStatus === 'in_warranty';
  const canMarkGoing = c.status === 'accepted';
  const showMarkReceived = c.status === 'part_pending' && c.partDeliveredAt;
  const showWaitingDelivery = c.status === 'part_pending' && !c.partDeliveredAt;
  const canSubmitFinal = ['accepted', 'going', 'not_done', 'part_received'].includes(c.status);
  const alreadyClosed = c.status === 'closed';
  const alreadyDone = c.status === 'done';

  const PRODUCT_LABELS = { led: 'LED', cooler: 'Cooler', both: 'LED + Cooler' };

  // Sourced from Product tracking if populated to always show the latest info
  const productInfo = c.trackingId || {};
  const latestCustomerName = productInfo.customerName || c.customerName;
  const latestPhone1 = productInfo.phone1 || c.phone1;
  const latestPhone2 = productInfo.phone2 || c.phone2;
  const latestAddress = productInfo.localAddress || c.localAddress;
  const latestCity = productInfo.city || c.city;
  const latestDistrict = productInfo.district || c.district;
  const latestState = productInfo.state || c.state;
  const latestTrackingId = productInfo.trackingId || c.trackingId;
  const latestSerialNumber = productInfo.serialNumber || c.serialNumber;
  const latestProduct = productInfo.product || c.product;
  const latestWarrantyStatus = productInfo.warrantyStatus || c.warrantyStatus;
  const latestWarrantySource = productInfo.warrantySource || c.warrantySource;
  const latestBillDate = productInfo.billDate || c.billDate;
  const latestWarrantyExpiryDate = productInfo.warrantyExpiryDate || c.warrantyExpiryDate;
  const displayTrackingId = typeof latestTrackingId === 'object'
    ? (latestTrackingId?.trackingId || latestTrackingId?._id || '')
    : (latestTrackingId || '');

  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      return new Date(dateVal).toLocaleDateString();
    } catch {
      return '';
    }
  };

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

  const handleMarkReceived = async () => {
    setMarkingReceived(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.patch(`/api/complaints/${c._id}/part-received`);
      setC(data.complaint);
      setSuccess('Part/Unit marked as received! 📦');
      setTimeout(onUpdated, 1200);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update status.');
    } finally {
      setMarkingReceived(false);
    }
  };

  const handleSubmitFinal = async () => {
    setError('');
    setSuccess('');

    const body = {
      newStatus: activeForm,
      proofPhotos,
      scNotes,
    };

    // ── Path 1: Done Form ────────────────────────────────────
    if (activeForm === 'done') {
      if (proofPhotos.length < 1) {
        setError('At least one proof photo is required before marking as done.');
        return;
      }
      if (!isInWarranty && !customerPayment) {
        setError('Please enter the amount collected from the customer.');
        return;
      }
      if (!isInWarranty) {
        body.customerPaymentAmount = Number(customerPayment);
      }

      body.totalVisits = totalVisits ? Number(totalVisits) : undefined;
      body.distanceTravelled = distanceTravelled ? Number(distanceTravelled) : undefined;
      body.doneVoiceUrl = doneVoiceUrl;

      // Petrol SC (only if in-warranty and SC's turn)
      if (isInWarranty && (c.petrolEditCount === 1 || c.petrolEditCount === 0) && petrolSC !== '') {
        body.petrolSC = Number(petrolSC);
      }

      // Extra Charges
      body.extraCharges = extraCharges;
    }

    // ── Path 2: Not Done Form ────────────────────────────────
    else if (activeForm === 'not_done') {
      const hasReason = notDoneReason && notDoneReason.trim() !== '';
      const hasVoice = notDoneVoiceUrl && notDoneVoiceUrl.trim() !== '';
      
      if (!hasReason && !hasVoice) {
        setError('Either a text reason or a voice note must be provided before marking as not done.');
        return;
      }

      body.notDoneReason = notDoneReason;
      body.notDoneVoiceUrl = notDoneVoiceUrl;
    }

    // ── Path 3: Part Pending Form ────────────────────────────
    else if (activeForm === 'part_pending') {
      if (proofPhotos.length < 2) {
        setError('At least two proof photos (proof of diagnosis) are required before marking as part pending.');
        return;
      }
      if (!partDetails || !partDetails.trim()) {
        setError('Parts detail description is compulsory.');
        return;
      }
      if (!partPendingVoiceUrl) {
        setError('A voice note explanation is compulsory.');
        return;
      }
      if (!scNotes || !scNotes.trim()) {
        setError('Text notes are compulsory.');
        return;
      }

      body.partDetails = partDetails;
      body.partPendingVoiceUrl = partPendingVoiceUrl;
    }

    setSubmitting(true);
    try {
      const { data } = await api.patch(`/api/complaints/${c._id}/status`, body);
      setC(data.complaint);
      setSuccess(`Complaint marked as "${activeForm.replace(/_/g, ' ')}" successfully!`);
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
            <p className="text-xs text-muted-foreground font-mono">
              {displayTrackingId ? `Product: ${displayTrackingId} · Job ID: ${c.complaintId}` : `Job ID: ${c.complaintId}`}
            </p>
            <h2 className="text-lg font-bold text-foreground">{latestCustomerName}</h2>
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

          {/* Customer & Product Profile */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Customer Profile</h3>
              {displayTrackingId ? (
                <span className="text-xs font-mono bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold uppercase">
                  Product ID: {displayTrackingId}
                </span>
              ) : (
                <span className="text-xs font-mono bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-bold uppercase">
                  No Product Link
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Customer Name */}
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Customer Name</span>
                <p className="font-semibold text-sm text-foreground">{latestCustomerName || '—'}</p>
              </div>

              {/* Phone No */}
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Phone No</span>
                <p className="font-semibold text-sm text-foreground">
                  {latestPhone1 || '—'}{latestPhone2 ? ` / ${latestPhone2}` : ''}
                </p>
              </div>

              {/* Address */}
              <div className="sm:col-span-2 space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Address</span>
                <p className="font-medium text-foreground">
                  {latestAddress || '—'}
                  {(latestCity || latestDistrict || latestState) ? `, ${[latestCity, latestDistrict, latestState].filter(Boolean).join(', ')}` : ''}
                </p>
              </div>

              {/* Product Type */}
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Product Type</span>
                <p className="font-semibold text-foreground capitalize font-mono">
                  {PRODUCT_LABELS[latestProduct] || latestProduct || '—'}
                </p>
              </div>

              {/* Warranty Status */}
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Warranty Status</span>
                <div>
                  <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${
                    latestWarrantyStatus === 'in_warranty' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {latestWarrantyStatus === 'in_warranty' ? '✅ In Warranty' : '⚠️ Out of Warranty'}
                  </span>
                  {latestWarrantySource === 'manual' && (
                    <span className="ml-2 inline-block bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.5 rounded text-[9px] uppercase">
                      Manual
                    </span>
                  )}
                </div>
              </div>

              {/* Bill Date */}
              {latestBillDate && (
                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Bill Date</span>
                  <p className="font-medium text-foreground">{formatDate(latestBillDate)}</p>
                </div>
              )}

              {/* Expiry Date */}
              {latestWarrantyExpiryDate && (
                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Warranty Expiry Date</span>
                  <p className="font-medium text-foreground">{formatDate(latestWarrantyExpiryDate)}</p>
                </div>
              )}

              {/* Serial Number */}
              {latestSerialNumber && (
                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Serial Number</span>
                  <p className="font-mono text-foreground font-semibold">{latestSerialNumber}</p>
                </div>
              )}
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

          {/* Bill Summary (Only if Closed) */}
          {c.status === 'closed' && (
            <BillSummary complaint={c} />
          )}

          {/* ── Action Section ── */}
          {alreadyClosed ? (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-center">
              <p className="text-green-800 font-semibold">Job Closed & Locked!</p>
              <p className="text-sm text-green-700 mt-1">This complaint has been verified and closed by admin.</p>
            </div>
          ) : alreadyDone ? (
            <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-4 text-center">
              <p className="text-blue-800 font-semibold">Job Submitted!</p>
              <p className="text-sm text-blue-700 mt-1">Waiting for admin to confirm and close the complaint.</p>
            </div>
          ) : showWaitingDelivery ? (
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚙️</span>
                <p className="text-yellow-800 font-semibold text-sm">Part Pending Sourcing</p>
              </div>
              <p className="text-xs text-yellow-700">
                You requested: <strong className="text-yellow-900">{c.partDetails}</strong>. Waiting for Admin to mark the part as dispatched/delivered.
              </p>
              {c.partPendingVoiceUrl && (
                <div>
                  <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wide">Your Sourcing Voice Explanation</span>
                  <audio src={c.partPendingVoiceUrl} controls className="w-full mt-1" />
                </div>
              )}
            </div>
          ) : showMarkReceived ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📦</span>
                <p className="text-green-800 font-semibold text-sm">Part / Unit Dispatched!</p>
              </div>
              <p className="text-xs text-green-700">
                Admin marked requested part (<strong className="text-green-900">{c.partDetails}</strong>) as delivered.
              </p>
              {c.partDeliveredNote && (
                <div className="bg-white/60 p-2.5 rounded-lg border border-green-100 text-xs">
                  <span className="font-bold text-green-800 text-[10px] uppercase">Delivery note / courier details</span>
                  <p className="text-green-900 mt-0.5">{c.partDeliveredNote}</p>
                </div>
              )}
              
              {error && <p className="text-xs text-red-600">{error}</p>}
              {success && <p className="text-xs text-green-700">{success}</p>}

              <button
                onClick={handleMarkReceived}
                disabled={markingReceived}
                className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition"
              >
                {markingReceived ? 'Updating...' : '✓ Mark as Received'}
              </button>
            </div>
          ) : (
            <>
              {/* Mark Going */}
              {canMarkGoing && (
                <button
                  onClick={handleMarkGoing}
                  disabled={markingGoing}
                  className="w-full py-3 bg-yellow-500 text-white rounded-xl text-sm font-semibold hover:bg-yellow-600 disabled:opacity-50 transition mb-4"
                >
                  {markingGoing ? 'Updating...' : '🚗 Mark as Going (On the Way)'}
                </button>
              )}

              {/* Action Form Group */}
              {canSubmitFinal && (
                <div className="space-y-5 rounded-xl border border-border p-5 bg-card">
                  <p className="text-sm font-bold text-foreground">Submit Job Conclusion</p>
                  
                  {/* Path Tab Selectors */}
                  <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => { setActiveForm('done'); setError(''); }}
                      className={`py-2 text-xs font-bold rounded-md transition ${
                        activeForm === 'done'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveForm('not_done'); setError(''); }}
                      className={`py-2 text-xs font-bold rounded-md transition ${
                        activeForm === 'not_done'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Not Done
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveForm('part_pending'); setError(''); }}
                      className={`py-2 text-xs font-bold rounded-md transition ${
                        activeForm === 'part_pending'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Part Pending
                    </button>
                  </div>

                  {/* ────────────────── Path Form Fields ────────────────── */}

                  {/* Proof Photos (Compulsory for Done & Part Pending, Optional for Not Done) */}
                  <div>
                    <label className={labelCls}>
                      Proof Photos {activeForm === 'done' && <span className="text-red-500">*</span>} {activeForm === 'part_pending' && <span className="text-red-500">*(Min 2)</span>}
                    </label>
                    <p className="text-[10px] text-muted-foreground mb-1.5">
                      {activeForm === 'done' && 'Upload proof of completed resolution (Min 1, max 5).'}
                      {activeForm === 'part_pending' && 'Upload proof of diagnosis / fault (Min 2, max 5).'}
                      {activeForm === 'not_done' && 'Upload optional proof photos (Max 5).'}
                    </p>
                    <ImageUploader
                      maxFiles={5}
                      uploadedUrls={proofPhotos}
                      onUpload={setProofPhotos}
                    />
                  </div>

                  {/* Form Path 1: Done Fields */}
                  {activeForm === 'done' && (
                    <div className="space-y-4">
                      {/* Out of Warranty Customer Payment */}
                      {!isInWarranty && (
                        <div>
                          <label className={labelCls}>
                            Amount Collected from Customer (₹) <span className="text-red-500">*</span>
                          </label>
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

                      {/* Petrol adjustment (In Warranty only) */}
                      {isInWarranty && (c.petrolEditCount === 1 || c.petrolEditCount === 0) && (
                        <div>
                          <label className={labelCls}>Actual Petrol / Diesel (₹)</label>
                          <p className="text-[10px] text-muted-foreground mb-1">
                            Estimated by admin: ₹{c.petrolAdmin ?? 0}. Enter your actual travel cost.
                          </p>
                          <input
                            type="number"
                            min="0"
                            value={petrolSC}
                            onChange={(e) => setPetrolSC(e.target.value)}
                            placeholder={`Currently using ₹${c.petrolAdmin ?? 0}`}
                            className={`${inputCls} max-w-xs`}
                          />
                        </div>
                      )}

                      {/* Lifecycle visits & distance */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Total Visits</label>
                          <input
                            type="number"
                            min="1"
                            value={totalVisits}
                            onChange={(e) => setTotalVisits(e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Distance Travelled (km)</label>
                          <input
                            type="number"
                            min="0"
                            value={distanceTravelled}
                            onChange={(e) => setDistanceTravelled(e.target.value)}
                            placeholder="e.g. 24"
                            className={inputCls}
                          />
                        </div>
                      </div>

                      {/* Done voice note */}
                      <div>
                        <label className={labelCls}>Verbal Work Description (Optional)</label>
                        <VoiceRecorder
                          uploadedUrl={doneVoiceUrl}
                          onUpload={setDoneVoiceUrl}
                        />
                      </div>

                      {/* Multiple Extra Charges */}
                      <div className="space-y-3 pt-3 border-t border-border">
                        <span className={labelCls}>Extra Charges Incurred (Optional)</span>
                        
                        {extraCharges.length > 0 && (
                          <div className="space-y-1.5">
                            {extraCharges.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-muted p-2 rounded-lg text-xs">
                                <span className="font-medium">{item.label}</span>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-foreground">₹{item.amount}</span>
                                  <button
                                    type="button"
                                    onClick={() => setExtraCharges(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-red-600 font-bold hover:text-red-800"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            id="new-extra-label"
                            placeholder="Description (e.g., replacement motor)"
                            className={`${inputCls} flex-1`}
                          />
                          <input
                            type="number"
                            id="new-extra-amount"
                            placeholder="₹ Amount"
                            className={`${inputCls} w-24`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const lbl = document.getElementById('new-extra-label')?.value || '';
                              const amt = document.getElementById('new-extra-amount')?.value || '';
                              if (lbl.trim() && amt && !isNaN(Number(amt))) {
                                setExtraCharges(prev => [...prev, { label: lbl.trim(), amount: Number(amt) }]);
                                document.getElementById('new-extra-label').value = '';
                                document.getElementById('new-extra-amount').value = '';
                              }
                            }}
                            className="px-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-semibold"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {/* Done General Notes */}
                      <div>
                        <label className={labelCls}>Closing Notes (Optional)</label>
                        <textarea
                          rows={2}
                          value={scNotes}
                          onChange={(e) => setScNotes(e.target.value)}
                          placeholder="Any final details about the work done..."
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}

                  {/* Form Path 2: Not Done Fields */}
                  {activeForm === 'not_done' && (
                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Text Reason <span className="text-muted-foreground">(At least reason or voice required)</span></label>
                        <textarea
                          rows={3}
                          value={notDoneReason}
                          onChange={(e) => setNotDoneReason(e.target.value)}
                          placeholder="Why could the complaint not be completed on this visit?..."
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Voice Note Explanation <span className="text-muted-foreground">(At least reason or voice required)</span></label>
                        <VoiceRecorder
                          uploadedUrl={notDoneVoiceUrl}
                          onUpload={setNotDoneVoiceUrl}
                        />
                      </div>
                    </div>
                  )}

                  {/* Form Path 3: Part Pending Fields */}
                  {activeForm === 'part_pending' && (
                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Parts Needed Description <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={partDetails}
                          onChange={(e) => setPartDetails(e.target.value)}
                          placeholder="e.g., 10uF capacitor / replacement unit"
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Voice Note Diagnosis Explanation <span className="text-red-500">*</span></label>
                        <VoiceRecorder
                          uploadedUrl={partPendingVoiceUrl}
                          onUpload={setPartPendingVoiceUrl}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Diagnosis Notes / Symptoms <span className="text-red-500">*</span></label>
                        <textarea
                          rows={2}
                          value={scNotes}
                          onChange={(e) => setScNotes(e.target.value)}
                          placeholder="Describe your diagnostics and symptoms..."
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Feedbacks & Button */}
                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-xs text-green-700">
                      {success}
                    </div>
                  )}

                  <button
                    onClick={handleSubmitFinal}
                    disabled={submitting}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition"
                  >
                    {submitting ? 'Submitting...' : '✓ Submit Job Conclusion'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Unified Product Lifecycle Timeline */}
          {productTimeline.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="font-bold text-sm text-foreground border-b border-border pb-2 uppercase tracking-wide">
                Product History & Timeline
              </h3>
              <div className="relative border-l-2 border-border ml-3 pl-6 space-y-6">
                {productTimeline.map((item) => {
                  const isCurrent = String(item.complaintId) === String(c?._id);
                  const isAssignedToMe = String(item.assignedCentreId) === String(c.assignedCentreId?._id || c.assignedCentreId);
                  const isExpanded = expandedComplaintId === String(item.complaintId);
                  
                  let nodeDetails;
                  let nodeUpdates;
                  let isNodeLoading = false;
                  
                  if (isCurrent) {
                    nodeDetails = c;
                    nodeUpdates = [];
                  } else if (isAssignedToMe) {
                    nodeDetails = loadedDetails[item.complaintId]?.complaint;
                    nodeUpdates = loadedDetails[item.complaintId]?.updates || [];
                    isNodeLoading = loadingHistoryDetails === String(item.complaintId);
                  }

                  return (
                    <div key={item.complaintId} className="relative">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[31px] top-2.5 w-3 h-3 rounded-full border-2 bg-background transition-colors ${
                        isCurrent 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground/60 bg-muted-foreground/30'
                      }`} />

                      {/* Timeline Node Card */}
                      <div 
                        className={`rounded-xl border transition-all ${
                          isCurrent 
                            ? 'border-primary bg-primary/5 shadow-sm' 
                            : 'border-border bg-card'
                        } ${isAssignedToMe ? 'hover:bg-muted/10' : ''}`}
                      >
                        {/* Node Header */}
                        <div 
                          onClick={() => isAssignedToMe && handleToggleExpand(String(item.complaintId))}
                          className={`p-3.5 flex justify-between items-center select-none ${isAssignedToMe ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-xs text-foreground">{item.mvId}</span>
                              <span className="text-[9px] uppercase bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-bold">
                                {item.type}
                              </span>
                              {isCurrent && (
                                <span className="bg-primary text-primary-foreground text-[8px] px-1 py-0.5 rounded font-extrabold uppercase tracking-wider">
                                  Current
                                </span>
                              )}
                              {!isAssignedToMe && (
                                <span className="bg-muted text-muted-foreground text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                                  Other SC (Private)
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(item.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted uppercase text-foreground">
                              {(item.status || 'new').replace(/_/g, ' ')}
                            </span>
                            {isAssignedToMe && (
                              <span className="text-muted-foreground text-xs font-bold w-4 text-center">
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Node Details (Only if assigned to me and expanded) */}
                        {isAssignedToMe && isExpanded && (
                          <div className="border-t border-border p-4 space-y-4 bg-background/40 rounded-b-xl text-xs">
                            {isNodeLoading ? (
                              <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">
                                Loading job details...
                              </div>
                            ) : nodeDetails ? (
                              <div className="space-y-3">
                                {nodeDetails.scNotes && (
                                  <div>
                                    <span className="font-bold text-muted-foreground uppercase tracking-wide text-[9px]">SC Notes</span>
                                    <p className="text-foreground mt-0.5">{nodeDetails.scNotes}</p>
                                  </div>
                                )}
                                {nodeDetails.partDetails && (
                                  <div>
                                    <span className="font-bold text-muted-foreground uppercase tracking-wide text-[9px]">Requested Part Details</span>
                                    <p className="text-foreground mt-0.5 font-semibold text-red-700">{nodeDetails.partDetails}</p>
                                  </div>
                                )}
                                {nodeDetails.partPendingVoiceUrl && (
                                  <div>
                                    <span className="font-bold text-muted-foreground uppercase tracking-wide text-[9px]">Part Diagnosis Voice Note</span>
                                    <audio src={nodeDetails.partPendingVoiceUrl} controls className="w-full mt-1" />
                                  </div>
                                )}
                                {nodeDetails.partDeliveredAt && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 mt-2">
                                    <p className="font-semibold text-green-800 text-[10px]">📦 Part Delivered by Admin</p>
                                    <p className="text-green-700 text-[10px] mt-0.5">Date: {formatDate(nodeDetails.partDeliveredAt)}</p>
                                    {nodeDetails.partDeliveredNote && <p className="text-green-900 text-[10px] mt-0.5 font-medium">Note: {nodeDetails.partDeliveredNote}</p>}
                                  </div>
                                )}
                                {nodeDetails.partReceivedAt && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                                    <p className="font-semibold text-blue-800 text-[10px]">✓ Received by SC</p>
                                    <p className="text-blue-700 text-[10px] mt-0.5">Date: {formatDate(nodeDetails.partReceivedAt)}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="py-2 text-center text-xs text-red-600 font-semibold">
                                Failed to load details. Click header to retry.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
