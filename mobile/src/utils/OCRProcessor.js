/**
 * OCR Processor for React Native
 * Uses ML Kit Text Recognition for offline OCR processing
 * Falls back gracefully in Expo Go (requires native build for full OCR)
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { contactParser } from './ContactParser';

class OCRProcessor {
  constructor() {
    this.mlKitAvailable = false;
    this.checkMLKitAvailability();
  }

  async checkMLKitAvailability() {
    try {
      // Try to import ML Kit (will fail if not available in Expo Go)
      // ML Kit requires native build - won't work in Expo Go
      if (typeof require !== 'undefined') {
        try {
          require('@react-native-ml-kit/text-recognition');
          this.mlKitAvailable = true;
          console.log('ML Kit Text Recognition available');
        } catch (e) {
          console.log('ML Kit not available (requires native build):', e.message);
          this.mlKitAvailable = false;
        }
      }
    } catch (error) {
      console.log('ML Kit check failed:', error.message);
      this.mlKitAvailable = false;
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
   * Extract text from image using ML Kit Text Recognition
   */
  async extractText(uri) {
    try {
      // Prepare image first
      const preparedUri = await this.prepareImage(uri);

      // Try ML Kit Text Recognition if available
      if (this.mlKitAvailable) {
        try {
          const MLKitTextRecognition = require('@react-native-ml-kit/text-recognition');
          const result = await MLKitTextRecognition.recognize(preparedUri);
          const extractedText = result.text || '';
          
          if (extractedText.trim().length > 0) {
            console.log('OCR extracted text:', extractedText.substring(0, 100) + '...');
            return extractedText;
          }
        } catch (mlError) {
          console.log('ML Kit recognition failed:', mlError.message);
        }
      }

      // In Expo Go, ML Kit won't be available
      // Return empty string - user will enter manually
      // For production builds with EAS, ML Kit will work
      console.log('OCR not available - requires native build. Use EAS Build for full OCR support.');
      return '';
    } catch (error) {
      console.error('OCR extraction error:', error);
      return '';
    }
  }

  /**
   * Process image and extract contact information
   */
  async processImage(uri) {
    try {
      const text = await this.extractText(uri);
      
      if (!text || text.trim().length === 0) {
        // No text extracted - return empty contact for manual entry
        // This is expected in Expo Go - ML Kit requires native build
        return {
          name: '',
          phone: '',
          email: '',
          company: '',
        };
      }

      // Parse contact information from extracted text
      const contact = contactParser.extractContactInfo(text);
      console.log('Extracted contact:', contact);
      return contact;
    } catch (error) {
      console.error('Error processing image:', error);
      return {
        name: '',
        phone: '',
        email: '',
        company: '',
      };
    }
  }
}

export const ocrProcessor = new OCRProcessor();

