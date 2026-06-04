/**
 * Apply refined title + meta description to all aluminium window pages.
 * Replaces "instant quote" with estimate/pricing language in descriptions.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const PAGES = [
  {
    file: 'products/aluminium-windows.html',
    title: 'Aluminium Window Price ₹550–2250/sqft | 30 Designs (2026)',
    desc: '30 aluminium window designs & guides from ₹550–2250/sqft. Sliding, casement, French, slim & system. Live Calculator on every page.'
  },
  {
    file: 'products/aluminium-windows/2-track-aluminium-window-price.html',
    title: '2 Track Window ₹1200–1400/sqft (2026) | WoodenMax',
    desc: '2 track aluminium sliding window 2026 — ₹1200–1400/sqft. Live calculator, glass & hardware breakdown. Compare tracks & get a live estimate.'
  },
  {
    file: 'products/aluminium-windows/2-track-french-sliding-door.html',
    title: '2 Track Sliding Door ₹1850–2250/sqft (2026) | WoodenMax',
    desc: '2 track aluminium sliding door 2026 — ₹1850–2250/sqft. Glass arch panel, imported hardware, 10-year warranty. Live price calculator.'
  },
  {
    file: 'products/aluminium-windows/3-track-sliding-window.html',
    title: '3 Track Sliding Window ₹550–950/sqft (2026) | WoodenMax',
    desc: '3 track aluminium sliding window with mesh 2026 — ₹550–950/sqft, 27mm Domal series. Live price calculator for live estimates.'
  },
  {
    file: 'products/aluminium-windows/4-track-sliding-window-price.html',
    title: '4 Track Window Price ₹650–1200/sqft (2026) | WoodenMax',
    desc: '4 track aluminium sliding window 2026 — ₹650–1200/sqft. Multi-panel sliding, mesh options, live calculator. Upgrade to premium 29mm.'
  },
  {
    file: 'products/aluminium-windows/aluminium-casement-window-price.html',
    title: 'Casement Window Price ₹750–1050/sqft (2026) | WoodenMax',
    desc: 'Aluminium casement window 2026 — ₹750–1050/sqft. Outward opening, mesh & multipoint options. Live calculator, cost breakdown & sliding comparison.'
  },
  {
    file: 'products/aluminium-windows/aluminium-sliding-window-price-calculator.html',
    title: 'Aluminium Window Calculator (2026) | WoodenMax',
    desc: 'Aluminium window price calculator — enter size, glass & coating for ₹/sqft estimate. Live Calculator on every window page. Site visit for final approval.'
  },
  {
    file: 'products/aluminium-windows/aluminium-sliding-window.html',
    title: 'Aluminium Sliding Window ₹1200–1400/sqft (2026) | WoodenMax',
    desc: 'Premium 29mm 2-track aluminium sliding window 2026 — ₹1200–1400/sqft, mesh & DGU options, imported hardware. Live sqft calculator & pricing tool.'
  },
  {
    file: 'products/aluminium-windows/aluminium-system-window-brands-india.html',
    title: 'System Window Brands India ₹1250–2950/sqft (2026)',
    desc: 'Top aluminium system window brands India 2026 — architect-grade specs, price bands ₹1250–2950/sqft. Hardware comparison & premium project estimate.'
  },
  {
    file: 'products/aluminium-windows/aluminium-system-window-price.html',
    title: 'System Window Price ₹1180–2680/sqft (2026) | WoodenMax',
    desc: 'Aluminium system window price 2026 — brand profiles, DGU options, ₹1180–2680/sqft. Live calculator + expert estimate for premium facades.'
  },
  {
    file: 'products/aluminium-windows/aluminium-window-glass-price-breakdown.html',
    title: 'Window Glass Price Breakdown (2026) | DGU, Toughened',
    desc: 'How toughened, DGU & laminated glass change aluminium window cost — 2026 ₹/sqft breakdown with live calculator for total window price.'
  },
  {
    file: 'products/aluminium-windows/aluminium-window-price-bangalore.html',
    title: 'Aluminium Window Price Bengaluru (2026) ₹550–2250/sqft',
    desc: 'Live aluminium window price in Bengaluru 2026 — ₹550–2250/sqft. Calculator, finishes & install timelines. Site visit + transport.'
  },
  {
    file: 'products/aluminium-windows/aluminium-window-price-chandigarh.html',
    title: 'Aluminium Window Price Chandigarh (2026) ₹550–2250/sqft',
    desc: 'Live aluminium window price in Chandigarh 2026 — ₹550–2250/sqft. Calculator, finishes & install timelines. Site visit, transparent pricing.'
  },
  {
    file: 'products/aluminium-windows/aluminium-window-price-delhi.html',
    title: 'Aluminium Window Price Delhi NCR (2026) ₹550–2250/sqft',
    desc: 'Live aluminium window price in Delhi NCR 2026 — ₹550–2250/sqft. Calculator, finishes & install timelines. Site visit.'
  },
  {
    file: 'products/aluminium-windows/aluminium-window-price-hyderabad.html',
    title: 'Aluminium Window Price Hyderabad (2026) ₹550–2250/sqft',
    desc: 'Aluminium window price Hyderabad 2026 — Domal sliding ₹550–950/sqft, premium 29mm ₹1200–2250/sqft. Live calculator for live estimates.'
  },
  {
    file: 'products/aluminium-windows/aluminium-window-price-mumbai.html',
    title: 'Aluminium Window Price Mumbai (2026) ₹550–2250/sqft',
    desc: 'Live aluminium window price in Mumbai 2026 — ₹550–2250/sqft. Calculator, finishes, install timelines. Site visit + transport ≥ ₹15L.'
  },
  {
    file: 'products/aluminium-windows/aluminium-window-price-per-sqft.html',
    title: 'Aluminium Window Price Per Sqft (2026) | WoodenMax',
    desc: 'Aluminium window price per sqft India 2026 — sliding, casement & slim ranges. Comparison table + live calculator for live estimates.'
  },
  {
    file: 'products/aluminium-windows/aluminium-window-price-pune.html',
    title: 'Aluminium Window Price Pune (2026) ₹550–2250/sqft',
    desc: 'Live aluminium window price in Pune 2026 — ₹550–2250/sqft. Calculator, finishes, install timelines. Site visit + transport ≥ ₹15L.'
  },
  {
    file: 'products/aluminium-windows/aluminium-window-price-vijayawada.html',
    title: 'Aluminium Window Price Vijayawada (2026) ₹550–2250/sqft',
    desc: 'Live aluminium window price in Vijayawada 2026 — ₹550–2250/sqft. Calculator, finishes, site visit & transport on orders ≥ ₹15L.'
  },
  {
    file: 'products/aluminium-windows/aluminium-window-price-visakhapatnam.html',
    title: 'Aluminium Window Price Visakhapatnam (2026) ₹550–2250/sqft',
    desc: 'Live aluminium window price Visakhapatnam 2026 — ₹550–2250/sqft. Calculator, finishes, site visit & transport on orders ≥ ₹15L.'
  },
  {
    file: 'products/aluminium-windows/aluminium-window-price-warangal.html',
    title: 'Aluminium Window Price Warangal (2026) ₹550–2250/sqft',
    desc: 'Live aluminium window price Warangal 2026 — ₹550–2250/sqft. Calculator, finishes, site visit & transparent transport pricing.'
  },
  {
    file: 'products/aluminium-windows/best-aluminium-window-for-home.html',
    title: 'Best Aluminium Window for Home (2026) | WoodenMax',
    desc: 'Best aluminium window for Indian homes 2026 — room-by-room picks, price bands ₹550–2250/sqft. Live calculator to budget your upgrade.'
  },
  {
    file: 'products/aluminium-windows/french-door-georgian-bar.html',
    title: 'Aluminium French Door ₹1850–2250/sqft (2026) | WoodenMax',
    desc: 'Aluminium French door for balcony & entrance 2026 — ₹1850–2250/sqft, slim profile, toughened glass, Georgian bar styling. Live calculator.'
  },
  {
    file: 'products/aluminium-windows/full-elevation-villa-facade.html',
    title: 'Villa Facade Aluminium Window ₹700+/sqft (2026) | WoodenMax',
    desc: 'Full elevation aluminium window for villa & office 2026 — from ₹700/sqft. Fixed glass partitions, balcony coverage. Live price calculator.'
  },
  {
    file: 'products/aluminium-windows/georgian-grill-casement-door.html',
    title: 'Aluminium Casement Door ₹1350–1850/sqft (2026) | WoodenMax',
    desc: 'Aluminium casement door for balcony & entrance 2026 — ₹1350–1850/sqft, 40mm profile, multipoint lock, Georgian grill option. Live calculator.'
  },
  {
    file: 'products/aluminium-windows/sliding-vs-casement-window.html',
    title: 'Sliding vs Casement Window (2026) — Which is Better?',
    desc: 'Sliding vs casement window 2026 — cost, ventilation, noise comparison for Indian homes. Live sliding calculator + casement tool links.'
  },
  {
    file: 'products/aluminium-windows/slim-aluminium-window-price-luxury.html',
    title: 'Slim Aluminium Window ₹900–1500/sqft (2026) | WoodenMax',
    desc: 'Slim aluminium window for luxury homes 2026 — ₹900–1500/sqft, minimal sightlines, premium coatings. Calculator-based estimate & cost breakdown.'
  },
  {
    file: 'products/aluminium-windows/slim-entrance-glass-door.html',
    title: 'Slim Entrance Glass Door ₹1350–1850/sqft (2026) | WoodenMax',
    desc: 'Slim entrance glass door 2026 — ₹1350–1850/sqft, 40mm ultra-thin profile, 8mm toughened glass. Live calculator for live price estimates.'
  },
  {
    file: 'products/aluminium-windows/slim-system-window-price.html',
    title: 'Slim System Window Price ₹1350–3000/sqft (2026) | WoodenMax',
    desc: 'Slim system window 2026 — ₹1350–3000/sqft for luxury villas. Minimal sightlines, premium casement calculator. Compare vs standard 29mm.'
  },
  {
    file: 'products/aluminium-windows/slimline-aluminium-window.html',
    title: 'Slimline Aluminium Window ₹900–1400/sqft (2026) | WoodenMax',
    desc: 'Slimline aluminium window 2026 — ₹900–1400/sqft, black powder coating, Hindalco profiles, Saint-Gobain glass. Live Calculator on page.'
  },
  {
    file: 'products/aluminium-windows/system-casement-window-price.html',
    title: 'System Casement Window ₹1280–2920/sqft (2026) | WoodenMax',
    desc: 'Aluminium system casement window 2026 — ₹1280–2920/sqft. Multipoint, hinges & wind load specs. Live premium casement calculator for facades.'
  },
  {
    file: 'products/aluminium-windows/system-sliding-window-price.html',
    title: 'System Sliding Window ₹1200–2780/sqft (2026) | WoodenMax',
    desc: 'System sliding window 2026 — ₹1200–2780/sqft, large openings, 29mm track hardware. Live calculator & estimate path for premium projects.'
  },
  {
    file: 'products/aluminium-windows/system-window-for-villa.html',
    title: 'System Window for Villa ₹1300–3000/sqft (2026) | WoodenMax',
    desc: 'Best system window for villa 2026 — ₹1300–3000/sqft, full elevation strategy, large glass panels. Premium casement calculator + estimate.'
  },
  {
    file: 'products/aluminium-windows/system-window-glass-options.html',
    title: 'System Window Glass Options (2026) | ₹1190–2880/sqft',
    desc: 'System window glass 2026 — DGU, triple IGU, laminated & safety options. Price impact breakdown + 29mm sliding calculator for realistic estimates.'
  },
  {
    file: 'products/aluminium-windows/system-window-installation.html',
    title: 'System Window Installation Cost (2026) | WoodenMax',
    desc: 'Aluminium system window installation 2026 — fixing, waterproofing, alignment & cost drivers. 29mm calculator to estimate before site mobilisation.'
  },
  {
    file: 'products/aluminium-windows/system-window-vs-normal-window.html',
    title: 'System Window vs Normal Window (2026) | WoodenMax',
    desc: 'System window vs normal aluminium 2026 — engineering, water rating & ₹/sqft comparison. Live calculator + India cost guide for architects & owners.'
  },
  {
    file: 'products/aluminium-windows/top-hung-casement-window.html',
    title: 'Top Hung Casement Window ₹750–1050/sqft (2026) | WoodenMax',
    desc: 'Top hung casement window 2026 — ₹750–1050/sqft, 40mm outward opening, multipoint lock, mesh option. Live calculator for live estimates.'
  },
  {
    file: 'products/aluminium-windows/what-is-aluminium-system-window.html',
    title: 'What is Aluminium System Window? (2026) | WoodenMax',
    desc: 'What is an aluminium system window 2026 — profiles, gaskets, hardware, tested performance vs ad-hoc. Price ₹1220–2850/sqft + live calculator.'
  }
];

function escAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function patchHtml(html, title, desc) {
  const t = escAttr(title);
  const d = escAttr(desc);

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);

  if (/<meta\s+name=["']description["']/i.test(html)) {
    html = html.replace(
      /<meta\s+name=["']description["']\s+content=["'][^"']*["']/i,
      `<meta name="description" content="${d}"`
    );
  } else {
    html = html.replace(/<\/title>/i, `</title>\n  <meta name="description" content="${d}" />`);
  }

  if (/<meta\s+property=["']og:title["']/i.test(html)) {
    html = html.replace(/<meta\s+property=["']og:title["']\s+content=["'][^"']*["']/i, `<meta property="og:title" content="${t}"`);
  }
  if (/<meta\s+property=["']og:description["']/i.test(html)) {
    html = html.replace(/<meta\s+property=["']og:description["']\s+content=["'][^"']*["']/i, `<meta property="og:description" content="${d}"`);
  }
  if (/<meta\s+name=["']twitter:title["']/i.test(html)) {
    html = html.replace(/<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']/i, `<meta name="twitter:title" content="${t}"`);
  }
  if (/<meta\s+name=["']twitter:description["']/i.test(html)) {
    html = html.replace(/<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']/i, `<meta name="twitter:description" content="${d}"`);
  }

  // JSON-LD headline/name for Product/WebPage — first description field in Product block only (careful)
  html = html.replace(
    /"headline":"[^"]*"/,
    `"headline":"${title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  );
  html = html.replace(
    /"name":"Aluminium Window Price in [^"]*"/,
    `"name":"${title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  );

  // Replace template text and old boilerplate in JSON descriptions (hyderabad + system pages)
  const descPlain = desc.replace(/&amp;/g, '&');
  html = html.replace(/Template you can copy for other cities/g, descPlain.slice(0, 80));
  html = html.replace(
    /Certified system window packages in India for this topic are often planned between[^"]*/g,
    descPlain.replace(/"/g, '\\"')
  );

  // Fix duplicate description in Product schema — replace first Product description after type Product
  html = html.replace(
    /("@type":"Product"[^}]*?"description":")([^"]*)(")/,
    (m, a, _old, c) => a + descPlain.replace(/"/g, '\\"') + c
  );

  // Cluster hero lead paragraph on hyderabad if still has template
  html = html.replace(
    /<p[^>]*>Aluminium window price in Hyderabad[^<]*Template you can copy[^<]*<\/p>/i,
    `<p class="hero-lead" style="color:#475569;max-width:820px;line-height:1.7;">${descPlain}</p>`
  );

  return html;
}

let ok = 0;
for (const p of PAGES) {
  const abs = path.join(ROOT, p.file);
  if (!fs.existsSync(abs)) {
    console.warn('MISSING', p.file);
    continue;
  }
  const html = patchHtml(fs.readFileSync(abs, 'utf8'), p.title, p.desc);
  fs.writeFileSync(abs, html);
  ok++;
  console.log('✓', p.file);
}
console.log('\nUpdated', ok, 'pages');
