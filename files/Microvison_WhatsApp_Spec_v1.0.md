# Microvison — Master WhatsApp Messaging Specification

**Sources:** Compiled from `SC_Flow_v1.1.txt` (primary), `task.md` Phase 14, `System_Changes_v1.3.md`, `GRD_v1.1.md`, `Change5`, `Change6_v2.0`, `GRD_Deviation_Log`, `TBP_Deviation_Log`, `HANDOFF_GUIDE`.  
**Last Updated:** June 30, 2026  
**Version:** v1.1 — Updated to reflect Change 6 (Reopen Abandoned + Out-of-Warranty Money Flow)

---

## PART 1 — Master Trigger Table

| Code | Trigger Event | Recipient | Timing | Type |
|---|---|---|---|---|
| **WA-01** | Admin assigns complaint to SC (any new complaint) | SC WhatsApp number | Immediately on assignment | Immediate |
| **WA-02** | SC not acted 23.5h after assignment (no accept/reject) | SC | 23.5h after WA-01 | Scheduled |
| **WA-03** | SC still not acted 47.5h after assignment | SC | 47.5h after WA-01 | Scheduled |
| **WA-0X** | SC still not acted beyond 47.5h | SC | Every 47.5h after WA-03 until SC acts | Scheduled |
| **WA-04** | SC accepts the complaint | Customer phone1 + phone2 (if exists) | Immediately on SC acceptance | Immediate |
| **WA-04B** | SC accepted but no further action for 23.5h | SC | 23.5h after acceptance | Scheduled |
| **WA-0X** | SC still not acted after acceptance | SC | Every 47.5h after WA-04B until SC acts | Scheduled |
| **WA-05** | SC submitted Not Done, no further action 23.5h | SC | 23.5h after Not Done submission | Scheduled |
| **WA-0X** | SC still not acted after Not Done | SC | Every 47.5h after WA-05 until SC acts | Scheduled |
| **WA-06** | Admin marks Part/Unit as Delivered | SC WhatsApp number | Immediately on admin clicking Mark Delivered | Immediate |
| **WA-07** | SC marked Part Received, no further action 23.5h | SC | 23.5h after SC taps Mark Received | Scheduled |
| **WA-0X** | SC still not acted after Received | SC | Every 47.5h after WA-07 until SC acts | Scheduled |

---

## PART 2 — Detailed Content Per Message

### WA-01 — Complaint Assigned to SC
**Controller:** `assignComplaint` in `complaint.controller.js`  
**Recipient:** Registered SC's WhatsApp number  
**Fires:** Immediately when admin clicks Assign (or later when admin assigns a previously `unassigned` complaint)

**Message Content:**
- Label: `NEW COMPLAINT ASSIGNED`
- Complaint ID
- Customer Name
- Customer Phone number
- Full address (local address + city + district)
- Product type (LED TV / Air Cooler)
- Complaint type (Installation / Complaint)
- Warranty status (In Warranty / Out of Warranty)
- Serial Number *(if filled on Product record)*
- Model Number *(if filled on Product record)*
- Location / Maps link *(if `locationText` filled on Complaint)*
- Admin notes *(if any)*
- Portal login URL

> **Change 6B Note:** The `COMPLAINT REOPENED` label and original complaint ID reference have been REMOVED. Reopen flow is completely abandoned. Every complaint — including repeat visits for the same product — is registered as a brand new complaint with a plain `NEW COMPLAINT ASSIGNED` WA-01. There is no special reopen WhatsApp trigger anymore.

**Fields explicitly NOT included in WA-01:**
- `billDate`, `billPhoto`, `shopName` — admin-only internal records, never sent to SC
- `engineerName` — complaint-specific internal field, never in any WA message
- `customerPayments` — internal billing records, never in any WA message

---

### WA-02 — 23.5h Reminder After Assignment
**Controller:** `utils/whatsappReminder.js` cron job  
**Recipient:** SC  
**Fires:** 23.5 hours after WA-01 if SC has not accepted or rejected  
**Content:** Reminder — you have a new complaint pending your response. Complaint ID + customer details.  
**Stops when:** SC accepts or rejects.

---

### WA-03 — 47.5h Reminder After Assignment
**Controller:** `utils/whatsappReminder.js` cron job  
**Recipient:** SC  
**Fires:** 47.5 hours after assignment if still no SC action  
**Content:** Same as WA-02, second reminder  
**Stops when:** SC accepts or rejects.

