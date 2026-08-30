# Microvison Service — Technical & Behavioral Interview Preparation Guide

This guide is designed to help you ace both **Technical Engineering Rounds** and **Behavioral / Culture Fit (STAR Method) Rounds** by leveraging your real-world experience building the Microvison Service Enterprise Platform.

---

## 🎯 PART 1: "Elevator Pitch" (Introduction in Interviews)

### Q: "Tell me about your most impactful project."
> **Winning Answer:**  
> "I built the end-to-end service and warranty management platform for **Microvison Service**, an Indian consumer electronics brand servicing LED TVs, Air Coolers, Washing Machines, and Induction Stoves.
> 
> Before this platform, complaint tracking, warranty checks, service centre dispatching, and payments across 100+ repair hubs were handled manually on paper and spreadsheets. 
> 
> I engineered a production MERN-stack platform (React 19, Node.js, Express, MongoDB Atlas) that automates the entire lifecycle:
> 1. A **5-step complaint wizard** with auto-warranty verification and 2-second MongoDB draft recovery.
> 2. An **intelligent SC matching engine** balancing job loads across 100+ hubs in 5 Indian states.
> 3. A **financial reconciliation system** handling out-of-warranty cash collection and negative net payouts.
> 4. **Meta WhatsApp Cloud API integration** for automated customer/technician alerts and reminder crons.
> 5. A **custom PWA version-polling architecture** that force-updates mobile/web apps without logging users out.
> 
> The system currently serves **100+ Service Centres across 5 states** (Rajasthan, Punjab, Haryana, Gujarat, Maharashtra), reducing job dispatch times and automating payment reconciliation."

---

## 💻 PART 2: Technical Deep Dive & System Design Q&A

### Q1: "How did you design the database schemas and handle schema changes live in production?"
**Key Concept:** MongoDB Mongoose ODM, Live Data Migrations, Dual-Field Backward Compatibility.

- **Answer:**
  > "I designed Mongoose schemas for `Complaint`, `ServiceCentre`, `User`, `Product`, `Preset`, and `ComplaintDraft`. 
  > 
  > A major challenge arose when we upgraded Service Centre capabilities from a single string dropdown (`led_only`, `cooler_only`, `both`) to a multi-select 4-checkbox system (`LED`, `Cooler`, `Washing Machine`, `Induction`).
  > 
  > To ensure older deployed mobile clients and third-party APIs wouldn't break or render blank text, I implemented a **Dual-Field Strategy**:
  > - `productCapabilities`: `[String]` (e.g. `['led', 'cooler', 'washing_machine']`) for new logic.
  > - `productCapability`: `String` (e.g. `'both'`) derived automatically whenever `productCapabilities` updates.
  > 
  > I wrote a non-destructive migration script (`syncDualCapabilities.js`) that populated both fields across live MongoDB Atlas databases (`microvison` local and `microvison-production`) with zero downtime."

---

### Q2: "Explain a complex business logic problem you solved on the backend."
**Key Concept:** Financial Reconciliation & Negative Net Payout Calculations.

- **Answer:**
  > "A tricky financial edge case was calculating net payouts between Microvison and Service Centres:
  > 
  > $$\text{Net Payout} = (\text{Preset Fee} + \text{Petrol Allowance} + \text{Extra Charges}) - \text{Customer Cash Collected}$$
  > 
  > When a product is out-of-warranty, the technician collects cash directly from the customer. Initially, billing formulas clamped payouts to `Math.max(0, payout)`. 
  > 
  > However, if a technician collected ₹1,500 cash from a customer for a repair where Microvison's fee was ₹500, the technician actually owed Microvison ₹1,000. Clamping to zero wiped out this debt!
  > 
  > I refactored the billing engine to allow **unclamped negative net payouts**, built UI indicators (red negative balance badges), and created a bulk payment settlement module where admins can reconcile payouts and mark bills as `PAID` or `UNPAID` in bulk."

---

### Q3: "How did you handle caching and PWA updates for users on mobile devices?"
**Key Concept:** Service Worker Caching, PWA Self-Destruction, HTTP Cache-Control, Version Polling.

- **Answer:**
  > "We faced an issue where 100+ non-technical Service Centre owners running the PWA on their phones were stuck on old cached versions after Vercel deployments, because the Service Worker served old static bundles offline-first.
  > 
  > I solved this by building a multi-tiered auto-update architecture:
  > 1. **PWA Kill-Switch:** Set `selfDestroying: true` in `vite-plugin-pwa` to clear legacy Service Worker caches.
  > 2. **Vercel Cache-Control:** Configured `vercel.json` with strict `no-cache, no-store, must-revalidate` headers for `index.html` and static rewrite rules for `/version.json`.
  > 3. **3-Trigger Version Polling:** Built a script in `main.jsx` that compares a build timestamp (`version.json`) on app launch, every 2 minutes, and on `visibilitychange` (waking phone from sleep).
  > 
  > When a new build is detected, the app silently reloads to fresh code while preserving `localStorage` JWT tokens — users get updated instantly **without getting logged out**."

