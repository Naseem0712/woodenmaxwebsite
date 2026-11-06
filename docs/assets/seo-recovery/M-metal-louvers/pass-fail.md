# Fix M PASS/FAIL — Louvers hub + facade price

**Verdict: PASS** (local + live children 2026-11-06) — commit `1204c6c`

## Twin test
Could hub/price titles steal each other's SERP identity? **No** (see M-twin-test.md)

## Checklist
- [x] Canonical / URL unchanged
- [x] Unique title / H1 / meta / OG (hub browse · facade price)
- [x] Soft rates; Fix J formulas; no free CTAs
- [x] FAQ visible ≡ FAQPage (exact Q+A)
- [x] Product schema name honest
- [x] Keywords meta removed on hub
- [x] Customer-facing English only

## Hashes
- `metal-louvers` sha256_12=`9b6f8fd56619`
- `aluminium-facade-louver-price` sha256_12=`e920e978e5cb`

## Live verify (2026-11-06)
- Commit: `1204c6c` pushed origin/main
- Live facade title: `Aluminium Facade Louver Price in India (2026) | Soft ₹/sqft Band | WoodenMax` (match)
- Hub title (github raw @1204c6c; host bare hub path has pre-existing trailing-slash redirect loop): `Aluminium Louvers for Indian Facades | Types, Soft Price Bands & Calculators | WoodenMax`
- Unique within louvers family: YES
