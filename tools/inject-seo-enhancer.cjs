/**
 * tools/inject-seo-enhancer.cjs
 *
 * Site-wide rollout for js/seo-enhancer.js — the runtime SEO booster
 * that injects LocalBusiness + WebSite + BreadcrumbList JSON-LD,
 * fixes missing image dimensions, sets theme-color, and hooks the
 * PWA manifest.
 *
 * Inserts:
 *   <script src="<rel>/js/seo-enhancer.js" defer></script>
 *
 * just before </body> on every HTML page that has a </body>.
 *
 * Run:
 *   node tools/inject-seo-enhancer.cjs           # apply
 *   node tools/inject-seo-enhancer.cjs --dry     # preview
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY  = process.argv.includes('--dry');

const JS_FILE = 'js/seo-enhancer.js';

// Files to skip — fragments, design previews, drafts.
const SKIP = new Set([
  'calculator-design-preview.html',
  'tools/inject-seo-enhancer.cjs', // safety
]);

// Skip these top-level folders too.
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'mcps', 'agent-transcripts', 'terminals',
  'old', 'backup', 'archive'
]);

function walk (dir, out) {
  out = out || [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function relPathPrefix (htmlFileAbs) {
  const rel = path.relative(ROOT, htmlFileAbs);
  const depth = rel.split(path.sep).length - 1;
  if (depth <= 0) return '';
  return '../'.repeat(depth);
}

function inject (html, srcRel) {
  if (html.includes(srcRel) || html.includes('seo-enhancer.js')) {
    return { html, changed: false, reason: 'already present' };
  }
  const tag = `  <script src="${srcRel}" defer></script>`;
  if (/<\/body>/i.test(html)) {
    return {
      html: html.replace(/(<\/body>)/i, tag + '\n$1'),
      changed: true,
      reason: 'inserted before </body>',
    };
  }
  return { html, changed: false, reason: 'no </body>' };
}

function main () {
  const abs = path.join(ROOT, JS_FILE);
  if (!fs.existsSync(abs)) {
    console.error(`✗ Missing asset: ${JS_FILE}. Aborting.`);
    process.exit(1);
  }

  const allHtml = walk(ROOT);
  console.log(`\n[${DRY ? 'DRY-RUN' : 'APPLY'}] Scanning ${allHtml.length} HTML files for SEO enhancer injection.\n`);

  const report = { changed: 0, skipped: 0, errors: 0 };

  for (const file of allHtml) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (SKIP.has(rel) || SKIP.has(path.basename(file))) {
      report.skipped++;
      continue;
    }
    let body;
    try { body = fs.readFileSync(file, 'utf8'); } catch { report.errors++; continue; }

    const prefix = relPathPrefix(file);
    const src    = prefix + JS_FILE;
    const step   = inject(body, src);

    if (step.changed) {
      if (!DRY) fs.writeFileSync(file, step.html, 'utf8');
      report.changed++;
    } else {
      report.skipped++;
    }
  }

  console.log(`=== SUMMARY ===`);
  console.log(`Changed: ${report.changed}`);
  console.log(`Skipped: ${report.skipped}  (already present, no </body>, or excluded)`);
  console.log(`Errors : ${report.errors}`);
  if (DRY) console.log('\n(Dry-run — no files were written.)');
}

main();
