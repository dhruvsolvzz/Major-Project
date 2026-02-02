const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Manual entry fields
  name: { type: String, required: true },
  age: { type: Number, required: true },
  
  // Contact info
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Aadhaar data (extracted from card)
  aadhaarNumber: { type: String, required: true, unique: true },
  aadhaarData: {
    extractedName: String,
    extractedDOB: String,
    extractedAge: Number,
    extractedGender: String,
    extractedPhone: String,
    verified: { type: Boolean, default: false }
  },
  
  // File path
  aadhaarFile: String,
  
  // OTP verification
  otp: String,
  otpExpiry: Date,
  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  
  // Account status
  isActive: { type: Boolean, default: true },
  registeredAt: { type: Date, default: Date.now },
  lastLogin: Date
});

// Index for faster queries
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ aadhaarNumber: 1 });

module.exports = mongoose.model('User', userSchema);
