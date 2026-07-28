/**
 * Inject sliding window series content pack (pages 1–8).
 * Run: node tools/inject-sliding-series-content.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AW = path.join(ROOT, 'products/aluminium-windows');

const COMPARE_STYLE = `<style id="wm-series-guide-styles">
.wm-series-guide .wm-compare-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 1.5rem 0; border-radius: 10px; border: 1px solid #E2E8F0; }
.wm-series-guide .wm-compare-table { width: 100%; min-width: 640px; border-collapse: collapse; font-size: 0.92rem; }
.wm-series-guide .wm-compare-table thead th { background: #1E40AF; color: #fff; padding: 0.85rem 1rem; text-align: left; font-weight: 600; }
.wm-series-guide .wm-compare-table tbody td { padding: 0.75rem 1rem; border-bottom: 1px solid #E2E8F0; color: #334155; vertical-align: top; }
.wm-series-guide .wm-compare-table tbody tr:nth-child(even) td { background: #F8FAFC; }
.wm-series-guide .wm-compare-table tbody td:first-child { font-weight: 600; color: #0F172A; white-space: nowrap; }
.wm-series-guide p, .wm-series-guide li { color: #475569; line-height: 1.75; }
.wm-series-guide h2.section-title { color: #0F172A; }
.wm-series-guide a { color: #1E40AF; font-weight: 500; }
</style>`;

function wrapSection(heading, body) {
  return `
  <!-- SLIDING SERIES GUIDE -->
  <section class="wm-series-guide" style="padding: 4rem 0; background: #F8FAFC;">
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

function applyPage(cfg) {
  const filePath = path.join(ROOT, cfg.file);
  let html = fs.readFileSync(filePath, 'utf8');
  const hasSection = html.includes(cfg.check);
  if (!hasSection) {
    if (!html.includes(cfg.marker)) {
      console.error('MARKER NOT FOUND:', cfg.file, cfg.marker);
      return;
    }
    html = html.replace(cfg.marker, cfg.section + cfg.marker);
  }
  if (cfg.replaceInner && !html.includes("System Window vs Domal vs UPVC")) {
    html = html.replace(cfg.replaceInner.find, cfg.replaceInner.replace);
  }
  if (cfg.faqs && cfg.faqs.length && !html.includes(cfg.faqs[0].q)) {
    html = injectFaqSchema(html, cfg.faqs, cfg.schemaIndex || 0);
  }
  if (cfg.visibleBefore && cfg.visibleHtml && !html.includes(cfg.faqs[0].q)) {
    html = html.replace(cfg.visibleBefore, cfg.visibleHtml + cfg.visibleBefore);
  }
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(hasSection ? 'FAQ/schema updated:' : 'OK:', cfg.file);
}

const pages = [
  {
    file: 'products/aluminium-windows/aluminium-sliding-window.html',
    check: 'Which Sliding Window Series Should You Choose',
    marker: '  <!-- Q&A SECTION -->',
    schemaIndex: 0,
    section: wrapSection('Which Sliding Window Series Should You Choose?', `
      <p>Every aluminium sliding window belongs to a profile series — and the series decides how it performs, not the brand name. Here is the honest fabricator's guide:</p>
      <div class="wm-compare-wrap">
        <table class="wm-compare-table">
          <thead><tr><th>Series</th><th>Max Size</th><th>DGU Glass</th><th>Best For</th><th>Honest Limitation</th></tr></thead>
          <tbody>
            <tr><td><a href="domal-window-price">27mm Domal (27x65)</a></td><td>6 ft height</td><td>Not recommended</td><td>Budget homes, rentals, builder projects</td><td>Water &amp; sound leakage common</td></tr>
            <tr><td><a href="slimline-aluminium-window">25mm Slim System</a></td><td>Medium sizes</td><td>Up to 18mm</td><td>Luxury look on economical budget</td><td>Vibration on 8–9 ft+ and high-rise</td></tr>
            <tr><td><a href="system-sliding-window-price">29mm System</a></td><td>8–9 ft width</td><td>Up to 24mm</td><td>Villas, flats, balconies, high-rise</td><td>Width should be at least half of height</td></tr>
            <tr><td>31/34/35mm System</td><td>Large openings</td><td>26–28mm</td><td>Premium villas, bedrooms, entrances</td><td>Higher cost</td></tr>
            <tr><td><a href="slim-aluminium-window-price-luxury">38/40mm Minimal</a></td><td>12–14 ft height</td><td>28mm</td><td>Luxury villas, farmhouses</td><td>Heavy, premium price</td></tr>
          </tbody>
        </table>
      </div>
      <p><strong>Quick decision:</strong></p>
      <ul>
        <li>Tight budget, small windows, rental property → <strong><a href="domal-window-price">27mm Domal</a></strong> (accept the leakage trade-off)</li>
        <li>Want a premium look without premium price → <strong><a href="slimline-aluminium-window">25mm Slim System</a></strong></li>
        <li>High-rise flat or villa, want zero vibration and long smooth operation → <strong><a href="system-sliding-window-price">29mm System</a></strong> (our most recommended)</li>
        <li>Want invisible joints and serious soundproofing → <strong>31/34/35mm</strong></li>
        <li>Luxury home with huge glass openings → <strong><a href="slim-aluminium-window-price-luxury">38/40mm Minimal</a></strong></li>
      </ul>
      <p>One rule that applies to all sliding windows: keep the shutter <strong>width at least half of its height</strong>. Follow this and the sliding operation stays soft and effortless for years.</p>`),
    faqs: [
      { q: 'Which aluminium sliding window series is best for a high-rise flat?', a: '29mm system series and above. From 29mm onwards there is no vibration even in high-rise buildings, and a complete hardware ecosystem (wheels, rails, seals) keeps operation smooth for years. Below 29mm, vibration is possible on large sizes.' },
      { q: 'What is the golden rule for sliding window sizes?', a: "Keep each sliding shutter's width at least half of its height. This keeps the wheels balanced and the sliding operation soft and effortless for the life of the window." }
    ],
    visibleBefore: '        <div class="faq-item">\n          <div class="faq-question" onclick="this.parentElement.classList.toggle(\'active\')">\n            <span>What is an aluminium sliding window?</span>',
    visibleHtml: visibleFaqAccordion('Which aluminium sliding window series is best for a high-rise flat?', '29mm system series and above. From 29mm onwards there is no vibration even in high-rise buildings, and a complete hardware ecosystem (wheels, rails, seals) keeps operation smooth for years. Below 29mm, vibration is possible on large sizes.') + '\n' + visibleFaqAccordion('What is the golden rule for sliding window sizes?', "Keep each sliding shutter's width at least half of its height. This keeps the wheels balanced and the sliding operation soft and effortless for the life of the window.") + '\n'
  },
  {
    file: 'products/aluminium-windows/3-track-sliding-window.html',
    check: '3-Track Sliding Window — Which Series and Why',
    marker: '  <!-- FAQ SECTION -->',
    schemaIndex: 0,
    section: wrapSection('3-Track Sliding Window — Which Series and Why?', `
      <p>A 3-track window gives you glass + glass + mosquito mesh sliding together — the most practical configuration for Indian homes. But the same 3-track comes in very different series:</p>
      <p><strong>3-track in 27mm Domal (27x65):</strong> The cheapest 3-track in the market. Fine for budget homes and builder projects up to <strong>6 ft height</strong>. Honest truth: the low-cost connectors and shallow depth mean joints are never perfectly sealed — expect some water and sound leakage. Only the wheels are replaceable; nothing else can be serviced.</p>
      <p><strong>3-track in 29mm System:</strong> The series we recommend for most homes. Safe for high-rise buildings with zero vibration. Width up to 8–9 ft is no problem. The deep slim interlock makes it very strong, and a complete hardware ecosystem exists for it — precision wheels, connectors, wing connectors, rails, and waterproofing/sound/dust seals. DGU glass up to 24mm. Keep width at least half of height for effortless sliding.</p>
      <p><strong>3-track in 31/34/35mm:</strong> Same uses, more stable. 90-degree cutting with male-female joints hides every cut — joints are practically invisible. Wider tracks allow superior wheels and sound &amp; dust sealing. DGU up to 26mm (31mm series) or 28mm (34/35mm) — thicker DGU means a bigger air gap, which blocks sound far better.</p>
      <p><strong>Verdict:</strong> If your budget allows, the jump from Domal 3-track to 29mm system 3-track is the single biggest quality upgrade in sliding windows — leakage problems almost disappear.</p>
      <p>Related: <a href="system-sliding-window-price">29mm system sliding</a> · <a href="2-track-aluminium-window-price">2-track pricing</a> · <a href="domal-window-price">Domal window guide</a></p>`),
    faqs: [
      { q: 'What is the maximum height for a Domal 3-track sliding window?', a: "6 ft. Beyond that, the 27mm Domal profile's shallow depth and basic connectors cannot keep joints sealed — water leakage, sound leakage and rough operation increase. For taller openings choose 29mm system series or above." },
      { q: 'Which 3-track sliding window blocks sound best?', a: '31/34/35mm series with thick DGU glass. The 34/35mm series accepts up to 28mm DGU — the bigger air gap inside the DGU is what actually blocks sound, along with the wider track\'s superior dust and sound seals.' }
    ],
    visibleBefore: '        <div class="faq-item">\n          <div class="faq-question" onclick="this.parentElement.classList.toggle(\'active\')">\n            <span>What is the difference between aluminium sliding windows and uPVC windows?</span>',
    visibleHtml: visibleFaqAccordion('What is the maximum height for a Domal 3-track sliding window?', "6 ft. Beyond that, the 27mm Domal profile's shallow depth and basic connectors cannot keep joints sealed — water leakage, sound leakage and rough operation increase. For taller openings choose 29mm system series or above.") + '\n' + visibleFaqAccordion('Which 3-track sliding window blocks sound best?', '31/34/35mm series with thick DGU glass. The 34/35mm series accepts up to 28mm DGU — the bigger air gap inside the DGU is what actually blocks sound, along with the wider track\'s superior dust and sound seals.') + '\n'
  },
  {
    file: 'products/aluminium-windows/2-track-aluminium-window-price.html',
    check: 'When Is a 2-Track Window the Right Choice',
    marker: '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
    schemaIndex: 0,
    section: wrapSection('When Is a 2-Track Window the Right Choice?', `
      <p>A 2-track sliding window carries two shutters — typically glass + glass. It is the most economical sliding configuration and makes complete sense in the right places:</p>
      <p><strong>Best for:</strong> Bedrooms and small-to-medium openings where budget matters, internal partitions, and rooms where you don't need a separate sliding mesh shutter.</p>
      <p><strong>Honest limitation:</strong> With only two tracks, you cannot have glass + glass + a separately sliding mosquito mesh. If mesh is important for you (in most Indian homes it is), choose a <a href="3-track-sliding-window">3-track window</a> instead — that is exactly what the third track is for.</p>
      <p><strong>Series advice is the same as all sliding windows:</strong> 27mm Domal 2-track is cheapest but expect leakage and a 6 ft height limit. From 29mm system series the joints seal properly, hardware lasts, and high-rise use is no problem. Keep shutter width at least half of height for soft operation.</p>
      <p>Related: <a href="3-track-sliding-window">3-track sliding</a> · <a href="system-sliding-window-price">system sliding price</a></p>`),
    faqs: [
      { q: 'Can I get a mosquito mesh on a 2-track sliding window?', a: 'Not as a sliding shutter — both tracks are used by glass. If you need glass and mesh sliding together, choose a 3-track window. That is the main reason 3-track is the most popular configuration in India.' }
    ],
    visibleBefore: '      <div style="margin-bottom:1.25rem;padding:1rem 1.25rem;border:1px solid #e2e8f0;border-radius:10px;">\n        <h3 style="margin:0 0 0.5rem;font-size:1.05rem;color:#1e3a8a;">What is the 2 track aluminium window price per sqft in India in 2026?</h3>',
    visibleHtml: visibleFaqCard('Can I get a mosquito mesh on a 2-track sliding window?', 'Not as a sliding shutter — both tracks are used by glass. If you need glass and mesh sliding together, choose a 3-track window. That is the main reason 3-track is the most popular configuration in India.') + '\n'
  },
  {
    file: 'products/aluminium-windows/4-track-sliding-window-price.html',
    check: '4-Track Sliding Windows — For Wide Openings Done Right',
    marker: '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
    schemaIndex: 0,
    section: wrapSection('4-Track Sliding Windows — For Wide Openings Done Right', `
      <p>A 4-track window carries four sliding shutters — built for wide openings like full-width balconies and living rooms where you want a large clear opening when shutters stack.</p>
      <p><strong>Series matters even more here:</strong> A wide 4-track window carries serious glass weight. In the 27mm Domal series this is asking for trouble — rough operation and leakage. From the <strong>29mm system series onwards</strong>, the deep interlock, precision wheels and strong rails are designed for exactly this load. For very large luxury openings, the <strong>38/40mm minimal series</strong> handles heights of 12–14 ft with steel wheels and extra-strong rails, with the bottom track almost hidden.</p>
      <p><strong>The size rule is critical on 4-track:</strong> keep each shutter's width at least half of its height. Wide-but-balanced shutters slide effortlessly; tall narrow shutters fight the wheels every day.</p>
      <p>Related: <a href="system-sliding-window-price">system sliding price</a> · <a href="slim-aluminium-window-price-luxury">38/40mm minimal luxury</a></p>`),
    faqs: [
      { q: 'Which series is best for a 4-track sliding window?', a: '29mm system series or above. Four shutters mean heavy glass load — the deep interlock, precision wheels and strong rails of system series are built for it. For luxury openings up to 12–14 ft height, the 38/40mm minimal series with steel wheels is the right choice.' }
    ],
    visibleBefore: '      <h2 class="section-title">FAQs</h2>',
    visibleHtml: visibleFaqCard('Which series is best for a 4-track sliding window?', '29mm system series or above. Four shutters mean heavy glass load — the deep interlock, precision wheels and strong rails of system series are built for it. For luxury openings up to 12–14 ft height, the 38/40mm minimal series with steel wheels is the right choice.') + '\n'
  },
  {
    file: 'products/aluminium-windows/slimline-aluminium-window.html',
    check: '25mm Slim System — Luxury Look, Economical Budget',
    marker: '  <!-- Q&A SECTION -->',
    schemaIndex: 0,
    section: wrapSection('25mm Slim System — Luxury Look, Economical Budget', `
      <p>The 25mm slim system series is the smartest upgrade from basic Domal windows. Here is what actually changes:</p>
      <p><strong>What you get:</strong> Proper interlock depth and genuine system hardware — water leakage and sound leakage drop dramatically compared to Domal. With a good powder coating finish, this series gives a truly luxury feel in a budget price range. Glass options: 5–12mm, laminated, and DGU up to 18mm.</p>
      <p><strong>Honest limitation:</strong> On large sizes (8–9 ft) and in high-rise buildings, vibration is possible in this series. If your opening is large or you live on a high floor, step up to the <a href="system-sliding-window-price">29mm system series</a> — that is exactly the problem it solves.</p>
      <p><strong>Who should choose this:</strong> Apartments and homes that want the slim premium look and sealed performance without paying for the heavier series. For standard bedroom and living room sizes on low and mid floors, this series is excellent value.</p>
      <p>Related: <a href="system-sliding-window-price">29mm upgrade path</a> · <a href="3-track-sliding-window">3-track sliding</a></p>`),
    faqs: [
      { q: 'Is the 25mm slim system window good for high-rise buildings?', a: 'For standard sizes on low and mid floors, yes. On large openings (8–9 ft) and high floors, vibration is possible in 25mm — choose the 29mm system series there, which has zero vibration even in high-rise use.' },
      { q: 'What glass can a 25mm slim system window take?', a: '5–12mm single glass, laminated glass, and DGU up to 18mm total thickness.' }
    ],
    visibleBefore: '        <div class="faq-item">\n          <div class="faq-question" onclick="this.parentElement.classList.toggle(\'active\')">\n            <span>What is the difference between Hindalco and Imported profiles?</span>',
    visibleHtml: visibleFaqAccordion('Is the 25mm slim system window good for high-rise buildings?', 'For standard sizes on low and mid floors, yes. On large openings (8–9 ft) and high floors, vibration is possible in 25mm — choose the 29mm system series there, which has zero vibration even in high-rise use.') + '\n' + visibleFaqAccordion('What glass can a 25mm slim system window take?', '5–12mm single glass, laminated glass, and DGU up to 18mm total thickness.') + '\n'
  },
  {
    file: 'products/aluminium-windows/system-sliding-window-price.html',
    check: 'Why System Windows Are Worth It — The Maintenance Truth',
    marker: '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
    schemaIndex: 0,
    section: wrapSection('Why System Windows Are Worth It — The Maintenance Truth', `
      <p>The real difference between a system window and a normal (Domal-type) window is not just looks — it is what happens over the next 15 years.</p>
      <p><strong>A system window is built from separable components</strong> with a complete hardware ecosystem. If any part fails or gets accidentally damaged, <strong>only that component is replaced — without opening or disturbing the whole window:</strong></p>
      <ul>
        <li>Track rail damaged? Only the track is changed.</li>
        <li>Wheel worn out? The wheel is changed without removing the window.</li>
        <li>Dust pad worn? Only the dust pad is changed.</li>
      </ul>
      <p><strong>In a Domal window, only the wheel is replaceable.</strong> Nothing else can be serviced — a damaged track or seal means living with the problem or replacing the window. <strong>UPVC has the same repair limitation</strong> as Domal, though its soft material does give better soundproofing.</p>
      <p><strong>Series within system windows:</strong></p>
      <ul>
        <li><strong>29mm</strong> — semi-luxury villas, flats, balconies, entry doors. High-rise safe, zero vibration, width up to 8–9 ft, DGU up to 24mm. Full hardware ecosystem: wheels, connectors, wing connectors, rails, waterproofing/sound/dust seals.</li>
        <li><strong>31/34/35mm</strong> — more stable, 90° cutting + male-female joints make every joint invisible. Wider tracks, superior wheels and seals. DGU up to 26mm (31mm) / 28mm (34/35mm) — bigger air gap, far better soundproofing.</li>
        <li><strong>38/40mm minimal</strong> — maximum glass, hidden bottom track, steel wheels, 12–14 ft heights. Pure luxury.</li>
      </ul>
      <p>Related: <a href="system-window-vs-normal-window">system vs normal</a> · <a href="slim-aluminium-window-price-luxury">38/40mm minimal</a> · <a href="slimline-aluminium-window">25mm slim system</a></p>`),
    faqs: [
      { q: 'Can system window parts be repaired without removing the window?', a: 'Yes — that is the core advantage. Track, wheels, and dust pads are all individually replaceable without opening or disturbing the window. In Domal windows only the wheel can be changed; in UPVC the same repair limitation applies.' },
      { q: 'What is the maximum DGU glass for each system window series?', a: '29mm series: up to 24mm DGU. 31mm series: up to 26mm. 34/35mm series: up to 28mm. Thicker DGU means a bigger internal air gap — which is what actually blocks sound.' }
    ],
    visibleBefore: '      <h2 class="section-title">FAQs</h2>',
    visibleHtml: visibleFaqCard('Can system window parts be repaired without removing the window?', 'Yes — that is the core advantage. Track, wheels, and dust pads are all individually replaceable without opening or disturbing the window. In Domal windows only the wheel can be changed; in UPVC the same repair limitation applies.') + '\n' + visibleFaqCard('What is the maximum DGU glass for each system window series?', '29mm series: up to 24mm DGU. 31mm series: up to 26mm. 34/35mm series: up to 28mm. Thicker DGU means a bigger internal air gap — which is what actually blocks sound.') + '\n'
  },
  {
    file: 'products/aluminium-windows/slim-aluminium-window-price-luxury.html',
    check: '38/40mm Minimal Series — Maximum Glass, Invisible Frame',
    marker: '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
    schemaIndex: 0,
    section: wrapSection('38/40mm Minimal Series — Maximum Glass, Invisible Frame', `
      <p>This is the top of the sliding window range — built for homes where the view is the luxury.</p>
      <p><strong>What makes it different:</strong> Maximum glass with minimum visible frame, and the bottom track almost completely hidden in the floor. 90-degree cutting with male-female joints means the joints are practically invisible — the window looks like a single piece of glass. Steel wheels and extra-strong rails carry the heavy glass weight, so heights of <strong>12–14 ft are no problem</strong>.</p>
      <p><strong>Honest note:</strong> This series is heavy and sits in the premium price range. It is engineered for high-value homes, villas and farmhouses — if your openings are standard sized and budget matters, the 29mm or 31/34/35mm series delivers most of the performance at much lower cost.</p>
      <p><strong>Strength:</strong> The deep interlock of this series makes these large windows extremely strong despite their minimal look.</p>
      <p>Related: <a href="system-sliding-window-price">system sliding price</a> · <a href="full-elevation-villa-facade">full villa elevation</a></p>`),
    faqs: [
      { q: 'How tall can a 38/40mm minimal sliding window be?', a: '12–14 ft heights are no problem. Steel wheels and extra-strong rails are designed for the glass weight at these sizes, and the deep interlock keeps the window rigid.' },
      { q: 'Why are the joints invisible in 38/40mm minimal windows?', a: 'They use 90-degree cutting with male-female joint design — every cut is hidden inside the joint, so the frame looks seamless.' }
    ],
    visibleBefore: '      <h2 class="section-title">FAQs</h2>',
    visibleHtml: visibleFaqCard('How tall can a 38/40mm minimal sliding window be?', '12–14 ft heights are no problem. Steel wheels and extra-strong rails are designed for the glass weight at these sizes, and the deep interlock keeps the window rigid.') + '\n' + visibleFaqCard('Why are the joints invisible in 38/40mm minimal windows?', 'They use 90-degree cutting with male-female joint design — every cut is hidden inside the joint, so the frame looks seamless.') + '\n'
  },
  {
    file: 'products/aluminium-windows/system-window-vs-normal-window.html',
    check: "System Window vs Domal vs UPVC — A Fabricator's Honest Comparison",
    marker: '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
    schemaIndex: 0,
    replaceInner: {
      find: '      <h2 class="section-title">System vs other choices</h2>\n      <h3>₹/sqft vs lifecycle</h3><p>Non-system can look cheaper for three seasons; the comparison table above shows where risk sits.</p><h3>Brand vs unbranded</h3><p>See <a href="aluminium-system-window-brands-india">brands in India</a> for a neutral map.</p><h3>Switching mid-project</h3><p>Stone reveal and FFL often lock early — pick system vs normal before chiselling the RCC pocket.</p>',
      replace: `      <h2 class="section-title">System Window vs Domal vs UPVC — A Fabricator's Honest Comparison</h2>
      ${COMPARE_STYLE}
      <div class="wm-compare-wrap">
        <table class="wm-compare-table">
          <thead><tr><th>Factor</th><th>System Window</th><th>Domal (Normal)</th><th>UPVC</th></tr></thead>
          <tbody>
            <tr><td>Joints &amp; sealing</td><td>Precision, sealed</td><td>Never perfectly sealed</td><td>Good (welded)</td></tr>
            <tr><td>Water/sound leakage</td><td>Minimal</td><td>Common</td><td>Low (soft material)</td></tr>
            <tr><td>Repairs</td><td>Every component replaceable without removing window</td><td>Only wheel replaceable</td><td>Only wheel replaceable</td></tr>
            <tr><td>Height capacity</td><td>Up to 12–14 ft (by series)</td><td>Max 6 ft recommended</td><td>Limited on large sizes</td></tr>
            <tr><td>High-rise vibration</td><td>None (29mm+)</td><td>Possible</td><td>Possible on large sizes</td></tr>
            <tr><td>Look</td><td>Slim to ultra-minimal</td><td>Basic</td><td>Bulky frames</td></tr>
          </tbody>
        </table>
      </div>
      <p><strong>The one-line summary:</strong> Domal wins on price, UPVC wins on out-of-the-box soundproofing, but the system window is the only one you can actually maintain for 15+ years — track, wheel, or dust pad, each replaceable without disturbing the window. Over the life of the window, that changes everything.</p>
      <p>See also: <a href="aluminium-system-window-brands-india">brands in India</a> · <a href="domal-window-price">Domal window guide</a></p>`
    },
    section: '',
    faqs: [
      { q: 'Is UPVC better than aluminium system windows?', a: "UPVC's soft material gives good soundproofing out of the box, but it shares Domal's biggest weakness — only the wheel is serviceable. A system window matches the soundproofing with thick DGU glass (24–28mm by series) and stays fully maintainable: every component is replaceable without removing the window." }
    ],
    visibleBefore: '      <h2 class="section-title">FAQs</h2>',
    visibleHtml: visibleFaqCard('Is UPVC better than aluminium system windows?', "UPVC's soft material gives good soundproofing out of the box, but it shares Domal's biggest weakness — only the wheel is serviceable. A system window matches the soundproofing with thick DGU glass (24–28mm by series) and stays fully maintainable: every component is replaceable without removing the window.") + '\n'
  }
];

pages.forEach(applyPage);
console.log('Done.');
