import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import Navbar from '../components/Navbar';

const DonorsPage = () => {
  const [needers, setNeeders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    fetchNeeders();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('Location unavailable:', err)
      );
    }
  }, []);

  const fetchNeeders = async () => {
    try {
      const res = await fetch(`${API_URL}/needers`);
      const data = await res.json();
      setNeeders(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDistance = (loc) => {
    if (!userLocation || !loc?.coordinates) return null;
    const R = 6371;
    const dLat = (loc.coordinates[1] - userLocation.lat) * Math.PI / 180;
    const dLon = (loc.coordinates[0] - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(userLocation.lat * Math.PI / 180) *
      Math.cos(loc.coordinates[1] * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  };

  const openDirections = (loc) => {
    if (!loc?.coordinates) return;
    const [lng, lat] = loc.coordinates;
    const url = userLocation
      ? `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const filteredNeeders = filter === 'all' ? needers : needers.filter(n => n.requiredBloodGroup === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50">
      <Navbar />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                People Who Need Your Help
              </span>
            </h1>
            <p className="text-xl text-gray-600">{needers.length} people waiting for blood donors like you</p>
            {userLocation && <p className="text-sm text-green-600 mt-2 font-medium">📍 Location detected — distances shown on cards</p>}
          </div>

          <div className="mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => setFilter('all')}
                className={`px-6 py-2 rounded-full font-semibold transition ${filter === 'all' ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-red-50'}`}>
                All ({needers.length})
              </button>
              {bloodGroups.map((bg) => (
                <button key={bg} onClick={() => setFilter(bg)}
                  className={`px-6 py-2 rounded-full font-semibold transition ${filter === bg ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-red-50'}`}>
                  {bg} ({needers.filter(n => n.requiredBloodGroup === bg).length})
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredNeeders.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🙏</div>
              <p className="text-xl text-gray-600">No needers found for {filter}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNeeders.map((needer) => {
                const dist = getDistance(needer.location);
                return (
                  <div key={needer._id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-6 border-2 border-transparent hover:border-red-200 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{needer.name}</h3>
                        <p className="text-sm text-gray-600">{needer.age} years, {needer.gender}</p>
                      </div>
                      <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white px-4 py-2 rounded-xl font-bold text-lg shadow-lg">
                        {needer.requiredBloodGroup}
                      </div>
                    </div>

                    <div className={`mb-4 px-4 py-2 rounded-lg font-semibold text-center shadow-md ${
                      needer.urgency === 'Critical' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' :
                      needer.urgency === 'High' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                      needer.urgency === 'Medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white' :
                      'bg-gradient-to-r from-green-500 to-green-600 text-white'}`}>
                      🚨 {needer.urgency} Urgency
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        {needer.phone}
                      </div>
                      <div className="flex items-start">
                        <svg className="h-4 w-4 mr-2 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="line-clamp-2">{needer.address}</span>
                      </div>
                      {dist && (
                        <div className="flex items-center bg-orange-50 rounded-lg px-3 py-1.5">
                          <svg className="h-4 w-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-semibold text-orange-700">{dist} km away</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto space-y-2">
                      <a href={`tel:${needer.phone}`}
                        className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-2 rounded-xl font-semibold flex items-center justify-center hover:shadow-lg transition">
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        Contact Needer
                      </a>

                      {needer.location?.coordinates && (
                        <button onClick={() => openDirections(needer.location)}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2 rounded-xl font-semibold flex items-center justify-center hover:shadow-lg transition">
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          {dist ? `Map · ${dist} km` : 'Get Directions'}
                        </button>
                      )}

                      {needer.bloodReportFile && (
                        <button onClick={() => window.open(`${API_URL}/needers/blood-report/${needer._id}`, '_blank')}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-xl font-semibold flex items-center justify-center hover:shadow-lg transition">
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Blood Report
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
    </div>
  );
};

export default DonorsPage;
