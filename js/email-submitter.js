/**
 * Email Submission Utility
 * Replaces formsubmit.co with Cloudflare Worker / Web3Forms
 * Compatible with Cloudflare
 */

window.EmailSubmitter = {
  /**
   * Submit email via Cloudflare Worker or Web3Forms
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

    // Try Cloudflare Worker first (if configured)
    if (!useWeb3FormsDirect) {
      try {
        const formData = new FormData();
        formData.append('_subject', subject);
        formData.append('message', message);
        formData.append('Name', userDetails.name || '');
        formData.append('City', userDetails.city || '');
        formData.append('Mobile', userDetails.mobile || '');
        if (userDetails.email) {
          formData.append('Email', userDetails.email);
        }

        const response = await fetch(workerEndpoint, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          console.log('✅ Email submitted via Cloudflare Worker');
          onSuccess();
          return;
        }
      } catch (error) {
        console.warn('⚠️ Cloudflare Worker failed, trying Web3Forms...', error);
      }
    }

    // Fallback to Web3Forms
    if (web3formsAccessKey && !web3formsAccessKey.includes('YOUR_')) {
      try {
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
          console.log('✅ Email sent via Web3Forms');
          onSuccess();
          return;
        } else {
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
  }
};

