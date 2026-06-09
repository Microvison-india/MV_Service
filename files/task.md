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
  - [x] `utils/generateComplaintId.js` (MV-YYYY-XXXXX, year-reset)
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

- [x] **Phase 9 — Admin Action Centre (Day 12-13)**
  - [x] Admin confirm and extra charge approval controllers (confirmDone, disputeDone, approveExtra, rejectExtra)
  - [x] Action item lists controller (`getActionItems`)
  - [x] Admin action routes
  - [x] ActionCentre page UI (`pages/admin/ActionCentre.jsx`)
  - [x] `ExtraChargesList` UI component
  - [x] `StatusTimeline` UI component
  - [x] `AdminComplaintDetail` UI slide panel

- [ ] **Phase 10 — Admin Complaints Tab (Day 14-15)**
  - [ ] Complaint getAll controller (with 12+ filters, pagination, sorting)
  - [ ] Admin complaint routes
  - [ ] `ComplaintFilters` UI component
  - [ ] AllComplaints page UI (`pages/admin/AllComplaints.jsx`)
  - [ ] ComplaintDetail — Admin mode
  - [ ] `useComplaints` hook

- [ ] **Phase 11 — Billing (Day 16-17)**
  - [ ] Billing calculator logic (`utils/billingCalculator.js`)
  - [ ] Billing controllers (`getComplaintBills`, `getMonthlyInvoice`)
  - [ ] Billing routes
  - [ ] `BillingTable` & `MonthlyInvoice` UI components
  - [ ] `BillSummary` UI component
  - [ ] Admin Billing page (`pages/admin/Billing.jsx`)
  - [ ] SC Billing page (`pages/sc/SCBilling.jsx`)
  - [ ] `useBilling` hook

- [ ] **Phase 12 — Reopen Flow (Day 18)**
  - [ ] Reopen controller logic
  - [ ] Reopen routes
  - [ ] Reopen forms in UI (ReopenBanner wiring)

- [ ] **Phase 13 — PWA + Polish + Deploy (Day 19-20)**
  - [ ] Finalize Vite PWA config & Icons
  - [ ] Add global Toaster to `main.jsx`
  - [ ] Loading Skeletons & Empty States
  - [ ] Railway Backend Deploy
  - [ ] MongoDB Atlas setup
  - [ ] Cloudinary and Brevo setup verification
  - [ ] Vercel Frontend Deploy

- [ ] **Phase 14 — WhatsApp Integrations (Deferred to End)**
  - [ ] WATI/AiSensy wrapper (`utils/sendWhatsApp.js`)
  - [ ] Trigger 1: New Complaint Assigned (Add to Phase 7 controller)
  - [ ] Trigger 2: Complaint Reopened (Add to Phase 12 controller)
  - [ ] Meta template approvals & Production Testing
