const authService = require('../services/authService');

/**
 * Authentication Middleware
 * Protects routes by verifying JWT tokens
 */

/**
 * Verify access token and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const token = authService.extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No token provided. Please login.'
            });
        }

        // Verify token
        const decoded = authService.verifyAccessToken(token);

        // Attach user info to request
        req.user = decoded;
        next();

    } catch (error) {
        if (error.message === 'Token expired') {
            return res.status(401).json({
                success: false,
                error: 'Token expired. Please refresh your token or login again.',
                code: 'TOKEN_EXPIRED'
            });
        }

        return res.status(401).json({
            success: false,
            error: 'Invalid token. Please login again.',
            code: 'INVALID_TOKEN'
        });
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = authService.extractTokenFromHeader(req.headers.authorization);

        if (token) {
            const decoded = authService.verifyAccessToken(token);
            req.user = decoded;
        }

        next();
    } catch (error) {
        // Don't fail, just proceed without user
        next();
    }
};

/**
 * Require email verification
 */
const requireEmailVerification = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    if (!req.user.emailVerified) {
        return res.status(403).json({
            success: false,
            error: 'Please verify your email address to access this resource',
            code: 'EMAIL_NOT_VERIFIED'
        });
    }

    next();
};

/**
 * Check user type
 */
const requireUserType = (userType) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (req.user.userType !== userType) {
            return res.status(403).json({
                success: false,
                error: `Access denied. This resource is only available for ${userType}s.`
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    optionalAuth,
    requireEmailVerification,
    requireUserType
};
