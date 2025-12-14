# Location-Based Search Implementation Guide

## Interview Explanation for Location-Based Search

### 1. **What Location Data is Used?**

We store **geographic coordinates (latitude & longitude)** for each user:

```javascript
// In MongoDB Schema (Donor.js / Needer.js)
location: {
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true } // [longitude, latitude]
}
```

**Key Point**: Coordinates are stored as **[longitude, latitude]** (GeoJSON format), NOT [latitude, longitude]. This is important for MongoDB geospatial queries.

### 2. **How Location is Captured**

During registration, we capture user's location in two ways:

#### A. **Automatic Geolocation** (Frontend - DonorRegistration.jsx)
```javascript
useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setFormData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
        
        // Get readable address from coordinates
        getAddressFromCoordinates(lat, lng);
      },
      (error) => console.error('Location denied')
    );
  }
}, []);
```

**How it works:**
- Uses browser's **Geolocation API** (with user permission)
- Gets GPS coordinates automatically
- Converts coordinates to readable address using **reverse geocoding**
- User can enable/deny location access

#### B. **Manual Entry Mode**
- If user denies geolocation, they can manually enter:
  - Street address
  - City
  - State
  - Postal code
- Backend geocodes this to get coordinates

### 3. **Implementation Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│  1. NearbyFinder Page                                       │
│     - Gets user's current location                          │
│     - Calls /api/donors/nearby?latitude=X&longitude=Y       │
│     - Displays results on Leaflet Map                       │
│                                                              │
│  2. Matchmaking Page                                        │
│     - Allows user to set search radius (e.g., 20km)         │
│     - Calls /api/match/needer/{id}?maxDistance=20           │
│     - Calculates distance client-side for display           │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                        │
├─────────────────────────────────────────────────────────────┤
│  1. GET /api/donors/nearby                                  │
│     - Receives: latitude, longitude, maxDistance=20000m     │
│     - Uses MongoDB Geospatial Query ($near)                 │
│     - Returns: Array of nearby donors sorted by distance    │
│                                                              │
│  2. GET /api/match/needer/{id}                              │
│     - Receives: maxDistance parameter (km)                  │
│     - Calls Matching Algorithm                              │
│     - Filters by: Blood group + Distance                    │
│     - Returns: Ranked matches by score                      │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Query Processing
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MongoDB)                       │
├─────────────────────────────────────────────────────────────┤
│  Donors Collection with GeoIndex:                           │
│  - 2dsphere index on location field                         │
│  - Enables fast geospatial queries                          │
│  - Supports $near operator for distance queries             │
└─────────────────────────────────────────────────────────────┘
```

### 4. **Step-by-Step Implementation**

#### **Step 1: Data Model with Geospatial Index**
```javascript
// models/Donor.js
const donorSchema = new mongoose.Schema({
  // ... other fields
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  }
});

// Create 2dsphere index for geospatial queries
donorSchema.index({ location: '2dsphere' });
```

#### **Step 2: Save Location During Registration**
```javascript
// routes/donorRoutes.js - Register endpoint
router.post('/register', async (req, res) => {
  const { latitude, longitude } = req.body;
  
  const donor = new Donor({
    // ... other fields
    location: {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    }
  });
  
  await donor.save();
  res.json({ success: true });
});
```

#### **Step 3: Query Nearby Records Using MongoDB**
```javascript
// routes/donorRoutes.js - Nearby search endpoint
router.get('/nearby', async (req, res) => {
  const { latitude, longitude, maxDistance = 20000 } = req.query;
  
  const donors = await Donor.find({
    isActive: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: parseInt(maxDistance) // in meters
      }
    }
  });
  
  res.json(donors);
});
```

**Parameters Explained:**
- `$near`: MongoDB operator for geospatial queries
- `$geometry`: Center point (user's location)
- `$maxDistance`: Search radius in **meters** (20000m = 20km)
- Results are **automatically sorted by distance** (closest first)

### 5. **Distance Calculation Methods**

#### **Method A: MongoDB $near (Used in Nearby Finder)**
- MongoDB automatically calculates and sorts by distance
- Most efficient for "Find all near X"
- Returns: Pre-sorted by distance

#### **Method B: Haversine Formula (Used in Matchmaking)**
```javascript
// utils/matchingAlgorithm.js
calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = this.toRad(lat2 - lat1);
  const dLon = this.toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}
