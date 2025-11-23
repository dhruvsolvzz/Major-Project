const express = require('express');
const router = express.Router();
const multer = require('multer');
const ocrEngine = require('../utils/ocrEngine');
const bloodReportParser = require('../utils/bloodReportParser');
const aadhaarValidator = require('../utils/aadhaarValidator');

const upload = multer({ 
  dest: 'uploads/temp/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Test OCR on blood report
router.post('/blood-report', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }
    
    const text = await ocrEngine.extract(req.file.path);
    const parsed = bloodReportParser.parse(text);
    
    res.json({
      extractedText: text,
      parsedData: parsed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test OCR on Aadhaar
router.post('/aadhaar', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }
    
    const text = await ocrEngine.extract(req.file.path);
    const parsed = aadhaarValidator.parse(text);
    
    res.json({
      extractedText: text,
      parsedData: parsed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
