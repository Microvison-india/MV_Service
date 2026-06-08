import { useState, useEffect } from 'react';
import api from '../../api/axios';
import ReopenBanner from '../complaint/ReopenBanner';

// GRD Section 6.1 — Step 1: Customer Information
// Fields: customerName, phone1, phone2, localAddress, city (dropdown), district (auto), state (auto)
// On phone1 blur: check for reopen eligibility (requires product + complaintType from Step 2 — we check again in Step 2)

export default function Step1CustomerInfo({ formData, setFormData, reopenData, setReopenData }) {
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [checkingReopen, setCheckingReopen] = useState(false);
  const [reopenResult, setReopenResult] = useState(null); // null | { reopenEligible, existingComplaint }
  const [showBanner, setShowBanner] = useState(false);

  // Fetch all cities for the dropdown
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data } = await api.get('/api/cities');
        setCities(data);
      } catch {
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // When city is selected, auto-fill district and state from the city record
  const handleCityChange = (cityName) => {
    const selected = cities.find((c) => c.city === cityName);
    setFormData((prev) => ({
      ...prev,
      city: cityName,
      district: selected?.district || '',
      state: selected?.state || '',
    }));
  };

  // GRD Section 6.1 — On phone1 blur, check reopen eligibility
  // NOTE: We need product + complaintType for reopen check. If they aren't set yet (Step 2 comes later),
  // we skip the check here and re-trigger it at the start of Step 2.
  const checkReopen = async () => {
    if (!formData.phone1 || formData.phone1.length < 10) return;
    if (!formData.product || !formData.complaintType) return; // not enough info yet

    setCheckingReopen(true);
    try {
      const { data } = await api.get('/api/complaints/reopen-check', {
        params: {
          phone1: formData.phone1,
          product: formData.product,
          complaintType: formData.complaintType,
        },
      });
      setReopenResult(data);
      if (data.reopenEligible) {
        setShowBanner(true);
      }
    } catch {
      // Silent fail — reopen check is a helper, not a blocker
    } finally {
      setCheckingReopen(false);
    }
  };

  const handleReopenConfirm = ({ reopenNotes, reopenPhotos }) => {
    setReopenData({
      isReopened: true,
      reopenParentId: reopenResult.existingComplaint._id,
      reopenNotes,
      reopenPhotos,
    });
    setShowBanner(false);
  };

  const handleReopenDismiss = () => {
    setReopenData({ isReopened: false, reopenParentId: null, reopenNotes: '', reopenPhotos: [] });
    setShowBanner(false);
  };

  // Get unique states and districts for filter cascading
  const uniqueStates = [...new Set(cities.map((c) => c.state))].sort();
  const filteredCities = formData.state
    ? cities.filter((c) => c.state === formData.state)
    : cities;

  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';
  const labelCls = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1';

  return (
    <div className="space-y-5">
      {/* Reopen Badge if confirmed */}
      {reopenData?.isReopened && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-300 px-4 py-2 text-sm text-yellow-800 font-medium">
          ✓ This will be logged as a <strong>Reopened Complaint</strong> referencing{' '}
          {reopenResult?.existingComplaint?.complaintId}.
        </div>
      )}

      {/* ReopenBanner */}
      {showBanner && reopenResult?.existingComplaint && (
        <ReopenBanner
          existingComplaint={reopenResult.existingComplaint}
          onReopen={handleReopenConfirm}
          onDismiss={handleReopenDismiss}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Customer Name */}
        <div className="sm:col-span-2">
          <label className={labelCls}>Customer Name <span className="text-red-500">*</span></label>
          <input
            id="step1-customerName"
            type="text"
            value={formData.customerName || ''}
            onChange={(e) => handleChange('customerName', e.target.value)}
            placeholder="Full name"
            className={inputCls}
            required
          />
        </div>

        {/* Phone 1 */}
        <div>
          <label className={labelCls}>Phone Number 1 <span className="text-red-500">*</span></label>
          <input
            id="step1-phone1"
            type="tel"
            value={formData.phone1 || ''}
            onChange={(e) => handleChange('phone1', e.target.value)}
            onBlur={checkReopen}
            placeholder="Primary contact"
            className={inputCls}
            required
          />
          {checkingReopen && <p className="text-xs text-muted-foreground mt-1">Checking for existing complaints...</p>}
        </div>

        {/* Phone 2 */}
        <div>
          <label className={labelCls}>Phone Number 2</label>
          <input
            id="step1-phone2"
            type="tel"
            value={formData.phone2 || ''}
            onChange={(e) => handleChange('phone2', e.target.value)}
            placeholder="Alternate contact (optional)"
            className={inputCls}
          />
        </div>

        {/* Local Address */}
        <div className="sm:col-span-2">
          <label className={labelCls}>Local Address <span className="text-red-500">*</span></label>
          <textarea
            id="step1-localAddress"
            value={formData.localAddress || ''}
            onChange={(e) => handleChange('localAddress', e.target.value)}
            placeholder="Street / locality / area / landmark"
            rows={2}
            className={inputCls}
            required
          />
        </div>

        {/* State */}
        <div>
          <label className={labelCls}>State <span className="text-red-500">*</span></label>
          <select
            id="step1-state"
            value={formData.state || ''}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, state: e.target.value, city: '', district: '' }));
            }}
            className={inputCls}
            required
          >
            <option value="">Select State</option>
            {uniqueStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className={labelCls}>City <span className="text-red-500">*</span></label>
          {loadingCities ? (
            <div className="h-9 bg-muted rounded-lg animate-pulse" />
          ) : (
            <select
              id="step1-city"
              value={formData.city || ''}
              onChange={(e) => handleCityChange(e.target.value)}
              className={inputCls}
              required
            >
              <option value="">Select City</option>
              {filteredCities.map((c) => (
                <option key={c._id} value={c.city}>{c.city}</option>
              ))}
            </select>
          )}
        </div>

        {/* District — auto-filled */}
        <div>
          <label className={labelCls}>District</label>
          <input
            type="text"
            value={formData.district || ''}
            readOnly
            placeholder="Auto-filled from city"
            className={`${inputCls} bg-muted text-muted-foreground cursor-not-allowed`}
          />
        </div>
      </div>
    </div>
  );
}
