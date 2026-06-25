import { useState, useEffect } from 'react';
import api from '../../api/axios';
import InlineCitySelect from '../ui/InlineCitySelect';
import { Loader2, X, Plus } from 'lucide-react';

// GRD Section 6.5 — Step 5 (was Step 4): Assign Service Centre
// Filters SCs by: customer's city (primary), district (secondary), product capability
// Shows each SC with live load stats
// Admin clicks a card to select → Submit triggers create + assign in sequence
// Admin can also skip assignment — complaint is created as 'unassigned' and
// assigned later from the Action Centre or complaint detail view (v1.3 Change 1A).

const CAPABILITY_LABELS = {
  led_only: 'LED Only',
  cooler_only: 'Cooler Only',
  both: 'LED + Cooler',
};

// Map product to required capability
const getRequiredCapabilities = (product) => {
  if (product === 'led') return ['led_only', 'both'];
  if (product === 'cooler') return ['cooler_only', 'both'];
  if (product === 'both') return ['both'];
  return [];
};

export default function Step5AssignSC({ formData, setFormData, onSubmit, submitting }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Unregistered SC Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalData, setModalData] = useState({
    name: '',
    phone1: '',
    phone2: '',
    city: formData.city || '',
    district: formData.district || '',
    state: formData.state || '',
    fullAddress: '',
    productCapability: 'both',
  });
  const [creatingSC, setCreatingSC] = useState(false);
  const [createError, setCreateError] = useState('');

  const [prevCity, setPrevCity] = useState(formData.city);
  const [prevDistrict, setPrevDistrict] = useState(formData.district);
  const [prevState, setPrevState] = useState(formData.state);

  if (formData.city !== prevCity || formData.district !== prevDistrict || formData.state !== prevState) {
    setPrevCity(formData.city);
    setPrevDistrict(formData.district);
    setPrevState(formData.state);
    setModalData(prev => ({
      ...prev,
      city: formData.city || '',
      district: formData.district || '',
      state: formData.state || '',
    }));
  }

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch active SCs (both registered and unregistered)
        const { data } = await api.get('/api/service-centres', {
          params: {
            status: 'active',
            page: 1,
            limit: 100,
          },
        });

        const allSCs = data.serviceCentres || [];
        const required = getRequiredCapabilities(formData.product);

        // Primary filter: same city. Secondary: same district if no city match found.
        // Unregistered SCs bypass capability check (default to both/always eligible).
        let cityMatches = allSCs.filter(
          (sc) =>
            sc.city?.toLowerCase() === formData.city?.toLowerCase() &&
            (sc.isUnregistered === true || required.includes(sc.productCapability))
        );

        // If no city-level match, widen to district
        if (cityMatches.length === 0) {
          cityMatches = allSCs.filter(
            (sc) =>
              sc.district?.toLowerCase() === formData.district?.toLowerCase() &&
              (sc.isUnregistered === true || required.includes(sc.productCapability))
          );
        }

        setCandidates(cityMatches);
      } catch {
        setError('Failed to load service centres. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (formData.city && formData.product) {
      fetchCandidates();
    }
  }, [formData.city, formData.district, formData.product]);

  const handleSelect = (scId) => {
    setFormData((prev) => ({ ...prev, selectedSCId: scId }));
  };

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
      // Prepend newly created SC to list and select it
      setCandidates((prev) => [data, ...prev]);
      handleSelect(data._id);
      setShowCreateModal(false);
      // Reset form
      setModalData({
        name: '',
        phone1: '',
        phone2: '',
        city: formData.city || '',
        district: formData.district || '',
        state: formData.state || '',
        fullAddress: '',
        productCapability: 'both',
      });
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create unregistered SC.');
    } finally {
      setCreatingSC(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Matching Service Centres
          </p>
          <p className="text-xs text-muted-foreground">
            Filtered by <strong>{formData.city}</strong>, {formData.district} · Product: <strong>{formData.product?.toUpperCase()}</strong>
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

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-10 text-center">
          <p className="text-muted-foreground text-sm">
            No active service centres found for <strong>{formData.city}</strong> with{' '}
            <strong>{formData.product?.toUpperCase()}</strong> capability.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            You can go back and change the city, or click "+ Create Unregistered SC" above to register one on the spot.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {candidates.map((sc) => {
            const isSelected = formData.selectedSCId === sc._id;
            return (
              <div
                key={sc._id}
                onClick={() => handleSelect(sc._id)}
                className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-card hover:border-ring'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{sc.businessName}</p>
                      {sc.isUnregistered && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          UNREGISTERED SC
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {sc.ownerName || 'Admin Maintained'} · {sc.city}, {sc.district}
                    </p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>📞 {sc.phone1}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {sc.isUnregistered ? 'LED + Cooler' : CAPABILITY_LABELS[sc.productCapability]}
                      </span>
                    </div>
                  </div>

                  {/* Live stats */}
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <p className="font-semibold text-foreground text-sm">Load Stats</p>
                    <p>Assigned: <strong>{sc.stats?.assigned ?? 0}</strong></p>
                    <p>Pending: <strong>{sc.stats?.pending ?? 0}</strong></p>
                    <p>Done this month: <strong>{sc.stats?.doneThisMonth ?? 0}</strong></p>
                  </div>
                </div>

                {isSelected && (
                  <p className="text-xs text-primary font-semibold mt-3">✓ Selected</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Button & Skip option */}
      <div className="pt-4 space-y-3">
        <button
          id="step5-submit"
          type="button"
          disabled={!formData.selectedSCId || submitting}
          onClick={() => onSubmit(false)}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? 'Submitting...' : 'Create & Assign Complaint'}
        </button>
        {!formData.selectedSCId && !loading && (
          <p className="text-xs text-muted-foreground text-center">
            Select a service centre to enable assignment.
          </p>
        )}

        <button
          id="step5-skip"
          type="button"
          disabled={submitting}
          onClick={() => {
            setFormData((prev) => ({ ...prev, selectedSCId: null }));
            onSubmit(true);
          }}
          className="w-full py-3 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground font-semibold text-sm transition"
        >
          Skip — Assign Later
        </button>

        <p className="text-xs text-muted-foreground text-center mt-2">
          You can assign an SC from the complaint detail view or Action Centre.
        </p>
      </div>

      {/* Unregistered SC Creation Dialog Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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
                  onChange={({ city, district, state }) => {
                    setModalData(prev => ({
                      ...prev,
                      city,
                      district,
                      state,
                    }));
                  }}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">District</label>
                  <input
                    type="text"
                    value={modalData.district}
                    readOnly
                    className="flex h-9 w-full rounded-lg border border-input bg-muted px-3 py-1 text-sm shadow-sm cursor-not-allowed"
                    placeholder="Auto-filled from city"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">State</label>
                  <input
                    type="text"
                    value={modalData.state}
                    readOnly
                    className="flex h-9 w-full rounded-lg border border-input bg-muted px-3 py-1 text-sm shadow-sm cursor-not-allowed"
                    placeholder="Auto-filled from city"
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
    </div>
  );
}
