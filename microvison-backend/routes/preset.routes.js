const express = require('express');
const router = express.Router();
const {
  getPresets,
  createPreset,
  updatePreset,
  deletePreset,
  toggleActive,
} = require('../controllers/preset.controller');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');

// All preset routes require authentication
router.use(auth);

// GET is accessible by any authenticated user (Admin or SC)
router.get('/', getPresets);

// POST, PUT, DELETE, PATCH require Admin role
router.post('/', isAdmin, createPreset);
router.put('/:id', isAdmin, updatePreset);
router.delete('/:id', isAdmin, deletePreset);
router.patch('/:id/toggle', isAdmin, toggleActive);

module.exports = router;
