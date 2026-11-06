# Fix F — Merchant Path B dual-check

**Date:** 2026-11-06  
**Path chosen:** **B — Book Now ₹1,000** (feed `price` + landing CTA + Razorpay charge all = ₹1,000)

## Root cause
1. **Purchase mismatch:** Shopping feed listed full package / ₹/sqft starting prices while primary checkout charged **₹1,000 booking** → GMC manual finding *User cannot complete purchase* (151 / 100%).
2. **Invalid sales price:** `products-feed.csv` had column drift (`sale_price` = `new` / brand values) and/or feed price ≠ shop purchase amount for at least one SKU.

## What we changed
- Generators emit Path B booking SKUs at **`1000.00 INR`**, titles prefixed `Booking ₹1,000 — …`, empty `sale_price`, no free `0.00` shipping in feed/XML.
- Package cards: **Online booking ₹1,000** prominent + **Book Now — ₹1,000** CTA; fabrication shown as estimate only.
- Catalog mirror CTA: **Book Now — Pay ₹1,000**.
- SSR rebuilt on 79 product pages (`inject-standard-packages-ssr.cjs --force`).

## Evidence
| File | Notes |
|------|--------|
| `before-gmc-diagnostics.png` | GMC Needs attention — purchase issue 151 products |
| `after-local-book-now.png` | Localhost: Online booking ₹1,000 + Book Now — ₹1,000 + Est. fabrication secondary |
| Live GMC after | **Pending** feed re-fetch + Google re-crawl / review (diagnostics will not clear instantly) |

## Pass / Fail
- **Local Path B alignment:** PASS (feed + CTA + Razorpay booking amount = ₹1,000)
- **GMC Diagnostics clear:** PENDING (deploy + Fetch now + wait / request review)

## Owner next steps in Merchant Center
1. Deploy this commit to `woodenmax.in`.
2. Data sources → Fetch `https://woodenmax.in/products-feed.xml` (+ package CSV if separate).
3. After fetch succeeds, open Diagnostics → **Fix issue** / request review when offered.
4. Re-check Invalid sales price (should clear when `sale_price` empty and price=₹1,000 matches Book Now).
