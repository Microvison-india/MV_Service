const Product = require('../models/Product');

/**
 * Generates a unique Tracking ID in the format P + L/C + 6-digit number.
 * Sequentially increments based on the last created product's ID suffix.
 * Counter is global across all products (never resets, increments forever).
 * Legacy IDs are preserved and parsed to continue the global counter sequence.
 * @param {string} productType - 'led' or 'cooler'
 */
const generateTrackingId = async (productType) => {
    const productCode = productType === 'cooler' ? 'C' : 'L';

    // We scan the last 10 products sorted by creation order to find the highest sequence counter
    const lastProducts = await Product.find({}, 'trackingId')
        .sort({ createdAt: -1, _id: -1 })
        .limit(10)
        .lean();