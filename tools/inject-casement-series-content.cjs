/**
 * Casement / Openable Series Content Pack (pages 1–7).
 * Run: node tools/inject-casement-series-content.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const COMPARE_STYLE = `<style id="wm-casement-guide-styles">
.wm-casement-guide .wm-compare-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 1.5rem 0; border-radius: 10px; border: 1px solid #E2E8F0; }
.wm-casement-guide .wm-compare-table { width: 100%; min-width: 640px; border-collapse: collapse; font-size: 0.92rem; }
.wm-casement-guide .wm-compare-table thead th { background: #1E40AF; color: #fff; padding: 0.85rem 1rem; text-align: left; font-weight: 600; }
.wm-casement-guide .wm-compare-table tbody td { padding: 0.75rem 1rem; border-bottom: 1px solid #E2E8F0; color: #334155; vertical-align: top; }
.wm-casement-guide .wm-compare-table tbody tr:nth-child(even) td { background: #F8FAFC; }
.wm-casement-guide .wm-compare-table tbody td:first-child { font-weight: 600; color: #0F172A; white-space: nowrap; }
.wm-casement-guide p, .wm-casement-guide li { color: #475569; line-height: 1.75; }
.wm-casement-guide h2.section-title, .wm-casement-guide h3 { color: #0F172A; }
.wm-casement-guide a { color: #1E40AF; font-weight: 500; }
</style>`;

function wrapSection(heading, body) {
  return `
  <!-- CASEMENT SERIES GUIDE -->
  <section class="wm-series-guide wm-casement-guide" style="padding: 4rem 0; background: #F8FAFC;">
    ${COMPARE_STYLE}
    <div class="container" style="max-width: 900px; margin: 0 auto; padding: 0 1rem;">
      <h2 class="section-title" style="margin-bottom: 1.25rem;">${heading}</h2>
      ${body}
    </div>
  </section>

`;
}

function faqSchemaBlock(faqs) {
  return faqs.map(function (f) {
    return `      {
        "@type": "Question",
        "name": ${JSON.stringify(f.q)},
        "acceptedAnswer": {
          "@type": "Answer",
          "text": ${JSON.stringify(f.a)}
        }
      }`;
  }).join(',\n');
}

function visibleFaqCard(q, a) {
  return `<div style="margin-bottom:1.25rem;padding:1rem 1.25rem;border:1px solid #e2e8f0;border-radius:10px;">
        <h3 style="margin:0 0 0.5rem;font-size:1.05rem;color:#1e3a8a;">${q}</h3>
        <p style="margin:0;color:#334155;line-height:1.7;">${a}</p>
      </div>`;
}

function visibleFaqAccordion(q, a) {
  return `        <div class="faq-item">
          <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            <span>${q}</span>
            <div class="faq-toggle">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">${a}</div>
          </div>
        </div>`;
}

function injectFaqSchema(html, faqs, schemaIndex) {
  const marker = '"@type": "FAQPage"';
  let idx = -1;
  let found = 0;
  let pos = 0;
  while (found <= schemaIndex) {
    idx = html.indexOf(marker, pos);
    if (idx === -1) return html;
    found++;
    pos = idx + marker.length;
  }
  const closePatterns = ['    ]\r\n  }\r\n  </script>', '    ]\n  }\n  </script>'];
  let close = -1;
  for (let i = 0; i < closePatterns.length; i++) {
    close = html.indexOf(closePatterns[i], idx);
    if (close !== -1) break;
  }
  if (close === -1) return html;
  const insert = ',\n' + faqSchemaBlock(faqs) + '\n';
  return html.slice(0, close) + insert + html.slice(close);
}

function replaceWithMarker(html, marker, insert) {
  if (html.includes(marker)) {
    return html.replace(marker, insert + marker);
  }
  const crlf = marker.replace(/\n/g, '\r\n');
  if (html.includes(crlf)) {
    return html.replace(crlf, insert + crlf);
  }
  return html;
}

function applyPage(cfg) {
  const filePath = path.join(ROOT, cfg.file);
  if (!fs.existsSync(filePath)) {
    console.error('MISSING:', cfg.file);
    return;
  }
  let html = fs.readFileSync(filePath, 'utf8');
  const hasSection = html.includes(cfg.check);
  if (!hasSection) {
    if (!html.includes(cfg.marker)) {
      console.error('MARKER NOT FOUND:', cfg.file);
      return;
    }
    html = replaceWithMarker(html, cfg.marker, cfg.section);
  }
  if (cfg.faqs && cfg.faqs.length && !html.includes('"name": ' + JSON.stringify(cfg.faqs[0].q))) {
    html = injectFaqSchema(html, cfg.faqs, cfg.schemaIndex || 0);
  }
  if (cfg.visibleBefore && cfg.visibleHtml) {
    const visCheck = cfg.visibleCheck || cfg.faqs[0].q;
    if (!html.includes(visCheck)) {
      html = replaceWithMarker(html, cfg.visibleBefore, cfg.visibleHtml);
    }
  }
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(hasSection ? 'FAQ/schema updated:' : 'OK:', path.basename(cfg.file));
}

const pages = [
  {
    file: 'products/aluminium-windows/aluminium-casement-window-price.html',
    check: 'Casement &amp; Openable Series Guide — 40mm to 72mm',
    marker: '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
    schemaIndex: 0,
    section: wrapSection('Casement &amp; Openable Series Guide — 40mm to 72mm', `
      <p>Casement (openable) systems have fewer profile series than sliding — but each one is engineered for a specific job. The full range: <strong>40, 45, 50, 52, 65 and 72mm</strong>. Top hung, side swing, uplift doors and style doors are all built from this same section family, and so are entrance doors and French doors.</p>
      <div class="wm-compare-wrap">
        <table class="wm-compare-table">
          <thead><tr><th>Series</th><th>Max Height</th><th>Max Width/Shutter</th><th>Glass</th><th>Best For</th><th>Honest Limitation</th></tr></thead>
          <tbody>
            <tr><td>40–45mm</td><td>6–7 ft</td><td>3 ft</td><td>DGU up to 22mm</td><td>Flats, apartments, builder projects</td><td>Lightweight, low depth — keep shutters small</td></tr>
            <tr><td>50–52mm</td><td>10 ft</td><td>Standard door widths</td><td>DGU up to 38mm</td><td>Premium homes, entrance doors</td><td>Higher cost</td></tr>
            <tr><td>65–72mm</td><td>12 ft</td><td>3.5–4 ft</td><td>Single 5–12mm / laminated up to 13.52mm only — <strong>no DGU</strong></td><td>Offices, safety doors, automatic access</td><td>DGU not possible</td></tr>
          </tbody>
        </table>
      </div>
      <h3 style="margin:1.5rem 0 0.75rem;font-size:1.15rem;">Why choose casement over sliding at all?</h3>
      <ul>
        <li><strong>Maximum opening space</strong> — the full frame opens, not just half. Perfect where the window itself is small: bathrooms, kitchens, staircase windows.</li>
        <li><strong>Better sealing</strong> — the shutter presses shut against EPDM gaskets, controlling dust and sound to the maximum level.</li>
        <li><strong>Better security</strong> — multi-point safety locks are far stronger than sliding latches, which is why entrance and French doors are built from this family.</li>
      </ul>
      <h3 style="margin:1.5rem 0 0.75rem;font-size:1.15rem;">Honest disadvantages:</h3>
      <ul>
        <li>The shutter needs clear swing space — inside or outside. In tight rooms or near furniture, a casement fights for space that sliding doesn't need.</li>
        <li>Shutter width is limited (3 ft in 40–45mm; 3.5–4 ft even in 65–72mm) — wide openings need multiple shutters or a sliding system instead.</li>
        <li>Hinges carry the full shutter weight every single open/close — quality hinges are non-negotiable, and heavy shutters on cheap hinges sag within a couple of years.</li>
      </ul>
      <p>Related: <a href="top-hung-casement-window">top hung casement</a> · <a href="system-casement-window-price">system casement</a> · <a href="slim-entrance-glass-door">slim entrance door</a> · <a href="sliding-vs-casement-window">sliding vs casement</a></p>`),
    faqs: [
      { q: 'Which casement window series is best for a normal flat?', a: '40–45mm. Builders and apartments use it widely — heights of 6–7 ft are easy, with DGU up to 22mm. Keep each shutter within 3 ft width, because this series is lightweight with low depth.' },
      { q: 'Can I use DGU glass in 65mm or 72mm casement doors?', a: 'No. The 65–72mm profiles take only single glass (5–12mm) or laminated glass up to 13.52mm. For DGU, choose the 50–52mm series, which accepts up to 38mm glass.' }
    ],
    visibleCheck: 'VISFAQ-CASEMENT-HUB-1',
    visibleBefore: '      <div style="margin-bottom:1.25rem;padding:1rem 1.25rem;border:1px solid #e2e8f0;border-radius:10px;">\n        <h3 style="margin:0 0 0.5rem;font-size:1.05rem;color:#1e3a8a;">What is aluminium casement window price per sqft?</h3>',
    visibleHtml: '<!-- VISFAQ-CASEMENT-HUB-1 -->\n' + visibleFaqCard('Which casement window series is best for a normal flat?', '40–45mm. Builders and apartments use it widely — heights of 6–7 ft are easy, with DGU up to 22mm. Keep each shutter within 3 ft width, because this series is lightweight with low depth.') + '\n' + visibleFaqCard('Can I use DGU glass in 65mm or 72mm casement doors?', 'No. The 65–72mm profiles take only single glass (5–12mm) or laminated glass up to 13.52mm. For DGU, choose the 50–52mm series, which accepts up to 38mm glass.') + '\n'
  },
  {
    file: 'products/aluminium-windows/top-hung-casement-window.html',
    check: 'Top Hung Windows — Small Spaces, Maximum Ventilation',
    marker: '  <!-- FAQ SECTION -->',
    schemaIndex: 0,
    section: wrapSection('Top Hung Windows — Small Spaces, Maximum Ventilation', `
      <p>A top hung window opens outward from the bottom, hinged at the top — built from the same 40–72mm casement section family. It is the specialist for places where regular windows simply don't fit:</p>
      <h3 style="margin:1.25rem 0 0.75rem;font-size:1.15rem;">Best for:</h3>
      <ul>
        <li><strong>Bathrooms</strong> — ventilation stays open even during rain (the angled glass sheds water outward), with privacy intact.</li>
        <li><strong>Kitchens</strong> — exhaust airflow above the platform without a shutter swinging into the work area.</li>
        <li><strong>Staircase windows</strong> — high, hard-to-reach openings where a top hung stays partially open safely.</li>
        <li>Anywhere you got <strong>minimum window space but need maximum opening</strong>.</li>
      </ul>
      <p><strong>Why it works so well:</strong> Like all casement-family systems, the shutter compresses shut against EPDM gaskets — dust and sound control is at the maximum level, far better than any sliding window of the same size.</p>
      <h3 style="margin:1.5rem 0 0.75rem;font-size:1.15rem;">Honest limitations:</h3>
      <ul>
        <li>Opening angle is limited — it ventilates brilliantly but is not an escape/access opening.</li>
        <li>The outward-opening shutter collects dust on top in dusty areas; easy to clean on low floors, harder on high ones.</li>
        <li>Series rules apply: 40–45mm shutters should stay compact (3 ft width); heavier glass needs the 50–52mm series.</li>
      </ul>
      <p>Related: <a href="aluminium-casement-window-price">casement series guide</a> · <a href="system-casement-window-price">system casement</a></p>`),
    faqs: [
      { q: 'Why is a top hung window best for bathrooms?', a: 'It stays open even during rain — the top-hinged angled glass sheds water outward while air keeps flowing — and the compression seal against EPDM gaskets keeps dust and sound control at maximum.' },
      { q: 'What size can a top hung window be?', a: 'It follows casement series rules — in 40–45mm keep shutters within 3 ft width and modest heights; for larger or heavier glass, use the 50–52mm series.' }
    ],
    visibleCheck: 'VISFAQ-TOP-HUNG-1',
    visibleBefore: '        <div class="faq-item">\n          <div class="faq-question" onclick="this.parentElement.classList.toggle(\'active\')">\n            <span>Can we use mosquito mesh in top hung casement windows?</span>',
    visibleHtml: '<!-- VISFAQ-TOP-HUNG-1 -->\n' + visibleFaqAccordion('Why is a top hung window best for bathrooms?', 'It stays open even during rain — the top-hinged angled glass sheds water outward while air keeps flowing — and the compression seal against EPDM gaskets keeps dust and sound control at maximum.') + '\n' + visibleFaqAccordion('What size can a top hung window be?', 'It follows casement series rules — in 40–45mm keep shutters within 3 ft width and modest heights; for larger or heavier glass, use the 50–52mm series.') + '\n'
  },
  {
    file: 'products/aluminium-windows/system-casement-window-price.html',
    check: 'System Casement — The Hardware Ecosystem Difference',
    marker: '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
    schemaIndex: 0,
    section: wrapSection('System Casement — The Hardware Ecosystem Difference', `
      <p>What makes a casement "system" grade is the hardware ecosystem around the profile — and in this family it is exceptionally complete: <strong>joint connectors, multi-point locks, EPDM seals and gaskets</strong>, all engineered together. The result: these windows and doors control <strong>dust and sound to the maximum level</strong> — better than any other window type at the same size.</p>
      <h3 style="margin:1.25rem 0 0.75rem;font-size:1.15rem;">Series in system casement:</h3>
      <ul>
        <li><strong>40–45mm</strong> — the builder favourite for flats and apartments. Heights of 6–7 ft easily, shutter width max 3 ft (lightweight, shallow depth, economical). DGU up to 22mm.</li>
        <li><strong>50–52mm</strong> — the premium-home series. Excellent depth, a perfect lock + soundproofing ecosystem, door heights up to 10 ft, DGU up to an exceptional <strong>38mm</strong>. Costs more — and earns it.</li>
        <li><strong>65–72mm</strong> — the heavy-duty range. Offices and safety doors love it: heights up to 12 ft, widths 3.5–4 ft, exceptional lock systems, and the large profile easily accepts <strong>automatic access hardware</strong>. Hinges can be seriously strong here — brass, butterfly, and bearing-type hinges. Glass: single 5–12mm or laminated up to 13.52mm only (no DGU).</li>
      </ul>
      <p><strong>Honest limitation:</strong> Swing space is always needed, and shutter widths are physically limited by hinge load — for wide glass walls, sliding systems remain the right tool.</p>
      <p>Related: <a href="aluminium-casement-window-price">casement series guide</a> · <a href="slim-entrance-glass-door">slim entrance door</a> · <a href="system-sliding-window-price">system sliding</a></p>`),
    faqs: [
      { q: 'Which casement series takes the thickest DGU glass?', a: '50–52mm — up to 38mm DGU, the highest in the casement range. 40–45mm takes up to 22mm; 65–72mm takes no DGU (single 5–12mm or laminated up to 13.52mm).' },
      { q: 'Which series is best for office and safety doors?', a: '65–72mm. Heights up to 12 ft, widths 3.5–4 ft, exceptional locks, strong bearing-type/brass/butterfly hinges, and the large profile easily fits automatic access hardware.' }
    ],
    visibleCheck: 'VISFAQ-SYSTEM-CASEMENT-1',
    visibleBefore: '      <div style="margin-bottom:1.25rem;padding:1rem 1.25rem;border:1px solid #e2e8f0;border-radius:10px;">\n        <h3 style="margin:0 0 0.5rem;font-size:1.05rem;color:#1e3a8a;">What is a fair system casement price per sqft in 2026?</h3>',
    visibleHtml: '<!-- VISFAQ-SYSTEM-CASEMENT-1 -->\n' + visibleFaqCard('Which casement series takes the thickest DGU glass?', '50–52mm — up to 38mm DGU, the highest in the casement range. 40–45mm takes up to 22mm; 65–72mm takes no DGU (single 5–12mm or laminated up to 13.52mm).') + '\n' + visibleFaqCard('Which series is best for office and safety doors?', '65–72mm. Heights up to 12 ft, widths 3.5–4 ft, exceptional locks, strong bearing-type/brass/butterfly hinges, and the large profile easily fits automatic access hardware.') + '\n'
  },
  {
    file: 'products/aluminium-windows/french-door-georgian-bar.html',
    check: 'French Doors &amp; Georgian Bars — Where Luxury Lives',
    marker: '  <!-- FAQ SECTION -->',
    schemaIndex: 0,
    section: wrapSection('French Doors &amp; Georgian Bars — Where Luxury Lives', `
      <p><strong>French doors</strong> are built from the casement section family (40–72mm) — and that is exactly why they outperform ordinary doors: the casement family's multi-point <strong>safety locks</strong> and compression-sealed <strong>soundproofing</strong> come built in. For entrances and balconies, that means a door that locks like a vault and seals like a window.</p>
      <h3 style="margin:1.25rem 0 0.75rem;font-size:1.15rem;">Georgian bars — the honest truth:</h3>
      <p>Functionally, Georgian bars do almost nothing. We'll say it plainly. But two things happen when they go on:</p>
      <ol>
        <li>The space instantly gets that <strong>classic luxury feel</strong> — which is why they live on entrance doors, kitchens and balcony doors of premium homes.</li>
        <li>They genuinely <strong>strengthen the glass</strong> by dividing and supporting the pane.</li>
      </ol>
      <p><strong>Cost:</strong> approximately <strong>₹3,000–15,000 per door</strong>, depending on design and complication. Simple grids sit at the lower end; intricate patterns climb fast.</p>
      <p><strong>Who should choose this:</strong> If your home's entrance is its statement, this combination — casement-grade security + Georgian elegance — is the answer. If budget is tight, put the money into the door series (50–52mm) first and add Georgian bars later; they can be planned into the design from day one.</p>
      <p>Related: <a href="georgian-grill-casement-door">Georgian grill casement door</a> · <a href="slim-entrance-glass-door">slim entrance door</a> · <a href="aluminium-casement-window-price">casement series guide</a></p>`),
    faqs: [
      { q: 'Do Georgian bars have any functional benefit?', a: 'Honestly, very little — their job is the classic luxury look. The one real benefit: they strengthen the glass by dividing and supporting the pane. Cost is roughly ₹3,000–15,000 per door depending on design complexity.' },
      { q: 'Why are French doors more secure than normal doors?', a: 'They are built from the casement section family, which carries multi-point safety locks and compression EPDM sealing — better security and soundproofing than ordinary door systems.' }
    ],
    visibleCheck: 'VISFAQ-FRENCH-GEORGIAN-1',
    visibleBefore: '        <div class="faq-item">\n          <div class="faq-question" onclick="this.parentElement.classList.toggle(\'active\')">\n            <span>What is the 35mm slim profile series used in this luxury aluminium french door?</span>',
    visibleHtml: '<!-- VISFAQ-FRENCH-GEORGIAN-1 -->\n' + visibleFaqAccordion('Do Georgian bars have any functional benefit?', 'Honestly, very little — their job is the classic luxury look. The one real benefit: they strengthen the glass by dividing and supporting the pane. Cost is roughly ₹3,000–15,000 per door depending on design complexity.') + '\n' + visibleFaqAccordion('Why are French doors more secure than normal doors?', 'They are built from the casement section family, which carries multi-point safety locks and compression EPDM sealing — better security and soundproofing than ordinary door systems.') + '\n'
  },
  {
    file: 'products/aluminium-windows/georgian-grill-casement-door.html',
    check: 'Georgian Grill Doors — Design, Cost &amp; Where They Belong',
    marker: '  <!-- FAQ SECTION -->',
    schemaIndex: 0,
    section: wrapSection('Georgian Grill Doors — Design, Cost &amp; Where They Belong', `
      <p>A Georgian grill casement door pairs the casement family's engineering (locks, EPDM seals, dust &amp; sound control at maximum level) with the most recognisable luxury detail in door design.</p>
      <h3 style="margin:1.25rem 0 0.75rem;font-size:1.15rem;">Where they belong:</h3>
      <p>Entrance doors, kitchen doors, balcony doors — the places guests see first and homeowners touch daily. The profiles are sleek and premium; the Georgian pattern adds the classic character.</p>
      <p><strong>What it costs:</strong> ₹3,000–15,000 extra per door for the Georgian work, depending on design and complexity. The door itself follows series pricing — 40–45mm for budget builds (heights 6–7 ft, shutter width 3 ft), 50–52mm for premium homes (up to 10 ft, DGU up to 38mm).</p>
      <p><strong>Honest note:</strong> The bars are aesthetic-first. Their real functional contribution is added glass strength. If someone sells Georgian bars as a security feature, that's the locks doing the work — which come from the casement system, not the bars.</p>
      <p>Related: <a href="french-door-georgian-bar">French door &amp; Georgian bar</a> · <a href="aluminium-casement-window-price">casement series guide</a></p>`),
    faqs: [
      { q: 'How much do Georgian bars add to a door\'s cost?', a: 'Approximately ₹3,000–15,000 per door depending on the design and its complication. Simple grid patterns cost less; intricate custom patterns cost more.' }
    ],
    visibleCheck: 'VISFAQ-GEORGIAN-GRILL-1',
    visibleBefore: '        <div class="faq-item">\n          <div class="faq-question" onclick="this.parentElement.classList.toggle(\'active\')">\n            <span>Can this aluminium door be used as a main door?</span>',
    visibleHtml: '<!-- VISFAQ-GEORGIAN-GRILL-1 -->\n' + visibleFaqAccordion('How much do Georgian bars add to a door\'s cost?', 'Approximately ₹3,000–15,000 per door depending on the design and its complication. Simple grid patterns cost less; intricate custom patterns cost more.') + '\n'
  },
  {
    file: 'products/aluminium-windows/sliding-vs-casement-window.html',
    check: "Sliding vs Casement — A Fabricator's Straight Answer",
    marker: '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
    schemaIndex: 0,
    section: wrapSection("Sliding vs Casement — A Fabricator's Straight Answer", `
      <div class="wm-compare-wrap">
        <table class="wm-compare-table">
          <thead><tr><th>Factor</th><th>Sliding</th><th>Casement (Openable)</th></tr></thead>
          <tbody>
            <tr><td>Opening area</td><td>Half the frame max</td><td>Full frame opens</td></tr>
            <tr><td>Space needed</td><td>Zero swing space</td><td>Needs swing clearance</td></tr>
            <tr><td>Sealing</td><td>Brush/interlock seals</td><td>Compression EPDM — maximum dust &amp; sound control</td></tr>
            <tr><td>Security</td><td>Latch/multipoint (series-dependent)</td><td>Multi-point safety locks — stronger</td></tr>
            <tr><td>Wide openings</td><td>Excellent (up to 12–14 ft heights in 38/40mm)</td><td>Limited — 3 to 4 ft per shutter</td></tr>
            <tr><td>Small openings</td><td>Wasteful (half stays shut)</td><td>Perfect — bathrooms, kitchens, staircases</td></tr>
            <tr><td>Best series</td><td>29mm+ system</td><td>40–45mm budget / 50–52mm premium / 65–72mm heavy-duty</td></tr>
          </tbody>
        </table>
      </div>
      <h3 style="margin:1.5rem 0 0.75rem;font-size:1.15rem;">The straight answer:</h3>
      <ul>
        <li><strong>Big openings, balconies, living rooms</strong> → Sliding. Nothing matches it for wide glass.</li>
        <li><strong>Small windows where every inch of opening matters</strong> (bathroom, kitchen, staircase) → Casement/top hung. The full frame opens and the compression seal beats sliding on dust and sound.</li>
        <li><strong>Entrance &amp; French doors</strong> → Casement family, always — the lock systems and sealing are simply in another class.</li>
        <li><strong>Both in one home is normal</strong> — most well-planned homes use sliding for large openings and casement for small/wet areas. That's not a compromise; that's correct design.</li>
      </ul>
      <p>Related: <a href="aluminium-sliding-window">premium sliding</a> · <a href="aluminium-casement-window-price">casement series guide</a> · <a href="top-hung-casement-window">top hung casement</a></p>`),
    faqs: [
      { q: 'Which seals better against dust and sound — sliding or casement?', a: 'Casement. The shutter compresses against EPDM gaskets when closed, controlling dust and sound to the maximum level. Sliding windows seal with brushes and interlocks, which are good in system series but cannot match compression sealing.' },
      { q: 'Should I use sliding or casement windows in my home?', a: 'Both, in the right places. Sliding for large openings (balconies, living rooms), casement/top hung for small openings (bathrooms, kitchens, staircases) and all entrance doors. This is how well-planned homes are designed.' }
    ],
    visibleCheck: 'VISFAQ-SLIDING-VS-CASEMENT-1',
    visibleBefore: '      <h2 class="section-title">FAQs</h2>',
    visibleHtml: '<!-- VISFAQ-SLIDING-VS-CASEMENT-1 -->\n' + visibleFaqCard('Which seals better against dust and sound — sliding or casement?', 'Casement. The shutter compresses against EPDM gaskets when closed, controlling dust and sound to the maximum level. Sliding windows seal with brushes and interlocks, which are good in system series but cannot match compression sealing.') + '\n' + visibleFaqCard('Should I use sliding or casement windows in my home?', 'Both, in the right places. Sliding for large openings (balconies, living rooms), casement/top hung for small openings (bathrooms, kitchens, staircases) and all entrance doors. This is how well-planned homes are designed.') + '\n'
  },
  {
    file: 'products/aluminium-windows/slim-entrance-glass-door.html',
    check: 'Entrance Doors — Which Series Protects Your Front Door?',
    marker: '  <!-- FAQ SECTION (Mobile Only - Below Other Sections) -->',
    schemaIndex: 0,
    section: wrapSection('Entrance Doors — Which Series Protects Your Front Door?', `
      <p>Your entrance door is the one opening where security, sound and first impressions all meet — which is why entrance doors are built from the casement section family, never from basic sliding profiles.</p>
      <h3 style="margin:1.25rem 0 0.75rem;font-size:1.15rem;">Series guide for entrance doors:</h3>
      <ul>
        <li><strong>50–52mm — the premium-home standard.</strong> Perfect lock + soundproofing ecosystem, good depth, heights up to 10 ft, and DGU up to 38mm for serious sound insulation. This is what most premium villas and houses should choose.</li>
        <li><strong>65–72mm — the fortress grade.</strong> Heights up to 12 ft, widths 3.5–4 ft per shutter, exceptional lock systems, and strong hinges — brass, butterfly and bearing-type — that carry heavy shutters for decades. The large profile easily accepts <strong>automatic access hardware</strong> (digital/automatic locks), which is why offices and safety-critical doors use this range. Glass: single 5–12mm or laminated up to 13.52mm (laminated is the right choice for security anyway — it holds together even when broken).</li>
        <li><strong>40–45mm</strong> — works for budget projects, but for a main entrance we honestly recommend stepping up; the shallow depth and 3 ft shutter limit hold it back where it matters most.</li>
      </ul>
      <p><strong>Add the luxury layer:</strong> Georgian bars (₹3,000–15,000 per door) turn a secure door into a statement door — see our <a href="french-door-georgian-bar">French door &amp; Georgian bar</a> options.</p>
      <p>Related: <a href="system-casement-window-price">system casement</a> · <a href="aluminium-casement-window-price">casement series guide</a></p>`),
    faqs: [
      { q: 'Which aluminium series is best for a main entrance door?', a: '50–52mm for premium homes — perfect lock and soundproofing ecosystem, heights to 10 ft, DGU up to 38mm. For maximum security, very tall doors (up to 12 ft) or automatic access locks, choose 65–72mm with laminated glass.' },
      { q: 'Can automatic or digital locks be fitted on aluminium entrance doors?', a: 'Yes — the 65–72mm series easily accepts automatic access hardware because of its large profile, along with bearing-type, brass and butterfly hinges for heavy daily use.' }
    ],
    visibleCheck: 'VISFAQ-ENTRANCE-DOOR-1',
    visibleBefore: '        <div class="faq-item">\n          <div class="faq-question" onclick="this.parentElement.classList.toggle(\'active\')">\n            <span>What is the 40mm super luxury slim series profile in Luxury Slim Entrance Glass Door?</span>',
    visibleHtml: '<!-- VISFAQ-ENTRANCE-DOOR-1 -->\n' + visibleFaqAccordion('Which aluminium series is best for a main entrance door?', '50–52mm for premium homes — perfect lock and soundproofing ecosystem, heights to 10 ft, DGU up to 38mm. For maximum security, very tall doors (up to 12 ft) or automatic access locks, choose 65–72mm with laminated glass.') + '\n' + visibleFaqAccordion('Can automatic or digital locks be fitted on aluminium entrance doors?', 'Yes — the 65–72mm series easily accepts automatic access hardware because of its large profile, along with bearing-type, brass and butterfly hinges for heavy daily use.') + '\n'
  }
];

pages.forEach(applyPage);
console.log('Done.');
