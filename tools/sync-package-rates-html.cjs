/**
 * rates:sync — rebuild crawlable package card HTML + initial ₹ prices + JSON-LD
 *
 * Architecture:
 *   Build time (this script):
 *     data/rates.json + data/products.json + data/mirror.json
 *       → same formulas as js/standard-size-packages.js
 *       → rewrite cards / prices / schema into product HTML
 *
 *   Runtime (browser):
 *     Static HTML already has cards + Buy Now + real ₹
 *     JS fetches rates → updates [data-price] / [data-package-price] only
 *
 * Sources:
 *   - data/rates.json     (pergola / duct / global site rates)
 *   - data/products.json  (window / shower / louver / railing / fold / cladding rates)
 *   - data/mirror.json    (mirror calculator bands)
 *
 * Run after any rate change:
 *   npm run rates:sync
 *   npm run rates:sync -- --dry
 *   npm run rates:verify
 *
 * Implementation: delegates to inject-standard-packages-ssr.cjs
 */
'use strict';
require('./inject-standard-packages-ssr.cjs');
