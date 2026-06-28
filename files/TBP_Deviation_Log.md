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

## System Changes v1.3 — Phases 19–22

> Source document: `files/Microvison_System_Changes_v1.3.md`
> These entries document every technical deviation from TBP v1.1 introduced by the four new v1.3 features. They specify exact file changes, new fields, new controllers, and new frontend components.

---

## Phase 19 — Skip SC Assignment + Advanced Search (v1.3 Change 1)

### DEV-TBP-046
- **Phase:** 19
- **TBP Section / File:** `models/Complaint.js` — status enum
- **Type:** CHANGED
- **Summary:** The Complaint model status enum gains a new first value: `unassigned`. Position in enum: before `assigned`. This is the initial status when a complaint is created without an SC. The status transitions: `unassigned` → `assigned` → existing flow. All other status values are unchanged. The existing `new` status may now be retired (it was never a real lifecycle state in the current implementation — `assigned` was effectively the initial status post-Phase 7A). Verify usages of `status: 'new'` across controllers and clean up.

### DEV-TBP-047
- **Phase:** 19
- **TBP Section / File:** `controllers/complaint.controller.js` — `createComplaint`, `assignComplaint`, `getActionItems`
- **Type:** CHANGED
- **Summary:** Three controller handlers are updated:
  1. **`createComplaint`:** If no `assignedCentreId` in request body, set `status = 'unassigned'`, skip the assign step and skip WA-01. All other fields are saved normally. This is a zero-footprint change to the happy path — existing creates with an SC ID are unaffected.
  2. **`assignComplaint`:** Now accepts complaints in both `unassigned` AND `new` status (previously only `new`). When called for an `unassigned` complaint, sets `status = 'assigned'`, sets `assignedCentreId`, `assignedAt`, logs a ComplaintUpdate, and fires WA-01 (same as any assignment).
  3. **`getActionItems`:** New `unassigned` section added — counts and returns complaints with `status = 'unassigned'` for the admin Action Centre "Unassigned Complaints" card.

