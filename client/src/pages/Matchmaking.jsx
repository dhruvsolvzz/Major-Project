import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaHandHoldingHeart, FaSearch, FaFilter, FaMapMarkerAlt, FaPhoneAlt, FaUser, FaSortAmountDown, FaFileAlt } from 'react-icons/fa';
import { LogoIcon } from '../components/Icons';

const Matchmaking = () => {
  const [donors, setDonors] = useState([]);
  const [needers, setNeeders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('needer'); // 'needer' (Find Donors) or 'donor' (Find Needers)
  const [radius, setRadius] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('distance'); // 'distance' or 'score'

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

      const sortedMatches = (data.matches || []).sort((a, b) => {
        if (sortBy === 'score') {
          return (b.matchScore || 0) - (a.matchScore || 0);
        }
        return a.distance - b.distance;
      });

      setMatches(sortedMatches);
      // Update selected with full details from response if needed, 
      // but usually we want to keep the selected item from the list to avoid flicker
      // setSelected(mode === 'needer' ? data.needer : data.donor);
    } catch (error) {
      console.error('Match error:', error);
      setMatches([]);
    }
  };

  // Re-fetch matches when settings change if a person is selected
  useEffect(() => {
    if (selected) {
      findMatches(selected._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, sortBy]);

  const openMap = (coords) => {
    const [lng, lat] = coords;
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto animate-spin" />
          <p className="text-slate-600 font-medium">Loading network...</p>
        </div>
      </div>
    );
  }

  const list = mode === 'needer' ? needers : donors;
  const filteredList = list.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 h-16 flex-none">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <LogoIcon className="h-8 w-8 text-red-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">Smart Match</span>
          </Link>
          <div className="flex gap-2 text-sm font-semibold text-slate-500">
            <Link to="/nearby" className="hover:text-red-600 transition-colors">Nearby Finder</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">

        {/* Header & Settings Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 transform transition-all hover:shadow-md">
          <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">

            {/* Title & Mode Switcher */}
            <div className="flex flex-col gap-4 w-full lg:w-auto">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <FaFilter className="text-red-500" /> Match Settings
                </h1>
                <p className="text-slate-500 text-sm">Configure your search matching criteria</p>
              </div>

              <div className="flex bg-slate-100 p-1.5 rounded-xl self-start">
                <button
                  onClick={() => { setMode('needer'); setSelected(null); setMatches([]); }}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode === 'needer' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <FaHeart /> Find Donors
                </button>
                <button
                  onClick={() => { setMode('donor'); setSelected(null); setMatches([]); }}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode === 'donor' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <FaHandHoldingHeart /> Find Needers
                </button>
              </div>
            </div>

            {/* Radius & Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto items-center">

              {/* Radius Slider */}
              <div className="w-full sm:w-64">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-slate-700">Search Radius</label>
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{radius} km</span>
                </div>
                <input
                  type="range" min="5" max="100" step="5"
                  value={radius} onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 uppercase">
                  <span>Nearby</span>
                  <span>City Wide</span>
                </div>
              </div>

              {/* Sort Toggle */}
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <span className="text-sm font-bold text-slate-700">Sort Priority</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy('distance')}
                    className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${sortBy === 'distance'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    Distance
                  </button>
                  <button
                    onClick={() => setSortBy('score')}
                    className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${sortBy === 'score'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    Compatibility
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Main Content Areas */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Sidebar List (Left) */}
          <div className="lg:col-span-4 flex flex-col gap-4 h-[800px]">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sticky top-24 flex flex-col h-full">
              <div className="relative mb-4">
                <FaSearch className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${mode === 'needer' ? 'Needers' : 'Donors'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {filteredList.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p>No results found</p>
                  </div>
                ) : (
                  filteredList.map(person => (
                    <motion.div
                      layoutId={person._id}
                      key={person._id}
                      onClick={() => setSelected(person)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selected?._id === person._id
                          ? 'border-red-500 bg-red-50 shadow-md ring-1 ring-red-500'
                          : 'border-slate-100 hover:border-red-200 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-900">{person.name}</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase mt-1">
                            {mode === 'needer' ? `Needs ${person.requiredBloodGroup}` : `Group ${person.bloodGroup}`}
                          </p>
                        </div>
                        {mode === 'needer' && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${person.urgency === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {person.urgency}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <FaMapMarkerAlt />
                        <span className="truncate">{person.address || 'Location hidden'}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Results Area (Right) */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!selected ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center h-[500px] flex flex-col items-center justify-center border-dashed border-2"
                >
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-4xl">
                    👈
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Select a Profile</h2>
                  <p className="text-slate-500 max-w-md">
                    Select a {mode === 'needer' ? 'Needer' : 'Donor'} from the list to instantly calculate the best matches based on your {sortBy} priority.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Selected Profile Summary */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold">{selected.name}</h2>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                          Selected
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm flex items-center gap-2">
                        <FaMapMarkerAlt /> {selected.address}
                      </p>
                      <div className="flex gap-3 mt-4">
                        <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-md">
                          <span className="block text-[10px] text-slate-400 uppercase font-bold">Blood Group</span>
                          <span className="font-bold text-lg text-red-400">
                            {mode === 'needer' ? selected.requiredBloodGroup : selected.bloodGroup}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center sm:text-right bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md min-w-[140px]">
                      <span className="block text-3xl font-bold text-white">{matches.length}</span>
                      <span className="text-xs text-slate-400 font-bold uppercase">Compatible Matches</span>
                    </div>
                  </div>

                  {/* Match Results */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {matches.length === 0 ? (
                      <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200">
                        <p className="text-slate-500 font-bold text-lg">No compatible matches found within {radius}km.</p>
                        <p className="text-sm text-slate-400 mt-2">Try increasing the search radius.</p>
                      </div>
                    ) : (
                      matches.map((match, idx) => {
                        const person = mode === 'needer' ? match.donor : match.needer;
                        const score = match.matchScore || 0;

                        return (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            key={person._id}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden group"
                          >
                            <div className={`absolute top-0 left-0 w-1 h-full ${score > 80 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>

                            <div className="flex justify-between items-start mb-4 pl-3">
                              <div>
                                <h3 className="font-bold text-lg text-slate-900">{person.name}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">
                                  {mode === 'needer' ? 'Donor' : 'Needer'} • {person.age} YRS
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`block text-lg font-bold ${sortBy === 'score' ? 'text-green-600' : 'text-slate-900'
                                  }`}>
                                  {score.toFixed(0)}%
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Match</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4 pl-3">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Distance</span>
                                <span className={`text-sm font-bold ${sortBy === 'distance' ? 'text-blue-600' : 'text-slate-700'
                                  }`}>
                                  {match.distance} km
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Group</span>
                                <span className="text-sm font-bold text-red-600">
                                  {person.bloodGroup || person.requiredBloodGroup}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 pl-3">
                              <button
                                onClick={() => openMap(person.location.coordinates)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                              >
                                <FaMapMarkerAlt /> Map
                              </button>
                              <a
                                href={`tel:${person.phone}`}
                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                              >
                                <FaPhoneAlt /> Call
                              </a>
                              {person.bloodReportFile && (
                                <button
                                  onClick={() => window.open(`http://localhost:5000/api/${mode === 'needer' ? 'donors' : 'needers'}/blood-report/${person._id}`, '_blank')}
                                  title="View Report"
                                  className="w-10 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg flex items-center justify-center"
                                >
                                  <FaFileAlt />
                                </button>
                              )}
                            </div>

                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matchmaking;
