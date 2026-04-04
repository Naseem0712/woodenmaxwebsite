# window.woodenmax.in ↔ woodenmax.in URL map

- **Subdomain (topic hub):** `https://window.woodenmax.in` — aluminium windows, telescope doors, safety grills (same folder paths as main site).
- **Main site (full catalog):** `https://woodenmax.in` — all categories (elevation, shower, louvers, glass elevation, etc.).

## For the `window.woodenmax.in` project

1. Copy `data/window-subdomain-urls.json` into that repo (any path).
2. In headers/footers, link **back** to the main site for non-window categories, e.g.:
   - `https://woodenmax.in/products/shower-partitions`
   - `https://woodenmax.in/products/elevation-cladding`
   - `https://woodenmax.in/contact`

## For this repo (woodenmax.in)

- `js/window-site-urls.js` exposes `window.WOODENMAX_URLS` if you need it in future scripts.
- Category listing pages include a short notice linking to the matching paths on `window.woodenmax.in`.

## SEO note

Use **consistent** titles/canonicals per host; avoid duplicate thin pages. Either `noindex` one property or use `rel=canonical` to the preferred URL — decide with your SEO plan.
