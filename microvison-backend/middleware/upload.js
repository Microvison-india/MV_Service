const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// --- Image Storage Configuration ---
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'microvison/images',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1200, quality: 80, crop: 'limit' }],
  },
});

// 20MB limit per image (phones take large photos, Cloudinary will compress them anyway)
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// --- Audio Storage Configuration ---
const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'microvison/audio',
    resource_type: 'video', // Cloudinary treats audio as video resource type
    allowed_formats: ['webm', 'mp3', 'ogg', 'mp4', 'm4a', 'wav'],
  },
});

// Create the multer instance for audio
// 10MB limit per audio file
const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = {
  uploadImage,
  uploadAudio,
};
