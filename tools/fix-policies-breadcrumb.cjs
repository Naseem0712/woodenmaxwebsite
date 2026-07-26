/**
 * fix-policies-breadcrumb.cjs
 * The policy pages carried a "Policies" breadcrumb pointing at /policies/,
 * which has no index page and returns 404 — in the visible nav and in the
 * BreadcrumbList JSON-LD (so Google was reading a 404 inside structured data).
 *
 * There is no policies hub to point at, and creating one was out of scope, so
 * the dead middle crumb is dropped: Home > <Policy name>. The remaining items
 * are renumbered so the BreadcrumbList stays valid.
 *
 * Run: node tools/fix-policies-breadcrumb.cjs           (dry run)
 *      node tools/fix-policies-breadcrumb.cjs --apply
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DIR = path.join(ROOT, 'policies');

const SEP = '<span aria-hidden="true"> &rsaquo; </span>';
let changed = 0, edits = 0;

for (const file of fs.readdirSync(DIR).filter(f => f.endsWith('.html'))) {
  const p = path.join(DIR, file);
  let html = fs.readFileSync(p, 'utf8');
  const before = html;
  const done = [];

  // 1. cluster-breadcrumb variant: <a href="../policies/">Policies</a> + its separator
  if (html.includes('<a href="../policies/">Policies</a>')) {
    html = html.replace('<a href="../policies/">Policies</a>' + SEP, '');
    done.push('visible crumb (cluster)');
  }

  // 2. policy-breadcrumb variant on gst-transport-policy
  if (html.includes('<a href="./">Policies</a> &rsaquo;')) {
    html = html.replace(/\s*<a href="\.\/">Policies<\/a> &rsaquo;\r?\n/, '\n');
    done.push('visible crumb (policy)');
  }

  // 3. BreadcrumbList JSON-LD: drop the Policies item, renumber what follows
  const ldRe = /\{"@type":"ListItem","position":2,"name":"Policies","item":"https:\/\/woodenmax\.in\/policies\/"\},/;
  if (ldRe.test(html)) {
    html = html.replace(ldRe, '');
    html = html.replace(/(\{"@type":"ListItem","position":)3(,"name":)/g, '$12$2');
    done.push('BreadcrumbList JSON-LD');
  }

  if (html !== before) {
    changed++; edits += done.length;
    console.log('  ' + file.padEnd(34) + done.join(' + '));
    if (APPLY) fs.writeFileSync(p, html);
  }
}
console.log('\n' + (APPLY ? 'APPLIED' : 'DRY RUN') + ' — pages: ' + changed + ', edits: ' + edits);
