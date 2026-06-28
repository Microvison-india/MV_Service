# MICROVISON — Change 5: Warranty Edge Case & Critical Action Section
**Addendum to System Changes Living Document — In-Warranty Edge Cases, Customer Extra Charges, Warranty Revocation**

---

## 1. Overview
This document covers a new admin-only flow for handling edge cases that arise during in-warranty complaints — specifically when the SC discovers that the customer has had unauthorized 3rd party repairs, caused physical damage, or misused the product. In these cases, Microvison may need to charge the customer extra for specific repairs and/or revoke the product's warranty going forward.

This entire flow is handled by admin through a new **Critical Action** section that appears on every complaint's admin review panel. SC is completely unaware of this section — SC just fills their normal form.

---

## 2. Normal In-Warranty Flow vs Edge Case

| Scenario | What Happened | Who Pays What |
| :--- | :--- | :--- |
| **Normal in-warranty** | SC visits, does the work, marks Done/Not Done/Part Pending. No unauthorized repair or damage found. | Microvison pays SC full bill: Preset + Petrol + Approved Extras. Customer pays nothing. |
| **Edge case — 3rd party repair found** | SC finds evidence of unauthorized 3rd party repair that voids warranty eligibility for that specific repair/part. | Microvison still pays SC: Preset + Petrol + Standard Extras (for the visit). Customer may be asked to pay extra for the specific repair portion. Warranty may be revoked going forward. |
| **Edge case — physical damage / misuse** | SC finds customer broke the product, dropped it, used it incorrectly, or caused damage that Microvison is not liable for. | Same as above — Microvison pays SC for the visit. Customer pays for the specific damage repair. Warranty may be revoked. |

> [!NOTE]
> **Key Principle**: The product was in-warranty when the complaint was registered and SC was dispatched. Microvison always pays SC for the visit (preset + petrol + standard extras) regardless of what the SC finds. Only the specific damage repair cost may fall on the customer. Warranty revocation only affects FUTURE complaints.

---

## 3. SC's Role — Unchanged
SC fills their normal form exactly as before. SC does not make any warranty decisions and does not flag anything as an edge case. SC simply reports what they found and what work was or was not done.

* SC marks Done / Not Done / Part Pending as applicable.
* SC fills photos, audio note, notes, petrol details, extra charges (for standard work) as normal.
* SC does **NOT** see the Critical Action section at any point.
* SC is informed verbally by admin over a phone call if the situation requires customer payment or warranty revocation — the system does not notify SC of these decisions.

SC only sees the outcome at billing time: if a customer payment was subtracted from their billing, SC sees that deduction with a label and reason. SC does not see the underlying warranty revocation reason or admin's internal notes.

---

## 4. Critical Action Section — Admin Only
The Critical Action section is always present on the complaint's admin review panel — visible after SC submits any form (Done, Not Done, Part Pending). It is always empty by default. Admin fills it only when an edge case is identified.

> [!WARNING]
> This section is never visible to the Service Centre at any time.

### 4A. Customer Extra Charge Field
Admin enters the amount the customer needs to pay for the specific repair or replacement that Microvison will not cover (e.g. replacing a panel broken by the customer, fixing damage from unauthorized 3rd party repair).

Admin then selects one of three payment options:

| Payment Option | What It Means | Effect on Billing |
| :--- | :--- | :--- |
| **Not applicable / Customer did not agree** | Customer was informed on call but refused to pay. No extra work will be done for the damage. | Complaint proceeds normally. No effect on billing. Field left empty or marked as 'not agreed'. SC gets normal preset + petrol + standard extras only. |
| **Paid directly to SC** | Customer agreed on call and paid the SC directly in person (cash or UPI). SC already has the money. | Amount is **SUBTRACTED** from SC's billing for this complaint. Shown to SC on their billing page with label and reason: `Customer payment collected by SC: -₹X` |
| **Paid directly to Microvison** | Customer paid Microvison directly (rare case — e.g. online transfer). Microvison received the money. | Saved in complaint for tracking only. No effect on SC billing. Not shown in SC's billing at all. Internal record only. |

*The system has no way to know if the customer agreed or paid on a phone call. Admin records this manually based on what was communicated on the call. If the customer did not agree, admin simply does not fill the amount field.*

### 4B. Warranty Revocation
After identifying the edge case, admin decides whether to revoke the product's warranty going forward.

| Option | What Happens |
| :--- | :--- |
| **Keep current warranty — no change** | Product warranty status remains as-is on the Product record. Future complaints continue auto-calculating from bill date. No revocation recorded. |
| **Revoke warranty going forward** | Product record's `warrantyStatus` is set to `out_of_warranty`, `warrantySource = revoked`. A revocation reason is required (free text, mandatory). Revocation date stored. All future complaints for this product will auto-show as out-of-warranty. Customer must be informed separately (admin's responsibility via call). |

* Revocation is always going forward only — never retroactive. The current complaint's billing stays as in-warranty since the product was in-warranty at registration time.
* Revocation reason is stored on the Product record and is visible to admin on all future complaints for this product. SC does not see the reason. SC only sees that the product is now out-of-warranty when they receive their next complaint for it.
* If warranty was already revoked on a previous complaint, the Product record will show that flag and reason. Admin sees it pre-populated on future complaints.

