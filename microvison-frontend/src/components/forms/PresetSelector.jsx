import { useState, useEffect } from 'react';
import api from '../../api/axios';

// Note: Using standard HTML select instead of shadcn Select for simplicity if it hasn't been fully verified.
// Shadcn Select would require importing Select, SelectContent, SelectItem, SelectTrigger, SelectValue.
// Here we use standard tailwind-styled select which matches the Register.jsx styling.

export default function PresetSelector({ type, onSelect, value, required = false }) {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPresets = async () => {
      try {
        setLoading(true);
        // Fetch active presets of the given type
        const { data } = await api.get(`/api/presets?type=${type}&isActive=true`);
        if (isMounted) setPresets(data);
      } catch (error) {
        console.error('Error fetching presets:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (type) {
      fetchPresets();
    }

    return () => {
      isMounted = false;
    };
  }, [type]);

  const handleChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      onSelect({ presetId: null, presetPrice: 0 });
      return;
    }

    const preset = presets.find((p) => p._id === selectedId);
    if (preset) {
      onSelect({ presetId: preset._id, presetPrice: preset.price });
    }
  };

  return (
    <div className="space-y-1 w-full">
      <select
        value={value || ''}
        onChange={handleChange}
        required={required}
        disabled={loading || !type}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition disabled:opacity-50"
      >
        <option value="">
          {loading ? 'Loading presets...' : 'Select a preset package'}
        </option>
        {presets.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name} {p.modelNo ? `(${p.modelNo})` : ''} - ₹{p.price}
          </option>
        ))}
      </select>
    </div>
  );
}
