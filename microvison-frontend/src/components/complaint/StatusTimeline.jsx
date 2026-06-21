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

        const isNotDoneCustom = complaint && update.newStatus === 'not_done' && (complaint.notDoneReason || complaint.notDoneVoiceUrl);
        const isDoneCustom = complaint && update.newStatus === 'done' && (complaint.totalVisits != null || complaint.distanceTravelled != null || complaint.doneVoiceUrl || (complaint.proofPhotos && complaint.proofPhotos.length > 0));
        const isPartPendingCustom = complaint && (update.newStatus === 'part_pending' || update.newStatus === 'part_received') && (complaint.partDetails || complaint.partPendingVoiceUrl);
        const hideGenericInfo = isNotDoneCustom || isDoneCustom || isPartPendingCustom;

        return (
          <div key={update._id} className="relative flex gap-4">
            {/* Timeline Line */}
            {!isLast && (
              <div className="absolute left-2.5 top-6 bottom-[-16px] w-0.5 bg-border" />
            )}
            
            {/* Timeline Dot */}
            <div className="relative z-10 shrink-0 mt-2">
              <div className={`w-5 h-5 rounded-full border-2 border-background shadow-sm ${getStatusColor(update.newStatus)}`} />
            </div>
 
            {/* Content Card with Dropdown toggle */}
            <div className="flex-1 pb-1">
              <div 
                onClick={() => toggleExpand(update._id)}
                className="flex items-center justify-between cursor-pointer select-none bg-muted/40 hover:bg-muted/70 px-3.5 py-2.5 rounded-xl border border-border/50 transition duration-150"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wide">
                    {update.newStatus.replace(/_/g, ' ')}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-secondary text-secondary-foreground uppercase tracking-wider">
                    {update.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(update.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' '}
                    {new Date(update.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-muted-foreground text-xs font-bold w-4 text-center">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>
              </div>
 
              {isExpanded && (
                <div className="mt-2.5 p-3.5 bg-background/50 border border-border/40 rounded-xl space-y-3 pl-4 border-l-2 border-l-primary/45 transition duration-200">
                  {!hideGenericInfo && update.note && (
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Remarks / Notes</span>
                      <p className="text-xs text-foreground mt-0.5 whitespace-pre-wrap">{update.note}</p>
                    </div>
                  )}
                  {!hideGenericInfo && update.voiceUrl && (
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Voice Explanation</span>
                      <audio src={update.voiceUrl} controls className="w-full max-h-8" />
                    </div>
                  )}
                  {!hideGenericInfo && update.images && update.images.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Attached Photos</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {update.images.map((img, i) => (
                          <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="hover:scale-[1.03] transition duration-150">
                            <img src={img} alt="" className="w-14 h-14 object-cover rounded-lg border border-border" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status-specific Integrated Details from Complaint */}
                  {complaint && (update.newStatus === 'part_pending' || update.newStatus === 'part_received') && (complaint.partDetails || complaint.partPendingVoiceUrl) && (
                    <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3.5 space-y-2.5">
                      <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wider border-b border-orange-200/50 pb-1">⚙️ Part Sourcing Info</p>
                      {complaint.partDetails && (
                        <div>
                          <span className="text-[10px] text-orange-700 uppercase tracking-wider font-semibold">Requested Part / Unit:</span>
                          <p className="text-xs font-bold text-orange-950 mt-0.5">{complaint.partDetails}</p>
                        </div>
                      )}
                      {complaint.scNotes && (
                        <div>
                          <span className="text-[10px] text-orange-700 uppercase tracking-wider font-semibold">Sourcing Note / Reason:</span>
                          <p className="text-xs text-orange-950 font-medium mt-0.5 whitespace-pre-wrap">{complaint.scNotes}</p>
                        </div>
                      )}
                      {complaint.partPendingVoiceUrl && (
                        <div>
                          <span className="text-[10px] text-orange-700 uppercase tracking-wider font-semibold">Diagnosis Voice Explanation:</span>
                          <audio src={complaint.partPendingVoiceUrl} controls className="w-full max-h-8 mt-1.5" />
                        </div>
                      )}
                      {complaint.proofPhotos && complaint.proofPhotos.length > 0 && (
                        <div>
                          <span className="text-[10px] text-orange-700 uppercase tracking-wider font-semibold block mb-1">Diagnosis Proof Photos:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {complaint.proofPhotos.map((img, i) => (
                              <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="hover:scale-[1.03] transition duration-150">
                                <img src={img} alt="" className="w-14 h-14 object-cover rounded-lg border border-orange-200" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-[11px] pt-2 border-t border-orange-200/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-orange-800">Dispatch Status:</span>
                          {complaint.partDeliveredAt ? (
                            <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                              Delivered by Admin
                            </span>
                          ) : (
                            <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              Pending Dispatch
                            </span>
                          )}
                        </div>
                        {complaint.partDeliveredAt && (
                          <p className="text-xs text-muted-foreground">
                            Dispatched on: <strong>{new Date(complaint.partDeliveredAt).toLocaleDateString()}</strong>
                          </p>
                        )}
                        {complaint.partDeliveredNote && (
                          <div className="bg-white/70 p-2 rounded border border-orange-100 text-xs">
                            <span className="text-[9px] text-muted-foreground uppercase font-bold">Courier / Delivery Note:</span>
                            <p className="text-orange-950 font-medium italic">"{complaint.partDeliveredNote}"</p>
                          </div>
                        )}
                        {complaint.partDeliveredAt && (
                          <div className="flex items-center justify-between pt-1 border-t border-dashed border-orange-200">
                            <span className="font-semibold text-orange-800">SC Receipt Status:</span>
                            {complaint.partReceivedAt ? (
                              <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                Received & Confirmed
                              </span>
                            ) : (
                              <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Awaiting SC Confirmation
                              </span>
                            )}
                          </div>
                        )}
                        {complaint.partReceivedAt && (
                          <p className="text-xs text-muted-foreground">
                            Confirmed on: <strong>{new Date(complaint.partReceivedAt).toLocaleDateString()}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {complaint && update.newStatus === 'not_done' && (complaint.notDoneReason || complaint.notDoneVoiceUrl) && (
                    <div className="bg-red-50/40 border border-red-100 rounded-xl p-3.5 space-y-2.5">
                      <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider border-b border-red-200/40 pb-1">⚠️ Not Done Details</p>
                      {complaint.notDoneReason && (
                        <div>
                          <span className="text-[10px] text-red-700 uppercase tracking-wider font-semibold">Reason Category/Text:</span>
                          <p className="text-xs text-red-950 font-medium mt-0.5">{complaint.notDoneReason}</p>
                        </div>
                      )}
                      {complaint.scNotes && (
                        <div>
                          <span className="text-[10px] text-red-700 uppercase tracking-wider font-semibold">Remarks / Closing Notes:</span>
                          <p className="text-xs text-red-950 font-medium mt-0.5 whitespace-pre-wrap">{complaint.scNotes}</p>
                        </div>
                      )}
                      {complaint.notDoneVoiceUrl && (
                        <div>
                          <span className="text-[10px] text-red-700 uppercase tracking-wider font-semibold">Voice Explanation:</span>
                          <audio src={complaint.notDoneVoiceUrl} controls className="w-full max-h-8 mt-1.5" />
                        </div>
                      )}
                      {complaint.proofPhotos && complaint.proofPhotos.length > 0 && (
                        <div>
                          <span className="text-[10px] text-red-700 uppercase tracking-wider font-semibold block mb-1">Attached Proof Photos:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {complaint.proofPhotos.map((img, i) => (
                              <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="hover:scale-[1.03] transition duration-150">
                                <img src={img} alt="" className="w-14 h-14 object-cover rounded-lg border border-red-200" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {complaint && update.newStatus === 'done' && (complaint.totalVisits != null || complaint.distanceTravelled != null || complaint.doneVoiceUrl || (complaint.proofPhotos && complaint.proofPhotos.length > 0)) && (
                    <div className="bg-muted/30 border border-border/80 rounded-xl p-3.5 space-y-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-1">🚗 Job Execution Metrics</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {complaint.totalVisits != null && (
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold">Total Site Visits</span>
                            <p className="font-bold text-sm text-foreground">{complaint.totalVisits}</p>
                          </div>
                        )}
                        {complaint.distanceTravelled != null && (
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold">Distance Travelled</span>
                            <p className="font-bold text-sm text-foreground">{complaint.distanceTravelled} km</p>
                          </div>
                        )}
                      </div>
                      {complaint.scNotes && (
                        <div className="pt-1.5 border-t border-border/40">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Closing Notes / Remarks</span>
                          <p className="text-xs text-foreground mt-0.5 whitespace-pre-wrap">{complaint.scNotes}</p>
                        </div>
                      )}
                      {complaint.doneVoiceUrl && (
                        <div className="pt-1.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Closing Voice Note</span>
                          <audio src={complaint.doneVoiceUrl} controls className="w-full max-h-8 mt-1" />
                        </div>
                      )}
                      {complaint.proofPhotos && complaint.proofPhotos.length > 0 && (
                        <div className="space-y-1.5 pt-1.5 border-t border-border/40">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Proof Photos / Diagnosis Photos</span>
                          <div className="flex gap-2.5 flex-wrap">
                            {complaint.proofPhotos.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="hover:scale-[1.03] transition duration-200">
                                <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-border" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!update.note && !update.voiceUrl && (!update.images || update.images.length === 0) &&
                    !(complaint && (
                      (update.newStatus === 'part_pending' && (complaint.partDetails || complaint.partPendingVoiceUrl)) ||
                      (update.newStatus === 'not_done' && (complaint.notDoneReason || complaint.notDoneVoiceUrl)) ||
                      (update.newStatus === 'done' && (complaint.totalVisits != null || complaint.distanceTravelled != null || complaint.doneVoiceUrl))
                    )) && (
                      <p className="text-[11px] text-muted-foreground italic">No additional details recorded for this status update.</p>
                    )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
