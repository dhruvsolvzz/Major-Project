const express = require('express');
const router = express.Router();
const https = require('https');

/**
 * GET /api/nearby/labs
 * Proxy for Nominatim searches - avoids CORS issues from browser
 * Query params: lat, lng
 */
router.get('/labs', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng query parameters are required' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  const searchTerms = [
    // Pathology & Diagnostic labs
    { q: 'diagnostic centre', category: 'lab' },
    { q: 'diagnostic center', category: 'lab' },
    { q: 'pathology lab', category: 'lab' },
    { q: 'pathology', category: 'lab' },
    { q: 'Dr Lal PathLabs', category: 'lab' },
    { q: 'Thyrocare', category: 'lab' },
    { q: 'Metropolis Healthcare', category: 'lab' },
    { q: 'SRL Diagnostics', category: 'lab' },
    { q: 'blood test lab', category: 'lab' },
    // Hospitals
    { q: 'hospital', category: 'hospital' },
    { q: 'blood bank', category: 'hospital' },
    { q: 'nursing home', category: 'hospital' },
  ];

  const delta = 0.18; // ~20km bounding box
  const viewbox = `${longitude - delta},${latitude + delta},${longitude + delta},${latitude - delta}`;

  const allResults = [];
  const seen = new Set();

  // Irrelevant name filters
  const irrelevant = ['plant pathology', 'veterinary', 'department of', 'division of', 'college', 'university', 'school', 'animal'];

  const fetchFromNominatim = (term) => {
    return new Promise((resolve) => {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}&format=json&limit=20&viewbox=${viewbox}&bounded=1&addressdetails=1`;

      https.get(url, { headers: { 'User-Agent': 'RedBridge-BloodDonation/1.0' } }, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve([]);
          }
        });
      }).on('error', () => resolve([]));
    });
  };

  try {
    for (const { q: term, category } of searchTerms) {
      const data = await fetchFromNominatim(term);

      data.forEach(place => {
        const key = `${parseFloat(place.lat).toFixed(5)},${parseFloat(place.lon).toFixed(5)}`;
        if (seen.has(key)) return;

        const name = place.display_name.split(',')[0].trim();
        const lowerName = name.toLowerCase();
        if (irrelevant.some(w => lowerName.includes(w))) return;

        seen.add(key);
        const address = place.display_name.split(',').slice(1, 4).join(',').trim();

        allResults.push({
          _id: `nom-${place.place_id}`,
          name,
          address: address || 'Address not available',
          phone: null,
          category,
          type: place.type || 'laboratory',
          location: {
            coordinates: [parseFloat(place.lon), parseFloat(place.lat)]
          }
        });
      });

      // Nominatim rate limit: 1 request per second
      await new Promise(r => setTimeout(r, 1100));
    }

    console.log(`✅ Nearby labs/hospitals: Found ${allResults.length} results for ${latitude}, ${longitude}`);
    res.json(allResults);
  } catch (error) {
    console.error('Error fetching nearby labs:', error);
    res.status(500).json({ error: 'Failed to fetch nearby labs' });
  }
});

module.exports = router;
