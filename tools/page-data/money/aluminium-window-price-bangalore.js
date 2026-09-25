// City Differentiation Pilot A — Bengaluru aluminium-window money page.
// Overrides the shared factory with apartment/villa + system-comparison copy.
// Price bands, URL/canonical/H1 identity, and national pricing math stay locked.

const base = require('./_make-city-page.js')('bangalore', 'aluminium-window');

const PRICE_LOW = 550;
const PRICE_HIGH = 2250;
const MID = 1150;
const TYPICAL_BASIC = 248000;
const GST_BASIC = 248400;
const GST_TAX = 44712;
const GST_FINAL = 293112;

base.description =
  `Aluminium window price in Bengaluru from ₹${PRICE_LOW}/sqft to ₹${PRICE_HIGH}/sqft. Compare 2-track, 3-track, casement and acoustic DGU for apartments and villas. Free transport on orders ≥ ₹15 L.`;

base.hero = Object.assign({}, base.hero, {
  sub:
    'Bengaluru buyers usually decide between apartment openings and villa/deck spans — then pick 2-track, 3-track, casement or acoustic DGU. National WoodenMax rates apply; local factors are use-case and install context, not a separate city price list.',
  points: [
    `Calculator-backed price &mdash; <strong>₹${PRICE_LOW}–₹${PRICE_HIGH}/sqft</strong> (same national band)`,
    `2-track sliding (mid-range) typical &mdash; <strong>₹${MID}/sqft</strong>`,
    `Apartment vs villa guidance &mdash; Whitefield / Sarjapur / ORR noise context`,
    `<strong>Free transport</strong> on orders &ge; ₹15 L (575 km, within radius)`
  ],
  cta: {
    href: '/aluminium-window-price-calculator',
    label: 'Open aluminium window calculator'
  }
});

