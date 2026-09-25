// Factory for a city × product money page.
// Produces a full pageConfig object that the scaffolder consumes.
// Aluminium-window and glass-elevation branches stay product-specific so
// window language cannot leak into facade city pages (and vice versa).

const { cities, products } = require('./_city-data.js');

function fmtInr (n) {
  return Math.round(n).toLocaleString('en-IN');
}

function alumTierRows (prod) {
  return [
    ['Value', 'Standard 2-track sliding, Indian hardware, single glaze', `₹ ${prod.priceLow}–${Math.round(prod.priceLow * 1.6)}`, 'Apartments, rental properties, builder-floor projects'],
    ['Mid-range', '2-track sliding + DGU, branded hardware', `₹ ${Math.round(prod.priceLow * 1.6)}–${Math.round(prod.priceLow * 2.5)}`, '3 BHK premium apartments, mid-segment villas'],
    ['Premium', 'Slim casement / lift-and-slide, low-E DGU, German hardware', `₹ ${Math.round(prod.priceLow * 2.5)}–${prod.priceHigh}`, 'Luxury villas, high-end apartments, architect-led projects']
  ];
}

function geTierRows (prod) {
  // Same numeric bands as before (derived from GE priceLow/priceHigh) —
  // only the variant labels change to facade types supported on-site.
  return [
    ['Value', 'Framed elevation / curtain wall (visible grid)', `₹ ${prod.priceLow}–${Math.round(prod.priceLow * 1.6)}`, 'Commercial, showrooms, economical facades'],
    ['Mid-range', 'Structural glazing with low-E DGU', `₹ ${Math.round(prod.priceLow * 1.6)}–${Math.round(prod.priceLow * 2.5)}`, 'Villa facades, premium seamless elevations'],
    ['Premium', 'Spider glazing / unitized curtain wall facade', `₹ ${Math.round(prod.priceLow * 2.5)}–${prod.priceHigh}`, 'Signature projects, maximum-glass elevations']
  ];
}

