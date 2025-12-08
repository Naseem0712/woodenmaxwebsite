// Cloudflare Worker for Email Forwarding
// Deploy this to Cloudflare Workers dashboard
// Route: /api/submit or /api/email

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Get form data
      const formData = await request.formData();
      
      // Extract fields
      const subject = formData.get('_subject') || formData.get('subject') || 'New Quote Request';
      const message = formData.get('message') || formData.get('body') || '';
      const name = formData.get('Name') || formData.get('name') || '';
      const city = formData.get('City') || formData.get('city') || '';
      const mobile = formData.get('Mobile') || formData.get('mobile') || '';
      const email = formData.get('Email') || formData.get('email') || '';
      
      // Build email body
      let emailBody = message;
      
      // Add user details if not in message
      if (name || city || mobile || email) {
        emailBody = `Name: ${name}\n`;
        emailBody += `City: ${city}\n`;
        emailBody += `Mobile: ${mobile}\n`;
        if (email) emailBody += `Email: ${email}\n`;
        emailBody += `\n---\n\n${message}`;
      }
      
      // Use Web3Forms API (free alternative to formsubmit)
      // Get access key from environment variable (set in Cloudflare Dashboard)
      const accessKey = env.WEB3FORMS_ACCESS_KEY || 'fd9946a6-03dd-4f6f-bad8-c430f7c6d351';
      const recipientEmail = 'info@woodenmax.com'; // Always send to info@woodenmax.com
      
      // Send email via Web3Forms API
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
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully' 
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } else {
        throw new Error(result.message || 'Failed to send email');
      }
      
    } catch (error) {
      console.error('Error processing email:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        message: error.message || 'Failed to send email' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};