### DEV-TBP-048
- **Phase:** 19
- **TBP Section / File:** `controllers/complaint.controller.js` — `getAll` (unified search + filter expansion)
- **Type:** CHANGED
- **Summary:** `getAll` is updated to support:
  1. **Unified search via `q=` param:** Builds a MongoDB `$or` clause searching `customerName` (regex, case-insensitive), `phone1`, `phone2`, `complaintId` (loose alphanumeric regex), plus populated `serialNumber` and `trackingId` from the linked `Product` record (via a `$lookup` or populate, with `$match` on the `$or`).
  2. **Multi-status via comma-separated `status=`:** Parses `status=done,not_done` → `{ status: { $in: ['done', 'not_done'] } }`. The existing single-value status filter is updated to handle comma-split arrays.
  3. **New filter params added:** `state=` (matches `state` field on complaint or linked product), `scCapability=` (filters complaints where linked SC's `productCapability` matches), `reopenedOnly=true` → `{ isReopened: true }`, `originalOnly=true` → `{ isReopened: { $ne: true } }`.
  4. All other existing params (`product=`, `complaintType=`, `warrantyStatus=`, `assignedCentreId=`, `serialNumber=`, `trackingId=`, `dateFrom=`, `dateTo=`) are retained.

### DEV-TBP-049
- **Phase:** 19
- **TBP Section / File:** `components/forms/Step4AssignSC.jsx` → becomes `Step5AssignSC.jsx` after Phase 21
- **Type:** CHANGED
- **Summary:** A "Skip — Assign Later" button is added as a second call-to-action at the bottom of the SC Assignment step. It is styled as a secondary/outline button with a helper note: "You can assign an SC from the complaint detail view later." Clicking it sets `selectedSCId = null` in wizard state and calls the wizard's submit function with no SC data. The wizard submit in `NewComplaint.jsx` handles this by calling only `POST /complaints` (no subsequent `PATCH /:id/assign`).

### DEV-TBP-050
- **Phase:** 19
- **TBP Section / File:** `components/filters/ComplaintFilters.jsx` — full rebuild
- **Type:** CHANGED
- **Summary:** The filter bar component is rebuilt from scratch to support the new unified search and expanded filters. Key implementation details:
  - A single `<input>` search field at the top maps to `q=` param with a 300ms `useDebounce` hook. The old separate `serialNumber=` and `trackingId=` inputs are removed (subsumed by `q=`).
  - Status filter changes from a plain `<select>` to a custom multi-select dropdown (checkboxes in a popover). Selected statuses are joined as comma-separated string.
  - Date range: Shadcn date pickers or HTML `<input type="date">` for From/To. Quick shortcuts (`Today`, `Yesterday`, `Last 7 days`, `Last 30 days`, `Custom`) are rendered as pill buttons that programmatically set the date values.
  - State → District → City: 3-way cascading selects (same client-side filtering approach as forms, sourced from a single `GET /cities` call).
  - `assignedCentreId=`: new SC dropdown populated from `GET /service-centres?includeUnregistered=true`.
  - `scCapability=`: new single select.
  - `reopenedOnly=`: new single select `All / Reopened Only / Original Only`.
  - Active filter count badge shown on the Show/Hide Filters toggle button.
  - Reset All button clears all state to defaults and re-fetches.
  - `hooks/useComplaints.js` updated to pass all new params and serialize multi-status as comma-joined string.

---

## Phase 20 — Unregistered SC System (v1.3 Change 2)

### DEV-TBP-051
- **Phase:** 20
- **TBP Section / File:** `models/ServiceCentre.js` — new fields
- **Type:** CHANGED
- **Summary:** Four new fields added to the `ServiceCentre` model:
  - `isUnregistered` (Boolean, default: `false`) — set to `true` on admin-created unregistered SC records.
  - `linkedRegisteredSCId` (ObjectId ref: ServiceCentre, optional) — set when an unregistered SC is linked to a newly registered account.
  - `archivedAt` (Date, optional) — timestamp of archival after upgrade.
  - `isArchived` (Boolean, default: `false`) — hides the record from active SC lists after upgrade.
  - Unregistered SCs always have `status: 'active'` and `userId: null`. They skip the approval flow entirely.

### DEV-TBP-052
- **Phase:** 20
- **TBP Section / File:** `controllers/serviceCentre.controller.js` — 3 new/modified handlers
- **Type:** CHANGED + ADDED
- **Summary:**
  1. **`createUnregistered` (NEW):** Accepts `businessName`, `phone1`, `phone2` (optional), `city`, `district` (optional — auto-resolved from city), `fullAddress` (optional), `productCapability` (optional, default: `both`). Creates a `ServiceCentre` document with `isUnregistered: true`, `status: 'active'`, `userId: null`. Does NOT create a `User` record. If the city does not exist in the `cities` collection, calls `createCity` logic inline. Returns the new SC `_id` immediately.
  2. **`getAll` (MODIFIED):** Added `isUnregistered=true/false` query param filter. If omitted, returns both registered and unregistered. Ensures unregistered SCs are populated correctly in all SC list queries (including the billing dashboard SC dropdown and the Step 5 SC picker).
  3. **`linkToRegistered` (NEW):** Accepts `unregisteredSCId` and `newRegisteredSCId`. Bulk-updates all `Complaint` records where `assignedCentreId === unregisteredSCId` → sets `assignedCentreId = newRegisteredSCId`. Sets `unregisteredSC.isArchived = true`, `archivedAt = now`, `linkedRegisteredSCId = newRegisteredSCId`. Does NOT delete the old unregistered record. Old record remains as read-only audit.

### DEV-TBP-053
- **Phase:** 20
- **TBP Section / File:** `routes/serviceCentre.routes.js` + `controllers/city.controller.js` + `routes/city.routes.js`
- **Type:** ADDED
- **Summary:** New routes:
  - `POST /api/service-centres/unregistered` → `createUnregistered` (admin only, auth + rbac('admin'))
  - `PATCH /api/service-centres/:id/link-to-registered` → `linkToRegistered` (admin only)
  - `POST /api/cities` → `createCity` (admin only): accepts `city`, `district`, `state`; checks for case-insensitive duplicate before creating; returns new or existing record.

### DEV-TBP-054
- **Phase:** 20
- **TBP Section / File:** `controllers/complaint.controller.js` — WhatsApp suppression for unregistered SCs
- **Type:** CHANGED
- **Summary:** A helper function `isUnregisteredSC(complaint)` (or inline check) is added to the complaint controller. It checks `complaint.assignedCentre?.isUnregistered === true`. This check is run in `assignComplaint`, `updateStatus`, `markGoing`, `accept`, `markPartDelivered`, and `markPartReceived`. If `true`: all SC-directed WhatsApp triggers (WA-01, WA-02, WA-03, WA-04B, WA-05, WA-06, WA-07, WA-0X) are suppressed. WA-04 to the customer (on SC acceptance) still fires regardless. The ComplaintUpdate log entry for assignment to an unregistered SC includes the note: "Assigned to Unregistered SC — WA-01 not sent. Admin to contact SC manually."

### DEV-TBP-055
- **Phase:** 20
- **TBP Section / File:** `components/forms/Step4AssignSC.jsx` (Step5 after Phase 21) + `pages/admin/ActionCentre.jsx` + `pages/admin/ServiceCentres.jsx` + `components/complaint/AdminComplaintDetail.jsx`
- **Type:** CHANGED + ADDED
- **Summary:** Frontend changes across 4 files:
  1. **`Step4AssignSC.jsx`:** Add `+ Create Unregistered SC` button below the SC list. Opens an inline `<dialog>` or slide-in form with the minimal SC fields. On submit, calls `POST /api/service-centres/unregistered` → sets returned `_id` as `selectedSCId`. SC list cards gain an amber `UNREGISTERED` badge for `isUnregistered: true` SCs.
  2. **All city dropdowns (Step4AssignSC form, complaint Step1, SC registration):** Enhanced with an "inline create" option — when typed text doesn't match any city, show `'Create "[typed name]" as new city'` option. Clicking opens a small form for city/district/state. On save: `POST /api/cities` → select new city.
  3. **`AdminComplaintDetail.jsx`:** Shows `UNREGISTERED SC` amber badge in the Assigned SC header. A persistent banner in the action panel warns admin: "This complaint is assigned to an Unregistered SC. All status updates must be made manually." Unlocks all SC-only action buttons (Going, Done, Not Done, Part Pending, Mark Received) for the admin when the SC is unregistered.
  4. **`ServiceCentres.jsx`:** New filter dropdown `Registration Type: All / Registered / Unregistered` maps to `isUnregistered=` param. `UNREGISTERED` badge on cards/rows.
  5. **`ActionCentre.jsx`:** Upgrade linking flow in the Pending Registrations section — phone-match suggestion banner + manual unregistered SC search/picker. `PATCH /:id/link-to-registered` called on confirm.

---

## Phase 21 — New Step 2 (Product Info) + Warranty Overhaul (v1.3 Change 3)

### DEV-TBP-056
- **Phase:** 21
- **TBP Section / File:** `models/Product.js` — new fields
- **Type:** CHANGED
- **Summary:** Four new fields added to the `Product` model:
  - `shopName` (String, optional) — shop/dealer name where product was purchased.
  - `modelNumber` (String, optional) — product model/variant identifier (e.g. "CL-50W", "LS-18" etc.).
  - `warrantyForceReason` (String, optional) — stores the admin's reason text when a force override is applied.
  - `missingFieldsWarning` (Array of String, default: `[]`) — accumulates names of Step 2 fields that were bypassed by the admin at closing without being filled. e.g. `['billDate', 'billPhoto']`. A non-empty array means the product has the persistent warning indicator active.

### DEV-TBP-057
- **Phase:** 21
- **TBP Section / File:** `models/Complaint.js` — new snapshot fields
- **Type:** CHANGED
- **Summary:** Seven new snapshot fields added to the `Complaint` model:
  - `shopName` (String, optional) — snapshot of Product's shopName at complaint creation time.
  - `modelNumber` (String, optional) — snapshot of Product's modelNumber at complaint creation time.
  - `locationText` (String, optional) — Maps link or navigation text from Step 1. Stored on Complaint (not Product). Sent in WA-01.
  - `warrantyForceReason` (String, optional) — snapshot of force override reason at complaint creation. Admin-only visibility.
  - `scBillPhotoUrl` (String, optional) — URL of bill photo uploaded by SC in their Done form. Stored on Complaint, not overwriting Product.billPhoto directly (controller writes it to Product separately after admin review).
  - `scSerialSlipPhotoUrl` (String, optional) — URL of serial/model sticker photo uploaded by SC in Done form. Stored on Complaint only — admin manually transcribes.
  - `missingFieldsBypassed` (Array of String, default: `[]`) — list of Step 2 field names explicitly bypassed by admin at Confirm Done time.

### DEV-TBP-058
- **Phase:** 21
- **TBP Section / File:** `utils/warrantyCalculator.js` — COMPLETE REWRITE
- **Type:** CHANGED (Supersedes DEV-TBP-022)
- **Summary:** The existing `warrantyCalculator.js` (from Phase 7C / Addendum v1.2) is completely rewritten to implement the 4-rule priority system from v1.3 Change 3G. New function signature: `calculateWarranty({ billDate, complaintType, manualSelection, manualReason, forceOverride, forceValue, forceReason })`. Returns `{ warrantyStatus, warrantyExpiryDate, warrantySource, warrantyForceReason }`.
  - **Rule 1 (Bill Date present, no force override):** Computes `warrantyExpiryDate = new Date(billDate); warrantyExpiryDate.setFullYear(warrantyExpiryDate.getFullYear() + 3)`. Status: `today <= warrantyExpiryDate ? 'in_warranty' : 'out_of_warranty'`. Source: `'auto_calculated'`. Force reason: `null`. Re-evaluated fresh at every call — a product that was in warranty 3 years ago is now correctly out of warranty.
  - **Rule 2 (No Bill Date, manual):** Takes `manualSelection` and `manualReason` (required). Source: `'manual'`. No expiry date.
  - **Rule 3 (LED Installation default):** `warrantyStatus = 'in_warranty'`. Source: `'manual'`. No expiry.
  - **Rule 4 (Force Override, highest priority if `forceOverride: true`):** Sets `warrantyStatus = forceValue`, source: `'forced'`, `warrantyForceReason = forceReason`. `warrantyExpiryDate = null` (force reason overrides any calculation).

### DEV-TBP-059
- **Phase:** 21
- **TBP Section / File:** NEW FILE `components/forms/Step2ProductInfo.jsx` + updates to `NewComplaint.jsx`, `Step1CustomerInfo.jsx`, `Step2ProductType.jsx`→`Step3ProductType.jsx`
- **Type:** ADDED + CHANGED
- **Summary:**
  1. **NEW: `components/forms/Step2ProductInfo.jsx`** — 5-field optional form (Bill Date picker, Bill Photo `ImageUploader`, Shop Name text, Serial Number text, Model Number text). Pre-fills from linked Product record (if Step 1 linked a product). Editing a pre-filled value shows inline change-warning: "Previously saved as [X]. You are changing it to [Y]. [Keep New] / [Revert]". Warranty preview card shown at bottom — live-updates as bill date is entered. If bill date is blank: shows manual In/Out Warranty radio + required reason text. Force Override button always available.
  2. **MODIFIED: `components/forms/Step1CustomerInfo.jsx`** — New `Location / Action Text` `<textarea>` field added below the address section. Stored in `formData.locationText`.
  3. **MODIFIED: `Step2ProductType.jsx` (renamed to `Step3ProductType.jsx`)** — Warranty section REMOVED entirely. This step now only renders product type (LED/Cooler) selection and complaint type (Installation/Complaint) selection. All warranty logic has moved to the new Step 2.
  4. **MODIFIED: `pages/admin/NewComplaint.jsx`** — Step wizard updated to 5 steps. Step component map updated: `currentStep === 2` → `<Step2ProductInfo>`, `=== 3` → `<Step3ProductType>`, `=== 4` → `<Step4Charges>`, `=== 5` → `<Step5AssignSC>`. `formData` shape updated to include all new Step 2 fields. On final submit, new fields passed to `POST /complaints`.

### DEV-TBP-060
- **Phase:** 21
- **TBP Section / File:** `controllers/complaint.controller.js` (`createComplaint`, `confirmDone`, `updateStatus`) + `controllers/product.controller.js`
- **Type:** CHANGED
- **Summary:** Controller updates for Step 2 data flow:
  1. **`createComplaint`:** Accepts new fields from request body: `shopName`, `modelNumber`, `locationText`, `warrantyForceReason`, `forceOverride`, `forceValue`, `forceReason`, `manualSelection`, `manualReason`. Calls the rewritten `warrantyCalculator` with all relevant inputs. Snapshots `shopName`, `modelNumber`, `locationText`, `warrantyForceReason` onto the Complaint document. Writes `shopName`, `modelNumber` back to the linked Product record.
  2. **`confirmDone`:** Before closing, checks `Product` for missing fields in `['billDate', 'billPhoto', 'shopName', 'serialNumber', 'modelNumber']`. If missing and `missingFieldsBypassed` array is NOT in request body: returns HTTP 422 with `{ missingFields: [...] }` for the frontend to show the warning dialog. If `missingFieldsBypassed` is provided: saves bypassed field names to `complaint.missingFieldsBypassed[]` AND appends them to `product.missingFieldsWarning[]` (concat, deduplicate). Proceeds to close normally.
  3. **`updateStatus` (SC Done path):** When SC submits Done status: if request includes `scBillPhotoUrl`, saves to `complaint.scBillPhotoUrl` AND updates `product.billPhoto` with that URL, then re-runs `warrantyCalculator` on the Product record. If request includes `scSerialSlipPhotoUrl`, saves to `complaint.scSerialSlipPhotoUrl` only (no auto-transcription).
  4. **`product.controller.js` — `updateProduct`:** Updated to accept and save `shopName`, `modelNumber`, `warrantyForceReason`, `missingFieldsWarning`. After any update, re-runs `warrantyCalculator` using the latest Product `billDate` (if present) to keep the Product record's warranty fresh.

---

## Phase 22 — Advanced Billing Filters + Mark as Paid (v1.3 Change 4)

### DEV-TBP-061
- **Phase:** 22
- **TBP Section / File:** `models/Complaint.js` — new payment fields
- **Type:** CHANGED
- **Summary:** Three new fields added to the `Complaint` model for payment tracking (relevant only when `billGenerated = true`):
  - `paymentStatus` (String enum: `'unpaid'` / `'paid'`, default: `'unpaid'`) — tracks payment state of the generated bill.
  - `paidAt` (Date, optional, default: `null`) — timestamp of when the bill was last marked paid. Cleared to `null` on unpaid reversal.
  - `paidBy` (ObjectId ref: User, optional, default: `null`) — admin user who last marked the bill paid. Cleared to `null` on unpaid reversal.

### DEV-TBP-062
- **Phase:** 22
- **TBP Section / File:** `controllers/billing.controller.js` — 3 handler updates + 1 new handler
- **Type:** CHANGED + ADDED
- **Summary:**
  1. **`getComplaintBills` (CHANGED):** `month=` and `year=` params replaced with `dateFrom=` (ISO date string) and `dateTo=` (ISO date string). Default when not provided: `dateFrom = first day of current month`, `dateTo = today`. Added `paymentStatus=paid/unpaid` filter param. `paymentStatus`, `paidAt`, `paidBy` now included in each returned bill object. Unregistered SCs included in SC lookups.
  2. **`getMonthlyInvoice` (CHANGED):** Updated to use `dateFrom`/`dateTo` range instead of `month`/`year`. Returns `paymentStatus` and `paidAt` per invoice.
  3. **`getRunningTotals` (ADDED or included in `getComplaintBills`):** Returns `{ totalAll: Number, totalUnpaid: Number }` — aggregated sums using MongoDB `$group` over the same filter set as `getComplaintBills`. Calculated server-side for accuracy with large datasets.
  4. **`markAsPaid` (NEW handler):** Accepts `{ complaintIds: [ObjectId], markAs: 'paid' | 'unpaid' }`. Validates all IDs have `billGenerated = true`. Bulk-updates: if `paid` → `{ paymentStatus: 'paid', paidAt: Date.now(), paidBy: req.user._id }`. If `unpaid` → `{ paymentStatus: 'unpaid', paidAt: null, paidBy: null }`. Returns `{ updated: N }`.

### DEV-TBP-063
- **Phase:** 22
- **TBP Section / File:** `routes/billing.routes.js`
- **Type:** CHANGED
- **Summary:** New route added:
  - `PATCH /api/billing/mark-paid` → `markAsPaid` (admin only, auth + rbac('admin'))
  - `GET /api/billing/complaints` — updated to accept `dateFrom=`/`dateTo=`/`paymentStatus=` params (replacing `month=`/`year=`)
  - `GET /api/billing/invoice/:scId` — updated to accept `dateFrom=`/`dateTo=` params

### DEV-TBP-064
- **Phase:** 22
- **TBP Section / File:** `pages/admin/Billing.jsx` + `components/billing/BillingTable.jsx` + `components/billing/MonthlyInvoice.jsx` + `hooks/useBilling.js`
- **Type:** CHANGED
- **Summary:** Full billing UI rebuild across 4 files:
  1. **`Billing.jsx`:** Month+Year dropdowns replaced with From/To date pickers + quick shortcuts (`This Month`, `Last Month`, `Last 7 Days`, `Last 30 Days`, `Custom` pill buttons). Payment Status filter added (`All / Paid Only / Unpaid Only`). SC dropdown includes unregistered SCs with `[UNREGISTERED]` tag. Reset Filters button added.
  2. **`BillingTable.jsx`:** Full rebuild with:
     - Checkbox column (leftmost, selectable only for `billGenerated = true` rows).
     - New `Payment Status` column: `PAID` (green badge) or `UNPAID` (amber badge).
     - New `Paid On` column: formatted `paidAt` timestamp or `—`.
     - Floating action bar (appears when ≥1 checkbox selected): "X bills selected" + `[Mark Selected as Paid]` + `[Mark Selected as Unpaid]`.
     - "Mark All as Paid ([N] unpaid)" button above table — marks ALL unpaid in current full filtered result (not just visible page).
     - Reversal confirmation dialog before any "unpaid" action.
     - Running totals section below table: two summary cards `Total Billed: ₹[totalAll]` and `Unpaid Total: ₹[totalUnpaid]`. Both update on filter changes.
  3. **`MonthlyInvoice.jsx`:** Added payment summary line: "Paid: ₹[X] | Unpaid: ₹[Y]". Card badge: `FULLY PAID` (green) / `PARTIAL` (amber) / `UNPAID` (red) based on payment ratios.
  4. **`hooks/useBilling.js`:** Updated to pass `dateFrom`, `dateTo`, `paymentStatus` params. Removed `month` and `year`. New `markAsPaid(ids, markAs)` function calling `PATCH /api/billing/mark-paid`. Running totals fetched alongside bill data.

### DEV-TBP-065
- **Phase:** 22
- **TBP Section / File:** `components/complaint/AdminComplaintDetail.jsx` — Confirm Done flow
- **Type:** CHANGED
- **Summary:** The Confirm Done dialog gains an optional "Mark as Paid immediately" checkbox. If checked at closing time: after `confirmDone` returns success, immediately calls `PATCH /api/billing/mark-paid` with the new complaint `_id` and `markAs: 'paid'`. The checkbox is unchecked by default — default behavior is `paymentStatus: 'unpaid'` on bill generation. This allows the admin to mark payment in one action without visiting the Billing Dashboard.

### DEV-TBP-066
- **Phase:** 22
- **TBP Section / File:** `pages/sc/SCBilling.jsx`
- **Type:** CHANGED
- **Summary:** SC Billing page filter updated: Month/Year dropdowns replaced with From/To date pickers (same UI as admin billing but scoped to the SC's own data). The SC billing view shows `paymentStatus` and `paidAt` as **read-only** columns — SC can see which bills Microvison has marked as paid, but cannot modify payment status themselves. No `[Mark as Paid]` controls appear on the SC's billing page.

---

## Phase 28 — Complaint Draft System

### DEV-TBP-067
- **Phase:** 28
- **TBP Section / File:** NEW FILE `models/ComplaintDraft.js` + NEW FILE `controllers/draft.controller.js`
- **Type:** ADDED
- **Summary:** Added the backend schema and controllers for handling saved draft sessions.
  1. **`models/ComplaintDraft.js`**: Schema contains `createdBy` (ObjectId ref to User), `currentStep` (Number, default 1), and `formData` (Schema.Types.Mixed) to hold all dynamic wizard state fields. Added `timestamps: true` for sorting.
  2. **`controllers/draft.controller.js`**: Handler methods:
     - `getDrafts`: Retrieves all incomplete drafts created by the current admin user (sorted by `updatedAt` descending).
     - `getDraft`: Fetches a single draft by ID.
     - `saveDraft`: Upserts a draft (creates new if no `draftId` provided, otherwise updates existing) for the current user.
     - `deleteDraft`: Removes draft by ID.

### DEV-TBP-068
- **Phase:** 28
- **TBP Section / File:** `routes/complaint.routes.js`
- **Type:** ADDED
- **Summary:** Registered endpoints for draft operations under `/api/complaints/drafts` and `/api/complaints/drafts/:id`. These are registered before the generic parameterized `/:id` (which resolves `getComplaintById`) to avoid endpoint collision. All draft operations are restricted to `auth` and `isAdmin`.

### DEV-TBP-069
- **Phase:** 28
- **TBP Section / File:** `pages/admin/NewComplaint.jsx`
- **Type:** CHANGED
- **Summary:** Integrates auto-saving and draft recovery in the complaint wizard UI:
  - Fetches incomplete drafts on mount (unless prefilled from page route state).
  - Displays draft selector list showing customer info, product, saved step, and last updated time. Allows user to Resume, Delete, or Start Fresh.
  - Implemented 2-second debounced autosave hook which calls `POST /api/complaints/drafts` after any `formData` changes, using a `resuming` state guard to block saves during initial state loading.
  - Cleans up and deletes draft record from MongoDB upon successful submission of the complaint.

---

## Future Phases
*(Entries will be added here as each phase is built.)*
