// GRD Section 6.3 — Step 3 (was Step 2): Product & Complaint Type
// Handles selecting product type (LED/Cooler) and complaint type (installation/complaint).
// Product type is locked if linked from Step 1 product tracking.
// Warranty and bill info have been moved to the new Step 2 (Step2ProductInfo.jsx).

import { useEffect } from 'react';

const PRODUCTS = [
  { value: 'led', label: 'LED', icon: '💡' },
  { value: 'cooler', label: 'Cooler', icon: '❄️' },
];

export default function Step3ProductType({ formData, setFormData }) {
  // If a product was linked in Step 1, its product type is locked
  const isProductLocked = !!formData.trackingId;

  // Coolers always have complaintType = complaint
  useEffect(() => {
    if (formData.product === 'cooler' && formData.complaintType !== 'complaint') {
      setFormData((prev) => ({ ...prev, complaintType: 'complaint' }));
    }
  }, [formData.product, formData.complaintType, setFormData]);

  const handleProductChange = (product) => {
    if (isProductLocked) return;

    // Coolers always have complaintType = complaint
    const newType = product === 'cooler' ? 'complaint' : (formData.complaintType || '');
    setFormData((prev) => ({
      ...prev,
      product,
      complaintType: product === 'cooler' ? 'complaint' : newType,
    }));
  };

  const handleTypeChange = (type) => {
    setFormData((prev) => ({ ...prev, complaintType: type }));
  };

  const cardBase = 'flex-1 min-w-[120px] rounded-xl border-2 p-4 transition-all text-center';
  const cardActive = 'border-primary bg-primary text-primary-foreground shadow-md scale-[1.02] cursor-pointer';
  const cardInactive = 'border-border bg-card text-foreground hover:border-ring cursor-pointer';
  const cardLockedActive = 'border-primary bg-primary text-primary-foreground shadow-md opacity-90 cursor-not-allowed';
  const cardLockedInactive = 'border-border bg-card/50 text-muted-foreground opacity-50 cursor-not-allowed hidden';

  return (
    <div className="space-y-8 relative">
      {isProductLocked && (
        <div className="absolute top-0 right-0 rounded bg-blue-100 text-blue-800 text-xs px-2 py-1 font-semibold">
          Product Details Locked (Linked to {formData.trackingId})
        </div>
      )}

      {/* Product Selection */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Product <span className="text-red-500">*</span>
        </p>
        <div className="flex flex-wrap gap-3">
          {PRODUCTS.map((p) => {
            let className = cardInactive;
            if (formData.product === p.value) {
              className = isProductLocked ? cardLockedActive : cardActive;
            } else if (isProductLocked) {
              className = cardLockedInactive;
            }
            return (
              <button
                key={p.value}
                type="button"
                id={`step3-product-${p.value}`}
                onClick={() => handleProductChange(p.value)}
                className={`${cardBase} ${className}`}
                disabled={isProductLocked}
              >
                <div className="text-2xl mb-1">{p.icon}</div>
                <div className="text-sm font-semibold">{p.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Complaint Type */}
      {formData.product && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Complaint Type <span className="text-red-500">*</span>
          </p>
          {formData.product === 'cooler' ? (
            <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              Cooler complaints are always of type <strong>Complaint</strong> (no installation option).
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'installation', label: 'Installation', icon: '🔧' },
                { value: 'complaint', label: 'Complaint / Service', icon: '🛠️' },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  id={`step3-type-${t.value}`}
                  onClick={() => handleTypeChange(t.value)}
                  className={`${cardBase} ${formData.complaintType === t.value ? cardActive : cardInactive}`}
                >
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="text-sm font-semibold">{t.label}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
