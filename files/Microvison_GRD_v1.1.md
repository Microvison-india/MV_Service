# MICROVISON Service Management System

General Requirements Document (GRD) — Version 1.1

<!-- Page 1 -->

Microvison Service Management System | GRD v1.1 | Page 1 of 27

MICROVISON
Service Management System
General Requirements Document (GRD) — Version 1.1

LED | Coolers · Rajasthan & Punjab Operations

<!-- Page 2 -->

Microvison Service Management System | GRD v1.1 | Page 2 of 27

1. Project Overview
   Microvison is a company dealing in LED lights and coolers, operating across 50+ cities in Rajasthan
   and parts of Punjab. The company manages installation and complaint service requests through a
   network of 400–600 city-based service centres.

Currently, complaints received via phone calls are manually routed to service centres, creating
inefficiencies in tracking, billing, and communication. This system replaces that manual process with a
centralized web-based platform.

1.1 Purpose
• Provide a single platform for registering, assigning, tracking, and resolving service complaints.
• Enable service centres to receive, accept, and update complaint status digitally.
• Automate billing calculations and generate monthly invoices per service centre.
• Notify service centres via WhatsApp on new assignments and reopens.
• Give admin full visibility across all cities, centres, complaints, and payments.

1.2 Business Context
Parameter Detail
Product lines LED lights, Coolers
Operating regions Rajasthan (primary), Punjab (partial)
Cities covered 50+ currently, up to 100+ in 2 years
Service centres 400 now, scaling to 600+
Complaint volume ~50 per day currently, up to 200/day in 2 years
Daily active users 30–40 (staff + service centres)
Peak concurrent users 10–20
Total registered users 100–600 (service centres) + 2 admins

1.3 Platform Scope
• Web application accessible on laptop and desktop browsers.
• Progressive Web App (PWA) — installable on mobile and laptop home screen, no app store
required.
• No native Android/iOS app required at this stage.
• WhatsApp Business API integration for 2 specific notification triggers only.

<!-- Page 3 -->

Microvison Service Management System | GRD v1.1 | Page 3 of 27 2. Roles & Access
2.1 Admin
• 2 admin accounts exist. Both see identical data and have identical permissions.
• Admin accounts are created manually — not through any self-registration flow.
• Admin is the only role that can register complaints, assign service centres, edit complaint details
after SC submission, and view full billing across all centres.
• Admin can also manage presets and approve or reject service centre registrations.

2.2 Service Centre
• Each service centre represents a city-based repair/installation business.
• Each service centre is tagged with the product types they handle: LED only, Cooler only, or Both.
• Service centres self-register. Account is inactive until admin approves.
• After approval, they log in and see only complaints assigned to them.
• They cannot see other service centres' data or billing.
• They can accept or reject incoming assignments, update status, upload proof, fill customer
payment amount (out of warranty), and manage petrol charges within allowed limits.

<!-- Page 4 -->

Microvison Service Management System | GRD v1.1 | Page 4 of 27 3. Authentication & Access Control
3.1 Login
• Single login page for all roles.
• Login via registered email and password.
• JWT-based session management.
• Role detected from token — UI adapts accordingly.

3.2 Service Centre Registration
Service centres register themselves through a public registration form. Fields required:
• Owner / contact person name
• Business name
• Full address (street, city, district, state)
• Phone number 1 (required), Phone number 2 (optional)
• Email 1 (required — used for login), Email 2 (optional — CC for notifications)
• Product capability: LED only / Cooler only / Both
• Password (set at registration)

After submission, the account is Pending. Admin sees it in the Action Centre and approves or rejects.
On approval, the service centre receives an email and can log in. On rejection, they receive a rejection
email.

3.3 Password Reset
• Available for all roles.
• User enters their registered email.
• System sends a 6-digit OTP to that email. OTP valid for 10 minutes.
• On correct OTP entry, user sets a new password.

