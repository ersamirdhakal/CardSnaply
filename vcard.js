/**
 * vCard Module
 * Handles vCard format generation and parsing
 * Supports vCard 3.0 specification
 */

class VCardHandler {
    /**
     * Escape special characters in vCard fields
     * @param {string} value - Value to escape
     * @returns {string} - Escaped value
     */
    escape(value) {
        if (!value) return '';
        return String(value)
            .replace(/\\/g, '\\\\')  // Escape backslashes
            .replace(/;/g, '\\;')    // Escape semicolons
            .replace(/,/g, '\\,')    // Escape commas
            .replace(/\n/g, '\\n')   // Escape newlines
            .replace(/\r/g, '');     // Remove carriage returns
    }

    /**
     * Generate vCard 3.0 format string from contact object
     * @param {Object} contact - Contact object with name, phone, email, company
     * @returns {string} - vCard formatted string
     */
    generate(contact) {
        const lines = ['BEGIN:VCARD', 'VERSION:3.0'];

        // Full name (FN field is required)
        if (contact.name) {
            lines.push(`FN:${this.escape(contact.name)}`);
            // Split name into components if possible
            const nameParts = contact.name.trim().split(/\s+/);
            if (nameParts.length > 1) {
                lines.push(`N:${this.escape(nameParts[nameParts.length - 1])};${this.escape(nameParts.slice(0, -1).join(' '))};;;`);
            } else {
                lines.push(`N:${this.escape(contact.name)};;;`);
            }
        }

        // Phone number
        if (contact.phone) {
            // Clean phone number (remove spaces, dashes, etc.)
            const cleanPhone = contact.phone.replace(/[\s\-\(\)]/g, '');
            lines.push(`TEL;TYPE=CELL:${this.escape(cleanPhone)}`);
        }

        // Email
        if (contact.email) {
            lines.push(`EMAIL;TYPE=INTERNET:${this.escape(contact.email)}`);
        }

        // Organization/Company
        if (contact.company) {
            lines.push(`ORG:${this.escape(contact.company)}`);
        }

        // Custom field for event tag
        if (contact.eventTag) {
            lines.push(`X-EVENT-TAG:${this.escape(contact.eventTag)}`);
        }

        // End of vCard
        lines.push('END:VCARD');

        return lines.join('\r\n');
    }

    /**
     * Parse vCard string into contact object
     * @param {string} vcardString - vCard formatted string
     * @returns {Object} - Contact object
     */
    parse(vcardString) {
        const contact = {
            name: '',
            phone: '',
            email: '',
            company: '',
            eventTag: ''
        };

        if (!vcardString) return contact;

        // Split into lines and process
        const lines = vcardString.split(/[\r\n]+/);
        
        for (const line of lines) {
            if (!line.trim() || line.startsWith('BEGIN') || line.startsWith('END')) {
                continue;
            }

            // Parse vCard line format: FIELD:value or FIELD;params:value
            const match = line.match(/^([^:]+):(.+)$/);
            if (!match) continue;

            const [, fieldPart, value] = match;
            const field = fieldPart.split(';')[0].toUpperCase();
            const unescapedValue = this.unescape(value);

            switch (field) {
                case 'FN':
                    contact.name = unescapedValue;
                    break;
                case 'N':
                    // Name field format: Last;First;Middle;Prefix;Suffix
                    const nameParts = value.split(';');
                    if (nameParts.length >= 2) {
                        const first = this.unescape(nameParts[1]);
                        const last = this.unescape(nameParts[0]);
                        contact.name = `${first} ${last}`.trim();
                    } else if (nameParts[0]) {
                        contact.name = this.unescape(nameParts[0]);
                    }
                    break;
                case 'TEL':
                    if (!contact.phone) {
                        contact.phone = unescapedValue;
                    }
                    break;
                case 'EMAIL':
                    if (!contact.email) {
                        contact.email = unescapedValue;
                    }
                    break;
                case 'ORG':
                    contact.company = unescapedValue;
                    break;
                case 'X-EVENT-TAG':
                    contact.eventTag = unescapedValue;
                    break;
            }
        }

        return contact;
    }

    /**
     * Unescape special characters in vCard fields
     * @param {string} value - Escaped value
     * @returns {string} - Unescaped value
     */
    unescape(value) {
        if (!value) return '';
        return String(value)
            .replace(/\\n/g, '\n')   // Unescape newlines
            .replace(/\\,/g, ',')    // Unescape commas
            .replace(/\\;/g, ';')    // Unescape semicolons
            .replace(/\\\\/g, '\\'); // Unescape backslashes
    }

    /**
     * Generate vCard file and trigger download
     * @param {Object} contact - Contact object
     * @param {string} filename - Optional filename (defaults to contact name)
     */
    download(contact, filename = null) {
        const vcardString = this.generate(contact);
        const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `${contact.name || 'contact'}.vcf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Generate vCard for multiple contacts
     * @param {Array<Object>} contacts - Array of contact objects
     * @returns {string} - Combined vCard string
     */
    generateBatch(contacts) {
        return contacts.map(contact => this.generate(contact)).join('\r\n\r\n');
    }

    /**
     * Download multiple contacts as a single vCard file
     * @param {Array<Object>} contacts - Array of contact objects
     * @param {string} filename - Optional filename
     */
    downloadBatch(contacts, filename = 'contacts.vcf') {
        const vcardString = this.generateBatch(contacts);
        const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
}

// Export for use in other modules
const vCardHandler = new VCardHandler();

