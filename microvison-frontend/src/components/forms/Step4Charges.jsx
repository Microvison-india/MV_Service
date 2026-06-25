import { useState, useEffect } from 'react';
import api from '../../api/axios';
import ImageUploader from './ImageUploader';
import VoiceRecorder from './VoiceRecorder';

// GRD Section 6.4 — Step 4 (was Step 3): Charges & Media
// In-warranty: preset selector + petrol estimate + extra charges
// Out-of-warranty: no preset, no petrol, only optional admin-added extras
// Both warranty types: notes (text), voice note (max 60s), 2 admin photos

export default function Step4Charges({ formData, setFormData }) {
  const [presets, setPresets] = useState([]);
  const [loadingPresets, setLoadingPresets] = useState(false);

  const isInWarranty = formData.warrantyStatus === 'in_warranty';

  // Fetch presets filtered by product + complaintType
  useEffect(() => {
    let active = true;
    if (!isInWarranty || !formData.product || !formData.complaintType) {
      Promise.resolve().then(() => {
        if (active) setPresets([]);
      });
      return;
    }

    const fetchPresets = async () => {
      setLoadingPresets(true);
      try {
        // Map product + complaintType to preset type
        // GRD: installation_led for LED installation; complaint_led, complaint_cooler, complaint_both for others
        let presetType = '';
        if (formData.complaintType === 'installation' && (formData.product === 'led' || formData.product === 'both')) {
          presetType = 'installation_led';
        } else if (formData.product === 'led') {
          presetType = 'complaint_led';
        } else if (formData.product === 'cooler') {
          presetType = 'complaint_cooler';
        } else if (formData.product === 'both') {
          presetType = 'complaint_both';
        }

        const { data } = await api.get('/api/presets', { params: { type: presetType, status: 'active' } });
        if (active) setPresets(data.presets || data);
      } catch {
        if (active) setPresets([]);
      } finally {
        if (active) setLoadingPresets(false);
      }
    };
    fetchPresets();

    return () => {
      active = false;
    };
  }, [formData.product, formData.complaintType, formData.warrantyStatus, isInWarranty]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Extra Charges management (GRD 6.4)
  const addExtraCharge = () => {
    setFormData((prev) => ({
      ...prev,
      extraCharges: [...(prev.extraCharges || []), { label: '', amount: '' }],
    }));
  };

  const updateExtraCharge = (idx, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.extraCharges || [])];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, extraCharges: updated };
    });
  };

  const removeExtraCharge = (idx) => {
    setFormData((prev) => ({
      ...prev,
      extraCharges: (prev.extraCharges || []).filter((_, i) => i !== idx),
    }));
  };

  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';
  const labelCls = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1';

  return (
    <div className="space-y-6">

      {/* ── PRESET SELECTOR (in-warranty only) ────────────────── */}
      {isInWarranty && (
        <div>
          <label className={labelCls}>
            Pricing Preset <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Price is locked permanently after complaint creation.
          </p>
          {loadingPresets ? (
            <div className="h-9 bg-muted rounded-lg animate-pulse w-full" />
          ) : (
            <div className="space-y-3">
              <select
                id="step4-preset"
                value={formData.presetId || ''}
                onChange={(e) => handleChange('presetId', e.target.value)}
                className={inputCls}
                required
              >
                <option value="">Select a preset...</option>
                <option value="manual" className="font-bold">➕ Custom / Manual Entry</option>
                {presets.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.packageName} — ₹{p.price} ({p.modelNo})
                  </option>
                ))}
              </select>

              {formData.presetId === 'manual' && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border flex gap-3 items-end">
                  <div className="flex-1">
                    <label className={labelCls}>Custom Preset Title</label>
                    <input
                      type="text"
                      value={formData.customPresetName || ''}
                      onChange={(e) => handleChange('customPresetName', e.target.value)}
                      placeholder="e.g. Special Motor Repair"
                      className={inputCls}
                    />
                  </div>
                  <div className="w-32">
                    <label className={labelCls}>Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.customPresetPrice || ''}
                      onChange={(e) => handleChange('customPresetPrice', e.target.value)}
                      placeholder="e.g. 500"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PETROL (in-warranty only) ──────────────────────────── */}
      {isInWarranty && (
        <div>
          <label className={labelCls}>Petrol / Diesel Estimate (₹)</label>
          <p className="text-xs text-muted-foreground mb-2">
            Optional. This is Edit 1 of 3. SC adjusts actual later; admin can override once.
          </p>
          <input
            id="step4-petrol"
            type="number"
            min="0"
            value={formData.petrolAdmin || ''}
            onChange={(e) => handleChange('petrolAdmin', e.target.value)}
            placeholder="e.g. 150"
            className={`${inputCls} max-w-xs`}
          />
        </div>
      )}

      {/* ── OUT-OF-WARRANTY INFO ────────────────────────────────── */}
      {!isInWarranty && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          <strong>Out of Warranty</strong> — No preset or petrol charge from Microvison. The customer pays the SC directly.
          You may add optional extra charges below if Microvison is covering a specific cost (e.g. a spare part).
        </div>
      )}

      {/* ── EXTRA CHARGES (both warranty types) ─────────────────── */}
      <div>
        <label className={labelCls}>Extra Charges (optional)</label>
        <p className="text-xs text-muted-foreground mb-3">
          Admin-added extras are pre-approved. SC can also request extras after the visit.
        </p>
        {(formData.extraCharges || []).map((ec, idx) => (
          <div key={idx} className="flex gap-3 items-center mb-2 w-full">
            <input
              type="text"
              value={ec.label}
              onChange={(e) => updateExtraCharge(idx, 'label', e.target.value)}
              placeholder="Label (e.g. Spare part)"
              className={`${inputCls} flex-grow flex-1 min-w-[120px]`}
              style={{ width: '0px' }}
            />
            <input
              type="number"
              min="0"
              value={ec.amount}
              onChange={(e) => updateExtraCharge(idx, 'amount', e.target.value)}
              placeholder="₹ Amount"
              className={`${inputCls} shrink-0`}
              style={{ width: '100px' }}
            />
            <button
              type="button"
              onClick={() => removeExtraCharge(idx)}
              className="text-red-500 hover:text-red-700 text-sm font-bold px-2 shrink-0"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          id="step4-add-extra"
          onClick={addExtraCharge}
          className="mt-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition"
        >
          + Add Extra Charge
        </button>
      </div>

      {/* ── NOTES ──────────────────────────────────────────────── */}
      <div>
        <label className={labelCls}>Admin Notes (optional)</label>
        <textarea
          id="step4-notes"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
          placeholder="Any additional instructions shown to the SC on the request card..."
          className={inputCls}
        />
      </div>

      {/* ── VOICE NOTE ──────────────────────────────────────────── */}
      <div>
        <label className={labelCls}>Voice Note (optional, max 60 seconds)</label>
        <VoiceRecorder
          uploadedUrl={formData.voiceNoteUrl || ''}
          onUpload={(url) => handleChange('voiceNoteUrl', url)}
        />
      </div>

      {/* ── ADMIN PHOTOS (max 2) ─────────────────────────────────── */}
      <div>
        <label className={labelCls}>
          Admin Photos (optional, max 2)
        </label>
        <ImageUploader
          maxFiles={2}
          uploadedUrls={formData.adminPhotos || []}
          onUpload={(urls) => handleChange('adminPhotos', urls)}
        />
      </div>
    </div>
  );
}
