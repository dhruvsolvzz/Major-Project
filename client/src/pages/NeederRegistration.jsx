import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerNeeder } from '../store/neederSlice';
import FileUpload from '../components/FileUpload';

const NeederRegistration = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success } = useSelector(state => state.needer);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    requiredBloodGroup: 'A+',
    urgency: 'Medium',
    latitude: '',
    longitude: ''
  });

  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [bloodReportFile, setBloodReportFile] = useState(null);
  const [useManualBloodGroup, setUseManualBloodGroup] = useState(false);
  const [locationMode, setLocationMode] = useState('auto'); // 'auto' or 'manual'
  const [manualAddress, setManualAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: ''
  });
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  
  // Auto-fill status
  const [autoFillStatus, setAutoFillStatus] = useState({
    isExtracting: false,
    isComplete: false,
    extractedFields: []
  });

  // Aadhaar validation
  const [aadhaarData, setAadhaarData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  // Auto-extract and fill form from Aadhaar
  const autoExtractFromAadhaar = async (file) => {
    setAutoFillStatus({ isExtracting: true, isComplete: false, extractedFields: [] });
    
    try {
      const formDataAadhaar = new FormData();
      formDataAadhaar.append('aadhaar', file);

      const response = await fetch('http://localhost:5000/api/needers/extract-aadhaar', {
        method: 'POST',
        body: formDataAadhaar
      });

      const data = await response.json();
      
      if (data.success && data.aadhaarData) {
        const fields = [];
        
        // Store Aadhaar data for validation
        setAadhaarData(data.aadhaarData);
        
        // Auto-fill only empty fields
        setFormData(prev => ({
          ...prev,
          name: data.aadhaarData.name || prev.name,
          age: data.aadhaarData.age || prev.age,
          gender: data.aadhaarData.gender || prev.gender
        }));
        
        if (data.aadhaarData.name) fields.push('Name');
        if (data.aadhaarData.age) fields.push('Age');
        if (data.aadhaarData.gender) fields.push('Gender');
        
        setAutoFillStatus({ isExtracting: false, isComplete: true, extractedFields: fields });
        setTimeout(() => setAutoFillStatus(prev => ({ ...prev, isComplete: false })), 5000);
      }
    } catch (error) {
      console.error('Auto-extract error:', error);
    } finally {
      if (autoFillStatus.isExtracting) {
        setAutoFillStatus({ isExtracting: false, isComplete: false, extractedFields: [] });
      }
    }
  };

  // Validate form data against Aadhaar
  const validateAgainstAadhaar = () => {
    console.log('🔍 Validating against Aadhaar...');
    console.log('Aadhaar Data:', aadhaarData);
    console.log('Form Data:', { name: formData.name, age: formData.age });
    
    // Aadhaar data must be extracted
    if (!aadhaarData) {
      console.log('❌ No Aadhaar data found');
      setValidationErrors(['Aadhaar data not extracted. Please upload a clear Aadhaar card image.']);
      return false;
    }

    // If name and age couldn't be extracted (poor image quality), allow manual entry
    if (!aadhaarData.name || !aadhaarData.age) {
      console.log('⚠️ Incomplete Aadhaar data - allowing manual entry due to poor image quality');
      console.log('✅ Validation passed - manual entry accepted');
      setValidationErrors([]);
      return true; // Allow registration with manual entry
    }

    const errors = [];
    
    // Name validation - strict matching
    if (aadhaarData.name && formData.name) {
      const aadhaarName = aadhaarData.name.toLowerCase().trim();
      const formName = formData.name.toLowerCase().trim();
      
      // Split names into words
      const aadhaarWords = aadhaarName.split(/\s+/).filter(w => w.length > 2);
      const formWords = formName.split(/\s+/).filter(w => w.length > 2);
      
      // Check if at least one significant word matches
      let hasMatch = false;
      for (const aadhaarWord of aadhaarWords) {
        for (const formWord of formWords) {
          // Check if words match or one contains the other (min 3 chars)
          if (aadhaarWord === formWord || 
              (aadhaarWord.length >= 3 && formWord.length >= 3 && 
               (aadhaarWord.includes(formWord) || formWord.includes(aadhaarWord)))) {
            hasMatch = true;
            break;
          }
        }
        if (hasMatch) break;
      }
      
      if (!hasMatch) {
        errors.push(`❌ Name mismatch: You entered "${formData.name}" but Aadhaar shows "${aadhaarData.name}"`);
      }
    }
    
    // Age validation (allow ±1 year)
    if (aadhaarData.age && formData.age) {
      const ageDiff = Math.abs(parseInt(aadhaarData.age) - parseInt(formData.age));
      if (ageDiff > 1) {
        errors.push(`❌ Age mismatch: You entered ${formData.age} years but Aadhaar shows ${aadhaarData.age} years`);
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    if (navigator.geolocation) {
      console.log('Requesting location permission...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('Location detected:', position.coords);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString()
          }));
          
          // Get address from coordinates
          try {
            const address = await getAddressFromCoordinates(lat, lng);
            if (address) {
              setFormData(prev => ({
                ...prev,
                address: address
              }));
            }
          } catch (error) {
            console.error('Error getting address:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error.message);
          alert('Location access denied. Please enable location or use Manual Entry mode.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please use Manual Entry mode.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reverse geocoding - get address from coordinates
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        const parts = [];
        
        if (addr.road) parts.push(addr.road);
        if (addr.suburb) parts.push(addr.suburb);
        if (addr.city || addr.town || addr.village) {
          parts.push(addr.city || addr.town || addr.village);
        }
        if (addr.state_district) parts.push(addr.state_district);
        if (addr.state) parts.push(addr.state);
        if (addr.postcode) parts.push(addr.postcode);
        
        return parts.join(', ');
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  // Forward geocoding - get coordinates from address
  const handleGeocodeAddress = async () => {
    setGeocoding(true);
    setGeocodeError('');
    
    try {
      // Build search query
      const parts = [];
      if (manualAddress.street) parts.push(manualAddress.street);
      if (manualAddress.city) parts.push(manualAddress.city);
      if (manualAddress.state) parts.push(manualAddress.state);
      if (manualAddress.postalCode) parts.push(manualAddress.postalCode);
      
      const query = parts.join(', ');
      
      // Use Nominatim with proper headers and delay
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in`,
        {
          headers: {
            'User-Agent': 'RedBridge/1.0',
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = data[0];
        const fullAddress = `${manualAddress.street}, ${manualAddress.city}${manualAddress.state ? ', ' + manualAddress.state : ''}${manualAddress.postalCode ? ', ' + manualAddress.postalCode : ''}`;
        
        setFormData(prev => ({
          ...prev,
          latitude: location.lat,
          longitude: location.lon,
          address: fullAddress
        }));
        setGeocodeError('');
      } else {
        setGeocodeError('Location not found. Please check your address and try again.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodeError('Unable to find location. Please try using Auto-Detect mode or check your internet connection.');
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (success) {
      alert('Registration successful! We will find donors for you.');
      navigate('/');
    }
  }, [success, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password
    if (!formData.password || formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    // Validate against Aadhaar data
    if (!validateAgainstAadhaar()) {
      alert('Validation Error:\n\n' + validationErrors.join('\n\n') + '\n\nPlease ensure your information matches your Aadhaar card.');
      return;
    }
    
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    data.append('aadhaar', aadhaarFile);
    
    // Add blood report if uploaded (optional)
    if (bloodReportFile) {
      data.append('bloodReport', bloodReportFile);
    }

    dispatch(registerNeeder(data));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white/90 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-blue-500/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 p-2.5 rounded-xl shadow-lg">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                RedBridge
              </span>
            </Link>
            <Link to="/donor-registration">
              <button className="bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-xl shadow-red-500/30 hover:shadow-2xl hover:scale-105 transition-all duration-200">
                + Register as Donor
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-do-blue-600 hover:text-do-blue-700 font-medium mb-6 group"
          >
            <svg className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-3 rounded-xl shadow-xl shadow-blue-500/30">
              <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Needer Registration</h2>
              <p className="mt-1 text-slate-600">
                Find compatible blood donors in your area quickly.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r-xl mb-6 shadow-soft">
            <div className="flex items-start">
              <svg className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-soft border border-slate-200 p-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-3">
              Personal Information
            </h3>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <svg className="inline mr-2 h-4 w-4 text-cf-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Full Name *
                {aadhaarData && aadhaarData.name && (
                  <span className="text-xs text-slate-500 ml-2">(Aadhaar: {aadhaarData.name})</span>
                )}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cf-orange-500 focus:border-cf-orange-500 transition-all duration-200"
                placeholder="Enter your full name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <svg className="inline mr-2 h-4 w-4 text-cf-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Age *
                  {aadhaarData && aadhaarData.age && (
                    <span className="text-xs text-slate-500 ml-2">(Aadhaar: {aadhaarData.age})</span>
                  )}
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cf-orange-500 focus:border-cf-orange-500 transition-all duration-200"
                  placeholder="Age"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <svg className="inline mr-2 h-4 w-4 text-cf-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cf-orange-500 focus:border-cf-orange-500 transition-all duration-200"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <svg className="inline mr-2 h-4 w-4 text-cf-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cf-orange-500 focus:border-cf-orange-500 transition-all duration-200"
                  placeholder="Your phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <svg className="inline mr-2 h-4 w-4 text-cf-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Urgency *
              </label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cf-orange-500 focus:border-cf-orange-500 transition-all duration-200"
              >
                <option value="Low">Low - Within a week</option>
                <option value="Medium">Medium - Within 3 days</option>
                <option value="High">High - Within 24 hours</option>
                <option value="Critical">Critical - Immediate</option>
              </select>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-3">
              Blood Group Information
            </h3>

            <div className="bg-cf-orange-50 border-l-4 border-cf-orange-500 p-4 rounded-r-lg">
              <p className="text-sm text-cf-orange-800">
                <svg className="inline h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <strong>Choose one option:</strong> Upload your blood report for verification OR select your blood group manually.
              </p>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border-2 border-cf-orange-200">
              <input
                type="checkbox"
                id="useManualBloodGroup"
                checked={useManualBloodGroup}
                onChange={(e) => setUseManualBloodGroup(e.target.checked)}
                className="w-5 h-5 text-cf-orange-600 border-slate-300 rounded focus:ring-cf-orange-500"
              />
              <label htmlFor="useManualBloodGroup" className="text-sm font-semibold text-slate-700 cursor-pointer">
                I don't have a blood report - I'll select my blood group manually
              </label>
            </div>

            {!useManualBloodGroup ? (
              <div>
                <FileUpload
                  label="Upload Blood Report (PDF/Image)"
                  name="bloodReport"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setBloodReportFile(file);
                  }}
                />
                {bloodReportFile && (
                  <p className="text-sm text-green-600 flex items-center mt-2">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {bloodReportFile.name}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <svg className="inline mr-2 h-4 w-4 text-cf-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                  </svg>
                  Select Your Required Blood Group *
                </label>
                <select
                  name="requiredBloodGroup"
                  value={formData.requiredBloodGroup}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cf-orange-500 focus:border-cf-orange-500 transition-all duration-200"
                >
                  <option value="">-- Select Blood Group --</option>
                  <option value="A+">A+ (A Positive)</option>
                  <option value="A-">A- (A Negative)</option>
                  <option value="B+">B+ (B Positive)</option>
                  <option value="B-">B- (B Negative)</option>
                  <option value="O+">O+ (O Positive)</option>
                  <option value="O-">O- (O Negative)</option>
                  <option value="AB+">AB+ (AB Positive)</option>
                  <option value="AB-">AB- (AB Negative)</option>
                </select>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-3">
              Login Credentials
            </h3>
            
            <div className="bg-cf-orange-50 border-l-4 border-cf-orange-500 p-4 rounded-r-lg">
              <p className="text-sm text-cf-orange-800">
                <svg className="inline h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <strong>Login Info:</strong> Your Aadhaar number (extracted from card) will be your username. Create a password below.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <svg className="inline mr-2 h-4 w-4 text-cf-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Create Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cf-orange-500 focus:border-cf-orange-500 transition-all duration-200"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <svg className="inline mr-2 h-4 w-4 text-cf-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cf-orange-500 focus:border-cf-orange-500 transition-all duration-200"
                  placeholder="Re-enter password"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <svg className="inline mr-2 h-4 w-4 text-cf-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Address *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows="3"
              placeholder="Auto-detecting from your location..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cf-orange-500 focus:border-cf-orange-500 transition-all duration-200"
            />
            {formData.address && (
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Address detected from location
              </p>
            )}
          </div>

          <div className="mt-6 p-6 bg-gradient-to-br from-cf-orange-50 to-do-blue-50 rounded-xl border border-cf-orange-200">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-800 flex items-center">
                <svg className="h-5 w-5 mr-2 text-cf-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLocationMode('auto');
                    // Request location again
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        async (position) => {
                          const lat = position.coords.latitude;
                          const lng = position.coords.longitude;
                          setFormData(prev => ({
                            ...prev,
                            latitude: lat.toString(),
                            longitude: lng.toString()
                          }));
                          const address = await getAddressFromCoordinates(lat, lng);
                          if (address) {
                            setFormData(prev => ({ ...prev, address }));
                          }
                        },
                        (error) => {
                          alert('Location permission denied. Please enable location in your browser settings or use Manual Entry.');
                        }
                      );
                    }
                  }}
                  className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${
                    locationMode === 'auto'
                      ? 'bg-cf-orange-600 text-white shadow-cf'
                      : 'bg-white text-cf-orange-600 border border-cf-orange-300 hover:bg-cf-orange-50'
                  }`}
                >
                  📍 Auto-Detect
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode('manual')}
                  className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${
                    locationMode === 'manual'
                      ? 'bg-cf-orange-600 text-white shadow-cf'
                      : 'bg-white text-cf-orange-600 border border-cf-orange-300 hover:bg-cf-orange-50'
                  }`}
                >
                  ✏️ Manual Entry
                </button>
              </div>
            </div>

            {locationMode === 'auto' ? (
              <>
                <p className="text-sm text-slate-700 mb-3 flex items-center">
                  {formData.latitude && formData.longitude ? (
                    <>
                      <svg className="h-5 w-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-700 font-medium">Location Detected</span>
                    </>
                  ) : (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2 text-cf-orange-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-slate-600">Detecting your location...</span>
                    </>
                  )}
                </p>
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-slate-600 bg-white px-3 py-2 rounded-lg">
                    Coordinates: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 mb-3">
                  Enter your address and we'll find the coordinates automatically
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Street/Area Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., MG Road, Sector 18"
                    value={manualAddress.street}
                    onChange={(e) => setManualAddress({...manualAddress, street: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cf-orange-500 focus:border-cf-orange-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., New Delhi"
                      value={manualAddress.city}
                      onChange={(e) => setManualAddress({...manualAddress, city: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cf-orange-500 focus:border-cf-orange-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Delhi"
                      value={manualAddress.state}
                      onChange={(e) => setManualAddress({...manualAddress, state: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cf-orange-500 focus:border-cf-orange-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 110001"
                    value={manualAddress.postalCode}
                    onChange={(e) => setManualAddress({...manualAddress, postalCode: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cf-orange-500 focus:border-cf-orange-500 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGeocodeAddress}
                  disabled={!manualAddress.street || !manualAddress.city || geocoding}
                  className="w-full bg-gradient-to-r from-cf-orange-500 to-cf-orange-600 text-white py-3 rounded-lg hover:from-cf-orange-600 hover:to-cf-orange-700 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-cf hover:shadow-medium flex items-center justify-center"
                >
                  {geocoding ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Finding Location...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Find My Location
                    </>
                  )}
                </button>
                {geocodeError && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{geocodeError}</p>
                )}
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Location found! Coordinates: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-3">
              Document Upload
            </h3>
            
            <div>
              <FileUpload
                label="Upload Aadhaar (PDF/Image)"
                name="aadhaar"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setAadhaarFile(file);
                  if (file) {
                    autoExtractFromAadhaar(file);
                  }
                }}
              />
              {aadhaarFile && (
                <div className="mt-2">
                  <p className="text-sm text-green-600 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {aadhaarFile.name}
                  </p>
                  
                  {autoFillStatus.isExtracting && (
                    <p className="text-xs text-orange-600 mt-1">⏳ Extracting...</p>
                  )}
                  {autoFillStatus.isComplete && autoFillStatus.extractedFields.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">✓ Filled: {autoFillStatus.extractedFields.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.latitude}
            className="w-full mt-8 bg-gradient-to-r from-cf-orange-500 to-cf-orange-600 text-white py-4 rounded-xl font-semibold hover:from-cf-orange-600 hover:to-cf-orange-700 transition-all shadow-cf hover:shadow-large disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-cf"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Register as Needer
              </span>
            )}
          </button>

          {!formData.latitude && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 text-center font-medium flex items-center justify-center">
                <svg className="h-4 w-4 mr-2 text-cf-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Waiting for location detection...
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/needer-login" className="text-cf-orange-600 hover:text-cf-orange-700 font-semibold">
                Login as Needer
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NeederRegistration;