---

### Q4: "How did you integrate Meta WhatsApp Cloud API?"
**Key Concept:** Meta Graph API, Webhooks, Cron Jobs, Media Prefills.

- **Answer:**
  > "I integrated Meta WhatsApp Cloud API to automate customer and technician communications across 7 active Meta templates:
  > - `customer_sc_assigned2`: Sends SC contact details & tracking link to customers.
  > - `sc_new_assignment`: Dispatches job details & portal links to technicians.
  > - `sc_assignment_reminder` & `sc_not_done_reminder`: Background cron jobs sending 24h/48h reminders for unaccepted/delayed tickets.
  > 
  > I implemented strict 10-digit regex phone validation across all frontend forms to eliminate Graph API delivery failures, and handled automated phone prefixing (`+91`) on the backend."

---

## 🌟 PART 3: Behavioral Questions (STAR Method)

### Question 1: "Tell me about a time you dealt with ambiguous or changing requirements."
- **Situation:** During the expansion to Washing Machines and Induction Stoves, stakeholders wanted to add new products quickly, but warranty duration rules, installation restrictions, and SC capability mappings were underspecified.
- **Task:** Translate informal product requests into concrete database schemas, business rules, and UI changes without breaking existing LED/Cooler complaints.
- **Action:**
  - Conducted product discovery to formalize warranty rules: LED/Cooler (3 yrs), Washing Machine (2 yrs), Induction (1 yr).
  - Identified that installation requests must be blocked for Washing Machines, Coolers, and Induction Stoves (repair complaints only).
  - Extended tracking ID generator to add `PW` (Washing Machine) and `PI` (Induction) prefixes.
  - Rebuilt registration forms and search filters with 4 product checkboxes.
- **Result:** Successfully shipped multi-product expansion on schedule with zero breaking changes for existing LED TV/Cooler tickets.

---

### Question 2: "Tell me about a tough bug you solved under tight pressure."
- **Situation:** After deploying a major feature update, several Service Centre owners reported they could still see the old interface on their mobile phones, while admins saw the new interface on laptops.
- **Task:** Eliminate client-side caching delays immediately for 100+ non-technical users without asking them to manually clear browser data.
- **Action:**
  - Diagnosed that Vite PWA Workbox service workers were serving cached `index.html` bundles offline-first.
  - Implemented `selfDestroying: true` in PWA configuration to purge old SW caches.
  - Added build timestamping (`version.json`) and 3-trigger background polling (`main.jsx`) combined with Vercel `no-cache` headers.
- **Result:** All mobile devices auto-refreshed to the latest build within 2 minutes while maintaining active user login sessions.

---

### Question 3: "Tell me about a time you had to balance technical quality with speed."
- **Situation:** Support admins were losing filled customer data when network disconnections occurred midway through the 5-step complaint creation form.
- **Task:** Prevent data loss immediately while keeping form performance snappy.
- **Action:**
  - Designed a lightweight `ComplaintDraft` MongoDB collection.
  - Implemented a 2-second debounced autosave hook (`POST /api/complaints/drafts`) that saved form state in the background without blocking UI typing.
  - Built a draft selector modal allowing admins to Resume, Delete, or Start Fresh on page load.
- **Result:** Data loss was completely eliminated for support staff, while form typing remained buttery smooth.

---

### Question 4: "How do you handle working with non-technical users or stakeholders?"
- **Situation:** Service Centre owners and field technicians in regional districts were non-technical and struggled with complicated software.
- **Task:** Design a mobile experience that required zero training.
- **Action:**
  - Designed mobile-first, card-based layouts with large touch targets and color-coded status badges.
  - Integrated automated WhatsApp alerts with direct action links so technicians didn't need to navigate complex menus.
  - Simplified technician forms to request only essential fields (photos, customer cash, notes).
- **Result:** Achieved 100% adoption across 100+ Service Centres with zero formal training required.

---

## 🏆 Quick Cheat-Sheet Summary

| Technical Topic | Your Exact Answer Reference |
| :--- | :--- |
| **Tech Stack** | MERN (React 19, Express 5, Node.js, MongoDB Atlas), Tailwind, Vite PWA, Cloudflare R2, Meta WA API |
| **Scale** | 100+ Service Centres across 5 States (Rajasthan, Punjab, Haryana, Gujarat, Maharashtra) |
| **Database** | MongoDB Mongoose, live non-destructive migrations, dual-field compatibility (`productCapabilities` + `productCapability`) |
| **Caching** | Self-destroying PWA + 2-min version polling (`version.json`) + Vercel static rewrites |
| **Financials** | Net payout = (Preset + Petrol + Extras) - Cash Collected; supports negative payouts & bulk reconciliation |
| **Storage** | Cloudflare R2 S3-compatible bucket for invoice photos & voice recordings |
