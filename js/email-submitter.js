/**
 * Email & WhatsApp Submission Utility
 * Posts enquiries to the Cloudflare Worker, which sends them through Resend
 * from our verified domain. Bodies are plain text so specs read clearly in the
 * inbox without depending on HTML rendering.
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
   * Inbox: always send plain text so product & materials read clearly.
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
   * Submit an enquiry through the Cloudflare Worker, retrying transport faults.
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

    // The Worker is the only send path. The old direct-to-Web3Forms fallback
    // shipped an API key in page source and put the customer's own address in
    // `from`, which fails SPF/DKIM/DMARC and is why so much of this mail was
    // filed as spam or dropped outright. The Worker sends from our verified
    // domain via Resend instead.
    const MAX_ATTEMPTS = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const formData = new FormData();
        formData.append('_subject', subject);
        formData.append('message', outboundMessage);
        formData.append('Name', userDetails.name || '');
        formData.append('Email', userDetails.email || '');
        formData.append('City', userDetails.city || '');
        formData.append('Mobile', userDetails.mobile || '');
        if (ccEmail) formData.append('CC', ccEmail);

        const response = await fetch(workerEndpoint, { method: 'POST', body: formData });
        const data = await response.json().catch(() => ({}));

        if (response.ok && data.success) {
          onSuccess();
          return;
        }
        // A rejected payload will be rejected again — only retry transport and
        // server-side faults.
        if (response.status >= 400 && response.status < 500) {
          throw new Error(data.error || data.message || ('Rejected (HTTP ' + response.status + ')'));
        }
        lastError = new Error(data.error || data.message || ('Worker HTTP ' + response.status));
      } catch (error) {
        lastError = error;
        if (/Rejected \(HTTP/.test(error.message || '')) break;
      }

      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, attempt * 1200));
      }
    }

    onError(lastError || new Error('Email could not be sent'));
  },

  // Deprecated: no-op. WhatsApp copy-on-submit removed because the hidden-iframe wa.me hack
  // was interfering with form submission on some mobile browsers. Kept for backward compatibility.
  sendWhatsApp(_message, _userDetails, _whatsappNumber) {
    return;
  }
};
