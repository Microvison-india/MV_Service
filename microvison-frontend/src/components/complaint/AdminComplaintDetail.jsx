import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import ExtraChargesList from './ExtraChargesList';
import ImageUploader from '../forms/ImageUploader';
import StatusTimeline from './StatusTimeline';
import PetrolEditField from './PetrolEditField';
import BillSummary from './BillSummary';

// GRD Section 11.1 / TBP Phase 9
// Admin slide-out review panel for a complaint.
// Allows Admin to view SC work, approve extras, confirm/dispute the job, and edit final petrol.

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';

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
  const [petrolAdmin, setPetrolAdmin] = useState('');
  const [petrolSC, setPetrolSC] = useState('');
  const [adminExtraCharges, setAdminExtraCharges] = useState([]);
  const [isEditingExtraCharges, setIsEditingExtraCharges] = useState(false);
  const [savingExtraCharges, setSavingExtraCharges] = useState(false);
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
  const reopenPhotos = [];

  // Phase 21: Closing Check States
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [fillValues, setFillValues] = useState({
    billDate: '',
    billPhoto: '',
    shopName: '',
    serialNumber: '',
    modelNumber: '',
  });
  const [bypassedFields, setBypassedFields] = useState({
    billDate: false,
    billPhoto: false,
    shopName: false,
    serialNumber: false,
    modelNumber: false,
  });
  const [modalError, setModalError] = useState('');

  // Edit states for Product Registry (Phase 21)
  const [editSerialNumber, setEditSerialNumber] = useState('');
  const [editModelNumber, setEditModelNumber] = useState('');
  const [editShopName, setEditShopName] = useState('');
  const [editBillDate, setEditBillDate] = useState('');
  const [editBillPhoto, setEditBillPhoto] = useState('');
  const [showProductEditor, setShowProductEditor] = useState(false);

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
    let isFirst = true;
    const fetchDetail = async () => {
      // Intentionally NOT calling setLoading(true) synchronously here to satisfy React compiler.
      // The initial state of loading is already true.
      try {
        const { data } = await api.get(`/api/complaints/${complaintId}`);
        if (active) {
          setC(data.complaint);
          setUpdates(data.updates);
          setProductTimeline(data.productTimeline || []);
          if (isFirst) {
            setPetrolFinal(data.complaint.petrolFinal ?? '');
            setPetrolAdmin(data.complaint.petrolAdmin ?? '');
            setPetrolSC(data.complaint.petrolSC ?? '');
            setAdminExtraCharges(data.complaint.extraCharges || []);

            // Set product editor values
            const prod = data.complaint.trackingId || {};
            setEditSerialNumber(prod.serialNumber || '');
            setEditModelNumber(prod.modelNumber || '');
            setEditShopName(prod.shopName || '');
            setEditBillDate(prod.billDate ? prod.billDate.split('T')[0] : '');
            setEditBillPhoto(prod.billPhoto || '');

            isFirst = false;
          } else if (!isEditingExtraCharges && data.complaint.status !== 'done') {
            setPetrolAdmin(data.complaint.petrolAdmin ?? '');
            setPetrolSC(data.complaint.petrolSC ?? '');
            setAdminExtraCharges(data.complaint.extraCharges || []);

            if (!showProductEditor) {
              const prod = data.complaint.trackingId || {};
              setEditSerialNumber(prod.serialNumber || '');
              setEditModelNumber(prod.modelNumber || '');
              setEditShopName(prod.shopName || '');
              setEditBillDate(prod.billDate ? prod.billDate.split('T')[0] : '');
              setEditBillPhoto(prod.billPhoto || '');
            }
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

    const intervalId = setInterval(fetchDetail, 5000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [complaintId, refreshTick, isEditingExtraCharges]);

  // Fetch candidate Service Centres for reassignment
  useEffect(() => {
    let active = true;
    if (c && ['unassigned', 'new', 'assigned', 'rejected_by_sc'].includes(c.status)) {
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
      <div className="fixed inset-y-0 right-0 w-full max-w-3xl bg-background shadow-2xl flex items-center justify-center z-50">
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
      // 1. Get latest complaint details to check product fields
      const { data: latestData } = await api.get(`/api/complaints/${c._id}`);
      const latestComplaint = latestData.complaint;
      const productObj = latestComplaint?.trackingId;

      if (productObj) {
        const missing = [];
        if (!productObj.billDate) missing.push('billDate');
        if (!productObj.billPhoto) missing.push('billPhoto');
        if (!productObj.shopName) missing.push('shopName');
        if (!productObj.serialNumber) missing.push('serialNumber');
        if (!productObj.modelNumber) missing.push('modelNumber');

        // If there are missing fields and the warning modal is not shown yet, open it
        if (missing.length > 0 && !showWarningModal) {
          setMissingFields(missing);
          // Prefill values from SC uploaded files if present to help admin
          setFillValues({
            billDate: '',
            billPhoto: latestComplaint.scBillPhotoUrl || '',
            shopName: '',
            serialNumber: '',
            modelNumber: '',
          });
          setBypassedFields({
            billDate: false,
            billPhoto: false,
            shopName: false,
            serialNumber: false,
            modelNumber: false,
          });
          setModalError('');
          setShowWarningModal(true);
          setActionLoading(false);
          return;
        }

        // If warning modal is shown, validate that everything is handled (either filled or bypassed)
        if (showWarningModal) {
          const unhandled = [];
          missing.forEach(f => {
            if (!fillValues[f] && !bypassedFields[f]) {
              unhandled.push(f);
            }
          });
          if (unhandled.length > 0) {
            setModalError(`Please fill or bypass all missing fields: ${unhandled.join(', ')}`);
            setActionLoading(false);
            return;
          }
        }
      }

      // Build payload body
      const body = { 
        note: adminNote,
        extraCharges: adminExtraCharges
      };
      if (isInWarranty && !c.petrolLocked) {
        if (petrolAdmin !== '' && petrolAdmin !== null && petrolAdmin !== undefined) {
          body.petrolAdmin = Number(petrolAdmin);
        }
        if (petrolSC !== '' && petrolSC !== null && petrolSC !== undefined) {
          body.petrolSC = Number(petrolSC);
        }
        if (petrolFinal !== '' && petrolFinal !== null && petrolFinal !== undefined) {
          body.petrolFinal = Number(petrolFinal);
        }
      }

      // Append filled values & bypass array if warning modal is active
      if (showWarningModal) {
        missingFields.forEach(f => {
          if (fillValues[f]) {
            body[f] = fillValues[f];
          }
        });
        const bypassedArray = [];
        missingFields.forEach(f => {
          if (bypassedFields[f] && !fillValues[f]) {
            bypassedArray.push(f);
          }
        });
        body.missingFieldsBypassed = bypassedArray;
      }

      await api.patch(`/api/complaints/${c._id}/confirm-done`, body);
      setSuccess('Job confirmed and closed successfully!');
      setShowWarningModal(false);
      setTimeout(onUpdated, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm job.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveExtraCharges = async () => {
    setSavingExtraCharges(true);
    setError('');
    try {
      await api.patch(`/api/complaints/${c._id}/extra-charges`, { extraCharges: adminExtraCharges });
      setSuccess('Extra charges updated successfully!');
      setIsEditingExtraCharges(false);
      setRefreshTick(t => t + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save extra charges.');
    } finally {
      setSavingExtraCharges(false);
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

  const handleSaveProductDetails = async () => {
    setActionLoading('saveProduct');
    setError('');
    setSuccess('');
    try {
      await api.put(`/api/products/${displayTrackingId}`, {
        serialNumber: editSerialNumber,
        modelNumber: editModelNumber,
        shopName: editShopName,
        billDate: editBillDate,
        billPhoto: editBillPhoto,
      });
      setSuccess('Product registry details updated successfully!');
      setShowProductEditor(false);
      setRefreshTick(t => t + 1); // trigger reload
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product details.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderExpandedDetails = (comp, compUpdates, isCurrentActiveNode) => {
    const compInWarranty = comp.warrantyStatus === 'in_warranty';

    // Find parent job if it was reopened
    const parentItem = comp.isReopened && comp.reopenParentId
      ? productTimeline.find(item => String(item.complaintId) === String(comp.reopenParentId))
      : null;

    // Find child job if this job was reopened into another one
    const childItem = productTimeline.find(item => String(item.reopenParentId) === String(comp._id));

    return (
      <div className="space-y-6 text-sm">
        {/* Status Tags */}
        <div className="flex flex-wrap gap-2.5 mb-1">
          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${compInWarranty ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
            {compInWarranty ? '✅ In Warranty' : '⚠️ Out of Warranty'}
          </span>
          <span className="bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            {PRODUCT_LABELS[comp.product] || comp.product}
          </span>
          {comp.complaintType && (
            <span className="bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              📋 {comp.complaintType}
            </span>
          )}
        </div>

        {/* Section 1: Job Context & Admin Info (Static Card) */}
        <div className="border border-border/80 rounded-xl bg-card p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <span className="text-base">🔍</span>
            <span className="font-bold text-xs uppercase tracking-wider text-foreground">Job Context & Admin Parameters</span>
          </div>

          {/* Reopen Connections */}
          {parentItem && (
            <div className="bg-yellow-50/70 border border-yellow-200 rounded-xl p-3.5 flex items-center gap-2 text-yellow-800 text-xs font-semibold">
              <span>⚠️ Reopened from Parent Job:</span>
              <strong className="text-yellow-950 underline">{parentItem.mvId}</strong>
            </div>
          )}
          {childItem && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-center gap-2 text-blue-800 text-xs font-semibold">
              <span>🔄 Reopened as Child Job:</span>
              <strong className="text-blue-950 underline">{childItem.mvId}</strong>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {comp.assignedCentreId && (
              <div className="rounded-xl border border-border p-4 bg-muted/20 sm:col-span-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Assigned Service Centre</p>
                <p className="font-semibold text-sm text-foreground">{comp.assignedCentreId.businessName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {comp.assignedCentreId.ownerName} · {comp.assignedCentreId.phone1}
                </p>
              </div>
            )}

            {comp.notes && (
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Admin Notes</p>
                <p className="text-sm bg-muted/40 p-3.5 rounded-xl border border-border/50 text-foreground leading-relaxed">{comp.notes}</p>
              </div>
            )}

            {comp.voiceNoteUrl && (
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Voice Note from Admin</p>
                <audio src={comp.voiceNoteUrl} controls className="w-full max-h-9" />
              </div>
            )}

            {comp.adminPhotos?.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Admin Reference Photos</p>
                <div className="flex gap-2.5 flex-wrap">
                  {comp.adminPhotos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="hover:scale-[1.02] transition">
                      <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-border" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Preset & Petrol estimates (Given by Admin) */}
            <div className="rounded-xl border border-border p-3.5 bg-muted/10">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Preset Details</span>
              <p className="text-sm font-semibold text-foreground">{comp.presetName || 'Default Preset'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Base Price: ₹{comp.presetPrice ?? 0}</p>
            </div>

            <div className="rounded-xl border border-border p-3.5 bg-muted/10">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Petrol Estimate (Admin)</span>
              <p className="text-sm font-semibold text-foreground">₹{comp.petrolAdmin != null ? comp.petrolAdmin : '—'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Initial estimated allowance</p>
            </div>
          </div>
        </div>

        {/* Section 2: Activity Timeline (collapsible updates) */}
        <div className="border border-border/80 rounded-xl bg-card p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <span className="text-base">📜</span>
            <span className="font-bold text-xs uppercase tracking-wider text-foreground">Activity Timeline & SC Work</span>
          </div>
          <StatusTimeline updates={compUpdates} complaint={comp} />
        </div>

        {/* Section 3: Financials & Pricing (Bottom Card - Conditional) */}
        {(comp.status === 'done' || comp.status === 'closed') && (
          <div className="border border-border/80 rounded-xl bg-card p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <span className="text-base">💰</span>
              <span className="font-bold text-xs uppercase tracking-wider text-foreground">Financials & Settlement</span>
            </div>

            {!compInWarranty && comp.customerPaymentAmount > 0 && (
              <div className="bg-green-50/50 border border-green-100 rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-green-800 uppercase tracking-wider">Payment Collected</span>
                  <p className="text-xs text-muted-foreground">Amount collected directly from customer (OOW)</p>
                </div>
                <p className="text-lg font-black text-green-900">₹{comp.customerPaymentAmount}</p>
              </div>
            )}

            {/* Petrol */}
            {compInWarranty && (
              <div className="bg-muted/20 border border-border/60 rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Petrol Allowance History</span>
                <PetrolEditField
                  petrolAdmin={comp.petrolAdmin}
                  petrolSC={comp.petrolSC}
                  petrolFinal={isCurrentActiveNode ? petrolFinal : comp.petrolFinal}
                  editCount={comp.petrolEditCount}
                  locked={true}
                  userRole="readonly"
                  onSave={() => {}}
                />
              </div>
            )}

            {/* Extra Charges */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Extra Charges</span>
                {isCurrentActiveNode && comp.status !== 'closed' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditingExtraCharges) {
                        setAdminExtraCharges(comp.extraCharges || []);
                      }
                      setIsEditingExtraCharges(!isEditingExtraCharges);
                    }}
                    className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider px-2 py-0.5 bg-primary/10 rounded transition"
                  >
                    {isEditingExtraCharges ? 'Cancel Edit' : 'Manage Charges'}
                  </button>
                )}
              </div>

              {isCurrentActiveNode && isEditingExtraCharges ? (
                <div className="bg-muted/30 border border-border p-3.5 rounded-xl space-y-3">
                  {/* List of Extra charges */}
                  {adminExtraCharges.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {adminExtraCharges.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-background p-2.5 rounded-lg border border-border gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-grow">
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => {
                                const newLabel = e.target.value;
                                setAdminExtraCharges(prev => prev.map((ec, i) => i === idx ? { ...ec, label: newLabel } : ec));
                              }}
                              className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring flex-grow"
                              placeholder="Description"
                            />
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => {
                                const newAmount = e.target.value === '' ? '' : Number(e.target.value);
                                setAdminExtraCharges(prev => prev.map((ec, i) => i === idx ? { ...ec, amount: newAmount } : ec));
                              }}
                              className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-20 shrink-0"
                              placeholder="Amount"
                            />
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                              item.requestedBy === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.requestedBy}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={item.status}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                setAdminExtraCharges(prev => prev.map((ec, i) => i === idx ? { ...ec, status: newStatus } : ec));
                              }}
                              className="bg-background border border-border text-[10px] rounded px-1.5 py-1 font-bold text-foreground focus:outline-none"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            
                            <button
                              type="button"
                              onClick={() => setAdminExtraCharges(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition font-bold"
                              title="Delete charge"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No extra charges requested.</p>
                  )}

                  {/* Add new extra charge form */}
                  <div className="flex gap-2 items-center pt-1">
                    <input
                      type="text"
                      id="admin-inline-extra-label"
                      placeholder="Add item label..."
                      className="rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring flex-grow"
                    />
                    <input
                      type="number"
                      id="admin-inline-extra-amount"
                      placeholder="₹"
                      className="rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-20 shrink-0"
                    />
                    <select
                      id="admin-inline-extra-requested-by"
                      className="bg-background border border-border text-xs rounded-lg px-2 py-1.5 font-semibold text-foreground focus:outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="sc">SC</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const lbl = document.getElementById('admin-inline-extra-label')?.value || '';
                        const amt = document.getElementById('admin-inline-extra-amount')?.value || '';
                        const reqBy = document.getElementById('admin-inline-extra-requested-by')?.value || 'admin';
                        if (lbl.trim() && amt && !isNaN(Number(amt))) {
                          setAdminExtraCharges(prev => [...prev, {
                            label: lbl.trim(),
                            amount: Number(amt),
                            requestedBy: reqBy,
                            status: 'approved'
                          }]);
                          document.getElementById('admin-inline-extra-label').value = '';
                          document.getElementById('admin-inline-extra-amount').value = '';
                        }
                      }}
                      className="px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-semibold whitespace-nowrap"
                    >
                      + Add Charge
                    </button>
                  </div>

                  {/* Save button */}
                  <button
                    type="button"
                    onClick={handleSaveExtraCharges}
                    disabled={savingExtraCharges}
                    className="w-full py-2 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition rounded-lg text-xs font-bold uppercase tracking-wider"
                  >
                    {savingExtraCharges ? 'Saving Changes...' : '✓ Save Extra Charges'}
                  </button>
                </div>
              ) : (
                <ExtraChargesList 
                  complaintId={comp._id} 
                  extraCharges={comp.extraCharges} 
                  onUpdate={() => {
                    setRefreshTick(t => t + 1);
                  }} 
                  readOnly={!isCurrentActiveNode}
                />
              )}
            </div>

            {/* Bill Summary */}
            {comp.status === 'closed' && (
              <div className="pt-2">
                <BillSummary complaint={comp} />
              </div>
            )}
          </div>
        )}
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

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-background shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-8 py-5 flex items-center justify-between z-10 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                c.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                c.status === 'done' ? 'bg-green-100 text-green-800' :
                c.status === 'part_pending' ? 'bg-orange-100 text-orange-800' :
                c.status === 'part_received' ? 'bg-emerald-100 text-emerald-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {c.status.replace(/_/g, ' ')}
              </span>
              <p className="text-xs text-muted-foreground font-mono font-semibold">
                {displayTrackingId ? `Product: ${displayTrackingId}` : `Job ID: ${c?.complaintId}`}
              </p>
            </div>
            <h2 className="text-xl font-black text-foreground mt-1.5">
              {latestCustomerName}
            </h2>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-muted transition text-muted-foreground hover:text-foreground text-2xl">✕</button>
        </div>

        {/* Scrollable drawer body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 pb-40">
          
          {/* Customer & Product Profile (Static Card) */}
          <div className="border border-border/80 rounded-xl bg-card p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3 mb-1">
              <span className="text-base">📋</span>
              <span className="font-bold text-xs uppercase tracking-wider text-foreground">Customer & Product Profile</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              {/* Customer Name */}
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Customer Name</span>
                <p className="font-bold text-base text-foreground">{latestCustomerName || '—'}</p>
              </div>

              {/* Phone No */}
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Phone No</span>
                <p className="font-bold text-base text-foreground">
                  {latestPhone1 || '—'}{latestPhone2 ? ` / ${latestPhone2}` : ''}
                </p>
              </div>

              {/* Address */}
              <div className="sm:col-span-2 space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Address</span>
                <p className="font-semibold text-foreground leading-relaxed">
                  {latestAddress || '—'}
                  {(latestCity || latestDistrict || latestState) ? `, ${[latestCity, latestDistrict, latestState].filter(Boolean).join(', ')}` : ''}
                </p>
              </div>

              {/* Current Warranty Status */}
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Current Warranty Status</span>
                <div className="pt-0.5">
                  <span className={`inline-block font-bold px-3 py-1 rounded-full text-xs uppercase ${
                    latestWarrantyStatus === 'in_warranty' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {latestWarrantyStatus === 'in_warranty' ? '✅ In Warranty' : '⚠️ Out of Warranty'}
                  </span>
                  {latestWarrantySource === 'manual' && (
                    <span className="ml-2.5 inline-block bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full text-xs uppercase">
                      Manual
                    </span>
                  )}
                </div>
              </div>

              {/* Bill Date */}
              {latestBillDate && (
                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Bill Date</span>
                  <p className="font-semibold text-foreground">{formatDate(latestBillDate)}</p>
                </div>
              )}

              {/* Expiry Date */}
              {latestWarrantyExpiryDate && (
                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Warranty Expiry Date</span>
                  <p className="font-semibold text-foreground">{formatDate(latestWarrantyExpiryDate)}</p>
                </div>
              )}

              {/* Serial Number */}
              {latestSerialNumber && (
                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Serial Number</span>
                  <p className="font-mono text-foreground font-bold">{latestSerialNumber}</p>
                </div>
              )}
            </div>

            {/* Show shop name and model number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm pt-3 border-t border-border/40">
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Shop Name</span>
                <p className="font-semibold text-foreground">{productInfo.shopName || '—'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Model Number</span>
                <p className="font-semibold text-foreground">{productInfo.modelNumber || '—'}</p>
              </div>
              {productInfo.warrantyForceReason && (
                <div className="sm:col-span-2 space-y-1">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs text-amber-700">Force Override Reason</span>
                  <p className="font-medium text-amber-800 dark:text-amber-300 italic">"{productInfo.warrantyForceReason}"</p>
                </div>
              )}
              {c.locationText && (
                <div className="sm:col-span-2 space-y-1">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Location / Maps Link</span>
                  <p className="font-medium text-foreground bg-muted/40 p-2.5 rounded-lg border text-xs break-all">
                    {c.locationText.startsWith('http') ? (
                      <a href={c.locationText} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">
                        {c.locationText}
                      </a>
                    ) : c.locationText}
                  </p>
                </div>
              )}
            </div>

            {/* Persistent Bypassed Fields Warning Badge */}
            {productInfo.missingFieldsWarning && productInfo.missingFieldsWarning.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-xl p-3.5 text-yellow-800 dark:text-yellow-300 text-xs font-semibold flex items-center gap-2">
                <span>⚠️ Missing fields bypassed in registry: <strong>{productInfo.missingFieldsWarning.join(', ')}</strong></span>
              </div>
            )}

            {/* SC Uploaded Photo displays */}
            {(c.scBillPhotoUrl || c.scSerialSlipPhotoUrl) && (
              <div className="pt-3 border-t border-border/40 space-y-3">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs block">SC Uploaded Proofs</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {c.scBillPhotoUrl && (
                    <div className="border rounded-xl p-3 bg-muted/20 space-y-2">
                      <span className="text-xs font-semibold text-foreground block">Uploaded Bill Photo:</span>
                      <a href={c.scBillPhotoUrl} target="_blank" rel="noreferrer" className="block relative aspect-video bg-muted rounded-lg overflow-hidden border">
                        <img src={c.scBillPhotoUrl} alt="SC Uploaded Bill" className="object-cover w-full h-full" />
                      </a>
                    </div>
                  )}
                  {c.scSerialSlipPhotoUrl && (
                    <div className="border rounded-xl p-3 bg-muted/20 space-y-2">
                      <span className="text-xs font-semibold text-foreground block">Uploaded Serial/Model sticker:</span>
                      <a href={c.scSerialSlipPhotoUrl} target="_blank" rel="noreferrer" className="block relative aspect-video bg-muted rounded-lg overflow-hidden border">
                        <img src={c.scSerialSlipPhotoUrl} alt="SC Uploaded Serial Sticker" className="object-cover w-full h-full" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Manage Product Registry collapsible button and editor */}
            <div className="pt-3 border-t border-border/40">
              <button
                type="button"
                onClick={() => setShowProductEditor(!showProductEditor)}
                className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground transition rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>⚙️</span> {showProductEditor ? 'Hide Registry Editor' : 'Edit Product Registry & Transcribe'}
              </button>

              {showProductEditor && (
                <div className="mt-4 p-4 border rounded-xl bg-card space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-muted-foreground mb-1">Serial Number</label>
                      <input
                        type="text"
                        value={editSerialNumber}
                        onChange={(e) => setEditSerialNumber(e.target.value)}
                        placeholder="Enter serial number"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-muted-foreground mb-1">Model Number / Variant</label>
                      <input
                        type="text"
                        value={editModelNumber}
                        onChange={(e) => setEditModelNumber(e.target.value)}
                        placeholder="Enter model number"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-muted-foreground mb-1">Shop / Dealer Name</label>
                      <input
                        type="text"
                        value={editShopName}
                        onChange={(e) => setEditShopName(e.target.value)}
                        placeholder="Enter dealer shop name"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-muted-foreground mb-1">Bill Date</label>
                      <input
                        type="date"
                        value={editBillDate}
                        onChange={(e) => setEditBillDate(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-muted-foreground mb-1">Bill / Invoice Photo Link</label>
                      {editBillPhoto ? (
                        <div className="flex items-center gap-2 border rounded-lg p-2 bg-muted/40">
                          <a href={editBillPhoto} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-xs font-medium">
                            View Current Bill Photo
                          </a>
                          <button type="button" onClick={() => setEditBillPhoto('')} className="text-red-500 font-bold ml-auto">Remove</button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {c.scBillPhotoUrl && (
                            <button
                              type="button"
                              onClick={() => setEditBillPhoto(c.scBillPhotoUrl)}
                              className="px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded font-bold text-[10px] uppercase tracking-wider mb-2"
                            >
                              ✓ Use SC Uploaded Bill Photo
                            </button>
                          )}
                          <ImageUploader
                            maxFiles={1}
                            uploadedUrls={[]}
                            onUpload={(urls) => setEditBillPhoto(urls[0] || '')}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveProductDetails}
                    disabled={actionLoading === 'saveProduct'}
                    className="w-full py-2.5 bg-primary text-primary-foreground font-bold hover:opacity-90 disabled:opacity-50 transition rounded-lg uppercase tracking-wider text-[10px]"
                  >
                    {actionLoading === 'saveProduct' ? 'Saving Details...' : '✓ Save Product Registry Details'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Unified Product Lifecycle Timeline (The Big Window) */}
          <div className="border border-border/80 rounded-xl bg-card p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3 mb-1">
              <span className="text-base">📜</span>
              <span className="font-bold text-xs uppercase tracking-wider text-foreground">Product Complaints & History</span>
            </div>
            
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
                    <div className={`absolute -left-[31px] top-3.5 w-3 h-3 rounded-full border-2 bg-background transition-colors ${
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
                        className="p-4 flex justify-between items-center cursor-pointer select-none"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-bold text-sm text-foreground">{item.mvId}</span>
                            <span className="text-[10px] uppercase bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full font-bold">
                              {item.type}
                            </span>
                            {isCurrent && (
                              <span className="bg-primary text-primary-foreground text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                                Current Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Registered on: <strong>{new Date(item.date).toLocaleDateString()}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted uppercase text-foreground">
                            {(item.status || 'new').replace(/_/g, ' ')}
                          </span>
                          <span className="text-muted-foreground text-xs font-bold w-4 text-center">
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {/* Node Details */}
                      {isExpanded && (
                        <div className="border-t border-border p-6 bg-background/40 rounded-b-xl">
                          {isNodeLoading ? (
                            <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
                              Loading job details...
                            </div>
                          ) : nodeDetails ? (
                            renderExpandedDetails(nodeDetails, nodeUpdates, isCurrent)
                          ) : (
                            <div className="py-4 text-center text-sm text-red-600 font-semibold">
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
          <div className="pt-2">
            <button
              onClick={handleRegisterNewComplaint}
              className="w-full py-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm"
            >
              ➕ Register New Complaint for this Product
            </button>
          </div>
        </div>

        {/* Sticky Bottom Actions Strip */}
        <div className="sticky bottom-0 bg-background border-t border-border p-6 shadow-2xl z-20 space-y-4">
          {canConfirmOrDispute ? (
            <div className="space-y-4">
              <p className="text-sm font-bold text-foreground uppercase tracking-wider">Admin Decision (Current Job: {c.complaintId})</p>
              
              {/* Petrol Verification Section (Warranty only) */}
              {isInWarranty && !c.petrolLocked && (
                <div className="bg-muted/40 border border-border p-4 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Petrol Allowance Verification</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">1st: Admin Estimate (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={petrolAdmin}
                        onChange={(e) => setPetrolAdmin(e.target.value)}
                        className={inputCls}
                        placeholder="Admin Estimate"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">2nd: SC Claim (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={petrolSC}
                        onChange={(e) => setPetrolSC(e.target.value)}
                        className={inputCls}
                        placeholder="SC Claim"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">3rd: Final Approved (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={petrolFinal}
                        onChange={(e) => setPetrolFinal(e.target.value)}
                        className={inputCls}
                        placeholder={petrolSC ? `Accept SC: ₹${petrolSC}` : petrolAdmin ? `Accept Admin: ₹${petrolAdmin}` : "Final Approved"}
                      />
                    </div>
                  </div>
                  
                  {/* Quick Action buttons */}
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPetrolFinal(petrolAdmin)}
                      className="px-2.5 py-1.5 rounded bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition"
                    >
                      Accept 1st (Admin: ₹{petrolAdmin || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPetrolFinal(petrolSC)}
                      className="px-2.5 py-1.5 rounded bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition"
                    >
                      Accept 2nd (SC: ₹{petrolSC || 0})
                    </button>
                  </div>
                </div>
              )}

              {/* Extra Charges Verification Section */}
              <div className="bg-muted/40 border border-border p-4 rounded-xl space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Extra Charges Verification & Adjustment</p>
                
                {/* List of Extra charges */}
                {adminExtraCharges.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {adminExtraCharges.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-background p-2.5 rounded-lg border border-border gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-grow">
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => {
                              const newLabel = e.target.value;
                              setAdminExtraCharges(prev => prev.map((ec, i) => i === idx ? { ...ec, label: newLabel } : ec));
                            }}
                            className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring flex-grow"
                            placeholder="Description"
                          />
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => {
                              const newAmount = e.target.value === '' ? '' : Number(e.target.value);
                              setAdminExtraCharges(prev => prev.map((ec, i) => i === idx ? { ...ec, amount: newAmount } : ec));
                            }}
                            className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-20 shrink-0"
                            placeholder="Amount"
                          />
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            item.requestedBy === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.requestedBy}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Approval status toggler */}
                          <select
                            value={item.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              setAdminExtraCharges(prev => prev.map((ec, i) => i === idx ? { ...ec, status: newStatus } : ec));
                            }}
                            className="bg-background border border-border text-[10px] rounded px-1.5 py-1 font-bold text-foreground focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          
                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setAdminExtraCharges(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition font-bold"
                            title="Delete charge"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No extra charges requested.</p>
                )}

                {/* Add new extra charge form */}
                <div className="flex gap-2 items-center pt-1">
                  <input
                    type="text"
                    id="admin-confirm-extra-label"
                    placeholder="Add item label..."
                    className="rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring flex-grow"
                  />
                  <input
                    type="number"
                    id="admin-confirm-extra-amount"
                    placeholder="₹"
                    className="rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-20 shrink-0"
                  />
                  <select
                    id="admin-confirm-extra-requested-by"
                    className="bg-background border border-border text-xs rounded-lg px-2 py-1.5 font-semibold text-foreground focus:outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="sc">SC</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const lbl = document.getElementById('admin-confirm-extra-label')?.value || '';
                      const amt = document.getElementById('admin-confirm-extra-amount')?.value || '';
                      const reqBy = document.getElementById('admin-confirm-extra-requested-by')?.value || 'admin';
                      if (lbl.trim() && amt && !isNaN(Number(amt))) {
                        setAdminExtraCharges(prev => [...prev, {
                          label: lbl.trim(),
                          amount: Number(amt),
                          requestedBy: reqBy,
                          status: 'approved'
                        }]);
                        document.getElementById('admin-confirm-extra-label').value = '';
                        document.getElementById('admin-confirm-extra-amount').value = '';
                      }
                    }}
                    className="px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-semibold whitespace-nowrap"
                  >
                    + Add Charge
                  </button>
                </div>
              </div>

              {/* Note and Confirm Trigger */}
              <div className="flex flex-col sm:flex-row gap-3 items-center w-full pb-2">
                <input
                  type="text"
                  placeholder="Optional confirmation note..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className={`${inputCls} text-sm py-2.5 px-4 flex-grow`}
                />
                <button
                  onClick={handleConfirm}
                  disabled={!!actionLoading}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-green-700 disabled:opacity-50 transition whitespace-nowrap shrink-0"
                >
                  {actionLoading === 'confirm' ? '...' : '✓ Confirm'}
                </button>
              </div>

              {/* Separation boundary & Dispute row */}
              <div className="border-t border-border pt-4">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Dispute Job (Return to SC)</p>
                <div className="flex gap-2.5 w-full">
                  <input
                    type="text"
                    placeholder="Reason for dispute (Required)..."
                    value={disputeNote}
                    onChange={(e) => setDisputeNote(e.target.value)}
                    className={`${inputCls} border-red-200 focus:ring-red-500 text-sm py-2.5 px-4 flex-grow`}
                  />
                  <button
                    onClick={handleDispute}
                    disabled={!!actionLoading || !disputeNote.trim()}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 transition whitespace-nowrap shrink-0"
                  >
                    {actionLoading === 'dispute' ? '...' : '✕ Dispute'}
                  </button>
                </div>
              </div>
            </div>
          ) : c.status === 'part_pending' ? (
            <div className="space-y-3">
              <p className="text-sm font-bold text-foreground uppercase tracking-wider">Part Sourcing Action (Current Job)</p>
              {!c.partDeliveredAt ? (
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="Courier info / delivery notes (Optional)..."
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    className={`${inputCls} border-orange-200 focus:ring-orange-500 text-sm py-2.5 px-4 flex-1`}
                  />
                  <button
                    onClick={handleMarkDelivered}
                    disabled={!!actionLoading}
                    className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 transition text-xs uppercase tracking-wider whitespace-nowrap"
                  >
                    {actionLoading === 'deliver' ? '...' : '🚚 Mark Dispatched'}
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 flex justify-between items-center text-green-800 text-sm font-medium">
                  <span>🚚 Part delivered to SC. Awaiting SC receipt confirmation.</span>
                </div>
              )}
            </div>
          ) : ['unassigned', 'new', 'assigned', 'rejected_by_sc'].includes(c?.status) ? (
            <div className="space-y-3">
              <p className="text-sm font-bold text-foreground uppercase tracking-wider">
                {c?.status === 'unassigned' ? 'Assign Service Centre' : 'Assign Service Centre (Current Job)'}
              </p>
              {c?.status === 'unassigned' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3.5 text-yellow-800 text-sm font-medium flex items-center gap-2">
                  <span>⚠ This complaint has no Service Centre assigned yet.</span>
                </div>
              )}
              {loadingCandidates ? (
                <p className="text-sm text-muted-foreground animate-pulse">Loading matching service centres...</p>
              ) : candidates.length === 0 ? (
                <p className="text-sm text-yellow-800 bg-yellow-50 p-3 rounded-xl border border-yellow-100">No active service centres found for this area.</p>
              ) : (
                <div className="flex gap-2.5">
                  <select
                    value={selectedSCId}
                    onChange={(e) => setSelectedSCId(e.target.value)}
                    className={`${inputCls} text-sm py-2.5 px-4 flex-1`}
                  >
                    <option value="">-- Select Service Centre --</option>
                    {candidates.map((sc) => (
                      <option key={sc._id} value={sc._id}>
                        {sc.businessName} ({sc.city} - {sc.ownerName})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleReassign}
                    disabled={!!actionLoading || !selectedSCId}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition text-xs uppercase tracking-wider"
                  >
                    {actionLoading === 'reassign' ? '...' : 'Assign'}
                  </button>
                </div>
              )}
            </div>
          ) : isReopenEligible ? (
            <div className="space-y-3">
              <p className="text-sm font-bold text-foreground uppercase tracking-wider">Reopen Job (Current)</p>
              <div className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="Describe reason to reopen (Required)..."
                  value={reopenNotes}
                  onChange={(e) => setReopenNotes(e.target.value)}
                  className={`${inputCls} border-yellow-300 focus:ring-yellow-400 text-sm py-2.5 px-4 flex-1`}
                />
                <button
                  onClick={handleReopen}
                  disabled={!!actionLoading || !reopenNotes.trim()}
                  className="px-6 py-2.5 bg-yellow-500 text-white rounded-xl font-bold disabled:opacity-50 transition text-xs uppercase tracking-wider whitespace-nowrap"
                >
                  {actionLoading === 'reopen' ? '...' : '⚠️ Reopen'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-muted p-3.5 rounded-xl text-center text-sm text-muted-foreground font-bold">
              Current Status: <span className="text-foreground uppercase">{c?.status.replace(/_/g, ' ')}</span> (No actions pending)
            </div>
          )}

          {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 mt-2">{error}</p>}
          {success && <p className="text-xs font-semibold text-green-600 bg-green-50 p-3 rounded-xl border border-green-200 mt-2">{success}</p>}
        </div>
      </div>

      {/* Missing Fields Warning Modal */}
      {showWarningModal && (
        <>
          <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
            <div className="bg-background border border-border w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  ⚠️ Product Information Missing
                </h3>
                <button type="button" onClick={() => setShowWarningModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>

              <div className="p-6 space-y-5 flex-1 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  The following product fields are still empty. Please fill them before closing or bypass each field individually.
                </p>

                {modalError && (
                  <p className="text-red-600 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-200 dark:border-red-900/50 font-semibold">
                    {modalError}
                  </p>
                )}

                <div className="space-y-4">
                  {missingFields.map((field) => {
                    const fieldLabel = {
                      billDate: 'Bill Date / Date of purchase',
                      billPhoto: 'Bill / Invoice Photo',
                      shopName: 'Shop / Dealer Name',
                      serialNumber: 'Serial Number',
                      modelNumber: 'Model Number / Variant',
                    }[field];

                    return (
                      <div key={field} className="border rounded-xl p-4 bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-foreground">{fieldLabel}</label>
                          <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!bypassedFields[field]}
                              onChange={(e) => {
                                setBypassedFields(prev => ({ ...prev, [field]: e.target.checked }));
                                if (e.target.checked) {
                                  setFillValues(prev => ({ ...prev, [field]: '' }));
                                }
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            Bypass this field
                          </label>
                        </div>

                        {!bypassedFields[field] ? (
                          <div>
                            {field === 'billDate' ? (
                              <input
                                type="date"
                                value={fillValues.billDate}
                                onChange={(e) => setFillValues(prev => ({ ...prev, billDate: e.target.value }))}
                                className={inputCls}
                              />
                            ) : field === 'billPhoto' ? (
                              fillValues.billPhoto ? (
                                <div className="flex items-center gap-2 border rounded-lg p-2 bg-background">
                                  <span className="truncate max-w-xs font-medium">📄 bill_photo.jpg</span>
                                  <button type="button" onClick={() => setFillValues(prev => ({ ...prev, billPhoto: '' }))} className="text-red-500 font-semibold ml-auto">Remove</button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {c.scBillPhotoUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setFillValues(prev => ({ ...prev, billPhoto: c.scBillPhotoUrl }))}
                                      className="px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded font-bold text-[10px] uppercase tracking-wider mb-2 block"
                                    >
                                      ✓ Use SC Uploaded Bill Photo
                                    </button>
                                  )}
                                  <ImageUploader
                                    maxFiles={1}
                                    uploadedUrls={[]}
                                    onUpload={(urls) => setFillValues(prev => ({ ...prev, billPhoto: urls[0] || '' }))}
                                  />
                                </div>
                              )
                            ) : (
                              <input
                                type="text"
                                value={fillValues[field]}
                                onChange={(e) => setFillValues(prev => ({ ...prev, [field]: e.target.value }))}
                                placeholder={`Enter ${fieldLabel}`}
                                className={inputCls}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="text-amber-600 dark:text-amber-400 font-semibold italic bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            Bypassed. You will be prompted again in future complaints until filled.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/10">
                <button
                  type="button"
                  onClick={() => setShowWarningModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-muted text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={actionLoading === 'confirm'}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  {actionLoading === 'confirm' ? 'Saving...' : 'Confirm & Close'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
