/**
 * tools/inject-site-nav.cjs
 *
 * Adds the unified site chrome (nav + footer) to every HTML page by injecting:
 *   <link rel="stylesheet" href="<rel>/css/site-nav.css">    (before </head>)
 *   <link rel="stylesheet" href="<rel>/css/site-footer.css"> (before </head>)
 *   <script src="<rel>/js/site-nav.js" defer></script>       (before </body>)
 *   <script src="<rel>/js/site-footer.js" defer></script>    (before </body>)
 *
 * Idempotent: re-runs are no-ops.
 *
 * Run:
 *   node tools/inject-site-nav.cjs            # apply
 *   node tools/inject-site-nav.cjs --dry      # preview only
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY  = process.argv.includes('--dry');

// All site-chrome assets that should land on every page.
// JS order: footer → site-nav → nav-tree so final DOM order is nav-tree, site-nav, site-footer.
const ASSETS = [
  { kind: 'css', file: 'css/site-nav.css'    },
  { kind: 'css', file: 'css/site-footer.css' },
  { kind: 'js',  file: 'js/site-footer.js'   },
  { kind: 'js',  file: 'js/site-nav.js'      },
  { kind: 'js',  file: 'js/nav-tree.js'      }
];

const SKIP = new Set([
  'calculator-design-preview.html',
  '_grills-source/index.html'
]);

function listHtml (dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'tools', 'mcps', 'agent-transcripts', 'terminals', '_grills-source'].includes(e.name)) continue;
      listHtml(p, out);
    } else if (e.isFile() && e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function relPrefix (htmlAbs) {
  const rel = path.relative(ROOT, htmlAbs).split(path.sep).join('/');
  const depth = rel.split('/').length - 1;
  return depth === 0 ? '' : '../'.repeat(depth);
}

function processFile (htmlAbs) {
  const rel = path.relative(ROOT, htmlAbs).split(path.sep).join('/');
  if (SKIP.has(rel)) return { rel, action: 'skipped (excluded)' };

  let html    = fs.readFileSync(htmlAbs, 'utf8');
  const prefix = relPrefix(htmlAbs);

  let added = 0;
  for (const a of ASSETS) {
    if (html.includes(a.file)) continue;
    const tag = a.kind === 'css'
      ? `<link rel="stylesheet" href="${prefix}${a.file}">`
      : `<script src="${prefix}${a.file}" defer></script>`;
    if (a.kind === 'css') {
      if (/<\/head>/i.test(html)) {
        html = html.replace(/<\/head>/i, '  ' + tag + '\n</head>');
        added++;
      }
    } else if (a.file === 'js/nav-tree.js' && /<script[^>]+src="[^"]*site-nav\.js"/i.test(html)) {
      html = html.replace(
        /(<script[^>]+src="[^"]*site-nav\.js"[^>]*>\s*<\/script>)/i,
        tag + '\n  $1'
      );
      added++;
    } else {
      if (/<\/body>/i.test(html)) {
        html = html.replace(/<\/body>/i, '  ' + tag + '\n</body>');
        added++;
      } else {
        html += '\n' + tag + '\n';
        added++;
      }
    }
  }

  if (added === 0) return { rel, action: 'already injected' };
  if (DRY)         return { rel, action: 'WOULD inject ' + added };
  fs.writeFileSync(htmlAbs, html, 'utf8');
  return { rel, action: 'injected (' + added + ')' };
}

function main () {
  const files = listHtml(ROOT);
  console.log(`\n[${DRY ? 'DRY' : 'APPLY'}] Scanning ${files.length} HTML files for site-nav injection.\n`);

  let injected = 0, already = 0, skipped = 0;
  for (const f of files) {
    const r = processFile(f);
    if (r.action.indexOf('injected') === 0 || r.action.indexOf('WOULD') === 0) injected++;
    else if (r.action === 'already injected') already++;
    else skipped++;
  }
  console.log(`=== SUMMARY ===`);
  console.log(`Injected         : ${injected}`);
  console.log(`Already present  : ${already}`);
  console.log(`Skipped (excluded): ${skipped}`);
}

main();
