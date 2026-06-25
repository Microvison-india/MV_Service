const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');
const { getCities, getCitiesByDistrict, createCity } = require('../controllers/city.controller');

// Both routes are public so the Registration form can access them without a token
router.get('/', getCities);
router.get('/district/:district', getCitiesByDistrict);

// Admin-only city creation
router.post('/', auth, isAdmin, createCity);

module.exports = router;
