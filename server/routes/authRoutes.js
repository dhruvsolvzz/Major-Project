const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Donor = require('../models/Donor');
const Needer = require('../models/Needer');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const { validate, signupSchema, loginSchema, emailOnlySchema, passwordResetSchema, refreshTokenSchema } = require('../middleware/validators');

/**
 * Production-Ready Authentication Routes
 * Handles user signup, login, email verification, and password reset
 */

// ========== SIGNUP ROUTES ==========

/**
 * POST /api/auth/donor/signup
 * Register a new donor with username/email/password
 */
router.post('/donor/signup', validate(signupSchema), async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await Donor.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email already registered'
                });
            }
            if (existingUser.username === username) {
                return res.status(400).json({
                    success: false,
                    error: 'Username already taken'
                });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate verification token
        const verificationToken = authService.generateVerificationToken();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user (without full registration - they need to complete profile later)
        const donor = new Donor({
            username,
            email,
            password: hashedPassword,
            emailVerified: false,
            verificationToken,
            verificationTokenExpiry,
            userType: 'donor',
            // Temporary values - will be updated during full registration
            name: username,
            age: 0,
            gender: 'Other',
            bloodGroup: 'O+',
            phone: '',
            address: '',
            aadhaarNumber: `TEMP_${Date.now()}`,
            location: {
                type: 'Point',
                coordinates: [0, 0]
            }
        });

        await donor.save();

        // Send verification email
        try {
            await emailService.sendVerificationEmail(email, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Account created successfully! Please check your email to verify your account.',
            data: {
                username: donor.username,
                email: donor.email,
                emailVerified: donor.emailVerified
            }
        });

    } catch (error) {
        console.error('Donor signup error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during registration'
        });
    }
});

/**
 * POST /api/auth/needer/signup
 * Register a new needer with username/email/password
 */
router.post('/needer/signup', validate(signupSchema), async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await Needer.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email already registered'
                });
            }
            if (existingUser.username === username) {
                return res.status(400).json({
                    success: false,
                    error: 'Username already taken'
                });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate verification token
        const verificationToken = authService.generateVerificationToken();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Create user
        const needer = new Needer({
            username,
            email,
            password: hashedPassword,
            emailVerified: false,
            verificationToken,
            verificationTokenExpiry,
            userType: 'needer',
            // Temporary values
            name: username,
            age: 0,
            gender: 'Other',
            requiredBloodGroup: 'O+',
            phone: '',
            address: '',
            aadhaarNumber: `TEMP_${Date.now()}`,
            location: {
                type: 'Point',
                coordinates: [0, 0]
            }
        });

        await needer.save();

        // Send verification email
        try {
            await emailService.sendVerificationEmail(email, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Account created successfully! Please check your email to verify your account.',
            data: {
                username: needer.username,
                email: needer.email,
                emailVerified: needer.emailVerified
            }
        });

    } catch (error) {
        console.error('Needer signup error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during registration'
        });
    }
});

// ========== LOGIN ROUTES ==========

/**
 * POST /api/auth/donor/login
 * Login donor with username and password
 */
router.post('/donor/login', validate(loginSchema), async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const donor = await Donor.findOne({ username });

        if (!donor) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, donor.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }

        // Generate tokens
        const tokens = authService.generateTokenPair({
            _id: donor._id,
            username: donor.username,
            email: donor.email,
            emailVerified: donor.emailVerified,
            userType: 'donor'
        });

        // Update refresh token and last login
        donor.refreshToken = tokens.refreshToken;
        donor.lastLogin = new Date();
        await donor.save();

        // Create response
        const response = authService.createAuthResponse(donor, tokens);

        res.json(response);

    } catch (error) {
        console.error('Donor login error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
});

/**
 * POST /api/auth/needer/login
 * Login needer with username and password
 */
router.post('/needer/login', validate(loginSchema), async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const needer = await Needer.findOne({ username });

        if (!needer) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, needer.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }

        // Generate tokens
        const tokens = authService.generateTokenPair({
            _id: needer._id,
            username: needer.username,
            email: needer.email,
            emailVerified: needer.emailVerified,
            userType: 'needer'
        });

        // Update refresh token and last login
        needer.refreshToken = tokens.refreshToken;
        needer.lastLogin = new Date();
        await needer.save();

        // Create response
        const response = authService.createAuthResponse(needer, tokens);

        res.json(response);

    } catch (error) {
        console.error('Needer login error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
});

// ========== EMAIL VERIFICATION ==========

/**
 * GET /api/auth/verify-email/:token
 * Verify email address with token
 */
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Check both Donor and Needer collections
        let user = await Donor.findOne({
            verificationToken: token,
            verificationTokenExpiry: { $gt: Date.now() }
        });

        let userType = 'donor';

        if (!user) {
            user = await Needer.findOne({
                verificationToken: token,
                verificationTokenExpiry: { $gt: Date.now() }
            });
            userType = 'needer';
        }

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired verification token'
            });
        }

        // Mark email as verified
        user.emailVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        await user.save();

        // Send welcome email
        try {
            await emailService.sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        res.json({
            success: true,
            message: 'Email verified successfully!',
            data: {
                username: user.username,
                email: user.email,
                emailVerified: true
            }
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during verification'
        });
    }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
router.post('/resend-verification', validate(emailOnlySchema), async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        let user = await Donor.findOne({ email });
        let userType = 'donor';

        if (!user) {
            user = await Needer.findOne({ email });
            userType = 'needer';
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'No account found with this email'
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                error: 'Email already verified'
            });
        }

        // Generate new token
        const verificationToken = authService.generateVerificationToken();
        user.verificationToken = verificationToken;
        user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        // Send email
        await emailService.sendVerificationEmail(email, verificationToken);

        res.json({
            success: true,
            message: 'Verification email sent! Please check your inbox.'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error. Please try again later.'
        });
    }
});

// ========== REFRESH TOKEN ==========

/**
 * POST /api/auth/refresh-token
 * Get new access token using refresh token
 */
router.post('/refresh-token', validate(refreshTokenSchema), async (req, res) => {
    try {
        const { refreshToken } = req.body;

        // Verify refresh token
        const decoded = authService.verifyRefreshToken(refreshToken);

        // Find user and verify stored refresh token matches
        let user = await Donor.findOne({
            _id: decoded.id,
            refreshToken
        });

        let userType = 'donor';

        if (!user) {
            user = await Needer.findOne({
                _id: decoded.id,
                refreshToken
            });
            userType = 'needer';
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token'
            });
        }

        // Generate new access token
        const accessToken = authService.generateAccessToken({
            _id: user._id,
            username: user.username,
            email: user.email,
            emailVerified: user.emailVerified,
            userType
        });

        res.json({
            success: true,
            tokens: {
                accessToken,
                expiresIn: 900 // 15 minutes
            }
        });

    } catch (error) {
        if (error.message === 'Refresh token expired') {
            return res.status(401).json({
                success: false,
                error: 'Refresh token expired. Please login again.',
                code: 'REFRESH_TOKEN_EXPIRED'
            });
        }

        res.status(401).json({
            success: false,
            error: 'Invalid refresh token'
        });
    }
});

module.exports = router;
