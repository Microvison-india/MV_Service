import { useState, useEffect } from 'react';
import { Search, Loader2, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';

import ReopenBanner from '../complaint/ReopenBanner';

export default function Step1CustomerInfo({ formData, setFormData, reopenData, setReopenData, onReopenSuccess }) {
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);

  // Product Tracking States
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [productMatches, setProductMatches] = useState([]);
  const [showMatchesModal, setShowMatchesModal] = useState(false);
  const [showSingleMatchBanner, setShowSingleMatchBanner] = useState(null);
  
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Reopen States
  const [reopenResult, setReopenResult] = useState(null);
  const [showReopenBanner, setShowReopenBanner] = useState(false);

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

  // 3-way cascading logic
  const handleStateChange = (e) => {
    const newState = e.target.value;
    setFormData((prev) => ({
      ...prev,
      state: newState,
      district: '',
      city: '',
    }));
  };

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    const matchingCity = cities.find((c) => c.district === newDistrict);
    setFormData((prev) => ({
      ...prev,
      district: newDistrict,
      state: matchingCity ? matchingCity.state : prev.state,
      city: '',
    }));
  };

  const handleCityChange = (e) => {
    const newCity = e.target.value;
    const selectedCityObj = cities.find((c) => c.name === newCity);
    setFormData((prev) => ({
      ...prev,
      city: newCity,
      district: selectedCityObj?.district || prev.district,
      state: selectedCityObj?.state || prev.state,
    }));
  };

  // ── Product Tracking: Auto-Search by Phone ─────────────────
  const checkPhoneForProducts = async () => {
    if (!formData.phone1 || formData.phone1.length < 10) return;
    
    // Don't auto-search if we already linked a product via this phone or serial
    if (formData.trackingId) return;

    setCheckingPhone(true);
    try {
      const { data } = await api.get('/api/products/search', {
        params: { phone: formData.phone1 },
      });
      
      const results = data.products || [];
      if (results.length === 1) {
        setShowSingleMatchBanner(results[0]);
      } else if (results.length > 1) {
        setProductMatches(results);
        setShowMatchesModal(true);
      }
    } catch (err) {
      console.error('Failed to search phone', err);
    } finally {
      setCheckingPhone(false);
    }
  };

  // ── Product Tracking: Manual Search ────────────────────────
  const handleManualSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      // The search endpoint checks phone, serial, name, address, trackingId
      const { data } = await api.get('/api/products/search', {
        params: { trackingId: searchQuery, serial: searchQuery, phone: searchQuery, name: searchQuery }
      });
      setSearchResults(data.products || []);
    } catch (err) {
      console.error('Failed to manually search', err);
    } finally {
      setSearching(false);
    }
  };

  // ── Product Tracking: Link Product ─────────────────────────
  const linkProduct = async (product) => {
    // Determine if we need to append phone1 to product's phones
    let newPhone2 = product.phone2;
    if (formData.phone1 && formData.phone1 !== product.phone1 && formData.phone1 !== product.phone2) {
      if (!product.phone2) {
        newPhone2 = formData.phone1; // Use entered phone as alternate if slot empty
      }
    }

    setFormData((prev) => ({
      ...prev,
      trackingId: product.trackingId,
      serialNumber: product.serialNumber || prev.serialNumber || '',
      customerName: product.customerName || prev.customerName,
      phone1: product.phone1 || prev.phone1,
      phone2: newPhone2 || prev.phone2,
      localAddress: product.localAddress || prev.localAddress,
      city: product.city || prev.city,
      district: product.district || prev.district,
      state: product.state || prev.state,
      // Pass along existing product & warranty data for Step 2 context
      linkedProductType: product.product,
      billPhoto: product.billPhoto || prev.billPhoto,
      billDate: product.billDate || prev.billDate,
      warrantyStatus: product.warrantyStatus || prev.warrantyStatus,
    }));
    
    // Clear modals and banners
    setShowSingleMatchBanner(null);
    setShowMatchesModal(false);
    setShowManualSearch(false);

    // Check Reopen Eligibility
    try {
      const { data } = await api.get(`/api/products/${product.trackingId}/reopen-check`);
      if (data.reopenEligible) {
        setReopenResult(data);
        setShowReopenBanner(true);
      }
    } catch (err) {
      console.error('Reopen check failed', err);
    }
  };

  const unlinkProduct = () => {
    setFormData((prev) => ({
      ...prev,
      trackingId: null,
      linkedProductType: null,
    }));
    setShowReopenBanner(false);
    setReopenResult(null);
    if (setReopenData) {
      setReopenData({ isReopened: false, reopenParentId: null, reopenNotes: '', reopenPhotos: [] });
    }
  };

  const handleReopenConfirm = (newComplaint) => {
    setShowReopenBanner(false);
    if (onReopenSuccess) {
      onReopenSuccess(newComplaint);
    }
  };

  const handleReopenDismiss = () => {
    if (setReopenData) {
      setReopenData({ isReopened: false, reopenParentId: null, reopenNotes: '', reopenPhotos: [] });
    }
    setShowReopenBanner(false);
  };

  // Compute dropdown options based on current selection
  const uniqueStates = [...new Set(cities.map((c) => c.state))].sort();
  
  const filteredDistricts = [...new Set(
    cities
      .filter((c) => (formData.state ? c.state === formData.state : true))
      .map((c) => c.district)
  )].sort();

  const filteredCities = [...new Set(
    cities
      .filter((c) => {
        if (formData.district) return c.district === formData.district;
        if (formData.state) return c.state === formData.state;
        return true;
      })
      .map((c) => c.name)
  )].sort();

  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';
  const labelCls = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1';

  return (
    <div className="space-y-5 relative">
      
      {/* Reopen Badge if confirmed */}
      {reopenData?.isReopened && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-300 px-4 py-2 text-sm text-yellow-800 font-medium">
          ✓ This will be logged as a <strong>Reopened Complaint</strong> referencing{' '}
          {reopenResult?.lastComplaint?.complaintId || 'previous complaint'}.
        </div>
      )}

      {/* ReopenBanner */}
      {showReopenBanner && reopenResult?.lastComplaint && (
        <ReopenBanner
          existingComplaint={reopenResult.lastComplaint}
          onReopen={handleReopenConfirm}
          onDismiss={handleReopenDismiss}
        />
      )}

      {/* Linked Product Badge */}
      {formData.trackingId && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-start justify-between">
          <div className="flex items-start gap-3 text-green-800">
            <LinkIcon className="h-5 w-5 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Linked to Product: {formData.trackingId}</p>
              <p className="text-xs mt-1">Form auto-filled. You can edit address/contact details below if they have changed.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={unlinkProduct} className="text-xs h-7">
            Unlink
          </Button>
        </div>
      )}

      {/* Single Match Banner */}
      {showSingleMatchBanner && !formData.trackingId && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3 text-blue-800">
            <Search className="h-5 w-5 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Found 1 existing product for this phone number</p>
              <div className="text-xs mt-1 space-y-1">
                <p>Tracking ID: <strong>{showSingleMatchBanner.trackingId}</strong></p>
                <p>Type: <strong>{showSingleMatchBanner.product.toUpperCase()}</strong></p>
                <p>Name: <strong>{showSingleMatchBanner.customerName}</strong></p>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => linkProduct(showSingleMatchBanner)} className="h-8">
                  Link this product
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowSingleMatchBanner(null)} className="h-8">
                  No, different product
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button 
          type="button" 
          variant="secondary" 
          size="sm" 
          onClick={() => setShowManualSearch(true)}
          className="text-xs"
        >
          <Search className="h-4 w-4 mr-2" />
          Search Product Tracking
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Phone 1 */}
        <div>
          <label className={labelCls}>Phone Number 1 <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              id="step1-phone1"
              type="tel"
              value={formData.phone1 || ''}
              onChange={(e) => handleChange('phone1', e.target.value)}
              onBlur={checkPhoneForProducts}
              placeholder="Primary contact"
              className={inputCls}
              required
            />
            {checkingPhone && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Serial Number (Optional but globally unique) */}
        <div>
          <label className={labelCls}>Serial Number</label>
          <input
            id="step1-serialNumber"
            type="text"
            value={formData.serialNumber || ''}
            onChange={(e) => handleChange('serialNumber', e.target.value.toUpperCase())}
            placeholder="e.g. SN-12345 (Optional)"
            className={inputCls}
          />
        </div>

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

        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* State */}
          <div>
            <label className={labelCls}>State <span className="text-red-500">*</span></label>
            <select
              id="step1-state"
              value={formData.state || ''}
              onChange={handleStateChange}
              className={inputCls}
              required
            >
              <option value="">Select State</option>
              {uniqueStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className={labelCls}>District <span className="text-red-500">*</span></label>
            <select
              id="step1-district"
              value={formData.district || ''}
              onChange={handleDistrictChange}
              className={inputCls}
              required
            >
              <option value="">Select District</option>
              {filteredDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
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
                onChange={handleCityChange}
                className={inputCls}
                required
              >
                <option value="">Select City</option>
                {filteredCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Match Modal */}
      <Dialog open={showMatchesModal} onOpenChange={setShowMatchesModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Multiple Products Found</DialogTitle>
            <DialogDescription>
              We found multiple products linked to this phone number. Please select the correct one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {productMatches.map(p => (
              <div key={p._id} className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition" onClick={() => linkProduct(p)}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm">{p.trackingId}</span>
                  <span className="text-xs uppercase bg-primary/10 text-primary px-2 py-0.5 rounded">{p.product}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.customerName}</p>
                <p className="text-xs text-muted-foreground">{p.localAddress}, {p.city}</p>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-2" onClick={() => setShowMatchesModal(false)}>
              None of these (Create new)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Search Modal */}
      <Dialog open={showManualSearch} onOpenChange={setShowManualSearch}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle>Search Product Tracking</DialogTitle>
            <DialogDescription>
              Search by Tracking ID, Serial Number, Phone, Name, or Address.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2 shrink-0">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              placeholder="Enter search term..."
              className={inputCls}
              autoFocus
            />
            <Button onClick={handleManualSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto min-h-[200px]">
            {searchResults.length === 0 && !searching && searchQuery && (
              <p className="text-center text-sm text-muted-foreground mt-8">No products found.</p>
            )}
            {searchResults.map(p => (
              <div key={p._id} className="border rounded-lg p-3 hover:bg-muted/50 transition">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="font-semibold text-sm">{p.trackingId}</span>
                    {p.serialNumber && <span className="ml-2 text-xs text-muted-foreground">SN: {p.serialNumber}</span>}
                  </div>
                  <span className="text-xs uppercase bg-primary/10 text-primary px-2 py-0.5 rounded">{p.product}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-3 space-y-1">
                  <p>{p.customerName} • {p.phone1} {p.phone2 ? `/ ${p.phone2}` : ''}</p>
                  <p>{p.localAddress}, {p.city}</p>
                </div>
                <Button size="sm" variant="secondary" className="w-full text-xs h-8" onClick={() => linkProduct(p)}>
                  Select this product
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
