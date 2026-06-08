const express = require('express');
const router = express.Router();
const { getCities, getCitiesByDistrict } = require('../controllers/city.controller');

// Both routes are public so the Registration form can access them without a token
router.get('/', getCities);
router.get('/district/:district', getCitiesByDistrict);

module.exports = router;
