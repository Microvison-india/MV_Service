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

  let maxNum = 0;

  for (const p of lastProducts) {
    if (p.trackingId) {
      let numStr = '';
      if (p.trackingId.startsWith('PT-')) {
        // Legacy format: PT-000001
        numStr = p.trackingId.split('-')[1];
      } else if (p.trackingId.startsWith('PL') || p.trackingId.startsWith('PC')) {
        // New format: PL000001 or PC000001
        numStr = p.trackingId.substring(2);
      }
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNumber = maxNum + 1;
  const paddedNumber = String(nextNumber).padStart(6, '0');
  return `P${productCode}${paddedNumber}`;
};

module.exports = generateTrackingId;
