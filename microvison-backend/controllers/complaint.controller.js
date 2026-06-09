const Complaint = require('../models/Complaint');
const ComplaintUpdate = require('../models/ComplaintUpdate');
const Preset = require('../models/Preset');
const ServiceCentre = require('../models/ServiceCentre');
const generateComplaintId = require('../utils/generateComplaintId');
const { findReopenEligible } = require('../utils/reopenChecker');

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
// @desc    Create a new complaint (status = 'new', no SC assigned yet)
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
    product,
    complaintType,
    warrantyStatus,

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
  if (!product || !complaintType || !warrantyStatus) {
    return res.status(400).json({ message: 'Product, complaint type, and warranty status are required.' });
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

  // ── Generate unique complaint ID ──────────────────────────
  const complaintId = await generateComplaintId();

  // ── Petrol tracking ───────────────────────────────────────
  const petrolValue = warrantyStatus === 'in_warranty' && petrolAdmin != null
    ? Number(petrolAdmin)
    : null;
  const petrolEditCount = petrolValue != null ? 1 : 0;

  // ── Create the complaint document ─────────────────────────
  const complaint = await Complaint.create({
    complaintId,
    customerName,
    phone1: String(phone1),
    phone2: phone2 ? String(phone2) : '',
    localAddress,
    city,
    district,
    state,
    product,
    complaintType,
    warrantyStatus,
    presetId: warrantyStatus === 'in_warranty' ? presetId : null,
    presetName: snapshotPresetName,
    presetPrice: snapshotPresetPrice,
    petrolAdmin: petrolValue,
    petrolEditCount,
    extraCharges: formattedExtras,
    notes: notes || '',
    voiceNoteUrl: voiceNoteUrl || '',
    adminPhotos: Array.isArray(adminPhotos) ? adminPhotos : [],
    isReopened: !!isReopened,
    reopenParentId: isReopened ? reopenParentId : null,
    reopenNotes: isReopened ? reopenNotes : '',
    reopenPhotos: isReopened && Array.isArray(reopenPhotos) ? reopenPhotos : [],
    status: 'new',
    createdBy: req.user.id,
  });

  // ── Log initial status update ─────────────────────────────
  await ComplaintUpdate.create({
    complaintId: complaint._id,
    updatedBy: req.user.id,
    role: 'admin',
    oldStatus: '',
    newStatus: 'new',
    note: isReopened ? `Complaint reopened. Notes: ${reopenNotes}` : 'Complaint registered.',
  });

  res.status(201).json({
    message: 'Complaint created successfully.',
    complaint,
  });
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

  // Only allow assigning if status is 'new' or 're-assigning' after 'rejected_by_sc'
  if (!['new', 'rejected_by_sc'].includes(complaint.status)) {
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

  // TODO (Phase 13): Send WhatsApp message to Service Centre here
  // sendWhatsApp({ to: sc.phone1, template_name: 'new_complaint', complaint })

  res.status(200).json({
    message: `Complaint assigned to ${sc.businessName} successfully.`,
    complaint,
  });
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
  } = req.body;

  const ALLOWED_FINAL_STATUSES = ['done', 'not_done', 'part_pending', 'replacement'];

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

  // Must be in accepted or going state to submit final result (GRD 7.3)
  if (!['accepted', 'going'].includes(complaint.status)) {
    return res.status(400).json({
      message: `Cannot submit final status from current status '${complaint.status}'.`,
    });
  }

  // Proof photos are mandatory for 'done'
  const photos = Array.isArray(proofPhotos) ? proofPhotos : [];
  if (newStatus === 'done' && photos.length === 0) {
    return res.status(400).json({ message: 'At least one proof photo is required before marking as done.' });
  }

  // Out-of-warranty: customer payment amount is required for 'done'
  if (newStatus === 'done' && complaint.warrantyStatus === 'out_of_warranty') {
    if (customerPaymentAmount == null || customerPaymentAmount === '') {
      return res.status(400).json({ message: 'Amount collected from customer is required for out-of-warranty completed jobs.' });
    }
  }

  const oldStatus = complaint.status;

  // Apply updates
  complaint.status = newStatus;
  complaint.proofPhotos = photos;
  if (scNotes) complaint.scNotes = scNotes.trim();

  // Petrol Edit 2 — SC's turn only if editCount === 1 and in-warranty (GRD 6.3)
  if (
    complaint.warrantyStatus === 'in_warranty' &&
    petrolSC != null &&
    complaint.petrolEditCount === 1 &&
    !complaint.petrolLocked
  ) {
    complaint.petrolSC = Number(petrolSC);
    complaint.petrolEditCount = 2;
  }

  // Extra charge request from SC (GRD 6.3 & 10.2) — pushed as pending, admin approves
  if (extraChargeRequest && extraChargeRequest.label && extraChargeRequest.amount) {
    complaint.extraCharges.push({
      label: extraChargeRequest.label.trim(),
      amount: Number(extraChargeRequest.amount),
      requestedBy: 'sc',
      status: 'pending',
    });
  }

  // Out-of-warranty: store customer payment amount (GRD 10.2 — record only, not in invoice)
  if (complaint.warrantyStatus === 'out_of_warranty' && customerPaymentAmount != null) {
    complaint.customerPaymentAmount = Number(customerPaymentAmount);
  }

  await complaint.save();

  await ComplaintUpdate.create({
    complaintId: complaint._id,
    updatedBy: req.user.id,
    role: 'service_centre',
    oldStatus,
    newStatus,
    note: scNotes ? scNotes.trim() : `SC marked as ${newStatus}.`,
    images: photos,
  });

  res.status(200).json({ message: `Complaint status updated to ${newStatus}.`, complaint });
};

module.exports = {
  reopenCheck,
  createComplaint,
  assignComplaint,
  getMyComplaints,
  acceptComplaint,
  rejectComplaint,
  markGoing,
  updateStatus,
};
