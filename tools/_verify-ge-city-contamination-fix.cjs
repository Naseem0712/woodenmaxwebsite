const fs = require('fs');
const { execSync } = require('child_process');

const cities = [
  'bangalore', 'chandigarh', 'delhi', 'mumbai',
  'pune', 'vijayawada', 'visakhapatnam', 'warangal'
];
const bad = /aluminium window|2-track|bedroom window|12 openings|Where your windows are built|casement|lift-and-slide|mesh-window|#glass-calculator|aluminium-window-price-calculator/i;

let fail = 0;
for (const c of cities) {
  const p = 'products/glass-elevation/glass-elevation-price-' + c + '.html';
  const h = fs.readFileSync(p, 'utf8');
  const issues = [];
  if (bad.test(h)) issues.push('BAD_PHRASE');
  if (!h.includes('glass-elevation-price-' + c + '"')) issues.push('CANON');
  if (!h.includes('Glass Elevation price in')) issues.push('H1');
  if (!h.includes('href="/glass-elevation-price-calculator"')) issues.push('CALC');
  if (!h.includes('310 sqft facade')) issues.push('GST');
  if (!h.includes('Where your facade systems are built')) issues.push('FACTORY');
  if (!h.includes('Framed elevation / curtain wall')) issues.push('TIERS');
  if (!h.includes('Structural glazing with low-E DGU')) issues.push('MID');
  if (!h.includes('Spider glazing')) issues.push('SPIDER');
  console.log(c + ':', issues.length ? issues.join(',') : 'OK');
  if (issues.length) fail++;
}

for (const c of ['bangalore', 'mumbai', 'visakhapatnam']) {
  const out = execSync(
    'git diff --name-only -- products/aluminium-windows/aluminium-window-price-' + c + '.html',
    { encoding: 'utf8' }
  ).trim();
  console.log('alum-' + c + ':', out ? 'CHANGED' : 'unchanged');
  if (out) fail++;
}

process.exit(fail ? 1 : 0);
