const mongoose = require('mongoose');

const neederSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  requiredBloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    required: true 
  },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  urgency: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  
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
  
  isActive: { type: Boolean, default: true },
  registeredAt: { type: Date, default: Date.now }
});

// Create 2dsphere index for geospatial queries
neederSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Needer', neederSchema);
