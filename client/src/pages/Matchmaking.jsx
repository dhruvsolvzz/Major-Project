import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Matchmaking = () => {
  const [donors, setDonors] = useState([]);
  const [needers, setNeeders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('needer'); // 'needer' or 'donor'
  const [radius, setRadius] = useState(20);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [donorsRes, needersRes] = await Promise.all([
        fetch('http://localhost:5000/api/donors'),
        fetch('http://localhost:5000/api/needers')
      ]);
      
      setDonors(await donorsRes.json() || []);
      setNeeders(await needersRes.json() || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const findMatches = async (id) => {
    try {
      const endpoint = mode === 'needer' 
        ? `http://localhost:5000/api/match/needer/${id}?maxDistance=${radius}`
        : `http://localhost:5000/api/match/donor/${id}?maxDistance=${radius}`;
      
      const res = await fetch(endpoint);
      const data = await res.json();
      
      setMatches(data.matches || []);
      setSelected(mode === 'needer' ? data.needer : data.donor);
    } catch (error) {
      console.error('Match error:', error);
      setMatches([]);
    }
  };

  useEffect(() => {
    if (selected) findMatches(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius]);

  const openMap = (coords) => {
    const [lng, lat] = coords;
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-do-blue-50 via-purple-50 to-cf-orange-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-do-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-slate-600 font-medium"
          >
            Loading...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const list = mode === 'needer' ? needers : donors;

  return (
    <div className="min-h-screen bg-gradient-to-br from-do-blue-50 via-purple-50 to-cf-orange-50">
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-do-blue-500 to-cf-orange-500 p-2 rounded-lg shadow-do"
            >
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
              </svg>
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-do-blue-600 to-cf-orange-600 bg-clip-text text-transparent">
              RedBridge
            </span>
          </Link>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-4xl font-bold bg-gradient-to-r from-do-blue-600 via-purple-600 to-cf-orange-600 bg-clip-text text-transparent mb-4">🤝 Matchmaking</h2>
          
          <div className="flex flex-wrap gap-3 items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setMode('needer'); setMatches([]); setSelected(null); }}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                mode === 'needer' 
                  ? 'bg-gradient-to-r from-cf-orange-500 to-cf-orange-600 text-white shadow-cf' 
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-cf-orange-300'
              }`}
            >
              🩸 Find Donors
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setMode('donor'); setMatches([]); setSelected(null); }}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                mode === 'donor' 
                  ? 'bg-gradient-to-r from-do-blue-500 to-do-blue-600 text-white shadow-do' 
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-do-blue-300'
              }`}
            >
              ❤️ Find Needers
            </motion.button>

            <div className="flex-1 min-w-[250px] flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">
                Radius: {radius} km
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border p-5">
              <h3 className="text-lg font-bold mb-4">
                {mode === 'needer' ? 'Needers' : 'Donors'}
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {list.length === 0 ? (
                  <p className="text-slate-500 text-center py-8 text-sm">No {mode === 'needer' ? 'needers' : 'donors'} yet</p>
                ) : (
                  list.map((person) => (
                    <button
                      key={person._id}
                      onClick={() => findMatches(person._id)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selected?.id === person._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-semibold text-sm">{person.name}</div>
                      <div className="text-xs text-slate-600">
                        {mode === 'needer' ? `Needs: ${person.requiredBloodGroup}` : person.bloodGroup}
                      </div>
                      {mode === 'needer' && (
                        <div className={`text-xs mt-1 font-medium ${
                          person.urgency === 'Critical' ? 'text-red-600' :
                          person.urgency === 'High' ? 'text-orange-600' : 'text-yellow-600'
                        }`}>
                          {person.urgency}
                        </div>
                      )}
                      {mode === 'donor' && (
                        <div className="text-xs text-slate-500">{person.age}y, {person.gender}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!selected ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🤝</div>
                <h3 className="text-2xl font-bold mb-2">
                  Select a {mode === 'needer' ? 'Needer' : 'Donor'}
                </h3>
                <p className="text-slate-600">
                  Choose from the list to find compatible {mode === 'needer' ? 'donors' : 'needers'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4">
                    Matches for {selected.name}
                    {mode === 'needer' ? ` (Needs: ${selected.requiredBloodGroup})` : ` (Has: ${selected.bloodGroup})`}
                  </h3>
                  
                  {matches.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      No compatible {mode === 'needer' ? 'donors' : 'needers'} within {radius} km
                      <p className="text-sm mt-2">Try increasing the radius</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {matches.map((match, i) => {
                        const person = mode === 'needer' ? match.donor : match.needer;
                        return (
                          <div key={person.id} className="border-2 rounded-lg p-4 hover:border-blue-300 transition">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="text-lg font-bold">#{i + 1} {person.name}</h4>
                                <p className="text-sm text-slate-600">
                                  {mode === 'needer' 
                                    ? `${person.bloodGroup} • ${match.distance} km`
                                    : `Needs ${person.requiredBloodGroup} • ${match.distance} km • ${person.urgency}`
                                  }
                                </p>
                              </div>
                              {match.matchScore && (
                                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                  {match.matchScore.toFixed(0)}%
                                </div>
                              )}
                            </div>
                            
                            <div className="text-sm mb-3">
                              <p className="text-slate-600">📞 {person.phone}</p>
                              <p className="text-slate-600">📍 {person.address}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <a 
                                href={`tel:${person.phone}`}
                                className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-center text-sm font-semibold"
                              >
                                📞 Call
                              </a>
                              <button 
                                onClick={() => openMap(person.location.coordinates)}
                                className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold"
                              >
                                🗺️ Map
                              </button>
                            </div>
                            {person.bloodReportFile && (
                              <button
                                onClick={() => window.open(`http://localhost:5000/api/${mode === 'needer' ? 'donors' : 'needers'}/blood-report/${person.id}`, '_blank')}
                                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 text-sm font-semibold flex items-center justify-center"
                              >
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View Blood Report
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matchmaking;
