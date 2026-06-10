#!/usr/bin/env node
/**
 * Inject category FAQ + comparison tables from woodenmax_faq_comparison_all_categories.md
 * Does NOT modify title or meta description.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MARKER = '<!-- wm-faq-comparison-block -->';
const SCHEMA_MARKER = '<!-- wm-category-faq-schema -->';

const COMPARE_STYLE_ONLY = `
<style id="wm-compare-styles">
.wm-compare-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 1.5rem 0 2rem; border-radius: 10px; border: 1px solid #E2E8F0; }
.wm-compare-table { width: 100%; min-width: 640px; border-collapse: collapse; font-size: 0.92rem; }
.wm-compare-table thead th { background: #1E40AF; color: #fff; padding: 0.85rem 1rem; text-align: left; font-weight: 600; }
.wm-compare-table tbody td { padding: 0.75rem 1rem; border-bottom: 1px solid #E2E8F0; color: #334155; vertical-align: top; }
.wm-compare-table tbody tr:nth-child(even) td { background: #F8FAFC; }
.wm-compare-table tbody tr:nth-child(odd) td { background: #FFFFFF; }
.wm-compare-table tbody td:first-child { font-weight: 600; color: #0F172A; white-space: nowrap; }
</style>`;

const TOGGLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';
const GRILLS_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.3s;"><path d="m6 9 6 6 6-6"/></svg>';
const GLASS_SVG = '<svg class="faq-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function schemaText(s) {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function buildFaqHtml(faqs, format) {
  if (format === 'grills') {
    return faqs.map(({ q, a }) => `
      <div class="grills-faq-item" style="border: 1px solid #E5E7EB; border-radius: 12px; margin-bottom: 0.75rem; overflow: hidden;">
        <div class="grills-faq-question" onclick="toggleFaq(this)" style="padding: 1.25rem 1.5rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; font-weight: 600; color: #0F172A;">
          ${esc(q)}
          ${GRILLS_SVG}
        </div>
        <div class="grills-faq-answer" style="padding: 0 1.5rem; max-height: 0; overflow: hidden; transition: all 0.3s;">
          <p style="color: #475569; line-height: 1.7; padding-bottom: 1rem;">${esc(a)}</p>
        </div>
      </div>`).join('');
  }
  if (format === 'details') {
    return faqs.map(({ q, a }) => `
      <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n      ');
  }
  if (format === 'glass') {
    return faqs.map(({ q, a }) => `
        <div class="faq-item">
          <div class="faq-question" onclick="toggleFaq(this)">
            <h3>${esc(q)}</h3>
            ${GLASS_SVG}
          </div>
          <div class="faq-answer">
            <p>${esc(a)}</p>
          </div>
        </div>`).join('');
  }
  return faqs.map(({ q, a }) => `
        <div class="faq-item">
          <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            <span>${esc(q)}</span>
            <div class="faq-toggle">${TOGGLE_SVG}</div>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">${esc(a)}</div>
          </div>
        </div>`).join('');
}

function buildCompareInline(title, headers, rows) {
  const th = headers.map((h) => `<th>${esc(h)}</th>`).join('');
  const tr = rows.map((row) => {
    const tds = row.map((cell) => `<td>${esc(cell)}</td>`).join('');
    return `<tr>${tds}</tr>`;
  }).join('');
  return `
      <h3 style="font-size: 1.35rem; font-weight: 700; color: #0F172A; margin: 0 0 1rem; text-align: center;">${esc(title)}</h3>
      <div class="wm-compare-wrap">
        <table class="wm-compare-table">
          <thead><tr>${th}</tr></thead>
          <tbody>${tr}</tbody>
        </table>
      </div>`;
}

function stripOldBlock(html, beforeMarker) {
  html = html.replace(/<section class="faq-section" id="wm-category-faq"[\s\S]*?<\/section>\s*/gi, '');
  html = html.replace(/<section class="wm-compare-section"[\s\S]*?<\/section>\s*/gi, '');
  const start = html.indexOf(MARKER);
  if (start === -1) return html;
  const end = html.indexOf(beforeMarker, start);
  if (end === -1) {
    return html.replace(/<!-- wm-faq-comparison-block -->[\s\S]*?(?=<!-- FAQ|<section class="cluster-faq-section">)/i, '');
  }
  return html.slice(0, start) + html.slice(end);
}

