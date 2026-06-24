const Complaint = require('../models/Complaint');
const ComplaintUpdate = require('../models/ComplaintUpdate');
const Preset = require('../models/Preset');
const ServiceCentre = require('../models/ServiceCentre');
const Product = require('../models/Product');
const generateComplaintId = require('../utils/generateComplaintId');
const generateTrackingId = require('../utils/generateTrackingId');
const { calculateWarranty } = require('../utils/warrantyCalculator');
const { findReopenEligible } = require('../utils/reopenChecker');
const sendWhatsApp = require('../utils/sendWhatsApp');

// Helper to generate flexible regex pattern string for matching complaint IDs (e.g. MV-2026-00005, MV005, 00005)
const makeComplaintIdPattern = (term) => {
  if (!term) return '';
  const clean = term.trim().toLowerCase();
  
  if (clean.startsWith('m')) {
    const pattern = clean.replace(/[^a-z0-9]/g, '.*');
    return pattern;
  }
  
  const digits = clean.replace(/[^0-9]/g, '');
  if (digits) {
    if (digits.startsWith('20') && digits.length >= 9) {
      const year = digits.slice(0, 4);
      const serial = digits.slice(4);
      return year + '.*' + serial;
    } else {
      return digits;
    }
  }
  return clean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};


// ─────────────────────────────────────────────────────────────
// @desc    Check if a customer's phone number is reopen-eligible
// @route   GET /api/complaints/reopen-check
// @access  Private (Admin only)
// Query params: phone1, product, complaintType
// ─────────────────────────────────────────────────────────────
const reopenCheck = async (req, res) => {
  const { phone1, product, complaintType } = req.query;

  if (!phone1 || !product || !complaintType) {
    return res
      .status(400)
      .json({ message: 'phone1, product, and complaintType are required.' });
  }

  const existing = await findReopenEligible(phone1, product, complaintType);

  if (existing) {
    return res.status(200).json({
      reopenEligible: true,
      existingComplaint: existing,
    });
  }

  return res.status(200).json({ reopenEligible: false, existingComplaint: null });
};

