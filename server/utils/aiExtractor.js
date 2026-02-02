const axios = require("axios");

// External OCR engine (your existing file)
const ocrEngine = require("./ocrEngine");

class AIExtractor {
  constructor() {
    // === CONFIG ===
    this.useAI = process.env.USE_AI_EXTRACTION === "true";

    // Provider selection (groq only)
    this.provider = "groq";

    // Groq text model ONLY
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    if (!this.groqApiKey) {
      console.error("❌ GROQ_API_KEY not set");
    }
  }

  // ================================
  // 🚀 Universal AI text completion
  // ================================
  async generateText(prompt) {
    try {
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: this.groqModel,
          messages: [
            {
              role: "system",
              content:
                "You are a strict medical document analyzer. Always return clean JSON only."
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 500
        },
        {
          headers: {
            Authorization: `Bearer ${this.groqApiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      return res.data.choices[0].message.content.trim();
    } catch (err) {
      console.error("❌ Groq API error:", err.response?.data || err.message);
      throw new Error("Groq text model failed");
    }
  }

  // ================================
  // 🩸 Extract blood group from TEXT
  // ================================
  async extractBloodGroupFromText(text) {
    const prompt = `
Extract only the blood group from the text below.

Text:
${text}

Return only one of:
A+, A-, B+, B-, O+, O-, AB+, AB-
If not found, return "NOT_FOUND".

Answer:
`;

    const out = await this.generateText(prompt);
    const valid = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];

    const cleaned = out.toUpperCase().replace(/\s+/g, "");

    for (let bg of valid) {
      if (cleaned.includes(bg)) return bg;
    }

    return null;
  }

  // ======================================
  // 🔍 Extract Aadhaar number from TEXT
  // ======================================
  async extractAadhaarFromText(text) {
    const prompt = `
You are extracting information from an Indian Aadhaar card OCR text.

Text from Aadhaar card:
${text}

EXTRACTION RULES:

1. AADHAAR NUMBER:
   - 12-digit number, may have spaces like "8539 4858 7776"
   - Usually at the bottom of the card
   - Remove spaces when returning

2. NAME (VERY IMPORTANT):
   - Look for a proper Indian name in ENGLISH (not Hindi script)
   - Names are typically: Siddharth, Rahul, Amit, Priya, Akshat, Arjun, etc.
   - The name usually appears after Hindi text or on its own line
   - REJECT random letters like "ZN", "XY", "ABC" - these are OCR errors
   - A valid name must have vowels (a, e, i, o, u) and be at least 3 characters
   - If you can't find a clear name, return null

3. DATE OF BIRTH:
   - Look for "DOB:" or "जन्म तिथि/DOB:" followed by date
   - Format: DD/MM/YYYY like "07/07/2008"

4. GENDER:
   - Look for "MALE", "FEMALE", or "पुरुष/MALE", "महिला/FEMALE"

Return ONLY this JSON (no explanation):
{
  "aadhaarNumber": "853948587776",
  "name": "Siddharth",
  "dateOfBirth": "07/07/2008",
  "gender": "Male"
}

IMPORTANT: Use null for fields you cannot clearly identify. Do NOT guess or make up values.
`;

    const output = await this.generateText(prompt);
    console.log("🤖 AI Aadhaar Response:", output);

    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Clean up aadhaar number - remove spaces
        if (parsed.aadhaarNumber) {
          parsed.aadhaarNumber = parsed.aadhaarNumber.replace(/\s/g, '');
        }
        return parsed;
      }
      return null;
    } catch (err) {
      console.error("JSON parse error:", err);
      return null;
    }
  }

  // ======================================================
  // 📄 Extract blood report data from TEXT
  // ======================================================
  async extractBloodReportFromText(text) {
    const prompt = `
You are extracting information from a medical blood group test report.

Text from blood report:
${text}

EXTRACTION RULES:

1. BLOOD GROUP (MOST IMPORTANT):
   - Look for "Final Blood Group" followed by A+, A-, B+, B-, O+, O-, AB+, AB-
   - OR combine "ABO Blood Group: A/B/O/AB" with "Rh (D) Factor: Positive/Negative"
   - Positive (+) means +, Negative (-) means -
   - Example: ABO=A + Rh=Positive = A+

2. PATIENT NAME:
   - Look for "Name | Akshat Kumar" or "Name: Akshat Kumar"
   - The | symbol is a table separator

3. AGE:
   - Look for "Age | 21 Years" or "Age: 21"
   - Return only the number (21), not "21 Years"

4. GENDER:
   - Look for "Gender | Male" or "Gender: Female"

5. DATE:
   - Look for "Date of Birth" or any date in DD/MM/YYYY format

Return ONLY this JSON (no other text):
{
  "bloodGroup": "A+",
  "patientName": "Akshat Kumar",
  "age": 21,
  "gender": "Male",
  "testDate": "12/04/2004"
}

If a field cannot be found, use null for that field.
`;

    const output = await this.generateText(prompt);
    console.log("🤖 AI Blood Report Response:", output);

    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Ensure age is a number
        if (parsed.age && typeof parsed.age === 'string') {
          parsed.age = parseInt(parsed.age.replace(/\D/g, '')) || null;
        }
        // Normalize blood group
        if (parsed.bloodGroup) {
          parsed.bloodGroup = this.normalizeBloodGroup(parsed.bloodGroup);
        }
        return parsed;
      }
      return null;
    } catch (err) {
      console.error("JSON parse error:", err);
      return null;
    }
  }

  // Normalize blood group to standard format
  normalizeBloodGroup(bg) {
    if (!bg) return null;
    let normalized = bg.toUpperCase().trim()
      .replace(/\s+/g, '')
      .replace(/POSITIVE/gi, '+')
      .replace(/NEGATIVE/gi, '-')
      .replace(/POS/gi, '+')
      .replace(/NEG/gi, '-')
      .replace(/\+VE/gi, '+')
      .replace(/-VE/gi, '-')
      .replace(/\(\+\)/g, '+')
      .replace(/\(-\)/g, '-');
    
    const valid = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    if (valid.includes(normalized)) return normalized;
    
    // Try to find valid blood group in string
    for (const v of valid) {
      if (normalized.includes(v)) return v;
    }
    return normalized;
  }

  // =============================
  // 🖼 PROCESS IMAGES → OCR → TEXT
  // =============================
  async extractTextFromImage(filePath) {
    console.log("🖼 OCR extracting:", filePath);
    const text = await ocrEngine.extract(filePath);

    if (!text || text.trim().length === 0) {
      throw new Error("OCR could not extract text");
    }

    return text;
  }

  // =============================
  // 🩸 MAIN – Extract Blood Report
  // =============================
  async extractBloodReport(filePath) {
    const text = await this.extractTextFromImage(filePath);
    console.log("📄 OCR Text:\n", text.substring(0, 800));

    let data = await this.extractBloodReportFromText(text);

    // If AI failed, try regex fallback
    if (!data || !data.bloodGroup) {
      console.log("🔄 AI extraction incomplete, trying regex fallback...");
      data = this.extractBloodReportRegex(text, data);
    }

    return {
      ...data,
      method: "OCR → Groq + Regex",
      confidence: data?.bloodGroup ? "high" : "low"
    };
  }

  // Regex fallback for blood report extraction
  extractBloodReportRegex(text, existingData = {}) {
    const result = { ...existingData };
    const cleanText = text.toUpperCase();

    // Extract blood group if not found
    if (!result.bloodGroup) {
      // Final Blood Group pattern
      let match = cleanText.match(/FINAL\s*BLOOD\s*GROUP\s*[\|\:\s]+\s*(A|B|AB|O)\s*([+\-])/i);
      if (match) {
        result.bloodGroup = match[1] + match[2];
      } else {
        // ABO + Rh pattern
        const aboMatch = cleanText.match(/ABO\s*(?:BLOOD\s*)?GROUP\s*[\|\:\s]+\s*(A|B|AB|O)\b/i);
        const rhMatch = cleanText.match(/RH\s*(?:\(D\)\s*)?FACTOR\s*[\|\:\s]+\s*(POSITIVE|NEGATIVE|\+|\-|\(\+\)|\(\-\))/i);
        if (aboMatch && rhMatch) {
          const rh = rhMatch[1].includes('POS') || rhMatch[1].includes('+') ? '+' : '-';
          result.bloodGroup = aboMatch[1] + rh;
        }
      }
    }

    // Extract name if not found - handle table format "Name | Akshat Kumar"
    if (!result.patientName) {
      const nameMatch = text.match(/\bName\s*[\|\:\s]+\s*([A-Za-z][A-Za-z\s]+?)(?:\n|\r|Gender|Date|Age|\||$)/i);
      if (nameMatch) {
        result.patientName = nameMatch[1].trim();
      }
    }

    // Extract age if not found - handle "Age | 21 Years"
    if (!result.age) {
      const ageMatch = text.match(/\bAge\s*[\|\:\s]+\s*(\d{1,3})\s*(?:Years?|Yrs?|Y)?/i);
      if (ageMatch) {
        result.age = parseInt(ageMatch[1]);
      }
    }

    // Extract gender if not found
    if (!result.gender) {
      const genderMatch = text.match(/\bGender\s*[\|\:\s]+\s*(Male|Female)/i);
      if (genderMatch) {
        result.gender = genderMatch[1];
      } else if (/\bMALE\b/i.test(cleanText) && !/FEMALE/i.test(cleanText)) {
        result.gender = 'Male';
      } else if (/\bFEMALE\b/i.test(cleanText)) {
        result.gender = 'Female';
      }
    }

    console.log("📊 Regex extraction result:", result);
    return result;
  }

  // =================================
  // 🩸 MAIN – Extract Blood Group
  // =================================
  async extractBloodGroup(filePath) {
    const text = await this.extractTextFromImage(filePath);

    const bg = await this.extractBloodGroupFromText(text);

    return {
      bloodGroup: bg,
      method: "OCR → Groq Text Model",
      confidence: bg ? "high" : "low"
    };
  }

  // =================================
  // 🔐 MAIN – Extract Aadhaar
  // =================================
  async extractAadhaar(filePath) {
    const text = await this.extractTextFromImage(filePath);
    console.log("📄 Aadhaar OCR Text:\n", text);

    let data = await this.extractAadhaarFromText(text);

    // Validate AI result - reject obviously wrong names
    if (data && data.name) {
      if (!this.isValidName(data.name)) {
        console.log("⚠️ AI returned invalid name:", data.name, "- will try regex");
        data.name = null;
      }
    }

    // If AI failed or incomplete, try regex fallback
    if (!data || !data.aadhaarNumber || !data.name || !data.dateOfBirth) {
      console.log("🔄 AI extraction incomplete, trying regex fallback...");
      data = this.extractAadhaarRegex(text, data || {});
    }

    // Calculate age from DOB if available
    let age = null;
    if (data && data.dateOfBirth) {
      age = this.calculateAgeFromDOB(data.dateOfBirth);
    }

    return {
      ...data,
      age: age,
      method: "OCR → Groq + Regex",
      confidence: data?.aadhaarNumber ? "high" : "low"
    };
  }

  // Enhanced Aadhaar extraction with fallback to OCR
  async extractAadhaar(imagePath) {
    try {
      console.log('🤖 AI Aadhaar extraction started...');
      const ocrText = await ocrEngine.extract(imagePath);
      const aadhaarData = await this.extractAadhaarFromText(ocrText);

      if (aadhaarData && aadhaarData.aadhaarNumber && aadhaarData.name) {
        console.log('✅ AI Aadhaar extraction successful');
        return aadhaarData;
      } else {
        console.log('⚠️ AI Aadhaar extraction incomplete, falling back to OCR');
        return await ocrEngine.extractText(imagePath);
      }
    } catch (error) {
      console.error('❌ AI Aadhaar extraction failed:', error.message);
      throw new Error('AI Aadhaar extraction failed');
    }
  }

  // Validate if a name looks real
  isValidName(name) {
    if (!name) return false;
    // Name must be at least 3 characters
    if (name.length < 3) return false;
    // Name must contain at least one vowel
    if (!/[aeiouAEIOU]/.test(name)) return false;
    // Name should not be all consonants or random letters
    if (/^[^aeiouAEIOU]+$/i.test(name)) return false;
    // Name should have reasonable length
    if (name.length > 50) return false;
    // Exclude common non-name words
    const excludeWords = ['GOVERNMENT', 'INDIA', 'AADHAAR', 'AADHAR', 'AUTHORITY', 'UNIQUE', 'MALE', 'FEMALE', 'DOWNLOAD', 'DATE', 'ISSUE', 'BIRTH', 'VID', 'ENROLLMENT', 'UIDAI', 'HELP', 'YEAR', 'YEARS'];
    if (excludeWords.includes(name.toUpperCase())) return false;
    // Name should start with a letter
    if (!/^[A-Za-z]/.test(name)) return false;
    return true;
  }

  // Regex fallback for Aadhaar extraction
  extractAadhaarRegex(text, existingData = {}) {
    const result = { ...existingData };
    console.log("🔍 Running Aadhaar regex extraction...");
    console.log("📄 Full OCR text for regex:\n", text);

    // Extract Aadhaar number if not found
    if (!result.aadhaarNumber) {
      const aadhaarMatch = text.match(/\b(\d{4}\s?\d{4}\s?\d{4})\b/);
      if (aadhaarMatch) {
        result.aadhaarNumber = aadhaarMatch[1].replace(/\s/g, '');
        console.log("✅ Regex found Aadhaar:", result.aadhaarNumber);
      }
    }

    // Extract name if not found or invalid
    if (!result.name || !this.isValidName(result.name)) {
      console.log("🔍 Looking for name in text...");
      
      // Extended list of common Indian names
      const commonNames = [
        // Male names
        'Siddharth', 'Sidharth', 'Rahul', 'Amit', 'Priya', 'Neha', 'Raj', 'Arun', 'Vijay', 
        'Akshat', 'Arjun', 'Rohan', 'Karan', 'Varun', 'Nikhil', 'Ankit', 'Mohit', 'Rohit',
        'Deepak', 'Suresh', 'Ramesh', 'Mahesh', 'Ganesh', 'Rajesh', 'Mukesh', 'Dinesh',
        'Sanjay', 'Ajay', 'Vijay', 'Ravi', 'Sunil', 'Anil', 'Manoj', 'Vinod', 'Pramod',
        'Ashok', 'Alok', 'Vivek', 'Abhishek', 'Manish', 'Satish', 'Girish', 'Harish',
        'Pankaj', 'Neeraj', 'Saurabh', 'Gaurav', 'Vishal', 'Kunal', 'Sumit', 'Puneet',
        'Aarav', 'Vihaan', 'Aditya', 'Aryan', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
        // Female names
        'Priya', 'Neha', 'Pooja', 'Anjali', 'Sneha', 'Divya', 'Kavita', 'Sunita',
        'Anita', 'Rekha', 'Meena', 'Seema', 'Geeta', 'Sita', 'Radha', 'Lakshmi',
        'Sarita', 'Mamta', 'Shweta', 'Preeti', 'Ritu', 'Nisha', 'Asha', 'Usha',
        'Aadhya', 'Ananya', 'Diya', 'Myra', 'Sara', 'Aanya', 'Kiara', 'Avni',
        // Common surnames that might appear alone
        'Kumar', 'Singh', 'Sharma', 'Verma', 'Gupta', 'Jain', 'Agarwal', 'Patel',
        'Shah', 'Mehta', 'Reddy', 'Rao', 'Nair', 'Menon', 'Iyer', 'Iyengar'
      ];
      
      for (const name of commonNames) {
        // Case insensitive search
        const regex = new RegExp(`\\b${name}\\b`, 'i');
        if (regex.test(text)) {
          const match = text.match(regex);
          if (match) {
            // Proper case the name
            result.name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            console.log("✅ Found common name:", result.name);
            break;
          }
        }
      }

      // If still not found, try patterns
      if (!result.name || !this.isValidName(result.name)) {
        // Multiple patterns to try
        const namePatterns = [
          // Name on line before DOB
          /\n([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*)\s*\n[^\n]*(?:DOB|जन्म)/i,
          // Name after Hindi text on same line
          /[ऀ-ॿ]+\s*\n?\s*([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*)/,
          // Capitalized word before MALE/FEMALE
          /([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*)\s*\n[^\n]*(?:MALE|FEMALE|पुरुष|महिला)/i,
          // Any capitalized word 4+ chars with vowels
          /\b([A-Z][a-z]*[aeiou][a-z]{2,})\b/g
        ];

        for (const pattern of namePatterns) {
          const matches = text.match(pattern);
          if (matches) {
            // Handle both single match and global matches
            const candidates = pattern.global ? matches : [matches[1]];
            for (const candidate of candidates) {
              if (!candidate) continue;
              const cleanName = candidate.replace(/\s*(DOB|MALE|FEMALE|जन्म|पुरुष|महिला).*/i, '').trim();
              if (this.isValidName(cleanName) && cleanName.length >= 4) {
                result.name = cleanName;
                console.log("✅ Regex pattern found name:", result.name);
                break;
              }
            }
            if (result.name && this.isValidName(result.name)) break;
          }
        }
      }
    }

    // Extract DOB if not found
    if (!result.dateOfBirth) {
      // Pattern: DOB: DD/MM/YYYY or जन्म तिथि/DOB: DD/MM/YYYY
      const dobPatterns = [
        /(?:जन्म\s*तिथि\s*[\/\\]?\s*)?DOB\s*[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
        /जन्म\s*तिथि\s*[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
        /\b(\d{2}[\/]\d{2}[\/]\d{4})\b/
      ];
      
      for (const pattern of dobPatterns) {
        const dobMatch = text.match(pattern);
        if (dobMatch) {
          result.dateOfBirth = dobMatch[1];
          console.log("✅ Regex found DOB:", result.dateOfBirth);
          break;
        }
      }
    }

    // Extract gender if not found
    if (!result.gender) {
      const cleanText = text.toUpperCase();
      if (/\bMALE\b/.test(cleanText) && !/FEMALE/.test(cleanText)) {
        result.gender = 'Male';
        console.log("✅ Regex found gender: Male");
      } else if (/\bFEMALE\b/.test(cleanText)) {
        result.gender = 'Female';
        console.log("✅ Regex found gender: Female");
      }
    }

    console.log("📊 Aadhaar regex extraction result:", result);
    return result;
  }

  // Calculate age from DOB
  calculateAgeFromDOB(dob) {
    if (!dob) return null;
    try {
      const parts = dob.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        let year = parseInt(parts[2]);
        if (year < 100) year += year > 50 ? 1900 : 2000;
        
        const birthDate = new Date(year, month, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age > 0 && age < 120 ? age : null;
      }
    } catch (e) {
      console.error("Age calculation error:", e);
    }
    return null;
  }

  // =================================
  // 🔄 Cross-validate documents
  // =================================
  async crossValidateDocuments(aadhaarData, bloodReportData) {
    const warnings = [];
    let isValid = true;

    // Check name match
    if (aadhaarData.name && bloodReportData.patientName) {
      const aadhaarName = aadhaarData.name.toLowerCase().trim();
      const reportName = bloodReportData.patientName.toLowerCase().trim();
      
      if (!aadhaarName.includes(reportName.split(' ')[0]) && 
          !reportName.includes(aadhaarName.split(' ')[0])) {
        warnings.push('Names do not match between Aadhaar and blood report');
      }
    }

    // Check gender match
    if (aadhaarData.gender && bloodReportData.gender) {
      if (aadhaarData.gender.toLowerCase() !== bloodReportData.gender.toLowerCase()) {
        warnings.push('Gender mismatch between documents');
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings: warnings
    };
  }
}

module.exports = new AIExtractor();
