import { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';

const labelCls = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5';
const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function Step2ProductInfo({ formData, setFormData }) {
  const isProductLocked = !!formData.trackingId;

  // Storing initial values for pre-filled change warning comparison
  const [initialValues] = useState({
    billDate: formData.billDate || '',
    billPhoto: formData.billPhoto || '',
    shopName: formData.shopName || '',
    serialNumber: formData.serialNumber || '',
    modelNumber: formData.modelNumber || '',
  });

  const [overrideOpen, setOverrideOpen] = useState(formData.forceOverride || false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBillUpload = (urls) => {
    handleChange('billPhoto', urls[0] || '');
  };

  // Revert helper for change warnings
  const handleRevert = (field) => {
    handleChange(field, initialValues[field]);
  };

  // Client-side warranty preview logic
  useEffect(() => {
    // 1. Force override
    if (formData.forceOverride) {
      return;
    }

    // 2. Bill Date calculation
    if (formData.billDate) {
      const bDate = new Date(formData.billDate);
      const expiry = new Date(bDate);
      expiry.setFullYear(expiry.getFullYear() + 3);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryEndOfDay = new Date(expiry);
      expiryEndOfDay.setHours(23, 59, 59, 999);

      const calcStatus = today <= expiryEndOfDay ? 'in_warranty' : 'out_of_warranty';

      if (formData.warrantyStatus !== calcStatus || formData.warrantySource !== 'auto_calculated') {
        setFormData(prev => ({
          ...prev,
          warrantyStatus: calcStatus,
          warrantySource: 'auto_calculated',
          warrantyForceReason: '',
        }));
      }
    } else {
      // 3. No bill date -> manual selection defaults
      if (formData.warrantySource === 'auto_calculated') {
        const defaultStatus = formData.complaintType === 'installation' ? 'in_warranty' : 'out_of_warranty';
        setFormData(prev => ({
          ...prev,
          warrantyStatus: defaultStatus,
          warrantySource: 'manual',
          warrantyForceReason: '',
        }));
      }
    }
  }, [formData.billDate, formData.complaintType, formData.forceOverride, setFormData, formData.warrantyStatus, formData.warrantySource]);

  // Compute expiry date string for preview
  let expiryStr = '';
  if (formData.billDate && formData.warrantySource === 'auto_calculated') {
    const bDate = new Date(formData.billDate);
    const expiry = new Date(bDate);
    expiry.setFullYear(expiry.getFullYear() + 3);
    expiryStr = expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Helper to render inline change warning
  const renderChangeWarning = (field) => {
    if (!isProductLocked) return null;
    const currentVal = formData[field] || '';
    const initialVal = initialValues[field] || '';
    if (String(currentVal) !== String(initialVal)) {
      return (
        <div className="mt-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
          <span>
            Previously saved: <strong>{initialVal || '(empty)'}</strong>. You changed to: <strong>{currentVal || '(empty)'}</strong>.
          </span>
          <button
            type="button"
            onClick={() => handleRevert(field)}
            className="px-2 py-0.5 rounded bg-background hover:bg-muted border font-semibold text-foreground transition text-[10px]"
          >
            Revert
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {isProductLocked && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 p-3 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <span>ℹ️</span>
          <span>Product details pre-filled from linked tracking ID: <strong>{formData.trackingId}</strong>.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Bill Date */}
        <div>
          <label className={labelCls}>Date of purchase / installation bill</label>
          <input
            type="date"
            value={formData.billDate ? formData.billDate.split('T')[0] : ''}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => handleChange('billDate', e.target.value)}
            className={inputCls}
          />
          {renderChangeWarning('billDate', 'Bill Date')}
        </div>

        {/* Shop Name */}
        <div>
          <label className={labelCls}>Shop / dealer name</label>
          <input
            type="text"
            value={formData.shopName || ''}
            onChange={(e) => handleChange('shopName', e.target.value)}
            placeholder="Enter dealer shop name"
            className={inputCls}
          />
          {renderChangeWarning('shopName', 'Shop Name')}
        </div>

        {/* Serial Number */}
        <div>
          <label className={labelCls}>Serial Number</label>
          <input
            type="text"
            value={formData.serialNumber || ''}
            onChange={(e) => handleChange('serialNumber', e.target.value)}
            placeholder="Enter product serial number"
            className={inputCls}
          />
          {renderChangeWarning('serialNumber', 'Serial Number')}
        </div>

        {/* Model Number */}
        <div>
          <label className={labelCls}>Model number / variant</label>
          <input
            type="text"
            value={formData.modelNumber || ''}
            onChange={(e) => handleChange('modelNumber', e.target.value)}
            placeholder="e.g. MV-43LED, MV-COOLER-MAX"
            className={inputCls}
          />
          {renderChangeWarning('modelNumber', 'Model Number')}
        </div>

        {/* Bill Photo */}
        <div className="sm:col-span-2">
          <label className={labelCls}>Invoice / Bill Photo</label>
          {formData.billPhoto ? (
            <div className="flex items-center gap-3 border rounded-lg p-3 bg-muted/40">
              <a href={formData.billPhoto} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline font-medium truncate max-w-xs">
                📄 View Bill Photo
              </a>
              <button type="button" onClick={() => handleChange('billPhoto', '')} className="text-xs text-red-500 hover:text-red-700 font-semibold ml-auto">
                Remove Photo
              </button>
            </div>
          ) : (
            <ImageUploader maxFiles={1} uploadedUrls={[]} onUpload={handleBillUpload} />
          )}
          {renderChangeWarning('billPhoto', 'Bill Photo')}
        </div>
      </div>

