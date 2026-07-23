const Preset = require('../models/Preset');
// Note: We might need to check if a preset is used by a Complaint before deleting,
// but since the Complaint model doesn't explicitly store the Preset ID (only the final presetPrice string/number),
// we don't strictly need to block deletion, but the GRD says "check no complaints use it first".
// We will implement that safely by checking if any Complaint has presetId matching.
const Complaint = require('../models/Complaint');

// @desc    Get all presets (optionally filtered by type and active status)
// @route   GET /api/presets
// @access  Private
const getPresets = async (req, res, next) => {
    try {
        const { type, isActive } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const presets = await Preset.find(filter).sort({ type: 1, name: 1 });
        res.status(200).json(presets);
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new preset
// @route   POST /api/presets
// @access  Private/Admin
const createPreset = async (req, res, next) => {
    try {
        const { type, name, modelNo, price, isActive } = req.body;

        const preset = await Preset.create({
            type,
            name,
            modelNo,
            price,
            isActive: isActive !== undefined ? isActive : true,
        });

        res.status(201).json(preset);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a preset
// @route   PUT /api/presets/:id
// @access  Private/Admin
const updatePreset = async (req, res, next) => {
    try {
        const { name, modelNo, price } = req.body;

        // update: name+price only (per TBP) + modelNo if applicable
        const preset = await Preset.findByIdAndUpdate(
            req.params.id,
            { name, modelNo, price },
            { new: true, runValidators: true }
        );

        if (!preset) {
            return res.status(404).json({ message: 'Preset not found' });
        }

        res.status(200).json(preset);
    } catch (error) {
        next(error);
    }
};
