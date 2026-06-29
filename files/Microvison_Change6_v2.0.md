# MICROVISON
## Change 6 — Out-of-Warranty Money Flow, Editable Billing & Engineer Name Field
**v2.0 — No new flows. All within existing complaint lifecycle.**

---

## Change 6A — Out-of-Warranty Money Flow

### Core Principle
Customer pays **ALL** costs in out-of-warranty complaints — preset, petrol, extras, and parts. 
* Customer pays Microvison (company).
* Microvison pays the Service Centre (SC).
* If the customer paid the SC directly at any point, that amount is subtracted from what Microvison owes the SC.

### 6A.1 The Multi-Stage Payment Problem
Out-of-warranty complaints often span multiple stages — initial visit, part pending, part delivery, and re-visit. Customer payments can happen at any of these stages, not just once at the end. The system must track every payment at every stage so the final net billing to the SC is accurate.

* **Stage 1: Complaint registration** — admin tells customer estimated cost on call. Customer may pay upfront.
* **Stage 2: After SC visits and submits Done/Not Done/Part Pending form** — admin knows actual scope, may collect more or record what SC collected.
* **Stage 3: Part pending** — admin quotes part cost. Customer pays for the part.
* **Stage 4: Part delivered, SC visits again, marks Done** — final collection if any balance remaining.

*Note: Not all stages happen in every complaint. Simple complaints may have only 1-2 payment events. Complex part-pending complaints may have 3-4.*

### 6A.2 Admin-Only "Collected from Customer" Section
At each stage of the complaint, the admin sees a collapsible **"Collected from Customer"** section in the admin complaint panel. This section is:
* **Visible to admin only** — SC never sees this section.
* **Available at every stage:** complaint registration, after each SC form submission (Done/Not Done/Part Pending), and after part delivery.
* **Independent entries** — multiple entries can be added across different stages.

Each collection entry contains the following fields:

| Field | Type | Details |
| :--- | :--- | :--- |
| **Amount** | Number (rupees) | How much the customer paid at this stage. |
| **Payment Route** | Select (2 options) | **Paid to Microvison** (company received it) <br>OR<br>**Paid to SC directly** (SC received it). |
| **Stage / Reason** | Free text | What this payment was for: initial estimate, part cost, final balance, etc. |
| **Date Recorded** | Auto Timestamp | Timestamp when the admin added this entry. |

*Note: The admin fills this after receiving info on call from the SC or customer. The system has no way to auto-detect payments — the admin manually records every payment event.*

### 6A.3 Effect on SC Billing

| Payment Route Selected | Effect on SC Bill | Visible to SC? |
| :--- | :--- | :--- |
| **Paid to Microvison** | No effect on SC bill. Recorded internally for Microvison’s accounts only. Microvison pays the SC normally from this collected money. | No — admin only |
| **Paid to SC directly** | Amount **SUBTRACTED** from what Microvison owes the SC for this complaint. Since the SC already has this money, Microvison does not pay it again. | Yes — shown on SC billing as:<br>`−₹X — Customer payment collected by SC: [reason]` |

*If multiple "Paid to SC directly" entries exist across stages, all are summed and the total is subtracted from the SC’s final bill.*

### 6A.4 What Microvison Pays SC — Net Calculation
Shown in the pre-close billing summary panel (see Change 6B):

| Line Item | Direction |
| :--- | :--- |
| **Preset price** (editable — see 6B) | Microvison → SC |
| **Petrol final** (3-lock system) | Microvison → SC |
| **Approved extra charges** | Microvison → SC |
| **Microvison-approved part/extra** (if any) | Microvison → SC |
| **MINUS: All "Paid to SC directly" entries across all stages** | Subtracted from SC bill |
| **= Net amount Microvison pays SC** | **Final SC payment** |
| *Separately tracked: All "Paid to Microvison" entries* | *Internal record only — not in SC bill* |

---

## Change 6B — Reopen Abandoned + All Money Fields Editable Before Closing

**Reopen is completely removed.** No reopen button, no reopen detection, no `reopenParentId`, and no special status. Every complaint is a new complaint with a new ID. The admin handles repeat-visit billing by editing the preset price down with a reason. The product timeline still shows full history for admin context.

### 6B.1 What Gets Removed
* Reopen button — removed from everywhere.
* Reopen detection on phone entry in Step 1 — removed.
* `reopenParentId` field — removed from the `Complaint` model.
* `isReopened` flag — removed.
* `reopenNotes`, `reopenPhotos` fields — removed.
* Reopen status in status lifecycle — removed.
* Reopen WhatsApp trigger (WA-05 reopen variant) — removed.
* Reopen filter in All Complaints filters — removed.

*Note: The product timeline is **NOT** removed. The admin still sees full complaint history for a product (all previous complaints, dates, and statuses) from the product timeline section in the complaint detail view. This gives the admin full context when deciding how much to pay the SC for a repeat visit.*

### 6B.2 How Repeat Visits Are Handled Now
When the same product has a new complaint registered within 30 days:
1. The admin registers a new complaint — full normal flow with a new complaint ID.
2. The admin sees the product timeline showing previous complaint(s) and their dates.
3. The admin decides: *should the SC be paid less since it’s a repeat visit?*
   * **If yes** — the admin edits the preset price down with a reason before closing (see 6B.3).
   * **If no** — the admin closes with the full preset price. No special actions needed.
