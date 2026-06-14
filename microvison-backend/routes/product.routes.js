const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');
const {
  searchProducts,
  getProduct,
  createProduct,
  updateProduct,
  getReopenCheck
} = require('../controllers/product.controller');

// Mount routes
// Note: getReopenCheck needs to be accessible by Admin and potentially SC if SC portal triggers it (though Addendum primarily mentions Admin creating complaints)
// We will allow both for reopen-check.

router.get('/search', auth, isAdmin, searchProducts);
router.post('/', auth, isAdmin, createProduct);

router.get('/:trackingId/reopen-check', auth, getReopenCheck);
router.get('/:trackingId', auth, isAdmin, getProduct);
router.put('/:trackingId', auth, isAdmin, updateProduct);

module.exports = router;
