const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin, isSC, isAdminOrSC } = require('../middleware/rbac');
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
  updateExtraCharges,
  updateSingleExtraCharge,
  forceClose,
  saveCriticalAction,
  addCustomerPayment,
  deleteCustomerPayment,
  updateCustomerPayment,
} = require('../controllers/complaint.controller');

const {
  getDrafts,
  getDraft,
  saveDraft,
  deleteDraft,
} = require('../controllers/draft.controller');

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

// ── Admin Draft Routes ──────────────────────────────────────────
router.get('/drafts', auth, isAdmin, getDrafts);
router.get('/drafts/:id', auth, isAdmin, getDraft);
router.post('/drafts', auth, isAdmin, saveDraft);
router.delete('/drafts/:id', auth, isAdmin, deleteDraft);

// ── Admin Action Centre Routes (Phase 9) ───────────────────
// - enter here 1st commit - 

// ── SC Routes (all require auth + isSC) ────────────────────────
// 2nd commit enter here - 
console.log("Hello");

module.exports = router;
