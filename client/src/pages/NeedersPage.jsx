import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NeedersPage = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/donors');
      const data = await res.json();
      setDonors(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const filteredDonors = filter === 'all' ? donors : donors.filter(d => d.bloodGroup === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative">
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
      <nav className="bg-white/90 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-blue-500/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 360 }}
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
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                RedBridge
              </span>
            </Link>
            <Link to="/needer-registration">
              <motion.button
                whileHover={{ 
                  scale: 1.05, 
                  y: -2,
                  boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.5)" 
                }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-xl shadow-blue-500/30 transition-all duration-200"
              >
                + Register as Needer
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200/50 rounded-full mb-6 shadow-lg shadow-blue-500/10"
          >
            <motion.svg
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity
              }}
              className="h-5 w-5 text-red-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </motion.svg>
            <span className="text-sm font-semibold bg-gradient-to-r from-red-700 to-pink-700 bg-clip-text text-transparent">
              Find Your Life-Saving Match
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold mb-4"
          >
            <span className="bg-gradient-to-r from-red-600 via-rose-500 to-pink-600 bg-clip-text text-transparent">
              Available Blood Donors
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-slate-600"
          >
            <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{donors.length}</span> generous donors ready to help you
          </motion.p>
        </motion.div>

        {/* Blood Group Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h3 className="text-center text-lg font-semibold text-slate-700 mb-4">Filter by Blood Group</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-blue-500/30'
                  : 'bg-white text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-2 border-slate-200'
              }`}
            >
              All ({donors.length})
            </motion.button>
            {bloodGroups.map((bg, idx) => (
              <motion.button
                key={bg}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + idx * 0.05 }}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(bg)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                  filter === bg
                    ? 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white shadow-red-500/30'
                    : 'bg-white text-slate-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 border-2 border-slate-200'
                }`}
              >
                {bg} ({donors.filter(d => d.bloodGroup === bg).length})
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Donors Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mb-4"
            />
            <p className="text-slate-600 font-medium">Loading donors...</p>
          </div>
        ) : filteredDonors.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-slate-200"
          >
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🩸
            </motion.div>
            <p className="text-xl font-semibold text-slate-700 mb-2">No donors found</p>
            <p className="text-slate-600">Try selecting a different blood group</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDonors.map((donor, index) => (
              <motion.div
                key={donor._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.02,
                  boxShadow: "0 25px 50px -12px rgba(239, 68, 68, 0.25)"
                }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all p-6 border-2 border-slate-200 hover:border-red-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{donor.name}</h3>
                    <p className="text-sm text-slate-600 flex items-center mt-1">
                      <svg className="h-4 w-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {donor.age} years, {donor.gender}
                    </p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 text-white px-4 py-2 rounded-xl font-bold text-lg shadow-xl shadow-red-500/30"
                  >
                    {donor.bloodGroup}
                  </motion.div>
                </div>

                <div className="space-y-3 text-sm text-slate-600 mb-4">
                  <div className="flex items-center bg-blue-50 p-3 rounded-lg">
                    <svg className="h-5 w-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="font-medium">{donor.phone}</span>
                  </div>
                  <div className="flex items-start bg-purple-50 p-3 rounded-lg">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="line-clamp-2">{donor.address}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <motion.a
                    href={`tel:${donor.phone}`}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 20px 40px -10px rgba(239, 68, 68, 0.5)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center shadow-xl shadow-red-500/30 transition-all"
                  >
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Call Donor Now
                  </motion.a>
                  {donor.bloodReportFile && (
                    <motion.button
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: "0 20px 40px -10px rgba(147, 51, 234, 0.5)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(`http://localhost:5000/api/donors/blood-report/${donor._id}`, '_blank')}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center shadow-xl shadow-purple-500/30 transition-all"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Blood Report
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NeedersPage;
