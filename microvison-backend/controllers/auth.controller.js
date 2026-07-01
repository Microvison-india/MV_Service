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

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });

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

        // Backend validations per GRD Section 3.2 & user request
        if (!ownerName || !businessName || !phone1 || !email1 || !city || !district || !state || !productCapability || !password) {
            return res.status(400).json({ message: 'All required fields must be filled.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        if (req.body.confirmPassword && password !== req.body.confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }

        const cleanEmail1 = email1.trim().toLowerCase();
        const cleanEmail2 = email2 ? email2.trim().toLowerCase() : '';

        const userExists = await User.findOne({ email: cleanEmail1 });
        if (userExists) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        // Create User (pending by default)
        const user = await User.create({
            name: ownerName,
            email: cleanEmail1,
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
            email1: cleanEmail1,
            email2: cleanEmail2,
            fullAddress,
            city,
            district,
            state,
            productCapability,
            status: 'pending',
        });

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
        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }
        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(404).json({ message: 'User with this email not found.' });
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

        console.log(`[OTP] Generated OTP ${otpCode} for ${user.email}`);

        // If sandbox / development without real API key, simulate sending
        const apiKey = process.env.BREVO_API_KEY;
        const isSandbox = !apiKey || apiKey.startsWith('xkeysib-abc123') || apiKey === 'your-api-key';

        if (isSandbox) {
            console.info(`[Brevo] [SANDBOX MODE] Simulated password reset email send to ${user.email} with OTP: ${otpCode}`);
        } else {
            try {
                await sendEmail({
                    to: user.email,
                    subject: 'Password Reset OTP - Microvison',
                    htmlContent: `<p>Your password reset OTP is: <strong>${otpCode}</strong></p><p>It is valid for 10 minutes.</p>`,
                });
            } catch (emailErr) {
                console.error('[Brevo] Failed to send email:', emailErr.message);
                // Fallback: If Brevo fails in non-production, log and return success so developer/user is not blocked.
                if (process.env.NODE_ENV !== 'production') {
                    console.info(`[Brevo] [DEVELOPMENT FALLBACK] API failed but returning success. OTP: ${otpCode}`);
                } else {
                    return res.status(500).json({ message: 'Failed to send OTP email' });
                }
            }
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
        if (!email || !code) {
            return res.status(400).json({ message: 'Email and OTP code are required.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanCode = code.trim();

        const otpToken = await OtpToken.findOne({
            email: cleanEmail,
            code: cleanCode,
            expiresAt: { $gt: new Date() },
        });

        if (!otpToken) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

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
        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanCode = code.trim();

        const otpToken = await OtpToken.findOne({
            email: cleanEmail,
            code: cleanCode,
            expiresAt: { $gt: new Date() },
        });

        if (!otpToken) {
            return res.status(400).json({ message: 'Invalid or expired OTP request' });
        }

        const user = await User.findOne({ email: cleanEmail });
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
