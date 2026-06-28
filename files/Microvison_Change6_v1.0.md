# MICROVISON — Change 6: Out-of-Warranty Money Flow + Editable Billing + Engineer Field
**Three self-contained changes. No new flows created. Everything works within the existing complaint lifecycle.**

---

## Change 6A — Out-of-Warranty Money Flow
This clarifies exactly how money moves in out-of-warranty complaints. No new system is created — the existing customer payment fields and billing system handle everything. This is a documented understanding of how admin uses those fields.

> [!IMPORTANT]
> **Core Principle**: In out-of-warranty complaints, the customer bears **ALL** costs. Microvison's only payment to SC is for Microvison-approved extras (e.g. a branded part Microvison sourced and sent). Everything else is customer-funded.

### 6A.1 What the Customer Pays
* Preset service charge (the base service fee — customer is told this upfront on the initial call before SC is dispatched)
* Petrol / travel charges
* Extra charges (standard extras approved during the complaint)
* Part cost (if part pending — customer pays for the part being ordered/delivered)

*Admin informs customer of the estimated total on the initial call. Customer must agree before SC is dispatched. If customer does not agree, complaint is not proceeded with.*

### 6A.2 How Customer Can Pay — Two Routes

| Payment Route | What Happens | Effect on SC Billing |
| :--- | :--- | :--- |
| **Paid directly to Microvison** | Customer transfers money to Microvison (online, bank, UPI). Microvison receives it. Microvison pays SC their portion from this collected amount. | SC billing is normal. Microvison pays SC from collected customer money. |
| **Paid directly to SC** | Customer hands cash or pays UPI directly to the SC in person. SC already has the money. | That amount is **SUBTRACTED** from what Microvison owes SC. SC already collected it. No double payment. |

*Payment can happen at multiple points in the complaint lifecycle — upfront (initial estimate), mid-visit (if extra charges discovered), after part delivery. Each payment event is recorded separately by admin in the complaint.*

### 6A.3 What Microvison Pays SC in Out-of-Warranty

| Component | Who Funds It | Notes |
| :--- | :--- | :--- |
| **Preset service charge** | Customer funds it | Customer paid this. Microvison passes it to SC (or subtracts if SC already collected). |
| **Petrol / travel** | Customer funds it | Same — customer paid. Flows to SC. |
| **Standard extra charges** | Customer funds it | Same flow. |
| **Microvison-approved extras** | Microvison funds it | Optional. Only when Microvison itself sourced a branded part or contributed something specific. Rare. |
| **Part cost (part pending)** | Customer funds it | Customer pays for the part. If paid to SC directly — subtracted. If paid to Microvison — Microvison pays SC. |

### 6A.4 Net Billing Calculation
Admin sees this before closing (editable — see Change 6B):

| Line Item | Amount |
| :--- | :--- |
| Preset price (as set for this complaint) | ₹X |
| Petrol (final after 3-lock) | ₹X |
| Approved extra charges | ₹X |
| Microvison-approved extras (if any) | ₹X |
| **MINUS**: Customer payments collected by SC directly | −₹X |
| **Net amount Microvison pays SC** | **₹X (bold total)** |
| *For record*: Customer payments to Microvison directly | ₹X (separate line, not in SC bill) |

---

## Change 6B — Reopen Flow Abandoned + All Money Fields Editable Before Closing

Reopen is completely removed from the system. No reopen button. No reopen detection. No `reopenParentId`. No special status. A repeat complaint for the same product within 30 days is simply a new complaint with a new complaint ID. Admin handles billing adjustments manually using editable fields.

### 6B.1 What “Reopen” Was and Why It’s Gone
* **Previously**: If same product complained again within 30 days, a special reopen flow triggered with linked IDs and separate billing logic.
* **Problem**: Too complex, too many edge cases, and admin already has all the tools needed to handle it manually.
* **Solution**: Every complaint is a new complaint. Admin simply edits the preset price down (with reason) if they want to pay SC less for a repeat visit. Nothing else changes.
* **Product Timeline**: Still shows full history — admin can see this product had a complaint 10 days ago. Admin uses that context to decide how much to pay SC. System doesn’t enforce anything.

### 6B.2 Editable Money Fields Before Closing — Both Warranty Types
Before admin clicks **Confirm Done** to close a complaint, **ALL** money fields are editable. This applies to in-warranty AND out-of-warranty complaints equally.

