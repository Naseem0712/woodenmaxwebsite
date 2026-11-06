# Fix N PASS/FAIL — Mirrors hub + top children

**Verdict: PASS** (local + live 2026-11-06) — commit `e733343`

## Twin test
Could hub/product/price/city titles steal each other's SERP identity? **No** (see N-twin-test.md)

## Checklist
- [x] Canonical / URL unchanged
- [x] Unique title / H1 / meta / OG (hub browse · bathroom product · C-type/backlit/₹/ft price · touch · cities)
- [x] Soft rates; Fix J formulas; no free CTAs
- [x] FAQ visible ≡ FAQPage on hub (exact Q+A retained)
- [x] Product schema name honest on touched PDPs
- [x] Keywords meta absent
- [x] Customer-facing English only

## Hashes
- `mirror-profiles` sha256_12=`1f388114055b`
- `led-mirror-profile-price` sha256_12=`5fbf7e6550e4`
- `led-bathroom-mirror-profile` sha256_12=`ec41f45d34b4`
- `backlit-mirror-profile-price` sha256_12=`39eae15a50e2`
- `mirror-profile-price-per-foot` sha256_12=`e2943dbfd4e5`
- `touch-sensor-mirror-profile` sha256_12=`4d9df13c8d2e`
- `led-mirror-profile-delhi` sha256_12=`9f7ce1de17c3`
- `led-mirror-profile-hyderabad` sha256_12=`0c68ab9cffcf`

## Live verify (2026-11-06)
- Commit: `e733343` pushed origin/main
- Live hub title: `Mirror Profiles for Indian Homes | Types, Soft Price Bands & Calculators | WoodenMax` (match)
- Live C-type price title: `C-Type LED Mirror Price in India (2026) | Soft ₹/sqft Band | WoodenMax` (match)
- Unique within mirrors family: YES
