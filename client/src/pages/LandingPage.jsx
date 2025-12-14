import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showConsent, setShowConsent] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [targetRoute, setTargetRoute] = useState('');

  useEffect(() => {
    const consent = sessionStorage.getItem('redbridge_consent');
    if (consent === 'accepted') {
      setConsentAccepted(true);
    }
  }, []);

  const handleNavigate = (route) => {
    if (consentAccepted) {
      navigate(route);
    } else {
      setTargetRoute(route);
      setShowConsent(true);
    }
  };

  const handleAcceptConsent = () => {
    sessionStorage.setItem('redbridge_consent', 'accepted');
    setConsentAccepted(true);
    setShowConsent(false);
    if (targetRoute) {
      navigate(targetRoute);
    }
  };

  const handleDeclineConsent = () => {
    setShowConsent(false);
    setTargetRoute('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2 rounded-xl">
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                RedBridge
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/donor-login" className="text-gray-600 hover:text-red-600 font-medium">
                Donor Login
              </Link>
              <Link to="/needer-login" className="text-gray-600 hover:text-orange-600 font-medium">
                Needer Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Connect <span className="text-red-600">Blood Donors</span> with{' '}
            <span className="text-orange-600">Those in Need</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            RedBridge uses AI-powered verification and location-based matching to connect 
            verified blood donors with people who need blood urgently.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Donor Card */}
          <div 
            onClick={() => handleNavigate('/donor-registration')}
            className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 border-2 border-transparent hover:border-red-200"
          >
            <div className="bg-red-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Become a Donor</h2>
            <p className="text-gray-600 mb-4">
              Register as a blood donor and help save lives. Your donation can make a difference.
            </p>
            <div className="flex items-center text-red-600 font-medium">
              Register Now
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>

          {/* Needer Card */}
          <div 
            onClick={() => handleNavigate('/needer-registration')}
            className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 border-2 border-transparent hover:border-orange-200"
          >
            <div className="bg-orange-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Need Blood</h2>
            <p className="text-gray-600 mb-4">
              Find verified blood donors near you quickly. Get matched with compatible donors.
            </p>
            <div className="flex items-center text-orange-600 font-medium">
              Find Donors
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tools Section */}
        <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Matchmaking Card */}
          <div 
            onClick={() => handleNavigate('/match')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-blue-200"
          >
            <div className="bg-blue-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Smart Matchmaking</h2>
            <p className="text-gray-600 mb-4">
              Find compatible blood donors based on blood group and medical history matching.
            </p>
            <div className="flex items-center text-blue-700 font-medium">
              Start Matching
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>

          {/* Nearby Finder Card */}
          <div 
            onClick={() => handleNavigate('/nearby')}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-green-200"
          >
            <div className="bg-green-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19.5A9.5 9.5 0 1 0 9 .5a9.5 9.5 0 0 0 0 19zM9 3.75v4.5m0 6.75v4.5M5.25 9H.75m18 0h-4.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Nearby Donors</h2>
            <p className="text-gray-600 mb-4">
              Discover blood donors in your vicinity with interactive map and location filters.
            </p>
            <div className="flex items-center text-green-700 font-medium">
              Find Nearby
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Verification</h3>
            <p className="text-gray-600">Aadhaar & blood report verified using AI</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Based</h3>
            <p className="text-gray-600">Find donors within your area instantly</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="h-7 w-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Matching</h3>
            <p className="text-gray-600">Blood group compatibility matching</p>
          </div>
        </div>
      </div>

      {/* Data Consent Modal - Enhanced */}
      {showConsent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header with accent */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 px-8 py-6">
              <div className="flex items-start space-x-4">
                <div className="bg-red-100 p-3 rounded-xl">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Data Privacy & Security</h2>
                  <p className="text-sm text-gray-600 mt-1">Your trust is our priority</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8 space-y-6">
              
              {/* Main message */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-gray-800 font-medium">
                  ✓ To provide the best blood donation matching service, we need your consent to collect and securely process your personal data.
                </p>
              </div>

              {/* Data collection details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Data We Collect & Why</h3>
                
                <div className="space-y-3">
                  {/* Aadhaar */}
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Aadhaar Information</p>
                      <p className="text-sm text-gray-600">Name, age, DOB, gender → Verify your identity & eligibility</p>
                    </div>
                  </div>

                  {/* Blood Group */}
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Blood Report Data</p>
                      <p className="text-sm text-gray-600">Blood group, test results → Find compatible matches</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Location Data</p>
                      <p className="text-sm text-gray-600">Your coordinates → Find nearby donors/needers</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security assurance */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium text-green-900">Your data is encrypted & protected</p>
                </div>
                <p className="text-xs text-green-700 ml-7">We follow HIPAA compliance & never sell your data to third parties</p>
              </div>

              {/* Legal text */}
              <p className="text-xs text-gray-500 leading-relaxed">
                By clicking "Accept & Continue", you agree to our <a href="#" className="text-red-600 hover:underline">Privacy Policy</a> and <a href="#" className="text-red-600 hover:underline">Terms of Service</a>. 
                You can update your preferences anytime in settings.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-8 py-6 flex space-x-4 border-t">
              <button
                onClick={handleDeclineConsent}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-all"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptConsent}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:shadow-lg hover:from-red-700 hover:to-red-800 transition-all flex items-center justify-center space-x-2"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Accept & Continue</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
