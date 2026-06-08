import { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

// Helper for formatting
const formatType = (type) => {
  const map = {
    'installation_led': 'LED Installation',
    'complaint_led': 'LED Complaint',
    'complaint_cooler': 'Cooler Complaint',
  };
  return map[type] || type;
};

export default function Presets() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [formData, setFormData] = useState({
    type: 'installation_led',
    name: '',
    modelNo: '',
    price: '',
  });

  const fetchPresets = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/presets');
      setPresets(data);
    } catch (error) {
      console.error('Error fetching presets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleOpenModal = (preset = null) => {
    if (preset) {
      setEditingPreset(preset);
      setFormData({
        type: preset.type,
        name: preset.name,
        modelNo: preset.modelNo || '',
        price: preset.price,
      });
    } else {
      setEditingPreset(null);
      setFormData({
        type: 'installation_led',
        name: '',
        modelNo: '',
        price: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPreset) {
        // Update (API only allows updating name, modelNo, price per TBP)
        await api.put(`/api/presets/${editingPreset._id}`, {
          name: formData.name,
          modelNo: formData.modelNo,
          price: Number(formData.price),
        });
      } else {
        // Create
        await api.post('/api/presets', {
          ...formData,
          price: Number(formData.price),
        });
      }
      setIsModalOpen(false);
      fetchPresets();
    } catch (error) {
      console.error('Error saving preset:', error);
      alert('Failed to save preset.');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await api.patch(`/api/presets/${id}/toggle`);
      // Optimistic update
      setPresets((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isActive: !p.isActive } : p))
      );
    } catch (error) {
      console.error('Error toggling preset:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this preset?')) return;
    try {
      await api.delete(`/api/presets/${id}`);
      setPresets((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      console.error('Error deleting preset:', error);
      alert('Failed to delete. It might be in use.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Preset Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage pricing packages for installations and complaints.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          + Add New Preset
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-foreground">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Package Name</th>
                <th className="px-6 py-4 font-medium">Model No</th>
                <th className="px-6 py-4 font-medium">Price (₹)</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                    Loading presets...
                  </td>
                </tr>
              ) : presets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                    No presets found. Add your first package!
                  </td>
                </tr>
              ) : (
                presets.map((preset) => (
                  <tr key={preset._id} className="hover:bg-muted/30 transition">
                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                      {formatType(preset.type)}
                    </td>
                    <td className="px-6 py-4">{preset.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {preset.modelNo || '—'}
                    </td>
                    <td className="px-6 py-4 font-medium">₹{preset.price}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(preset._id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          preset.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {preset.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => handleOpenModal(preset)}
                        className="text-primary hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(preset._id)}
                        className="text-destructive hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPreset ? 'Edit Preset' : 'Create New Preset'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {!editingPreset && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
                >
                  <option value="installation_led">LED Installation</option>
                  <option value="complaint_led">LED Complaint</option>
                  <option value="complaint_cooler">Cooler Complaint</option>
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Package Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Standard LED Installation"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Model Number (Optional)</label>
              <input
                type="text"
                name="modelNo"
                value={formData.modelNo}
                onChange={handleChange}
                placeholder="e.g. MV-100"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Price (₹)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
              >
                {editingPreset ? 'Save Changes' : 'Create Preset'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