function ensureCompareStyles(html) {
  if (html.includes('id="wm-compare-styles"')) return html;
  return html.replace(/<\/head>/i, COMPARE_STYLE_ONLY + '\n</head>');
}

function buildSchema(faqs) {
  const mainEntity = faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: schemaText(a) },
  }));
  return `${SCHEMA_MARKER}
<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity }, null, 2)}
</script>
`;
}

function mergeSchema(html, newFaqs) {
  const newEntities = newFaqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: schemaText(a) },
  }));

  if (html.includes(SCHEMA_MARKER)) {
    html = html.replace(
      /<!-- wm-category-faq-schema -->[\s\S]*?<\/script>\s*/i,
      ''
    );
  }

  const faqRe = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let merged = false;
  html = html.replace(faqRe, (full, json) => {
    if (merged) return full;
    try {
      const data = JSON.parse(json.trim());
      const items = Array.isArray(data) ? data : [data];
      const faq = items.find((x) => x && x['@type'] === 'FAQPage');
      if (!faq) return full;
      const existing = faq.mainEntity || [];
      const names = new Set(existing.map((e) => e.name));
      for (const ent of newEntities) {
        if (!names.has(ent.name)) existing.unshift(ent);
      }
      faq.mainEntity = existing;
      merged = true;
      const out = JSON.stringify(Array.isArray(data) ? items : items[0], null, 2)
        .split('\n').map((l) => '  ' + l).join('\n');
      return `<script type="application/ld+json">\n${out}\n  </script>`;
    } catch (e) {
      return full;
    }
  });

  if (!merged) {
    html = html.replace(/<\/head>/i, buildSchema(newFaqs) + '</head>');
  }
  return html;
}

function findAnchor(html, anchor) {
  let idx = html.indexOf(anchor);
  if (idx !== -1) return idx;
  idx = html.indexOf(anchor.replace(/\n/g, '\r\n'));
  return idx;
}

function repairBrokenFaqDiv(html) {
  return html.replace(
    /<div style="max-width: 100%; margin: 0 auto;?"?\s*\n\s*<h3 style="font-size: 1\.35rem/g,
    '<div style="max-width: 100%; margin: 0 auto;">\n      <h3 style="font-size: 1.35rem'
  );
}

function inject(fileRel, cfg) {
  const abs = path.join(ROOT, fileRel);
  let html = fs.readFileSync(abs, 'utf8');

  html = stripOldBlock(html, cfg.before);
  html = repairBrokenFaqDiv(html);
  html = ensureCompareStyles(html);

  const anchorIdx = findAnchor(html, cfg.mergeAnchor);
  if (anchorIdx === -1) {
    console.error('  ERROR merge anchor not found:', fileRel);
    return;
  }

  const firstQ = cfg.faqs[0].q;
  const afterAnchor = html.slice(anchorIdx + cfg.mergeAnchor.length, anchorIdx + cfg.mergeAnchor.length + 12000);

  if (!afterAnchor.includes(firstQ)) {
    const compare = buildCompareInline(cfg.tableTitle, cfg.tableHeaders, cfg.tableRows);
    const faqItems = buildFaqHtml(cfg.faqs, cfg.faqFormat);
    const insert = compare + faqItems;
    const pos = anchorIdx + cfg.mergeAnchor.length;
    html = html.slice(0, pos) + insert + html.slice(pos);
  }

  html = mergeSchema(html, cfg.faqs);
  fs.writeFileSync(abs, html, 'utf8');
  console.log('  + merged:', fileRel);
}

