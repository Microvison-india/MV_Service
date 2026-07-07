// code here
console.log("Hello");
// code here
console.log("Hello");
// code here
console.log("Hello"); import { useState, useEffect } from 'react';
import { Search, Loader2, Link as LinkIcon } from 'lucide-react';
import api from '../../api/axios';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import InlineCitySelect from '../ui/InlineCitySelect';
import InlineSelect from '../ui/InlineSelect';

export default function Step1CustomerInfo({ formData, setFormData }) {
    const [cities, setCities] = useState([]);

    // Product Tracking States
    const [checkingPhone, setCheckingPhone] = useState(false);
    const [productMatches, setProductMatches] = useState([]);
    const [showMatchesModal, setShowMatchesModal] = useState(false);
    const [showSingleMatchBanner, setShowSingleMatchBanner] = useState(null);

    const [showManualSearch, setShowManualSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // Fetch all cities for the dropdown
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const { data } = await api.get('/api/cities');
                setCities(data);
            } catch {
                setCities([]);
            }
        };
        fetchCities();
    }, []);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // 3-way cascading logic
    const handleStateChange = (newState) => {
        setFormData((prev) => ({
            ...prev,
            state: newState,
            district: '',
            city: '',
        }));
    };

    const handleDistrictChange = (newDistrict) => {
        const matchingCity = cities.find((c) => c.district === newDistrict);
        setFormData((prev) => ({
            ...prev,
            district: newDistrict,
            state: matchingCity ? matchingCity.state : prev.state,
            city: '',
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
            locationText: product.locationText || prev.locationText || '',
            // Pass along existing product & warranty data for Step 2 context
            linkedProductType: product.product,
            billPhoto: product.billPhoto || prev.billPhoto,
            billDate: product.billDate || prev.billDate,
            warrantyStatus: product.warrantyStatus || prev.warrantyStatus,
            shopName: product.shopName || prev.shopName || '',
            modelNumber: product.modelNumber || prev.modelNumber || '',
        }));

        // Clear modals and banners
        setShowSingleMatchBanner(null);
        setShowMatchesModal(false);
        setShowManualSearch(false);
    };
    const unlinkProduct = () => {
        setFormData((prev) => ({
            ...prev,
            trackingId: null,
            linkedProductType: null,
        }));
    };

    // Compute dropdown options based on current selection
    const uniqueStates = [...new Set(cities.map((c) => c.state))].sort();

    const filteredDistricts = [...new Set(
        cities
            .filter((c) => (formData.state ? c.state === formData.state : true))
            .map((c) => c.district)
    )].sort();



    const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';
    const labelCls = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1';

    return (
        <div className="space-y-5 relative">

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
                    <label className={labelCls}>Phone 1 (WhatsApp Only - 10 digits) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                            id="step1-phone1"
                            type="tel"
                            value={formData.phone1 || ''}
                            onChange={(e) => handleChange('phone1', e.target.value)}
                            onBlur={checkPhoneForProducts}
                            placeholder="10-digit WhatsApp number"
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
                    <label className={labelCls}>Phone 2 (Alternate Number)</label>
                    <input
                        id="step1-phone2"
                        type="tel"
                        value={formData.phone2 || ''}
                        onChange={(e) => handleChange('phone2', e.target.value)}
                        placeholder="Different alternate number"
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

