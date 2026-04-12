/**
 * Email & WhatsApp Submission Utility
 * Replaces formsubmit.co with Cloudflare Worker / Web3Forms
 * Optional WhatsApp copy (off by default — set sendWhatsAppCopy: true to enable)
 * Compatible with Cloudflare
 */

window.EmailSubmitter = {
  /**
   * Submit email via Cloudflare Worker or Web3Forms
   * Optional WhatsApp copy (off by default — set sendWhatsAppCopy: true to enable)
   * @param {Object} options - Email submission options
   * @param {string} options.subject - Email subject
   * @param {string} options.message - Email body/message
   * @param {Object} options.userDetails - User details (name, city, mobile, email)
   * @param {Function} options.onSuccess - Success callback
   * @param {Function} options.onError - Error callback
   */
  async submit(options) {
    const {
      subject = 'New Quote Request',
      message = '',
      userDetails = {},
      onSuccess = () => {},
      onError = () => {},
      sendWhatsAppCopy = false
    } = options;

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
      this.sendWhatsApp(message, userDetails, whatsappNumber);
    }

    // Try Cloudflare Worker first (if configured)
    if (!useWeb3FormsDirect) {
      try {
        const formData = new FormData();
        formData.append('_subject', subject);
        // Message contains: calculator details + contact details (from base.js / extensions)
        formData.append('message', message);
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
          message: message
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
      // Format message for WhatsApp (URL encode)
      const whatsappMessage = encodeURIComponent(message);
      
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

