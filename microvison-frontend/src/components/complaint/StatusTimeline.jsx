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
        const donePetrolAdmin = update.petrolAdmin != null ? update.petrolAdmin : (complaint ? complaint.petrolAdmin : null);
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

                  {/* Status-specific Integrated Details */}
                  {isPartPendingCustom && (
                    <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3.5 space-y-2.5">
                      <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wider border-b border-orange-200/50 pb-1">⚙️ Part Sourcing Info</p>
                      {partDetailsText && (
                        <div>
                          <span className="text-[10px] text-orange-700 uppercase tracking-wider font-semibold">Requested Part / Unit:</span>
                          <p className="text-xs font-bold text-orange-950 mt-0.5">{partDetailsText}</p>
                        </div>
                      )}
                      {partScNotes && (
                        <div>
                          <span className="text-[10px] text-orange-700 uppercase tracking-wider font-semibold">Sourcing Note / Reason:</span>
                          <p className="text-xs text-orange-950 font-medium mt-0.5 whitespace-pre-wrap">{partScNotes}</p>
                        </div>
                      )}
                      {partPendingVoice && (
                        <div>
                          <span className="text-[10px] text-orange-700 uppercase tracking-wider font-semibold">Diagnosis Voice Explanation:</span>
                          <audio src={partPendingVoice} controls className="w-full max-h-8 mt-1.5" />
                        </div>
                      )}
                      {partProofPhotos && partProofPhotos.length > 0 && (
                        <div>
                          <span className="text-[10px] text-orange-700 uppercase tracking-wider font-semibold block mb-1">Diagnosis Proof Photos:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {partProofPhotos.map((img, i) => (
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
                          {partDeliveredAt ? (
                            <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                              Delivered by Admin
                            </span>
                          ) : (
                            <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              Pending Dispatch
                            </span>
                          )}
                        </div>
                        {partDeliveredAt && (
                          <p className="text-xs text-muted-foreground">
                            Dispatched on: <strong>{new Date(partDeliveredAt).toLocaleDateString()}</strong>
                          </p>
                        )}
                        {partDeliveredNote && (
                          <div className="bg-white/70 p-2 rounded border border-orange-100 text-xs">
                            <span className="text-[9px] text-muted-foreground uppercase font-bold">Courier / Delivery Note:</span>
                            <p className="text-orange-950 font-medium italic">"{partDeliveredNote}"</p>
                          </div>
                        )}
                        {partDeliveredAt && (
                          <div className="flex items-center justify-between pt-1 border-t border-dashed border-orange-200">
                            <span className="font-semibold text-orange-800">SC Receipt Status:</span>
                            {partReceivedAt ? (
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
                        {partReceivedAt && (
                          <p className="text-xs text-muted-foreground">
                            Confirmed on: <strong>{new Date(partReceivedAt).toLocaleDateString()}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {isNotDoneCustom && (
                    <div className="bg-red-50/40 border border-red-100 rounded-xl p-3.5 space-y-2.5">
                      <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider border-b border-red-200/40 pb-1">⚠️ Not Done Details</p>
                      {notDoneReasonText && (
                        <div>
                          <span className="text-[10px] text-red-700 uppercase tracking-wider font-semibold">Reason Category/Text:</span>
                          <p className="text-xs text-red-950 font-medium mt-0.5">{notDoneReasonText}</p>
                        </div>
                      )}
                      {notDoneScNotes && (
                        <div>
                          <span className="text-[10px] text-red-700 uppercase tracking-wider font-semibold">Remarks / Closing Notes:</span>
                          <p className="text-xs text-red-950 font-medium mt-0.5 whitespace-pre-wrap">{notDoneScNotes}</p>
                        </div>
                      )}
                      {notDoneVoice && (
                        <div>
                          <span className="text-[10px] text-red-700 uppercase tracking-wider font-semibold">Voice Explanation:</span>
                          <audio src={notDoneVoice} controls className="w-full max-h-8 mt-1.5" />
                        </div>
                      )}
                      {notDoneProofPhotos && notDoneProofPhotos.length > 0 && (
                        <div>
                          <span className="text-[10px] text-red-700 uppercase tracking-wider font-semibold block mb-1">Attached Proof Photos:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {notDoneProofPhotos.map((img, i) => (
                              <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="hover:scale-[1.03] transition duration-150">
                                <img src={img} alt="" className="w-14 h-14 object-cover rounded-lg border border-red-200" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isDoneCustom && (
                    <div className="bg-muted/30 border border-border/80 rounded-xl p-3.5 space-y-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-1">🚗 Job Execution Metrics</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {doneTotalVisits != null && (
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold">Total Site Visits</span>
                            <p className="font-bold text-sm text-foreground">{doneTotalVisits}</p>
                          </div>
                        )}
                        {doneDistanceTravelled != null && (
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold">Distance Travelled</span>
                            <p className="font-bold text-sm text-foreground">{doneDistanceTravelled} km</p>
                          </div>
                        )}
                      </div>

                      {donePetrolSC != null && donePetrolSC > 0 && (
                        <div className="pt-2 border-t border-border/40 space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Petrol Claims</span>
                          <p className="text-xs text-foreground">
                            <span className="text-muted-foreground">2nd Petrol (SC Claim):</span>{" "}
                            <strong className="font-bold text-foreground">₹{donePetrolSC}</strong>
                          </p>
                        </div>
                      )}

                      {scDoneCharges && scDoneCharges.length > 0 && (
                        <div className="pt-2 border-t border-border/40 space-y-1.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Requested Extra Charges</span>
                          <div className="space-y-1">
                            {scDoneCharges.map((ec, idx) => (
                              <div key={ec._id || idx} className="flex justify-between items-center bg-secondary/25 border border-border/30 rounded-lg p-2 text-xs">
                                <div>
                                  <p className="font-medium text-foreground">{ec.label}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-foreground">₹{ec.amount}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {doneScNotes && (
                        <div className="pt-1.5 border-t border-border/40">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Closing Notes / Remarks</span>
                          <p className="text-xs text-foreground mt-0.5 whitespace-pre-wrap">{doneScNotes}</p>
                        </div>
                      )}
                      {doneVoice && (
                        <div className="pt-1.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Closing Voice Note</span>
                          <audio src={doneVoice} controls className="w-full max-h-8 mt-1" />
                        </div>
                      )}
                      {doneProofPhotos && doneProofPhotos.length > 0 && (
                        <div className="space-y-1.5 pt-1.5 border-t border-border/40">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Proof Photos / Diagnosis Photos</span>
                          <div className="flex gap-2.5 flex-wrap">
                            {doneProofPhotos.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="hover:scale-[1.03] transition duration-200">
                                <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-border" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isClosedCustom && (
                    <div className="bg-green-50/40 border border-green-100 rounded-xl p-3.5 space-y-3">
                      <p className="text-[10px] font-bold text-green-800 uppercase tracking-wider border-b border-green-200/40 pb-1">🔒 Final Closure Details</p>
                      
                      {closedNote && (
                        <div>
                          <span className="text-[10px] text-green-700 uppercase tracking-wider font-semibold">Admin Closing Notes / Remarks:</span>
                          <p className="text-xs text-green-950 font-medium mt-0.5 whitespace-pre-wrap">{closedNote}</p>
                        </div>
                      )}

                      {closedPetrolFinal != null && closedPetrolFinal > 0 && (
                        <div className="pt-2 border-t border-green-200/30 space-y-1">
                          <span className="text-[10px] text-green-700 uppercase tracking-wider font-bold block mb-1">Petrol Allowance</span>
                          <p className="text-xs text-foreground">
                            {closedPetrolFinal === closedPetrolSC && closedPetrolSC > 0 ? (
                              <>
                                <span className="text-muted-foreground">Admin accepted SC Claim:</span>{" "}
                                <strong className="font-extrabold text-green-950 text-sm">₹{closedPetrolFinal}</strong>
                              </>
                            ) : closedPetrolFinal === closedPetrolAdmin && closedPetrolAdmin > 0 ? (
                              <>
                                <span className="text-muted-foreground">Admin accepted initial estimate:</span>{" "}
                                <strong className="font-extrabold text-green-950 text-sm">₹{closedPetrolFinal}</strong>
                              </>
                            ) : (
                              <>
                                <span className="text-muted-foreground">Final Locked Petrol:</span>{" "}
                                <strong className="font-extrabold text-green-950 text-sm">₹{closedPetrolFinal}</strong>
                              </>
                            )}
                          </p>
                        </div>
                      )}

                      {filteredClosedCharges && filteredClosedCharges.length > 0 && (
                        <div className="pt-2 border-t border-green-200/30 space-y-1.5">
                          <span className="text-[10px] text-green-700 uppercase tracking-wider font-bold block">Final Extra Charges Actions</span>
                          <div className="space-y-1">
                            {filteredClosedCharges.map((ec, idx) => (
                              <div key={ec._id || idx} className="flex justify-between items-center bg-white/60 border border-green-100 rounded-lg p-2 text-xs">
                                <div>
                                  <p className="font-medium text-foreground">{ec.label}</p>
                                  <span className="text-[9px] text-muted-foreground capitalize">Requested by: {ec.requestedBy}</span>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-foreground">₹{ec.amount}</p>
                                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                    ec.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                                    ec.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                                    'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                    {ec.status === 'approved' ? 'Edited & Approved' : ec.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {closedScNotes && (
                        <div className="pt-2 border-t border-green-200/30">
                          <span className="text-[10px] text-green-700 uppercase tracking-wider font-semibold">SC Done Notes / Remarks:</span>
                          <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{closedScNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!update.note && !update.voiceUrl && (!update.images || update.images.length === 0) &&
                    !isPartPendingCustom && !isNotDoneCustom && !isDoneCustom && !isClosedCustom && (
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
