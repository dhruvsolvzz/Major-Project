# 🌉 RedBridge - Blood Donation Matching Platform

A production-ready MERN web application that connects blood donors with those in need using advanced OCR technology for document verification and blood report extraction.

## 🔥 Core Features

- **Universal OCR Support**: Extract information from ANY blood report format (PDF, JPG, PNG, HEIC, WebP)
- **Smart Blood Group Detection**: Works with all blood types (A+, A-, B+, B-, O+, O-, AB+, AB-)
- **Document Verification**: Aadhaar validation with authenticity checks
- **Geolocation Matching**: Find donors/needers within 20 km radius
- **Blood Group Compatibility**: Intelligent matching based on compatibility matrix
- **Interactive Maps**: Visualize nearby users with Leaflet maps

## 📋 Technology Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose (with 2dsphere geospatial indexing)
- Tesseract.js (OCR engine)
- Sharp + Jimp (image preprocessing)
- Multer (file uploads)

### Frontend
- React.js
- Redux Toolkit (state management)
- Tailwind CSS (styling)
- React Router DOM (navigation)
- React Leaflet (maps)

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB (v5+)
- npm or yarn

### 1. Clone and Install

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bloodcamp
NODE_ENV=development
```

### 3. Create Upload Directory

```bash
mkdir server/uploads
```

### 4. Start MongoDB

```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

### 5. Run the Application

```bash
# Terminal 1: Start backend
cd server
npm start

# Terminal 2: Start frontend
cd client
npm start
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📌 API Endpoints

### Donors
- `POST /api/donors/register` - Register new donor with Aadhaar & blood report
- `GET /api/donors` - Get all active donors
- `GET /api/donors/nearby?latitude=X&longitude=Y&maxDistance=20000` - Find nearby donors

### Needers
- `POST /api/needers/register` - Register needer with Aadhaar
- `GET /api/needers` - Get all active needers

### Matching
- `GET /api/match/needer/:neederId?maxDistance=20` - Find compatible donors for needer
- `GET /api/match/donor/:donorId?maxDistance=20` - Find needers for donor

### OCR Testing
- `POST /api/ocr/blood-report` - Test OCR on blood report
- `POST /api/ocr/aadhaar` - Test OCR on Aadhaar

## 🔬 OCR Pipeline

### Image Preprocessing
1. Grayscale conversion
2. Normalization
3. Sharpening
4. Threshold adjustment
5. Contrast enhancement

### Extraction Features
- Blood group detection (multiple pattern matching)
- Name extraction
- Age detection
- Gender identification
- Hospital/Lab name
- Report date
- Phone number
- Aadhaar number with Verhoeff checksum validation

### Document Validation
- Aadhaar: 12-digit pattern, checksum, fraud detection
- Blood Report: Medical terminology, hospital presence, valid blood group

## 🗺️ Geospatial Features

MongoDB 2dsphere indexes enable:
- Distance-based queries (Haversine formula)
- Radius searches (default 20 km)
- Location-based sorting

## 🤝 Blood Group Compatibility Matrix

```
A+  can receive from: A+, A-, O+, O-
A-  can receive from: A-, O-
B+  can receive from: B+, B-, O+, O-
B-  can receive from: B-, O-
AB+ can receive from: ALL (Universal Recipient)
AB- can receive from: A-, B-, AB-, O-
O+  can receive from: O+, O-
O-  can receive from: O- (Universal Donor)
```

## 📱 Application Pages

1. **Landing Page** - Choose donor or needer registration
2. **Donor Registration** - Upload Aadhaar + blood report, auto-extract blood group
3. **Needer Registration** - Upload Aadhaar, specify required blood group
4. **Nearby Finder** - View donors/needers on map within 20 km
5. **Matchmaking** - Find compatible matches with distance and score

## 🧪 Testing OCR

### Test Blood Report Extraction
```bash
curl -X POST http://localhost:5000/api/ocr/blood-report \
  -F "file=@path/to/blood-report.pdf"
```

### Test Aadhaar Extraction
```bash
curl -X POST http://localhost:5000/api/ocr/aadhaar \
  -F "file=@path/to/aadhaar.jpg"
```

## 🔒 Security Features

- Aadhaar deduplication (prevents duplicate registrations)
- Document authenticity validation
- File size limits (10MB)
- Supported formats validation
- PII protection (only last 4 digits of Aadhaar shown)

## 📊 Database Schema

### Donor Schema
```javascript
{
  name, age, gender, bloodGroup, phone, address,
  location: { type: "Point", coordinates: [lng, lat] },
  aadhaarNumber, aadhaarData, bloodReportData,
  aadhaarFile, bloodReportFile, ocrRawData
}
```

### Needer Schema
```javascript
{
  name, age, gender, requiredBloodGroup, phone, address, urgency,
  location: { type: "Point", coordinates: [lng, lat] },
  aadhaarNumber, aadhaarData, aadhaarFile, ocrRawData
}
```

## 🎯 Matching Algorithm

Score calculation (0-100):
- Base score: 100
- Distance penalty: -30 points max (closer = better)
- Exact blood group match: +10 points
- Verified documents: +5 points

## 🐛 Troubleshooting

### OCR Not Working
- Ensure Tesseract.js is installed
- Check image quality (min 300 DPI recommended)
- Verify file format is supported

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in .env
- Verify network connectivity

### Geolocation Not Working
- Enable location permissions in browser
- Use HTTPS in production
- Fallback to manual location entry

## 📝 License

MIT License - Feel free to use for any purpose

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ for saving lives through technology
