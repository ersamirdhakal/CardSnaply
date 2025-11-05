/**
 * Contact Parser Utility
 * Ported from web version - extracts structured contact info from OCR text
 * Works offline, no dependencies on web APIs
 */

export class ContactParser {
  constructor() {
    // Regex patterns for extracting contact information
    this.patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /(\+?\d{1,3}[\s\-\.]?)?\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}/g,
      phoneAlt: /(\+?\d{1,4}[\s\-\.]?)?\(?\d{2,4}\)?[\s\-\.]?\d{2,4}[\s\-\.]?\d{2,4}[\s\-\.]?\d{0,4}/g,
      url: /https?:\/\/[^\s]+/g,
    };
  }

  /**
   * Clean OCR text by removing stray punctuation and garbage characters
   */
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/[\u2010-\u2015\u2013\u2014]/g, '-') // Normalize various dash types
      .replace(/^[^a-zA-Z0-9@.\+\s\-,]+|[^a-zA-Z0-9@.\+\s\-,]+$/g, '') // Remove leading/trailing junk
      .replace(/[{}>\])(_+=•|\\/~]+/g, ' ') // Replace common garbage punctuation with spaces
      .replace(/[-_]{2,}/g, ' ') // Replace multiple dashes/underscores
      .replace(/\s{2,}/g, ' ') // Normalize multiple spaces
      .replace(/[^\x00-\x7F]+/g, ' ') // Remove non-ASCII characters
      .replace(/[^\w\s@.+,\-]/g, ' ') // Keep only: word chars, spaces, @, ., +, commas, hyphens
      .replace(/\s{2,}/g, ' ') // Normalize whitespace again
      .trim();
  }

  /**
   * Classify a line by its content clues
   */
  classifyLine(line) {
    const lowerLine = line.toLowerCase();
    const classification = { type: 'unknown', confidence: 0, original: line };

    if (line.includes('@') || this.patterns.email.test(line)) {
      classification.type = 'email';
      classification.confidence = 10;
      return classification;
    }

    if (line.includes('+') || /\d{7,}/.test(line) || this.patterns.phone.test(line) || this.patterns.phoneAlt.test(line)) {
      classification.type = 'phone';
      classification.confidence = 10;
      return classification;
    }

    if (this.patterns.url.test(line) || lowerLine.includes('www.') || lowerLine.includes('.com') || lowerLine.includes('.net') || lowerLine.includes('.org')) {
      classification.type = 'website';
      classification.confidence = 9;
      return classification;
    }

    if (/\b[A-Z]{2}\s+\d{5}\b/.test(line) || /\b\d{5}\b/.test(line) || /\b(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|circle|ct)\b/i.test(line)) {
      classification.type = 'address';
      classification.confidence = 8;
      return classification;
    }

    const companyPatterns = ['inc', 'ltd', 'llc', 'corp', 'pvt', 'limited', 'incorporated', 'company', 'co.', 'group', 'solutions', 'systems', 'services', 'agency'];
    const hasStrongCompanyKeyword = companyPatterns.some(pattern => lowerLine.includes(pattern));
    if (hasStrongCompanyKeyword) {
      classification.type = 'company';
      classification.confidence = 10;
      return classification;
    }

    const titleKeywords = ['agent', 'manager', 'director', 'executive', 'president', 'ceo', 'cfo', 'cto', 'vp', 'vice president', 'specialist', 'consultant', 'advisor', 'representative', 'assistant', 'coordinator'];
    const hasTitleKeyword = titleKeywords.some(keyword => lowerLine.includes(keyword));
    if (hasTitleKeyword) {
      classification.type = 'title';
      classification.confidence = 7;
      if (lowerLine.includes('real estate') || lowerLine.includes('realestate')) {
        classification.type = 'company';
        classification.confidence = 8;
      }
      return classification;
    }

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

    if (words.length >= 2 && allWordsCapitalized && noNumbers && reasonableLength) {
      classification.type = 'name_or_company';
      classification.confidence = 6;
      return classification;
    }

    return classification;
  }

  /**
   * Normalize fields using classified lines
   */
  normalizeFields(contact, classifiedLines) {
    if (!contact.company || contact.company.trim() === '') {
      const titleLine = classifiedLines.find(cl => cl.type === 'title' || (cl.type === 'company' && cl.confidence >= 7));
      if (titleLine) {
        contact.company = this.cleanText(titleLine.original);
      }
    }
    return contact;
  }

  /**
   * Extract structured contact information from OCR text
   */
  extractContactInfo(text) {
    let contact = {
      name: '',
      phone: '',
      email: '',
      company: '',
    };

    if (!text) return contact;

    const cleanedText = this.cleanText(text);

    // Extract email and phone using regex
    const emailMatch = cleanedText.match(this.patterns.email);
    if (emailMatch && emailMatch.length > 0) {
      contact.email = emailMatch[0].trim().toLowerCase();
    }

    const phoneMatch = cleanedText.match(this.patterns.phone) || cleanedText.match(this.patterns.phoneAlt);
    if (phoneMatch && phoneMatch.length > 0) {
      contact.phone = phoneMatch[0].trim();
    }

    // Split text into lines for layout-aware analysis
    let lines = cleanedText.split(/\r?\n/)
      .map(line => this.cleanText(line.trim()))
      .filter(line => line.length > 0);

    // Intelligent single-line splitting for multi-column cards
    if (lines.length === 1 && lines[0].length > 50) {
      const singleLine = lines[0];
      const emailPos = singleLine.search(this.patterns.email);
      const phonePos = singleLine.search(this.patterns.phone) !== -1 ? singleLine.search(this.patterns.phone) : singleLine.search(/\+\d/);
      const websitePos = singleLine.search(this.patterns.url) !== -1 ? singleLine.search(this.patterns.url) : singleLine.search(/www\./i);

      const potentialSplits = [];
      if (emailPos !== -1) potentialSplits.push({ pos: emailPos, type: 'email' });
      if (phonePos !== -1) potentialSplits.push({ pos: phonePos, type: 'phone' });
      if (websitePos !== -1) potentialSplits.push({ pos: websitePos, type: 'website' });
      potentialSplits.sort((a, b) => a.pos - b.pos);

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

    // Classify all lines
    const classifiedLines = lines.map(line => this.classifyLine(line));

    // Extract name
    const nameLines = classifiedLines.filter(cl => cl.type === 'name' && cl.confidence >= 9);
    if (nameLines.length > 0) {
      contact.name = this.cleanText(nameLines[0].original);
    } else {
      const nameOrCompanyLines = classifiedLines.filter(cl => cl.type === 'name_or_company' && cl.confidence >= 6);
      if (nameOrCompanyLines.length > 0) {
        contact.name = this.cleanText(nameOrCompanyLines[0].original);
      }
    }

    // Extract company
    const companyLines = classifiedLines.filter(cl => (cl.type === 'company' && cl.confidence >= 8) || (cl.type === 'title' && cl.confidence >= 7));
    if (companyLines.length > 0) {
      const companyLine = companyLines.find(cl => cl.type === 'company') || companyLines[0];
      contact.company = this.cleanText(companyLine.original);
    } else {
      const remainingNameOrCompany = classifiedLines.filter(cl => cl.type === 'name_or_company' && cl.original !== contact.name && cl.confidence >= 6);
      if (remainingNameOrCompany.length > 0) {
        contact.company = this.cleanText(remainingNameOrCompany[0].original);
      }
    }

    // Normalize fields
    contact = this.normalizeFields(contact, classifiedLines);

    // Final cleaning
    contact.name = this.cleanText(contact.name);
    contact.company = this.cleanText(contact.company);
    contact.phone = contact.phone ? contact.phone.replace(/[\s\-\.]/g, '') : '';
    contact.email = contact.email ? contact.email.trim().toLowerCase() : '';

    return contact;
  }
}

export const contactParser = new ContactParser();

