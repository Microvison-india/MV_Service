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

## Phase 8 — Service Centre Portal

### DEV-TBP-017
- **Phase:** 8
- **TBP Section:** Phase 8, File 4 — `components/complaint/ComplaintDetail.jsx`
- **Type:** CHANGED
- **Summary:** TBP specified that `proofPhotos` and `customerPaymentAmount` should block the final submission until provided. This strict validation was updated to only trigger if the SC selects **Done** as the final status. If they select **Not Done**, **Part Pending**, or **Replacement**, the required validations are bypassed since those states naturally do not require completion proof or customer payment. A completely distinct UI flow for these edge-case statuses will be built in a later polish phase.

---

## Phase 12 — Reopen Flow

### DEV-TBP-018
- **Phase:** 12
- **TBP Section / File:** Phase 12, File 1 — `reopen` / `reopenChecker.js`
- **Type:** CHANGED
- **Summary:** Only complaints with `status === 'closed'` are eligible for reopening. To verify their pre-close status was `done` or `not_done`, the helper queries the `ComplaintUpdate` collection.
- **WhatsApp Integration:** WhatsApp trigger was deferred as a `// TODO` placeholder comment in the controller per DEV-TBP-008.

### DEV-TBP-019
- **Phase:** 12
- **TBP Section / File:** `AdminComplaintDetail.jsx`
- **Type:** ADDED
- **Summary:** Added an inline **Reopen Complaint** action panel inside the detail slide-out review panel for eligible closed complaints, matching the inline aesthetics of Confirm/Dispute actions. It features a required notes textarea and a Cloudinary-powered image uploader (optional, max 2 images).

---

## Addendum v1.2 — Phase 7C: Product Tracking & Warranty System

> **Note:** Addendum v1.2 introduces a new **Phase 7C** inserted immediately after Phase 7B in the build sequence. It supersedes TBP v1.1 Phases 7A/7B for complaint creation controller logic, Step 1 frontend, and the warranty/reopen sections. All other TBP phases remain unchanged.

### DEV-TBP-020
- **Phase:** 7C (New — Product Tracking)
- **TBP Section / File:** `models/Product.js` — NEW FILE
- **Type:** ADDED
- **Summary:** A new `Product` model is required as the permanent record for every physical LED/Cooler unit. Fields: `trackingId` (auto-generated, e.g. PT-000142, unique), `serialNumber` (optional, unique sparse), `hasSerial` (boolean), `product` (enum: led/cooler, locked once set), `customerName`, `phone1`, `phone2`, `localAddress`, `city`, `district`, `state`, `billPhoto` (Cloudinary URL), `billDate`, `warrantyStatus` (in_warranty/out_of_warranty), `warrantyExpiryDate`, `warrantySource` (auto_calculated/manual), `complaintHistory[]` ({complaintId, date, status, type}), `lastComplaintId` (ref Complaint), `lastComplaintDate`.

### DEV-TBP-021
- **Phase:** 7C (New — Product Tracking)
- **TBP Section / File:** `models/Complaint.js` — MODIFIED (new fields added)
- **Type:** CHANGED
- **Summary:** New fields added to the `Complaint` model to store the product link and warranty snapshot: `trackingId` (ref Product — always present once Phase 7C is live), `serialNumber` (String — optional snapshot copy), `billPhoto` (String — Cloudinary URL snapshot), `billDate` (Date snapshot), `warrantyStatus` (snapshot, enum: in_warranty/out_of_warranty), `warrantyExpiryDate` (Date snapshot), `warrantySource` (snapshot, enum: auto_calculated/manual). These are permanent snapshots at complaint creation time and never change retroactively.

