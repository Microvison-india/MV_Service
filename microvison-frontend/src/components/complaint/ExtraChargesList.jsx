import { useState } from 'react';
import api from '../../api/axios';

// GRD Section 11.1 / TBP Phase 9
// Displays the extra charge line items with inline Approve/Reject/Edit buttons for admin.
// If readOnly is true, hides action buttons.

export default function ExtraChargesList({ complaintId, extraCharges, readOnly = false, onUpdate }) {
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editAmount, setEditAmount] = useState('');

  if (!extraCharges || extraCharges.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No extra charges requested.</p>;
  }

  const handleAction = async (extraId, action) => {
    setLoadingId(extraId);
    setError('');
    try {
      await api.patch(`/api/complaints/${complaintId}/extras/${extraId}/${action}`);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} extra charge.`);
    } finally {
      setLoadingId(null);
    }
  };

  const handleSaveEdit = async (extraId) => {
    setLoadingId(extraId);
    setError('');
    try {
      await api.patch(`/api/complaints/${complaintId}/extras/${extraId}`, {
        label: editLabel.trim(),
        amount: Number(editAmount),
      });
      setEditingId(null);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update extra charge.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
      
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Item Label</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {!readOnly && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {extraCharges.map((extra) => {
              const isEditing = editingId === extra._id;
              return (
                <tr key={extra._id} className="bg-card">
                  {isEditing ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-24 rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 uppercase">
                          {extra.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(extra._id)}
                            disabled={loadingId === extra._id || !editLabel.trim() || editAmount === ''}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-foreground">{extra.label}</td>
                      <td className="px-4 py-3 text-foreground">₹{extra.amount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          extra.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          extra.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {extra.status.charAt(0).toUpperCase() + extra.status.slice(1)}
                        </span>
                      </td>
                      {!readOnly && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(extra._id);
                                setEditLabel(extra.label);
                                setEditAmount(String(extra.amount));
                              }}
                              disabled={loadingId !== null}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50 transition"
                            >
                              Edit
                            </button>
                            {extra.status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => handleAction(extra._id, 'approve')}
                                disabled={loadingId !== null}
                                className="px-2.5 py-1 text-xs font-semibold rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 disabled:opacity-50 transition"
                              >
                                Approve
                              </button>
                            )}
                            {extra.status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => handleAction(extra._id, 'reject')}
                                disabled={loadingId !== null}
                                className="px-2.5 py-1 text-xs font-semibold rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 disabled:opacity-50 transition"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
