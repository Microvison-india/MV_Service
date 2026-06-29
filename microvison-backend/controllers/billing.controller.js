const Complaint = require('../models/Complaint');
const ServiceCentre = require('../models/ServiceCentre');
const { calcBill } = require('../utils/billingCalculator');

// @desc    Get itemized complaint bills with filters (closed complaints only)
// @route   GET /api/billing/complaints
// @access  Private (Admin or SC)
const getComplaintBills = async (req, res) => {
  try {
    const { product, warrantyStatus, paymentStatus, dateFrom, dateTo, month, year } = req.query;

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

    // Payment Status filter
    if (paymentStatus === 'paid') {
      query.paymentStatus = 'paid';
    } else if (paymentStatus === 'unpaid') {
      query.paymentStatus = { $ne: 'paid' };
    }

    // Date filtering — billLockedAt is the true billing date
    if (dateFrom || dateTo) {
      const { parseLocalDate } = require('../utils/dateParser');
      const tzOffset = req.headers['x-timezone-offset'];
      query.billLockedAt = {};
      if (dateFrom) query.billLockedAt.$gte = parseLocalDate(dateFrom, tzOffset, false);
      if (dateTo) query.billLockedAt.$lte = parseLocalDate(dateTo, tzOffset, true);
    } else if (month && year) {
      // Legacy fallback
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      query.billLockedAt = {
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59, 999)
      };
    }

    const complaints = await Complaint.find(query)
      .populate('assignedCentreId', 'businessName ownerName phone1')
      .sort({ billLockedAt: -1 })
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
        billLockedAt: c.billLockedAt,
        createdAt: c.createdAt,
        assignedCentreId: c.assignedCentreId,
        paymentStatus: c.paymentStatus || 'unpaid',
        paidAt: c.paidAt,
        paidBy: c.paidBy,
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
    const { month, year, dateFrom, dateTo, paymentStatus } = req.query;

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

    let start, end;
    if (dateFrom || dateTo) {
      const { parseLocalDate } = require('../utils/dateParser');
      const tzOffset = req.headers['x-timezone-offset'];
      start = dateFrom ? parseLocalDate(dateFrom, tzOffset, false) : new Date(0);
      end   = dateTo   ? parseLocalDate(dateTo, tzOffset, true) : new Date();
    } else if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      start = new Date(y, m - 1, 1);
      end   = new Date(y, m, 0, 23, 59, 59, 999);
    } else {
      return res.status(400).json({ message: 'Provide dateFrom/dateTo or month/year.' });
    }

    // Fetch closed, bill-generated complaints in the date range
    const invoiceQuery = {
      assignedCentreId: targetScId,
      billGenerated: true,
      billLockedAt: { $gte: start, $lte: end },
    };

    if (paymentStatus === 'paid') {
      invoiceQuery.paymentStatus = 'paid';
    } else if (paymentStatus === 'unpaid') {
      invoiceQuery.paymentStatus = { $ne: 'paid' };
    }

    const complaints = await Complaint.find(invoiceQuery).lean();

    let totalOwed = 0, totalPaid = 0, totalUnpaid = 0;
    const items = complaints.map((c) => {
      const calculation = calcBill(c);
      const total = calculation.total;
      totalOwed += total;
      if (c.paymentStatus === 'paid') {
        totalPaid += total;
      } else {
        totalUnpaid += total;
      }
      return {
        _id: c._id,
        complaintId: c.complaintId,
        customerName: c.customerName,
        product: c.product,
        warrantyStatus: c.warrantyStatus,
        createdAt: c.createdAt,
        billLockedAt: c.billLockedAt,
        paymentStatus: c.paymentStatus || 'unpaid',
        paidAt: c.paidAt,
        paidBy: c.paidBy,
        total: total,
        preset: calculation.preset,
        petrol: calculation.petrol,
        extrasTotal: calculation.extrasTotal,
        // Change 6A: unified customerPaidToSC replaces old single field
        customerPaidToSC: calculation.customerPaidToSC,
        customerPaidToMicrovison: calculation.customerPaidToMicrovison,
        // Change 6A: itemized SC deductions (SC-visible — amounts paid to SC, deducted from their bill)
        toSCPayments: calculation.toSCPayments || [],
        // Legacy fields kept for backward compatibility
        customerPaymentAmount: calculation.customerPaidToSC,
        customerChargePaidToSCAmount: c.customerChargePaidToSCAmount || 0,
        customerChargeReason: c.customerChargeReason || '',
      };
    });

    res.status(200).json({
      serviceCentreId: sc._id,
      businessName: sc.businessName,
      ownerName: sc.ownerName,
      month: month ? parseInt(month, 10) : null,
      year: year ? parseInt(year, 10) : null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      totalOwed,
      totalPaid,
      totalUnpaid,
      complaintCount: complaints.length,
      complaints: items,
    });
  } catch (error) {
    console.error('Error in getMonthlyInvoice:', error);
    res.status(500).json({ message: 'Server error while calculating invoice.' });
  }
};

