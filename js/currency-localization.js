/**
 * WoodenMax — currency localization (stub).
 *
 * The real implementation lives inline at the top of `js/main.js`
 * (the IIFE that exposes `window.formatPriceFromINR`).  It was
 * previously duplicated here, which caused divergence whenever the
 * per-country PPP / premium table was updated in only one place.
 *
 * This file now does NOTHING when loaded by itself, except set the
 * `__wmPricingModuleLoaded` flag so that legacy pages that still
 * include it before `main.js` don't blow up.
 *
 * To change the per-country pricing factors, edit the `PPP` table at
 * the top of `js/main.js` — that is the single source of truth.
 */
(function (global) {
  'use strict';
  if (global.__wmPricingModuleLoaded) return;
  // Intentionally a no-op stub.  main.js will install the real module.
})(typeof window !== 'undefined' ? window : this);