### DEV-TBP-022
- **Phase:** 7C (New — Product Tracking)
- **TBP Section / File:** `utils/warrantyCalculator.js` — NEW FILE
- **Type:** ADDED
- **Summary:** New utility implementing the warranty determination logic from Addendum v1.2 Section 4. Given `billDate`, `complaintType`, and an optional admin `manualSelection`, returns `{ warrantyStatus, warrantyExpiryDate, warrantySource }`. Called both when saving a Product record and when snapshotting onto a Complaint. Logic: if `billDate` → auto-calculate; if manual selection → use it; if neither → `in_warranty` for LED installation, `out_of_warranty` for all else.

### DEV-TBP-023
- **Phase:** 7C (New — Product Tracking)
- **TBP Section / File:** `controllers/product.controller.js` — NEW FILE
- **Type:** ADDED
- **Summary:** New controller with 5 handlers: `searchProducts` (GET /products/search?phone=&serial=&name=&address=&trackingId=), `getProduct` (GET /products/:trackingId — full detail + complaintHistory), `createProduct` (POST /products — called internally on complaint submit), `updateProduct` (PUT /products/:trackingId — called internally on complaint submit to update address/bill/warranty), `getReopenCheck` (GET /products/:trackingId/reopen-check — returns lastComplaint status+date for ReopenBanner).

### DEV-TBP-024
- **Phase:** 7C (New — Product Tracking)
- **TBP Section / File:** `routes/product.routes.js` — NEW FILE
- **Type:** ADDED
- **Summary:** New route file mounting all 5 product endpoints defined in DEV-TBP-023. All routes are admin-only (`auth + rbac('admin')`) except `getReopenCheck` which is accessible to both admin and SC. Mounted in `server.js` at `/api/products`.

### DEV-TBP-025
- **Phase:** 7C (New — Product Tracking)
- **TBP Section / File:** `components/forms/Step1CustomerInfo.jsx` — REBUILT
- **Type:** CHANGED
- **Summary:** Step 1 is fully rebuilt to implement Addendum v1.2 Section 6 flow. Key changes: (1) Phone blur triggers `GET /products/search?phone=` — shows 0/1/multiple match UI; (2) 'Search Product Tracking' modal added — search by any identifier; (3) Serial number field added — overrides phone match if existing product found, hard-blocks if serial belongs to different product; (4) Auto-fill behavior: all product fields populated when product linked, all remain editable; (5) 'Last complaint' summary shown in linked banner. Old plain phone-only + reopenChecker.js approach is replaced.

### DEV-TBP-026
- **Phase:** 7C (New — Product Tracking)
- **TBP Section / File:** `components/forms/Step2ProductType.jsx` — MODIFIED (warranty section rebuilt)
- **Type:** CHANGED
- **Summary:** The simple In/Out warranty toggle in Step 2 is replaced with context-sensitive warranty rendering per Addendum v1.2 Section 7: if product linked with existing billDate → read-only display of warranty info with optional update; if product linked with no billDate OR no product linked → bill photo/date fields shown (optional) with manual selector as fallback; LED Installation → defaults to in_warranty if blank. On any billDate change, `warrantyCalculator.js` is called client-side to update the preview immediately.

### DEV-TBP-027
- **Phase:** 7C (New — Product Tracking)
- **TBP Section / File:** `components/complaint/ReopenBanner.jsx` — MODIFIED
- **Type:** CHANGED
- **Summary:** ReopenBanner is updated to pull data from the linked Product record (via `GET /products/:trackingId/reopen-check`) instead of the old `GET /complaints/reopen-check?phone=&product=&complaintType=` endpoint. Banner now shows: Tracking ID, Serial Number (if any), last complaint ID/date/status, current warrantyStatus + expiryDate. New two-action design: 'Reopen this complaint' OR 'New complaint for this product' (both allowed; second option creates a fresh linked complaint but skips the reopen flag).

