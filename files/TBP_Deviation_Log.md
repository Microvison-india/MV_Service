# TBP Deviation Log — Microvison SMS

> This document tracks every decision, change, addition, or deletion that deviates from the original **Microvison Technical Build Plan v1.1** document. It is the authoritative record of how the actual implementation differs from the original technical plan.

---

## FORMAT
Each entry follows this structure:
- **Phase:** Which phase the change was made in.
- **TBP Section / File:** The original TBP file or section this relates to.
- **Type:** `ADDED` | `REMOVED` | `CHANGED` | `DECISION` | `FIXED`
- **Summary:** What changed and why.

---

## Phase 1 — Project Setup & Config

### DEV-TBP-001
- **Phase:** 1
- **TBP Section:** Database Config
- **Type:** FIXED
- **Summary:** MongoDB Atlas connection required a **non-SRV connection string** instead of the standard `mongodb+srv://` format. The `MONGO_URI` in `.env` uses the standard `mongodb://` format with explicit `replicaSet`, `authSource`, and `tls=true` query parameters. This is required by the specific Atlas cluster configuration and is functionally identical.

### DEV-TBP-002
- **Phase:** 1-2
- **TBP Section:** Frontend — `tailwind.config.js` & `index.css`
- **Type:** FIXED
- **Summary:** The original `npx shadcn@latest init` generated CSS variable syntax compatible with **Tailwind CSS v4**, which conflicted with the project's **Tailwind CSS v3** setup. Both `tailwind.config.js` and `index.css` were rewritten to be fully Tailwind v3 compatible while retaining all shadcn design tokens and component support.

---

## Phase 2 — Database Models

### DEV-TBP-003
- **Phase:** 2
- **TBP Section:** `models/User.js`
- **Type:** FIXED
- **Summary:** The Mongoose pre-save hook in `User.js` for password hashing had a bug — it called `next()` inside an `async` function, which caused an `UnhandledPromiseRejection` crash. Fixed by using a standard `function` (not arrow function) and properly calling `next()` after the `await bcrypt.hash(...)` call.

---

## Phase 3 — Auth System

### DEV-TBP-004
- **Phase:** 3
- **TBP Section:** `utils/seedAdmins.js`
- **Type:** ADDED
- **Summary:** TBP does not explicitly specify a `seedAdmins.js` utility script. One was **added** to allow safe, repeatable admin account creation via `node utils/seedAdmins.js`. Admin credentials are read from env variables `ADMIN_EMAIL_1`, `ADMIN_PASSWORD_1`, `ADMIN_EMAIL_2`, `ADMIN_PASSWORD_2`. This is the only supported way to create admin accounts.

### DEV-TBP-005
- **Phase:** 3
- **TBP Section:** `controllers/auth.controller.js` — `registerSC`
- **Type:** REMOVED
- **Summary:** A Brevo email notification to the admin upon every SC registration was initially coded but **removed**. Per GRD Section 3.2, admin sees new registrations in the Action Centre dashboard, not via email. Email notifications to admin are not part of the spec.

### DEV-TBP-006
- **Phase:** 3
- **TBP Section:** `middleware/auth.js`
- **Type:** DECISION
- **Summary:** The auth middleware exports a single default function (`module.exports = auth`) rather than a named export `{ protect }`. All route files that use auth middleware must import it as `const auth = require('../middleware/auth')` and apply with `router.use(auth)`, not `{ protect }`.

---

## Phase 4 — Presets & Cities API

### DEV-TBP-007
- **Phase:** 4
- **TBP Section:** `pages/auth/Register.jsx` — City Selection
- **Type:** CHANGED
- **Summary:** TBP specifies a single City dropdown (shadcn Select) fetching from `/cities` API, with District and State as auto-filled read-only fields. **Changed** to a 3-way interactive cascading system:
  - **State** select → filters Districts.
  - **District** select → filters Cities + auto-fills State.
  - **City** select → auto-fills both District and State.
  - All derived from a single `GET /api/cities` call made once on mount (no extra API calls). All filtering is done client-side in memory for speed.

### DEV-TBP-008
- **Phase:** 4
- **TBP Section:** Phase 14 — WhatsApp Integration
- **Type:** DECISION
- **Summary:** WhatsApp integration (Phase 14 in TBP) was explicitly agreed to be deferred to the **very last step** of the project. No WhatsApp code is written until all other phases are complete and verified. The two triggers (New Complaint Assigned + Complaint Reopened) will be added into existing Phase 7 and Phase 12 controllers retroactively.

