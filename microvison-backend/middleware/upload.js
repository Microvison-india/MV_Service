const multer = require('multer');
const s3 = require('../config/r2');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const sharp = require('sharp');

// Configure local memory storage for multer
const memoryStorage = multer.memoryStorage();

const uploadImageMulter = multer({
  storage: memoryStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

const uploadAudioMulter = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Helper function to upload file buffer to Cloudflare R2
const uploadToR2 = async (file, folder) => {
  let uploadBody = file.buffer;
  let uploadMimetype = file.mimetype;
  let fileExtension = file.originalname.split('.').pop() || 'jpg';

  // Apply compression via sharp.js if it is an image
  if (file.mimetype.startsWith('image/')) {
    try {
      uploadBody = await sharp(file.buffer)
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      uploadMimetype = 'image/jpeg';
      fileExtension = 'jpg';
    } catch (err) {
      console.warn('[Sharp] Compression failed, uploading original buffer:', err);
    }
  }

  const randomName = crypto.randomBytes(16).toString('hex');
  const filename = `${folder}/${randomName}.${fileExtension}`;

  const uploadParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
    Body: uploadBody,
    ContentType: uploadMimetype,
  };

  await s3.send(new PutObjectCommand(uploadParams));

  return {
    url: `${process.env.R2_PUBLIC_URL}/${filename}`,
    filename: filename,
  };
};

// Middleware wrapper for image uploads (array of files)
const uploadImage = {
  array: (fieldname, maxCount) => {
    return [
      uploadImageMulter.array(fieldname, maxCount),
      async (req, res, next) => {
        if (!req.files || req.files.length === 0) {
          return next();
        }
        try {
          const uploadPromises = req.files.map(async (file) => {
            const { url, filename } = await uploadToR2(file, 'images');
            file.path = url; // compatible with existing controller code
            file.filename = filename;
          });
          await Promise.all(uploadPromises);
          next();
        } catch (error) {
          console.error('R2 Image Upload Error:', error);
          next(error);
        }
      },
    ];
  },
};

// Middleware wrapper for audio note upload (single file)
const uploadAudio = {
  single: (fieldname) => {
    return [
      uploadAudioMulter.single(fieldname),
      async (req, res, next) => {
        if (!req.file) {
          return next();
        }
        try {
          const { url, filename } = await uploadToR2(req.file, 'audio');
          req.file.path = url; // compatible with existing controller code
          req.file.filename = filename;
          next();
        } catch (error) {
          console.error('R2 Audio Upload Error:', error);
          next(error);
        }
      },
    ];
  },
};

module.exports = {
  uploadImage,
  uploadAudio,
};
