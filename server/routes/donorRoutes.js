const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Donor = require('../models/Donor');
const ocrEngine = require('../utils/ocrEngine');
const bloodReportParser = require('../utils/bloodReportParser');
const aadhaarValidator = require('../utils/aadhaarValidator');
const aiExtractor = require('../utils/aiExtractor');

// Configure multer for file uploads
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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { aadhaarNumber, password } = req.body;

    // Validate input
    if (!aadhaarNumber || !password) {
      return res.status(400).json({ error: 'Aadhaar number and password are required' });
    }

    // Find donor by Aadhaar number
    const donor = await Donor.findOne({ aadhaarNumber });

    if (!donor) {
      return res.status(401).json({ error: 'Invalid Aadhaar number or password' });
    }

    // Check password (plain text comparison for now - should use bcrypt in production)
    if (donor.password !== password) {
      return res.status(401).json({ error: 'Invalid Aadhaar number or password' });
    }

    // Login successful
    res.json({
      success: true,
      message: 'Login successful',
      donor: {
        id: donor._id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        phone: donor.phone,
        aadhaarNumber: donor.aadhaarNumber
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

    // Extract Blood Report details
    if (req.files.bloodReport) {
      try {
        const bloodReportPath = req.files.bloodReport[0].path;
        bloodReportData = await aiExtractor.extractBloodReportDataFromImage(bloodReportPath);
        console.log('Blood report extracted:', bloodReportData);
      } catch (error) {
        console.error('Blood report preview error:', error.message);
        // Fallback to just blood group extraction
        try {
          const bloodResult = await aiExtractor.extractBloodGroup(bloodReportPath);
          bloodReportData = {
            bloodGroup: bloodResult.bloodGroup,
            patientName: null,
            age: null,
            gender: null,
            method: bloodResult.method
          };
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

// Register donor
router.post('/register', upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'bloodReport', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, age, gender, phone, password, address, latitude, longitude } = req.body;
    
    if (!req.files.aadhaar) {
      return res.status(400).json({ error: 'Aadhaar document is required' });
    }
    
    const aadhaarPath = req.files.aadhaar[0].path;
    const bloodGroupSource = req.body.bloodGroupSource || 'ocr';
    
    let bloodGroup;
    let bloodReportData = {};
    
    // Check if manual blood group is provided
    if (bloodGroupSource === 'manual' && req.body.manualBloodGroup) {
      bloodGroup = req.body.manualBloodGroup;
      console.log('📋 Using manual blood group:', bloodGroup);
      
      bloodReportData = {
        bloodGroup: bloodGroup,
        validation: {
          isValid: true,
          issues: [],
          warnings: ['Blood group entered manually - no report verification'],
          confidence: 100
        },
        hospitalName: 'Self-reported',
        reportDate: new Date().toISOString(),
        source: 'manual'
      };
    } else {
      // OCR from blood report
      if (!req.files.bloodReport) {
        return res.status(400).json({ error: 'Blood report is required when not using manual entry' });
      }
      
      const bloodReportPath = req.files.bloodReport[0].path;
      
      // Extract text using OCR
      console.log('📄 Extracting text from Blood Report...');
      const bloodReportText = await ocrEngine.extract(bloodReportPath);
      console.log('📄 Blood report text extracted:', bloodReportText.substring(0, 100));
      
      // Parse blood report
      const strictMode = process.env.NODE_ENV === 'production';
      console.log('🔍 Parsing Blood Report...');
      bloodReportData = bloodReportParser.parse(bloodReportText, strictMode);
      console.log('🔍 Blood report parsed:', {
        bloodGroup: bloodReportData.bloodGroup,
        hospital: bloodReportData.hospitalName,
        validation: bloodReportData.validation
      });
      
      // Blood group is CRITICAL - must be found
      if (!bloodReportData.bloodGroup) {
        console.log('❌ Blood group not found in report');
        return res.status(400).json({ 
          error: 'Blood group not found in report',
          hint: 'Please ensure blood group (A+, A-, B+, B-, O+, O-, AB+, AB-) is clearly visible',
          extractedText: bloodReportText.substring(0, 300) + '...'
        });
      }
      
      bloodGroup = bloodReportData.bloodGroup;
    }
    
    // Extract text from Aadhaar
    console.log('📄 Extracting text from Aadhaar...');
    const aadhaarText = await ocrEngine.extract(aadhaarPath);
    console.log('📄 Aadhaar text extracted:', aadhaarText.substring(0, 100));
    
    // Parse Aadhaar (non-strict mode for development/testing)
    const strictMode = process.env.NODE_ENV === 'production';
    console.log('🔍 Parsing Aadhaar (strict mode:', strictMode, ')');
    const aadhaarData = aadhaarValidator.parse(aadhaarText, strictMode);
    console.log('🔍 Aadhaar parsed:', {
      number: aadhaarData.aadhaarNumber,
      name: aadhaarData.name,
      age: aadhaarData.age,
      dob: aadhaarData.dob,
      gender: aadhaarData.gender,
      validation: aadhaarData.validation
    });
    
    // Validate Aadhaar
    if (!aadhaarData.validation.isValid) {
      console.log('❌ Aadhaar validation failed:', aadhaarData.validation);
      return res.status(400).json({ 
        error: 'Invalid Aadhaar document',
        issues: aadhaarData.validation.issues,
        warnings: aadhaarData.validation.warnings || [],
        extractedText: aadhaarText.substring(0, 200) + '...'
      });
    }
    
    // Log warnings but continue in dev mode
    if (bloodReportData.validation && bloodReportData.validation.warnings && bloodReportData.validation.warnings.length > 0) {
      console.log('⚠️ Blood report warnings:', bloodReportData.validation.warnings);
    }
    
    // Check for duplicate Aadhaar
    const existing = await Donor.findOne({ aadhaarNumber: aadhaarData.aadhaarNumber });
    if (existing) {
      return res.status(400).json({ error: 'Aadhaar already registered' });
    }
    
    // Create donor
    const donor = new Donor({
      name: name || aadhaarData.name,
      age: parseInt(age),
      gender,
      bloodGroup: bloodReportData.bloodGroup,
      phone,
      password,
      address,
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
      bloodReportData: {
        hospitalName: bloodReportData.hospitalName || 'Not specified',
        reportDate: bloodReportData.reportDate || new Date().toISOString(),
        extractedBloodGroup: bloodGroup,
        verified: bloodReportData.validation ? bloodReportData.validation.confidence > 70 : false,
        source: bloodReportData.source || 'ocr'
      },
      aadhaarFile: aadhaarPath,
      bloodReportFile: req.files.bloodReport ? req.files.bloodReport[0].path : null,
      ocrRawData: {
        aadhaar: aadhaarText,
        bloodReport: bloodReportData.rawText || ''
      }
    });
    
    await donor.save();
    
    res.status(201).json({
      message: 'Donor registered successfully',
      donor: {
        id: donor._id,
        name: donor.name,
        age: donor.age,
        gender: donor.gender,
        bloodGroup: donor.bloodGroup,
        phone: donor.phone,
        address: donor.address,
        extractedData: {
          aadhaar: {
            number: aadhaarData.aadhaarNumber,
            name: aadhaarData.name,
            age: aadhaarData.age,
            dob: aadhaarData.dob,
            gender: aadhaarData.gender
          },
          bloodReport: {
            bloodGroup: bloodReportData.bloodGroup,
            hospital: bloodReportData.hospitalName,
            date: bloodReportData.reportDate
          }
        }
      }
    });
  } catch (error) {
    console.error('Donor registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all donors
router.get('/', async (req, res) => {
  try {
    const donors = await Donor.find({ isActive: true }).select('-ocrRawData');
    res.json(donors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nearby donors
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 20000 } = req.query; // maxDistance in meters
    
    const donors = await Donor.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).select('-ocrRawData');
    
    res.json(donors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blood report for a specific donor
router.get('/blood-report/:id', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    
    if (!donor.bloodReportFile) {
      return res.status(404).json({ error: 'Blood report not available' });
    }
    
    // Send the file
    res.sendFile(path.resolve(donor.bloodReportFile));
  } catch (error) {
    console.error('Blood report fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch blood report' });
  }
});

module.exports = router;
