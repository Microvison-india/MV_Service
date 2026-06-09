const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin, isSC } = require('../middleware/rbac');
const {
  reopenCheck,
  createComplaint,
  assignComplaint,
  getMyComplaints,
  acceptComplaint,
  rejectComplaint,
  markGoing,
  updateStatus,
} = require('../controllers/complaint.controller');

// ── Admin Routes (all require auth + isAdmin) ───────────────────
// GET  /api/complaints/reopen-check?phone1=&product=&complaintType=
router.get('/reopen-check', auth, isAdmin, reopenCheck);

// POST /api/complaints — Create a new complaint
router.post('/', auth, isAdmin, createComplaint);

// PATCH /api/complaints/:id/assign — Assign to an SC
router.patch('/:id/assign', auth, isAdmin, assignComplaint);

// ── SC Routes (all require auth + isSC) ────────────────────────
// GET  /api/complaints/my — SC's own complaints (filtered)
router.get('/my', auth, isSC, getMyComplaints);

// PATCH /api/complaints/:id/accept — SC accepts assignment
router.patch('/:id/accept', auth, isSC, acceptComplaint);

// PATCH /api/complaints/:id/reject — SC rejects assignment
router.patch('/:id/reject', auth, isSC, rejectComplaint);

// PATCH /api/complaints/:id/going — SC marks they are on the way (optional)
router.patch('/:id/going', auth, isSC, markGoing);

// PATCH /api/complaints/:id/status — SC submits final result after visit
router.patch('/:id/status', auth, isSC, updateStatus);

module.exports = router;
