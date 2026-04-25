/**
 * One-off generator: 10 "system window" SEO pages with unique copy,
 * 2 images + alts per page, alternating 29mm-sliding vs top-hung-casement calculators.
 * Run: node tools/build-system-window-pages.cjs
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const p2 = fs.readFileSync(
  path.join(root, "products/aluminium-windows/2-track-aluminium-window-price.html"),
  "utf8"
);
const pCase = fs.readFileSync(
  path.join(root, "products/aluminium-windows/aluminium-casement-window-price.html"),
  "utf8"
);

function extract29(containerId) {
  const a = p2.indexOf('<div id="price-calculator-seo-2track"');
  const b = p2.indexOf("<!-- Trust Bar -->", a);
  const c = p2.lastIndexOf("          </div>\n", p2.indexOf("  </section>\n\n  <section", a + 10));
  const block = p2.slice(a, c + "          </div>\n".length);
  return block
    .replace("price-calculator-seo-2track", containerId)
    .replace("price-calculator-seo-2track", containerId);
}

function extractCasement(containerId) {
  const a = pCase.indexOf('<div id="price-calculator-seo-casement-price"');
  const c = pCase.indexOf("      </div>\n    </div>\n  </section>\n\n  <section", a);
  const block = pCase.slice(a, c);
  return block.replace("price-calculator-seo-casement-price", containerId);
}

// Verify extraction once
if (!extract29("x").includes("data-product=")) {
  throw new Error("29mm block extraction failed");
}
if (!extractCasement("x").includes("top-hung-casement")) {
  throw new Error("casement block extraction bad — check file markers");
}

function injectCalcProduct(block, calc, productId) {
  if (calc === "29mm") {
    return block.replace('data-product="29mm-sliding"', `data-product="${productId}"`);
  }
  return block.replace('data-product="top-hung-casement"', `data-product="${productId}"`);
}

/** India system-window SEO: each page has its own band (within ~₹1150–₹3000) for unique SEO + schema */
const DEFAULT_PM = 1150;
const DEFAULT_PX = 3000;

const SEO_TITLE = {
  "aluminium-system-window-price": "Aluminium System Window Price",
  "what-is-aluminium-system-window": "What is Aluminium System Window",
  "system-window-vs-normal-window": "System Window vs Normal Window",
  "aluminium-system-window-brands-india": "Aluminium System Window Brands India",
  "system-sliding-window-price": "System Sliding Window Price",
  "system-casement-window-price": "System Casement Window Price",
  "slim-system-window-price": "Slim System Window Price",
  "system-window-installation": "System Window Installation & Cost",
  "system-window-glass-options": "System Window Glass Options & Price",
  "system-window-for-villa": "System Window for Villa & Luxury Homes",
};

function getPageTitle(slug, priceMin, priceMax) {
  const base = SEO_TITLE[slug] || slug.replace(/-/g, " ");
  return `${base} ₹${priceMin}–${priceMax}/sqft (2026) | WoodenMax`;
}

function getMetaDescription(baseDesc, priceMin, priceMax) {
  const priceBit = ` Certified system window packages in India for this topic are often planned between ₹${priceMin} and ₹${priceMax} per sq.ft (2026, before GST).`;
  const merged = (baseDesc || "").trim() + priceBit;
  return merged.length > 300 ? merged.slice(0, 297) + "…" : merged;
}

function bandRows(pm, px) {
  const span = px - pm;
  const t1 = Math.round(pm + span * 0.28);
  const t2 = Math.round(pm + span * 0.62);
  return {
    rangeE: `₹${pm.toLocaleString("en-IN")} – ${"₹" + t1.toLocaleString("en-IN")}`,
    rangeM: `₹${t1.toLocaleString("en-IN")} – ${"₹" + t2.toLocaleString("en-IN")}`,
    rangeH: `₹${t2.toLocaleString("en-IN")} – ${"₹" + px.toLocaleString("en-IN")}`,
  };
}

function expandPrices(html, pm, px) {
  return String(html).replace(/__PM__/g, String(pm)).replace(/__PX__/g, String(px));
}

function comparisonSection(p) {
  const pm = p.priceMin ?? DEFAULT_PM;
  const px = p.priceMax ?? DEFAULT_PX;
  const br = bandRows(pm, px);
  const prof = p.profileLabel || "";
  const isSlide = p.calc === "29mm";
  const rowA = isSlide
    ? `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.6rem;">${prof} (system sliding)</td><td style="padding:0.6rem;">${p.calcBandNote || "Most projects land in this strip; DGU and mesh add upward"}</td><td style="padding:0.6rem;">Balcony, living screens — 30/31/35 Gulf / 40mm minimal class stacks</td></tr>`
    : `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.6rem;">${prof} (50/52 system casement)</td><td style="padding:0.6rem;">${p.calcBandNote || "Mid–upper in strip with DGU + multipoint"}</td><td style="padding:0.6rem;">Vents: Euro / Gulf profiles, smooth operation, long life</td></tr>`;
  const rowB = isSlide
    ? `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.6rem;">50mm Euro / 52mm Gulf casement</td><td style="padding:0.6rem;">Often mid–upper vs sliding on one elevation</td><td style="padding:0.6rem;"><a href="system-casement-window-price" style="color:#1d4ed8;">System casement</a></td></tr>`
    : `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.6rem;">30/31/35 Gulf / 40mm minimal sliding</td><td style="padding:0.6rem;">Varies with track + glass</td><td style="padding:0.6rem;"><a href="system-sliding-window-price" style="color:#1d4ed8;">System sliding</a></td></tr>`;
  return `<section id="system-rate-comparison" class="system-window-compare" style="padding:3rem 0;background:#ecfeff;" aria-label="System window price comparison India">
    <div class="container" style="max-width:960px;">
      <h2 class="section-title">Aluminium system window — ₹/sqft comparison (this page’s band)</h2>
      <p style="color:#334155;line-height:1.75;max-width:900px;">This guide uses a <strong>dedicated ₹${pm}–₹${px} / sq.ft</strong> planning strip (supply + install, before GST). <strong>Package focus:</strong> ${p.packageHint} Broader market context often quotes ~₹1150–₹3000 for certified system work — the tables below are a tighter, page-specific slice for SEO and BOQ notes.</p>
      <div style="overflow-x:auto;margin-top:1rem;">
        <table style="width:100%;border-collapse:collapse;font-size:0.92rem;background:#fff;border:1px solid #e2e8f0;">
          <thead>
            <tr style="background:#0f172a;color:#f8fafc;">
              <th style="padding:0.7rem;text-align:left;">Spec band</th>
              <th style="padding:0.7rem;text-align:left;">Indicative ₹/sqft (this page)</th>
              <th style="padding:0.7rem;text-align:left;">What is included</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Entry system</td><td style="padding:0.65rem;">${br.rangeE}</td><td style="padding:0.65rem;">6mm, standard powder, basic hardware, metro install</td></tr>
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Mid premium</td><td style="padding:0.65rem;">${br.rangeM}</td><td style="padding:0.65rem;">DGU / 8–12mm / laminated as spec, better rollers, coastal-ready option</td></tr>
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">High spec</td><td style="padding:0.65rem;">${br.rangeH}</td><td style="padding:0.65rem;">Heavy IGU, import hardware, large panels, difficult access / tower labour</td></tr>
          </tbody>
        </table>
      </div>
      <h3 style="margin:1.75rem 0 0.75rem;font-size:1.1rem;color:#0f172a;">System type quick comparison</h3>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.9rem;background:#fff;border:1px solid #e2e8f0;">
          <thead>
            <tr style="background:#1e3a5f;color:#fff;">
              <th style="padding:0.6rem;text-align:left;">Type</th>
              <th style="padding:0.6rem;text-align:left;">On this page’s ₹${pm}–${px} strip</th>
              <th style="padding:0.6rem;text-align:left;">When architects specify it</th>
            </tr>
          </thead>
          <tbody>
            ${rowA}
            ${rowB}
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.6rem;">Slim / luxury system</td><td style="padding:0.6rem;">Upper part of the strip</td><td style="padding:0.6rem;"><a href="slim-system-window-price" style="color:#1d4ed8;">Slim system</a></td></tr>
            <tr><td style="padding:0.6rem;">Ad-hoc “normal” make</td><td style="padding:0.6rem;">Often <strong>below</strong> ~₹1150/sqft — not same class</td><td style="padding:0.6rem;"><a href="system-window-vs-normal-window" style="color:#1d4ed8;">System vs normal</a></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>`;
}

