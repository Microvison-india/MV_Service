const ServiceCentre = require('../models/ServiceCentre');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all Service Centres with filters + pagination
// @route   GET /api/service-centres
// @access  Admin
const getAll = async (req, res) => {
  try {
    const { city, district, state, status, productCapability, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (district) filter.district = { $regex: district, $options: 'i' };
    if (state) filter.state = { $regex: state, $options: 'i' };
    if (status) filter.status = status;
    if (productCapability) filter.productCapability = productCapability;
    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { phone1: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ServiceCentre.countDocuments(filter);
    const serviceCentres = await ServiceCentre.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      serviceCentres,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('getAll SC error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pending Service Centres only
// @route   GET /api/service-centres/pending
// @access  Admin
const getPending = async (req, res) => {
  try {
    const pending = await ServiceCentre.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single Service Centre by ID
// @route   GET /api/service-centres/:id
// @access  Admin
const getById = async (req, res) => {
  try {
    const sc = await ServiceCentre.findById(req.params.id);
    if (!sc) return res.status(404).json({ message: 'Service Centre not found' });
    res.status(200).json(sc);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve a Service Centre
// @route   PATCH /api/service-centres/:id/approve
// @access  Admin
const approve = async (req, res) => {
  try {
    const sc = await ServiceCentre.findById(req.params.id);
    if (!sc) return res.status(404).json({ message: 'Service Centre not found' });

    sc.status = 'active';
    await sc.save();

    // Also activate the user account
    await User.findByIdAndUpdate(sc.userId, { status: 'active' });

    // Notify SC owner via email
    try {
      await sendEmail({
        to: sc.email1,
        subject: 'Your Microvison Service Centre Account is Approved!',
        htmlContent: `
          <h2>Congratulations, ${sc.ownerName}!</h2>
          <p>Your service centre <strong>${sc.businessName}</strong> has been approved by the Microvison admin team.</p>
          <p>You can now log in to your account using your registered email and password.</p>
          <p>Welcome aboard!</p>
          <br/>
          <p>— Microvison Team</p>
        `,
      });
    } catch (emailErr) {
      console.error('Approval email failed:', emailErr.message);
      // Don't fail the whole request if email fails
    }

    res.status(200).json({ message: 'Service Centre approved successfully', sc });
  } catch (error) {
    console.error('Approve SC error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject a Service Centre
// @route   PATCH /api/service-centres/:id/reject
// @access  Admin
const reject = async (req, res) => {
  try {
    const sc = await ServiceCentre.findById(req.params.id);
    if (!sc) return res.status(404).json({ message: 'Service Centre not found' });

    sc.status = 'rejected';
    await sc.save();

    await User.findByIdAndUpdate(sc.userId, { status: 'rejected' });

    // Notify SC owner via email
    try {
      await sendEmail({
        to: sc.email1,
        subject: 'Update on Your Microvison Service Centre Registration',
        htmlContent: `
          <h2>Dear ${sc.ownerName},</h2>
          <p>Thank you for registering <strong>${sc.businessName}</strong> with Microvison.</p>
          <p>After review, we are unable to approve your account at this time. Please contact the Microvison admin team for more information.</p>
          <br/>
          <p>— Microvison Team</p>
        `,
      });
    } catch (emailErr) {
      console.error('Rejection email failed:', emailErr.message);
    }

    res.status(200).json({ message: 'Service Centre rejected', sc });
  } catch (error) {
    console.error('Reject SC error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a Service Centre's details
// @route   PUT /api/service-centres/:id
// @access  Admin
const update = async (req, res) => {
  try {
    const sc = await ServiceCentre.findById(req.params.id);
    if (!sc) return res.status(404).json({ message: 'Service Centre not found' });

    const allowedFields = ['ownerName', 'businessName', 'phone1', 'phone2', 'email2', 'fullAddress', 'city', 'district', 'state', 'productCapability'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        sc[field] = req.body[field];
      }
    });

    await sc.save();
    res.status(200).json({ message: 'Service Centre updated', sc });
  } catch (error) {
    console.error('Update SC error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Deactivate a Service Centre
// @route   PATCH /api/service-centres/:id/deactivate
// @access  Admin
const deactivate = async (req, res) => {
  try {
    const sc = await ServiceCentre.findById(req.params.id);
    if (!sc) return res.status(404).json({ message: 'Service Centre not found' });

    sc.status = 'inactive';
    await sc.save();
    await User.findByIdAndUpdate(sc.userId, { status: 'inactive' });

    res.status(200).json({ message: 'Service Centre deactivated', sc });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get stats for a single SC (complaint counts by status)
// @route   GET /api/service-centres/:id/stats
// @access  Admin
const getStats = async (req, res) => {
  try {
    // Placeholder — will be populated in Phase 7 when Complaint model is built
    res.status(200).json({
      total: 0,
      pending: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAll, getPending, getById, approve, reject, update, deactivate, getStats };
