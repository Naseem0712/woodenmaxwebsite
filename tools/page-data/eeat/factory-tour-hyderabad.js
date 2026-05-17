module.exports.pageConfig = {
  slug: 'factory-tour-hyderabad',
  silo: 'eeat',
  out:  'about/factory-tour-hyderabad.html',
  canonical: '/about/factory-tour-hyderabad',
  title: 'Inside WoodenMax — Factory Tour, Hyderabad (28,000 sq ft) | Nampally',
  description: 'Take a virtual walk through WoodenMax\'s 28,000 sq ft aluminium fabrication facility in Hyderabad — CNC bay, powder coating booth, glazing line, QC lab, dispatch dock and a 12-person engineering team.',
  ogImage: 'https://woodenmax.in/images/eeat/factory-hero.webp',
  schemaType: 'AboutPage',
  breadcrumb: [
    { label: 'Home',  href: '/' },
    { label: 'About', href: '/about/' },
    { label: 'Factory Tour' }
  ],
  h1: 'Inside our 28,000 sq ft factory in Hyderabad',
  hero: {
    sub: 'Every WoodenMax window, door, pergola or railing is cut, coated, glazed and packed at this single facility — under one roof, under one quality lead.',
    image: {
      src: '../images/eeat/factory-hero.webp',
      alt: 'WoodenMax aluminium fabrication factory exterior in Hyderabad, Nampally',
      real: true,
      w: 1200, h: 750
    },
    points: [
      '<strong>28,000 sq ft</strong> covered + 4,000 sq ft material storage',
      '<strong>5 production lines</strong>: cutting · CNC · coating · glazing · packing',
      '<strong>12-person engineering team</strong> — average tenure 6.4 years',
      '<strong>Monthly capacity</strong>: 18,000 sq ft of fabricated openings'
    ]
  },
  sections: [
    {
      heading: 'The 7 stations a profile travels through',
      cards: [
        { icon: '1', title: 'Material receipt &amp; lot logging', body: 'Every aluminium billet enters with a mill test certificate. Alloy grade, temper, and lot number are logged before the billet enters the cutting bay.' },
        { icon: '2', title: 'Precision cutting',                  body: 'Twin-head Italian mitre saws cut to ±0.1 mm. Every cut is logged against the shop drawing for your opening — no shared inventory.' },
        { icon: '3', title: 'CNC machining',                      body: 'Drainage slots, lock pockets, drainage caps, weep holes — all routed on a 3-axis CNC. The profile leaves the bay ready for assembly.' },
        { icon: '4', title: 'Powder coating',                     body: 'Qualicoat Class-2 booth — degrease, chrome-free passivation, electrostatic powder spray (PPG / Akzo Nobel), 12-min cure at 200&deg;C. Coat thickness verified at 60–80 microns on every shutter.' },
        { icon: '5', title: 'Glazing line',                       body: 'DGU units arrive sealed from Saint-Gobain / Asahi / Modi with their warranty papers. Our glazier fits them into the profile with EPDM-cushion gaskets — never raw silicone-on-glass.' },
        { icon: '6', title: 'Quality control',                    body: 'Each finished shutter is tested for: smooth operation (10 cycles), corner-joint integrity (4 mm gauge), water-bead test with a 50 mm Schauberger nozzle, and final visual.' },
        { icon: '7', title: 'Pack &amp; dispatch',                body: 'Each opening is foam-wrapped, corner-protected, labelled by opening number, and crated by site. Crates leave with your name, project address and a barcode that ties back to the shop drawing.' }
      ]
    },
    {
      heading: 'Quality lab — what we measure',
      table: {
        head: ['Test', 'Standard', 'Pass criteria', 'Frequency'],
        rows: [
          ['Coat thickness',           'ISO 2360',     '60–80 microns',                'Every shutter'],
          ['Coat adhesion (cross-cut)','ISO 2409',     'Grade 0 or 1',                 '1 in 50'],
          ['Salt-spray (coastal)',     'ASTM B117',    '500 h, no blistering',         'Per coating batch'],
          ['Wind-load',                'IS 4351:2003', '+1.5/-1.5 kPa, &lt; L/175 deflection', 'Per system, annually'],
          ['Water tightness',          'EN 12208',     'Class 9A',                     'Per system, annually'],
          ['Operating cycles',         'EN 1191',      '20,000 cycles, no failure',    'Per system, annually']
        ]
      },
      callout: {
        tone: 'success',
        title: 'How "QC pass = ready to dispatch" works',
        body: 'A finished shutter cannot move from the QC bay to the packing bay without a green sticker carrying the QC supervisor\'s initials and date. The packing-bay supervisor refuses any shutter without that sticker. This single-sticker control is the simplest reason WoodenMax field-return rate sits at <strong>0.4%</strong>.'
      }
    },
    {
      heading: 'Want to visit?',
      body:
        '<p>We host customer site-visits Monday to Saturday, 10 AM to 5 PM, by appointment. A 90-minute guided tour covers the 7 stations + a sit-down with one of our engineers to discuss your project.</p>' +
        '<p>For B2B partners (architects, builders), we run a 3-hour deep-dive that includes our QC lab, the powder-coating booth (visible from a glass corridor), and a hands-on demo of system options.</p>',
      cta: { href: '../contact.html?intent=factory-visit', label: 'Schedule a factory visit' }
    },
    {
      heading: 'Address &amp; map',
      body:
        '<p><strong>WoodenMax Architectural Elements</strong><br>' +
        '5-6-411/413, Aaghapura, Nampally<br>' +
        'Hyderabad &mdash; 500001, Telangana, India</p>' +
        '<p><strong>GPS:</strong> 17.397&deg; N, 78.466&deg; E &middot; <strong>Phone:</strong> <a href="tel:+917895328080">+91 78953 28080</a> &middot; <strong>Email:</strong> <a href="mailto:info@woodenmax.com">info@woodenmax.com</a> &middot; <strong>GSTIN:</strong> 36ARWPA9740L1Z3</p>'
    }
  ],
  faqs: [
    { q: 'Is the factory really yours, or do you outsource?',
      a: 'Fully in-house. The machinery and core team are 100% WoodenMax — operated by the founding family. At any time we run 10–12 live projects across India in parallel; site execution is shared with our trained partner crews under direct WoodenMax site-management.' },
    { q: 'Why does single-facility, single-team matter?',
      a: 'Because every joint, gasket, coating decision is taken by the same engineers. There is no inter-vendor blame game when an issue arises — service requests land back at the same factory that built the unit.' },
    { q: 'Do you serve cities outside Hyderabad?',
      a: 'Yes. All production happens in Hyderabad; finished crates ship by road to 14 cities. Free transport applies on orders &ge; ₹15 L within 1,000 km from Hyderabad — see <a href="../policies/gst-transport-policy">policy</a>.' },
    { q: 'Can I bring a structural engineer with me on the tour?',
      a: 'Of course. We routinely host architects and structural engineers. We will line up the relevant test data, system drawings and reference projects for your engineer to review.' },
    { q: 'Is there a video tour?',
      a: 'We are producing a professional 4-minute walk-through scheduled to launch in Q3 2026. Until then, a live virtual tour (Google Meet, 30 minutes, dedicated guide) can be booked any working day.' }
  ],
  internalLinks: [
    { href: '/about/manufacturing-process',       title: 'How we manufacture',             desc: 'The 7-station production flow in detail' },
    { href: '/about/quality-testing-process',     title: 'Quality testing process',        desc: 'Wind, water, load, operating cycles' },
    { href: '/about/certifications-iso-qualicoat', title: 'ISO &amp; Qualicoat certs',     desc: 'Our active third-party audits' },
    { href: '/about/team-leadership',             title: 'Meet the team',                  desc: 'Founders, engineers, project managers' },
    { href: '/about/founder-story-woodenmax',     title: 'Founder story',                  desc: 'Why WoodenMax exists' }
  ]
};
