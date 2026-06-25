import { useState, useEffect, useRef } from 'react';
import { Plus, Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import api from '../../api/axios';

export default function InlineCitySelect({ value, onChange, placeholder = 'Search or select city...', required = false, className = '' }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [prevValue, setPrevValue] = useState(value);
  const [search, setSearch] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  
  // Inline Create Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newState, setNewState] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const containerRef = useRef(null);

  // Sync state with props during render, avoiding useEffect cascading render trigger
  if (value !== prevValue) {
    setPrevValue(value);
    setSearch(value || '');
  }

  useEffect(() => {
    let active = true;
    api.get('/api/cities')
      .then(({ data }) => {
        if (active) {
          setCities(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load cities', err);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredCities = search
    ? cities.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.district.toLowerCase().includes(search.toLowerCase()) ||
        c.state.toLowerCase().includes(search.toLowerCase())
      )
    : cities;

  const handleSelect = (cityObj) => {
    onChange({
      city: cityObj.name,
      district: cityObj.district,
      state: cityObj.state
    });
    setSearch(cityObj.name);
    setIsOpen(false);
  };

  const handleStartCreate = (e) => {
    e.stopPropagation();
    setNewCityName(search);
    setNewDistrict('');
    setNewState('');
    setIsCreating(true);
    setError('');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newCityName || !newDistrict || !newState) {
      setError('All fields are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/api/cities', {
        name: newCityName,
        district: newDistrict,
        state: newState
      });
      // Add to local cities list
      setCities(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      // Select the new city
      handleSelect(data);
      setIsCreating(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create city.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          required={required}
          className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-8"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
        >
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-[300px] w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none">
          {loading ? (
            <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading cities...
            </div>
          ) : (
            <>
              <div className="max-h-[200px] overflow-y-auto">
                {filteredCities.map((city) => (
                  <div
                    key={city._id}
                    onClick={() => handleSelect(city)}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <span className="font-medium">{city.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({city.district}, {city.state})</span>
                    {value === city.name && (
                      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Create new option */}
              {search.trim().length > 0 && !cities.some(c => c.name.toLowerCase() === search.trim().toLowerCase()) && (
                <div
                  onClick={handleStartCreate}
                  className="mt-1 border-t pt-1 flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-2 pr-8 text-sm outline-none text-primary hover:bg-accent font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create "{search}" as new city
                </div>
              )}

              {filteredCities.length === 0 && search.trim().length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No cities found.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Inline Modal/Card for City Creation */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 border border-border shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold mb-4">Create New City</h3>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">City Name</label>
                <input
                  type="text"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">District Name</label>
                <input
                  type="text"
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                  placeholder="e.g. Jaipur"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">State Name</label>
                <input
                  type="text"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                  placeholder="e.g. Rajasthan"
                />
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="h-9 px-4 rounded-lg border border-input hover:bg-accent text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-sm flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create City'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
