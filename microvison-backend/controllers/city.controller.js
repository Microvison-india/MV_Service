const City = require('../models/City');

// @desc    Get all cities (sorted by name)
// @route   GET /api/cities
// @access  Public
const getCities = async (req, res, next) => {
  try {
    const cities = await City.find().sort({ name: 1 });
    res.status(200).json(cities);
  } catch (error) {
    next(error);
  }
};

// @desc    Get cities filtered by district
// @route   GET /api/cities/district/:district
// @access  Public
const getCitiesByDistrict = async (req, res, next) => {
  try {
    const { district } = req.params;
    const cities = await City.find({ district }).sort({ name: 1 });
    res.status(200).json(cities);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCities,
  getCitiesByDistrict,
};
