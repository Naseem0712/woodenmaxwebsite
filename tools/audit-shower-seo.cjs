const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function len(s) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').length;
}

const files = [
  'products/shower-partitions.html',
  ...fs
    .readdirSync(path.join(ROOT, 'products/shower-partitions'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => `products/shower-partitions/${f}`),
];

const rows = [];
for (const f of files) {
  const h = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const title = (h.match(/<title>([^<]*)<\/title>/i) || [])[1] || '';
  const desc = (h.match(/<meta name="description" content="([^"]*)"/i) || [])[1] || '';
  const issues = [];
  const tl = len(title);
  const dl = len(desc);
  if (tl > 60) issues.push(`title ${tl}>60`);
  if (tl < 35) issues.push('title short');
  if (dl > 160) issues.push(`desc ${dl}>160`);
  if (dl < 110) issues.push('desc thin');
  if (!/live calculator/i.test(title) && !/live calculator/i.test(desc)) issues.push('no Live Calculator');
  if (/links to/i.test(desc)) issues.push('robotic meta');
  if (title.split(/[|—]/).length > 4) issues.push('title pipes');
  if (/designer|walk-in frameless shower glass door price/i.test(title) && tl > 75)
    issues.push('stuffed product title');
  rows.push({ f, tl, dl, title, desc, issues });
}

rows.sort((a, b) => b.tl - a.tl);
let md = '# Shower glass — Title & Meta audit\n\n';
md += `Pages: **${rows.length}** (1 hub + ${rows.length - 1} cluster/products)\n\n`;
md += '| Page | T len | D len | Issues |\n|------|-------|-------|--------|\n';
for (const r of rows) {
  md += `| ${r.f.replace('products/', '')} | ${r.tl} | ${r.dl} | ${r.issues.join('; ') || '—'} |\n`;
}
md += '\n---\n\n';
for (const r of rows) {
  md += `### ${r.f}\n**Title (${r.tl}):** ${r.title}\n\n**Meta (${r.dl}):** ${r.desc}\n\n`;
}
fs.writeFileSync(path.join(ROOT, 'tools/shower-category-seo-audit.md'), md);
console.log('Wrote tools/shower-category-seo-audit.md');
