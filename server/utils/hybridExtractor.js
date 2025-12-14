const aiExtractor = require('./aiExtractor');
const ocrEngine = require('./ocrEngine');
const bloodReportParser = require('./bloodReportParser');
const aadhaarValidator = require('./aadhaarValidator');

class HybridExtractor {
  constructor() {
    this.preferAI = true;
  }

  async extractAadhaar(imagePath) {
    console.log('🔄 Starting hybrid Aadhaar extraction...');
    
    try {
      // Try AI first
      if (this.preferAI) {
        console.log('🤖 Attempting AI extraction...');
        const aiResult = await aiExtractor.extractAadhaar(imagePath);
        
        if (aiResult && aiResult.aadhaarNumber && aiResult.name) {
          console.log('✅ AI extraction successful');
          return { ...aiResult, method: 'AI' };
        } else {
          console.log('⚠️ AI extraction incomplete, falling back to OCR...');
        }
      }
      
      // Fallback to OCR
      console.log('📄 Using OCR extraction...');
      const ocrText = await ocrEngine.extract(imagePath);
      const ocrResult = aadhaarValidator.parse(ocrText);
      
      if (ocrResult && ocrResult.aadhaarNumber && ocrResult.name) {
        console.log('✅ OCR extraction successful');
        return { ...ocrResult, method: 'OCR' };
      } else {
        console.log('❌ Both AI and OCR failed');
        throw new Error('Could not extract Aadhaar data using AI or OCR');
      }
      
    } catch (error) {
      console.error('❌ Hybrid Aadhaar extraction failed:', error.message);
      throw error;
    }
  }

  async extractBloodReport(imagePath) {
    console.log('🔄 Starting hybrid blood report extraction...');
    
    try {
      // Try AI first
      if (this.preferAI) {
        console.log('🤖 Attempting AI extraction...');
        const aiResult = await aiExtractor.extractBloodReport(imagePath);
        
        if (aiResult && aiResult.bloodGroup) {
          console.log('✅ AI extraction successful');
          return { ...aiResult, method: 'AI' };
        } else {
          console.log('⚠️ AI extraction incomplete, falling back to OCR...');
        }
      }
      
      // Fallback to OCR
      console.log('📄 Using OCR extraction...');
      const ocrText = await ocrEngine.extract(imagePath);
      const ocrResult = bloodReportParser.parse(ocrText);
      
      if (ocrResult && ocrResult.bloodGroup) {
        console.log('✅ OCR extraction successful');
        return { ...ocrResult, method: 'OCR' };
      } else {
        console.log('❌ Both AI and OCR failed');
        throw new Error('Could not extract blood group using AI or OCR');
      }
      
    } catch (error) {
      console.error('❌ Hybrid blood report extraction failed:', error.message);
      throw error;
    }
  }

  async extractBloodGroup(imagePath) {
    console.log('🔄 Starting hybrid blood group extraction...');
    
    try {
      // Try AI first
      if (this.preferAI) {
        console.log('🤖 Attempting AI blood group extraction...');
        const aiResult = await aiExtractor.extractBloodGroup(imagePath);
        
        if (aiResult && aiResult.bloodGroup) {
          console.log('✅ AI blood group extraction successful');
          return { ...aiResult, method: 'AI' };
        } else {
          console.log('⚠️ AI blood group extraction failed, falling back to OCR...');
        }
      }
      
      // Fallback to OCR
      console.log('📄 Using OCR for blood group extraction...');
      const ocrText = await ocrEngine.extract(imagePath);
      const ocrResult = bloodReportParser.parse(ocrText);
      
      if (ocrResult && ocrResult.bloodGroup) {
        console.log('✅ OCR blood group extraction successful');
        return { bloodGroup: ocrResult.bloodGroup, method: 'OCR' };
      } else {
        console.log('❌ Both AI and OCR failed for blood group');
        throw new Error('Could not extract blood group using AI or OCR');
      }
      
    } catch (error) {
      console.error('❌ Hybrid blood group extraction failed:', error.message);
      throw error;
    }
  }

  async crossValidateDocuments(aadhaarData, bloodReportData) {
    return await aiExtractor.crossValidateDocuments(aadhaarData, bloodReportData);
  }

  setPreference(useAI = true) {
    this.preferAI = useAI;
    console.log(`🔧 Extraction preference set to: ${useAI ? 'AI first, OCR backup' : 'OCR only'}`);
  }
}

module.exports = new HybridExtractor();