const Complaint = require('../models/Complaint');
const ServiceCentre = require('../models/ServiceCentre');
const { calcBill } = require('../utils/billingCalculator');

// @desc    Get itemized complaint bills with filters (closed complaints only)
// @route   GET /api/billing/complaints
// @access  Private (Admin or SC)
const getComplaintBills = async (req, res) => {
  try {
    const { product, warrantyStatus, dateFrom, dateTo, month, year } = req.query;

    const query = { billGenerated: true };

    // Role-scoping
    if (req.user.role === 'service_centre') {
      const sc = await ServiceCentre.findOne({ userId: req.user.id });
      if (!sc) {
        return res.status(404).json({ message: 'Service Centre profile not found.' });
      }
      query.assignedCentreId = sc._id;
    } else {
      // Admin can filter by service centre
      if (req.query.assignedCentreId) {
        query.assignedCentreId = req.query.assignedCentreId;
      }
    }

    // Filters
    if (product) query.product = product;
    if (warrantyStatus) query.warrantyStatus = warrantyStatus;

    // Month & Year filter (using createdAt month range)
    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    } else if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endOfDay;
      }
    }

    const complaints = await Complaint.find(query)
      .populate('assignedCentreId', 'businessName ownerName phone1')
      .sort({ createdAt: -1 })
      .lean();

    // Map each complaint through the billing calculator
    const bills = complaints.map((c) => {
      const calculation = calcBill(c);
      return {
        _id: c._id,
        complaintId: c.complaintId,
        customerName: c.customerName,
        city: c.city,
        product: c.product,
        warrantyStatus: c.warrantyStatus,
        status: c.status,
        createdAt: c.createdAt,
        assignedCentreId: c.assignedCentreId,
        billing: calculation,
      };
    });

    res.status(200).json({ bills });
  } catch (error) {
    console.error('Error in getComplaintBills:', error);
    res.status(500).json({ message: 'Server error while fetching bills.' });
  }
};

// @desc    Get monthly invoice rollup for a Service Centre
// @route   GET /api/billing/invoice/:scId
// @access  Private (Admin or SC)
const getMonthlyInvoice = async (req, res) => {
  try {
    const { scId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required.' });
    }

    // Role-scoping check
    let targetScId = scId;
    if (req.user.role === 'service_centre') {
      const sc = await ServiceCentre.findOne({ userId: req.user.id });
      if (!sc) {
        return res.status(404).json({ message: 'Service Centre profile not found.' });
      }
      targetScId = sc._id;
    }

    const sc = await ServiceCentre.findById(targetScId).lean();
    if (!sc) {
      return res.status(404).json({ message: 'Service Centre not found.' });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    // Fetch closed, bill-generated complaints in the month range
    const complaints = await Complaint.find({
      assignedCentreId: targetScId,
      billGenerated: true,
      createdAt: { $gte: start, $lte: end },
    }).lean();

    let totalOwed = 0;
    const items = complaints.map((c) => {
      const calculation = calcBill(c);
      totalOwed += calculation.total;
      return {
        _id: c._id,
        complaintId: c.complaintId,
        customerName: c.customerName,
        product: c.product,
        warrantyStatus: c.warrantyStatus,
        createdAt: c.createdAt,
        total: calculation.total,
        preset: calculation.preset,
        petrol: calculation.petrol,
        extrasTotal: calculation.extrasTotal,
        customerPaymentAmount: calculation.customerPaymentAmount,
      };
    });

    res.status(200).json({
      serviceCentreId: sc._id,
      businessName: sc.businessName,
      ownerName: sc.ownerName,
      month: m,
      year: y,
      totalOwed,
      complaintCount: complaints.length,
      complaints: items,
    });
  } catch (error) {
    console.error('Error in getMonthlyInvoice:', error);
    res.status(500).json({ message: 'Server error while calculating invoice.' });
  }
};

module.exports = {
  getComplaintBills,
  getMonthlyInvoice,
};
