import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-orange-400/30 to-pink-400/30 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/90 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-blue-500/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.1 }}
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(239, 68, 68, 0.3)",
                    "0 0 30px rgba(239, 68, 68, 0.5)",
                    "0 0 20px rgba(239, 68, 68, 0.3)"
                  ]
                }}
                transition={{ 
                  rotate: { duration: 0.5 },
                  boxShadow: { duration: 2, repeat: Infinity }
                }}
                className="bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 p-2.5 rounded-xl shadow-lg"
              >
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </motion.div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                RedBridge
              </h1>
            </motion.div>
            <nav className="flex space-x-2">
              <div className="relative group">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-slate-700 hover:text-slate-900 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-slate-300 flex items-center"
                >
                  Login
                  <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </motion.button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link 
                    to="/donor-login"
                    className="block px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 rounded-t-lg transition-colors"
                  >
                    <svg className="inline h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    Donor Login
                  </Link>
                  <Link 
                    to="/needer-login"
                    className="block px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 rounded-b-lg transition-colors"
                  >
                    <svg className="inline h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Needer Login
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200/50 rounded-full mb-8 shadow-lg shadow-blue-500/10"
            >
            <motion.svg 
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity }
              }}
              className="h-4 w-4 text-blue-600 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </motion.svg>
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">AI-Powered Blood Matching Platform</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold text-slate-900 sm:text-6xl md:text-7xl leading-[1.1] mb-6"
          >
            <span className="block mb-3">Save Lives Through</span>
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{ 
                opacity: { delay: 0.5 },
                y: { delay: 0.5 },
                backgroundPosition: { duration: 5, repeat: Infinity, ease: "linear" }
              }}
              className="block bg-gradient-to-r from-red-600 via-rose-500 to-pink-600 bg-clip-text text-transparent bg-[length:200%_auto]"
            >
              Blood Donation
            </motion.span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 max-w-3xl mx-auto text-xl text-slate-600 leading-relaxed"
          >
            Connect blood donors with those in need <span className="font-semibold text-slate-900">instantly</span>. Our intelligent matching system uses OCR technology 
            to verify documents and find the perfect match based on location and blood type compatibility.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-12 flex justify-center gap-4 flex-wrap"
          >
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                y: -5,
                boxShadow: "0 25px 50px -12px rgba(239, 68, 68, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate('/donor-registration')}
              className="group inline-flex items-center px-8 py-4 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:from-red-600 hover:via-rose-600 hover:to-pink-600 shadow-xl shadow-red-500/30 transition-all duration-200"
            >
              <motion.svg 
                whileHover={{ scale: 1.3, rotate: 10 }}
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  scale: { duration: 2, repeat: Infinity }
                }}
                className="mr-2 h-5 w-5" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </motion.svg>
              Register as Donor
            </motion.button>
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                y: -5,
                boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate('/needer-registration')}
              className="group inline-flex items-center px-8 py-4 text-base font-semibold rounded-xl text-blue-600 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-2 border-blue-300 hover:border-blue-400 shadow-xl shadow-blue-500/20 transition-all duration-200"
            >
              <motion.svg 
                whileHover={{ scale: 1.3, x: 5 }}
                className="mr-2 h-5 w-5" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </motion.svg>
              Find Blood Donor
            </motion.button>
          </motion.div>

          {/* Quick Access Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mt-8 flex justify-center gap-4 flex-wrap"
          >
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                y: -3,
                boxShadow: "0 15px 30px -10px rgba(59, 130, 246, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate('/nearby')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/20 text-sm"
            >
              <motion.svg 
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ duration: 0.6 }}
                className="mr-2 h-4 w-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </motion.svg>
              Find Nearby Donors
            </motion.button>
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                y: -3,
                boxShadow: "0 15px 30px -10px rgba(249, 115, 22, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate('/match')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/20 text-sm"
            >
              <motion.svg 
                whileHover={{ scale: 1.2, rotate: 15 }}
                className="mr-2 h-4 w-4" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </motion.svg>
              Smart Matchmaking
            </motion.button>
          </motion.div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />,
              gradient: "from-blue-500 via-indigo-500 to-purple-500",
              border: "hover:border-blue-400",
              bgHover: "group-hover:from-blue-50 group-hover:to-indigo-50",
              title: "Smart Matching",
              desc: "AI-powered algorithm matches donors with recipients based on blood type compatibility and location.",
              delay: 0.1
            },
            {
              icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></>,
              gradient: "from-emerald-500 via-teal-500 to-cyan-500",
              border: "hover:border-emerald-400",
              bgHover: "group-hover:from-emerald-50 group-hover:to-teal-50",
              title: "Location-Based",
              desc: "Find donors within your area using geospatial search up to 300km radius.",
              delay: 0.2,
              stroke: true
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
              gradient: "from-orange-500 via-amber-500 to-yellow-500",
              border: "hover:border-orange-400",
              bgHover: "group-hover:from-orange-50 group-hover:to-amber-50",
              title: "OCR Verification",
              desc: "Automated document verification using OCR for blood reports and Aadhaar cards.",
              delay: 0.3,
              stroke: true
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
              gradient: "from-red-500 via-rose-500 to-pink-500",
              border: "hover:border-red-400",
              bgHover: "group-hover:from-red-50 group-hover:to-rose-50",
              title: "Instant Connect",
              desc: "Connect with verified donors in real-time and save lives when every second counts.",
              delay: 0.4,
              stroke: true
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + feature.delay }}
              whileHover={{ 
                y: -15, 
                scale: 1.03,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
              }}
              className={`group bg-white ${feature.bgHover} p-8 rounded-2xl border-2 border-slate-200 ${feature.border} shadow-xl hover:shadow-2xl transition-all duration-300`}
            >
              <motion.div 
                whileHover={{ 
                  rotate: [0, -10, 10, -10, 0], 
                  scale: 1.15,
                  y: -5
                }}
                transition={{ duration: 0.5 }}
                className={`flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-5 shadow-xl`}
              >
                <svg className="h-8 w-8" fill={feature.stroke ? "none" : "currentColor"} stroke={feature.stroke ? "currentColor" : "none"} viewBox="0 0 24 24">
                  {feature.icon}
                </svg>
              </motion.div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-slate-800 transition-colors">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
                {feature.desc}
              </p>
            </motion.div>
          ))}
          </div>
        </div>

        {/* Technology Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-12 md:p-16 border border-slate-700/50 shadow-2xl relative overflow-hidden"
          >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-5">
            <motion.div
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
              className="w-full h-full"
              style={{
                backgroundImage: "radial-gradient(circle, white 2px, transparent 2px)",
                backgroundSize: "60px 60px"
              }}
            />
          </div>

          {/* Header */}
          <div className="text-center mb-16 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6"
            >
              <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-semibold text-blue-300">Smart Technology</span>
            </motion.div>
            
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-4 text-white"
            >
              How It Works
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-400 max-w-2xl mx-auto"
            >
              Simply upload your documents and let our smart system do the rest. No typing needed!
            </motion.p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {[
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
                gradient: "from-blue-500 to-cyan-500",
                bgGradient: "from-blue-500/10 to-cyan-500/10",
                title: "Upload Any Document",
                desc: "Take a photo or upload your blood report in any format - PDF, JPG, PNG, or even from your phone camera. We accept them all!",
                features: ["Photos from phone", "Scanned documents", "Any file type works"],
                delay: 0.1
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
                gradient: "from-purple-500 to-pink-500",
                bgGradient: "from-purple-500/10 to-pink-500/10",
                title: "We Read It For You",
                desc: "Our smart system automatically reads your blood group from the report. No need to type anything - we extract all the information you need!",
                features: ["Automatic reading", "No typing needed", "Super accurate"],
                delay: 0.2
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
                gradient: "from-orange-500 to-red-500",
                bgGradient: "from-orange-500/10 to-red-500/10",
                title: "Safe & Secure",
                desc: "We verify your Aadhaar card to make sure you're real and keep your information completely safe and private. Your data is protected!",
                features: ["Identity check", "Privacy protected", "Secure storage"],
                delay: 0.3
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: item.delay }}
                whileHover={{ y: -8 }}
                className={`bg-gradient-to-br ${item.bgGradient} backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 group`}
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg`}
                >
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {item.icon}
                  </svg>
                </motion.div>
                
                <h4 className="font-bold mb-3 text-white text-xl group-hover:text-blue-300 transition-colors">
                  {item.title}
                </h4>
                
                <p className="text-slate-400 leading-relaxed mb-4 text-sm">
                  {item.desc}
                </p>
                
                <ul className="space-y-2">
                  {item.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center text-xs text-slate-500">
                      <svg className="h-4 w-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 grid grid-cols-3 gap-8 relative z-10"
          >
            {[
              { value: "99%", label: "Accurate" },
              { value: "2 sec", label: "Super Fast" },
              { value: "24/7", label: "Always Ready" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
        </div>

      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-t-2 border-purple-500/30 mt-32 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <motion.div 
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-center space-x-3 mb-4"
          >
            <motion.div 
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(239, 68, 68, 0.5)",
                  "0 0 40px rgba(239, 68, 68, 0.7)",
                  "0 0 20px rgba(239, 68, 68, 0.5)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 p-2.5 rounded-xl shadow-2xl"
            >
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-red-400 via-rose-400 to-pink-400 bg-clip-text text-transparent">
              RedBridge
            </span>
          </motion.div>
          <p className="text-center text-slate-400 text-sm">
            © 2024 RedBridge. Saving lives through technology.
          </p>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center gap-6 mt-6"
          >
            {['Privacy', 'Terms', 'Contact'].map((item, idx) => (
              <motion.a
                key={idx}
                whileHover={{ scale: 1.1, color: "#f472b6" }}
                href="#"
                className="text-slate-400 hover:text-pink-400 text-sm transition-colors"
              >
                {item}
              </motion.a>
            ))}
          </motion.div>
        </div>
      </motion.footer>

      {/* Consent Modal */}
      <AnimatePresence>
        {showConsent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Consent & Terms of Use</h2>
              <p className="text-sm mt-2 opacity-90">Please read and accept to continue</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <p className="text-sm text-orange-800">
                  <strong>Important:</strong> By using RedBridge, you agree to share your personal information for blood donation matching purposes.
                </p>
              </div>

              <div className="space-y-3 text-sm text-slate-700">
                <h3 className="font-bold text-lg text-slate-800">I understand and agree that:</h3>
                
                <div className="space-y-2">
                  {[
                    'My personal information (name, age, gender, phone, address) will be visible to matched donors/needers',
                    'My Aadhaar number will be used for verification and the last 4 digits may be displayed',
                    'My blood group information will be extracted from uploaded documents using OCR technology',
                    'My location will be used to find nearby donors/needers within a 300 km radius',
                    'Uploaded documents (Aadhaar, Blood Report) will be stored securely for verification purposes',
                    'I am voluntarily providing this information to help save lives through blood donation',
                    'I am medically fit to donate blood (for donors) or genuinely need blood (for needers)',
                    'All information provided by me is accurate and truthful'
                  ].map((text, idx) => (
                    <label key={idx} className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      <span>{text}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4 rounded-r-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Data Privacy & Security</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Your data is stored securely in encrypted databases</li>
                  <li>• Only matched users can see your contact information</li>
                  <li>• You can request data deletion at any time</li>
                  <li>• We do not share your data with third parties</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4 rounded-r-lg">
                <h4 className="font-semibold text-red-800 mb-2">⚠️ Disclaimer</h4>
                <p className="text-sm text-red-700">
                  RedBridge is a matching platform only. We do not verify medical fitness, conduct blood tests, or facilitate actual blood donation. 
                  Always consult with medical professionals and authorized blood banks for actual blood donation/transfusion.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-b-2xl flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeclineConsent}
                className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition"
              >
                Decline
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(239, 68, 68, 0.5)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAcceptConsent}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:from-red-600 hover:via-rose-600 hover:to-pink-600 transition shadow-xl shadow-red-500/30"
              >
                I Accept & Continue
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
