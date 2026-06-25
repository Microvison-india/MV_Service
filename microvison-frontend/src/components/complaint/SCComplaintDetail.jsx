import { useState, useEffect } from 'react';
import api from '../../api/axios';
import ImageUploader from '../forms/ImageUploader';
import PetrolEditField from './PetrolEditField';
import ExtraChargesList from './ExtraChargesList';
import VoiceRecorder from '../forms/VoiceRecorder';
import StatusTimeline from './StatusTimeline';

// GRD Section 10.2 — SC Complaint Detail slide panel
// Opened from MyComplaints when SC clicks "Open Details"
// SC can: mark going, upload proof, submit final status, adjust petrol, request extra charge, add notes

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';
const labelCls = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1';

function AccordionSection({ title, icon, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-sm transition">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3.5 font-bold text-xs text-foreground hover:bg-muted/30 transition select-none border-b border-border/40"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-sm">{icon}</span>}
          <span className="uppercase tracking-wider">{title}</span>
        </div>
        <span className="text-muted-foreground text-[10px] transition-transform duration-200">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>
      {isOpen && (
        <div className="p-5 space-y-5 bg-background/30 border-t border-border/20">
          {children}
        </div>
      )}
    </div>
  );
}

export default function SCComplaintDetail({ complaint: initial, onClose, onUpdated }) {
  const [c, setC] = useState(initial);
  const [proofPhotos, setProofPhotos] = useState([]);
  const [scNotes, setScNotes] = useState('');
  const [activeForm, setActiveForm] = useState('done'); // 'done' | 'not_done' | 'part_pending'
  const [petrolSC, setPetrolSC] = useState('');
  const [customerPayment, setCustomerPayment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [markingGoing, setMarkingGoing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState([]);

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

  // Phase 21 State Variables
  const [scBillPhotoUrl, setScBillPhotoUrl] = useState('');
  const [scSerialSlipPhotoUrl, setScSerialSlipPhotoUrl] = useState('');
  const [skipBillPhoto, setSkipBillPhoto] = useState(false);
  const [skipSerialPhoto, setSkipSerialPhoto] = useState(false);

  useEffect(() => {
    let active = true;
    let isFirst = true;
    
    // Reset form states to clean slate when loading a different/updated complaint
    Promise.resolve().then(() => {
      if (!active) return;
      setProofPhotos([]);
      setScNotes('');
      setPetrolSC('');
      setCustomerPayment('');
      setDoneVoiceUrl('');
      setNotDoneReason('');
      setNotDoneVoiceUrl('');
      setPartDetails('');
      setPartPendingVoiceUrl('');
      setTotalVisits(1);
      setDistanceTravelled('');
      setExtraCharges([]);
      setScBillPhotoUrl('');
      setScSerialSlipPhotoUrl('');
      setSkipBillPhoto(false);
      setSkipSerialPhoto(false);
      setError('');
      setSuccess('');
    });

    const fetchDetail = async () => {
      try {
        const { data } = await api.get(`/api/complaints/${initial._id}`);
        if (active) {
          setC(data.complaint);
          setUpdates(data.updates || []);
          if (isFirst) {
            if (data.complaint.petrolSC != null) {
              setPetrolSC(String(data.complaint.petrolSC));
            }
            if (data.complaint.extraCharges) {
              setExtraCharges(data.complaint.extraCharges);
            }
            isFirst = false;
          }
        }
      } catch (err) {
        console.error('Failed to load full complaint details', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDetail();

    const intervalId = setInterval(fetchDetail, 5000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
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

      // Check missing fields on product
      const productObj = c?.trackingId;
      const isBillInfoMissing = productObj && (!productObj.billDate || !productObj.billPhoto || !productObj.shopName);
      const isSerialInfoMissing = productObj && (!productObj.serialNumber || !productObj.modelNumber);

      if (isBillInfoMissing) {
        if (!scBillPhotoUrl && !skipBillPhoto) {
          setError('Please upload the product bill photo or check "Skip for now".');
          return;
        }
        body.scBillPhotoUrl = scBillPhotoUrl || undefined;
      }

      if (isSerialInfoMissing) {
        if (!scSerialSlipPhotoUrl && !skipSerialPhoto) {
          setError('Please upload the product serial/model sticker photo or check "Skip for now".');
          return;
        }
        body.scSerialSlipPhotoUrl = scSerialSlipPhotoUrl || undefined;
      }

      const bypassedFields = [];
      if (isBillInfoMissing && skipBillPhoto) bypassedFields.push('billPhoto');
      if (isSerialInfoMissing && skipSerialPhoto) bypassedFields.push('serialPhoto');
      body.scMissingBypass = bypassedFields;

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

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-background shadow-2xl flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-xs font-semibold uppercase tracking-wider">Loading details...</p>
      </div>
    );
  }

  const productObj = c?.trackingId;
  const isBillInfoMissing = productObj && (!productObj.billDate || !productObj.billPhoto || !productObj.shopName);
  const isSerialInfoMissing = productObj && (!productObj.serialNumber || !productObj.modelNumber);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Drawer slide panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-background shadow-2xl flex flex-col">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10 shadow-sm">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-primary/10 text-primary text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider">
                {c.status.replace(/_/g, ' ')}
              </span>
              <p className="text-xs text-muted-foreground font-mono">
                {displayTrackingId ? `Product ID: ${displayTrackingId}` : `Job ID: ${c.complaintId}`}
              </p>
            </div>
            <h2 className="text-lg font-bold text-foreground mt-1">{latestCustomerName}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-36">
          
          {/* Section 1: Admin Remarks & Description Accordion */}
          <AccordionSection title="Admin Remarks & Description" icon="📣" defaultOpen={true}>
            <div className="space-y-4 text-xs">
              {/* Complaint Type */}
              <div>
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px] block mb-1">Complaint Type</span>
                <span className="inline-block bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded text-[10px] uppercase">
                  📋 {c.complaintType || 'Complaint'}
                </span>
              </div>

              {/* Admin Notes */}
              {c.notes && (
                <div>
                  <span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px] block mb-1">Admin Notes / Remarks</span>
                  <p className="text-xs bg-yellow-50/50 border border-yellow-100 p-3.5 rounded-xl text-yellow-900 font-medium whitespace-pre-wrap leading-relaxed">{c.notes}</p>
                </div>
              )}

              {/* Voice Note from Admin */}
              {c.voiceNoteUrl && (
                <div>
                  <span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px] block mb-1.5">Voice Note from Admin</span>
                  <audio src={c.voiceNoteUrl} controls className="w-full max-h-8" />
                </div>
              )}

              {/* Admin Reference Photos */}
              {c.adminPhotos?.length > 0 && (
                <div>
                  <span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px] block mb-1.5">Admin Reference Photos</span>
                  <div className="flex gap-2 flex-wrap">
                    {c.adminPhotos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition">
                        <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-border" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Reopened Complaint details */}
              {c.isReopened && c.reopenNotes && (
                <div className="border-t border-border/40 pt-3.5 space-y-3">
                  <div>
                    <span className="text-red-700 uppercase font-bold tracking-wider text-[9px] block mb-1">⚠️ Reopen Notes (Admin)</span>
                    <p className="text-xs bg-red-50/50 border border-red-100 p-3.5 rounded-xl text-red-900 font-medium whitespace-pre-wrap leading-relaxed">{c.reopenNotes}</p>
                  </div>
                  {c.reopenPhotos?.length > 0 && (
                    <div>
                      <span className="text-red-700 uppercase font-bold tracking-wider text-[9px] block mb-1.5">Reopen Reference Photos</span>
                      <div className="flex gap-2 flex-wrap">
                        {c.reopenPhotos.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition">
                            <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-red-200" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </AccordionSection>

          {/* Section 2: Customer Profile Accordion */}
          <AccordionSection title="Customer Profile" icon="📋" defaultOpen={true}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Customer Name */}
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px]">Customer Name</span>
                <p className="font-semibold text-sm text-foreground">{latestCustomerName || '—'}</p>
              </div>

              {/* Phone No */}
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px]">Phone No</span>
                <p className="font-semibold text-sm text-foreground">
                  {latestPhone1 || '—'}{latestPhone2 ? ` / ${latestPhone2}` : ''}
                </p>
              </div>

              {/* Address */}
              <div className="sm:col-span-2 space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px]">Address</span>
                <p className="font-medium text-foreground">
                  {latestAddress || '—'}
                  {(latestCity || latestDistrict || latestState) ? `, ${[latestCity, latestDistrict, latestState].filter(Boolean).join(', ')}` : ''}
                </p>
              </div>

              {/* Warranty Status */}
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px]">Warranty Status</span>
                <div>
                  <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${
                    latestWarrantyStatus === 'in_warranty' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {latestWarrantyStatus === 'in_warranty' ? '✅ In Warranty' : '⚠️ Out of Warranty'}
                  </span>
                </div>
              </div>

              {/* Product Type */}
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px]">Product Type</span>
                <p className="font-semibold text-foreground capitalize font-mono">
                  {PRODUCT_LABELS[latestProduct] || latestProduct || '—'}
                </p>
              </div>

              {/* Bill Date */}
              {latestBillDate && (
                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px]">Bill Date</span>
                  <p className="font-medium text-foreground">{formatDate(latestBillDate)}</p>
                </div>
              )}

              {/* Expiry Date */}
              {latestWarrantyExpiryDate && (
                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px]">Warranty Expiry Date</span>
                  <p className="font-medium text-foreground">{formatDate(latestWarrantyExpiryDate)}</p>
                </div>
              )}

              {/* Serial Number */}
              {latestSerialNumber && (
                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px]">Serial Number</span>
                  <p className="font-mono text-foreground font-semibold">{latestSerialNumber}</p>
                </div>
              )}
            </div>
          </AccordionSection>

          {/* Section 3: Job Context & Pricing Accordion */}
          <AccordionSection title="Job Context & Pricing" icon="🔧" defaultOpen={false}>
            {/* Pricing Section (In Warranty only) - Read Only! */}
            {isInWarranty && (
              <div className="rounded-xl border border-border/80 p-3.5 bg-muted/10">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Preset Pricing Details (Admin Assigned)</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Preset Name:</span>
                    <p className="font-semibold text-foreground">{c.presetName || 'Default Preset'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Base Preset Price:</span>
                    <p className="font-bold text-foreground">₹{c.presetPrice ?? 0}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Petrol field (Read-only on SC side pricing context - editing only allowed in Done form) */}
            {isInWarranty && (
              <div className="bg-muted/10 border border-border/80 rounded-xl p-3.5 space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Petrol Claimed</span>
                <PetrolEditField
                  petrolAdmin={c.petrolAdmin}
                  petrolSC={c.petrolSC}
                  petrolFinal={c.petrolFinal}
                  editCount={c.petrolEditCount}
                  locked={c.petrolLocked}
                  userRole="readonly"
                  onSave={() => {}}
                />
              </div>
            )}

            {/* Extra Charges Claim (Read-only in Pricing Context) */}
            {c.extraCharges && c.extraCharges.length > 0 && (
              <div className="space-y-1.5 mt-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Extra Charges (SC Requests / Approved)</span>
                <div className="bg-muted/10 border border-border/80 rounded-xl p-3.5 shadow-sm">
                  <ExtraChargesList 
                    complaintId={c._id} 
                    extraCharges={c.extraCharges} 
                    readOnly={true}
                  />
                </div>
              </div>
            )}
          </AccordionSection>

          {/* Section 4: Activity Timeline Accordion */}
          <AccordionSection title="Activity Timeline" icon="🕒" defaultOpen={true}>
            <StatusTimeline updates={updates} complaint={c} />
          </AccordionSection>

          {/* Section 4: Conclude Job Action Form (SC Submit form) */}
          {canSubmitFinal && (
            <AccordionSection title="Conclude Complaint Action" icon="📋" defaultOpen={true}>
              <div className="space-y-5 bg-card">
                
                {/* Clean tabs */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-xl border border-border/80">
                  <button
                    type="button"
                    onClick={() => { setActiveForm('done'); setError(''); }}
                    className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeForm === 'done'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>✅</span> Done
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveForm('not_done'); setError(''); }}
                    className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeForm === 'not_done'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>❌</span> Not Done
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveForm('part_pending'); setError(''); }}
                    className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeForm === 'part_pending'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>⏳</span> Part Pending
                  </button>
                </div>

                {/* ────────────────── Tab-specific Form Fields ────────────────── */}

                {/* Proof Photos (Done & Part Pending required, Not Done optional) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                    Upload Photos {activeForm === 'done' && <span className="text-red-500">*</span>} {activeForm === 'part_pending' && <span className="text-red-500">*(Min 2)</span>}
                  </label>
                  <p className="text-[10px] text-muted-foreground">
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

                {/* Path 1: DONE Form */}
                {activeForm === 'done' && (
                  <div className="space-y-4 pt-2 border-t border-border/50">
                    {/* Demanded Bill Info Sub-section */}
                    {isBillInfoMissing && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl space-y-3">
                        <div>
                          <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                            Product Bill Info Required
                          </h4>
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                            The bill information for this product was not provided at registration. Please ask the customer for their purchase bill and upload a photo here.
                          </p>
                        </div>
                        {scBillPhotoUrl ? (
                          <div className="flex items-center gap-3 border rounded-lg p-2 bg-background">
                            <span className="text-xs font-medium truncate max-w-xs">📄 Bill Photo Uploaded</span>
                            <button type="button" onClick={() => setScBillPhotoUrl('')} className="text-xs text-red-500 font-bold ml-auto">
                              Remove
                            </button>
                          </div>
                        ) : (
                          <ImageUploader
                            maxFiles={1}
                            uploadedUrls={[]}
                            onUpload={(urls) => setScBillPhotoUrl(urls[0] || '')}
                          />
                        )}
                        <p className="text-[10px] text-muted-foreground italic">
                          This will be used to update the product's warranty information.
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="skip-bill-photo"
                            checked={skipBillPhoto}
                            onChange={(e) => setSkipBillPhoto(e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <label htmlFor="skip-bill-photo" className="text-xs font-medium text-amber-900 dark:text-amber-200 cursor-pointer">
                            Skip for now
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Demanded Serial/Model Info Sub-section */}
                    {isSerialInfoMissing && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl space-y-3">
                        <div>
                          <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                            Product Serial Info Required
                          </h4>
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                            Please photograph the serial number / model sticker on the product.
                          </p>
                        </div>
                        {scSerialSlipPhotoUrl ? (
                          <div className="flex items-center gap-3 border rounded-lg p-2 bg-background">
                            <span className="text-xs font-medium truncate max-w-xs">📷 Sticker Photo Uploaded</span>
                            <button type="button" onClick={() => setScSerialSlipPhotoUrl('')} className="text-xs text-red-500 font-bold ml-auto">
                              Remove
                            </button>
                          </div>
                        ) : (
                          <ImageUploader
                            maxFiles={1}
                            uploadedUrls={[]}
                            onUpload={(urls) => setScSerialSlipPhotoUrl(urls[0] || '')}
                          />
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="skip-serial-photo"
                            checked={skipSerialPhoto}
                            onChange={(e) => setSkipSerialPhoto(e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <label htmlFor="skip-serial-photo" className="text-xs font-medium text-amber-900 dark:text-amber-200 cursor-pointer">
                            Skip for now
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Out of Warranty payment collection */}
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
                          className={inputCls}
                          placeholder="e.g. 350"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Total Site Visits</label>
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

                    {/* Petrol allowance claim input (SC Side) */}
                    {isInWarranty && c.petrolSC == null && (c.petrolEditCount === 0 || c.petrolEditCount === 1) && (
                      <div>
                        <label className={labelCls}>Petrol Allowance Claim (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={petrolSC}
                          onChange={(e) => setPetrolSC(e.target.value)}
                          placeholder={c.petrolAdmin ? `Admin Estimate: ₹${c.petrolAdmin}` : "Enter actual petrol cost"}
                          className={inputCls}
                        />
                      </div>
                    )}

                    <div>
                      <label className={labelCls}>Verbal Work Description (Optional)</label>
                      <VoiceRecorder
                        uploadedUrl={doneVoiceUrl}
                        onUpload={setDoneVoiceUrl}
                      />
                    </div>

                    {/* Extra Charges Claim inside Done Form */}
                    <div className="space-y-3 pt-3 border-t border-border">
                      <span className={labelCls}>Claim Extra Charges (Optional)</span>
                      
                      {extraCharges.length > 0 && (
                        <div className="space-y-1.5">
                          {extraCharges.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-muted p-2 rounded-lg text-xs">
                              <span className="font-semibold">
                                {item.label}
                                {item.requestedBy === 'admin' && (
                                  <span className="ml-1.5 text-[8px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>
                                )}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-foreground">₹{item.amount}</span>
                                {item._id ? (
                                  <span className={`text-[10px] font-bold uppercase ${
                                    item.status === 'approved' ? 'text-green-700' :
                                    item.status === 'rejected' ? 'text-red-700' :
                                    'text-yellow-600'
                                  }`}>
                                    {item.status}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setExtraCharges(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-red-600 font-bold hover:text-red-800"
                                    title="Remove this pending charge"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 items-center w-full">
                        <input
                          type="text"
                          id="new-extra-label"
                          placeholder="Description (e.g., replacement motor)"
                          className={`${inputCls} flex-grow flex-1 min-w-[120px] text-xs`}
                          style={{ width: '0px' }}
                        />
                        <input
                          type="number"
                          id="new-extra-amount"
                          placeholder="₹ Amount"
                          className={`${inputCls} shrink-0 text-xs`}
                          style={{ width: '90px' }}
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
                          className="px-3 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Closing Notes (Optional)</label>
                      <textarea
                        rows={2}
                        value={scNotes}
                        onChange={(e) => setScNotes(e.target.value)}
                        placeholder="Describe the final resolution..."
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}

                {/* Path 2: NOT DONE Form */}
                {activeForm === 'not_done' && (
                  <div className="space-y-4 pt-2 border-t border-border/50">
                    <div>
                      <label className={labelCls}>
                        Reason for Not Done <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={notDoneReason}
                        onChange={(e) => setNotDoneReason(e.target.value)}
                        placeholder="Why could the complaint not be resolved? (e.g. Customer not available, wrong address...)"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Voice Explanation (Required if no text reason)</label>
                      <VoiceRecorder
                        uploadedUrl={notDoneVoiceUrl}
                        onUpload={setNotDoneVoiceUrl}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Closing Notes (Optional)</label>
                      <textarea
                        rows={2}
                        value={scNotes}
                        onChange={(e) => setScNotes(e.target.value)}
                        placeholder="Additional remarks..."
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}

                {/* Path 3: PART PENDING Form */}
                {activeForm === 'part_pending' && (
                  <div className="space-y-4 pt-2 border-t border-border/50">
                    <div>
                      <label className={labelCls}>
                        Details of Part/Unit Required <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={partDetails}
                        onChange={(e) => setPartDetails(e.target.value)}
                        placeholder="Specify brand, model, parts, dimensions or specifications needed..."
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>
                        Voice Explanation for Part Diagnosis <span className="text-red-500">*</span>
                      </label>
                      <VoiceRecorder
                        uploadedUrl={partPendingVoiceUrl}
                        onUpload={setPartPendingVoiceUrl}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>
                        Detailed Text Notes / Sourcing Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={scNotes}
                        onChange={(e) => setScNotes(e.target.value)}
                        placeholder="Describe the diagnosis and why this part is required..."
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}

                {/* Form submit button */}
                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  disabled={submitting}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition shadow-sm"
                >
                  {submitting ? 'Submitting Conclusion...' : `✓ Submit conclusion as "${activeForm.replace(/_/g, ' ')}"`}
                </button>
              </div>
            </AccordionSection>
          )}

        </div>

        {/* Sticky Actions Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4 shadow-2xl z-20">
          {alreadyClosed ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 text-center text-green-800 text-xs font-semibold flex items-center justify-center gap-2">
              <span>🔒</span> Job Closed & Locked by Admin.
            </div>
          ) : alreadyDone ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-center text-blue-800 text-xs font-semibold flex items-center justify-center gap-2">
              <span>📤</span> Job Conclusion Submitted! Waiting for Admin verification.
            </div>
          ) : showWaitingDelivery ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3.5 text-xs text-yellow-800 space-y-1 font-medium">
              <p>⚙️ Part sourcing request submitted: <strong className="text-yellow-950">"{c.partDetails}"</strong></p>
              <p className="text-[10px] text-muted-foreground">Waiting for Admin to dispatch/deliver the part to you.</p>
            </div>
          ) : showMarkReceived ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
              <p className="text-xs text-green-800 font-semibold">📦 Admin marked part "{c.partDetails}" as delivered!</p>
              {c.partDeliveredNote && <p className="text-[11px] text-green-900 italic">"Courier details: {c.partDeliveredNote}"</p>}
              
              <button
                onClick={handleMarkReceived}
                disabled={markingReceived}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition"
              >
                {markingReceived ? 'Confirming...' : '✓ Confirm Receipt of Part'}
              </button>
            </div>
          ) : canMarkGoing ? (
            <button
              onClick={handleMarkGoing}
              disabled={markingGoing}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-bold uppercase tracking-wider disabled:opacity-50 transition"
            >
              {markingGoing ? 'Marking Going...' : '🚗 Mark as Going (Start Travel)'}
            </button>
          ) : (
            <div className="bg-muted p-2 rounded-lg text-center text-xs text-muted-foreground font-semibold">
              Current Job Status: <span className="text-foreground uppercase">{c.status.replace(/_/g, ' ')}</span>
            </div>
          )}

          {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 mt-2 text-center">{error}</p>}
          {success && <p className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200 mt-2 text-center">{success}</p>}
        </div>

      </div>
    </>
  );
}
