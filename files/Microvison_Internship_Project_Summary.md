# Microvison Service — Comprehensive Project Guide & Internship Showcase

## 🏢 1. Company Background & Problem Statement

### What is Microvison Service?
**Microvison Service** is an Indian consumer electronics brand that sells and services popular home appliances:
- 📺 **LED TVs** (Smart & Standard Televisions)
- ❄️ **Air Coolers** (Residential & Commercial Air Coolers)
- 🧺 **Washing Machines** (Semi-Automatic & Fully-Automatic Washing Machines)
- ⚡ **Induction Stoves** (Electric Induction Cooktops)

### The Business Challenge Before This Platform
When customers purchase these appliances and experience an issue (e.g. screen display error, motor failure, heating issue), they contact customer support. 

Before this system was built, the company managed service requests manually:
- Customer complaints were noted down on paper or basic spreadsheets.
- Finding local repair shops (Service Centres) in distant districts was slow and error-prone.
- Technicians had no portal to update repair status or request spare parts.
- Calculating technician travel fees, extra charges, and customer payments was confusing.
- Tracking whether a customer's product was still under warranty required manually digging through physical purchase bills.

### The Solution I Built
As a **Software Engineering Intern**, I built an **end-to-end, enterprise-grade digital platform** that automates the complete service lifecycle from the moment a customer calls support to the final financial settlement with the local repair shop.

---

## 👥 2. System Users & User Roles

The platform connects three primary user groups into a single real-time workflow:

```
┌─────────────────┐       WhatsApp Alerts & Tracking       ┌────────────────────────┐
│   📱 Customer   │ <────────────────────────────────────> │  Microvison Enterprise │
└─────────────────┘                                        │        Platform        │
┌─────────────────┐        Full Support Portal & Admin     │                        │
│ 🏢 Support Admin│ <────────────────────────────────────> │                        │
└─────────────────┘                                        └───────────┬────────────┘
                                                                       │
┌─────────────────────────────────┐   SC Mobile Portal & WhatsApp      │
│ 🛠️ Service Centre / Technician   │ <──────────────────────────────────┘
└─────────────────────────────────┘
```

1. **🏢 Central Support Administrators:**
   - Log customer complaints via a 5-step guided wizard.
   - Verify purchase bills and warranty dates.
   - Assign complaints to the best local Service Centre based on location and product capability.
   - Approve spare part dispatch requests.
   - Review closed jobs, adjust money allowances (petrol, extras, customer cash), and reconcile monthly billing payments.

2. **🛠️ Service Centres (Local Repair Shops & Technicians):**
   - Operating across **100+ authorized repair hubs**.
   - Receive instant job notifications via WhatsApp.
   - Accept or reject assigned service tickets via their mobile portal.
   - Update job status (`Going to Customer` → `Part Pending` → `Work Completed`).
   - Request replacement spare parts from Microvison's central warehouse.
   - Track their monthly earnings and payouts read-only on their dashboard.

3. **📱 Customers:**
   - Receive instant WhatsApp messages containing the assigned technician's name, phone number, and repair tracking link.
   - Get status notifications when spare parts are shipped or when the job is marked complete.

---

## 🌍 3. Scale, Operations & Real-World Impact

- **Network Scale:** Active network of **100+ authorized Service Centres** and field technicians.
- **Geographic Footprint:** Covers **5 major Indian states**:
  - 🌄 **Rajasthan** (41 districts)
  - 🌾 **Punjab** (23 districts)
  - 🚜 **Haryana** (22 districts)
  - 🏭 **Gujarat** (33 districts)
  - 🏙️ **Maharashtra** (36 districts)
  - *Spanning over 150+ verified cities and districts.*
- **Daily Usage:** Actively used in production by support admins and 100+ service centre owners every single day on mobile phones (PWA) and desktop computers.

---

## ⚙️ 4. Key Modules & Technical Features Explained Simply

### 1. Smart Warranty Engine & Lifetime Product Tracking
- **Product Warranty Policies:**
  - LED TV: **3 Years** Warranty (Installation + Repair Complaints)
  - Air Cooler: **3 Years** Warranty (Repair Complaints Only — Installation Blocked)
  - Washing Machine: **2 Years** Warranty (Repair Complaints Only — Installation Blocked)
  - Induction Stove: **1 Year** Warranty (Repair Complaints Only — Installation Blocked)
