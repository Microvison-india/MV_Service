const ComplaintDraft = require('../models/ComplaintDraft');

// @desc    Get all drafts created by the logged-in admin
// @route   GET /api/complaints/drafts
// @access  Private (Admin only)
const getDrafts = async (req, res) => {
  try {
    const drafts = await ComplaintDraft.find({ createdBy: req.user.id })
      .sort({ updatedAt: -1 })
      .lean();
    res.status(200).json({ drafts });
  } catch (error) {
    console.error('Error in getDrafts:', error);
    res.status(500).json({ message: 'Server error while fetching drafts.' });
  }
};

// @desc    Get a single draft by ID
// @route   GET /api/complaints/drafts/:id
// @access  Private (Admin only)
const getDraft = async (req, res) => {
  try {
    const draft = await ComplaintDraft.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    }).lean();

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found.' });
    }
    res.status(200).json({ draft });
  } catch (error) {
    console.error('Error in getDraft:', error);
    res.status(500).json({ message: 'Server error while fetching draft.' });
  }
};

// @desc    Create or update a draft
// @route   POST /api/complaints/drafts
// @access  Private (Admin only)
const saveDraft = async (req, res) => {
  try {
    const { draftId, currentStep, formData } = req.body;

    let draft;
    if (draftId) {
      draft = await ComplaintDraft.findOneAndUpdate(
        { _id: draftId, createdBy: req.user.id },
        { currentStep, formData },
        { new: true }
      );
    }

    if (!draft) {
      draft = await ComplaintDraft.create({
        createdBy: req.user.id,
        currentStep,
        formData,
      });
    }

    res.status(200).json({
      message: 'Draft saved successfully.',
      draftId: draft._id,
      draft,
    });
  } catch (error) {
    console.error('Error in saveDraft:', error);
    res.status(500).json({ message: 'Server error while saving draft.' });
  }
};

// @desc    Delete a draft permanently
// @route   DELETE /api/complaints/drafts/:id
// @access  Private (Admin only)
const deleteDraft = async (req, res) => {
  try {
    const draft = await ComplaintDraft.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found.' });
    }

    res.status(200).json({ message: 'Draft deleted successfully.' });
  } catch (error) {
    console.error('Error in deleteDraft:', error);
    res.status(500).json({ message: 'Server error while deleting draft.' });
  }
};

module.exports = {
  getDrafts,
  getDraft,
  saveDraft,
  deleteDraft,
};
