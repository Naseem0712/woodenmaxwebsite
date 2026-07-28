/**
 * Remaining sliding pages — page-specific series + why-choose blocks.
 * Run: node tools/inject-remaining-sliding-content.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STYLE = `<style id="wm-series-guide-styles">
.wm-series-guide .wm-compare-wrap, .wm-sliding-context .wm-compare-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 1.5rem 0; border-radius: 10px; border: 1px solid #E2E8F0; }
.wm-series-guide .wm-compare-table, .wm-sliding-context .wm-compare-table { width: 100%; min-width: 640px; border-collapse: collapse; font-size: 0.92rem; }
.wm-series-guide .wm-compare-table thead th, .wm-sliding-context .wm-compare-table thead th { background: #1E40AF; color: #fff; padding: 0.85rem 1rem; text-align: left; font-weight: 600; }
.wm-series-guide .wm-compare-table tbody td, .wm-sliding-context .wm-compare-table tbody td { padding: 0.75rem 1rem; border-bottom: 1px solid #E2E8F0; color: #334155; vertical-align: top; }
.wm-series-guide .wm-compare-table tbody tr:nth-child(even) td, .wm-sliding-context .wm-compare-table tbody tr:nth-child(even) td { background: #F8FAFC; }
.wm-series-guide .wm-compare-table tbody td:first-child, .wm-sliding-context .wm-compare-table tbody td:first-child { font-weight: 600; color: #0F172A; white-space: nowrap; }
.wm-series-guide p, .wm-series-guide li, .wm-sliding-context p, .wm-sliding-context li, .wm-why-choose p { color: #475569; line-height: 1.75; }
.wm-series-guide a, .wm-sliding-context a, .wm-why-choose a { color: #1E40AF; font-weight: 500; }
</style>`;

function seriesBlock(heading, body) {
  return `
  <section class="wm-series-guide wm-sliding-context" style="padding: 4rem 0; background: #F8FAFC;">
    ${STYLE}
    <div class="container" style="max-width: 900px; margin: 0 auto; padding: 0 1rem;">
      <h2 class="section-title" style="margin-bottom: 1.25rem; color: #0F172A;">${heading}</h2>
      ${body}
    </div>
  </section>

`;
}

function whyBlock(heading, body) {
  return `
  <section class="wm-why-choose" style="padding: 3.5rem 0; background: #FFFFFF;">
    <div class="container" style="max-width: 900px; margin: 0 auto; padding: 0 1rem;">
      <h2 class="section-title" style="margin-bottom: 1.25rem; color: #0F172A; font-size: 1.5rem;">${heading}</h2>
      ${body}
    </div>
  </section>

`;
}

function inject(filePath, marker, html, check) {
  if (!fs.existsSync(filePath)) {
    console.error('MISSING FILE:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(check)) {
    console.log('SKIP (' + check + '):', path.basename(filePath));
    return;
  }
  if (!content.includes(marker)) {
    console.error('MARKER MISSING:', path.basename(filePath), marker.trim().slice(0, 40));
    return;
  }
  content = content.replace(marker, `<!-- ${check} -->\n` + html + marker);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('OK:', path.basename(filePath));
}

const AW = path.join(ROOT, 'products/aluminium-windows');

// --- aluminium-system-window-price (30mm India line calculator page) ---
inject(
  path.join(AW, 'aluminium-system-window-price.html'),
  '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
  seriesBlock('System Sliding on This Page — 30mm India Line', `
      <p>This URL’s live calculator is the <strong>30mm system sliding (India line)</strong> — planning band <strong>₹1,180–2,680/sq.ft</strong> (before GST). Same family as certified system stacks, not local Domal shop work.</p>
      <div class="wm-compare-wrap">
        <table class="wm-compare-table">
          <thead><tr><th>When your opening needs…</th><th>Go to</th><th>Why not stop at 30mm only</th></tr></thead>
          <tbody>
            <tr><td>Standard balcony / bedroom sliding, metro install</td><td><strong>This page (30mm)</strong></td><td>Lower half of band — 6mm + standard hardware path</td></tr>
            <tr><td>High-rise, DGU, heavy daily use</td><td><a href="system-sliding-window-price">35mm Gulf system sliding</a></td><td>Deeper interlock, better seals, full hardware ecosystem</td></tr>
            <tr><td>Floor-to-ceiling villa glass wall</td><td><a href="slim-aluminium-window-price-luxury">38/40mm minimal sliding</a></td><td>Steel wheels, 12–14 ft height capacity</td></tr>
            <tr><td>Budget rental, under 6 ft</td><td><a href="domal-window-price">27mm Domal</a></td><td>Cheapest — accept leakage trade-off</td></tr>
          </tbody>
        </table>
      </div>`) +
  whyBlock('Why Pick a Certified System Sliding Window (Not Local Make)?', `
      <p style="margin:0 0 1rem;"><strong>Simple answer:</strong> Profiles, gaskets, and drainage are designed as one tested stack — joints seal better, and <strong>track / wheel / dust pad</strong> can be replaced later without ripping out the window.</p>
      <p style="margin:0 0 1rem;"><strong>Best for:</strong> New flats and villas where you want one BOQ number that survives monsoon — especially balcony and living sliders that you use every day.</p>
      <p style="margin:0;"><strong>This page vs <a href="system-sliding-window-price">35mm page</a>:</strong> Start here for 30mm class pricing; move to 35mm when the drawing shows large panels, DGU, or tower-height stacks.</p>`),
  'wm-sliding-context-system-price'
);

// --- sliding price calculator hub ---
inject(
  path.join(AW, 'aluminium-sliding-window-price-calculator.html'),
  '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
  seriesBlock('Which Sliding Page Matches Your Opening?', `
      <p>Use this table before you lock a quote — track count and series matter more than brand name on the invoice.</p>
      <div class="wm-compare-wrap">
        <table class="wm-compare-table">
          <thead><tr><th>Your need</th><th>Open this page</th><th>Typical ₹/sqft band</th></tr></thead>
          <tbody>
            <tr><td>Glass + glass, no sliding mesh</td><td><a href="2-track-aluminium-window-price">2-track premium</a></td><td>₹1,200–1,400</td></tr>
            <tr><td>Glass + glass + mesh (most bedrooms)</td><td><a href="3-track-sliding-window">3-track Domal / system</a></td><td>₹550–950 (Domal) · system higher</td></tr>
            <tr><td>Very wide balcony wall</td><td><a href="4-track-sliding-window-price">4-track system</a></td><td>29mm+ system only</td></tr>
            <tr><td>Certified system, high-rise</td><td><a href="system-sliding-window-price">35mm system sliding</a></td><td>₹1,150–2,780</td></tr>
            <tr><td>Balcony French look</td><td><a href="2-track-french-sliding-door">French sliding</a></td><td>Premium over plain 2-track</td></tr>
            <tr><td>Budget builder, 6 ft max</td><td><a href="domal-window-price">Domal guide</a></td><td>₹550–950</td></tr>
          </tbody>
        </table>
      </div>`) +
  whyBlock('Why Use This Sliding Calculator First?', `
      <p style="margin:0 0 1rem;"><strong>Simple answer:</strong> Enter real sizes, pick glass and hardware — you see a ₹ range in seconds instead of waiting for a site visit for a rough budget.</p>
      <p style="margin:0 0 1rem;"><strong>Best for:</strong> Renovation planning, comparing 2-track vs 3-track on the same opening, and checking if premium 29mm is worth it over Domal on <em>your</em> floor and height.</p>
      <p style="margin:0;">Calculator logic follows our <a href="aluminium-sliding-window">29mm premium sliding</a> product — for Domal 3-track numbers use the <a href="3-track-sliding-window">3-track page</a> tool instead.</p>`),
  'wm-sliding-context-calc-hub'
);

// --- full elevation villa ---
inject(
  path.join(AW, 'full-elevation-villa-facade.html'),
  '  <!-- FAQ SECTION -->',
  seriesBlock('Sliding Windows on a Full Villa Elevation — How We Spec Them', `
      <p>A villa façade is not one window type — but <strong>sliding</strong> carries most of the wide openings. Typical mix on our projects:</p>
      <ul>
        <li><strong>Living + master balcony:</strong> <a href="4-track-sliding-window-price">4-track system</a> or <a href="system-sliding-window-price">35mm system sliding</a> when the wall is full width.</li>
        <li><strong>Bedrooms:</strong> <a href="3-track-sliding-window">3-track</a> (mesh track) in system series for high floors.</li>
        <li><strong>Entrance / feature bay:</strong> <a href="2-track-french-sliding-door">French sliding</a> or <a href="french-door-georgian-bar">Georgian bar French</a> — not every bedroom, only statement openings.</li>
        <li><strong>Feature glass wall 12 ft+:</strong> <a href="slim-aluminium-window-price-luxury">38/40mm minimal sliding</a>.</li>
      </ul>
      <p>Fixed glass panels in the same grid are priced on this elevation calculator; sliding lines are broken out in BOQ by series so you can value-engineer one floor at a time.</p>`) +
  whyBlock('Why Sliding Dominates Villa Elevations', `
      <p style="margin:0 0 1rem;"><strong>Simple answer:</strong> Wide openings need panels that stack sideways — sliding gives the largest clear opening without door swing into furniture or pool deck.</p>
      <p style="margin:0 0 1rem;"><strong>Best for:</strong> Ground-floor living-to-garden, first-floor balcony runs, and any wall wider than ~8 ft where casement would need too many small vents.</p>
      <p style="margin:0;"><strong>Honest note:</strong> Small bath and utility vents stay openable casement on most villa schedules — this elevation tool is for the <em>glass wall</em> portion, not every 2 ft vent.</p>`),
  'wm-sliding-context-villa-elevation'
);

// --- system window for villa (sliding slice only) ---
inject(
  path.join(AW, 'system-window-for-villa.html'),
  '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
  seriesBlock('Villa Sliding Walls — Which System Series?', `
      <p>This guide page uses a <strong>50mm Euro casement</strong> calculator for vents — but villa clients almost always pair it with system <strong>sliding</strong> on view walls. Spec like this:</p>
      <div class="wm-compare-wrap">
        <table class="wm-compare-table">
          <thead><tr><th>Villa opening</th><th>Sliding series we specify</th><th>Page for ₹/sqft</th></tr></thead>
          <tbody>
            <tr><td>Standard balcony slider (8–9 ft wide)</td><td>29mm–35mm system</td><td><a href="system-sliding-window-price">System sliding</a></td></tr>
            <tr><td>Full-width living stack</td><td>4-track + 35mm system</td><td><a href="4-track-sliding-window-price">4-track</a></td></tr>
            <tr><td>Double-height feature glass</td><td>38/40mm minimal</td><td><a href="slim-aluminium-window-price-luxury">Minimal luxury</a></td></tr>
            <tr><td>Pool / sea-facing (salt air)</td><td>35mm+ with coastal hardware class</td><td><a href="aluminium-system-window-price">30mm+ system index</a></td></tr>
          </tbody>
        </table>
      </div>`) +
  whyBlock('Why Villa Projects Need System Sliding (Not Domal) on View Walls', `
      <p style="margin:0 0 1rem;"><strong>Simple answer:</strong> Villa sliders are tall, heavy, and used daily — Domal joints and 6 ft height limits fail on these openings. System series carry the load and stay serviceable for 15+ years.</p>
      <p style="margin:0 0 1rem;"><strong>Best for:</strong> Floor-to-ceiling living-to-terrace, master balcony panoramas, and any slider you want silent after year five.</p>
      <p style="margin:0;">Budget bedrooms on upper floors can still use <a href="3-track-sliding-window">3-track system</a> while the hero wall uses <a href="system-sliding-window-price">35mm sliding</a> — split the BOQ, do not use one series for the whole villa.</p>`),
  'wm-sliding-context-villa-system'
);

// --- best window for home (sliding rooms) ---
inject(
  path.join(AW, 'best-aluminium-window-for-home.html'),
  '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
  seriesBlock('Room-by-Room — Where Sliding Wins at Home', `
      <div class="wm-compare-wrap">
        <table class="wm-compare-table">
          <thead><tr><th>Room</th><th>Sliding choice</th><th>Why</th></tr></thead>
          <tbody>
            <tr><td>Living room</td><td><a href="2-track-aluminium-window-price">2-track premium</a> or <a href="4-track-sliding-window-price">4-track</a> if wide</td><td>Max glass, no swing into sofa</td></tr>
            <tr><td>Bedroom</td><td><a href="3-track-sliding-window">3-track with mesh</a></td><td>Ventilation + insects — India default</td></tr>
            <tr><td>Balcony door</td><td><a href="system-sliding-window-price">System sliding</a></td><td>Daily use, monsoon sealing</td></tr>
            <tr><td>Kitchen / bath</td><td><em>Not sliding first choice</em></td><td>Small vent — openable casement (other pages)</td></tr>
            <tr><td>Entrance feature</td><td><a href="2-track-french-sliding-door">French sliding</a></td><td>Design statement only</td></tr>
          </tbody>
        </table>
      </div>`) +
  whyBlock('Why We Recommend Sliding for Living & Bedroom (Not Every Room)', `
      <p style="margin:0 0 1rem;"><strong>Simple answer:</strong> Indian homes need wide glass + mesh + daily sliding — 3-track handles that in bedrooms; living rooms prefer 2-track or 4-track for view.</p>
      <p style="margin:0 0 1rem;"><strong>Best budget path:</strong> Domal 3-track in rental bedrooms; owner-occupied flats step to system 3-track on the same layout.</p>
      <p style="margin:0;">Use the calculator on this page for a <strong>29mm sliding</strong> budget check, then open the matching product page from the table above for final series.</p>`),
  'wm-sliding-context-best-home'
);

// --- price per sqft guide ---
inject(
  path.join(AW, 'aluminium-window-price-per-sqft.html'),
  '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
  seriesBlock('Sliding Window ₹/sqft — Which Band Is Yours?', `
      <div class="wm-compare-wrap">
        <table class="wm-compare-table">
          <thead><tr><th>Sliding type</th><th>₹/sqft (indicative 2026)</th><th>Detail page</th></tr></thead>
          <tbody>
            <tr><td>27mm Domal 2/3-track</td><td>₹550–950</td><td><a href="domal-window-price">Domal</a> · <a href="3-track-sliding-window">3-track</a></td></tr>
            <tr><td>29mm premium 2-track</td><td>₹1,200–1,400</td><td><a href="aluminium-sliding-window">Premium sliding</a></td></tr>
            <tr><td>30mm system sliding</td><td>₹1,180–2,680</td><td><a href="aluminium-system-window-price">System index</a></td></tr>
            <tr><td>35mm system sliding</td><td>₹1,150–2,780</td><td><a href="system-sliding-window-price">System sliding</a></td></tr>
            <tr><td>38/40mm minimal</td><td>Premium band</td><td><a href="slim-aluminium-window-price-luxury">Minimal luxury</a></td></tr>
            <tr><td>French sliding</td><td>Above plain 2-track</td><td><a href="2-track-french-sliding-door">French sliding</a></td></tr>
          </tbody>
        </table>
      </div>
      <p>₹/sqft is only comparable when series, glass, and track count match — a Domal quote and a 35mm system quote are not the same product.</p>`) +
  whyBlock('How to Use ₹/sqft for Sliding (Without Wrong Comparisons)', `
      <p style="margin:0 0 1rem;"><strong>Step 1:</strong> Fix track count — 2 / 3 / 4 — from room type (table above).</p>
      <p style="margin:0 0 1rem;"><strong>Step 2:</strong> Fix series from floor height and budget — Domal under 6 ft low floor; system from 29mm up for high-rise.</p>
      <p style="margin:0;"><strong>Step 3:</strong> Open the linked page calculator with your exact size — ₹/sqft tables are planning bands, not a substitute for measurement.</p>`),
  'wm-sliding-context-per-sqft'
);

// --- sliding vs casement (sliding wins section) ---
inject(
  path.join(AW, 'sliding-vs-casement-window.html'),
  '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
  seriesBlock('When Sliding Is the Better Buy (India Homes)', `
      <ul>
        <li><strong>Opening width over 6 ft</strong> — sliding stacks; casement needs many small vents.</li>
        <li><strong>Balcony connects to living</strong> — sliding door/window same track family (<a href="3-track-sliding-window">3-track</a> or <a href="system-sliding-window-price">system</a>).</li>
        <li><strong>Furniture near the wall</strong> — no inward swing from casement.</li>
        <li><strong>Mesh on daily track</strong> — 3-track sliding; casement uses fixed mesh or add-on.</li>
      </ul>
      <p>When casement wins (bath, kitchen, high vent only) — see the casement sections above; this block is only the sliding case.</p>`) +
  whyBlock('Why Homeowners Pick Sliding for Living & Balcony', `
      <p style="margin:0 0 1rem;"><strong>Simple answer:</strong> You get more usable glass area and easier daily operation on wide openings — especially with 3-track mesh in bedrooms.</p>
      <p style="margin:0 0 1rem;"><strong>Best sliding specs for India:</strong> Ground floor Domal acceptable if under 6 ft; flats and villas on system 29mm+ for sealing and high-rise stability.</p>
      <p style="margin:0;">Next step: <a href="2-track-aluminium-window-price">2-track</a> vs <a href="3-track-sliding-window">3-track</a> vs <a href="system-sliding-window-price">system</a> — pick track first, then series.</p>`),
  'wm-sliding-context-vs-casement'
);

// --- system vs normal — sliding maintenance angle (why-choose only; page has comparison table) ---
inject(
  path.join(AW, 'system-window-vs-normal-window.html'),
  '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
  whyBlock('Why System Sliding Beats Domal on Openings You Use Daily', `
      <p style="margin:0 0 1rem;"><strong>On sliding windows specifically:</strong> Domal tracks bend, seals flatten, and only wheels get replaced — system sliding lets you change track, wheel, or dust pad without removing the frame.</p>
      <p style="margin:0 0 1rem;"><strong>Best for system sliding:</strong> Any slider above 6 ft height, high-rise flats, and balcony doors used multiple times daily.</p>
      <p style="margin:0;">Domal still makes sense for <strong>low-floor budget bedrooms under 6 ft</strong> — see <a href="domal-window-price">Domal guide</a>. The comparison table above covers UPVC too.</p>`),
  'wm-why-choose-sliding-vs-normal'
);

// --- slimline: 25mm sliding series (educational on sliding upgrade path) ---
inject(
  path.join(AW, 'slimline-aluminium-window.html'),
  '  <!-- Q&A SECTION -->',
  whyBlock('Why Choose 25mm Slim System Sliding? (Series Guide)', `
      <p style="margin:0 0 1rem;"><strong>Note:</strong> This product page is a slim <em>casement</em> calculator — the 25mm slim <strong>sliding</strong> series uses the same profile depth class for <em>sliding</em> openings when you want a premium look below 29mm system price.</p>
      <p style="margin:0 0 1rem;"><strong>Best for sliding:</strong> Standard bedroom/living sizes on low and mid floors — proper interlock vs Domal, DGU up to 18mm, much less leakage than 27mm Domal.</p>
      <p style="margin:0;"><strong>Limit:</strong> Large 8–9 ft panels or high-rise — vibration possible; step to <a href="system-sliding-window-price">29mm system sliding</a>. Series details are in the section above.</p>`),
  'wm-why-choose-slimline-sliding'
);

// --- French sliding: add series context ---
inject(
  path.join(AW, '2-track-french-sliding-door.html'),
  '  <!-- FAQ SECTION -->',
  seriesBlock('French Sliding vs Plain 2-Track — Quick Difference', `
      <p><strong>Plain 2-track:</strong> Rectangular glass, lowest cost, any bedroom. <strong>French sliding:</strong> Arch or divided-light look, wider visual opening — spec’d for balcony-to-living and entrance bays, not bulk bedroom counts.</p>
      <p>Same 2-track mechanics (glass slides on tracks). Premium is in profile shape, glass layout, and optional <a href="french-door-georgian-bar">Georgian bars</a> (+₹3k–7k/panel).</p>`),
  'wm-sliding-context-french'
);

// --- Georgian bar: series context ---
inject(
  path.join(AW, 'french-door-georgian-bar.html'),
  '  <!-- FAQ SECTION -->',
  seriesBlock('Georgian Bar on French Sliding — What You Pay For', `
      <p>Georgian bars are <strong>aluminium grids</strong> on the glass — they stiffen large panes and give a classic premium face. We apply them on <strong>French sliding windows</strong> at entrance and balcony openings, not on standard bedroom Domal sliders.</p>
      <ul>
        <li><strong>Simple bar pattern:</strong> ~₹3,000–3,500 extra per panel</li>
        <li><strong>Complex pattern:</strong> ~₹5,000–7,000 extra per panel</li>
        <li><strong>Base window:</strong> <a href="2-track-french-sliding-door">French sliding</a> pricing first, then add bar cost</li>
      </ul>`),
  'wm-sliding-context-georgian'
);

// --- what is system window (sliding angle) ---
inject(
  path.join(AW, 'what-is-aluminium-system-window.html'),
  '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
  seriesBlock('System Window for Sliding — What Changes vs Local Make', `
      <p>A “system window” on sliding means the <strong>track, interlock, gasket, and wheel</strong> are one catalogue stack — not a shop cutting random profiles.</p>
      <div class="wm-compare-wrap">
        <table class="wm-compare-table">
          <thead><tr><th>Sliding type</th><th>System?</th><th>WoodenMax page</th></tr></thead>
          <tbody>
            <tr><td>27mm Domal 2/3-track</td><td>No — budget local</td><td><a href="domal-window-price">Domal guide</a></td></tr>
            <tr><td>29mm premium sliding</td><td>Partial — better than Domal</td><td><a href="aluminium-sliding-window">Premium sliding</a></td></tr>
            <tr><td>30–35mm certified system sliding</td><td>Yes — full stack</td><td><a href="system-sliding-window-price">System sliding</a></td></tr>
            <tr><td>38/40mm minimal sliding</td><td>Yes — villa / tower</td><td><a href="slim-aluminium-window-price-luxury">Minimal luxury</a></td></tr>
          </tbody>
        </table>
      </div>`) +
  whyBlock('Why “System” Matters Most on Sliding Windows', `
      <p style="margin:0 0 1rem;"><strong>Simple answer:</strong> Sliding fails at the track — system lines publish drainage paths, replaceable wheels, and gasket part numbers. Local Domal only swaps wheels.</p>
      <p style="margin:0 0 1rem;"><strong>Best for:</strong> Balcony doors, living sliders, and any opening you open/close daily in monsoon.</p>
      <p style="margin:0;">This page’s calculator is casement-based for a general system ₹ band — for sliding BOQ use <a href="aluminium-system-window-price">30mm system sliding</a> or <a href="system-sliding-window-price">35mm system sliding</a> calculators.</p>`),
  'wm-sliding-context-what-is-system'
);

// --- installation (sliding-specific) ---
inject(
  path.join(AW, 'system-window-installation.html'),
  '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
  seriesBlock('System Sliding Installation — Extra Steps vs Casement', `
      <ul>
        <li><strong>Track level:</strong> Sliding track must be dead level — 1 mm fall over 3 m shows as stuck panels.</li>
        <li><strong>Drain holes:</strong> Outer track weep holes cleared before handover — monsoon test mandatory on system sliding.</li>
        <li><strong>Panel weight:</strong> Large DGU panels need steel wheels — spec’d on <a href="system-sliding-window-price">35mm+ pages</a>, not on Domal.</li>
        <li><strong>4-track stacks:</strong> Install sequence matters — mesh track last; see <a href="4-track-sliding-window-price">4-track guide</a>.</li>
      </ul>
      <p>This page’s calculator uses <strong>40mm minimal sliding</strong> product id for the ₹1,150–2,650 band — install labour is quoted after site, on top of supply.</p>`) +
  whyBlock('Why Proper Sliding Install Saves Money Later', `
      <p style="margin:0 0 1rem;"><strong>Simple answer:</strong> Most “leaking slider” complaints are alignment and drainage — not glass. System install follows manufacturer fixing spacing.</p>
      <p style="margin:0 0 1rem;"><strong>Best for:</strong> New-build flats before plaster, villa balcony runs, and tower suites with lift access planned.</p>
      <p style="margin:0;">Budget Domal bedrooms can use simpler fix — but do not use Domal install method on <a href="system-sliding-window-price">system sliding</a> panels; interlock will not seat.</p>`),
  'wm-sliding-context-installation'
);

// --- glass options (sliding weight / series) ---
inject(
  path.join(AW, 'system-window-glass-options.html'),
  '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
  seriesBlock('Glass on System Sliding — Series Limits (Honest)', `
      <div class="wm-compare-wrap">
        <table class="wm-compare-table">
          <thead><tr><th>Sliding series</th><th>Typical max glass</th><th>When to upgrade series</th></tr></thead>
          <tbody>
            <tr><td>27mm Domal</td><td>Single 5–6 mm</td><td>Never DGU on large panel</td></tr>
            <tr><td>29mm premium</td><td>DGU to ~20 mm</td><td>Standard flat sliders</td></tr>
            <tr><td>35mm system</td><td>DGU + laminate options</td><td>High-rise, daily balcony</td></tr>
            <tr><td>38/40mm minimal</td><td>Heavy DGU / triple</td><td>12 ft height walls</td></tr>
          </tbody>
        </table>
      </div>
      <p>Calculator on this page follows <strong>29mm sliding</strong> glass adders — same dropdown behaviour as <a href="aluminium-sliding-window">premium sliding</a>.</p>`) +
  whyBlock('Why Glass Choice Hits Sliding More Than Casement', `
      <p style="margin:0 0 1rem;"><strong>Simple answer:</strong> Sliding panels hang on wheels — heavy DGU on Domal bends tracks; system series are rated for the glass you pick in the dropdown.</p>
      <p style="margin:0 0 1rem;"><strong>Best for India:</strong> Bedroom 3-track — 6 mm + mesh; living/balcony system sliding — DGU for noise and heat.</p>
      <p style="margin:0;">Triple IGU only when acoustic brief demands it — pair with <a href="slim-aluminium-window-price-luxury">40mm minimal</a> on tall openings, not Domal.</p>`),
  'wm-sliding-context-glass-options'
);

// --- brands india (sliding comparison lens) ---
inject(
  path.join(AW, 'aluminium-system-window-brands-india.html'),
  '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
  seriesBlock('Compare Brands on System Sliding (Not Powder Colour Alone)', `
      <p>Architects compare brands on <strong>sliding series depth</strong>, type-test reports, and spare availability for track/wheel — ask every vendor for the same:</p>
      <ul>
        <li>29mm vs 35mm sliding catalogue PDF (not casement only)</li>
        <li>Max panel weight chart for your glass build-up</li>
        <li>Part numbers for track, wheel, dust pad, interlock gasket</li>
        <li>Installed project refs with <a href="3-track-sliding-window">3-track</a> or <a href="4-track-sliding-window-price">4-track</a> on your floor height</li>
      </ul>
      <p>WoodenMax supplies multiple OEM stacks — final brand follows your drawing and ₹ band (₹1,250–2,950/sqft on this page).</p>`) +
  whyBlock('Why Brand Comparison Matters for Sliding Projects', `
      <p style="margin:0 0 1rem;"><strong>Simple answer:</strong> Two quotes at ₹1,400/sqft can be Domal shop work vs 35mm system — brand name on powder is not the comparison.</p>
      <p style="margin:0 0 1rem;"><strong>Best for:</strong> Tower BOQs, villa living stacks, and any schedule with more than 20 identical sliders.</p>
      <p style="margin:0;">Use this page’s casement calculator for a parallel ₹ check — then lock sliding numbers on <a href="system-sliding-window-price">system sliding</a> with the same glass spec.</p>`),
  'wm-sliding-context-brands'
);

// --- glass price breakdown (sliding calculator link) ---
inject(
  path.join(AW, 'aluminium-window-glass-price-breakdown.html'),
  '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
  seriesBlock('Glass Adders on Sliding Calculators — How to Read This Page', `
      <p>Glass ₹/sqft here is <strong>additive</strong> to frame — on sliding, frame band depends on series first:</p>
      <ul>
        <li><strong>Domal slider + 6 mm:</strong> lowest total — <a href="3-track-sliding-window">3-track calculator</a></li>
        <li><strong>29mm + DGU:</strong> mid band — <a href="aluminium-sliding-window">premium sliding</a></li>
        <li><strong>35mm system + laminated DGU:</strong> upper band — <a href="system-sliding-window-price">system sliding</a></li>
      </ul>
      <p>Use this breakdown to understand glass lines; use the product calculator for frame + hardware + install context.</p>`) +
  whyBlock('Why Sliding Owners Should Model Glass in the Calculator', `
      <p style="margin:0 0 1rem;"><strong>Simple answer:</strong> Upgrading from 6 mm to DGU can add ₹150–400/sqft — on a 6×7 ft slider that is ₹6,000–17,000 per opening before frame tier.</p>
      <p style="margin:0 0 1rem;"><strong>Best for:</strong> Comparing bedroom mesh track (single glass) vs living DGU on the same size opening.</p>
      <p style="margin:0;">After glass choice, match series to weight — heavy glass on Domal is the most common post-install regret.</p>`),
  'wm-sliding-context-glass-breakdown'
);

console.log('Done.');
