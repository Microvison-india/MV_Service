const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');
const {
  getComplaintBills,
  getMonthlyInvoice,
  markBillsPaid,
  markBillsUnpaid,
} = require('../controllers/billing.controller');

// GET /api/billing/complaints — Get itemized complaint bills (role-scoped in controller)
router.get('/complaints', auth, getComplaintBills);

// GET /api/billing/invoice/:scId — Get monthly rollup invoice (role-scoped in controller)
router.get('/invoice/:scId', auth, getMonthlyInvoice);

// PATCH /api/billing/mark-paid — Mark selected or filtered bills as paid (Admin only)
router.patch('/mark-paid', auth, isAdmin, markBillsPaid);

// PATCH /api/billing/mark-unpaid — Mark selected or filtered bills as unpaid (Admin only)
router.patch('/mark-unpaid', auth, isAdmin, markBillsUnpaid);

module.exports = router;
