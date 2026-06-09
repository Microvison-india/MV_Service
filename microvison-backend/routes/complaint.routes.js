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
  confirmDone,
  disputeDone,
  approveExtra,
  rejectExtra,
  getActionItems,
  getComplaintById,
} = require('../controllers/complaint.controller');

// ── Admin Routes (all require auth + isAdmin) ───────────────────
// GET  /api/complaints/reopen-check?phone1=&product=&complaintType=
router.get('/reopen-check', auth, isAdmin, reopenCheck);

// POST /api/complaints — Create a new complaint
router.post('/', auth, isAdmin, createComplaint);

// PATCH /api/complaints/:id/assign — Assign to an SC
router.patch('/:id/assign', auth, isAdmin, assignComplaint);

// ── Admin Action Centre Routes (Phase 9) ───────────────────
// GET /api/complaints/action-items — Dashboard lists and counts
router.get('/action-items', auth, isAdmin, getActionItems);

// PATCH /api/complaints/:id/confirm-done — Confirm SC job
router.patch('/:id/confirm-done', auth, isAdmin, confirmDone);

// PATCH /api/complaints/:id/dispute-done — Dispute SC job
router.patch('/:id/dispute-done', auth, isAdmin, disputeDone);

// PATCH /api/complaints/:id/dispute-done — Dispute SC job
router.patch('/:id/dispute-done', auth, isAdmin, disputeDone);

// PATCH /api/complaints/:id/extras/:extraId/approve — Approve extra charge
router.patch('/:id/extras/:extraId/approve', auth, isAdmin, approveExtra);

// PATCH /api/complaints/:id/extras/:extraId/reject — Reject extra charge
router.patch('/:id/extras/:extraId/reject', auth, isAdmin, rejectExtra);

// GET /api/complaints/:id — Get full complaint with timeline updates
router.get('/:id', auth, isAdmin, getComplaintById);

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
