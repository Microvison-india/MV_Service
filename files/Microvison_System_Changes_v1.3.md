# MICROVISON
## System Changes & Additions
### Living Document v1.3 — New changes added here as discussed. Each change is self-contained.

---

## Overview of Changes
- **Change 1:** Skip SC + Search
- **Change 2:** Unregistered SC
- **Change 3:** New Step 2 + Warranty
- **Change 4:** Billing Filters + Paid System

---

## Change 1 — Skip SC Assignment + Advanced Complaint Search
Two related improvements to the complaint registration and search experience.

### 1A. Skip SC Assignment on Step 4
Step 4 of the complaint registration form previously required admin to assign a Service Centre before submitting. Assignment is now optional.

#### What changes
- **Two Paths on Step 4:** The form now has two paths: `Assign SC` (existing flow, unchanged) OR `Skip — Assign Later`.
- **If Skip is clicked:** The complaint is created with the status `unassigned`. No SC is linked. No WhatsApp is sent.
- **Visual Badge:** The complaint appears in the *All Complaints* view with a clear `Unassigned` badge.
- **Later Assignment:** Admin can open the complaint later and assign a Service Centre from the detail view. This uses the same SC picker and capability filtering as Step 4.
- **Workflow Resume:** Once assigned from the detail view, the status moves to `assigned`, the `WA-01` WhatsApp message fires to the SC immediately, and the normal flow resumes.

#### Status addition
- `unassigned` is a new valid status before `assigned` in the lifecycle. The complaint exists but has no SC yet.
- **Action Centre Update:** The Admin Action Centre displays unassigned complaints in a dedicated section with an `Assign` button.
- **Exclusion:** No WhatsApp messages or automated reminders fire for `unassigned` complaints. The admin handles these manually.

> [!NOTE]
> `unassigned` → `assigned` transition happens when the admin assigns from the detail view. From `assigned` onwards, the flow is identical to the normal lifecycle.

---

### 1B. Advanced Complaint Search — Unified Top Bar + Multi-Filter

#### Top Search Bar — 5 Fields Simultaneously
The main search input searches all 5 fields at once with a single query. The admin types a query, and the system checks all 5 and returns matches:

| Field | Matches Against |
| :--- | :--- |
| **Customer Name** | `customerName` (partial, case-insensitive) |
| **Phone Number** | `phone1` OR `phone2` (partial match) |
| **Complaint ID** | `complaintId` (partial match) |
| **Serial Number** | `serialNumber` on the linked Product record |
| **Product ID** | `productId` (or `trackingId`) on the linked Product record |

- **Debounced Search:** Results update dynamically as the admin types (debounced — fires after a 300ms pause).
- No need to select or know which field the query belongs to — just type and search.

#### Expanded Filters — All Combinable Simultaneously
All filters work together using **AND** logic (results must match every active filter). Filters available:

| Filter | Type | Options |
| :--- | :--- | :--- |
| **Status** | Multi-select | `unassigned` / `assigned` / `accepted` / `going` / `done` / `not_done` / `part_pending` / `closed` / `rejected_by_sc`. Multiple statuses can be selected at once. |
| **Product** | Single select | `All` / `LED` / `Cooler` |
| **Complaint Type** | Single select | `All` / `Installation` / `Complaint` |
| **Warranty** | Single select | `All` / `In Warranty` / `Out of Warranty` |
| **State → District → City** | Cascading selects | State filters districts, district filters cities |
| **Assigned SC** | Single select | All registered + unregistered SCs |
| **SC Capability** | Single select | `All` / `LED Only` / `Cooler Only` / `Both` |
| **Tracking ID** | Text input | Partial `PT-XXXXXX` (or `PL`/`PC`) match |
| **Serial Number** | Text input | Partial serial number match |
| **Reopen Status** | Single select | `All` / `Reopened Only` / `Original Only` |
| **Date Range** | Date pickers + shortcuts | `Today` / `Yesterday` / `Last 7 days` / `Last 30 days` / `Custom From→To` |

- **Reset Button:** Clears all filters and search parameters at once.
- **Active Filter Indicator:** The active filter count is shown on the *Hide/Show Filters* toggle button.
- **Example:** Searching `'9876'` in the top bar + setting `Status = done` + `District = Jodhpur` + `Date = Yesterday` will return all complaints matching that phone fragment in Jodhpur that were marked done yesterday.

---

