#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../products/grills/aluminium-window-grills.html');
let html = fs.readFileSync(file, 'utf8');

html = html.replace(
  /<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"ItemList","name":"Window grill design gallery"[\s\S]*?<\/script>\n?/,
  ''
);

html = html.replace(
  /(?:<\/script>)?<script>\s*\(function\(\)\{\s*var tabs=document\.querySelectorAll\('\.wm-grill-gallery-tab'\);[\s\S]*?\}\)\(\);\s*<\/script>\n?/,
  (m) => (m.startsWith('</script>') ? '</script>' : '')
);

fs.writeFileSync(file, html, 'utf8');
console.log('jsonld:', !html.includes('Window grill design gallery'));
console.log('filter:', !html.includes('wm-grill-gallery-tab'));
