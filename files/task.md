c kl vje vkj ekjv ko k ver ve vov k

rn this entire flow:\*\*

- **Billing Trigger:** A bill is generated **ONLY** when the complaint reaches a final Done status and the admin confirms it. Never before.
- **Cycles:** A complaint can cycle through `Not Done` and `Part Pending` multiple times before reaching `Done`. Each cycle is recorded in the complaint timeline.
- **Done:** Done can only be confirmed once — it is the permanent final closure of a complaint.
- **Replacement:** Replacement is a sub-case of `Part Pending`. The admin delivers a full replacement unit instead of a single part. The flow is identical.
- **WhatsApp Recipients:** WhatsApp messages are sent to the SC for assignment, reminders, and part/replacement delivery. WhatsApp is sent to the customer only once — when the SC accepts the complaint.
- **Billing Details:** SC fills all billing details (petrol, extras, visits) at the time of marking Done. Admin reviews, can edit, then confirms. The bill locks permanently on admin confirmation.

---

### 2. Admin Assigns Complaint to SC

Admin registers the complaint and assigns it to a Service Centre. This is the starting point of the SC flow.

#### WhatsApp Trigger WA-01 — Sent to SC immediately on assignment OR reopen

- **Recipient:** SC's registered WhatsApp number
- **Timing:** Immediately when admin clicks Assign
- **Content:** Complaint ID, Customer name, Phone, Full address (local address + city + district), Product type (LED/Cooler), Complaint type (Installation/Complaint), Warranty status (In Warranty / Out of Warranty), Admin notes (if any), Portal login URL, `REOPENED` flag + original Complaint ID if this is a reopen.

#### 2.1 No Action Reminder System — SC has not accepted or rejected

Once assigned, if the SC takes no action the system sends automated WhatsApp reminders:

| Time Since Assignment          | Trigger                                                              | Recipient |
| :----------------------------- | :------------------------------------------------------------------- | :-------- |
| **24 hours** — no action       | **WA-02:** Reminder — you have a new complaint pending your response | SC        |
| **48 hours** — still no action | **WA-03:** Reminder (repeat)                                         | SC        |
| **Every 2 days** after that    | **WA-0X:** Repeat reminder every 2 days until SC acts                | SC        |

_The reminder cycle stops the moment SC either Accepts or Rejects. There is no auto-rejection or auto-escalation — admin must manually reassign if SC keeps ignoring._

---

### 3. SC Rejects the Complaint

SC taps Reject in their portal. Complaint status moves to `rejected_by_sc`.

- Admin sees this in the Action Centre immediately (badge count updates).
- Admin reviews and reassigns to a different SC (or the same SC again — no block).
- On reassignment, the full cycle from Section 2 restarts — `WA-01` fires again to the newly assigned SC.
- The rejection is recorded in the complaint timeline (who rejected, when, and any rejection notes).

---

### 4. SC Accepts the Complaint

SC taps Accept. Complaint status moves to `accepted`.

#### WhatsApp Trigger WA-04 — Sent to Customer immediately on SC acceptance

- **Recipient:** Customer's phone1 (and phone2 if exists)
- **Timing:** Immediately when SC taps Accept
- **Content:** Complaint ID (customer's reference number), Product type (LED/Cooler), Complaint type (Installation/Complaint), SC business name, SC phone number, Acknowledgment message that SC has accepted and will visit soon.

#### 4.1 No Action After Acceptance — Reminder System

Once SC accepts the complaint, if they take no further action (do not mark Going, Done, Not Done, or Part Pending), the system sends automated WhatsApp reminders:

| Time Since Acceptance                     | Trigger                                                                                                                     | Recipient |
| :---------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :-------- |
| **24 hours** — no action after acceptance | **WA-04B:** Reminder — you have accepted a complaint but have not updated its status. Please visit the customer and update. | SC        |
| **Every 2 days** after that               | **WA-0X:** Repeat every 2 days until SC takes any action (Going, Done, Not Done, or Part Pending)                           | SC        |

_Reminder cycle stops the moment SC takes any action on the complaint — marks Going, Done, Not Done, or Part Pending. Going alone counts as an action and resets/stops the timer._

#### 4.2 SC Marks Going (Optional)

- SC can optionally tap _Mark as Going_ when they are travelling to the customer.
- This is informational only — no WhatsApp trigger, no form, just a status update.
- Status moves to `going`. No blocking — SC can skip this entirely and go straight to a conclusion status.

---

### 5. SC Marks Done

SC visited the customer, completed the work, and is marking the complaint as resolved.

#### 5.1 Done Form — Fields

Form slides open when SC taps _Mark as Done_:

| Field                       | Required?              | Details                                                                                                     |
| :-------------------------- | :--------------------- | :---------------------------------------------------------------------------------------------------------- |
| **Photos**                  | Yes (Min 1, max 5)     | Proof of work completed — site photos, installation proof, repair evidence.                                 |
| **Audio note**              | Optional               | Max 2 minutes. SC's verbal description of work done.                                                        |
| **Text notes**              | Optional               | Additional written notes about the visit.                                                                   |
| **Petrol / travel charges** | Optional (recommended) | Amount field + distance traveled (km) + number of visits total. Subject to 3-lock system (see Section 5.2). |
| **Extra charges**           | Optional               | Multiple line items allowed. Each has: description/reason + amount. SC can add as many as needed.           |

#### 5.2 Petrol 3-Lock System

- **Edit 1:** Admin sets estimate at complaint registration time.
- **Edit 2:** SC fills actual petrol amount + distance + visits in the Done form.
- **Edit 3:** Admin can override the SC's amount if too high.
- After **Edit 3**, the petrol field is permanently locked. All 3 values are stored separately for auditing.

_For complaints that went through multiple Not Done cycles before Done: SC fills OVERALL totals in this single Done form — total petrol for ALL visits combined, total distance across all visits, total visit count. System does not ask per-visit separately._

#### 5.3 After SC Submits Done Form

- Complaint status moves to `done` (pending admin confirmation).
- Admin sees this in the Action Centre.
- No WhatsApp is sent to anyone at this stage.

#### 5.4 Admin Reviews and Confirms Done

Admin opens the complaint from the Action Centre. Before confirming, the admin can:

- Edit petrol amount (**Edit 3** — if SC's amount seems too high). This locks the petrol field permanently.
- Approve or reject individual extra charge line items submitted by SC.
- Add admin-side extra charges if needed.
- Add admin notes.
- Edit any other complaint detail before locking.

Once satisfied, the admin clicks **Confirm Done**. This action:

- Moves complaint status to `closed` (permanent — cannot be changed after this).
- Generates and locks the bill based on: _Preset price (in-warranty only) + Petrol final + All approved extra charges_.
- The bill is now visible in the Billing tab for both admin and SC.
- No WhatsApp is sent after Done confirmation.

_If admin disputes the SC's work — admin clicks **Dispute** instead of Confirm. Complaint reverts to `accepted`. SC must re-submit. A note is attached explaining why it was disputed._

---

### 6. SC Marks Not Done

SC visited the customer but could not complete the work (customer not home, access issue, scope mismatch, etc.). This is **NOT** a closure — the complaint remains open and the SC is expected to return.

#### 6.1 Not Done Form — Fields

Form slides open when SC taps _Mark as Not Done_:
