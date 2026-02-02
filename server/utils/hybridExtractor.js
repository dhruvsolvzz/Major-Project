const aiExtractor = require('./aiExtractor');
const ocrEngine = require('./ocrEngine');
const ocrSpaceAPI = require('./ocrSpaceAPI');
const bloodReportParser = require('./bloodReportParser');
const aadhaarValidator = require('./aadhaarValidator');

class HybridExtractor {
  constructor() {
    this.preferAI = process.env.USE_AI_EXTRACTION === 'true';
    this.useOCRSpace = process.env.USE_OCR_SPACE !== 'false'; // Enabled by default
    console.log(`🔧 Hybrid Extractor initialized`);
    console.log(`   - AI: ${this.preferAI ? 'enabled' : 'disabled'}`);
    console.log(`   - OCR.space: ${this.useOCRSpace ? 'enabled' : 'disabled'}`);
  }

  async extractAadhaar(imagePath) {
    console.log('\n========== AADHAAR EXTRACTION ==========');

    let result = null;
    let method = 'none';
    let ocrText = '';

    // Method 1: Try OCR.space API first (highest accuracy)
    if (this.useOCRSpace) {
      try {
        console.log('🌐 Trying OCR.space API...');
        const ocrSpaceResult = await ocrSpaceAPI.extractText(imagePath, {
          language: 'eng',
          detectOrientation: true,
          ocrEngine: 2
        });

        if (ocrSpaceResult && ocrSpaceResult.confidence > 70) {
          ocrText = ocrSpaceResult.text;
          const parsedResult = aadhaarValidator.parse(ocrText);

          if (parsedResult && parsedResult.aadhaarNumber && parsedResult.name) {
            result = parsedResult;
            method = 'OCR.space API';
            console.log('✅ OCR.space extraction successful');
          } else {
            console.log('⚠️ OCR.space extracted text but failed to parse Aadhaar data');
          }
        }
      } catch (error) {
        console.error('❌ OCR.space failed:', error.message);
        console.log('   Falling back to next method...');
      }
    }

    // Method 2: Try AI extraction
    if (!result && this.preferAI) {
      try {
        console.log('🤖 Trying AI extraction...');
        result = await aiExtractor.extractAadhaar(imagePath);

        if (result && result.aadhaarNumber && result.name) {
          console.log('✅ AI extraction successful');
          method = 'AI';
        } else {
          console.log('⚠️ AI extraction incomplete');
          result = null;
        }
      } catch (error) {
        console.error('❌ AI extraction failed:', error.message);
      }
    }

    // Method 3: Fallback to Tesseract OCR + regex
    if (!result) {
      try {
        console.log('📄 Trying Tesseract OCR fallback...');
        if (!ocrText) {
          ocrText = await ocrEngine.extract(imagePath);
        }
        const ocrResult = aadhaarValidator.parse(ocrText);

        if (ocrResult && ocrResult.aadhaarNumber) {
          result = ocrResult;
          method = 'Tesseract OCR';
          console.log('✅ Tesseract extraction successful');
        }
      } catch (error) {
        console.error('❌ Tesseract extraction failed:', error.message);
      }
    }

    if (!result || !result.aadhaarNumber) {
      throw new Error('Could not extract Aadhaar number. Please ensure the image is clear and contains valid Aadhaar information.');
    }

    console.log('📊 Final Aadhaar result:', {
      number: result.aadhaarNumber,
      name: result.name,
      age: result.age,
      gender: result.gender,
      method
    });
    console.log('=========================================\n');

    return { ...result, method };
  }

  async extractBloodReport(imagePath) {
    console.log('\n========== BLOOD REPORT EXTRACTION ==========');

    let result = null;
    let method = 'none';
    let ocrText = '';

    // Method 1: Try OCR.space API first (highest accuracy)
    if (this.useOCRSpace) {
      try {
        console.log('🌐 Trying OCR.space API...');
        const ocrSpaceResult = await ocrSpaceAPI.extractText(imagePath, {
          language: 'eng',
          detectOrientation: true,
          ocrEngine: 2,
          isTable: true // Blood reports often have tabular data
        });

        if (ocrSpaceResult && ocrSpaceResult.confidence > 70) {
          ocrText = ocrSpaceResult.text;
          const parsedResult = bloodReportParser.parse(ocrText);

          if (parsedResult && parsedResult.bloodGroup) {
            result = {
              bloodGroup: parsedResult.bloodGroup,
              patientName: parsedResult.name,
              age: parsedResult.age,
              gender: parsedResult.gender,
              testDate: parsedResult.reportDate
            };
            method = 'OCR.space API';
            console.log('✅ OCR.space extraction successful - Blood Group:', result.bloodGroup);
          } else {
            console.log('⚠️ OCR.space extracted text but failed to find blood group');
          }
        }
      } catch (error) {
        console.error('❌ OCR.space failed:', error.message);
        console.log('   Falling back to next method...');
      }
    }

    // Method 2: Try AI extraction
    if (!result && this.preferAI) {
      try {
        console.log('🤖 Trying AI extraction...');
        result = await aiExtractor.extractBloodReport(imagePath);

        if (result && result.bloodGroup) {
          console.log('✅ AI extraction successful - Blood Group:', result.bloodGroup);
          method = 'AI';
        } else {
          console.log('⚠️ AI extraction incomplete - no blood group found');
          result = null;
        }
      } catch (error) {
        console.error('❌ AI extraction failed:', error.message);
      }
    }

    // Method 3: Fallback to Tesseract OCR + regex
    if (!result) {
      try {
        console.log('📄 Trying Tesseract OCR fallback...');
        if (!ocrText) {
          ocrText = await ocrEngine.extract(imagePath);
        }
        const ocrResult = bloodReportParser.parse(ocrText);

        if (ocrResult && ocrResult.bloodGroup) {
          result = {
            bloodGroup: ocrResult.bloodGroup,
            patientName: ocrResult.name,
            age: ocrResult.age,
            gender: ocrResult.gender,
            testDate: ocrResult.reportDate
          };
          method = 'Tesseract OCR';
          console.log('✅ Tesseract extraction successful - Blood Group:', result.bloodGroup);
        }
      } catch (error) {
        console.error('❌ Tesseract extraction failed:', error.message);
      }
    }

    if (!result || !result.bloodGroup) {
      throw new Error('Could not extract blood group. Please ensure the document is clear, contains valid blood group information, and is in a supported format.');
    }

    console.log('📊 Final Blood Report result:', {
      bloodGroup: result.bloodGroup,
      patientName: result.patientName,
      age: result.age,
      method
    });
    console.log('=============================================\n');

    return { ...result, method };
  }

  async extractBloodGroup(imagePath) {
    const result = await this.extractBloodReport(imagePath);
    return {
      bloodGroup: result.bloodGroup,
      method: result.method
    };
  }

  async crossValidateDocuments(aadhaarData, bloodReportData) {
    return await aiExtractor.crossValidateDocuments(aadhaarData, bloodReportData);
  }

  setPreference(useAI = true) {
    this.preferAI = useAI;
    console.log(`🔧 Extraction preference: ${useAI ? 'AI first' : 'OCR only'}`);
  }

  async extractAadhaarAndName(imagePath) {
    try {
      console.log('🔄 Hybrid Aadhaar extraction started...');
      const aiResult = await aiExtractor.extractAadhaar(imagePath);

      if (aiResult && aiResult.aadhaarNumber && aiResult.name) {
        console.log('✅ Hybrid extraction successful via AI');
        return { ...aiResult, method: 'AI' };
      }

      console.log('⚠️ AI extraction incomplete, falling back to OCR');
      const ocrResult = await ocrEngine.extractText(imagePath);
      return { aadhaarNumber: ocrResult.aadhaarNumber, name: ocrResult.name, method: 'OCR' };
    } catch (error) {
      console.error('❌ Hybrid extraction failed:', error.message);
      throw new Error('Hybrid Aadhaar extraction failed');
    }
  }
}

module.exports = new HybridExtractor();
