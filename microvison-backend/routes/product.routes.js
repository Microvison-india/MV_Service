const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');
const {
  searchProducts,
  getProduct,
  createProduct,
  updateProduct
} = require('../controllers/product.controller');

// Mount routes

router.get('/search', auth, isAdmin, searchProducts);
router.post('/', auth, isAdmin, createProduct);

router.get('/:trackingId', auth, isAdmin, getProduct);
router.put('/:trackingId', auth, isAdmin, updateProduct);

module.exports = router;

