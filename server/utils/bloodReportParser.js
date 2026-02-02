class BloodReportParser {
  
  // Extract blood group from text - ULTIMATE UNIVERSAL VERSION
  // Handles EVERY possible format from any hospital/lab worldwide
  extractBloodGroup(text) {
    const originalText = text;
    const cleanText = text.replace(/\s+/g, ' ').toUpperCase();
    
    console.log('🔍 Blood Group Search - Analyzing text...');
    console.log('📄 Text length:', text.length, 'characters');
    
    // ============================================
    // STEP -1: Check for "Final Blood Group" pattern (common in lab reports)
    // ============================================
    console.log('🔍 Checking for Final Blood Group pattern...');
    
    const finalBGPatterns = [
      /FINAL\s*BLOOD\s*GROUP\s*[:\|\s]*([ABO]{1,2})\s*([+\-])/i,
      /FINAL\s*BLOOD\s*GROUP\s*[:\|\s]*(A\+|A\-|B\+|B\-|O\+|O\-|AB\+|AB\-)/i,
      /BLOOD\s*GROUP\s*[:\|\s]*FINAL\s*[:\|\s]*(A\+|A\-|B\+|B\-|O\+|O\-|AB\+|AB\-)/i,
    ];
    
    for (const pattern of finalBGPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let bloodGroup;
        if (match[2]) {
          bloodGroup = match[1].toUpperCase() + match[2];
        } else {
          bloodGroup = match[1].toUpperCase();
        }
        console.log('✓ Found Final Blood Group:', bloodGroup);
        if (this.isValidBloodGroup(bloodGroup)) {
          return bloodGroup;
        }
      }
    }

    // ============================================
    // STEP 0: Special handling for separate ABO + Rh Factor lines
    // ============================================
    // Format: "ABO Group: A" on one line, "Rh Factor: Positive" on another
    console.log('🔍 Step 0: Checking for separate ABO + Rh lines...');
    
    const aboMatch = cleanText.match(/ABO\s*(?:BLOOD\s*)?GROUP\s*[:\|\-=]?\s*([ABO]{1,2})\b/i);
    const rhMatch = cleanText.match(/RH\s*(?:\(D\)\s*)?FACTOR\s*[:\|\-=]?\s*(POSITIVE|NEGATIVE|POS|NEG|\+VE|\-VE|\(\+\)|\(\-\)|\+|\-)/i);
    
    console.log('  ABO Match:', aboMatch ? aboMatch[0] : 'Not found');
    console.log('  Rh Match:', rhMatch ? rhMatch[0] : 'Not found');
    
    if (aboMatch && rhMatch) {
      const aboType = aboMatch[1].toUpperCase();
      const rhType = rhMatch[1].toUpperCase();
      
      console.log('  ABO Type:', aboType);
      console.log('  Rh Type:', rhType);
      
      let bloodGroup = aboType;
      if (rhType.includes('POS') || rhType.includes('+')) {
        bloodGroup += '+';
      } else if (rhType.includes('NEG') || rhType.includes('-')) {
        bloodGroup += '-';
      }
      
      console.log('✓ Found with separate ABO + Rh lines:', bloodGroup);
      if (this.isValidBloodGroup(bloodGroup)) {
        return bloodGroup;
      } else {
        console.log('  ✗ Invalid blood group format:', bloodGroup);
      }
    }
    
    // Also check for just ABO Group without explicit Rh, but Rh mentioned elsewhere
    if (aboMatch) {
      const aboType = aboMatch[1].toUpperCase();
      console.log('  Found ABO Group alone:', aboType);
      
      // Look for Positive/Negative anywhere NEAR the ABO Group (within 200 chars)
      const aboIndex = cleanText.indexOf(aboMatch[0]);
      const contextWindow = cleanText.substring(Math.max(0, aboIndex - 100), Math.min(cleanText.length, aboIndex + 200));
      
      console.log('  Context window:', contextWindow);
      
      if (/\bPOSITIVE\b/i.test(contextWindow) || /\bPOS\b/i.test(contextWindow) || /\+VE\b/i.test(contextWindow)) {
        const bloodGroup = aboType + '+';
        console.log('✓ Found ABO Group with Positive indicator nearby:', bloodGroup);
        if (this.isValidBloodGroup(bloodGroup)) {
          return bloodGroup;
        }
      } else if (/\bNEGATIVE\b/i.test(contextWindow) || /\bNEG\b/i.test(contextWindow) || /\-VE\b/i.test(contextWindow)) {
        const bloodGroup = aboType + '-';
        console.log('✓ Found ABO Group with Negative indicator nearby:', bloodGroup);
        if (this.isValidBloodGroup(bloodGroup)) {
          return bloodGroup;
        }
      }
      
      // If no Rh found nearby, look in full text as last resort
      if (/\bPOSITIVE\b/i.test(cleanText) || /\bPOS\b/i.test(cleanText)) {
        const bloodGroup = aboType + '+';
        console.log('✓ Found ABO Group with Positive in full text:', bloodGroup);
        if (this.isValidBloodGroup(bloodGroup)) {
          return bloodGroup;
        }
      } else if (/\bNEGATIVE\b/i.test(cleanText) || /\bNEG\b/i.test(cleanText)) {
        const bloodGroup = aboType + '-';
        console.log('✓ Found ABO Group with Negative in full text:', bloodGroup);
        if (this.isValidBloodGroup(bloodGroup)) {
          return bloodGroup;
        }
      }
    }
    
    // ============================================
    // STEP 1: Context-based patterns (most reliable)
    // ============================================
    const contextPatterns = [
      // Standard formats
      /BLOOD\s*GROUP\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i,
      /BLOOD\s*TYPE\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i,
      /GROUP\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i,
      /ABO\s*GROUP\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i,
      /ABO\s*TYPE\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i,
      /ABO\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i,
      
      // Result/Value formats
      /RESULT\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i,
      /VALUE\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i,
      /FINDING\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i,
      /OBSERVATION\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i,
      
      // International formats
      /GROUPE\s*SANGUIN\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i, // French
      /GRUPO\s*SANGUINEO\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i, // Spanish
      /BLUTGRUPPE\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i, // German
      
      // Rh factor formats
      /RH\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i,
      /RHESUS\s*[:\-=]?\s*([ABO]{1,2}\s*[+\-])/i,
    ];
    
    for (const pattern of contextPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let bloodGroup = match[1].toUpperCase().replace(/\s+/g, '');
        console.log('✓ Found with context pattern:', bloodGroup);
        if (this.isValidBloodGroup(bloodGroup)) {
          return bloodGroup;
        }
      }
    }
    
    // ============================================
    // STEP 2: Text-based formats (POSITIVE/NEGATIVE)
    // ============================================
    const textFormats = [
      // Full text
      { pattern: /\b(AB|A|B|O)\s*POSITIVE\b/i, suffix: '+' },
      { pattern: /\b(AB|A|B|O)\s*NEGATIVE\b/i, suffix: '-' },
      
      // Abbreviated
      { pattern: /\b(AB|A|B|O)\s*POS\b/i, suffix: '+' },
      { pattern: /\b(AB|A|B|O)\s*NEG\b/i, suffix: '-' },
      
      // With VE
      { pattern: /\b(AB|A|B|O)\s*\+VE\b/i, suffix: '+' },
      { pattern: /\b(AB|A|B|O)\s*\-VE\b/i, suffix: '-' },
      { pattern: /\b(AB|A|B|O)\s*\+IVE\b/i, suffix: '+' },
      { pattern: /\b(AB|A|B|O)\s*\-IVE\b/i, suffix: '-' },
      
      // With parentheses
      { pattern: /\b(AB|A|B|O)\s*\(\s*POSITIVE\s*\)/i, suffix: '+' },
      { pattern: /\b(AB|A|B|O)\s*\(\s*NEGATIVE\s*\)/i, suffix: '-' },
      { pattern: /\b(AB|A|B|O)\s*\(\s*\+\s*\)/i, suffix: '+' },
      { pattern: /\b(AB|A|B|O)\s*\(\s*\-\s*\)/i, suffix: '-' },
    ];
    
    for (const format of textFormats) {
      const match = cleanText.match(format.pattern);
      if (match) {
        const bloodGroup = match[1].toUpperCase() + format.suffix;
        console.log('✓ Found with text format:', bloodGroup);
        if (this.isValidBloodGroup(bloodGroup)) {
          return bloodGroup;
        }
      }
    }
    
    // ============================================
    // STEP 3: Standalone symbols (A+, B-, etc.)
    // ============================================
    const validGroups = ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'];
    
    for (const group of validGroups) {
      // Exact match with word boundaries
      const exactRegex = new RegExp(`\\b${group.replace('+', '\\+').replace('-', '\\-')}\\b`, 'i');
      if (exactRegex.test(cleanText)) {
        console.log('✓ Found exact standalone:', group);
        return group;
      }
      
      // With spaces around symbol
      const spacedVariations = [
        group.replace('+', ' +').replace('-', ' -'),
        group.replace('+', ' + ').replace('-', ' - '),
        group.replace('+', '+ ').replace('-', '- '),
      ];
      
      for (const variation of spacedVariations) {
        if (cleanText.includes(variation)) {
          console.log('✓ Found with spacing:', group);
          return group;
        }
      }
    }
    
    // ============================================
    // STEP 4: Aggressive pattern matching
    // ============================================
    const aggressivePatterns = [
      // Standard
      /(AB|A|B|O)\s*([+\-])/gi,
      
      // With various separators
      /(AB|A|B|O)[\s\.\,\:\-]*([+\-])/gi,
      
      // Across lines/breaks
      /(AB|A|B|O)[\s\n\r\t]*([+\-])/gi,
      
      // With unicode characters
      /(AB|A|B|O)[\s\u00A0\u2000-\u200B]*([+\-])/gi,
    ];
    
    for (const pattern of aggressivePatterns) {
      const matches = [...cleanText.matchAll(pattern)];
      for (const match of matches) {
        const bloodGroup = (match[1] + match[2]).toUpperCase();
        if (this.isValidBloodGroup(bloodGroup)) {
          console.log('✓ Found with aggressive pattern:', bloodGroup);
          return bloodGroup;
        }
      }
    }
    
    // ============================================
    // STEP 5: Character-by-character scan
    // ============================================
    console.log('🔍 Performing character-by-character scan...');
    
    const bloodLetters = ['AB', 'A', 'B', 'O'];
    const symbols = ['+', '-'];
    
    for (let i = 0; i < cleanText.length - 1; i++) {
      for (const letter of bloodLetters) {
        // Check if current position matches blood letter
        if (cleanText.substr(i, letter.length) === letter) {
          // Look ahead for + or - within next 5 characters
          for (let j = i + letter.length; j < Math.min(i + letter.length + 5, cleanText.length); j++) {
            if (symbols.includes(cleanText[j])) {
              const bloodGroup = letter + cleanText[j];
              if (this.isValidBloodGroup(bloodGroup)) {
                console.log('✓ Found with character scan:', bloodGroup, 'at position', i);
                return bloodGroup;
              }
            }
          }
        }
      }
    }
    
    // ============================================
    // STEP 6: Reverse scan (symbol first)
    // ============================================
    console.log('🔍 Performing reverse scan (symbol first)...');
    
    for (let i = 0; i < cleanText.length; i++) {
      if (symbols.includes(cleanText[i])) {
        // Look backward for blood letter within previous 5 characters
        for (let j = Math.max(0, i - 5); j < i; j++) {
          for (const letter of bloodLetters) {
            if (cleanText.substr(j, letter.length) === letter) {
              const bloodGroup = letter + cleanText[i];
              if (this.isValidBloodGroup(bloodGroup)) {
                console.log('✓ Found with reverse scan:', bloodGroup);
                return bloodGroup;
              }
            }
          }
        }
      }
    }
    
    // ============================================
    // STEP 7: OCR error correction
    // ============================================
    console.log('🔍 Checking for OCR errors...');
    
    // Common OCR mistakes
    const ocrCorrections = {
      '0': 'O', // Zero to O
      'l': 'I', // lowercase L to I
      '1': 'I', // One to I
      '8': 'B', // Eight to B
    };
    
    let correctedText = cleanText;
    for (const [wrong, correct] of Object.entries(ocrCorrections)) {
      correctedText = correctedText.replace(new RegExp(wrong, 'g'), correct);
    }
    
    if (correctedText !== cleanText) {
      console.log('🔧 Trying with OCR corrections...');
      // Try all patterns again with corrected text
      const simplePattern = /(AB|A|B|O)\s*([+\-])/gi;
      const matches = [...correctedText.matchAll(simplePattern)];
      for (const match of matches) {
        const bloodGroup = (match[1] + match[2]).toUpperCase();
        if (this.isValidBloodGroup(bloodGroup)) {
          console.log('✓ Found after OCR correction:', bloodGroup);
          return bloodGroup;
        }
      }
    }
    
    // ============================================
    // STEP 8: Last resort - find any valid pattern
    // ============================================
    console.log('🔍 Last resort search...');
    
    for (const group of validGroups) {
      // Remove all spaces and special chars, then search
      const stripped = cleanText.replace(/[^A-Z0-9+\-]/g, '');
      if (stripped.includes(group)) {
        console.log('✓ Found in stripped text:', group);
        return group;
      }
    }
    
    console.log('✗ No blood group found after exhaustive search');
    console.log('📄 Full text for debugging:');
    console.log(cleanText);
    console.log('=====================================');
    return null;
  }
  
  // Validate blood group
  isValidBloodGroup(bloodGroup) {
    const valid = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    return valid.includes(bloodGroup);
  }
  
  // Extract name - handles table formats like "Name | Akshat Kumar"
  extractName(text) {
    const patterns = [
      // Table format with pipe separator
      /\bNAME\s*[\|\:\-\s]+\s*([A-Za-z][A-Za-z\s\.]+?)(?:\n|\r|$|Gender|Date|Age|\|)/i,
      // Standard formats
      /(?:PATIENT\s*NAME|NAME\s*OF\s*PATIENT)\s*[:\-\|]?\s*([A-Za-z][A-Za-z\s\.]+)/i,
      /(?:NAME)\s*[:\-\|]?\s*([A-Za-z][A-Za-z\s\.]+)/i,
      // With titles
      /(?:MR\.|MRS\.|MS\.)\s*([A-Za-z][A-Za-z\s\.]+)/i,
      // Patient: Name format
      /PATIENT\s*[:\-\|]?\s*([A-Za-z][A-Za-z\s\.]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let name = match[1].trim();
        // Clean up - remove trailing words that aren't part of name
        name = name.replace(/\s*(Male|Female|Gender|Date|Age|Years|Yrs).*$/i, '').trim();
        // Validate it looks like a name (2+ chars, not just numbers)
        if (name.length >= 2 && /[A-Za-z]{2,}/.test(name)) {
          console.log('✓ Found name:', name);
          return name;
        }
      }
    }
    
    return null;
  }
  
  // Extract age - handles table formats like "Age | 21 Years"
  extractAge(text) {
    const patterns = [
      // Table format with pipe separator
      /\bAGE\s*[\|\:\-\s]+\s*(\d{1,3})\s*(?:YEARS?|YRS?|Y)?/i,
      // Standard formats
      /AGE\s*[:\-\|]?\s*(\d{1,3})\s*(?:YEARS?|YRS?|Y)?/i,
      /AGE\s*\/\s*SEX\s*[:\-\|]?\s*(\d{1,3})/i,
      // Years format
      /(\d{1,3})\s*(?:YEARS?|YRS)\s*(?:OLD)?/i,
      // Age in brackets
      /\(\s*(\d{1,3})\s*(?:Y|YRS?|YEARS?)?\s*\)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const age = parseInt(match[1]);
        if (age > 0 && age < 120) {
          console.log('✓ Found age:', age);
          return age;
        }
      }
    }
    
    return null;
  }
  
  // Extract gender
  extractGender(text) {
    const cleanText = text.toUpperCase();
    
    if (/\bMALE\b/.test(cleanText) && !/\bFEMALE\b/.test(cleanText)) {
      return 'Male';
    } else if (/\bFEMALE\b/.test(cleanText)) {
      return 'Female';
    } else if (/\bM\b/.test(cleanText) && !/\bF\b/.test(cleanText)) {
      return 'Male';
    } else if (/\bF\b/.test(cleanText)) {
      return 'Female';
    }
    
    return null;
  }
  
  // Extract hospital/lab name
  extractHospitalName(text) {
    const patterns = [
      /(?:HOSPITAL|CLINIC|LAB|LABORATORY|DIAGNOSTIC|CENTRE|CENTER)\s*[:\-]?\s*([A-Z][A-Z\s&\.]+)/i,
      /([A-Z][A-Z\s&\.]+)\s*(?:HOSPITAL|CLINIC|LAB|LABORATORY|DIAGNOSTIC)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    // Try to get first line as hospital name
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length > 5 && firstLine.length < 100) {
        return firstLine;
      }
    }
    
    return null;
  }
  
  // Extract report date
  extractReportDate(text) {
    const patterns = [
      /(?:DATE|REPORT\s*DATE|COLLECTION\s*DATE)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }
  
  // Extract phone number
  extractPhone(text) {
    const patterns = [
      /(?:PHONE|MOBILE|CONTACT|TEL)\s*[:\-]?\s*(\+?\d[\d\s\-]{8,15})/i,
      /(\+?\d{10,15})/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].replace(/\s+/g, '');
      }
    }
    
    return null;
  }
  
  // Validate blood report authenticity
  validateReport(text, extractedData, strictMode = false) {
    const issues = [];
    const warnings = [];
    
    // Check if text is too short
    if (text.length < 50) {
      if (strictMode) {
        issues.push('Report text too short - possibly incomplete');
      } else {
        warnings.push('Report text too short - possibly incomplete');
      }
    }
    
    // Check for hospital/lab presence (relaxed in dev mode)
    if (!extractedData.hospitalName) {
      if (strictMode) {
        issues.push('No hospital/lab name found');
      } else {
        warnings.push('No hospital/lab name found');
      }
    }
    
    // Check for blood group (CRITICAL - always required)
    if (!extractedData.bloodGroup) {
      issues.push('Blood group not found in report');
    }
    
    // Check for invalid blood group patterns
    const invalidPatterns = ['BB+', 'BB-', 'AA+', 'AA-', 'OO+', 'OO-', 'C+', 'C-', 'D+', 'D-'];
    if (extractedData.bloodGroup && invalidPatterns.includes(extractedData.bloodGroup)) {
      issues.push('Invalid blood group detected: ' + extractedData.bloodGroup);
    }
    
    // Check for medical terminology (relaxed in dev mode)
    const medicalTerms = ['HAEMATOLOGY', 'HEMOGLOBIN', 'HEMATOLOGY', 'RBC', 'WBC', 'PLATELET', 'BLOOD', 'REPORT', 'TEST', 'RESULT', 'PATIENT', 'HOSPITAL', 'LAB', 'LABORATORY'];
    const hasTerms = medicalTerms.some(term => text.toUpperCase().includes(term));
    if (!hasTerms) {
      if (strictMode) {
        issues.push('Missing medical terminology - may not be a blood report');
      } else {
        warnings.push('Missing medical terminology - may not be a blood report');
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      warnings: warnings,
      confidence: Math.max(0, 100 - (issues.length * 25) - (warnings.length * 5))
    };
  }
  
  // Main parse method
  parse(text, strictMode = false) {
    console.log('📋 Parsing blood report (strict mode:', strictMode, ')');
    
    const extracted = {
      bloodGroup: this.extractBloodGroup(text),
      name: this.extractName(text),
      age: this.extractAge(text),
      gender: this.extractGender(text),
      hospitalName: this.extractHospitalName(text),
      reportDate: this.extractReportDate(text),
      phone: this.extractPhone(text)
    };
    
    console.log('📋 Extracted blood group:', extracted.bloodGroup);
    
    const validation = this.validateReport(text, extracted, strictMode);
    
    return {
      ...extracted,
      validation,
      rawText: text
    };
  }
}

module.exports = new BloodReportParser();