### DEV-TBP-028
- **Phase:** 7C (New — Product Tracking)
- **TBP Section / File:** `controllers/complaint.controller.js` — MODIFIED (create + getById updated)
- **Type:** CHANGED
- **Summary:** `createComplaint` is updated to: (1) link/create Product record on every submit — if no trackingId provided, create new Product; if trackingId provided, update existing Product with latest address/bill/warranty; (2) append new complaint to `complaintHistory[]` and update `lastComplaintId/lastComplaintDate`; (3) snapshot all 7 new warranty fields onto the Complaint document. `getComplaintById` is updated to include `productTimeline` array in response (sourced from `Product.complaintHistory[]`).

### DEV-TBP-029
- **Phase:** 7C (New — Product Tracking)
- **TBP Section / File:** `components/complaint/AdminComplaintDetail.jsx` + `SCComplaintDetail.jsx` — MODIFIED
- **Type:** ADDED
- **Summary:** Both complaint detail slide-out panels receive a new **Product Timeline** history section at the bottom. It aggregates all complaints under their parent product tracking record into collapsible cards. The active complaint is highlighted and auto-expanded on load. Historical complaints remain collapsed, and when clicked, act as an accordion to dynamically fetch their specific job details (notes, proof photos, petrol, invoice) via `GET /api/complaints/:id` and expand them inline. For SC: historical complaints assigned to other centres are shown as plain text only (not clickable). Sourced from `productTimeline` returned in the existing complaint detail API response.

### DEV-TBP-030
- **Phase:** 7C (New — Product Tracking)
- **TBP Section / File:** `components/filters/ComplaintFilters.jsx` — MODIFIED
- **Type:** ADDED
- **Summary:** Two new search/filter fields added to the existing `ComplaintFilters` component on the All Complaints tab: **Search by Serial Number** and **Search by Tracking ID**. These pass `serialNumber=` and `trackingId=` query params to `GET /complaints`. The `getAll` controller is updated to filter by these params. No other changes to the All Complaints list UI.

### DEV-TBP-031
- **Phase:** Future / Custom ID Format (New)
- **TBP Section / File:** `utils/generateTrackingId.js`
- **Type:** CHANGED
- **Summary:** Redesigned Product ID (Tracking ID) format to `P` + `L/C` + `6-digit sequence number` (e.g. `PL000001` or `PC000002`). The utility function now accepts `productType` to append the correct category code (`L` or `C`). The global counter queries the last 10 products, parses their legacy or new ID formats to extract the numeric suffix, and determines the maximum value to increment globally.

### DEV-TBP-032
- **Phase:** Future / Custom ID Format (New)
- **TBP Section / File:** `utils/generateComplaintId.js` / `complaint.controller.js`
- **Type:** CHANGED
- **Summary:** Redesigned Complaint ID format to `M` + `I/C` + `DDMMYY` (creation date) + `4-digit sequence` + `W/O` (warranty code). The daily counter resets to `0001` each day, scanning today's date formatted as `DDMMYY` to find the highest sequence number. In the creation controller, ID generation executes *after* warranty calculation to get the resolved status. Search pattern matcher updated in both product and complaint controllers to flexibly query all ID styles.

### DEV-TBP-033
- **Phase:** Future / Customer Card Layout Refinement
- **TBP Section / File:** `AdminComplaintDetail.jsx` / `SCComplaintDetail.jsx`
- **Type:** CHANGED
- **Summary:** Modified JSX rendering in both detail views to output a styled Customer Profile card. Added a grid container to output Name, Phone (standardized `phone1 / phone2` format), Address (concatenated localAddress, city, district, state), Warranty Status, Bill Date, Warranty Expiry Date, Serial Number, and Tracking ID with clear labels. Checked if variables exist (such as `latestBillDate` and `latestWarrantyExpiryDate`) and formatted them using a localized `formatDate` helper. Included a manual selection check on warranty status. Adjusted fields to align with timeline visibility differences.

## Phase 13 — PWA + Polish + Deploy

