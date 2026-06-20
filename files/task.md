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

- [/] **Phase 8.5 — Full SC Flow v1.1 Implementation (SC Portal Rebuild)**
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
  - [ ] Refine SC Assignment Logic (Filter/limit "To whom we can assign" during complaint creation Step 4)
  - [ ] Support custom/new cities/locations not in the pre-seeded master database list, allowing them to be added and marked active
  - [ ] Add an optional `location` text field in Complaint creation Step 1 (Customer Info) and Product schemas, and display it in the customer profile

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

