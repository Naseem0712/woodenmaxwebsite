/**
 * tools/inject-calculator-mobile-ux.cjs
 *
 * Site-wide rollout for the new calculator mobile-UX layer.
 *
 * What it does for every page that contains a `.price-calculator-container`
 * (or the `product-pricing-root` block):
 *   1. Inserts  <link rel="stylesheet" href="<rel>/css/calculator-mobile-ux.css">
 *      just before the closing </head> (after any existing calculator-global.css
 *      link, so the override styles win).
 *   2. Inserts  <script src="<rel>/js/calculator-mobile-ux.js" defer></script>
 *      just before the closing </body> (after any existing floating-calc-button.js
 *      script).
 *   3. Is idempotent — re-running does nothing if the tags are already present.
 *
 * Run with:   node tools/inject-calculator-mobile-ux.cjs
 *             node tools/inject-calculator-mobile-ux.cjs --dry   (preview only)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY  = process.argv.includes('--dry');

// Pages that should NOT be touched (already done / shouldn't have it).
const SKIP = new Set([
  'calculator-design-preview.html',
]);

const WM_ASSET_V = process.env.WM_ASSET_V || '20260531';
const CSS_FILE = 'css/calculator-mobile-ux.css?v=' + WM_ASSET_V;
const JS_FILE  = 'js/calculator-mobile-ux.js?v=' + WM_ASSET_V;

const MARKER_REGEX = /price-calculator-container|id=["']product-pricing-root["']|data-grill-calculator/i;

// ---------- helpers ----------
function walk (dir, out) {
  out = out || [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function relPathPrefix (htmlFileAbs) {
  // Number of directories deep from ROOT, e.g. ROOT/products/x/y.html → depth 2.
  const rel = path.relative(ROOT, htmlFileAbs);
  const depth = rel.split(path.sep).length - 1;
  if (depth <= 0) return '';
  return '../'.repeat(depth);
}

function assetAlreadyInHtml (html, basePath) {
  return new RegExp(basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\?v=[^"\'\\s>]*)?', 'i').test(html);
}

function injectCss (html, hrefRel) {
  const linkTag = `  <link rel="stylesheet" href="${hrefRel}">`;
  if (assetAlreadyInHtml(html, 'css/calculator-mobile-ux.css')) return { html, changed: false, reason: 'css already present' };

  // Prefer to insert right after calculator-global.css line.
  const calcGlobalRegex = /(<link\s+[^>]*href=["'][^"']*calculator-global\.css["'][^>]*>)/i;
  if (calcGlobalRegex.test(html)) {
    return {
      html: html.replace(calcGlobalRegex, (m) => m + '\n' + linkTag),
      changed: true,
      reason: 'css inserted after calculator-global.css',
    };
  }

  // Fallback — insert before </head>.
  if (/<\/head>/i.test(html)) {
    return {
      html: html.replace(/(<\/head>)/i, linkTag + '\n$1'),
      changed: true,
      reason: 'css inserted before </head>',
    };
  }
  return { html, changed: false, reason: 'no </head> found — skipped' };
}

function injectJs (html, srcRel) {
  const scriptTag = `  <script src="${srcRel}" defer></script>`;
  if (assetAlreadyInHtml(html, 'js/calculator-mobile-ux.js')) return { html, changed: false, reason: 'js already present' };

  // Prefer to insert right after floating-calc-button.js line.
  const fabRegex = /(<script\s+[^>]*src=["'][^"']*floating-calc-button\.js["'][^>]*>\s*<\/script>)/i;
  if (fabRegex.test(html)) {
    return {
      html: html.replace(fabRegex, (m) => m + '\n' + scriptTag),
      changed: true,
      reason: 'js inserted after floating-calc-button.js',
    };
  }

  // Fallback — insert before </body>.
  if (/<\/body>/i.test(html)) {
    return {
      html: html.replace(/(<\/body>)/i, scriptTag + '\n$1'),
      changed: true,
      reason: 'js inserted before </body>',
    };
  }
  return { html, changed: false, reason: 'no </body> found — skipped' };
}

// ---------- main ----------
function main () {
  // Sanity-check the asset files exist.
  for (const f of [CSS_FILE, JS_FILE]) {
    const abs = path.join(ROOT, f);
    if (!fs.existsSync(abs)) {
      console.error(`✗ Missing asset: ${f}. Aborting.`);
      process.exit(1);
    }
  }

  const allHtml = walk(ROOT);
  const matched = [];
  for (const file of allHtml) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (SKIP.has(rel) || SKIP.has(path.basename(file))) continue;
    let body;
    try { body = fs.readFileSync(file, 'utf8'); } catch { continue; }
    if (MARKER_REGEX.test(body)) matched.push({ file, body });
  }

  console.log(`\n[${DRY ? 'DRY-RUN' : 'APPLY'}] Found ${matched.length} HTML files with a calculator.\n`);

  const report = { changed: [], skipped: [], errors: [] };

  for (const { file, body } of matched) {
    const rel    = path.relative(ROOT, file).split(path.sep).join('/');
    const prefix = relPathPrefix(file);
    const cssHref = prefix + CSS_FILE;
    const jsSrc   = prefix + JS_FILE;

    try {
      const cssStep = injectCss(body, cssHref);
      const jsStep  = injectJs(cssStep.html, jsSrc);

      const newBody = jsStep.html;
      const didChange = cssStep.changed || jsStep.changed;

      if (didChange) {
        if (!DRY) fs.writeFileSync(file, newBody, 'utf8');
        report.changed.push({ file: rel, css: cssStep.reason, js: jsStep.reason });
        console.log(`  ✓ ${rel}`);
        if (cssStep.changed) console.log(`      css → ${cssStep.reason}`);
        if (jsStep.changed)  console.log(`      js  → ${jsStep.reason}`);
      } else {
        report.skipped.push({ file: rel, css: cssStep.reason, js: jsStep.reason });
        console.log(`  · ${rel}   [no-op: ${cssStep.reason} / ${jsStep.reason}]`);
      }
    } catch (err) {
      report.errors.push({ file: rel, error: err.message });
      console.error(`  ✗ ${rel} — ${err.message}`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Changed: ${report.changed.length}`);
  console.log(`Skipped: ${report.skipped.length}`);
  console.log(`Errors : ${report.errors.length}`);
  if (DRY) console.log('\n(Dry-run — no files were written.)');
}

main();
