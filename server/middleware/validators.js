const Joi = require('joi');

/**
 * Validation Schemas
 * Define validation rules for authentication endpoints
 */

// Username validation
const usernameSchema = Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
        'string.alphanum': 'Username must contain only letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
    });

// Email validation
const emailSchema = Joi.string()
    .email()
    .required()
    .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    });

// Password validation
const passwordSchema = Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'any.required': 'Password is required'
    });

/**
 * Signup validation schema
 */
const signupSchema = Joi.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .messages({
            'any.only': 'Passwords do not match'
        })
});

/**
 * Login validation schema
 */
const loginSchema = Joi.object({
    username: Joi.string().required().messages({
        'any.required': 'Username is required'
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required'
    })
});

/**
 * Email validation schema
 */
const emailOnlySchema = Joi.object({
    email: emailSchema
});

/**
 * Password reset schema
 */
const passwordResetSchema = Joi.object({
    token: Joi.string().required(),
    password: passwordSchema,
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Passwords do not match'
        })
});

/**
 * Refresh token schema
 */
const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh token is required'
    })
});

/**
 * Validation middleware factory
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Return all errors
            stripUnknown: true // Remove unknown fields
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path[0],
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                errors
            });
        }

        // Replace req.body with validated value
        req.body = value;
        next();
    };
};

module.exports = {
    validate,
    signupSchema,
    loginSchema,
    emailOnlySchema,
    passwordResetSchema,
    refreshTokenSchema
};
