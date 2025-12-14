import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Matchmaking = () => {
  const [donors, setDonors] = useState([]);
  const [needers, setNeeders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('needer'); // 'needer' or 'donor'
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
      setSelected(mode === 'needer' ? data.needer : data.donor);
    } catch (error) {
      console.error('Match error:', error);
      setMatches([]);
    }
  };

  useEffect(() => {
    if (selected) findMatches(selected._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, sortBy]);

  const openMap = (coords) => {
    const [lng, lat] = coords;
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto animate-spin" />
          <p className="text-slate-600 font-medium">Finding matches...</p>
        </div>
      </div>
    );
  }

  const list = mode === 'needer' ? needers : donors;
  const filteredList = list.filter(person => 
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50">
      {/* Header */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2 rounded-xl">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">RedBridge</span>
            </Link>
            <button onClick={() => window.location.href = '/'} className="text-slate-600 hover:text-slate-900 font-medium">← Back</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 via-purple-600 to-orange-600 bg-clip-text text-transparent mb-2">
            🤝 Smart Matchmaking
          </h1>
          <p className="text-lg text-slate-600">Find the perfect match for blood donation based on compatibility & proximity</p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Mode Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setMode('needer'); setMatches([]); setSelected(null); setSearchTerm(''); }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                  mode === 'needer' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.5 1.5H5.75A2.75 2.75 0 003 4.25v11.5A2.75 2.75 0 005.75 18.5h8.5A2.75 2.75 0 0117 15.75V10M10.5 1.5v4M10.5 1.5H14.75"/>
                </svg>
                <span>🩸 Find Donors</span>
              </button>
              <button
                onClick={() => { setMode('donor'); setMatches([]); setSelected(null); setSearchTerm(''); }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                  mode === 'donor' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span>❤️ Find Needers</span>
              </button>
            </div>

            {/* Radius Slider */}
            <div className="flex-1 min-w-[300px]">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700">Search Radius</label>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">{radius} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-blue-200 to-orange-200 rounded-lg cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>5 km</span>
                  <span>100 km</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sort Option */}
          {matches.length > 0 && (
            <div className="flex items-center gap-3 pt-2 border-t">
              <span className="text-sm font-medium text-slate-700">Sort by:</span>
              <button
                onClick={() => setSortBy('distance')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  sortBy === 'distance'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📍 Distance
              </button>
              <button
                onClick={() => setSortBy('score')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  sortBy === 'score'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ⭐ Match Score
              </button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col h-[700px]">
              {/* Search Bar */}
              <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-blue-50">
                <input
                  type="text"
                  placeholder={`Search ${mode === 'needer' ? 'needers' : 'donors'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                />
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto">
                {filteredList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <div className="text-3xl mb-2">😔</div>
                    <p className="font-medium">No {mode === 'needer' ? 'needers' : 'donors'} found</p>
                    <p className="text-sm mt-1">Try adjusting your search</p>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {filteredList.map((person) => (
                      <button
                        key={person._id}
                        onClick={() => findMatches(person._id)}
                        className={`w-full text-left p-4 rounded-xl transition-all border-2 ${
                          selected?._id === person._id 
                            ? 'border-red-500 bg-red-50 shadow-md' 
                            : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900">{person.name}</h4>
                            <p className="text-xs text-slate-600 mt-1">
                              {mode === 'needer' 
                                ? `Needs: ${person.requiredBloodGroup}` 
                                : `Has: ${person.bloodGroup}`
                              }
                            </p>
                          </div>
                          {mode === 'needer' && (
                            <div className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                              person.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                              person.urgency === 'High' ? 'bg-orange-100 text-orange-700' : 
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {person.urgency}
                            </div>
                          )}
                        </div>
                        {mode === 'donor' && (
                          <p className="text-xs text-slate-500 mt-2">👤 {person.age}y, {person.gender}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Content - Matches */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center h-[700px] flex flex-col items-center justify-center">
                <div className="text-6xl mb-6">🔍</div>
                <h3 className="text-3xl font-bold text-slate-900 mb-3">
                  Select a {mode === 'needer' ? 'Needer' : 'Donor'}
                </h3>
                <p className="text-lg text-slate-600 max-w-sm">
                  Choose from the list on the left to find compatible {mode === 'needer' ? 'donors' : 'needers'} in your area
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selected Person Card */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-md p-6 border border-red-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{selected.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {mode === 'needer' ? `Needs: ${selected.requiredBloodGroup}` : `Has: ${selected.bloodGroup}`}
                        </span>
                        {mode === 'needer' && (
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            selected.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                            selected.urgency === 'High' ? 'bg-orange-100 text-orange-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {selected.urgency} Priority
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">📍 {selected.address?.substring(0, 30)}...</p>
                      <p className="text-sm text-slate-600 mt-1">📞 {selected.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Matches */}
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-4 flex items-center space-x-2">
                    <span>✨ Compatible Matches</span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">{matches.length}</span>
                  </h4>

                  {matches.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                      <div className="text-4xl mb-4">🔍</div>
                      <p className="text-slate-600 font-medium mb-2">No compatible matches found</p>
                      <p className="text-slate-500 text-sm">Try increasing the search radius</p>
                      <div className="mt-6">
                        <input
                          type="range"
                          min="5"
                          max="100"
                          step="5"
                          value={radius}
                          onChange={(e) => setRadius(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <p className="text-sm text-slate-500 mt-2">Current: {radius} km</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      {matches.map((match, i) => {
                        const person = mode === 'needer' ? match.donor : match.needer;
                        const matchScore = match.matchScore || 0;
                        const scoreColor = matchScore >= 80 ? 'green' : matchScore >= 60 ? 'yellow' : 'orange';
                        
                        return (
                          <div 
                            key={person._id} 
                            className="bg-white rounded-xl border-2 border-slate-200 hover:border-red-300 hover:shadow-lg transition-all p-5 group"
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <span className="bg-gradient-to-br from-red-500 to-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                    #{i + 1}
                                  </span>
                                  <h5 className="text-lg font-bold text-slate-900">{person.name}</h5>
                                </div>
                              </div>
                              {matchScore > 0 && (
                                <div className={`bg-${scoreColor}-100 text-${scoreColor}-700 px-4 py-2 rounded-full font-bold text-sm flex items-center space-x-1`}>
                                  <span>⭐</span>
                                  <span>{matchScore.toFixed(0)}%</span>
                                </div>
                              )}
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                              <div>
                                <p className="text-slate-600">Blood Group</p>
                                <p className="font-bold text-lg text-red-600">{person.bloodGroup}</p>
                              </div>
                              <div>
                                <p className="text-slate-600">Distance</p>
                                <p className="font-bold text-lg text-blue-600">{match.distance} km</p>
                              </div>
                              {mode === 'donor' && (
                                <>
                                  <div>
                                    <p className="text-slate-600">Age</p>
                                    <p className="font-bold">{person.age} years</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-600">Gender</p>
                                    <p className="font-bold">{person.gender}</p>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Contact Info */}
                            <div className="bg-slate-50 rounded-lg p-3 mb-4 space-y-2 text-sm">
                              <p className="flex items-center space-x-2">
                                <span>📞</span>
                                <span className="text-slate-700 font-medium">{person.phone}</span>
                              </p>
                              <p className="flex items-center space-x-2">
                                <span>📍</span>
                                <span className="text-slate-700">{person.address}</span>
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-3">
                              <a 
                                href={`tel:${person.phone}`}
                                className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center space-x-1"
                              >
                                <span>📞</span>
                                <span>Call</span>
                              </a>
                              <button 
                                onClick={() => openMap(person.location.coordinates)}
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center space-x-1"
                              >
                                <span>🗺️</span>
                                <span>Map</span>
                              </button>
                              {person.bloodReportFile && (
                                <button
                                  onClick={() => window.open(`http://localhost:5000/api/${mode === 'needer' ? 'donors' : 'needers'}/blood-report/${person._id}`, '_blank')}
                                  className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center space-x-1"
                                >
                                  <span>📄</span>
                                  <span>Report</span>
                                </button>
                              )}
                            </div>
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
