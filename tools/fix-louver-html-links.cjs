#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'products', 'metal-louvers');
let n = 0;
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.html')) continue;
  const p = path.join(dir, f);
  let t = fs.readFileSync(p, 'utf8');
  const orig = t;
  // cluster pages: href="slug.html" -> href="slug"
  t = t.replace(/href="([a-z0-9-]+)\.html"/g, 'href="$1"');
  t = t.replace(/href="\.\.\/\.\.\/products\/metal-louvers\/([a-z0-9-]+)\.html"/g, 'href="../../products/metal-louvers/$1"');
  if (t !== orig) {
    fs.writeFileSync(p, t);
    console.log('fixed links:', f);
    n++;
  }
}
console.log('done:', n, 'files');
