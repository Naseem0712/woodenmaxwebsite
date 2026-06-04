/**
 * Bump grill marketing ₹ copy by ~10% (rounded to nearest ₹5).
 * Run: node tools/bump-grill-marketing-prices.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILES = [
  path.join(ROOT, 'products', 'grills.html'),
  ...fs.readdirSync(path.join(ROOT, 'products', 'grills')).filter((f) => f.endsWith('.html')).map((f) => path.join(ROOT, 'products', 'grills', f)),
];

const PAIRS = [
  ['₹200–600', '₹220–660'],
  ['₹200-600', '₹220-660'],
  ['₹200–300', '₹220–330'],
  ['₹200-300', '₹220-330'],
  ['₹300–400', '₹330–440'],
  ['₹300-400', '₹330-440'],
  ['₹350–600', '₹385–660'],
  ['₹350-600', '₹385-660'],
  ['₹350–450', '₹385–495'],
  ['₹350-450', '₹385-495'],
  ['₹400–550', '₹440–605'],
  ['₹400-550', '₹440-605'],
  ['₹450–600', '₹495–660'],
  ['₹450-600', '₹495-660'],
];

const TO_PHRASES = [
  ['from ₹200 to ₹300', 'from ₹220 to ₹330'],
  ['from ₹300 to ₹400', 'from ₹330 to ₹440'],
  ['from ₹350 to ₹450', 'from ₹385 to ₹495'],
  ['from ₹400 to ₹550', 'from ₹440 to ₹605'],
  ['from ₹450 to ₹600', 'from ₹495 to ₹660'],
  ['from ₹200 to ₹300', 'from ₹220 to ₹330'],
];

const SINGLES = [
  ['₹600/sqft', '₹660/sqft'],
  ['₹550/sqft', '₹605/sqft'],
  ['₹500/sqft', '₹550/sqft'],
  ['₹450/sqft', '₹495/sqft'],
  ['₹400/sqft', '₹440/sqft'],
  ['₹350/sqft', '₹385/sqft'],
  ['₹300/sqft', '₹330/sqft'],
  ['₹275/sqft', '₹305/sqft'],
  ['₹250/sqft', '₹275/sqft'],
  ['₹200/sqft', '₹220/sqft'],
];

function bumpFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const before = html;
  for (const [from, to] of PAIRS) html = html.split(from).join(to);
  for (const [from, to] of TO_PHRASES) html = html.split(from).join(to);
  for (const [from, to] of SINGLES) html = html.split(from).join(to);
  if (html !== before) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log('Updated:', path.relative(ROOT, filePath));
  }
}

FILES.forEach(bumpFile);
