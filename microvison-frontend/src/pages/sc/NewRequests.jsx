import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import SCComplaintCard from '../../components/complaint/SCComplaintCard';

// GRD Section 10.1 — New Requests tab
// Shows all complaints with status = 'assigned' for this SC
// Each card has Accept and Reject buttons

export default function NewRequests() {
  const { refreshBadge } = useOutletContext();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchComplaints = async () => {
      try {
        const { data } = await api.get('/api/complaints/my', {
          params: { status: 'assigned' },
        });
        if (active) setComplaints(data.complaints || []);
      } catch {
        if (active) setComplaints([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchComplaints();
    return () => { active = false; };
  }, []);

  // For refresh after action
  const triggerRefresh = async () => {
    try {
      const { data } = await api.get('/api/complaints/my', {
        params: { status: 'assigned' },
      });
      setComplaints(data.complaints || []);
    } catch {
      setComplaints([]);
    }
  };

  const handleAction = async (complaintId, action, rejectNote = '') => {
    try {
      if (action === 'accept') {
        await api.patch(`/api/complaints/${complaintId}/accept`);
      } else {
        await api.patch(`/api/complaints/${complaintId}/reject`, { note: rejectNote });
      }
      await triggerRefresh();
      refreshBadge();
    } catch (err) {
      alert(err?.response?.data?.message || 'Action failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-foreground">New Requests</h1>
        {[1, 2].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">New Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complaints assigned to you awaiting your response.
          </p>
        </div>
        {complaints.length > 0 && (
          <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
            {complaints.length} pending
          </span>
        )}
      </div>

      {complaints.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-border">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-foreground font-medium">No new requests</p>
          <p className="text-sm text-muted-foreground mt-1">
            You're all caught up! New complaints assigned to you will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {complaints.map((c) => (
            <SCComplaintCard
              key={c._id}
              complaint={c}
              mode="new-request"
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
