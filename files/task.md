- [x] **Phase 1 — Project Setup & Config (Day 1)**
  - [x] Initialize backend repo (`express, mongoose, cors, dotenv, bcryptjs, jsonwebtoken, multer, cloudinary, multer-storage-cloudinary, axios`)
  - [x] Set up `.env` and `.env.example`
  - [x] Database config (`config/db.js`)
  - [x] Cloudinary config (`config/cloudinary.js`)
  - [x] Brevo email config (`config/brevo.js` HTTP API wrapper)
  - [x] Express server setup (`server.js`)
  - [x] Initialize frontend Vite React app
  - [x] Tailwind & Shadcn initialization (`npx shadcn@latest init`)
  - [x] Add all Shadcn components (`button input textarea select table dialog tabs badge card form toast toaster sheet dropdown-menu skeleton alert avatar separator label`)
  - [x] Axios interceptor setup (`src/api/axios.js`)
  - [x] Vite PWA plugin config

- [x] **Phase 2 — Database Models (Day 1-2)**
  - [x] `City` model & Seed Script (`utils/seedCities.js`)
  - [x] `User` model
  - [x] `ServiceCentre` model
  - [x] `Preset` model
  - [x] `OtpToken` model (with TTL index)
  - [x] `Complaint` model
  - [x] `ComplaintUpdate` model
  - [x] `Invoice` model