const pages = [
  {
    slug: "aluminium-system-window-price",
    calc: "29mm",
    calcId: "price-calculator-sys-awprice",
    priceMin: 1180,
    priceMax: 2680,
    productId: "system-sliding-30mm",
    profileLabel: "30mm system sliding (India line)",
    packageHint: "Reference BOQ: 6mm clear + standard track. DGU and thicker lites: priced in the tool as upgrades, not auto-bundled in the headline.",
    calcBandNote: "Lower two-thirds of this strip for single-lite + std hardware paths",
    calcTagline: "tool label matches 30mm system sliding — not the generic 29mm copy on older pages.",
    h1: "Aluminium System Window Cost & Features in India",
    desc: "Aluminium system window price in India 2026: brand-grade profiles, DGU options, and realistic ₹/sqft bands for premium facades. Live 30mm system sliding calculator + expert quote.",
    imgDir: "Aluminium System Window Price",
    images: [
      { file: "aluminium-system-window-modern-design.webp", alt: "aluminium system window modern design premium home" },
      { file: "system-window-frame-detail-premium.webp", alt: "aluminium system window frame detail high quality" },
    ],
    productName: "Aluminium system window — India price & 30mm system sliding calculator",
    intro: `<p style="color:#334155;line-height:1.85;">A <strong>system window</strong> (sometimes called a system profile window) is engineered as a <em>tested stack</em>: section design, gaskets, hardware pockets, and drainage paths work as one. That is why premium projects separate <strong>system window price</strong> from generic “local make” shop windows. For Indian metros in 2026, this page’s planning range is <strong>₹__PM__–₹__PX__/sq.ft</strong> (before GST) depending on <strong>30/31/35 Gulf / 40mm</strong> class lines, glass, and hardware — use the live tool (30mm id on this URL), then send drawings for a system-specific BOQ.</p>
      <div style="overflow-x:auto;margin-top:1rem;"><table style="width:100%;border-collapse:collapse;font-size:0.95rem;background:#fff;border:1px solid #e2e8f0;"><thead><tr style="background:#1e3a5f;color:#fff;"><th style="padding:0.65rem;text-align:left;">System window tier</th><th style="padding:0.65rem;text-align:left;">Indicative ₹/sqft (within band)</th></tr></thead><tbody>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">30mm class — 6mm + standard hardware, powder</td><td style="padding:0.65rem;">lower half of this page’s strip</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Premium — DGU, imported rollers / multipoint, coastal</td><td style="padding:0.65rem;">upper half of this page’s strip</td></tr>
      </tbody></table></div>`,
    draw: "Section labelling: outer frame, thermal break (where used), pressure plates, and drainage outlet — details change by OEM.",
    types: `<h3>System vs “normal” aluminium</h3><p>Normal fabricator windows may mix loose sections. System windows are specified with a defined U-value target, water rating, and hardware schedule — see <a href="system-window-vs-normal-window">system vs normal comparison</a>.</p><h3>Sliding vs casement in system</h3><p>Sliding suits balconies; casement and parallel windows suit catch-breeze bath and bed vents — pair with <a href="system-casement-window-price">system casement pricing</a>.</p><h3>Glass and hardware levers</h3><p>Upgrading from 6mm to DGU or laminated often forces multipoint / heavier hinges — the calculator line items reflect a common 29mm stack.</p>`,
    breakdown: `<h3>System profile and coating</h3><p>Series depth (e.g. 29mm) and alloy temper drive metal weight, then finish class adds cost.</p><h3>Glazing</h3><p>Single, DGU, or triple build-ups shift ₹/sqft more than the frame in many high-rise facades — see <a href="system-window-glass-options">glass options page</a>.</p><h3>Hardware and labour</h3><p>Branded friction stays, multipoint, and site tolerances in RCC openings add installation hours.</p><h3>Brand documentation</h3><p>Architects often need test certificates — that overhead sits in the system premium.</p>`,
    comp: `<h3>System vs non-system on price</h3><p>Non-system may win on first quote, but system packages reduce callbacks on air, water, and rattle in tall buildings.</p><h3>29mm stack vs 27mm Domal</h3><p>Domal-style lighter sections fit many apartments; 29mm premium lines fit heavier glass in luxury slabs.</p><h3>When brand matters</h3><p>Corner deflection, locking sequence, and gasket replacement paths favour certified systems on villas.</p>`,
    use: `<ul style="line-height:1.9;color:#334155;"><li><strong>High-end apartments &amp; seafront:</strong> pressure-equalised system frames + safety glass.</li><li><strong>Offices with acoustic targets:</strong> DGU and laminated plies, sealed vent pattern.</li><li><strong>Architect show homes:</strong> flush tracks and concealed hinges — use <a href="system-window-for-villa" style="color:#fbbf24;">villa &amp; luxury guide</a>.</li></ul>`,
    faq: [
      ["What is the aluminium system window price per sqft in 2026?", "This page is scoped to about ₹__PM__–₹__PX__/sq.ft (before GST) for its topic; wider market context can reach ~₹1150–₹3000. The live tool uses the 30mm system sliding product so your BOQ name matches the guide — then we validate net sizes on drawing."],
      ["Is a system window always 29mm?", "Not always — 29mm is a common premium sliding class in India, but other OEM depths exist. The important part is a documented section with compatible hardware, not a single number."],
      ["How does DGU change the rate?", "Double glazing changes weight and often forces stronger hardware, which moves both profile weight and per-window lock upgrades — we spell this out in the glass cluster page and calculator adders."],
      ["Does WoodenMax supply and install system windows across India?", "Yes — we fabricate and install in major Indian cities. Use the calculator, then share drawing PDFs, wind class, and city so we can align to the right certified system and quote after site check."],
    ],
  },
  {
    slug: "what-is-aluminium-system-window",
    calc: "case",
    calcId: "price-calculator-sys-whatis",
    priceMin: 1220,
    priceMax: 2850,
    productId: "system-casement-50mm-euro-guide",
    profileLabel: "50mm Euro system casement",
    packageHint: "Guide stack: 6mm clear base. 50mm Euro: long service life, smooth stays — multipoint when glass / wind load needs it (see tool).",
    calcBandNote: "Upper half of strip when DGU + multipoint on vents",
    calcTagline: "calculator title shows 50mm Euro (guide) so users don’t see the old “top hung” name only.",
    h1: "Aluminium System Window Explained (Complete Guide)",
    desc: "What is an aluminium system window: profiles, gaskets, hardware, and tested performance vs ad-hoc fabrication. 2026 India price context + premium casement calculator.",
    imgDir: "What is System Window",
    images: [
      { file: "what-is-aluminium-system-window-diagram.png", alt: "what is aluminium system window explained diagram" },
      { file: "system-window-components-breakdown.webp", alt: "aluminium system window components frame glass hardware" },
    ],
    productName: "What is an aluminium system window (guide + calculator)",
    intro: `<p style="color:#334155;line-height:1.85;">If someone asks <strong>“what is aluminium system window”</strong>, the short answer: it is a <em>defined OEM window line</em> with engineered sections, gaskets, and hardware that were tested together for air/water and operation — not a random extrusion + glass build on site. Benefits include predictable drainage, slimmer internal clutter at the same wind load, and replacement parts. For India 2026, this page’s <strong>₹__PM__–₹__PX__/sq.ft</strong> band (before GST) is for planning. The live tool is named <strong>50mm Euro system casement</strong> — long hardware life, smooth operation — a fair proxy where vent windows dominate.</p>
      <div style="overflow-x:auto;margin-top:1rem;"><table style="width:100%;border-collapse:collapse;font-size:0.95rem;background:#fff;border:1px solid #e2e8f0;"><thead><tr style="background:#1e3a5f;color:#fff;"><th style="padding:0.65rem;text-align:left;">Topic</th><th style="padding:0.65rem;text-align:left;">Why it matters</th></tr></thead><tbody>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Gasket + drainage system</td><td style="padding:0.65rem;">Reduces capillary water paths vs loose glazing shoes.</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">OEM hardware pockets</td><td style="padding:0.65rem;">Hinges, stays, and espag align without field grinding.</td></tr>
      </tbody></table></div>`,
    draw: "Think of a system as a kit of validated parts. Your elevation becomes a set of type drawings — each mark references the OEM’s detail number.",
    types: `<h3>Key components</h3><p>Outer frame, vent or sash, glazing beads, gaskets, drainage slots, and hardware — the diagram on this page shows how they relate before site tolerance.</p><h3>System vs non-system</h3><p>See <a href="system-window-vs-normal-window">system vs regular aluminium</a> for a price–performance split.</p><h3>AI / “people also ask” answers</h3><p>Yes, system windows are suitable for most Indian climates; pick coating class for coastal and high PM cities.</p>`,
    breakdown: `<h3>Engineering and documentation</h3><p>Time spent on structural verification and water testing is part of the “system” fee.</p><h3>Material grade</h3><p>6063 T6, wall thickness, and reinforcement pieces differ from off-brand scrap mixes.</p><h3>Site execution</h3><p>Template fixing, shimming, and silicone gunning follow OEM sequence — not optional if you want the rated performance.</p><h3>Lifecycle</h3><p>Replacement gaskets and hardware spares are easier on branded systems — mention this to homeowners comparing quotes.</p>`,
    comp: `<h3>System vs normal</h3><p>Non-system can look similar day one; the gap shows under driving rain, acoustic tests, and long-cycle operation. Read <a href="aluminium-system-window-price">system window price index</a>.</p><h3>Guide vs product page</h3><p>Here we keep theory to one screen; the brand list page names OEM categories.</p><h3>29mm vs casement</h3><p>Use sliding calculator pages for 29mm stacks; this page’s casement tool covers vent-dominant schedules.</p>`,
    use: `<ul style="line-height:1.9;color:#334155;"><li><strong>Design workshops:</strong> give architects vocabulary for spec sheets.</li><li><strong>First-time home builders:</strong> understand why two ₹/sqft numbers both look “right”.</li><li><strong>Offices with LEED / IGBC:</strong> align U-factor targets with a certified line.</li></ul>`,
    faq: [
      ["What is a system window in simple words?", "A system window is a manufacturer’s complete, tested line of frames and hardware for a specific performance class, rather than a one-off cut-and-build frame on site."],
      ["Is every branded window a system window?", "Not always — a brand name on powder alone is not a system. Look for a catalogue with structural charts, gaskets, and hardware part numbers that belong together."],
      ["What benefits matter most in India?", "Water control during monsoon, hardware durability in dust, and serviceability in 5–7 years when gaskets need refresh."],
      ["How do I get a 2026 price for my project?", "Run the casement-based calculator for vent-heavy schedules, and share elevations so we can slot sliding system marks where required."],
    ],
  },
  {
    slug: "system-window-vs-normal-window",
    calc: "29mm",
    calcId: "price-calculator-sys-vsnorm",
    priceMin: 1160,
    priceMax: 2720,
    productId: "system-sliding-31mm",
    profileLabel: "31mm system sliding",
    packageHint: "Comparison at 8mm clear tier; laminated in tool when you pick safety/ acoustic builds.",
    calcBandNote: "System side sits inside this band; “normal” shops often undercut on dry internal vents only",
    calcTagline: "31mm system sliding in the app — for apples-to-apples against non-system quotes.",
    h1: "Difference Between System Window and Regular Aluminium Window",
    desc: "System window vs normal aluminium: engineering, water rating, and why ₹/sqft bands diverge. 29mm calculator + 2026 India comparison for architects and owners.",
    imgDir: "System vs Normal Window",
    images: [
      { file: "system-window-vs-normal-window-comparison.webp", alt: "system window vs normal aluminium window comparison" },
      { file: "premium-vs-regular-window-difference.webp", alt: "difference between system and regular aluminium window" },
    ],
    productName: "System vs normal aluminium window — 2026 comparison + calculator",
    intro: `<p style="color:#334155;line-height:1.85;">The <strong>system window vs normal window</strong> question is really about <em>verified performance vs lowest first cost</em>. A “normal” aluminium window might use generic sections and field shortcuts; a system window is bought as a performance line with gaskets, tested drainage, and hardware matched to the section. In 2026 India, non-system shop work can still quote <strong>below ~₹1150/sq.ft</strong> for dry internal openings, while <strong>certified system</strong> facades for premium projects are usually modelled in the <strong>₹__PM__–₹__PX__/sq.ft</strong> band (before GST) for supply + install. The <strong>31mm system sliding</strong> calculator on this page anchors the premium track stack for fair comparison to “normal” quotes.</p>
      <div style="overflow-x:auto;margin-top:1rem;"><table style="width:100%;border-collapse:collapse;font-size:0.95rem;background:#fff;border:1px solid #e2e8f0;"><thead><tr style="background:#1e3a5f;color:#fff;"><th style="padding:0.65rem;text-align:left;">Item</th><th style="padding:0.65rem;">Normal make</th><th style="padding:0.65rem;">System line</th></tr></thead><tbody>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Monsoon water paths</td><td style="padding:0.65rem;">Variable site fixes</td><td style="padding:0.65rem;">OEM gaskets + weeps</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Hardware matching</td><td style="padding:0.65rem;">Adapters common</td><td style="padding:0.65rem;">Native pockets</td></tr>
      </tbody></table></div>`,
    draw: "Side-by-side: equal glass area but different frame depth, gasket position, and roller vs hinge hardware.",
    types: `<h3>When normal is acceptable</h3><p>Internal dry areas, low wind, and simple sliders — cost wins if performance risk is low.</p><h3>When to insist on a system</h3><p>Seafront, high floor, or acoustic targets — the failure cost exceeds the first-quote delta.</p><h3>Sliding as reference</h3><p>Our 29mm tool models a premium track stack; casement “system” quotes often align to <a href="system-casement-window-price">system casement price</a>.</p>`,
    breakdown: `<h3>Aluminium section cost</h3><p>System lines carry alloy + finish discipline; some normal shops optimise weight to a fault.</p><h3>Glass risk</h3><p>Heavy DGU in a under-sized vent is a safety issue — system schedules pick the right profile class.</p><h3>Install method</h3><p>Brackets, shims, and sequence — system installers follow OEM; ad-hoc teams improvise.</p><h3>Warranty language</h3><p>Systems quote against a type test; “normal” quotes rarely reference a water class.</p>`,
    comp: `<h3>₹/sqft vs lifecycle</h3><p>Non-system can look cheaper for three seasons; the comparison table above shows where risk sits.</p><h3>Brand vs unbranded</h3><p>See <a href="aluminium-system-window-brands-india">brands in India</a> for a neutral map.</p><h3>Switching mid-project</h3><p>Stone reveal and FFL often lock early — pick system vs normal before chiselling the RCC pocket.</p>`,
    use: `<ul style="line-height:1.9;color:#334155;"><li><strong>GC / builder:</strong> de-risk handover with fewer leak tickets.</li><li><strong>Renovation:</strong> if you are touching old wood, a system class window + silicone spec pays back.</li><li><strong>Apartment body corporate:</strong> common-area replacements benefit from a documented system.</li></ul>`,
    faq: [
      ["Is a normal aluminium window always bad quality?", "No — honest fabricators with good site discipline can be fine in low load applications. The issue is lack of a verified performance package when the building needs one."],
      ["Why is system window cost higher?", "Tested gaskets, alloy discipline, and compatible hardware, plus the documentation and installation sequence that preserves the water rating."],
      ["Can I mix system and non-system in one home?", "You can, but water lines and sightlines can mismatch — at least use system for exposed façades and high floors."],
      ["What calculator should I use after reading this page?", "Use the 29mm field on this page for a premium sliding feel; for vent-heavy projects use a casement-oriented page in the system cluster."],
    ],
  },
  {
    slug: "aluminium-system-window-brands-india",
    calc: "case",
    calcId: "price-calculator-sys-brands",
    priceMin: 1250,
    priceMax: 2950,
    productId: "system-casement-52mm-gulf-brands",
    profileLabel: "52mm Gulf system casement",
    packageHint: "Brand comparisons: 52mm Gulf + DGU packages often mark the top half of a serious system BOQ (tool reflects adders).",
    calcBandNote: "Coastal / large-DGU facades trend toward the top of the strip",
    calcTagline: "calculator reads “52mm Gulf (brands)” so it matches this brand-comparison page.",
    h1: "Top System Window Brands & Price Comparison",
    desc: "Best aluminium system window brands in India: what architects compare (tests, spares, hardware), 2026 price bands, and how to get a premium project quote. Casement-based calculator for parallel estimates.",
    imgDir: "System Window Brands",
    images: [
      { file: "aluminium-system-window-brands-india.webp", alt: "best aluminium system window brands in india" },
      { file: "premium-window-brand-installation.webp", alt: "branded system window installation modern home" },
    ],
    productName: "Aluminium system window brands in India (comparison)",
    intro: `<p style="color:#334155;line-height:1.85;">Searching <strong>aluminium system window brands in India</strong> usually means you need a spec shortlist, not a showroom tour. In 2026, architect-led and premium residential <strong>system</strong> quotes for this page sit in the <strong>₹__PM__–₹__PX__/sq.ft</strong> strip (before GST) depending on wind load, DGU, and hardware class — the exact OEM logo matters less than type tests, gaskets, and trained installers. The calculator is labelled <strong>52mm Gulf system casement</strong> as a <strong>vent-window proxy</strong>; pair with a 30/31/35/40mm sliding BOQ for mixed elevations.</p>
      <div style="overflow-x:auto;margin-top:1rem;"><table style="width:100%;border-collapse:collapse;font-size:0.95rem;background:#fff;border:1px solid #e2e8f0;"><thead><tr style="background:#1e3a5f;color:#fff;"><th style="padding:0.65rem;text-align:left;">Check</th><th style="padding:0.65rem;text-align:left;">What good looks like</th></tr></thead><tbody>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Documentation</td><td style="padding:0.65rem;">Type test references for air/water; structural span charts.</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Service</td><td style="padding:0.65rem;">Gasket and roller spares 7+ years from install.</td></tr>
      </tbody></table></div>`,
    draw: "Brand value is in repeatable installation — the photo shows a clean stack height and aligned sight lines.",
    types: `<h3>What we optimise for you</h3><p>WoodenMax routes projects to the right system depth for glass weight and city wind map — we are brand-agnostic in conversation but strict on documentation.</p><h3>Price vs country of origin</h3><p>Some EU hardware pairs with Indian extrusions; others are fully import — the spreadsheet changes.</p><h3>Don’t spec from catalogue photos alone</h3><p>Read <a href="what-is-aluminium-system-window">what is a system window</a> to align language with your consultant.</p>`,
    breakdown: `<h3>Line items in a “brand” quote</h3><p>Alloy, glass, hardware, EPDM, installation, and silicone class — if one line is zero, you are not comparing fairly.</p><h3>Coastal surcharge</h3><p>Marine grade powder / anodise adds predictable ₹/ft on metal.</p><h3>Project scale</h3><p>Repeat type marks reduce non-recurring engineering per opening.</p><h3>Lead time</h3><p>Import hardware in 2026 can still be the critical path after glass approval.</p>`,
    comp: `<h3>Local fabricator vs certified line</h3><p>See <a href="system-window-vs-normal-window">system vs normal</a> for the quality delta.</p><h3>One brand for sliding + casement</h3><p>Often one OEM covers both, but not always; mixed-brand elevations need stricter line control at corners.</p><h3>₹-only shortlists are risky</h3><p>Compare water class, not just lowest bid.</p>`,
    use: `<ul style="line-height:1.9;color:#334155;"><li><strong>Architect studios:</strong> pre-bill of quantities with system codes.</li><li><strong>High ticket homes:</strong> want auditable spec for resale.</li><li><strong>Developers on repeat floor plates:</strong> value spare-part strategy.</li></ul>`,
    faq: [
      ["How do I compare aluminium system window brands fairly?", "Ask for the same glass build-up, wind load, and hardware tier on every quote — then compare type-test references and install methodology, not just ₹/sqft."],
      ["Are imported systems always better?", "Not always — many Indian OEM lines meet performance if installation follows published details. Import often wins on hardware feel and long-span engineering."],
      ["Can WoodenMax work with a brand my architect already specified?", "In most cases, yes — share PDF details so we can partner with the right fabricator and validate anchorage for your site."],
      ["What calculator is on this page?", "Premium casement (40mm class) for vent windows — add sliding system rows from the system sliding price page for a full elevation mix."],
    ],
  },
  {
    slug: "system-sliding-window-price",
    calc: "29mm",
    calcId: "price-calculator-sys-sliding",
    priceMin: 1200,
    priceMax: 2780,
    productId: "system-sliding-35mm-gulf",
    profileLabel: "35mm Gulf system sliding",
    packageHint: "Gulf interlock + tandem roller story: 6mm in base; DGU priced as a clear upgrade in the same stack.",
    calcBandNote: "Large sliders with DGU push toward the upper part of the strip",
    calcTagline: "tool uses the 35mm Gulf product id for this page’s BOQ language.",
    h1: "Aluminium System Sliding Window Cost Guide",
    desc: "System sliding window price in India 2026: large openings, track hardware, and realistic ₹/sqft for premium 29mm class. Live sliding calculator and quote path.",
    imgDir: "System Sliding Window",
    images: [
      { file: "system-sliding-window-large-opening.webp", alt: "aluminium system sliding window large opening design" },
      { file: "system-sliding-window-large-sliding-opening.webp", alt: "system sliding window track detail smooth sliding" },
    ],
    productName: "System sliding window — India price (29mm)",
    intro: `<p style="color:#334155;line-height:1.85;">A <strong>system sliding window</strong> (sometimes written “system sliding” on drawings) is built around interlocking tracks, tandem rollers, and gaskets that were designed for the section depth you specify. For 2026 India, this page’s <strong>₹__PM__–₹__PX__/sq.ft</strong> strip (before GST) plans premium jobs with DGU, mesh, and multipoint as adders. The on-page product id is <strong>35mm Gulf system sliding</strong> — not Domal 27mm — for brand-grade slabs; for mesh-heavy tracks, also compare with <a href="3-track-sliding-window">3 track sliding</a> when you run a second variant.</p>
      <div style="overflow-x:auto;margin-top:1rem;"><table style="width:100%;border-collapse:collapse;font-size:0.95rem;background:#fff;border:1px solid #e2e8f0;"><thead><tr style="background:#1e3a5f;color:#fff;"><th style="padding:0.65rem;text-align:left;">Large opening item</th><th style="padding:0.65rem;text-align:left;">Cost driver</th></tr></thead><tbody>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Tandem stainless rollers</td><td style="padding:0.65rem;">Panel weight and soft-close hardware</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Interlock + mesh option</td><td style="padding:0.65rem;">Track stack height, insect goals</td></tr>
      </tbody></table></div>`,
    draw: "Track section with drainage slot and interlock: system sliding is about water control while the panel is partially open in rain.",
    types: `<h3>2, 3, or 4 track within “system”</h3><p>More tracks add mesh paths or more glass leaves — the elevation grid decides. Start from room function, not track count.</p><h3>System sliding vs system casement</h3><p>See <a href="system-casement-window-price">system casement price</a> when cross-vent and sealing beat clear opening area.</p><h3>Slimline sliding</h3><p>Ultra-slim mullions move you toward <a href="slim-system-window-price">slim system</a> price territory.</p>`,
    breakdown: `<h3>Track and roller class</h3><p>Stainless, sealed bearings, and buffer stops scale with DGU weight.</p><h3>Glass</h3><p>Large sliders often need safety plies in habitable areas — the calculator’s glass adders are a first pass.</p><h3>Labour and access</h3><p>Floor loading, craning, and edge protection in towers add soft cost not inside ₹/ft.</p><h3>Silicone and spacers</h3><p>Structural vs weathering silicones are line items in serious BOQs — ask during quote.</p>`,
    comp: `<h3>System sliding vs normal sliding</h3><p>Water management and long-run roller noise separate the two — read <a href="system-window-vs-normal-window">system vs normal</a>.</p><h3>29mm here vs 27mm on other pages</h3><p>Domal economy tracks exist for rental-grade budgets; this page targets the premium 29mm feel.</p><h3>When casement wins</h3><p>Small high vents with acoustic targets — not every opening should slide.</p>`,
    use: `<ul style="line-height:1.9;color:#334155;"><li><strong>Living-to-balcony glass walls:</strong> where width matters more than swing arc.</li><li><strong>Seaside villas:</strong> combine coated extrusions with DGU in the same system.</li><li><strong>Offices with floor plates:</strong> lock stack height for HVAC zoning.</li></ul>`,
    faq: [
      ["What is the system sliding window price per sqft in 2026?", "This page is written for about ₹__PM__–₹__PX__/sq.ft (before GST) for 35mm Gulf-type system sliding; India-wide certified work can still be discussed in a ~₹1150–₹3000 context — the calculator is your first number; DGU, mesh, and access move you in the strip."],
      ["Is 29mm sliding the same as a system window?", "29mm is a common premium class for sliding; “system” still implies OEM-tested sections and correct installation, not a depth label alone."],
      ["When should I add mesh in the stack?", "When the opening needs insect control without a separate casement — 3/4 track solutions exist; mention it on WhatsApp for schedule alignment."],
      ["How do I get a premium project quote from WoodenMax?", "Use the tool, then send PDF elevations and city so we can align roller class and site handling."],
    ],
  },
  {
    slug: "system-casement-window-price",
    calc: "case",
    calcId: "price-calculator-sys-casement",
    priceMin: 1280,
    priceMax: 2920,
    productId: "system-casement-50mm-euro",
    profileLabel: "50mm Euro system casement",
    packageHint: "Primary casement system page: 6mm start; 10/12mm & DGU drive multipoint in-tool as on site.",
    calcBandNote: "Mid–upper when combining DGU + large vent",
    calcTagline: "50mm Euro standard quote — the default system casement name in the tool here.",
    h1: "Aluminium System Casement Window Price & Features",
    desc: "Aluminium system casement window price in India: hinges, multipoint, wind load, and 2026 ₹/sqft ranges. Live premium casement calculator for vent-heavy facades.",
    imgDir: "System Casement Window",
    images: [
      { file: "system-casement-window-open-style.webp", alt: "aluminium system casement window open style design" },
      { file: "premium-casement-window-hinge-detail.webp", alt: "system window hinge hardware premium quality" },
    ],
    productName: "System casement window — India price (premium hardware)",
    intro: `<p style="color:#334155;line-height:1.85;">The <strong>aluminium system casement window price</strong> in India in 2026 is driven by <em>hinge class, stay arms, and multipoint espag</em> more than the raw bar rate. Certified <strong>system</strong> casement on this URL is planned in the <strong>₹__PM__–₹__PX__/sq.ft</strong> strip (before GST); DGU, safety plies, and import hardware use the upper range. The tool is the <strong>50mm Euro system casement</strong> line — long life, smooth feel — for outswing/inswing vent lights next to <a href="system-sliding-window-price">Gulf/35mm sliding</a> in mixed elevations.</p>
      <div style="overflow-x:auto;margin-top:1rem;"><table style="width:100%;border-collapse:collapse;font-size:0.95rem;background:#fff;border:1px solid #e2e8f0;"><thead><tr style="background:#1e3a5f;color:#fff;"><th style="padding:0.65rem;text-align:left;">Spec lever</th><th style="padding:0.65rem;text-align:left;">Effect on price</th></tr></thead><tbody>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">DGU or laminated with multipoint</td><td style="padding:0.65rem;">Hardware + weight jump together</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Coastal or high floor</td><td style="padding:0.65rem;">Stainless or coated hinge kits</td></tr>
      </tbody></table></div>`,
    draw: "Hinge side load path: a system casement shows where friction stay and frame reinforcement meet the sash.",
    types: `<h3>Outswing vs inswing in India</h3><p>Balcony furniture and shutter conflicts decide swing — say it early in shop drawings.</p><h3>System casement with fixed fields</h3><p>Coupled units with slim mullion often pair with a <a href="slim-system-window-price">slim system</a> mullion detail.</p><h3>Sliding in same flat</h3><p>Match sightlines to sliding marks from <a href="aluminium-system-window-price">main system price</a> reference.</p>`,
    breakdown: `<h3>Profiles</h3><p>50mm Euro and 52mm Gulf give deep hardware pockets; stays rated for the sash — smooth operation and long life when specified right.</p><h3>Hardware</h3><p>Friction stay rating vs sash weight, espag for sealing — never reuse cheap hinges for heavy DGU.</p><h3>Acoustics</h3><p>Multistage gaskets in system lines matter when the casement is on a road-facing vent.</p><h3>Install</h3><p>Packers and square before fixing — a twisted frame stresses hinges within months.</p>`,
    comp: `<h3>System casement vs top-hung in budget</h3><p>Top-hung can save space in a utility vent; full casement may seal better in width.</p><h3>vs sliding on ₹/ft</h3><p>Sliding often has lower per-open cost at large area; casement often wins for directed ventilation in kitchens.</p><h3>When to use safety glass</h3><p>Human impact zones — align with <a href="system-window-glass-options">system glass</a> page before BOQ sign-off.</p>`,
    use: `<ul style="line-height:1.9;color:#334155;"><li><strong>Bath, kitchen, utility:</strong> quick purge of humid air with good sealing on close.</li><li><strong>High wind stair towers:</strong> with rated stays and child restrictors for safety.</li><li><strong>Acoustic facades next to dry spaces:</strong> DGU + multipoint in system lines.</li></ul>`,
    faq: [
      ["What is a fair system casement price per sqft in 2026?", "Start from this page’s ₹__PM__–₹__PX__/sq.ft strip (before GST), then the 50mm Euro tool and drawings — heavy DGU and multipoint usually push toward the top of the strip."],
      ["Is multipoint always required?", "Not always, but 10mm+ and DGU often trigger it for deflection and sealing — the tool reflects that logic."],
      ["Can system casement match a sliding system colour?", "Yes — use the same finish reference for powder batching across marks."],
      ["How do I request a high-ticket site review?", "Send dimensions, city, and floor, then book a call — we will confirm wind map assumptions before locking hardware class."],
    ],
  },
  {
    slug: "slim-system-window-price",
    calc: "case",
    calcId: "price-calculator-sys-slim",
    priceMin: 1350,
    priceMax: 3000,
    productId: "system-casement-52mm-gulf-slim",
    profileLabel: "52mm Gulf casement (slim luxury)",
    packageHint: "Laminated / acoustic plies: common on slim luxury facades; pick laminated in the calculator to mirror that line.",
    calcBandNote: "Often uses top of the strip for import hardware + IGU",
    calcTagline: "52mm Gulf slim id — for sightline-first villa elevations.",
    h1: "Slim System Window Cost for Luxury Homes",
    desc: "Slim system aluminium window price: minimal sight lines, 2026 India ₹/sqft for luxury villas, and premium casement-based calculator. Compare vs standard 29mm stacks.",
    imgDir: "Slim System Window",
    images: [
      { file: "slim-system-window-luxury-villa.webp", alt: "slim aluminium system window luxury villa design" },
      { file: "minimal-slim-window-frame-profile.webp", alt: "ultra slim aluminium window frame minimal design" },
    ],
    productName: "Slim system aluminium window — luxury price (premium series)",
    intro: `<p style="color:#334155;line-height:1.85;"><strong>Slim system window</strong> work is the overlap of <em>minimal visible frame</em> and <em>still-certified performance</em>. This page’s <strong>₹__PM__–₹__PX__/sq.ft</strong> range (before GST) is the luxury end — thinner profiles use stiffer alloy, heavier IGU, and import hardware. The calculator is <strong>52mm Gulf (slim luxury)</strong>; use <a href="system-sliding-window-price">35mm/40mm sliding</a> for big balcony glass on the same floor.</p>
      <div style="overflow-x:auto;margin-top:1rem;"><table style="width:100%;border-collapse:collapse;font-size:0.95rem;background:#fff;border:1px solid #e2e8f0;"><thead><tr style="background:#1e3a5f;color:#fff;"><th style="padding:0.65rem;text-align:left;">Luxury line item</th><th style="padding:0.65rem;text-align:left;">How it shows on invoice</th></tr></thead><tbody>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Narrow mullion system</td><td style="padding:0.65rem;">Higher grade / thicker alloy or steel reinforcement</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Oversized IGU</td><td style="padding:0.65rem;">Crane, suction cups, and seal sequence time</td></tr>
      </tbody></table></div>`,
    draw: "Slim is not just “less aluminium” — it is routing loads through fewer visible millimetres, which raises engineering depth.",
    types: `<h3>Slim system vs standard system</h3><p>Standard 29mm-class sliding may still be “premium” in everyday language but not minimal enough for certain facade grids — compare sight lines on the drawing, not the brochure.</p><h3>Coupled to curtain wall aesthetic</h3><p>See <a href="slim-entrance-glass-door">slim glass doors</a> when the ground floor needs alignment.</p><h3>When slim is a mistake</h3><p>Very high floor without tuned reinforcement — we will flag in structural review.</p>`,
    breakdown: `<h3>Alloy and reinforcement</h3><p>Hidden steel or thicker profiles carry wind without fat sight lines.</p><h3>Glass</h3><p>Thicker DGU in slim grids often dictates lifting equipment line items.</p><h3>Hardware</h3><p>Concealed hinges, minimalist handles, and finicky adjustment add skilled labour hours.</p><h3>Installation</h3><p>Stone and tile interfaces need laser control — “almost flush” is expensive when wrong.</p>`,
    comp: `<h3>Slim vs 29mm sliding on budget</h3><p>29mm sliding is often a floor-area hero; ultra-slim is a design hero — both can be system-grade.</p><h3>Read also</h3><p><a href="slim-aluminium-window-price-luxury">Slim luxury prices</a> in our wider cluster, and <a href="system-window-for-villa">villa system guide</a>.</p><h3>Brand expectations</h3><p>Luxury clients care about deflection in mm — we document that on request.</p>`,
    use: `<ul style="line-height:1.9;color:#334155;"><li><strong>Sea-view villas and farmhouses:</strong> maximum glass, controlled profiles.</li><li><strong>Penthouse corners:</strong> where every inch of view counts.</li><li><strong>Flagship lobbies (residential + boutique commercial):</strong> consistent minimal grid.</li></ul>`,
    faq: [
      ["How much is a slim system window per sqft in 2026?", "This URL uses a ₹__PM__–₹__PX__/sq.ft band (52mm Gulf slim) — often the top of the wider system range when glass and hardware are both max spec; send drawings for validation."],
      ["Is slim the same as 29mm sliding?", "Not necessarily — 29mm describes a depth class. Slim is a design target; some slim lines are not sliding at all, but casement, fixed, or structurally silicone glazed."],
      ["Can I mix slim system with normal windows inside the house?", "Yes, but mullion alignment and finish batches should still coordinate so the house reads as one design language."],
      ["What next after the calculator number?", "WhatsApp the width × height, floor level, and city — we will confirm reinforcement and type-test alignment before a premium quote."],
    ],
  },
  {
    slug: "system-window-installation",
    calc: "29mm",
    calcId: "price-calc-sys-install",
    priceMin: 1150,
    priceMax: 2650,
    productId: "system-sliding-40mm-minimal",
    profileLabel: "40mm minimal / slimline system sliding",
    packageHint: "10mm example tier in the mid planning band; crane / protection / silicone class stay as site lines on many projects.",
    calcBandNote: "Minimal profile jobs may still use full width of strip when glass is heavy",
    calcTagline: "40mm minimal stack in the field tool when you read install + product together.",
    h1: "How System Windows are Installed (Step-by-Step Guide)",
    desc: "Aluminium system window installation: fixing sequence, waterproofing, alignment, and 2026 cost drivers in India. 29mm sliding calculator to estimate before site mobilisation.",
    imgDir: "Installation Process",
    images: [
      { file: "system-window-installation-site.webp", alt: "aluminium system window installation process site work" },
      { file: "window-installation-frame-fixing.webp", alt: "system window frame fixing installation step" },
    ],
    productName: "System window installation (India) — process + estimate",
    intro: `<p style="color:#334155;line-height:1.85;">People searching <strong>system window installation</strong> are usually past the catalogue stage: they need a <em>sequence that preserves the system warranty</em>. Onsite, that means shimming to laser level, anchor spacing per substrate, then wet sealing in the right order before heavy glass. <strong>Material</strong> for system windows is typically quoted in the <strong>₹__PM__–₹__PX__/sq.ft</strong> band (before GST) from <a href="aluminium-system-window-price">system window pricing</a>; installation, crane, and protection are <em>add-ons</em> on many projects. The 29mm calculator on this page models the product stack while you read the process below.</p>
      <div style="overflow-x:auto;margin-top:1rem;"><table style="width:100%;border-collapse:collapse;font-size:0.95rem;background:#fff;border:1px solid #e2e8f0;"><thead><tr style="background:#1e3a5f;color:#fff;"><th style="padding:0.65rem;text-align:left;">Step</th><th style="padding:0.65rem;text-align:left;">Focus</th></tr></thead><tbody>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">1. Pocket check</td><td style="padding:0.65rem;">Plumb, square, net opening vs shop drawing</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">2. Fix + seal</td><td style="padding:0.65rem;">Anchors, backer rod, silicone sequence</td></tr>
      </tbody></table></div>`,
    draw: "Site photo shows temporary protection and level reference — the frame fixing photo shows bracket spacing relative to the RCC edge.",
    types: `<h3>Stone-first vs window-first projects</h3><p>System windows work best with coordinated reveals — if stone already went in wrong, the install team spends days shimming.</p><h3>RC vs block vs steel</h3><p>Each substrate changes anchor and chemical selection — we adapt per structural note.</p><h3>Post-install</h3><p>Water test before handing over trim — we document in snag lists.</p>`,
    breakdown: `<h3>Crane and lifts</h3><p>High floor DGU in towers may need vertical transport line items that general calculators do not know.</p><h3>Silicone and tapes</h3><p>Weathering vs structural product classes differ in ₹/m.</p><h3>Skill premium</h3><p>Certified system installers are fewer than ad-hoc teams — the calendar reflects that.</p><h3>Protection</h3><p>Film and boarding until paint completion reduce scratch claims — budget it.</p>`,
    comp: `<h3>System install vs ad-hoc</h3><p>Ad-hoc can look cheaper hour-by-hour; system install follows a sequence you can audit — fewer leak tickets in year two.</p><h3>₹/ft vs per opening</h3><p>Very small windows still carry mobilisation, so the effective install ₹/ft rises.</p><h3>Read next</h3><p>Glass build drives handling — <a href="system-window-glass-options">system glass</a> page for weight context.</p>`,
    use: `<ul style="line-height:1.9;color:#334155;"><li><strong>Site engineers:</strong> align concrete pocket tolerances to window schedule.</li><li><strong>Interior finish teams:</strong> know sequence so trims do not pre-empt wet sealing.</li><li><strong>Handover teams:</strong> use the same check list in sea-facing villas.</li></ul>`,
    faq: [
      ["What is a typical system window installation cost in 2026?", "Installation is often quoted on top of supply. Plan product using this page’s ₹__PM__–₹__PX__/sq.ft strip (40mm minimal sliding id), then add skilled install, crane, and protection after site check."],
      ["How long does installation take per window?", "Set-out plus fixing might be 45–90 minutes for a modest vent; DGU in a tower suite can be half a day with lift coordination."],
      ["Can you install a system window in monsoon?", "We avoid exposed wet sealing in driving rain; light sealing under protection is possible on fast-track sites with tenting."],
      ["What calculator is on this page and why 29mm?", "The 29mm sliding family helps owners estimate a premium material stack while thinking about site variables — it is the same number family as other system sliding guidance pages."],
    ],
  },
  {
    slug: "system-window-glass-options",
    calc: "29mm",
    calcId: "price-calc-sys-glass",
    priceMin: 1190,
    priceMax: 2880,
    productId: "system-sliding-31mm-glass",
    profileLabel: "31mm system sliding (glass / IGU focus)",
    packageHint: "DGU/IGU page: 20mm DGU line in the dropdown = priced adder vs 6mm base — aligns with IGU supply reality.",
    calcBandNote: "Glass-led BOQs use most of the strip when IGU is wide-scale",
    calcTagline: "31mm-glass id keeps glass-upgrade SEO separate from the main 30/35 sliding pages.",
    h1: "Glass Types Used in Aluminium System Windows",
    desc: "System window glass: DGU, triple IGU, laminated, and safety plies for India 2026. Price impact and 29mm sliding calculator to model a realistic stack with glass adders.",
    imgDir: "Glass Options",
    images: [
      { file: "system-window-double-glass-dgu.webp", alt: "system window double glass dgu section detail" },
      { file: "riple-glass-window-section.webp", alt: "triple glass aluminium system window section view" },
    ],
    productName: "System window glass build-ups — India 2026",
    intro: `<p style="color:#334155;line-height:1.85;">The <strong>system window glass</strong> line item is not “just pick DGU from a list.” For certified systems, the glass is specified as a <em>package weight and deflection</em> the frame, hinges, and stays were designed to carry. This page’s <strong>₹__PM__–₹__PX__/sq.ft</strong> planning strip (before GST) is glass-led: 6mm base with DGU / 8/10/12 / laminated in the same tool. Product id: <strong>31mm system sliding (glass / IGU focus)</strong> — see <a href="system-casement-window-price">50mm Euro casement</a> for vent-heavy sides.</p>
      <div style="overflow-x:auto;margin-top:1rem;"><table style="width:100%;border-collapse:collapse;font-size:0.95rem;background:#fff;border:1px solid #e2e8f0;"><thead><tr style="background:#1e3a5f;color:#fff;"><th style="padding:0.65rem;text-align:left;">Build-up</th><th style="padding:0.65rem;text-align:left;">What it buys</th></tr></thead><tbody>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">DGU (twin lites + spacer)</td><td style="padding:0.65rem;">Acoustic and thermal over single light</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Triple / laminated safety</td><td style="padding:0.65rem;">Human impact, security, and STC where specified</td></tr>
      </tbody></table></div>`,
    draw: "Section on this page: glass positions relative to sash — triple stacks raise depth and can change handle height.",
    types: `<h3>When DGU is enough</h3><p>Most urban homes meeting moderate acoustic briefs: pair with good seals, not more glass than needed.</p><h3>When triple IGU is justified</h3><p>Close to flight paths or spec-grade recording rooms — we align with MEP, not just aesthetics.</p><h3>Coatings</h3><p>Low-e or solar control is another layer in pricing — name it in the tender.</p>`,
    breakdown: `<h3>Glass supply chain</h3><p>IGU is factory-cured — lead time and transport breakage risk feed margin.</p><h3>Hardware consequence</h3><p>Thicker and heavier = multipoint, stronger friction stays, or more rollers.</p><h3>Install handling</h3><p>Suction, crane, and edge protection for large DGU — see <a href="system-window-installation">installation</a> page.</p><h3>Energy story</h3><p>Some projects document U-value for IGBC — system lines help you hold the number after install.</p>`,
    comp: `<h3>DGU vs single on ROI</h3><p>Single is cheaper day one; DGU can pay in HVAC noise and comfort if AC loads are high.</p><h3>Triple vs DGU</h3><p>Diminishing returns unless brief demands it — we model honestly before upselling plies.</p><h3>System vs non-system frame</h3><p>Do not put a heavy IGU in a under-rated vent — the failure mode is hinge sag, not the glass price display.</p>`,
    use: `<ul style="line-height:1.9;color:#334155;"><li><strong>Noise-challenged bedrooms:</strong> laminated + air gap tuned for road spectrum.</li><li><strong>West glass in hot climates:</strong> performance tint + DGU, not more AC tonnage alone.</li><li><strong>Strata rules on reflectivity:</strong> we match coating to municipal guidance.</li></ul>`,
    faq: [
      ["Is triple glass always better than DGU in India?", "Not automatically — the improvement must justify cost and the deeper section for hardware. We recommend triple when the acoustic or thermal brief truly demands it."],
      ["Does the calculator on this page include DGU adders for sliding?", "Yes — it is tied to 29mm sliding product logic, like other premium system sliding guidance pages, so glass upgrades show as line-item behaviour in the tool."],
      ["When is laminated safety specified?", "Near floor zones, large human-impact panels, and some coastal codes for wind-borne debris — we align with the structural engineer of record."],
      ["Can WoodenMax help with a glass schedule for a whole tower?", "Yes — share floor plates and room types; we can propose mark-type glass stacks before fabrication."],
    ],
  },
  {
    slug: "system-window-for-villa",
    calc: "case",
    calcId: "price-calc-sys-villa",
    priceMin: 1300,
    priceMax: 3000,
    productId: "system-casement-50mm-euro-villa",
    profileLabel: "50mm Euro casement (villa / large vent)",
    packageHint: "12mm and DGU on key villa vents: top of band; Euro stack = smooth, durable operation over years.",
    calcBandNote: "View walls + DGU can pin to the strip ceiling",
    calcTagline: "50mm Euro (villa) name in the tool — for luxury BOQ that matches this URL.",
    h1: "Premium Aluminium System Windows for Villas",
    desc: "Best system window for villa and luxury homes in India 2026: elevation strategy, large glass, and realistic budgets. Premium casement calculator + links to sliding system pricing.",
    imgDir: "villa luxury window",
    images: [
      { file: "system-window-villa-design.webp", alt: "aluminium system window villa luxury home design" },
      { file: "premium-window-large-glass-view.webp", alt: "luxury system window large glass panoramic view" },
    ],
    productName: "Villa & luxury system windows — 2026 India guide",
    intro: `<p style="color:#334155;line-height:1.85;">The <strong>best system window for villa</strong> projects in India is the one that survives your <em>façade concept, monsoon, and how you actually live in the plan</em> — not the trendiest mullion on Pinterest. For 2026, budget the <strong>system window</strong> package in the <strong>₹__PM__–₹__PX__/sq.ft</strong> market band (before GST); luxury glass, import hardware, and large sliders usually sit in the <em>upper</em> part of the band. This page leans on the <strong>premium casement</strong> calculator for vent and picture units; add the <a href="system-sliding-window-price">system sliding</a> page for floor-to-ceiling glass walls so your BOQ is complete.</p>
      <div style="overflow-x:auto;margin-top:1rem;"><table style="width:100%;border-collapse:collapse;font-size:0.95rem;background:#fff;border:1px solid #e2e8f0;"><thead><tr style="background:#1e3a5f;color:#fff;"><th style="padding:0.65rem;text-align:left;">Villa need</th><th style="padding:0.65rem;text-align:left;">Window answer</th></tr></thead><tbody>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">View wall + balcony</td><td style="padding:0.65rem;">System sliding + low threshold drain detail</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">Internal courtyard</td><td style="padding:0.65rem;">Casement with acoustic glass stack</td></tr>
      </tbody></table></div>`,
    draw: "Villa design photo shows elevation rhythm — the panoramic photo stresses glass area per metre of spandrel.",
    types: `<h3>One grid language</h3><p>Match vent and sliding sight lines so the elevation reads as one system family — mullion alignment beats mixing random profiles.</p><h3>Pool / moisture zones</h3><p>Hardware and coating class step up; we flag in early CA.</p><h3>Smart home</h3><p>Motorised vents need wire paths before plaster — mention while slab is open.</p>`,
    breakdown: `<h3>Land cost vs window spend</h3><p>On high-ticket land, the incremental cost of a better system is small in the P&amp;L but huge in experience.</p><h3>Security</h3><p>Multipoint, laminated, and fixed combinations at grade — coordinate with the facade security brief.</p><h3>Maintenance</h3><p>Villas keep windows longer than flats — gaskets, rollers, and spare availability matter; see <a href="aluminium-system-window-brands-india">brand discipline</a>.</p><h3>Outdoor room flow</h3><p>Sliding pocket details affect furniture set-out — we coordinate with ID.</p>`,
    comp: `<h3>Luxury system vs “same look cheaper”</h3><p>Fake slim sight lines without engineering show up in deflection in year two; system packages document limits.</p><h3>vs apartment clusters</h3><p>Wind maps differ — a villa on a plot may be more exposed than a same-floor city flat; do not copy numbers blindly.</p><h3>Read also</h3><p><a href="slim-system-window-price">Slim system</a> and <a href="full-elevation-villa-facade">full elevation</a> where the skin is not only windows.</p>`,
    use: `<ul style="line-height:1.9;color:#334155;"><li><strong>Farmhouse &amp; second homes:</strong> where operability in dust matters as much as view.</li><li><strong>Seaside plots:</strong> salt air + wind — coating class is non-negotiable.</li><li><strong>Entertaining floors:</strong> where acoustic separation between zones is a quiet luxury.</li></ul>`,
    faq: [
      ["What should I budget for villa system windows in 2026?", "This guide’s ₹__PM__–₹__PX__/sq.ft strip (50mm Euro villa id) is the planning anchor; glass weight and wind on plots often pin to the top — we confirm on drawing."],
      ["Sliding or casement for a living room in a villa?", "Sliding when you need a clear glass wall; casement or parallel opening when you want full-section ventilation without a track across the floor — often both appear on a single elevation."],
      ["How do I avoid over-specifying glass?", "Start with room-by-room briefs: noise, sun, and safety — we align glass to each mark instead of one oversize spec for the whole site."],
      ["How can WoodenMax support architects on villa jobs?", "We join early for grid, split sliding vs casement budget, and installation sequencing so stone and glass do not fight on site."],
    ],
  },
];

