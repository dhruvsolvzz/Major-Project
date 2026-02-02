const nodemailer = require('nodemailer');
const crypto = require('crypto');

/**
 * Email Service for sending verification, password reset, and notification emails
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  /**
   * Initialize email transporter with configuration
   */
  initTransporter() {
    const emailConfig = {
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    };

    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('⚠️ Email credentials not configured. Email features will be disabled.');
      console.warn('   Set EMAIL_USER and EMAIL_PASS in .env file to enable emails.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(emailConfig);
      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  /**
   * Verify email configuration is working
   */
  async verifyConnection() {
    if (!this.transporter) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service is ready' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate verification token
   */
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email, token, userType = 'donor') {
    if (!this.transporter) {
      console.log('📧 Email service disabled - verification token:', token);
      return { success: true, message: 'Email service disabled - check console for token' };
    }

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}&type=${userType}`;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .note { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌉 RedBridge</h1>
            <p style="color: white; margin: 10px 0 0 0;">Blood Donation Platform</p>
          </div>
          <div class="content">
            <h2>Welcome to RedBridge!</h2>
            <p>Thank you for registering as a ${userType === 'donor' ? '❤️ Blood Donor' : '🆘 Blood Needer'}. You're one step away from completing your registration.</p>
            
            <p>Please click the button below to verify your email and activate your account:</p>
            
            <center>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </center>
            
            <div class="note">
              <strong>Note:</strong> This verification link will expire in 24 hours. If you didn't create this account, please ignore this email.
            </div>
            
            <p>Alternatively, you can copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">
              ${verificationUrl}
            </p>
            
            <p>Thank you for helping save lives through blood donation!</p>
          </div>
          <div class="footer">
            <p>RedBridge Blood Donation Platform</p>
            <p>Connecting donors with those in need</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"RedBridge" <noreply@redbridge.com>',
        to: email,
        subject: 'Verify Your Email - RedBridge Blood Donation',
        html: htmlTemplate
      });

      console.log('✅ Verification email sent to:', email);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send verification email:', error.message);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, token, userType = 'donor') {
    if (!this.transporter) {
      console.log('📧 Email service disabled - reset token:', token);
      return { success: true, message: 'Email service disabled - check console for token' };
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}&type=${userType}`;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌉 RedBridge</h1>
            <p style="color: white; margin: 10px 0 0 0;">Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            
            <div class="warning">
              <strong>Security Notice:</strong> This password reset link will expire in 1 hour. If you didn't request this, please ignore this email and your password will remain unchanged.
            </div>
            
            <p>Alternatively, you can copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">
              ${resetUrl}
            </p>
          </div>
          <div class="footer">
            <p>RedBridge Blood Donation Platform</p>
            <p>If you have any questions, please contact support</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"RedBridge" <noreply@redbridge.com>',
        to: email,
        subject: 'Reset Your Password - RedBridge',
        html: htmlTemplate
      });

      console.log('✅ Password reset email sent to:', email);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error.message);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(email, name, userType = 'donor') {
    if (!this.transporter) {
      console.log('📧 Email service disabled - Welcome email skipped');
      return { success: true, message: 'Email service disabled' };
    }

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #dc2626; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌉 Welcome to RedBridge!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}! 👋</h2>
            <p>Thank you for joining RedBridge as a ${userType === 'donor' ? 'Blood Donor' : 'Blood Needer'}. Your account has been successfully verified!</p>
            
            <h3>${userType === 'donor' ? '🎯 As a Donor, you can:' : '🎯 As a Needer, you can:'}</h3>
            
            <div class="feature">
              ${userType === 'donor' ?
        '❤️ Help save lives by donating blood to those in need' :
        '🔍 Find compatible blood donors near your location'
      }
            </div>
            <div class="feature">
              ${userType === 'donor' ?
        '📍 Be discovered by needers in your area through our location-based matching' :
        '📞 directly with verified donors'
      }
            </div>
            <div class="feature">
              ${userType === 'donor' ?
        '✅ Verified through AI-powered document authentication' :
        '⚡ Get instant matches based on blood group compatibility'
      }
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Complete your profile with all necessary information</li>
              <li>Keep your contact details updated</li>
              <li>${userType === 'donor' ? 'Respond promptly when someone needs your blood type' : 'Use our smart matching to find donors quickly'}</li>
            </ul>
            
            <p>Together, we can save lives! 🌟</p>
          </div>
          <div class="footer">
            <p>RedBridge Blood Donation Platform</p>
            <p>Connecting donors with those in need</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"RedBridge" <noreply@redbridge.com>',
        to: email,
        subject: 'Welcome to RedBridge! 🌉',
        html: htmlTemplate
      });

      console.log('✅ Welcome email sent to:', email);
      return { success: true };
    } catch (error) {
      console.error('⚠️ Failed to send welcome email (non-critical):', error.message);
      // Don't throw error for welcome email - it's not critical
      return { success: false };
    }
  }
}

module.exports = new EmailService();
