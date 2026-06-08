# GRD Deviation Log — Microvison SMS

> This document tracks every decision, change, addition, or deletion that deviates from the original **Microvison GRD v1.1** document. It is the authoritative record of what was actually built versus what was originally specified.

---

## FORMAT
Each entry follows this structure:
- **Phase:** Which phase the change was made in.
- **GRD Section:** The original GRD section this relates to.
- **Type:** `ADDED` | `REMOVED` | `CHANGED` | `DECISION`
- **Summary:** What changed and why.

---

## Phase 3 — Auth System

### DEV-GRD-001
- **Phase:** 3
- **GRD Section:** 3.2 (SC Registration)
- **Type:** REMOVED
- **Summary:** GRD Section 3.2 does not explicitly mention an admin email notification upon SC registration. An admin email notification was originally coded by mistake and then **removed** to stay true to the GRD. Admin sees new pending registrations only via the Action Centre (Tab 1) in the dashboard, not via email.

### DEV-GRD-002
- **Phase:** 3
- **GRD Section:** 3.1 (Login)
- **Type:** DECISION
- **Summary:** Confirmed that there is **one single `/login` page** for both Admin and SC roles. After login, the JWT role field determines which dashboard the user is redirected to. Admin accounts are seeded manually via `node utils/seedAdmins.js` using env variables `ADMIN_EMAIL_1` and `ADMIN_EMAIL_2`.

---

## Phase 4 — Presets & Cities API

### DEV-GRD-003
- **Phase:** 4
- **GRD Section:** 4.1 (City Selection)
- **Type:** CHANGED
- **Summary:** GRD Section 4.1 specifies a single City dropdown with District and State as "auto-filled" read-only text fields. **Changed** to a fully interactive 3-way cascading dropdown system:
  - **State** dropdown (selectable).
  - **District** dropdown (filters based on selected State).
  - **City** dropdown (filters based on selected District or State).
  - Selecting a City reverse-fills State and District automatically.
  - Selecting a District reverse-fills State automatically.
  - This was an explicit user decision to improve UX. The final data saved to DB is identical to what GRD specifies (`city`, `district`, `state` fields).

### DEV-GRD-004
- **Phase:** 4
- **GRD Section:** 1.2 (Business Context)
- **Type:** CHANGED
- **Summary:** GRD stated "50+ currently, up to 100+ in 2 years" for cities covered. To ensure comprehensive coverage and future-proofing, the database was seeded with **313 actual cities** across Rajasthan (225) and Punjab (88) using a comprehensive master list.

---

## Phase 5 — Service Centre Management

### DEV-GRD-005
- **Phase:** 5
- **GRD Section:** 11.1 (Action Centre)
- **Type:** ADDED
- **Summary:** GRD specifies the Action Centre as Tab 1 of the Admin Dashboard. Since we don't yet have a tab-based layout (coming in a later polish phase), the Action Centre has been implemented as a **standalone page at `/admin`** — the default landing page when an Admin logs in. It shows all pending SC registrations with inline Approve/Reject buttons and a placeholder section for Phase 7 complaint items.

### DEV-GRD-006
- **Phase:** 5
- **GRD Section:** 11.2 (Service Centres Tab)
- **Type:** DECISION
- **Summary:** GRD specifies SC cards should show **live stats** (total assigned, pending, completed this month, rejected). The `getStats` endpoint returns zeroes for now since the `Complaint` model doesn't exist until Phase 7. The stats section will be wired up properly in Phase 7 with real complaint counts.

---

## Phase 7A — Complaint Backend

### DEV-GRD-007
- **Phase:** 7A
- **GRD Section:** 6.4 / 8 (Assign + Reopen)
- **Type:** DECISION
- **Summary:** GRD Section 6.4 states that WhatsApp is sent to the SC on assignment. As agreed, all WhatsApp integration is deferred to Phase 13. A `// TODO (Phase 13)` comment marks the exact location in `assignComplaint` where the trigger will go.

### DEV-GRD-008
- **Phase:** 7A
- **GRD Section:** 6.3 (Extra Charges)
- **Type:** DECISION
- **Summary:** Admin-added extra charges at complaint creation time are automatically set to `status: 'approved'`. Only SC-requested extras (Phase 8) require admin approval. This distinction is clearly enforced in the `createComplaint` controller.

---

## Phase 6 — File Uploads

### DEV-GRD-009
- **Phase:** 6
- **GRD Section:** 6.3 (Notes and Media)
- **Type:** CHANGED
- **Summary:** GRD Section 6.3 does not specify a maximum image file size. The TBP set 5MB; this was overridden to **20MB** per user decision. Cloudinary compression ensures storage size remains small regardless.

---

## Phase 7B — Complaint Frontend Wizard

### DEV-GRD-010
- **Phase:** 7B
- **GRD Section:** 6.1 (Step 1 — Customer Information / Reopen Check)
- **Type:** CHANGED
- **Summary:** GRD states the reopen check fires when the admin enters Phone 1. Our implementation fires it on `phone1` blur **only if** `product` and `complaintType` are also set. Since these fields live in Step 2, on first visit to Step 1 the check is silently skipped. If the admin navigates back to Step 1 after filling Step 2, the check fires correctly. This prevents a confusing empty-result API call.

---

## Future Phases
*(Entries will be added here as each phase is built.)*