const CAT1_FAQS = [
  { q: 'What is the difference between aluminium sliding windows and uPVC windows?', a: 'Aluminium is about three times stronger, allows slimmer frames, and does not warp in Indian heat. uPVC offers slightly better insulation but can sag on large openings. Budget guide: 27mm Domal aluminium ₹550–950/sqft vs uPVC ₹700–1,100/sqft. For most Indian climates, aluminium is the better long-term choice.' },
  { q: 'What is the difference between 2-track and 3-track sliding windows?', a: '2-track = two glass panels, no mesh — maximum glass area and a clean look. 3-track = two glass panels plus one sliding mesh panel — ventilation with insect protection. We recommend 3-track for bedrooms and balconies; 2-track for large living-room windows.' },
  { q: 'What is the difference between 27mm Domal and 29mm premium series?', a: '27mm Domal: 1–1.2mm wall thickness, ₹550–950/sqft, max recommended height 6ft — ideal for standard homes. 29mm Premium: uniform 1.2mm wall thickness, slim interlock, ₹1,200–1,400/sqft, up to 80kg panel capacity — built for premium residences.' },
  { q: 'What is DGU glass and when should I choose it?', a: 'DGU (Double Glazed Unit) has a sealed air or argon gap between two panes. It can cut heat transfer by up to 40% and reduce noise by around 35dB. Best for AC rooms, road-facing windows, and premium villas. Extra cost: roughly ₹180–220/sqft. Choose DGU if your electricity bill is high or traffic noise is a problem.' },
  { q: 'How long do aluminium sliding windows last?', a: '6063-T6 aluminium frames typically last 20–25 years. Powder coating lasts 10–15 years. Imported rollers and hardware stay smooth for 8–10 years. Annual maintenance is limited to track cleaning and roller lubrication — no painting and no rust.' },
  { q: 'What is the maximum safe height for a sliding window?', a: 'For 27mm Domal, we recommend a maximum height of 6ft. You can go to 6–8ft, but some vibration may occur. The 29mm premium series stays stable up to 8ft. For openings above 8ft, choose a premium series or a system window.' },
  { q: 'Can mesh be added later, or should I order it upfront?', a: 'On a 3-track window, mesh is integrated — the track is built in from the start. Clip-on mesh can be added later but will not slide as smoothly. If you need mesh, specify it at order time.' },
  { q: 'How many powder-coating colours are available?', a: 'Standard colours — white, off-white, black, grey, and brown — are included. Wooden grain finishes (teak, rosewood, oak look) cost about ₹50/sqft extra. Custom RAL colours are available on imported profiles. Black and grey are the most popular choices in modern homes today.' },
];

const CAT1_TABLE = {
  tableTitle: 'Which Aluminium Sliding Window Is Right For You?',
  tableHeaders: ['Feature', '27mm Domal (3-track)', '29mm Premium (2-track)', 'System Window (30mm)'],
  tableRows: [
    ['Price', '₹550–950/sqft', '₹1,200–1,400/sqft', '₹1,180–2,680/sqft'],
    ['Wall Thickness', '1–1.2mm', '1.2mm (uniform)', '1.4–2.0mm'],
    ['Max Height', '6ft recommended', '8ft stable', '10ft+ possible'],
    ['Glass', '5mm–8mm', '6mm–DGU 20mm', 'DGU standard'],
    ['Hardware', 'Regular Indian', 'Imported premium', 'Certified imported'],
    ['Mesh', 'Optional', 'Optional', 'Custom'],
    ['Best For', 'Budget homes', 'Premium residential', 'Villas, commercial'],
    ['Warranty', '5 years', '10 years frame', '10+ years'],
  ],
};

