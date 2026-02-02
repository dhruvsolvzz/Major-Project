import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import PasswordStrength from '../components/PasswordStrength';
import StepIndicator from '../components/StepIndicator';
import { LogoIcon } from '../components/Icons';
import { FaUser, FaFileAlt, FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa';
import API_URL from '../config/api';

const NeederRegistration = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        // Step 1: Personal Info
        name: '',
        age: '',
        gender: 'Male',
        phone: '',
        requiredBloodGroup: '',
        urgency: 'Medium',

        // Step 2: Documents
        aadhaarNumber: '',

        // Step 3: Location
        address: '',
        latitude: '',
        longitude: '',

        // Step 4: Authentication
        password: '',
        confirmPassword: ''
    });

    const [files, setFiles] = useState({
        aadhaar: null,
        bloodReport: null // Optional for needers
    });

    const [extractionStatus, setExtractionStatus] = useState({
        aadhaar: { loading: false, success: false, data: null },
        bloodReport: { loading: false, success: false, data: null }
    });

    const steps = [
        { number: 1, title: 'Personal Info', icon: <FaUser /> },
        { number: 2, title: 'Documents', icon: <FaFileAlt /> },
        { number: 3, title: 'Location', icon: <FaMapMarkerAlt /> },
        { number: 4, title: 'Review & Submit', icon: <FaCheckCircle /> }
    ];

    // Auto-detect location
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setFormData(prev => ({
                        ...prev,
                        latitude: latitude.toString(),
                        longitude: longitude.toString()
                    }));

                    try {
                        const address = await getAddressFromCoords(latitude, longitude);
                        if (address) {
                            setFormData(prev => ({ ...prev, address }));
                        }
                    } catch (err) {
                        console.error('Address lookup failed:', err);
                    }
                },
                (error) => {
                    toast.warning('Please allow location access or enter manually');
                }
            );
        }
    }, []);

    const getAddressFromCoords = async (lat, lng) => {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        return data?.display_name || null;
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleFileUpload = async (type, file) => {
        if (!file) return;

        setFiles(prev => ({ ...prev, [type]: file }));
        setExtractionStatus(prev => ({
            ...prev,
            [type]: { loading: true, success: false, data: null }
        }));

        const formData = new FormData();
        formData.append(type, file);

        try {
            const response = await fetch(`${API_URL}/needers/extract-${type}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setExtractionStatus(prev => ({
                    ...prev,
                    [type]: { loading: false, success: true, data: data[`${type}Data`] }
                }));

                if (type === 'aadhaar' && data.aadhaarData) {
                    setFormData(prev => ({
                        ...prev,
                        name: data.aadhaarData.name || prev.name,
                        age: data.aadhaarData.age || prev.age,
                        gender: data.aadhaarData.gender || prev.gender,
                        aadhaarNumber: data.aadhaarData.number || prev.aadhaarNumber
                    }));
                    toast.success('Aadhaar details extracted successfully!');
                }
            } else {
                throw new Error(data.error || 'Extraction failed');
            }
        } catch (error) {
            setExtractionStatus(prev => ({
                ...prev,
                [type]: { loading: false, success: false, data: null }
            }));
            toast.error(`Failed to extract from ${type}: ${error.message}`);
        }
    };

    const validateStep = (step) => {
        switch (step) {
            case 1:
                if (!formData.name || !formData.age || !formData.phone) {
                    toast.error('Please fill in all personal information');
                    return false;
                }
                if (!formData.requiredBloodGroup) {
                    toast.error('Please select required blood group');
                    return false;
                }
                return true;

            case 2:
                if (!files.aadhaar) {
                    toast.error('Please upload your Aadhaar card');
                    return false;
                }
                if (!formData.aadhaarNumber) {
                    toast.error('Aadhaar number not extracted. Please try re-uploading');
                    return false;
                }
                return true;

            case 3:
                if (!formData.address || !formData.latitude || !formData.longitude) {
                    toast.error('Please provide your location');
                    return false;
                }
                return true;

            case 4:
                if (!formData.password || formData.password.length < 6) {
                    toast.error('Password must be at least 6 characters');
                    return false;
                }
                if (formData.password !== formData.confirmPassword) {
                    toast.error('Passwords do not match');
                    return false;
                }
                return true;

            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep(4)) return;

        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key]) data.append(key, formData[key]);
        });
        if (files.aadhaar) data.append('aadhaar', files.aadhaar);
        if (files.bloodReport) data.append('bloodReport', files.bloodReport);

        try {
            const response = await fetch(`${API_URL}/needers/register`, {
                method: 'POST',
                body: data
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success('Registration successful! Welcome to RedBridge.');
                setTimeout(() => navigate('/needer-login'), 2000);
            } else {
                toast.error(result.error || 'Registration failed');
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
            {/* Header */}
            <nav className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center space-x-3">
                        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-xl shadow-lg">
                            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                            RedBridge
                        </span>
                    </Link>

                    <Link to="/" className="text-slate-600 hover:text-slate-800 font-medium">
                        ← Back to Home
                    </Link>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl mb-6">
                        <LogoIcon className="h-12 w-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3">
                        Find Blood Donors
                    </h1>
                    <p className="text-slate-600 text-lg">
                        Register to connect with verified donors near you
                    </p>
                </div>

                {/* Step Indicator */}
                <StepIndicator steps={steps} currentStep={currentStep} userType="needer" />

                {/* Form Card */}
                <div className="bg-white rounded-3xl shadow-2xl border border-orange-100 p-8 md:p-12">
                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Personal Info */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Personal Information</h2>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all focus:scale-[1.01] hover:shadow-md"
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Age *
                                        </label>
                                        <input
                                            type="number"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleChange}
                                            min="1"
                                            max="120"
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all focus:scale-[1.01] hover:shadow-md"
                                            placeholder="Age"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Gender *
                                        </label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all focus:scale-[1.01] hover:shadow-md"
                                            required
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Phone *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all focus:scale-[1.01] hover:shadow-md"
                                            placeholder="Your phone"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Required Blood Group *
                                        </label>
                                        <select
                                            name="requiredBloodGroup"
                                            value={formData.requiredBloodGroup}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all focus:scale-[1.01] hover:shadow-md"
                                            required
                                        >
                                            <option value="">Select blood group</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Urgency Level *
                                        </label>
                                        <select
                                            name="urgency"
                                            value={formData.urgency}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all focus:scale-[1.01] hover:shadow-md"
                                            required
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                            <option value="Critical">Critical 🚨</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Documents */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Document Verification</h2>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        Aadhaar Card *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleFileUpload('aadhaar', e.target.files[0])}
                                            className="hidden"
                                            id="aadhaar-upload"
                                        />
                                        <label
                                            htmlFor="aadhaar-upload"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all hover:scale-[1.02] active:scale-95 hover:shadow-lg"
                                        >
                                            {extractionStatus.aadhaar.loading ? (
                                                <div className="text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                                                    <p className="text-sm text-slate-600">Extracting data...</p>
                                                </div>
                                            ) : extractionStatus.aadhaar.success ? (
                                                <div className="text-center text-green-600">
                                                    <svg className="h-8 w-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <p className="text-sm font-medium">Aadhaar uploaded!</p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <svg className="h-8 w-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <p className="text-sm text-slate-600">Click to upload Aadhaar</p>
                                                    <p className="text-xs text-slate-400 mt-1">PNG, JPG or PDF</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                    {extractionStatus.aadhaar.success && formData.aadhaarNumber && (
                                        <p className="mt-2 text-sm text-green-600">
                                            ✓ Aadhaar Number: {formData.aadhaarNumber}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Location */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Location Details</h2>

                                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl mb-6">
                                    <p className="text-sm text-orange-800">
                                        <svg className="inline h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Your location helps match you with nearby donors quickly.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Address *
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        rows="4"
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all focus:scale-[1.01] hover:shadow-md"
                                        placeholder="Auto-detected address (you can edit)"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Latitude
                                        </label>
                                        <input
                                            type="text"
                                            name="latitude"
                                            value={formData.latitude}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Longitude
                                        </label>
                                        <input
                                            type="text"
                                            name="longitude"
                                            value={formData.longitude}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50"
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Review & Submit */}
                        {currentStep === 4 && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Password & Review</h2>

                                <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-100 rounded-xl p-6 mb-6">
                                    <h3 className="font-semibold text-slate-900 mb-4">Summary</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-600">Name:</p>
                                            <p className="font-medium text-slate-900">{formData.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Age:</p>
                                            <p className="font-medium text-slate-900">{formData.age} years</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Required Blood Group:</p>
                                            <p className="font-medium text-orange-600 text-lg">{formData.requiredBloodGroup}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Urgency:</p>
                                            <p className={`font-medium ${formData.urgency === 'Critical' ? 'text-red-600' :
                                                formData.urgency === 'High' ? 'text-orange-600' : 'text-slate-900'
                                                }`}>{formData.urgency}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Create Password *
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            minLength="6"
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all focus:scale-[1.01] hover:shadow-md"
                                            placeholder="Minimum 6 characters"
                                            required
                                        />
                                        <PasswordStrength password={formData.password} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Confirm Password *
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            minLength="6"
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all focus:scale-[1.01] hover:shadow-md"
                                            placeholder="Re-enter password"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-12 pt-6 border-t">
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-all hover:border-slate-400 active:scale-95"
                                >
                                    ← Previous
                                </button>
                            )}

                            {currentStep < 4 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="ml-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-orange-500/40 transition-all active:scale-95 hover:-translate-y-1"
                                >
                                    Next →
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="ml-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-orange-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center active:scale-95 hover:-translate-y-1"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : (
                                        'Complete Registration ✓'
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <p className="text-center mt-8 text-slate-600">
                    Already registered?{' '}
                    <Link to="/needer-login" className="text-orange-600 hover:text-orange-700 font-semibold">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default NeederRegistration;
