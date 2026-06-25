const User = require('../models/User');

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin only' });
  }
};

const isSC = (req, res, next) => {
  if (req.user && req.user.role === 'service_centre') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Service Centre only' });
  }
};

const isAdminOrSC = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'service_centre')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin or Service Centre only' });
  }
};

const isActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error during status check' });
  }
};

module.exports = {
  isAdmin,
  isSC,
  isAdminOrSC,
  isActive,
};
