const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Donor = require('../models/Donor');
const hybridExtractor = require('../utils/hybridExtractor');

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
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { aadhaarNumber, password } = req.body;
    if (!aadhaarNumber || !password) {
      return res.status(400).json({ error: 'Aadhaar number and password are required' });
    }
    const donor = await Donor.findOne({ aadhaarNumber });
    if (!donor) {
      return res.status(401).json({ error: 'Invalid Aadhaar number or password' });
    }
    if (donor.password !== password) {
      return res.status(401).json({ error: 'Invalid Aadhaar number or password' });
    }
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
    const data = await hybridExtractor.extractAadhaar(req.file.path);
    res.json({ success: true, aadhaarData: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Auto-extract from Blood Report
router.post('/extract-blood-report', upload.single('bloodReport'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
    const data = await hybridExtractor.extractBloodReport(req.file.path);
    
    res.json({ 
      success: true, 
      bloodReportData: {
        bloodGroup: data.bloodGroup || null,
        patientName: data.patientName || data.name || null,
        patientAge: data.age || null,
        dateOfBirth: data.dateOfBirth || null,
        testDate: data.testDate || data.reportDate || null,
        method: data.method || 'unknown'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// Preview extraction
router.post('/preview', upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'bloodReport', maxCount: 1 }
]), async (req, res) => {
  try {
    let aadhaarData = null;
    let bloodReportData = null;
    let validation = null;

    if (req.files.aadhaar) {
      try {
        aadhaarData = await hybridExtractor.extractAadhaar(req.files.aadhaar[0].path);
      } catch (error) {
        console.error('Aadhaar preview error:', error.message);
      }
    }

    if (req.files.bloodReport) {
      try {
        bloodReportData = await hybridExtractor.extractBloodReport(req.files.bloodReport[0].path);
      } catch (error) {
        console.error('Blood report preview error:', error.message);
        try {
          const bloodResult = await hybridExtractor.extractBloodGroup(req.files.bloodReport[0].path);
          bloodReportData = { bloodGroup: bloodResult.bloodGroup, method: bloodResult.method };
        } catch (e) {}
      }
    }

    if (aadhaarData && bloodReportData && aadhaarData.name && bloodReportData.patientName) {
      validation = await hybridExtractor.crossValidateDocuments(aadhaarData, bloodReportData);
    }

    res.json({
      success: true,
      aadhaarNumber: aadhaarData?.aadhaarNumber || null,
      aadhaarName: aadhaarData?.name || null,
      aadhaarAge: aadhaarData?.age || null,
      aadhaarGender: aadhaarData?.gender || null,
      bloodGroup: bloodReportData?.bloodGroup || null,
      reportName: bloodReportData?.patientName || null,
      method: aadhaarData?.method || bloodReportData?.method || null,
      validation: validation,
      warnings: validation?.warnings || [],
      isValid: validation?.isValid !== false
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ success: false, error: 'Failed to preview extraction' });
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
    const bloodGroupSource = req.body.bloodGroupSource || 'ai';
    
    let bloodGroup;
    let bloodReportData = {};
    
    if (bloodGroupSource === 'manual' && req.body.manualBloodGroup) {
      bloodGroup = req.body.manualBloodGroup;
      bloodReportData = {
        bloodGroup: bloodGroup,
        testDate: new Date().toISOString(),
        method: 'manual'
      };
    } else {
      if (!req.files.bloodReport) {
        return res.status(400).json({ error: 'Blood report is required when not using manual entry' });
      }
      
      console.log('🤖 Extracting blood report...');
      bloodReportData = await hybridExtractor.extractBloodReport(req.files.bloodReport[0].path);
      
      if (!bloodReportData.bloodGroup) {
        return res.status(400).json({ 
          error: 'Blood group not found in report',
          hint: 'Please ensure blood group is clearly visible'
        });
      }
      bloodGroup = bloodReportData.bloodGroup;
    }
    
    console.log('🤖 Extracting Aadhaar...');
    const aadhaarData = await hybridExtractor.extractAadhaar(aadhaarPath);
    
    if (!aadhaarData.aadhaarNumber || !aadhaarData.name) {
      return res.status(400).json({ 
        error: 'Could not extract required data from Aadhaar card',
        hint: 'Please ensure the Aadhaar card image is clear'
      });
    }
    
    const existing = await Donor.findOne({ aadhaarNumber: aadhaarData.aadhaarNumber });
    if (existing) {
      return res.status(400).json({ error: 'Aadhaar already registered' });
    }
    
    const donor = new Donor({
      name: name || aadhaarData.name,
      age: parseInt(age) || aadhaarData.age,
      gender: gender || aadhaarData.gender,
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
        extractedDOB: aadhaarData.dateOfBirth,
        extractedGender: aadhaarData.gender,
        verified: true
      },
      bloodReportData: {
        hospitalName: 'Not specified',
        reportDate: bloodReportData.testDate || new Date().toISOString(),
        extractedBloodGroup: bloodGroup,
        verified: true,
        source: bloodReportData.method || 'hybrid'
      },
      aadhaarFile: aadhaarPath,
      bloodReportFile: req.files.bloodReport ? req.files.bloodReport[0].path : null
    });
    
    await donor.save();
    
    res.status(201).json({
      message: 'Donor registered successfully',
      donor: {
        id: donor._id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        extractedData: {
          aadhaar: { number: aadhaarData.aadhaarNumber, name: aadhaarData.name, method: aadhaarData.method },
          bloodReport: { bloodGroup: bloodReportData.bloodGroup, method: bloodReportData.method }
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
    const donors = await Donor.find({ isActive: true }).select('-password');
    res.json(donors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nearby donors
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 20000 } = req.query;
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
    }).select('-password');
    res.json(donors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blood report for a specific donor
router.get('/blood-report/:id', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ error: 'Donor not found' });
    if (!donor.bloodReportFile) return res.status(404).json({ error: 'Blood report not available' });
    res.sendFile(path.resolve(donor.bloodReportFile));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blood report' });
  }
});

module.exports = router;