## Change 2 — Unregistered (Admin-Maintained) SC
Sometimes a complaint comes from a location where no registered SC exists. The admin can now create and assign an **Unregistered SC** on the spot, maintain its details fully, and optionally upgrade it to a full registered account later. All history is preserved.

### 2A. Creating an Unregistered SC
During Step 5 (previously Step 4) of complaint registration, or when assigning from the complaint detail view, a new option appears alongside the normal SC list:
`+ Assign to New Unregistered SC (not in system)`

The admin fills a minimal form:

| Field | Required? | Notes |
| :--- | :--- | :--- |
| **Name / Business Name** | Yes | |
| **Phone Number 1** | Yes | |
| **Phone Number 2** | No | |
| **City** | Yes | Selected from the master city list (or created on the spot — see Section 2D) |
| **District** | Yes | Auto-filled from city |
| **Full Address** | No | |

- **Unregistered Flag:** A new SC record is created with `isUnregistered: true`.
- **System ID:** The record gets a system-assigned SC ID just like a normal registered SC.
- **Assignment:** The complaint is immediately assigned to this unregistered SC.
- **UI Badge:** An `UNREGISTERED SC` badge appears everywhere this SC or their complaints are shown.
- **No Credentials:** No login credentials are created. The admin contacts them manually outside the app.

### 2B. WhatsApp Behaviour for Unregistered SC Complaints
- **WA-04 to Customer STILL fires:** Sent to the customer immediately on assignment so they know their complaint is assigned and who to contact.
- **Content of WA-04:** Complaint ID, Product type, Complaint type, SC name, SC phone number, and acknowledgment message. (Identical to registered SC assignment).
- **All SC WhatsApp Messages Blocked:** SC-directed messages (such as `WA-01` assignment notification, `WA-02`/`WA-03` reminders, part delivery `WA-06`, or post-received `WA-07`) do **not** fire. The admin handles SC communication manually.

> [!NOTE]
> The customer sees no difference between a registered and unregistered SC assignment. The distinction is purely internal.

### 2C. Admin Maintains All Updates for Unregistered SC Complaints
- Steps 1, 2, and 3 of complaint registration remain identical (customer info, product info, charges, media).
- After assignment, the admin manually contacts the unregistered SC in real life.
- **On SC's behalf:** The admin updates all complaint statuses in the system: `Going`, `Done`, `Not Done`, `Part Pending`.
- **Forms on SC's behalf:** The admin fills all related forms (e.g., Done form with photos, notes, petrol, extras) based on information received from the SC.
- **Timeline & Billing:** Product tracking, complaint timeline, and billing logic work identically to normal complaints.
- **No Reminders:** No automated reminder cycles fire. The admin is solely responsible for manual follow-up.

> [!IMPORTANT]
> The `UNREGISTERED SC` badge on the complaint details signals to the admin that manual follow-up is required at every stage.

### 2D. New State, District, or City — Admin Can Create on the Spot
If an unregistered SC (or any SC registration) is from a location not in the master city list, the admin can create it immediately from any city/district/state field in the system:
- **New State:** Created if the state does not exist yet (e.g., Haryana, Gujarat before formal seeding).
- **New District:** Created if the state exists but the district does not.
- **New City:** Created if the state and district exist but the city does not.
- **Inline Prompt:** When typing an unlisted name in a city field, a `'Create new'` option appears inline.
- **Creation Form:** The admin fills: city name, district name, state name — saved to the `cities` collection immediately.
- **Instant Availability:** The new location is instantly available across all dropdowns, filters, and search fields system-wide.
- **Supported Fields:** This works from the Unregistered SC creation form, SC registration approval screen, and anywhere else the admin enters a city.

### 2E. Unregistered SCs Are Searchable and Reusable
- All unregistered SC records appear in the *Service Centres* tab with an `UNREGISTERED` badge.
- **Filterable:** The admin can filter the SC list to show "Unregistered only".
- **Searchable:** Searchable by name, phone, city, district — same as registered SCs.
- **Reusability:** When assigning a future complaint in the same area, the admin can select an existing unregistered SC from the list instead of creating a new one.
- **History:** Full complaint history and billing history are maintained under each unregistered SC record.

### 2F. Upgrading Unregistered SC to Registered SC
When an unregistered SC decides to formally join the platform:

#### Step 1 — SC submits normal registration
- The SC uses the public registration page and fills out the full SC form as normal.
- Their request appears in the admin Action Centre as a pending SC registration.