base.sections = [
  {
    heading: 'Aluminium windows in Bengaluru — apartment vs villa use cases',
    body:
      `<p>Most Bengaluru quotes fall into two patterns: <strong>apartment openings</strong> (compact spans, mesh preference, ORR/airport corridor noise) and <strong>villa / larger openings</strong> (Whitefield, Sarjapur and similar villa belts — deck doors, taller casements, wider sliding bays).</p>` +
      `<p>WoodenMax manufactures in Hyderabad and quotes the <strong>same national ₹/sqft bands</strong> everywhere. What changes in Bengaluru is system choice for noise-facing rooms, mesh needs, and larger villa openings — not a fabricated local rate card.</p>`
  },
  {
    id: 'aluminium-window-price-band-in-bengaluru',
    heading: 'Aluminium Window price band in Bengaluru',
    body:
      `<p>Canonical WoodenMax aluminium window pricing for Bengaluru is <strong>₹${PRICE_LOW}/sqft</strong> (entry, standard sliding, Indian hardware) to <strong>₹${PRICE_HIGH}/sqft</strong> (premium slim casement / lift-and-slide, German hardware, low-E DGU). Mid-range 2-track sliding with DGU is commonly specified around <strong>₹${MID}/sqft</strong>.</p>` +
      `<p>A typical <strong>3 BHK — 12 openings</strong> at mid-range specs closes around <strong>₹${(TYPICAL_BASIC / 1000).toFixed(0)},000</strong> basic (before GST). Free transport applies on qualifying orders (≥ ₹15 L) within the 1,000 km radius.</p>` +
      `<p>Run sizes in the <a href="/aluminium-window-price-calculator">aluminium window price calculator</a> or review <a href="/products/aluminium-windows/aluminium-window-price-per-sqft">price per sqft</a> for band context.</p>`,
    table: {
      head: ['Tier', 'Variant', 'Price band (₹/sqft)', 'Best use in Bengaluru'],
      rows: [
        ['Value', 'Standard 2-track sliding, Indian hardware, single glaze', `₹ ${PRICE_LOW}–880`, 'Builder apartments, rental refreshes, secondary rooms'],
        ['Mid-range', '2-track / 3-track + DGU, branded hardware', '₹ 880–1375', '3 BHK apartments; quiet bedrooms on busy corridors'],
        ['Premium', 'Slim casement / lift-and-slide, low-E or acoustic DGU', `₹ 1375–${PRICE_HIGH}`, 'Villa decks, larger openings, architect-led elevations']
      ]
    }
  },
  {
    heading: 'Recommended systems by Bengaluru use case',
    body:
      `<p>Match the opening job first; price follows the national band for that system.</p>`,
    table: {
      head: ['Best use', 'Recommended system', 'Specs / options', 'Why it fits Bengaluru'],
      rows: [
        ['Standard apartment living / bedroom', '<a href="/products/aluminium-windows/aluminium-sliding-window">2-track sliding</a>', 'Mesh track optional; clear or DGU', 'Everyday ventilation + dust control without overspec'],
        ['Need more ventilation + insect mesh', '<a href="/products/aluminium-windows/3-track-sliding-window">3-track sliding</a>', 'Outer mesh leaf + two glass leaves', 'Common apartment preference when mesh must stay on'],
        ['Noise-facing rooms (ORR / airport corridor)', 'Sliding or casement + acoustic DGU', 'DGU / laminated acoustic stack', 'See <a href="/blog/soundproof-windows-Hyderabad">soundproof window guide</a> for acoustic options'],
        ['Villa deck / larger openings (Whitefield, Sarjapur)', 'Lift-and-slide or wide sliding + DGU', 'Heavier rollers, low-E or acoustic glass', 'Larger spans need hardware and glass matched to opening size'],
        ['Wet areas / high ventilation rooms', '<a href="/products/aluminium-windows/aluminium-casement-window-price">Casement</a>', 'Multi-point lock, compression seals', 'Better seal and vent control than a minimal slider']
      ]
    }
  },
  {
    heading: 'Standard vs acoustic / DGU — and 2-track vs 3-track',
    body:
      `<p><strong>Single glaze</strong> suits quieter interior-facing openings on a Value budget. <strong>DGU</strong> is the usual mid-range upgrade for thermal comfort and everyday traffic noise. <strong>Acoustic / laminated DGU</strong> is for bedrooms and living rooms that face ORR, flyovers or airport-corridor traffic — still within the same published ₹/sqft bands once glass and hardware are selected.</p>` +
      `<p><strong>2-track</strong> is the default apartment slider. Choose <strong>3-track</strong> when you want a dedicated mesh leaf without removing a glass panel. Neither option invents a Bengaluru-only price — calculator line items stay national.</p>`,
    callout: {
      tone: 'info',
      title: 'Bengaluru is inland — standard coating is enough',
      body:
        'Standard Qualicoat Class 2 powder coating is sufficient for Bengaluru’s temperate inland climate. Marine / salt-air coating packages belong on exposed seafront cities — not Bengaluru apartments or villas.'
    }
  },
  {
    heading: 'Installation considerations in Bengaluru',
    list: [
      '<strong>Opening survey</strong> — confirm masonry rebate, sill condition and mesh preference before locking glass thickness.',
      '<strong>Apartment access</strong> — stair / lift constraints affect crate size and install sequencing; flagged on the site visit.',
      '<strong>Villa / deck spans</strong> — larger leaves may need two-person handling and stronger fixings; quote follows measured openings.',
      '<strong>Timeline</strong> — typical <strong>28–35 calendar days</strong> from PO (design freeze → Hyderabad production → transit → install).'
    ]
  },
  {
    heading: 'City factors that change the quote (not the ₹/sqft list)',
    body:
      `<p>Bengaluru-relevant factors are use-case and logistics — not a separate city price table.</p>`,
    list: [
      '<strong>Climate</strong> — temperate, moderate humidity, long rain window; standard Class 2 coating is enough.',
      '<strong>Wind</strong> — Low (Zone 2); design face-load about <strong>1.2 kPa (~115 km/h)</strong> on qualified systems.',
      '<strong>Noise context</strong> — ORR and airport-corridor homes often justify acoustic DGU on select openings only.',
      '<strong>Transport</strong> — 575 km from Hyderabad; free transport on orders ≥ ₹15 L within the published 1,000 km policy.'
    ]
  },
  {
    heading: 'GST, transport &amp; the final invoice',
    body:
      `<p><strong>GST @ 18% is always extra</strong> on basic value. Free transport applies on orders &ge; &#8377;15 L (575 km from Hyderabad &mdash; within 1,000 km radius). Full rules: <a href="/policies/gst-transport-policy">GST &amp; Transport policy</a>.</p>` +
      `<p>Example for a typical Bengaluru 3 BHK — 12 openings at mid-range 2-track pricing:</p>`,
    table: {
      head: ['Line item', 'Value'],
      rows: [
        [`Basic (12 openings × ~18 sqft × ₹${MID})`, `<strong>₹ ${GST_BASIC.toLocaleString('en-IN')}</strong>`],
        ['GST @ 18%', `₹ ${GST_TAX.toLocaleString('en-IN')}`],
        ['Transportation', '<strong>FREE</strong> (within 1,000 km, qualifying order value)'],
        ['<strong>Final invoice value</strong>', `<strong>₹ ${GST_FINAL.toLocaleString('en-IN')}</strong>`]
      ]
    }
  },
  {
    heading: 'Service coverage in Bengaluru',
    body:
      `<p>We serve Bengaluru pincodes (5600xx) and nearby towns. Locality names below are coverage context — not project-count claims.</p>`,
    list: [
      '<strong>Core localities</strong> — Indiranagar, Whitefield, Hebbal, Sarjapur Road, JP Nagar, HSR Layout',
      '<strong>Nearby</strong> — Mysuru, Hosur, Tumkur, Doddaballapur',
      'City overview: <a href="/city/bangalore">WoodenMax Bengaluru hub</a>. For glass elevations in the same city, see <a href="/products/glass-elevation/glass-elevation-price-bangalore">glass elevation price in Bengaluru</a>.'
    ]
  },
  {
    heading: 'How Bengaluru customers go from inquiry to install',
    cards: [
      { icon: '1', title: 'Site visit', body: 'Measure openings, note noise/mesh context, draft shop drawing. Book via the contact form or start with the calculator for a size-led estimate.' },
      { icon: '2', title: 'Detailed PDF quote', body: 'Invoice-grade PDF with line items, GST, transport eligibility and warranty terms — typically within <strong>2 working days</strong> of a completed survey.' },
      { icon: '3', title: 'Token + production', body: '20% token &rarr; production at our Hyderabad factory <strong>18–25 working days</strong>.' },
      { icon: '4', title: 'Install + handover', body: 'Dispatch to Bengaluru; install over <strong>2–11 working days</strong> depending on opening count, then snag-free handover.' }
    ]
  },
  {
    heading: 'Price calculator CTA',
    body:
      `<p>Use the national <a href="/aluminium-window-price-calculator"><strong>aluminium window price calculator</strong></a> for opening-wise estimates, then request a Bengaluru site visit for a locked quote. Related: <a href="/products/aluminium-windows/aluminium-window-price-per-sqft">₹/sqft guide</a> · <a href="/products/aluminium-windows/3-track-sliding-window">3-track sliding</a> · <a href="/products/aluminium-windows/aluminium-casement-window-price">casement</a> · <a href="/blog/soundproof-windows-Hyderabad">acoustic / soundproof guide</a>.</p>`
  }
];

