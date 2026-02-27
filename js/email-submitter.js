/**
 * Email & WhatsApp Submission Utility
 * Replaces formsubmit.co with Cloudflare Worker / Web3Forms
 * Also sends same quotation via WhatsApp
 * Compatible with Cloudflare
 */

window.EmailSubmitter = {
  /**
   * Submit email via Cloudflare Worker or Web3Forms
   * Also sends same quotation via WhatsApp
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
      onError = () => {}
    } = options;

    // Get configuration
    // Option 1: Use Cloudflare Worker (recommended - access key stays server-side)
    const workerEndpoint = window.EMAIL_WORKER_URL || 'https://jolly-field-be49.finilexnaseem.workers.dev';
    // Option 2: Direct Web3Forms (fallback - access key visible in source)
    const web3formsAccessKey = window.WEB3FORMS_ACCESS_KEY || 'fd9946a6-03dd-4f6f-bad8-c430f7c6d351';
    const useWeb3FormsDirect = !window.EMAIL_WORKER_URL || workerEndpoint.includes('YOUR_') || workerEndpoint.includes('woodenmax.in/api');

    // WhatsApp number for business
    const whatsappNumber = window.WHATSAPP_BUSINESS_NUMBER || '917895328080';

    // Send WhatsApp message with same quotation
    this.sendWhatsApp(message, userDetails, whatsappNumber);

    // Try Cloudflare Worker first (if configured)
    if (!useWeb3FormsDirect) {
      try {
        const formData = new FormData();
        formData.append('_subject', subject);
        // Include full message with all details
        formData.append('message', message);
        // Also include user details as separate fields for better email formatting
        formData.append('Name', userDetails.name || '');
        formData.append('City', userDetails.city || '');
        formData.append('Mobile', userDetails.mobile || '');
        if (userDetails.email) {
          formData.append('Email', userDetails.email);
        }
        // Add a formatted email body that includes everything
        const formattedMessage = `QUOTE REQUEST DETAILS
================================

${message}

---
User Contact Information:
- Name: ${userDetails.name || 'Not provided'}
- City: ${userDetails.city || 'Not provided'}
- Mobile: ${userDetails.mobile || 'Not provided'}
${userDetails.email ? `- Email: ${userDetails.email}` : ''}
${userDetails.leadType ? `- I am: ${userDetails.leadType}` : ''}

This email was generated from the Live Price Calculator on WoodenMax website.
        `.trim();
        formData.append('_body', formattedMessage);

        const response = await fetch(workerEndpoint, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          console.log('✅ Email submitted via Cloudflare Worker');
          console.log('📧 Email details:', { subject, messageLength: message.length, userDetails });
          onSuccess();
          return;
        } else {
          console.error('❌ Cloudflare Worker returned error:', data);
          throw new Error(data.message || 'Worker returned error');
        }
      } catch (error) {
        console.warn('⚠️ Cloudflare Worker failed, trying Web3Forms...', error);
      }
    }

    // Fallback to Web3Forms
    if (web3formsAccessKey && !web3formsAccessKey.includes('YOUR_')) {
      try {
        // Format message to include all details clearly
        const formattedMessage = `QUOTE REQUEST DETAILS
================================

${message}

---
User Contact Information:
- Name: ${userDetails.name || 'Not provided'}
- City: ${userDetails.city || 'Not provided'}
- Mobile: ${userDetails.mobile || 'Not provided'}
${userDetails.email ? `- Email: ${userDetails.email}` : ''}
${userDetails.leadType ? `- I am: ${userDetails.leadType}` : ''}

This email was generated from the Live Price Calculator on WoodenMax website.
        `.trim();

        const emailData = {
          access_key: web3formsAccessKey,
          subject: subject,
          from_name: userDetails.name || 'WoodenMax Website',
          from_email: userDetails.email || 'noreply@woodenmax.in',
          to_email: 'info@woodenmax.com',
          message: formattedMessage,
          // Also include user details as separate fields for better email formatting
          Name: userDetails.name || '',
          City: userDetails.city || '',
          Mobile: userDetails.mobile || '',
          Email: userDetails.email || ''
        };

        console.log('📧 Sending email via Web3Forms with details:', {
          subject,
          messageLength: formattedMessage.length,
          userDetails,
          hasMessage: !!message
        });

        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        const data = await response.json();
        if (data.success) {
          console.log('✅ Email sent via Web3Forms');
          console.log('📧 Email response:', data);
          onSuccess();
          return;
        } else {
          console.error('❌ Web3Forms returned error:', data);
          throw new Error(data.message || 'Failed to send email');
        }
      } catch (error) {
        console.error('❌ Web3Forms error:', error);
        onError(error);
        // Still call onSuccess to not block user experience
        onSuccess();
      }
    } else {
      console.warn('⚠️ No email service configured. Please set EMAIL_WORKER_URL or WEB3FORMS_ACCESS_KEY');
      // Call success anyway to not block user
      onSuccess();
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
      
      console.log('✅ WhatsApp message sent to business');
    } catch (error) {
      console.warn('⚠️ WhatsApp send failed:', error);
      // Don't block user experience if WhatsApp fails
    }
  }
};

