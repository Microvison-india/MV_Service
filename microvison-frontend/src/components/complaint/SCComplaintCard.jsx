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
            {/* ── Tags row ── */}
            <div className="flex flex-wrap items-center gap-2 mb-5 text-sm font-medium text-muted-foreground">
                <span className="text-foreground font-semibold border border-border px-2 py-0.5 rounded-md shadow-sm">
                    {PRODUCT_LABELS[c.product] || c.product}
                </span>
                <span className="capitalize border border-border px-2 py-0.5 rounded-md shadow-sm">
                    {c.complaintType}
                </span>
                <span className={c.warrantyStatus === 'in_warranty' ? 'text-foreground border border-border px-2 py-0.5 rounded-md shadow-sm' : 'text-foreground border border-border px-2 py-0.5 rounded-md shadow-sm'}>
                    {c.warrantyStatus === 'in_warranty' ? 'In Warranty' : 'Out of Warranty'}
                </span>
            </div>

            {/* ── Preset info (in-warranty only) ── */}
            {c.warrantyStatus === 'in_warranty' && c.presetName && (
                <div className="bg-muted/50 rounded-lg px-4 py-3 mb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Pricing</p>
                    <p className="text-sm font-medium text-foreground">
                        {c.presetName} — <span className="font-bold">₹{c.presetPrice}</span>
                        {c.petrolAdmin != null && (
                            <span className="text-muted-foreground"> + ₹{c.petrolAdmin} petrol est.</span>
                        )}
                    </p>
                </div>
            )}

            {/* ── Admin notes ── */}
            {c.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4">
                    <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">Admin Note</p>
                    <p className="text-sm text-yellow-900">{c.notes}</p>
                </div>
            )}

            {/* ── Voice note ── */}
            {c.voiceNoteUrl && (
                <div className="mb-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Voice Note</p>
                    <audio src={c.voiceNoteUrl} controls className="w-full rounded-lg" />
                </div>
            )}

            {/* ── Admin photos ── */}
            {c.adminPhotos?.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Admin Photos</p>
                    <div className="flex gap-3 flex-wrap">
                        {c.adminPhotos.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={url}
                                    alt={`Admin photo ${i + 1}`}
                                    className="w-24 h-24 object-cover rounded-lg border border-border hover:opacity-80 transition"
                                />
                            </a>
                        ))}
                    </div>
                </div>
            )}