### DEV-TBP-034
- **Phase:** 13
- **TBP Section / File:** `middleware/upload.js` / File Upload storage provider
- **Type:** CHANGED
- **Summary:** Replaced **Cloudinary** and **multer-storage-cloudinary** storage engines with **Cloudflare R2** via the S3-compatible protocol. Created a central config file `config/r2.js` exporting the initialized S3 client. Refactored `middleware/upload.js` to process image uploads with `sharp` (compressing them to JPEGs under 1200px width/height at 80% quality) and upload the resulting buffers directly to R2. The middleware maps output properties to `file.path` and `file.filename` to preserve compatibility with existing controller endpoints and schemas.

---

## Phase 8.5 — Full SC Flow v1.1 (SC Portal Rebuild)

> Source document: `files/Microvison_SC_Flow_v1.1.txt`

### DEV-TBP-035
- **Phase:** 8.5
- **TBP Section / File:** `models/Complaint.js` — status enum
- **Type:** CHANGED
- **Summary:** The `replacement` status value is **removed** from the Complaint status enum. Per SC Flow v1.1 Section 7 and Section 16, Replacement is NOT a separate flow or status — it is Part Pending where the 'part' being delivered is the full product unit. The SC states this clearly in the Part Pending form's text and voice note. No code or UI change is needed to handle replacement differently from Part Pending. This aligns with Phase 8.5.A in the task.md.

### DEV-TBP-036
- **Phase:** 8.5
- **TBP Section / File:** `models/Complaint.js` — new fields
- **Type:** ADDED
- **Summary:** New fields required by SC Flow v1.1 are added to the Complaint model: `notDoneReason` (String), `notDoneVoiceUrl` (String), `partDetails` (String — description of part/unit needed), `partPendingVoiceUrl` (String), `partDeliveredAt` (Date), `partDeliveredNote` (String — admin note on delivery), `partReceivedAt` (Date), `distanceTravelled` (Number — km, SC fills in Done form), `totalVisits` (Number — SC fills in Done form). Also: `part_received` is added to the status enum.

### DEV-TBP-037
- **Phase:** 8.5
- **TBP Section / File:** SC Flow v1.1 Section 5 — Done Form
- **Type:** DECISION
- **Summary:** The Done form captures OVERALL totals for the ENTIRE complaint lifecycle (all visits combined). If a complaint went through 3 Not Done cycles before Done, the SC enters the TOTAL petrol for all 4 visits in a single Done form. The system does NOT ask for per-visit petrol. This was explicitly specified in SC Flow v1.1 Section 5.2 and Section 6.4.

### DEV-TBP-038
- **Phase:** 8.5
- **TBP Section / File:** SC Flow v1.1 Section 6 — Not Done Form
- **Type:** DECISION
- **Summary:** Not Done does NOT close the complaint. Status stays as `not_done` (open). The SC is expected to return and take further action. The form requires EITHER a reason text box OR a voice note (or both) — the system blocks submission if both are blank. Photos are optional (max 5). Multiple Not Done submissions are allowed — each resets the 24-hour WA-05 reminder timer.

### DEV-TBP-039
- **Phase:** 8.5
- **TBP Section / File:** SC Flow v1.1 Section 7 — Part Pending Flow
- **Type:** DECISION
- **Summary:** Part Pending requires 4 compulsory inputs: voice note (max 2 min), text notes, parts detail (description of what is needed), and minimum 2 photos (max 5, proof of diagnosis). After SC submits Part Pending, the complaint waits for the admin to physically arrange the part and mark it as **Delivered** in the app. The admin's Delivered marker is a timeline entry only — it does NOT change the complaint status. Once admin marks Delivered, SC taps **Mark as Received** which changes status to `part_received`. Only then can SC take the next action (Done, Not Done, or another Part Pending).

