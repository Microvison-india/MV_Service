# Action Centre Features & Data Fields Reference

This document serves as a complete reference listing all information, fields, modals, buttons, and API routes displayed or executed in the **Admin Action Centre** and the **Service Centre Action Area (New Requests & Details drawer)**.

---

## 1. Admin Side — Action Centre (`ActionCentre.jsx`)

The Admin Action Centre (`/admin`) is the primary inbox for the system administrator. It aggregates all records requiring admin response or approval, sorted **newest first**. The dashboard queries the backend endpoint `GET /api/complaints/action-items`.

### 1.1 Pending SC Registrations (Registered SCs)
* **API Trigger:** approval checks from `GET /api/complaints/action-items`
* **Displayed Fields:**
  - Service Centre Business Name
  - Owner Name
  - Location (City, District)
  - Primary Phone (`phone1`)
  - Capability Badge (e.g. `LED Only`, `Cooler Only`, or `LED + Cooler` mapping `productCapability`)
  - Optional success/status message logs below card
* **Action Buttons:**
  - `🔗 Link Unregistered`: Opens a search modal to link this registration to a legacy unregistered SC.
  - `✓ Approve`: Approves the SC registration (`PATCH /api/service-centres/:id/approve`).
  - `✕ Reject`: Rejects and blocks the pending SC registration (`PATCH /api/service-centres/:id/reject`).
* **Unregistered Match Warnings (Banner):**
  - If a phone match is found with an existing unregistered SC, an amber alert banner displays:
    > 📌 An unregistered SC with phone **[phone]** already exists: **[Business Name]** ([City]). Would you like to link this registration to that record?
  - Action buttons inside match banner:
    - `Link to SC`: Opens the Unregistered Link Modal.
    - `Skip`: Approves registration directly, bypassing the match (`PATCH /api/service-centres/:id/approve`).

### 1.2 Extra Charge Requests
* **API Trigger:** complaints where SC requested extra charges, awaiting approval
* **Displayed Fields:**
  - Complaint tracking ID (e.g., `MV-xxxx`)
  - Complaint Status (e.g., `DONE` or `PART PENDING`)
  - Customer Name & Location (City)
  - Assigned Service Centre Name
  - Last updated timestamp
* **Action Buttons:**
  - `Review →`: Opens the `AdminComplaintDetail` slide-over drawer to approve, reject, or edit extra charge amounts.

### 1.3 Jobs Ready for Confirmation
* **API Trigger:** complaints marked `done` or `not_done` by the SC, awaiting final admin closure
* **Displayed Fields:**
  - Complaint tracking ID (e.g., `MV-xxxx`)
  - Complaint Status badge (`DONE` or `NOT DONE`)
  - Customer Name & Location (City)
  - Assigned Service Centre Name
  - Last updated timestamp
* **Action Buttons:**
  - `Review →`: Opens the `AdminComplaintDetail` drawer to check work proof, lock petrol, adjust billing, and confirm job closure.

### 1.4 Pending Part Sourcing & Deliveries
* **API Trigger:** complaints in `part_pending` status
* **Displayed Fields:**
  - Complaint tracking ID
  - Status badge (`PART PENDING`)
  - Customer Name & Location (City)
  - **Requested Part Sourcing Details:** Displays SC text request (e.g., "LED Backlight Strip 32-inch") in a dedicated orange alert box.
  - Assigned Service Centre Name
  - Last updated timestamp
* **Action Buttons:**
  - `Source & Dispatch →`: Opens `AdminComplaintDetail` drawer to enter courier details and mark parts as dispatched.

### 1.5 Rejected by Service Centre
* **API Trigger:** complaints rejected by the SC during assignment
* **Displayed Fields:**
  - Complaint tracking ID
  - Status badge (`REJECTED BY SC`)
  - Customer Name & Location (City)
  - Service Centre Name (which rejected the job)
  - Last updated timestamp
* **Action Buttons:**
  - `Review →`: Opens `AdminComplaintDetail` drawer to review the rejection note and reassign to a different SC.

### 1.6 Unassigned Complaints
* **API Trigger:** complaints created without an assigned SC
* **Displayed Fields:**
  - Complaint tracking ID
  - Status badge (`UNASSIGNED`)
  - Customer Name & Location (City)
  - Product Type badge (`Cooler` or `LED TV` mapping `product`)
  - Complaint Type badge (`Installation` or `Complaint` mapping `complaintType`)
  - Creation timestamp
* **Action Buttons:**
  - `Assign →`: Opens `AdminComplaintDetail` to assign a Service Centre.

