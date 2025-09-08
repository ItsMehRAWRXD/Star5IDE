const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Image processing and steganography
router.post('/process', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const { operation = 'resize', width = 800, height = 600, quality = 80 } = req.body;
    
    let processedImage;
    
    switch (operation) {
      case 'resize':
        processedImage = await sharp(req.file.buffer)
          .resize(parseInt(width), parseInt(height))
          .jpeg({ quality: parseInt(quality) })
          .toBuffer();
        break;
        
      case 'compress':
        processedImage = await sharp(req.file.buffer)
          .jpeg({ quality: parseInt(quality) })
          .toBuffer();
        break;
        
      case 'watermark':
        processedImage = await sharp(req.file.buffer)
          .composite([{
            input: Buffer.from(`<svg><text x="10" y="30" font-size="20" fill="white">RawrZ Security</text></svg>`),
            top: 10,
            left: 10
          }])
          .toBuffer();
        break;
        
      default:
        processedImage = req.file.buffer;
    }
    
    res.json({
      success: true,
      originalSize: req.file.size,
      processedSize: processedImage.length,
      operation,
      image: processedImage.toString('base64')
    });
    
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Steganography - Hide text in image
router.post('/steganography/hide', upload.single('image'), async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!req.file || !message) {
      return res.status(400).json({ success: false, error: 'Image and message required' });
    }
    
    // Simple steganography simulation
    const imageBuffer = req.file.buffer;
    const messageBuffer = Buffer.from(message, 'utf8');
    
    // Append message to image metadata (simplified approach)
    const modifiedImage = Buffer.concat([imageBuffer, messageBuffer]);
    
    res.json({
      success: true,
      message: 'Message hidden in image',
      originalSize: imageBuffer.length,
      modifiedSize: modifiedImage.length,
      image: modifiedImage.toString('base64')
    });
    
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;