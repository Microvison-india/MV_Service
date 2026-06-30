# Microvison Service Management System — Developer Walkthrough Log

This document serves as a technical journal logging specific bug fixes, complex architectural decisions, and layout overrides that are important for future developers to understand.

---

## Phase 32: Negative Billing & React Polling Wipe Fixes

### 1. Negative Billing Implementation
**The Problem:** The original `billingCalculator.js` used a mathematical clamp: `Math.max(0, gross - deductions)` to ensure the net total payable to the Service Centre never dropped below zero. However, with the introduction of the out-of-warranty workflow (Change 6), Service Centres can collect cash directly from customers (`customerPaymentAmount`).

**The Solution:**
- We removed the `Math.max(0, ...)` wrapper from the net calculation in `utils/billingCalculator.js`. 
- Net totals are now allowed to be negative. A negative total indicates that the SC collected *more* cash from the customer than what Microvison owed them for the service/petrol/extras. In this case, the SC owes Microvison the difference.
- **UI Handling:** In the Admin `BillingTable.jsx` and `MonthlyInvoice.jsx`, we added dynamic Tailwind class logic to color the text red (`text-red-600`) if the number is less than 0, and green (`text-green-600`) if it is greater than 0, making it instantly obvious who owes money to whom.

### 2. Fixing the 5-Second Polling Wipe (Controlled vs Uncontrolled Inputs)
**The Problem:** In the `AdminComplaintDetail.jsx` and `SCComplaintDetail.jsx` drawer panels, data is polled every 5 seconds to keep the timeline and stats live. However, when the admin or SC was typing into an input field (like adding a custom Extra Charge or typing an edit reason), the 5-second poll would trigger a React state update (`setComplaint(newData)`), causing a component re-render. This re-render completely wiped out whatever the user was actively typing in those fields.

**The Solution:**
- We implemented an `isTypingRef = useRef(false)` to track when a user is actively engaging with an input field.
- The `onFocus` event sets `isTypingRef.current = true`, and `onBlur` sets it to `false`.
- The 5-second polling `useEffect` hook now wraps its state update in an `if (!isTriggerRef.current)` condition. 
- **Result:** If the user is typing, the background poll silently skips updating the local state, protecting the user's typed data. Once the user clicks out of the input, the next poll will resume updating the rest of the component data.
- **Important Note:** We also switched several inline uncontrolled inputs to fully controlled inputs (binding `value` to state variables) to ensure consistent data binding across these complex forms. Future developers should be extremely careful not to rely on uncontrolled DOM inputs inside these polling drawers.

### 3. Fixing Timezone Date Shifts
**The Problem:** When filtering complaints or generating invoices by date, selecting "May 1st to May 31st" would sometimes fetch data from May 2nd due to the server interpreting dates in UTC midnight, shifting them by 5 hours and 30 minutes (IST).
**The Solution:** Implemented a new `parseLocalDate` utility that reads the `x-timezone-offset` header sent by the frontend, dynamically shifting the bounds of the MongoDB `$gte` and `$lte` queries to match the user's exact local midnight and 23:59:59 timestamps.

---
