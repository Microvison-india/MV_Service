const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getComplaintBills, getMonthlyInvoice } = require('../controllers/billing.controller');

// GET /api/billing/complaints — Get itemized complaint bills (role-scoped in controller)
router.get('/complaints', auth, getComplaintBills);

// GET /api/billing/invoice/:scId — Get monthly rollup invoice (role-scoped in controller)
router.get('/invoice/:scId', auth, getMonthlyInvoice);

module.exports = router;
