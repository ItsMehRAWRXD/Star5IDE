const sharp = require('sharp');
const { generateUniqueFilename, secureFileWrite, secureFileRead } = require('../utils/helpers');
const { logger } = require('../utils/logger');
const path = require('path');

class ImageService {
  constructor() {
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  async processImage(inputPath, options = {}) {
    const requestId = require('../utils/helpers').generateUUID();
    
    try {
      logger.info('Image processing started', { requestId, inputPath, options });
      
      const {
        width,
        height,
        quality = 80,
        format = 'jpeg',
        resize = 'contain',
        blur = false,
        sharpen = false,
        grayscale = false,
        rotate = 0
      } = options;

      let pipeline = sharp(inputPath);

      // Apply transformations
      if (width || height) {
        pipeline = pipeline.resize(width, height, {
          fit: resize,
          withoutEnlargement: true
        });
      }

      if (rotate) {
        pipeline = pipeline.rotate(rotate);
      }

      if (grayscale) {
        pipeline = pipeline.grayscale();
      }

      if (blur) {
        pipeline = pipeline.blur(blur === true ? 1 : blur);
      }

      if (sharpen) {
        pipeline = pipeline.sharpen();
      }

      // Set output format and quality
      switch (format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({ quality });
          break;
        case 'png':
          pipeline = pipeline.png({ quality });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality });
          break;
        case 'tiff':
          pipeline = pipeline.tiff({ quality });
          break;
        default:
          pipeline = pipeline.jpeg({ quality });
      }

      const outputBuffer = await pipeline.toBuffer();
      
      logger.info('Image processing completed', { 
        requestId, 
        originalSize: (await sharp(inputPath).metadata()).size,
        processedSize: outputBuffer.length 
      });

      return {
        success: true,
        buffer: outputBuffer,
        metadata: await sharp(outputBuffer).metadata(),
        requestId
      };

    } catch (error) {
      logger.error('Image processing error', { requestId, error: error.message });
      return {
        success: false,
        error: error.message,
        requestId
      };
    }
  }

  async generateThumbnail(inputPath, size = 200) {
    return this.processImage(inputPath, {
      width: size,
      height: size,
      resize: 'cover',
      quality: 70
    });
  }

  async optimizeImage(inputPath, quality = 80) {
    return this.processImage(inputPath, {
      quality,
      format: 'webp'
    });
  }

  async extractMetadata(inputPath) {
    try {
      const metadata = await sharp(inputPath).metadata();
      return {
        success: true,
        metadata: {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          size: metadata.size,
          density: metadata.density,
          hasAlpha: metadata.hasAlpha,
          channels: metadata.channels,
          space: metadata.space
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createImageHash(inputPath) {
    try {
      const { data, info } = await sharp(inputPath)
        .resize(8, 8, { fit: 'cover' })
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Calculate average pixel value
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i];
      }
      const average = sum / data.length;

      // Create binary hash
      let hash = '';
      for (let i = 0; i < data.length; i++) {
        hash += data[i] > average ? '1' : '0';
      }

      return {
        success: true,
        hash: parseInt(hash, 2).toString(16),
        average
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  validateImage(file) {
    const errors = [];
    
    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.supportedFormats.includes(ext)) {
      errors.push(`Unsupported format: ${ext}. Supported: ${this.supportedFormats.join(', ')}`);
    }

    if (file.size > this.maxFileSize) {
      errors.push(`File too large: ${file.size} bytes. Max: ${this.maxFileSize} bytes`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new ImageService();
