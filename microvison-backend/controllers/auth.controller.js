const User = require('../models/User');
const ServiceCentre = require('../models/ServiceCentre');
const OtpToken = require('../models/OtpToken');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'pending') {
      return res.status(401).json({ message: 'Account pending approval from admin' });
    }
    if (user.status === 'rejected') {
      return res.status(401).json({ message: 'Account registration was rejected' });
    }
    if (user.status === 'inactive') {
      return res.status(401).json({ message: 'Account has been deactivated' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register a new service centre
// @route   POST /api/auth/register
// @access  Public
const registerSC = async (req, res) => {
  try {
    const {
      ownerName,
      businessName,
      phone1,
      phone2,
      email1,
      email2,
      fullAddress,
      city,
      district,
      state,
      productCapability,
      password,
    } = req.body;

    const userExists = await User.findOne({ email: email1.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Create User (pending by default)
    const user = await User.create({
      name: ownerName,
      email: email1,
      passwordHash: password, // pre-save hook hashes this
      role: 'service_centre',
      status: 'pending',
    });

    // Create Service Centre Profile
    await ServiceCentre.create({
      userId: user._id,
      ownerName,
      businessName,
      phone1,
      phone2,
      email1,
      email2,
      fullAddress,
      city,
      district,
      state,
      productCapability,
      status: 'pending',
    });

    // GRD Section 2.1 — 2 admin accounts, notify both
    const adminEmails = [
      process.env.ADMIN_EMAIL_1,
      process.env.ADMIN_EMAIL_2,
    ].filter(Boolean);

    for (const adminEmail of adminEmails) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: 'New Service Centre Registration — Microvison',
          htmlContent: `
            <h2>New Registration Pending Approval</h2>
            <p>A new service centre has registered and is awaiting your approval.</p>
            <ul>
              <li><strong>Business Name:</strong> ${businessName}</li>
              <li><strong>Owner Name:</strong> ${ownerName}</li>
              <li><strong>City:</strong> ${city}, ${district}, ${state}</li>
              <li><strong>Phone:</strong> ${phone1}</li>
              <li><strong>Email:</strong> ${email1}</li>
              <li><strong>Product Capability:</strong> ${productCapability}</li>
            </ul>
            <p>Please log in to the admin panel to approve or reject this registration.</p>
          `,
        });
      } catch (emailErr) {
        console.log(`Admin notification to ${adminEmail} failed, but registration succeeded.`);
      }
    }

    res.status(201).json({ message: 'Registration successful. Waiting for admin approval.' });
  } catch (error) {
    console.error('Register SC error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't leak whether user exists or not
      return res.status(200).json({ message: 'If email exists, an OTP will be sent.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit string
    
    // 10 minute expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete existing OTPs for this email
    await OtpToken.deleteMany({ email: user.email });

    await OtpToken.create({
      email: user.email,
      code: otpCode,
      expiresAt,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset OTP - Microvison',
        htmlContent: `<p>Your password reset OTP is: <strong>${otpCode}</strong></p><p>It is valid for 10 minutes.</p>`,
      });
    } catch (emailErr) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;

    const otpToken = await OtpToken.findOne({
      email: email.toLowerCase(),
      code,
      expiresAt: { $gt: new Date() },
    });

    if (!otpToken) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // We don't delete it here, reset password step deletes it.
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const otpToken = await OtpToken.findOne({
      email: email.toLowerCase(),
      code,
      expiresAt: { $gt: new Date() },
    });

    if (!otpToken) {
      return res.status(400).json({ message: 'Invalid or expired OTP request' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash is handled by the pre-save hook on the User model
    user.passwordHash = newPassword;
    await user.save();

    await OtpToken.deleteMany({ email: user.email });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
  registerSC,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
