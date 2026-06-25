import { useState, useEffect } from 'react';
import api from '../../api/axios';

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

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch active SCs, we filter by city/district/capability client-side for clarity
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
        let cityMatches = allSCs.filter(
          (sc) =>
            sc.city?.toLowerCase() === formData.city?.toLowerCase() &&
            required.includes(sc.productCapability)
        );

        // If no city-level match, widen to district
        if (cityMatches.length === 0) {
          cityMatches = allSCs.filter(
            (sc) =>
              sc.district?.toLowerCase() === formData.district?.toLowerCase() &&
              required.includes(sc.productCapability)
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

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Matching Service Centres
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Filtered by <strong>{formData.city}</strong>, {formData.district} · Product: <strong>{formData.product?.toUpperCase()}</strong>
        </p>
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
            You can go back and change the city, or register a new service centre first.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
                    <p className="font-semibold text-foreground">{sc.businessName}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {sc.ownerName} · {sc.city}, {sc.district}
                    </p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>📞 {sc.phone1}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {CAPABILITY_LABELS[sc.productCapability]}
                      </span>
                    </div>
                  </div>

                  {/* Live stats (Phase 7 onwards — zeroes until complaints exist) */}
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <p className="font-semibold text-foreground text-sm">Load Stats</p>
                    <p>Assigned: <strong>{sc.stats?.assigned ?? '—'}</strong></p>
                    <p>Pending: <strong>{sc.stats?.pending ?? '—'}</strong></p>
                    <p>Done this month: <strong>{sc.stats?.doneThisMonth ?? '—'}</strong></p>
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
    </div>
  );
}
