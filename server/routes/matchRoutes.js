const express = require('express');
const router = express.Router();
const Donor = require('../models/Donor');
const Needer = require('../models/Needer');
const matchingAlgorithm = require('../utils/matchingAlgorithm');

// Find matches for a needer
router.get('/needer/:neederId', async (req, res) => {
  try {
    const { neederId } = req.params;
    const { maxDistance = 20 } = req.query;
    
    const needer = await Needer.findById(neederId);
    if (!needer) {
      return res.status(404).json({ error: 'Needer not found' });
    }
    
    const donors = await Donor.find({ isActive: true });
    const matches = matchingAlgorithm.matchDonorsForNeeder(needer, donors, parseFloat(maxDistance));
    
    res.json({
      needer: {
        id: needer._id,
        name: needer.name,
        requiredBloodGroup: needer.requiredBloodGroup,
        urgency: needer.urgency
      },
      matches: matches.map(m => ({
        donor: {
          id: m.donor._id,
          name: m.donor.name,
          bloodGroup: m.donor.bloodGroup,
          phone: m.donor.phone,
          address: m.donor.address,
          aadhaarLast4: m.donor.aadhaarNumber.slice(-4),
          location: m.donor.location
        },
        distance: m.distance,
        matchScore: m.matchScore
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find matches for a donor
router.get('/donor/:donorId', async (req, res) => {
  try {
    const { donorId } = req.params;
    const { maxDistance = 20 } = req.query;
    
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    
    const [donorLon, donorLat] = donor.location.coordinates;
    
    // Find needers who can receive this blood group
    const needers = await Needer.find({ isActive: true });
    const matches = needers
      .filter(needer => {
        const compatible = matchingAlgorithm.getCompatibleBloodGroups(needer.requiredBloodGroup);
        return compatible.includes(donor.bloodGroup);
      })
      .map(needer => {
        const [neederLon, neederLat] = needer.location.coordinates;
        const distance = matchingAlgorithm.calculateDistance(donorLat, donorLon, neederLat, neederLon);
        return { needer, distance };
      })
      .filter(m => m.distance <= parseFloat(maxDistance))
      .sort((a, b) => a.distance - b.distance);
    
    res.json({
      donor: {
        id: donor._id,
        name: donor.name,
        bloodGroup: donor.bloodGroup
      },
      matches: matches.map(m => ({
        needer: {
          id: m.needer._id,
          name: m.needer.name,
          requiredBloodGroup: m.needer.requiredBloodGroup,
          phone: m.needer.phone,
          address: m.needer.address,
          urgency: m.needer.urgency,
          location: m.needer.location
        },
        distance: parseFloat(m.distance.toFixed(2))
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
