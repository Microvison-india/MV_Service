// TBP Phase 9 — StatusTimeline
// Renders the history of ComplaintUpdate documents in a vertical timeline.

export default function StatusTimeline({ updates = [] }) {
  if (!updates || updates.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No history available yet.</p>;
  }

  // Sort updates oldest first (or newest first, usually newest first is better for a timeline)
  // We'll show newest at the top.
  const sortedUpdates = [...updates].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
        return (
          <div key={update._id} className="relative flex gap-4">
            {/* Timeline Line */}
            {!isLast && (
              <div className="absolute left-2.5 top-6 bottom-[-16px] w-0.5 bg-border" />
            )}
            
            {/* Timeline Dot */}
            <div className="relative z-10 shrink-0 mt-1">
              <div className={`w-5 h-5 rounded-full border-2 border-background shadow-sm ${getStatusColor(update.newStatus)}`} />
            </div>

            {/* Content */}
            <div className="flex-1 pb-1">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">
                    {update.newStatus.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground uppercase tracking-wider">
                    {update.role.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground" title={new Date(update.createdAt).toLocaleString()}>
                  {new Date(update.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {' '}
                  {new Date(update.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {update.note && (
                <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded-md border border-border/50">
                  {update.note}
                </p>
              )}
              {update.voiceUrl && (
                <div className="mt-2">
                  <audio src={update.voiceUrl} controls className="w-full max-h-8" />
                </div>
              )}
              {update.images && update.images.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {update.images.map((img, i) => (
                    <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                      <img src={img} alt="" className="w-12 h-12 object-cover rounded border border-border hover:opacity-90 transition" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
