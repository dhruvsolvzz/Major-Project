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
Extract Aadhaar information from this text.

Text:
${text}

Return JSON like:
{
  "aadhaarNumber": "12 digits",
  "name": "Full name",
  "dateOfBirth": "DD/MM/YYYY",
  "gender": "Male/Female/Other"
}

If any field is missing, use null.
JSON only:
`;

    const output = await this.generateText(prompt);

    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
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
Extract blood report information in JSON.

Text:
${text}

Return:
{
  "bloodGroup": "A+/A-/B+/B-/O+/O-/AB+/AB-",
  "patientName": "Full name",
  "age": "Number only",
  "gender": "Male/Female/Other",
  "testDate": "YYYY-MM-DD"
}

If not found, return null fields.
Only JSON:
`;

    const output = await this.generateText(prompt);

    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
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

    return {
      ...data,
      method: "OCR → Groq Text Model",
      confidence: "high"
    };
  }
}

module.exports = new AIExtractor();
