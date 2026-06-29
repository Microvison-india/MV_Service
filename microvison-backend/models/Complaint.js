const mongoose = require('mongoose');

// Extra charge sub-schema (used by both admin-added and SC-requested extras)
const extraChargeSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  requestedBy: { type: String, enum: ['admin', 'sc'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedAt: { type: Date, default: null },
});

// Change 6A: Multi-stage customer payment entry sub-schema
const customerPaymentSchema = new mongoose.Schema({
  amount:      { type: Number, required: true },
  route:       { type: String, enum: ['to_microvison', 'to_sc'], required: true },
  reason:      { type: String, default: '' }, // stage / reason free text
  recordedAt:  { type: Date, default: () => new Date() },
  recordedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

const complaintSchema = new mongoose.Schema(
  {
    // Unique Complaint ID: MV-YYYY-XXXXX
    complaintId: { type: String, required: true, unique: true },

    // ── Customer ──────────────────────────────────────────────
    customerName: { type: String, required: true, trim: true },
    phone1: { type: String, required: true },
    phone2: { type: String, default: '' },
    localAddress: { type: String, required: true, trim: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },

    // ── Product ───────────────────────────────────────────────
    trackingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null }, // Required going forward, null for legacy
    serialNumber: { type: String, default: null },
    product: { type: String, enum: ['led', 'cooler', 'both'], required: true },
    complaintType: { type: String, enum: ['installation', 'complaint'], required: true },
    warrantyStatus: { type: String, enum: ['in_warranty', 'out_of_warranty'], required: true },
    warrantyExpiryDate: { type: Date, default: null },
    warrantySource: { type: String, enum: ['auto_calculated', 'manual', 'forced', 'revoked'], default: 'manual' },
    billPhoto: { type: String, default: '' },
    billDate: { type: Date, default: null },
    shopName: { type: String, default: '' },
    modelNumber: { type: String, default: '' },
    locationText: { type: String, default: '' },
    warrantyForceReason: { type: String, default: '' },
    scBillPhotoUrl: { type: String, default: '' },
    scSerialSlipPhotoUrl: { type: String, default: '' },
    missingFieldsBypassed: [{ type: String }],
    scMissingBypass: [{ type: String }],

    // ── Preset & Base Charges (in-warranty only) ──────────────
    presetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Preset', default: null },
    presetName: { type: String, default: '' },    // Snapshotted at creation — safe if preset renamed/deleted
    presetPrice: { type: Number, default: null }, // Snapshotted at creation — never changes

    // ── Petrol / Diesel (3-round, in-warranty only) ───────────
    petrolAdmin: { type: Number, default: null }, // Edit 1 — Admin sets at registration
    petrolSC: { type: Number, default: null },    // Edit 2 — SC adjusts actual amount
    petrolFinal: { type: Number, default: null }, // Edit 3 — Admin override
    petrolEditCount: { type: Number, default: 0 }, // 0–3
    petrolLocked: { type: Boolean, default: false },

    // ── Extra Charges (both warranty types) ──────────────────
    extraCharges: [extraChargeSchema],

    // ── Customer Payments (Change 6A) ─────────────────────────────
    // Multi-stage array. Each entry = one payment event recorded by admin.
    // route='to_sc'       → subtracted from SC bill
    // route='to_microvison' → internal record only, not in SC bill
    customerPayments: [customerPaymentSchema],

    // ── Preset Price Override (Change 6B) ─────────────────────────
    // presetPrice is the snapshot (NEVER changes).
    // presetPriceOverride is what admin sets before closing (for this complaint only).
    presetPriceOverride: { type: Number, default: null },
    presetPriceOverrideReason: { type: String, default: '' },

    // ── Engineer Name (Change 6C) ─────────────────────────────────
    engineerName: { type: String, default: '' },

    // ── Critical Action (Change 5) ────────────────────────────────
    criticalActionEnabled: { type: Boolean, default: false },
    customerExtraCharge: { type: Number, default: null },
    customerChargePaymentMode: {
      type: String,
      enum: ['not_applicable', 'paid_to_sc', 'paid_to_microvison'],
      default: null,
    },
    customerChargeReason: { type: String, default: '' },
    customerChargePaidToSCAmount: { type: Number, default: null },
    warrantyRevoked: { type: Boolean, default: false },
    warrantyRevocationReason: { type: String, default: '' },
    warrantyRevocationDate: { type: Date, default: null },
    criticalActionLastEditedAt: { type: Date, default: null },
    criticalActionAcknowledgedAt: { type: Date, default: null },

    // ── Notes & Media (admin registration stage) ──────────────
    notes: { type: String, default: '' },         // Admin writes at registration — shown to SC on request card
    scNotes: { type: String, default: '' },       // SC writes after visit — separate from admin notes
    voiceNoteUrl: { type: String, default: '' },  // Cloudinary URL (max 60s) — uploaded by admin at registration
    adminPhotos: [{ type: String }],              // Max 2 Cloudinary URLs

    // ── SC Proof Media ────────────────────────────────────────
    proofPhotos: [{ type: String }],              // Max 5 Cloudinary URLs — SC uploads

    // ── Assignment ────────────────────────────────────────────
    assignedCentreId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCentre', default: null },
    assignedAt: { type: Date, default: null },

    // ── SC Flow v1.1 Fields ───────────────────────────────────
    doneVoiceUrl: { type: String, default: '' },
    notDoneReason: { type: String, default: '' },
    notDoneVoiceUrl: { type: String, default: '' },
    partDetails: { type: String, default: '' },
    partPendingVoiceUrl: { type: String, default: '' },
    partDeliveredAt: { type: Date, default: null },
    partDeliveredNote: { type: String, default: '' },
    partReceivedAt: { type: Date, default: null },
    distanceTravelled: { type: Number, default: null },
    totalVisits: { type: Number, default: null },

    // ── Status (per GRD Section 7.2) ──────────────────────────
    status: {
      type: String,
      enum: [
        'new',
        'unassigned',
        'assigned',
        'accepted',
        'rejected_by_sc',
        'going',
        'done',
        'not_done',
        'part_pending',
        'part_received',
        'reopened',
        'closed',
      ],
      default: 'new',
    },

    // ── Billing ───────────────────────────────────────────────
    billGenerated: { type: Boolean, default: false },
    billLockedAt: { type: Date, default: null },

    // ── Payment Status ─────────────────────────────────────────
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    paidAt:        { type: Date, default: null },   // Last time it was marked paid. Null if unpaid.
    paidBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Admin who marked it paid

    // ── Billing Month/Year (for fast invoice queries) ─────────
    billedMonth: { type: Number, default: null }, // 1-12
    billedYear: { type: Number, default: null },

    // ── Reopen Flow ───────────────────────────────────────────
    isReopened: { type: Boolean, default: false },
    reopenedAt: { type: Date, default: null },
    reopenParentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
    reopenNotes: { type: String, default: '' },   // Required on reopen
    reopenPhotos: [{ type: String }],

    // ── WhatsApp ──────────────────────────────────────────────
    whatsappSent: { type: Boolean, default: false },

    // ── Created by ────────────────────────────────────────────
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Indexes for common queries (complaintId is already indexed via unique:true above)
complaintSchema.index({ phone1: 1 });
complaintSchema.index({ assignedCentreId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ paymentStatus: 1 });
complaintSchema.index({ billLockedAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
