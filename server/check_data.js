const mongoose = require('mongoose');
const Donor = require('./models/Donor');
const Needer = require('./models/Needer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/redbridge');
    console.log('Connected to MongoDB');

    const donors = await Donor.find({ isActive: true });
    console.log(`\n--- Donors (${donors.length}) ---`);
    donors.forEach(d => {
      console.log(`Name: ${d.name}, Blood Group: ${d.bloodGroup}, Report File: ${d.bloodReportFile || 'MISSING'}`);
    });

    const needers = await Needer.find({ isActive: true });
    console.log(`\n--- Needers (${needers.length}) ---`);
    needers.forEach(n => {
      console.log(`Name: ${n.name}, Required Blood Group: ${n.requiredBloodGroup}, Report File: ${n.bloodReportFile || 'MISSING'}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkData();