const CAT2_FAQS = [
  { q: 'Should I choose an aluminium grill or an iron/MS grill?', a: 'Aluminium: 100% rust-proof, about 30% lighter, powder-coat finish lasts 15+ years. Price ₹350–495/sqft. Iron/MS: higher raw strength and ornamental options at ₹220–330/sqft, but repainting is needed every 2–3 years. Iron plus aluminium combinations are popular for ground-floor security.' },
  { q: 'Which profile size is best for window grills?', a: '12mm round: minimal modern look for standard windows. 19×19mm square: clean geometric style — our most popular choice. 25×25mm square: heavy-duty for ground-floor security. 12×38mm flat: contemporary flat-bar design. Price scales with profile size — from ₹385/sqft (12mm) to ₹495/sqft (25mm).' },
  { q: 'How long before powder coating starts to fade?', a: 'Premium Jotun or AkzoNobel powder coat, baked at 200°C, lasts 15+ years. Textured finishes resist scratches. Wooden grain finishes resist fading. In coastal areas, fading may happen slightly sooner — anodized finish works better there. We use only top-tier coating brands.' },
  { q: 'Can the window still open after a grill is installed?', a: 'Yes — inward openable grills with concealed bolt mounting are available. A special key opens them for window cleaning. Cost: about ₹50–80/sqft extra. Standard fixed grills are also available at a lower price.' },
  { q: 'Why add threaded iron rods to an aluminium grill?', a: '8mm or 10mm iron rods increase anti-cut strength by up to 3×. Without rods: roughly 80–100kg impact resistance. With a 10mm rod: 150kg+ impact resistance. Recommended for ground-floor windows and high-crime areas. Extra cost: ₹30–50/sqft.' },
  { q: 'What is the difference between a balcony grill and a window grill?', a: 'Window grill: lighter profiles (12–19mm), closer spacing, 1.2–1.5mm thickness. Balcony safety grill: thicker profiles (19–25mm), 1.5–2.0mm thickness, child-safe spacing (max 100mm gap), full-height design. Balcony grill ₹440–605/sqft vs window grill ₹350–495/sqft.' },
  { q: 'How long does custom sizing and design take?', a: 'Standard designs: 7–10 days delivery. Custom geometric patterns: 12–15 days. Ornamental iron grills: 15–20 days. Site measurement visit is free. Production is done at our Hyderabad workshop.' },
  { q: 'Does a grill affect window ventilation?', a: 'No — there is plenty of space between aluminium grill bars for airflow. Standard 2-inch gap designs allow 70%+ air passage. If you need a mosquito mesh, it can be fitted in a separate frame on the inside of the grill.' },
];

const CAT2_TABLE = {
  tableTitle: 'Grill Types — Price & Feature Comparison',
  tableHeaders: ['Feature', 'Aluminium Window Grill', 'Balcony Safety Grill', 'Iron Safety Grill', 'Staircase Balustrade'],
  tableRows: [
    ['Price', '₹350–495/sqft', '₹440–605/sqft', '₹220–330/sqft', '₹495–660/sqft'],
    ['Profile Size', '12–25mm', '19–25mm', '12–25mm', '25–50mm'],
    ['Thickness', '1.2–1.5mm', '1.5–2.0mm', '2.0–3.0mm', '2.0–3.0mm'],
    ['Rust Proof', '✅ 100%', '✅ 100%', '❌ Needs painting', '✅ 100%'],
    ['Maintenance', 'Zero', 'Zero', 'Every 2–3 years', 'Zero'],
    ['Child Safe', 'Standard', 'Yes (100mm gap)', 'Custom', 'Yes'],
    ['Best For', 'Standard windows', 'Balconies', 'Budget security', 'Staircases'],
    ['Warranty', '10 years', '10 years', '5 years', '10 years'],
  ],
};

