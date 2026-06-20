import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import ExtraChargesList from './ExtraChargesList';
import StatusTimeline from './StatusTimeline';
import PetrolEditField from './PetrolEditField';
import BillSummary from './BillSummary';

// GRD Section 11.1 / TBP Phase 9
// Admin slide-out review panel for a complaint.
// Allows Admin to view SC work, approve extras, confirm/dispute the job, and edit final petrol.

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';
const labelCls = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1';

export default function AdminComplaintDetail({ complaintId, onClose, onUpdated }) {
  const navigate = useNavigate();
  const [c, setC] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [productTimeline, setProductTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin action states
  const [disputeNote, setDisputeNote] = useState('');
  const [adminNote, setAdminNote] = useState(''); // For confirm
  const [deliveryNote, setDeliveryNote] = useState(''); // For marking parts delivered
  const [petrolFinal, setPetrolFinal] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  // Reassignment states
  const [candidates, setCandidates] = useState([]);
  const [selectedSCId, setSelectedSCId] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Reopen states
  const [reopenNotes, setReopenNotes] = useState('');
  const [reopenPhotos, setReopenPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Historical details caching & expanded state
  const [loadedDetails, setLoadedDetails] = useState({});
  const [prevComplaintId, setPrevComplaintId] = useState(complaintId);
  const [expandedComplaintId, setExpandedComplaintId] = useState(complaintId);
  const [loadingHistoryDetails, setLoadingHistoryDetails] = useState(null);

  if (complaintId !== prevComplaintId) {
    setPrevComplaintId(complaintId);
    setExpandedComplaintId(complaintId);
  }

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
      // Intentionally NOT calling setLoading(true) synchronously here to satisfy React compiler.
      // The initial state of loading is already true.
      try {
        const { data } = await api.get(`/api/complaints/${complaintId}`);
        if (active) {
          setC(data.complaint);
          setUpdates(data.updates);
          setProductTimeline(data.productTimeline || []);
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

  // Fetch candidate Service Centres for reassignment
  useEffect(() => {
    let active = true;
    if (c && ['new', 'assigned', 'rejected_by_sc'].includes(c.status)) {
      Promise.resolve().then(() => {
        if (active) setLoadingCandidates(true);
      });
      api.get('/api/service-centres', { params: { status: 'active', limit: 100 } })
        .then(({ data }) => {
          if (!active) return;
          const allSCs = data.serviceCentres || [];
          const getRequiredCapabilities = (product) => {
            if (product === 'led') return ['led_only', 'both'];
            if (product === 'cooler') return ['cooler_only', 'both'];
            if (product === 'both') return ['both'];
            return [];
          };
          const required = getRequiredCapabilities(c.product);
          
          let matches = allSCs.filter(
            (sc) =>
              sc.city?.toLowerCase() === c.city?.toLowerCase() &&
              required.includes(sc.productCapability)
          );
          
          if (matches.length === 0) {
            matches = allSCs.filter(
              (sc) =>
                sc.district?.toLowerCase() === c.district?.toLowerCase() &&
                required.includes(sc.productCapability)
            );
          }
          setCandidates(matches);
        })
        .catch((err) => console.error('Failed to fetch SC candidates:', err))
        .finally(() => {
          if (active) setLoadingCandidates(false);
        });
    }
    return () => { active = false; };
  }, [c]);

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
  const canConfirmOrDispute = c.status === 'done';

  const getPreCloseStatus = () => {
    if (!updates || updates.length === 0) return null;
    const closedUpdate = updates.find(u => u.newStatus === 'closed');
    return closedUpdate ? closedUpdate.oldStatus : null;
  };
  const preCloseStatus = getPreCloseStatus();
  const isReopenEligible = c.status === 'closed' && 
    (new Date() - new Date(c.createdAt)) / (1000 * 60 * 60 * 24) <= 30 &&
    ['done', 'not_done'].includes(preCloseStatus);

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

  const handleMarkDelivered = async () => {
    setActionLoading('deliver');
    setError('');
    try {
      await api.patch(`/api/complaints/${c._id}/mark-delivered`, { note: deliveryNote });
      setSuccess('Part/Unit marked as delivered successfully!');
      setDeliveryNote('');
      setTimeout(onUpdated, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark part as delivered.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedSCId) {
      setError('Please select a service centre.');
      return;
    }
    setActionLoading('reassign');
    setError('');
    try {
      await api.patch(`/api/complaints/${c._id}/assign`, { serviceCentreId: selectedSCId });
      setSuccess('Complaint reassigned successfully!');
      setTimeout(onUpdated, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reassign complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenPhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (reopenPhotos.length + files.length > 2) {
      alert('Maximum 2 reopen photos allowed.');
      e.target.value = null;
      return;
    }

    setUploadingPhotos(true);
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));
    try {
      const { data } = await api.post('/api/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReopenPhotos((prev) => [...prev, ...data.images.map((img) => img.url)]);
    } catch {
      setError('Photo upload failed. Please try again.');
    } finally {
      setUploadingPhotos(false);
      e.target.value = null;
    }
  };

  const handleReopen = async () => {
    if (!reopenNotes.trim()) {
      setError('Reopen notes are required.');
      return;
    }
    setActionLoading('reopen');
    setError('');
    try {
      const { data } = await api.post(`/api/complaints/${c._id}/reopen`, {
        reopenNotes: reopenNotes.trim(),
        reopenPhotos,
      });
      setSuccess(`Complaint reopened successfully as ${data.complaint.complaintId}!`);
      setTimeout(() => {
        onUpdated();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reopen complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderExpandedDetails = (comp, compUpdates, isCurrentActiveNode) => {
    const compInWarranty = comp.warrantyStatus === 'in_warranty';
    
    return (
      <div className="space-y-6 text-sm">
        {/* Status Tags */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full ${compInWarranty ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
            {compInWarranty ? '✅ In Warranty' : '⚠️ Out of Warranty'}
          </span>
          <span className="bg-secondary text-secondary-foreground text-[10.5px] font-medium px-2.5 py-0.5 rounded-full">
            {PRODUCT_LABELS[comp.product] || comp.product}
          </span>
        </div>

        {/* Assigned SC Info */}
        {comp.assignedCentreId && (
          <div className="rounded-lg border border-border p-3 bg-muted/20">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Assigned Service Centre</p>
            <p className="font-semibold text-xs">{comp.assignedCentreId.businessName}</p>
            <p className="text-xs text-muted-foreground">{comp.assignedCentreId.ownerName} · {comp.assignedCentreId.phone1}</p>
          </div>
        )}

        {/* Notes, Voice Notes, Photos */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-foreground border-b border-border pb-1">Notes & Media</p>
          {comp.notes && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Admin Note</p>
              <p className="text-xs bg-muted/40 p-2 rounded-lg mt-1">{comp.notes}</p>
            </div>
          )}
          {comp.voiceNoteUrl && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Voice Note</p>
              <audio src={comp.voiceNoteUrl} controls className="w-full max-h-10" />
            </div>
          )}
          {comp.adminPhotos?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Admin Photos</p>
              <div className="flex gap-2 flex-wrap">
                {comp.adminPhotos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded border border-border" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SC Submission Details */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-foreground border-b border-border pb-1">SC Submission Details</p>
          {comp.scNotes && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-blue-800 uppercase tracking-wide mb-1">SC Note</p>
              <p className="text-xs text-blue-900">{comp.scNotes}</p>
            </div>
          )}

          {/* Part Pending Details */}
          {(comp.partDetails || comp.status === 'part_pending' || comp.status === 'part_received') && (
            <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-semibold text-orange-800 uppercase tracking-wide">Part Sourcing Request</p>
              {comp.partDetails && (
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Requested Part / Unit:</span>
                  <p className="text-xs font-semibold text-orange-950">{comp.partDetails}</p>
                </div>
              )}
              {comp.partPendingVoiceUrl && (
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Voice Explanation:</span>
                  <audio src={comp.partPendingVoiceUrl} controls className="w-full max-h-8 mt-1" />
                </div>
              )}
              {/* Delivery Tracking */}
              <div className="text-[11px] pt-1.5 border-t border-orange-200/60 space-y-1">
                <div>
                  <span className="font-semibold">Delivery Status: </span>
                  {comp.partDeliveredAt ? (
                    <span className="text-green-700 font-medium">
                      Delivered by Admin on {new Date(comp.partDeliveredAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">Pending Sourcing / Dispatch</span>
                  )}
                </div>
                {comp.partDeliveredNote && (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Admin Delivery Note:</span>
                    <p className="text-xs italic text-muted-foreground">"{comp.partDeliveredNote}"</p>
                  </div>
                )}
                {comp.partDeliveredAt && (
                  <div>
                    <span className="font-semibold">SC Receipt: </span>
                    {comp.partReceivedAt ? (
                      <span className="text-green-700 font-medium">
                        Confirmed Received on {new Date(comp.partReceivedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">Awaiting receipt confirmation from SC</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Not Done Details */}
          {(comp.notDoneReason || comp.notDoneVoiceUrl) && (
            <div className="bg-red-50/40 border border-red-100 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-semibold text-red-800 uppercase tracking-wide">Not Done Details</p>
              {comp.notDoneReason && (
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Reason:</span>
                  <p className="text-xs text-red-950">{comp.notDoneReason}</p>
                </div>
              )}
              {comp.notDoneVoiceUrl && (
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Voice Explanation:</span>
                  <audio src={comp.notDoneVoiceUrl} controls className="w-full max-h-8 mt-1" />
                </div>
              )}
            </div>
          )}

          {/* Done Execution Metrics */}
          {(comp.totalVisits != null || comp.distanceTravelled != null || comp.doneVoiceUrl) && (
            <div className="bg-muted/40 border border-border rounded-lg p-3 space-y-1.5 text-xs">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Done Execution Metrics</p>
              {comp.totalVisits != null && (
                <p><span className="text-muted-foreground">Total Visits:</span> <strong>{comp.totalVisits}</strong></p>
              )}
              {comp.distanceTravelled != null && (
                <p><span className="text-muted-foreground">Distance Travelled:</span> <strong>{comp.distanceTravelled} km</strong></p>
              )}
              {comp.doneVoiceUrl && (
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Done Voice Explanation:</span>
                  <audio src={comp.doneVoiceUrl} controls className="w-full max-h-8 mt-1" />
                </div>
              )}
            </div>
          )}

          {!compInWarranty && comp.customerPaymentAmount > 0 && (
            <div className="bg-green-50/50 border border-green-100 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-green-800 uppercase tracking-wide mb-1">Customer Payment Collected</p>
              <p className="text-base font-bold text-green-900">₹{comp.customerPaymentAmount}</p>
            </div>
          )}

          {comp.proofPhotos?.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Proof Photos</p>
              <div className="flex gap-2 flex-wrap">
                {comp.proofPhotos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt="" className="w-20 h-20 object-cover rounded border border-border" />
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No proof photos uploaded.</p>
          )}
        </div>

        {/* Petrol Review (Warranty only) */}
        {compInWarranty && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground border-b border-border pb-1">Petrol History</p>
            <PetrolEditField
              petrolAdmin={comp.petrolAdmin}
              petrolSC={comp.petrolSC}
              petrolFinal={isCurrentActiveNode ? petrolFinal : comp.petrolFinal}
              editCount={comp.petrolEditCount}
              locked={isCurrentActiveNode ? comp.petrolLocked : true}
              userRole={isCurrentActiveNode ? "admin" : "readonly"}
              onSave={(val) => {
                if (isCurrentActiveNode) setPetrolFinal(val);
              }}
            />
          </div>
        )}

        {/* Extra Charges */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground border-b border-border pb-1">Extra Charges</p>
          <ExtraChargesList 
            complaintId={comp._id} 
            extraCharges={comp.extraCharges} 
            onUpdate={() => {
              setRefreshTick(t => t + 1);
            }} 
            readOnly={!isCurrentActiveNode}
          />
        </div>

        {/* Bill Summary (Only if Closed) */}
        {comp.status === 'closed' && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground border-b border-border pb-1">Invoice Details</p>
            <BillSummary complaint={comp} />
          </div>
        )}

        {/* Status Timeline */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground border-b border-border pb-1">Activity Timeline</p>
          <StatusTimeline updates={compUpdates} />
        </div>
      </div>
    );
  };

  const productInfo = c?.trackingId || {};
  const latestCustomerName = productInfo.customerName || c?.customerName;
  const latestPhone1 = productInfo.phone1 || c?.phone1;
  const latestPhone2 = productInfo.phone2 || c?.phone2;
  const latestAddress = productInfo.localAddress || c?.localAddress;
  const latestCity = productInfo.city || c?.city;
  const latestDistrict = productInfo.district || c?.district;
  const latestState = productInfo.state || c?.state;
  const latestTrackingId = productInfo.trackingId || c?.trackingId;
  const latestSerialNumber = productInfo.serialNumber || c?.serialNumber;
  // const latestProduct = productInfo.product || c?.product;
  const latestWarrantyStatus = productInfo.warrantyStatus || c?.warrantyStatus;
  const latestWarrantySource = productInfo.warrantySource || c?.warrantySource;
  const latestBillDate = productInfo.billDate || c?.billDate;
  const latestWarrantyExpiryDate = productInfo.warrantyExpiryDate || c?.warrantyExpiryDate;
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

  const timelineItems = productTimeline.length > 0 ? productTimeline : (c ? [{
    complaintId: c._id,
    mvId: c.complaintId,
    type: c.complaintType || 'complaint',
    status: c.status,
    date: c.createdAt,
    isCurrent: true
  }] : []);

  const handleRegisterNewComplaint = () => {
    navigate('/admin/new-complaint', {
      state: {
        prefill: {
          customerName: latestCustomerName,
          phone1: latestPhone1,
          phone2: latestPhone2,
          localAddress: latestAddress,
          city: latestCity,
          district: latestDistrict,
          state: latestState,
          trackingId: latestTrackingId,
          serialNumber: latestSerialNumber,
          product: productInfo.product || c?.product || '',
          warrantyStatus: productInfo.warrantyStatus || c?.warrantyStatus || '',
          billPhoto: productInfo.billPhoto || c?.billPhoto || '',
          billDate: productInfo.billDate || c?.billDate || '',
        }
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-background shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-muted-foreground font-mono">
              {displayTrackingId ? `Product: ${displayTrackingId}` : `Job ID: ${c?.complaintId}`}
            </p>
            <h2 className="text-lg font-bold text-foreground">
              {latestCustomerName}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>

        <div className="flex-1 p-6 space-y-8">
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

              {/* Current Warranty Status */}
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Current Warranty Status</span>
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

          {/* Unified Product Lifecycle Timeline */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-foreground border-b border-border pb-2 uppercase tracking-wide">
              Product History & Timeline
            </h3>
            <div className="relative border-l-2 border-border ml-3 pl-6 space-y-6">
              {timelineItems.map((item) => {
                const isCurrent = String(item.complaintId) === String(c?._id);
                const isExpanded = expandedComplaintId === String(item.complaintId);
                
                let nodeDetails;
                let nodeUpdates;
                let isNodeLoading = false;
                
                if (isCurrent) {
                  nodeDetails = c;
                  nodeUpdates = updates;
                } else {
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
                          : 'border-border bg-card hover:bg-muted/10'
                      }`}
                    >
                      {/* Node Header */}
                      <div 
                        onClick={() => handleToggleExpand(String(item.complaintId))}
                        className="p-3.5 flex justify-between items-center cursor-pointer select-none"
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
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted uppercase text-foreground">
                            {(item.status || 'new').replace(/_/g, ' ')}
                          </span>
                          <span className="text-muted-foreground text-xs font-bold w-4 text-center">
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {/* Node Details */}
                      {isExpanded && (
                        <div className="border-t border-border p-4 space-y-6 bg-background/40 rounded-b-xl">
                          {isNodeLoading ? (
                            <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                              Loading job details...
                            </div>
                          ) : nodeDetails ? (
                            renderExpandedDetails(nodeDetails, nodeUpdates, isCurrent)
                          ) : (
                            <div className="py-4 text-center text-xs text-red-600 font-semibold">
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

          {/* Quick Action: Register New Complaint */}
          <div className="pt-4 border-t border-border">
            <button
              onClick={handleRegisterNewComplaint}
              className="w-full py-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              ➕ Register New Complaint for this Product
            </button>
          </div>

          {/* Admin Decision Actions (For Current Complaint) */}
          {canConfirmOrDispute ? (
            <div className="pt-6 border-t border-border space-y-6">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                Admin Decision (Current Job: {c.complaintId})
              </h3>
              
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
                  className="w-full py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition text-sm"
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
                  className="w-full py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 transition text-sm"
                >
                  {actionLoading === 'dispute' ? 'Disputing...' : '✕ Dispute Job'}
                </button>
              </div>
            </div>
          ) : c.status === 'part_pending' ? (
            <div className="pt-6 border-t border-border space-y-6">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                Part Sourcing & Delivery (Current Job)
              </h3>
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
              {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">{success}</p>}

              {!c.partDeliveredAt ? (
                <div className="space-y-3 p-4 bg-orange-50/50 rounded-xl border border-orange-200">
                  <label className="block text-xs font-semibold text-orange-800 uppercase tracking-wide mb-1">
                    Mark Part/Unit as Delivered to SC
                  </label>
                  <textarea
                    placeholder="Enter delivery details, courier tracking info, or notes (Optional)..."
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    className={`${inputCls} border-orange-200 focus:ring-orange-500`}
                    rows={2}
                  />
                  <button
                    onClick={handleMarkDelivered}
                    disabled={!!actionLoading}
                    className="w-full py-2.5 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50 transition text-sm"
                  >
                    {actionLoading === 'deliver' ? 'Updating...' : '🚚 Mark as Delivered'}
                  </button>
                </div>
              ) : (
                <div className="bg-green-50/50 border border-green-200 rounded-xl p-4 text-xs text-green-800 space-y-1">
                  <p className="font-semibold text-sm">🚚 Delivered to SC</p>
                  <p>Admin marked the part as delivered on {new Date(c.partDeliveredAt).toLocaleString()}.</p>
                  {c.partDeliveredNote && <p className="italic">"Note: {c.partDeliveredNote}"</p>}
                  <p className="mt-2 text-muted-foreground">Awaiting Service Centre confirmation of receipt to resume the job.</p>
                </div>
              )}
            </div>
          ) : ['new', 'assigned', 'rejected_by_sc'].includes(c?.status) ? (
            <div className="pt-6 border-t border-border space-y-4">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                Reassign Service Centre (Current Job)
              </h3>
              
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
              {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">{success}</p>}

              {loadingCandidates ? (
                <p className="text-sm text-muted-foreground animate-pulse">Loading matching service centres...</p>
              ) : candidates.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800">
                  No active service centres found for <strong>{c?.city}</strong> or <strong>{c?.district}</strong> matching capability.
                </div>
              ) : (
                <div className="space-y-3">
                  <label className={labelCls}>Select Service Centre</label>
                  <select
                    value={selectedSCId}
                    onChange={(e) => setSelectedSCId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">-- Choose Service Centre --</option>
                    {candidates.map((sc) => (
                      <option key={sc._id} value={sc._id}>
                        {sc.businessName} ({sc.city} - {sc.ownerName})
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={handleReassign}
                    disabled={!!actionLoading || !selectedSCId}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition text-sm"
                  >
                    {actionLoading === 'reassign' ? 'Reassigning...' : 'Reassign Service Centre'}
                  </button>
                </div>
              )}
            </div>
          ) : isReopenEligible ? (
            <div className="pt-6 border-t border-border space-y-6">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                Reopen Complaint (Current Job)
              </h3>
              
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
              {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">{success}</p>}

              <div className="space-y-3 p-4 bg-yellow-50/50 rounded-xl border border-yellow-200">
                <label className="block text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1">
                  Describe Reopen Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Describe why this complaint is being reopened (Required)..."
                  value={reopenNotes}
                  onChange={(e) => setReopenNotes(e.target.value)}
                  className={`${inputCls} border-yellow-300 focus:ring-yellow-400 text-xs`}
                  rows={3}
                />
                
                <div>
                  <label className="block text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1">
                    Reopen Photos (Optional, max 2)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReopenPhotoUpload}
                    disabled={uploadingPhotos || reopenPhotos.length >= 2}
                    className="text-xs text-yellow-800 mt-1"
                  />
                  {uploadingPhotos && <p className="text-xs text-yellow-700 mt-1">Uploading...</p>}
                  {reopenPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {reopenPhotos.map((url, i) => (
                        <img key={i} src={url} alt={`reopen-${i}`} className="w-12 h-12 rounded object-cover border border-yellow-300" />
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleReopen}
                  disabled={!!actionLoading || uploadingPhotos}
                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold disabled:opacity-50 transition text-sm"
                >
                  {actionLoading === 'reopen' ? 'Reopening...' : '⚠️ Confirm & Reopen'}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-6 border-t border-border">
              <div className="bg-muted p-4 rounded-xl text-center">
                <p className="text-xs font-semibold text-foreground">Action not available</p>
                <p className="text-[10px] text-muted-foreground mt-1">This complaint is in '{c?.status.replace(/_/g, ' ')}' status.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
