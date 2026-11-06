# Hub redirect loop fix — pergola / metal-louvers

**Date:** 2026-11-06
**Problem:** Live bare hub paths returned CF `308` → trailing slash, while `_redirects` returned `301` slash → bare → infinite loop.

**Root cause:** After stub `.html` removal, hubs lived only as `products/<hub>/index.html`, but `_redirects` still had:
- `/products/<hub> → /products/<hub>/index.html 200`
- `/products/<hub>/ → /products/<hub> 301`
Cloudflare directory trailing-slash 308 fought the slash→bare 301.

**Fix (aluminium-windows / shower pattern; no slug change):**
1. Restore full hub HTML at `products/pergola.html` and `products/metal-louvers.html` (pretty URL source of truth).
2. Replace directory `index.html` with noindex stub → clean bare URL.
3. Remove bare → `index.html` 200 rewrite from `_redirects`; keep `.html` / `index*` / trailing-slash → bare 301.

**Local verify (localhost:5500):**
- `/products/pergola` → 200 + real hub title
- `/products/pergola/` → 200 + real hub title
- `/products/metal-louvers` → 200 + real hub title
- `/products/metal-louvers/` → 200 + real hub title

**Live verify (2026-11-06 commit e733343):**
- `/products/pergola` → **200** real hub title
- `/products/pergola/` → **301** → bare → **200**
- `/products/metal-louvers` → **200** real hub title
- `/products/metal-louvers/` → **301** → bare → **200**
- Loop cleared (no more 308↔301).

