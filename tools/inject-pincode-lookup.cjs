/**
 * inject-pincode-lookup.cjs
 * Adds js/pincode-lookup.js to every page that uses the calculator lead form
 * (js/calculator/base.js) and cache-busts base.js so the updated logic ships.
 *
 * Run: node tools/inject-pincode-lookup.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const VER = '20260620c';

let injected = 0, busted = 0, skipped = 0;

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith('.html')) processFile(p);
  }
}

function processFile(file) {
  let c = fs.readFileSync(file, 'utf8');
  const m = c.match(/<script[^>]*src="([^"]*js\/)calculator\/base\.js(\?[^"]*)?"[^>]*><\/script>/);
  if (!m) return;
  const before = c;

  // 1) Inject pincode-lookup.js before base.js (if missing).
  if (!/pincode-lookup\.js/.test(c)) {
    const jsPrefix = m[1]; // e.g. ../../js/
    const tag = '<script defer src="' + jsPrefix + 'pincode-lookup.js?v=' + VER + '"></script>\n  ';
    c = c.replace(m[0], tag + m[0]);
    injected++;
  } else {
    skipped++;
  }

  // 2) Cache-bust base.js reference.
  c = c.replace(/(<script[^>]*src="[^"]*js\/calculator\/base\.js)(\?v=[^"]*)?("[^>]*><\/script>)/,
    function (full, a, ver, b) { busted++; return a + '?v=' + VER + b; });

  if (c !== before) fs.writeFileSync(file, c, 'utf8');
}

walk(ROOT);
console.log('pincode-lookup injected:', injected, '| base.js cache-busted:', busted, '| already had lookup:', skipped);