base.faqs = [
  {
    q: 'What is the aluminium window price range in Bengaluru?',
    a: `WoodenMax publishes <strong>₹${PRICE_LOW}–₹${PRICE_HIGH}/sqft</strong> nationally (basic, before GST). Entry 2-track starts at ₹${PRICE_LOW}/sqft; mid-range with DGU is often around ₹${MID}/sqft. Bengaluru does not get a separate invented rate card — use the <a href="/aluminium-window-price-calculator">calculator</a> for opening-wise totals.`
  },
  {
    q: '2-track or 3-track for a Bengaluru apartment?',
    a: 'Choose <strong>2-track</strong> for a simple slider. Choose <strong>3-track</strong> when you want a dedicated insect-mesh leaf that can stay on while glass panels slide. Price still follows the same national bands once profile, glass and hardware are selected.'
  },
  {
    q: 'When should Bengaluru homes use acoustic DGU?',
    a: 'Prioritise acoustic / laminated DGU on bedrooms and living rooms that face ORR, flyovers or airport-corridor traffic. Quiet courtyard-facing openings can often stay on standard DGU or single glaze within the Value/Mid bands. See the <a href="/blog/soundproof-windows-Hyderabad">soundproof windows guide</a>.'
  },
  {
    q: 'Do Bengaluru villas need different systems than apartments?',
    a: 'Often yes on <em>span and hardware</em>, not on a special city price. Villa decks and larger Whitefield/Sarjapur openings may need lift-and-slide or heavier sliding/casement sections; apartments more often stay on 2-track or 3-track. Quote from measured openings.'
  },
  {
    q: 'Is a marine / salt-air coating required in Bengaluru?',
    a: 'No. Bengaluru is inland and temperate. Standard Qualicoat Class 2 is the usual coating for local apartments and villas.'
  },
  {
    q: 'Does Bengaluru get a different aluminium window ₹/sqft than Hyderabad?',
    a: 'No — manufacturing is at the Hyderabad factory, so basic aluminium window ₹/sqft is national. Bengaluru quote deltas are transport eligibility, glass/hardware upgrades (e.g. acoustic DGU) and site access — not a parallel city price list.'
  },
  {
    q: 'How do I get a locked Bengaluru quote?',
    a: 'Start with the <a href="/aluminium-window-price-calculator">calculator</a>, then book a site visit via <a href="/contact?intent=site-visit&city=bangalore&source=aluminium-window-price-bangalore">contact</a>. Payment terms on confirmed orders: 20% token, 70% before dispatch, 10% on snag-free handover.'
  }
];

base.internalLinks = [
  { href: '/aluminium-window-price-calculator', title: 'Aluminium window calculator', desc: 'Opening-wise national estimate' },
  { href: '/products/aluminium-windows/aluminium-window-price-per-sqft', title: 'Price per sqft guide', desc: '₹/sqft bands explained' },
  { href: '/products/aluminium-windows/3-track-sliding-window', title: '3-track sliding window', desc: 'Mesh + dual glass leaf layout' },
  { href: '/products/aluminium-windows/aluminium-casement-window-price', title: 'Casement window price', desc: 'Compression-seal casements' },
  { href: '/blog/soundproof-windows-Hyderabad', title: 'Soundproof / acoustic guide', desc: 'DGU & noise-reduction options' },
  { href: '/city/bangalore', title: 'Bengaluru city hub', desc: 'Local products & coverage' },
  { href: '/products/glass-elevation/glass-elevation-price-bangalore', title: 'Glass elevation price — Bengaluru', desc: 'Facade pricing in the same city' },
  { href: '/policies/gst-transport-policy', title: 'GST & transport policy', desc: 'Free transport rules' },
  { href: '/policies/warranty-policy', title: 'Warranty policy', desc: '10-yr profile, 5-yr hardware' },
  { href: '/products/aluminium-windows', title: 'Aluminium Windows hub', desc: 'All variants & finishes' }
];

module.exports.pageConfig = base;