- **Automatic Warranty Verification:** Admins enter the purchase invoice date, and the system automatically calculates the exact expiry date.
- **Warranty Statuses:** 
  - `In-Warranty` (Microvison covers repair & part costs)
  - `Out-of-Warranty` (Customer pays for service)
  - `Manual Overrides` & `Revoked Warranty` (Admin logs a mandatory reason, e.g., physical damage).
- **Lifetime Tracking IDs:** Generates unique serial tracking numbers for every product:
  - `PL000124` → LED TV
  - `PC000089` → Air Cooler
  - `PW000042` → Washing Machine
  - `PI000015` → Induction Stove

---

### 2. 5-Step Complaint Wizard & Persistent Draft Recovery
Admins use an interactive 5-step registration wizard:
- **Step 1 — Customer Info:** Phone number blur lookup auto-fills returning customer details.
- **Step 2 — Product Info:** Purchase bill date entry with live dynamic warranty expiry preview.
- **Step 3 — Product Type & Flow Control:** Selects product category and automatically locks installation options for non-LED products.
- **Step 4 — Charges & Media Upload:** Uploads customer invoice photos and audio recordings directly to Cloudflare R2 storage; maps standard repair price presets.
- **Step 5 — SC Assignment:** Lists qualified local SCs in the customer's district with live load stats (`Assigned`, `Pending`, `Done This Month`).

> **💡 The DB-Backed Draft System (`ComplaintDraft`):**
> If an admin loses internet connection, closes their browser, or switches devices while filling out a complaint, their progress is automatically saved to MongoDB every 2 seconds. When they return, they can **Resume** exactly where they left off, **Delete** the draft, or **Start Fresh**.

---

### 3. Service Centre Capability Engine & Dual-Field Data Architecture
- **4-Checkbox Capabilities:** Service Centres can register and be configured with 4 independent product capabilities: `LED`, `Cooler`, `Washing Machine`, `Induction`.
- **District Matching:** When assigning a Washing Machine complaint, the system automatically filters local SCs to show **only those that have Washing Machine ticked**.
- **Dual-Field Backward Compatibility:** Stores both an array (`productCapabilities: ['led', 'cooler']`) and a legacy fallback string (`productCapability: 'both'`). This guarantees older deployed mobile apps or third-party APIs never crash or render blank capability text.

---

### 4. Financial Billing, Cash Collection & Payment Reconciliation Engine
Calculating technician payouts involves real-world money logic:

$$\text{Net Payout} = (\text{Preset Price} + \text{Petrol Allowance} + \text{Extra Charges}) - \text{Customer Cash Collected}$$

- **Editable Money Overrides:** Before closing a ticket, admins can adjust preset charges, petrol travel allowances, extra component costs, and customer cash amounts.
- **Out-of-Warranty Cash Collection:** When a product is out-of-warranty, the technician collects cash directly from the customer. The system records this as a deduction from Microvison's payout. If the cash collected exceeds the repair fee, the net payout turns **negative**, meaning the SC owes Microvison money.
- **Bulk Payment Settlement:** Admins can filter bills by date range, payment status (`PAID` / `UNPAID`), and SC, then click **"Mark Selected as Paid"** or **"Mark All as Paid"** to reconcile payments in bulk.

---

### 5. Automated Meta WhatsApp Cloud API Integration
Integrated Meta WhatsApp Cloud API with 7 active notification templates:
1. `customer_sc_assigned2`: Sends SC contact details and tracking link to the customer upon assignment.
2. `sc_new_assignment`: Dispatches job details, customer address, and portal link to the technician.
3. `sc_assignment_reminder`: Automated 24h/48h background cron reminder for unaccepted jobs.
4. `sc_post_accept_reminder`: Follow-up reminder for accepted jobs pending completion.
5. `sc_not_done_reminder`: Reminder for delayed tickets.
6. `sc_part_dispatched`: Alerts SC when replacement parts leave the central warehouse.
7. `sc_part_received_reminder`: Confirms when replacement parts reach the SC.

---

### 6. High-Availability PWA & Zero-Disruption Auto-Update Architecture
Solving mobile caching issues for 100+ non-technical Service Centre owners:
- **Self-Destroying PWA (`vite-plugin-pwa`):** Automatically clears old Service Worker caches across all mobile phones and desktop browsers.
- **Automated Version Polling (`main.jsx`):**
  1. Checks a build timestamp (`version.json`) on app launch.
  2. Polls silently every 2 minutes.
  3. Triggers an instant check on `visibilitychange` (when a phone wakes from sleep or tab receives focus).