const CAT3_FAQS = [
  { q: 'What is the difference between a folding door and a sliding door?', a: 'A sliding door gives a maximum of about 50% opening — one panel always blocks part of the opening. A folding/bifold door gives 90–95% opening — all panels stack to one side like an accordion. For balcony or garden connections, a folding door is clearly the better choice.' },
  { q: 'Should I choose bi-fold or fold-and-slide?', a: 'Bi-fold (50mm/52mm): 2–6 panels, ideal for balconies and patios, RAL colour options, ₹1,750–2,850/sqft. Fold & Slide (imported slim): 2 panels only, for entrance gates and showroom fronts, Matt Black/Gold/Rose Gold finish, ₹1,550–2,150/sqft. Large residential openings = bi-fold; entrance gates = fold & slide.' },
  { q: 'What do 2+1 and 3+1 configurations mean?', a: 'The number before "+" is the count of panels that fold and park to the side. The number after "+" is the main daily-use panel (used like a normal door). Example: in 3+1, the +1 panel handles daily entry; unfold the three panels when you need the full opening. This differs from telescopic doors — folding systems have no fixed panel.' },
  { q: 'Do folding doors let water in during monsoon?', a: 'No — weatherproof EPDM gasket sealing runs between every panel and around the frame. Bottom tracks include drainage channels to redirect water. The design has been tested for 10+ years in Indian monsoon conditions. A tight seal keeps even wind-driven rain out.' },
  { q: 'How secure are folding doors?', a: 'Bi-fold doors use toughened safety glass (which does not shatter easily) plus a mortice lock built into the frame. Multi-point locking engages at the top, middle, and bottom. For ground-floor installations, we recommend laminated safety glass for added cut resistance.' },
  { q: 'What is the maximum panel size?', a: 'Standard panel width: 600mm–900mm per panel. Maximum panel height: 3000mm (10ft). For very wide openings, use 4 or 6 panels. Enter your size in the calculator and it will suggest the exact panel configuration.' },
  { q: 'How many days does installation take?', a: 'Standard 4-panel balcony: 1 day. 6+ panels: 1.5–2 days. Pre-fabricated components arrive cut to your exact measurements — on-site work is mostly assembly and alignment. You can use the doors the same day installation completes.' },
  { q: 'Is a folding door suitable for a kitchen?', a: 'Need a smell partition for the kitchen? A telescopic door (3+1 or 4+1) is better — 50–70% opening with one fixed side panel. Need a full balcony connection? Bi-fold is better. Slim folding partitions between kitchen and dining are also popular — roughly ₹1,200–1,800/sqft.' },
];

const CAT3_TABLE = {
  tableTitle: 'Door Systems Comparison — Folding vs Sliding vs Telescopic',
  tableHeaders: ['Feature', 'Bifold Door', 'Fold & Slide', 'Telescopic Door', 'Sliding Door'],
  tableRows: [
    ['Max Opening', '95%', '90%', '50–75%', '50%'],
    ['Price', '₹1,750–2,850/sqft', '₹1,550–2,150/sqft', '₹1,200–2,000/sqft', '₹550–1,400/sqft'],
    ['Panels', '2,3,4,6', '2 only', '2+1, 3+1, 4+1', '2 track'],
    ['Best Use', 'Balcony, patio', 'Gate, showroom', 'Kitchen, partition', 'Bedroom, living'],
    ['Daily Use', '+1 leaf swing', 'Lead sliding', 'Fixed side panel', 'Any panel'],
    ['Glass Options', '6–12mm, DGU', '8–10mm, fluted', '6–12mm, DGU', '5–20mm'],
    ['Colors', 'All RAL', '4 premium', 'Standard', 'Standard'],
    ['Installation', '1–2 days', '1 day', '1 day', '1 day'],
  ],
};