#### Step 2 — Admin links during approval
- The system checks for phone number matches as a suggestion (hint only, not a hard requirement).
- Even if phone numbers do not match, the admin can manually search all unregistered SC records by name, city, district, or address and select the correct one.
- The admin confirms the link manually. No phone match is required — admin judgment is sufficient.

#### Step 3 — On linking: all history preserved exactly as-is
- All complaints, timeline entries, admin-filled forms, photos, notes, billing records, and product tracking links transfer to the new registered SC account.
- **Timeline Audit Trail:** Old `UNREGISTERED SC` badges and admin-maintained markers remain in the complaint timeline as audit history — a clear record of who did what and when.
- The `isUnregistered` flag is removed, and the `UNREGISTERED` badge disappears from all active views.
- The SC now follows the full normal registered flow: portal access, WhatsApp notifications, SC-side form submissions, and reminder cycles.
- The old unregistered SC record is archived (not deleted) for audit purposes.

> [!NOTE]
> If the admin dismisses the link and approves without linking: a separate registered SC account is created with no connection to the old unregistered record. The old record and its history remain as-is.

---

## Change 3 — New Step 2: Product Info + Warranty Overhaul
A new Step 2 is inserted into the complaint registration form. The previous steps shift accordingly.

**New complaint form step order:**
1. Step 1 — Customer Info
2. **Step 2 — Product Info (NEW)**
3. Step 3 — Product & Type
4. Step 4 — Charges & Media
5. Step 5 — SC Assignment

### 3A. New Step 2 — Product Info Fields
All 5 fields are optional but recommended. Admin should fill as many as possible for long-term product tracking and warranty accuracy.

| Field | Type | Optional? | Visible to SC? | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Bill Date** | Date picker | Optional (recommended) | No — admin only | Used for automatic warranty calculation (`billDate + 3 years`). If filled, warranty is auto-calculated. Saved to Product record. |
| **Bill Photo** | Image upload | Optional (recommended) | No — admin only | Photo of the original purchase bill/receipt. Stored in product's bill photo field. If the SC uploads it later, it auto-fills here. |
| **Shop Name** | Free text | Optional (recommended) | No — admin only | Name of shop/dealer where product was purchased. Free text, any value. |
| **Serial Number** | Free text | Optional (recommended) | Yes — sent to SC in `WA-01` if filled | Unique identifier for the physical unit. Saved to Product record. Used for product tracking and lookup. |
| **Model Number** | Free text | Optional (recommended) | Yes — sent to SC in `WA-01` if filled | Model/variant of the product. Free text. Saved to Product record. |

> [!NOTE]
> These 5 fields are saved to the `Product` record (product tracking layer), not just to this complaint. Any value filled here persists and pre-fills for all future complaints linked to the same product.

### 3B. Pre-fill Behaviour When Product is Already Linked
- If Step 1 finds a linked product (by phone or serial match): Step 2 comes pre-filled with all 5 fields from the Product record.
- **Edits and Warnings:** Admin can edit any pre-filled value. If the admin changes a value that was previously saved, an inline warning appears: `'This field was previously saved as [X]. You are changing it to [Y].'` The admin can confirm or revert the change.
- On complaint submission, updated values are saved back to the Product record — self-correcting over time.

### 3C. Location / Action Text Field (Step 1 Addition)
A small optional field is added to Step 1 (Customer Info):

| Field | Type | Required? | Purpose |
| :--- | :--- | :--- | :--- |
| **Location / Action Text** | Free text (paste-friendly) | Optional | If the customer shares a Google Maps link, coordinates, or any location description, the admin pastes it here. Sent to the SC in the `WA-01` message so they can navigate directly. |

- No validation — any text accepted (Maps link, address description, landmark, coordinates).
- Visible to the SC in their complaint detail view and in the `WA-01` WhatsApp message.
- Stored on the **Complaint** record — not on the Product record (location may differ per visit).

### 3D. SC Done Form — Demanded Fields Based on What's Missing in Step 2
When the SC submits their Done form, the system checks which Step 2 fields were filled at registration. Missing fields trigger demands in the Done form:

| What's Missing in Step 2 | What SC Done Form Demands | Required? |
| :--- | :--- | :--- |
| Any of: **Bill Date** / **Bill Photo** / **Shop Name** | Bill receipt / photo upload from customer — SC must obtain and upload the bill | Warned but bypassable |
| **Serial Number** OR **Model Number** (or both) | Photo of the product's serial number / model sticker (physical slip on the product) | Warned but bypassable |

