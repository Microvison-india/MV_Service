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

const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// @desc    Create a new city (admin only or inline)
// @route   POST /api/cities
// @access  Private (Admin)
const createCity = async (req, res, next) => {
  try {
    const nameInput = req.body.name || req.body.city;
    const { district, state } = req.body;

    if (!nameInput || !district || !state) {
      return res.status(400).json({ message: 'City name, district, and state are required.' });
    }

    const normalizedName = toTitleCase(nameInput);
    const normalizedDistrict = toTitleCase(district);
    const normalizedState = toTitleCase(state);

    // Look for existing city (case-insensitive regex for accuracy)
    let city = await City.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
      district: { $regex: new RegExp(`^${normalizedDistrict}$`, 'i') },
      state: { $regex: new RegExp(`^${normalizedState}$`, 'i') }
    });

    if (city) {
      return res.status(409).json({ message: 'This exact city, district, and state combination already exists in our list.' });
    }

    city = await City.create({
      name: normalizedName,
      district: normalizedDistrict,
      state: normalizedState
    });

    res.status(201).json(city);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCities,
  getCitiesByDistrict,
  createCity,
  toTitleCase, // export for use in service centre controller
};
