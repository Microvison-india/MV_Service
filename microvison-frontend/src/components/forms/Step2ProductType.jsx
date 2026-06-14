import { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';

const PRODUCTS = [
  { value: 'led', label: 'LED', icon: '💡' },
  { value: 'cooler', label: 'Cooler', icon: '❄️' },
];

export default function Step2ProductType({ formData, setFormData }) {
  // If a product was linked in Step 1, its product type is locked
  const isProductLocked = !!formData.trackingId;

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

  // When billDate or complaintType changes, recalculate warranty preview
  // Note: Actual calculation happens on backend, this is just for UI preview
  useEffect(() => {
    if (isProductLocked) return; // Linked products use their own locked warranty status
    if (!formData.product || !formData.complaintType) return;

    // Simple frontend preview logic (mirroring backend calculateWarranty)
    if (formData.billDate) {
      const bDate = new Date(formData.billDate);
      const expiry = new Date(bDate);
      expiry.setFullYear(expiry.getFullYear() + 3);
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const expiryEndOfDay = new Date(expiry);
      expiryEndOfDay.setHours(23,59,59,999);
      
      const newStatus = today <= expiryEndOfDay ? 'in_warranty' : 'out_of_warranty';
      if (formData.warrantyStatus !== newStatus || formData.warrantySource !== 'auto_calculated') {
        setFormData(prev => ({...prev, warrantyStatus: newStatus, warrantySource: 'auto_calculated'}));
      }
    } else if (formData.warrantySource !== 'manual') {
      // Apply defaults if no bill and not manually overridden
      const defaultStatus = formData.complaintType === 'installation' ? 'in_warranty' : 'out_of_warranty';
      if (formData.warrantyStatus !== defaultStatus) {
        setFormData(prev => ({...prev, warrantyStatus: defaultStatus, warrantySource: 'auto_calculated'}));
      }
    }
  }, [formData.billDate, formData.complaintType, formData.product, isProductLocked, setFormData, formData.warrantyStatus, formData.warrantySource]);

  const handleManualWarranty = (status) => {
    setFormData(prev => ({
      ...prev,
      warrantyStatus: status,
      warrantySource: 'manual'
    }));
  };

  const handleBillUpload = (urls) => {
    setFormData((prev) => ({ ...prev, billPhoto: urls[0] || '' }));
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
                id={`step2-product-${p.value}`}
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

      {/* Warranty & Bill Details */}
      {formData.product && formData.complaintType && (
        <div className="border-t pt-6 mt-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Warranty & Bill Information
          </p>
          
          {isProductLocked ? (
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-sm font-medium text-muted-foreground">Warranty Status:</span>
                <span className={`text-sm font-bold px-2 py-1 rounded ${formData.warrantyStatus === 'in_warranty' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {formData.warrantyStatus === 'in_warranty' ? 'In Warranty' : 'Out of Warranty'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">Bill Date</span>
                  <span className="text-sm font-medium">{formData.billDate ? new Date(formData.billDate).toLocaleDateString() : 'Not provided'}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">Bill Photo</span>
                  {formData.billPhoto ? (
                    <a href={formData.billPhoto} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">View Bill</a>
                  ) : (
                    <span className="text-sm text-muted-foreground">No photo</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Invoice Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-card border rounded-lg p-4 shadow-sm">
                <div>
                  <label className="block text-sm font-medium mb-2">Invoice Date</label>
                  <input
                    type="date"
                    value={formData.billDate ? formData.billDate.split('T')[0] : ''}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData(prev => ({ ...prev, billDate: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Providing a bill date automatically calculates the 3-year warranty status.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Invoice Photo (Optional)</label>
                  {formData.billPhoto ? (
                    <div className="flex items-center gap-3">
                      <a href={formData.billPhoto} target="_blank" rel="noreferrer" className="text-sm text-primary underline truncate max-w-[150px]">
                        bill_image.jpg
                      </a>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, billPhoto: ''}))} className="text-xs text-red-500 hover:text-red-700">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <ImageUploader maxFiles={1} uploadedUrls={[]} onUpload={handleBillUpload} />
                  )}
                </div>
              </div>

              {/* Warranty Preview / Override */}
              <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border">
                <div>
                  <h4 className="text-sm font-medium">Calculated Status: 
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${formData.warrantyStatus === 'in_warranty' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {formData.warrantyStatus === 'in_warranty' ? 'IN WARRANTY' : 'OUT OF WARRANTY'}
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.warrantySource === 'auto_calculated' 
                      ? (formData.billDate ? 'Based on 3 years from bill date.' : `Default for ${formData.complaintType}.`)
                      : 'Manually overridden.'}
                  </p>
                </div>
                
                {/* Manual Override Buttons */}
                {!formData.billDate && (
                  <div className="flex bg-background border rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => handleManualWarranty('in_warranty')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition ${formData.warrantyStatus === 'in_warranty' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      Force In-Warranty
                    </button>
                    <button
                      type="button"
                      onClick={() => handleManualWarranty('out_of_warranty')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition ${formData.warrantyStatus === 'out_of_warranty' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      Force Out-of-Warranty
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
