const Tesseract = require('tesseract.js');
const Jimp = require('jimp');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class OCREngine {
  
  // Preprocess image for better OCR accuracy
  async preprocessImage(imagePath) {
    try {
      const outputPath = imagePath.replace(/\.(jpg|jpeg|png|webp|heic)$/i, '_processed.png');
      
      // Use sharp for initial processing
      await sharp(imagePath)
        .grayscale()
        .normalize()
        .sharpen()
        .threshold(128)
        .toFile(outputPath);
      
      // Use Jimp for additional processing
      const image = await Jimp.read(outputPath);
      
      // Auto-rotate if needed
      await image
        .contrast(0.3)
        .brightness(0.1)
        .quality(100)
        .writeAsync(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Image preprocessing error:', error);
      return imagePath; // Return original if preprocessing fails
    }
  }
  
  // Extract text from image using Tesseract
  async extractText(imagePath) {
    try {
      const processedPath = await this.preprocessImage(imagePath);
      
      const { data: { text } } = await Tesseract.recognize(
        processedPath,
        'eng',
        {
          logger: m => console.log(m)
        }
      );
      
      // Clean up processed file
      if (processedPath !== imagePath) {
        try {
          await fs.unlink(processedPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      return text;
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw new Error('Failed to extract text from image');
    }
  }
  
  // Extract text from PDF
  async extractTextFromPDF(pdfPath) {
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = await fs.readFile(pdfPath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }
  
  // Main extraction method
  async extract(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.pdf') {
      return await this.extractTextFromPDF(filePath);
    } else if (['.jpg', '.jpeg', '.png', '.webp', '.heic'].includes(ext)) {
      return await this.extractText(filePath);
    } else {
      throw new Error('Unsupported file format');
    }
  }
}

module.exports = new OCREngine();
