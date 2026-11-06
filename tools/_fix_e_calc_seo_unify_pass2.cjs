/**
 * Fix E pass 2 — close remaining MISSes / mangled title.
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

function fix(fileRel, fn) {
  const file = path.join(root, fileRel);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  html = fn(html);
  if (html === before) {
    console.log('NO CHANGE', fileRel);
  } else {
    fs.writeFileSync(file, html);
    console.log('WROTE', fileRel);
  }
}

fix('aluminium-window-price-calculator.html', (html) => {
  html = html.replace(
    '<li><strong>No Registration:</strong> Use calculator completely free, no sign-up required</li>',
    '<li><strong>No account needed:</strong> Run the calculator without signing up</li>'
  );
  // leftover "completely free" in FAQ warranty if still present with strong tags
  html = html.replace(
    /Warranty is <strong[^>]*>completely free<\/strong>/gi,
    'Warranty is <strong style="color: var(--gold-400);">included</strong>'
  );
  html = html.replace(/completely free/gi, 'included with no extra charge');
  return html;
});

fix('products/aluminium-windows/aluminium-sliding-window-price-calculator.html', (html) => {
  const TITLE = 'Aluminium Sliding Window Price Calculator | Size & Soft ₹ Band | WoodenMax';
  const H1 = 'Aluminium Sliding Window Price Calculator';
  const DESC =
    'Sliding window price calculator — enter width × height, glass, coating and mesh for a soft ₹ planning band. For all aluminium window types use the primary calculator. WoodenMax India.';

  html = html.replace(
    /<meta name="description" content="Free aluminium sliding window price calculator[^"]*" \/>/,
    `<meta name="description" content="${DESC}" />`
  );
  // Ensure title/og already set; force if Free still present
  html = html.replace(
    /<title>Aluminium Sliding Window Price Calculator[^<]*<\/title>/,
    `<title>${TITLE}</title>`
  );
  html = html.replace(
    /content="Aluminium Sliding Window Price Calculator \(2026\) Free \| WoodenMax"/g,
    `content="${TITLE}"`
  );

  // Inject role after H1 if missing
  if (!html.includes('data-fix-e-sliding-role')) {
    const h1Re =
      /<h1([^>]*)>Aluminium Sliding Window Price Calculator(?:[^<]*)?<\/h1>/;
    if (h1Re.test(html)) {
      html = html.replace(
        h1Re,
        `<h1$1>${H1}</h1>\n          <p data-fix-e-sliding-role style="margin:0.5rem 0 0;color:#475569;font-size:0.98rem;line-height:1.55;">Sliding-window sizes only. For every aluminium window type, use the <a href="/aluminium-window-price-calculator">aluminium window price calculator</a>. Product gallery: <a href="/products/aluminium-windows/aluminium-sliding-window">2-track sliding window</a> · mesh: <a href="/products/aluminium-windows/3-track-sliding-window">3-track with mesh</a>.</p>`
      );
      console.log('  injected sliding role');
    } else {
      console.log('  MISS sliding H1 for inject');
    }
  }

  // Soften remaining Free estimate / Free Online Product names
  html = html.replace(/Free estimate/g, 'Planning estimate');
  html = html.replace(
    /Aluminium Sliding Window Price Calculator — Free Online \(WoodenMax\)/g,
    H1
  );
  html = html.replace(
    /Aluminium Sliding Window Price Calculator \(2026\) — Free Instant ₹ Estimate/g,
    H1
  );
  html = html.replace(/"description":"Free aluminium sliding window[^"]*"/g, `"description":"${DESC}"`);
  html = html.replace(/"description": "Free aluminium sliding window[^"]*"/g, `"description": "${DESC}"`);
  return html;
});

fix('glass-elevation-price-calculator.html', (html) => {
  const TITLE = 'Glass Elevation Price Calculator | Curtain Wall Soft Estimate | WoodenMax';
  const DESC =
    'Glass elevation price calculator for curtain wall and structural glazing. Soft planning estimate by area, glass and frame — not an aluminium window calculator. WoodenMax India.';
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`);
  html = html.replace(
    /Glass Elevation Price Calculator - Free Online Tool for Curtain Wall & Structural Glazing/g,
    'Glass Elevation Price Calculator — curtain wall soft estimate | WoodenMax'
  );
  html = html.replace(
    /Glass Elevation Price Calculator - Free Online Tool/g,
    'Glass Elevation Price Calculator — curtain wall soft estimate'
  );
  html = html.replace(
    /"text": "Free online glass elevation price calculator[^"]*"/,
    '"text": "Glass elevation price calculator. Enter dimensions and glass color for a soft curtain-wall planning estimate."'
  );
  html = html.replace(
    /"description": "Free glass elevation price calculator[^"]*"/,
    `"description": "${DESC}"`
  );
  html = html.replace(/Free online glass elevation/gi, 'Glass elevation');
  return html;
});

fix('calculators.html', (html) => {
  html = html.replace(/Free Forever/g, 'No Account Needed');
  html = html.replace(/completely free/gi, 'no account required');
  html = html.replace(
    /alt="WoodenMax building material price calculators hub"/g,
    'alt="WoodenMax building material price calculators hub"'
  );
  // Card link text already OK; ensure primary aluminium card points clearly
  if (!html.includes('data-fix-e-hub-primary')) {
    html = html.replace(
      '<h3><a href="/aluminium-window-price-calculator"',
      '<h3 data-fix-e-hub-primary><a href="/aluminium-window-price-calculator"'
    );
  }
  return html;
});

console.log('pass2 done');
