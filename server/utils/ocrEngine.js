const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class OCREngine {
  constructor() {
    this.worker = null;
  }

  // Preprocess image for better OCR - multiple versions for better results
  async preprocessImage(imagePath) {
    const outputPath = imagePath.replace(/\.(jpg|jpeg|png|webp|heic|bmp|tiff?)$/i, '_ocr.png');
    
    try {
      await sharp(imagePath)
        .resize(2500, 2500, { fit: 'inside', withoutEnlargement: false })
        .grayscale()
        .normalize()
        .sharpen({ sigma: 2 })
        .modulate({ brightness: 1.1 })
        .png()
        .toFile(outputPath);
      
      console.log('✅ Image preprocessed for OCR');
      return outputPath;
    } catch (error) {
      console.error('⚠️ Preprocessing failed, using original:', error.message);
      return imagePath;
    }
  }

  // Create high contrast version for difficult images
  async preprocessHighContrast(imagePath) {
    const outputPath = imagePath.replace(/\.(jpg|jpeg|png|webp|heic|bmp|tiff?)$/i, '_ocr_hc.png');
    
    try {
      await sharp(imagePath)
        .resize(3000, 3000, { fit: 'inside', withoutEnlargement: false })
        .grayscale()
        .normalize()
        .linear(1.5, -30) // Increase contrast
        .sharpen({ sigma: 2.5 })
        .threshold(128) // Binarize for cleaner text
        .png()
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      return null;
    }
  }

  // Enhanced preprocessing for Aadhaar-specific fields
  async preprocessForAadhaar(imagePath) {
    const outputPath = imagePath.replace(/\.(jpg|jpeg|png|webp|heic|bmp|tiff?)$/i, '_aadhaar_ocr.png');

    try {
      await sharp(imagePath)
        .resize(3500, 3500, { fit: 'inside', withoutEnlargement: false })
        .grayscale()
        .normalize()
        .sharpen({ sigma: 3 })
        .modulate({ brightness: 1.2, saturation: 1.1 })
        .threshold(100)
        .png()
        .toFile(outputPath);

      console.log('✅ Aadhaar-specific preprocessing complete');
      return outputPath;
    } catch (error) {
      console.error('⚠️ Aadhaar preprocessing failed:', error.message);
      return imagePath;
    }
  }

  // Extract text from image with multiple attempts
  async extractText(imagePath) {
    let processedPath = null;
    let highContrastPath = null;
    let aadhaarPath = null;

    try {
      // Preprocess image
      processedPath = await this.preprocessImage(imagePath);
      aadhaarPath = await this.preprocessForAadhaar(imagePath);

      console.log('🔍 Running Tesseract OCR (English + Hindi)...');

      // Try with Aadhaar preprocessing
      let result;
      try {
        result = await Tesseract.recognize(aadhaarPath, 'eng+hin', {
          logger: m => {
            if (m.status === 'recognizing text') {
              process.stdout.write(`\r   Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
      } catch (langError) {
        console.log('\n⚠️ Aadhaar preprocessing failed, falling back to standard preprocessing');
        result = await Tesseract.recognize(processedPath, 'eng+hin', {});
      }

      let text = result.data.text;
      console.log(`\n✅ OCR complete - Confidence: ${result.data.confidence.toFixed(1)}%`);

      // Cleanup
      if (processedPath !== imagePath) {
        try { await fs.unlink(processedPath); } catch (e) {}
      }
      if (highContrastPath) {
        try { await fs.unlink(highContrastPath); } catch (e) {}
      }
      if (aadhaarPath && aadhaarPath !== imagePath) {
        try { await fs.unlink(aadhaarPath); } catch (e) {}
      }

      return text;

    } catch (error) {
      console.error('❌ OCR failed:', error.message);
      if (processedPath && processedPath !== imagePath) {
        try { await fs.unlink(processedPath); } catch (e) {}
      }
      if (highContrastPath) {
        try { await fs.unlink(highContrastPath); } catch (e) {}
      }
      if (aadhaarPath && aadhaarPath !== imagePath) {
        try { await fs.unlink(aadhaarPath); } catch (e) {}
      }
      throw new Error('OCR extraction failed: ' + error.message);
    }
  }

  // Extract text from PDF
  async extractTextFromPDF(pdfPath) {
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = await fs.readFile(pdfPath);
      const data = await pdfParse(dataBuffer);
      console.log(`📄 PDF extracted: ${data.numpages} pages`);
      return data.text;
    } catch (error) {
      console.error('❌ PDF extraction failed:', error.message);
      throw new Error('PDF extraction failed');
    }
  }

  // Main extraction method
  async extract(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    console.log(`📁 Processing: ${path.basename(filePath)}`);
    
    if (ext === '.pdf') {
      return await this.extractTextFromPDF(filePath);
    } else if (['.jpg', '.jpeg', '.png', '.webp', '.heic', '.bmp', '.tiff', '.tif'].includes(ext)) {
      return await this.extractText(filePath);
    } else {
      throw new Error(`Unsupported format: ${ext}`);
    }
  }
}

module.exports = new OCREngine();
