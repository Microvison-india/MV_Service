const mongoose = require('mongoose');

// Extra charge sub-schema (used by both admin-added and SC-requested extras)
const extraChargeSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  requestedBy: { type: String, enum: ['admin', 'sc'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedAt: { type: Date, default: null },
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
    warrantySource: { type: String, enum: ['auto_calculated', 'manual'], default: 'manual' },
    billPhoto: { type: String, default: '' },
    billDate: { type: Date, default: null },

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

    // ── Customer Payment (out-of-warranty only, record only) ──
    customerPaymentAmount: { type: Number, default: null },

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

    // ── Status (per GRD Section 7.2) ──────────────────────────
    status: {
      type: String,
      enum: [
        'new',
        'assigned',
        'accepted',
        'rejected_by_sc',
        'going',
        'done',
        'not_done',
        'part_pending',
        'replacement',
        'reopened',
        'closed',
      ],
      default: 'new',
    },

    // ── Billing ───────────────────────────────────────────────
    billGenerated: { type: Boolean, default: false },
    billLockedAt: { type: Date, default: null },

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

module.exports = mongoose.model('Complaint', complaintSchema);
