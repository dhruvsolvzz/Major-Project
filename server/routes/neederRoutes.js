const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Needer = require('../models/Needer');
const hybridExtractor = require('../utils/hybridExtractor');
const { generateOTP, sendOTP } = require('../utils/smsService');
const emailService = require('../services/emailService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

// Send OTP for signup
router.post('/send-signup-otp', async (req, res) => {
  try {
    const { phone, email } = req.body;
    if (!phone || !email) {
      return res.status(400).json({ error: 'Phone number and email are required' });
    }

    // Check if phone or email already exists
    const existingPhone = await Needer.findOne({ phone });
    const existingEmail = await Needer.findOne({ email });

    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const otp = generateOTP();
    console.log(`Generated OTP for registration (Needer): ${otp}`);

    res.json({ success: true, message: 'OTP logged in console for development' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to log OTP. Please try again.' });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const needer = await Needer.findOne({ phone });
    if (!needer) {
      return res.status(404).json({ error: 'Phone number not registered' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Needer.updateOne(
      { phone },
      { $set: { otp, otpExpiry } }
    );

    console.log(`Generated OTP for forgot password (Needer): ${otp}`);

    res.json({ success: true, message: 'OTP logged in console for development' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to log OTP. Please try again.' });
  }
});

// Forgot Password - Verify OTP and Reset Password
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;
    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ error: 'Phone number, OTP, and new password are required' });
    }

    const needer = await Needer.findOne({ phone });
    if (!needer) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (needer.otp !== otp || needer.otpExpiry < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    needer.password = hashedPassword;
    needer.otp = undefined;
    needer.otpExpiry = undefined;
    await needer.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
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
        } catch (e) { }
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


// Register needer
router.post('/register', upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'bloodReport', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, age, gender, phone, email, password, address, requiredBloodGroup, urgency, latitude, longitude } = req.body;

    if (!req.files || !req.files.aadhaar) {
      return res.status(400).json({ error: 'Aadhaar document is required' });
    }

    const aadhaarPath = req.files.aadhaar[0].path;
    let bloodReportData = null;

    if (req.files.bloodReport) {
      console.log('🤖 Extracting blood report...');
      const extractedReport = await hybridExtractor.extractBloodReport(req.files.bloodReport[0].path);
      bloodReportData = {
        hospitalName: 'Not specified',
        reportDate: extractedReport.testDate || new Date().toISOString(),
        extractedBloodGroup: extractedReport.bloodGroup,
        verified: extractedReport.bloodGroup ? true : false,
        source: extractedReport.method || 'hybrid'
      };
    }

    console.log('🤖 Extracting Aadhaar...');
    const aadhaarData = await hybridExtractor.extractAadhaar(aadhaarPath);

    if (!aadhaarData.aadhaarNumber || !aadhaarData.name) {
      return res.status(400).json({
        error: 'Could not extract required data from Aadhaar card',
        hint: 'Please ensure the Aadhaar card image is clear'
      });
    }

    const existing = await Needer.findOne({ aadhaarNumber: aadhaarData.aadhaarNumber });
    if (existing) {
      return res.status(400).json({ error: 'Aadhaar already registered' });
    }

    // Check if phone or email already exists
    const existingPhone = await Needer.findOne({ phone });
    const existingEmail = await Needer.findOne({ email });
    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const needer = new Needer({
      name: name || aadhaarData.name,
      age: parseInt(age) || aadhaarData.age,
      gender: gender || aadhaarData.gender,
      requiredBloodGroup,
      phone,
      email,
      password: hashedPassword,
      address,
      urgency: urgency || 'Medium',
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
      aadhaarFile: aadhaarPath,
      bloodReportFile: req.files.bloodReport ? req.files.bloodReport[0].path : null,
      bloodReportData: bloodReportData
    });

    await needer.save();

    // Send welcome email
    if (email) {
      emailService.sendWelcomeEmail(email, needer.name, 'needer').catch(console.error);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: needer._id, phone: needer.phone },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Needer registered successfully',
      token,
      needer: {
        id: needer._id,
        name: needer.name,
        requiredBloodGroup: needer.requiredBloodGroup,
        phone: needer.phone,
        email: needer.email,
        extractedData: {
          aadhaar: { number: aadhaarData.aadhaarNumber, name: aadhaarData.name, method: aadhaarData.method },
          bloodReport: bloodReportData
        }
      }
    });
  } catch (error) {
    console.error('Needer registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login needer with password
router.post('/login-password', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone number and password are required' });
    }

    const needer = await Needer.findOne({ phone });
    if (!needer) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, needer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: needer._id, phone: needer.phone },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      needer: {
        id: needer._id,
        name: needer.name,
        requiredBloodGroup: needer.requiredBloodGroup,
        phone: needer.phone,
        email: needer.email,
        address: needer.address,
        urgency: needer.urgency
      }
    });
  } catch (error) {
    console.error('Needer login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get all needers
router.get('/', async (req, res) => {
  try {
    const needers = await Needer.find({ isActive: true }).select('-password');
    res.json(needers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blood report for a specific needer
router.get('/blood-report/:id', async (req, res) => {
  try {
    const needer = await Needer.findById(req.params.id);
    if (!needer) return res.status(404).json({ error: 'Needer not found' });
    if (!needer.bloodReportFile) return res.status(404).json({ error: 'Blood report not available' });
    res.sendFile(path.resolve(needer.bloodReportFile));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blood report' });
  }
});

module.exports = router;