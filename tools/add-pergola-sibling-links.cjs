/**
 * add-pergola-sibling-links.cjs
 * Adds a "More pergola systems" sibling cross-link block to pergola subpages
 * that lack it, so every pergola money page gets ~5 contextual sibling inbound
 * links (mirrors the well-ranking mirror-profile cluster pattern).
 * Idempotent. Inserts before the FAQ section.
 *
 * Run: node tools/add-pergola-sibling-links.cjs           (dry run)
 *      node tools/add-pergola-sibling-links.cjs --apply
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'products', 'pergola');
const APPLY = process.argv.includes('--apply');

const PAGES = [
  { slug: 'aluminium-pergola',                         anchor: 'Aluminium pergola — glass-roof, powder-coated' },
  { slug: 'retractable-pergola',                       anchor: 'Motorized retractable / automatic pergola roof' },
  { slug: 'glass-skylight',                            anchor: 'Glass roof skylight pergola' },
  { slug: 'profile-pergola',                           anchor: 'Louvered profile terrace pergola' },
  { slug: 'profile-iron-canopy',                       anchor: 'Iron pergola &amp; entrance canopy' },
  { slug: 'aluminium-pergola-glass-roof-price-india',  anchor: 'Pergola glass-roof price guide (per sqft)' },
];

// Only pages missing the block; aluminium-pergola already has one, the
// glass-roof price page uses its own cluster comparison table.
const TARGETS = ['retractable-pergola', 'glass-skylight', 'profile-pergola', 'profile-iron-canopy'];
const FAQ_ANCHOR = '  <section class="container pergola-faq-wrap"';

let changed = 0;
for (const slug of TARGETS) {
  const f = path.join(DIR, slug + '.html');
  if (!fs.existsSync(f)) { console.log('SKIP missing ' + slug); continue; }
  let html = fs.readFileSync(f, 'utf8');
  if (html.includes('>More pergola systems<')) { console.log('SKIP already linked ' + slug); continue; }
  const idx = html.indexOf(FAQ_ANCHOR);
  if (idx === -1) { console.log('SKIP no FAQ anchor ' + slug); continue; }

  const lis = PAGES.filter(p => p.slug !== slug)
    .map(p => '        <li><a href="' + p.slug + '" style="color:#1e40af;">' + p.anchor + '</a></li>')
    .join('\n');
  const block =
    '  <section style="padding: 2rem 0; background: #f3f4f6;">\n' +
    '    <div class="container" style="max-width: 960px;">\n' +
    '      <h2 class="section-title">More pergola systems</h2>\n' +
    '      <p style="color:#64748b;font-size:0.9rem;max-width:820px;margin:0 0 0.75rem;">Compare every WoodenMax pergola roof type with a live calculator on each page.</p>\n' +
    '      <ul style="line-height: 2; color: #334155;">\n' +
    lis + '\n' +
    '        <li><a href="../pergola" style="color:#1e40af;">All pergola types — pricing hub</a> · <a href="../../blog/pergola-design-ideas-india" style="color:#1e40af;">Pergola design guide</a></li>\n' +
    '      </ul>\n' +
    '    </div>\n' +
    '  </section>\n\n';

  html = html.slice(0, idx) + block + html.slice(idx);
  changed++;
  console.log((APPLY ? 'ADD  ' : 'WOULD ') + slug + '  (+' + (PAGES.length - 1) + ' sibling links)');
  if (APPLY) fs.writeFileSync(f, html);
}
console.log('\n' + (APPLY ? 'APPLIED' : 'DRY RUN') + ' — pages updated: ' + changed);
