const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin, isSC } = require('../middleware/rbac');
const {
  reopenCheck,
  reopenComplaint,
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
  getAllComplaints,
  markPartDelivered,
  markPartReceived,
} = require('../controllers/complaint.controller');

// ── Admin Routes (all require auth + isAdmin) ───────────────────
// GET  /api/complaints — Get all complaints (with filters)
router.get('/', auth, isAdmin, getAllComplaints);

// GET  /api/complaints/reopen-check?phone1=&product=&complaintType=
router.get('/reopen-check', auth, isAdmin, reopenCheck);

// POST /api/complaints — Create a new complaint
router.post('/', auth, isAdmin, createComplaint);

// PATCH /api/complaints/:id/assign — Assign to an SC
router.patch('/:id/assign', auth, isAdmin, assignComplaint);

// POST /api/complaints/:id/reopen — Reopen a closed complaint
router.post('/:id/reopen', auth, isAdmin, reopenComplaint);

// ── Admin Action Centre Routes (Phase 9) ───────────────────
// GET /api/complaints/action-items — Dashboard lists and counts
router.get('/action-items', auth, isAdmin, getActionItems);

// PATCH /api/complaints/:id/confirm-done — Confirm SC job
router.patch('/:id/confirm-done', auth, isAdmin, confirmDone);

// PATCH /api/complaints/:id/dispute-done — Dispute SC job
router.patch('/:id/dispute-done', auth, isAdmin, disputeDone);

// PATCH /api/complaints/:id/extras/:extraId/approve — Approve extra charge
router.patch('/:id/extras/:extraId/approve', auth, isAdmin, approveExtra);

// PATCH /api/complaints/:id/extras/:extraId/reject — Reject extra charge
router.patch('/:id/extras/:extraId/reject', auth, isAdmin, rejectExtra);

// PATCH /api/complaints/:id/mark-delivered — Admin marks part delivered (SC Flow v1.1)
router.patch('/:id/mark-delivered', auth, isAdmin, markPartDelivered);



// ── SC Routes (all require auth + isSC) ────────────────────────
// GET  /api/complaints/my — SC's own complaints (filtered)
router.get('/my', auth, isSC, getMyComplaints);

// GET /api/complaints/:id — Get full complaint with timeline updates
// IMPORTANT: MUST BE PLACED AFTER ALL OTHER GET ROUTES TO PREVENT COLLISION
router.get('/:id', auth, getComplaintById);

// PATCH /api/complaints/:id/accept — SC accepts assignment
router.patch('/:id/accept', auth, isSC, acceptComplaint);

// PATCH /api/complaints/:id/reject — SC rejects assignment
router.patch('/:id/reject', auth, isSC, rejectComplaint);

// PATCH /api/complaints/:id/going — SC marks they are on the way (optional)
router.patch('/:id/going', auth, isSC, markGoing);

// PATCH /api/complaints/:id/status — SC submits final result after visit
router.patch('/:id/status', auth, isSC, updateStatus);

// PATCH /api/complaints/:id/part-received — SC marks part received (SC Flow v1.1)
router.patch('/:id/part-received', auth, isSC, markPartReceived);

module.exports = router;
