import { useState } from 'react';


// GRD Section 10.1 — The complaint card used in New Requests AND My Complaints
// mode = 'new-request' → shows Accept/Reject buttons
// mode = 'my-complaint' → shows "Open Details" button

const STATUS_COLORS = {
    assigned: 'bg-blue-100 text-blue-800',
    accepted: 'bg-indigo-100 text-indigo-800',
    going: 'bg-yellow-100 text-yellow-800',
    done: 'bg-green-100 text-green-800',
    not_done: 'bg-red-100 text-red-800',
    part_pending: 'bg-orange-100 text-orange-800',
    part_received: 'bg-teal-100 text-teal-800',
    rejected_by_sc: 'bg-gray-100 text-gray-800',
    closed: 'bg-gray-200 text-gray-700',
};

const PRODUCT_LABELS = { led: 'LED', cooler: 'Cooler', both: 'LED + Cooler' };

export default function SCComplaintCard({ complaint: c, mode, onAction, onOpenDetail }) {
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [acting, setActing] = useState(false);

    const handleAccept = async () => {
        setActing(true);
        await onAction(c._id, 'accept');
        setActing(false);
        setShowAcceptModal(false);
    };

    const handleReject = async () => {
        setActing(true);
        await onAction(c._id, 'reject', rejectNote);
        setActing(false);
        setShowRejectModal(false);
    };

    const statusKey = c.status;

    return (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            {/* ── Header row ── */}
            <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                    <p className="text-sm text-muted-foreground font-mono mb-1.5">{c.complaintId}</p>
                    <p className="font-bold text-foreground text-xl mb-1">{c.customerName}</p>
                    <p className="text-base text-muted-foreground">
                        {c.localAddress}, {c.city}, {c.district}
                    </p>
                </div>
                <span className={`shrink-0 text-sm font-semibold px-3 py-1 rounded-full border ${STATUS_COLORS[statusKey] || 'bg-background text-foreground'}`}>
                    {statusKey.replace(/_/g, ' ').toUpperCase()}
                </span>
            </div>