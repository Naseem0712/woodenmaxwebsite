/**
 * Create domal-window-price.html from 3-track template.
 * Run: node tools/create-domal-window-page.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const src = path.join(ROOT, 'products/aluminium-windows/3-track-sliding-window.html');
const dest = path.join(ROOT, 'products/aluminium-windows/domal-window-price.html');

if (fs.existsSync(dest) && fs.readFileSync(dest, 'utf8').includes('Domal Window (27mm / 27x65)')) {
  console.log('SKIP: domal-window-price.html already exists');
  process.exit(0);
}

let html = fs.readFileSync(src, 'utf8');

const replacements = [
  ['3 Track Aluminium Sliding Window with Mesh Price ₹650–950/sqft | WoodenMax',
   'Domal Window Price ₹550–950/sqft (2026) — 27mm / 27x65 | WoodenMax'],
  ['3-track aluminium sliding window with mesh ₹650–950/sqft; without mesh ₹550–850/sqft. Compare track configuration and calculate an instant size-based quote.',
   'Domal aluminium window price ₹550–950/sqft for the 27mm / 27x65 sliding series. See supported sizes, practical limitations, upgrade guidance and live quote calculator.'],
  ['domal window price, domal window price per sq ft, 3 track aluminium sliding window price, domal sliding window, aluminium 3 track sliding window, 27mm domal window rate',
   'domal window price, domal window price per sq ft, 27x65 domal window, 27mm domal window rate, domal sliding window price india'],
  ['https://woodenmax.in/products/aluminium-windows/3-track-sliding-window',
   'https://woodenmax.in/products/aluminium-windows/domal-window-price'],
  ['3 Track Sliding Window Price ₹550–950/sqft (2026) — Domal 27mm | WoodenMax',
   'Domal Window Price (27x65) — Honest Guide & Per Sq Ft Rate (2026) | WoodenMax'],
  ['3 Track Sliding Window — 27mm Domal Aluminium Series with Mesh | WoodenMax',
   'Domal Window (27mm / 27x65) — Price, Honest Limitations & When to Upgrade | WoodenMax'],
  ['3-track-sliding-window', 'domal-window-price'],
  ['3 Track Sliding Window', 'Domal Window Price'],
  ['<h1 style="font-family: \'Playfair Display\', serif; font-size: 2.5rem; margin: 0 0 0.5rem; color: #0F172A;">Aluminium 3 Track Sliding Window with Mesh</h1>',
   '<h1 style="font-family: \'Playfair Display\', serif; font-size: 2.5rem; margin: 0 0 0.5rem; color: #0F172A;">Domal Window (27mm / 27x65) — Price, Honest Limitations &amp; When to Upgrade</h1>'],
  ['27mm aluminium series (also called Domal profile) 3-track sliding window with mesh option. India\'s most affordable aluminium sliding window with specs, features, and price calculator.',
   'Domal window price per sq ft — 27mm (27x65) profile. Honest limitations, when to upgrade to slim or system series, and live calculator for instant quote.']
];

replacements.forEach(function (pair) {
  html = html.split(pair[0]).join(pair[1]);
});

// Keep search and social metadata distinct even when the source page wording changes.
html = html.replace(/<title>[\s\S]*?<\/title>/i,
  '<title>Domal Window Price ₹550–950/sqft (2026) — 27mm / 27x65 | WoodenMax</title>');
html = html.replace(/<meta name="description" content="[^"]*" \/>/i,
  '<meta name="description" content="Domal aluminium window price ₹550–950/sqft for the 27mm / 27x65 sliding series. See supported sizes, practical limitations, upgrade guidance and live quote calculator." />');
html = html.replace(/<meta property="og:title" content="[^"]*" \/>/i,
  '<meta property="og:title" content="Domal Window Price per Sqft — 27mm / 27x65 Aluminium Series" />');
html = html.replace(/<meta property="og:description" content="[^"]*" \/>/i,
  '<meta property="og:description" content="Domal aluminium window price ₹550–950/sqft for the 27mm / 27x65 sliding series, with practical limitations, upgrade guidance and a live calculator." />');

const domalSection = `
  <!-- DOMAL GUIDE -->
  <section class="wm-series-guide" style="padding: 4rem 0; background: #F8FAFC;">
    <div class="container" style="max-width: 900px; margin: 0 auto; padding: 0 1rem;">
      <h2 class="section-title" style="margin-bottom: 1.25rem; color: #0F172A;">Domal Window — Honest Fabricator's Guide</h2>
      <p style="color: #475569; line-height: 1.75;">The Domal window — the 27mm profile series, popularly known by its 27x65 size — is India's most widely used budget aluminium window. We fabricate it, we sell it, and we will tell you the truth about it.</p>
      <p style="color: #475569; line-height: 1.75;"><strong>Why everyone uses it:</strong> Lowest cost in the market, lightweight, mosquito mesh shutter possible, and ready availability of profiles everywhere. General homes, apartments and builders choose it for exactly these reasons.</p>
      <p style="color: #475569; line-height: 1.75;"><strong>The honest limitations:</strong> The 27mm Domal system exists in the market at very low cost — and that shows in the engineering. The basic connectors, slim wall thickness and shallow depth mean the joints are never perfectly sealed. <strong>Water leakage and sound leakage are common.</strong> Maximum recommended height is <strong>6 ft</strong> — beyond that, problems multiply. And for repairs: <strong>only the wheel is replaceable.</strong> A damaged track or seal cannot be serviced.</p>
      <p style="color: #475569; line-height: 1.75;"><strong>When Domal is still the right choice:</strong> Rental properties, budget renovations, ground/low floors, openings under 6 ft, and projects where every rupee counts.</p>
      <p style="color: #475569; line-height: 1.75;"><strong>When to upgrade — and to what:</strong> If you can stretch the budget even slightly, the <a href="slimline-aluminium-window" style="color: #1E40AF; font-weight: 600;">25mm slim system series</a> transforms the experience: proper interlock depth and genuine hardware nearly eliminate leakage, and good powder coating gives a luxury feel at an economical price. For high-rise or larger openings, go <a href="system-sliding-window-price" style="color: #1E40AF; font-weight: 600;">29mm system</a>.</p>
      <p style="color: #475569; line-height: 1.75;">Also see: <a href="3-track-sliding-window" style="color: #1E40AF;">3-track Domal calculator</a> · <a href="2-track-aluminium-window-price" style="color: #1E40AF;">2-track pricing</a> · <a href="system-window-vs-normal-window" style="color: #1E40AF;">system vs Domal comparison</a></p>
    </div>
  </section>

`;

if (!html.includes('Domal Window — Honest Fabricator')) {
  html = html.replace('  <!-- FAQ SECTION -->', domalSection + '  <!-- FAQ SECTION -->');
}

const domalFaqs = `      {
        "@type": "Question",
        "name": "What is a Domal window?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The 27mm aluminium profile series, popularly known as 27x65. It is India's most common budget window — lowest cost, lightweight, mesh possible — but with basic connectors and shallow depth, water and sound leakage are common and maximum recommended height is 6 ft."
        }
      },
      {
        "@type": "Question",
        "name": "Is a Domal window good for high-rise apartments?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Not ideal. For high-rise use, the 29mm system series and above have zero vibration and properly sealed joints. Domal works best on low floors with openings under 6 ft height."
        }
      },
      {
        "@type": "Question",
        "name": "Can Domal windows be repaired?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Only the wheels can be replaced. Track, seals and other components cannot be serviced — this is the biggest long-term difference versus system windows, where every component is individually replaceable."
        }
      },
`;

html = html.replace('    ]\n  }\n  </script>\n  \n  <!-- HowTo Schema', ',\n' + domalFaqs + '\n    ]\n  }\n  </script>\n  \n  <!-- HowTo Schema');

const visibleDomalFaqs = `        <div class="faq-item">
          <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            <span>What is a Domal window?</span>
            <div class="faq-toggle"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></div>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">The 27mm aluminium profile series, popularly known as 27x65. It is India's most common budget window — lowest cost, lightweight, mesh possible — but with basic connectors and shallow depth, water and sound leakage are common and maximum recommended height is 6 ft.</div>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            <span>Is a Domal window good for high-rise apartments?</span>
            <div class="faq-toggle"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></div>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">Not ideal. For high-rise use, the 29mm system series and above have zero vibration and properly sealed joints. Domal works best on low floors with openings under 6 ft height.</div>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            <span>Can Domal windows be repaired?</span>
            <div class="faq-toggle"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></div>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">Only the wheels can be replaced. Track, seals and other components cannot be serviced — this is the biggest long-term difference versus system windows, where every component is individually replaceable.</div>
          </div>
        </div>
`;

html = html.replace(
  '        <div class="faq-item">\n          <div class="faq-question" onclick="this.parentElement.classList.toggle(\'active\')">\n            <span>What is the difference between aluminium sliding windows and uPVC windows?</span>',
  visibleDomalFaqs + '        <div class="faq-item">\n          <div class="faq-question" onclick="this.parentElement.classList.toggle(\'active\')">\n            <span>What is the difference between aluminium sliding windows and uPVC windows?</span>'
);

fs.writeFileSync(dest, html, 'utf8');
console.log('Created:', dest);