<!-- Page 5 -->

Microvison Service Management System | GRD v1.1 | Page 5 of 27 4. Master Data
4.1 City & District Master List
A pre-seeded list of all cities and districts in Rajasthan and Punjab is stored in the database. Used
across the system wherever city or district selection is needed.
• City selection always auto-fills district and state.
• No free-text city entry anywhere — all city fields are dropdowns from this master list.
• Admin can view the list (read-only in system).

4.2 Presets
Presets are standard charge packages used when registering a complaint. Each preset has:
• Type: installation_led / complaint_led / complaint_cooler
• Name (e.g. "Standard LED Installation", "Cooler Repair - Basic")
• Price (fixed amount in rupees)
• Status: active or inactive

Admin can create, edit, delete, or toggle active/inactive status of presets at any time. Only active
presets appear in the complaint registration form. When a preset is selected for a complaint, the price is
snapshotted and stored permanently — future edits to the preset do not affect existing complaints.
Presets apply only to in-warranty complaints. For out-of-warranty complaints, no preset is selected or
charged from Microvison's side.

<!-- Page 6 -->

Microvison Service Management System | GRD v1.1 | Page 6 of 27 5. Products & Service Centre Capability
5.1 Product Types
Product Allowed Complaint Types Notes
LED Installation OR Complaint Only product that allows
installation type
Cooler Complaint only No installation type available
Both (LED + Cooler) Installation or Complaint for
LED; Complaint only for Cooler
Used when a single visit covers
both products

'Both' is a valid product selection on the complaint registration form. It means this single complaint/visit
covers both LED and Cooler. The complaint type for each product is specified separately within the form.

5.2 Service Centre Product Capability
Each service centre declares what product types they can service at registration time:
• LED only — can only be assigned LED installation or LED complaint requests.
• Cooler only — can only be assigned Cooler complaint requests.
• Both — can be assigned any complaint type including combined LED + Cooler complaints.

This capability tag is used during complaint assignment:
• If a complaint is for LED only → system shows LED-only and Both-capable centres in the city.
• If a complaint is for Cooler only → system shows Cooler-only and Both-capable centres.
• If a complaint is for Both (LED + Cooler) → system shows only Both-capable centres.
• Admin sees this filtered list when assigning — capability mismatch centres are hidden or greyed
out.

<!-- Page 7 -->

6. Complaint Registration
Only admin can register complaints. The form is divided into 4 steps.

6.0 Draft System
• The system supports multiple concurrent drafts per admin.
• Progress is auto-saved every 2 seconds into the database.
• On navigating to the registration page, if drafts exist, a Draft Selection screen allows the admin to Resume, Delete, or Start Fresh.
• Drafts are strictly suspended during pre-filled flows (like Reopen or Link Product) to prevent overwriting.
• On successful complaint submission, the associated draft is permanently deleted.

6.1 Step 1 — Customer Information
Field Type Required Notes
Customer name Text Yes  
Phone number 1 Number Yes Primary contact
Phone number 2 Number No Alternate contact
Local address Free text Yes Street/locality/area
City Dropdown Yes From master list
District Auto-filled Yes Based on city selection
State Auto-filled Yes Based on city selection

When admin enters Phone number 1, the system automatically checks if this customer has an open or
recently closed complaint (within 30 days) for the same product and same complaint type. If found, a reopen
option is shown as a banner. Admin can choose to reopen or continue creating a new complaint.

6.2 Step 2 — Product & Type
Admin selects one of three product options:
• LED — then selects type: Installation or Complaint
• Cooler — type is auto-set to Complaint (no installation option for coolers)
• Both (LED + Cooler) — admin selects type for LED (installation or complaint); Cooler type is auto-
set to Complaint

Warranty selection (applies to the whole complaint):
• In Warranty — Microvison pays the service centre for the service rendered.
• Out of Warranty — customer pays the service centre directly. Microvison does not pay for the base
service.

