import { useState } from 'react';

// TBP Phase 9 — StatusTimeline
// Renders the history of ComplaintUpdate documents in a vertical timeline.

export default function StatusTimeline({ updates = [], complaint = null }) {
    const [expandedIds, setExpandedIds] = useState({});

    if (!updates || updates.length === 0) {
        return <p className="text-sm text-muted-foreground italic">No history available yet.</p>;
    }

    // Sort updates oldest first (or newest first, usually newest first is better for a timeline)
    // We'll show newest at the top.
    const sortedUpdates = [...updates]
        .filter((u) => {
            // Hide extra charge updates
            if (u.note?.toLowerCase().includes('extra charge')) {
                return false;
            }
            // Hide Admin dispatch updates from the timeline view (part_pending + admin role)
            if (u.newStatus === 'part_pending' && u.role === 'admin') {
                return false;
            }
            // Hide SC receipt updates from the timeline view (part_received)
            if (u.newStatus === 'part_received') {
                return false;
            }
            return true;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const toggleExpand = (id) => {
        setExpandedIds((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-500';
            case 'assigned': return 'bg-purple-500';
            case 'accepted': return 'bg-indigo-500';
            case 'going': return 'bg-amber-500';
            case 'done':
            case 'closed': return 'bg-green-500';
            case 'rejected_by_sc': return 'bg-red-500';
            case 'not_done':
            case 'part_pending': return 'bg-orange-500';
            case 'replacement': return 'bg-teal-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="space-y-4">
            {sortedUpdates.map((update, index) => {
                const isLast = index === sortedUpdates.length - 1;
                const isExpanded = !!expandedIds[update._id];

                // Snapshots / Fallbacks for Part Pending
                const partDetailsText = update.partDetails || (complaint ? complaint.partDetails : '');
                const partPendingVoice = update.voiceUrl || (complaint ? complaint.partPendingVoiceUrl : '');
                const partScNotes = update.scNotes || (complaint ? complaint.scNotes : '');
                const partProofPhotos = (update.images && update.images.length > 0) ? update.images : (complaint && complaint.proofPhotos ? complaint.proofPhotos : []);
                const partDeliveredAt = update.partDeliveredAt || (complaint ? complaint.partDeliveredAt : null);
                const partDeliveredNote = update.partDeliveredNote || (complaint ? complaint.partDeliveredNote : '');
                const partReceivedAt = update.partReceivedAt || (complaint ? complaint.partReceivedAt : null);

                // Snapshots / Fallbacks for Not Done
                const notDoneReasonText = update.notDoneReason || (complaint ? complaint.notDoneReason : '');
                const notDoneVoice = update.voiceUrl || (complaint ? complaint.notDoneVoiceUrl : '');
                const notDoneScNotes = update.scNotes || (complaint ? complaint.scNotes : '');
                const notDoneProofPhotos = (update.images && update.images.length > 0) ? update.images : (complaint && complaint.proofPhotos ? complaint.proofPhotos : []);

                // Snapshots / Fallbacks for Done
                const doneTotalVisits = update.totalVisits != null ? update.totalVisits : (complaint ? complaint.totalVisits : null);
                const doneDistanceTravelled = update.distanceTravelled != null ? update.distanceTravelled : (complaint ? complaint.distanceTravelled : null);
                const doneVoice = update.voiceUrl || (complaint ? complaint.doneVoiceUrl : '');
                const doneScNotes = update.scNotes || (complaint ? complaint.scNotes : '');
                const doneProofPhotos = (update.images && update.images.length > 0) ? update.images : (complaint && complaint.proofPhotos ? complaint.proofPhotos : []);
                const donePetrolSC = update.petrolSC != null ? update.petrolSC : (complaint ? complaint.petrolSC : null);
                const doneExtraCharges = (update.extraCharges && update.extraCharges.length > 0) ? update.extraCharges : (complaint ? complaint.extraCharges : []);
                const scDoneCharges = doneExtraCharges.filter(ec => ec.requestedBy === 'sc');

                // Snapshots / Fallbacks for Closed
                const closedPetrolAdmin = update.petrolAdmin != null ? update.petrolAdmin : (complaint ? complaint.petrolAdmin : null);
                const closedPetrolSC = update.petrolSC != null ? update.petrolSC : (complaint ? complaint.petrolSC : null);
                const closedPetrolFinal = update.petrolFinal != null ? update.petrolFinal : (complaint ? complaint.petrolFinal : null);
                const closedExtraCharges = (update.extraCharges && update.extraCharges.length > 0) ? update.extraCharges : (complaint ? complaint.extraCharges : []);
                const closedScNotes = update.scNotes || (complaint ? complaint.scNotes : '');
                const closedNote = update.note || 'Admin confirmed and closed the job.';

                const doneUpdate = updates.find(u => u.newStatus === 'done');
                const filteredClosedCharges = closedExtraCharges.filter(ec => {
                    if (ec.status === 'rejected') return true;
                    if (ec.requestedBy === 'sc') {
                        if (doneUpdate && doneUpdate.extraCharges) {
                            const original = doneUpdate.extraCharges.find(o => String(o._id) === String(ec._id) || o.label === ec.label);
                            if (original) {
                                return ec.amount !== original.amount;
                            }
                        }
                        return false;
                    }
                    return true;
                });

                // Custom render checks
                const isNotDoneCustom = (update.newStatus === 'not_done') && (notDoneReasonText || notDoneVoice);
                const isDoneCustom = (update.newStatus === 'done') &&
                    (doneTotalVisits != null || doneDistanceTravelled != null || doneVoice || doneProofPhotos.length > 0 || (donePetrolSC != null && donePetrolSC > 0) || scDoneCharges.length > 0);
                const isPartPendingCustom = (update.newStatus === 'part_pending' || update.newStatus === 'part_received') && (partDetailsText || partPendingVoice);
                const isClosedCustom = (update.newStatus === 'closed');
                const hideGenericInfo = isNotDoneCustom || isDoneCustom || isPartPendingCustom || isClosedCustom;

                return (
                    <div key={update._id} className="relative flex gap-2.5 sm:gap-4">
                        {/* Timeline Line */}
                        {!isLast && (
                            <div className="absolute left-2.5 top-6 bottom-[-16px] w-0.5 bg-border" />
                        )}
