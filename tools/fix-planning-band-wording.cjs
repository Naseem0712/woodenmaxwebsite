const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'products', 'aluminium-windows');

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.html'))) {
  const fp = path.join(DIR, file);
  let html = fs.readFileSync(fp, 'utf8');
  const before = html;

  html = html.replace(/\bplanning band\b/gi, 'installed price range');
  html = html.replace(/\bplanning bands\b/gi, 'price ranges');
  html = html.replace(
    /Same <strong style="color:#e2e8f0;">([^<]+)<\/strong> installed price range across system pages; morning cluster tools below for 2 track, glass, city, and comparison SEO\./g,
    'This page uses <strong style="color:#e2e8f0;">$1</strong> (before GST) as a reference — explore related calculators and guides below.'
  );
  html = html.replace(/mid installed price range/gi, 'mid price tier');
  html = html.replace(/Package focus:/g, 'Includes:');

  if (html !== before) {
    fs.writeFileSync(fp, html, 'utf8');
    console.log('Cleaned:', file);
  }
}
