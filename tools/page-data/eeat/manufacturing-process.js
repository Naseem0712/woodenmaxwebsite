module.exports.pageConfig = {
  slug: 'manufacturing-process',
  silo: 'eeat',
  out:  'about/manufacturing-process.html',
  canonical: '/about/manufacturing-process',
  title: 'WoodenMax Manufacturing Process | From Mill-Certified Billet to Glazed Shutter',
  description: 'Step-by-step look at how a WoodenMax aluminium window is made — billet sourcing, mitre cut, CNC routing, Qualicoat powder coat, EPDM glazing, hardware fit, QC. The process behind 10-year warranty.',
  ogImage: 'https://woodenmax.in/images/eeat/manufacturing-hero.webp',
  schemaType: 'AboutPage',
  breadcrumb: [
    { label: 'Home',  href: '/' },
    { label: 'About', href: '/about/' },
    { label: 'Manufacturing process' }
  ],
  h1: 'Manufacturing process — what happens between order &amp; dispatch',
  hero: {
    sub: 'Average lead time: 18–25 working days for a 3 BHK opening set. Here is what those days actually look like.',
    image: {
      src: '../images/eeat/manufacturing-hero.webp',
      alt: 'CNC machining of aluminium profile at WoodenMax factory',
      w: 1200, h: 750
    },
    points: [
      'Mill-certified <strong>6063-T5</strong> aluminium billet — every lot traceable',
      '<strong>Italian Emmegi / Pertici</strong> twin-head mitre saws — ±0.1 mm tolerance',
      'Qualicoat Class-2 powder coating — <strong>60–80 microns</strong> verified',
      '<strong>Single-shutter QC sign-off</strong> before crating'
    ]
  },
  sections: [
    {
      heading: 'Day 0 — design freeze',
      body:
        '<p>Once you approve the shop drawing, a digital bill-of-materials is generated. It lists every cut length, every drill point, every gasket SKU and every hardware part — by opening. This BoM is the single source of truth for everything downstream.</p>'
    },
    {
      heading: 'Days 1–3 — material reservation &amp; mill certificates',
      body:
        '<p>Aluminium billets are pulled from our reserve and matched to your BoM. We work with three approved mills (Jindal, Hindalco, Bhoruka). Each billet comes with a mill test certificate (alloy composition, temper) that we cross-check against our 6063-T5 specification. Hardware (handles, rollers, locks) is reserved from our stock of <strong>SIEGENIA, ROTO, GU and HOPPE</strong> imports.</p>'
    },
    {
      heading: 'Days 4–7 — precision cutting',
      body:
        '<p>Twin-head Italian mitre saws cut every member to length and 45&deg; mitre. Cuts are deburred and labelled with the opening number. <strong>No batching</strong> — your profile never sits in a shared bin.</p>',
      callout: {
        tone: 'info',
        title: 'Why ±0.1 mm matters',
        body: 'A 1 mm error at the cut stage compounds at the assembly stage. At 4 corners, that becomes a 4 mm visible misalignment. Our Italian saws give us a tolerance 10× tighter than the Indian industry norm of ±1 mm.'
      }
    },
    {
      heading: 'Days 8–10 — CNC routing &amp; profile prep',
      list: [
        'Drainage slots routed on the lower horizontal profile',
        'Lock pockets routed for espagnolette mechanism',
        'Drainage caps inserted (snap-fit, no glue)',
        'Weep holes punched for water management on multi-track sliders',
        'All burrs removed with rotary files; profile cleaned of swarf'
      ]
    },
    {
      heading: 'Days 11–13 — Qualicoat Class-2 powder coating',
      body:
        '<p>The 5-stage pre-treatment process:</p>' +
        '<ol class="cluster-list">' +
          '<li>Alkali degrease (60&deg;C, 8 min) — removes mill oil + cutting lube</li>' +
          '<li>Water rinse</li>' +
          '<li>Chrome-free passivation (Bonderite NT-1) — 4 min</li>' +
          '<li>DI water rinse</li>' +
          '<li>Drying tunnel (105&deg;C, 12 min)</li>' +
        '</ol>' +
        '<p>The profile then enters the electrostatic powder spray booth. Powder is <strong>PPG Envirocron</strong> or <strong>Akzo Nobel Interpon D2525</strong> — both pure-polyester resins designed for architectural application. After spray, the profile is cured in an infrared + convection tunnel at 200&deg;C for 12 minutes.</p>' +
        '<p>Coat thickness is gauged at 5 random points per shutter. Below 60 microns or above 80 microns → reject &amp; re-coat. Adhesion is cross-cut tested on 1 in every 50 shutters per ISO 2409.</p>'
    },
    {
      heading: 'Days 14–18 — glazing &amp; hardware fit',
      body:
        '<p>DGU units (double-glazed insulated glass) arrive sealed from <strong>Saint-Gobain Glaspac</strong>, <strong>Asahi India Glass</strong> or <strong>Modi Guard</strong>. Each unit carries the glass-maker\'s warranty papers, which we file with your order record.</p>' +
        '<p>Glazing flow: profile laid flat → EPDM cushion gasket inserted around the glazing pocket → DGU lowered into pocket → wedge gasket pressed in to lock glass in place. <strong>No raw silicone touches the glass</strong> — silicone is used only as a perimeter weather seal at install, not as a structural glazing medium.</p>' +
        '<p>Hardware is then fitted: handles, rollers, espagnolette rod (where applicable), hinges, friction-stays, locks. Every shutter is operated <strong>10 times</strong> to confirm smooth motion before it leaves the glazing line.</p>'
    },
    {
      heading: 'Days 19–22 — quality control + packing',
      list: [
        'QC supervisor inspects each shutter against 7 checkpoints',
        'Water-bead test on every shutter — held at 30&deg; tilt, 1 L of water poured across the gasket, no ingress permitted',
        'Green sticker with QC initials &amp; date is applied to passing shutters',
        'Shutters are foam-wrapped (10 mm closed-cell PE), corner-protected, and crated by opening number',
        'Each crate gets a barcode that links to the shop drawing — install team scans it at site'
      ]
    },
    {
      heading: 'Days 23–25 — dispatch',
      body:
        '<p>Finished crates are loaded into our partner transport — primarily <strong>BlueDart Surface</strong> for under 8-foot pieces and project-specific 32-foot trailers for villa-scale orders. Transit insurance is included; transit time is 2–3 days within 1,000 km of Hyderabad, 4–5 days for farther destinations.</p>'
    }
  ],
  faqs: [
    { q: 'Why 18–25 days? Other vendors quote 7 days.',
      a: 'Because we manufacture every order to size from scratch. A 7-day promise typically means assembling pre-cut "kits" — fine for standard sizes, problematic for villas and luxury elevations where every opening is unique. Our timeline includes a 5-day buffer for QC rework rather than passing defects to site.' },
    { q: 'Do you keep ready stock of standard sizes?',
      a: 'Only for our hardware (handles, rollers, gaskets). Profile is cut to order because powder-coated profile yellows over a 6-month storage window, and we are not willing to ship 6-month-old stock as new.' },
    { q: 'Can I speed up my order with a rush charge?',
      a: 'Yes. A 25% rush surcharge moves your order to the top of the queue and compresses the schedule by 30–40%. Cannot go below 14 days for safety + QC reasons.' },
    { q: 'What if QC rejects a shutter?',
      a: 'It gets re-worked or fully re-made — no charge to you, no impact on your timeline beyond a 1–2 day shift. The defect goes into our weekly engineering review so we eliminate root cause.' },
    { q: 'Do you handle the glass in-house?',
      a: 'Cutting and toughening of glass is outsourced to the glass majors — they are the experts and carry the manufacturer warranty. We do the IGU (insulated glass unit) assembly when configurations are non-standard. All glass arrives sealed, certified, and assigned to a specific shop-drawing line.' }
  ],
  internalLinks: [
    { href: '/about/factory-tour-hyderabad',       title: 'Factory tour',                desc: 'See the 28,000 sq ft floor in pictures' },
    { href: '/about/quality-testing-process',      title: 'Quality testing',             desc: 'Wind, water and load test details' },
    { href: '/about/material-sourcing-india',      title: 'Material sourcing',           desc: 'Our approved-vendor list' },
    { href: '/about/certifications-iso-qualicoat', title: 'Certifications',              desc: 'ISO 9001, Qualicoat, BIS' },
    { href: '/policies/warranty-policy',           title: 'Warranty policy',             desc: '10-yr profile, 5-yr hardware' }
  ]
};
