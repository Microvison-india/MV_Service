// @desc    Upload one or more images
// @route   POST /api/upload/images
// @access  Private (Admin or active SC)
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    // Map through uploaded files to extract URLs and public_ids
    const uploadedImages = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));

    res.status(200).json({
      message: 'Images uploaded successfully',
      images: uploadedImages,
    });
  } catch (error) {
    console.error('Upload Images Error:', error);
    res.status(500).json({ message: 'Server error during image upload' });
  }
};

// @desc    Upload a single audio file (voice note)
// @route   POST /api/upload/audio
// @access  Private (Admin or active SC)
const uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file provided' });
    }

    res.status(200).json({
      message: 'Audio uploaded successfully',
      audio: {
        url: req.file.path,
        public_id: req.file.filename,
      },
    });
  } catch (error) {
    console.error('Upload Audio Error:', error);
    res.status(500).json({ message: 'Server error during audio upload' });
  }
};

module.exports = {
  uploadImages,
  uploadAudio,
};
