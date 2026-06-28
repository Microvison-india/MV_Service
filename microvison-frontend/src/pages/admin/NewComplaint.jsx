import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import Step1CustomerInfo from '../../components/forms/Step1CustomerInfo';
import Step2ProductInfo from '../../components/forms/Step2ProductInfo';  // Step 2 — NEW: Bill Date, Shop Name, Serial, Model, Warranty
import Step3ProductType from '../../components/forms/Step3ProductType'; // Step 3 — Product & Complaint Type (was Step 2)
import Step4Charges from '../../components/forms/Step4Charges';         // Step 4 — Charges & Media (was Step 3)
import Step5AssignSC from '../../components/forms/Step5AssignSC';        // Step 5 — SC Assignment (was Step 4)

const STEPS = [
  { number: 1, title: 'Customer Info' },
  { number: 2, title: 'Product Info' },
  { number: 3, title: 'Product & Type' },
  { number: 4, title: 'Charges & Media' },
  { number: 5, title: 'Assign SC' },
];

// Validate current step before allowing Next
const validateStep = (step, formData) => {
  if (step === 1) {
    if (!formData.customerName?.trim()) return 'Customer name is required.';
    if (!formData.phone1?.trim()) return 'Phone number 1 is required.';
    if (!formData.localAddress?.trim()) return 'Local address is required.';
    if (!formData.city?.trim()) return 'City is required.';
    if (!formData.district?.trim()) return 'District must be auto-filled from city selection.';
    if (!formData.state?.trim()) return 'State is required.';
    return null;
  }
  if (step === 2) {
    if (!formData.billDate) {
      if (!formData.warrantyStatus) return 'Please select manual warranty status.';
      if (!formData.manualReason?.trim()) return 'Reason for manual selection is required.';
    } else {
      if (formData.forceOverride) {
        if (!formData.warrantyStatus) return 'Please select forced warranty status.';
        if (!formData.warrantyForceReason?.trim()) return 'Reason for force override is required.';
      }
    }
    return null;
  }
  if (step === 3) {
    if (!formData.product) return 'Please select a product.';
    if (!formData.complaintType) return 'Please select a complaint type.';
    return null;
  }
  if (step === 4) {
    if (formData.warrantyStatus === 'in_warranty') {
      if (!formData.presetId) {
        return 'Please select a pricing preset or choose Manual Entry for in-warranty complaints.';
      }
      if (formData.presetId === 'manual' && (!formData.customPresetName?.trim() || !formData.customPresetPrice)) {
        return 'Please provide a title and price for the manual preset.';
      }
    }
    // Validate extra charges: if any row has label but no amount, block
    const extras = formData.extraCharges || [];
    for (const ec of extras) {
      if (ec.label && !ec.amount) return 'Please enter an amount for each extra charge.';
      if (!ec.label && ec.amount) return 'Please enter a label for each extra charge.';
    }
    return null;
  }
  return null;
};

