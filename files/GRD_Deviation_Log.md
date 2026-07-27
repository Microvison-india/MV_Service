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