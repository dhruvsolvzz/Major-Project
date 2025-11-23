const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    required: true 
  },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  
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
  
  // Blood report data
  bloodReportData: {
    hospitalName: String,
    reportDate: String,
    extractedBloodGroup: String,
    verified: { type: Boolean, default: false }
  },
  
  // File paths
  aadhaarFile: String,
  bloodReportFile: String,
  
  // OCR raw data
  ocrRawData: {
    aadhaar: String,
    bloodReport: String
  },
  
  isActive: { type: Boolean, default: true },
  registeredAt: { type: Date, default: Date.now }
});

// Create 2dsphere index for geospatial queries
donorSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Donor', donorSchema);
