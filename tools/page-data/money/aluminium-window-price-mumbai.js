// City Differentiation Pilot A — Mumbai aluminium-window money page.
// Overrides the shared factory with coastal / high-rise / monsoon copy.
// Price bands, URL/canonical/H1 identity, and national pricing math stay locked.

const base = require('./_make-city-page.js')('mumbai', 'aluminium-window');

const PRICE_LOW = 550;
const PRICE_HIGH = 2250;
const MID = 1150;
const TYPICAL_BASIC = 248000;
const GST_BASIC = 248400;
const GST_TAX = 44712;
const GST_FINAL = 293112;

base.description =
  `Aluminium window price in Mumbai from ₹${PRICE_LOW}/sqft to ₹${PRICE_HIGH}/sqft. Coastal Seaside coating, high-rise water-tightness and monsoon-ready specs. Free transport on orders ≥ ₹15 L.`;

base.hero = Object.assign({}, base.hero, {
  sub:
    'Mumbai quotes emphasise coastal salt, heavy monsoon and high-rise water-tightness — plus acoustic glass on railway-facing openings. National WoodenMax ₹/sqft bands still apply; coastal protection, access and hoist logistics change the specification, not a fake local rate list.',
  points: [
    `Calculator-backed price &mdash; <strong>₹${PRICE_LOW}–₹${PRICE_HIGH}/sqft</strong> (same national band)`,
    `2-track sliding (mid-range) typical &mdash; <strong>₹${MID}/sqft</strong>`,
    `Coastal Seaside coating + high-rise water-tightness guidance`,
    `<strong>Free transport</strong> on orders &ge; ₹15 L (711 km, within radius)`
  ],
  cta: {
    href: '/aluminium-window-price-calculator',
    label: 'Open aluminium window calculator'
  }
});

