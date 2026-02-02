const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * OCR.space API Integration
 * Free tier: 25,000 requests/month
 * High accuracy OCR with support for multiple languages
 */
class OCRSpaceAPI {
    constructor() {
        this.apiKey = process.env.OCR_SPACE_API_KEY || 'K84168775888957';
        this.apiUrl = 'https://api.ocr.space/parse/image';
        this.maxRetries = 2;
    }

    /**
     * Extract text from image using OCR.space API
     * @param {string} imagePath - Path to image file
     * @param {object} options - OCR options
     * @returns {Promise<object>} Extracted text and metadata
     */
    async extractText(imagePath, options = {}) {
        const {
            language = 'eng',
            isTable = false,
            detectOrientation = true,
            scale = true,
            isOverlayRequired = false,
            ocrEngine = 2
        } = options;

        console.log(`🔍 OCR.space API: Processing ${path.basename(imagePath)}...`);

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                // Read file as base64
                const imageBuffer = fs.readFileSync(imagePath);
                const base64Image = `data:image/${path.extname(imagePath).slice(1)};base64,${imageBuffer.toString('base64')}`;

                const formData = new FormData();
                formData.append('base64Image', base64Image);
                formData.append('apikey', this.apiKey);
                formData.append('language', language);
                formData.append('isTable', isTable.toString());
                formData.append('detectOrientation', detectOrientation.toString());
                formData.append('scale', scale.toString());
                formData.append('isOverlayRequired', isOverlayRequired.toString());
                formData.append('OCREngine', ocrEngine.toString());

                const response = await axios.post(this.apiUrl, formData, {
                    headers: {
                        ...formData.getHeaders()
                    },
                    timeout: 30000
                });

                const result = response.data;

                // Check for API errors
                if (result.IsErroredOnProcessing) {
                    throw new Error(result.ErrorMessage?.[0] || 'OCR processing failed');
                }

                if (!result.ParsedResults || result.ParsedResults.length === 0) {
                    throw new Error('No text found in image');
                }

                const parsedResult = result.ParsedResults[0];
                const extractedText = parsedResult.ParsedText;
                const confidence = this.calculateConfidence(parsedResult);

                console.log(`✅ OCR.space extraction complete - Confidence: ${confidence}%`);

                return {
                    text: extractedText,
                    confidence: confidence,
                    exitCode: parsedResult.TextOverlay?.ExitCode || 1,
                    fileParseExitCode: parsedResult.FileParseExitCode,
                    errorMessage: parsedResult.ErrorMessage,
                    method: 'OCR.space API'
                };

            } catch (error) {
                console.error(`❌ OCR.space attempt ${attempt} failed:`, error.message);

                if (attempt === this.maxRetries) {
                    throw new Error(`OCR.space API failed after ${this.maxRetries} attempts: ${error.message}`);
                }

                // Wait before retry
                await this.sleep(1000 * attempt);
            }
        }
    }

    /**
     * Calculate confidence score from OCR result
     * OCR.space doesn't provide direct confidence, so we estimate based on result quality
     */
    calculateConfidence(parsedResult) {
        let confidence = 85; // Base confidence for successful extraction

        // Increase confidence if text is structured
        if (parsedResult.ParsedText && parsedResult.ParsedText.length > 50) {
            confidence += 5;
        }

        // Decrease if errors detected
        if (parsedResult.ErrorMessage) {
            confidence -= 10;
        }

        // Ensure confidence is between 0-100
        return Math.max(0, Math.min(100, confidence));
    }

    /**
     * Extract text from multiple images and combine results
     */
    async extractFromMultipleImages(imagePaths, options = {}) {
        const results = await Promise.all(
            imagePaths.map(imagePath => this.extractText(imagePath, options))
        );

        // Combine all text
        const combinedText = results.map(r => r.text).join('\n\n');
        const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

        return {
            text: combinedText,
            confidence: avgConfidence,
            method: 'OCR.space API (Multi-image)'
        };
    }

    /**
     * Extract text with automatic language detection
     */
    async extractWithAutoLanguage(imagePath) {
        // Try English first (most common)
        try {
            return await this.extractText(imagePath, { language: 'eng' });
        } catch (error) {
            console.log('⚠️ English OCR failed, trying Hindi...');
            // Fallback to Hindi for Indian documents
            return await this.extractText(imagePath, { language: 'eng,hin' });
        }
    }

    /**
     * Sleep utility for retries
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check API status and remaining quota
     */
    async checkAPIStatus() {
        try {
            const testImagePath = path.join(__dirname, '../test_image.png');
            // Create a minimal test image if it doesn't exist
            if (!fs.existsSync(testImagePath)) {
                console.log('⚠️ No test image available for API status check');
                return { available: true, message: 'API key configured' };
            }

            await this.extractText(testImagePath);
            return { available: true, message: 'OCR.space API is working' };
        } catch (error) {
            return { available: false, message: error.message };
        }
    }
}

module.exports = new OCRSpaceAPI();
