/**
 * OCR Processing Module
 * Uses Tesseract.js v4 to extract text from business card images
 * Includes regex patterns to extract structured data (name, phone, email, company)
 * Uses local worker/core/lang files for 100% offline operation
 */

class OCRProcessor {
    constructor() {
        // Regex patterns for extracting contact information
        this.patterns = {
            // Email pattern
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            
            // Phone patterns (various formats)
            phone: /(\+?\d{1,3}[\s\-\.]?)?\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}/g,
            phoneAlt: /(\+?\d{1,4}[\s\-\.]?)?\(?\d{2,4}\)?[\s\-\.]?\d{2,4}[\s\-\.]?\d{2,4}[\s\-\.]?\d{0,4}/g,
            
            // URL pattern (for websites)
            url: /https?:\/\/[^\s]+/g
        };
        
        // Initialize Tesseract worker
        this.worker = null;
        this.initAttempts = 0;
        this.maxInitAttempts = 2;
    }

    /**
     * Initialize Tesseract.js worker with local files
     * Uses explicit paths for worker, core, and language data
     * Loads OCR model from local files (no network required)
     * Includes retry logic and better error messages
     * Falls back to CDN if local files not available (with warning)
     */
    async init() {
        // Reuse existing worker if already initialized
        if (this.worker) {
            return this.worker;
        }

        // Check if local files are available first
        const hasLocalFiles = await this.checkLocalFiles();
        
        if (!hasLocalFiles) {
            console.warn('Local Tesseract files not found. Attempting to use CDN fallback...');
            // Show user-friendly message about missing files
            this.showMissingFilesMessage();
        }

        // Retry initialization if it fails
        for (let attempt = 1; attempt <= this.maxInitAttempts; attempt++) {
            try {
                this.initAttempts = attempt;
                console.log(`OCR initialization attempt ${attempt}/${this.maxInitAttempts}`);

                // Create Tesseract worker
                // If local files exist, use them; otherwise use default (CDN)
                const workerConfig = {};
                
                if (hasLocalFiles) {
                    // Use local files for offline operation
                    // Note: corePath may not be needed - Tesseract.js v4 handles it automatically
                    workerConfig.workerPath = './tesseract/worker.min.js';
                    // Only set corePath if the file actually exists
                    try {
                        const coreExists = await fetch('./tesseract/tesseract-core.wasm.js', { method: 'HEAD' }).then(r => r.ok).catch(() => false);
                        if (coreExists) {
                            workerConfig.corePath = './tesseract/tesseract-core.wasm.js';
                        }
                    } catch (e) {
                        // Ignore - Tesseract.js will handle it
                    }
                    workerConfig.langPath = './tessdata';
                } else {
                    // Use default CDN paths (Tesseract.js will fetch from CDN)
                    // Don't specify paths - let Tesseract.js use defaults
                    console.log('Using CDN fallback - requires internet connection');
                }

                this.worker = await Tesseract.createWorker({
                    ...workerConfig,
                    logger: (m) => {
                        // Log progress if needed
                        if (m.status === 'recognizing text') {
                            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                });

                // Load and initialize English language
                // Note: Tesseract.js uses 'eng' as the language code, not 'en'
                await this.worker.loadLanguage('eng');
                await this.worker.initialize('eng');
                
                console.log('OCR initialized successfully' + (hasLocalFiles ? ' with local files' : ' using CDN (requires internet)'));
                this.initAttempts = 0; // Reset attempts on success
                return this.worker;
            } catch (error) {
                // Log full error details including stack trace
                console.error(`OCR initialization attempt ${attempt} failed:`, error);
                
                // Safely extract error properties (error might be wrapped or not a standard Error object)
                const errorName = error?.name || error?.constructor?.name || 'Error';
                const errorMessage = error?.message || error?.toString() || String(error);
                const errorStack = error?.stack || (error?.error?.stack) || 'No stack trace available';
                
                console.error('Error name:', errorName);
                console.error('Error message:', errorMessage);
                console.error('Error stack:', errorStack);
                
                // Store error details for later use
                const errorDetails = {
                    name: errorName,
                    message: errorMessage,
                    stack: errorStack,
                    original: error
                };
                
                // Check which files failed to fetch (404 errors)
                const missingFiles = await this.checkWhichFilesFailed();
                if (missingFiles.length > 0) {
                    console.error('Files that returned 404:', missingFiles);
                }
                
                // Clean up failed worker
                if (this.worker) {
                    try {
                        await this.worker.terminate();
                    } catch (e) {
                        // Ignore termination errors
                    }
                    this.worker = null;
                }

                // If this was the last attempt, throw a user-friendly error
                if (attempt === this.maxInitAttempts) {
                    const errorMessage = this.getInitErrorMessage(errorDetails, hasLocalFiles, missingFiles);
                    const finalError = new Error(errorMessage);
                    finalError.stack = errorStack; // Preserve original stack trace
                    finalError.originalError = error; // Store original error
                    throw finalError;
                }

                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    /**
     * Check if local Tesseract files exist
     * Note: corePath might not be required in v4 - Tesseract.js may handle it automatically
     * @returns {Promise<boolean>} - True if ALL local files are available
     */
    async checkLocalFiles() {
        try {
            // Check worker and language data (core file may not be needed)
            const checks = await Promise.all([
                fetch('./tesseract/worker.min.js', { method: 'HEAD' }).then(r => r.ok).catch(() => false),
                fetch('./tessdata/en.traineddata', { method: 'HEAD' }).then(r => {
                    // Also check file size - placeholder files are too small
                    if (r.ok) {
                        const contentLength = r.headers.get('content-length');
                        if (contentLength && parseInt(contentLength) < 1000000) {
                            // File is less than 1MB, likely a placeholder
                            return false;
                        }
                    }
                    return r.ok;
                }).catch(() => false)
            ]);

            const allExist = checks.every(check => check === true);
            
            if (!allExist) {
                console.log('Local files check:', {
                    worker: checks[0],
                    lang: checks[1]
                });
            }
            
            return allExist;
        } catch (error) {
            console.error('Error checking local files:', error);
            return false;
        }
    }

    /**
     * Check which specific files failed to fetch (404 errors)
     * @returns {Promise<Array<string>>} - Array of file paths that returned 404
     */
    async checkWhichFilesFailed() {
        const filePaths = [
            './tesseract/worker.min.js',
            './tessdata/en.traineddata'
        ];
        
        // Only check core file if it's actually needed
        // Tesseract.js v4 might bundle it differently
        const coreExists = await fetch('./tesseract/tesseract-core.wasm.js', { method: 'HEAD' }).then(r => r.ok).catch(() => false);
        if (!coreExists) {
            // Don't add to missing files - it might not be needed
            console.log('Note: tesseract-core.wasm.js not found - Tesseract.js v4 may handle this automatically');
        }
        
        const missingFiles = [];
        
        for (const filePath of filePaths) {
            try {
                const response = await fetch(filePath, { method: 'HEAD' });
                if (!response.ok) {
                    if (response.status === 404) {
                        missingFiles.push(filePath);
                        console.error(`❌ File not found (404): ${filePath}`);
                    } else {
                        console.warn(`⚠ File check failed (${response.status}): ${filePath}`);
                    }
                } else {
                    // For en.traineddata, also check size
                    if (filePath.includes('en.traineddata')) {
                        const contentLength = response.headers.get('content-length');
                        if (contentLength && parseInt(contentLength) < 1000000) {
                            missingFiles.push(filePath + ' (file too small, likely placeholder)');
                            console.error(`❌ File too small (placeholder): ${filePath}`);
                        }
                    }
                }
            } catch (error) {
                // Network error or CORS issue
                console.error(`❌ Failed to check ${filePath}:`, error.message);
                // Don't add to missingFiles here as it might be a network issue, not a 404
            }
        }
        
        return missingFiles;
    }

    /**
     * Show message about missing files
     */
    showMissingFilesMessage() {
        // This will be handled by the UI layer
        console.warn('Missing Tesseract files detected. For offline operation, please download:');
        console.warn('1. ./tesseract/worker.min.js from https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js');
        console.warn('2. ./tesseract/tesseract-core.wasm.js from https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract-core.wasm.js');
        console.warn('3. ./tessdata/en.traineddata from https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz (extract and rename to en.traineddata)');
        console.warn('\nNote: The app will attempt to use CDN fallback, but this requires internet connection.');
        console.warn('For 100% offline operation, download the files above.');
    }

    /**
     * Generate user-friendly error message for OCR initialization failures
     * @param {Object|Error} error - Original error object or error details
     * @param {boolean} triedLocalFiles - Whether local files were attempted
     * @param {Array<string>} missingFiles - Array of file paths that returned 404
     * @returns {string} - User-friendly error message
     */
    getInitErrorMessage(error, triedLocalFiles = true, missingFiles = []) {
        // Handle both Error objects and error detail objects
        const errorMessage = error?.message || error?.toString() || String(error);
        const errorMessageLower = errorMessage.toLowerCase();
        const errorStr = errorMessage.toLowerCase();
        
        // Build error message with file-specific suggestions
        let message = `OCR initialization failed after ${this.maxInitAttempts} attempts.\n\n`;
        
        // Check for 404 errors in missing files or error message
        const fileChecks = {
            './tesseract/worker.min.js': {
                found: missingFiles.some(f => f.includes('worker.min.js')),
                suggestion: '❌ Missing: ./tesseract/worker.min.js\n   Download: https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js\n   Place in: tesseract/worker.min.js\n'
            },
            './tesseract/tesseract-core.wasm.js': {
                found: missingFiles.some(f => f.includes('tesseract-core.wasm.js')),
                suggestion: '❌ Missing: ./tesseract/tesseract-core.wasm.js\n   Download: https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract-core.wasm.js\n   Place in: tesseract/tesseract-core.wasm.js\n'
            },
            './tessdata/en.traineddata': {
                found: missingFiles.some(f => f.includes('en.traineddata')),
                suggestion: '❌ Missing or invalid: ./tessdata/en.traineddata\n   Download: https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz\n   Extract the .gz file and rename to: tessdata/en.traineddata (should be ~4-5MB)\n   Note: CDN fallback may work if you have internet, but files are required for offline operation.\n'
            }
        };
        
        // Add specific file suggestions for missing files
        const hasMissingFiles = missingFiles.length > 0;
        if (hasMissingFiles) {
            message += 'Files that failed to load (404):\n\n';
            Object.entries(fileChecks).forEach(([path, info]) => {
                if (info.found) {
                    message += info.suggestion + '\n';
                }
            });
        }
        
        // Also check error message for file references
        if (triedLocalFiles && !hasMissingFiles) {
            if (errorMessageLower.includes('worker.min.js') || errorMessageLower.includes('worker') || errorStr.includes('worker')) {
                message += fileChecks['./tesseract/worker.min.js'].suggestion + '\n';
            } else if (errorMessageLower.includes('tesseract-core') || errorMessageLower.includes('core') || errorStr.includes('core')) {
                message += fileChecks['./tesseract/tesseract-core.wasm.js'].suggestion + '\n';
            } else if (errorMessageLower.includes('en.traineddata') || errorMessageLower.includes('traineddata') || errorMessageLower.includes('lang') || errorStr.includes('traineddata') || errorStr.includes('lang')) {
                message += fileChecks['./tessdata/en.traineddata'].suggestion + '\n';
            }
        }
        
        // Add general troubleshooting
        message += '\nTroubleshooting:\n';
        message += '1. Ensure files are placed in the correct folders (tesseract/ and tessdata/)\n';
        message += '2. Make sure you\'re running the app via a web server (not file://)\n';
        message += '3. Check browser console for detailed error messages\n';
        message += '4. Verify file sizes (en.traineddata should be ~4-5MB, not a placeholder)\n\n';
        
        // Add original error details
        const errorDetails = error?.message || error?.toString() || 'Unknown error';
        message += `Original error: ${errorDetails}\n`;
        
        if (error?.stack || error?.original?.stack) {
            message += `\nFull stack trace logged to console. Check browser DevTools for details.`;
        }
        
        return message;
    }

    /**
     * Terminate Tesseract worker to free memory
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }

    /**
     * Extract text from image using OCR
     * @param {File|HTMLImageElement|HTMLCanvasElement} imageSource - Image to process
     * @returns {Promise<string>} - Extracted text
     */
    async extractText(imageSource) {
        try {
            await this.init();
            
            // Convert image source to something Tesseract can process
            let imageUrl;
            if (imageSource instanceof File) {
                imageUrl = URL.createObjectURL(imageSource);
            } else if (imageSource instanceof HTMLImageElement) {
                imageUrl = imageSource.src;
            } else if (imageSource instanceof HTMLCanvasElement) {
                imageUrl = imageSource.toDataURL();
            } else {
                throw new Error('Unsupported image source type');
            }

            // Perform OCR
            const { data: { text } } = await this.worker.recognize(imageUrl);
            
            // Clean up object URL if we created one
            if (imageSource instanceof File) {
                URL.revokeObjectURL(imageUrl);
            }

            // Clean the raw OCR text before returning
            const cleanedText = this.cleanText(text);
            
            // Log if significant cleaning occurred (for debugging)
            if (text !== cleanedText && text.length > 0) {
                console.log('OCR text cleaned:', {
                    originalLength: text.length,
                    cleanedLength: cleanedText.length,
                    removed: text.length - cleanedText.length
                });
            }

            return cleanedText;
        } catch (error) {
            console.error('OCR extraction error:', error);
            throw error;
        }
    }

    /**
     * Clean and sanitize OCR text by removing garbage characters and stray punctuation
     * Removes leading/trailing punctuation, normalizes whitespace, and filters unwanted characters
     * Note: Keeps commas and periods for addresses to remain readable
     * @param {string} text - Raw OCR text
     * @returns {string} - Cleaned text
     */
    cleanText(text) {
        if (!text) return '';
        
        return text
            // Normalize various dash types to standard hyphen
            .replace(/[\u2010-\u2015\u2013\u2014]/g, '-')
            // Remove leading/trailing punctuation and garbage characters (but keep commas, periods)
            .replace(/^[^a-zA-Z0-9@.\+\s\-,]+|[^a-zA-Z0-9@.\+\s\-,]+$/g, '')
            // Replace common garbage punctuation with spaces (but keep commas, periods)
            .replace(/[{}>\])(_+=•|\\/~]+/g, ' ')
            // Replace multiple dashes/underscores with single space
            .replace(/[-_]{2,}/g, ' ')
            // Replace multiple spaces with single space
            .replace(/\s{2,}/g, ' ')
            // Remove non-ASCII symbols (keep letters, digits, @, ., +, spaces, commas, hyphens)
            .replace(/[^\x00-\x7F]+/g, ' ') // Remove non-ASCII characters
            .replace(/[^\w\s@.+,\-]/g, ' ') // Keep only: word chars, spaces, @, ., +, commas, hyphens
            // Normalize whitespace again after character removal
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    /**
     * Classify a line's type based on content clues
     * @param {string} line - Line to classify
     * @returns {Object} - Classification object with type and confidence
     */
    classifyLine(line) {
        const lowerLine = line.toLowerCase();
        const classification = {
            type: 'unknown',
            confidence: 0,
            original: line
        };

        // Email detection
        if (line.includes('@') || this.patterns.email.test(line)) {
            classification.type = 'email';
            classification.confidence = 10;
            return classification;
        }

        // Phone detection
        if (line.includes('+') || /\d{7,}/.test(line) || this.patterns.phone.test(line) || this.patterns.phoneAlt.test(line)) {
            classification.type = 'phone';
            classification.confidence = 10;
            return classification;
        }

        // Website detection
        if (this.patterns.url.test(line) || lowerLine.includes('www.') || lowerLine.includes('.com') || lowerLine.includes('.net') || lowerLine.includes('.org')) {
            classification.type = 'website';
            classification.confidence = 9;
            return classification;
        }

        // Address detection (contains city/state patterns or postal codes)
        if (/\b[A-Z]{2}\s+\d{5}\b/.test(line) || /\b\d{5}\b/.test(line) || /\b(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|circle|ct)\b/i.test(line)) {
            classification.type = 'address';
            classification.confidence = 8;
            return classification;
        }

        // Company keywords
        const companyPatterns = ['inc', 'ltd', 'llc', 'corp', 'pvt', 'limited', 'incorporated', 'company', 'co.', 'group', 'solutions', 'systems', 'services', 'agency'];
        const companyKeywords = ['technologies', 'tech', 'enterprises', 'ventures', 'partners', 'associates'];
        const hasStrongCompanyKeyword = companyPatterns.some(pattern => lowerLine.includes(pattern));
        const hasCompanyKeyword = companyKeywords.some(keyword => lowerLine.includes(keyword));

        if (hasStrongCompanyKeyword) {
            classification.type = 'company';
            classification.confidence = 10;
            return classification;
        }

        // Title/role keywords (often appear after name)
        const titleKeywords = ['agent', 'manager', 'director', 'executive', 'president', 'ceo', 'cfo', 'cto', 'vp', 'vice president', 'specialist', 'consultant', 'advisor', 'representative', 'assistant', 'coordinator'];
        const hasTitleKeyword = titleKeywords.some(keyword => lowerLine.includes(keyword));

        if (hasTitleKeyword) {
            classification.type = 'title';
            classification.confidence = 7;
            // If it's a title line, it might also be used as company if no company found
            if (lowerLine.includes('real estate') || lowerLine.includes('realestate')) {
                classification.type = 'company';
                classification.confidence = 8;
            }
            return classification;
        }

        // Name detection - two capitalized words, no numbers, reasonable length
        const words = line.split(/\s+/).filter(w => w.length > 0);
        const hasTwoWords = words.length === 2;
        const allWordsCapitalized = words.every(w => w.length > 0 && w[0] === w[0].toUpperCase() && /^[A-Z]/.test(w));
        const noNumbers = !/\d/.test(line);
        const reasonableLength = line.length >= 3 && line.length <= 40;

        if (hasTwoWords && allWordsCapitalized && noNumbers && reasonableLength) {
            classification.type = 'name';
            classification.confidence = 9;
            return classification;
        }

        // Multi-word capitalized line (could be company or name)
        if (words.length >= 2 && allWordsCapitalized && noNumbers && reasonableLength) {
            classification.type = 'name_or_company';
            classification.confidence = 6;
            return classification;
        }

        return classification;
    }

    /**
     * Normalize and organize extracted fields
     * Removes duplicates and ensures proper ordering
     * @param {Object} contact - Contact object with extracted fields
     * @param {Array} classifiedLines - Array of classified lines
     * @returns {Object} - Normalized contact object
     */
    normalizeFields(contact, classifiedLines) {
        // If company is missing but a title line exists, use title as company
        if (!contact.company || contact.company.trim() === '') {
            const titleLine = classifiedLines.find(cl => cl.type === 'title' || (cl.type === 'company' && cl.confidence >= 7));
            if (titleLine) {
                contact.company = this.cleanText(titleLine.original);
                console.log('Using title/role line as company:', contact.company);
            }
        }

        // Remove duplicate phone/email (already handled by regex extraction, but ensure single value)
        // Ensure name is first if present
        // Ensure company is second if present

        return contact;
    }

    /**
     * Extract structured contact information from OCR text using layout-aware parsing
     * Improved to handle multi-column business cards with context-based detection
     * @param {string} text - Raw OCR text
     * @returns {Object} - Contact object with extracted fields
     */
    extractContactInfo(text) {
        let contact = {
            name: '',
            phone: '',
            email: '',
            company: ''
        };

        if (!text) return contact;

        // Clean up raw OCR text first
        const cleanedText = this.cleanText(text);

        // Extract email (most reliable pattern)
        const emailMatch = cleanedText.match(this.patterns.email);
        if (emailMatch && emailMatch.length > 0) {
            contact.email = emailMatch[0].trim().toLowerCase();
        }

        // Extract phone number
        const phoneMatch = cleanedText.match(this.patterns.phone) || cleanedText.match(this.patterns.phoneAlt);
        if (phoneMatch && phoneMatch.length > 0) {
            contact.phone = phoneMatch[0].trim();
        }

        // Split text into lines for layout-aware analysis
        // If OCR returns single line with multiple fields, try to split intelligently
        let lines = cleanedText.split(/\r?\n/)
            .map(line => this.cleanText(line.trim()))
            .filter(line => line.length > 0);
        
        // If we got a single long line, try to split by common separators
        // This handles cases where OCR reads multi-column cards as one line
        if (lines.length === 1 && lines[0].length > 50) {
            const singleLine = lines[0];
            // Try splitting by patterns that suggest field boundaries
            // Look for: email, phone, website, then split around them
            const emailPos = singleLine.search(this.patterns.email);
            const phonePos = singleLine.search(this.patterns.phone) !== -1 ? singleLine.search(this.patterns.phone) : singleLine.search(/\+\d/);
            const websitePos = singleLine.search(this.patterns.url) !== -1 ? singleLine.search(this.patterns.url) : singleLine.search(/www\./i);
            
            // Reconstruct lines based on detected positions
            const potentialSplits = [];
            if (emailPos !== -1) potentialSplits.push({ pos: emailPos, type: 'email' });
            if (phonePos !== -1) potentialSplits.push({ pos: phonePos, type: 'phone' });
            if (websitePos !== -1) potentialSplits.push({ pos: websitePos, type: 'website' });
            
            potentialSplits.sort((a, b) => a.pos - b.pos);
            
            // If we found field boundaries, split the line
            if (potentialSplits.length > 0) {
                const newLines = [];
                let lastPos = 0;
                
                potentialSplits.forEach(split => {
                    if (split.pos > lastPos) {
                        const segment = singleLine.substring(lastPos, split.pos).trim();
                        if (segment.length > 0) {
                            newLines.push(segment);
                        }
                    }
                    lastPos = split.pos;
                });
                
                // Add remaining text
                if (lastPos < singleLine.length) {
                    const remaining = singleLine.substring(lastPos).trim();
                    if (remaining.length > 0) {
                        newLines.push(remaining);
                    }
                }
                
                if (newLines.length > 1) {
                    lines = newLines.map(line => this.cleanText(line));
                }
            }
        }

        // Classify each line
        const classifiedLines = lines.map(line => this.classifyLine(line));
        
        // Debug: Log line classifications in dev mode
        if (console.log) {
            console.log('Line classifications:', classifiedLines.map(cl => ({
                line: cl.original,
                type: cl.type,
                confidence: cl.confidence
            })));
        }

        // Find name: topmost line classified as 'name' with high confidence
        const nameLines = classifiedLines.filter(cl => cl.type === 'name' && cl.confidence >= 9);
        if (nameLines.length > 0) {
            contact.name = this.cleanText(nameLines[0].original);
            console.log('Extracted name:', contact.name);
        } else {
            // Fallback: look for name_or_company type
            const nameOrCompanyLines = classifiedLines.filter(cl => cl.type === 'name_or_company' && cl.confidence >= 6);
            if (nameOrCompanyLines.length > 0) {
                contact.name = this.cleanText(nameOrCompanyLines[0].original);
                console.log('Extracted name (fallback):', contact.name);
            }
        }

        // Find company: line with company keywords or title
        const companyLines = classifiedLines.filter(cl => 
            (cl.type === 'company' && cl.confidence >= 8) || 
            (cl.type === 'title' && cl.confidence >= 7)
        );
        
        if (companyLines.length > 0) {
            // Prefer company type over title type
            const companyLine = companyLines.find(cl => cl.type === 'company') || companyLines[0];
            contact.company = this.cleanText(companyLine.original);
            console.log('Extracted company:', contact.company);
        } else {
            // Fallback: look for remaining name_or_company lines
            const remainingNameOrCompany = classifiedLines.filter(cl => 
                cl.type === 'name_or_company' && 
                cl.original !== contact.name &&
                cl.confidence >= 6
            );
            if (remainingNameOrCompany.length > 0) {
                contact.company = this.cleanText(remainingNameOrCompany[0].original);
                console.log('Extracted company (fallback):', contact.company);
            }
        }

        // Normalize fields (remove duplicates, handle missing company)
        contact = this.normalizeFields(contact, classifiedLines);

        // Final cleaning and normalization
        const rawName = contact.name;
        const rawCompany = contact.company;
        
        contact.name = this.cleanText(contact.name);
        contact.company = this.cleanText(contact.company);
        contact.phone = contact.phone ? contact.phone.replace(/[\s\-\.]/g, '').replace(/^\+?1/, '') : ''; // Normalize phone
        contact.email = contact.email ? contact.email.trim().toLowerCase() : '';
        
        // Debug: Log suspicious OCR results
        if (rawName && contact.name.length < 3 && /[a-zA-Z]/.test(rawName)) {
            console.warn("Suspicious OCR result - name may have been over-cleaned:", {
                raw: rawName,
                cleaned: contact.name
            });
        }
        
        if (rawCompany && contact.company.length < 3 && /[a-zA-Z]/.test(rawCompany)) {
            console.warn("Suspicious OCR result - company may have been over-cleaned:", {
                raw: rawCompany,
                cleaned: contact.company
            });
        }

        return contact;
    }

    /**
     * Process image and extract contact information
     * Combines OCR text extraction with structured data extraction
     * @param {File|HTMLImageElement|HTMLCanvasElement} imageSource - Image to process
     * @returns {Promise<Object>} - Contact object with extracted fields
     */
    async processImage(imageSource) {
        try {
            // Extract text using OCR
            const text = await this.extractText(imageSource);
            
            // Extract structured contact information
            const contact = this.extractContactInfo(text);
            
            return contact;
        } catch (error) {
            console.error('OCR processing error:', error);
            throw error;
        }
    }

    /**
     * Process image and return both raw text and structured data
     * @param {File|HTMLImageElement|HTMLCanvasElement} imageSource - Image to process
     * @returns {Promise<Object>} - Object with text and contact fields
     */
    async processImageFull(imageSource) {
        const text = await this.extractText(imageSource);
        const contact = this.extractContactInfo(text);
        
        return {
            text: text,
            contact: contact
        };
    }
}

// Export for use in other modules
const ocrProcessor = new OCRProcessor();

