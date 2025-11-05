/**
 * vCard Handler
 * Ported from web version - handles vCard parsing and generation
 */

export class VCardHandler {
  escape(value) {
    if (!value) return '';
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  unescape(value) {
    if (!value) return '';
    return String(value)
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  generate(contact) {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0'];

    if (contact.name) {
      lines.push(`FN:${this.escape(contact.name)}`);
      const nameParts = contact.name.trim().split(/\s+/);
      if (nameParts.length > 1) {
        lines.push(`N:${this.escape(nameParts[nameParts.length - 1])};${this.escape(nameParts.slice(0, -1).join(' '))};;;`);
      } else {
        lines.push(`N:${this.escape(contact.name)};;;`);
      }
    }

    if (contact.phone) {
      const cleanPhone = contact.phone.replace(/[\s\-\(\)]/g, '');
      lines.push(`TEL;TYPE=CELL:${this.escape(cleanPhone)}`);
    }

    if (contact.email) {
      lines.push(`EMAIL;TYPE=INTERNET:${this.escape(contact.email)}`);
    }

    if (contact.company) {
      lines.push(`ORG:${this.escape(contact.company)}`);
    }

    if (contact.eventTag) {
      lines.push(`X-EVENT-TAG:${this.escape(contact.eventTag)}`);
    }

    lines.push('END:VCARD');
    return lines.join('\r\n');
  }

  parse(vcardString) {
    const contact = {
      name: '',
      phone: '',
      email: '',
      company: '',
      eventTag: '',
    };

    if (!vcardString) return contact;

    const lines = vcardString.split(/[\r\n]+/);

    for (const line of lines) {
      if (!line.trim() || line.startsWith('BEGIN') || line.startsWith('END')) {
        continue;
      }

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
}

export const vCardHandler = new VCardHandler();

