const twilio = require('twilio');

// For development, you can use a mock service or configure Twilio
// To use Twilio, set these in your .env file:
// TWILIO_ACCOUNT_SID=your_account_sid
// TWILIO_AUTH_TOKEN=your_auth_token
// TWILIO_PHONE_NUMBER=your_twilio_phone_number

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Format phone number to E.164 format (required by Twilio)
const formatPhoneNumber = (phoneNumber) => {
  // Remove all spaces, dashes, and parentheses
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // If it doesn't start with +, assume it's an Indian number and add +91
  if (!cleaned.startsWith('+')) {
    // If it starts with 0, remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    // If it starts with 91 (country code without +), add +
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length === 10) {
      // Assume it's an Indian 10-digit number
      cleaned = '+91' + cleaned;
    }
  }
  
  return cleaned;
};

// Send OTP via SMS
const sendOTP = async (phoneNumber, otp) => {
  try {
    console.log(`Generated OTP for ${phoneNumber}: ${otp}`);
    return { success: true, provider: 'ConsoleLog' };
  } catch (error) {
    console.error('Error logging OTP:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTP
};

