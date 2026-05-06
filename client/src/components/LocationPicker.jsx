import { useState, useRef, useEffect } from 'react';

/**
 * LocationPicker
 * Props:
 *   address     {string}   - current address value
 *   latitude    {string}   - current latitude value
 *   longitude   {string}   - current longitude value
 *   onChange    {fn}       - called with { address, latitude, longitude } when user picks a location
 *   required    {bool}
 */
const LocationPicker = ({ address, latitude, longitude, onChange, required = false }) => {
  const [query, setQuery] = useState(address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Sync external address into local query
  useEffect(() => {
    if (address && address !== query) setQuery(address);
  }, [address]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = async (value) => {
    if (!value || value.length < 3) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=6&addressdetails=1`,
        { headers: { 'User-Agent': 'RedBridge-BloodDonation/1.0' } }
      );
      const data = await res.json();
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    // Propagate raw text immediately so form stays updated
    onChange({ address: value, latitude, longitude });
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 450);
  };

  const handleSelect = (place) => {
    const selectedAddress = place.display_name;
    const lat = parseFloat(place.lat).toFixed(6);
    const lng = parseFloat(place.lon).toFixed(6);
    setQuery(selectedAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange({ address: selectedAddress, latitude: lat, longitude: lng });
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'User-Agent': 'RedBridge-BloodDonation/1.0' } }
          );
          const data = await res.json();
          const detectedAddress = data.display_name || `${lat}, ${lng}`;
          setQuery(detectedAddress);
          onChange({ address: detectedAddress, latitude: lat, longitude: lng });
        } catch {
          const fallback = `${lat}, ${lng}`;
          setQuery(fallback);
          onChange({ address: fallback, latitude: lat, longitude: lng });
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setDetecting(false);
        alert('Could not detect location. Please enter manually.');
      }
    );
  };

  return (
    <div ref={wrapperRef} className="space-y-3">
      {/* Address Input with suggestions */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Address {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <textarea
            value={query}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            rows={2}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all hover:shadow-md resize-none"
            placeholder="Type your address for suggestions, or click Detect below"
            required={required}
          />
          {loading && (
            <div className="absolute right-3 top-3">
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
              {suggestions.map((place, i) => (
                <li
                  key={place.place_id || i}
                  onMouseDown={() => handleSelect(place)}
                  className="px-4 py-3 cursor-pointer hover:bg-red-50 flex items-start gap-2 border-b border-slate-100 last:border-0 transition-colors"
                >
                  <svg className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-slate-700 line-clamp-2">{place.display_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Detect Location Button */}
      <button
        type="button"
        onClick={detectCurrentLocation}
        disabled={detecting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-100 transition-all disabled:opacity-60"
      >
        {detecting ? (
          <>
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Detecting location...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Use My Current Location
          </>
        )}
      </button>

      {/* Coordinates Display (read-only) */}
      {(latitude || longitude) && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Latitude</label>
            <input
              type="text"
              value={latitude || ''}
              readOnly
              className="w-full px-3 py-2 border-2 border-slate-100 rounded-xl bg-slate-50 text-slate-600 text-sm font-mono"
              placeholder="Auto-detected"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Longitude</label>
            <input
              type="text"
              value={longitude || ''}
              readOnly
              className="w-full px-3 py-2 border-2 border-slate-100 rounded-xl bg-slate-50 text-slate-600 text-sm font-mono"
              placeholder="Auto-detected"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
