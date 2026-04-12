/**
 * Email & WhatsApp Submission Utility
 * Replaces formsubmit.co with Cloudflare Worker / Web3Forms
 * Optional WhatsApp copy (off by default — set sendWhatsAppCopy: true to enable)
 * Compatible with Cloudflare
 */

window.EmailSubmitter = {
  /**
   * Escape text for safe HTML email bodies
   */
  escapeHtml(str) {
    if (str == null || str === '') return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  /**
   * Detect if message is already HTML (do not double-wrap)
   */
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
   * Structured enquiry email: sections of label/value rows (tables work in Gmail, mobile, etc.)
   * @param {string} mainTitle
   * @param {{ title?: string, rows: { label: string, value?: string, valueHtml?: string }[] }[]} sections
   */
  buildStructuredHtml(mainTitle, sections) {
    const e = this.escapeHtml.bind(this);
    const wrap =
      'margin:0;padding:0;background:#f1f5f9;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;';
    const inner =
      'max-width:640px;margin:0 auto;padding:18px 14px;font-family:Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;font-size:16px;line-height:1.55;color:#0f172a;';
    const h1 =
      'font-size:20px;font-weight:700;margin:0 0 18px;padding-bottom:10px;border-bottom:3px solid #1e40af;color:#0f172a;';
    const h2 =
      'font-size:13px;font-weight:700;margin:22px 0 10px;text-transform:uppercase;letter-spacing:0.05em;color:#1e40af;';
    const tbl =
      'width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:6px;';
    const th =
      'text-align:left;padding:12px 14px;background:#f8fafc;color:#475569;font-weight:600;font-size:14px;width:36%;vertical-align:top;border-bottom:1px solid #e2e8f0;';
    const td =
      'padding:12px 14px;border-bottom:1px solid #f1f5f9;word-break:break-word;vertical-align:top;font-size:15px;color:#1e293b;';
    const footer =
      'margin-top:18px;padding-top:14px;border-top:1px solid #cbd5e1;font-size:12px;color:#64748b;';

    const parts = [];
    parts.push('<div style="' + wrap + '"><div style="' + inner + '">');
    parts.push('<h1 style="' + h1 + '">' + e(mainTitle) + '</h1>');

    (sections || []).forEach((sec) => {
      if (sec.title) {
        parts.push('<h2 style="' + h2 + '">' + e(sec.title) + '</h2>');
      }
      parts.push(
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="' +
          tbl +
          '" width="100%">'
      );
      (sec.rows || []).forEach((row) => {
        const val =
          row.valueHtml != null
            ? row.valueHtml
            : '<span style="white-space:pre-wrap;">' +
              e(row.value != null ? row.value : '') +
              '</span>';
        parts.push(
          '<tr><th style="' + th + '">' + e(row.label) + '</th><td style="' + td + '">' + val + '</td></tr>'
        );
      });
      parts.push('</table>');
    });

    parts.push(
      '<p style="' + footer + '">WoodenMax · ' + e(new Date().toLocaleString('en-IN')) + '</p>'
    );
    parts.push('</div></div>');
    return parts.join('');
  },

  /**
   * Simple data grid for multi-line quotes (e.g. multiple sizes). All cell text is escaped.
   */
  buildGridHtml(headers, rows) {
    const e = this.escapeHtml.bind(this);
    const tableStyle =
      'width:100%;border-collapse:collapse;font-size:14px;margin:4px 0 12px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;';
    const thStyle =
      'padding:9px 10px;background:#f1f5f9;font-weight:600;text-align:left;border-bottom:1px solid #e2e8f0;color:#475569;font-size:13px;';
    const tdStyle =
      'padding:9px 10px;border-bottom:1px solid #f1f5f9;vertical-align:top;word-break:break-word;';
    let h =
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="' +
      tableStyle +
      '"><thead><tr>';
    headers.forEach(function (hd) {
      h += '<th style="' + thStyle + '">' + e(hd) + '</th>';
    });
    h += '</tr></thead><tbody>';
    (rows || []).forEach(function (row) {
      h += '<tr>';
      row.forEach(function (cell) {
        h += '<td style="' + tdStyle + '">' + e(cell != null ? String(cell) : '') + '</td>';
      });
      h += '</tr>';
    });
    h += '</tbody></table>';
    return h;
  },

  /**
   * Turn plain-text quote bodies (extensions, legacy) into readable HTML: sections + key:value tables where possible.
   */
  coercePlainTextToHtml(plain) {
    if (!plain || typeof plain !== 'string') return '';
    if (this.isHtmlMessage(plain)) return plain;

    const e = this.escapeHtml.bind(this);
    const lines = plain.replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let kvRows = [];
    let textLines = [];

    function flushText() {
      if (!textLines.length) return;
      const t = textLines.join('\n').trim();
      if (t) {
        blocks.push({ type: 'text', content: t });
      }
      textLines = [];
    }
    function flushKv() {
      if (!kvRows.length) return;
      blocks.push({ type: 'kv', rows: kvRows.slice() });
      kvRows = [];
    }

    const kvLine = /^([^:\n]{1,72}):\s*(.*)$/;
    const sepLine = /^[\s═\-━┅═\u2550\u2500\u254d]+$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flushKv();
        textLines.push('');
        continue;
      }

      if (sepLine.test(trimmed) && trimmed.length >= 3) {
        flushKv();
        textLines.push(line);
        continue;
      }

      const m = line.match(kvLine);
      if (m && m[1].trim().length > 0) {
        flushText();
        kvRows.push({ label: m[1].trim(), value: m[2] });
      } else {
        flushKv();
        textLines.push(line);
      }
    }
    flushKv();
    flushText();

    const tbl =
      'width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;margin:12px 0;';
    const th =
      'text-align:left;padding:10px 12px;background:#f8fafc;color:#475569;font-weight:600;font-size:14px;width:36%;vertical-align:top;border-bottom:1px solid #e2e8f0;';
    const td =
      'padding:10px 12px;border-bottom:1px solid #f1f5f9;word-break:break-word;vertical-align:top;font-size:15px;';
    const h3 =
      'font-size:14px;font-weight:700;margin:16px 0 8px;color:#1e40af;';
    const pre =
      'margin:10px 0;padding:12px 14px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;font-size:15px;line-height:1.55;color:#1e293b;white-space:pre-wrap;word-break:break-word;';

    let html =
      '<div style="margin:0;padding:0;background:#f1f5f9;-webkit-text-size-adjust:100%;"><div style="max-width:640px;margin:0 auto;padding:16px 12px;font-family:Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;font-size:16px;color:#0f172a;">';

    blocks.forEach((b) => {
      if (b.type === 'kv') {
        html +=
          '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="' +
          tbl +
          '" width="100%">';
        b.rows.forEach((r) => {
          html +=
            '<tr><th style="' +
            th +
            '">' +
            e(r.label) +
            '</th><td style="' +
            td +
            '"><span style="white-space:pre-wrap;">' +
            e(r.value) +
            '</span></td></tr>';
        });
        html += '</table>';
      } else {
        const content = b.content;
        if (/^[\s═\-━\u2550\u2500]+$/m.test(content) && content.length < 120) {
          return;
        }
        if (/^[═\-].+[═\-]$/s.test(content.trim()) && content.length < 200) {
          html += '<h3 style="' + h3 + '">' + e(content.replace(/^[═\-=\s]+|[═\-=\s]+$/g, '').trim()) + '</h3>';
        } else {
          html += '<div style="' + pre + '">' + e(content) + '</div>';
        }
      }
    });

    html +=
      '<p style="margin-top:16px;padding-top:12px;border-top:1px solid #cbd5e1;font-size:12px;color:#64748b;">WoodenMax · ' +
      e(new Date().toLocaleString('en-IN')) +
      '</p></div></div>';
    return html;
  },

  /**
   * Submit email via Cloudflare Worker or Web3Forms
   * Optional WhatsApp copy (off by default — set sendWhatsAppCopy: true to enable)
   * @param {Object} options - Email submission options
   * @param {string} options.subject - Email subject
   * @param {string} options.message - Email body/message
   * @param {boolean} [options.messageIsHtml] - If true, message is sent as HTML as-is (no plain coercion)
   * @param {Object} options.userDetails - User details (name, city, mobile, email)
   * @param {Function} options.onSuccess - Success callback
   * @param {Function} options.onError - Error callback
   */
  async submit(options) {
    const {
      subject = 'New Quote Request',
      message = '',
      messageIsHtml = false,
      userDetails = {},
      onSuccess = () => {},
      onError = () => {},
      sendWhatsAppCopy = false
    } = options;

    const outboundMessage =
      messageIsHtml === true || this.isHtmlMessage(message)
        ? message
        : this.coercePlainTextToHtml(message);

    // Cloudflare Worker first (same URL site-wide — override with window.EMAIL_WORKER_URL if needed)
    const defaultWorkerUrl = 'https://jolly-field-be49.finilexnaseem.workers.dev';
    const workerEndpoint = window.EMAIL_WORKER_URL || defaultWorkerUrl;
    // Direct Web3Forms only when Worker URL is explicitly a placeholder (not when EMAIL_WORKER_URL is omitted)
    const web3formsAccessKey = window.WEB3FORMS_ACCESS_KEY || 'fd9946a6-03dd-4f6f-bad8-c430f7c6d351';
    const useWeb3FormsDirect =
      workerEndpoint.includes('YOUR_') || workerEndpoint.includes('woodenmax.in/api');

    // WhatsApp number for business
    const whatsappNumber = window.WHATSAPP_BUSINESS_NUMBER || '917895328080';

    if (sendWhatsAppCopy === true || window.EMAIL_SUBMIT_ALSO_WHATSAPP === true) {
      this.sendWhatsApp(outboundMessage, userDetails, whatsappNumber);
    }

    // Try Cloudflare Worker first (if configured)
    if (!useWeb3FormsDirect) {
      try {
        const formData = new FormData();
        formData.append('_subject', subject);
        // Message contains: calculator details + contact details (from base.js / extensions)
        formData.append('message', outboundMessage);
        formData.append('Name', userDetails.name || '');
        formData.append('Email', userDetails.email || '');
        formData.append('City', userDetails.city || '');
        formData.append('Mobile', userDetails.mobile || '');

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

    // Fallback to Web3Forms
    if (web3formsAccessKey && !web3formsAccessKey.includes('YOUR_')) {
      try {
        // Message already contains: calculator details + contact details (from base.js) - use as-is
        const emailData = {
          access_key: web3formsAccessKey,
          subject: subject,
          from_name: userDetails.name || 'WoodenMax Website',
          from_email: userDetails.email || 'noreply@woodenmax.in',
          to_email: 'info@woodenmax.com',
          message: outboundMessage
        };

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

  /**
   * Send WhatsApp message with quotation
   * @param {string} message - The quotation message
   * @param {Object} userDetails - User details
   * @param {string} whatsappNumber - Business WhatsApp number
   */
  sendWhatsApp(message, userDetails, whatsappNumber) {
    try {
      let plain = message || '';
      if (plain.includes('<')) {
        plain = plain
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/(p|div|tr|h[1-6])>/gi, '\n')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+\n/g, '\n')
          .replace(/[ \t]+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      }
      const whatsappMessage = encodeURIComponent(plain);
      
      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
      
      // Open WhatsApp in new tab/window (silent - user won't see it)
      // We use a hidden iframe to send the message without user interaction
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = whatsappUrl;
      document.body.appendChild(iframe);
      
      // Remove iframe after a short delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    } catch (error) {
      /* Don't block user experience if WhatsApp fails */
    }
  }
};

