const mongoose = require('mongoose');

const neederSchema = new mongoose.Schema({
  // Authentication fields
  username: { type: String, unique: true, sparse: true }, // sparse allows null for existing records
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },
  refreshToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpiry: { type: Date },
  lastLogin: { type: Date },

  // Personal info
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  requiredBloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    required: true
  },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  urgency: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },

  // Legacy OTP fields (can be removed if not using phone auth)
  otp: { type: String },
  otpExpiry: { type: Date },

  // Geolocation
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },

  // Aadhaar data
  aadhaarNumber: { type: String, required: true, unique: true },
  aadhaarData: {
    extractedName: String,
    extractedDOB: String,
    extractedGender: String,
    verified: { type: Boolean, default: false }
  },

  // File paths
  aadhaarFile: String,
  bloodReportFile: String,

  // Blood report data (optional - for verification)
  bloodReportData: {
    hospitalName: String,
    reportDate: String,
    extractedBloodGroup: String,
    verified: { type: Boolean, default: false },
    source: String
  },

  // OCR raw data
  ocrRawData: {
    aadhaar: String,
    bloodReport: String
  },

  userType: { type: String, default: 'needer' },
  isActive: { type: Boolean, default: true },
  registeredAt: { type: Date, default: Date.now }
});

// Create 2dsphere index for geospatial queries
neederSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Needer', neederSchema);
