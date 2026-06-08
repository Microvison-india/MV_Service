const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');
const {
  reopenCheck,
  createComplaint,
  assignComplaint,
} = require('../controllers/complaint.controller');

// All complaint routes require Admin authentication
router.use(auth);
router.use(isAdmin);

// GET  /api/complaints/reopen-check?phone1=&product=&complaintType=
// Check reopen eligibility before the admin fills the full form
router.get('/reopen-check', reopenCheck);

// POST /api/complaints
// Create a new complaint (status = 'new', no SC yet)
router.post('/', createComplaint);

// PATCH /api/complaints/:id/assign
// Assign (or reassign) a complaint to a Service Centre
router.patch('/:id/assign', assignComplaint);

module.exports = router;
