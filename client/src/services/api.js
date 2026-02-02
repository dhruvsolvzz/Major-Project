import axios from 'axios';

// API Base URL - uses environment variable or defaults to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

// Request interceptor - adds auth token if available
api.interceptors.request.use(
    (config) => {
        // Check for donor token
        const donorToken = localStorage.getItem('donorToken');
        // Check for needer token
        const neederToken = localStorage.getItem('neederToken');

        const token = donorToken || neederToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handles common error patterns
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            if (status === 401) {
                // Unauthorized - clear tokens and redirect to login
                localStorage.removeItem('donorToken');
                localStorage.removeItem('neederToken');
                localStorage.removeItem('donorData');
                localStorage.removeItem('neederData');
                // Optionally redirect to login
                // window.location.href = '/';
            }

            // Return a more user-friendly error
            return Promise.reject({
                status,
                message: data.error || data.message || 'An error occurred',
                details: data
            });
        } else if (error.request) {
            // Request made but no response received
            return Promise.reject({
                status: 0,
                message: 'Network error. Please check your connection.',
                details: null
            });
        } else {
            // Error setting up request
            return Promise.reject({
                status: 0,
                message: error.message || 'An unexpected error occurred',
                details: null
            });
        }
    }
);

// ==================== DONOR API ====================
export const donorAPI = {
    // Register a new donor
    register: (formData) => {
        return api.post('/donors/register', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Login donor
    login: (phone, password) => {
        return api.post('/donors/login-password', { phone, password });
    },

    // Get all donors
    getAll: () => {
        return api.get('/donors');
    },

    // Get nearby donors
    getNearby: (latitude, longitude, maxDistance = 20000) => {
        return api.get('/donors/nearby', {
            params: { latitude, longitude, maxDistance }
        });
    },

    // Extract from Aadhaar
    extractAadhaar: (formData) => {
        return api.post('/donors/extract-aadhaar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Extract from blood report
    extractBloodReport: (formData) => {
        return api.post('/donors/extract-blood-report', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Preview extraction
    preview: (formData) => {
        return api.post('/donors/preview', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Forgot password - send OTP
    forgotPasswordSendOTP: (phone) => {
        return api.post('/donors/forgot-password/send-otp', { phone });
    },

    // Forgot password - reset
    forgotPasswordReset: (phone, otp, newPassword) => {
        return api.post('/donors/forgot-password/reset', { phone, otp, newPassword });
    }
};

// ==================== NEEDER API ====================
export const neederAPI = {
    // Register a new needer
    register: (formData) => {
        return api.post('/needers/register', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Login needer
    login: (phone, password) => {
        return api.post('/needers/login-password', { phone, password });
    },

    // Get all needers
    getAll: () => {
        return api.get('/needers');
    },

    // Extract from Aadhaar
    extractAadhaar: (formData) => {
        return api.post('/needers/extract-aadhaar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Forgot password - send OTP
    forgotPasswordSendOTP: (phone) => {
        return api.post('/needers/forgot-password/send-otp', { phone });
    },

    // Forgot password - reset
    forgotPasswordReset: (phone, otp, newPassword) => {
        return api.post('/needers/forgot-password/reset', { phone, otp, newPassword });
    }
};

// ==================== MATCH API ====================
export const matchAPI = {
    // Find donors for a needer
    findDonorsForNeeder: (neederId, maxDistance = 20) => {
        return api.get(`/match/needer/${neederId}`, {
            params: { maxDistance }
        });
    },

    // Find needers for a donor
    findNeedersForDonor: (donorId, maxDistance = 20) => {
        return api.get(`/match/donor/${donorId}`, {
            params: { maxDistance }
        });
    }
};

// ==================== HEALTH API ====================
export const healthAPI = {
    check: () => {
        return api.get('/health');
    }
};

// Export the base api instance for custom requests
export default api;
