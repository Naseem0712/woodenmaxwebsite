module.exports.pageConfig = {
  slug: 'privacy-policy',
  silo: 'policies',
  out:  'policies/privacy-policy.html',
  canonical: '/policies/privacy-policy',
  title: 'WoodenMax Privacy Policy 2026 | What Data We Collect, How We Use It',
  description: 'Plain-language privacy policy — exactly what personal data WoodenMax collects on calculators, quote forms and PDFs; how long we keep it; who we share it with; and how to delete your data under India\'s DPDP Act.',
  ogImage: 'https://woodenmax.in/images/woodenmax-logo.webp',
  schemaType: 'Article',
  breadcrumb: [
    { label: 'Home',     href: '/' },
    { label: 'Policies', href: '/policies/' },
    { label: 'Privacy Policy' }
  ],
  h1: 'Privacy Policy',
  hero: {
    sub: 'Last updated: 18 May 2026. We follow the Digital Personal Data Protection Act, 2023 (DPDP) — this page explains it in plain English.',
    points: [
      'We collect <strong>only the minimum data</strong> needed to quote &amp; install',
      '<strong>No sale or rental</strong> of your data to third parties — ever',
      'Data stored on <strong>Indian servers</strong> (AWS Mumbai region)',
      'You can request <strong>full deletion</strong> at any time — done in 30 days'
    ]
  },
  sections: [
    {
      heading: '1. What data we collect',
      table: {
        head: ['Where', 'What we capture', 'Why'],
        rows: [
          ['<strong>Price calculators</strong>', 'Dimensions, configuration, derived price', 'Stored only in your browser\'s localStorage to remember your saved project estimate. Not transmitted to us until you submit a quote form.'],
          ['<strong>Quote / contact form</strong>', 'Name, mobile, email, PIN code, project address (optional)', 'To call you back, schedule site visit, ship the PDF quote.'],
          ['<strong>WhatsApp inquiries</strong>', 'Phone number, message thread', 'To respond to your inquiry. We use Meta\'s WhatsApp Business API.'],
          ['<strong>Phone calls to/from us</strong>', 'Call recording (where mandated), call duration, agent notes', 'Training, quality, dispute resolution. Recordings deleted after 90 days.'],
          ['<strong>Site analytics</strong>', 'Pseudonymous device ID, page-view path, source channel', 'Improve product pages &amp; calculator UX. Tracked via Google Analytics 4 with IP anonymisation on.'],
          ['<strong>Payment</strong>', 'Last 4 digits of card / UPI handle, transaction ID', 'Reconciliation. We never see or store full card numbers — handled by our PCI-DSS Level-1 gateway (Razorpay).']
        ]
      }
    },
    {
      heading: '2. Cookies &amp; tracking',
      body:
        '<p>We use three categories of cookies:</p>' +
        '<ul class="cluster-list">' +
          '<li><strong>Essential</strong> — calculator project estimate (saved configurations), language, cookie consent itself. Cannot be turned off; the site won\'t work without them.</li>' +
          '<li><strong>Analytics</strong> — Google Analytics 4 (anonymised IP), Microsoft Clarity (privacy mode). You can turn these off via our cookie banner.</li>' +
          '<li><strong>Marketing</strong> — Meta Pixel, Google Ads conversion. You can turn these off via our cookie banner.</li>' +
        '</ul>' +
        '<p>We do <strong>not</strong> use cross-site advertising tracking. We do not buy or sell data through Data Management Platforms.</p>'
    },
    {
      heading: '3. How long we keep your data',
      list: [
        '<strong>Quote requests not converted to orders</strong>: 18 months, then anonymised',
        '<strong>Customer orders</strong>: 8 years (statutory GST audit requirement)',
        '<strong>Call recordings</strong>: 90 days',
        '<strong>WhatsApp chats</strong>: as per Meta retention defaults (up to 7 years)',
        '<strong>Web analytics</strong>: 14 months at Google\'s end',
        '<strong>Marketing cookies</strong>: 365 days max, often less'
      ]
    },
    {
      heading: '4. Who we share data with',
      cards: [
        { icon: 'A', title: 'Service providers', body: 'AWS (hosting, Mumbai region), Razorpay (payments, India), Google Workspace (email, EU region — DPF certified), Meta WhatsApp Business (messaging), Zoho CRM (sales pipeline, India).' },
        { icon: 'B', title: 'Logistics partners', body: 'BlueDart, Delhivery, project-specific transporters — only the delivery address &amp; phone number, only for the duration of shipment.' },
        { icon: 'C', title: 'Statutory authorities', body: 'GSTN (for e-invoicing &amp; e-way bills), Income-tax dept (TDS reporting), only as legally required.' },
        { icon: 'D', title: 'Never with', body: 'Advertising networks, data brokers, lead-resale services, "marketing list" buyers. We have never sold or rented a single customer record.' }
      ]
    },
    {
      heading: '5. Your rights under DPDP 2023',
      body:
        '<p>India\'s Digital Personal Data Protection Act, 2023 gives you the following rights — and we honour all of them, regardless of whether the rules are notified for our category yet:</p>' +
        '<ul class="cluster-list">' +
          '<li><strong>Right to access</strong> — get a copy of every record we hold about you</li>' +
          '<li><strong>Right to correct</strong> — fix any inaccurate detail</li>' +
          '<li><strong>Right to erase</strong> — request deletion (within 30 days; some data retained per statutory rules above)</li>' +
          '<li><strong>Right to nominate</strong> — choose someone to act on your behalf in case of incapacity</li>' +
          '<li><strong>Right to grievance redressal</strong> — escalate to our Data Protection Officer (below)</li>' +
        '</ul>'
    },
    {
      heading: '6. Data Protection Officer',
      body:
        '<p>For any privacy-related request:</p>' +
        '<p><strong>Email:</strong> <a href="mailto:dpo@woodenmax.in">dpo@woodenmax.in</a><br>' +
        '<strong>Phone:</strong> +91 78953 28080<br>' +
        '<strong>Postal:</strong> Data Protection Officer, WoodenMax, Plot 51, Nampally, Hyderabad — 500001</p>' +
        '<p>You will receive an acknowledgement within 24 hours and a substantive response within 7 working days. Unresolved complaints can be escalated to the Data Protection Board of India once the appellate framework is notified.</p>'
    },
    {
      heading: '7. Children\'s data',
      body:
        '<p>We do not knowingly collect data from anyone under 18. Our site is a B2C/B2B sales channel for high-value home-improvement products and is not directed at children. If you believe a child has submitted personal data to us, email <a href="mailto:dpo@woodenmax.in">dpo@woodenmax.in</a> — we will delete it within 24 hours.</p>'
    },
    {
      heading: '8. Updates to this policy',
      body:
        '<p>Material changes are communicated by email to every customer with an active account 30 days before they take effect. Minor edits (typos, contact details) take effect immediately and are noted in the change log at the bottom of this page.</p>'
    }
  ],
  faqs: [
    { q: 'Do you sell my data to other window companies for lead resale?',
      a: 'Absolutely not. We have never resold a single lead. Doing so would destroy our reputation and is contractually prohibited by the agreements we sign with our customers.' },
    { q: 'I gave my number on the price calculator. Why am I getting WhatsApp messages from your sales team?',
      a: 'Because by submitting the form you opted in to receive a quote PDF and follow-up. You can reply STOP to the WhatsApp thread or write to <a href="mailto:dpo@woodenmax.in">dpo@woodenmax.in</a> to opt out — we close the loop within 24 hours.' },
    { q: 'Can I get a copy of every record you hold about me?',
      a: 'Yes. Email <a href="mailto:dpo@woodenmax.in">dpo@woodenmax.in</a> from the address you originally signed up with. We deliver a ZIP file with your form submissions, call notes, WhatsApp chats and orders within 7 working days.' },
    { q: 'Where is my data stored?',
      a: 'Primary database — AWS Mumbai region (ap-south-1). Backups — AWS Hyderabad region (ap-south-2). Both are within India. Email is on Google Workspace which keeps copies on EU servers under the EU-US Data Privacy Framework adequacy decision.' },
    { q: 'I want to be deleted from your CRM permanently.',
      a: 'Send a request to <a href="mailto:dpo@woodenmax.in">dpo@woodenmax.in</a>. Within 30 days, we remove all records except those we are legally bound to keep (e.g., invoices for GST audit — 8 years per Section 36 of the CGST Act). Those are anonymised wherever possible and access-restricted.' }
  ],
  internalLinks: [
    { href: '/policies/warranty-policy',          title: 'Warranty policy',         desc: '10-yr profile, 5-yr hardware' },
    { href: '/policies/installation-policy',      title: 'Installation policy',     desc: 'Site readiness &amp; handover' },
    { href: '/policies/gst-transport-policy',     title: 'GST &amp; transport',     desc: 'How GST &amp; freight are billed' },
    { href: '/policies/cancellation-refund-policy', title: 'Cancellation &amp; refund', desc: 'When you can cancel' }
  ]
};