const CAT4_FAQS = [
  { q: 'Which glass is best for a shower partition?', a: 'Use a minimum of 8mm toughened (tempered) glass — building codes require this. 10mm and 12mm feel thicker and more substantial. Frosted or etched glass adds privacy. Clear glass makes a small bathroom look larger. DGU is not needed for showers — single toughened glass is sufficient.' },
  { q: 'Should I choose frameless or semi-frameless shower enclosure?', a: 'Frameless: no aluminium frame, pure glass look, easy to clean, ₹800–1,200/sqft — premium feel. Semi-frameless: thin aluminium frame at top and bottom, ₹600–900/sqft, slightly more water-tight. Full-frame: traditional look, ₹400–700/sqft, most affordable. We recommend frameless for modern bathrooms.' },
  { q: 'How difficult is it to clean shower glass?', a: 'Anti-calcium coating on toughened glass reduces hard-water deposits (limescale) by up to 80%. Frameless designs have fewer corners where grime builds up. A weekly wipe with a cloth is usually enough. We use anti-fungal silicone sealant that lasts 5–7 years.' },
  { q: 'How soon can I use the shower after installation?', a: 'Silicone needs 24 hours to cure. We recommend waiting 24 hours before first use. Hardware (hinges, handles) can be used immediately after installation — only the silicone joints need time.' },
  { q: 'Which is better — walk-in shower or enclosed shower cabin?', a: 'Walk-in: open design, no door needed (L-shape or straight panel), minimum 900mm width, ₹700–1,100/sqft — easier to clean, modern look. Enclosed cabin: includes a door, better water containment, suited to smaller bathrooms, ₹900–1,400/sqft. Small bathroom = enclosed; large modern bathroom = walk-in.' },
  { q: 'What is PVD-coated hardware?', a: 'PVD (Physical Vapour Deposition) coating gives gold, rose gold, black, or chrome finishes that are rust-proof and scratch-resistant. Standard chrome plating peels in 2–3 years — PVD lasts 15+ years. Showers face daily water and soap exposure, so PVD hardware is a worthwhile investment. Extra cost: ₹3,000–8,000 per hardware set.' },
];

const CAT4_TABLE = {
  tableTitle: 'Shower Enclosure Types — Price & Feature Comparison',
  tableHeaders: ['Feature', 'Frameless', 'Semi-Frameless', 'Full Frame', 'Walk-in Panel'],
  tableRows: [
    ['Price', '₹800–1,200/sqft', '₹600–900/sqft', '₹400–700/sqft', '₹700–1,100/sqft'],
    ['Glass', '10–12mm', '8–10mm', '6–8mm', '8–12mm'],
    ['Look', 'Premium modern', 'Clean modern', 'Traditional', 'Open luxury'],
    ['Cleaning', 'Easiest', 'Easy', 'Medium', 'Easiest'],
    ['Water Containment', 'Good', 'Better', 'Best', 'Needs barrier'],
    ['Best For', 'Large bathrooms', 'Medium bathrooms', 'Budget', 'Master bath'],
    ['Door Type', 'Pivot/swing', 'Sliding/swing', 'Sliding', 'No door needed'],
    ['Hardware', 'PVD premium', 'SS304', 'Standard', 'Minimal'],
  ],
};

const CAT5_FAQS = [
  { q: 'What is the difference between structural glazing and a curtain wall?', a: 'Structural glazing: glass is bonded directly to the aluminium frame with structural silicone — the frame is not visible from outside. Seamless glass appearance. Curtain wall: glass panels fit into an aluminium grid system — a thin visible grid pattern remains. Curtain walls are common on commercial buildings; luxury villas often prefer structural glazing.' },
  { q: 'Should I choose reflector glass or clear glass for an elevation?', a: 'Reflector (tinted): building looks mirror-like from outside, adds privacy, reflects 30–40% of heat, ₹900–1,200/sqft. Clear: maximum light inside, transparent look, ₹800–1,000/sqft. DGU (double glazed): best insulation and quietest option, ₹1,100–1,500/sqft. North/east facing = clear glass; south/west facing = reflector or DGU.' },
  { q: 'Do glass elevations leak?', a: 'Structural silicone sealant plus EPDM gaskets provide double protection. Proper drainage channels are included in the design. Annual inspection and silicone resealing (every 10–15 years) prevent leakage issues. With correct installation, the system stays watertight even in wind-driven rain.' },
  { q: 'What does glass elevation maintenance cost?', a: 'Cleaning: professional glass cleaning ₹5–15/sqft quarterly. Silicone resealing: ₹50–100/sqft once every 10–15 years. Hardware lubrication: annual, negligible cost. Overall: no traditional paint or waterproofing expenses over 20+ years.' },
  { q: 'What about wind load and earthquake resistance?', a: '6mm toughened glass meets IS 875 standards for most of India. High-rise or coastal areas: we recommend DGU or laminated glass. Spider glazing (point-fixed) uses stainless steel fittings that can flex during seismic activity. Structural engineer consultation is essential for projects above the 3rd floor.' },
];

