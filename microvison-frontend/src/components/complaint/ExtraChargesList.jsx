import { useState } from 'react';
import api from '../../api/axios';

// GRD Section 11.1 / TBP Phase 9
// Displays the extra charge line items with inline Approve/Reject buttons for admin.
// If readOnly is true, hides action buttons.

export default function ExtraChargesList({ complaintId, extraCharges, readOnly = false, onUpdate }) {
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');

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
            {extraCharges.map((extra) => (
              <tr key={extra._id} className="bg-card">
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
                    {extra.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleAction(extra._id, 'approve')}
                          disabled={loadingId === extra._id}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 disabled:opacity-50 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(extra._id, 'reject')}
                          disabled={loadingId === extra._id}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 disabled:opacity-50 transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Locked</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