// ─────────────────────────────────────────────────────────────
// @desc    Reopen a closed complaint (creates a new complaint referencing the old one)
// @route   POST /api/complaints/:id/reopen
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const reopenComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { reopenNotes, reopenPhotos } = req.body;

    if (!reopenNotes || !reopenNotes.trim()) {
      return res.status(400).json({ message: 'Reopen notes are required.' });
    }

    const parent = await Complaint.findById(id);
    if (!parent) {
      return res.status(404).json({ message: 'Original complaint not found.' });
    }

    // Strict eligibility checks:
    // 1. Current status must be 'closed'
    if (parent.status !== 'closed') {
      return res.status(400).json({ message: 'Only closed complaints can be reopened.' });
    }

    // 2. Created within the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (parent.createdAt < thirtyDaysAgo) {
      return res.status(400).json({ message: 'Complaint cannot be reopened after 30 days.' });
    }

    // 3. Pre-closed resolution must be done or not_done
    const updateLog = await ComplaintUpdate.findOne({
      complaintId: parent._id,
      newStatus: 'closed',
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!updateLog || !['done', 'not_done'].includes(updateLog.oldStatus)) {
      return res.status(400).json({
        message: 'Only complaints resolved as Done or Not Done can be reopened.',
      });
    }

    // 4. Generate new complaint ID
    const newComplaintId = await generateComplaintId(parent.complaintType, parent.warrantyStatus);

    // 5. Create the reopened complaint record
    const reopened = await Complaint.create({
      complaintId: newComplaintId,
      customerName: parent.customerName,
      phone1: parent.phone1,
      phone2: parent.phone2,
      localAddress: parent.localAddress,
      city: parent.city,
      district: parent.district,
      state: parent.state,
      product: parent.product,
      complaintType: parent.complaintType,
      warrantyStatus: parent.warrantyStatus,
      presetId: parent.presetId,
      presetName: parent.presetName,
      presetPrice: parent.presetPrice,
      petrolAdmin: parent.petrolAdmin,
      petrolSC: null,
      petrolFinal: null,
      petrolEditCount: 0,
      petrolLocked: false,
      extraCharges: [],
      customerPaymentAmount: null,
      notes: parent.notes,
      adminPhotos: parent.adminPhotos,
      voiceNoteUrl: parent.voiceNoteUrl,
      
      // Reopen flags
      isReopened: true,
      reopenedAt: new Date(),
      reopenParentId: parent._id,
      reopenNotes: reopenNotes.trim(),
      reopenPhotos: reopenPhotos || [],
      
      status: 'unassigned',
      createdBy: req.user.id,
    });

    // Create ComplaintUpdate log for the new reopened complaint
    await ComplaintUpdate.create({
      complaintId: reopened._id,
      updatedBy: req.user.id,
      role: 'admin',
      oldStatus: '',
      newStatus: 'unassigned',
      note: `Complaint reopened from ${parent.complaintId}. Reopen notes: ${reopenNotes.trim()}`,
    });

    // TODO (Phase 14): Send WhatsApp template 'complaint_reopened' to SC on assignment

    res.status(201).json({
      message: 'Complaint reopened successfully.',
      complaint: reopened,
    });

    // Trigger 4: Send "Complaint Reopened" msg to Customer
    const templateReopened = process.env.WHATSAPP_TEMPLATE_REOPENED || 'complaint_reopened';
    sendWhatsApp(reopened.phone1, templateReopened, [
      reopened.customerName,
      reopened.complaintId,
      reopenNotes.trim(),
      new Date(reopened.createdAt).toLocaleDateString('en-IN')
    ]);
  } catch (error) {
    console.error('Error in reopenComplaint:', error);
    res.status(500).json({ message: 'Server error while reopening complaint.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Create a new complaint (status = 'unassigned', no SC assigned yet)
// @route   POST /api/complaints
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const createComplaint = async (req, res) => {
  const {
    // Step 1
    customerName,
    phone1,
    phone2,
    localAddress,
    city,
    district,
    state,

    // Step 2
    trackingId,      // Optional from frontend if an existing product is selected
    serialNumber,    // Optional from frontend
    product,
    complaintType,
    warrantyStatus,  // Manual fallback from frontend if no billDate
    billPhoto,       // New from frontend
    billDate,        // New from frontend

    // Step 3
    presetId,
    petrolAdmin,
    extraCharges,   // Array of { label, amount }
    notes,
    voiceNoteUrl,
    adminPhotos,    // Array of Cloudinary URLs

    // Reopen flow
    isReopened,
    reopenParentId,
    reopenNotes,
    reopenPhotos,
  } = req.body;

  // ── Validate required fields ──────────────────────────────
  if (!customerName || !phone1 || !localAddress || !city || !district || !state) {
    return res.status(400).json({ message: 'Customer info fields are required.' });
  }
  if (!product || !complaintType) {
    return res.status(400).json({ message: 'Product and complaint type are required.' });
  }

  // ── Business rules ────────────────────────────────────────
  // Coolers cannot be "installation" type (GRD Section 6.2)
  if (product === 'cooler' && complaintType === 'installation') {
    return res
      .status(400)
      .json({ message: 'Coolers do not support installation complaints.' });
  }

  // In-warranty: preset is required (either presetId OR custom presetName & presetPrice)
  if (warrantyStatus === 'in_warranty' && !presetId && (!req.body.presetName || req.body.presetPrice == null)) {
    return res
      .status(400)
      .json({ message: 'A preset or custom manual preset must be provided for in-warranty complaints.' });
  }

  // Reopen: reopenNotes is required (GRD Section 8)
  if (isReopened && (!reopenNotes || !reopenNotes.trim())) {
    return res
      .status(400)
      .json({ message: 'Reopen notes are required when reopening a complaint.' });
  }

  // ── Snapshot preset price (locked forever at creation) ────
  let snapshotPresetName = '';
  let snapshotPresetPrice = null;

  if (warrantyStatus === 'in_warranty') {
    if (presetId) {
      const preset = await Preset.findById(presetId).lean();
      if (!preset) {
        return res.status(404).json({ message: 'Selected preset not found.' });
      }
      snapshotPresetName = preset.packageName;
      snapshotPresetPrice = preset.price;
    } else {
      snapshotPresetName = req.body.presetName;
      snapshotPresetPrice = Number(req.body.presetPrice);
    }
  }

  // ── Build extra charges array ─────────────────────────────
  // Admin-added extras at registration are auto-approved
  const formattedExtras = Array.isArray(extraCharges)
    ? extraCharges.map((ec) => ({
        label: ec.label,
        amount: ec.amount,
        requestedBy: 'admin',
        status: 'approved', // Admin-added extras are pre-approved
      }))
    : [];

  // ── Petrol tracking ───────────────────────────────────────
  const petrolValue = (petrolAdmin != null) ? Number(petrolAdmin) : null;
  const petrolEditCount = petrolValue != null ? 1 : 0;

  // ── Product Tracking (Addendum v1.2) ──────────────────────
  let productRecord;
  let finalWarrantyStatus = warrantyStatus;
  let finalWarrantyExpiryDate = null;
  let finalWarrantySource = 'manual';

  // Calculate final warranty based on provided bill info and manual fallbacks
  const calculated = calculateWarranty(billDate, complaintType, warrantyStatus);
  finalWarrantyStatus = calculated.warrantyStatus;
  finalWarrantyExpiryDate = calculated.warrantyExpiryDate;
  finalWarrantySource = calculated.warrantySource;

  // ── Generate unique complaint ID ──────────────────────────
  const complaintId = await generateComplaintId(complaintType, finalWarrantyStatus);

  if (trackingId) {
    // Existing product linked
    productRecord = await Product.findOne({ trackingId });
    if (!productRecord) {
      return res.status(404).json({ message: 'Linked product tracking ID not found.' });
    }
    // Update product with latest info
    productRecord.customerName = customerName;
    productRecord.phone1 = phone1;
    if (phone2) productRecord.phone2 = phone2;
    productRecord.localAddress = localAddress;
    productRecord.city = city;
    productRecord.district = district;
    productRecord.state = state;
    if (serialNumber && serialNumber !== productRecord.serialNumber) {
      const existing = await Product.findOne({ serialNumber });
      if (existing && existing.trackingId !== trackingId) {
         return res.status(400).json({ message: 'Serial number already exists on another product.' });
      }
      productRecord.serialNumber = serialNumber;
      productRecord.hasSerial = true;
    }
    // Only update bill info if provided newly, else keep existing
    if (billDate !== undefined) {
      productRecord.billDate = billDate;
      productRecord.billPhoto = billPhoto || productRecord.billPhoto;
      productRecord.warrantyStatus = finalWarrantyStatus;
      productRecord.warrantyExpiryDate = finalWarrantyExpiryDate;
      productRecord.warrantySource = finalWarrantySource;
    } else {
      // If no new billDate provided, use the product's existing warranty for the complaint snapshot
      finalWarrantyStatus = productRecord.warrantyStatus;
      finalWarrantyExpiryDate = productRecord.warrantyExpiryDate;
      finalWarrantySource = productRecord.warrantySource;
    }
  } else {
    // Brand new product
    if (serialNumber) {
      const existing = await Product.findOne({ serialNumber });
      if (existing) return res.status(400).json({ message: 'Serial number already exists.' });
    }
    const newTrackingId = await generateTrackingId(product);
    productRecord = new Product({
      trackingId: newTrackingId,
      serialNumber: serialNumber || undefined,
      hasSerial: !!serialNumber,
      product,
      customerName,
      phone1: String(phone1),
      phone2: phone2 ? String(phone2) : '',
      localAddress,
      city,
      district,
      state,
      billPhoto: billPhoto || '',
      billDate: billDate || null,
      warrantyStatus: finalWarrantyStatus,
      warrantyExpiryDate: finalWarrantyExpiryDate,
      warrantySource: finalWarrantySource,
      complaintHistory: []
    });
  }

  // ── Create the complaint document ─────────────────────────
  const complaint = await Complaint.create({
    complaintId,
    trackingId: productRecord._id,
    serialNumber: serialNumber || productRecord.serialNumber || null,
    billPhoto: billPhoto || productRecord.billPhoto || '',
    billDate: billDate || productRecord.billDate || null,
    warrantyStatus: finalWarrantyStatus,
    warrantyExpiryDate: finalWarrantyExpiryDate,
    warrantySource: finalWarrantySource,
    customerName,
    phone1: String(phone1),
    phone2: phone2 ? String(phone2) : '',
    localAddress,
    city,
    district,
    state,
    product,
    complaintType,
    presetId: finalWarrantyStatus === 'in_warranty' ? presetId : null,
    presetName: snapshotPresetName,
    presetPrice: snapshotPresetPrice,
    petrolAdmin: finalWarrantyStatus === 'in_warranty' ? petrolValue : null,
    petrolEditCount: finalWarrantyStatus === 'in_warranty' ? petrolEditCount : 0,
    extraCharges: formattedExtras,
    notes: notes || '',
    voiceNoteUrl: voiceNoteUrl || '',
    adminPhotos: Array.isArray(adminPhotos) ? adminPhotos : [],
    isReopened: !!isReopened,
    reopenParentId: isReopened ? reopenParentId : null,
    reopenNotes: isReopened ? reopenNotes : '',
    reopenPhotos: isReopened && Array.isArray(reopenPhotos) ? reopenPhotos : [],
    status: 'unassigned',
    createdBy: req.user.id,
  });

  // ── Update Product History ──────────────────────────────
  productRecord.complaintHistory.push({
    complaintId: complaint._id,
    mvId: complaint.complaintId,
    type: complaintType,
    status: complaint.status,
    date: complaint.createdAt,
    assignedCentreId: null
  });
  productRecord.lastComplaintId = complaint._id;
  productRecord.lastComplaintDate = complaint.createdAt;
  await productRecord.save();

  // ── Log initial status update ─────────────────────────────
  await ComplaintUpdate.create({
    complaintId: complaint._id,
    updatedBy: req.user.id,
    role: 'admin',
    oldStatus: '',
    newStatus: 'unassigned',
    note: isReopened ? `Complaint reopened. Notes: ${reopenNotes}` : 'Complaint registered.',
  });

  res.status(201).json({
    message: 'Complaint created successfully.',
    complaint,
  });

  // Asynchronous WhatsApp notification
  if (isReopened) {
    const templateReopened = process.env.WHATSAPP_TEMPLATE_REOPENED || 'complaint_reopened';
    sendWhatsApp(complaint.phone1, templateReopened, [
      complaint.customerName,
      complaint.complaintId,
      reopenNotes || '',
      new Date(complaint.createdAt).toLocaleDateString('en-IN')
    ]);
  } else {
    const templateName = process.env.WHATSAPP_TEMPLATE_COMPLAINT_RECEIVED || 'complaint_received';
    const complaintDate = new Date(complaint.createdAt).toLocaleDateString('en-IN');
    sendWhatsApp(complaint.phone1, templateName, [
      complaint.customerName,
      complaint.complaintId,
      complaint.product === 'cooler' ? 'Cooler' : 'LED TV',
      complaint.complaintType,
      complaintDate
    ]);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Assign a complaint to a Service Centre (status = 'assigned')
// @route   PATCH /api/complaints/:id/assign
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const assignComplaint = async (req, res) => {
  const { id } = req.params;
  const { serviceCentreId } = req.body;

  if (!serviceCentreId) {
    return res.status(400).json({ message: 'serviceCentreId is required.' });
  }

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found.' });
  }

  // Only allow assigning if status is 'unassigned', 'new' or 're-assigning' after 'rejected_by_sc'
  if (!['unassigned', 'new', 'rejected_by_sc'].includes(complaint.status)) {
    return res.status(400).json({
      message: `Cannot assign a complaint with status '${complaint.status}'.`,
    });
  }

  const sc = await ServiceCentre.findById(serviceCentreId);
  if (!sc || sc.status !== 'active') {
    return res.status(404).json({ message: 'Active Service Centre not found.' });
  }

  const oldStatus = complaint.status;

  complaint.assignedCentreId = serviceCentreId;
  complaint.assignedAt = new Date();
  complaint.status = 'assigned';
  await complaint.save();

  // Log the assignment
  await ComplaintUpdate.create({
    complaintId: complaint._id,
    updatedBy: req.user.id,
    role: 'admin',
    oldStatus,
    newStatus: 'assigned',
    note: `Assigned to ${sc.businessName}.`,
  });

  res.status(200).json({
    message: `Complaint assigned to ${sc.businessName} successfully.`,
    complaint,
  });

  // Trigger 2: Send SC details to Customer
  const templateCustomer = process.env.WHATSAPP_TEMPLATE_SC_DETAILS || 'sc_details_to_customer';
  sendWhatsApp(complaint.phone1, templateCustomer, [
    complaint.customerName,
    complaint.complaintId,
    sc.businessName,
    sc.ownerName,
    sc.phone1
  ]);

  // Trigger 3: Send basic complaint details to Assigned SC (WA-01)
  const templateSC = process.env.WHATSAPP_TEMPLATE_COMPLAINT_SC || 'complaint_details_to_sc';
  const customerAddress = `${complaint.localAddress}, ${complaint.city}, ${complaint.district}, ${complaint.state}`;
  
  let reopenInfo = 'NO';
  if (complaint.isReopened && complaint.reopenParentId) {
    const parent = await Complaint.findById(complaint.reopenParentId);
    reopenInfo = `REOPENED (Original Job ID: ${parent ? parent.complaintId : 'Unknown'})`;
  }

  sendWhatsApp(sc.phone1, templateSC, [
    sc.ownerName,
    complaint.complaintId,
    complaint.customerName,
    complaint.phone1,
    customerAddress,
    complaint.product === 'cooler' ? 'Cooler' : 'LED TV',
    complaint.complaintType,
    complaint.warrantyStatus === 'in_warranty' ? 'In Warranty' : 'Out of Warranty',
    complaint.notes || 'None',
    process.env.PORTAL_LOGIN_URL || 'https://microvisonservice.co.in/login',
    reopenInfo
  ]);
};

// ─────────────────────────────────────────────────────────────
// @desc    Get complaints assigned to the logged-in SC (with optional status filter)
// @route   GET /api/complaints/my
// @access  Private (SC only)
// ─────────────────────────────────────────────────────────────
const getMyComplaints = async (req, res) => {
  const { status, product, complaintType, warrantyStatus, dateFrom, dateTo } = req.query;

  // Find the SC profile for this logged-in user
  const sc = await ServiceCentre.findOne({ userId: req.user.id });
  if (!sc) {
    return res.status(404).json({ message: 'Service Centre profile not found.' });
  }

  const filter = { assignedCentreId: sc._id };

  // Optional filters
  if (status) {
    // Allow comma-separated status values e.g. ?status=assigned,accepted
    const statuses = status.split(',').map((s) => s.trim());
    filter.status = { $in: statuses };
  }
  if (product) filter.product = product;
  if (complaintType) filter.complaintType = complaintType;
  if (warrantyStatus) filter.warrantyStatus = warrantyStatus;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const complaints = await Complaint.find(filter)
    .sort({ assignedAt: -1 })
    .lean();

  res.status(200).json({ complaints });
};

// ─────────────────────────────────────────────────────────────
// @desc    SC accepts a complaint (assigned → accepted)
// @route   PATCH /api/complaints/:id/accept
// @access  Private (SC only)
// ─────────────────────────────────────────────────────────────
const acceptComplaint = async (req, res) => {
  const sc = await ServiceCentre.findOne({ userId: req.user.id });
  if (!sc) return res.status(404).json({ message: 'Service Centre profile not found.' });

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  // Security: make sure this SC owns this complaint
  if (String(complaint.assignedCentreId) !== String(sc._id)) {
    return res.status(403).json({ message: 'Not authorised to act on this complaint.' });
  }

  if (complaint.status !== 'assigned') {
    return res.status(400).json({ message: `Cannot accept a complaint with status '${complaint.status}'.` });
  }

  complaint.status = 'accepted';
  await complaint.save();

  await ComplaintUpdate.create({
    complaintId: complaint._id,
    updatedBy: req.user.id,
    role: 'service_centre',
    oldStatus: 'assigned',
    newStatus: 'accepted',
    note: 'SC accepted the complaint.',
  });

  res.status(200).json({ message: 'Complaint accepted.', complaint });

  // Trigger WA-04: Sent to Customer immediately on SC acceptance
  const templateCustomer = process.env.WHATSAPP_TEMPLATE_ACCEPT_CUSTOMER || 'sc_accept_to_customer';
  const productType = complaint.product === 'cooler' ? 'Cooler' : 'LED TV';
  const complaintType = complaint.complaintType === 'installation' ? 'Installation' : 'Complaint';
  
  sendWhatsApp(complaint.phone1, templateCustomer, [
    complaint.complaintId,
    productType,
    complaintType,
    sc.businessName,
    sc.phone1
  ]);

  if (complaint.phone2) {
    sendWhatsApp(complaint.phone2, templateCustomer, [
      complaint.complaintId,
      productType,
      complaintType,
      sc.businessName,
      sc.phone1
    ]);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    SC rejects a complaint (assigned → rejected_by_sc)
// @route   PATCH /api/complaints/:id/reject
// @access  Private (SC only)
// ─────────────────────────────────────────────────────────────
const rejectComplaint = async (req, res) => {
  const { note } = req.body;

  const sc = await ServiceCentre.findOne({ userId: req.user.id });
  if (!sc) return res.status(404).json({ message: 'Service Centre profile not found.' });

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  if (String(complaint.assignedCentreId) !== String(sc._id)) {
    return res.status(403).json({ message: 'Not authorised to act on this complaint.' });
  }

  if (complaint.status !== 'assigned') {
    return res.status(400).json({ message: `Cannot reject a complaint with status '${complaint.status}'.` });
  }

  complaint.status = 'rejected_by_sc';
  await complaint.save();

  await ComplaintUpdate.create({
    complaintId: complaint._id,
    updatedBy: req.user.id,
    role: 'service_centre',
    oldStatus: 'assigned',
    newStatus: 'rejected_by_sc',
    note: note ? note.trim() : 'SC rejected the complaint.',
  });

  res.status(200).json({ message: 'Complaint rejected. Admin will reassign.', complaint });
};

// ─────────────────────────────────────────────────────────────
// @desc    SC marks complaint as 'going' (accepted → going)
// @route   PATCH /api/complaints/:id/going
// @access  Private (SC only)
// ─────────────────────────────────────────────────────────────
const markGoing = async (req, res) => {
  const sc = await ServiceCentre.findOne({ userId: req.user.id });
  if (!sc) return res.status(404).json({ message: 'Service Centre profile not found.' });

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  if (String(complaint.assignedCentreId) !== String(sc._id)) {
    return res.status(403).json({ message: 'Not authorised to act on this complaint.' });
  }

  if (complaint.status !== 'accepted') {
    return res.status(400).json({ message: `Cannot mark as going from status '${complaint.status}'.` });
  }

  complaint.status = 'going';
  await complaint.save();

  await ComplaintUpdate.create({
    complaintId: complaint._id,
    updatedBy: req.user.id,
    role: 'service_centre',
    oldStatus: 'accepted',
    newStatus: 'going',
    note: 'SC is on the way.',
  });

  res.status(200).json({ message: 'Status updated to going.', complaint });
};

// ─────────────────────────────────────────────────────────────
// @desc    SC submits final status update after visit
// @route   PATCH /api/complaints/:id/status
// @access  Private (SC only)
// Body: { newStatus, proofPhotos[], scNotes, petrolSC (optional),
//         extraChargeRequest { label, amount } (optional),
//         customerPaymentAmount (out-of-warranty, required) }
// ─────────────────────────────────────────────────────────────
const updateStatus = async (req, res) => {
  const {
    newStatus,
    proofPhotos,
    scNotes,
    petrolSC,
    extraChargeRequest,
    customerPaymentAmount,
    // SC Flow v1.1 Fields
    notDoneReason,
    notDoneVoiceUrl,
    partDetails,
    partPendingVoiceUrl,
    doneVoiceUrl,
    distanceTravelled,
    totalVisits,
    extraCharges,
  } = req.body;

  const ALLOWED_FINAL_STATUSES = ['done', 'not_done', 'part_pending'];

  if (!ALLOWED_FINAL_STATUSES.includes(newStatus)) {
    return res.status(400).json({
      message: `Invalid status. Allowed: ${ALLOWED_FINAL_STATUSES.join(', ')}.`,
    });
  }

  const sc = await ServiceCentre.findOne({ userId: req.user.id });
  if (!sc) return res.status(404).json({ message: 'Service Centre profile not found.' });

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  if (String(complaint.assignedCentreId) !== String(sc._id)) {
    return res.status(403).json({ message: 'Not authorised to act on this complaint.' });
  }

  // Must be in accepted, going, part_received, or not_done state to submit final result (SC Flow v1.1)
  if (!['accepted', 'going', 'part_received', 'not_done'].includes(complaint.status)) {
    return res.status(400).json({
      message: `Cannot submit final status from current status '${complaint.status}'.`,
    });
  }

  const photos = Array.isArray(proofPhotos) ? proofPhotos : [];
  const oldStatus = complaint.status;
  let timelineNote = '';
  let timelineVoiceUrl = '';

  // ── Path 1: Done ─────────────────────────────────────────────────────────
  if (newStatus === 'done') {
    if (photos.length < 1) {
      return res.status(400).json({ message: 'At least one proof photo is required before marking as done.' });
    }

    if (complaint.warrantyStatus === 'out_of_warranty') {
      if (customerPaymentAmount == null || customerPaymentAmount === '') {
        return res.status(400).json({ message: 'Amount collected from customer is required for out-of-warranty completed jobs.' });
      }
      complaint.customerPaymentAmount = Number(customerPaymentAmount);
    }

    // Save lifecycle metrics
    if (totalVisits != null && totalVisits !== '') {
      complaint.totalVisits = Number(totalVisits);
    }
    if (distanceTravelled != null && distanceTravelled !== '') {
      complaint.distanceTravelled = Number(distanceTravelled);
    }
    if (doneVoiceUrl) {
      complaint.doneVoiceUrl = doneVoiceUrl;
    }

    // Petrol Edit 2 — SC's turn only if editCount is 0 or 1 and in-warranty (GRD 6.3)
    if (
      complaint.warrantyStatus === 'in_warranty' &&
      petrolSC != null &&
      petrolSC !== '' &&
      (complaint.petrolEditCount === 1 || complaint.petrolEditCount === 0) &&
      !complaint.petrolLocked
    ) {
      complaint.petrolSC = Number(petrolSC);
      complaint.petrolEditCount = 2;
    }

    // Preserve existing extra charges and append only new ones
    const updatedCharges = [];
    for (const ec of complaint.extraCharges) {
      const foundInFrontend = Array.isArray(extraCharges) && extraCharges.find(item => item._id && String(item._id) === String(ec._id));
      if (foundInFrontend) {
        updatedCharges.push(ec);
      } else if (ec.requestedBy === 'admin') {
        updatedCharges.push(ec);
      }
    }
    if (Array.isArray(extraCharges)) {
      for (const item of extraCharges) {
        if (!item._id && item.label && item.label.trim() && item.amount) {
          updatedCharges.push({
            label: item.label.trim(),
            amount: Number(item.amount),
            requestedBy: 'sc',
            status: 'pending',
          });
        }
      }
    }
    complaint.extraCharges = updatedCharges;
    // Backward compatibility for single extra charge request
    if (extraChargeRequest && extraChargeRequest.label && extraChargeRequest.amount) {
      complaint.extraCharges.push({
        label: extraChargeRequest.label.trim(),
        amount: Number(extraChargeRequest.amount),
        requestedBy: 'sc',
        status: 'pending',
      });
    }

    if (scNotes) complaint.scNotes = scNotes.trim();
    timelineNote = scNotes ? scNotes.trim() : 'SC marked as done.';
    timelineVoiceUrl = doneVoiceUrl || '';
  }

  // ── Path 2: Not Done ─────────────────────────────────────────────────────
  else if (newStatus === 'not_done') {
    const hasReason = notDoneReason && notDoneReason.trim() !== '';
    const hasVoice = notDoneVoiceUrl && notDoneVoiceUrl.trim() !== '';

    if (!hasReason && !hasVoice) {
      return res.status(400).json({ message: 'Either a text reason or a voice note is required before marking as not done.' });
    }

    if (notDoneReason) complaint.notDoneReason = notDoneReason.trim();
    if (notDoneVoiceUrl) complaint.notDoneVoiceUrl = notDoneVoiceUrl;

    if (scNotes) complaint.scNotes = scNotes.trim();
    timelineNote = notDoneReason ? `Not Done: ${notDoneReason.trim()}` : 'SC marked as not done (voice note attached).';
    timelineVoiceUrl = notDoneVoiceUrl || '';
  }

  // ── Path 3: Part Pending ─────────────────────────────────────────────────
  else if (newStatus === 'part_pending') {
    if (photos.length < 2) {
      return res.status(400).json({ message: 'At least two proof photos (proof of diagnosis) are required before marking as part pending.' });
    }
    if (!partDetails || partDetails.trim() === '') {
      return res.status(400).json({ message: 'Parts detail description is compulsory before marking as part pending.' });
    }
    if (!partPendingVoiceUrl || partPendingVoiceUrl.trim() === '') {
      return res.status(400).json({ message: 'A voice note explanation is compulsory before marking as part pending.' });
    }
    if (!scNotes || scNotes.trim() === '') {
      return res.status(400).json({ message: 'Text notes are compulsory before marking as part pending.' });
    }

    // Reset delivery details to trigger a new cycle
    complaint.partDetails = partDetails.trim();
    complaint.partPendingVoiceUrl = partPendingVoiceUrl;
    complaint.partDeliveredAt = null;
    complaint.partDeliveredNote = '';
    complaint.partReceivedAt = null;

    complaint.scNotes = scNotes.trim();
    timelineNote = `Part Pending: Sourcing requested for "${partDetails.trim()}". ${scNotes.trim()}`;
    timelineVoiceUrl = partPendingVoiceUrl;
  }

  complaint.status = newStatus;
  complaint.proofPhotos = photos;

  await complaint.save();

  const updateData = {
    complaintId: complaint._id,
    updatedBy: req.user.id,
    role: 'service_centre',
    oldStatus,
    newStatus,
    note: timelineNote,
    images: photos,
    voiceUrl: timelineVoiceUrl,
    scNotes: scNotes ? scNotes.trim() : '',
  };

  if (newStatus === 'part_pending') {
    updateData.partDetails = partDetails ? partDetails.trim() : '';
  } else if (newStatus === 'not_done') {
    updateData.notDoneReason = notDoneReason ? notDoneReason.trim() : '';
  } else if (newStatus === 'done') {
    if (totalVisits != null && totalVisits !== '') {
      updateData.totalVisits = Number(totalVisits);
    }
    if (distanceTravelled != null && distanceTravelled !== '') {
      updateData.distanceTravelled = Number(distanceTravelled);
    }
    updateData.petrolAdmin = complaint.petrolAdmin;
    updateData.petrolSC = complaint.petrolSC;
    updateData.extraCharges = complaint.extraCharges;
  }

  await ComplaintUpdate.create(updateData);

  res.status(200).json({ message: `Complaint status updated to ${newStatus}.`, complaint });
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin confirms the completed job, marking it closed.
// @route   PATCH /api/complaints/:id/confirm-done
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const confirmDone = async (req, res) => {
  const { id } = req.params;
  const complaint = await Complaint.findById(id);

  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found.' });
  }

  if (complaint.status !== 'done') {
    return res.status(400).json({ message: 'Complaint is not in Done status. Admin can only confirm completed Done jobs.' });
  }

  // Determine if bill should be generated. Generated for all closed complaints to track in Billing.
  const billGenerated = true;
  
  const oldStatus = complaint.status;
  
  complaint.status = 'closed';
  complaint.billGenerated = billGenerated;
  complaint.billLockedAt = new Date();
  
  // Update petrol Admin & SC estimates if sent
  if (req.body.petrolAdmin !== undefined && req.body.petrolAdmin !== null && req.body.petrolAdmin !== '') {
    complaint.petrolAdmin = Number(req.body.petrolAdmin);
  }
  if (req.body.petrolSC !== undefined && req.body.petrolSC !== null && req.body.petrolSC !== '') {
    complaint.petrolSC = Number(req.body.petrolSC);
  }

  // Admin final petrol lock (edit 3)
  if (req.body.petrolFinal !== undefined && req.body.petrolFinal !== null && req.body.petrolFinal !== '') {
    complaint.petrolFinal = Number(req.body.petrolFinal);
  } else {
    // If they just confirm without override, copy the last entered value
    if (complaint.petrolSC != null) {
      complaint.petrolFinal = complaint.petrolSC;
    } else if (complaint.petrolAdmin != null) {
      complaint.petrolFinal = complaint.petrolAdmin;
    } else {
      complaint.petrolFinal = 0;
    }
  }
  complaint.petrolLocked = true;
  complaint.petrolEditCount = 3;

  // Update extra charges if provided
  if (Array.isArray(req.body.extraCharges)) {
    complaint.extraCharges = req.body.extraCharges.map(ec => ({
      label: ec.label.trim(),
      amount: Number(ec.amount),
      requestedBy: ec.requestedBy || 'admin',
      status: ec.status || 'approved',
      approvedAt: ec.status === 'approved' ? (ec.approvedAt || new Date()) : (ec.approvedAt || null),
    }));
  }

  await complaint.save();

  await ComplaintUpdate.create({
    complaintId: complaint._id,
    updatedBy: req.user.id,
    role: 'admin',
    oldStatus,
    newStatus: 'closed',
    note: req.body.note ? req.body.note.trim() : 'Admin confirmed and closed the job.',
    petrolAdmin: complaint.petrolAdmin,
    petrolSC: complaint.petrolSC,
    petrolFinal: complaint.petrolFinal,
    extraCharges: complaint.extraCharges,
    scNotes: complaint.scNotes || '',
  });

  res.status(200).json({ message: 'Complaint confirmed and closed.', complaint });
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin disputes the job, sending it back to SC.
// @route   PATCH /api/complaints/:id/dispute-done
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const disputeDone = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  if (!note || note.trim() === '') {
    return res.status(400).json({ message: 'Dispute note is required.' });
  }

  const complaint = await Complaint.findById(id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  const oldStatus = complaint.status;
  
  // Bounce back to accepted
  complaint.status = 'accepted';
  
  await complaint.save();

  await ComplaintUpdate.create({
    complaintId: complaint._id,
    updatedBy: req.user.id,
    role: 'admin',
    oldStatus,
    newStatus: 'accepted',
    note: `Disputed: ${note.trim()}`,
  });

  res.status(200).json({ message: 'Job disputed and returned to SC.', complaint });
};

// ─────────────────────────────────────────────────────────────
// @desc    Approve or Reject an extra charge
// @route   PATCH /api/complaints/:id/extras/:extraId/approve
// @route   PATCH /api/complaints/:id/extras/:extraId/reject
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const handleExtraCharge = async (req, res, status) => {
  const { id, extraId } = req.params;
  const complaint = await Complaint.findById(id);

  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  const extra = complaint.extraCharges.id(extraId);
  if (!extra) return res.status(404).json({ message: 'Extra charge not found.' });

  extra.status = status;
  await complaint.save();

  res.status(200).json({ message: `Extra charge ${status}.`, complaint });
};

const approveExtra = (req, res) => handleExtraCharge(req, res, 'approved');
const rejectExtra = (req, res) => handleExtraCharge(req, res, 'rejected');

// ─────────────────────────────────────────────────────────────
// @desc    Get a single complaint by ID (with timeline updates)
// @route   GET /api/complaints/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const getComplaintById = async (req, res) => {
  const { id } = req.params;
  const complaint = await Complaint.findById(id)
    .populate('assignedCentreId', 'ownerName businessName phone1 email1')
    .populate({
      path: 'trackingId',
      populate: {
        path: 'complaintHistory.complaintId',
        select: 'status assignedCentreId reopenParentId isReopened'
      }
    });
    
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  // Security: If user is SC, they can only view their own assigned complaints
  if (req.user.role === 'service_centre') {
    const sc = await ServiceCentre.findOne({ userId: req.user.id });
    if (!sc || String(complaint.assignedCentreId?._id || complaint.assignedCentreId) !== String(sc._id)) {
      return res.status(403).json({ message: 'Access denied: You are not assigned to this complaint.' });
    }
  }

  const updates = await ComplaintUpdate.find({ complaintId: id }).sort({ createdAt: -1 });

  // Extract Product Timeline
  let productTimeline = [];
  if (complaint.trackingId && complaint.trackingId.complaintHistory) {
    productTimeline = complaint.trackingId.complaintHistory.map(item => {
      const plain = item.toObject ? item.toObject() : item;
      const compObj = plain.complaintId || {};
      const liveStatus = compObj.status || plain.status;
      const compId = compObj._id || plain.complaintId;
      const assignedCentreId = compObj.assignedCentreId || plain.assignedCentreId;
      return {
        ...plain,
        complaintId: compId,
        status: liveStatus,
        assignedCentreId: assignedCentreId,
        reopenParentId: compObj.reopenParentId || null,
        isReopened: compObj.isReopened || false,
        isCurrent: String(compId) === String(complaint._id)
      };
    });
  }

  res.status(200).json({ complaint, updates, productTimeline });
};

// ─────────────────────────────────────────────────────────────
// @desc    Get counts and lists for Admin Action Centre
// @route   GET /api/complaints/action-items
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const getActionItems = async (req, res) => {
  const ServiceCentre = require('../models/ServiceCentre'); // lazy import to avoid circular if any

  // 1. Pending SC Registrations
  const pendingSCRegistrations = await ServiceCentre.find({ status: 'pending' }).sort({ createdAt: -1 });

  // 2. Pending Confirmations (Jobs done by SC, waiting for admin to close)
  const pendingConfirmations = await Complaint.find({
    status: 'done'
  })
    .populate('assignedCentreId', 'ownerName businessName phone1')
    .sort({ updatedAt: -1 });

  // 3. Rejected by SC
  const rejectedBySC = await Complaint.find({ status: 'rejected_by_sc' })
    .populate('assignedCentreId', 'ownerName businessName phone1')
    .sort({ updatedAt: -1 });

  // 4. Pending Extra Approvals (Any complaint containing an extra charge with status='pending')
  const pendingExtraApprovals = await Complaint.find({
    'extraCharges.status': 'pending'
  })
    .populate('assignedCentreId', 'ownerName businessName phone1')
    .sort({ updatedAt: -1 });

  // 5. Part Pending Complaints (Sourcing requested, not yet delivered)
  const partPendingComplaints = await Complaint.find({
    status: 'part_pending',
    partDeliveredAt: null
  })
    .populate('assignedCentreId', 'ownerName businessName phone1')
    .sort({ updatedAt: -1 });

  // 6. Unassigned Complaints (New/reopened complaints with no SC assigned)
  const unassignedComplaints = await Complaint.find({
    status: 'unassigned'
  })
    .sort({ createdAt: -1 });

  res.status(200).json({
    pendingSCRegistrations,
    pendingConfirmations,
    rejectedBySC,
    pendingExtraApprovals,
    partPendingComplaints,
    unassignedComplaints,
    counts: {
      pendingSCRegistrations: pendingSCRegistrations.length,
      pendingConfirmations: pendingConfirmations.length,
      rejectedBySC: rejectedBySC.length,
      pendingExtraApprovals: pendingExtraApprovals.length,
      partPendingComplaints: partPendingComplaints.length,
      unassignedComplaints: unassignedComplaints.length,
    }
  });
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin marks Part/Unit as Delivered
// @route   PATCH /api/complaints/:id/mark-delivered
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const markPartDelivered = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  const complaint = await Complaint.findById(id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  if (complaint.status !== 'part_pending') {
    return res.status(400).json({ message: 'Complaint is not in a Part Pending status.' });
  }

  // Update delivered state (does NOT change the status)
  const deliveredAt = new Date();
  const deliveredNote = note ? note.trim() : '';
  
  complaint.partDeliveredAt = deliveredAt;
  complaint.partDeliveredNote = deliveredNote;

  await complaint.save();

  // Find the latest SC part_pending update to attach these delivery details snapshot
  const lastPartPendingUpdate = await ComplaintUpdate.findOne({
    complaintId: complaint._id,
    newStatus: 'part_pending',
    role: 'service_centre',
  }).sort({ createdAt: -1 });

  let parentUpdateId = null;
  if (lastPartPendingUpdate) {
    lastPartPendingUpdate.partDeliveredAt = deliveredAt;
    lastPartPendingUpdate.partDeliveredNote = deliveredNote;
    await lastPartPendingUpdate.save();
    parentUpdateId = lastPartPendingUpdate._id;
  }

  // Find Service Centre to get their phone number
  const sc = await ServiceCentre.findById(complaint.assignedCentreId);
  if (sc && sc.phone1) {
    const templateName = process.env.WHATSAPP_TEMPLATE_PART_DELIVERED || 'part_delivered_to_sc';
    const customerAddress = `${complaint.localAddress}, ${complaint.city}, ${complaint.district}`;
    sendWhatsApp(sc.phone1, templateName, [
      complaint.complaintId,
      complaint.customerName,
      customerAddress,
      note ? note.trim() : 'No delivery note.'
    ]);
  }

  // Record timeline entry
  await ComplaintUpdate.create({
    complaintId: complaint._id,
    updatedBy: req.user.id,
    role: 'admin',
    oldStatus: 'part_pending',
    newStatus: 'part_pending', // status stays part_pending
    note: `Admin marked Part/Unit as Delivered. Note: ${note ? note.trim() : 'None'}`,
    parentUpdateId,
    partDeliveredAt: deliveredAt,
    partDeliveredNote: deliveredNote,
  });

  res.status(200).json({ message: 'Part/unit marked as delivered. WhatsApp sent to Service Centre.', complaint });
};

// ─────────────────────────────────────────────────────────────
// @desc    SC marks Part/Unit as Received
// @route   PATCH /api/complaints/:id/part-received
// @access  Private (SC only)
// ─────────────────────────────────────────────────────────────
const markPartReceived = async (req, res) => {
  const { id } = req.params;

  const sc = await ServiceCentre.findOne({ userId: req.user.id });
  if (!sc) return res.status(404).json({ message: 'Service Centre profile not found.' });

  const complaint = await Complaint.findById(id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  if (String(complaint.assignedCentreId) !== String(sc._id)) {
    return res.status(403).json({ message: 'Not authorised to act on this complaint.' });
  }

  if (complaint.status !== 'part_pending') {
    return res.status(400).json({ message: 'Complaint is not in a Part Pending status.' });
  }

  if (!complaint.partDeliveredAt) {
    return res.status(400).json({ message: 'Cannot mark as received. Admin has not marked it as delivered yet.' });
  }

  const oldStatus = complaint.status;
  const receivedAt = new Date();
  complaint.status = 'part_received';
  complaint.partReceivedAt = receivedAt;

  await complaint.save();

  // Find the latest SC part_pending update to attach this receipt snapshot
  const lastPartPendingUpdate = await ComplaintUpdate.findOne({
    complaintId: complaint._id,
    newStatus: 'part_pending',
    role: 'service_centre',
  }).sort({ createdAt: -1 });

  let parentUpdateId = null;
  if (lastPartPendingUpdate) {
    lastPartPendingUpdate.partReceivedAt = receivedAt;
    await lastPartPendingUpdate.save();
    parentUpdateId = lastPartPendingUpdate._id;
  }

  // Record timeline entry
  await ComplaintUpdate.create({
    complaintId: complaint._id,
    updatedBy: req.user.id,
    role: 'service_centre',
    oldStatus,
    newStatus: 'part_received',
    note: 'SC marked Part/Unit as Received.',
    parentUpdateId,
    partReceivedAt: receivedAt,
  });

  res.status(200).json({ message: 'Part/unit marked as received successfully.', complaint });
};

// ─────────────────────────────────────────────────────────────
// @desc    Get all complaints with 12+ filters, search, pagination
// @route   GET /api/complaints
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const getAllComplaints = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      q,
      city,
      district,
      state,
      product,
      complaintType,
      warrantyStatus,
      status,
      assignedCentreId,
      scCapability,
      dateFrom,
      dateTo,
      isReopened,
      reopenedOnly,
      originalOnly,
      serialNumber,
      trackingId
    } = req.query;

    const query = {};

    // 1. Text Search (customerName, phone1, phone2, complaintId, product serialNumber, product trackingId)
    const term = q || search;
    if (term) {
      const searchRegex = new RegExp(term.trim(), 'i');
      const complaintPattern = makeComplaintIdPattern(term);
      
      // Query Product to find matching serialNumber or trackingId
      const Product = require('../models/Product');
      const matchingProducts = await Product.find({
        $or: [
          { serialNumber: searchRegex },
          { trackingId: searchRegex }
        ]
      }).select('_id').lean();
      const productIds = matchingProducts.map(p => p._id);

      query.$or = [
        { customerName: searchRegex },
        { phone1: searchRegex },
        { phone2: searchRegex },
        { complaintId: { $regex: complaintPattern, $options: 'i' } },
        { trackingId: { $in: productIds } }
      ];
    }

    // 2. Direct filters
    if (city) query.city = city;
    if (district) query.district = district;
    if (state) query.state = state;
    if (product) query.product = product;
    if (complaintType) query.complaintType = complaintType;
    if (warrantyStatus) query.warrantyStatus = warrantyStatus;
    if (serialNumber) query.serialNumber = { $regex: serialNumber.trim(), $options: 'i' };

    // 3. Status filter (can be single or multiple comma-separated)
    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      query.status = { $in: statuses };
    }

    // 4. Assigned SC filter
    if (assignedCentreId) {
      query.assignedCentreId = assignedCentreId;
    }

    // 5. SC Product Capability filter (subquery on ServiceCentre)
    if (scCapability) {
      const scs = await ServiceCentre.find({ productCapability: scCapability }).select('_id').lean();
      const scIds = scs.map((s) => s._id);
      query.assignedCentreId = { $in: scIds };
    }

    // 6. Date Range filter (createdAt)
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endOfDay;
      }
    }

    // 7. Reopened flag filter (handles reopenedOnly, originalOnly, and legacy isReopened)
    if (reopenedOnly === 'true') {
      query.isReopened = true;
    } else if (originalOnly === 'true') {
      query.isReopened = { $ne: true };
    } else if (isReopened !== undefined) {
      query.isReopened = isReopened === 'true';
    }

    // 8. Tracking ID filter
    // If trackingId is provided, we need to find the Product first, then filter complaints by its _id
    if (trackingId) {
      const Product = require('../models/Product'); // lazy load
      const trackingRecord = await Product.findOne({ trackingId: { $regex: trackingId.trim(), $options: 'i' } }).lean();
      if (trackingRecord) {
        query.trackingId = trackingRecord._id;
      } else {
        // If the tracking ID doesn't exist, we should return an empty result set safely
        query.trackingId = null; // Forces 0 matches since we know it doesn't match
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skipNum = (pageNum - 1) * limitNum;

    // Execute query
    const complaints = await Complaint.find(query)
      .populate('assignedCentreId', 'businessName ownerName phone1')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    const total = await Complaint.countDocuments(query);

    res.status(200).json({
      complaints,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Error in getAllComplaints:', error);
    res.status(500).json({ message: 'Server error while fetching complaints.' });
  }
};

// @desc    Admin updates all extra charges on a complaint
// @route   PATCH /api/complaints/:id/extra-charges
// @access  Private (Admin only)
const updateExtraCharges = async (req, res) => {
  try {
    const { id } = req.params;
    const { extraCharges } = req.body;

    if (!Array.isArray(extraCharges)) {
      return res.status(400).json({ message: 'extraCharges must be an array.' });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    // Update extra charges
    complaint.extraCharges = extraCharges.map(ec => ({
      label: ec.label.trim(),
      amount: Number(ec.amount),
      requestedBy: ec.requestedBy || 'admin',
      status: ec.status || 'approved',
      approvedAt: ec.status === 'approved' ? (ec.approvedAt || new Date()) : (ec.approvedAt || null),
    }));

    await complaint.save();
    res.status(200).json({ message: 'Extra charges updated successfully.', complaint });
  } catch (error) {
    console.error('Error in updateExtraCharges:', error);
    res.status(500).json({ message: 'Server error while updating extra charges.' });
  }
};

// @desc    Admin updates a single extra charge (label/amount)
// @route   PATCH /api/complaints/:id/extras/:extraId
// @access  Private (Admin only)
const updateSingleExtraCharge = async (req, res) => {
  try {
    const { id, extraId } = req.params;
    const { label, amount } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    const extra = complaint.extraCharges.id(extraId);
    if (!extra) return res.status(404).json({ message: 'Extra charge not found.' });

    if (label !== undefined) extra.label = label.trim();
    if (amount !== undefined) extra.amount = Number(amount);

    await complaint.save();
    res.status(200).json({ message: 'Extra charge updated successfully.', complaint });
  } catch (error) {
    console.error('Error in updateSingleExtraCharge:', error);
    res.status(500).json({ message: 'Server error while updating extra charge.' });
  }
};

module.exports = {
  reopenCheck,
  reopenComplaint,
  createComplaint,
  assignComplaint,
  getMyComplaints,
  acceptComplaint,
  rejectComplaint,
  markGoing,
  updateStatus,
  confirmDone,
  disputeDone,
  approveExtra,
  rejectExtra,
  getActionItems,
  getComplaintById,
  getAllComplaints,
  markPartDelivered,
  markPartReceived,
  updateExtraCharges,
  updateSingleExtraCharge,
};