*There is no system enforcement. The admin uses judgment.*

### 6B.3 Editable Money Fields — Both Warranty Types
All money fields are editable by the admin before closing. This applies equally to both in-warranty and out-of-warranty complaints.

| Field | Editable Before Closing? | Warning? | Reason Required? |
| :--- | :---: | :---: | :---: |
| **Preset price** (rupee amount only — preset selection unchanged) | Yes | Yes — always fires | Yes — mandatory |
| **Petrol** (via 3-lock system) | Yes — admin edit 1 and 3 only | Edit count shown | No |
| **Approved extra charge amounts** | Yes | Yes | Yes — mandatory |
| **Customer payment entries** (amount + route) | Yes — each entry editable | Yes | Yes — mandatory |
| **Microvison-approved extras** | Yes | Yes | No |

#### Preset Price Edit — Exact Behaviour
* The admin clicks **Edit** on the preset price — a warning fires: *‘You are changing the preset price for this complaint. This affects the final bill.’*
* The admin enters a new amount + mandatory reason (e.g. *‘Repeat visit within 30 days — reduced fee’*, *‘Partial work only’*, *‘Goodwill discount’*).
* The original preset price, edited price, reason, and timestamp are all stored for audit.
* Which preset was selected does **NOT** change — only the rupee amount for this specific complaint.

### 6B.4 Pre-Close Billing Summary Panel
Before the admin clicks **Confirm Done**, a full money summary panel is shown. All fields are editable directly from here:

| Section | What Admin Sees |
| :--- | :--- |
| **Microvison pays SC** | Preset (₹X → edited ₹Y if changed) + Petrol + Extras + Microvison parts − Customer payments to SC = Net total SC payment. |
| **Customer payments (internal)** | All "Paid to Microvison" entries listed with stage and date. Total collected by the company. Not in SC bill. |
| **Customer payments (SC deductions)** | All "Paid to SC directly" entries listed with stage and date. Total subtracted from the SC bill. |
| **Edit buttons** | Each line item has inline Edit. Admin adjusts without leaving this panel. |
| **Modified fields warning** | Yellow banner if any field changed from original: *‘X fields modified. Review before closing.’* |
| **Confirm Done button** | Locks all fields permanently. Bill generated. Cannot be undone. |

---

## Change 6C — Engineer Name Field

| Property | Details |
| :--- | :--- |
| **Field Name** | `engineerName` |
| **Type** | Free text, optional |
| **Scope** | Complaint-specific. Not stored on the Product record or SC record. |
| **Filled by SC** | Optional field in the Done form — *‘Engineer who visited the customer’*. |
| **Filled/Edited by Admin** | The admin can fill or edit at any time before closing. |
| **Visible to** | Both admin and SC in the complaint detail view. Shown in the billing breakdown as a reference field. |
| **On WhatsApp** | Not included in any WhatsApp message. |

*Note: This is complaint-specific because different engineers from the same SC may handle different visits for the same product. Storing per-complaint allows tracking which engineer handled which visit for accountability.*

---

## Data Model Changes

### New Fields on Complaint Model

| Field | Type | Notes |
| :--- | :--- | :--- |
| `customerPayments` | Array of objects | `[{amount, route (to_microvison / to_sc), reason, stage, recordedAt, recordedBy}]`. One entry per payment event across all stages. |
| `presetPriceOriginal` | Number | Snapshotted at complaint creation. Never changes. |
| `presetPriceFinal` | Number | Admin-editable before closing. Starts equal to `presetPriceOriginal`. If edited, reason is stored. |
| `presetPriceEditReason` | String | Required if `presetPriceFinal` differs from `presetPriceOriginal`. |
| `presetPriceEditedAt` | Date | Timestamp of the edit. |
| `engineerName` | String | Optional. Who visited the customer. |

### Fields Removed from Complaint Model (Reopen Cleanup)

| Field Removed | Reason |
| :--- | :--- |
| `isReopened` | Reopen concept abandoned |
| `reopenParentId` | Reopen concept abandoned |
| `reopenNotes` | Reopen concept abandoned |
| `reopenPhotos` | Reopen concept abandoned |
| `reopenedAt` | Reopen concept abandoned |

---

## Summary

| Change | What It Does |
| :--- | :--- |
| **6A — Out-of-warranty money flow** | Admin records customer payments at each complaint stage (registration, Done, Not Done, Part Pending, part delivery). Each payment: amount + Paid to Microvison OR Paid to SC. Paid to SC entries are summed and subtracted from SC billing. Paid to Microvison entries are internal records only. SC sees deductions on their billing page with label and reason. |
| **6B — Reopen removed + editable billing** | Reopen completely abandoned — all reopen fields, buttons, detection, filters removed. Repeat complaints are new complaints. Admin edits preset price (amount only, not selection) with reason to handle repeat-visit billing. All money fields editable before closing with warning. Pre-close summary panel shows full net billing. |
| **6C — Engineer name** | Optional free text field per complaint. SC fills in Done form. Admin can edit before closing. Shown in complaint detail and billing for both roles. |
