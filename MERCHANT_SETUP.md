# WoodenMax – Google Shopping / Merchant Center

Site par product feed ready hai. Google par dubara listings ke liye **naya ya appeal** + **feed connect** karna hoga.

---

## 0. Account band / reject ho gaya — kya karein

Google Merchant Center account **suspend** ya **disapproved** tab hota hai jab policy, website, ya business proof fail ho jaye.

### Pehle reason dekho (zaroori)

1. [Merchant Center](https://merchantcenter.google.com) login karo (purana account agar access ho).
2. **Account issues** / **Diagnostics** / **Notifications** kholo.
3. Likely reasons (custom manufacturing sites par common):
   - Website / return policy / contact mismatch
   - Misleading prices (feed price ≠ landing page)
   - Domain verify nahi
   - Prohibited or unclear product (e.g. “free” misleading)
   - Duplicate accounts

### “User cannot complete purchase” (manual check) — kya karna hai

Google ne likha: **Buy button nahi**, page homepage par redirect, ya product store par nahi.

| Google check | WoodenMax fix |
|--------------|----------------|
| Functioning Buy button | Har **mirror / louver catalog** page par **“Buy online — Pay ₹1,000”** (Razorpay live). Shower/window pages par calculator + cart **“Book order — Pay ₹1,000”**. |
| Product page loads | Feed link = same URL as `<link rel="canonical">` (deploy latest `products-feed.xml`) |
| Product on store | Feed mein jo link hai woh 404 na ho — deploy HTML + images |

**Review dubara:** Merchant Center → issue → **I fixed the issue** — abhi screenshot ke hisaab se **8 Jun 2026** ke baad button enable hoga. Usse pehle deploy + 2–3 sample pages test karo.

**Test URLs (reviewer jaisa):**

1. https://woodenmax.in/products/mirror-profiles/led-bathroom-mirror-profile — size daalo → **Buy online — Pay ₹1,000** dikhe  
2. https://woodenmax.in/products/shower-partitions/frameless-shower-partition — calculator → cart → **Book order — Pay ₹1,000**  
3. https://woodenmax.in/policies/cancellation-refund-policy — refund clear  

### Fix list (appeal se pehle)

| Check | Kya hona chahiye |
|--------|------------------|
| Website live | https://woodenmax.in HTTPS, mobile OK |
| Contact | Phone +91 78953 28080, info@woodenmax.com har page par |
| Return policy | `/policies/cancellation-refund-policy` clear |
| Privacy | `/policies/privacy-policy` |
| Prices | Feed = “starting from” / calculator — page par bhi clear ho |
| Checkout | **Visible Buy / Book Pay ₹1,000** on product pages (Razorpay live on Worker) |
| Business | GSTIN 36ARWPA9740L1Z3 Merchant Center Business settings mein |

### Appeal / request review

1. Issues fix karo (upar table).
2. Merchant Center → issue → **Request review** (agar button ho).
3. 3–7 din wait. Agar reject phir aaye — reason padh kar dubara fix.

### Naya account (agar purana permanently band)

Google kabhi **naya GMC same business** allow karta hai jab purana permanently disabled ho:

1. **Naya Google account** (ya clean workspace) — same phone spam avoid karo.
2. https://merchantcenter.google.com → **Create account**
3. Business: **WoodenMax Architectural Elements**, India, woodenmax.in
4. **Domain verify** (HTML tag / DNS — Search Console se link karna best)
5. **Business information** complete: address Hyderabad, GSTIN, customer support
6. **Shipping & returns** India settings set karo
7. Feed connect (Section 2) — **96 products**

> Purane account ke violations naye account par repeat mat karo (galat prices, fake reviews, etc.).

---

## 1. Product feed (repo mein updated)

| File | Use |
|------|-----|
| `products-feed.xml` | Merchant Center **Scheduled fetch URL** (page scrape — `generate_merchant_feed.py`) |
| `products-feed.csv` | Sheets / manual; may include package rows after merge |
| `products-packages-feed.csv` | **Standard-size package SKUs** (live calculator rates) — preferred for Shopping packages |

**Live URL (deploy ke baad):** https://woodenmax.in/products-feed.xml

**Package feed (calculator W×H SKUs):**

```bash
node tools/generate-package-merchant-feed.cjs
```

- Links **only** point at real HTML landings (`tools/product-landing-map.cjs`) — soft-404 calculator slugs are never emitted.
- Re-running **replaces** prior `standard-size-package` rows in `products-feed.csv` (does not leave stale broken links).
- After generate, merge `tools/_package-slug-redirects.txt` into `_redirects` if new calculator slugs appear (crawler 301 → real page).

**Do not** re-run `python tools/generate_merchant_feed.py` and then upload CSV without re-running the package generator — the Python scrape can overwrite package-aware CSV. Preferred upload for packages: `products-packages-feed.csv` as a supplementary feed.

**Regenerate page feed (jab nayi product pages add hon):**

```bash
python tools/generate_merchant_feed.py
node tools/generate-package-merchant-feed.cjs
```

**Abhi feed mein:** sellable hub products + standard-size package SKUs (only when landing HTML exists).

Ya: `npm run merchant:feed` (agar script add ho)

Guide / calculator-only pages feed mein **nahi** aate (Google disapprove karta hai) — ye intentional hai.

---

## 2. Merchant Center — feed connect (sab products)

### Option A: URL fetch (recommended)

1. Merchant Center → **Products** → **Feeds** → **+** Add feed
2. **Primary feed** → **Scheduled fetch**
3. Name: `WoodenMax All Products`
4. **File URL:** `https://woodenmax.in/products-feed.xml`
5. **Fetch:** Daily
6. **Save** → **Fetch now**

24–48 hours: **Products** count badhega. **Diagnostics** mein errors fix karo.

### Option B: Google Sheets

1. `products-feed.csv` → Google Sheet import
2. Merchant Center → Add feed → **Google Sheets** → same account
3. Daily fetch

### Option C: Manual upload (emergency)

Feeds → Upload → `products-feed.xml` (XML)

---

## 3. Deploy checklist (feed live hona zaroori)

1. Git push + site deploy
2. Browser: https://woodenmax.in/products-feed.xml — XML dikhe, 96 items
3. Merchant Center mein URL submit
4. Search Console: sitemap already `sitemap.xml`

---

## 4. Google Ads vs Free listings

| | Free listings | Google Ads Shopping |
|--|----------------|---------------------|
| Cost | Free (eligible countries) | Paid |
| Setup | Merchant Center feed only | Ads + Merchant link |
| India | Often limited vs Ads | Full control |

Free listings ke liye feed + policy clean honi chahiye. Ads chahiye to Merchant Center **linked** hona chahiye Google Ads se.

---

## 5. Common feed errors (fix)

| Error | Fix |
|-------|-----|
| Image too small | Image min 100×100, prefer 800+ |
| Price mismatch | Page title/desc mein same “from ₹X” |
| Missing GTIN | `identifier_exists = no` already set for custom |
| Landing page 404 | Deploy all product HTML first |
| Policy: insufficient contact | Footer + contact page |

---

## 6. Support links

- [Merchant Center Help](https://support.google.com/merchants/)
- [Product data spec](https://support.google.com/merchants/answer/7052112)
- [Account suspensions](https://support.google.com/merchants/answer/6150244)
- [Free listings](https://support.google.com/merchants/answer/9199328)

Support: +91 78953 28080 · info@woodenmax.com