- These demanded uploads appear as a dedicated sub-section in the SC's Done form, clearly separated from normal proof photos.
- **Bypass Warning:** If the SC does not upload the demanded items and clicks Submit, a warning is shown listing what is missing. The SC must either go back and upload OR explicitly bypass each item.
- **Bypass Allowed:** Bypass is allowed — the SC selects 'Skip for now' per item. The system records that it was skipped (not uploaded by SC).

### 3E. SC Upload — Bill Photo and Serial Slip Handling
- **Bill Photo uploaded by SC in Done form:** Automatically saved to the Product record's `billPhoto` field. The admin can see it from the complaint's product info subsection, and can keep it, remove it, or replace it with a different photo. If the SC uploads it, it becomes the active bill photo on the Product record immediately.
- **Serial Number slip photo uploaded by SC:** Stored as a separate media item on the complaint (not in the Product record's main fields). The admin views it in the complaint's product info subsection and can manually transcribe the serial/model number into the Product record fields.
- Both uploads are **not** visible to the SC after submission — they go into the admin's product info view only.

### 3F. Admin at Closing Time — Final Field Check
When the admin is about to confirm Done and close the complaint, the system checks all 5 Step 2 fields on the Product record. Any that are still empty trigger a warning before closing:
- **Warning Shown:** `'The following product fields are still empty: [list of missing fields]. Please fill them or bypass to close.'`
- **Resolution:** The admin can go back to the product info section, fill the missing fields (using the SC-uploaded bill photo or serial slip if the SC provided them), and then close.
- **Bypass:** The admin can bypass each warning individually — an explicit bypass is required per field, not a single 'skip all'.
- **Persistent Indicators:** If any field is still missing after bypass at closing, a permanent indicator remains on the Product record showing which fields were never filled. This indicator shows as a warning on all future complaints for the same product until the fields are eventually filled.
- This persistent warning ensures that every future admin handling a complaint for this product is reminded to fill the missing fields, even if previous admins bypassed them.

### 3G. Warranty Logic — Final Consolidated Rules
Warranty status is determined at every complaint creation and stored as a snapshot on both the Complaint record and the Product record. The following rules apply in priority order:

#### Rule 1 — Bill Date present
- `warrantyExpiryDate = billDate + 3 years`
- `warrantyStatus = In Warranty` if `today <= warrantyExpiryDate`, else `Out of Warranty`
- Shown to admin as: `'In Warranty (expires DD MMM YYYY)'` or `'Out of Warranty (expired DD MMM YYYY)'`
- `warrantySource = auto_calculated`

#### Rule 2 — No Bill Date
- Admin must manually select: `In Warranty` or `Out of Warranty`
- Admin must provide a reason for the manual selection (free text, required)
- `warrantySource = manual`
- The reason is stored on the Product record and is visible to the admin only — the SC sees only 'In Warranty' or 'Out of Warranty', never the reason.

#### Rule 3 — LED Installation (special default)
- LED Installation complaints are always `In Warranty` by default — a brand new install is obviously in warranty.
- If the admin fills the bill date: warranty is auto-calculated from that date for all future complaints on this product.
- If the admin does not fill the bill date: `warrantyStatus = In Warranty`, `warrantySource = manual` (default), no expiry date stored.
- **Force Override:** Force override is always available even for installations — the admin can force `Out of Warranty` with a reason in rare edge cases.

#### Rule 4 — Force Override (always available)
- Even if a bill date is present and auto-calculates a status, the admin can always force override to the opposite status.
- Force override requires a reason (free text, required).
- **Storage:** `warrantyStatus = forced value`, `warrantySource = forced`, `forceReason = admin's text`.
- The force reason is visible to the admin only. The SC sees only the final `In Warranty` / `Out of Warranty` status.

#### Warranty state persistence across complaints
- Warranty status, expiry date, source, and force reason (if any) are saved on the Product record after every complaint.
- On the next complaint for the same product, the warranty info is pre-shown from the Product record.
- **Fresh Calculations:** If the bill date was previously filled, auto-calculation runs fresh at new complaint time (today vs expiry date) — so a product that was In Warranty last year correctly shows Out of Warranty now if 3 years have passed.
- The admin can always update the bill date or force override at any complaint creation or closing time.

---

## Change 4 — Advanced Billing Filters + Mark as Paid System
Two improvements to the Billing Dashboard: richer filtering with exact date ranges, and a full payment tracking system for marking bills as paid or unpaid.

### 4A. Advanced Billing Filters
The previous billing filters (SC, Month, Year, Product, Warranty) are replaced with a more flexible filter set:

| Filter | Type | Details |
| :--- | :--- | :--- |
| **Service Centre** | Single select | All Service Centres OR a specific SC. Includes both registered and unregistered SCs. |
| **From Date → To Date** | Two date pickers | Exact calendar date range. Replaces the old Month + Year dropdowns. Admin picks any From and To date. Default on load: current month start to today. |
| **Product** | Single select | All Products / LED / Cooler |
| **Warranty** | Single select | All Warranty Status / In Warranty / Out of Warranty |
| **Payment Status** | Single select | All / Paid Only / Unpaid Only — NEW filter (see Section 4B) |

- All filters work together simultaneously (**AND** logic).
- **Reset Filters** clears all back to defaults (All SCs, current month, all products, all warranty, all payment status).
- Both tabs — *Per Complaint Bills* and *Monthly Invoice Summaries* — respect all active filters.

### 4B. Mark as Paid System — Full Flow
Every closed bill now has a payment status: `Unpaid` (default on bill generation) or `Paid`. The admin can mark bills as paid at closing time or anytime later from the Billing Dashboard.

#### At Complaint Closing Time
- When the admin confirms Done and the bill is generated, an optional checkbox/toggle appears: *“Mark as Paid immediately”*.
- If checked: the bill is created with `paymentStatus = paid`, `paidAt = current timestamp`.
- If left unchecked: the bill is created with `paymentStatus = unpaid`. It can be marked paid later from the Billing Dashboard.

#### From Billing Dashboard — 3 Ways to Mark as Paid

##### Method 1 — Bulk: All bills for selected SC + date range
- Admin selects a specific SC and a date range in the filters.
- A **“Mark All as Paid”** button appears at the top of the filtered results.
- Clicking it marks ALL currently visible unpaid bills in the filtered view as paid in one action.
- The `paidAt` timestamp is recorded as the current time for all of them.

##### Method 2 — Bulk: All SCs in a date range
- Admin selects "All Service Centres" + a date range.
- The same **“Mark All as Paid”** button marks all unpaid bills across all SCs in that range.
- Useful for end-of-month batch payment processing.

##### Method 3 — Manual: Select individual bills
- Each bill row in the *Per Complaint Bills* table has a checkbox on the left.
- Admin selects any combination of individual bills (across any SC or date).
- A **“Mark Selected as Paid”** button appears in the action bar when at least one bill is selected.
- Only selected bills are marked paid. Others remain untouched.

#### Marking as Unpaid (Reversal)
- Any paid bill can be reversed back to `unpaid`.
- The same methods apply (bulk or individual selection).
- **Warning on Reversal:** On clicking *Mark as Unpaid*, a warning is shown: *“This will mark [N] paid bill(s) as unpaid. This action is reversible but will affect payment records. Continue?”*
- Admin confirms → bills are reverted to `unpaid`, and `paidAt` is cleared.
- Payment history is **not** stored per reversal — only the current `paidAt` timestamp is kept (reflecting the last time it was marked paid).

#### Payment Record per Bill

| Field | Stored On | Details |
| :--- | :--- | :--- |
| **paymentStatus** | Complaint / Invoice record | Enum: `unpaid` / `paid`. Default: `unpaid` on bill generation. |
| **paidAt** | Complaint / Invoice record | Timestamp of when *Mark as Paid* was last clicked. Null if unpaid. Shown in billing detail view. |
| **paidBy** | Complaint / Invoice record | Which admin account marked it as paid (stored for audit). |

> [!NOTE]
> `paidAt` always reflects the **last** time the bill was marked paid. If a bill is marked paid, then unpaid, then paid again — `paidAt` shows the most recent paid timestamp only. Full reversal history is not stored.

#### Billing Table Display

| Column / Element | Details |
| :--- | :--- |
| **Payment Status column** | Shows `PAID` (green badge) or `UNPAID` (amber badge) per row |
| **Paid On column** | Shows `paidAt` date+time if paid. Shows `—` if unpaid. |
| **Row checkbox** | For manual individual selection |
| **Action bar** | Appears when any checkbox is selected — shows *Mark Selected as Paid* / *Mark Selected as Unpaid* buttons |
| **Bulk action button** | *Mark All as Paid* — shown above table, acts on current filtered view |

### 4C. Running Totals — Two Sums Below Billing Table
Below the *Per Complaint Bills* table, two running totals are always shown based on the current active filters and date range:

| Total | What It Shows |
| :--- | :--- |
| **Total (all bills in view)** | Sum of ALL bills currently shown (paid + unpaid combined) for the selected filters and date range. |
| **Unpaid Total** | Sum of only UNPAID bills in the current view. This is what Microvison still owes the SC(s) in the selected period. |

- Both totals update live as filters change.
- If a specific SC is selected, the totals reflect that SC only.
- If "All Service Centres" is selected, the totals reflect all SCs combined for the selected date range.
- **Default View:** On opening the Billing Dashboard (no filters changed), it shows the current month and all SCs — giving an instant overview of the current month’s billing situation.

---

## Master Summary — All Changes So Far

| Change / Feature | What It Does |
| :--- | :--- |
| **1A — Skip SC Assignment** | Step 5 (was Step 4) can be skipped. The complaint is created as `unassigned`. The admin assigns it later from the detail view. `WA-01` fires on that later assignment. |
| **1B — Advanced Search** | The top bar searches 5 fields simultaneously. All filters are combinable. Date shortcuts: `Today`, `Yesterday`, `Last 7`, `Last 30`, `Custom`. |
| **2A — Unregistered SC creation** | The admin can create a minimal SC record on the spot during assignment. Sets the `isUnregistered` flag. No portal access and no WhatsApp reminders for the SC. |
| **2B — WA-04 still fires** | The customer receives the `WA-04` WhatsApp message even for unregistered SC assignments. All other SC-related WhatsApp messages do not fire. |
| **2C — Admin maintains updates** | The admin fills all forms and updates all statuses for the unregistered SC on their behalf. Full billing and product tracking still work. |
| **2D — New city/district/state** | The admin can create new locations on the spot from any city field. Instantly available system-wide. |
| **2E — Searchable and reusable** | Unregistered SCs appear in the SC list, are filterable, searchable, and reusable for future complaints. |
| **2F — Upgrade to registered** | SC submits a normal registration. The admin links the new account to the existing unregistered SC via manual search (not phone-match only). All history transfers, and the unregistered badge is removed. |
| **3 — New Step 2** | A new Step 2 is inserted: Bill Date, Bill Photo, Shop Name, Serial Number, Model Number. All optional but recommended. Old steps shift by 1. |
| **3C — Location / Action Text** | Optional field in Step 1. The admin pastes a Maps link or location note. Sent to the SC in `WA-01`. |
| **3D — SC Done demands** | If Step 2 fields are missing: SC must upload the bill photo / serial sticker photo in their Done form. Both are bypassable with a warning. |
| **3E — SC uploads auto-fill product** | SC-uploaded bill photo auto-saves to the Product record. The admin can keep, remove, or replace it. The serial slip photo is stored separately for the admin to transcribe. |
| **3F — Admin closing check** | Before closing, the admin is warned of missing Step 2 fields and must either fill them or bypass each field. A persistent warning remains on the Product record for future complaints. |
| **3G — Warranty logic** | `billDate + 3 years` auto-calculation. If no bill date exists, the admin makes a manual selection and provides a required reason. LED installations default to `In Warranty`. Force overrides are always available with a reason. Reasons are visible to the admin only. |
| **4A — Advanced billing filters** | An exact date range (From → To) replaces Month + Year. SC, Product, and Warranty filters remain. A new Payment Status filter is added: `All` / `Paid Only` / `Unpaid Only`. All are combinable simultaneously. |
| **4B — Mark as Paid system** | Bills default to `unpaid` on generation. They can be marked paid at closing (optional) or from the Billing Dashboard (bulk all in filtered view, bulk all SCs in a date range, or manual checkbox selection). Reversals to unpaid are allowed with a warning. `paidAt` + `paidBy` are stored per bill. |
| **4C — Running totals** | Displays two live sums below the billing table: *Total (all bills in view)* and *Unpaid Total (only unpaid)*. Both update dynamically with active filters. Default is the current month and all SCs. |

---
*End of Current Changes · More changes will be added to this document as discussed*
