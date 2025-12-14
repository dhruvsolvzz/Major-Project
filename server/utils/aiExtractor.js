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
You are extracting information from an Indian Aadhaar card.

Text from Aadhaar card:
${text}

IMPORTANT RULES:
1. The Aadhaar number is a 12-digit number (may have spaces like "1234 5678 9012")
2. Name is usually after "Name:" or the first proper name on the card
3. Date of Birth (DOB) is in DD/MM/YYYY format
4. Gender is Male, Female, or Other
5. Look for patterns like "DOB:", "Date of Birth:", "Year of Birth:", "YOB:"

Return ONLY this JSON (no other text):
{
  "aadhaarNumber": "12 digit number without spaces",
  "name": "Full name exactly as shown",
  "dateOfBirth": "DD/MM/YYYY",
  "gender": "Male or Female or Other"
}

If a field cannot be found, use null for that field.
`;

    const output = await this.generateText(prompt);

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
You are extracting information from a medical blood report.

Text from blood report:
${text}

IMPORTANT RULES:
1. Blood Group MUST be one of: A+, A-, B+, B-, O+, O-, AB+, AB-
2. Look for "Blood Group:", "Blood Type:", "ABO Group:", "Rh Type:"
3. Patient name is usually at the top or after "Patient Name:", "Name:"
4. Age is a number, look for "Age:", "Years:", or number followed by "Y" or "yrs"
5. Gender is Male/Female/M/F
6. Test date is when the test was done

Return ONLY this JSON (no other text):
{
  "bloodGroup": "A+ or A- or B+ or B- or O+ or O- or AB+ or AB-",
  "patientName": "Full name of patient",
  "age": 25,
  "gender": "Male or Female",
  "testDate": "YYYY-MM-DD"
}

If a field cannot be found, use null for that field.
Blood group is the MOST important field - look carefully for it.
`;

    const output = await this.generateText(prompt);

    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Ensure age is a number
        if (parsed.age && typeof parsed.age === 'string') {
          parsed.age = parseInt(parsed.age.replace(/\D/g, '')) || null;
        }
        return parsed;
      }
      return null;
    } catch (err) {
      console.error("JSON parse error:", err);
      return null;
    }
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

    const data = await this.extractBloodReportFromText(text);

    return {
      ...data,
      method: "OCR → Groq Text Model",
      confidence: "high"
    };
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

    const data = await this.extractAadhaarFromText(text);

    // Calculate age from DOB if available
    let age = null;
    if (data && data.dateOfBirth) {
      try {
        const dobParts = data.dateOfBirth.split('/');
        if (dobParts.length === 3) {
          const dob = new Date(dobParts[2], dobParts[1] - 1, dobParts[0]);
          const today = new Date();
          age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
        }
      } catch (e) {
        console.log('Could not calculate age from DOB');
      }
    }

    return {
      ...data,
      age: age,
      method: "OCR → Groq Text Model",
      confidence: "high"
    };
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
