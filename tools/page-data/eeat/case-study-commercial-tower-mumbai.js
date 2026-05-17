module.exports.pageConfig = {
  slug: 'case-study-commercial-tower-mumbai',
  silo: 'eeat',
  out:  'about/case-study-commercial-tower-mumbai.html',
  canonical: '/about/case-study-commercial-tower-mumbai',
  title: 'Case Study | 16-Storey Commercial Tower Facade, Mumbai',
  description: 'How WoodenMax delivered the unitised curtain-wall facade for a 16-storey commercial tower in Mumbai BKC — 38,000 sqft of glazing, 142-day timeline, zero handover snags.',
  ogImage: 'https://woodenmax.in/images/eeat/case-tower-mum-hero.webp',
  schemaType: 'Article',
  breadcrumb: [
    { label: 'Home',  href: '/' },
    { label: 'About', href: '/about/' },
    { label: 'Case studies', href: '/about/case-studies' },
    { label: 'Mumbai commercial tower' }
  ],
  h1: 'Case study: 16-storey commercial tower facade, Mumbai',
  hero: {
    sub: '38,000 sqft of unitised curtain wall. Wind-zone qualified to +2.0 kPa. 142-day timeline from PO to RFO. Concurrent with 10+ other live projects.',
    image: {
      src: '../images/eeat/case-tower-mum-hero.webp',
      alt: 'Commercial tower with full glass curtain wall in Mumbai — representative project visualisation',
      w: 1200, h: 750
    },
    points: [
      '<strong>38,000 sqft</strong> of facade glazing',
      '<strong>16 storeys</strong> + double-height ground lobby',
      '<strong>Unitised</strong> curtain-wall system — factory-finished modules',
      '<strong>142 days</strong> PO-to-handover (the developer\'s SLA was 180)'
    ]
  },
  sections: [
    {
      heading: 'Project brief',
      body:
        '<p>A speculative-build commercial tower in BKC. Developer required a Grade-A facade qualifying for IGBC Platinum, with a 30% better solar-heat-gain coefficient than the city baseline and capable of withstanding Mumbai\'s coastal wind exposure (+1.8 kPa face load, ASTM B117 1,000 h salt-spray).</p>' +
        '<p>The tendered scope was for a stick-built system. We counter-proposed a <strong>unitised curtain-wall</strong> approach: every floor\'s glazing arrives as 1.5 × 4 m pre-assembled modules, lifted by tower crane, hooked onto pre-installed brackets. The proposal saved 32 days of erection time and reduced site labour by 40%.</p>'
    },
    {
      heading: 'System spec',
      table: {
        head: ['Spec', 'Value', 'Why'],
        rows: [
          ['<strong>System</strong>',         'Unitised curtain wall, 150 mm mullion depth', 'Carries 4-storey wind-load + dead load with cantilever capacity'],
          ['<strong>Glass</strong>',          '8 mm HT + 16 mm argon spacer + 8 mm Saint-Gobain Cool-Lite SKN 154 II', 'SHGC 0.27, U-value 1.4 W/m²K — exceeds IGBC Platinum requirement'],
          ['<strong>Coating</strong>',        'Qualicoat Class 2 Seaside, RAL 9007 grey aluminium', 'Coastal-grade for Mumbai salinity'],
          ['<strong>Brackets</strong>',       'M16 SS316 + GI cast-in plates per floor', 'Stainless inside the building envelope to prevent staining'],
          ['<strong>Sealant</strong>',         'Dow Corning DC-995 structural + DC-791 weather', '25-year proven life in Mumbai coastal exposure']
        ]
      }
    },
    {
      heading: 'Wind-load + water-tightness sign-off',
      body:
        '<p>We engaged the structural consultant\'s preferred third-party lab (CBRI Roorkee) for the project-specific sign-off. Two full-floor mock-ups (3 m × 12 m) were assembled at the lab and tested for:</p>' +
        '<ul class="cluster-list">' +
          '<li><strong>Wind load</strong>: +2.0 kPa, -2.0 kPa, no failure (15% margin over Mumbai design wind)</li>' +
          '<li><strong>Water-tightness</strong>: EN 12208 Class 9A at 600 Pa — no penetration over 30 min</li>' +
          '<li><strong>Air permeability</strong>: EN 12207 Class 4 — &lt; 0.5 m³/h·m</li>' +
          '<li><strong>Inter-storey drift</strong>: ±25 mm at 1/200 storey height — no glass damage</li>' +
        '</ul>'
    },
    {
      heading: 'Timeline',
      table: {
        head: ['Phase', 'Days', 'Outcome'],
        rows: [
          ['Design + drawings + structural sign-off',      'Days 0–28', 'PEB-coordinated GAD + 110 shop drawings approved'],
          ['Mock-up &amp; lab certification',              'Days 29–48', 'CBRI test reports issued; developer release'],
          ['Production batch 1 (floors 1–4)',              'Days 49–76', '160 unitised modules built, packed, shipped'],
          ['On-site erection of batch 1',                  'Days 67–96', 'Concurrent with later batches in production'],
          ['Production batches 2–4 (floors 5–16)',         'Days 77–118', '480 modules + ground-lobby'],
          ['On-site erection of batches 2–4',              'Days 97–134', 'Full envelope dry'],
          ['Sealant cure + RFO inspection',                'Days 135–142', 'IGBC sign-off + developer handover'],
          ['<strong>Total</strong>',                        '<strong>142 days</strong>', 'vs. tendered 180 days']
        ]
      },
      callout: {
        tone: 'success',
        title: 'Why we beat the SLA by 38 days',
        body: 'Unitisation. Modules were fabricated at our Hyderabad factory in parallel with each floor pour. The site erection crew never waited for material; the production team never waited for site. Two parallel critical paths instead of one serial one.'
      }
    },
    {
      heading: 'What we learned',
      list: [
        'For unitised projects beyond 30,000 sqft, set up a dedicated assembly cell at the factory — productivity rises 25% vs. shared shopfloor',
        'Schedule sealant cure-window in monsoon-affected weeks at +2 days buffer; Mumbai humidity slows cure',
        'Tower crane time is the most-contested resource — book 4 weeks before each phase, not 2',
        'Inter-storey drift test is the developer\'s favourite "gotcha" — over-spec to +25 mm even if code only requires ±15 mm'
      ]
    }
  ],
  faqs: [
    { q: 'Do you take on facade-engineering responsibility or only fabrication?',
      a: 'Both, on B2B projects. On this project we took full design-build responsibility including structural coordination with the developer\'s PEB consultant, sealant warranty (25 years via Dow Corning), and IGBC documentation.' },
    { q: 'What is the GST treatment for a project of this scale?',
      a: 'GST @ 18% is charged on the basic value. For B2B (registered) customers, the full GST is available as input-tax-credit, making the effective cost equal to basic value + transport. See our <a href="../policies/gst-transport-policy">GST policy</a>.' },
    { q: 'Mumbai is &gt; 700 km from Hyderabad — does free transport apply?',
      a: 'Yes — Mumbai is 711 km from our Hyderabad factory, within the 1,000 km radius, and the order value comfortably exceeds the ₹15 L threshold. Full transport was free.' },
    { q: 'Do you carry workmen\'s compensation insurance for high-rise erection?',
      a: 'Yes, plus a project-specific Public Liability + All-Risks construction policy taken at the start of every B2B project &gt; ₹50 L. Schedule shared with the developer at PO stage.' },
    { q: 'How do you handle service after handover?',
      a: 'A dedicated maintenance manual is handed over including BMU operating instructions for facade cleaning. Annual structural &amp; sealant inspections optional under our 5-year AMC.' }
  ],
  internalLinks: [
    { href: '/about/case-study-villa-hyderabad',     title: 'Hyderabad villa case', desc: 'Residential premium project' },
    { href: '/about/case-study-luxury-bungalow-delhi', title: 'Delhi bungalow case', desc: 'Lutyens-zone heritage' },
    { href: '/products/glass-elevation',             title: 'Glass elevation hub',   desc: 'Commercial &amp; residential facade' },
    { href: '/policies/gst-transport-policy',        title: 'GST &amp; transport',   desc: 'Why transport was free on this project' }
  ]
};