- **Session Preservation:** When a new code update is detected, the app silently reloads to the latest version while keeping the user's `localStorage` JWT token intact. **Users never get logged out.**

---

## 🛠️ 5. Technology Stack Summary

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                        │
│  React 19 • React Router v7 • Tailwind CSS • Shadcn UI    │
│  Vite PWA • Lucide Icons • Version-Polling Auto-Refresher│
└────────────────────────────┬─────────────────────────────┘
                             │ REST API / Axios Interceptors
┌────────────────────────────▼─────────────────────────────┐
│                    BACKEND API LAYER                     │
│  Node.js • Express 5 • JWT Auth & RBAC • Mongoose ODM    │
│  Warranty Engine • Billing Calculator • WhatsApp Cron    │
└──────┬──────────────────────┬──────────────────────┬─────┘
       │                      │                      │
┌──────▼──────┐        ┌──────▼──────┐        ┌──────▼──────┐
│  DATABASE   │        │   STORAGE   │        │ EXTERNAL API│
│MongoDB Atlas│        │Cloudflare R2│        │ Meta WA API │
└─────────────┘        └─────────────┘        └─────────────┘
```

---

## 🎓 6. Comprehensive Internship Learnings & Professional Growth

### 🔍 1. Requirements Analysis & Product Discovery
Before writing code, I actively led the requirements gathering and product specification process:
- **Stakeholder Interviews & Workflow Mapping:** Interacted with support admins, operational heads, and service centre technicians to understand their daily pain points (manual spreadsheet tracking, delayed customer calls, lost warranty receipts).
- **Translating Ambiguity into Engineering Specs:** Converted high-level business goals into formal Mongoose database models, REST API endpoint contracts, and intuitive UI wireframes.
- **Edge Case Identification & Defense:** Identified critical operational edge cases early in the design phase:
  - *Financial Edge Case:* Realized that when technicians collect cash for out-of-warranty repairs, net payouts can turn negative (SC owing Microvison), requiring unclamped financial formulas.
  - *Product Rule Edge Case:* Enforced complaint-only locks for Coolers, Washing Machines, and Induction Stoves to prevent improper installation bookings.
  - *Data Integrity Edge Case:* Standardized strict 10-digit WhatsApp number validation across all forms to eliminate failed WhatsApp Cloud API deliveries.

---

### 🚀 2. Technical Engineering & Architectural Mastery
- **Full-Stack MERN Architecture:** Gained deep experience designing, building, and deploying scalable full-stack applications using React 19, Node.js, Express 5, and MongoDB Atlas.
- **Advanced State Management & Performance:** Implemented controlled form components (`useRef` / `useState`) to eliminate form state wipes during 5-second background polling intervals. Built debounced autosaving for the 5-step wizard.
- **Backward Compatibility & Live Database Migrations:** Learned how to safely update live production databases. Designed non-destructive migration scripts (`syncDualCapabilities.js`) to migrate MongoDB records while maintaining dual fields (`productCapabilities` array + `productCapability` fallback string) to prevent mobile app crashes on older deployed clients.
- **Third-Party API & Infrastructure Integration:** Mastered integrating Meta WhatsApp Cloud API (Graph API v18.0+) for 7 active notification templates and automated cron reminders. Integrated Cloudflare R2 S3-compatible storage for fast media uploads.
- **High-Availability Cache Control:** Engineered a custom 3-trigger version-polling system (`version.json` timestamping + 2-minute timer + `visibilitychange` tab focus) combined with a self-destroying PWA configuration, solving mobile browser caching issues without logging users out.

---

### 💡 3. Software Engineering Practices & Professional Skills
- **Production-First Engineering Mindset:** Understood that software engineering goes beyond writing code—it requires zero-downtime deployments, robust error handling, defensive input validation, and log auditing.
- **Cross-Functional Communication:** Learned how to explain technical concepts to non-technical stakeholders (company management and service centre owners) in plain, accessible language.
- **Technical Documentation & Auditability:** Maintained strict project logs (`task.md`, `GRD_Deviation_Log.md`, `TBP_Deviation_Log.md`), ensuring that every architectural decision and deviation from initial requirements was documented for future maintainers.
- **Iterative Agile Development:** Practiced rapid, feedback-driven iteration—building, deploying, testing in staging/production environments, and continuously refining features based on real user feedback.
