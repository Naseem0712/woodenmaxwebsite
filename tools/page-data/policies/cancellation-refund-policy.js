module.exports.pageConfig = {
  slug: 'cancellation-refund-policy',
  silo: 'policies',
  out:  'policies/cancellation-refund-policy.html',
  canonical: '/policies/cancellation-refund-policy',
  title: 'WoodenMax Cancellation & Refund Policy 2026 | Order, Site-Visit, Production Stage',
  description: 'Transparent cancellation and refund policy for WoodenMax orders — covers free site visits, signed quotes, advance, production-in-progress, dispatched and installed stages, with timelines for refund.',
  ogImage: 'https://woodenmax.in/images/woodenmax-logo.webp',
  schemaType: 'Article',
  breadcrumb: [
    { label: 'Home',     href: '/' },
    { label: 'Policies', href: '/policies/' },
    { label: 'Cancellation & Refund' }
  ],
  h1: 'Cancellation &amp; Refund Policy',
  hero: {
    sub: 'Custom-fabricated aluminium has different cancellation rules than e-commerce. This page tells you exactly what you can cancel, when, and how much comes back.',
    points: [
      '<strong>Free</strong> to cancel before signing the final quote — no questions',
      '<strong>10% retention</strong> if cancelled after token, before production starts',
      'Cancellation <strong>locked</strong> once we cut the first profile (fully customised goods)',
      'Refunds processed within <strong>7 working days</strong> to source account'
    ]
  },
  sections: [
    {
      heading: '1. Cancellation stages — what you can cancel and when',
      table: {
        head: ['Stage', 'Can you cancel?', 'Refund / charge'],
        rows: [
          ['<strong>Before site visit</strong>', '✓ Yes, anytime', 'No cost. Site visit is free.'],
          ['After site visit but before signing the quote', '✓ Yes', 'No cost.'],
          ['After signing the quote but before paying the token', '✓ Yes', 'No cost.'],
          ['After token (typically 20%) paid, before production starts', '✓ Yes', '<strong>10% of order value</strong> retained as design + drawing fee; balance refunded.'],
          ['Production started — profile is being cut / coated', '✗ No', 'Full advance retained because goods are bespoke. Re-purposing is impossible (your size + colour).'],
          ['Production complete, awaiting dispatch', '✗ No', 'Full advance retained. Goods can be re-sold only if standard size + colour, which is rare.'],
          ['Goods dispatched / installed', '✗ No', 'Refunds replaced by <strong>defect-rectification under warranty</strong> per our <a href="../policies/warranty-policy">warranty policy</a>.']
        ]
      },
      callout: {
        tone: 'info',
        title: 'Why production-stage cancellation is locked',
        body: 'Every WoodenMax order is fabricated to <strong>your exact opening size, your selected colour and your hardware combination</strong>. Once profiles are cut and powder-coated, they cannot be re-sold to another customer because the size + colour combination is yours alone. This is industry-standard for custom fabrication.'
      }
    },
    {
      heading: '2. Refund timelines',
      list: [
        '<strong>Day 0</strong>: You raise a cancellation in writing (email is fine)',
        '<strong>Day 1</strong>: Our accounts team acknowledges and confirms the refundable amount',
        '<strong>Day 2–5</strong>: Refund is initiated via the original payment method (NEFT / RTGS / UPI / card reversal)',
        '<strong>Day 5–7</strong>: Refund reflects in your account, depending on your bank',
        'Refunds to international cards may take <strong>up to 14 working days</strong> due to inter-bank routing'
      ]
    },
    {
      heading: '3. Partial cancellations — removing items from a multi-item order',
      body:
        '<p>If you placed an order for, say, 12 windows and want to <strong>drop 2 from the scope</strong> before production:</p>' +
        '<ul class="cluster-list">' +
          '<li>If the dropped items have not been measured / shop-drawn yet → <strong>no charge</strong>, scope updated</li>' +
          '<li>If measured but not yet in production → <strong>₹ 1,200 per opening</strong> design/measurement fee</li>' +
          '<li>If in production → <strong>full charge applies</strong> for those items; you can choose to receive them and stock them, or we recycle and you forfeit</li>' +
        '</ul>'
    },
    {
      heading: '4. Cancellation by WoodenMax — when we cancel an order',
      body:
        '<p>Very rare, but for transparency:</p>' +
        '<ul class="cluster-list">' +
          '<li>Site is found to be structurally unsafe for the requested system (e.g., requesting a 4×3 m sliding window in an opening that lacks the required load-bearing lintel)</li>' +
          '<li>Customer\'s site is not accessible (legal dispute, locked site, persistent denial of entry by association)</li>' +
          '<li>Payment chargebacks raised maliciously after successful installation</li>' +
        '</ul>' +
        '<p>In all such cases we refund any advance immediately, <strong>minus only the documented design/drawing time</strong>.</p>'
    },
    {
      heading: '5. Refund method',
      body:
        '<p>Refunds are processed strictly to the <strong>same account / instrument</strong> used for original payment. We do not transfer refunds to a different account because of GST audit and anti-money-laundering compliance under section 17 of the IGST Act.</p>' +
        '<p>If a cancellation invoice involves a GST reversal, our team files the corresponding credit note in your GSTR and shares a copy with you. This is essential for B2B (GST-registered) customers — your input-tax-credit is preserved.</p>'
    }
  ],
  faqs: [
    { q: 'I changed my mind a week after paying the token but before manufacturing — what do I get back?',
      a: 'You receive 90% of your token back. The 10% retention covers the design time, shop-drawing creation, measurement on site, and our accounting effort. Refund hits your account in 7 working days.' },
    { q: 'My builder cancelled the project, can I cancel?',
      a: 'Yes, the cancellation policy applies regardless of the reason. If your builder agreement compensates you for vendor commitments, we are happy to provide a notarised acceptance letter to support your claim.' },
    { q: 'You took my 50% advance and never installed. How do I get a refund?',
      a: 'That would be an exceptional service failure — not in our memory, but the path is: email <a href="mailto:info@woodenmax.com">info@woodenmax.com</a>. Founder-level review and refund within 3 working days. Beyond that, every order is also covered under our <a href="../policies/dispute-redressal">dispute redressal mechanism</a>.' },
    { q: 'Can you give the refund in cash?',
      a: 'No. All refunds are by bank transfer back to the original payment source. This is required by RBI and GST regulations.' },
    { q: 'I want to change colour of my windows after token but before production. Charge?',
      a: 'If the change is requested within 48 hours of token payment, free. After 48 hours but before profile is cut, ₹ 1,200 per opening as a re-spec fee. After cutting, the cost of new profile.' }
  ],
  internalLinks: [
    { href: '/policies/warranty-policy',          title: 'Warranty policy',         desc: '10-yr profile, 5-yr hardware' },
    { href: '/policies/installation-policy',      title: 'Installation policy',     desc: 'Site readiness &amp; handover' },
    { href: '/policies/gst-transport-policy',     title: 'GST &amp; transport',     desc: 'How GST &amp; freight are billed' },
    { href: '/policies/privacy-policy',           title: 'Privacy policy',          desc: 'How we use your data' }
  ]
};