### 1.7 Modals: Link to Unregistered SC Modal
* **Input Search Field:** Real-time filter text input (searches unregistered SC name, phone, city, or district).
* **Candidates List:** Scrollable list displaying unregistered candidates. Clicking a candidate selects it.
* **Modal Actions:**
  - `Cancel`: Closes modal.
  - `Confirm Link & Approve`: Approves registration and links records (`PATCH /api/service-centres/:newSCId/link-to-registered` with payload `{ unregisteredSCId }`).

---

## 2. Service Centre Side — Action Areas

Service Centre users do not have a page called "Action Centre". Instead, they manage actions through **New Requests** and **My Complaints (collapsible detail drawer)**.

### 2.1 Tab 1: New Requests Page (`NewRequests.jsx`)
This dashboard displays complaints newly assigned to the SC, querying `GET /api/complaints/my` with parameter `status = 'assigned'`.

* **Card Information Displayed:**
  - Complaint Tracking ID
  - Customer Name
  - Address (local address, city, district)
  - Status badge (`ASSIGNED`)
  - Product Type badge (`LED`, `Cooler`, or `LED + Cooler`)
  - Complaint Type badge (`installation` or `complaint`)
  - Warranty Status badge (`✅ In Warranty` or `⚠️ Out of Warranty`)
  - **Pricing Details (In-warranty only):** Displays preset pricing details (Preset Name, price amount, and estimated travel petrol allowance).
  - **Admin Remarks:** If the admin entered notes or directions, they appear in a yellow warning box.
  - **Admin Voice Note:** If uploaded, renders an inline audio playback widget.
  - **Admin Reference Photos:** Renders clickable preview thumbnails of images uploaded by the admin.
* **Action Buttons:**
  - `✓ Accept`: Opens confirmation modal to accept the job (`PATCH /api/complaints/:id/accept`).
  - `✕ Reject`: Opens rejection modal with a text input area for notes (`PATCH /api/complaints/:id/reject` with payload `{ note }`).

### 2.2 Tab 2: My Complaints — Detail Drawer (`SCComplaintDetail.jsx`)
When an SC agent clicks **"Open Details"** on any accepted job under My Complaints, a detail drawer slides out. Under the **"Conclude Complaint Action"** tab, they can submit final updates.

#### A. Global Action Form Inputs (Shared across tabs)
- **Upload Photos:** Grid image uploader supporting file selections (Max 5).
  - *Constraint:* Done requires min 1; Part Pending requires min 2; Not Done is optional.

#### B. DONE Tab Form
- **Bill Information Required (Conditional):** Displays only if bill date/photo is missing on the product.
  - Photo uploader (Max 1).
  - `Skip for now` checkbox (sets bypass flags).
- **Serial/Model Info Required (Conditional):** Displays only if serial number or model is missing on the product.
  - Photo uploader for serial sticker (Max 1).
  - `Skip for now` checkbox.
- **Amount Collected from Customer (Conditional):** Displays only if the product is Out of Warranty. Text number input (Required).
- **Visits and Distance:**
  - `Total Site Visits` input (defaults to 1).
  - `Distance Travelled (km)` input (used to verify petrol).
- **SC Petrol Claim (Conditional):** Input for claimed petrol amount (visible if product is in-warranty and petrol is not locked).
- **Extra Charges list (Conditional):** Displays list and input fields to add extra charges (visible if product is in-warranty and billing is not locked).
- **SC Notes/Remarks:** Text area for concluding remarks.
- **Voice Explanation:** Record audio widget.
- **Action Button:** `Conclude Complaint & Submit` (`PATCH /api/complaints/:id/status` with status `'done'`).

#### C. NOT DONE Tab Form
- **Reason Category:** Dropdown menu (e.g. "Customer Refused", "Product Already Repaired", "Parts Unavailable").
- **SC Notes/Remarks:** Text area describing the cancellation reason.
- **Voice Explanation:** Record audio widget.
- **Action Button:** `Submit Rejection Status` (`PATCH /api/complaints/:id/status` with status `'not_done'`).

#### D. PART PENDING Tab Form
- **Requested Part Sourcing Details:** Input text box describing required replacement components (Required).
- **SC Notes/Remarks:** Text area describing diagnostic details.
- **Voice Explanation:** Record audio widget.
- **Action Button:** `Submit Part Sourcing Request` (`PATCH /api/complaints/:id/status` with status `'part_pending'`).

#### E. Part Sourcing Receipt Confirmation
* **Context:** If the job is in `part_pending` status and the Admin has already dispatched the part, the drawer displays a blue container containing:
  - Courier Delivery Note (e.g., tracking ID, carrier).
  - Date of dispatch.
* **Action Button:**
  - `Confirm Receipt of Parts`: Clicking updates status to `part_received`, notifying the admin and allowing the SC to schedule the second customer visit (`PATCH /api/complaints/:id/part-received`).
