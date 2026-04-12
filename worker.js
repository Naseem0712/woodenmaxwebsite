// Cloudflare Worker for Email Forwarding
// Live URL: https://jolly-field-be49.finilexnaseem.workers.dev/
// Set WEB3FORMS_ACCESS_KEY (and optionally RECIPIENT_EMAIL) in Cloudflare Worker settings.

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const formData = await request.formData();

      const subject =
        formData.get('_subject') || formData.get('subject') || 'New Quote Request';
      const message = formData.get('message') || formData.get('body') || '';
      const name = formData.get('Name') || formData.get('name') || '';
      const city = formData.get('City') || formData.get('city') || '';
      const mobile = formData.get('Mobile') || formData.get('mobile') || '';
      const email = formData.get('Email') || formData.get('email') || '';

      let emailBody = message;

      const msgTrim = (message || '').trimStart();
      const messageIsHtml =
        msgTrim.startsWith('<!DOCTYPE') ||
        msgTrim.startsWith('<html') ||
        msgTrim.startsWith('<div') ||
        msgTrim.startsWith('<table');

      // Plain text: prepend contact block. HTML bodies are already structured (tables); prepending breaks layout and duplicates details.
      if (!messageIsHtml && (name || city || mobile || email)) {
        emailBody = `Name: ${name}\n`;
        emailBody += `City: ${city}\n`;
        emailBody += `Mobile: ${mobile}\n`;
        if (email) emailBody += `Email: ${email}\n`;
        emailBody += `\n---\n\n${message}`;
      }

      const accessKey =
        env.WEB3FORMS_ACCESS_KEY || 'fd9946a6-03dd-4f6f-bad8-c430f7c6d351';
      const recipientEmail = env.RECIPIENT_EMAIL || 'info@woodenmax.com';

      const web3formsResponse = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: subject,
          from_name: name || 'WoodenMax Website',
          from_email: email || 'noreply@woodenmax.in',
          to_email: recipientEmail,
          message: emailBody,
        }),
      });

      const result = await web3formsResponse.json();

      if (result.success) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Email sent successfully',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } else {
        throw new Error(result.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error processing email:', error);
      return new Response(
        JSON.stringify({
          success: false,
          message: error.message || 'Failed to send email',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};
