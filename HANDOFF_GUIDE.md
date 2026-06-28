# Master Developer Handoff Guide — Microvison Service Management System

You are taking over development of the **Microvison Service Management System (SMS)**. This guide provides the complete context of the project architecture, features, documentation files, coding style, directory structures, and recent implementations (Phases 20 to 27) to catch you up instantly.

---

## 1. What This Project Is About & What We Are Building
The **Microvison SMS** is a service ticket workflow system linking:
1. **Customers & Products**: Products are tracked by a custom tracking ID (`trackingId` e.g., `PL000015`). Each product stores its warranty information, customer details, purchase date, serial number, and dealer shop name.
2. **Admins**: Manage complaint registrations, assign/reassign tickets, approve service centre requests, manage billing, and update product details.
3. **Service Centres (SCs)**: Receive assignments, accept/reject tickets, perform diagnosis, request parts, upload bills/sticker proofs, record extra charges, and track invoicing.
   * *Registered SCs*: Have portal logins, credentials, and receive automated WhatsApp notifications.
   * *Unregistered SCs*: Admin-maintained listings without logins or WhatsApp dispatches. Admins perform status updates (Accept, Going, Done, Not Done, Part Pending, Part Received) on their behalf.

---

## 2. Project Architecture & Stack

### Backend (`microvison-backend/`)
* **Core**: Node.js, Express, Mongoose (MongoDB).
* **Asset Uploads**: Cloudflare R2 (S3-compatible bucket) storing compressed images (bill photos, serial number stickers, diagnosis photos) and voice notes.
* **Notifications**: Integrated WhatsApp API dispatches (WA-01 to WA-06) triggered at key lifecycle steps.

### Frontend (`microvison-frontend/`)
* **Core**: React 19, Vite, Tailwind CSS v3 (custom theme configuration compatible with shadcn components), React Router v7.
* **Component Library**: Custom tailwind-styled components and lucide-react icons.

---

## 3. Directory Layout & Key Files