function enc(s) {
  return JSON.stringify(s).slice(1, -1);
}

function buildPage(p) {
  const pm = p.priceMin ?? DEFAULT_PM;
  const px = p.priceMax ?? DEFAULT_PX;
  const pageTitle = getPageTitle(p.slug, pm, px);
  const metaDesc = getMetaDescription(p.desc, pm, px);
  const canonical = `https://woodenmax.in/products/aluminium-windows/${p.slug}`;
  let calcBlock = p.calc === "29mm" ? extract29(p.calcId) : extractCasement(p.calcId);
  if (p.productId) {
    calcBlock = injectCalcProduct(calcBlock, p.calc, p.productId);
  }
  const imgPath = (fn) => `../../images/products/${p.imgDir}/${fn}`;
  const first = p.images[0].file;
  const ogFile = `https://woodenmax.in/images/products/${encodeURIComponent(p.imgDir)}/${first.split("/").pop()}`;

  const faqJson = p.faq
    .map(
      ([q, a]) =>
        `{"@type":"Question","name":${JSON.stringify(
          q
        )},"acceptedAnswer":{"@type":"Answer","text":${JSON.stringify(a)}}}`
    )
    .join(",");

  const systemSlugs = [
    "aluminium-system-window-price",
    "what-is-aluminium-system-window",
    "system-window-vs-normal-window",
    "aluminium-system-window-brands-india",
    "system-sliding-window-price",
    "system-casement-window-price",
    "slim-system-window-price",
    "system-window-installation",
    "system-window-glass-options",
    "system-window-for-villa",
  ];
  const related = systemSlugs.filter((s) => s !== p.slug).slice(0, 8);

  const morningSlugs = [
    "2-track-aluminium-window-price",
    "4-track-sliding-window-price",
    "aluminium-casement-window-price",
    "aluminium-window-price-per-sqft",
    "aluminium-sliding-window-price-calculator",
    "sliding-vs-casement-window",
    "best-aluminium-window-for-home",
    "aluminium-window-glass-price-breakdown",
    "aluminium-window-price-hyderabad",
    "slim-aluminium-window-price-luxury",
  ];

  const itemListForJson = [...systemSlugs, ...morningSlugs]
    .filter((s) => s !== p.slug)
    .slice(0, 20)
    .map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: SEO_TITLE[s] || s.replace(/-/g, " "),
      url: `https://woodenmax.in/products/aluminium-windows/${s}`,
    }));
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Aluminium window — system & price tools (related)",
    numberOfItems: itemListForJson.length,
    itemListElement: itemListForJson,
  };

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: pageTitle,
    description: metaDesc,
    inLanguage: "en-IN",
    isPartOf: {
      "@type": "WebSite",
      "@id": "https://woodenmax.in/#website",
      name: "WoodenMax",
      url: "https://woodenmax.in",
    },
    primaryImageOfPage: { "@type": "ImageObject", url: ogFile, caption: p.images[0].alt },
    datePublished: "2026-04-25T00:00:00+05:30",
    dateModified: "2026-04-26T00:00:00+05:30",
  };

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${p.h1} — price calculator`,
    serviceType: "Aluminium system window price calculator",
    description: metaDesc,
    url: `${canonical}#window-price-calculator`,
    provider: {
      "@type": "Organization",
      name: "WoodenMax",
      url: "https://woodenmax.in",
      telephone: "+91-78953-28080",
    },
    areaServed: { "@type": "Country", name: "India" },
  };

  const extraScripts =
    p.calc === "29mm"
      ? ""
      : `\n  <script src="../../js/calculator/extensions/top-hung-casement.js" defer></script>`;

  const breadcrumbName = p.h1.replace(/<[^>]+>/g, "").slice(0, 72);
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://woodenmax.in/" },
      { "@type": "ListItem", position: 2, name: "Catalog", item: "https://woodenmax.in/catalog" },
      {
        "@type": "ListItem",
        position: 3,
        name: "Aluminium Windows",
        item: "https://woodenmax.in/products/aluminium-windows",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: pageTitle.split("|")[0].trim().slice(0, 64),
        item: canonical,
      },
    ],
  };
  const bcStr = JSON.stringify(breadcrumbLd);

  const sku = "WM-SEO-SYS" + p.slug.replace(/[^a-z0-9]+/gi, "").slice(0, 12).toUpperCase();

  return expandPrices(`<!DOCTYPE html>
<html lang="en-IN" dir="ltr">
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-H3574PEDBK"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-H3574PEDBK', { 'engagement_time_msec': 0, 'session_engaged': true });
  </script>
  <script defer src="../../js/analytics.js"></script>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <meta name="description" content="${enc(metaDesc)}" />
  <meta name="keywords" content="${enc(
    `aluminium system window price, system window ₹__PM__ ₹__PX__, ${p.slug.replace(
      /-/g,
      " "
    )}, per sqft India 2026, WoodenMax`
  )}" />
  <meta name="author" content="WoodenMax" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${canonical}" />
  <link rel="image_src" href="${ogFile}" />
  <meta name="image" content="${ogFile}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${enc(pageTitle)}" />
  <meta property="og:description" content="${enc(metaDesc)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${ogFile}" />
  <meta property="og:image:alt" content="${enc(p.images[0].alt)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" type="image/x-icon" href="../../favicon.ico" />
  <link rel="stylesheet" href="../../css/styles.css" />
  <link rel="stylesheet" href="../../css/calculator-global.css" />
  <link rel="stylesheet" href="../../css/product-pages-global.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
  <link rel="preload" as="image" href="${imgPath(first)}" />
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":${JSON.stringify(
    p.productName
  )},"description":${JSON.stringify(
    metaDesc
  )},"image":"${ogFile}","sku":"${sku}","brand":{"@type":"Brand","name":"WoodenMax","url":"https://woodenmax.in"},"category":"Aluminium Windows","offers":{"@type":"AggregateOffer","url":"${canonical}","priceCurrency":"INR","lowPrice":__PM__,"highPrice":__PX__,"offerCount":1,"availability":"https://schema.org/InStock","priceValidUntil":"2026-12-31","priceSpecification":{"@type":"UnitPriceSpecification","priceCurrency":"INR","unitText":"per square foot","minPrice":__PM__,"maxPrice":__PX__}}}</script>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[${faqJson}]}</script>
  <script type="application/ld+json">${bcStr}</script>
  <script type="application/ld+json">${JSON.stringify(webPageLd)}</script>
  <script type="application/ld+json">${JSON.stringify(serviceLd)}</script>
  <script type="application/ld+json">${JSON.stringify(itemListLd)}</script>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","@id":"https://woodenmax.in/#org","name":"WoodenMax","url":"https://woodenmax.in","telephone":"+91-78953-28080"}</script>
</head>
<body class="system-window-seo-page">
  <nav class="navbar scrolled" id="navbar">
    <div class="container">
      <div class="navbar-content">
        <a href="../../index" class="navbar-logo">
          <div class="logo-icon"><img src="../../images/woodenmax-logo.png" alt="WoodenMax Logo" ></div>
    </a>
    <div class="nav-menu">
      <a href="../../index" class="nav-link">Home</a>
      <div class="category-carousel-wrapper">
        <button class="carousel-nav prev" id="catPrev" type="button" aria-label="Previous categories"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg></button>
        <div class="category-carousel" id="categoryCarousel">
          <a href="../aluminium-windows" class="cat-item active">Aluminium</a>
          <a href="../telescope-windows" class="cat-item">Telescope</a>
          <a href="../folding-systems" class="cat-item">Folding</a>
          <a href="../metal-louvers" class="cat-item">Louvers</a>
          <a href="../shower-partitions" class="cat-item">Shower</a>
          <a href="../elevation-cladding" class="cat-item">Elevation</a>
          <a href="../glass-elevation" class="cat-item">Glass</a>
          <a href="../glass-railing" class="cat-item">Railing</a>
          <a href="../grills" class="cat-item" data-index="8">Grills</a>
        </div>
        <button class="carousel-nav next" id="catNext" type="button" aria-label="Next categories"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></button>
      </div>
      <a href="../../about" class="nav-link">About</a>
      <a href="../../contact.html" class="nav-link">Contact</a>
    </div>
    <div class="nav-cta"><a href="tel:+917895328080"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Call</a></div>
    <button class="mobile-toggle" id="mobileToggle" aria-label="Toggle Menu" type="button">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="menuIcon"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="closeIcon" style="display:none;"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  </div>
</div>  </nav>

  <div class="mobile-menu" id="mobileMenu">
    <div class="mobile-menu-content">
      <a href="../../index" class="mobile-nav-item">Home</a>
      <div class="mobile-category-grid">
        <a href="../aluminium-windows" class="mobile-cat-item" style="background:rgba(245,158,11,0.2);border-color:var(--gold-500);"><span>Aluminium</span></a>
        <a href="../telescope-windows" class="mobile-cat-item"><span>Telescope</span></a>
        <a href="../folding-systems" class="mobile-cat-item"><span>Folding</span></a>
        <a href="../metal-louvers" class="mobile-cat-item"><span>Louvers</span></a>
        <a href="../shower-partitions" class="mobile-cat-item"><span>Shower</span></a>
        <a href="../elevation-cladding" class="mobile-cat-item"><span>Elevation</span></a>
        <a href="../glass-elevation" class="mobile-cat-item"><span>Glass</span></a>
        <a href="../glass-railing" class="mobile-cat-item"><span>Railing</span></a>
        <a href="../grills" class="mobile-cat-item"><span class="mobile-cat-icon">🔒</span><span>Grills</span></a>
      </div>
      <a href="../../about" class="mobile-nav-item">About Us</a>
      <a href="../../contact.html" class="mobile-nav-item">Contact Us</a>
      <div class="mobile-menu-footer">
        <a href="tel:+917895328080" class="cta-btn"> Call Now</a>
      </div>
    </div>
  </div>

  <div style="padding: 6rem 0 1rem; background: #F3F4F6;">
    <div class="container">
      <nav style="font-size: 0.875rem; color: #475569;" aria-label="Breadcrumb">
        <a href="https://woodenmax.in/" style="color: #475569;">Home</a> <span> / </span>
        <a href="https://woodenmax.in/products/aluminium-windows" style="color: #475569;">Aluminium Windows</a> <span> / </span>
        <span style="color: #1E40AF; font-weight: 600;">${breadcrumbName}</span>
      </nav>
    </div>
  </div>

  <section class="product-detail-hero">
    <div class="container">
      <span class="section-label">System windows · premium guides</span>
      <h1 style="font-family:'Playfair Display',serif;font-size:2.1rem;color:#0f172a;margin:0.5rem 0;">${p.h1}</h1>
      <p style="color:#475569;max-width:860px;line-height:1.75;">${p.desc} This page’s live tool is the <strong>${
    p.profileLabel
  }</strong> product — ${p.calcTagline || "so the calculator name matches this URL, not a generic 29mm/40mm label only."}</p>
      <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin:1.25rem 0;">
        <a href="#${p.calcId}" class="btn btn-primary">Get premium quote — calculator</a>
        <a href="https://wa.me/917895328080?text=${encodeURIComponent(
          "Hi WoodenMax — I want a system window quote. Page: " + p.slug
        )}" class="btn btn-outline" rel="noopener" target="_blank">WhatsApp (system window)</a>
        <a href="../../contact.html?product=${p.slug}" class="btn btn-outline">Site visit &amp; exact BOQ</a>
      </div>
      <aside style="padding:0 0 1.25rem;border-bottom:1px solid #e2e8f0;margin:0.5rem 0 0;max-width:920px;" aria-label="Explore next — price tools and system cluster">
        <p style="margin:0 0 0.5rem;font-size:0.9rem;color:#64748b;font-weight:600;">Explore next</p>
        <p style="margin:0;font-size:0.88rem;line-height:1.85;">
          <a href="what-is-aluminium-system-window" style="color:#1d4ed8;font-weight:500;">What is system window</a>
          <span style="color:#cbd5e1;"> · </span>
          <a href="aluminium-system-window-price" style="color:#1d4ed8;font-weight:500;">System price index</a>
          <span style="color:#cbd5e1;"> · </span>
          <a href="2-track-aluminium-window-price" style="color:#1d4ed8;font-weight:500;">2 track price</a>
          <span style="color:#cbd5e1;"> · </span>
          <a href="aluminium-window-price-per-sqft" style="color:#1d4ed8;font-weight:500;">₹/sqft guide</a>
          <span style="color:#cbd5e1;"> · </span>
          <a href="sliding-vs-casement-window" style="color:#1d4ed8;font-weight:500;">Sliding vs casement</a>
          <span style="color:#cbd5e1;"> · </span>
          <a href="aluminium-window-glass-price-breakdown" style="color:#1d4ed8;font-weight:500;">Glass cost</a>
          <span style="color:#cbd5e1;"> · </span>
          <a href="../../aluminium-window-price-calculator" style="color:#1d4ed8;font-weight:500;">Main calculator</a>
          <span style="color:#cbd5e1;"> · </span>
          <a href="../aluminium-windows" style="color:#1d4ed8;font-weight:500;">All products</a>
        </p>
      </aside>
      <div class="system-window-seo-hero__grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1.5rem;align-items:start;">
        <figure class="system-window-seo-hero__fig" style="margin:0;">
          <img class="system-window-seo-hero__img alum-seo-hero-compact" src="${imgPath(p.images[0].file)}" alt="${p.images[0].alt.replace(
    /"/g,
    "&quot;"
  )}" width="720" height="480" fetchpriority="high" loading="eager" decoding="async" style="width:100%;max-width:300px;height:auto;border-radius:10px;border:1px solid #e2e8f0;margin:0 auto;display:block;">
        </figure>
        <figure class="system-window-seo-hero__fig" style="margin:0;">
          <img class="system-window-seo-hero__img alum-seo-hero-compact" src="${imgPath(p.images[1].file)}" alt="${p.images[1].alt.replace(
    /"/g,
    "&quot;"
  )}" width="720" height="480" loading="lazy" decoding="async" style="width:100%;max-width:300px;height:auto;border-radius:10px;border:1px solid #e2e8f0;margin:0 auto;display:block;">
        </figure>
      </div>
    </div>
  </section>

  <section style="padding:3rem 0;background:#fff;" id="aluminium-system-intro">
    <div class="container" style="max-width:900px;">
      <h2 class="section-title">${
        p.slug.includes("install") ? "Process &amp; cost context" : "Premium pricing &amp; how to read the band"
      }</h2>
      <p class="sw-package-hint" style="font-size:0.9rem;color:#0f172a;background:#f1f5f9;padding:0.75rem 1rem;border-radius:8px;border-left:4px solid #0ea5e9;margin:0 0 1.25rem;line-height:1.65;"><strong>Package line (this page):</strong> ${p.packageHint || ""} <span style="color:#64748b;">Planning strip: <strong>₹__PM__–₹__PX__</strong>/sq.ft (before GST).</span></p>
      ${p.intro}
    </div>
  </section>

  ${comparisonSection(p)}

  <section style="padding:2.5rem 0;background:#fff;" id="technical-note">
    <div class="container" style="max-width:900px;">
      <h2 class="section-title">System detail (reading your drawings)</h2>
      <p style="color:#334155;line-height:1.8;">${p.draw}</p>
    </div>
  </section>

  <section style="padding:3rem 0;background:#f8fafc;" id="window-price-calculator">
    <div class="container">
      <h2 class="section-title">Live calculator — ${p.profileLabel || "system window stack"}</h2>
      <p style="color:#475569;max-width:720px;">Numbers are estimates — GST, lifting, and unusual site access are finalised after inspection. <strong>Product in tool:</strong> <code style="font-size:0.88em;background:#f1f5f9;padding:0.1rem 0.35rem;border-radius:4px;">${
    p.productId || (p.calc === "29mm" ? "29mm-sliding" : "top-hung-casement")
  }</code> — same engine as our ${p.calc === "29mm" ? "2-track premium / sliding" : "casement (top-hung class)"} calculators, with the <em>name</em> matched to this page.</p>
      ${calcBlock}
    </div>
  </section>

  <section style="padding:3rem 0;background:#fff;" id="types-design-options">
    <div class="container" style="max-width:900px;">
      <h2 class="section-title">Types, glass &amp; hardware</h2>
      ${p.types}
    </div>
  </section>

  <section style="padding:3rem 0;background:#f1f5f9;" id="price-breakdown">
    <div class="container" style="max-width:900px;">
      <h2 class="section-title">What moves the number on your BOQ</h2>
      ${p.breakdown}
    </div>
  </section>

  <section style="padding:3rem 0;background:#fff;" id="comparison">
    <div class="container" style="max-width:900px;">
      <h2 class="section-title">System vs other choices</h2>
      ${p.comp}
    </div>
  </section>

  <section style="padding:3rem 0;background:#0f172a;color:#e2e8f0;" id="best-use-cases">
    <div class="container" style="max-width:900px;">
      <h2 class="section-title" style="color:#f8fafc;">Villa, apartment, office</h2>
      ${p.use}
    </div>
  </section>

  <section style="padding:3rem 0;background:#fff;" id="faqs">
    <div class="container" style="max-width:900px;">
      <h2 class="section-title">FAQs</h2>
      ${p.faq
        .map(
          ([q, a]) => `<div style="margin-bottom:1.25rem;padding:1rem 1.25rem;border:1px solid #e2e8f0;border-radius:10px;">
        <h3 style="margin:0 0 0.5rem;font-size:1.05rem;color:#1e3a8a;">${q}</h3>
        <p style="margin:0;color:#334155;line-height:1.7;">${a}</p>
      </div>`
        )
        .join("\n")}
      <p style="margin-top:1.5rem;"><a href="../aluminium-windows" style="color:#1d4ed8;font-weight:600;">Aluminium windows hub</a></p>
    </div>
  </section>

  <section class="related-windows" style="padding:2.5rem 0;background:#0f172a;color:#e2e8f0;" aria-label="Related aluminium window pages">
    <div class="container">
      <h2 style="margin:0 0 0.75rem;color:#f8fafc;">Internal linking — system cluster + price tools (2026)</h2>
      <p style="color:#94a3b8;font-size:0.95rem;max-width:920px;line-height:1.65;margin:0 0 1rem;">Same <strong style="color:#e2e8f0;">₹__PM__–__PX__/sq.ft</strong> planning band across system pages; morning cluster tools below for 2 track, glass, city, and comparison SEO.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;">
        <div>
          <h3 style="margin:0 0 0.5rem;color:#fbbf24;font-size:1rem;">System window (premium)</h3>
          <ul style="line-height:1.9;margin:0;padding-left:1.15rem;">
            ${related
              .map(
                (s) =>
                  `<li><a href="${s}" style="color:#f8fafc;">${(SEO_TITLE[s] || s).replace(/-/g, " ")}</a></li>`
              )
              .join("")}
          </ul>
        </div>
        <div>
          <h3 style="margin:0 0 0.5rem;color:#fbbf24;font-size:1rem;">Price &amp; calculator cluster</h3>
          <ul style="line-height:1.9;margin:0;padding-left:1.15rem;">
            ${morningSlugs
              .map(
                (s) =>
                  `<li><a href="${s}" style="color:#cbd5e1;">${s.replace(/-/g, " ")}</a></li>`
              )
              .join("")}
          </ul>
        </div>
        <div>
          <h3 style="margin:0 0 0.5rem;color:#fbbf24;font-size:1rem;">Hub &amp; site</h3>
          <ul style="line-height:1.9;margin:0;padding-left:1.15rem;">
            <li><a href="../aluminium-windows" style="color:#cbd5e1;">Aluminium windows hub</a></li>
            <li><a href="../../aluminium-window-price-calculator" style="color:#cbd5e1;">Site calculator</a></li>
            <li><a href="../../blog" style="color:#cbd5e1;">Blog / guides</a></li>
            <li><a href="../../contact.html" style="color:#cbd5e1;">Contact</a></li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <footer>
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand">
            <div class="footer-brand-icon"><img src="../../images/woodenmax-logo.png" alt="WoodenMax Logo" ></div>
          </div>
          <p class="footer-description">Aluminium system window guides and calculators — WoodenMax India.</p>
        </div>
        <div>
          <h3 class="footer-title">Quick Links</h3>
          <ul class="footer-links">
            <li><a href="../../index">Home</a></li>
            <li><a href="../../catalog">Catalog</a></li>
            <li><a href="../aluminium-windows">Aluminium Windows</a></li>
            <li><a href="../../contact.html">Contact</a></li>
          </ul>
        </div>
        <div>
          <h3 class="footer-title">System cluster</h3>
          <ul class="footer-links">
            <li><a href="aluminium-system-window-price">System window price</a></li>
            <li><a href="system-sliding-window-price">System sliding</a></li>
            <li><a href="system-casement-window-price">System casement</a></li>
            <li><a href="slim-system-window-price">Slim system</a></li>
          </ul>
        </div>
        <div>
          <h3 class="footer-title">Contact</h3>
          <p style="color: #e0e0e0; font-size: 0.9rem;">+91 789-5328080</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 WoodenMax. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <a href="#${p.calcId}" class="floating-calc-button" aria-label="Scroll to calculator">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><rect width="16" height="20" x="4" y="2" rx="2"/></svg>
    <span class="floating-calc-button-text">Calculator</span>
  </a>
  <script src="../../js/main.js"></script>
  <script src="../../js/email-submitter.js"></script>
  <script src="../../js/calculator/configs.js" defer></script>
  <script src="../../js/calculator/base.js" defer></script>${extraScripts}
  <script src="../../js/calculator/loader.js" defer></script>
  <script src="../../js/calculator/smooth-typing-indicator.js" defer></script>
  <script src="../../js/calculator/multiple-sizes-calculator.js" defer></script>
  <script src="../../js/mobile-collapsible-sections.js" defer></script>
  <script src="../../js/floating-calc-button.js" defer></script>
</body>
</html>`, pm, px);
}

for (const p of pages) {
  const out = path.join(root, "products/aluminium-windows", p.slug + ".html");
  fs.writeFileSync(out, buildPage(p), "utf8");
  console.log("Wrote", out);
}
