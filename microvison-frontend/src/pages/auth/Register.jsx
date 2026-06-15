import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

// All SC registration fields per GRD Section 3.2
const CAPABILITY_OPTIONS = [
  { value: 'led_only', label: 'LED Only' },
  { value: 'cooler_only', label: 'Cooler Only' },
  { value: 'both', label: 'Both (LED + Cooler)' },
];

export default function Register() {
  const [cities, setCities] = useState([]);
  const [formData, setFormData] = useState({
    ownerName: '',
    businessName: '',
    phone1: '',
    phone2: '',
    email1: '',
    email2: '',
    fullAddress: '',
    city: '',
    district: '',
    state: '',
    productCapability: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load city master list on mount per GRD Section 4.1
  useEffect(() => {
    api.get('/api/cities').then(({ data }) => setCities(data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
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
    setError('');
  };

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    // Find which state this district belongs to
    const matchingCity = cities.find((c) => c.district === newDistrict);
    setFormData((prev) => ({
      ...prev,
      district: newDistrict,
      state: matchingCity ? matchingCity.state : prev.state,
      city: '',
    }));
    setError('');
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
    setError('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!formData.city) {
      setError('Please select a city.');
      return;
    }
    if (!formData.productCapability) {
      setError('Please select product capability.');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData };
      delete payload.confirmPassword;
      await api.post('/api/auth/register', payload);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center bg-card border border-border rounded-xl shadow-sm p-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 text-2xl">✓</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Registration Submitted!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your service centre registration has been submitted. The admin will review and approve your account. You will receive an email once approved.
          </p>
          <Link
            to="/login"
            className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Microvison</h1>
          <p className="text-muted-foreground mt-1 text-sm">Service Centre Registration</p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Register your service centre</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section: Owner Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Owner / Contact Name *" id="ownerName" name="ownerName" value={formData.ownerName} onChange={handleChange} required placeholder="Full name" />
              <Field label="Business Name *" id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} required placeholder="Your shop / company name" />
            </div>

            {/* Section: Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone Number 1 *" id="phone1" name="phone1" type="tel" value={formData.phone1} onChange={handleChange} required placeholder="Primary contact" />
              <Field label="Phone Number 2" id="phone2" name="phone2" type="tel" value={formData.phone2} onChange={handleChange} placeholder="Optional" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email 1 (Login Email) *" id="email1" name="email1" type="email" value={formData.email1} onChange={handleChange} required placeholder="Used for login" />
              <Field label="Email 2 (CC for notifications)" id="email2" name="email2" type="email" value={formData.email2} onChange={handleChange} placeholder="Optional" />
            </div>

            {/* Section: Address */}
            <Field label="Full Address *" id="fullAddress" name="fullAddress" value={formData.fullAddress} onChange={handleChange} required placeholder="Street, locality, area" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* State Dropdown */}
              <div className="space-y-1">
                <label htmlFor="state" className="text-sm font-medium text-foreground">State *</label>
                <select
                  id="state"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleStateChange}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                >
                  <option value="">Select state</option>
                  {uniqueStates.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* District Dropdown */}
              <div className="space-y-1">
                <label htmlFor="district" className="text-sm font-medium text-foreground">District *</label>
                <select
                  id="district"
                  name="district"
                  required
                  value={formData.district}
                  onChange={handleDistrictChange}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                >
                  <option value="">Select district</option>
                  {filteredDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* City Dropdown */}
              <div className="space-y-1">
                <label htmlFor="city" className="text-sm font-medium text-foreground">City *</label>
                <select
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleCityChange}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                >
                  <option value="">Select city</option>
                  {filteredCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Capability — 3 options per GRD Section 5.2 */}
            <div className="space-y-1">
              <label htmlFor="productCapability" className="text-sm font-medium text-foreground">Product Capability *</label>
              <select
                id="productCapability"
                name="productCapability"
                required
                value={formData.productCapability}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              >
                <option value="">Select capability</option>
                {CAPABILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Password *" id="password" name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="Set your password" />
              <Field label="Confirm Password *" id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="Re-enter password" />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Reusable field component
function Field({ label, id, className = '', readOnly = false, ...props }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
      <input
        id={id}
        readOnly={readOnly}
        className={`w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition ${readOnly ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''} ${className}`}
        {...props}
      />
    </div>
  );
}