export default function NewComplaint() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.prefill || {};
  // Stable flag: true when the page was opened via navigate with prefill state (link product, reopen flow)
  const hasPrefill = Object.keys(prefill).some((k) => prefill[k]);

  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Master form state — all 4 steps share this
  const [formData, setFormData] = useState({
    // Step 1
    customerName: prefill.customerName || '',
    phone1: prefill.phone1 || '',
    phone2: prefill.phone2 || '',
    localAddress: prefill.localAddress || '',
    city: prefill.city || '',
    district: prefill.district || '',
    state: prefill.state || '',
    trackingId: prefill.trackingId || '',
    serialNumber: prefill.serialNumber || '',
    linkedProductType: prefill.product || '',
    locationText: prefill.locationText || '',
    // Step 2 (Product Info)
    shopName: prefill.shopName || '',
    modelNumber: prefill.modelNumber || '',
    forceOverride: false,
    warrantyForceReason: '',
    manualReason: '',
    billPhoto: prefill.billPhoto || '',
    billDate: prefill.billDate ? prefill.billDate.split('T')[0] : '',
    warrantyStatus: prefill.warrantyStatus || '',
    // Step 3 (Product & Type)
    product: prefill.product || '',
    complaintType: '',
    // Step 4 (Charges)
    presetId: '',
    customPresetName: '',
    customPresetPrice: '',
    petrolAdmin: '',
    extraCharges: [],
    notes: '',
    voiceNoteUrl: '',
    adminPhotos: [],
    // Step 5 (Assign SC)
    selectedSCId: '',
  });


  const [draftsList, setDraftsList] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(!hasPrefill);
  const [showDraftSelection, setShowDraftSelection] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null);
  // Flag to block auto-save while resuming a draft (prevents duplicate saves)
  const [resuming, setResuming] = useState(false);

  // Fetch drafts on mount — only when NOT coming from a prefill navigation
  useEffect(() => {
    if (hasPrefill) {
      return;
    }

    const fetchDrafts = async () => {
      try {
        const { data } = await api.get('/api/complaints/drafts');
        if (data.drafts && data.drafts.length > 0) {
          setDraftsList(data.drafts);
          setShowDraftSelection(true);
        }
      } catch (err) {
        console.error('Error fetching drafts:', err);
      } finally {
        setLoadingDrafts(false);
      }
    };
    fetchDrafts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced Auto-Save Draft
  useEffect(() => {
    // Don't auto-save while: draft screen shown, still loading, submitting, or just resuming a draft
    if (showDraftSelection || loadingDrafts || submitting || resuming) return;

    // Don't auto-save on a prefill navigation (linking product or reopen)
    if (hasPrefill && !currentDraftId) return;

    // Don't save a completely blank form
    const hasData = formData.customerName?.trim() || formData.phone1?.trim() ||
      formData.localAddress?.trim() || formData.serialNumber?.trim() || formData.billDate;
    if (!hasData) return;

    const timer = setTimeout(async () => {
      try {
        const payload = { currentStep, formData };
        if (currentDraftId) payload.draftId = currentDraftId;

        const { data } = await api.post('/api/complaints/drafts', payload);
        if (!currentDraftId && data.draftId) {
          setCurrentDraftId(data.draftId);
        }
      } catch (err) {
        console.error('Error auto-saving draft:', err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, currentStep, currentDraftId, showDraftSelection, submitting, loadingDrafts, resuming]);

  const handleResumeDraft = (draft) => {
    setResuming(true);  // Block auto-save while we apply the resumed state
    setCurrentDraftId(draft._id);
    setCurrentStep(draft.currentStep);
    setFormData(draft.formData);
    setShowDraftSelection(false);
    // Allow auto-save again after React has re-rendered with the new state
    setTimeout(() => setResuming(false), 200);
  };

  const handleDeleteDraft = async (id) => {
    try {
      await api.delete(`/api/complaints/drafts/${id}`);
      setDraftsList((prev) => {
        const updated = prev.filter((d) => d._id !== id);
        if (updated.length === 0) setShowDraftSelection(false);
        return updated;
      });
    } catch (err) {
      console.error('Error deleting draft:', err);
    }
  };

  const handleStartFresh = () => {
    setShowDraftSelection(false);
    setCurrentDraftId(null);
  };

  const goNext = () => {
    const error = validateStep(currentStep, formData);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError('');
    setCurrentStep((prev) => prev + 1);
  };

  const goBack = () => {
    setStepError('');
    setCurrentStep((prev) => prev - 1);
  };

  // Final submit: create complaint and optionally assign it
  const handleSubmit = async (skipAssign = false) => {
    if (!skipAssign && !formData.selectedSCId) {
      setSubmitError('Please select a service centre.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      // Clean up extra charges — remove rows with no label/amount
      const cleanedExtras = (formData.extraCharges || [])
        .filter((ec) => ec.label?.trim() && ec.amount)
        .map((ec) => ({ label: ec.label.trim(), amount: Number(ec.amount) }));

      // Build payload
      const payload = {
        customerName: formData.customerName.trim(),
        phone1: formData.phone1.trim(),
        phone2: formData.phone2?.trim() || '',
        localAddress: formData.localAddress.trim(),
        city: formData.city,
        district: formData.district,
        state: formData.state,
        locationText: formData.locationText?.trim() || undefined,
        product: formData.product,
        complaintType: formData.complaintType,
        warrantyStatus: formData.warrantyStatus,
        trackingId: formData.trackingId || undefined,
        serialNumber: formData.serialNumber?.trim() || undefined,
        billDate: formData.billDate || undefined,
        billPhoto: formData.billPhoto || undefined,
        shopName: formData.shopName?.trim() || undefined,
        modelNumber: formData.modelNumber?.trim() || undefined,
        forceOverride: formData.forceOverride || false,
        warrantyForceReason: formData.warrantyForceReason?.trim() || undefined,
        manualReason: formData.manualReason?.trim() || undefined,
        presetId: formData.warrantyStatus === 'in_warranty' && formData.presetId !== 'manual' ? formData.presetId : null,
        presetName: formData.presetId === 'manual' ? formData.customPresetName.trim() : undefined,
        presetPrice: formData.presetId === 'manual' ? Number(formData.customPresetPrice) : undefined,
        petrolAdmin: formData.warrantyStatus === 'in_warranty' && formData.petrolAdmin
          ? Number(formData.petrolAdmin)
          : null,
        extraCharges: cleanedExtras,
        notes: formData.notes || '',
        voiceNoteUrl: formData.voiceNoteUrl || '',
        adminPhotos: formData.adminPhotos || [],
      };

      // Step A: Create the complaint (status = 'unassigned')
      const { data: createData } = await api.post('/api/complaints', payload);
      const complaintDbId = createData.complaint._id;
      const complaintId = createData.complaint.complaintId;

      if (!skipAssign && formData.selectedSCId) {
        // Step B: Immediately assign to selected SC (status = 'assigned')
        await api.patch(`/api/complaints/${complaintDbId}/assign`, {
          serviceCentreId: formData.selectedSCId,
        });
      }

      // Success message varies depending on whether SC was assigned
      const successMessage = !skipAssign && formData.selectedSCId
        ? `Complaint ${complaintId} created and assigned successfully!`
        : `Complaint ${complaintId} created as Unassigned. Assign an SC from the Action Centre.`;

      // Delete draft if it exists
      if (currentDraftId) {
        await api.delete(`/api/complaints/drafts/${currentDraftId}`).catch(err => {
          console.error('Failed to clean up draft:', err);
        });
      }

      navigate('/admin', { state: { successMessage } });

    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to create complaint. Please try again.');
      setSubmitting(false);
    }
  };

  if (loadingDrafts) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground font-medium">Checking for saved drafts...</p>
        </div>
      </div>
    );
  }

  if (showDraftSelection) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-border/60">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Incomplete Drafts</h1>
              <p className="text-muted-foreground text-sm mt-1">
                You have unfinished complaint drafts from previous sessions.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              ← Action Centre
            </button>
          </div>

          <div className="space-y-4">
            {draftsList.map((draft) => {
              const name = draft.formData?.customerName || 'Unnamed Customer';
              const phone = draft.formData?.phone1 || 'No Phone';
              const productType = draft.formData?.product || 'No Product';
              const stepName = STEPS[draft.currentStep - 1]?.title || `Step ${draft.currentStep}`;
              const lastUpdated = new Date(draft.updatedAt).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={draft._id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground text-sm">{name}</h3>
                    <p className="text-muted-foreground text-xs">
                      Phone: <span className="font-semibold text-foreground">{phone}</span>
                      {draft.formData?.product && (
                        <> | Product: <span className="font-semibold text-foreground capitalize">{productType}</span></>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80">
                      Last edited: <span className="font-medium">{lastUpdated}</span> | Saved at: <span className="font-bold text-primary">{stepName}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleResumeDraft(draft)}
                      className="flex-1 sm:flex-initial px-4.5 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition shadow-sm"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(draft._id)}
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-5 border-t border-border/60 flex justify-end gap-3">
            <button
              onClick={handleStartFresh}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground transition shadow-sm"
            >
              Start Fresh (New Complaint)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="text-sm text-muted-foreground hover:text-foreground transition mb-4 flex items-center gap-1"
          >
            ← Back to Action Centre
          </button>
          <h1 className="text-2xl font-bold text-foreground">New Complaint</h1>
          <p className="text-muted-foreground text-sm mt-1">Register a new service complaint in 5 steps.</p>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    currentStep > step.number
                      ? 'bg-green-600 text-white'
                      : currentStep === step.number
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                <p className={`text-xs mt-1 font-medium hidden sm:block ${currentStep === step.number ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </p>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 transition-all ${currentStep > step.number ? 'bg-green-600' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-foreground mb-5">
            Step {currentStep}: {STEPS[currentStep - 1].title}
          </h2>

          {currentStep === 1 && (
            <Step1CustomerInfo
              formData={formData}
              setFormData={setFormData}
            />
          )}
          {/* Step 2 — Product Info (Bill Date, Shop Name, Serial, Model, Warranty) */}
          {currentStep === 2 && (
            <Step2ProductInfo formData={formData} setFormData={setFormData} />
          )}
          {/* Step 3 — Product & Complaint Type (was Step 2) */}
          {currentStep === 3 && (
            <Step3ProductType formData={formData} setFormData={setFormData} />
          )}
          {/* Step 4 — Charges & Media (was Step 3) */}
          {currentStep === 4 && (
            <Step4Charges formData={formData} setFormData={setFormData} />
          )}
          {/* Step 5 — Assign Service Centre (was Step 4) */}
          {currentStep === 5 && (
            <Step5AssignSC
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          )}

          {/* Step Validation Error */}
          {stepError && (
            <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {stepError}
            </div>
          )}

          {/* Final Submit Error */}
          {submitError && (
            <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          {/* Navigation Buttons (Steps 1–4 only; Step 5 has its own submit button) */}
          {currentStep < 5 && (
            <div className="flex justify-between mt-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={goBack}
                disabled={currentStep === 1}
                className="px-5 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Back
              </button>
              <button
                type="button"
                id={`step${currentStep}-next`}
                onClick={goNext}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
              >
                Next →
              </button>
            </div>
          )}
          {currentStep === 5 && (
            <div className="flex justify-start mt-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={goBack}
                className="px-5 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