Warranty status is a single flag for the whole complaint, even if it covers both products.

6.3 Step 3 — Charges & Media
In Warranty — Preset selection
• Admin selects one active preset from the filtered list (filtered by product + type).
• For 'Both' complaints, admin selects one preset that best represents the combined service.
• Preset price is shown and locked permanently after complaint creation.
• Installation complaints use installation_led presets — price is fully fixed.
• Complaint type presets are a starting base — actual bill may include petrol and approved extras.

<!-- Page 8 -->

Microvison Service Management System | GRD v1.1 | Page 8 of 27

Out of Warranty — No preset
• No preset is shown or selected for out-of-warranty complaints.
• No petrol charge is applied from Microvison's side.
• Admin can optionally add extra charges (label + amount) if Microvison is contributing something
specific (e.g. a spare part cost Microvison is covering).
• If no extras are added, Microvison generates no bill for this complaint — it is tracking only.
• If extras are added, a bill is generated for those extras only.

Petrol / diesel charge (in warranty only)
• Admin enters an estimated petrol/diesel amount at registration (optional but recommended).
• Editable up to 3 times total across all parties in this fixed order:
◦ Edit 1 — Admin sets estimate at registration.
◦ Edit 2 — Service centre adjusts to actual amount after the visit.
◦ Edit 3 — Admin can override if the final amount seems incorrect.
• After the 3rd edit, the petrol field is permanently locked.
• All 3 values are stored separately for full audit trail.

Extra charges (both warranty types)
• Admin can add one or more extra charge line items at registration (label + amount).
• Service centre can also request additional charges after the visit.
• All SC-requested extra charges must be approved by admin before inclusion in the bill.
• Rejected extra charges are recorded but not included in billing.

Notes and media
• Text notes: free text, optional.
• Voice note: optional, max 60 seconds, uploaded as audio file.
• Photos: optional, maximum 2 images at registration stage.

6.4 Step 4 — Assign Service Centre
• System filters service centres by customer's city, then district.
• System further filters by product capability matching (see Section 5.2).
• Each matching centre is shown with current load stats (assigned, pending, done this month).
• Admin selects one service centre and submits.
• On submission: complaint is created, unique ID is generated, WhatsApp message is sent to the
selected service centre.

<!-- Page 9 -->

Microvison Service Management System | GRD v1.1 | Page 9 of 27 7. Complaint ID & Status Lifecycle
7.1 Unique Complaint ID
MV-YYYY-XXXXX
• MV = Microvison prefix
• YYYY = year of creation
• XXXXX = auto-incremented 5-digit number, resets each year
• Reopened complaints get their own new ID, with a reference to the parent complaint ID stored
internally.

7.2 Status Flow
Status Set By Meaning
new System Complaint created, not yet
assigned
assigned Admin Admin has assigned a service
centre
accepted Service Centre SC accepted the assignment
rejected_by_sc Service Centre SC rejected — admin must
reassign
going Service Centre SC marked they are on the way
(optional, skippable)
done Service Centre Work completed successfully
not_done Service Centre Visit happened but work could
not be completed
part_pending Service Centre Part unavailable — follow-up
needed
replacement Service Centre Product needs replacement —
escalation required
reopened Admin Same issue recurred within 30
days — complaint reopened
closed Admin Admin confirmed done —
complaint locked and bill
generated

Bill is generated only when admin confirms done (status = closed). No bill is generated for not_done,
part_pending, or replacement until the issue is fully resolved.

7.3 Status Transition Rules
• new → assigned: admin only.
• assigned → accepted / rejected_by_sc: assigned service centre only.
• rejected_by_sc → assigned: admin reassigns to a different centre.

<!-- Page 10 -->

