const path = require('path');

// Load comprehensive Indian names dataset (3,276 first names + 925 surnames)
const indianNames = require('./indianNames.json');
const FIRST_NAMES_SET = new Set(indianNames.firstNames.map(n => n.toLowerCase()));
const SURNAMES_SET = new Set(indianNames.surnames.map(n => n.toLowerCase()));

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

  // Clean OCR text by removing institutional/header garbage before name extraction
  cleanOCRText(text) {
    let cleaned = text;

    // Remove common Aadhaar header text (with fuzzy OCR spelling variants)
    const headerPatterns = [
      /\b(?:ARE\s+TR|HRE\s+HOR|HRE|HOR)\b/gi,
      /\bGov[eé]?[mr]n?m?e?nt\s+of\s+[Ii]ndia\b/gi,    // Govemment, Government, etc.
      /\bGOVERNMENT\s+OF\s+INDIA\b/gi,
      /\bGOVT\.?\s+OF\s+INDIA\b/gi,
      /\bUNIQUE\s+IDENTIFICATION\s+AUTHORITY\b/gi,
      /\bUIDAI\b/gi,
      /\bAADHAAR\b/gi,
      /\bAADHAR\b/gi,
      /\b(?:mera\s+)?aadhaar\b/gi,
      /\benroll(?:ment)?\s+no\.?\b/gi,
    ];

    for (const pattern of headerPatterns) {
      cleaned = cleaned.replace(pattern, ' ');
    }

    return cleaned;
  }

  // Check if a word looks like OCR garbage (all caps, no vowels, random short strings)
  isOCRGarbage(word) {
    const lower = word.toLowerCase();

    // Known institutional/non-name words
    const excludeWords = [
      'government', 'govemment', 'india', 'aadhaar', 'aadhar', 'authority',
      'unique', 'enrollment', 'male', 'female', 'issued', 'download',
      'date', 'issue', 'year', 'years', 'help', 'uidai', 'vid', 'dob',
      'birth', 'address', 'the', 'and', 'for', 'has', 'been', 'your',
      'govt', 'are', 'hre', 'hor', 'sir', 'sire'
    ];
    if (excludeWords.includes(lower)) return true;

    // ALL-CAPS words 2-4 chars that have no vowels or look like gibberish
    if (word.length <= 4 && word === word.toUpperCase() && !/[aeiouAEIOU]/.test(word)) return true;

    // Very short words (1-2 chars) that aren't common name parts
    const allowedShortWords = ['om', 'aj', 'al'];
    if (word.length <= 2 && !allowedShortWords.includes(lower)) return true;

    // Common OCR transliteration noise (Hindi artifacts)
    const ocrNoise = ['sire', 'fe', 'si', 're', 'de', 'le', 'se', 'te', 'ne', 'ke', 'pe', 'be', 'ge', 'he', 'je', 'we', 'ye', 'ze', 'hre', 'hor', 'tre', 'thr'];
    if (ocrNoise.includes(lower)) return true;

    return false;
  }

  // Extract name from Aadhaar - handles single names and various formats
  extractName(text) {
    console.log('🔍 Extracting name from Aadhaar text...');

    // Step 1: Pre-clean the OCR text to remove institutional headers and noise
    const cleanedText = this.cleanOCRText(text);
    console.log('🧹 Cleaned OCR text for name extraction');

    // Step 2: Use comprehensive Indian names dataset (3,276 first names + 925 surnames)
    // Extract all words from the cleaned text and match against known names using Set lookup (O(1))
    const textWords = cleanedText.match(/\b[A-Za-z]{2,}\b/g) || [];

    // Strategy A: Find consecutive words where first is a known first name and second is a known surname
    for (let i = 0; i < textWords.length - 1; i++) {
      const word1 = textWords[i].toLowerCase();
      const word2 = textWords[i + 1].toLowerCase();

      if (FIRST_NAMES_SET.has(word1) && SURNAMES_SET.has(word2)) {
        // Check for a third word (some names have 3 parts, e.g., "Ram Prasad Sharma")
        let fullName = textWords[i].charAt(0).toUpperCase() + textWords[i].slice(1).toLowerCase()
          + ' ' + textWords[i + 1].charAt(0).toUpperCase() + textWords[i + 1].slice(1).toLowerCase();
        if (i + 2 < textWords.length && SURNAMES_SET.has(textWords[i + 2].toLowerCase())) {
          fullName += ' ' + textWords[i + 2].charAt(0).toUpperCase() + textWords[i + 2].slice(1).toLowerCase();
        }
        console.log('✅ Found full name (first + surname):', fullName);
        return fullName;
      }
    }

    // Strategy B: Find a known first name followed by any capitalized word as potential surname
    for (let i = 0; i < textWords.length - 1; i++) {
      const word1 = textWords[i].toLowerCase();
      if (FIRST_NAMES_SET.has(word1) && !this.isOCRGarbage(textWords[i])) {
        const nextWord = textWords[i + 1];
        if (nextWord && /^[A-Z]/.test(nextWord) && !this.isOCRGarbage(nextWord) && nextWord.length >= 3) {
          const fullName = textWords[i].charAt(0).toUpperCase() + textWords[i].slice(1).toLowerCase()
            + ' ' + nextWord.charAt(0).toUpperCase() + nextWord.slice(1).toLowerCase();
          console.log('✅ Found name (known first + following word):', fullName);
          return fullName;
        }
        // Return just the first name if no valid surname follows
        const singleName = textWords[i].charAt(0).toUpperCase() + textWords[i].slice(1).toLowerCase();
        console.log('✅ Found known first name:', singleName);
        return singleName;
      }
    }

    // Strategy C: Find any known surname that might appear as a standalone identifier
    for (const word of textWords) {
      if (SURNAMES_SET.has(word.toLowerCase()) && !this.isOCRGarbage(word) && word.length >= 4) {
        console.log('✅ Found known surname as name:', word);
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
    }


    // Step 3: Regex-based extraction from cleaned text
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
      const match = cleanedText.match(pattern);
      if (match) {
        let name = match[1].trim();
        name = name.replace(/\s+/g, ' ');

        // Filter out garbage words from the extracted name
        const nameWords = name.split(/\s+/);
        const cleanedWords = nameWords.filter(word => !this.isOCRGarbage(word));

        if (cleanedWords.length > 0) {
          name = cleanedWords.join(' ');
        }

        if (cleanedWords.length > 0) {
          console.log('🧹 Cleaned name:', nameWords.join(' '), '→', name);
        }

        console.log('Found potential name:', name);

        // Validate name
        if (name.length >= 2 && name.length <= 50) {
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

    // Priority 1: DOB with explicit label (most reliable)
    const labeledPatterns = [
      // Hindi + English DOB label: "जन्म तिथि/DOB: 07/07/2008"
      /(?:जन्म\s*तिथि\s*[\/\\]?\s*)?DOB\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,

      // Just Hindi label
      /जन्म\s*तिथि\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,

      // Standard DOB patterns
      /(?:DATE\s*OF\s*BIRTH|BIRTH\s*DATE|D\.O\.B\.?)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,

      // Date pattern near DOB keyword
      /DOB[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
    ];

    for (const pattern of labeledPatterns) {
      const match = text.match(pattern);
      if (match) {
        const age = this.calculateAge(match[1]);
        // Accept labeled DOB if age is plausible (1-120)
        if (age !== null && age >= 1 && age <= 120) {
          console.log('✅ Found DOB (labeled):', match[1], '→ age:', age);
          return match[1];
        }
        console.log('⚠️ Labeled DOB found but age implausible:', match[1], '→ age:', age);
      }
    }

    // Priority 2: Year of birth
    const yobMatch = text.match(/(?:YEAR\s*OF\s*BIRTH|YOB)\s*[:\-]?\s*(\d{4})/i);
    if (yobMatch) {
      console.log('✅ Found Year of Birth:', yobMatch[1]);
      return yobMatch[1];
    }

    // Priority 3: Last resort - find ALL dates in DD/MM/YYYY format,
    // then pick the one that gives the most plausible age for a person
    const allDatesRegex = /\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/g;
    const allDates = [];
    let dateMatch;

    // Also collect nearby context to exclude issue/download dates
    const excludeContexts = /(?:issue|download|print|generated|valid|expiry|vid)/i;

    while ((dateMatch = allDatesRegex.exec(text)) !== null) {
      const dateStr = dateMatch[1];
      const age = this.calculateAge(dateStr);
      // Get ~40 chars before the date for context
      const contextStart = Math.max(0, dateMatch.index - 40);
      const context = text.substring(contextStart, dateMatch.index);
      const isExcluded = excludeContexts.test(context);

      allDates.push({ dateStr, age, context: context.trim(), isExcluded });
    }

    if (allDates.length > 0) {
      console.log('📅 All dates found:', allDates.map(d => `${d.dateStr} (age: ${d.age}, excluded: ${d.isExcluded})`));

      // Filter to plausible ages (5-100) and non-excluded
      const plausible = allDates.filter(d => d.age !== null && d.age >= 5 && d.age <= 100 && !d.isExcluded);

      if (plausible.length > 0) {
        // Prefer ages in the 10-80 range (most common for Aadhaar holders)
        const bestMatch = plausible.sort((a, b) => {
          // Prefer ages closer to the "normal" range center (~30)
          const aScore = Math.abs(a.age - 30);
          const bScore = Math.abs(b.age - 30);
          return aScore - bScore;
        })[0];
        console.log('✅ Found DOB (best match):', bestMatch.dateStr, '→ age:', bestMatch.age);
        return bestMatch.dateStr;
      }

      // If all are excluded or implausible, try any non-excluded date
      const nonExcluded = allDates.filter(d => d.age !== null && d.age >= 1 && d.age <= 120 && !d.isExcluded);
      if (nonExcluded.length > 0) {
        console.log('✅ Found DOB (fallback):', nonExcluded[0].dateStr, '→ age:', nonExcluded[0].age);
        return nonExcluded[0].dateStr;
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
        let year = parseInt(parts[2]);

        // Handle 2-digit years
        if (year < 100) {
          year = year > 50 ? 1900 + year : 2000 + year;
        }

        // Basic date validation
        if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > new Date().getFullYear()) {
          return null;
        }

        const birthDate = new Date(year, month, day);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        return age >= 0 && age < 120 ? age : null;
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
