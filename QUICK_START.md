# 🚀 RedBridge - Quick Start Guide

## ⚡ Fastest Way to Start

### **Option 1: One-Click Start** ⭐ RECOMMENDED
```bash
START-FIXED.bat
```
Double-click this file and you're done! 🎉

---

## 📋 What You Need

- ✅ Node.js v14+ installed
- ✅ MongoDB Atlas connection (already configured)
- ✅ At least 4GB RAM available
- ✅ Port 3000 and 5000 free

---

## 🎯 Step-by-Step (First Time)

### 1️⃣ Install Dependencies
```bash
npm install
cd client
npm install
cd ..
```

### 2️⃣ Start the Application
```bash
START-FIXED.bat
```

### 3️⃣ Open in Browser
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 🔧 If You Get Errors

### Error: Client crashes (code 3221226505)
**Solution**: Use `START-FIXED.bat` - it fixes memory issues automatically!

### Error: Port already in use
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### Error: Module not found
```bash
cd client
npm install
```

### Need more help?
See `TROUBLESHOOTING.md` for detailed solutions.

---

## 📁 Project Structure

```
redbridge/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # All page components
│   │   ├── components/ # Reusable components
│   │   └── store/      # Redux store
│   └── package.json
├── server/              # Express backend
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   └── utils/          # OCR & utilities
├── START-FIXED.bat     # ⭐ Use this to start!
└── package.json
```

---

## 🎨 Features

### ✨ Frontend
- Beautiful multicolor UI with Framer Motion animations
- Responsive design with Tailwind CSS
- Drag & drop file upload
- Interactive maps (Leaflet)
- Real-time location detection

### 🔧 Backend
- OCR for Aadhaar cards & blood reports
- Geospatial matching (find nearby donors)
- Blood type compatibility checking
- MongoDB Atlas database
- RESTful API

---

## 🌐 Available Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with features |
| `/donor-registration` | Register as blood donor |
| `/needer-registration` | Register as blood needer |
| `/donor-login` | Donor login |
| `/needer-login` | Needer login |
| `/donors` | View all donors |
| `/needers` | View all needers |
| `/nearby` | Find nearby donors/needers |
| `/match` | Smart matchmaking |

---

## 🎯 Common Tasks

### Start Development
```bash
START-FIXED.bat
```

### Build for Production
```bash
cd client
npm run build
```

### Run Tests
```bash
cd client
npm test
```

### Clear Cache
```bash
FIX_CLIENT.bat
```

---

## 📚 Documentation

- `README.md` - Main project documentation
- `TROUBLESHOOTING.md` - Fix common issues
- `FRAMER_MOTION_ENHANCEMENTS.md` - Animation details
- `AUTO_FILL_DEMO.md` - OCR feature guide
- `PROJECT_STATUS.md` - Current status

---

## 🎉 You're Ready!

Just run `START-FIXED.bat` and start building amazing features! 🚀

**Need help?** Check `TROUBLESHOOTING.md`

---

**Last Updated**: November 23, 2025
