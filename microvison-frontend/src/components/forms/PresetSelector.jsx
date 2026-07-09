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

