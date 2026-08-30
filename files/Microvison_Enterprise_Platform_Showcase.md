# Microvison Service Enterprise Platform — System Architecture & Feature Showcase

## Executive Summary & Company Overview

**Microvison Service** is a consumer electronics and home appliances service & warranty management platform in India. The company specializes in after-sales support, field service engineering, warranty verification, and spare parts logistics for consumer appliances including **LED TVs**, **Air Coolers**, **Washing Machines**, and **Induction Stoves**.

The **Microvison Service Enterprise Platform** is an end-to-end digital ecosystem designed to automate and streamline the complete lifecycle of customer service complaints across an active network of **100+ Service Centres** operating across 5 major Indian states (**Rajasthan**, **Punjab**, **Haryana**, **Gujarat**, and **Maharashtra**). It connects Customers, Field Technicians, Service Centres (SCs), and Central Administrators into a single real-time workflow.

---

## 🏗️ Technology Stack & System Architecture

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

### Stack Components
- **Frontend Framework:** React 19, React Router v7, Vite
- **UI & Design System:** Tailwind CSS, Shadcn UI Components, Lucide React Icons, Geist Variable Font
- **Backend Runtime:** Node.js (CommonJS), Express 5
- **Database Layer:** MongoDB Atlas with Mongoose ODM (ReplicaSet cluster)
- **Object & Asset Storage:** Cloudflare R2 S3-Compatible Object Storage (Audio recordings, Bill photos, Complaint media)
- **Email Infrastructure:** Brevo (Sendinblue) HTTP API Email Wrapper
- **Messaging Infrastructure:** Meta WhatsApp Cloud API (Graph API v18.0+)
- **Hosting & Infrastructure:** Vercel (Frontend CDN with static rewrites & cache control), Render (Backend Node API Server)

---

## ⚡ Core Modules & Business Features

### 1. Product Tracking & Multi-Product Warranty Engine
The platform dynamically calculates warranty coverage based on product line policies:

| Product Line | Default Warranty | Tracking Prefix | Installation Allowed? |
| :--- | :---: | :---: | :---: |
| **LED TV** | 3 Years | `PL` (e.g. `PL000124`) | ✅ Yes |
| **Air Cooler** | 3 Years | `PC` (e.g. `PC000089`) | ❌ Complaint Only |
| **Washing Machine** | 2 Years | `PW` (e.g. `PW000042`) | ❌ Complaint Only |
| **Induction Stove** | 1 Year | `PI` (e.g. `PI000015`) | ❌ Complaint Only |

- **Automated Warranty Calculation:** Automatically adds exact warranty years to customer purchase bill date.
- **Warranty Sources & Overrides:** Supports `auto_calculated` (from invoice date), `manual` fallback, `forced` in-warranty, and `revoked` (with mandatory administrative reason logging).
- **Global Serialized Product Registry:** Maintains lifetime complaint history for each product via serial number and unique tracking ID.

---

### 2. 5-Step Complaint Registration & Draft Recovery Engine
Admins register customer complaints using a multi-step wizard with built-in data protection:

```
[Step 1: Customer Info & Product Search] 
                  │
                  ▼
[Step 2: Product Info & Warranty Preview] 
                  │
                  ▼
[Step 3: Product Type & Complaint Lock] 
                  │
                  ▼
[Step 4: Charges, Presets & Media Upload] 
                  │
                  ▼
[Step 5: District SC Candidate Matching] 
                  │
                  ▼
[Complaint Issued & WhatsApp Dispatched]
```

- **Step 1 — Customer Info & Product Search:** Phone number lookup auto-detects existing customer records and product history.
- **Step 2 — Product Info & Warranty Preview:** Live preview calculates exact warranty expiry date based on product type.
- **Step 3 — Product Type & Complaint Lock:** Automatically enforces complaint-only flows for Coolers, Washing Machines, and Induction Stoves.
- **Step 4 — Charges & Media:** Uploads customer invoice photos and voice notes directly to Cloudflare R2 storage; maps preset pricing packages.
- **Step 5 — SC Assignment & Load Balancing:** Displays active SCs in customer's district with live load stats (`Assigned`, `Pending`, `Monthly Done`).
- **DB-Backed Draft System (`ComplaintDraft`):** Auto-saves admin progress every 2 seconds. If an admin loses connection or closes their browser, they can **Resume**, **Delete**, or **Start Fresh**.