Microvison Service Management System | GRD v1.1 | Page 10 of 27
• accepted → going: optional, skippable, service centre only.
• accepted / going → done / not_done / part_pending / replacement: service centre, after uploading
proof photos.
• done → closed: admin reviews, optionally edits, then confirms. Bill is generated at this point.
• done / not_done → reopened: only if reopen eligibility conditions are met (see Section 8).

<!-- Page 11 -->

Microvison Service Management System | GRD v1.1 | Page 11 of 27 8. Complaint Reopen Logic
A complaint can be reopened when all of the following are true:
• Same customer (matched by phone number 1).
• Same product (LED / Cooler / Both).
• Same complaint type (installation / complaint).
• Original complaint was created within the last 30 days.
• Original complaint status is done or not_done.

If the customer calls about a different problem on the same product, a new complaint is always created.
There is no automatic reopen — admin makes the decision from the banner shown during complaint
registration.

When a complaint is reopened:
• A new complaint record is created with a new MV-YYYY-XXXXX ID.
• The new record stores a reference to the original complaint ID.
• Admin adds reopen notes (text, required) and optional photos.
• A WhatsApp message is sent to the service centre with REOPENED label.
• The reopened complaint goes through the same full workflow from assigned onwards.
• Billing for the reopened complaint is separate from the original.

<!-- Page 12 -->

Microvison Service Management System | GRD v1.1 | Page 12 of 27 9. Admin Edit After Service Centre Submission
After a service centre fills in the complaint result (status, proof photos, petrol actual, extra charge
requests, notes), the complaint appears in the admin Action Centre for review.

