import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const NearbyFinder = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [donors, setDonors] = useState([]);
  const [needers, setNeeders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('donors');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('distance');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          fetchNearby(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLoading(false);
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNearby = async (location) => {
    try {
      // Fetch nearby donors (within 20 km)
      const donorsRes = await fetch(
        `http://localhost:5000/api/donors/nearby?latitude=${location.lat}&longitude=${location.lng}&maxDistance=20000`
      );
      const donorsData = await donorsRes.json();
      setDonors(Array.isArray(donorsData) ? donorsData : []);

      // Fetch all needers and filter by distance
      const needersRes = await fetch('http://localhost:5000/api/needers');
      const needersData = await needersRes.json();
      
      // Filter needers within 20 km
      const nearbyNeeders = Array.isArray(needersData) ? needersData.filter(needer => {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          needer.location.coordinates[1],
          needer.location.coordinates[0]
        );
        return distance <= 20; // 20 km
      }) : [];
      
      setNeeders(nearbyNeeders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching nearby:', error);
      setDonors([]);
      setNeeders([]);
      setLoading(false);
    }
  };

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  // Calculate distance for sorting and display
  const getDistanceToUser = (location) => {
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      location.coordinates[1],
      location.coordinates[0]
    );
  };

  // Filter and sort data
  const getFilteredAndSortedData = () => {
    let data = viewType === 'donors' ? (donors || []) : (needers || []);
    
    // Search filter
    if (searchTerm) {
      data = data.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.requiredBloodGroup?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort
    if (sortBy === 'distance') {
      data = [...data].sort((a, b) => 
        getDistanceToUser(a.location) - getDistanceToUser(b.location)
      );
    }
    
    return data;
  };

  if (loading || !userLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-do-blue-50 via-green-50 to-cf-orange-50">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-do-blue-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-slate-700 font-semibold text-lg">
            📍 Finding nearby users...
          </p>
        </div>
      </div>
    );
  }

  const displayData = viewType === 'donors' ? (donors || []) : (needers || []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-do-blue-50 via-green-50 to-cf-orange-50">
      <nav className="bg-white/90 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-gradient-to-br from-do-blue-500 to-cf-orange-500 p-2 rounded-lg shadow-do">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-do-blue-600 to-cf-orange-600 bg-clip-text text-transparent">
              RedBridge
            </span>
          </Link>
          <div className="flex gap-2">
            <button onClick={() => setViewType('donors')} className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                viewType === 'donors' 
                  ? 'bg-gradient-to-r from-do-blue-500 to-do-blue-600 text-white shadow-do' 
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-do-blue-300 hover:shadow-soft'
              }`}
            >
              <svg className="inline h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              Donors
            </button>
            <button onClick={() => setViewType('needers')} className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                viewType === 'needers' 
                  ? 'bg-gradient-to-r from-cf-orange-500 to-cf-orange-600 text-white shadow-cf' 
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-cf-orange-300 hover:shadow-soft'
              }`}
            >
              <svg className="inline h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Needers
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-do-blue-600 via-green-600 to-cf-orange-600 bg-clip-text text-transparent mb-2">
            📍 Nearby {viewType === 'donors' ? 'Donors' : 'Needers'}
          </h2>
          <p className="text-slate-500 text-lg flex items-center">
            <svg className="h-5 w-5 mr-2 text-do-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-semibold text-slate-700">{viewType === 'donors' 
              ? `${donors.length} donor${donors.length !== 1 ? 's' : ''}`
              : `${needers.length} needer${needers.length !== 1 ? 's' : ''}`
            }</span>
            <span className="ml-2 text-slate-500"> within 20 km radius</span>
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={`Search by name or ${viewType === 'donors' ? 'blood group' : 'needed group'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-do-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-500 font-medium transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('distance')}
              className={`px-5 py-3.5 rounded-xl font-semibold transition-all flex items-center ${
                sortBy === 'distance'
                  ? 'bg-gradient-to-r from-do-blue-500 to-do-blue-600 text-white shadow-do'
                  : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-do-blue-300'
              }`}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Distance
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden" style={{ height: '600px' }}>
              <MapContainer 
                center={[userLocation.lat, userLocation.lng]} 
                zoom={12} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={20000}
                  pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 2 }}
                />
                
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup className="font-semibold">📍 Your Location</Popup>
                </Marker>

                {getFilteredAndSortedData() && getFilteredAndSortedData().length > 0 && getFilteredAndSortedData().map((item) => (
                  <Marker 
                    key={item._id} 
                    position={[item.location.coordinates[1], item.location.coordinates[0]]}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong className="text-slate-900 block">{item.name}</strong>
                        <span className="text-slate-600">{viewType === 'donors' ? `Blood: ${item.bloodGroup}` : `Needs: ${item.requiredBloodGroup}`}</span><br />
                        <span className="text-slate-500 text-xs">📞 {item.phone}</span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
            {!getFilteredAndSortedData() || getFilteredAndSortedData().length === 0 ? (
              <div className="bg-white rounded-2xl shadow-soft border border-slate-200 p-8 text-center">
                <svg className="h-16 w-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <p className="text-slate-500 font-medium text-lg">No results found</p>
                <p className="text-slate-400 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            ) : (
              getFilteredAndSortedData().map((item, index) => {
                const distance = getDistanceToUser(item.location);
                return (
                  <div key={item._id} className="bg-white rounded-2xl shadow-soft border border-slate-200 p-5 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                          viewType === 'donors'
                            ? 'bg-gradient-to-br from-do-blue-500 to-do-blue-600'
                            : 'bg-gradient-to-br from-cf-orange-500 to-cf-orange-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 truncate">{item.name}</h3>
                          <p className="text-slate-500 text-sm">{item.age} years old • {item.gender}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block px-3.5 py-2 rounded-lg text-sm font-bold text-white ${
                          viewType === 'donors' 
                            ? 'bg-gradient-to-r from-do-blue-500 to-do-blue-600 shadow-do'
                            : 'bg-gradient-to-r from-cf-orange-500 to-cf-orange-600 shadow-cf'
                        }`}>
                          {viewType === 'donors' ? item.bloodGroup : item.requiredBloodGroup}
                        </span>
                      </div>
                    </div>

                    {/* Distance Badge */}
                    <div className="mb-4 inline-block">
                      <span className="px-3 py-1.5 bg-blue-50 text-do-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L9.9 13.95a.75.75 0 01-1.06-1.06l5.05-5.05a5.5 5.5 0 10-7.78 7.78l5.05-5.05a.75.75 0 111.06 1.06L4.94 19.06a7 7 0 01-.89-9.9z" clipRule="evenodd" />
                        </svg>
                        {distance.toFixed(1)} km away
                      </span>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      <p className="text-slate-600 text-sm flex items-start gap-2">
                        <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-do-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="line-clamp-2">{item.address}</span>
                      </p>
                      <p className="text-slate-600 text-sm flex items-center gap-2">
                        <svg className="h-4 w-4 flex-shrink-0 text-do-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        {item.phone}
                      </p>
                      {viewType === 'needers' && item.urgency && (
                        <p className="text-slate-600 text-sm flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.urgency === 'Critical' ? 'bg-red-100 text-red-800' :
                            item.urgency === 'High' ? 'bg-cf-orange-100 text-cf-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.urgency === 'Critical' ? '🚨' : '⚠️'} {item.urgency}
                          </span>
                        </p>
                      )}
                    </div>

                    {item.bloodReportFile && (
                      <button
                        onClick={() => window.open(`http://localhost:5000/api/${viewType}/blood-report/${item._id}`, '_blank')}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-lg hover:from-purple-700 hover:to-pink-700 text-sm font-bold flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Blood Report
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyFinder;
