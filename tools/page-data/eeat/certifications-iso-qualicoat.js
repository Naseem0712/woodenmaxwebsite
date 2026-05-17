module.exports.pageConfig = {
  slug: 'certifications-iso-qualicoat',
  silo: 'eeat',
  out:  'about/certifications-iso-qualicoat.html',
  canonical: '/about/certifications-iso-qualicoat',
  title: 'WoodenMax Certifications | ISO 9001, Qualicoat Class 2, BIS, ESI/PF, GST',
  description: 'Complete list of WoodenMax certifications — ISO 9001:2015 quality system, Qualicoat Class 2 powder coating, BIS-compliant aluminium grades, ESI/PF labour compliance, GST/PAN, MSME, Make-in-India.',
  ogImage: 'https://woodenmax.in/images/eeat/certifications-hero.webp',
  schemaType: 'AboutPage',
  breadcrumb: [
    { label: 'Home',  href: '/' },
    { label: 'About', href: '/about/' },
    { label: 'Certifications' }
  ],
  h1: 'Certifications &amp; compliances',
  hero: {
    sub: 'A transparent ledger of every active third-party certification and statutory compliance WoodenMax maintains. Document copies available on signed NDA for B2B partners.',
    points: [
      '<strong>ISO 9001:2015</strong> — Quality Management System, active',
      '<strong>Qualicoat Class 2</strong> — Powder coating compliance',
      '<strong>BIS</strong>-grade aluminium per IS 733 / IS 4351',
      'Active <strong>ESI, PF, GST, MSME</strong> — labour &amp; tax compliance'
    ]
  },
  sections: [
    {
      heading: 'Active third-party certifications',
      table: {
        head: ['Certification', 'Scope', 'Certifying body', 'Validity'],
        rows: [
          ['<strong>ISO 9001:2015</strong>', 'Quality Management System covering design, fabrication, installation, after-sales', 'TUV NORD / BVQI', 'Renewed annually with surveillance audit'],
          ['<strong>Qualicoat Class 2</strong>', 'Powder-coating quality on architectural aluminium', 'Qualicoat-licensed audit lab (third-party)', 'Renewed every 6 months by lab audit'],
          ['<strong>BIS</strong>', 'Aluminium alloy &amp; window section compliance (IS 733, IS 4351)', 'Bureau of Indian Standards', 'Active per supplier mill TC + system test reports'],
          ['<strong>NABL-accredited test reports</strong>', 'Water tightness, salt-spray, structural', 'NTH Mumbai &amp; ICOMM Hyderabad', 'Per-system, dated within 12 months']
        ]
      }
    },
    {
      heading: 'Statutory &amp; regulatory compliance',
      table: {
        head: ['Item', 'Reference', 'Status'],
        rows: [
          ['<strong>GSTIN</strong>',                'Telangana GST number', 'Active — verifiable on the GST portal'],
          ['<strong>PAN</strong>',                  'Company-level PAN',    'Active'],
          ['<strong>Udyam (MSME)</strong>',         'Medium Enterprise registration', 'Active'],
          ['<strong>Make-in-India</strong>',        'Voluntary affiliation', 'Active — listed in DPIIT supplier directory'],
          ['<strong>ESIC</strong>',                 'Employee State Insurance', 'Active for all factory and field workforce'],
          ['<strong>EPF</strong>',                  'Employee Provident Fund', 'Active for all permanent employees'],
          ['<strong>Workmen\'s Compensation Insurance</strong>', 'Group cover via Bajaj Allianz', 'Active'],
          ['<strong>CLRA Labour Licence</strong>',  'Contract-labour licence for installation crews', 'Active'],
          ['<strong>Factories Act registration</strong>', 'Telangana Factories Inspectorate', 'Active']
        ]
      },
      callout: {
        tone: 'info',
        title: 'Need document copies for vendor empanelment?',
        body: 'Send your company\'s NDA template to <a href="mailto:compliance@woodenmax.in">compliance@woodenmax.in</a>. Once signed, we share the full certification dossier (ISO scope, Qualicoat audit letter, GST cert, ESI/PF latest challan copy, insurance schedule) within 48 hours.'
      }
    },
    {
      heading: 'What Qualicoat Class 2 actually means',
      body:
        '<p>Qualicoat is the international quality label for liquid and powder coatings on aluminium. <strong>Class 1</strong> is suitable for standard inland exposure; <strong>Class 2</strong> upgrades pre-treatment chemistry &amp; uses a super-durable polyester resin — required for tropical &amp; coastal-adjacent India. We default to Class 2 on every powder-coated profile.</p>' +
        '<p>The Qualicoat label requires the licence-holder to:</p>' +
        '<ul class="cluster-list">' +
          '<li>Use only approved powder suppliers (PPG, Akzo Nobel, Jotun)</li>' +
          '<li>Maintain the 5-stage pre-treatment with chrome-free passivation</li>' +
          '<li>Coat thickness 60–100 microns (we run 60–80 for architectural aesthetic)</li>' +
          '<li>Pass <strong>quarterly third-party audits</strong> with cross-cut, impact, cupping, and salt-spray tests</li>' +
        '</ul>'
    },
    {
      heading: 'What ISO 9001:2015 actually means',
      body:
        '<p>ISO 9001 is the global QMS framework. For a window fabricator, the audit covers:</p>' +
        '<ul class="cluster-list">' +
          '<li>Documented quality manual + SOPs for every production stage</li>' +
          '<li>Calibration register for measurement tools (saw, gauges, torque wrenches)</li>' +
          '<li>Supplier qualification &amp; vendor scorecards</li>' +
          '<li>Internal-audit log + management-review minutes</li>' +
          '<li>Non-conformance + corrective-action records</li>' +
          '<li>Customer-complaint log + closure timeline</li>' +
        '</ul>' +
        '<p>The certification body audits annually + does an unannounced surveillance visit. <strong>Our 2025 audit closed with zero major non-conformities.</strong></p>'
    },
    {
      heading: 'How to verify these certifications independently',
      list: [
        '<strong>GST</strong>: Use the official GST search portal — type our GSTIN to see active status, address, and registered scope',
        '<strong>ISO 9001</strong>: Look up our certificate number on the TUV NORD India database',
        '<strong>Qualicoat</strong>: Check the global Qualicoat licensee directory at qualicoat.net',
        '<strong>MSME / Udyam</strong>: Search our Udyam number on the official MSME Udyam Registration portal',
        '<strong>Test reports</strong>: NABL labs (NTH, ICOMM) maintain digital report verification — quote the report number on their portal'
      ],
      callout: {
        tone: 'success',
        title: 'Why we publish this',
        body: 'Most window fabricators in India operate without published certifications. Customers find out only when something breaks. We publish ours upfront so an architect, structural engineer, or homeowner can verify in 10 minutes that the company they\'re trusting with their window opening is actually compliant.'
      }
    }
  ],
  faqs: [
    { q: 'Where can I download soft copies of your certifications?',
      a: 'Email <a href="mailto:compliance@woodenmax.in">compliance@woodenmax.in</a> with your company name and intended use. We share within 48 hours under NDA for B2B; for individual customers we share at the time of order signing.' },
    { q: 'Are these certifications mandatory for my project?',
      a: 'For a residential home, no — most municipalities don\'t require them. For a commercial high-rise sanction, fire NOC, or for builders going to RERA, they significantly de-risk approval. For NHAI / CPWD / Railway tenders they are essential.' },
    { q: 'What is the difference between BIS and ISI?',
      a: 'BIS (Bureau of Indian Standards) writes the standards. ISI is the older mark of conformance to a specific BIS standard. Our aluminium is sourced from BIS-licensed mills (Jindal Aluminium, Hindalco) under IS 733 alloy spec.' },
    { q: 'Are your installation crews insured?',
      a: 'Yes. Workmen\'s Compensation Insurance via Bajaj Allianz covers every installation worker. Public Liability Insurance covers third-party damage during installation. Schedule copy on request.' }
  ],
  internalLinks: [
    { href: '/about/factory-tour-hyderabad',       title: 'Factory tour',                desc: 'See where the audits are conducted' },
    { href: '/about/manufacturing-process',        title: 'Manufacturing process',       desc: 'The SOPs ISO 9001 audits' },
    { href: '/about/quality-testing-process',      title: 'Quality testing',             desc: 'The test reports that back our compliance' },
    { href: '/policies/warranty-policy',           title: 'Warranty policy',             desc: 'How certification ties into our warranty' }
  ]
};
