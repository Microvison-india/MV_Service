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