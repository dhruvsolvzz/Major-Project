class AadhaarValidator {

  // Validate Aadhaar number format
  validateAadhaarNumber(aadhaarNumber, strictMode = false) {
    const issues = [];
    const warnings = [];

    // Remove spaces and hyphens
    const cleaned = aadhaarNumber.replace(/[\s\-]/g, '');

    // Check length
    if (cleaned.length !== 12) {
      issues.push('Aadhaar must be 12 digits');
    }

    // Check if all digits
    if (!/^\d{12}$/.test(cleaned)) {
      issues.push('Aadhaar must contain only digits');
    }

    // Check for repeated digits (simple fraud detection)
    if (/^(\d)\1{11}$/.test(cleaned)) {
      issues.push('Invalid Aadhaar - all digits are same');
    }

    // Check for sequential digits
    if (cleaned === '123456789012' || cleaned === '012345678901') {
      issues.push('Invalid Aadhaar - sequential pattern detected');
    }

    // Verhoeff algorithm check (only in strict mode for production)
    if (strictMode && cleaned.length === 12 && /^\d{12}$/.test(cleaned)) {
      if (!this.verhoeffCheck(cleaned)) {
        warnings.push('Aadhaar checksum validation failed (may be test data)');
      }
    }

    return {
      isValid: issues.length === 0,
      issues: issues,
      warnings: warnings,
      cleanedNumber: cleaned
    };
  }

  // Verhoeff algorithm for Aadhaar validation
  verhoeffCheck(num) {
    const d = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];

    const p = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];

    let c = 0;
    const myArray = num.split('').reverse();

    for (let i = 0; i < myArray.length; i++) {
      c = d[c][p[(i % 8)][parseInt(myArray[i])]];
    }

    return c === 0;
  }

  // Extract Aadhaar number from text
  extractAadhaarNumber(text, strictMode = false) {
    const patterns = [
      /\b(\d{4}\s?\d{4}\s?\d{4})\b/g,
      /\b(\d{12})\b/g
    ];

    const foundNumbers = [];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const validation = this.validateAadhaarNumber(match, strictMode);
          if (validation.isValid) {
            return validation.cleanedNumber;
          }
          // In non-strict mode, collect all 12-digit numbers
          if (!strictMode && validation.cleanedNumber.length === 12) {
            foundNumbers.push({
              number: validation.cleanedNumber,
              issues: validation.issues
            });
          }
        }
      }
    }

    // In non-strict mode, return the first 12-digit number even if it has warnings
    if (!strictMode && foundNumbers.length > 0) {
      console.log('⚠️ Using first found 12-digit number (non-strict mode):', foundNumbers[0].number);
      return foundNumbers[0].number;
    }

    return null;
  }

  // Extract name from Aadhaar - handles single names and various formats
  extractName(text) {
    console.log('🔍 Extracting name from Aadhaar text...');

    // First, try to find common Indian names directly
    const commonNames = [
      'Siddharth', 'Sidharth', 'Rahul', 'Amit', 'Priya', 'Neha', 'Raj', 'Arun', 'Vijay',
      'Akshat', 'Arjun', 'Rohan', 'Karan', 'Varun', 'Nikhil', 'Ankit', 'Mohit', 'Rohit',
      'Deepak', 'Suresh', 'Ramesh', 'Mahesh', 'Ganesh', 'Rajesh', 'Mukesh', 'Dinesh',
      'Sanjay', 'Ajay', 'Ravi', 'Sunil', 'Anil', 'Manoj', 'Vinod', 'Pramod',
      'Ashok', 'Alok', 'Vivek', 'Abhishek', 'Manish', 'Satish', 'Girish', 'Harish',
      'Pankaj', 'Neeraj', 'Saurabh', 'Gaurav', 'Vishal', 'Kunal', 'Sumit', 'Puneet',
      'Aarav', 'Vihaan', 'Aditya', 'Aryan', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
      'Pooja', 'Anjali', 'Sneha', 'Divya', 'Kavita', 'Sunita', 'Anita', 'Rekha',
      'Meena', 'Seema', 'Geeta', 'Sita', 'Radha', 'Lakshmi', 'Sarita', 'Mamta',
      'Shweta', 'Preeti', 'Ritu', 'Nisha', 'Asha', 'Usha', 'Aadhya', 'Ananya',
      'Prakash', 'Ranjan', 'Kumar', 'Singh', 'Sharma', 'Verma', 'Gupta', 'Jain', 'Agarwal', 'Patel'
    ];

    for (const name of commonNames) {
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      if (regex.test(text)) {
        console.log('✅ Found common name:', name);
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      }
    }

    const patterns = [
      // Single English name after Hindi name (like "सिद्धार्थ\nSiddharth")
      /[ऀ-ॿ]+[\s\n]+([A-Z][a-z]+)(?:\s*\n|\s+(?:जन्म|DOB|MALE|FEMALE))/i,

      // Name on its own line before DOB line
      /\n([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\n.*(?:DOB|जन्म)/i,

      // English name followed by DOB pattern
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:\n|जन्म\s*तिथि|DOB)/i,

      // Pattern for name before MALE/FEMALE
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\n.*(?:MALE|FEMALE|पुरुष|महिला)/i,

      // Standard name field patterns
      /(?:NAME|NAME\s*OF\s*HOLDER)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,

      // Pattern for "To" field
      /To\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,

      // Pattern for name before S/O, D/O, W/O
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:S\/O|D\/O|W\/O|C\/O)/i,

      // Single capitalized word that looks like a name (at least 4 chars)
      /\b([A-Z][a-z]{3,})\b(?=\s*\n|\s+(?:DOB|MALE|FEMALE|जन्म))/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let name = match[1].trim();
        name = name.replace(/\s+/g, ' ');

        // Remove Aadhaar header text prefixes
        const headerPrefixes = [
          'ARE TR GOVERNMENT OF INDIA',
          'GOVERNMENT OF INDIA',
          'ARE TR',
          'GOVT OF INDIA',
          'GOVT',
          'INDIA'
        ];

        for (const prefix of headerPrefixes) {
          if (name.toUpperCase().startsWith(prefix)) {
            name = name.substring(prefix.length).trim();
          }
        }

        console.log('Found potential name:', name);

        // Validate name
        if (name.length >= 3 && name.length <= 50) {
          const excludeWords = ['GOVERNMENT', 'INDIA', 'AADHAAR', 'AADHAR', 'AUTHORITY', 'UNIQUE', 'ENROLLMENT', 'MALE', 'FEMALE', 'ISSUED', 'DOWNLOAD', 'DATE', 'ISSUE', 'YEAR', 'YEARS', 'HELP', 'UIDAI', 'VID'];
          // Must have at least one vowel
          if (!excludeWords.some(word => name.toUpperCase() === word) && /[aeiouAEIOU]/.test(name)) {
            console.log('✅ Valid name found:', name);
            return name;
          }
        }
      }
    }

    // Last resort: find any capitalized word that's 4+ chars, has vowels, and not a common word
    const words = text.match(/\b[A-Z][a-z]{3,}\b/g);
    if (words) {
      const excludeWords = ['Government', 'India', 'Aadhaar', 'Aadhar', 'Authority', 'Unique', 'Enrollment', 'Male', 'Female', 'Issued', 'Download', 'Date', 'Issue', 'Birth', 'Year', 'Years', 'Help'];
      for (const word of words) {
        if (!excludeWords.includes(word) && word.length >= 4 && /[aeiouAEIOU]/.test(word)) {
          console.log('✅ Found name (last resort):', word);
          return word;
        }
      }
    }

    console.log('❌ No valid name found');
    return null;
  }

  // Extract DOB from Aadhaar - handles various formats including Hindi labels
  extractDOB(text) {
    console.log('🔍 Extracting DOB from Aadhaar text...');

    const patterns = [
      // Hindi + English DOB label: "जन्म तिथि/DOB: 07/07/2008"
      /(?:जन्म\s*तिथि\s*[\/\\]?\s*)?DOB\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,

      // Just Hindi label
      /जन्म\s*तिथि\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,

      // Standard DOB patterns
      /(?:DATE\s*OF\s*BIRTH|BIRTH\s*DATE|D\.O\.B\.?)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,

      // Year of birth
      /(?:YEAR\s*OF\s*BIRTH|YOB)\s*[:\-]?\s*(\d{4})/i,

      // Date pattern near DOB keyword
      /DOB[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,

      // Any date in DD/MM/YYYY format (last resort)
      /\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        console.log('✅ Found DOB:', match[1]);
        return match[1];
      }
    }

    console.log('❌ No DOB found');
    return null;
  }

  // Calculate age from DOB
  calculateAge(dob) {
    if (!dob) return null;

    try {
      // Parse date in DD/MM/YYYY or DD-MM-YYYY format
      const parts = dob.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);

        // Handle 2-digit years
        const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;

        const birthDate = new Date(fullYear, month, day);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        return age > 0 && age < 120 ? age : null;
      }
    } catch (error) {
      console.error('Error calculating age:', error);
    }

    return null;
  }

  // Extract gender from Aadhaar
  extractGender(text) {
    const cleanText = text.toUpperCase();

    if (/\bMALE\b/.test(cleanText) && !/\bFEMALE\b/.test(cleanText)) {
      return 'Male';
    } else if (/\bFEMALE\b/.test(cleanText)) {
      return 'Female';
    }

    return null;
  }

  // Validate Aadhaar document authenticity
  validateDocument(text, extractedData, strictMode = false) {
    const issues = [];
    const warnings = [];

    // Check text length
    if (text.length < 30) {
      if (strictMode) {
        issues.push('Document text too short');
      } else {
        warnings.push('Document text too short');
      }
    }

    // Check for Aadhaar number (CRITICAL - always required)
    if (!extractedData.aadhaarNumber) {
      issues.push('No valid Aadhaar number found');
    }

    // Check for name (relaxed in dev mode)
    if (!extractedData.name) {
      if (strictMode) {
        issues.push('Name not found');
      } else {
        warnings.push('Name not found in document');
      }
    }

    // Check for DOB or Gender (relaxed in dev mode)
    if (!extractedData.dob && !extractedData.gender) {
      if (strictMode) {
        issues.push('Missing DOB and Gender - document may be incomplete');
      } else {
        warnings.push('Missing DOB and Gender - document may be incomplete');
      }
    }

    // Check for Aadhaar-specific keywords (relaxed in dev mode)
    const aadhaarKeywords = ['AADHAAR', 'AADHAR', 'UIDAI', 'GOVERNMENT OF INDIA', 'GOVERNMENT', 'INDIA'];
    const hasKeywords = aadhaarKeywords.some(keyword => text.toUpperCase().includes(keyword));
    if (!hasKeywords) {
      if (strictMode) {
        issues.push('Missing Aadhaar-specific keywords');
      } else {
        warnings.push('Missing Aadhaar-specific keywords');
      }
    }

    // Check for blur (warning only)
    if (text.length < 100 && extractedData.aadhaarNumber) {
      warnings.push('Document may be blurry or low quality');
    }

    return {
      isValid: issues.length === 0,
      issues: issues,
      warnings: warnings,
      confidence: Math.max(0, 100 - (issues.length * 20) - (warnings.length * 5))
    };
  }

  // Main parse method
  parse(text, strictMode = false) {
    const dob = this.extractDOB(text);
    const age = this.calculateAge(dob);

    const extracted = {
      aadhaarNumber: this.extractAadhaarNumber(text, strictMode),
      name: this.extractName(text),
      dob: dob,
      age: age,
      gender: this.extractGender(text)
    };

    const validation = this.validateDocument(text, extracted, strictMode);

    console.log('📋 Extracted Aadhaar data:', {
      number: extracted.aadhaarNumber,
      name: extracted.name,
      dob: extracted.dob,
      age: extracted.age,
      gender: extracted.gender
    });

    return {
      ...extracted,
      validation,
      rawText: text
    };
  }
}

module.exports = new AadhaarValidator();
