const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');
const {
  getAll,
  getPending,
  getById,
  approve,
  reject,
  update,
  deactivate,
  getStats,
  createUnregistered,
  linkToRegistered,
} = require('../controllers/serviceCentre.controller');

// All routes are admin-only
router.use(auth, isAdmin);

// GET /api/service-centres — all SCs with filters & pagination
router.get('/', getAll);

// GET /api/service-centres/pending — pending approvals only
router.get('/pending', getPending);

// POST /api/service-centres/unregistered — create unregistered SC on the spot
router.post('/unregistered', createUnregistered);

// PATCH /api/service-centres/:id/link-to-registered — link unregistered to registered
router.patch('/:id/link-to-registered', linkToRegistered);

// GET /api/service-centres/:id — single SC detail
router.get('/:id', getById);

// GET /api/service-centres/:id/stats — complaint stats for this SC
router.get('/:id/stats', getStats);

// PUT /api/service-centres/:id — edit SC details
router.put('/:id', update);

// PATCH /api/service-centres/:id/approve
router.patch('/:id/approve', approve);

// PATCH /api/service-centres/:id/reject
router.patch('/:id/reject', reject);

// PATCH /api/service-centres/:id/deactivate
router.patch('/:id/deactivate', deactivate);

module.exports = router;