Before confirming done and generating a bill, admin has the ability to edit the following fields:
• Petrol amount (if edit count allows — i.e. it is admin's turn, edit #3).
• Approve or reject extra charge requests submitted by the SC.
• Add admin-side extra charges if needed.
• Add or update admin notes on the complaint.
• Revert status back to accepted (if admin disputes the done marking) with a note to the SC.

After admin is satisfied with all details, they confirm done. This action:
• Locks the complaint status as closed.
• Generates and locks the bill.
• No further edits are possible after this point.

<!-- Page 13 -->

Microvison Service Management System | GRD v1.1 | Page 13 of 27 10. Service Centre Portal
After login, the service centre sees their dashboard with 3 tabs.

10.1 Tab 1 — New Requests
Lists all complaints assigned to this service centre that have not yet been accepted or rejected.
• Each card shows: complaint ID, customer local address, city, product, complaint type, warranty
status, preset name and price (in-warranty only), admin notes, voice note player, admin photos.
• Two actions: Accept or Reject.
• On Accept: status moves to accepted.
• On Reject: status moves to rejected_by_sc. Goes back to admin for reassignment.

10.2 Tab 2 — My Complaints
Lists all complaints assigned to this service centre across all statuses.
• Filters: status, product type, complaint type, warranty status, date range.
• Ordered by most recently assigned first.

Clicking a complaint opens the detail view. Actions available:
• Mark as Going (optional, skippable) — when status is accepted.
• Upload proof photos (0 to 5 images, mandatory before marking final status). Includes warranty
slips, work-done evidence, site photos.
• Mark final status: Done / Not Done / Part Pending / Replacement.
• Edit petrol actual amount — available only if it is SC's turn (edit #2, in-warranty complaints only).
• Request extra charges — label and amount, sent to admin for approval.
• Add extra notes (text, optional).

Out of warranty — customer payment field
• For out-of-warranty complaints, after marking status (done / not done), a single field appears:
◦ "Amount collected from customer" — filled by service centre, single number field.
◦ This is the total cash or UPI amount the customer paid the service centre directly.
◦ This field is for Microvison's record only — it does not appear in any Microvison invoice.
◦ This field is required before the SC can submit their final status update on out-of-warranty
complaints.

10.3 Tab 3 — Billing
• Lists all complaints that have a bill generated for this service centre (in-warranty, closed
complaints with preset or approved extras).
• Per-complaint breakdown: preset amount, petrol final, approved extras, total.
• Monthly invoice view: auto-calculated sum of all complaint bills in a given month.
• Filter by month and year.

<!-- Page 14 -->

Microvison Service Management System | GRD v1.1 | Page 14 of 27
Out-of-warranty complaints with no admin extras do not appear in the billing tab — they have no bill from
Microvison's side. Out-of-warranty complaints where admin added extras do appear, showing only the extra
charges billed.

<!-- Page 15 -->

Microvison Service Management System | GRD v1.1 | Page 15 of 27 11. Admin Portal
Admin dashboard has 4 main tabs plus a settings section for presets.

11.1 Tab 1 — Action Centre
The admin's notification and task hub. Shows items requiring attention, ordered newest first. Badge
count on tab for pending items.

Items shown in Action Centre

• Pending service centre registration requests — Approve or Reject.
• Complaints marked Done by SC — admin reviews, optionally edits, then confirms (generates bill)
or disputes (reverts to accepted).
• Complaints marked Not Done / Part Pending / Replacement — shown for awareness and follow-
up.
• Complaints rejected by a service centre — admin must reassign.
• Extra charge requests from service centres — Approve or Reject each line item.

11.2 Tab 2 — Service Centres
Full list of all registered service centres (approved, pending, and rejected).

Search and filter options:
• Search by business name, owner name, city, district, phone number.
• Filter by status: active, pending, rejected.
• Filter by product capability: LED only, Cooler only, Both.

Each card shows: name, city, phone, product capability, live stats (total assigned, currently pending,
completed this month, rejected count).

Clicking a service centre opens detail view showing full registration info (editable by admin), all
complaints assigned to them, and option to deactivate.

11.3 Tab 3 — All Complaints
Complete list of every complaint in the system, ordered by creation date (newest first).

Search options:
• Customer name, customer phone number (1 or 2), complaint ID.

Filter options:
• City, district, state
• Product type (LED, Cooler, Both)

<!-- Page 16 -->

Microvison Service Management System | GRD v1.1 | Page 16 of 27
• Complaint type (installation, complaint)
• Warranty status (in warranty, out of warranty)
• Status (any single or multiple statuses)
• Assigned service centre
• Service centre product capability
• Date range (created between X and Y)
• Reopened complaints only (toggle)

Each row: complaint ID, customer name, city, product, type, warranty status, current status, assigned
centre, creation date.

Clicking opens the full complaint detail view. Admin actions from this view:
• Reassign to a different service centre (when status is new, assigned, or rejected_by_sc).
• Edit petrol, approve/reject extras, add admin notes (when status is done, before confirming).
• Confirm done → generates and locks bill.
• Dispute done → reverts to accepted with a note to SC.
• Initiate reopen (if eligibility conditions are met).

11.4 Tab 4 — Billing
Billing view across all service centres and all complaints.

Filters: same as complaints tab, plus month/year selection and service centre name.

Two views:
• Per-complaint billing: each complaint with full charge breakdown (preset + petrol + approved
extras = total). Out-of-warranty complaints show only extras if any; also shows customer payment
amount (what SC collected) as a separate read-only field.
• Monthly invoice per centre: auto-calculated rollup of all Microvison-side bills for a centre in a given
month. Shows number of complaints and total amount Microvison owes the centre.

The customer payment amount (out-of-warranty) is visible in the billing view for record purposes but is never
included in Microvison's invoice to the service centre.

11.5 Presets Management
• View all presets grouped by type.
• Create new preset — type, name, price.
• Edit existing preset — name or price (does not affect already-created complaints).
• Delete preset — only allowed if no complaints are currently using it.
• Toggle active/inactive — inactive presets do not appear in complaint registration form.

<!-- Page 17 -->

Microvison Service Management System | GRD v1.1 | Page 17 of 27 12. Complaint Detail View
Shared by admin and service centre. Available actions differ by role.

Section Fields Displayed
Complaint header Complaint ID, creation date, current status,
reopened flag, parent complaint ID (if reopen)
Customer Name, Phone 1, Phone 2, local address, city,
district, state
Product Product selection (LED/Cooler/Both), complaint
type, warranty status
Preset & base charges Preset name and price — shown only for in-
warranty complaints. Locked after creation.
Petrol charges Admin estimate, SC actual, Admin override, edit
count, locked flag. In-warranty only.
Extra charges All line items — label, amount, requested by,
status (pending / approved / rejected)
Notes & media Admin text notes, voice note player, admin
registration photos
SC proof media Proof photos uploaded by SC after visit
Customer payment Amount collected from customer — shown for
out-of-warranty complaints only. Read-only for
admin.
Reopen details Reopen notes and photos (if this complaint is a
reopen)
Status timeline Every status change with timestamp, who
changed it, and any note at time of change
Bill summary Shown only when status is closed — full
breakdown and total. For out-of-warranty, shows
extras only (if any).

<!-- Page 18 -->

Microvison Service Management System | GRD v1.1 | Page 18 of 27 13. Billing Logic
13.1 In Warranty — Bill Components
Component Source Editable After Complaint
Creation?
Preset base price Selected preset, snapshotted at
creation
No — locked permanently
Petrol / diesel 3-round edit process (admin →
SC → admin)
Locked after 3rd edit
Approved extra charges SC requests approved by
admin, or admin-added
No — locked after approval
Total Preset + petrol + approved
extras
Auto-calculated

13.2 Out of Warranty — Bill Components
Component Source Notes
Preset None Not applicable — Microvison
does not pay base service
charge
Petrol None Not applicable — Microvison
does not cover petrol for out-of-
warranty
Admin extras (optional) Admin adds if Microvison is
contributing a specific item
If added, a bill is generated for
these extras only
Total (Microvison side) Admin extras only (if any) Zero if no extras added
Customer payment (record only) Filled by service centre — what
customer paid them directly
Never included in Microvison
invoice. For records only.

13.3 When Bills Are Generated
Scenario Bill Generated?
In warranty — admin confirms done (status =
closed)
Yes — full bill (preset + petrol + approved extras)
Out of warranty — no admin extras — admin
confirms done
No bill — tracking record only
Out of warranty — admin extras present — admin
confirms done
Yes — bill for extras only
Status is not_done No
Status is part_pending or replacement No — bill generated only after fully resolved and
closed
Reopened complaint — admin confirms done Yes — separate bill, separate entry, references
original

<!-- Page 19 -->

Microvison Service Management System | GRD v1.1 | Page 19 of 27

13.4 Monthly Invoice
• Auto-calculated — sum of all Microvison-side complaint bills for a given service centre in a
calendar month.
• Always a live calculation — no separate generation step.
• Admin can view invoices for any centre, any month.
• Service centre can view only their own invoices.
• Customer payment amounts are visible in the admin billing view for reference but are excluded
from the monthly invoice total.

<!-- Page 20 -->

Microvison Service Management System | GRD v1.1 | Page 20 of 27 14. WhatsApp Notifications
WhatsApp Business API is used for 2 notification triggers only. All other updates are in-system.

14.1 Trigger 1 — New Complaint Assigned
Sent to the service centre's registered phone number immediately after admin assigns the complaint.

Message content

• Label: NEW COMPLAINT ASSIGNED
• Complaint ID
• Customer name and Phone 1
• Customer local address, city
• Product and complaint type
• Warranty status
• Preset name and price (in-warranty only)
• Admin petrol estimate (if entered, in-warranty only)
• Admin notes (if any)
• Portal login URL

14.2 Trigger 2 — Complaint Reopened
Sent to the service centre assigned to the reopened complaint, immediately after admin creates the
reopen.
• Label changed to: COMPLAINT REOPENED
• Reference to original complaint ID shown.
• Admin reopen notes included.
• All other fields same as Trigger 1.

WhatsApp provider (Twilio, WATI, or AiSensy) to be finalized separately. Message content remains the same
across all providers — only API credentials change.

<!-- Page 21 -->

Microvison Service Management System | GRD v1.1 | Page 21 of 27 15. Progressive Web App (PWA)
• The web application must be installable as a PWA on both mobile phones and laptops.
• On Android/Chrome: users see an 'Add to Home Screen' prompt. App opens with the Microvison
icon, no browser chrome visible.
• On laptop/Chrome: users see an install icon in the address bar.
• No separate app store submission or native code required.
• When the main website is updated and redeployed, the PWA auto-updates silently in the
background on the user's next visit.
• Requires: manifest.json (app name, icons, theme colour) and a service worker for caching and
update handling.
• Offline behaviour: app shell (login page, dashboard layout) loads offline. Data-dependent screens
require internet connection.

<!-- Page 22 -->

Microvison Service Management System | GRD v1.1 | Page 22 of 27 16. Edge Cases & Business Rules
Scenario Behaviour
SC rejects a complaint Status → rejected_by_sc. Appears in admin
Action Centre. Admin must reassign to a different
centre.
Admin tries to assign to same SC that rejected System warns but does not block. Admin override
allowed.
Complaint marked done, admin disputes Admin reverts status back to accepted. SC is
expected to re-update. Note added to timeline.
Same customer, different product Always a new complaint — reopen logic does not
apply across different products.
Same product, different complaint type Always a new complaint (e.g. LED installation is
separate from LED complaint).
Preset deleted after complaint creation Preset price is snapshotted — deletion does not
affect existing complaints.
SC deactivated mid-complaint Existing assigned complaints are not removed.
Admin should manually reassign.
Petrol field left blank (in-warranty) Valid — bill generated without petrol. Total =
preset + approved extras only.
Extra charge rejected by admin Stored as rejected — visible in complaint history
but not included in bill.
Bill generated, then extra charge approved Bill is recalculated to include the newly approved
charge.
Out of warranty, no extras, SC fills customer
payment
Complaint closes as tracking record only. No
Microvison bill generated.
Out of warranty, SC does not fill customer
payment field
System blocks final status submission until the
field is filled.
Both product complaint assigned to LED-only SC System prevents this — only Both-capable
centres are shown for Both complaints.
Voice note exceeds 60 seconds System rejects the file and shows an error. User
must re-record.
SC uploads more than 5 proof photos System allows max 5. Error shown if 6th is
attempted.

<!-- Page 23 -->

Microvison Service Management System | GRD v1.1 | Page 23 of 27 17. Data Models Summary
users
Field Type Notes
\_id ObjectId Auto-generated
name String Full name
email String Unique, used for login
passwordHash String Bcrypt hashed
role Enum admin / service_centre
status Enum active / pending / rejected
createdAt Date

serviceCentres
Field Type Notes
\_id ObjectId  
userId Ref: users Linked login account
ownerName String  
businessName String  
phone1 String Primary
phone2 String Optional
email1 String Primary / login email
email2 String Optional CC
fullAddress String Street/locality
city String From master list
district String Auto from city
state String Auto from city
productCapability Enum led_only / cooler_only / both
status Enum active / pending / rejected
createdAt Date

complaints
Field Type Notes
\_id ObjectId  
complaintId String MV-YYYY-XXXXX
customerName String

<!-- Page 24 -->

Microvison Service Management System | GRD v1.1 | Page 24 of 27
Field Type Notes
phone1 String  
phone2 String Optional
localAddress String  
city / district / state String From master list
product Enum led / cooler / both
complaintType Enum installation / complaint
warrantyStatus Enum in_warranty / out_of_warranty
presetId Ref: presets Null for out-of-warranty
presetPrice Number Snapshotted at creation. Null for
out-of-warranty.
petrolAdmin Number Edit 1. In-warranty only.
petrolSC Number Edit 2. In-warranty only.
petrolFinal Number Edit 3 admin override. In-
warranty only.
petrolEditCount Number 0–3. In-warranty only.
petrolLocked Boolean True after 3rd edit.
extraCharges Array [{label, amount, requestedBy,
status, approvedAt}]
customerPaymentAmount Number Out-of-warranty only. Filled by
SC. Record only.
notes String Admin text notes
voiceNoteUrl String Cloudinary URL
adminPhotos Array Max 2 Cloudinary URLs
proofPhotos Array Max 5 Cloudinary URLs — SC
uploads
assignedCentreId Ref: serviceCentres  
assignedAt Date  
status Enum See Section 7.2
isReopened Boolean  
reopenedAt Date  
reopenParentId Ref: complaints If this is a reopen
reopenNotes String Required on reopen
reopenPhotos Array Optional
billGenerated Boolean  
billLockedAt Date  
whatsappSent Boolean  
createdBy Ref: users Admin who created
createdAt / updatedAt Date

<!-- Page 25 -->

Microvison Service Management System | GRD v1.1 | Page 25 of 27

Other collections
Collection Purpose
cities Master list of cities with district and state —
seeded once for Rajasthan + Punjab
presets Charge packages — type, name, price, active
status
complaintUpdates Audit log — every status change with timestamp,
role, user, note
invoices Monthly invoice records per service centre —
auto-calculated, month+year keyed
otpTokens Short-lived OTP records for password reset —
email, code, expiry

<!-- Page 26 -->

Microvison Service Management System | GRD v1.1 | Page 26 of 27 18. Recommended Build Order
Phase Items
1 — Foundation DB setup, all schemas, city master data seed
(Rajasthan + Punjab)
2 — Auth Login, JWT middleware, RBAC, SC registration
with capability field, admin approval, OTP
password reset
3 — Presets Admin preset CRUD — create, edit, delete, toggle
active
4 — Complaint registration Full 4-step form, duplicate/reopen check, product
capability filtering in SC assignment, WhatsApp
trigger on submit
5 — SC portal New requests tab, accept/reject, my complaints
tab, status updates, proof upload, petrol edit,
extra charge requests, customer payment field for
out-of-warranty
6 — Admin action centre SC registration approvals, done confirmations,
extra charge approvals, reassignment handling
7 — Admin complaints tab Full list, all search and filter options including
capability filter, complaint detail view with admin
edit and confirm actions
8 — Billing Bill generation logic, in-warranty vs out-of-
warranty split, per-complaint breakdown, monthly
invoice calculation, billing tabs for both roles
9 — Admin service centres tab SC list with capability filter, search, stats, detail
view, deactivate
10 — Reopen flow Reopen detection on phone entry, reopen form,
second WhatsApp trigger
11 — PWA manifest.json, service worker, offline shell, auto-
update on deploy
12 — WhatsApp provider Connect chosen provider (Twilio / WATI /
AiSensy), test both triggers
13 — QA & deploy End-to-end testing, Railway backend deploy,
Vercel frontend deploy, domain and email config

<!-- Page 27 -->

Microvison Service Management System | GRD v1.1 | Page 27 of 27 19. Out of Scope
• AC Stabilizers — not a product line in this system.
• Native Android or iOS app — PWA covers mobile needs.
• Customer-facing portal — complaints are registered and managed internally by admin only.
• Real-time push notifications via WebSocket — Action Centre polling is sufficient at this scale.
• Payment gateway integration — billing is tracked internally, no online payment collection.
• SMS notifications — WhatsApp covers communication needs.
• Multi-language support.
• Reporting or analytics dashboards beyond the billing and complaints tabs described.
• Integration with external CRM or ERP systems.
• Automated complaint assignment — admin always assigns manually.

End of Document · Microvison GRD v1.1
