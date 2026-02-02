/**
 * OTP Service - Uses multiple free providers with fallback
 * Primary: TextBelt (free tier: 1 SMS/day)
 * Secondary: Fast2SMS (free tier for India)
 * Fallback: Console logging for development
 */

const axios = require('axios');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Format phone number for Indian numbers
const formatPhoneNumber = (phoneNumber) => {
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    }
  }
  
  return cleaned;
};

// Get 10-digit number without country code
const getLocalNumber = (phoneNumber) => {
  const formatted = formatPhoneNumber(phoneNumber);
  return formatted.replace('+91', '');
};

// Send OTP via TextBelt (free tier)
const sendViaTextBelt = async (phone, otp) => {
  try {
    const response = await axios.post('https://textbelt.com/text', {
      phone: formatPhoneNumber(phone),
      message: `Your RedBridge OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`,
      key: 'textbelt' // Free tier key
    });
    
    if (response.data.success) {
      console.log('✅ OTP sent via TextBelt');
      return true;
    }
    return false;
  } catch (error) {
    console.log('⚠️ TextBelt failed:', error.message);
    return false;
  }
};

// Send OTP via Fast2SMS (free for India)
const sendViaFast2SMS = async (phone, otp) => {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return false;
  
  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'otp',
        variables_values: otp,
        numbers: getLocalNumber(phone)
      },
      {
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.return) {
      console.log('✅ OTP sent via Fast2SMS');
      return true;
    }
    return false;
  } catch (error) {
    console.log('⚠️ Fast2SMS failed:', error.message);
    return false;
  }
};

// Send OTP via Twilio (if configured)
const sendViaTwilio = async (phone, otp) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  
  if (!accountSid || !authToken || !twilioPhone) return false;
  
  try {
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);
    
    await client.messages.create({
      body: `Your RedBridge OTP is: ${otp}. Valid for 10 minutes.`,
      from: twilioPhone,
      to: formatPhoneNumber(phone)
    });
    
    console.log('✅ OTP sent via Twilio');
    return true;
  } catch (error) {
    console.log('⚠️ Twilio failed:', error.message);
    return false;
  }
};

// Send OTP via Twilio Verify API
const sendViaTwilioVerify = async (phone) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifyServiceSid) {
    console.log('⚠️ Twilio credentials are not configured properly.');
    return false;
  }

  try {
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    await client.verify.services(verifyServiceSid).verifications.create({
      to: formatPhoneNumber(phone),
      channel: 'sms',
    });

    console.log('✅ OTP sent via Twilio Verify API');
    return true;
  } catch (error) {
    console.log('⚠️ Twilio Verify API failed:', error.message);
    return false;
  }
};

// Main OTP sending function with fallback
const sendOTP = async (phone) => {
  const formattedPhone = formatPhoneNumber(phone);
  console.log(`\n📱 Sending OTP to ${formattedPhone}...`);

  // Try providers in order
  const providers = [
    { name: 'Twilio Verify API', fn: sendViaTwilioVerify },
    { name: 'Twilio', fn: sendViaTwilio },
    { name: 'Fast2SMS', fn: sendViaFast2SMS },
    { name: 'TextBelt', fn: sendViaTextBelt },
  ];

  for (const provider of providers) {
    const success = await provider.fn(phone);
    if (success) {
      return { success: true, provider: provider.name };
    }
  }

  // Fallback: Log to console (development mode)
  console.log(`\n========== OTP (DEV MODE) ==========`);
  console.log(`📱 Phone: ${formattedPhone}`);
  console.log(`⏰ Valid for: 10 minutes`);
  console.log(`💡 Configure SMS provider in .env for production`);
  console.log(`=====================================`);

  return { success: true, provider: 'console', devMode: true };
};

// Verify OTP
const verifyOTP = (storedOTP, storedExpiry, inputOTP) => {
  if (!storedOTP || !inputOTP) {
    return { valid: false, error: 'OTP is required' };
  }
  
  if (storedOTP !== inputOTP) {
    return { valid: false, error: 'Invalid OTP' };
  }
  
  if (storedExpiry && new Date() > new Date(storedExpiry)) {
    return { valid: false, error: 'OTP has expired' };
  }
  
  return { valid: true };
};

module.exports = {
  generateOTP,
  sendOTP,
  verifyOTP,
  formatPhoneNumber
};