```

**Why Haversine?**
- Calculates great-circle distance between two points on Earth
- Accounts for Earth's spherical shape
- More accurate than straight-line (Euclidean) distance
- Used for: Displaying exact distances, ranking matches

### 6. **Feature: Smart Matching with Distance**

The matching algorithm combines **blood group compatibility** + **geographic proximity**:

```javascript
matchDonorsForNeeder(needer, donors, maxDistance = 20) {
  return donors
    .filter(donor => {
      // 1. Check blood group compatibility
      if (!compatibleBloodGroups.includes(donor.bloodGroup)) {
        return false; // Blood type doesn't match
      }
      
      // 2. Check distance
      const distance = calculateDistance(neederLat, neederLon, 
                                        donorLat, donorLon);
      return distance <= maxDistance;
    })
    .map(donor => ({
      donor,
      distance: parseFloat(distance.toFixed(2)),
      matchScore: calculateMatchScore(needer, donor, distance)
    }))
    .sort((a, b) => b.matchScore - a.matchScore); // Best match first
}
```

**Match Score Calculation:**
```
Score = 100
  - Distance Penalty (0-30 points)
  - Exact Blood Group Match Bonus (+10 points)
  - Verified Documents Bonus (+5 points)
  = Final Score (0-100)
```

### 7. **Frontend: Displaying on Map (NearbyFinder.jsx)**

```javascript
const NearbyFinder = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [donors, setDonors] = useState([]);
  
  useEffect(() => {
    // Get user location
    navigator.geolocation.getCurrentPosition((position) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      setUserLocation(location);
      
      // Fetch nearby donors (20km radius)
      fetch(`http://localhost:5000/api/donors/nearby?
        latitude=${location.lat}&longitude=${location.lng}&maxDistance=20000`)
        .then(res => res.json())
        .then(data => setDonors(data));
    });
  }, []);
  
  return (
    <MapContainer center={userLocation} zoom={13}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {/* User's location marker */}
      <Marker position={userLocation} popup="You are here" />
      
      {/* Nearby donors markers */}
      {donors.map(donor => (
        <Marker key={donor._id} 
          position={[donor.location.coordinates[1], 
                    donor.location.coordinates[0]]}>
          <Popup>
            {donor.name} - {donor.bloodGroup}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
```

### 8. **Key Technologies Used**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Location Capture | Browser Geolocation API | Get GPS coordinates |
| Map Display | Leaflet + React-Leaflet | Interactive map UI |
| Geospatial Queries | MongoDB 2dsphere Index | Fast location-based search |
| Distance Calculation | Haversine Formula | Accurate geo-distance |
| Backend API | Express.js + MongoDB | Process & query data |

### 9. **Interview Answer Summary**

**"How did you implement location-based search?"**

> "I implemented location-based search using three key components:
> 
> 1. **Data Layer**: Store coordinates as GeoJSON Points in MongoDB with a 2dsphere index
> 2. **Backend API**: Use MongoDB's $near operator for efficient geospatial queries with automatic distance sorting
> 3. **Frontend**: Use browser Geolocation API to get user coordinates, then query nearby results and display on Leaflet map
> 
> For matching, I calculate actual distances using the Haversine formula to account for Earth's curvature, then combine distance with blood group compatibility to rank matches by a score. The search supports configurable radius (default 20km) and returns results sorted by proximity."

### 10. **Distance Search Parameters**

- **Nearby Finder**: Fixed 20km radius (`maxDistance=20000` meters)
- **Matchmaking**: User-configurable (default 20km, up to 50km+)
- **API Format**: Distance in **meters** for MongoDB, **kilometers** for display

### 11. **Production Considerations**

```javascript
// Add indexes for performance
donorSchema.index({ location: '2dsphere' });
donorSchema.index({ bloodGroup: 1 });
donorSchema.index({ isActive: 1 });

// Compound index for better performance
donorSchema.index({ isActive: 1, bloodGroup: 1, location: '2dsphere' });
```

---

**This implementation provides:**
- ✅ Real-time location-based matching
- ✅ Efficient database queries with geospatial indexes
- ✅ Accurate distance calculations
- ✅ Interactive map visualization
- ✅ Blood group + location combined matching
