# Developer Handoff Guide — Microvison Service Management System

You are taking over development of the **Microvison Service Management System (SMS)**. This guide provides the complete context of the project architecture, features, documentation files, coding style, and ongoing tasks.

---

## 1. Project Overview & Stack
- **Backend (`microvison-backend/`):** Node.js, Express, Mongoose (MongoDB Atlas), Cloudflare R2 (S3-compatible bucket storing compressed images and voice notes).
- **Frontend (`microvison-frontend/`):** React, Vite, Tailwind CSS v3 (custom config for v3 compatibility with shadcn components), React Router v7.
- **Key Flow Configurations:**
  - **Petrol Claim Locks:** A 3-step lock (`petrolAdmin` -> `petrolSC` -> `petrolFinal`).
  - **Extra Charges Lifecycle:** SC requests charges (which become immutable once assigned a DB `_id`). Admin approves, rejects, or edits amounts inline on active cards or during the confirmation stage.
  - **Parts Sourcing Cycle:** SC marks `part_pending` -> Admin marks `Delivered` in timeline -> SC marks `Received` to proceed.

---

## 2. Crucial Documentation Files (Importance Sequence)
All documentation lives inside the codebase. You **must read** these files in the following sequence of importance:
1. **[task.md](file:///e:/Projects/MV_service/Project/files/task.md):** The current roadmap/task tracker. Check this first to see what tasks are completed and what needs to be continued.
2. **[GRD_Deviation_Log.md](file:///e:/Projects/MV_service/Project/files/GRD_Deviation_Log.md):** The functional deviations log. Documents all logical rules, custom ID formats, and layout updates built on top of the original GRD.
3. **[TBP_Deviation_Log.md](file:///e:/Projects/MV_service/Project/files/TBP_Deviation_Log.md):** The technical deviations log. Documents database model extensions, S3/R2 middleware migrations, and controller updates.
4. **[Microvison_SC_Flow_v1.1.txt](file:///e:/Projects/MV_service/Project/files/Microvison_SC_Flow_v1.1.txt):** The specifications for the Service Centre Done/Not Done/Part Pending paths and billing rules.
5. **[Microvison_Product_Tracking_Addendum_v1.2.txt](file:///e:/Projects/MV_service/Project/files/Microvison_Product_Tracking_Addendum_v1.2.txt):** The specifications for Serial Tracking, auto-calculated warranties, and reopen logic.
6. **[Microvison_GRD_v1.1.md](file:///e:/Projects/MV_service/Project/files/Microvison_GRD_v1.1.md):** The original functional specification document.
7. **[Microvison_Technical_Build_Plan_v1.1.md](file:///e:/Projects/MV_service/Project/files/Microvison_Technical_Build_Plan_v1.1.md):** The original technical implementation plan.

---

## 3. Codebase Structure & Key Files
- **Backend Router:** `microvison-backend/routes/complaint.routes.js`
- **Backend Controller:** `microvison-backend/controllers/complaint.controller.js` (Contains all core status flow logic).
- **Backend Model:** `microvison-backend/models/ComplaintUpdate.js` (Stores historical timeline snapshots).
- **Frontend Timeline:** `microvison-frontend/src/components/complaint/StatusTimeline.jsx` (Renders timeline snapshots).
- **Frontend Detail Panels:** `AdminComplaintDetail.jsx` and `SCComplaintDetail.jsx` (Dashboard slides for reviews and actions).

---

## 4. Coding & Styling Standards
- **Tailwind CSS v3 Compatibility:** Do not use Tailwind CSS v4 directives. The layout is set up strictly for Tailwind v3.
- **Strict ESLint Rules:** The linter is configured to throw hard errors on unused variables, functions, or imports (`no-unused-vars`). Always run `npx eslint <file>` before committing changes and clean up unused variables.
- **Timeline Snapshots Rule:** When rendering nodes in `StatusTimeline.jsx`, never bind values directly to the live `complaint` object properties (which get overwritten in subsequent statuses). Always bind to the `update` snapshot fields, using the `complaint` object only as a fallback for legacy updates.

---

## 5. Verification Commands
Before marking a task as done, verify using:
- **Frontend Build:** `npm run build` inside `microvison-frontend/`
- **Backend Syntax Check:** `node -c controllers/complaint.controller.js models/ComplaintUpdate.js` inside `microvison-backend/`
- **Frontend Lint Check:** `npx eslint src/components/complaint/AdminComplaintDetail.jsx` inside `microvison-frontend/`
