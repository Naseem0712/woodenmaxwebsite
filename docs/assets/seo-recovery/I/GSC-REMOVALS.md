# Fix I — GSC Removals the owner must do

These are **outside** the woodenmax-live Pages deploy. Code in this Fix softens internal links and blocks translate-param mirrors on `woodenmax.in`; subdomain / already-indexed junk still needs Search Console action.

## A. Subdomain properties (required)

If `systemwindows.woodenmax.in` and/or `window.woodenmax.in` are verified GSC properties:

1. Open each property → **Removals** → **New request** → **Temporarily remove URL** (or prefix).
2. Submit **prefix** removals for high-noise paths first, e.g.:
   - `https://systemwindows.woodenmax.in/` (prefix) — city mirrors in GSC Pages sample: surat, bangalore, indore, delhi, ahmedabad, hyderabad, pune, …
   - `https://window.woodenmax.in/design/` (prefix) — ventilator / casement / louvers mirrors
3. Prefer lasting hygiene on those hosts (separate repos): `noindex` on thin city/design mirrors **or** 301 → matching `https://woodenmax.in/…` money URL — **only if** that subdomain repo is under your control and you explicitly approve redirects.
4. Until those hosts are cleaned, do **not** re-promote them from `woodenmax.in` nav/footer/hubs (already softened in this Fix).

If they are **not** verified: add them as GSC properties (DNS/HTML) only long enough to request removals, or use the **Removals** tool from the URL-prefix owner account that originally verified them.

## B. Image URLs indexed as pages (as needed)

1. In GSC for `woodenmax.in` → **Pages** / **Indexed** → filter for `/images/` or `.webp` / `.jpg` URLs appearing as **web** results.
2. For each junk asset URL: **Removals** → Temporarily remove that URL.
3. Do **not** blanket-`noindex` `/images/*` on Cloudflare — that drops Google Image Search; products + `sitemap-images.xml` still need image discovery.

## C. `?_x_tr_*` translated junk (as needed)

1. Filter GSC URL inspection / Pages for `_x_tr_`.
2. Removals for any still-indexed translate mirrors.
3. Ongoing prevention on `woodenmax.in`: `robots.txt` Disallow + `seo-enhancer.js` meta `noindex` (this Fix).

## D. Evidence from GSC Pages export (2026-11-06 sample)

| Host | Sample count in `GSC/Pages.csv` |
|------|----------------------------------|
| `systemwindows.woodenmax.in` | 13 |
| `window.woodenmax.in` | 5 |
| `woodenmax.in` query/image junk in top Pages | 0 in this export |

## Owner checklist
- [ ] Removals filed for `systemwindows.woodenmax.in` (prefix or URL list)
- [ ] Removals filed for `window.woodenmax.in` (prefix or URL list)
- [ ] Any indexed raw `/images/…` web URLs removed
- [ ] Any `_x_tr_*` mirrors removed
- [ ] Re-check impressions on those hosts in 2–4 weeks