| Field | Editable? | Warning on Edit? | Reason Required? | Who Can Edit |
| :--- | :--- | :--- | :--- | :--- |
| **Preset price** (rupee amount for this complaint only) | Yes — before closing | Yes — always | Yes — mandatory | Admin only |
| **Petrol amount** | Yes — via 3-lock system (unchanged) | Shown as edit count | No (edit count is the control) | Admin (edit 1 and 3), SC (edit 2) |
| **Extra charge amounts** (approved) | Yes — before closing | Yes — always | Yes — mandatory | Admin only |
| **Customer payment amount** (paid to SC) | Yes — before closing | Yes — always | Yes — mandatory | Admin only |
| **Customer payment amount** (paid to Microvison) | Yes — before closing | Yes — always | Yes — mandatory | Admin only |
| **Microvison-approved extras** | Yes — before closing | Yes — always | No | Admin only |

### 6B.3 Preset Price Edit — How It Works
* The preset itself (which preset was selected) does **NOT** change. Only the rupee amount for this specific complaint is editable.
* Admin clicks **Edit** on the preset price field — a warning fires: *'You are changing the preset price for this complaint. This will affect the final bill. Please provide a reason.'*
* Admin enters new amount + reason (free text, mandatory). Examples of valid reasons: *'Repeat visit within 30 days — reduced fee'*, *'Partial work done'*, *'Customer goodwill discount'*.
* Original preset price and edited price are both stored. Edit reason stored. Audit trail maintained.
* This is how admin handles what used to be called 'reopen billing' — just lower the preset price with a reason. Simple.

*This is the ONLY change to preset handling. The preset library, preset selection at complaint registration, and preset price snapshotting all work exactly as before. Only the final amount is overrideable before closing.*

### 6B.4 Pre-Close Money Summary Panel
Before admin clicks **Confirm Done**, a full money summary panel is shown showing all editable fields in one place:

| Section | Shows |
| :--- | :--- |
| **What Microvison pays SC** | Preset price (original → edited if changed) + Petrol final + Approved extras + Microvison extras − Customer payments collected by SC = **Net total** |
| **What customer paid / owes** | Customer payments to Microvison (recorded) + Customer payments to SC (recorded) + Any outstanding balance |
| **Edit buttons** | Each line item has an Edit button. Admin can adjust any field from this panel without going back to individual sections. |
| **Warning banner** | If any field was edited from its original value: yellow banner shows *'X fields have been modified from original values. Review before closing.'* |
| **Confirm close button** | Only enabled after admin has reviewed. Clicking locks all fields permanently. |

---

## Change 6C — Engineer Name Field
A new optional field is added to complaints: **Engineer Name**. This records which engineer/technician actually went to the customer's location.

### 6C.1 Field Details

| Property | Value |
| :--- | :--- |
| **Field name** | `engineerName` |
| **Type** | Free text string |
| **Required** | No — optional |
| **Scope** | Complaint-specific (not stored on Product record or SC record) |
| **Who fills it** | SC fills at time of submitting Done form. Admin can also fill or edit it at any time before closing. |
| **Where shown** | Complaint detail view (both admin and SC can see it). Billing breakdown (shown alongside complaint ID and SC name). Not shown on WhatsApp messages. |

### 6C.2 Why Complaint-Specific
* Different engineers from the same SC may handle different visits for the same product over time.
* Storing it on complaint level means you can track which engineer handled which specific visit — useful for accountability and quality tracking.
* SC may have multiple engineers — they fill whoever actually went. Admin can verify or correct before closing.

### 6C.3 Where It Appears in the Flow

| Point in Flow | Action |
| :--- | :--- |
| **SC Done form** | Optional field: *'Engineer Name (who visited the customer)'*. SC fills their engineer's name. |
| **Admin review before closing** | Admin sees the engineer name. Can edit if SC filled it wrong or left it blank. |
| **Complaint detail view** | Shown in the complaint info section alongside SC name, complaint ID, date. |
| **Billing breakdown** | Shown as a reference field: *'Engineer: [Name]'* next to the complaint line item. |

---

## Summary — Change 6 Overview

| Change | What It Does | New Flow Created? |
| :--- | :--- | :--- |
| **6A — Out-of-warranty money flow** | Customer pays all costs. Two payment routes: to Microvison or to SC directly. SC gets paid from customer money (net of what SC already collected). Microvison only pays SC for Microvison-approved extras from its own pocket. | No — uses existing customer payment fields |
| **6B — Reopen abandoned + editable billing** | Reopen concept completely removed. Every complaint is new. Preset price (amount only) editable before closing with reason + warning. All other money fields editable with warning. Pre-close summary panel shows full net billing for review. | No — edits to existing billing UI only |
| **6C — Engineer name field** | Optional free text field on each complaint. SC fills at Done time. Admin can edit before closing. Complaint-specific, not stored on Product or SC records. | No — single new optional field |

---
*End of Document · Microvison Change 6 v1.0*
