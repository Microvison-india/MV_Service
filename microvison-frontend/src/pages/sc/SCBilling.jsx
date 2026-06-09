// GRD Section 10.3 — SC Billing Tab
// Full billing is built in Phase 11. This is the placeholder.

export default function SCBilling() {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-2">Billing</h1>
      <p className="text-sm text-muted-foreground mb-8">
        View your per-complaint bills and monthly invoice summaries here.
      </p>
      <div className="text-center py-20 rounded-xl border border-dashed border-border">
        <p className="text-5xl mb-4">💰</p>
        <p className="text-foreground font-semibold">Billing Dashboard</p>
        <p className="text-sm text-muted-foreground mt-2">
          Coming in Phase 11. Your in-warranty complaint bills and monthly invoices will be available here.
        </p>
      </div>
    </div>
  );
}