### Backend Structure (`microvison-backend/`)
* **Models (`/models`)**:
  * [Product.js](file:///e:/Projects/MV_service/Project/microvison-backend/models/Product.js): Stores customer profile, serial, shop name, and warranty tracking states.
  * [Complaint.js](file:///e:/Projects/MV_service/Project/microvison-backend/models/Complaint.js): Stores complaint details, current status, snapshot copies of product details, billing details, and petrol charges.
  * [ComplaintUpdate.js](file:///e:/Projects/MV_service/Project/microvison-backend/models/ComplaintUpdate.js): Timeline snapshots recording status changes and parameters at each step.
  * [ServiceCentre.js](file:///e:/Projects/MV_service/Project/microvison-backend/models/ServiceCentre.js): Represents registered and unregistered service centres.
  * [City.js](file:///e:/Projects/MV_service/Project/microvison-backend/models/City.js): Normalized cities master list with unique `{ name, district, state }` index.
* **Controllers (`/controllers`)**:
  * [complaint.controller.js](file:///e:/Projects/MV_service/Project/microvison-backend/controllers/complaint.controller.js): Core business logic for status shifts, updates, and closure.
  * [product.controller.js](file:///e:/Projects/MV_service/Project/microvison-backend/controllers/product.controller.js): Product registry lookup and updates.
  * [billing.controller.js](file:///e:/Projects/MV_service/Project/microvison-backend/controllers/billing.controller.js): Invoicing rollup calculations, date-range filtering, and bulk payment status updates.
* **Routes (`/routes`)**:
  * [complaint.routes.js](file:///e:/Projects/MV_service/Project/microvison-backend/routes/complaint.routes.js)
  * [product.routes.js](file:///e:/Projects/MV_service/Project/microvison-backend/routes/product.routes.js)
  * [billing.routes.js](file:///e:/Projects/MV_service/Project/microvison-backend/routes/billing.routes.js)
  * [serviceCentre.routes.js](file:///e:/Projects/MV_service/Project/microvison-backend/routes/serviceCentre.routes.js)
* **Utilities (`/utils`)**:
  * [warrantyCalculator.js](file:///e:/Projects/MV_service/Project/microvison-backend/utils/warrantyCalculator.js): Evaluates warranty rules dynamically based on bill dates and overrides.

### Frontend Structure (`microvison-frontend/`)
* **Pages (`/src/pages`)**:
  * [NewComplaint.jsx](file:///e:/Projects/MV_service/Project/microvison-frontend/src/pages/admin/NewComplaint.jsx): Five-step admin registration wizard.
  * [ActionCentre.jsx](file:///e:/Projects/MV_service/Project/microvison-frontend/src/pages/admin/ActionCentre.jsx): Admin dashboard summarizing pending approvals, unresolved disputes, and unregistered matching options.
  * [Billing.jsx](file:///e:/Projects/MV_service/Project/microvison-frontend/src/pages/admin/Billing.jsx): Admin billing panel for date ranges, bulk payments, and invoice downloads.
  * [MyComplaints.jsx](file:///e:/Projects/MV_service/Project/microvison-frontend/src/pages/sc/MyComplaints.jsx): Service Centre assignment queue.
  * [Register.jsx](file:///e:/Projects/MV_service/Project/microvison-frontend/src/pages/auth/Register.jsx): Service Centre signup form.
* **Components (`/src/components`)**:
  * **Forms**: `Step1CustomerInfo`, `Step2ProductInfo`, `Step3ProductType`, `Step4Charges`, `Step5AssignSC`.
  * **Details**: `AdminComplaintDetail` (admin detail slide-out drawer) and `SCComplaintDetail` (service centre detail slide-out drawer).
  * **Timeline**: `StatusTimeline.jsx` (draws complaint history nodes).
  * **UI**: `InlineSelect.jsx` (custom combobox) and `InlineCitySelect.jsx` (custom city combobox).

---

## 4. Key Architectural Workflows

### 4.1 3-Step Petrol Claim Locks
1. SC agent adds an estimate during accept/reject or done phases (`petrolSC`).
2. Admin approves, rejects, or adjusts the estimate inside the detail drawer (`petrolAdmin`).
3. Final value is confirmed at closing time (`petrolFinal`). Once saved, the petrol charges are locked (`petrolLocked = true`), preventing future edits.

### 4.2 Immutable Extra Charges
Extra charges requested by the SC are stored as sub-documents. Once added, they are assigned a unique database `_id` and become immutable on subsequent SC polling ticks. The Admin reviews them and marks them as `approved` or `rejected` inside their drawer.

### 4.3 Parts Sourcing Lifecycle
1. SC requests a part by marking a complaint status as `part_pending`.
2. Admin dispatches the part from the Action Centre. This saves `partDeliveredAt` and delivery notes, triggering WA-06, but does **not** change the main complaint status (which remains `part_pending` to prevent premature status shifts).
3. The SC receives the package and clicks **"Confirm Receipt of Part"** (either inside the drawer or directly on the list card). This calls `/part-received`, updating status to `part_received`, which allows the ticket to be completed.

---

## 5. Coding & UI Style Guidelines

1. **Tailwind CSS v3 Compatibility**: Always construct layouts using Tailwind CSS v3 directives. Do not upgrade to Tailwind v4 syntax as it breaks the bundler configuration.
2. **ESLint Strict Warnings**: Frontend eslint rules are strict (unused variables or imports raise build errors). Always clean up variables and run `npm run build` to verify compilation prior to completing tasks.
3. **Timeline Snapshots Rule**: When rendering cards or list logs in the `StatusTimeline.jsx` component, **always bind fields to the update timeline snapshot data** (from the `updates` array). Do not bind directly to live `complaint` properties since historical entries must preserve the state as it was at the time of update.
4. **Unconditional Registry Display**: In the customer profile, always display all 5 registry fields (Serial Number, Model Number, Shop Name, Purchase Date, Expiry Date). If a field is empty, render `—` (dash) so the admin knows the field is blank.

---

## 6. Cascading Location Dropdowns System (Unified UX)
The selection of State -> District -> City is standardized across the entire application using two custom frontend combobox inputs:
1. **`InlineSelect.jsx`**: A searchable combobox component that manages string option arrays (used for State and District). It supports typing search filters, outside-click close handlers, and custom text inputs.
2. **`InlineCitySelect.jsx`**: A searchable combobox that fetches `/api/cities`. It handles cascading constraints:
   * **Smart Fallback Search**: If State or District filters are selected, it filters cities to match. If a user searches for a city that doesn't exist in the selected state/district, the component automatically falls back to search the entire global city list.
   * **Auto-Fill Cascades**: Selecting a city from the global fallback list automatically pre-fills/updates both the State and District fields to match the selected city's state and district.
   * **Conditional Creation**: If `onCityCreated` callback prop is provided, it shows a button to create new cities inline. If the prop is omitted (such as on the public signup page), the creation button is hidden.

---

## 7. Warranty priority Rules (Warranty Calculator)
The warranty status is calculated dynamically based on 4 priority rules inside [warrantyCalculator.js](file:///e:/Projects/MV_service/Project/microvison-backend/utils/warrantyCalculator.js):
* **Rule 4 (Force Override)**: Takes precedence if `forceOverride === true`. Sets status to forced value and source to `'forced'`.
  * *Update Override*: If the admin enters a new purchase `billDate`, the forced status is automatically cleared (`forceOverride` is reset to `false`), allowing the system to recalculate based on the new date.
* **Rule 1 (Bill Date)**: Evaluates if `billDate` is present. Expiry is set to exactly 3 years from the purchase date. The status is calculated dynamically against the current date.
* **Rule 2 (Manual Selection)**: Uses manual selection status if no bill date is present.
* **Rule 3 (LED Installation)**: Falls back to `'in_warranty'` for LED installation types.
* **Default Fallback**: Out of warranty status.

---

## 8. Complete Directory of Documentation Files
All project documentation lives inside the [files/](file:///e:/Projects/MV_service/Project/files/) directory and the root directory. Here is the complete list of files and what they contain:

1. **[files/task.md](file:///e:/Projects/MV_service/Project/files/task.md)**:
   - **Type**: Markdown File
   - **Description**: The living master roadmap and checklist for the project. Check this file first to understand completed subtasks and pending items for any current phase.
2. **[files/GRD_Deviation_Log.md](file:///e:/Projects/MV_service/Project/files/GRD_Deviation_Log.md)**:
   - **Type**: Markdown File
   - **Description**: Documents all deviations from the original functional specification (GRD) requested by the user, such as custom ticket ID rules (e.g. `MV-202606-XXXXX`), warranty classifications, and status flows.
3. **[files/TBP_Deviation_Log.md](file:///e:/Projects/MV_service/Project/files/TBP_Deviation_Log.md)**:
   - **Type**: Markdown File
   - **Description**: Documents technical architecture deviations from the original Technical Build Plan (TBP). Details schema modifications, indexes, and custom controller flows.
4. **[files/Microvison_GRD_v1.1.md](file:///e:/Projects/MV_service/Project/files/Microvison_GRD_v1.1.md)** & **[Microvison_GRD_v1.1.pdf](file:///e:/Projects/MV_service/Project/files/Microvison_GRD_v1.1.pdf)**:
   - **Type**: Markdown & PDF Files
   - **Description**: The original Functional General Requirements Document (GRD). Consult this to understand the core client workflows, product groups, role definitions, and layout guides.
5. **[files/Microvison_Technical_Build_Plan_v1.1.md](file:///e:/Projects/MV_service/Project/files/Microvison_Technical_Build_Plan_v1.1.md)** & **[Microvison_Technical_Build_Plan_v1.1.pdf](file:///e:/Projects/MV_service/Project/files/Microvison_Technical_Build_Plan_v1.1.pdf)**:
   - **Type**: Markdown & PDF Files
   - **Description**: The initial technical design document, detailing DB model formats, routing URLs, folder structures, and third-party libraries planned at the start of the project.
6. **[files/Microvison_Product_Tracking_Addendum_v1.2.txt](file:///e:/Projects/MV_service/Project/files/Microvison_Product_Tracking_Addendum_v1.2.txt)** & **[Microvison_Product_Tracking_Addendum_v1.2.pdf](file:///e:/Projects/MV_service/Project/files/Microvison_Product_Tracking_Addendum_v1.2.pdf)**:
   - **Type**: Plain Text & PDF Files
   - **Description**: Specification for serial number registry tracking, auto-calculated warranties, and ticket reopening eligibility conditions.
7. **[files/Microvison_SC_Flow_v1.1.txt](file:///e:/Projects/MV_service/Project/files/Microvison_SC_Flow_v1.1.txt)** & **[files/Microvison_SC_Flow_v1.1.pdf](file:///e:/Projects/MV_service/Project/files/Microvison_SC_Flow_v1.1.pdf)**:
   - **Type**: Plain Text & PDF Files
   - **Description**: Detailed state-machine logic mapping Service Centre portal behaviors (Accept, Reject, Mark Going, Done, Part Pending, Part Received) and billing aggregates.
8. **[files/Microvison_System_Changes_v1.3.md](file:///e:/Projects/MV_service/Project/files/Microvison_System_Changes_v1.3.md)** & **[files/Microvison_System_Changes_v1.3.pdf](file:///e:/Projects/MV_service/Project/files/Microvison_System_Changes_v1.3.pdf)**:
   - **Type**: Markdown & PDF Files
   - **Description**: Specification addendum describing system updates (Change 1: Unassigned complaints queue, Change 2: Unregistered SC registry, Change 3: Step 2 Product Info layout, Change 4: Invoicing payments overhaul).
9. **[files/Microvison_Change5_Warranty_Edge_Case_v1.0.md](file:///e:/Projects/MV_service/Project/files/Microvison_Change5_Warranty_Edge_Case_v1.0.md)** & **[files/Microvison_Change5_Warranty_Edge_Case_v1.0.pdf](file:///e:/Projects/MV_service/Project/files/Microvison_Change5_Warranty_Edge_Case_v1.0.pdf)**:
   - **Type**: Markdown & PDF Files
   - **Description**: Detailed workflow for handling in-warranty edge cases (such as physical damage, unauthorized 3rd party repairs, or misuse) including the admin-only Critical Action panel, customer extra charge payment options, and future warranty revocation rules.
10. **[files/Microvison_Change6_v1.0.md](file:///e:/Projects/MV_service/Project/files/Microvison_Change6_v1.0.md)** & **[files/Microvison_Change6_v1.0.pdf](file:///e:/Projects/MV_service/Project/files/Microvison_Change6_v1.0.pdf)**:
    - **Type**: Markdown & PDF Files
    - **Description**: Comprehensive specifications mapping the out-of-warranty money flow calculations, the removal of the linked "Reopen" flow (every complaint is a new ticket), making all billing fields editable before closing, and adding the optional complaint-specific Engineer Name field.
11. **[walkthrough.md](file:///e:/Projects/MV_service/Project/walkthrough.md)**:
    - **Type**: Markdown File (Root directory)
    - **Description**: A comprehensive chronicle of all development iterations. Describes specific bug fixes, layout overrides, refactoring logic, and contains verification reports for past phases.
12. **[action_centre_research.md](file:///e:/Projects/MV_service/Project/action_centre_research.md)**:
    - **Type**: Markdown File (Root directory)
    - **Description**: Exhaustive catalog of every warning notification, list view, and pending request displayed on the Action Centres of both the Admin side and Service Centre side.

---

## 9. Recent Implementations (Phases 20 to 27)

* **Phase 20**: Built the **Unregistered SC system**. Bypasses portal log, suppresses WhatsApp notifications, and allows Admin to run workflow actions on their behalf. Includes phone-number linking flows to merge unregistered history when they register later.
* **Phase 21**: Added the **New Step 2 (Product Info)** in the wizard, separating customer details and product registries. Overhauled the warranty calculator.
* **Phase 22**: Implemented **Advanced Invoicing & Payments** with date-range filters, bulk payment status changes, and invoice rollups.
* **Phase 23**: Optimized **Mobile UI Responsiveness**, adding stacked mobile card layouts for complaints and reducing padding on drawers and timelines.
* **Phase 24**: Transitioned recommended SC matches in Step 5 to the customer's **District** (rather than City) and added a collapsible directory search panel with debounced queries.
* **Phase 25**: Replaced native HTML dropdowns and selects with **consistent combobox widgets** (`InlineSelect`, `InlineCitySelect`) on Customer Info, Step 5 modal, and registration screens.
* **Phase 26**: Synchronized `shopName`, `modelNumber`, and `serialNumber` updates back to the complaint snapshots upon save, and fixed profile renders.
* **Phase 27**: Configured forced-warranty states to reset automatically upon new `billDate` entries.
* **Phase 28**: Created a persistent, database-backed **Complaint Draft System** auto-saving admin's Wizard progress to MongoDB, allowing seamless device-switching and tab closing. Resuming pre-fills form data up to Step 5, and successful submission cleans up the draft record.
* **Phase 29**: Implemented the **Service Centre Complaints History tab** on the SC detail page. Replaced the static placeholder layout with a fully functional paginated complaints list view (supporting desktop tables, mobile card lists, and page limit adjustments) linking to the slide-over admin review drawer.
* **Phase 30**: Upgraded the **Reassignment Panel in the Complaint Detail Drawer** (`AdminComplaintDetail.jsx`). Brought it to complete feature parity with wizard Step 5 (shows recommended SC card loads, inline unregistered SC creation modal, and advanced search/filters directory).
* **Phase 31**: Added the **Admin Force Close Panel for Complaints** (`AdminComplaintDetail.jsx`). Allows the admin to close complaints directly with a custom cancel/error reason note (without generating invoices or requiring Step 2 product updates) if the SC has not yet started work.

---

## 10. Core Commands
* Run frontend development server: `npm run dev` inside `microvison-frontend/`
* Build production bundle: `npm run build` inside `microvison-frontend/`
* Run backend development server: `npm run dev` inside `microvison-backend/`
* Backend syntax validation: `node -c controllers/complaint.controller.js` inside `microvison-backend/`
