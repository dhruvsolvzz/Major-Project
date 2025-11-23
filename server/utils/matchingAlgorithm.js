class MatchingAlgorithm {
  
  // Blood group compatibility matrix
  getCompatibleBloodGroups(requiredBloodGroup) {
    const compatibility = {
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal recipient
      'AB-': ['A-', 'B-', 'AB-', 'O-'],
      'O+': ['O+', 'O-'],
      'O-': ['O-'] // Universal donor
    };
    
    return compatibility[requiredBloodGroup] || [];
  }
  
  // Calculate distance using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }
  
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  // Match donors for a needer
  matchDonorsForNeeder(needer, donors, maxDistance = 20) {
    const compatibleGroups = this.getCompatibleBloodGroups(needer.requiredBloodGroup);
    const [neederLon, neederLat] = needer.location.coordinates;
    
    const matches = donors
      .filter(donor => {
        // Check blood group compatibility
        if (!compatibleGroups.includes(donor.bloodGroup)) {
          return false;
        }
        
        // Check if donor is active
        if (!donor.isActive) {
          return false;
        }
        
        // Calculate distance
        const [donorLon, donorLat] = donor.location.coordinates;
        const distance = this.calculateDistance(neederLat, neederLon, donorLat, donorLon);
        
        return distance <= maxDistance;
      })
      .map(donor => {
        const [donorLon, donorLat] = donor.location.coordinates;
        const distance = this.calculateDistance(neederLat, neederLon, donorLat, donorLon);
        
        return {
          donor,
          distance: parseFloat(distance.toFixed(2)),
          matchScore: this.calculateMatchScore(needer, donor, distance)
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
    
    return matches;
  }
  
  // Calculate match score (0-100)
  calculateMatchScore(needer, donor, distance) {
    let score = 100;
    
    // Distance penalty (closer is better)
    const distancePenalty = (distance / 20) * 30; // Max 30 points penalty
    score -= distancePenalty;
    
    // Exact blood group match bonus
    if (donor.bloodGroup === needer.requiredBloodGroup) {
      score += 10;
    }
    
    // Verified documents bonus
    if (donor.aadhaarData.verified && donor.bloodReportData.verified) {
      score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }
}

module.exports = new MatchingAlgorithm();
