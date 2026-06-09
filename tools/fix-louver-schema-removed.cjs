#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'products', 'metal-louvers');
const re = /,\{"@type":"ListItem",REMOVED\}/g;
let n = 0;
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.html')) continue;
  const p = path.join(dir, f);
  const t = fs.readFileSync(p, 'utf8');
  const next = t.replace(re, '');
  if (next !== t) {
    fs.writeFileSync(p, next);
    console.log('fixed schema:', f);
    n++;
  }
}
console.log('done:', n, 'files');
