- [ ] **Phase 1 — Project Setup & Config (Day 1)**
  - [ ] Initialize backend repo (`express, mongoose, cors, dotenv, bcryptjs, jsonwebtoken, multer, cloudinary, multer-storage-cloudinary, axios`)
  - [ ] Set up `.env` and `.env.example`
  - [ ] Database config (`config/db.js`)
  - [ ] Cloudinary config (`config/cloudinary.js`)
  - [ ] Brevo email config (`config/brevo.js` HTTP API wrapper)
  - [ ] Express server setup (`server.js`)
  - [ ] Initialize frontend Vite React app
  - [ ] Tailwind & Shadcn initialization (`npx shadcn@latest init`)
  - [ ] Add all Shadcn components (`button input textarea select table dialog tabs badge card form toast toaster sheet dropdown-menu skeleton alert avatar separator label`)
  - [ ] Axios interceptor setup (`src/api/axios.js`)
  - [ ] Vite PWA plugin config

- [ ] **Phase 2 — Database Models (Day 1-2)**
  - [ ] `City` model & Seed Script (`utils/seedCities.js`)
  - [ ] `User` model
  - [ ] `ServiceCentre` model
  - [ ] `Preset` model
  - [ ] `OtpToken` model (with TTL index)
  - [ ] `Complaint` model
  - [ ] `ComplaintUpdate` model
  - [ ] `Invoice` model

- [ ] **Phase 3 — Auth System (Day 2-3)**
  - [ ] Brevo HTTP wrapper function (`utils/sendEmail.js`)
  - [ ] Auth controllers (Login, Register SC, Forgot Password, Verify OTP, Reset Password)
  - [ ] JWT and RBAC Middlewares (`middleware/auth.js`, `middleware/rbac.js`)
  - [ ] Auth routes (`routes/auth.routes.js`)
  - [ ] React AuthContext (`context/AuthContext.jsx`)
  - [ ] React ProtectedRoute in `App.jsx`
  - [ ] Auth UI Pages (`Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `VerifyOtp.jsx`, `ResetPassword.jsx`)

- [x] **Phase 4 — Presets & Cities API (Day 3)**
  - [x] City controller & routes (`/cities`, `/cities/district/:district`)
  - [x] Preset controller & routes (CRUD & toggleActive)
  - [x] `PresetSelector` UI component
  - [x] Admin Presets page (`pages/admin/Presets.jsx`)
  - [x] 3-way Cascading State/District/City dropdown UI in Register form

- [ ] **Phase 5 — Service Centre Management (Day 4-5)**
  - [ ] Service Centre controllers (getAll with filters/pagination, getById, approve, reject, update, deactivate, getStats)
  - [ ] Service Centre routes
  - [ ] `SCFilters` UI component
  - [ ] Admin ServiceCentres List page (`pages/admin/ServiceCentres.jsx`)
  - [ ] Admin SCDetail page (`pages/admin/SCDetail.jsx`)

- [ ] **Phase 6 — File Uploads (Day 5)**
  - [ ] Multer & Cloudinary upload middleware (`middleware/upload.js`)
  - [ ] Upload controllers & routes (`/upload/images`, `/upload/audio`)
  - [ ] `ImageUploader` UI component
  - [ ] `VoiceRecorder` UI component (with iOS Safari fallback)

- [ ] **Phase 7 — Complaint Registration (Day 6-8)**
  - [ ] ID generator utility (`MV-YYYY-XXXXX`)
  - [ ] Reopen checker utility (`utils/reopenChecker.js`)
  - [ ] Complaint creation & assignment controllers
  - [ ] Complaint routes (`create`, `assign`, `reopen-check`)
  - [ ] NewComplaint Step Wizard UI (`Step1CustomerInfo`, `Step2ProductType`, `Step3Charges`, `Step4AssignSC`)
  - [ ] `ReopenBanner` UI component

- [ ] **Phase 8 — Service Centre Portal (Day 9-11)**
  - [ ] SC Complaint controllers (getMyComplaints, accept, reject, markGoing, updateStatus)
  - [ ] SC routes
  - [ ] SCLayout & Sidebar (`pages/sc/SCLayout.jsx`, `layout/SCSidebar.jsx`)
  - [ ] NewRequests page (`pages/sc/NewRequests.jsx`)
  - [ ] MyComplaints page (`pages/sc/MyComplaints.jsx`)
  - [ ] ComplaintDetail — SC mode (`components/complaint/ComplaintDetail.jsx`)
  - [ ] `PetrolEditField` UI component

- [ ] **Phase 9 — Admin Action Centre (Day 12-13)**
  - [ ] Admin confirm and extra charge approval controllers (confirmDone, disputeDone, approveExtra, rejectExtra)
  - [ ] Action item counts controller (`getActionItems`)
  - [ ] Admin action routes
  - [ ] ActionCentre page UI (`pages/admin/ActionCentre.jsx`)
  - [ ] `ExtraChargesList` UI component
  - [ ] `StatusTimeline` UI component

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
