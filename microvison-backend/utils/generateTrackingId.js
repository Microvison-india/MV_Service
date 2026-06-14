const Product = require('../models/Product');

/**
 * Generates a unique Tracking ID: PT-000001
 * Sequentially increments based on the last created product.
 */
const generateTrackingId = async () => {
  const lastProduct = await Product.findOne({}, 'trackingId')
    .sort({ createdAt: -1 })
    .lean();

  let nextNumber = 1;

  if (lastProduct && lastProduct.trackingId && lastProduct.trackingId.startsWith('PT-')) {
    const lastNumStr = lastProduct.trackingId.split('-')[1];
    const lastNum = parseInt(lastNumStr, 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  // Format as 6-digit padded string
  const paddedNumber = String(nextNumber).padStart(6, '0');
  return `PT-${paddedNumber}`;
};

module.exports = generateTrackingId;
