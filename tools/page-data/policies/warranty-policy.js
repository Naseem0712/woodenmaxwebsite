module.exports.pageConfig = {
  slug: 'warranty-policy',
  silo: 'policies',
  out:  'policies/warranty-policy.html',
  canonical: '/policies/warranty-policy',
  title: 'WoodenMax Warranty Policy 2026 | 10-Year Profile, 5-Year Hardware, 2-Year Gasket',
  description: 'Official WoodenMax warranty policy — 10 years on aluminium profile, 5 years on hardware, 2 years on EPDM gaskets, lifetime free technical support. Read scope, exclusions and claim process.',
  ogImage: 'https://woodenmax.in/images/woodenmax-logo.webp',
  schemaType: 'Article',
  breadcrumb: [
    { label: 'Home',     href: '/' },
    { label: 'Policies', href: '/policies/' },
    { label: 'Warranty Policy' }
  ],
  h1: 'Warranty Policy — what every WoodenMax order is covered for',
  hero: {
    sub: 'Three different warranty layers across the product. No fine print, no surprises. This page is the single source of truth — your invoice references it by name.',
    points: [
      '<strong>10 years</strong> on aluminium profile against manufacturing defects',
      '<strong>5 years</strong> on imported &amp; branded hardware (handles, rollers, locks, hinges)',
      '<strong>2 years</strong> on EPDM gaskets &amp; weather seals',
      'Lifetime free technical telephonic support &amp; reorder of spares at cost'
    ]
  },
  sections: [
    {
      heading: '1. Warranty matrix at a glance',
      table: {
        head: ['Component', 'Cover', 'What\'s covered', 'What\'s NOT covered'],
        rows: [
          ['<strong>Aluminium profile</strong>',  '<strong>10 years</strong>', 'Powder-coat peeling, profile cracking from manufacturing defect, anodised finish dulling beyond normal wear', 'Scratches, dents from impact, salt-coast corrosion if washed less than weekly'],
          ['Hardware — handles, locks, rollers, hinges', '<strong>5 years</strong>', 'Mechanical failure, premature wear in normal use', 'Damage from forced operation, lubricant absence, mis-installation by third parties'],
          ['EPDM gaskets &amp; rubber seals', '<strong>2 years</strong>', 'Cracking, hardening, loss of compression set', 'Cuts from cleaning tools, exposure to solvents'],
          ['Glass — toughened / DGU / lami',  'Per manufacturer (Saint-Gobain, Asahi, Modi)', 'Manufacturing defect, spontaneous breakage from nickel-sulphide inclusion', 'Impact breakage, thermal shock from extreme rapid temperature change'],
          ['Mosquito mesh',                  '<strong>1 year</strong>',  'Mesh hole-formation, frame distortion', 'Pet damage, cuts'],
          ['Motorised pergola / actuator',   '<strong>2 years</strong>',  'Motor burnout, controller failure', 'Water ingress from incorrect installation, voltage surge'],
          ['Installation workmanship',       '<strong>2 years</strong>',  'Re-sealing, re-alignment, water-ingress fix from installation defect', 'Issues arising from civil work or paint job done by third party']
        ]
      }
    },
    {
      heading: '2. What activates the warranty',
      body:
        '<p>The warranty period <strong>starts from the date of installation completion</strong>, certified by both parties on the installation handover form. Your tax invoice number and the handover-form date together act as the warranty registration — no separate registration needed.</p>' +
        '<p>For B2B orders (builders, developers, architects), warranty applies to the project address mentioned on the invoice. If the property is sold, the warranty transfers automatically to the new owner upon presenting a copy of the original invoice.</p>'
    },
    {
      heading: '3. Exclusions — what voids the warranty',
      list: [
        'Damage from <strong>impact, vandalism, attempted forced entry</strong> or natural calamities (cyclone, earthquake) outside the wind-load rating supplied at quote time',
        '<strong>Modifications by third parties</strong> — addition of grills, mesh, locks, or any drilling on the profile by anyone other than a WoodenMax-authorised technician',
        '<strong>Misuse</strong> — using sliding tracks to climb, sitting on the window sill, hanging weights on profile',
        'Neglected <strong>maintenance</strong> — particularly the silicone sealant strip around the frame, which must be inspected once a year and re-applied every 5 years',
        'Corrosion caused by <strong>solvent-based cleaners</strong>, acidic chemicals, ammonia-based glass cleaners on profile (use mild soap + water only)',
        '<strong>Site-side civil work</strong> damage during interior renovation after installation'
      ]
    },
    {
      heading: '4. How to claim warranty',
      cards: [
        {
          icon: '1',
          title: 'Raise a ticket',
          body: 'Call <strong>+91 78953 28080</strong> or email <a href="mailto:service@woodenmax.in">service@woodenmax.in</a> with your invoice number + a photo or short video of the issue. You will get a ticket ID within 4 working hours.'
        },
        {
          icon: '2',
          title: 'Site inspection',
          body: 'A WoodenMax service engineer visits within <strong>72 hours</strong> in serviced cities (Hyderabad, Bengaluru, Mumbai, Pune, Delhi NCR, Jaipur, Lucknow) or <strong>7 working days</strong> for other locations.'
        },
        {
          icon: '3',
          title: 'Resolution',
          body: 'If the issue is covered, repair or replacement is <strong>fully free</strong> — including all parts, labour, and round-trip travel of the engineer. We dispatch new parts within 5–10 working days of confirmation.'
        }
      ]
    },
    {
      heading: '5. Out-of-warranty support — still available',
      body:
        '<p>Even after the warranty period ends, WoodenMax continues to support every installation:</p>' +
        '<ul class="cluster-list">' +
          '<li>Spare parts — handles, rollers, gaskets, mesh — at <strong>cost-plus-10%</strong> for the lifetime of the product</li>' +
          '<li>Free phone &amp; WhatsApp consultation on minor service issues</li>' +
          '<li>Paid service-engineer visits at fixed transparent rates (₹650 first half-hour, ₹350 each additional half-hour) + transport at actuals</li>' +
        '</ul>',
      callout: {
        tone: 'success',
        title: 'A real example',
        body: 'A 2014 WoodenMax casement window in Banjara Hills came in for a roller replacement in 2025. The original rollers were out of warranty by 6 years. We delivered &amp; fitted Indian-import replacements for &#8377;2,200 total. The customer\'s window now runs as smoothly as new.'
      }
    },
    {
      heading: '6. Tie-in with our GST &amp; transport policy',
      body:
        '<p>The warranty in this policy is for the <strong>basic product value</strong> — i.e. pre-GST. GST is charged separately on every original invoice as per India\'s GST rules. When a warranty replacement is shipped, no additional GST is charged on the replacement part. Transport for warranty replacement is <strong>always free within India</strong> — irrespective of order size — because the replacement is fulfilling our warranty obligation.</p>' +
        '<p>Read the full <a href="../policies/gst-transport-policy">GST &amp; Transportation policy</a> for how those charges apply on the original order.</p>'
    }
  ],
  faqs: [
    { q: 'Is the warranty transferrable if I sell the property?',
      a: 'Yes. The warranty travels with the property and transfers automatically to the new owner. They just need to keep a copy of your original invoice; we don\'t require a separate transfer registration.' },
    { q: 'Does the warranty cover labour, or only parts?',
      a: 'Both. If the issue is covered, we replace parts <strong>and</strong> send a service engineer at zero cost to you, including travel. There is no labour bill on a warranty claim.' },
    { q: 'What if I move to a city where WoodenMax doesn\'t have a service engineer?',
      a: 'We use our service-partner network to dispatch a qualified aluminium-fabrication engineer locally. The warranty cover and zero-cost-to-you principle stays exactly the same.' },
    { q: 'Glass broke from a stone hit during a kids\' cricket match. Covered?',
      a: 'No — impact breakage is excluded from warranty. We can quickly supply and fit replacement glass at our standard rate. Most homeowner insurance policies in India cover such glass replacement.' },
    { q: 'My powder coat is fading after 8 years in a coastal city. Covered?',
      a: 'Powder coat is warranted for 10 years against manufacturing defect — that includes premature dulling beyond normal aging. Coastal homes need a fresh-water rinse on the profile every week to prevent salt build-up; if you have followed that maintenance, we will re-coat or replace at no cost.' },
    { q: 'Where does my warranty get registered?',
      a: 'Automatically — at the time of installation handover, the WoodenMax engineer captures your invoice number, install date, profile lot number and product photos into our service CRM. You receive a single PDF "warranty record" via email and WhatsApp within 24 hours.' },
    { q: 'Are accessories (mosquito mesh, blinds) covered?',
      a: 'Yes, with their own coverage periods listed in the warranty matrix above. The mosquito mesh frame and roller are covered for 1 year; the mesh fabric is treated as a consumable.' }
  ],
  internalLinks: [
    { href: '/policies/gst-transport-policy',     title: 'GST &amp; Transport policy',     desc: 'How GST and freight are charged' },
    { href: '/policies/installation-policy',      title: 'Installation policy',             desc: 'Site readiness, scope, handover' },
    { href: '/policies/cancellation-refund-policy', title: 'Cancellation &amp; refund',     desc: 'When and how cancellations work' },
    { href: '/about/manufacturing-process',       title: 'How we manufacture',              desc: 'Inside the WoodenMax factory' },
    { href: '/about/quality-testing-process',     title: 'Quality testing',                 desc: 'Wind, water and load tests' }
  ]
};
