/**
 * Sharing Module
 * Handles sharing contacts via WhatsApp and Email
 * Works offline by generating shareable links/formatting
 */

class ShareHandler {
    /**
     * Share contact via WhatsApp
     * Formats contact as text message and opens WhatsApp share link
     * @param {Object} contact - Contact object to share
     */
    shareViaWhatsApp(contact) {
        // Format contact information as text
        let message = `📇 *${contact.name || 'Contact'}*\n\n`;
        
        if (contact.phone) {
            message += `📞 Phone: ${contact.phone}\n`;
        }
        
        if (contact.email) {
            message += `📧 Email: ${contact.email}\n`;
        }
        
        if (contact.company) {
            message += `🏢 Company: ${contact.company}\n`;
        }
        
        if (contact.eventTag) {
            message += `🏷️ Event: ${contact.eventTag}\n`;
        }

        // Generate vCard if needed (for mobile WhatsApp)
        const vcardString = vCardHandler.generate(contact);
        
        // Encode message for URL
        const encodedMessage = encodeURIComponent(message);
        
        // Create WhatsApp share URL
        // For web: whatsapp://send?text=...
        // For mobile: works on both iOS and Android
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        
        // Try to open WhatsApp
        // On mobile, this will open WhatsApp app
        // On desktop, it will open WhatsApp Web
        window.open(whatsappUrl, '_blank');
    }

    /**
     * Share contact via Email
     * Creates mailto link with contact information in body
     * Optionally includes vCard as attachment (data URI)
     * @param {Object} contact - Contact object to share
     * @param {string} recipientEmail - Optional recipient email (defaults to empty)
     */
    shareViaEmail(contact, recipientEmail = '') {
        // Format contact information as email body
        let subject = `Contact: ${contact.name || 'Business Card'}`;
        let body = `Please find the contact information below:\n\n`;
        
        body += `Name: ${contact.name || 'N/A'}\n`;
        if (contact.phone) {
            body += `Phone: ${contact.phone}\n`;
        }
        if (contact.email) {
            body += `Email: ${contact.email}\n`;
        }
        if (contact.company) {
            body += `Company: ${contact.company}\n`;
        }
        if (contact.eventTag) {
            body += `Event: ${contact.eventTag}\n`;
        }
        
        body += `\n\n---\nContact saved from Business Card Scanner`;

        // Encode subject and body for mailto URL
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);
        
        // Create mailto link
        let mailtoUrl = `mailto:${recipientEmail}?subject=${encodedSubject}&body=${encodedBody}`;
        
        // If no recipient, just open with empty to field
        if (!recipientEmail) {
            mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
        }

        // Open email client
        window.location.href = mailtoUrl;
    }

    /**
     * Share contact as vCard file via Email
     * Downloads vCard file and suggests email attachment
     * Note: Cannot directly attach to email programmatically, but downloads file
     * @param {Object} contact - Contact object to share
     */
    shareVCardViaEmail(contact) {
        // Generate and download vCard
        // User can then attach it to email manually
        vCardHandler.download(contact);
        
        // Show a message suggesting to attach to email
        alert('vCard file downloaded. Please attach it to your email.');
    }

    /**
     * Share multiple contacts via WhatsApp
     * Formats all contacts as a message
     * @param {Array<Object>} contacts - Array of contact objects
     */
    shareBatchViaWhatsApp(contacts) {
        let message = `📇 *${contacts.length} Contacts*\n\n`;
        
        contacts.forEach((contact, index) => {
            message += `${index + 1}. *${contact.name || 'Contact'}*\n`;
            if (contact.phone) message += `   📞 ${contact.phone}\n`;
            if (contact.email) message += `   📧 ${contact.email}\n`;
            if (contact.company) message += `   🏢 ${contact.company}\n`;
            if (contact.eventTag) message += `   🏷️ ${contact.eventTag}\n`;
            message += '\n';
        });

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    }

    /**
     * Share multiple contacts via Email
     * Formats all contacts in email body
     * @param {Array<Object>} contacts - Array of contact objects
     * @param {string} recipientEmail - Optional recipient email
     */
    shareBatchViaEmail(contacts, recipientEmail = '') {
        let subject = `${contacts.length} Contacts from Business Card Scanner`;
        let body = `Please find ${contacts.length} contact(s) below:\n\n`;
        
        contacts.forEach((contact, index) => {
            body += `${index + 1}. ${contact.name || 'Contact'}\n`;
            if (contact.phone) body += `   Phone: ${contact.phone}\n`;
            if (contact.email) body += `   Email: ${contact.email}\n`;
            if (contact.company) body += `   Company: ${contact.company}\n`;
            if (contact.eventTag) body += `   Event: ${contact.eventTag}\n`;
            body += '\n';
        });

        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);
        
        let mailtoUrl = `mailto:${recipientEmail}?subject=${encodedSubject}&body=${encodedBody}`;
        if (!recipientEmail) {
            mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
        }

        window.location.href = mailtoUrl;
    }

    /**
     * Copy contact to clipboard as text
     * @param {Object} contact - Contact object
     * @returns {Promise<boolean>} - Success status
     */
    async copyToClipboard(contact) {
        let text = `${contact.name || 'Contact'}\n`;
        if (contact.phone) text += `Phone: ${contact.phone}\n`;
        if (contact.email) text += `Email: ${contact.email}\n`;
        if (contact.company) text += `Company: ${contact.company}\n`;
        if (contact.eventTag) text += `Event: ${contact.eventTag}\n`;

        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }
}

// Export for use in other modules
const shareHandler = new ShareHandler();

