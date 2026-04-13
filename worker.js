// Cloudflare Worker for Email Forwarding
// Live URL: https://jolly-field-be49.finilexnaseem.workers.dev/
// Set WEB3FORMS_ACCESS_KEY (and optionally RECIPIENT_EMAIL) in Cloudflare Worker settings.
// Web3Forms shows `message` as plain text — strip HTML if a client sends markup.

function htmlToPlainText(s) {
  if (!s || typeof s !== 'string') return '';
  const t = s.trimStart();
  if (
    !t.startsWith('<!DOCTYPE') &&
    !t.startsWith('<html') &&
    !t.startsWith('<div') &&
    !t.startsWith('<table')
  ) {
    return s;
  }
  return s
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
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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

      let emailBody = htmlToPlainText(message || '');

      if (!emailBody.trim() && (name || city || mobile || email)) {
        const lines = [];
        if (name) lines.push(`Name: ${name}`);
        if (city) lines.push(`City: ${city}`);
        if (mobile) lines.push(`Mobile: ${mobile}`);
        if (email) lines.push(`Email: ${email}`);
        emailBody = lines.join('\n');
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
