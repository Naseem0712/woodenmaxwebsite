module.exports.pageConfig = {
  slug: 'material-sourcing-india',
  silo: 'eeat',
  out:  'about/material-sourcing-india.html',
  canonical: '/about/material-sourcing-india',
  title: 'Material Sourcing | Aluminium, Glass, Hardware Vendors for WoodenMax',
  description: 'Approved supplier list for WoodenMax — Jindal/Hindalco aluminium, Saint-Gobain/Asahi/Modi glass, SIEGENIA/ROTO/HOPPE/GU hardware, PPG/Akzo Nobel powder. Why each was chosen and how we audit.',
  ogImage: 'https://woodenmax.in/images/eeat/sourcing-hero.webp',
  schemaType: 'AboutPage',
  breadcrumb: [
    { label: 'Home',  href: '/' },
    { label: 'About', href: '/about/' },
    { label: 'Material sourcing' }
  ],
  h1: 'Material sourcing — exactly which brands we use, and why',
  hero: {
    sub: 'Every component in a WoodenMax window is from a named, traceable, mill-certified vendor. No "no-name imports from Tier-3 cities". Here is the active vendor matrix.',
    points: [
      '<strong>Aluminium</strong>: Jindal, Hindalco — both BIS-licensed Indian mills',
      '<strong>Glass</strong>: Saint-Gobain, Asahi India, Modi Guard — top-3 in India',
      '<strong>Hardware</strong>: SIEGENIA / ROTO / GU / HOPPE — German imports',
      '<strong>Powder</strong>: PPG Envirocron / Akzo Nobel Interpon — Qualicoat-approved'
    ]
  },
  sections: [
    {
      heading: 'Aluminium — the body',
      table: {
        head: ['Vendor', 'Alloy', 'Why we use them', 'Audit frequency'],
        rows: [
          ['<strong>Jindal Aluminium</strong> (Bengaluru)', '6063-T5', 'India\'s largest architectural extruder. BIS licence + ISO 14001. Reliable lot consistency across million-tonne output.', 'Quarterly mill audit; mill test certificate per lot'],
          ['<strong>Hindalco Industries</strong> (multiple plants)', '6063-T5 / T6', 'Aditya Birla group. Strong T6 capability for structural members. Backward-integrated bauxite.', 'Annual mill audit; mill test certificate per lot'],
          ['<strong>Bhoruka Aluminium</strong> (Karnataka)', '6063-T5', 'Specialist in custom dies and short-run profiles. Used for our heritage / arch / curved sections.', 'Annual visit + per-lot MTC']
        ]
      },
      body:
        '<p>We default to <strong>6063-T5</strong> for general architectural use — the right balance of extrudability, strength and corrosion resistance. We upgrade to <strong>6063-T6</strong> for high-rise structural glazing mullions where deflection control under wind is critical.</p>'
    },
    {
      heading: 'Glass — the membrane',
      cards: [
        { icon: 'A', title: 'Saint-Gobain Glaspac', body: 'World\'s largest glass-maker. We use them for clear DGU, low-E DGU, and laminated combinations on luxury residential. <strong>10-year warranty</strong> on the unit.' },
        { icon: 'B', title: 'Asahi India Glass',     body: 'Joint venture of Asahi Glass (Japan) + Maruti Suzuki + Indian promoters. Strong in tinted, reflective and tempered. We use them for commercial facades and bay windows.' },
        { icon: 'C', title: 'Modi Guard (Gold Plus)', body: 'Indian glass major in our cost-optimised line — strong for residential apartment projects where DGU is required but at a tighter budget.' },
        { icon: 'D', title: 'Sunguard by AGC',       body: 'For high-performance solar-control coatings on commercial elevations (Bangalore IT parks, Mumbai BKC). Project-specific spec.' }
      ]
    },
    {
      heading: 'Hardware — the operating life',
      table: {
        head: ['Vendor', 'Country', 'Used for', 'Why'],
        rows: [
          ['<strong>SIEGENIA</strong>', 'Germany', 'Tilt-and-turn mechanisms, multi-point locks', '20,000+ cycle life. Industry-best for European tilt-turn.'],
          ['<strong>ROTO</strong>',     'Germany', 'Casement hardware, friction stays',          'Smoothness + longevity at value pricing.'],
          ['<strong>GU (Gretsch-Unitas)</strong>', 'Germany', 'Sliding rollers, lift-and-slide mechanisms', 'The reference for heavy sliding doors.'],
          ['<strong>HOPPE</strong>',    'Germany', 'Premium handles &amp; espagnolettes',         'Best aesthetic + tactile finish on luxury.'],
          ['<strong>SOMFY</strong>',    'France',  'Motors for pergolas + smart shutters',        'Industry standard for motorised glazing.'],
          ['<strong>Domus / Mahaveer</strong>', 'India', 'Standard sliding rollers + handles on budget tier', 'Cost-optimised tier; 2-year warranty.']
        ]
      }
    },
    {
      heading: 'Powder coating — the finish',
      list: [
        '<strong>PPG Envirocron</strong> — pure-polyester, super-durable, Qualicoat Class 2 / 2 Seaside',
        '<strong>Akzo Nobel Interpon D2525 / D3000</strong> — pure-polyester architectural-grade',
        '<strong>Jotun Powder Coatings</strong> — used for project-specific colour matching',
        'All powders are <strong>chrome-free</strong> and <strong>RoHS compliant</strong>'
      ]
    },
    {
      heading: 'Gaskets, sealants &amp; accessories',
      table: {
        head: ['Item', 'Vendor', 'Spec'],
        rows: [
          ['EPDM gaskets',                'Hutchinson / Anand Group', '70 Shore-A, ozone-resistant, -40 to +120&deg;C'],
          ['Silicone sealant (structural)', 'Dow Corning / GE / Wacker', 'Neutral-cure, 25-yr life'],
          ['Drainage caps + corner cleats', 'In-house moulded',         '6063 aluminium cleats; PA6.6 caps'],
          ['Insulating foam (thermal break)', 'Inoac (Japan)',          'Polyamide PA6.6 GF25, 16–34 mm']
        ]
      },
      callout: {
        tone: 'success',
        title: 'Why we don\'t spec "no-name local hardware"',
        body: 'Hardware is &lt;5% of system cost but &gt;60% of long-term complaints. A rusted roller can ruin a ₹1.2 L sliding door. Spending an extra ₹450 on a SIEGENIA roller is the single highest-leverage decision in the entire window stack.'
      }
    },
    {
      heading: 'Vendor audit — how we keep this honest',
      body:
        '<p>Each approved vendor is on a quarterly or annual on-site audit cycle conducted by our engineering team. The audit covers:</p>' +
        '<ul class="cluster-list">' +
          '<li>Raw-material certificates and lot traceability</li>' +
          '<li>Process consistency vs. last audit</li>' +
          '<li>QC defect rate trend</li>' +
          '<li>On-time delivery and order accuracy</li>' +
          '<li>Sustainability — recycled content, packaging, water/energy use</li>' +
        '</ul>' +
        '<p>Vendors who fail two consecutive audits move to "Watch" status. Three failures → de-listed. We have removed two suppliers from the approved list in the last 5 years for exactly this reason.</p>'
    }
  ],
  faqs: [
    { q: 'Do you ever use unbranded hardware to hit a tight budget?',
      a: 'On the cost-optimised tier we substitute SIEGENIA/ROTO with Domus or Mahaveer Indian-branded hardware — <strong>not unbranded</strong>. These come with 2-year warranty and meet our 10,000-cycle minimum. We never use Tier-3 imports without warranty.' },
    { q: 'Can I specify which brand of hardware goes on my windows?',
      a: 'Yes. The quote breakdown lists default hardware. You can upgrade to SIEGENIA/GU on a per-opening basis and we will re-quote in 24 hours.' },
    { q: 'How do I verify the aluminium grade after install?',
      a: 'Each profile carries a faint ink-jet code on the inner face during extrusion. Send us a photo of the code and we share back the mill test certificate within 24 hours.' },
    { q: 'Is the glass really branded Saint-Gobain on my project?',
      a: 'Yes. Every DGU has the Saint-Gobain spacer logo etched on the spacer bar inside the unit. After install you can see it clearly at the perimeter of the glass.' },
    { q: 'Do you have a vendor list I can pull into my Excel for vendor empanelment?',
      a: 'Email <a href="mailto:compliance@woodenmax.in">compliance@woodenmax.in</a> for a signed copy of our approved-vendor list. We share within 48 hours.' }
  ],
  internalLinks: [
    { href: '/about/manufacturing-process',        title: 'Manufacturing process',       desc: 'How we use these materials' },
    { href: '/about/quality-testing-process',      title: 'Quality testing',             desc: 'How we test what we source' },
    { href: '/about/certifications-iso-qualicoat', title: 'Certifications',              desc: 'ISO + Qualicoat audits' },
    { href: '/about/factory-tour-hyderabad',       title: 'Factory tour',                desc: 'See materials inbound bay' }
  ]
};