base.sections = [
  {
    heading: 'Aluminium windows in Mumbai — coastal, monsoon and high-rise context',
    body:
      `<p>Mumbai openings face a different risk stack than inland cities: <strong>salt air</strong>, <strong>driving monsoon rain</strong>, and often <strong>high-rise wind-driven water</strong>. Railway-facing elevations also push acoustic DGU on selected rooms.</p>` +
      `<p>Basic aluminium window ₹/sqft remains the <strong>national WoodenMax band</strong> (₹${PRICE_LOW}–₹${PRICE_HIGH}). Mumbai differentiation is coating class, water-tightness hardware, acoustic glass where needed, and install access — not invented island pricing.</p>`
  },
  {
    id: 'aluminium-window-price-band-in-mumbai',
    heading: 'Aluminium Window price band in Mumbai',
    body:
      `<p>Canonical WoodenMax aluminium window pricing for Mumbai is <strong>₹${PRICE_LOW}/sqft</strong> (entry, standard sliding, Indian hardware) to <strong>₹${PRICE_HIGH}/sqft</strong> (premium slim casement / lift-and-slide, German hardware, low-E DGU). Mid-range 2-track sliding with DGU is commonly specified around <strong>₹${MID}/sqft</strong>.</p>` +
      `<p>A typical <strong>3 BHK — 12 openings</strong> at mid-range specs closes around <strong>₹${(TYPICAL_BASIC / 1000).toFixed(0)},000</strong> basic (before GST). Coastal coating upgrades and crane/hoist access are quoted as line items after survey. Free transport applies on qualifying orders (≥ ₹15 L).</p>` +
      `<p>Estimate openings in the <a href="/aluminium-window-price-calculator">aluminium window price calculator</a> or read the <a href="/products/aluminium-windows/aluminium-window-price-per-sqft">price per sqft</a> guide.</p>`,
    table: {
      head: ['Tier', 'Variant', 'Price band (₹/sqft)', 'Best use in Mumbai'],
      rows: [
        ['Value', 'Standard 2-track sliding, Indian hardware, single glaze', `₹ ${PRICE_LOW}–880`, 'Inland / sheltered openings only — skip for exposed seafront'],
        ['Mid-range', '2-track + DGU, branded hardware, Seaside coating', '₹ 880–1375', 'Most high-rise apartments away from direct splash zone'],
        ['Premium', 'Casement / lift-and-slide, acoustic or low-E DGU, Seaside', `₹ 1375–${PRICE_HIGH}`, 'Sea-facing, railway-noise, or architect-led towers']
      ]
    }
  },
  {
    heading: 'Coastal vs inland guidance — Seaside protection',
    body:
      `<p><strong>Sea-facing and near-coast towers</strong> should specify <strong>Qualicoat Class 2 Seaside</strong> (salt-spray rated) powder coating. Budget inland-grade coats corrode faster in Mumbai’s salt + humidity mix — upgrade the coating rather than inventing a new ₹/sqft city rate.</p>` +
      `<p><strong>More inland / sheltered pockets</strong> (some Powai / Thane contexts) may still use standard Class 2 if the survey confirms low salt exposure — but monsoon water-tightness remains non-negotiable on windward elevations.</p>`,
    callout: {
      tone: 'warning',
      title: 'Coastal Mumbai: start mid-range with Seaside coating',
      body:
        'For salt-exposed elevations we recommend skipping a bare Value single-glaze package and starting at mid-range with Class-2 Seaside coating plus proper drainage / gasket detailing. Exact coating and hardware are confirmed on site survey.'
    }
  },
  {
    heading: 'Recommended systems — water-tightness, high-rise and acoustic',
    table: {
      head: ['Best use', 'Recommended system', 'Specs / options', 'Mumbai note'],
      rows: [
        ['High-rise windward openings (12+ floors)', 'System sliding or casement with drainage', 'Class-level water tightness; quality EPDM', 'Hoist / scaffold access quoted separately if needed'],
        ['Sea-facing elevations', 'Mid/Premium + Seaside coating', 'Seaside powder coat; DGU preferred', 'Coating class matters as much as track count'],
        ['Western Railway / noise corridors', 'Sliding or casement + acoustic DGU', 'Laminated / acoustic DGU stack', 'See <a href="/blog/soundproof-windows-Hyderabad">soundproof guide</a>'],
        ['Everyday apartment openings', '<a href="/products/aluminium-windows/aluminium-sliding-window">2-track sliding</a>', 'DGU + branded hardware', 'Add mesh where dust/insects matter'],
        ['Vent-critical wet rooms', '<a href="/products/aluminium-windows/aluminium-casement-window-price">Casement</a>', 'Multi-point lock, compression seals', 'Stronger seal under monsoon pressure']
      ]
    }
  },
  {
    heading: 'Installation, access and logistics in Mumbai',
    list: [
      '<strong>Building access</strong> — service lift size, loading bay rules and society permissions affect crate planning.',
      '<strong>Hoist / scaffold / crane</strong> — common on high-rises when leaves cannot move via lift; charged at actuals after survey (see <a href="/policies/installation-policy">installation policy</a>).',
      '<strong>Monsoon sequencing</strong> — windward elevations may need staged sealing and weather windows.',
      '<strong>Timeline</strong> — typical <strong>28–35 calendar days</strong> from PO when transport is within the free-radius policy; high-rise access can extend on-site days.'
    ]
  },
  {
    heading: 'City factors that change the quote (not the ₹/sqft list)',
    list: [
      '<strong>Climate</strong> — coastal, high humidity, very heavy monsoon.',
      '<strong>Wind</strong> — Moderate (Zone 3); design face-load about <strong>1.8 kPa (~155 km/h gust)</strong>.',
      '<strong>Salt exposure</strong> — Seaside coating on exposed elevations.',
      '<strong>Transport</strong> — 711 km from Hyderabad; free transport on orders ≥ ₹15 L within the published 1,000 km policy.',
      '<strong>Warranty / GST</strong> — see <a href="/policies/warranty-policy">warranty policy</a> and <a href="/policies/gst-transport-policy">GST &amp; transport</a>.'
    ]
  },
  {
    heading: 'GST, transport &amp; the final invoice',
    body:
      `<p><strong>GST @ 18% is always extra</strong> on basic value. Free transport applies on orders &ge; &#8377;15 L (711 km from Hyderabad &mdash; within 1,000 km radius). Full rules: <a href="/policies/gst-transport-policy">GST &amp; Transport policy</a>.</p>` +
      `<p>Example for a typical Mumbai 3 BHK — 12 openings at mid-range 2-track pricing (coating/hoist extras not included until surveyed):</p>`,
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
    heading: 'Service coverage in Mumbai',
    body:
      `<p>We serve Mumbai pincodes (4000xx) and adjacent towns. Names below are coverage context — not project-count or referral claims.</p>`,
    list: [
      '<strong>Core localities</strong> — BKC, Worli, Powai, Andheri, Borivali, Thane West',
      '<strong>Nearby</strong> — Navi Mumbai, Kalyan, Vasai, Panvel',
      'City overview: <a href="/city/mumbai">WoodenMax Mumbai hub</a>. Facade work: <a href="/products/glass-elevation/glass-elevation-price-mumbai">glass elevation price in Mumbai</a>.'
    ]
  },
  {
    heading: 'How Mumbai customers go from inquiry to install',
    cards: [
      { icon: '1', title: 'Site visit', body: 'Measure openings, note sea/rail exposure and access constraints, draft shop drawing. Start with the calculator for a size-led estimate if drawings already exist.' },
      { icon: '2', title: 'Detailed PDF quote', body: 'Invoice-grade PDF with line items, GST, transport eligibility, coating notes and any access equipment — typically within <strong>2 working days</strong> of survey.' },
      { icon: '3', title: 'Token + production', body: '20% token &rarr; production at our Hyderabad factory <strong>18–25 working days</strong>.' },
      { icon: '4', title: 'Install + handover', body: 'Dispatch to Mumbai; install over <strong>2–11 working days</strong> (longer if hoist windows apply), then snag-free handover.' }
    ]
  },
  {
    heading: 'Price calculator CTA',
    body:
      `<p>Use the national <a href="/aluminium-window-price-calculator"><strong>aluminium window price calculator</strong></a>, then request a Mumbai site visit for Seaside / water-tightness confirmation. Related: <a href="/products/aluminium-windows/aluminium-window-price-per-sqft">₹/sqft guide</a> · <a href="/blog/soundproof-windows-Hyderabad">acoustic guide</a> · <a href="/policies/warranty-policy">warranty</a> · <a href="/policies/gst-transport-policy">GST &amp; transport</a>.</p>`
  }
];