- [x] **Phase 3 — Auth System (Day 2-3)**
  - [x] Brevo HTTP wrapper function (`utils/sendEmail.js`)
  - [x] Auth controllers (Login, Register SC, Forgot Password, Verify OTP, Reset Password)
  - [x] JWT and RBAC Middlewares (`middleware/auth.js`, `middleware/rbac.js`)
  - [x] Auth routes (`routes/auth.routes.js`)
  - [x] React AuthContext (`context/AuthContext.jsx`)
  - [x] React ProtectedRoute in `App.jsx`
  - [x] Auth UI Pages (`Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `VerifyOtp.jsx`, `ResetPassword.jsx`)

- [x] **Phase 4 — Presets & Cities API (Day 3)**
  - [x] City controller & routes (`/cities`, `/cities/district/:district`)
  - [x] Preset controller & routes (CRUD & toggleActive)
  - [x] `PresetSelector` UI component
  - [x] Admin Presets page (`pages/admin/Presets.jsx`)
  - [x] 3-way Cascading State/District/City dropdown UI in Register form

- [x] **Phase 5 — Service Centre Management (Day 4-5)**
  - [x] `controllers/serviceCentre.controller.js` (getAll, getPending, getById, approve, reject, update, deactivate, getStats)
  - [x] `routes/serviceCentre.routes.js`
  - [x] `components/filters/SCFilters.jsx`
  - [x] `pages/admin/ServiceCentres.jsx`
  - [x] `pages/admin/SCDetail.jsx`
  - [x] `pages/admin/ActionCentre.jsx` (GRD 11.1 — added, not in TBP)
  - [x] `App.jsx` — routes for `/admin`, `/admin/service-centres`, `/admin/service-centres/:id`
  - [x] `server.js` — mounted `/api/service-centres`

- [x] **Phase 6 — File Uploads (Day 5)**
  - [x] Multer & Cloudinary upload middleware (`middleware/upload.js`)
  - [x] Upload controllers & routes (`/upload/images`, `/upload/audio`)
  - [x] `ImageUploader` UI component
  - [x] `VoiceRecorder` UI component (with iOS Safari fallback)

- [x] **Phase 7A — Complaint Backend (Day 6)**
  - [x] `utils/generateComplaintId.js` (Custom daily format: M + I/C + DDMMYY + XXXX + W/O, resets daily)
  - [x] `utils/reopenChecker.js` (all 5 GRD Section 8 conditions)
  - [x] `controllers/complaint.controller.js` (reopenCheck, create, assign)
  - [x] `routes/complaint.routes.js` (GET reopen-check, POST /, PATCH /:id/assign)
  - [x] `server.js` — mounted `/api/complaints`
  - [x] Fixed duplicate index warning in `models/Complaint.js`

- [x] **Phase 7B — Complaint Frontend Wizard (Day 7-8)**
  - [x] `pages/admin/NewComplaint.jsx` (step wizard wrapper with full validation)
  - [x] `components/forms/Step1CustomerInfo.jsx` (cascading city/district/state)
  - [x] `components/forms/Step2ProductType.jsx` (card selection, cooler lock)
  - [x] `components/forms/Step3Charges.jsx` (preset fetch, petrol, extras, media)
  - [x] `components/forms/Step4AssignSC.jsx` (filtered SC cards, submit)
  - [x] `components/complaint/ReopenBanner.jsx` (2-step reopen flow)
  - [x] `App.jsx` — `/admin/new-complaint` route added
  - [x] `ActionCentre.jsx` — "+ New Complaint" button + success message banner
  - [x] Fixed all import paths (Phase 6 + 7B components)

- [x] **Phase 7C — Product Tracking & Warranty System (Addendum v1.2)**
  > ⚠ This phase supersedes parts of Phase 7A/7B (complaint controller, Step1, warranty toggle, ReopenBanner). Must be built before Phase 8 is considered fully production-ready.

  **Backend — New Files**
  - [x] `models/Product.js` — new Product schema (trackingId, serialNumber, hasSerial, product, customerName, phone1/2, address, billPhoto, billDate, warrantyStatus, warrantyExpiryDate, warrantySource, complaintHistory[], lastComplaintId, lastComplaintDate)
  - [x] `utils/warrantyCalculator.js` — warranty determination logic (billDate+3yr auto / manual fallback / installation default)
  - [x] `utils/generateTrackingId.js` — auto-generates custom Product ID: P + L/C + XXXXXX global counter
  - [x] `controllers/product.controller.js` — searchProducts, getProduct, createProduct, updateProduct, getReopenCheck
  - [x] `routes/product.routes.js` — all 5 product routes; mount in server.js at `/api/products`

  **Backend — Modified Files**
  - [x] `models/Complaint.js` — add 7 new snapshot fields: trackingId (ref Product), serialNumber, billPhoto, billDate, warrantyStatus, warrantyExpiryDate, warrantySource
  - [x] `controllers/complaint.controller.js` — update `createComplaint` to link/create Product record, snapshot warranty fields, update complaintHistory; update `getComplaintById` to include productTimeline array in response
  - [x] `controllers/complaint.controller.js` — update `getAll` to support `serialNumber=` and `trackingId=` query filter params

  **Frontend — Rebuilt / Modified Files**
  - [x] `components/forms/Step1CustomerInfo.jsx` — REBUILD: phone blur triggers product search, show 0/1/multiple match UI, manual search modal, serial number field with hard-block logic, auto-fill all fields, editable after fill
  - [x] `components/forms/Step2ProductType.jsx` — update warranty section: context-sensitive (product linked with billDate = read-only display; no billDate = optional bill fields + manual toggle fallback; LED install default = in_warranty)
  - [x] `components/complaint/ReopenBanner.jsx` — update to pull from Product record via reopen-check endpoint; show trackingId, serial, last complaint, warranty status; add 'New complaint for this product' second action
  - [x] `components/complaint/AdminComplaintDetail.jsx` — add Product Timeline inline section at bottom
  - [x] `components/complaint/SCComplaintDetail.jsx` — add Product Timeline inline section at bottom (SC: siblings from other centres = plain text, not clickable)
  - [x] `components/filters/ComplaintFilters.jsx` — add Serial Number + Tracking ID search fields

- [x] **Phase 8 — Service Centre Portal (Day 9-11)**
  - [x] SC Complaint controllers (getMyComplaints, accept, reject, markGoing, updateStatus)
  - [x] SC routes (`GET /my`, `PATCH /:id/accept`, `PATCH /:id/reject`, `PATCH /:id/going`, `PATCH /:id/status`)
  - [x] `pages/sc/SCLayout.jsx` (sticky top nav, badge on New Requests, mobile hamburger drawer)
  - [x] `pages/sc/NewRequests.jsx` (assigned complaints, Accept/Reject with confirm modals)
  - [x] `pages/sc/MyComplaints.jsx` (all complaints with status/product/warranty filters)
  - [x] `pages/sc/SCBilling.jsx` (placeholder — full in Phase 11)
  - [x] `components/complaint/SCComplaintCard.jsx` (shared card for both pages)
  - [x] `components/complaint/SCComplaintDetail.jsx` (slide panel: mark going, proof upload, final status, petrol, extras, OOW payment)
  - [x] `components/complaint/PetrolEditField.jsx` (3-round petrol history + correct-turn editing)
  - [x] `App.jsx` — SC nested routes wired (/sc, /sc/new-requests, /sc/my-complaints, /sc/billing)

- [x] **Phase 8.5 — Full SC Flow v1.1 Implementation (SC Portal Rebuild)**
  > ⚠ This phase is a major expansion of the SC portal based on `Microvison_SC_Flow_v1.1.txt`. It introduces new statuses (`part_received`), new forms (Not Done, Part Pending), a new admin action (Mark as Delivered), SC action (Mark as Received), and a complete WhatsApp reminder system. Replacement is NOT a separate status — it is Part Pending where the 'part' being delivered is the full unit.

  **A. Backend — New Statuses & Schema**
  - [x] Add `part_received` to Complaint model status enum (currently missing from schema)
  - [x] Remove `replacement` from status enum — replacement is handled as a Part Pending flow (no separate status)
  - [x] Add fields to Complaint model: `notDoneReason` (String), `notDoneVoiceUrl` (String), `partDetails` (String), `partPendingVoiceUrl` (String), `partDeliveredAt` (Date), `partDeliveredNote` (String), `partReceivedAt` (Date), `distanceTravelled` (Number), `totalVisits` (Number)

  **B. Backend — SC Controllers (Revamp `updateStatus`)**
  - [x] Revamp `updateStatus` controller to handle 3 distinct SC action paths:
    - [x] **Done path:** Requires min 1 photo (max 5), optional audio, optional text notes, optional petrol + distance + visits, optional multiple extra charge line items. Status → `done`.
    - [x] **Not Done path:** Requires EITHER reason text OR voice note (or both). Optional max 5 photos. Status → `not_done`. Complaint stays open.
    - [x] **Part Pending path:** Requires voice note (compulsory), text notes (compulsory), parts detail description (compulsory), min 2 photos (max 5). Replacement is the same path — SC states in text/voice that full unit replacement is required. Status → `part_pending`.
  - [x] Add `markPartReceived` controller — SC taps Mark as Received after receiving part/unit. Requires complaint in `part_pending` state. Status → `part_received`. Timeline entry created.
  - [x] Update `updateStatus` to also allow submission from `part_received` status (in addition to `accepted` and `going`), so SC can go Done/Not Done/Part Pending again after receiving a part.

  **C. Backend — Admin Controllers (New: Mark as Delivered)**
  - [x] Add `markPartDelivered` controller — Admin taps Mark as Delivered from Action Centre. Requires complaint in `part_pending` status. Stores delivery note (optional). Adds timeline entry. Does NOT change complaint status — only adds a marker. Fires WA-06 to SC.
  - [x] Update `getActionItems` to surface `part_pending` complaints in admin Action Centre (so admin knows when to arrange parts).

  **D. Backend — New Routes**
  - [x] `PATCH /api/complaints/:id/part-received` → `markPartReceived` (SC only)
  - [x] `PATCH /api/complaints/:id/mark-delivered` → `markPartDelivered` (Admin only)

  **E. Frontend — SC Portal (Distinct Forms per Path)**
  - [x] Revamp `SCComplaintDetail.jsx` action panel to show 3 distinct action buttons: **Mark Done**, **Mark Not Done**, **Mark Part Pending** (based on current complaint status — available from `accepted`, `going`, or `part_received`)
  - [x] **Done Form slide-out:**
    - [x] Photo uploader (min 1, max 5) — blocks submit if empty
    - [x] Audio recorder (optional, max 2 min)
    - [x] Text notes (optional)
    - [x] Petrol amount + distance (km) + total visits count fields (optional but recommended) — respects 3-lock system
    - [x] Multiple extra charge line items (optional) — each with label + amount
    - [x] Out-of-warranty: 'Amount collected from customer' field (required if OOW)
  - [x] **Not Done Form slide-out:**
    - [x] Reason text box (required if no voice note)
    - [x] Voice recorder (required if no text) — max 2 min. At least one of text or voice must be filled. System blocks submit if both blank.
    - [x] Photo uploader (optional, max 5)
  - [x] **Part Pending Form slide-out:**
    - [x] Voice note (compulsory, max 2 min)
    - [x] Text notes (compulsory)
    - [x] Parts detail field (compulsory) — describes what part/unit is needed
    - [x] Photo uploader (min 2, max 5 — proof of diagnosis)
    - [x] Note: No separate Replacement button/form. SC states replacement requirement in text + voice inside the Part Pending form.
  - [x] **Mark as Received button** — visible on `part_pending` complaints after admin marks delivered. SC taps this to confirm they received the part. Status → `part_received`.
  - [x] Update `MyComplaints.jsx` filter to include `part_pending`, `part_received`, `not_done` statuses
  - [x] Update `SCComplaintCard.jsx` to display `part_pending` and `part_received` status badges correctly

  **F. Frontend — Admin Portal (Part Pending + Delivered flow)**
  - [x] Show `part_pending` complaints in Admin Action Centre with context: what part SC requested (parts detail text + photos + voice note)
  - [x] Add **Mark as Delivered** button inside `AdminComplaintDetail.jsx` for `part_pending` complaints
    - [x] Simple: just an optional admin note text field + confirm button. No file upload needed.
    - [x] Adds a timeline entry with date, time, and admin note
    - [x] Triggers WA-06 to SC
  - [x] Show Part Pending details (voice note, text, parts description, photos) in admin detail view
  - [x] Show Not Done history (reason, voice, photos) clearly in timeline

  **G. Status Flow Map (for dev reference)**
  - [x] `new` → `assigned` (admin assigns)
  - [x] `assigned` → `accepted` or `rejected_by_sc` (SC action)
  - [x] `rejected_by_sc` → `assigned` (admin reassigns)
  - [x] `accepted` → `going` (optional) or `done` / `not_done` / `part_pending`
  - [x] `going` → `done` / `not_done` / `part_pending`
  - [x] `done` → `closed` (admin confirms) or `accepted` (admin disputes)
  - [x] `not_done` → `done` / `not_done` / `part_pending` (SC acts again)
  - [x] `part_pending` → `part_received` (admin marks delivered → SC marks received)
  - [x] `part_received` → `done` / `not_done` / `part_pending` (SC acts again)
  - [x] `closed` → `reopened` (if eligible within 30 days)

  **H. Billing Logic Updates**
  - [x] Billing always and only triggers on admin **Confirm Done** (status: `closed`). Never before.
  - [x] SC fills overall petrol + extra charges ONCE in the final Done form — covers ALL visits across Not Done and Part Pending cycles. System does not track per-visit petrol.
  - [x] Out-of-warranty: SC fills 'amount collected from customer' field. This is stored for records only. The Microvison invoice to SC shows zero (unless admin-added extras).
  - [x] `confirmDone` controller should only accept complaints in `done` status (not `not_done`, `part_pending`, or `replacement` — remove those from allowed statuses in the current controller)

  **I. Refine SC Assignment Logic & Locations**
  > ⚠ Items below are now fully superseded or expanded by Phase 19 (Skip SC), Phase 20 (Unregistered SC), and Phase 21 (New Step 2). See those phases for the definitive implementation spec.
  - [x] Refine SC Assignment Logic — now handled in Phase 19 (Step 5 of new 5-step form, with Skip option and capability filtering)
  - [x] Support custom/new cities/locations — now handled in Phase 20 (Section 2D, inline "Create new" from any city field)
  - [x] Add optional `location` text field — addressed in Phase 21 (Section 3C, `locationText` field added to Step 1 `Step1CustomerInfo.jsx` and `Complaint` model)
  - [ ] Advanced pagination
  - [ ] SC specific complaint and stats

- [x] **Phase 9 — Admin Action Centre (Day 12-13)**
  - [x] Admin confirm and extra charge approval controllers (confirmDone, disputeDone, approveExtra, rejectExtra)
  - [x] Action item lists controller (`getActionItems`)
  - [x] Admin action routes
  - [x] ActionCentre page UI (`pages/admin/ActionCentre.jsx`)
  - [x] `ExtraChargesList` UI component
  - [x] `StatusTimeline` UI component
  - [x] `AdminComplaintDetail` UI slide panel

- [x] **Phase 10 — Admin Complaints Tab (Day 14-15)**
  - [x] Complaint getAll controller (with 12+ filters, pagination, sorting)
  - [x] Admin complaint routes
  - [x] `ComplaintFilters` UI component
  - [x] AllComplaints page UI (`pages/admin/AllComplaints.jsx`)
  - [x] ComplaintDetail — Admin mode
  - [x] `useComplaints` hook
  - [x] Integrated `AdminLayout` navigation wrapper

- [x] **Phase 11 — Billing (Day 16-17)**
  - [x] Billing calculator logic (`utils/billingCalculator.js`)
  - [x] Billing controllers (`getComplaintBills`, `getMonthlyInvoice`)
  - [x] Billing routes
  - [x] `BillingTable` & `MonthlyInvoice` UI components
  - [x] `BillSummary` UI component
  - [x] Admin Billing page (`pages/admin/Billing.jsx`)
  - [x] SC Billing page (`pages/sc/SCBilling.jsx`)
  - [x] `useBilling` hook

- [x] **Phase 12 — Reopen Flow (Day 18)**
  - [x] Backend reopen helper logic in `reopenChecker.js`
  - [x] Backend controller implementation in `complaint.controller.js`
  - [x] Backend route mounting in `complaint.routes.js`
  - [x] Frontend `ReopenBanner.jsx` integration
  - [x] Frontend `NewComplaint.jsx` workflow wiring
  - [x] Frontend `AdminComplaintDetail.jsx` inline reopen action panel
  - [ ] Reopen condition change and from where we can reopen it, we will deal with it later

- [ ] **Phase 13 — PWA + Polish + Deploy (Day 19-20)**
  - [ ] Finalize Vite PWA config & Icons
  - [ ] Add global Toaster to `main.jsx`
  - [ ] Loading Skeletons & Empty States
  - [x] Railway Backend Deploy
  - [x] MongoDB Atlas setup
  - [x] Cloudflare R2 File Storage Migration
    - [x] Install `@aws-sdk/client-s3` in backend
    - [x] Configure R2 environment variables in `.env.example` and `.env`
    - [x] Remove Cloudinary config file (`config/cloudinary.js`)
    - [x] Refactor upload middleware (`middleware/upload.js`) to use R2
    - [x] Verify ESLint and local build correctness
  - [x] Vercel Frontend Deploy

- [ ] **Phase 14 — WhatsApp Messaging Integrations (Full SC Flow v1.1 Triggers)**
  > ⚠ Phase 14 must be done AFTER Phase 8.5 is fully complete, since triggers depend on the new statuses and controllers. All triggers below are from `Microvison_SC_Flow_v1.1.txt` Section 9.

  **Infrastructure**
  - [ ] Direct Meta WhatsApp Cloud API wrapper utility (`utils/sendWhatsApp.js`) (Sandbox Mode implemented)
  - [ ] Configure environment variables for WhatsApp credentials in `.env` / `.env.example`

  **Immediate Triggers (fire on specific admin/SC actions — no scheduler needed)**
  - [ ] **WA-01:** SC assigned new complaint — fires immediately in `assignComplaint` controller. Content: Complaint ID, Customer name, Phone, Full address, Product type, Complaint type, Warranty status, Admin notes, Portal login URL. If reopen: add REOPENED flag + original Complaint ID.
  - [ ] **WA-04:** SC accepts complaint — fires immediately in `acceptComplaint` controller. Recipient: Customer phone1 (+ phone2 if exists). Content: Complaint ID, Product type, Complaint type, SC business name, SC phone number, acknowledgment message.
  - [ ] **WA-06:** Admin marks Part/Unit as Delivered — fires immediately in new `markPartDelivered` controller (Phase 8.5). Recipient: SC. Content: Complaint ID, Customer name, Address, Part/unit delivery notification, Admin note (if any). *Depends on Phase 8.5 controller being built first.*

  **Scheduled/Reminder Triggers (require a background cron job / scheduler)**
  > These triggers fire at a time DELAY after an event. They need a background task that runs periodically (e.g. every hour) to check which complaints are overdue and fire the reminder.
  - [ ] **WA-02:** SC not acted 24 hours after assignment (no accept/reject). Recipient: SC.
  - [ ] **WA-03:** SC still not acted 48 hours after assignment. Recipient: SC.
  - [ ] **WA-0X (post-assign):** SC still not acted — repeat every 2 days after WA-03. Stops when SC accepts or rejects. Recipient: SC.
  - [ ] **WA-04B:** SC accepted but no action for 24 hours (no Going, Done, Not Done, Part Pending). Recipient: SC.
  - [ ] **WA-0X (post-accept):** Repeat every 2 days after WA-04B until SC takes any action. Recipient: SC.
  - [ ] **WA-05:** SC submitted Not Done, no further action for 24 hours. Recipient: SC.
  - [ ] **WA-0X (post-not-done):** Repeat every 2 days after WA-05 until SC takes any action. Recipient: SC.
  - [ ] **WA-07:** SC marked Part Received but no further action for 24 hours. Recipient: SC.
  - [ ] **WA-0X (post-received):** Repeat every 2 days after WA-07 until SC acts. Recipient: SC.

  **Scheduler Infrastructure (needed for all WA-0X triggers above)**
  - [ ] Build a cron job utility (e.g., `utils/whatsappReminder.js`) that runs periodically (hourly/daily)
  - [ ] Query DB for complaints that match each reminder condition (status + time elapsed since last action)
  - [ ] Integrate cron scheduler into `server.js` on startup (e.g. using `node-cron` package)

  **NOT sent (per v1.1 spec — do NOT implement these)**
  - No WhatsApp is sent to customer after SC acceptance (WA-04 is the only customer message)
  - No WhatsApp on Done, Not Done, or Part Pending submission
  - No WhatsApp on admin Confirm Done or bill generation
  - No reminder to SC if admin marks Delivered but SC has not yet marked Received

  **v1.3 Additions — Must be applied when building Phase 14**
  > Source: `Microvison_System_Changes_v1.3.md` — Changes 1A, 2, and 3. These items modify or restrict existing WA triggers. Build them alongside the triggers they affect.
  - [ ] **WA-01 content update (v1.3 Change 3 — Phase 21 dependency):** When implementing WA-01 in `assignComplaint`, include `Serial Number` and `Model Number` (if filled on the complaint/Product record) and `locationText` (if filled on the complaint) in the message body. These help the SC identify the physical unit and navigate to the customer. Admin-only fields (`billDate`, `billPhoto`, `shopName`) must NOT be included in WA-01 — they are internal records, never sent to the SC.
  - [ ] **WA-01 suppression for Unregistered SC (v1.3 Change 2 — Phase 20 dependency):** Before firing WA-01 in `assignComplaint`, check if `assignedCentre.isUnregistered === true`. If yes: skip WA-01 entirely (admin contacts the SC manually). Same suppression applies to all SC-directed triggers: WA-02, WA-03, WA-04B, WA-05, WA-06, WA-07, WA-0X. Only WA-04 to customer is exempt — it fires regardless of SC type.
  - [ ] **Cron scheduler skip rule for Unregistered SC (v1.3 Change 2 — Phase 20 dependency):** In `utils/whatsappReminder.js` (the cron job), all DB queries that find complaints to send reminders to must add a filter: `assignedCentre.isUnregistered !== true`. This prevents reminder cycles from ever running on complaints assigned to unregistered SCs. Add this as a base `$match` condition on all cron reminder queries.

- [ ] **Phase 15 — UI/UX Polish & Final Testing**
  - [ ] Improve overall UI flow and UX consistency
  - [ ] Comprehensive end-to-end testing
  - [ ] Visual UI improvements and final layout adjustments
  - [ ] Handle any new minor additions or edge-case features

- [x] **Phase 16 — Custom ID Formatting Rules (Day 21)**
  - [x] Refactored Product ID format to `P + L/C + 6-digit global sequence` (stored without dashes, global counter)
  - [x] Refactored Complaint ID format to `M + I/C + DDMMYY + 4-digit daily sequence + W/O` (stored without dashes, resets daily)
  - [x] Loose alphanumeric search matching in backend for legacy and new formats
  - [x] Update documentation (Deviation logs and Addendum) to match new system specifications

- [x] **Phase 17 — Auth Checks & Forgot Password OTP Fix**
  - [x] Validate password length and confirm password match in backend `registerSC`
  - [x] Trim and lowercase email inputs in all backend auth routes
  - [x] Return explicit 404/400 error on forgot password if user is not found
  - [x] Log OTP to console and implement fallback sandbox mode if Brevo key is missing/placeholder
  - [x] Display actual API error messages on frontend `ForgotPassword` page
  - [x] Run ESLint and verify build

- [x] **Phase 18 — Custom Domain Setup & CORS Resolution (Day 22)**
  - [x] Configure GoDaddy DNS records (A @, CNAME www, CNAME api, TXT _railway-verify.api)
  - [x] Map custom domain `api.microvisonservice.co.in` on Railway and update variables
  - [x] Map custom domain `microvisonservice.co.in` on Vercel and update `VITE_API_URL`
  - [x] Redeploy frontend and backend services
  - [x] Refactor CORS middleware in backend `server.js` to support both www and non-www origins dynamically
  - [x] Verify successful deployment and user login under custom domain

---

## System Changes v1.3 — New Phases

> ⚠ Source document: `files/Microvison_System_Changes_v1.3.md`. These 4 changes introduce new statuses, a new complaint form step, an unregistered SC system, and a full billing payment tracker. They affect the backend models, controllers, routes, and multiple frontend pages and components. Build in order: Phase 19 → 20 → 21 → 22.

---

- [x] **Phase 19 — Skip SC Assignment + Advanced Complaint Search (v1.3 Change 1)**
  > Source: `Microvison_System_Changes_v1.3.md` — Change 1A and 1B. The complaint form gains a "Skip — Assign Later" path, creating a new `unassigned` status. The All Complaints search is rebuilt as a unified 5-field top bar + multi-filter system with AND logic.

  **A. Backend — New `unassigned` Status & Skip Assignment Flow**
  - [x] `models/Complaint.js` — Add `unassigned` to the status enum (before `assigned` in the list). New status lifecycle: `unassigned` → `assigned` → existing flow.
  - [x] `controllers/complaint.controller.js` — Update `createComplaint`: if no `assignedCentreId` is provided in request body, set `status = 'unassigned'` and skip SC assignment and WA-01. Complaint is created and saved normally with no SC linked.
  - [x] `controllers/complaint.controller.js` — Update `assignComplaint` (currently `PATCH /:id/assign`): allow assigning from `unassigned` status (in addition to `new`). When assigning from `unassigned`, status moves to `assigned`, `assignedCentreId` and `assignedAt` are set, ComplaintUpdate log entry created, and WA-01 fires immediately (same as normal assignment). No change needed for re-assignment from `rejected_by_sc`.
  - [x] `controllers/complaint.controller.js` — Update `getActionItems`: add a new section that counts and surfaces `unassigned` complaints. Admin Action Centre must show these as a separate group requiring attention.
  - [x] `routes/complaint.routes.js` — No new routes needed; existing `POST /complaints` and `PATCH /:id/assign` are updated to handle the new flow.

  **B. Backend — Advanced Search & Filter Expansion**
  - [x] `controllers/complaint.controller.js` — Update `getAll` to support unified search across 5 fields simultaneously via a single `q=` query parameter:
    - Search `customerName` (regex, case-insensitive, partial)
    - Search `phone1` OR `phone2` (partial match)
    - Search `complaintId` (partial match via loose alphanumeric regex — handles new and legacy ID formats)
    - Search `serialNumber` on the linked `Product` record (join via `trackingId`)
    - Search `trackingId` on the linked `Product` record
    - Build a single `$or` clause combining all 5 conditions and apply it as part of the existing AND-filter chain.
  - [x] `controllers/complaint.controller.js` — Ensure `getAll` already supports all filter params listed in v1.3 Change 1B. Add any missing ones:
    - `status` — already exists but must now support **comma-separated multi-status** (e.g. `status=done,not_done` → `{$in: ['done','not_done']}`)
    - `unassigned` status must be included as a valid status option in filter
    - `state=` filter (currently only `city` and `district` may exist — add `state=` param)
    - `scCapability=` — filter complaints where `assignedCentre.productCapability` equals given value (join on SC record)
    - `reopenedOnly=true` — filter `isReopened: true`
    - `originalOnly=true` — filter `isReopened: false` (or not set)
    - `dateFrom=` and `dateTo=` — already exists, verify it uses `createdAt` range correctly
    - Confirm: `product=`, `complaintType=`, `warrantyStatus=`, `assignedCentreId=`, `serialNumber=`, `trackingId=` — all already exist from Phases 7C and 10
  - [x] `routes/complaint.routes.js` — No new routes needed; `GET /complaints` passes all params through.

  **C. Frontend — Step 4 (now Step 5 after Phase 21) — Skip SC Assignment**
  > Note: After Phase 21 inserts a new Step 2, what was Step 4 (SC Assignment) becomes Step 5. Build this as Step 4 now; Step numbering is updated in Phase 21.
  - [x] `components/forms/Step4AssignSC.jsx` — Add a second path at the bottom of the step: a clearly styled `Skip — Assign Later` button (secondary/outline style, with a note: "You can assign an SC from the complaint detail view"). If clicked, no SC is selected, and the wizard submits without SC data.
  - [x] `pages/admin/NewComplaint.jsx` — Update the wizard submit logic: if `assignedCentreId` is null (skip was chosen), call only `POST /complaints` (no `PATCH /:id/assign`). Show success message indicating complaint is created as "Unassigned".
  - [x] `pages/admin/AllComplaints.jsx` — Add an `Unassigned` badge (amber/yellow) for complaints with `status = 'unassigned'`. Ensure `unassigned` is included as a selectable status in the filter list.
  - [x] `components/complaint/AdminComplaintDetail.jsx` — When complaint `status = 'unassigned'`: show an "Assign Service Centre" action button prominently at the top of the action panel. Clicking opens the SC picker (same component as Step4AssignSC). On confirmation, call `PATCH /:id/assign`. After successful assignment, the complaint moves to `assigned` and the WA-01 message fires.
  - [x] `pages/admin/ActionCentre.jsx` — Add a new dedicated section: "Unassigned Complaints" — shows complaints with `status = 'unassigned'`, each with an `Assign` button that opens the SC picker inline.

  **D. Frontend — Advanced Search & Filter UI Rebuild**
  - [x] `components/filters/ComplaintFilters.jsx` — Full rebuild of the filter bar:
    - **Top search bar:** Single `<input>` that maps to the `q=` query param. Debounced 300ms. Placeholder: "Search by name, phone, complaint ID, serial no, product ID..."
    - **Status filter:** Replace single-select with multi-select dropdown (checkboxes inside a dropdown). Include `unassigned` as the first option. Shows selected count badge on the dropdown trigger.
    - **Date Range:** Replace any existing `dateFrom`/`dateTo` inputs with a date range picker offering quick shortcuts: `Today`, `Yesterday`, `Last 7 days`, `Last 30 days`, `Custom` (opens two date pickers).
    - **Cascading Location filter:** State → District → City selects (same 3-way cascade pattern used in forms; source data from cities API).
    - **Assigned SC filter:** Dropdown of all SC names (registered + unregistered). Maps to `assignedCentreId=`.
    - **SC Capability filter:** Single select `All / LED Only / Cooler Only / Both`. Maps to `scCapability=`.
    - **Reopen Status filter:** Single select `All / Reopened Only / Original Only`. Maps to `reopenedOnly=true/false`.
    - Retain all existing filters: Product, Complaint Type, Warranty, Tracking ID, Serial Number.
    - **Active filter count badge:** Count of non-default filter values shown on the "Show/Hide Filters" toggle button.
    - **Reset All button:** Clears `q`, all filters, and date range back to defaults.
  - [x] `hooks/useComplaints.js` — Update to pass `q=`, multi-status array (joined as comma-separated string), `state=`, `scCapability=`, `reopenedOnly=`, and all new filter params to the API. Ensure debounce logic is applied only to `q` field.

  **E. Status Flow Map Update (for dev reference)**
  - [x] Updated lifecycle: `unassigned` → `assigned` → `accepted` or `rejected_by_sc` → ... (rest unchanged)
  - [x] `unassigned` → `assigned`: admin assigns from detail view or Action Centre. WA-01 fires on this transition (same as any assignment).

---

- [x] **Phase 20 — Unregistered (Admin-Maintained) SC System (v1.3 Change 2)**
  > Source: `Microvison_System_Changes_v1.3.md` — Change 2A through 2F. Introduces a new type of SC record with `isUnregistered: true`. These SCs have no portal login, no WhatsApp reminders sent to them, and all complaint updates are performed by the admin on their behalf. Includes inline city creation and an upgrade/linking flow when they later register formally.

  **A. Backend — New Fields on ServiceCentre Model**
  - [x] `models/ServiceCentre.js` — Add new fields:
    - `isUnregistered` (Boolean, default: `false`) — marks if this is an admin-created unregistered SC
    - `linkedRegisteredSCId` (ref: ServiceCentre, optional) — populated when the unregistered SC is linked to a newly registered account during upgrade (Section 2F)
    - `archivedAt` (Date, optional) — set when an unregistered SC is archived after upgrade (audit record)
    - `isArchived` (Boolean, default: `false`) — hides the SC from active lists after upgrade
  - [x] `models/ServiceCentre.js` — The `status` field on unregistered SCs is always `active` by default (they skip the approval flow entirely). The `userId` field is `null` (no User/login record).

  **B. Backend — Unregistered SC Creation Controller**
  - [x] `controllers/serviceCentre.controller.js` — Add `createUnregistered` handler:
    - Accepts: `name` (businessName), `phone1` (required), `phone2` (optional), `city` (required), `district` (auto-filled or provided), `fullAddress` (optional), `productCapability` (optional, defaults to `both`)
    - Creates a new `ServiceCentre` document with `isUnregistered: true`, `status: 'active'`, `userId: null`
    - Does NOT create a `User` record — no login credentials
    - Returns the new SC `_id` so the caller can immediately assign the complaint to it
    - If `city` does not exist in the `cities` collection, create it on the spot (see Section 2D — inline city creation)
  - [x] `controllers/serviceCentre.controller.js` — Update `getAll` handler:
    - Add `isUnregistered=true/false` query param filter. If not provided, return both registered and unregistered.
    - Add a `registrationType=unregistered` filter option for the SC list page.
  - [x] `controllers/serviceCentre.controller.js` — Add `linkToRegistered` handler (Section 2F upgrade flow):
    - Called by admin during SC registration approval
    - Accepts: `unregisteredSCId` (the old record) and `newRegisteredSCId` (the newly created registered SC)
    - Reassigns all `Complaint` records from `assignedCentreId = unregisteredSCId` → `assignedCentreId = newRegisteredSCId`
    - Sets `unregisteredSC.isArchived = true`, `unregisteredSC.archivedAt = now`, `unregisteredSC.linkedRegisteredSCId = newRegisteredSCId`
    - Removes `isUnregistered` flag from new SC (it's registered now)
    - Does NOT delete old record — archived in place for audit
  - [x] `routes/serviceCentre.routes.js` — Add routes:
    - `POST /service-centres/unregistered` → `createUnregistered` (admin only)
    - `PATCH /service-centres/:id/link-to-registered` → `linkToRegistered` (admin only)

  **C. Backend — Inline City / District / State Creation**
  - [x] `controllers/city.controller.js` — Add `createCity` handler:
    - Accepts: `city` (name), `district`, `state` (all required)
    - Checks if the city already exists (case-insensitive) — if yes, returns existing record (no duplicate)
    - If new: creates a `City` document and returns it
    - Accessible from admin only
  - [x] `routes/city.routes.js` — Add route: `POST /cities` → `createCity` (admin only)

  **D. Backend — WhatsApp Logic for Unregistered SC**
  - [x] `controllers/complaint.controller.js` — Update `assignComplaint`:
    - After assignment, check if `assignedCentre.isUnregistered === true`
    - If `true`: skip WA-01 (do NOT send WhatsApp to SC). Log in ComplaintUpdate: "Assigned to Unregistered SC — WA-01 not sent. Admin to contact SC manually."
    - WA-04 to customer still fires on SC acceptance (but since unregistered SC has no portal, admin marks `accepted` on their behalf — see frontend section)
  - [x] `controllers/complaint.controller.js` — Update `updateStatus`, `markGoing`, `accept`, `reject`, `markPartDelivered`, `markPartReceived`:
    - When action is performed for a complaint assigned to an unregistered SC, suppress ALL SC-directed WhatsApp triggers (WA-02, WA-03, WA-04B, WA-05, WA-06, WA-07, WA-0X). Only WA-04 to customer fires (on acceptance).
    - Add a helper: `isUnregisteredSCComplaint(complaint)` — checks `complaint → assignedCentre.isUnregistered`. Use this before every WA trigger.
  - [x] `utils/whatsappReminder.js` (Phase 14 cron) — When built, ensure the cron queries skip complaints where `assignedCentre.isUnregistered === true` for all SC-directed reminder triggers.

  **E. Frontend — SC Picker + Unregistered SC Creation Form**
  - [x] `components/forms/Step4AssignSC.jsx` (becomes Step5 after Phase 21) — Add a `+ Create Unregistered SC` button/link below the normal SC list. Clicking opens an inline modal/form with:
    - Business Name / Name (required)
    - Phone 1 (required), Phone 2 (optional)
    - City (cascading dropdown with inline "Create new" option — see below), District (auto-filled), Full Address (optional)
    - On submit: `POST /api/service-centres/unregistered` → get back new SC `_id` → set as `selectedSCId` → proceed to assign.
  - [x] `components/forms/Step4AssignSC.jsx` — SC list cards: show `UNREGISTERED` badge (amber) on any card where `isUnregistered: true`. Admin can select an existing unregistered SC from the list (for reuse — Section 2E).
  - [x] `components/complaint/AdminComplaintDetail.jsx` — Show `UNREGISTERED SC` badge prominently in the Assigned SC section header when the complaint is assigned to an unregistered SC. Add a persistent banner in the action panel: "This complaint is assigned to an Unregistered SC. All status updates must be made manually by admin."
  - [x] `components/complaint/AdminComplaintDetail.jsx` — For complaints assigned to unregistered SCs: unlock all status actions for the admin (Going, Done, Not Done, Part Pending, Mark Received). The admin can perform all these actions directly — they are normally SC-only actions. All actions go through the same backend endpoints as SC actions but are performed by the admin user.

  **F. Frontend — Inline City Creation**
  - [x] All city dropdowns in the admin interface (SC creation, unregistered SC form, complaint registration Step 1) — when admin types a name that doesn't match any existing city, show an inline option: `'Create "[typed name]" as a new city'`. Clicking opens a small inline form: City Name (pre-filled), District Name, State Name. On confirm: `POST /api/cities` → new city returned → automatically selected in the dropdown. Instant system-wide availability.

  **G. Frontend — SC List Page (Service Centres Tab)**
  - [x] `pages/admin/ServiceCentres.jsx` — Add filter: `Registration Type: All / Registered / Unregistered` (maps to `isUnregistered=true/false`). Ensure existing search (name, phone, city, district) also searches unregistered SC records.
  - [x] `pages/admin/ServiceCentres.jsx` — Show `UNREGISTERED` badge (amber) on SC cards/rows for `isUnregistered: true` SCs.

  **H. Frontend — SC Registration Approval + Upgrade/Link Flow (Section 2F)**
  - [x] `pages/admin/ActionCentre.jsx` — In the "Pending SC Registrations" section, when the admin opens a new SC registration for approval:
    - System checks if any unregistered SC records have a phone number match — if found, shows a suggestion banner: "An unregistered SC with phone [X] already exists — [Name], [City]. Would you like to link this registration to that record?" with `[Link]` and `[Skip]` buttons.
    - `[Link]` button: triggers a search/picker allowing admin to find the correct unregistered SC by name, city, district, phone, or address (not phone-match only). Admin selects and confirms.
    - On link confirm: call `PATCH /api/service-centres/:id/link-to-registered` with the unregistered SC ID and the new registration ID.
    - On `[Skip]` or no match: approve normally — a brand new registered SC account is created with no link to any unregistered record.
  - [x] `pages/admin/ActionCentre.jsx` — Show the historical `UNREGISTERED SC` badge and admin-maintained markers in the complaint timeline even after upgrade (audit trail, read-only).

---

- [x] **Phase 21 — New Step 2 (Product Info) + Warranty Logic Overhaul (v1.3 Change 3)**
  > Source: `Microvison_System_Changes_v1.3.md` — Change 3A through 3G. Inserts a brand new Step 2 into the complaint registration form, shifting old Step 2 → Step 3, Step 3 → Step 4, Step 4 → Step 5. Step 2 collects Bill Date, Bill Photo, Shop Name, Serial Number, and Model Number. Warranty logic is completely overhauled with 4 priority rules. SC Done form gets demanded fields for missing product info.

  **A. Backend — New Fields on Product Model**
  - [x] `models/Product.js` — Add new fields:
    - `shopName` (String, optional) — name of shop/dealer where product was purchased
    - `modelNumber` (String, optional) — product model/variant identifier
    - `warrantyForceReason` (String, optional) — reason text when admin forces warranty override
    - `missingFieldsWarning` (Array of String, optional) — list of Step 2 field names that were bypassed at closing without being filled (e.g. `['billDate', 'billPhoto', 'shopName']`). Used for persistent missing-field indicator.

  **B. Backend — New Fields on Complaint Model**
  - [x] `models/Complaint.js` — Add new snapshot fields:
    - `shopName` (String, optional) — snapshot of Product's shopName at time of this complaint
    - `modelNumber` (String, optional) — snapshot of Product's modelNumber at time of this complaint
    - `locationText` (String, optional) — paste-friendly Google Maps link or location description. Stored on Complaint (not Product — location can differ per visit). Sent to SC in WA-01.
    - `warrantyForceReason` (String, optional) — snapshot of force override reason at time of this complaint (admin only)
    - `scBillPhotoUrl` (String, optional) — URL of bill photo uploaded by SC in Done form (stored separately from Product's `billPhoto`)
    - `scSerialSlipPhotoUrl` (String, optional) — URL of serial/model number sticker photo uploaded by SC in Done form (stored separately for admin to transcribe)
    - `missingFieldsBypassed` (Array of String, optional) — list of fields the admin explicitly bypassed at closing time without filling

  **C. Backend — Warranty Logic Overhaul in `warrantyCalculator.js`**
  - [x] `utils/warrantyCalculator.js` — Completely rewrite to implement 4 priority rules from v1.3 Section 3G:
    - **Rule 1 (Bill Date present):** `warrantyExpiryDate = billDate + 3 years`. `warrantyStatus = 'in_warranty'` if `today <= warrantyExpiryDate`, else `'out_of_warranty'`. `warrantySource = 'auto_calculated'`. `forceReason = null`.
    - **Rule 2 (No bill date, manual selection):** Accept `manualSelection` (`'in_warranty'` or `'out_of_warranty'`) and `manualReason` (required text). `warrantyStatus = manualSelection`. `warrantyExpiryDate = null`. `warrantySource = 'manual'`. `forceReason = null`.
    - **Rule 3 (LED Installation, nothing provided):** `warrantyStatus = 'in_warranty'`. `warrantyExpiryDate = null`. `warrantySource = 'manual'`. (Safe default for new installs.)
    - **Rule 4 (Force override):** Admin passes `forceOverride = true` + `forceReason` (required text). `warrantyStatus = forced value` (opposite of auto-calculated or whatever admin chose). `warrantySource = 'forced'`. `forceReason = admin's text`. This takes precedence over all other rules.
    - Return shape: `{ warrantyStatus, warrantyExpiryDate, warrantySource, warrantyForceReason }`.
  - [x] `utils/warrantyCalculator.js` — Ensure fresh calculation at complaint creation time even if `billDate` was previously stored: always re-evaluate `today vs warrantyExpiryDate` so expired products auto-show as `out_of_warranty` even if they were `in_warranty` last year.

  **D. Backend — Update Product Controller for New Fields**
  - [x] `controllers/product.controller.js` — Update `createProduct` and `updateProduct` to accept and save `shopName`, `modelNumber`, `warrantyForceReason`, and `missingFieldsWarning` fields.
  - [x] `controllers/product.controller.js` — After saving/updating, run fresh `warrantyCalculator` with the latest `billDate` (if present) or manual values to update the Product record's warranty fields.

  **E. Backend — Update Complaint Controller for New Fields + Step 2 Data**
  - [x] `controllers/complaint.controller.js` — Update `createComplaint`:
    - Accept new Step 2 fields from request body: `shopName`, `modelNumber`, `locationText`, `warrantyForceReason`, and `forceOverride` flag.
    - Pass all these to `warrantyCalculator` to determine final warranty values.
    - Snapshot `shopName`, `modelNumber`, `locationText`, `warrantyForceReason` onto the Complaint document.
    - Write `shopName`, `modelNumber` back to the Product record (update or create).
    - If `locationText` is filled, include it in WA-01 message content (see Phase 14 note).
  - [x] `controllers/complaint.controller.js` — Update `confirmDone`:
    - Before closing, check Product record's 5 Step 2 fields: `billDate`, `billPhoto`, `shopName`, `serialNumber`, `modelNumber`.
    - If any are empty: if request contains `missingFieldsBypassed` array (admin confirmed bypass): save bypassed fields to `complaint.missingFieldsBypassed` AND add to `product.missingFieldsWarning[]` (append, don't overwrite). Then close normally.
    - If `missingFieldsBypassed` is NOT provided and fields are missing: return a 400-level warning response with the list of missing fields — the frontend must show the warning dialog before re-submitting.
  - [x] `controllers/complaint.controller.js` — Update `updateStatus` (SC Done path):
    - When `status = 'done'` is submitted by SC: check which of `billDate`, `billPhoto`, `shopName`, `serialNumber`, `modelNumber` are empty on the linked Product record.
    - If `billDate`/`billPhoto`/`shopName` are missing: check if request body contains `scBillPhotoUrl` — if yes, save to `complaint.scBillPhotoUrl` AND update `product.billPhoto` with the new URL. Re-run warranty calculation for the Product record.
    - If `serialNumber`/`modelNumber` are missing: check if request body contains `scSerialSlipPhotoUrl` — save to `complaint.scSerialSlipPhotoUrl` (stored on complaint for admin to view and transcribe).
    - Store `bypassed` field names from SC request as `complaint.scMissingBypass[]` (records that SC intentionally skipped).

  **F. Frontend — Insert New Step 2 (Product Info) into the Wizard**
  - [x] `pages/admin/NewComplaint.jsx` — Update step wizard to have 5 steps:
    - Step 1: Customer Info (unchanged)
    - **Step 2: Product Info (NEW)**
    - Step 3: Product & Type (was Step 2)
    - Step 4: Charges & Media (was Step 3)
    - Step 5: SC Assignment (was Step 4)
    - Update step indicator UI to show 5 steps. Update `currentStep` state logic to go 1→2→3→4→5.
  - [x] Create `components/forms/Step2ProductInfo.jsx` — NEW FILE:
    - **Bill Date:** Date picker input. Inline label: "Date of purchase / installation bill". On value change: run client-side warranty preview using `warrantyCalculator` logic and show the calculated status to the admin instantly (e.g. "Warranty: In Warranty — expires 15 Mar 2028").
    - **Bill Photo:** `ImageUploader` (max 1 image). Admin uploads the physical bill/receipt photo.
    - **Shop Name:** Text input. Label: "Shop / dealer name".
    - **Serial Number:** Text input. (Also present in Step 1 — this is the pre-fill sync; if filled in Step 1, auto-populate here. If filled here, sync back to formData.)
    - **Model Number:** Text input. Label: "Model number / variant".
    - If the product was linked in Step 1, all 5 fields come pre-filled from the Product record.
    - **Change warning:** If admin modifies any pre-filled value, show an inline alert under that field: "Previously saved as: [X]. You are changing it to: [Y]. Confirm?" with `[Keep New]` / `[Revert]` buttons.
    - **All fields are optional** — no validation blocks submission. Admin can proceed with all blank.
    - At bottom: show current warranty preview card (if bill date is filled). Show "Warranty will be set manually" notice if bill date is blank.
  - [x] `components/forms/Step2ProductInfo.jsx` — Warranty section (at the bottom of the step):
    - **If bill date is filled:** Show read-only computed warranty info. Show `[Force Override]` button. If clicked, opens a text input for `forceReason` and a toggle to choose forced status.
    - **If bill date is NOT filled:** Show manual selector: `In Warranty` / `Out of Warranty` radio. Show required `manualReason` text input below the selector. For LED Installation: pre-select `In Warranty` but allow change.
    - All warranty values (computed or manual) are stored in `formData` and passed through to the create API.
  - [x] `components/forms/Step1CustomerInfo.jsx` — Add `Location / Action Text` field:
    - A large `<textarea>` (paste-friendly) below the address section.
    - Label: "Location / Maps Link (optional)". Placeholder: "Paste a Google Maps link, coordinates, or any navigation notes here. This will be sent to the SC."
    - No validation. Any text accepted. Stored in `formData.locationText`.
  - [x] `components/forms/Step3ProductType.jsx` (was Step2) — The warranty section in this step is REMOVED or simplified. Warranty is now fully handled in Step 2. Step 3 now only shows Product type (LED/Cooler) and Complaint type (Installation/Complaint). No warranty toggle or bill date fields here.

  **G. Frontend — SC Done Form — Demanded Fields for Missing Product Info**
  - [x] `components/complaint/SCComplaintDetail.jsx` — In the **Done form slide-out**:
    - Before rendering the Done form, fetch the complaint's linked Product record to check which of the 5 Step 2 fields are empty on the Product.
    - **Missing Bill Date / Bill Photo / Shop Name:** Show a sub-section at the top of the Done form: "Product Bill Info Required — The bill information for this product was not provided at registration. Please ask the customer for their purchase bill and upload a photo here." Add an `ImageUploader` (max 1) for the bill photo. Add a note: "This will be used to update the product's warranty information."
    - **Missing Serial Number / Model Number:** Show a sub-section: "Product Serial Info Required — Please photograph the serial number / model sticker on the product." Add an `ImageUploader` (max 1) for the serial/model sticker photo.
    - **Bypass:** Each sub-section has a `[Skip for now]` checkbox/link. If SC skips without uploading, a warning badge shows: "Missing: Bill Photo" or "Missing: Serial Photo". SC must explicitly check `[Skip for now]` per item before Submit is allowed.
    - Both uploaded files go into the Done form `formData` as `scBillPhotoUrl` and `scSerialSlipPhotoUrl`. These are sent with the `PATCH /:id/status` (Done) API call.

  **H. Frontend — Admin Closing Check (Missing Product Fields Warning)**
  - [x] `components/complaint/AdminComplaintDetail.jsx` — In the **Confirm Done** action:
    - Before showing the Confirm Done dialog, call `GET /complaints/:id` to get latest Product info and check which of the 5 Step 2 fields are empty.
    - If any are missing: show a warning dialog listing the empty fields: "The following product fields are still empty: [Bill Date, Bill Photo, Shop Name]. Please fill them before closing or bypass each field."
    - For each missing field: show an inline input/picker to fill it right there in the dialog. Or a `[Bypass this field]` toggle per field (requires individual confirmation).
    - After admin resolves all fields (filled or bypassed): submit `confirmDone` with the `missingFieldsBypassed` array in the request body.
    - If admin bypasses: a persistent yellow warning icon appears on the Product record card in all future complaints for this product (showing which fields were bypassed and when). This persists until the fields are eventually filled.
  - [x] `components/complaint/AdminComplaintDetail.jsx` — Show the SC-uploaded bill photo (`scBillPhotoUrl`) and serial slip photo (`scSerialSlipPhotoUrl`) in the product info subsection of the complaint detail view. Admin can:
    - **Bill photo:** Accept it (auto-fill bill date from photo context), replace with another image, or remove it.
    - **Serial slip photo:** View it and manually type the serial/model number into the Product record fields. This is a manual transcription step — the system does not auto-read the photo.

  **I. Step Renaming — Update All References**
  - [x] `pages/admin/NewComplaint.jsx` — Rename step component imports: old `Step2ProductType` → `Step3ProductType`, old `Step3Charges` → `Step4Charges`, old `Step4AssignSC` → `Step5AssignSC`. Update all `currentStep` conditionals.
  - [x] Rename files to match new step numbers (or keep filenames as-is and update imports — choose consistency):
    - `Step2ProductType.jsx` → `Step3ProductType.jsx`
    - `Step3Charges.jsx` → `Step4Charges.jsx`
    - `Step4AssignSC.jsx` → `Step5AssignSC.jsx`
  - [x] Update all internal references in `NewComplaint.jsx`, `App.jsx` imports, and any documentation references.

  **J. WA-01 Content Update (Phase 14 dependency)**
  - [x] When Phase 14 is built: `WA-01` message must include `Serial Number` and `Model Number` (if filled) and `locationText` (if filled). These are sent to the SC for navigation and product identification. Admin-only fields (`billDate`, `billPhoto`, `shopName`) are NOT included in WA-01.

---

- [x] **Phase 22 — Advanced Billing Filters + Mark as Paid System (v1.3 Change 4)**
  > Source: `Microvison_System_Changes_v1.3.md` — Change 4A, 4B, 4C. The billing dashboard gets a new exact date range filter (replacing Month+Year), a Payment Status filter, a full Mark as Paid / Mark as Unpaid system with 3 bulk methods and individual selection, and two running totals below the billing table.

  **A. Backend — New Payment Fields on Complaint Model**
  - [x] `models/Complaint.js` — Add new fields:
    - `paymentStatus` (Enum: `unpaid` / `paid`, default: `'unpaid'`) — only relevant when `billGenerated = true`. Default is `unpaid` on bill generation.
    - `paidAt` (Date, optional) — timestamp of when the bill was last marked as paid. Set to `null` when marked as unpaid (reversal). Updated each time "Mark as Paid" is clicked.
    - `paidBy` (ref: User, optional) — the admin user who last marked the bill as paid. For audit. Set to `null` on unpaid reversal.

  **B. Backend — Billing Controller Updates**
  - [x] `controllers/billing.controller.js` — Update `getComplaintBills`:
    - Replace `month=` and `year=` params with `dateFrom=` and `dateTo=` (ISO date strings). If not provided: default to first day of current month to today.
    - Add `paymentStatus=paid/unpaid` filter param — `{paymentStatus: value}` on the Complaint query.
    - Include `unregistered` SCs in results (existing query already filters by `assignedCentreId` — just ensure unregistered SC records are included in the SC lookup population).
    - Return `paymentStatus`, `paidAt`, `paidBy` fields in each bill result.
  - [x] `controllers/billing.controller.js` — Add `markAsPaid` handler:
    - Accepts: `complaintIds` (array of Complaint `_id`s), `markAs` (`'paid'` or `'unpaid'`).
    - Updates all matching Complaint records: `paymentStatus = markAs`. If `'paid'`: set `paidAt = Date.now()`, `paidBy = req.user.id`. If `'unpaid'`: set `paidAt = null`, `paidBy = null`.
    - Validates: all provided `complaintIds` must have `billGenerated = true`. Rejects any that don't.
    - Returns count of updated records.
  - [x] `controllers/billing.controller.js` — Add `getRunningTotals` handler (or include in `getComplaintBills` response):
    - Returns two sums for the current filtered view:
      - `totalAll`: sum of all bill totals in the current filter (paid + unpaid combined)
      - `totalUnpaid`: sum of only unpaid bill totals in the current filter
    - Calculated server-side using MongoDB `$group` aggregation for accuracy.
  - [x] `controllers/billing.controller.js` — Update `getMonthlyInvoice`:
    - Accept `dateFrom=` and `dateTo=` instead of `month=` and `year=`. Filter `closedAt` (or `billLockedAt`) within the given range.
    - Include `paymentStatus` and `paidAt` in response so the Monthly Invoice view can show payment state.
  - [x] `routes/billing.routes.js` — Add route:
    - `PATCH /billing/mark-paid` → `markAsPaid` (admin only)
    - Update existing `GET /billing/complaints` and `GET /billing/invoice/:scId` to accept new date params.

  **C. Frontend — Billing Dashboard Filter Rebuild**
  - [x] `pages/admin/Billing.jsx` — Replace the existing Month + Year dropdowns with:
    - **From Date:** Date picker input. Default: first day of current month.
    - **To Date:** Date picker input. Default: today.
    - Quick shortcuts row: `This Month` / `Last Month` / `Last 7 Days` / `Last 30 Days` / `Custom` (manual date pickers appear when Custom is selected).
  - [x] `pages/admin/Billing.jsx` — Add **Payment Status** filter:
    - Single select: `All Payment Status` / `Paid Only` / `Unpaid Only`.
    - Maps to `paymentStatus=paid/unpaid` in the API request.
  - [x] `pages/admin/Billing.jsx` — Ensure **Service Centre** filter includes unregistered SCs in the dropdown list (they should appear with `[UNREGISTERED]` tag after their name).
  - [x] `pages/admin/Billing.jsx` — Add **Reset Filters** button: resets to defaults (All SCs, current month, all products, all warranty, all payment status).
  - [x] `hooks/useBilling.js` — Update to pass `dateFrom`, `dateTo`, `paymentStatus` params. Remove `month` and `year` params. Add `markAsPaid(ids, markAs)` function that calls `PATCH /billing/mark-paid`.

  **D. Frontend — Mark as Paid System UI**
  - [x] `components/billing/BillingTable.jsx` — Full rebuild:
    - **Row checkboxes:** Add a checkbox column at the far left of each row. Only rows with `billGenerated = true` are selectable.
    - **Payment Status column:** New column showing `PAID` (green badge) or `UNPAID` (amber badge).
    - **Paid On column:** New column showing formatted `paidAt` timestamp if paid, or `—` if unpaid.
    - **Action bar (appears on checkbox selection):** Fixed bar at the top/bottom of the table. Shows: "X bills selected" + `[Mark Selected as Paid]` + `[Mark Selected as Unpaid]` buttons. Appears only when at least one checkbox is checked.
    - **Bulk "Mark All as Paid" button:** A primary button above the table (always visible, greyed if no unpaid bills in view). Text: "Mark All as Paid ([N] unpaid)". Clicking marks ALL unpaid bills in the CURRENT FILTERED VIEW as paid (not just the visible page — the full filtered result set).
    - **Reversal warning:** When `[Mark Selected as Unpaid]` or bulk unpaid is clicked: show a confirmation dialog: "This will mark [N] paid bill(s) as unpaid. This action is reversible but will affect payment records. Continue?" Admin confirms before proceeding.
  - [x] `components/billing/BillingTable.jsx` — Running totals section (below the table):
    - Two summary cards side by side:
      - **Total Billed:** "₹[totalAll]" — sum of all bills in the current filtered view (paid + unpaid).
      - **Unpaid Total:** "₹[totalUnpaid]" — sum of only unpaid bills. This is what Microvison owes the SC(s).
    - Both update live when filters change.
    - If a specific SC is selected: totals reflect that SC only. If "All SCs": totals reflect all SCs combined.
  - [x] `pages/admin/Billing.jsx` — **At Confirm Done time** (in Admin Complaint Detail): when admin clicks Confirm Done and the bill is generated, show an optional checkbox/toggle: "Mark as Paid immediately". If checked: after calling `confirmDone`, immediately call `PATCH /billing/mark-paid` with the new complaint `_id` and `markAs: 'paid'`. If unchecked: complaint closes as `paymentStatus: 'unpaid'` (default).
  - [x] `components/billing/MonthlyInvoice.jsx` — Show payment summary per month card:
    - Add: "Paid: ₹[paid amount] | Unpaid: ₹[unpaid amount]" under the total.
    - If fully paid: show a green `FULLY PAID` badge on the card. If partially paid: `PARTIAL`. If nothing paid: `UNPAID`.

  **E. SC Billing Page (Read-only)**
  - [x] `pages/sc/SCBilling.jsx` — Update filters to use `dateFrom`/`dateTo` (date pickers) instead of month/year dropdowns. SCs only see their own billing data — payment status and paidAt are shown as read-only columns (so SC can see which bills Microvison has marked as paid).

- [x] **Phase 20 — Post-Implementation Refinement & UI Consistency Bugs**
  - [x] **J. Done Form Simplification & Realignment**
    - [x] Simplify unregistered SC Done form to only request photos, Out-of-Warranty client payments, and notes (keep money/petrol/extras at final close).
    - [x] Revert `markAsPaidImmediately` handler logic inside updateStatus done path in backend.
  - [x] **K. Explicit Linking Expansion**
    - [x] Add explicit `🔗 Link Unregistered` action button on pending registrations in Action Centre dashboard.
    - [x] Add explicit `🔗 Link Unregistered` action button and search modal inside the Service Centre details view (`SCDetail.jsx`).
  - [x] **L. Layout & Backend Bug Fixes**
    - [x] Resolve text-wrapping issue in tables by adding `whitespace-nowrap` to the Warranty status badges.
    - [x] Fix potential crash in backend `part_pending` updates when `scNotes` is empty for admin proxy.

---

- [ ] **Phase 32 — Reopen Flow Correction & Billing Adjustments**
  - [ ] Investigate and fix Reopen Flow bugs (ensure status transitions and state changes work correctly on backend and frontend).
  - [ ] Implement Reopen Flow billing adjustments (define how existing invoice charges are reversed, adjusted, or locked upon reopening).
  - [ ] Add reopen audit logging and timeline checks to trace cost changes during successive closures.