### 4C. Warning Behaviour
* If anything is filled in the Critical Action section (any amount or revocation selection), a persistent warning badge appears on the complaint card everywhere it is shown in the admin interface.
* Every time admin tries to edit any field in the Critical Action section after initial entry: a warning fires — *'You are editing a previously recorded critical action. Please review carefully before saving.'*
* Before closing the complaint (confirming Done): a mandatory acknowledgment step appears if Critical Action section has any data — *'This complaint has a critical action recorded. Review and confirm before closing.'*
* Admin must explicitly confirm/acknowledge before proceeding. This cannot be bypassed.

---

## 5. Billing Outcomes — All Scenarios

| Scenario | Microvison Pays SC | Customer Charge | SC Billing Shows | Admin Billing Shows |
| :--- | :--- | :--- | :--- | :--- |
| **Normal in-warranty, no edge case** | Preset + Petrol + Approved Extras = Total | Nothing | Full total | Full total |
| **Edge case, customer did not agree to pay** | Preset + Petrol + Standard Extras (normal) | Nothing (refused to pay) | Normal total, no deduction | Normal total + Critical Action note: *'Customer declined to pay for [reason]'* |
| **Edge case, customer paid SC directly** | Preset + Petrol + Standard Extras **MINUS** customer payment = Net total | Paid to SC directly (e.g. ₹500) | Total with deduction: `'-₹500 Customer payment collected by SC'` + reason | Full breakdown including deduction + customer payment record |
| **Edge case, customer paid Microvison directly** | Preset + Petrol + Standard Extras (normal) | Paid to Microvison directly | Normal total, no deduction (not SC's concern) | Full breakdown + internal note: *'Customer paid Microvison ₹X on [date]'* |
| **Warranty revoked, no customer charge** | Preset + Petrol + Standard Extras (full, in-warranty) | Nothing for this complaint | Normal total | Normal total + Revocation notice: *'Warranty revoked from this date. Reason: [X]'* |
| **Warranty revoked + customer paid SC** | Preset + Petrol + Standard Extras **MINUS** customer payment | Paid to SC directly | Total with deduction + revocation note | Full breakdown + revocation record |

---

## 6. What Gets Stored

### 6A. On the Complaint Record

| Field | Type | Details |
| :--- | :--- | :--- |
| `criticalActionEnabled` | Boolean | True if admin filled anything in Critical Action section. False by default. |
| `customerExtraCharge` | Number | Amount customer was asked to pay. Null if not applicable. |
| `customerChargePaymentMode` | Enum | `not_applicable` / `paid_to_sc` / `paid_to_microvison` |
| `customerChargeReason` | String | Why this extra charge was applied (free text, filled by admin). |
| `customerChargePaidToSCAmount` | Number | Amount to be subtracted from SC billing. Same as `customerExtraCharge` if `paid_to_sc`. |
| `warrantyRevoked` | Boolean | Whether admin revoked warranty on this complaint. |
| `warrantyRevocationReason` | String | Required if `warrantyRevoked = true`. |
| `warrantyRevocationDate` | Date | Timestamp of when admin revoked. |
| `criticalActionLastEditedAt` | Date | Timestamp of last edit to Critical Action section. |
| `criticalActionAcknowledgedAt` | Date | Timestamp when admin acknowledged before closing. |

### 6B. On the Product Record (if warranty revoked)

| Field | Updated To |
| :--- | :--- |
| `warrantyStatus` | `out_of_warranty` |
| `warrantySource` | `revoked` |
| `revocationReason` | Admin's text reason |
| `revocationDate` | Date of revocation |
| `revocationComplaintId` | Reference to the complaint where revocation happened |

*These Product record fields are shown to admin on all future complaints for this product — pre-displayed as a warning: 'Warranty was previously revoked on [date]. Reason: [X].' SC sees only Out of Warranty status, not the reason.*

---

## 7. Visibility Matrix

| Information | Admin | SC |
| :--- | :--- | :--- |
| **Critical Action section exists** | :white_check_mark: Always visible | :x: Never visible |
| **Customer extra charge amount** | :white_check_mark: Sees and fills | :x: Not visible during process |
| **Payment mode (paid to SC / Microvison / not agreed)** | :white_check_mark: Sees and fills | :x: Not visible |
| **Customer charge reason** | :white_check_mark: Sees and fills | :x: Not visible |
| **Warranty revocation decision** | :white_check_mark: Makes the decision | :x: Not visible |
| **Warranty revocation reason** | :white_check_mark: Always visible | :x: Never visible |
| **Billing deduction (paid to SC)** | :white_check_mark: Full detail | :white_check_mark: Sees: `'-₹X — Customer payment collected: [reason]'` |
| **Billing deduction (paid to Microvison)** | :white_check_mark: Full detail | :x: Not shown in SC billing |
| **Product warranty status on future complaint** | :white_check_mark: Sees 'Out of Warranty + revocation warning' | :white_check_mark: Sees 'Out of Warranty' only |
| **Critical action warning badge on complaint** | :white_check_mark: Always shown | :x: Not shown |

---

## 8. When Does the Critical Action Section Appear

* Critical Action section is **ALWAYS** present on every complaint's admin review panel.
* It appears after SC submits **ANY** form — Done, Not Done, or Part Pending.
* It is empty by default. Admin fills it only when an edge case is identified.
* It remains accessible and editable right up until admin clicks Confirm Done to close the complaint.
* Once the complaint is closed (status = closed), the Critical Action section is locked and no further edits are possible — same as all other complaint fields.

*Critical Action is not a separate step or a separate screen. It is a collapsible section within the existing admin complaint detail view, always present but collapsed by default. Admin expands it only when needed.*

---
*End of Document · Microvison Change 5: Warranty Edge Case & Critical Action Section v1.0*