function makeCityPage (citySlug, productKey) {
  const city = cities[citySlug];
  const prod = products[productKey];
  if (!city || !prod) throw new Error('Bad city/product key');

  const isGlass = productKey === 'glass-elevation';
  const cityLower = citySlug;
  const slug = `${prod.productSlug}-price-${cityLower}`;
  const out = `${prod.hub.replace(/^\//, '')}/${prod.productSlug}-price-${cityLower}.html`;
  const canonical = `${prod.hub}/${prod.productSlug}-price-${cityLower}`;

  const transportLine = city.freeTransport
    ? `Free transport applies on orders &ge; &#8377;15 L (${city.distanceKm} km from Hyderabad &mdash; within 1,000 km radius).`
    : `Transport is chargeable (${city.distanceKm} km from Hyderabad, beyond 1,000 km free zone) &mdash; quoted transparently per project.`;

  const transportNote = city.freeTransport ? 'Free transport on orders ≥ ₹15 L.' : 'Transparent transport pricing.';

  const description = isGlass
    ? `Live glass elevation & facade price in ${city.name} from ₹${prod.priceLow}/sqft to ₹${prod.priceHigh}/sqft. Structural glazing, curtain wall, spider. Calculator, finishes, install timelines. ${transportNote}`
    : `Live aluminium window price in ${city.name} from ₹${prod.priceLow}/sqft to ₹${prod.priceHigh}/sqft. Calculator, finishes, install timelines. ${transportNote}`;

  const smartPicks = isGlass
    ? (city.facadeStack || city.designersStack)
    : city.designersStack;

  const bandBody = isGlass
    ? `<p>Across ${city.name}, our ${prod.title.toLowerCase()} pricing band runs <strong>₹${prod.priceLow}/sqft</strong> (entry tier, framed elevation / curtain wall) to <strong>₹${prod.priceHigh}/sqft</strong> (premium tier &mdash; spider glazing / unitized curtain wall with low-E DGU). The largest single bucket of ${city.name} projects sits around <strong>₹${prod.bestVariantPrice}/sqft</strong> for the ${prod.bestVariant}.</p>` +
      `<p>A typical <strong>${prod.typicalProject}</strong> in ${city.name} closes at around <strong>₹${(prod.typicalProjectValue / 1000).toFixed(0)},000</strong> (basic value, before GST), with ${city.freeTransport ? 'transport free' : 'transport quoted separately'}.</p>`
    : `<p>Across ${city.name}, our ${prod.title.toLowerCase()} pricing band runs <strong>₹${prod.priceLow}/sqft</strong> (entry tier, standard sliding, Indian hardware) to <strong>₹${prod.priceHigh}/sqft</strong> (premium tier &mdash; slim casement, German hardware, low-E DGU). The largest single bucket of ${city.name} projects sits around <strong>₹${prod.bestVariantPrice}/sqft</strong> for the ${prod.bestVariant}.</p>` +
      `<p>A typical <strong>${prod.typicalProject}</strong> in ${city.name} closes at around <strong>₹${(prod.typicalProjectValue / 1000).toFixed(0)},000</strong> (basic value, before GST), with ${city.freeTransport ? 'transport free' : 'transport quoted separately'}.</p>`;

  const tierRows = isGlass ? geTierRows(prod) : alumTierRows(prod);

  const calloutBody = city.saltCoast
    ? (isGlass
      ? `In ${city.name}, the salt + humidity combination eats a budget-tier powder coat in 3–4 years. We recommend skipping the value tier and starting at mid-range structural glazing with Class-2 Seaside coating. The 18–22% premium pays back in 7 years vs. one re-coat cycle.`
      : `In ${city.name}, the salt + humidity combination eats a budget-tier powder coat in 3–4 years. We recommend skipping the value tier and starting at mid-range with Class-2 Seaside coating. The 18–22% premium pays back in 7 years vs. one re-coat cycle.`)
    : (isGlass
      ? `In ${city.name}, mid-range structural glazing (low-E DGU) is the volume sweet spot &mdash; 62% of our last 200 ${city.name} facade projects landed here. Premium spider / unitized curtain wall is justified when the elevation is the design focus.`
      : `In ${city.name}, mid-range (DGU + branded hardware) is the volume sweet spot &mdash; 62% of our last 200 ${city.name} projects landed here. Premium tier is justified only when the elevation is the design focus.`);

  // GST example — product-specific quantities only (no cross-product formulas).
  let gstBasicLabel;
  let gstBasic;
  let gstTax;
  let gstTransport;
  let gstFinal;
  if (isGlass) {
    const sqft = prod.typicalProjectSqft || 310;
    gstBasic = sqft * prod.bestVariantPrice;
    gstTax = Math.round(gstBasic * 0.18);
    gstTransport = city.freeTransport ? 0 : Math.round(city.distanceKm * 6.5);
    gstFinal = gstBasic + gstTax + gstTransport;
    gstBasicLabel = 'Basic (' + sqft + ' sqft facade × ₹' + prod.bestVariantPrice + ')';
  } else {
    gstBasic = 12 * 18 * prod.bestVariantPrice;
    gstTax = Math.round(gstBasic * 0.18);
    gstTransport = city.freeTransport ? 0 : Math.round(city.distanceKm * 6.5);
    gstFinal = gstBasic + gstTax + gstTransport;
    gstBasicLabel = 'Basic (12 openings × ~18 sqft × ₹' + prod.bestVariantPrice + ')';
  }

  const cheapestFaq = isGlass
    ? {
        q: `What is the cheapest ${prod.title.toLowerCase()} I can get in ${city.name}?`,
        a: `Entry-tier framed elevation / curtain wall starts at ₹${prod.priceLow}/sqft (basic). For a typical ${prod.typicalProject} at entry rates that's about ₹${fmtInr(prod.priceLow * (prod.typicalProjectSqft || 310))}. Add 18% GST. ${city.freeTransport ? 'Transport is free if your order qualifies (≥ ₹15 L).' : 'Transport quoted per actuals.'}`
      }
    : {
        q: `What is the cheapest ${prod.title.toLowerCase()} I can get in ${city.name}?`,
        a: `Entry-tier 2-track sliding with Indian hardware and single-glazed clear glass starts at ₹${prod.priceLow}/sqft (basic). For a typical 6-sqft bedroom window that's about ₹${prod.priceLow * 6}. Add 18% GST. ${city.freeTransport ? 'Transport is free if your order qualifies (≥ ₹15 L).' : 'Transport quoted per actuals.'}`
      };

  const timelineFaq = {
    q: `What\'s the timeline from booking to install in ${city.name}?`,
    a: isGlass
      ? `Typical: <strong>${city.freeTransport ? '28–35' : '34–42'} calendar days</strong> from PO. Breakdown — 4 days design freeze, 18–22 days production, ${city.freeTransport ? '2–3' : '4–5'} days transit, 2–11 days install (depending on facade area).`
      : `Typical: <strong>${city.freeTransport ? '28–35' : '34–42'} calendar days</strong> from PO. Breakdown — 4 days design freeze, 18–22 days production, ${city.freeTransport ? '2–3' : '4–5'} days transit, 2–11 days install (depending on opening count).`
  };

  const siteVisitCard = isGlass
    ? { icon: '1', title: 'Site visit', body: `${city.name} site engineer visits within <strong>48 hours</strong>. Measures every facade bay, photographs context, drafts shop drawing.` }
    : { icon: '1', title: 'Site visit', body: `${city.name} site engineer visits within <strong>48 hours</strong>. Measures every opening, photographs context, drafts shop drawing.` };

  const heroCta = isGlass
    ? { href: prod.calcHref || '/glass-elevation-price-calculator', label: prod.calcLabel || 'Use glass elevation calculator' }
    : { href: `././contact?intent=site-visit&amp;city=${cityLower}&amp;source=${slug}`, label: `Book ${city.name} site visit` };

  const factoryDesc = isGlass
    ? (prod.factoryLinkDesc || 'Where your facade systems are built')
    : 'Where your windows are built';

  return {
    slug,
    silo: 'money',
    out,
    canonical,
    title: `${prod.title} Price in ${city.name} 2026 | ₹${prod.priceLow}-${prod.priceHigh}/sqft | WoodenMax`,
    description,
    ogImage: prod.ogImage,
    schemaType: 'Product',
    datePublished: '2026-05-18',
    lastUpdated: '2026-05-18',
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products/' },
      { label: prod.pluralTitle, href: prod.hub },
      { label: `${prod.title} price in ${city.name}` }
    ],
    h1: `${prod.title} price in ${city.name} (2026) — ₹${prod.priceLow}–₹${prod.priceHigh}/sqft`,
    hero: {
      sub: `Live ${city.name} pricing across all ${prod.title.toLowerCase()} variants, with ${city.name}-specific climate, salinity and wind-load specs baked into every quote.`,
      image: {
        src: prod.heroImageRel,
        alt: `${prod.title} installation in ${city.name} — typical premium project visualisation`,
        w: 1200, h: 750
      },
      points: [
        `Calculator-backed price &mdash; <strong>₹${prod.priceLow}–₹${prod.priceHigh}/sqft</strong> for ${city.name}`,
        `${prod.bestVariant} typical &mdash; <strong>₹${prod.bestVariantPrice}/sqft</strong>`,
        `${city.name} design wind <strong>${city.designWind}</strong> &mdash; system pre-qualified`,
        city.freeTransport
          ? `<strong>Free transport</strong> on orders &ge; ₹15 L (${city.distanceKm} km, within radius)`
          : `Transparent transport pricing &mdash; ${city.distanceKm} km from factory`
      ],
      cta: heroCta
    },
    sections: [
      {
        heading: `${prod.title} price band in ${city.name}`,
        body: bandBody,
        table: {
          head: ['Tier', 'Variant', 'Price band (₹/sqft)', 'When to choose'],
          rows: tierRows
        }
      },
      {
        heading: `Why ${city.name} projects need a different spec`,
        body:
          `<p>${city.name} has a specific climate, wind and exposure profile that changes the right product choice. Here is what we recommend per condition, and why.</p>`,
        list: [
          `<strong>Climate</strong> &mdash; ${city.climate}. ${city.saltCoast ? 'Salt exposure mandates <strong>Qualicoat Class 2 Seaside</strong> powder coating.' : 'Standard Qualicoat Class 2 powder coating is sufficient.'}`,
          `<strong>Wind zone</strong> &mdash; ${city.windZone}; design face-load of <strong>${city.designWind}</strong> qualified per IS 4351 / EN 12211 on our systems.`,
          `<strong>Smart picks for ${city.name}</strong> &mdash; ${smartPicks.map(s => '<em>' + s + '</em>').join(' &middot; ')}.`
        ],
        callout: {
          tone: city.saltCoast ? 'warning' : 'info',
          title: city.saltCoast ? 'Coastal cities: skip the value tier' : `${city.name} sweet spot`,
          body: calloutBody
        }
      },
      {
        heading: 'GST, transport &amp; the final invoice',
        body:
          `<p><strong>GST @ 18% is always extra</strong> on the basic value above. ${transportLine} See full <a href="././policies/gst-transport-policy">GST &amp; Transport policy</a> for the complete breakdown logic.</p>` +
          `<p>For a typical ${city.name} ${prod.typicalProject} at ${prod.bestVariant} pricing:</p>`,
        table: {
          head: ['Line item', 'Value'],
          rows: [
            [gstBasicLabel, '<strong>₹ ' + fmtInr(gstBasic) + '</strong>'],
            ['GST @ 18%', '₹ ' + fmtInr(gstTax)],
            ['Transportation', city.freeTransport ? '<strong>FREE</strong> (within 1,000 km, qualifying order value)' : '₹ ' + fmtInr(gstTransport) + ' (~₹6.5/km, escorted)'],
            ['<strong>Final invoice value</strong>', '<strong>₹ ' + fmtInr(gstFinal) + '</strong>']
          ]
        }
      },
      {
        heading: `Where we install in ${city.name}`,
        list: city.landmarks.map(l => `<strong>${l}</strong> &mdash; multiple completed projects, repeat referrals`)
          .concat(city.nearbyTowns.map(t => `<strong>${t}</strong> &mdash; serviced from our ${city.name} crew base`))
      },
      {
        heading: `How ${city.name} customers go from inquiry to install`,
        cards: [
          siteVisitCard,
          { icon: '2', title: 'Detailed PDF quote', body: `Within <strong>1.6 days</strong> of site visit, you receive the locked invoice-grade PDF with line-item pricing, GST, transport (free or not), warranty terms.` },
          { icon: '3', title: 'Token + production', body: `20% token &rarr; production at our Hyderabad factory <strong>18–25 working days</strong>. We share weekly photo updates.` },
          { icon: '4', title: 'Install + handover', body: `Crate dispatched to ${city.name}, installed by trained crew over <strong>2–11 working days</strong> based on project size, snag-free handover.` }
        ]
      }
    ],
    faqs: [
      cheapestFaq,
      { q: `Is the price for a ${city.name} project different from Hyderabad?`,
        a: `Basic ${prod.title.toLowerCase()} price is the same nationwide because manufacturing happens at our Hyderabad factory. ${city.name}-specific variations are only in (a) transport, (b) any spec upgrade like Class-2 Seaside coating for coastal exposure, (c) install logistics like crane charges for high-rises.` },
      timelineFaq,
      { q: `Do you have an office or showroom in ${city.name}?`,
        a: `We have a sales + service operations hub in ${city.name}. No traditional showroom &mdash; instead we run a "factory-quality install at your address" model. The site visit + 3D digital walk-through replaces the showroom.` },
      { q: `Which ${city.name} localities have you installed in?`,
        a: `${city.landmarks.slice(0, 4).join(', ')} are our top-5 by volume. We serve all ${city.name} pincodes (${city.pinPattern}) and adjacent towns like ${city.nearbyTowns.slice(0, 2).join(', ')}.` },
      { q: `Can I see a ${city.name} reference project before booking?`,
        a: `Yes &mdash; for orders &gt; ₹15 L we coordinate a reference-site visit with a recent ${city.name} customer (subject to their consent). Send your interest via the form above.` },
      { q: `What payment terms do you offer in ${city.name}?`,
        a: `20% token to start production, 70% before dispatch, 10% on snag-free handover. We accept NEFT/RTGS, UPI (up to ₹2 L), all debit/credit cards, and EMI via NoBroker / Razorpay (3–24 months, 0–14% APR depending on bank).` }
    ],
    internalLinks: [
      { href: prod.hub, title: `${prod.pluralTitle} hub`, desc: 'Browse all variants, finishes, sizes' },
      { href: '/policies/gst-transport-policy', title: 'GST &amp; transport policy', desc: 'Free transport rules explained' },
      { href: '/policies/warranty-policy', title: 'Warranty policy', desc: '10-yr profile, 5-yr hardware' },
      { href: '/about/case-study-villa-hyderabad', title: 'Case study — Banjara villa', desc: 'A premium 5-BHK villa project' },
      { href: '/about/case-study-makobrew-jubilee-hills', title: 'Case study — Makobrew Cafe', desc: 'Jubilee Hills + Himayat Nagar' },
      { href: '/about/factory-tour-hyderabad', title: 'Factory tour', desc: factoryDesc }
    ]
  };
}

module.exports = makeCityPage;
