# Fix I — Softened junk-host internal links

All changes keep public **money paths** on `woodenmax.in` unchanged.

| Location | Before | After |
|----------|--------|-------|
| `js/site-nav.js` utility | `systemwindows.woodenmax.in` (“System Windows”) | `/aluminium-window-price-calculator` (“Window Calculator”) |
| `js/site-footer.js` Products | `systemwindows.woodenmax.in` | `/aluminium-window-price-calculator` |
| `index.html` about copy | systemwindows calculator link | `/aluminium-window-price-calculator` |
| `index.html` calculators grid card | systemwindows subdomain card | main aluminium calculator card |
| `index.html` Organization `sameAs` | included window + systemwindows hosts | social profiles only (junk hosts removed) |
| `calculators.html` | separate System Windows subdomain card | removed; primary aluminium card CTA → `/aluminium-window-price-calculator` |
| `products/aluminium-windows.html` cross-site note | window + systemwindows promo | calculator + `/calculators` on main site |
| `products/grills.html` cross-site note | `window.woodenmax.in/products/grills` | main hub + calculator links |
| `contact.html` | systemwindows calculator | `/aluminium-window-price-calculator` |

Left intact (not crawl equity / not user-facing SEO links):
- `js/window-site-urls.js` helper + `worker/http.js` CORS allowlist (API/config, not SERP linking)
- HTML comment on `index.html` about optional URL helpers