### DEV-TBP-009
- **Phase:** 4
- **TBP Section:** 2.2 (Shadcn components mapped to your features)
- **Type:** CHANGED
- **Summary:** TBP specified using the shadcn `Select` component for "City dropdown, status filter, preset selector, product type". Native HTML `<select>` tags with Tailwind classes were used instead for the City and Preset selectors to vastly simplify the React state management and DOM structure for the 3-way cascading logic.

---

## Phase 5 — Service Centre Management

### DEV-TBP-010
- **Phase:** 5
- **TBP Section:** Phase 5 — `pages/admin/ActionCentre.jsx`
- **Type:** ADDED
- **Summary:** TBP Phase 5 does not explicitly list an `ActionCentre.jsx` page. However, GRD Section 11.1 clearly defines the Action Centre as the admin's primary task hub. This file was **added** to Phase 5 to implement GRD 11.1: it shows pending SC registrations with inline Approve/Reject, and a placeholder for Phase 7 complaint items. It is now the default `/admin` landing page.

### DEV-TBP-011
- **Phase:** 5
- **TBP Section:** Phase 5 — `controllers/serviceCentre.controller.js` — `getStats`
- **Type:** DECISION
- **Summary:** `getStats()` is a placeholder that returns zeroes for all complaint counts. The real counts will be implemented in Phase 7 when the `Complaint` model and its queries are built. A code comment marks exactly where to add the real Mongoose queries.

---

## Phase 6 — File Uploads

### DEV-TBP-012
- **Phase:** 6
- **TBP Section:** Phase 6 — `components/forms/ImageUploader.jsx`
- **Type:** CHANGED
- **Summary:** TBP specified a drag-and-drop area. To maximize reliability on mobile devices and simplify the UX, this was explicitly changed to a standard "Click to Upload" file input button with thumbnail previews.

### DEV-TBP-015
- **Phase:** 7B
- **TBP Section:** Phase 6/7 — `components/forms/Step1CustomerInfo.jsx`
- **Type:** ADDED
- **Summary:** TBP specified a simpler auto-fill behavior for District and State based on City. Per user instruction, the robust 3-way cascading dropdown hook (`states -> districts -> cities`) built for Service Centre registration was adapted and implemented here instead.

### DEV-TBP-016
- **Phase:** 7B
- **TBP Section:** Phase 6/7 — `components/complaint/ReopenBanner.jsx`
- **Type:** ADDED
- **Summary:** The ReopenBanner was built to include the full `reopenNotes` and `reopenPhotos` form directly inside the banner dialog, ensuring all reopen data is captured upfront before hitting the unified submission endpoint.

### DEV-TBP-014
- **Phase:** 6
- **TBP Section:** Phase 6 — `middleware/upload.js` — Image Size Limit
- **Type:** CHANGED
- **Summary:** TBP specified a 5MB max file size per image. This was increased to **20MB** per explicit user decision, to support modern smartphone photos that commonly exceed 5MB. Cloudinary automatically compresses the uploaded image to ~200KB via its `transformation` rules, so storage cost is unchanged.

---

## Phase 7B — Complaint Frontend Wizard

### DEV-TBP-015
- **Phase:** 7B
- **TBP Section:** Phase 7, File 9 — `components/forms/Step1CustomerInfo.jsx`
- **Type:** CHANGED
- **Summary:** TBP specifies the reopen check fires on `phone1` blur and shows the ReopenBanner immediately. Our implementation fires the check **only if** `product` and `complaintType` are already set (they live in Step 2). If they are not yet set (admin is on Step 1 for the first time), the check is silently skipped and no banner is shown. The check can be manually triggered later if the admin navigates back and forth. This prevents a confusing partial-data API call.

### DEV-TBP-016
- **Phase:** 7B
- **TBP Section:** Phase 7, File 8 — `pages/admin/NewComplaint.jsx` — Submit sequence
- **Type:** CHANGED
- **Summary:** TBP describes a single combined POST that creates and assigns in one transaction. The implementation uses **two sequential API calls**: `POST /api/complaints` (creates with `status=new`) then immediately `PATCH /api/complaints/:id/assign` (moves to `status=assigned`). This matches the actual backend route design and ensures the complaint is safely stored in the DB even if the assign step fails (which would alert the admin with an error but not lose the complaint data).

---

## Phase 7A — Complaint Backend

### DEV-TBP-013
- **Phase:** 7A
- **TBP Section:** Phase 7, File 3 — `utils/sendWhatsApp.js`
- **Type:** DEFERRED
- **Summary:** TBP lists `sendWhatsApp.js` as part of Phase 7. As explicitly agreed by the user, all WhatsApp integration is deferred to Phase 13. The utility file will NOT be created until then.

---

## Future Phases
*(Entries will be added here as each phase is built.)*