---

### 3. Service Centre Portal & 4-Checkbox Capability Engine
Service Centres operate on a dedicated portal to manage assigned jobs:

- **4-Checkbox Capabilities:** SCs can register and be configured with 4 independent product capabilities: `LED`, `Cooler`, `Washing Machine`, `Induction`.
- **Dual-Field Backward Compatibility:** Stores both array capabilities (`productCapabilities: ['led', 'cooler']`) and legacy string representations (`productCapability: 'both'`) so older mobile builds never break or render blank fields.
- **Job Status Machine:** `assigned` → `accepted` → `going` → `part_pending` → `part_received` → `done` → `closed`.
- **Unregistered SC Support:** Supports non-portal service centres managed manually by central administrators.

---

### 4. Financial & Editable Billing Settlement Engine
A financial reconciliation module manages payments between Microvison and Service Centres:

$$\text{Net Payout} = (\text{Preset Price} + \text{Petrol Allowance} + \text{Extra Charges}) - \text{Customer Cash Collected}$$

- **Editable Money Overrides:** Admins can adjust preset prices, petrol allowances, extra charges, and customer payments prior to closing tickets.
- **Negative Balance Payouts:** Unclamped financial logic allows negative net balances when an SC collects cash directly from customers for out-of-warranty services (SC owes Microvison).
- **Payment Reconciliation:** Tracks `PAID` / `UNPAID` status per bill with timestamps (`paidAt`) and auditing (`paidBy`). Features bulk "Mark All as Paid" across date ranges and individual row selections.

---

### 5. Meta WhatsApp Cloud API Integration
Automated customer and technician notifications powered by Meta WhatsApp Cloud API:

- **Active Templates:**
  1. `customer_sc_assigned2` — Dispatches SC contact details to customer on assignment.
  2. `sc_new_assignment` — Alerts technician with job details, customer address, and portal link.
  3. `sc_assignment_reminder` — Automated 24h/48h cron reminder for unaccepted jobs.
  4. `sc_post_accept_reminder` — Automated reminder for accepted jobs pending completion.
  5. `sc_not_done_reminder` — Follow-up notification for pending service jobs.
  6. `sc_part_dispatched` — Notifies SC when spare parts are shipped from central warehouse.
  7. `sc_part_received_reminder` — Follow-up notification once spare parts arrive at SC.

---

### 6. PWA & Zero-Disruption Cache Control Architecture
Solves web application caching issues across mobile and desktop devices:

- **Self-Destroying PWA (`vite-plugin-pwa`):** Unregisters legacy Service Worker caches across all client devices.
- **Automatic 3-Trigger Version Polling (`main.jsx`):**
  1. Polls `version.json` timestamp on app load.
  2. Runs background check every 2 minutes.
  3. Triggers check on `visibilitychange` (when phone wakes from sleep or tab receives focus).
- **Login Session Preservation:** Auto-refreshes app code while preserving `localStorage` JWT tokens — users never get logged out.

---

## 👨‍💻 Key Accomplishments & Engineering Value

### Key Responsibilities & Portfolio Highlights
- **Full-Stack Architecture:** Architected and implemented the complete MERN application from database schema design to frontend UI state management.
- **Complex Domain Modeling:** Built product-aware warranty engine supporting multiple duration policies, serial tracking, and automated prefix generation.
- **Financial Engineering:** Developed editable billing engine supporting positive payouts, extra charges, petrol allowances, and negative cash balances.
- **Enterprise Integrations:** Integrated Meta WhatsApp Cloud API for automated notifications and Cloudflare R2 for media storage.
- **Data Migration & Zero-Downtime Deployment:** Designed non-destructive migration scripts (`migrateProductCapabilities.js` & `syncDualCapabilities.js`) to migrate live MongoDB Atlas databases with zero data loss.
- **PWA & Cache Architecture:** Solved client-side PWA caching issues by implementing self-destroying service workers, version polling, and static rewrite rules.

---
*Documentation Generated for Microvison Service Enterprise Platform*