const CAT5_TABLE = {
  tableTitle: 'Glass Elevation Systems — Price & Feature Comparison',
  tableHeaders: ['Feature', 'Structural Glazing', 'Curtain Wall', 'Spider Glazing', 'ACP Cladding'],
  tableRows: [
    ['Price', '₹800–1,200/sqft', '₹900–1,400/sqft', '₹1,200–2,000/sqft', '₹300–700/sqft'],
    ['Frame Visibility', 'None (hidden)', 'Thin grid visible', 'Point fittings only', 'None'],
    ['Glass', '6–12mm toughened', '6–12mm toughened', '8–12mm', 'N/A'],
    ['Best For', 'Villas, luxury', 'Commercial buildings', 'Feature walls', 'Budget facades'],
    ['Insulation', 'Good', 'Good', 'Moderate', 'Moderate'],
    ['Maintenance', 'Low', 'Low', 'Low', 'Very low'],
    ['Lifespan', '25+ years', '25+ years', '20+ years', '15–20 years'],
  ],
};

const pages = [
  {
    file: 'products/aluminium-windows/3-track-sliding-window.html',
    before: '<!-- FAQ SECTION -->',
    mergeAnchor: '      <h2 class="section-title" style="text-align: center; margin-bottom: 2rem; color: #0F172A;">Frequently Asked Questions</h2>\n      <div style="max-width: 100%; margin: 0 auto;">',
    faqFormat: 'standard',
    faqs: CAT1_FAQS,
    ...CAT1_TABLE,
  },
  {
    file: 'products/grills/aluminium-window-grills.html',
    before: '<!-- FAQ -->',
    mergeAnchor: '<h2 style="font-size: 1.75rem; font-weight: 700; color: #0F172A; margin-bottom: 1.5rem; text-align: center;">Frequently Asked Questions</h2>',
    faqFormat: 'grills',
    faqs: CAT2_FAQS,
    ...CAT2_TABLE,
  },
  {
    file: 'products/folding-systems.html',
    before: '<!-- FAQ SECTION -->',
    mergeAnchor: '        <h2 style="color: #0F172A; font-size: 2rem;">Folding Doors FAQ</h2>\n      </div>\n      \n      <div style="max-width: 100%; margin: 0 auto;">',
    faqFormat: 'standard',
    faqs: CAT3_FAQS,
    ...CAT3_TABLE,
  },
  {
    file: 'products/shower-partitions.html',
    before: '<section class="cluster-faq-section">',
    mergeAnchor: '<div class="cluster-faq">',
    faqFormat: 'details',
    faqs: CAT4_FAQS,
    ...CAT4_TABLE,
  },
  {
    file: 'products/glass-elevation.html',
    before: '<!-- FAQ SECTION -->',
    mergeAnchor: '        <p style="color: #475569; max-width: 600px; margin: 1rem auto 0;">Everything you need to know about glass elevation, curtain wall, and structural glazing systems.</p>\n      </div>\n      \n      <div style="max-width: 100%; margin: 0 auto;">',
    faqFormat: 'glass',
    faqs: CAT5_FAQS,
    ...CAT5_TABLE,
  },
];

console.log('Merging FAQ into existing sections…');
for (const p of pages) {
  inject(p.file, p);
}
console.log('Done.');
