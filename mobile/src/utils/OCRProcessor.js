/**
 * OCR Processor for React Native
 * Uses Tesseract.js to extract text from business card images
 * 100% offline operation - no native modules required
 * Matches web version implementation
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { createWorker } from 'tesseract.js';
import { contactParser } from './ContactParser';

class OCRProcessor {
  constructor() {
    // Regex patterns for extracting contact information (matching web version)
    this.patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /(\+?\d{1,3}[\s\-\.]?)?\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}/g,
      phoneAlt: /(\+?\d{1,4}[\s\-\.]?)?\(?\d{2,4}\)?[\s\-\.]?\d{2,4}[\s\-\.]?\d{2,4}[\s\-\.]?\d{0,4}/g,
      url: /https?:\/\/[^\s]+/g,
    };

    // Initialize Tesseract worker
    this.worker = null;
    this.initAttempts = 0;
    this.maxInitAttempts = 2;
  }

  /**
   * Initialize Tesseract.js worker
   * Uses CDN by default (works offline after first load)
   */
  async init() {
    // Reuse existing worker if already initialized
    if (this.worker) {
      return this.worker;
    }

    // Retry initialization if it fails
    for (let attempt = 1; attempt <= this.maxInitAttempts; attempt++) {
      try {
        this.initAttempts = attempt;
        console.log(`OCR initialization attempt ${attempt}/${this.maxInitAttempts}`);

        // Create Tesseract worker
        // Tesseract.js will use CDN for worker and language data
        this.worker = await createWorker({
          logger: (m) => {
            // Log progress if needed
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          },
        });

        // Load and initialize English language
        await this.worker.loadLanguage('eng');
        await this.worker.initialize('eng');

        console.log('OCR initialized successfully');
        this.initAttempts = 0; // Reset attempts on success
        return this.worker;
      } catch (error) {
        console.error(`OCR initialization attempt ${attempt} failed:`, error);

        // Clean up failed worker
        if (this.worker) {
          try {
            await this.worker.terminate();
          } catch (e) {
            // Ignore termination errors
          }
          this.worker = null;
        }

        // If this was the last attempt, throw error
        if (attempt === this.maxInitAttempts) {
          throw new Error(`OCR initialization failed after ${this.maxInitAttempts} attempts: ${error.message}`);
        }

        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Prepare image for OCR processing
   */
  async prepareImage(uri) {
    try {
      // Resize and optimize image for better OCR results
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 1600 } }, // Resize to max width for faster processing
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return manipulatedImage.uri;
    } catch (error) {
      console.error('Error preparing image:', error);
      return uri; // Return original if manipulation fails
    }
  }

  /**
   * Convert image URI to base64 data URL for Tesseract.js
   */
  async imageUriToDataURL(uri) {
    try {
      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Determine MIME type from URI
      const mimeType = uri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';

      // Return as data URL (Tesseract.js can process this)
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Error converting image to data URL:', error);
      throw error;
    }
  }

  /**
   * Clean and sanitize OCR text by removing garbage characters
   * Matches web version's cleanText method
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
   * Extract text from image using Tesseract.js OCR
   * @param {string} uri - Image URI to process
   * @returns {Promise<string>} - Extracted text
   */
  async extractText(uri) {
    try {
      await this.init();

      // Prepare image first
      const preparedUri = await this.prepareImage(uri);

      // Convert image URI to data URL for Tesseract.js
      const imageDataURL = await this.imageUriToDataURL(preparedUri);

      // Perform OCR
      const { data: { text } } = await this.worker.recognize(imageDataURL);

      // Clean the raw OCR text before returning (matching web version)
      const cleanedText = this.cleanText(text);

      // Log if significant cleaning occurred (for debugging)
      if (text !== cleanedText && text.length > 0) {
        console.log('OCR text cleaned:', {
          originalLength: text.length,
          cleanedLength: cleanedText.length,
          removed: text.length - cleanedText.length,
        });
      }

      if (cleanedText.trim().length > 0) {
        console.log('OCR extracted text:', cleanedText.substring(0, 100) + '...');
        return cleanedText;
      } else {
        console.log('OCR returned empty text');
        return '';
      }
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw error;
    }
  }

  /**
   * Terminate Tesseract worker (cleanup)
   */
  async terminate() {
    if (this.worker) {
      try {
        await this.worker.terminate();
        this.worker = null;
        console.log('OCR worker terminated');
      } catch (error) {
        console.error('Error terminating OCR worker:', error);
      }
    }
  }

  /**
   * Process image and extract contact information
   * Combines OCR text extraction with structured data extraction
   * Matches web version's processImage method
   * @param {string} uri - Image URI to process
   * @returns {Promise<Object>} - Contact object with extracted fields
   */
  async processImage(uri) {
    try {
      // Extract text using OCR
      const text = await this.extractText(uri);

      if (!text || text.trim().length === 0) {
        // No text extracted - return empty contact for manual entry
        return {
          name: '',
          phone: '',
          email: '',
          company: '',
          address: '',
          notes: '',
        };
      }

      // Extract structured contact information using ContactParser (same as web version)
      const contact = contactParser.extractContactInfo(text);

      // Add address and notes fields
      contact.address = contact.address || '';
      contact.notes = '';

      console.log('Extracted contact:', contact);
      return contact;
    } catch (error) {
      console.error('OCR processing error:', error);
      // Return empty contact so user can enter manually
      return {
        name: '',
        phone: '',
        email: '',
        company: '',
        address: '',
        notes: '',
      };
    }
  }
}

export const ocrProcessor = new OCRProcessor();
