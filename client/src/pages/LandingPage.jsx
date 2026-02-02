import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeartbeat, FaSearchLocation, FaUserFriends, FaHandHoldingHeart, FaMapMarkedAlt } from 'react-icons/fa';
import Footer from '../components/Footer';
import AnimatedCounter from '../components/AnimatedCounter';

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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2.5 rounded-xl shadow-lg group-hover:scale-105 transition-transform">
                <FaHeartbeat className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                RedBridge
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/about" className="text-slate-600 hover:text-red-600 font-medium transition-colors">About</Link>
              <Link to="/nearby" className="text-slate-600 hover:text-red-600 font-medium transition-colors">Find Centers</Link>
              <Link to="/matchmaking" className="text-slate-600 hover:text-red-600 font-medium transition-colors">Smart Match</Link>
              <div className="flex items-center space-x-4 pl-4 border-l border-slate-200">
                <Link to="/donor-login" className="text-slate-700 hover:text-red-600 font-semibold transition-colors">
                  Login
                </Link>
                <Link to="/donor-registration" className="bg-red-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-red-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                  Donate Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-orange-50 -z-10"></div>

        {/* Abstract Blooms */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-red-200/30 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-200/30 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-red-100 text-red-600 text-sm font-bold mb-6 tracking-wide">
              AI-POWERED BLOOD DONATION
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              Bridge the Gap, <br />
              <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">Save a Life.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect with compatible blood donors instantly using our AI-driven matching and smart location tracking.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => handleNavigate('/donor-registration')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white text-lg font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <FaHandHoldingHeart /> Become a Donor
            </button>
            <button
              onClick={() => handleNavigate('/needer-registration')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-800 border-2 border-slate-200 text-lg font-bold rounded-full hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-lg"
            >
              <FaSearchLocation /> Find a Donor
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {[
              { label: "Active Donors", value: 12500, suffix: "+" },
              { label: "Lives Saved", value: 4800, suffix: "+" },
              { label: "Cities Covered", value: 85, suffix: "" },
              { label: "Avg. Match Time", value: 5, suffix: "m" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-50 hover:border-red-100 transition-colors">
                <div className="text-3xl lg:text-4xl font-bold text-slate-900 mb-1">
                  <AnimatedCounter value={stat.value} />{stat.suffix}
                </div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose RedBridge?</h2>
            <p className="text-lg text-slate-600">Our smart technology ensures the fastest and safest blood donation process.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FaMapMarkedAlt className="w-8 h-8 text-white" />,
                title: "Location Intelligence",
                desc: "Real-time geolocation matching finds the nearest available donors to save critical time.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: <FaUserFriends className="w-8 h-8 text-white" />,
                title: "AI Verification",
                desc: "Automated Aadhaar and medical report verification ensures 100% genuine donor profiles.",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: <FaHeartbeat className="w-8 h-8 text-white" />,
                title: "Smart Scheduling",
                desc: "Efficient appointment booking system reduces waiting time for both donors and receivers.",
                color: "from-green-500 to-teal-500"
              }
            ].map((feature, idx) => (
              <motion.div
                whileHover={{ y: -10 }}
                key={idx}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">Simple Process, <br />Maximum Impact</h2>
              <p className="text-slate-400 mb-8 text-lg">
                We've streamlined the entire donation process to make saving lives as easy as ordering a cab.
              </p>

              <div className="space-y-8">
                {[
                  { step: "01", title: "Create Profile", desc: "Sign up as a donor or request blood in under 2 minutes." },
                  { step: "02", title: "Smart Match", desc: "Our AI algorithm finds the best compatible match nearby." },
                  { step: "03", title: "Connect & Save", desc: "Connect directly and complete the life-saving donation." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start">
                    <span className="text-5xl font-black text-slate-800 mr-6 -mt-2">{item.step}</span>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-full filter blur-[100px] opacity-20 animate-pulse-slow"></div>
              <div className="relative bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                        <FaHeartbeat />
                      </div>
                      <div>
                        <div className="font-semibold">Urgent Request</div>
                        <div className="text-xs text-slate-400">O+ Blood Needed • 2km Away</div>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-red-600 text-xs font-bold rounded-lg">Accept</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                        <FaUserFriends />
                      </div>
                      <div>
                        <div className="font-semibold">Match Found</div>
                        <div className="text-xs text-slate-400">Verify Identity</div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Consent Modal */}
      <AnimatePresence>
        {showConsent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <FaMapMarkedAlt className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-center text-slate-900 mb-3">Location & Data Consent</h3>
                <p className="text-center text-slate-600 mb-8">
                  To connect you with nearby donors, we need access to your location and basic profile data. Your privacy is our priority.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowConsent(false)}
                    className="py-3 px-6 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAcceptConsent}
                    className="py-3 px-6 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    I Agree
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default LandingPage;
