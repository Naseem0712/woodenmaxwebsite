/**
 * add-louver-sibling-links.cjs
 * Adds a "Related louver & pergola systems" cross-link block to louver money
 * pages that have no related section, boosting their internal inbound links.
 * Idempotent. Inserts before the floating calculator button.
 *
 * Run: node tools/add-louver-sibling-links.cjs           (dry run)
 *      node tools/add-louver-sibling-links.cjs --apply
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'products', 'metal-louvers');
const APPLY = process.argv.includes('--apply');

const LOUVERS = [
  { slug: 'motorized-louver-price-india',   anchor: 'Motorized / automatic louver system' },
  { slug: 'aluminium-facade-louver-price',  anchor: 'Aluminium facade louver price' },
  { slug: 'wooden-finish-aluminium-louvers',anchor: 'Wooden-finish aluminium louvers' },
  { slug: 'louver-canopy-facade',           anchor: 'Louver canopy &amp; facade' },
  { slug: 'ceiling-pergola-louvers',        anchor: 'Ceiling &amp; pergola louvers' },
  { slug: 'curved-architectural-louvers',   anchor: 'Curved architectural louvers' },
];
// Only the louver pages that currently lack any related/cross-link section.
const TARGETS = ['wooden-finish-aluminium-louvers', 'louver-canopy-facade', 'ceiling-pergola-louvers', 'curved-architectural-louvers'];
const FLOAT_RE = /\n[ \t]*<a href="#price-calculator[^"]*" class="floating-calc-button"/;

let changed = 0;
for (const slug of TARGETS) {
  const f = path.join(DIR, slug + '.html');
  if (!fs.existsSync(f)) { console.log('SKIP missing ' + slug); continue; }
  let html = fs.readFileSync(f, 'utf8');
  if (html.includes('>Related louver &amp; pergola systems<')) { console.log('SKIP already linked ' + slug); continue; }
  const m = html.match(FLOAT_RE);
  if (!m) { console.log('SKIP no float-button anchor ' + slug); continue; }

  const lis = LOUVERS.filter(p => p.slug !== slug)
    .map(p => '        <li><a href="' + p.slug + '" style="color:#1e40af;">' + p.anchor + '</a></li>')
    .join('\n');
  const block =
    '  <section style="padding: 2rem 0; background: #f3f4f6;">\n' +
    '    <div class="container" style="max-width: 960px;">\n' +
    '      <h2 class="section-title">Related louver &amp; pergola systems</h2>\n' +
    '      <p style="color:#64748b;font-size:0.9rem;max-width:820px;margin:0 0 0.75rem;">Explore other WoodenMax facade louver and outdoor roof systems — each with a live price calculator.</p>\n' +
    '      <ul style="line-height: 2; color: #334155;">\n' +
    lis + '\n' +
    '        <li><a href="../pergola/retractable-pergola" style="color:#1e40af;">Motorized retractable pergola</a> · <a href="../metal-louvers" style="color:#1e40af;">all louver products</a></li>\n' +
    '      </ul>\n' +
    '    </div>\n' +
    '  </section>\n';

  const at = m.index + 1; // keep the leading newline before the float button
  html = html.slice(0, at) + block + html.slice(at);
  changed++;
  console.log((APPLY ? 'ADD  ' : 'WOULD ') + slug + '  (+' + (LOUVERS.length - 1) + ' louver + pergola links)');
  if (APPLY) fs.writeFileSync(f, html);
}
console.log('\n' + (APPLY ? 'APPLIED' : 'DRY RUN') + ' — pages updated: ' + changed);
