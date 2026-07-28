/**
 * Remove duplicate wm-sliding-context / wm-why-choose blocks (keep first only).
 */
const fs = require('fs');
const path = require('path');

const AW = path.join(__dirname, '..', 'products/aluminium-windows');

function dedupeSection(content, className) {
  const re = new RegExp(
    `\n  <section class="${className.replace(/ /g, ' ')}"[\\s\\S]*?\n  </section>\n`,
    'g'
  );
  const matches = [...content.matchAll(re)];
  if (matches.length <= 1) return content;
  let out = content;
  for (let i = matches.length - 1; i >= 1; i--) {
    const m = matches[i];
    out = out.slice(0, m.index) + out.slice(m.index + m[0].length);
  }
  return out;
}

function dedupeFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const before = fs.readFileSync(filePath, 'utf8');
  let after = before;
  after = dedupeSection(after, 'wm-series-guide wm-sliding-context');
  after = dedupeSection(after, 'wm-why-choose');
  // duplicate inline style blocks from double inject
  after = after.replace(
    /(<style id="wm-series-guide-styles">[\s\S]*?<\/style>\n)([\s\S]*?\1)+/g,
    '$1'
  );
  if (after !== before) {
    fs.writeFileSync(filePath, after, 'utf8');
    console.log('DEDUPED:', path.basename(filePath));
  }
}

fs.readdirSync(AW)
  .filter((f) => f.endsWith('.html'))
  .forEach((f) => dedupeFile(path.join(AW, f)));

console.log('Done.');
