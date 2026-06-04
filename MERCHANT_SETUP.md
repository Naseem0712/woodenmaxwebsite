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

### Fix list (appeal se pehle)

| Check | Kya hona chahiye |
|--------|------------------|
| Website live | https://woodenmax.in HTTPS, mobile OK |
| Contact | Phone +91 78953 28080, info@woodenmax.com har page par |
| Return policy | `/policies/cancellation-refund-policy.html` clear |
| Privacy | `/policies/privacy-policy.html` |
| Prices | Feed = “starting from” / calculator — page par bhi clear ho |
| Checkout | Custom quote OK — “Book slot ₹1,000” + form (live payment working) |
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
| `products-feed.xml` | Merchant Center **Scheduled fetch URL** |
| `products-feed.csv` | Google Sheets import / manual edit |

**Live URL (deploy ke baad):** https://woodenmax.in/products-feed.xml

**Abhi feed mein:** **96 sellable products** (windows, grills, shower, mirrors, louvers, pergola, city pages, etc.)

**Regenerate (jab nayi product pages add hon):**

```bash
python tools/generate_merchant_feed.py
```

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
