const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Needer = require('../models/Needer');
const ocrEngine = require('../utils/ocrEngine');
const aadhaarValidator = require('../utils/aadhaarValidator');
const aiExtractor = require('../utils/aiExtractor');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { aadhaarNumber, password } = req.body;

    // Validate input
    if (!aadhaarNumber || !password) {
      return res.status(400).json({ error: 'Aadhaar number and password are required' });
    }

    // Find needer by Aadhaar number
    const needer = await Needer.findOne({ aadhaarNumber });

    if (!needer) {
      return res.status(401).json({ error: 'Invalid Aadhaar number or password' });
    }

    // Check password (plain text comparison for now - should use bcrypt in production)
    if (needer.password !== password) {
      return res.status(401).json({ error: 'Invalid Aadhaar number or password' });
    }

    // Login successful
    res.json({
      success: true,
      message: 'Login successful',
      needer: {
        id: needer._id,
        name: needer.name,
        requiredBloodGroup: needer.requiredBloodGroup,
        phone: needer.phone,
        aadhaarNumber: needer.aadhaarNumber,
        urgency: needer.urgency
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Auto-extract from Aadhaar
router.post('/extract-aadhaar', upload.single('aadhaar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file' });

    const data = await aiExtractor.extractAadhaar(req.file.path);
    res.json({ success: true, aadhaarData: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Preview extraction with cross-validation (before registration)
router.post('/preview', upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'bloodReport', maxCount: 1 }
]), async (req, res) => {
  try {
    let aadhaarData = null;
    let bloodReportData = null;
    let validation = null;

    // Extract Aadhaar details
    if (req.files.aadhaar) {
      try {
        const aadhaarPath = req.files.aadhaar[0].path;
        aadhaarData = await aiExtractor.extractAadhaar(aadhaarPath);
        console.log('Aadhaar extracted:', aadhaarData);
      } catch (error) {
        console.error('Aadhaar preview error:', error.message);
      }
    }

    // Extract Blood Report details (optional for needers)
    if (req.files.bloodReport) {
      try {
        const bloodReportPath = req.files.bloodReport[0].path;
        bloodReportData = await aiExtractor.extractBloodReport(bloodReportPath);
        console.log('Blood report extracted:', bloodReportData);
      } catch (error) {
        console.error('Blood report preview error:', error.message);
        // Fallback to just blood group extraction
        try {
          const bloodReportPath = req.files.bloodReport[0].path;
          const bloodResult = await aiExtractor.extractBloodGroup(bloodReportPath);
          bloodReportData = {
            bloodGroup: bloodResult.bloodGroup,
            patientName: null,
            age: null,
            gender: null,
            method: bloodResult.method
          };
          console.log('Blood group fallback extracted:', bloodReportData);
        } catch (fallbackError) {
          console.error('Blood group fallback error:', fallbackError.message);
        }
      }
    }

    // Cross-validate if both documents were extracted
    if (aadhaarData && bloodReportData && aadhaarData.name && bloodReportData.patientName) {
      validation = await aiExtractor.crossValidateDocuments(aadhaarData, bloodReportData);
      console.log('Cross-validation result:', validation);
    }

    res.json({
      success: true,
      aadhaarNumber: aadhaarData?.aadhaarNumber || null,
      aadhaarName: aadhaarData?.name || null,
      aadhaarAge: aadhaarData?.age || null,
      aadhaarGender: aadhaarData?.gender || null,
      bloodGroup: bloodReportData?.bloodGroup || null,
      reportName: bloodReportData?.patientName || null,
      reportAge: bloodReportData?.age || null,
      reportGender: bloodReportData?.gender || null,
      method: aadhaarData?.method || bloodReportData?.method || null,
      validation: validation,
      warnings: validation?.warnings || [],
      isValid: validation?.isValid !== false
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to preview extraction'
    });
  }
});

// Register needer
router.post('/register', upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'bloodReport', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, age, gender, phone, password, address, requiredBloodGroup, urgency, latitude, longitude } = req.body;
    
    if (!req.files || !req.files.aadhaar) {
      return res.status(400).json({ error: 'Aadhaar document is required' });
    }
    
    const aadhaarPath = req.files.aadhaar[0].path;
    let bloodReportData = null;
    
    // Process blood report if uploaded (optional)
    if (req.files.bloodReport) {
      const bloodReportPath = req.files.bloodReport[0].path;
      const bloodReportText = await ocrEngine.extract(bloodReportPath);
      const parsedReport = require('../utils/bloodReportParser').parse(bloodReportText, false);
      
      bloodReportData = {
        hospitalName: parsedReport.hospitalName || 'Not specified',
        reportDate: parsedReport.reportDate || new Date().toISOString(),
        extractedBloodGroup: parsedReport.bloodGroup,
        verified: parsedReport.validation ? parsedReport.validation.confidence > 70 : false,
        source: 'ocr'
      };
    }
    
    // Extract text using OCR
    const aadhaarText = await ocrEngine.extract(aadhaarPath);
    
    // Parse Aadhaar (non-strict mode for development/testing)
    const strictMode = process.env.NODE_ENV === 'production';
    const aadhaarData = aadhaarValidator.parse(aadhaarText, strictMode);
    
    // Validate
    if (!aadhaarData.validation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid Aadhaar document',
        issues: aadhaarData.validation.issues,
        warnings: aadhaarData.validation.warnings
      });
    }
    
    // Check for duplicate
    const existing = await Needer.findOne({ aadhaarNumber: aadhaarData.aadhaarNumber });
    if (existing) {
      return res.status(400).json({ error: 'Aadhaar already registered' });
    }
    
    // Create needer
    const needer = new Needer({
      name: name || aadhaarData.name,
      age: parseInt(age),
      gender,
      requiredBloodGroup,
      phone,
      password,
      address,
      urgency: urgency || 'Medium',
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      aadhaarNumber: aadhaarData.aadhaarNumber,
      aadhaarData: {
        extractedName: aadhaarData.name,
        extractedDOB: aadhaarData.dob,
        extractedGender: aadhaarData.gender,
        verified: aadhaarData.validation.confidence > 70
      },
      aadhaarFile: aadhaarPath,
      bloodReportFile: req.files.bloodReport ? req.files.bloodReport[0].path : null,
      bloodReportData: bloodReportData,
      ocrRawData: {
        aadhaar: aadhaarText,
        bloodReport: bloodReportData ? bloodReportData.rawText || '' : ''
      }
    });
    
    await needer.save();
    
    res.status(201).json({
      message: 'Needer registered successfully',
      needer: {
        id: needer._id,
        name: needer.name,
        requiredBloodGroup: needer.requiredBloodGroup,
        extractedData: aadhaarData
      }
    });
  } catch (error) {
    console.error('Needer registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all needers
router.get('/', async (req, res) => {
  try {
    const needers = await Needer.find({ isActive: true }).select('-ocrRawData');
    res.json(needers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blood report for a specific needer
router.get('/blood-report/:id', async (req, res) => {
  try {
    const needer = await Needer.findById(req.params.id);
    
    if (!needer) {
      return res.status(404).json({ error: 'Needer not found' });
    }
    
    if (!needer.bloodReportFile) {
      return res.status(404).json({ error: 'Blood report not available' });
    }
    
    // Send the file
    res.sendFile(path.resolve(needer.bloodReportFile));
  } catch (error) {
    console.error('Blood report fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch blood report' });
  }
});

module.exports = router;
