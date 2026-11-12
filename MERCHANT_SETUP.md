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
6. **Shipping & returns** India settings set karo (see §7)
7. Feed connect (Section 2) — **~107 page SKUs + ~477 package SKUs** (disjoint ids)

> Purane account ke violations naye account par repeat mat karo (galat prices, fake reviews, etc.).

---

## 7. GMC Shipping + Returns (India) — Path B honesty (required)

**Business model:** Shopping price = **₹1,000 Book Now booking deposit** (Razorpay). Site visit + made-to-measure install. Do **not** claim Amazon-style free window shipping.

### Site pages (must stay live)

| Page | URL |
|------|-----|
| Shipping & fulfillment (booking) | https://woodenmax.in/policies/shipping-and-fulfillment |
| GST & transport (physical freight) | https://woodenmax.in/policies/gst-transport-policy |
| Cancellation & refund | https://woodenmax.in/policies/cancellation-refund-policy |
| Returns | https://woodenmax.in/return-policy |

### A) Shipping policies (click path)

1. Merchant Center → **Products & store** → **Shipping and returns** → **Shipping policies**
2. **Delete / disable** any policy with **Cost = Free** for All India products (conflicts with freight policy and confuses Store quality).
3. Keep **one** India policy for booking fulfillment, e.g.:
   - Name: `India booking site-visit (2–7 days)`
   - Country: **India**
   - Cost: **Flat ₹0** = no extra courier fee on the ₹1,000 booking (NOT “free windows”)
   - Transit / delivery time: **2–7 days** (metros) — matches site-visit scheduling
   - Products: All (or label matching feed)
4. **Ship-from location:** Settings → **Add ship-from location** → Hyderabad  
   `5-6-411/413, Aaghapura, Nampally, Hyderabad, Telangana 500001`
5. Store quality → if **Delivery time = Incomplete** → use **Set up your shipping service** and ensure the policy above has an explicit **min–max transit days** (not blank). Conflicting 0–2 day + 4–60 day + Free policies leave Delivery time Incomplete even when Status says Complete.

### B) Return service (click path)

1. **Shipping and returns** → **Return policies**
2. India policy (**Standard for India** / label `Return_policy`):
   - Return window: **15 days** (booking deposit / pre-production — matches site)
   - Return cost: **Free** for eligible booking cancellation (customer does not post a window carton)
   - Policy URL: `https://woodenmax.in/return-policy` + cancellation page
3. Store quality → **Set up your return service** until Return window + Return cost are no longer Incomplete.
4. Link products: India return policy should cover **all** active feed items (pages + packages). If only ~120 show linked, package feed is missing or not fetched.

### C) After policy edits

1. Products → **Feeds** → Fetch now on:
   - `https://woodenmax.in/products-feed.xml` (~107)
   - `https://woodenmax.in/products-packages-feed.csv` (~477)
2. Disable duplicate SOURCE feeds (old PRODUCTS SOURCE / Sheets with same ids).
3. Issue → **User cannot complete purchase** → after deploy of Path B schema + Book Now: **Request review** / **I fixed the issue**.

---

## 1. Product feed (repo mein updated)

| File | Use |
|------|-----|
| `products-feed.xml` | **Primary feed A** — page / hub products only (`generate_merchant_feed.py`) |
| `products-feed.csv` | Same page-level rows (Sheets / debug) — **no** package SKUs |
| `products-packages-feed.csv` | **Primary feed B** — standard-size package SKUs only (`generate-package-merchant-feed.cjs`) |

**Live URLs (deploy ke baad):**
- https://woodenmax.in/products-feed.xml
- https://woodenmax.in/products-packages-feed.csv

**Why two feeds:** each `id` must appear in **only one** primary feed. Merging packages into the XML while also uploading the packages CSV caused GMC warning **Item uploaded through multiple feeds**.

**Package feed (calculator W×H SKUs):**

```bash
node tools/generate-package-merchant-feed.cjs
```

- Links **only** point at real HTML landings (`tools/product-landing-map.cjs`) — soft-404 calculator slugs are never emitted.
- Package generator writes **only** `products-packages-feed.csv` (and strips any legacy merged package rows from `products-feed.csv` if found).
- After generate, merge `tools/_package-slug-redirects.txt` into `_redirects` if new calculator slugs appear (crawler 301 → real page).

**Regenerate both feeds:**

```bash
python tools/generate_merchant_feed.py
node tools/generate-package-merchant-feed.cjs
```

Guide / calculator-only pages feed mein **nahi** aate (Google disapprove karta hai) — ye intentional hai.

### Duplicate-feed cleanup (GMC UI — required)

If Diagnostics shows **Item uploaded through multiple feeds**:

1. Keep **one** scheduled primary for pages: `https://woodenmax.in/products-feed.xml`
2. Keep **one** primary for packages: `https://woodenmax.in/products-packages-feed.csv` (or file upload of that CSV)
3. **Disable / delete** older primaries that still carry the same ids (e.g. old **PRODUCTS SOURCE 5**, duplicate Sheets, or a second copy of the full XML)
4. Do **not** also upload `products-feed.csv` if it still contains package rows from an old merge — use the live files after deploy
5. Fetch now → wait for processing; the warning clears when each id has a single source feed

---

## 2. Merchant Center — feed connect (sab products)

### Option A: URL fetch (recommended) — two disjoint primaries

**Feed A — pages**

1. Merchant Center → **Products** → **Feeds** → **+** Add feed
2. **Primary feed** → **Scheduled fetch**
3. Name: `WoodenMax Page Products`
4. **File URL:** `https://woodenmax.in/products-feed.xml`
5. **Fetch:** Daily → **Save** → **Fetch now**

**Feed B — packages**

1. Add another **Primary** feed (scheduled fetch or file upload)
2. Name: `WoodenMax Package SKUs`
3. **File URL:** `https://woodenmax.in/products-packages-feed.csv` (or upload that CSV)
4. Daily fetch → **Fetch now**

Ids must not overlap between A and B. Disable any third primary that re-uploads the same ids.

24–48 hours: **Products** count badhega. **Diagnostics** mein errors fix karo.

### Option B: Google Sheets

1. Import **page** CSV only (`products-feed.csv` after regen — no packages) **or** packages CSV — not both with shared ids into two Sheets primaries
2. Merchant Center → Add feed → **Google Sheets**
3. Daily fetch

### Option C: Manual upload (emergency)

Feeds → Upload → `products-feed.xml` (pages) and/or `products-packages-feed.csv` (packages) — never both files that share ids

---

## 3. Deploy checklist (feed live hona zaroori)

1. Git push + site deploy
2. Browser: https://woodenmax.in/products-feed.xml — page products only
3. Browser: https://woodenmax.in/products-packages-feed.csv — package SKUs only
4. Merchant Center mein dono URLs (disjoint ids) — purane duplicate feeds band karo
5. Search Console: sitemap already `sitemap.xml`

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