---

### WA-0X — Repeating Assignment Reminder
**Controller:** `utils/whatsappReminder.js` cron job  
**Recipient:** SC  
**Fires:** Every 47.5 hours after WA-03, indefinitely until SC acts  
**Stops when:** SC accepts or rejects.

---

### WA-04 — SC Accepted (Sent to Customer)
**Controller:** `acceptComplaint` in `complaint.controller.js`  
**Recipient:** Customer's `phone1` AND `phone2` (if exists)  
**Fires:** Immediately when SC taps Accept

> **IMPORTANT: This is the ONLY customer-facing WhatsApp message in the entire system.**
> **This message fires even for Unregistered SC assignments — never suppressed for customers.**

**Message Content:**
- Complaint ID (customer's reference number)
- Product type
- Complaint type
- SC business name
- SC phone number
- Acknowledgment: SC has accepted your request and will visit you soon

---

### WA-04B — 23.5h Reminder After Acceptance
**Controller:** `utils/whatsappReminder.js` cron job  
**Recipient:** SC  
**Fires:** 23.5 hours after SC acceptance if SC has not taken any action (Going, Done, Not Done, Part Pending)  
**Content:** Reminder — you accepted a complaint but have not updated its status. Please visit and update.  
**Stops when:** SC takes any action: Going, Done, Not Done, or Part Pending.

---

### WA-05 — 23.5h Reminder After Not Done Submission
**Controller:** `utils/whatsappReminder.js` cron job  
**Recipient:** SC  
**Fires:** 23.5 hours after SC submits a Not Done form with no further action  
**Content:** Reminder — complaint still open, please update status.  
**Stops when:** SC takes any action (Done, Part Pending, or another Not Done).  
**Note:** If SC submits another Not Done, the 23.5h timer resets and a new WA-05 cycle begins.

---

### WA-06 — Part/Unit Delivered Notification
**Controller:** `markPartDelivered` in `complaint.controller.js`  
**Recipient:** SC  
**Fires:** Immediately when admin clicks Mark as Delivered on a `part_pending` complaint

**Message Content:**
- Complaint ID
- Customer name
- Customer address
- Notification that the part/unit has been dispatched and is on its way
- Admin note (if any)

---

### WA-07 — 23.5h Reminder After Part Received
**Controller:** `utils/whatsappReminder.js` cron job  
**Recipient:** SC  
**Fires:** 23.5 hours after SC taps Mark as Received, if no further action taken  
**Content:** Reminder — you received the part, please complete the job and update status.  
**Stops when:** SC takes any action.

---

## PART 3 — Suppression Rules

### Unregistered SC — Complete WA Block
If `complaint.assignedCentre.isUnregistered === true`:
- **BLOCKED:** WA-01, WA-02, WA-03, WA-04B, WA-05, WA-06, WA-07, and all WA-0X repeaters
- **NOT BLOCKED (still fires):** WA-04 to the customer (customer experience is identical regardless)
- Admin contacts the unregistered SC manually by phone
- Timeline entry is written: "Assigned to Unregistered SC — WA-01 not sent. Admin to contact SC manually."
- Cron job queries must include base filter: `assignedCentre.isUnregistered !== true`

### Unassigned Complaints
- If complaint is created as `unassigned` (admin skipped SC in Step 5): No WA-01 fires at creation
- WA-01 fires later when admin assigns an SC from the detail view or Action Centre

---

## PART 4 — Explicit NOT-SEND Rules

These events deliberately have **zero** WhatsApp triggers:

| Event | Why No WA |
|---|---|
| SC marks Going | Informational status only — no WA by design |
| SC submits Done form | Complaint waits for admin confirmation — no WA at submission |
| SC submits Not Done form | Only the subsequent 23.5h reminder (WA-05) fires, not the submission itself |
| SC submits Part Pending form | Only WA-06 fires later when admin marks Delivered |
| Admin clicks Confirm Done | Complaint closes silently — no WA |
| Bill generated | Billing is a silent admin-side action — no WA |
| Admin marks Delivered, SC hasn't marked Received | No reminder cycle for this gap — only WA-07 fires after SC marks Received |
| Any event for customer beyond WA-04 | WA-04 is the only and final customer message |
| Field: engineerName | Never in any WA message — complaint-specific internal field (Change 6C) |
| Fields: billDate, billPhoto, shopName | Admin-only — never in WA-01 or any WA message |
| Admin records a customer payment entry | No WA fires when admin adds/edits customerPayments entries — purely internal billing action (Change 6A) |
| "Complaint Reopened" / repeat visit complaint | No special WA treatment — reopen concept abandoned (Change 6B). Same plain WA-01 fires as any other new complaint. |

---

## PART 5 — Implementation Location Map

| WA Code | File | Type |
|---|---|---|
| WA-01 | `complaint.controller.js` → `assignComplaint()` | Immediate |
| WA-02, WA-03, WA-0X (post-assign) | `utils/whatsappReminder.js` cron | Scheduled |
| WA-04 | `complaint.controller.js` → `acceptComplaint()` | Immediate |
| WA-04B, WA-0X (post-accept) | `utils/whatsappReminder.js` cron | Scheduled |
| WA-05, WA-0X (post-not-done) | `utils/whatsappReminder.js` cron | Scheduled |
| WA-06 | `complaint.controller.js` → `markPartDelivered()` | Immediate |
| WA-07, WA-0X (post-received) | `utils/whatsappReminder.js` cron | Scheduled |
| Unregistered SC suppression | `complaint.controller.js` → `isUnregisteredSC()` helper | All triggers |
| Cron runner startup | `server.js` on startup | Scheduler |
| API wrapper | `utils/sendWhatsApp.js` | Shared utility |

---

## PART 6 — Infrastructure Requirements

### New Files Needed
- `utils/sendWhatsApp.js` — Meta WhatsApp Cloud API HTTP wrapper
- `utils/whatsappReminder.js` — node-cron based scheduled reminder job

### Modified Files
- `controllers/complaint.controller.js` — inject WA-01, WA-04, WA-06 call points
- `server.js` — start cron job on server boot

### Environment Variables Needed
```
WHATSAPP_TOKEN=<Meta permanent access token>
WHATSAPP_PHONE_ID=<New registered Phone Number ID>
```

### Meta Template Names Required
The following templates must be pre-approved on Meta Dashboard before any code is written.
One approved template is needed per trigger type:
- WA-01: SC assignment notification
- WA-04: Customer acceptance notification
- WA-02 / WA-03 / WA-0X (post-assign): SC assignment reminder
- WA-04B / WA-0X (post-accept): SC post-acceptance reminder
- WA-05 / WA-0X (post-not-done): SC not-done reminder
- WA-06: Part delivered notification
- WA-07 / WA-0X (post-received): SC post-received reminder

---

## PART 7 — Impact of Change 6 (Reopen & Out-of-Warranty) on WhatsApp

### Change 6B — Reopen Abandoned

**What changed:** The reopen flow is completely removed from the system. There is no reopen button, no reopen detection on phone entry in Step 1, no `reopenParentId` field, and no `isReopened` flag.

**Impact on WA-01:**
- The original spec (from GRD v1.1 and SC_Flow v1.1) described WA-01 having two variants: `NEW COMPLAINT ASSIGNED` and `COMPLAINT REOPENED`.
- **This dual-variant behaviour is REMOVED.** Only the `NEW COMPLAINT ASSIGNED` template exists.
- When a customer calls about the same product within 30 days of a previous complaint, the admin registers it as a fresh new complaint. The system fires a plain `WA-01` to the SC — exactly the same as any first-time complaint.
- The admin uses the **Product Timeline** (visible inside the complaint detail view) to see the previous complaint history, and manually decides whether to reduce the SC's preset price for this repeat visit.
- **No separate WA template is needed for repeat/reopen scenarios.**

**Impact on template count:** Instead of 2 WA-01 templates (new + reopen), only 1 WA-01 template is required.

---

### Change 6A — Out-of-Warranty Multi-Stage Payment Tracking

**What changed:** Admin can now record multiple customer payment entries across all stages of the complaint (registration, after SC form submissions, part pending, part delivery). Each entry has an amount, payment route (Paid to Microvison OR Paid to SC directly), a reason label, and a timestamp.

**Impact on WhatsApp:** ZERO.
- Customer payment recording is an admin-only, internal billing action.
- No WA message fires when an admin adds, edits, or deletes a payment entry.
- The `customerPayments` array is never referenced in any WA message content.
- SC sees payment deductions on their **billing page** only (as a read-only view showing `−₹X — Customer payment collected by SC: [reason]`), not via WhatsApp.

**Why this matters for template design:** Do NOT add payment-related variables to any WA template. Payment data is strictly internal between admin and billing system.