### DEV-TBP-040
- **Phase:** 8.5
- **TBP Section / File:** SC Flow v1.1 Section 8 — Billing
- **Type:** DECISION
- **Summary:** Billing rules confirmed. Bill is ONLY generated when admin clicks **Confirm Done** (status moves to `closed`). No bill for complaints that stay in Not Done or Part Pending indefinitely. Out-of-warranty billing: Microvison does NOT cover petrol for OOW complaints. SC fills 'amount collected from customer' field in Done form — this is stored as a record but NEVER included in the Microvison invoice to SC. The Microvison invoice for OOW complaints shows zero unless admin-added extras exist.

### DEV-TBP-041
- **Phase:** 8.5
- **TBP Section / File:** SC Flow v1.1 Section 4.2 — Mark as Going
- **Type:** DECISION
- **Summary:** Mark as Going is **optional** and informational only. No WhatsApp trigger, no form required. Status moves to `going`. SC can skip Going entirely and go straight to Done, Not Done, or Part Pending from `accepted`. This behaviour is already partially implemented in Phase 8 but needed explicit confirmation in the documentation.

## Phase 14 — WhatsApp Integrations (SC Flow v1.1 Triggers)

### DEV-TBP-042
- **Phase:** 14
- **TBP Section / File:** Phase 14 — WhatsApp Triggers (Full SC Flow v1.1)
- **Type:** CHANGED
- **Summary:** The original Phase 14 in TBP listed only 4 generic triggers. Per SC Flow v1.1 Section 9, the complete trigger set is: WA-01 (SC assigned), WA-02 (24h no action after assign), WA-03 (48h no action), WA-0X (repeat every 2 days), WA-04 (SC accepts — to customer), WA-04B (accepted but no action 24h), WA-05 (Not Done submitted — no action 24h), WA-06 (admin marks Part Delivered — to SC), WA-07 (Part Received but no action 24h), WA-0X variants for all recurring reminder cycles. WA-01 and WA-04 were already partially implemented (marked [x] in task.md). WA-06 depends on Phase 8.5 `markPartDelivered` controller. All WA-0X/reminder triggers require a cron scheduler.

### DEV-TBP-043
- **Phase:** 14
- **TBP Section / File:** SC Flow v1.1 Section 9 — WhatsApp Rules
- **Type:** DECISION
- **Summary:** Confirmed hard rules for what WhatsApp messages are NOT sent: (1) No WA to customer after SC acceptance. WA-04 is the ONLY customer WhatsApp message in the entire system. (2) No WA on Done, Not Done, or Part Pending submissions. (3) No WA on admin Confirm Done or bill generation. (4) No reminder to SC if admin marks Delivered but SC hasn't marked Received (admin-side delivery reminder is NOT in the spec). These exclusions are intentional per v1.1.

## Phase 15 — Timeline Snapshots & Card Details Refinements

### DEV-TBP-044
- **Phase:** 15
- **TBP Section / File:** `models/ComplaintUpdate.js` / `controllers/complaint.controller.js`
- **Type:** ADDED
- **Summary:** Added snapshot fields to `ComplaintUpdate` model (`parentUpdateId`, `partDetails`, `partDeliveredAt`, `partDeliveredNote`, `partReceivedAt`, `notDoneReason`, `scNotes`, `totalVisits`, `distanceTravelled`, `petrolAdmin`, `petrolSC`, `petrolFinal`, `extraCharges`). Refactored status transition controller endpoints (`updateStatus`, `confirmDone`, `markPartDelivered`, `markPartReceived`) to log these snapshots and link dispatch/receipt cycles back to parent request nodes.

### DEV-TBP-045
- **Phase:** 15
- **TBP Section / File:** `StatusTimeline.jsx`
- **Type:** CHANGED
- **Summary:** Refactored `StatusTimeline.jsx` to render per-node historical snapshots, bypassing live `complaint` values unless required for legacy fallback. Implemented layout refinements to conditionally render claims (e.g. only show `petrolSC` if > 0, only show final `petrolFinal`, filter closed extra charges to show only Admin actions/exceptions compared against original SC requests).

---

## Future Phases
*(Entries will be added here as each phase is built.)*
