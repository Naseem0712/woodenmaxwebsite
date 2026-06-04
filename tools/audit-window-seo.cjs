const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const out = [];

function extract(html) {
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '';
  const desc = (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || [])[1] || '';
  const ogTitle = (html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i) || [])[1] || '';
  const h1m = html.match(/<h1[^>]*>([\s\S]{0,200}?)<\/h1>/i);
  const h1 = h1m ? h1m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
  const lenTitle = title.length;
  const lenDesc = desc.length;
  const issues = [];
  if (lenTitle > 60) issues.push('title>60');
  if (lenTitle < 30) issues.push('title<30');
  if (lenDesc > 160) issues.push('desc>160');
  if (lenDesc < 70) issues.push('desc<70');
  if (title !== ogTitle && ogTitle) issues.push('title≠og:title');
  if (/planning strip|this page's band|this page's strip/i.test(desc)) issues.push('internal jargon in desc');
  if (title.includes('(2026)') && !desc.includes('2026')) issues.push('year only in title');
  return { title, desc, h1, lenTitle, lenDesc, issues };
}

const hub = path.join(ROOT, 'products/aluminium-windows.html');
if (fs.existsSync(hub)) {
  const e = extract(fs.readFileSync(hub, 'utf8'));
  out.push({ file: 'products/aluminium-windows.html (HUB)', ...e });
}

const dir = path.join(ROOT, 'products/aluminium-windows');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html')).sort();
for (const f of files) {
  const rel = 'products/aluminium-windows/' + f;
  const e = extract(fs.readFileSync(path.join(dir, f), 'utf8'));
  out.push({ file: rel, ...e });
}

// markdown report
let md = '# Aluminium Windows — Title & Meta Description Audit\n\n';
md += `Total pages: **${out.length}** (1 hub + ${files.length} cluster)\n\n`;
md += '| # | Page | Title len | Desc len | Issues |\n';
md += '|---|------|-----------|----------|--------|\n';
out.forEach((r, i) => {
  md += `| ${i + 1} | ${r.file.replace('products/aluminium-windows/', '')} | ${r.lenTitle} | ${r.lenDesc} | ${r.issues.join(', ') || '—'} |\n`;
});
md += '\n---\n\n';

for (const r of out) {
  md += `## ${r.file}\n\n`;
  md += `**Title (${r.lenTitle} chars):**\n> ${r.title}\n\n`;
  md += `**Meta description (${r.lenDesc} chars):**\n> ${r.desc}\n\n`;
  if (r.h1) md += `**H1:** ${r.h1}\n\n`;
  if (r.issues.length) md += `**Flags:** ${r.issues.join(' · ')}\n\n`;
  md += '---\n\n';
}

const reportPath = path.join(ROOT, 'tools/window-category-seo-audit.md');
fs.writeFileSync(reportPath, md);
console.log('Wrote', reportPath);
console.log('Pages:', out.length);
