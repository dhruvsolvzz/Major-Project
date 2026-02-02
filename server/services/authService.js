const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Authentication Service
 * Handles JWT generation, validation, and token management
 */
class AuthService {
    constructor() {
        this.accessTokenSecret = process.env.JWT_SECRET;
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
        this.accessTokenExpiry = '15m'; // 15 minutes
        this.refreshTokenExpiry = '7d'; // 7 days
        this.verificationTokenExpiry = '24h'; // 24 hours
    }

    /**
     * Generate access token (short-lived)
     */
    generateAccessToken(user) {
        const payload = {
            id: user._id || user.id,
            username: user.username,
            email: user.email,
            userType: user.userType || 'donor'
        };

        return jwt.sign(payload, this.accessTokenSecret, {
            expiresIn: this.accessTokenExpiry
        });
    }

    /**
     * Generate refresh token (long-lived)
     */
    generateRefreshToken(user) {
        const payload = {
            id: user._id || user.id,
            username: user.username
        };

        return jwt.sign(payload, this.refreshTokenSecret, {
            expiresIn: this.refreshTokenExpiry
        });
    }

    /**
     * Generate both access and refresh tokens
     */
    generateTokenPair(user) {
        return {
            accessToken: this.generateAccessToken(user),
            refreshToken: this.generateRefreshToken(user),
            expiresIn: 900 // 15 minutes in seconds
        };
    }

    /**
     * Verify access token
     */
    verifyAccessToken(token) {
        try {
            return jwt.verify(token, this.accessTokenSecret);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expired');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid token');
            }
            throw error;
        }
    }

    /**
     * Verify refresh token
     */
    verifyRefreshToken(token) {
        try {
            return jwt.verify(token, this.refreshTokenSecret);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Refresh token expired');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid refresh token');
            }
            throw error;
        }
    }

    /**
     * Generate email verification token
     */
    generateVerificationToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Generate password reset token
     */
    generatePasswordResetToken() {
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        return {
            token, // Send this to user
            hashedToken, // Store this in database
            expires: Date.now() + 3600000 // 1 hour
        };
    }

    /**
     * Hash password reset token for comparison
     */
    hashToken(token) {
        return crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
    }

    /**
     * Extract token from Authorization header
     */
    extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }

    /**
     * Create response with tokens and user data
     */
    createAuthResponse(user, tokens) {
        return {
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                emailVerified: user.emailVerified || false,
                userType: user.userType
            },
            tokens: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn
            }
        };
    }
}

module.exports = new AuthService();