// @desc    Mark bills as paid
// @route   PATCH /api/billing/mark-paid
// @access  Private (Admin only)
const markBillsPaid = async (req, res) => {
  try {
    const query = { billGenerated: true, paymentStatus: { $ne: 'paid' } };

    if (req.body.billIds && Array.isArray(req.body.billIds)) {
      query._id = { $in: req.body.billIds };
    } else if (req.body.filters) {
      const { assignedCentreId, dateFrom, dateTo, product, warrantyStatus } = req.body.filters;
      if (assignedCentreId) query.assignedCentreId = assignedCentreId;
      if (product) query.product = product;
      if (warrantyStatus) query.warrantyStatus = warrantyStatus;
      if (dateFrom || dateTo) {
        query.billLockedAt = {};
        if (dateFrom) query.billLockedAt.$gte = new Date(dateFrom);
        if (dateTo) {
          const d = new Date(dateTo);
          d.setHours(23, 59, 59, 999);
          query.billLockedAt.$lte = d;
        }
      }
    } else {
      return res.status(400).json({ message: 'Provide billIds or filters.' });
    }

    const result = await Complaint.updateMany(query, {
      $set: { paymentStatus: 'paid', paidAt: new Date(), paidBy: req.user.id }
    });

    res.status(200).json({ message: 'Bills marked as paid.', updatedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error in markBillsPaid:', error);
    res.status(500).json({ message: 'Server error while marking bills as paid.' });
  }
};

// @desc    Mark bills as unpaid (revert)
// @route   PATCH /api/billing/mark-unpaid
// @access  Private (Admin only)
const markBillsUnpaid = async (req, res) => {
  try {
    const query = { billGenerated: true, paymentStatus: 'paid' };

    if (req.body.billIds && Array.isArray(req.body.billIds)) {
      query._id = { $in: req.body.billIds };
    } else if (req.body.filters) {
      const { assignedCentreId, dateFrom, dateTo, product, warrantyStatus } = req.body.filters;
      if (assignedCentreId) query.assignedCentreId = assignedCentreId;
      if (product) query.product = product;
      if (warrantyStatus) query.warrantyStatus = warrantyStatus;
      if (dateFrom || dateTo) {
        query.billLockedAt = {};
        if (dateFrom) query.billLockedAt.$gte = new Date(dateFrom);
        if (dateTo) {
          const d = new Date(dateTo);
          d.setHours(23, 59, 59, 999);
          query.billLockedAt.$lte = d;
        }
      }
    } else {
      return res.status(400).json({ message: 'Provide billIds or filters.' });
    }

    const result = await Complaint.updateMany(query, {
      $set: { paymentStatus: 'unpaid', paidAt: null, paidBy: null }
    });

    res.status(200).json({ message: 'Bills marked as unpaid.', updatedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error in markBillsUnpaid:', error);
    res.status(500).json({ message: 'Server error while marking bills as unpaid.' });
  }
};

module.exports = {
  getComplaintBills,
  getMonthlyInvoice,
  markBillsPaid,
  markBillsUnpaid,
};
