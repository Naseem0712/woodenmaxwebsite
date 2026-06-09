const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let n = 0;
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith('.html')) {
      let c = fs.readFileSync(p, 'utf8');
      const next = c.replace(/nav-tree\.js\?v=20260519/g, 'nav-tree.js?v=20260520');
      if (next !== c) {
        fs.writeFileSync(p, next, 'utf8');
        n++;
      }
    }
  }
}
walk(ROOT);
console.log('Bumped nav-tree cache on', n, 'HTML files');
