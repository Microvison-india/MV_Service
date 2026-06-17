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

- [ ] **Phase 8.5 — App Polish & Logic Tweaks (Deferred)**
  - [ ] Create distinct UI flows/fields for `not_done`, `part_pending`, and `replacement` final statuses on the SC portal.
  - [ ] Refine SC Assignment Logic (Filter/limit "To whom we can assign" during complaint creation Step 4).
  - [ ] Changes in flow and state of complaint (will change later and update deviation logs if needed).

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
  - [ ] Cloudflare R2 File Storage Migration
    - [x] Install `@aws-sdk/client-s3` in backend
    - [x] Configure R2 environment variables in `.env.example` and `.env`
    - [x] Remove Cloudinary config file (`config/cloudinary.js`)
    - [x] Refactor upload middleware (`middleware/upload.js`) to use R2
    - [x] Verify ESLint and local build correctness
  - [x] Vercel Frontend Deploy

- [/] **Phase 14 — Messaging Integrations (Deferred to End)**
  - [x] Direct Meta WhatsApp Cloud API wrapper utility (`utils/sendWhatsApp.js`) (Sandbox Mode implemented)
  - [ ] Trigger 1: Send "Complaint Received" msg to Customer (Pending approved template)
  - [ ] Trigger 2: Send SC details to Customer (Pending approved template)
  - [ ] Trigger 3: Send basic complaint details to Assigned SC (Pending approved template)
  - [ ] Trigger 4: Complaint Reopened (Pending approved template)
  - [ ] Configure environment variables for permanent credentials and production templates (.env / .env.example)

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
