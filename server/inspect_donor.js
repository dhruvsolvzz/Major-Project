const mongoose = require('mongoose');
const Donor = require('./models/Donor');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function listDonors() {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected');

    const donors = await Donor.find({}).limit(5);
    console.log(`Donors found (${donors.length}):`);
    donors.forEach(d => {
      console.log(`- ${d.name} (${d.phone}): bloodReportFile = ${d.bloodReportFile}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

listDonors();
