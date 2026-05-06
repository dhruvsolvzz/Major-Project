import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { FaUser, FaSearchLocation, FaMapMarkerAlt, FaPhoneAlt, FaTint, FaFilter, FaSortAmountDown, FaFileAlt, FaFlask, FaDirections, FaClock, FaGlobe, FaHospital } from 'react-icons/fa';
import { LogoIcon } from '../components/Icons';
import API_URL from '../config/api';

// Custom Marker Icons
const createCustomIcon = (color, IconComponent = FaMapMarkerAlt) => {
  const bgColorClass = {
    red: 'bg-red-600',
    orange: 'bg-orange-500',
    green: 'bg-emerald-600',
    blue: 'bg-blue-600',
  }[color] || 'bg-slate-600';

  const iconMarkup = renderToStaticMarkup(
    <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-lg ${bgColorClass}`}>
      <IconComponent className="text-white w-5 h-5" />
      <div className="absolute -bottom-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-marker',
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
  });
};

const donorIcon = createCustomIcon('red');
const neederIcon = createCustomIcon('orange');
const labIcon = createCustomIcon('green', FaFlask);
const hospitalIcon = createCustomIcon('blue', FaHospital);
const userIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
  ),
  className: 'user-marker',
  iconSize: [24, 24],
});

// Component to fly map to location
const MapFlyTo = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1.5 });
  }, [center, map]);
  return null;
};

// Fetch pathology labs & hospitals via backend proxy (avoids CORS)
const fetchLabsAndHospitals = async (lat, lng) => {
  try {
    const res = await fetch(`${API_URL}/nearby/labs?lat=${lat}&lng=${lng}`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching labs/hospitals:', err);
    return [];
  }
};

const NearbyFinder = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [donors, setDonors] = useState([]);
  const [needers, setNeeders] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [labsLoading, setLabsLoading] = useState(false);
  const [viewType, setViewType] = useState('donors');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const labsFetched = useRef(false);

  // Initial Data Fetch
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
          // Fallback to Delhi if geolocation fails (demo purpose)
          const fallback = { lat: 28.6139, lng: 77.2090 };
          setUserLocation(fallback);
          fetchNearby(fallback);
        }
      );
    }
  }, []);

  // Fetch labs when user clicks the labs tab (lazy load)
  useEffect(() => {
    if (viewType === 'labs' && userLocation && !labsFetched.current) {
      labsFetched.current = true;
      fetchLabs(userLocation);
    }
  }, [viewType, userLocation]);

  const fetchNearby = async (location) => {
    try {
      // Fetch nearby donors
      const donorsRes = await fetch(
        `${API_URL}/donors/nearby?latitude=${location.lat}&longitude=${location.lng}&maxDistance=50000`
      );
      const donorsData = await donorsRes.json();
      setDonors(Array.isArray(donorsData) ? donorsData : []);

      // Fetch all needers (filtering logic simplified for demo)
      const needersRes = await fetch(`${API_URL}/needers`);
      const needersData = await needersRes.json();
      setNeeders(Array.isArray(needersData) ? needersData : []);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchLabs = async (location) => {
    setLabsLoading(true);
    try {
      const labData = await fetchLabsAndHospitals(location.lat, location.lng);
      setLabs(labData);
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLabsLoading(false);
    }
  };

  const getFilteredData = () => {
    let data;
    if (viewType === 'donors') data = donors;
    else if (viewType === 'needers') data = needers;
    else data = labs;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(item =>
        (item.name && item.name.toLowerCase().includes(lowerTerm)) ||
        (item.address && item.address.toLowerCase().includes(lowerTerm)) ||
        (item.bloodGroup && item.bloodGroup.toLowerCase().includes(lowerTerm)) ||
        (item.requiredBloodGroup && item.requiredBloodGroup.toLowerCase().includes(lowerTerm))
      );
    }
    return data;
  };

  // Calculate distance
  const getDistance = (loc) => {
    if (!userLocation || !loc) return 0;
    const R = 6371; // km
    const dLat = (loc.coordinates[1] - userLocation.lat) * Math.PI / 180;
    const dLon = (loc.coordinates[0] - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(loc.coordinates[1] * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const openDirections = (item) => {
    const lat = item.location.coordinates[1];
    const lng = item.location.coordinates[0];
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const activeData = getFilteredData();

  // Sort labs by distance
  const sortedData = viewType === 'labs'
    ? [...activeData].sort((a, b) => parseFloat(getDistance(a.location)) - parseFloat(getDistance(b.location)))
    : activeData;

  // Get map markers based on current view
  const getMapMarkers = () => {
    if (viewType === 'labs') return sortedData;
    return activeData;
  };

  const getMarkerIcon = (item) => {
    if (viewType === 'donors') return donorIcon;
    if (viewType === 'needers') return neederIcon;
    return item?.category === 'hospital' ? hospitalIcon : labIcon;
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 z-50 flex-none h-16">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <LogoIcon className="h-8 w-8 text-red-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              RedBridge Finder
            </span>
          </Link>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewType('donors')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewType === 'donors'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Donors
            </button>
            <button
              onClick={() => setViewType('needers')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewType === 'needers'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Needers
            </button>
            <button
              onClick={() => setViewType('labs')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewType === 'labs'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              🔬 Labs & Hospitals
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Split View */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar List (40%) */}
        <div className="w-full md:w-[400px] lg:w-[450px] bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl">
          {/* Search Header */}
          <div className="p-4 border-b border-slate-100 bg-white z-10">
            <div className="relative">
              <FaSearchLocation className="absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={viewType === 'labs' ? 'Search pathology labs...' : `Search ${viewType}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-slate-50 transition-all font-medium"
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>
                {viewType === 'labs' && labsLoading
                  ? 'Searching nearby labs...'
                  : `${sortedData.length} Results Nearby`}
              </span>
              <button className="flex items-center gap-1 hover:text-red-600">
                <FaFilter /> Filter
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {(loading && viewType !== 'labs') || (viewType === 'labs' && labsLoading) ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="text-slate-500 font-medium">
                  {viewType === 'labs' ? 'Finding nearby labs, hospitals & diagnostic centres...' : 'Locating nearby matches...'}
                </p>
                {viewType === 'labs' && (
                  <p className="text-slate-400 text-xs">This may take a few seconds</p>
                )}
              </div>
            ) : sortedData.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {viewType === 'labs' ? <FaFlask className="text-slate-300 text-2xl" /> : <FaSearchLocation className="text-slate-300 text-2xl" />}
                </div>
                <h3 className="text-slate-900 font-bold mb-1">
                  {viewType === 'labs' ? 'No labs or hospitals found' : 'No matches found'}
                </h3>
                <p className="text-slate-500 text-sm">
                  {viewType === 'labs' ? 'Try increasing the search area' : 'Try adjusting your search area'}
                </p>
              </div>
            ) : (
              sortedData.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedItem(item)}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${selectedItem?._id === item._id
                    ? viewType === 'labs'
                      ? item.category === 'hospital'
                        ? 'border-blue-500 ring-1 ring-blue-500 shadow-md bg-blue-50/20'
                        : 'border-emerald-500 ring-1 ring-emerald-500 shadow-md bg-emerald-50/20'
                      : 'border-red-500 ring-1 ring-red-500 shadow-md bg-red-50/10'
                    : 'border-slate-100 hover:border-red-200'
                    }`}
                >
                  {viewType === 'labs' ? (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 ${item.category === 'hospital' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                            {item.category === 'hospital' ? <FaHospital className="w-4 h-4" /> : <FaFlask className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{item.name}</h4>
                            <p className={`text-xs font-semibold mt-0.5 ${item.category === 'hospital' ? 'text-blue-600' : 'text-emerald-600'}`}>
                              {item.category === 'hospital' ? '🏥 Hospital / Blood Bank' : '🔬 Pathology / Diagnostic Lab'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ml-2 ${item.category === 'hospital' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {getDistance(item.location)} km
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                        <FaMapMarkerAlt className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{item.address}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openDirections(item); }}
                          className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors ${item.category === 'hospital' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                        >
                          <FaDirections /> Directions
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const lat = item.location.coordinates[1];
                            const lng = item.location.coordinates[0];
                            window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                          }}
                          className="flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                        >
                          <FaGlobe /> View on Maps
                        </button>
                      </div>
                    </>
                  ) : (
                    /* --- DONOR/NEEDER CARD (original) --- */
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${viewType === 'donors' ? 'bg-gradient-to-br from-red-500 to-pink-600' : 'bg-gradient-to-br from-orange-500 to-red-500'
                            }`}>
                            {viewType === 'donors' ? item.bloodGroup : item.requiredBloodGroup}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{item.name}</h4>
                            <p className="text-xs text-slate-500 font-medium">{item.age} • {item.gender}</p>
                          </div>
                        </div>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                          {getDistance(item.location)} km
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                        <FaMapMarkerAlt className="text-slate-400" />
                        <span className="truncate">{item.address || 'Location hidden'}</span>
                      </div>

                      {viewType === 'needers' && (
                        <div className="mb-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.urgency === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {item.urgency} Priority
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                          onClick={() => item.bloodReportFile ? window.open(`${API_URL}/${viewType}/blood-report/${item._id}`, '_blank') : alert('No blood report available')}
                          className="flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
                        >
                          <FaFileAlt /> View Report
                        </button>
                        <a href={`tel:${item.phone}`} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors">
                          <FaPhoneAlt /> Call
                        </a>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map Area (60%) */}
        <div className="flex-1 relative bg-slate-200 h-full">
          {userLocation ? (
            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />

              <MapFlyTo center={selectedItem ? [selectedItem.location.coordinates[1], selectedItem.location.coordinates[0]] : null} />

              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                <Popup>You are here</Popup>
              </Marker>

              {getMapMarkers().map(item => (
                <Marker
                  key={item._id}
                  position={[item.location.coordinates[1], item.location.coordinates[0]]}
                  icon={getMarkerIcon(item)}
                  eventHandlers={{
                    click: () => setSelectedItem(item),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-2 min-w-[180px]">
                      <h3 className="font-bold text-slate-800 text-sm">{item.name}</h3>
                      {viewType === 'labs' ? (
                        <>
                          <p className={`text-xs font-semibold mt-1 ${item.category === 'hospital' ? 'text-blue-600' : 'text-emerald-600'}`}>
                            {item.category === 'hospital' ? '🏥 Hospital / Blood Bank' : '🔬 Pathology / Diagnostic Lab'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 mb-2">{item.address}</p>
                          <button
                            onClick={() => openDirections(item)}
                            className={`block w-full py-1.5 text-white text-xs font-bold rounded transition-colors ${item.category === 'hospital' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                          >
                            Get Directions
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="text-xs font-semibold text-slate-500 mt-1 mb-2">
                            {viewType === 'donors' ? `Blood: ${item.bloodGroup}` : `Need: ${item.requiredBloodGroup}`}
                          </div>
                          <a href={`tel:${item.phone}`} className="block w-full py-1 bg-red-600 text-white text-xs font-bold rounded text-center">
                            Call Now
                          </a>
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-400 mx-auto mb-4"></div>
                <p className="text-slate-500 font-bold">Initializing Map...</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default NearbyFinder;
