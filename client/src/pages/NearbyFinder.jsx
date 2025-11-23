import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const NearbyFinder = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [donors, setDonors] = useState([]);
  const [needers, setNeeders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('donors');

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

  if (loading || !userLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-do-blue-50 via-green-50 to-cf-orange-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-do-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-slate-700 font-semibold text-lg"
          >
            📍 Finding nearby users...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const displayData = viewType === 'donors' ? (donors || []) : (needers || []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-do-blue-50 via-green-50 to-cf-orange-50">
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
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
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewType('donors')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                viewType === 'donors' 
                  ? 'bg-gradient-to-r from-do-blue-500 to-do-blue-600 text-white shadow-do' 
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-do-blue-300 hover:shadow-soft'
              }`}
            >
              <svg className="inline h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              Donors
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewType('needers')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                viewType === 'needers' 
                  ? 'bg-gradient-to-r from-cf-orange-500 to-cf-orange-600 text-white shadow-cf' 
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-cf-orange-300 hover:shadow-soft'
              }`}
            >
              <svg className="inline h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Needers
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-4xl font-bold bg-gradient-to-r from-do-blue-600 via-green-600 to-cf-orange-600 bg-clip-text text-transparent mb-2">
            📍 Nearby {viewType === 'donors' ? 'Donors' : 'Needers'} (Within 20 km)
          </h2>
          <p className="text-slate-600 flex items-center">
            <svg className="h-5 w-5 mr-2 text-do-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {viewType === 'donors' 
              ? `Found ${donors.length} donor${donors.length !== 1 ? 's' : ''} near you`
              : `Found ${needers.length} needer${needers.length !== 1 ? 's' : ''} near you`
            }
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-4" style={{ height: '500px' }}>
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
                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
              />
              
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>Your Location</Popup>
              </Marker>

              {displayData && displayData.length > 0 && displayData.map((item) => (
                <Marker 
                  key={item._id} 
                  position={[item.location.coordinates[1], item.location.coordinates[0]]}
                >
                  <Popup>
                    <div>
                      <strong>{item.name}</strong><br />
                      {viewType === 'donors' ? `Blood Group: ${item.bloodGroup}` : `Needs: ${item.requiredBloodGroup}`}<br />
                      Phone: {item.phone}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
            {!displayData || displayData.length === 0 ? (
              <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-8 text-center text-slate-500">
                {loading ? 'Loading...' : `No ${viewType} found nearby`}
              </div>
            ) : (
              displayData.map((item) => (
                <div key={item._id} className="bg-white rounded-xl shadow-soft border border-slate-200 p-6 hover:shadow-medium transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
                      <p className="text-slate-600">{item.age} years, {item.gender}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${
                        viewType === 'donors' 
                          ? 'bg-gradient-to-r from-do-blue-500 to-do-blue-600 text-white shadow-do'
                          : 'bg-gradient-to-r from-cf-orange-500 to-cf-orange-600 text-white shadow-cf'
                      }`}>
                        {viewType === 'donors' ? item.bloodGroup : item.requiredBloodGroup}
                      </span>
                      {viewType === 'needers' && (
                        <span className={`block mt-2 text-xs px-3 py-1 rounded-full font-medium ${
                          item.urgency === 'Critical' ? 'bg-red-100 text-red-800' :
                          item.urgency === 'High' ? 'bg-cf-orange-100 text-cf-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.urgency}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-600 text-sm flex items-start">
                      <svg className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-do-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {item.address}
                    </p>
                    <p className="text-slate-600 text-sm flex items-center">
                      <svg className="h-4 w-4 mr-2 text-do-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      {item.phone}
                    </p>
                    <p className="text-slate-400 text-xs">
                      Aadhaar: ****{item.aadhaarNumber.slice(-4)}
                    </p>
                    {item.bloodReportFile && (
                      <button
                        onClick={() => window.open(`http://localhost:5000/api/${viewType}/blood-report/${item._id}`, '_blank')}
                        className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-lg hover:from-purple-700 hover:to-pink-700 text-sm font-semibold flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Blood Report
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyFinder;
