/**
 * Email & WhatsApp Submission Utility
 * Replaces formsubmit.co with Cloudflare Worker / Web3Forms
 * Bodies are plain text: Web3Forms shows the `message` field as text, not rendered HTML.
 * Optional WhatsApp copy (off by default — set sendWhatsAppCopy: true to enable)
 */

window.EmailSubmitter = {
  /**
   * Escape text (e.g. for templates)
   */
  escapeHtml(str) {
    if (str == null || str === '') return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  isHtmlMessage(message) {
    if (!message || typeof message !== 'string') return false;
    const t = message.trimStart();
    return (
      t.startsWith('<!DOCTYPE') ||
      t.startsWith('<html') ||
      t.startsWith('<div') ||
      t.startsWith('<table')
    );
  },

  /**
   * Strip HTML to readable plain text (cached old pages or accidental HTML).
   */
  htmlToReadablePlain(html) {
    if (!html || typeof html !== 'string') return '';
    let t = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(tr|p|div|table|h[1-6])>/gi, '\n')
      .replace(/<t[dh][^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    t = t.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    return t;
  },

  /**
   * Web3Forms / inbox: always send plain text so product & materials read clearly.
   * @param {{ title?: string, rows: { label: string, value?: string, valueHtml?: string }[] }[]} sections
   */
  buildStructuredPlainText(mainTitle, sections) {
    const lines = [];
    const rule = '════════════════════════════════════════════════';
    lines.push(mainTitle);
    lines.push(rule);

    (sections || []).forEach((sec) => {
      lines.push('');
      if (sec.title) {
        lines.push('▸ ' + sec.title);
        lines.push('────────────────────────────────────────────────');
      }
      (sec.rows || []).forEach((row) => {
        let val = '';
        if (row.value != null && row.value !== '') {
          val = String(row.value);
        } else if (row.valueHtml) {
          val = this.htmlToReadablePlain(row.valueHtml);
        }
        const lbl = row.label;
        if (val.indexOf('\n') !== -1) {
          lines.push(lbl + ':');
          val.split(/\r?\n/).forEach((ln) => lines.push('   ' + ln));
        } else {
          lines.push(lbl + ': ' + val);
        }
      });
    });

    lines.push('');
    lines.push('— WoodenMax · ' + new Date().toLocaleString('en-IN'));
    return lines.join('\n');
  },

  /**
   * Multiple calculator rows — vertical blocks (readable on mobile mail).
   */
  buildSizeRowsPlain(rowDetails, hasMesh) {
    const parts = [];
    (rowDetails || []).forEach((row) => {
      parts.push('────────────────────────────────────────────────');
      parts.push('SIZE #' + row.rowNumber);
      parts.push('  Dimensions   : ' + row.width + ' × ' + row.height + ' ' + row.unit);
      parts.push('  Quantity     : ' + row.qty);
      parts.push('  Area / unit  : ' + row.area + ' sq.ft');
      parts.push('  Row area     : ' + row.totalArea + ' sq.ft');
      parts.push('  Glass        : ' + row.glass);
      parts.push('  Coating      : ' + row.coating);
      parts.push('  Lock         : ' + row.lock);
      if (hasMesh) parts.push('  Mesh         : ' + row.mesh);
      parts.push(
        '  Amount       : ' +
          (row.calculatedAmount != null
            ? typeof window.formatPriceFromINR === 'function'
              ? window.formatPriceFromINR(row.calculatedAmount)
              : '\u20B9' + row.calculatedAmount.toLocaleString('en-IN')
            : row.price)
      );
      parts.push('');
    });
    return parts.join('\n').trim();
  },

  normalizeMessageForEmail(message) {
    if (message == null || message === '') return '';
    if (typeof message !== 'string') return String(message);
    if (this.isHtmlMessage(message)) return this.htmlToReadablePlain(message);
    return message;
  },

  /**
   * Submit email via Cloudflare Worker or Web3Forms
   * @param {Object} options
   * @param {string} options.message - Plain text (recommended). HTML is stripped automatically.
   */
  async submit(options) {
    const {
      subject = 'New Quote Request',
      message = '',
      userDetails = {},
      ccEmail = '',                    // optional: send a copy to the lead
      onSuccess = () => {},
      onError = () => {},
      sendWhatsAppCopy = false
    } = options;

    const outboundMessage = this.normalizeMessageForEmail(message);

    const defaultWorkerUrl = 'https://jolly-field-be49.finilexnaseem.workers.dev';
    const workerEndpoint = window.EMAIL_WORKER_URL || defaultWorkerUrl;
    const web3formsAccessKey = window.WEB3FORMS_ACCESS_KEY || 'fd9946a6-03dd-4f6f-bad8-c430f7c6d351';
    const useWeb3FormsDirect =
      workerEndpoint.includes('YOUR_') || workerEndpoint.includes('woodenmax.in/api');

    // WhatsApp copy-on-submit disabled (was causing form submission issues on some devices).
    // Form now sends email only. Keep the sendWhatsApp method below for backward compatibility
    // but do not invoke it from the submit flow.

    if (!useWeb3FormsDirect) {
      try {
        const formData = new FormData();
        formData.append('_subject', subject);
        formData.append('message', outboundMessage);
        formData.append('Name', userDetails.name || '');
        formData.append('Email', userDetails.email || '');
        formData.append('City', userDetails.city || '');
        formData.append('Mobile', userDetails.mobile || '');
        if (ccEmail) formData.append('CC', ccEmail);

        const response = await fetch(workerEndpoint, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Worker HTTP ' + response.status);
        }

        const data = await response.json();
        if (data.success) {
          onSuccess();
          return;
        } else {
          throw new Error(data.message || 'Worker returned error');
        }
      } catch (error) {
        /* Cloudflare Worker failed, trying Web3Forms */
      }
    }

    if (web3formsAccessKey && !web3formsAccessKey.includes('YOUR_')) {
      try {
        const emailData = {
          access_key: web3formsAccessKey,
          subject: subject,
          from_name: userDetails.name || 'WoodenMax Website',
          from_email: userDetails.email || 'noreply@woodenmax.in',
          to_email: 'info@woodenmax.com',
          message: outboundMessage
        };
        if (ccEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+/.test(ccEmail)) {
          emailData.cc = ccEmail;
        }
        if (userDetails.email) {
          emailData.reply_to = userDetails.email;
        }

        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        const data = await response.json();
        if (data.success) {
          onSuccess();
          return;
        } else {
          throw new Error(data.message || 'Failed to send email');
        }
      } catch (error) {
        onError(error);
      }
    } else {
      onError(new Error('Email not configured'));
    }
  },

  // Deprecated: no-op. WhatsApp copy-on-submit removed because the hidden-iframe wa.me hack
  // was interfering with form submission on some mobile browsers. Kept for backward compatibility.
  sendWhatsApp(_message, _userDetails, _whatsappNumber) {
    return;
  }
};
