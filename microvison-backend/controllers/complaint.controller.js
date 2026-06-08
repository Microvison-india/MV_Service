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

  // In-warranty: preset is required
  if (warrantyStatus === 'in_warranty' && !presetId) {
    return res
      .status(400)
      .json({ message: 'A preset must be selected for in-warranty complaints.' });
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

  if (warrantyStatus === 'in_warranty' && presetId) {
    const preset = await Preset.findById(presetId).lean();
    if (!preset) {
      return res.status(404).json({ message: 'Selected preset not found.' });
    }
    snapshotPresetName = preset.packageName;
    snapshotPresetPrice = preset.price;
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
    createdBy: req.user._id,
  });

  // ── Log initial status update ─────────────────────────────
  await ComplaintUpdate.create({
    complaintId: complaint._id,
    updatedBy: req.user._id,
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
    updatedBy: req.user._id,
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

module.exports = {
  reopenCheck,
  createComplaint,
  assignComplaint,
};
