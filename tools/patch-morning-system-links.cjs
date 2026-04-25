const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "../products/aluminium-windows");
const files = [
  "2-track-aluminium-window-price.html",
  "aluminium-window-glass-price-breakdown.html",
  "4-track-sliding-window-price.html",
  "aluminium-casement-window-price.html",
  "best-aluminium-window-for-home.html",
  "aluminium-sliding-window-price-calculator.html",
  "slim-aluminium-window-price-luxury.html",
  "aluminium-window-price-hyderabad.html",
  "aluminium-window-price-per-sqft.html",
  "sliding-vs-casement-window.html",
];

const old =
  '<h3 style="color: #e2e8f0; font-size: 1rem; margin: 0 0 0.5rem;">Related cluster pages</h3>';

const ins = `<h3 style="color: #e2e8f0; font-size: 1rem; margin: 0 0 0.5rem;">Premium system window (₹1150–3000/sqft)</h3>
      <ul style="margin: 0 0 1.25rem; padding-left: 1.25rem; line-height: 1.9;">
            <li><a href="aluminium-system-window-price" style="color: #fbbf24;">Aluminium system window price</a></li>
            <li><a href="what-is-aluminium-system-window" style="color: #fbbf24;">What is system window</a></li>
            <li><a href="system-sliding-window-price" style="color: #fbbf24;">System sliding price</a></li>
            <li><a href="system-window-glass-options" style="color: #fbbf24;">System glass options</a></li>
            <li><a href="system-window-for-villa" style="color: #fbbf24;">System window for villa</a></li>
      </ul>
      <h3 style="color: #e2e8f0; font-size: 1rem; margin: 0 0 0.5rem;">Related cluster pages</h3>`;

for (const f of files) {
  const p = path.join(dir, f);
  let t = fs.readFileSync(p, "utf8");
  if (!t.includes(old)) {
    console.log("SKIP (pattern not found)", f);
    continue;
  }
  if (t.includes("Premium system window (₹1150–3000/sqft)")) {
    console.log("SKIP (already patched)", f);
    continue;
  }
  t = t.split(old).join(ins);
  fs.writeFileSync(p, t);
  console.log("OK", f);
}
