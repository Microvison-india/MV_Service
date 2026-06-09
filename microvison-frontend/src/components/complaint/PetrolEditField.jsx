import { useState } from 'react';

// GRD Section 6.3 — Petrol Edit Field
// Shows history of all 3 petrol edit values and allows editing on the correct turn
// Props: petrolAdmin, petrolSC, petrolFinal, editCount, locked, userRole, onSave

export default function PetrolEditField({
  petrolAdmin,
  petrolSC,
  petrolFinal,
  editCount,
  locked,
  userRole,
  onSave,
}) {
  const [inputVal, setInputVal] = useState('');
  const [saving, setSaving] = useState(false);

  // Determine whose turn it is:
  // editCount 0 → no one has set yet (admin at registration)
  // editCount 1 → SC's turn (edit 2)
  // editCount 2 → admin's turn (edit 3)
  // editCount >= 3 → locked
  const isMyTurn =
    !locked &&
    ((userRole === 'service_centre' && editCount === 1) ||
      (userRole === 'admin' && editCount === 2));

  // Current effective value shown
  const currentValue =
    petrolFinal != null ? petrolFinal : petrolSC != null ? petrolSC : petrolAdmin;

  const handleSave = async () => {
    if (!inputVal || isNaN(Number(inputVal))) return;
    setSaving(true);
    await onSave(Number(inputVal));
    setInputVal('');
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-border p-4 bg-muted/30">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Petrol / Diesel Charge
      </p>

      {/* History rows */}
      <div className="space-y-2 mb-4">
        <PetrolRow label="Admin Estimate (Edit 1)" value={petrolAdmin} active={petrolSC == null && petrolFinal == null} />
        <PetrolRow label="SC Actual (Edit 2)" value={petrolSC} active={petrolSC != null && petrolFinal == null} />
        <PetrolRow label="Admin Override (Edit 3)" value={petrolFinal} active={petrolFinal != null} />
      </div>

      {locked && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>🔒</span>
          <span>Petrol amount is permanently locked.</span>
        </div>
      )}

      {isMyTurn && (
        <div className="flex gap-2 items-end mt-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {userRole === 'service_centre' ? 'Your Actual Amount (₹)' : 'Your Override (₹)'}
            </label>
            <input
              type="number"
              min="0"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={currentValue != null ? `Currently ₹${currentValue}` : 'Enter amount'}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !inputVal}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      {!isMyTurn && !locked && (
        <p className="text-xs text-muted-foreground mt-1">
          {editCount === 0
            ? 'No petrol estimate set yet.'
            : editCount === 1
            ? userRole === 'admin'
              ? 'Waiting for SC to enter actual amount.'
              : 'Your turn — enter actual travel cost.'
            : editCount === 2
            ? userRole === 'service_centre'
              ? 'Admin can override this amount once.'
              : 'Your turn — you may override the final amount.'
            : ''}
        </p>
      )}
    </div>
  );
}

function PetrolRow({ label, value, active }) {
  return (
    <div className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${active ? 'bg-primary/10 font-semibold' : 'opacity-60'}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={active ? 'text-foreground' : 'text-muted-foreground'}>
        {value != null ? `₹${value}` : '—'}
      </span>
    </div>
  );
}
