// GRD Section 6.2 — Step 2: Product & Type
// Product: LED / Cooler / Both
// LED → type: Installation or Complaint
// Cooler → type is ALWAYS auto-set to 'complaint' (no installation for coolers)
// Both → admin selects LED type; Cooler is auto-set to complaint
// Warranty: in_warranty | out_of_warranty (single flag for whole complaint)

const PRODUCTS = [
  { value: 'led', label: 'LED', icon: '💡' },
  { value: 'cooler', label: 'Cooler', icon: '❄️' },
  { value: 'both', label: 'LED + Cooler', icon: '💡❄️' },
];

const WARRANTY_OPTIONS = [
  { value: 'in_warranty', label: 'In Warranty', description: 'Microvison pays the SC' },
  { value: 'out_of_warranty', label: 'Out of Warranty', description: 'Customer pays SC directly' },
];

export default function Step2ProductType({ formData, setFormData }) {
  const handleProductChange = (product) => {
    // Coolers & both always have complaintType = complaint for the cooler part
    // For simplicity, if cooler is selected, lock complaintType to 'complaint'
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

  const handleWarrantyChange = (warrantyStatus) => {
    setFormData((prev) => ({ ...prev, warrantyStatus }));
  };

  const cardBase = 'flex-1 min-w-[120px] rounded-xl border-2 p-4 cursor-pointer transition-all text-center';
  const cardActive = 'border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]';
  const cardInactive = 'border-border bg-card text-foreground hover:border-ring';

  return (
    <div className="space-y-8">
      {/* Product Selection */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Product <span className="text-red-500">*</span>
        </p>
        <div className="flex flex-wrap gap-3">
          {PRODUCTS.map((p) => (
            <button
              key={p.value}
              type="button"
              id={`step2-product-${p.value}`}
              onClick={() => handleProductChange(p.value)}
              className={`${cardBase} ${formData.product === p.value ? cardActive : cardInactive}`}
            >
              <div className="text-2xl mb-1">{p.icon}</div>
              <div className="text-sm font-semibold">{p.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Complaint Type — shown for LED and Both; hidden/locked for Cooler */}
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
                  id={`step2-type-${t.value}`}
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

      {/* Warranty Selection */}
      {formData.product && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Warranty Status <span className="text-red-500">*</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {WARRANTY_OPTIONS.map((w) => (
              <button
                key={w.value}
                type="button"
                id={`step2-warranty-${w.value}`}
                onClick={() => handleWarrantyChange(w.value)}
                className={`${cardBase} text-left ${formData.warrantyStatus === w.value ? cardActive : cardInactive}`}
              >
                <div className="text-sm font-bold">{w.label}</div>
                <div className={`text-xs mt-1 ${formData.warrantyStatus === w.value ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {w.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