base.faqs = [
  {
    q: 'What is the aluminium window price range in Mumbai?',
    a: `WoodenMax publishes <strong>₹${PRICE_LOW}–₹${PRICE_HIGH}/sqft</strong> nationally (basic, before GST). Mid-range with DGU is often around ₹${MID}/sqft. Mumbai does not use a separate invented rate card — coastal coating and access equipment are specification add-ons confirmed after survey. Use the <a href="/aluminium-window-price-calculator">calculator</a> for opening-wise totals.`
  },
  {
    q: 'Do Mumbai windows need Seaside / salt-spray coating?',
    a: 'On sea-facing and high salt-exposure elevations, yes — specify <strong>Qualicoat Class 2 Seaside</strong>. Sheltered inland-facing openings may use standard Class 2 if the survey confirms low salt load. Coating choice does not replace water-tightness detailing for monsoon.'
  },
  {
    q: 'What matters for high-rise water-tightness in Mumbai?',
    a: 'Wind-driven rain on taller towers needs proper drainage paths, gasket quality and hardware that maintains seal under pressure. Exact class targets are set after opening orientation and floor height are surveyed — not guessed from a city template.'
  },
  {
    q: 'Should railway-facing Mumbai flats use acoustic DGU?',
    a: 'Yes for bedrooms and living rooms that face Western Railway or other heavy corridors. Acoustic / laminated DGU sits inside the same published price bands once glass is selected. See the <a href="/blog/soundproof-windows-Hyderabad">soundproof windows guide</a>.'
  },
  {
    q: 'Are hoist or crane charges included in the ₹/sqft?',
    a: 'No. Basic ₹/sqft covers supply of the specified window system. High-rise hoist, scaffold or crane — when the building cannot move crates via lift — is quoted at actuals after site survey per the <a href="/policies/installation-policy">installation policy</a>.'
  },
  {
    q: 'Why is Mumbai aluminium window ₹/sqft the same as Hyderabad?',
    a: 'Because manufacturing is at the Hyderabad factory — basic aluminium window ₹/sqft is national. Mumbai deltas are Seaside coating where needed, acoustic glass, transport eligibility and install logistics (access/hoist), not a parallel city price list.'
  },
  {
    q: 'How do GST and free transport work for Mumbai?',
    a: 'GST @ 18% is always extra on basic value. Mumbai is 711 km from Hyderabad — within the 1,000 km free-transport radius on qualifying orders (≥ ₹15 L). Details: <a href="/policies/gst-transport-policy">GST &amp; transport policy</a>. Payment on confirmed orders: 20% token, 70% before dispatch, 10% on snag-free handover.'
  }
];

base.internalLinks = [
  { href: '/aluminium-window-price-calculator', title: 'Aluminium window calculator', desc: 'Opening-wise national estimate' },
  { href: '/products/aluminium-windows/aluminium-window-price-per-sqft', title: 'Price per sqft guide', desc: '₹/sqft bands explained' },
  { href: '/blog/soundproof-windows-Hyderabad', title: 'Soundproof / acoustic guide', desc: 'DGU & noise-reduction options' },
  { href: '/city/mumbai', title: 'Mumbai city hub', desc: 'Local products & coverage' },
  { href: '/products/glass-elevation/glass-elevation-price-mumbai', title: 'Glass elevation price — Mumbai', desc: 'Facade pricing in the same city' },
  { href: '/policies/warranty-policy', title: 'Warranty policy', desc: '10-yr profile, 5-yr hardware' },
  { href: '/policies/gst-transport-policy', title: 'GST & transport policy', desc: 'Free transport rules' },
  { href: '/policies/installation-policy', title: 'Installation policy', desc: 'Access & equipment notes' },
  { href: '/products/aluminium-windows', title: 'Aluminium Windows hub', desc: 'All variants & finishes' }
];

module.exports.pageConfig = base;
