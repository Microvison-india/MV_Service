const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadImage, uploadAudio } = require('../middleware/upload');
const { uploadImages, uploadAudio: uploadAudioController } = require('../controllers/upload.controller');

// All uploads require authentication (Admin or SC)
router.use(auth);

// POST /api/upload/images
// Expects form-data with field name 'images', up to 5 files maximum
router.post('/images', uploadImage.array('images', 5), uploadImages);

// POST /api/upload/audio
// Expects form-data with field name 'audio', strictly 1 file
router.post('/audio', uploadAudio.single('audio'), uploadAudioController);

module.exports = router;
