import { useState, useEffect } from 'react';
import api from '../../api/axios';
import ImageUploader from './ImageUploader';
import VoiceRecorder from './VoiceRecorder';

// GRD Section 6.4 — Step 4 (was Step 3): Charges & Media
// Change 6A: BOTH in-warranty AND out-of-warranty complaints use preset + petrol + extras.
// SC gets paid preset + petrol + approved extras from Microvison in ALL cases.
// For OOW: customer payments are recorded separately in the complaint detail panel
// and deducted from what Microvison owes the SC.

export default function Step4Charges({ formData, setFormData }) {
  const [presets, setPresets] = useState([]);
  const [loadingPresets, setLoadingPresets] = useState(false);

  const isInWarranty = formData.warrantyStatus === 'in_warranty';

  // Fetch presets filtered by product + complaintType (for BOTH warranty types)
  useEffect(() => {
    let active = true;
    if (!formData.product || !formData.complaintType) {
      Promise.resolve().then(() => {
        if (active) setPresets([]);
      });
      return;
    }

    const fetchPresets = async () => {
      setLoadingPresets(true);
      try {
        // Map product + complaintType to preset type
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
  }, [formData.product, formData.complaintType, formData.warrantyStatus]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Extra Charges management
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

      {/* ── OUT-OF-WARRANTY BANNER ─────────────────────────────────── */}
      {!isInWarranty && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900 space-y-1.5">
          <p className="font-semibold">⚠ Out of Warranty — SC still gets paid normally</p>
          <p className="text-amber-800 text-xs leading-relaxed">
            Set the preset, petrol estimate, and any extra charges below — <strong>Microvison pays the SC</strong> all of this.
            Customer payments (who paid, how much, at which stage) are recorded separately in the complaint detail panel after registration.
            Amounts the customer paid <em>to SC directly</em> will be subtracted from what Microvison owes the SC.
          </p>
        </div>
      )}

      {/* ── PRESET SELECTOR (both warranty types) ──────────────────── */}
      <div>
        <label className={labelCls}>
          Pricing Preset <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          {isInWarranty
            ? 'Price is locked permanently after complaint creation.'
            : 'SC earns this amount from Microvison. Admin records what customer paid separately.'}
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

      {/* ── PETROL (both warranty types) ───────────────────────────── */}
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

      {/* ── INITIAL CUSTOMER PAYMENT (Out-of-warranty only) ───────── */}
      {!isInWarranty && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-blue-900">Record Initial Customer Payment (Optional)</h4>
            <p className="text-xs text-blue-800/80 mt-1">
              Did the customer pay anything upfront? This will be recorded in the complaint immediately.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.initialPaymentAmount || ''}
                onChange={(e) => handleChange('initialPaymentAmount', e.target.value)}
                placeholder="e.g. 500"
                className={`${inputCls} border-blue-200 bg-white`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">Payment Route</label>
              <select
                value={formData.initialPaymentRoute || 'to_sc'}
                onChange={(e) => handleChange('initialPaymentRoute', e.target.value)}
                className={`${inputCls} border-blue-200 bg-white`}
                disabled={!formData.initialPaymentAmount}
              >
                <option value="to_sc">Paid to SC directly</option>
                <option value="to_microvison">Paid to Microvison (Company)</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">Payment Reason / Note</label>
            <input
              type="text"
              value={formData.initialPaymentReason || ''}
              onChange={(e) => handleChange('initialPaymentReason', e.target.value)}
              placeholder="e.g. Advance payment during registration"
              className={`${inputCls} border-blue-200 bg-white`}
              disabled={!formData.initialPaymentAmount}
            />
          </div>
        </div>
      )}

      {/* ── EXTRA CHARGES (both warranty types) ─────────────────────── */}
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

      {/* ── NOTES ──────────────────────────────────────────────────── */}
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

      {/* ── VOICE NOTE ──────────────────────────────────────────────── */}
      <div>
        <label className={labelCls}>Voice Note (optional, max 60 seconds)</label>
        <VoiceRecorder
          uploadedUrl={formData.voiceNoteUrl || ''}
          onUpload={(url) => handleChange('voiceNoteUrl', url)}
        />
      </div>

      {/* ── ADMIN PHOTOS (max 2) ─────────────────────────────────────── */}
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
