import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import ExtraChargesList from './ExtraChargesList';
import ImageUploader from '../forms/ImageUploader';
import StatusTimeline from './StatusTimeline';
import PetrolEditField from './PetrolEditField';
import BillSummary from './BillSummary';
import SCComplaintDetail from './SCComplaintDetail';
import InlineCitySelect from '../ui/InlineCitySelect';
import InlineSelect from '../ui/InlineSelect';
import { Loader2, Plus, X } from 'lucide-react';

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
  const [adminMadeEdits, setAdminMadeEdits] = useState(false);
  const [savingExtraCharges, setSavingExtraCharges] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  // Reassignment states
  const [candidates, setCandidates] = useState([]);
  const [selectedSCId, setSelectedSCId] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // More options / unregistered SC creation states for reassignment
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalData, setModalData] = useState({
    name: '',
    phone1: '',
    phone2: '',
    city: '',
    district: '',
    state: '',
    fullAddress: '',
    productCapability: 'both',
  });
  const [creatingSC, setCreatingSC] = useState(false);
  const [createError, setCreateError] = useState('');
  const [cities, setCities] = useState([]);

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchState, setSearchState] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchCapability, setSearchCapability] = useState('');
  const [searchUnregistered, setSearchUnregistered] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Sync candidate form data with complaint defaults
  useEffect(() => {
    if (c) {
      setModalData((prev) => ({
        ...prev,
        city: c.city || '',
        district: c.district || '',
        state: c.state || '',
      }));
    }
  }, [c]);

  // Load cities list
  useEffect(() => {
    api.get('/api/cities').then(({ data }) => setCities(data)).catch(() => setCities([]));
  }, []);

  const uniqueStates = [...new Set(cities.map(ct => ct.state))].sort();
  const filteredDistricts = [...new Set(
    cities
      .filter((ct) => (modalData.state ? ct.state === modalData.state : true))
      .map((ct) => ct.district)
  )].sort();

  const searchDistricts = [...new Set(
    cities
      .filter((ct) => (searchState ? ct.state === searchState : true))
      .map((ct) => ct.district)
  )].sort();

  const searchCities = [...new Set(
    cities
      .filter((ct) => {
        if (searchState && ct.state !== searchState) return false;
        if (searchDistrict && ct.district !== searchDistrict) return false;
        return true;
      })
      .map((ct) => ct.name)
  )].sort();

  // Search hook
  useEffect(() => {
    if (!showMoreOptions) return;

    const fetchSearchResults = async () => {
      setSearchLoading(true);
      try {
        const params = {
          status: 'active',
          limit: 100,
        };
        if (searchQuery) params.search = searchQuery;
        if (searchState) params.state = searchState;
        if (searchDistrict) params.district = searchDistrict;
        if (searchCity) params.city = searchCity;
        if (searchCapability) params.productCapability = searchCapability;
        if (searchUnregistered === 'registered') params.isUnregistered = 'false';
        if (searchUnregistered === 'unregistered') params.isUnregistered = 'true';

        const { data } = await api.get('/api/service-centres', { params });
        setSearchResults(data.serviceCentres || []);
      } catch (err) {
        console.error('Failed to search service centres', err);
      } finally {
        setSearchLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [showMoreOptions, searchQuery, searchState, searchDistrict, searchCity, searchCapability, searchUnregistered]);

  const handleCreateSCSubmit = async (e) => {
    e.preventDefault();
    if (!modalData.name || !modalData.phone1 || !modalData.city || !modalData.state) {
      setCreateError('Name, Phone 1, City, and State are required.');
      return;
    }
    setCreatingSC(true);
    setCreateError('');
    try {
      const { data } = await api.post('/api/service-centres/unregistered', modalData);
      setCandidates((prev) => [data, ...prev]);
      setSelectedSCId(data._id);
      setShowCreateModal(false);
      setModalData({
        name: '',
        phone1: '',
        phone2: '',
        city: c?.city || '',
        district: c?.district || '',
        state: c?.state || '',
        fullAddress: '',
        productCapability: 'both',
      });
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create unregistered SC.');
    } finally {
      setCreatingSC(false);
    }
  };

  // Reopen states
  const [reopenNotes, setReopenNotes] = useState('');
  const reopenPhotos = [];

  const [forceCloseNote, setForceCloseNote] = useState('');

  // Unregistered SC Action States
  const [unregActionForm, setUnregActionForm] = useState('');
  const [unregNotes, setUnregNotes] = useState('');
  const [unregAmountCollected, setUnregAmountCollected] = useState('');
  const [unregPartDetails, setUnregPartDetails] = useState('');
  const [unregReason, setUnregReason] = useState('');
  const [unregPhotos, setUnregPhotos] = useState([]);


  // Unregistered SC Proxy Mode
  const [showProxyMode, setShowProxyMode] = useState(false);

  // Phase 21: Closing Check States
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [markAsPaidImmediately, setMarkAsPaidImmediately] = useState(false);
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
          } else if (!isEditingExtraCharges && !adminMadeEdits) {
            setPetrolAdmin(data.complaint.petrolAdmin ?? '');
            setPetrolSC(data.complaint.petrolSC ?? '');
            setPetrolFinal(data.complaint.petrolFinal ?? '');
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
  }, [complaintId, refreshTick, isEditingExtraCharges, adminMadeEdits]);

  // Fetch candidate Service Centres for reassignment
  useEffect(() => {
    let active = true;
    if (c && ['unassigned', 'new', 'assigned', 'rejected_by_sc'].includes(c.status)) {
      Promise.resolve().then(() => {
        if (active) setLoadingCandidates(true);
      });
      api.get('/api/service-centres', {
        params: {
          status: 'active',
          district: c.district,
          page: 1,
          limit: 100,
        }
      })
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
          
          const matches = allSCs.filter(
            (sc) =>
              sc.isUnregistered === true || required.includes(sc.productCapability)
          );
          setCandidates(matches);
        })
        .catch((err) => console.error('Failed to fetch SC candidates:', err))
        .finally(() => {
          if (active) setLoadingCandidates(false);
        });
    }
    return () => { active = false; };
  }, [c?.district, c?.product, c?.status]);

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
        extraCharges: adminExtraCharges,
        markAsPaidImmediately: markAsPaidImmediately
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

  const handleForceClose = async () => {
    setActionLoading('force_close');
    setError('');
    try {
      await api.patch(`/api/complaints/${c._id}/force-close`, {
        note: forceCloseNote.trim() || 'Complaint force-closed by Admin.'
      });
      setSuccess('Complaint closed successfully!');
      setForceCloseNote('');
      setTimeout(onUpdated, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Unregistered SC Action Handlers ───────────────────────
  const handleUnregAccept = async () => {
    setActionLoading('unreg_accept');
    setError('');
    try {
      await api.patch(`/api/complaints/${c._id}/accept`);
      setSuccess('Accepted on behalf of Service Centre.');
      setTimeout(onUpdated, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept on behalf of SC.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregReject = async () => {
    setActionLoading('unreg_reject');
    setError('');
    try {
      await api.patch(`/api/complaints/${c._id}/reject`);
      setSuccess('Rejected on behalf of Service Centre.');
      setTimeout(onUpdated, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject on behalf of SC.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregGoing = async () => {
    setActionLoading('unreg_going');
    setError('');
    try {
      await api.patch(`/api/complaints/${c._id}/going`);
      setSuccess('Marked as Going on behalf of Service Centre.');
      setTimeout(onUpdated, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregPartReceived = async () => {
    setActionLoading('unreg_part_received');
    setError('');
    try {
      await api.patch(`/api/complaints/${c._id}/part-received`);
      setSuccess('Part confirmed as received on behalf of Service Centre.');
      setTimeout(onUpdated, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregSubmitFinal = async (statusVal) => {
    setError('');
    setSuccess('');

    const body = {
      newStatus: statusVal,
      proofPhotos: unregPhotos,
      scNotes: unregNotes,
    };

    if (statusVal === 'done') {
      if (unregPhotos.length < 1) {
        setError('At least one proof photo is required.');
        return;
      }
      if (!isInWarranty && !unregAmountCollected) {
        setError('Please specify the amount collected from customer.');
        return;
      }
      if (!isInWarranty) {
        body.customerPaymentAmount = Number(unregAmountCollected);
      }
    } else if (statusVal === 'not_done') {
      if (!unregReason.trim()) {
        setError('A reason note is required.');
        return;
      }
      body.notDoneReason = unregReason;
    } else if (statusVal === 'part_pending') {
      if (unregPhotos.length < 2) {
        setError('At least two proof photos are required for part pending.');
        return;
      }
      if (!unregPartDetails.trim()) {
        setError('Part details are required.');
        return;
      }
      body.partDetails = unregPartDetails;
    }

    setActionLoading('unreg_status');
    try {
      await api.patch(`/api/complaints/${c._id}/status`, body);
      setSuccess(`Complaint marked as "${statusVal.replace(/_/g, ' ')}" successfully!`);
      setUnregActionForm('');
      setTimeout(onUpdated, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
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
        billDate: editBillDate || null,        // null clears the date (triggers manual warranty)
        billPhoto: editBillPhoto,
        complaintType: c?.complaintType || 'complaint', // context for warranty calc
      });
      setSuccess('Product registry details updated. Warranty status has been recalculated and synced.');
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
        <div className="border border-border/80 rounded-xl bg-card p-4 sm:p-6 space-y-4 shadow-sm">
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
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-foreground">{comp.assignedCentreId.businessName}</p>
                  {comp.assignedCentreId.isUnregistered && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      UNREGISTERED SC
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {comp.assignedCentreId.ownerName || 'Admin Maintained'} · {comp.assignedCentreId.phone1}
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
        <div className="border border-border/80 rounded-xl bg-card p-4 sm:p-6 space-y-4 shadow-sm">
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
  const latestShopName = productInfo.shopName || c?.shopName;
  const latestModelNumber = productInfo.modelNumber || c?.modelNumber;
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
          shopName: latestShopName,
          modelNumber: latestModelNumber,
          locationText: productInfo.locationText || c?.locationText || '',
        }
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-background shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-4 sm:px-8 py-3.5 sm:py-5 flex items-center justify-between z-10 shadow-sm">
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 pb-10">
          
          {/* Customer & Product Profile (Static Card) */}
          <div className="border border-border/80 rounded-xl bg-card p-4 sm:p-6 space-y-4 shadow-sm">
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
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Bill Date</span>
                <p className="font-semibold text-foreground">{latestBillDate ? formatDate(latestBillDate) : '—'}</p>
              </div>

              {/* Expiry Date */}
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Warranty Expiry Date</span>
                <p className="font-semibold text-foreground">{latestWarrantyExpiryDate ? formatDate(latestWarrantyExpiryDate) : '—'}</p>
              </div>

              {/* Serial Number */}
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Serial Number</span>
                <p className="font-mono text-foreground font-bold">{latestSerialNumber || '—'}</p>
              </div>
            </div>

            {/* Show shop name and model number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm pt-3 border-t border-border/40">
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Shop Name</span>
                <p className="font-semibold text-foreground">{latestShopName || '—'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-xs">Model Number</span>
                <p className="font-semibold text-foreground">{latestModelNumber || '—'}</p>
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
          <div className="border border-border/80 rounded-xl bg-card p-4 sm:p-6 space-y-6 shadow-sm">
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
                        <div className="border-t border-border p-4 sm:p-6 bg-background/40 rounded-b-xl">
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

          {/* ── Admin Action Section ─────────────────────────────── */}
          <div className="border-t border-border pt-6 space-y-5">
            {/* Unregistered SC Status Update Banner */}
            {c.assignedCentreId?.isUnregistered && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-4 rounded-xl shadow-sm space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  ⚠️ Unregistered Service Centre
                </p>
                <p className="text-xs">
                  This complaint is assigned to an <strong>Unregistered SC</strong>. All status updates must be performed manually by admin on their behalf. No WhatsApp reminders are sent to the SC.
                </p>
              </div>
            )}

            {/* Unregistered SC Action Panel */}
            {c.assignedCentreId?.isUnregistered && c.status !== 'done' && (
              <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-4">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  ⚙️ SC Action (Admin Maintained)
                </p>
                
                {c.status === 'assigned' && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleUnregAccept}
                      disabled={!!actionLoading}
                      className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      {actionLoading === 'unreg_accept' ? 'Processing...' : 'Accept Job'}
                    </button>
                    <button
                      onClick={handleUnregReject}
                      disabled={!!actionLoading}
                      className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      {actionLoading === 'unreg_reject' ? 'Processing...' : 'Reject Job'}
                    </button>
                  </div>
                )}

                {c.status === 'accepted' && (
                  <button
                    onClick={handleUnregGoing}
                    disabled={!!actionLoading}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    🚗 Mark SC as Going (On the Way)
                  </button>
                )}

                {c.status === 'going' && (
                  <div className="space-y-4">
                    {/* Action selector tabs */}
                    <div className="flex border-b border-border">
                      {['done', 'not_done', 'part_pending'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { setUnregActionForm(t); setError(''); }}
                          className={`flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition ${
                            unregActionForm === t
                              ? 'border-b-2 border-primary text-primary'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {t.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    {/* Done Form */}
                    {unregActionForm === 'done' && (
                      <div className="space-y-4 pt-2">
                        {/* Proof Photos */}
                        <div>
                          <label className="text-[10px] font-bold uppercase block mb-1">Proof Photos (Min 1) <span className="text-red-500">*</span></label>
                          <ImageUploader
                            maxFiles={5}
                            uploadedUrls={unregPhotos}
                            onUpload={setUnregPhotos}
                          />
                        </div>

                        {/* Out-of-warranty: Amount collected */}
                        {!isInWarranty && (
                          <div>
                            <label className="text-[10px] font-bold uppercase block mb-1">Amount Collected from Customer (₹) <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              min="0"
                              value={unregAmountCollected}
                              onChange={(e) => setUnregAmountCollected(e.target.value)}
                              className={inputCls}
                              placeholder="Amount collected"
                              required
                            />
                          </div>
                        )}

                        {/* SC Notes */}
                        <div>
                          <label className="text-[10px] font-bold uppercase block mb-1">SC Notes / Report</label>
                          <textarea
                            value={unregNotes}
                            onChange={(e) => setUnregNotes(e.target.value)}
                            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            rows={2}
                            placeholder="Report details..."
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnregSubmitFinal('done')}
                          disabled={actionLoading === 'unreg_status'}
                          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition"
                        >
                          {actionLoading === 'unreg_status' ? 'Submitting...' : 'Submit Done Status'}
                        </button>
                      </div>
                    )}

                    {/* Not Done Form */}
                    {unregActionForm === 'not_done' && (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase block mb-1">Reason / Explanation <span className="text-red-500">*</span></label>
                          <textarea
                            value={unregReason}
                            onChange={(e) => setUnregReason(e.target.value)}
                            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            rows={2}
                            placeholder="Why is it not done?"
                            required
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnregSubmitFinal('not_done')}
                          disabled={actionLoading === 'unreg_status'}
                          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition"
                        >
                          Submit Not Done Status
                        </button>
                      </div>
                    )}

                    {/* Part Pending Form */}
                    {unregActionForm === 'part_pending' && (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase block mb-1">Proof Photos (Min 2) <span className="text-red-500">*</span></label>
                          <ImageUploader
                            maxFiles={5}
                            uploadedUrls={unregPhotos}
                            onUpload={setUnregPhotos}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase block mb-1">Required Part Details <span className="text-red-500">*</span></label>
                          <textarea
                            value={unregPartDetails}
                            onChange={(e) => setUnregPartDetails(e.target.value)}
                            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            rows={2}
                            placeholder="e.g. Backlight strip 32inch, Motherboard CV56B..."
                            required
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnregSubmitFinal('part_pending')}
                          disabled={actionLoading === 'unreg_status'}
                          className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition"
                        >
                          Submit Part Pending Status
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {c.status === 'part_pending' && c.partDeliveredAt && (
                  <button
                    onClick={handleUnregPartReceived}
                    disabled={!!actionLoading}
                    className="w-full py-2.5 bg-green-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    📦 Confirm Part/Unit Received by SC
                  </button>
                )}
              </div>
            )}

            {canConfirmOrDispute ? (
            <div className="space-y-5">
              {/* Section heading */}
              <div className="flex items-center gap-3 pb-1">
                <span className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                  🛡️ Admin Decision
                </span>
                <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
                  Job: {c.complaintId}
                </span>
              </div>
              
              {/* Petrol Verification Section (Warranty only) */}
              {isInWarranty && !c.petrolLocked && (
                <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3.5 hover:border-primary/20 transition-all">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      ⛽ Petrol Allowance Verification
                    </span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                      3-Round Verification
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">1st: Admin Estimate (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={petrolAdmin}
                        onChange={(e) => { setPetrolAdmin(e.target.value); setAdminMadeEdits(true); }}
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
                        onChange={(e) => { setPetrolSC(e.target.value); setAdminMadeEdits(true); }}
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
                        onChange={(e) => { setPetrolFinal(e.target.value); setAdminMadeEdits(true); }}
                        className={inputCls}
                        placeholder={petrolSC ? `Accept SC: ₹${petrolSC}` : petrolAdmin ? `Accept Admin: ₹${petrolAdmin}` : "Final Approved"}
                      />
                    </div>
                  </div>
                  
                  {/* Quick Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setPetrolFinal(petrolAdmin); setAdminMadeEdits(true); }}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition shadow-sm flex items-center gap-1"
                    >
                      ✓ Accept 1st (Admin: ₹{petrolAdmin || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPetrolFinal(petrolSC); setAdminMadeEdits(true); }}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition shadow-sm flex items-center gap-1"
                    >
                      ✓ Accept 2nd (SC: ₹{petrolSC || 0})
                    </button>
                  </div>
                </div>
              )}

              {/* Extra Charges Verification Section */}
              <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3.5 hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    💳 Extra Charges Verification & Adjustment
                  </span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-600 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                    {adminExtraCharges.length} item{adminExtraCharges.length === 1 ? '' : 's'}
                  </span>
                </div>
                
                {/* List of Extra charges */}
                {adminExtraCharges.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {adminExtraCharges.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-background p-2.5 rounded-lg border border-border gap-2 text-xs hover:border-border/80 transition">
                        <div className="flex items-center gap-2 flex-grow">
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => {
                              const newLabel = e.target.value;
                              setAdminExtraCharges(prev => prev.map((ec, i) => i === idx ? { ...ec, label: newLabel } : ec));
                              setAdminMadeEdits(true);
                            }}
                            className="rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring flex-grow"
                            placeholder="Description"
                          />
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => {
                              const newAmount = e.target.value === '' ? '' : Number(e.target.value);
                              setAdminExtraCharges(prev => prev.map((ec, i) => i === idx ? { ...ec, amount: newAmount } : ec));
                              setAdminMadeEdits(true);
                            }}
                            className="rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-24 shrink-0"
                            placeholder="Amount"
                          />
                          <span className={`px-2 py-1 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                            item.requestedBy === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
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
                              setAdminMadeEdits(true);
                            }}
                            className={`bg-background border border-border text-xs rounded-lg px-2.5 py-1.5 font-bold focus:outline-none ${
                              item.status === 'approved' ? 'text-green-600 border-green-300 dark:border-green-800' :
                              item.status === 'rejected' ? 'text-red-600 border-red-300 dark:border-red-800' :
                              'text-yellow-600 border-yellow-300 dark:border-yellow-800'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          
                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => { setAdminExtraCharges(prev => prev.filter((_, i) => i !== idx)); setAdminMadeEdits(true); }}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition font-bold"
                            title="Delete charge"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-1">No extra charges requested.</p>
                )}

                {/* Add new extra charge form */}
                <div className="flex gap-2 items-center pt-1">
                  <input
                    type="text"
                    id="admin-confirm-extra-label"
                    placeholder="Add new charge description..."
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring flex-grow"
                  />
                  <input
                    type="number"
                    id="admin-confirm-extra-amount"
                    placeholder="₹ Amount"
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-24 shrink-0"
                  />
                  <select
                    id="admin-confirm-extra-requested-by"
                    className="bg-background border border-border text-xs rounded-lg px-2.5 py-2 font-semibold text-foreground focus:outline-none shrink-0"
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
                        setAdminMadeEdits(true);
                        document.getElementById('admin-confirm-extra-label').value = '';
                        document.getElementById('admin-confirm-extra-amount').value = '';
                      }
                    }}
                    className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition whitespace-nowrap shrink-0"
                  >
                    + Add Charge
                  </button>
                </div>
              </div>

              {/* Note and Confirm Trigger */}
              <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  📝 Confirmation & Closure
                </span>
                <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
                  <input
                    type="checkbox"
                    checked={markAsPaidImmediately}
                    onChange={(e) => setMarkAsPaidImmediately(e.target.checked)}
                    className="w-4 h-4 accent-green-600 rounded cursor-pointer"
                    id="markAsPaidCheckbox"
                  />
                  <span className="text-sm font-semibold text-foreground">Mark as Paid immediately</span>
                  <span className="text-xs text-muted-foreground">
                    — Sets payment status to Paid at the moment this bill is generated.
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
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
                    className="px-8 py-2.5 bg-green-600 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider hover:bg-green-700 disabled:opacity-50 transition shadow-md hover:shadow-lg whitespace-nowrap shrink-0 flex items-center gap-2"
                  >
                    {actionLoading === 'confirm' ? 'Processing...' : '✓ Confirm & Close Job'}
                  </button>
                </div>
              </div>

              {/* Separation boundary & Dispute row */}
              <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/40 p-4 rounded-xl shadow-sm space-y-3">
                <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  ⚠️ Dispute Job (Return to SC)
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                  <input
                    type="text"
                    placeholder="Reason for dispute (Required)..."
                    value={disputeNote}
                    onChange={(e) => setDisputeNote(e.target.value)}
                    className={`${inputCls} border-red-200 dark:border-red-900/50 focus:ring-red-500 text-sm py-2.5 px-4 flex-grow bg-background`}
                  />
                  <button
                    onClick={handleDispute}
                    disabled={!!actionLoading || !disputeNote.trim()}
                    className="px-8 py-2.5 bg-red-600 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 transition shadow-md hover:shadow-lg whitespace-nowrap shrink-0 flex items-center gap-2"
                  >
                    {actionLoading === 'dispute' ? 'Processing...' : '✕ Dispute Job'}
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
          ) : c?.status === 'assigned' && c?.assignedCentreId?.isUnregistered ? (
            /* Unregistered SC action is handled by the panel above — show nothing extra here */
            null
          ) : ['unassigned', 'new', 'assigned', 'rejected_by_sc'].includes(c?.status) ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
                <div>
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {c?.status === 'unassigned' ? 'Assign Service Centre' : 'Assign Service Centre (Current Job)'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Matching SCs in <strong>{c?.district}</strong> district · Product: <strong>{c?.product?.toUpperCase()}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="h-8 px-3 rounded-lg border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Unregistered SC
                </button>
              </div>

              {c?.status === 'unassigned' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3.5 text-yellow-800 text-xs font-medium flex items-center gap-2">
                  <span>⚠ This complaint has no Service Centre assigned yet.</span>
                </div>
              )}

              {loadingCandidates ? (
                <div className="space-y-2.5">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : candidates.length === 0 ? (
                <div className="rounded-xl border border-border bg-card px-4 py-6 text-center">
                  <p className="text-muted-foreground text-xs font-medium">
                    No active service centres recommended in <strong>{c?.district}</strong> district for product <strong>{c?.product?.toUpperCase()}</strong>.
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-1.5">
                    Use "More Options" below to search for centres in other cities or districts.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {candidates.map((sc) => {
                    const isSelected = selectedSCId === sc._id;
                    const CAPABILITY_LABELS = {
                      led_only: 'LED Only',
                      cooler_only: 'Cooler Only',
                      both: 'LED + Cooler',
                    };
                    return (
                      <div
                        key={sc._id}
                        onClick={() => setSelectedSCId(sc._id)}
                        className={`rounded-xl border-2 p-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border bg-card hover:border-ring'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground text-xs">{sc.businessName}</p>
                              {sc.isUnregistered && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  UNREGISTERED SC
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {sc.ownerName || 'Admin Maintained'} · {sc.city}, {sc.district}
                            </p>
                            <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
                              <span>📞 {sc.phone1}</span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                {sc.isUnregistered ? 'LED + Cooler' : CAPABILITY_LABELS[sc.productCapability]}
                              </span>
                            </div>
                          </div>

                          {/* Live stats */}
                          <div className="text-right text-[10px] text-muted-foreground shrink-0 leading-normal">
                            <p className="font-bold text-foreground text-[11px] mb-0.5">Load Stats</p>
                            <p>Assigned: <strong>{sc.stats?.assigned ?? 0}</strong></p>
                            <p>Pending: <strong>{sc.stats?.pending ?? 0}</strong></p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── More Options Advanced Search ── */}
              <div className="border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="flex items-center justify-between w-full px-3 py-2 bg-muted/40 hover:bg-muted/70 border border-border/80 rounded-xl font-bold text-[10px] text-foreground transition select-none"
                >
                  <span>🔍 {showMoreOptions ? 'Hide Search Options' : 'Show More Options (Search All SCs)'}</span>
                  <span className="text-muted-foreground text-[9px]">
                    {showMoreOptions ? '▲' : '▼'}
                  </span>
                </button>

                {showMoreOptions && (
                  <div className="mt-3 p-3 border border-border/60 bg-muted/10 rounded-xl space-y-3">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Search & Filter Directory</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="text-[9px] font-semibold block mb-0.5 text-muted-foreground">Search by Name/Phone/City</label>
                        <input
                          type="text"
                          placeholder="Type to search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex h-8 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-semibold block mb-0.5 text-muted-foreground">State</label>
                        <select
                          value={searchState}
                          onChange={(e) => {
                            setSearchState(e.target.value);
                            setSearchDistrict('');
                            setSearchCity('');
                          }}
                          className="flex h-8 w-full rounded-lg border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">All States</option>
                          {uniqueStates.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-semibold block mb-0.5 text-muted-foreground">District</label>
                        <select
                          value={searchDistrict}
                          onChange={(e) => {
                            setSearchDistrict(e.target.value);
                            setSearchCity('');
                          }}
                          className="flex h-8 w-full rounded-lg border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">All Districts</option>
                          {searchDistricts.map(dt => (
                            <option key={dt} value={dt}>{dt}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-semibold block mb-0.5 text-muted-foreground">City</label>
                        <select
                          value={searchCity}
                          onChange={(e) => setSearchCity(e.target.value)}
                          className="flex h-8 w-full rounded-lg border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">All Cities</option>
                          {searchCities.map(ct => (
                            <option key={ct} value={ct}>{ct}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-semibold block mb-0.5 text-muted-foreground">Product Capability</label>
                        <select
                          value={searchCapability}
                          onChange={(e) => setSearchCapability(e.target.value)}
                          className="flex h-8 w-full rounded-lg border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">All Capabilities</option>
                          <option value="led_only">LED Only</option>
                          <option value="cooler_only">Cooler Only</option>
                          <option value="both">LED + Cooler</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[9px] font-semibold block mb-0.5 text-muted-foreground">Registration Type</label>
                        <select
                          value={searchUnregistered}
                          onChange={(e) => setSearchUnregistered(e.target.value)}
                          className="flex h-8 w-full rounded-lg border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">All Types</option>
                          <option value="registered">Registered Only</option>
                          <option value="unregistered">Unregistered Only</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1.5">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Search Results</span>
                      
                      {searchLoading ? (
                        <div className="py-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          Searching directory...
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="py-6 text-center text-xs text-muted-foreground bg-background rounded-lg border border-border border-dashed">
                          No service centres match your search filters.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                          {searchResults.map((sc) => {
                            const isSelected = selectedSCId === sc._id;
                            const CAPABILITY_LABELS = {
                              led_only: 'LED Only',
                              cooler_only: 'Cooler Only',
                              both: 'LED + Cooler',
                            };
                            return (
                              <div
                                key={sc._id}
                                onClick={() => setSelectedSCId(sc._id)}
                                className={`rounded-xl border-2 p-3 cursor-pointer bg-background transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : 'border-border hover:border-ring'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-semibold text-foreground text-xs">{sc.businessName}</p>
                                      {sc.isUnregistered && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                          UNREGISTERED SC
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      {sc.ownerName || 'Admin Maintained'} · {sc.city}, {sc.district}
                                    </p>
                                    <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
                                      <span>📞 {sc.phone1}</span>
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                        {sc.isUnregistered ? 'LED + Cooler' : CAPABILITY_LABELS[sc.productCapability]}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right text-[10px] text-muted-foreground shrink-0 leading-normal">
                                    <p className="font-bold text-foreground text-[11px] mb-0.5">Load Stats</p>
                                    <p>Assigned: <strong>{sc.stats?.assigned ?? 0}</strong></p>
                                    <p>Pending: <strong>{sc.stats?.pending ?? 0}</strong></p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleReassign}
                disabled={!!actionLoading || !selectedSCId}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition text-xs uppercase tracking-wider text-center"
              >
                {actionLoading === 'reassign' ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
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

          {/* Admin Force Close Panel (Only shown when no work has been done yet) */}
          {['new', 'unassigned', 'assigned', 'accepted', 'rejected_by_sc'].includes(c?.status) && (
            <div className="border-t border-border pt-4 mt-4 space-y-3">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">Close Complaint (No Work Done)</p>
              <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-xl p-3.5 space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  You can close this complaint directly if it was created in error or cancelled by the customer. No bill will be generated.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter reason to close (e.g. Cancelled by customer)..."
                    value={forceCloseNote}
                    onChange={(e) => setForceCloseNote(e.target.value)}
                    className={`${inputCls} text-xs py-2 px-3 flex-1 bg-background`}
                  />
                  <button
                    onClick={handleForceClose}
                    disabled={!!actionLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                  >
                    {actionLoading === 'force_close' ? 'Closing...' : 'Close Complaint'}
                  </button>
                </div>
              </div>
            </div>
          )}

          </div>
        </div>
      </div>

      {/* Missing Fields Warning Modal */}
      {showWarningModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-background border border-border w-full max-w-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col max-h-[85vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                <div>
                  <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                    ⚠️ Product Information Missing (Step 2 Details)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please complete or bypass these required Step 2 product tracking fields before closing the job.
                  </p>
                </div>
                <button type="button" onClick={() => setShowWarningModal(false)} className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition font-bold">✕</button>
              </div>

              <div className="p-4 sm:p-6 space-y-5 flex-1 text-xs">
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

              <div className="p-4 sm:p-6 border-t border-border flex justify-end gap-3 bg-muted/10">
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

      {/* Admin Proxy Modal for Unregistered SCs */}
      {showProxyMode && (
        <SCComplaintDetail
          complaint={c}
          onClose={() => setShowProxyMode(false)}
          onUpdated={() => {
            setShowProxyMode(false);
            setRefreshTick(prev => prev + 1);
            if (onUpdated) onUpdated();
          }}
        />
      )}

      {/* Unregistered SC Creation Dialog Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 border border-border shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold mb-1">Create Unregistered Service Centre</h3>
            <p className="text-xs text-muted-foreground mb-4">
              This service centre will not have a login portal. Updates are maintained manually by admins.
            </p>

            <form onSubmit={handleCreateSCSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Business Name / Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={modalData.name}
                  onChange={(e) => setModalData(prev => ({ ...prev, name: e.target.value }))}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                  placeholder="e.g. Apex Electronics"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Phone Number 1 <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={modalData.phone1}
                    onChange={(e) => setModalData(prev => ({ ...prev, phone1: e.target.value }))}
                    className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                    placeholder="10-digit number"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Phone Number 2 (optional)</label>
                  <input
                    type="tel"
                    value={modalData.phone2}
                    onChange={(e) => setModalData(prev => ({ ...prev, phone2: e.target.value }))}
                    className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Alternate contact"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold block mb-1">City <span className="text-red-500">*</span></label>
                <InlineCitySelect
                  value={modalData.city}
                  filterState={modalData.state}
                  filterDistrict={modalData.district}
                  onChange={({ city, district, state }) => {
                    setModalData(prev => ({
                      ...prev,
                      city,
                      district,
                      state
                    }));
                  }}
                  onCityCreated={(newCity) => {
                    setCities(prev => [...prev, newCity]);
                  }}
                  placeholder="Select city"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">District <span className="text-red-500">*</span></label>
                  <InlineSelect
                    value={modalData.district}
                    options={filteredDistricts}
                    onChange={(newDistrict) => {
                      const match = cities.find(ct => ct.district === newDistrict);
                      setModalData(prev => ({ 
                        ...prev, 
                        district: newDistrict,
                        state: match ? match.state : prev.state
                      }));
                    }}
                    placeholder="Select district"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">State <span className="text-red-500">*</span></label>
                  <InlineSelect
                    value={modalData.state}
                    options={uniqueStates}
                    onChange={(newState) => setModalData(prev => ({ ...prev, state: newState, district: '', city: '' }))}
                    placeholder="Select state"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Full Address (optional)</label>
                <textarea
                  value={modalData.fullAddress}
                  onChange={(e) => setModalData(prev => ({ ...prev, fullAddress: e.target.value }))}
                  className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  rows={2}
                  placeholder="Complete postal address"
                />
              </div>

              {createError && <p className="text-xs text-destructive">{createError}</p>}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-9 px-4 rounded-lg border border-input hover:bg-accent text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSC}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-sm flex items-center justify-center"
                >
                  {creatingSC ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Service Centre'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
