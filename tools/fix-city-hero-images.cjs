const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const ALU_REL = '../../images/products/City Price Page/best-aluminium-window-for-home-design.webp';
const ALU_ABS = 'https://woodenmax.in/images/products/City%20Price%20Page/best-aluminium-window-for-home-design.webp';
const GLASS_REL = '../../images/products/villa luxury window/premium-window-large-glass-view.webp';
const GLASS_ABS = 'https://woodenmax.in/images/products/villa%20luxury%20window/premium-window-large-glass-view.webp';

const files = [
  'products/aluminium-windows/aluminium-window-price-bangalore.html',
  'products/aluminium-windows/aluminium-window-price-mumbai.html',
  'products/aluminium-windows/aluminium-window-price-delhi.html',
  'products/aluminium-windows/aluminium-window-price-pune.html',
  'products/aluminium-windows/aluminium-window-price-warangal.html',
  'products/aluminium-windows/aluminium-window-price-chandigarh.html',
  'products/aluminium-windows/aluminium-window-price-vijayawada.html',
  'products/aluminium-windows/aluminium-window-price-visakhapatnam.html',
  'products/glass-elevation/glass-elevation-price-bangalore.html',
  'products/glass-elevation/glass-elevation-price-mumbai.html',
  'products/glass-elevation/glass-elevation-price-delhi.html',
  'products/glass-elevation/glass-elevation-price-pune.html',
  'products/glass-elevation/glass-elevation-price-warangal.html',
  'products/glass-elevation/glass-elevation-price-chandigarh.html',
  'products/glass-elevation/glass-elevation-price-vijayawada.html',
  'products/glass-elevation/glass-elevation-price-visakhapatnam.html'
];

let updated = 0;
for (const rel of files) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    console.warn('skip missing', rel);
    continue;
  }
  const isGlass = rel.includes('glass-elevation');
  const heroRel = isGlass ? GLASS_REL : ALU_REL;
  const heroAbs = isGlass ? GLASS_ABS : ALU_ABS;
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;
  html = html.replace(/https:\/\/woodenmax\.in\/images\/cities\/[a-z-]+-hero\.webp/g, heroAbs);
  html = html.replace(/\.\.\/\.\.\/images\/cities\/[a-z-]+-hero\.webp/g, heroRel);
  if (html !== before) {
    fs.writeFileSync(abs, html);
    updated++;
    console.log('fixed', rel);
  }
}
console.log('done:', updated, 'files');
