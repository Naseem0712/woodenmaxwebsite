module.exports.pageConfig = {
  slug: 'quality-testing-process',
  silo: 'eeat',
  out:  'about/quality-testing-process.html',
  canonical: '/about/quality-testing-process',
  title: 'Quality &amp; Testing at WoodenMax | Powder Coat, Weathering, 6063 T6/T5 Certificates, Branded Hardware',
  description: 'How WoodenMax controls quality — every product functionally tested before dispatch, powder-coat checked, water + sun (weathering) sampled. Aluminium is 6063 T6/T5 with mill test certificates from our suppliers; hardware is imported and pre-certified by the brand.',
  ogImage: 'https://woodenmax.in/images/eeat/qc-hero.webp',
  schemaType: 'AboutPage',
  breadcrumb: [
    { label: 'Home',  href: '/' },
    { label: 'About', href: '/about/' },
    { label: 'Quality &amp; testing' }
  ],
  h1: 'Quality &amp; testing — what we actually do',
  hero: {
    sub: 'We are honest about scope: every product is functionally tested unit-by-unit before it ships, powder-coat is sampled, and we expose finishes to water + sun. The heavy lifting on raw-material qualification is done by our suppliers — and we keep their certificates on file.',
    points: [
      '<strong>Every unit functionally tested</strong> before it leaves the factory',
      '<strong>Powder-coat checked</strong> for thickness, adhesion and finish',
      '<strong>Water + sun (weathering) exposure</strong> sampling on coated finishes',
      '<strong>6063 T6 / T5</strong> aluminium with mill test certificates from suppliers',
      '<strong>Imported, branded hardware</strong> — comes with the brand\'s own certification'
    ]
  },
  sections: [
    {
      heading: 'What we test in-house',
      table: {
        head: ['What', 'How', 'Frequency'],
        rows: [
          ['<strong>Functional check of every unit</strong>',
            'Hand-operate the shutter / door / panel through its full motion. Verify lock engagement, roller travel, hinge action, gasket compression, drainage.',
            '100% — every single unit before packing'],
          ['<strong>Powder-coat thickness</strong>',
            'Electronic coating-thickness gauge — target 60–80 microns. Re-coat if below 50 µm.',
            'Sampled — at least once per coating batch'],
          ['<strong>Powder-coat adhesion</strong>',
            'Cross-cut tape test (ISO 2409 style). Coating should not peel.',
            'Sampled per coating batch'],
          ['<strong>Water exposure (weathering)</strong>',
            'Coated samples kept under continuous outdoor water spray on our factory roof — checked weekly for blistering or staining.',
            'Ongoing — sampling per coating run'],
          ['<strong>Sun exposure (UV / fade)</strong>',
            'Coated samples kept under continuous direct outdoor sun on our factory roof — checked monthly against a reference panel for fade.',
            'Ongoing — sampling per coating run'],
          ['<strong>Visual + dimensional check</strong>',
            'Mitre gaps, alignment, scratches, glass clarity, hardware fit — checked at packing.',
            '100% — every single unit before packing']
        ]
      },
      callout: {
        tone: 'info',
        title: 'Plain English about scope',
        body: 'We do not run an in-house wind-tunnel, salt-spray chamber, or EN 12208 water-tightness lab. We do not claim to. For projects that demand third-party lab certification (high-rise B2B), we engage NABL-accredited external labs at the customer\'s cost and share the original report.'
      }
    },
    {
      heading: 'What our suppliers test — and how we keep the proof',
      body:
        '<p>The two biggest material risks in an aluminium window — alloy quality and hardware durability — are not solved by a small factory&apos;s test bench. They are solved by buying from people who already prove it. That is what we do:</p>',
      cards: [
        {
          icon: 'AL',
          title: 'Aluminium — 6063 T6 / T5',
          body: 'Every billet we receive is <strong>6063 T6 (or T5 for selected systems)</strong> grade — the international standard for architectural aluminium extrusion. The mill issues a <strong>Mill Test Certificate (MTC)</strong> with each consignment, certifying alloy composition (Si, Mg, Fe), temper, and mechanical properties. We file the MTC against the project and share it on request.'
        },
        {
          icon: 'PC',
          title: 'Powder — Akzo Nobel / Jotun / Asian Paints PPG',
          body: 'We use polyester powders from <strong>Akzo Nobel, Jotun and Asian Paints PPG</strong> exclusively. Each batch comes with the manufacturer&apos;s <strong>Qualicoat-class certificate</strong> for the powder. We do not buy unbranded powder.'
        },
        {
          icon: 'GL',
          title: 'Glass — Saint-Gobain / Asahi / Modi',
          body: 'DGU units are pre-assembled by <strong>Saint-Gobain, AIS (Asahi) or Modi Guard</strong> with their own factory warranty papers. We do not assemble DGUs in-house — sealed-unit assembly is a specialised process best left to the glass major.'
        },
        {
          icon: 'HW',
          title: 'Hardware — imported &amp; branded',
          body: 'Locks, hinges, rollers, friction-stays, espagnolettes — all <strong>imported and branded</strong> (HOPPE, ROTO, SIEGENIA, GU, Yale and similar). These brands ship with their own factory cycle-test certification (typically 10,000–25,000 cycles). We do not modify or rebrand hardware.'
        }
      ]
    },
    {
      heading: 'Why this works — the honest story',
      body:
        '<p>A small to mid-size architectural-aluminium manufacturer in India has two realistic choices:</p>' +
        '<ol class="cluster-list">' +
          '<li><strong>Pretend</strong> to run an in-house wind-load lab, a salt-spray chamber and a 20,000-cycle servo rig — none of which is feasible at our scale, and most of which produce marketing reports nobody verifies.</li>' +
          '<li><strong>Be honest</strong> — buy raw materials from people who already prove them, file the certificates, and focus our own QC effort on the things we genuinely control: <em>functional check, powder-coat quality, finish weathering, mitre alignment</em>.</li>' +
        '</ol>' +
        '<p>We have always done (2). The result is field-defect rates measured in tenths of a percent, repeat customers, and the ability to say "yes" when a customer asks for the actual paperwork. We send the supplier MTC, the powder Qualicoat certificate, the glass warranty and the hardware spec — not a self-issued report.</p>'
    },
    {
      heading: 'Third-party testing for B2B projects',
      body:
        '<p>For B2B projects (commercial towers, builder developments, high-rises) where the developer&apos;s consultant requires an independent qualification report, we engage <strong>NABL-accredited external labs</strong> — typically NTH Mumbai, ICOMM Hyderabad or CBRI Roorkee — for project-specific testing.</p>' +
        '<p>The customer&apos;s consultant nominates the lab, the cost is billed at actuals on the invoice, the lab&apos;s original report is shared directly with the consultant, and our internal team supports the test setup. We have done this for high-rise commercial work on facades, structural glazing, and pergola wind-load.</p>'
    },
    {
      heading: 'Want to see the certificates?',
      body:
        '<p>Architects, builders and informed homeowners are welcome to ask for any of:</p>' +
        '<ul class="cluster-list">' +
          '<li>Mill Test Certificate for the aluminium on your project</li>' +
          '<li>Powder brand certificate for the colour batch used</li>' +
          '<li>Glass warranty paper from Saint-Gobain / AIS / Modi</li>' +
          '<li>Hardware spec / cycle certificate for the brand on your order</li>' +
        '</ul>' +
        '<p>Email <a href="mailto:info@woodenmax.com">info@woodenmax.com</a> with your quote number — we WhatsApp the PDFs within 24 hours.</p>'
    }
  ],
  faqs: [
    { q: 'Do you run a wind-load test on every system?',
      a: 'No — we do not have an in-house wind-load chamber. We engineer to recognised system designs that have been wind-load qualified by the original system designer. For B2B projects that need a project-specific wind-load report, we commission a NABL-accredited third-party lab at the customer\'s cost.' },
    { q: 'Why don\'t you do in-house salt-spray testing?',
      a: 'A salt-spray chamber and the lab discipline to run it correctly is a serious capital + manpower investment that we honestly cannot do at our current scale. We instead rely on Qualicoat-class powder (Akzo Nobel / Jotun / Asian Paints PPG) whose own salt-spray certificates back the coating. For coastal projects we recommend Qualicoat Seaside Class powder.' },
    { q: 'What aluminium grade do you use?',
      a: '6063 T6 for structural members and 6063 T5 for non-structural mullions / sashes — the international standard for architectural aluminium extrusion. The MTC from the mill is on file for every consignment and shared on request.' },
    { q: 'How do I know your hardware will last?',
      a: 'Because it is not our hardware — it is HOPPE, ROTO, SIEGENIA, GU or Yale (branded imported). Each of those brands ships their cycle-life certification with the product. We do not modify, re-brand or unbox-and-reassemble; you get the brand\'s own warranty.' },
    { q: 'I want test reports for sanction — what should I ask for?',
      a: 'Ask for: (1) the aluminium Mill Test Certificate, (2) the powder Qualicoat certificate for the colour batch, (3) the glass DGU warranty paper, (4) the hardware brand\'s cycle certificate. For a high-rise sanction you may additionally need a NABL-lab wind-load + water-tightness report — we coordinate that as a paid third-party test.' }
  ],
  internalLinks: [
    { href: '/about/factory-tour-hyderabad',       title: 'Factory tour',                desc: 'See where the QC happens' },
    { href: '/about/manufacturing-process',        title: 'Manufacturing process',       desc: 'How we make what we test' },
    { href: '/about/material-sourcing-india',      title: 'Material sourcing',           desc: 'Where the aluminium, powder, glass and hardware come from' },
    { href: '/about/certifications-iso-qualicoat', title: 'Certifications',              desc: 'Supplier certifications we rely on' },
    { href: '/policies/warranty-policy',           title: 'Warranty policy',             desc: 'What our 10-year warranty covers' }
  ]
};
