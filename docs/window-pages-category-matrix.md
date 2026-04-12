# Window pages — Category matrix (Title, URL, H1–H3) + SEO module checklist

**Purpose:** Har naye page par **same structure** — query + conversion dono cover. Ye file **Category 1–6** ke URLs / copy ko ek jagah rakhti hai; publish par `- [ ]` hata dena.

---

## Har page par (mandatory module)

Screenshot rules ke hisaab se har **live** page mein ye hona chahiye:

| # | Module | Notes |
|---|--------|--------|
| 1 | **1 Calculator** | Us page ke product/size se match — `data-product` / same calculator block as sibling pages |
| 2 | **1 Window image** | Hero + `image_src` / OG — unique per page where possible |
| 3 | **1 Window drawing** | Section / diagram (technical line drawing or labelled elevation) |
| 4 | **1 Price comparison table** | e.g. glass tier × ₹/sq.ft, or 2-track vs 3-track — page intent ke hisaab se |
| 5 | **FAQ schema** | `FAQPage` JSON-LD — body ke **H3 FAQ** se match |
| 6 | **Related windows links** | Neeche wala **fixed pattern** |

---

## Har page ke neeche — Related Windows (internal linking)

**Placement:** Footer ke upar ek section — heading: **Related Windows**.

| Anchor text | Use this `href` (site root) | Status |
|-------------|------------------------------|--------|
| **3 Track Sliding Window** | `/products/aluminium-windows/3-track-sliding-window` | Live |
| **2 Track Sliding Window** | `/products/aluminium-windows/aluminium-sliding-window` | Live — *abhi 2-track isi page par hai; future `/2-track-sliding-window` agar banoge to 301 + yahan update* |
| **Casement Window** | `/products/aluminium-windows/top-hung-casement-window` | Live — *openable/casement angle; niche `casement-window` slug alag page banoge to switch* |
| **Soundproof Window** | `/blog/soundproof-windows-Hyderabad.html` | Live — *dedicated product URL `…/soundproof-window` banne par href swap* |
| **Aluminium Window Price** | `/products/aluminium-windows` | Live (hub) |

**Copy-paste HTML pattern (paths adjust karna):**

```html
<section class="related-windows" aria-labelledby="related-windows-heading">
  <h2 id="related-windows-heading">Related Windows</h2>
  <ul>
    <li><a href="/products/aluminium-windows/3-track-sliding-window">3 Track Sliding Window</a></li>
    <li><a href="/products/aluminium-windows/aluminium-sliding-window">2 Track Sliding Window</a></li>
    <li><a href="/products/aluminium-windows/top-hung-casement-window">Casement Window</a></li>
    <li><a href="/blog/soundproof-windows-Hyderabad.html">Soundproof Window</a></li>
    <li><a href="/products/aluminium-windows">Aluminium Window Price</a></li>
  </ul>
</section>
```

---

## Repo vs aapke URL — important

| Aapka planned slug | Abhi repo mein |
|--------------------|------------------|
| `/products/aluminium-windows/2-track-sliding-window` | **Nahi** — 2-track = `aluminium-sliding-window.html` |
| `/products/aluminium-windows/casement-window` | **Nahi** — closest = `top-hung-casement-window.html` |
| `/products/aluminium-windows/soundproof-window` | **Nahi** — blog guide hai |
| `/city/aluminium-window-price-hyderabad` | **Nahi** — abhi `city/hyderabad.html` |
| `/window-size/*`, `/window-system/*`, etc. | **Nahi** — naye folders banane padenge |

Naye pages banate waqt **canonical** ek hi rakho — duplicate city/product URLs avoid karo (`windows-new-pages-blueprints.md` + master plan).

---

## CATEGORY 1 — Window type pages (target **20**; niche **10** listed — baaki 10 baad mein add karna)

### [ ] **C1-01** — Aluminium sliding (2-track hub style)

| Field | Value |
|--------|--------|
| **URL** | `/products/aluminium-windows/aluminium-sliding-window` |
| **Title** | Aluminium Sliding Window Price ₹650-900/sqft (2026) \| Free Calculator |
| **H1** | Aluminium Sliding Window Price & Calculator |
| **H2** | Sliding Window Price Per Sqft |
| **H2** | Sliding Window Size Calculator |
| **H3** | 2 Track vs 3 Track Sliding Window Price |
| **Tags** | sliding window price, aluminium sliding window cost, sliding window calculator |
| **SEO module** | Calculator + image + drawing + table + FAQ schema + Related Windows |

### [ ] **C1-02** — 3-track Domal

| Field | Value |
|--------|--------|
| **URL** | `/products/aluminium-windows/3-track-sliding-window` |
| **Title** | Aluminium 3 Track Sliding Window Price ₹500-600/sqft (2026) |
| **H1** | 3 Track Sliding Window Price |
| **H2** | 3 Track Window Price Per Sqft |
| **H2** | 3 Track Window Size Calculator |
| **Tags** | 3 track sliding window price, domal window price |
| **SEO module** | full |

### [ ] **C1-03** — 2-track dedicated (jab banega — warna C1-01 se canonical merge)

| Field | Value |
|--------|--------|
| **URL** | `/products/aluminium-windows/2-track-sliding-window` *(planned)* |
| **Title** | Aluminium 2 Track Sliding Window Price ₹600-800/sqft (2026) |
| **H1** | 2 Track Sliding Window Price |
| **H2** | 2 Track Sliding Window Calculator |
| **Tags** | 2 track sliding window price, sliding window cost |
| **Note** | Abhi live traffic `aluminium-sliding-window` par — duplicate mat banao bina 301 strategy ke |

### [ ] **C1-04** — Casement *(planned slug; abhi top-hung casement use)*

| Field | Value |
|--------|--------|
| **URL** | `/products/aluminium-windows/casement-window` *(planned)* |
| **Title** | Aluminium Casement Window Price ₹550-750/sqft |
| **H1** | Aluminium Casement Window Price |
| **H2** | Casement Window Price Per Sqft |
| **Tags** | casement window price, openable window price |
| **Live alt** | `top-hung-casement-window.html` |

### [ ] **C1-05** — Top hung

| Field | Value |
|--------|--------|
| **URL** | `/products/aluminium-windows/top-hung-window` *(planned — abhi file: `top-hung-casement-window.html`)* |
| **Title** | Aluminium Top Hung Window Price ₹500-700/sqft |
| **H1** | Top Hung Aluminium Window Price |
| **Tags** | top hung window price |
| **H2** *(add)* | Top Hung Window Price Per Sqft \| Calculator |

### [ ] **C1-06** — Tilt & turn *(new page)*

| Field | Value |
|--------|--------|
| **URL** | `/products/aluminium-windows/tilt-turn-window` |
| **Title** | Aluminium Tilt and Turn Window Price ₹900-1600/sqft |
| **H1** | Tilt and Turn Window Price |
| **Tags** | tilt turn window cost |
| **H2** *(add)* | Tilt & Turn vs Casement — Price \| When It Makes Sense |

### [ ] **C1-07** — Fixed glass *(new page)*

| Field | Value |
|--------|--------|
| **URL** | `/products/aluminium-windows/fixed-glass-window` |
| **Title** | Aluminium Fixed Glass Window Price ₹400-600/sqft |
| **H1** | Fixed Glass Window Price |
| **H2** *(add)* | Fixed Glass vs Openable — Cost Comparison |

### [ ] **C1-08** — Slimline

| Field | Value |
|--------|--------|
| **URL** | `/products/aluminium-windows/slimline-window` *(planned — live: `slimline-aluminium-window.html`)* |
| **Title** | Slimline Aluminium Window Price ₹600-900/sqft |
| **H1** | Slim Profile Aluminium Window Price |
| **H2** *(add)* | Slimline vs Standard Profile Price |

### [ ] **C1-09** — Soundproof product *(new — blog se alag intent)*

| Field | Value |
|--------|--------|
| **URL** | `/products/aluminium-windows/soundproof-window` |
| **Title** | Soundproof Aluminium Window Price ₹800-1800/sqft |
| **H1** | Soundproof Window Price |
| **H2** *(add)* | DGU vs Laminated — Price Table |
| **Note** | Blog `soundproof-windows-Hyderabad.html` ko canonical helper + internal link |

### [ ] **C1-10** — Folding window *(new — fold-slide window se clarify)*

| Field | Value |
|--------|--------|
| **URL** | `/products/aluminium-windows/folding-window` |
| **Title** | Folding Aluminium Window Price ₹900-2000/sqft |
| **H1** | Folding Aluminium Window Price |
| **H2** *(add)* | Folding Window vs Bi-Fold Door — Use Case |

### [ ] **C1-11 to C1-20** — *10 aur window types (French fixed, Georgian, combination, etc.) — titles yahan add karo*

---

## CATEGORY 2 — Window size pages (target **25**; niche **10** listed)

Har size page par suggested **H2** (template):

- **H2:** `{size} Sliding Window Cost`
- **H2:** `{size} Price Calculator`
- **H3:** Sample glass options & ₹ impact *(FAQ schema ke liye)*

### [ ] **C2-01** — `/window-size/3x3-window-price`

**Title:** 3x3 Aluminium Window Price \| Free Calculator — **H1:** 3x3 Aluminium Window Price — **H2:** 3x3 Sliding Window Cost — **Tags:** 3x3 window price, 3x3 aluminium window cost

### [ ] **C2-02** — `/window-size/4x4-window-price` — **Title:** 4x4 Aluminium Window Price — **H1:** 4x4 Window Price

### [ ] **C2-03** — `/window-size/4x5-window-price` — **Title:** 4x5 Aluminium Window Price — **H1:** 4x5 Window Price

### [ ] **C2-04** — `/window-size/5x5-window-price` — **Title:** 5x5 Aluminium Window Price — **H1:** 5x5 Window Price

### [ ] **C2-05** — `/window-size/6x4-window-price` — **Title:** 6x4 Aluminium Window Price — **H1:** 6x4 Window Price

### [ ] **C2-06** — `/window-size/6x5-window-price` — **Title:** 6x5 Aluminium Window Price — **H1:** 6x5 Window Price

### [ ] **C2-07** — `/window-size/7x4-window-price` — **Title:** 7x4 Aluminium Window Price — **H1:** 7x4 Window Price

### [ ] **C2-08** — `/window-size/8x4-window-price` — **Title:** 8x4 Aluminium Window Price — **H1:** 8x4 Window Price

### [ ] **C2-09** — `/window-size/8x5-window-price` — **Title:** 8x5 Aluminium Window Price — **H1:** 8x5 Window Price

### [ ] **C2-10** — `/window-size/10x4-window-price` — **Title:** 10x4 Aluminium Window Price — **H1:** 10x4 Window Price

### [ ] **C2-11 to C2-25** — *baaki sizes (e.g. 5x4, 6x6, 12x4…) — list extend karo*

---

## CATEGORY 3 — Window system pages (target **20**; niche **5** listed)

*Zero-width typo fix: `dom​al` → **`domal`***

### [ ] **C3-01** — `/window-system/domal-aluminium-window` — **Title:** Domal Aluminium Window Price ₹500-600/sqft — **H1:** Domal Aluminium Window Price

### [ ] **C3-02** — `/window-system/27mm-domal-window` — **Title:** 27mm Domal Window Price — **H1:** 27mm Domal Window Price

### [ ] **C3-03** — `/window-system/29mm-aluminium-window` — **Title:** 29mm Aluminium Window Price — **H1:** 29mm Aluminium Window Price

### [ ] **C3-04** — `/window-system/heavy-duty-window` — **Title:** Heavy Duty Aluminium Window Price — **H1:** Heavy Duty Aluminium Window Price

### [ ] **C3-05** — `/window-system/thermal-break-window` — **Title:** Thermal Break Aluminium Window Price — **H1:** Thermal Break Window Price

### [ ] **C3-06 to C3-20** — *e.g. slim series, imported vs Indian profile, mesh-ready track — add rows*

---

## CATEGORY 4 — Glass type pages (target **15**; niche **5** listed)

### [ ] **C4-01** — `/window-glass/5mm-glass-window` — **Title:** 5mm Glass Aluminium Window Price — **H1:** 5mm Glass Aluminium Window Price

### [ ] **C4-02** — `/window-glass/8mm-toughened-window` — **Title:** 8mm Toughened Glass Window Price — **H1:** 8mm Toughened Glass Window Price

### [ ] **C4-03** — `/window-glass/double-glass-window` — **Title:** Double Glass Aluminium Window Price — **H1:** Double Glass Aluminium Window Price

### [ ] **C4-04** — `/window-glass/laminated-glass-window` — **Title:** Laminated Glass Window Price — **H1:** Laminated Glass Window Price

### [ ] **C4-05** — `/window-glass/soundproof-glass-window` — **Title:** Soundproof Double Glass Window Price — **H1:** Soundproof Glass Window Price

### [ ] **C4-06 to C4-15** — *Low-e, tinted, DGU 16mm/20mm, etc.*

---

## CATEGORY 5 — Window design pages (target **10**; niche **4** listed)

### [ ] **C5-01** — `/window-design/modern-aluminium-window` — **Title:** Modern Aluminium Window Design with Price — **H1:** Modern Aluminium Window Design

### [ ] **C5-02** — `/window-design/villa-window-design` — **Title:** Villa Aluminium Window Design — **H1:** Villa Aluminium Window Design

### [ ] **C5-03** — `/window-design/kitchen-window-design` — **Title:** Kitchen Aluminium Window Design — **H1:** Kitchen Aluminium Window Design

### [ ] **C5-04** — `/window-design/bedroom-window-design` — **Title:** Bedroom Aluminium Window Design — **H1:** Bedroom Aluminium Window Design

### [ ] **C5-05 to C5-10** — *e.g. balcony, living room, elevation bay — add*

---

## CATEGORY 6 — City pages (target **10**; niche **4** listed)

**Duplicate alert:** `city/hyderabad.html` already exists — naya `/city/aluminium-window-price-hyderabad` **merge / 301** decide karo.

### [ ] **C6-01** — `/city/aluminium-window-price-hyderabad` — **Title:** Aluminium Window Price in Hyderabad (2026) — **H1:** Aluminium Window Price Hyderabad

### [ ] **C6-02** — `/city/aluminium-window-price-bangalore` — **Title:** Aluminium Window Price in Bangalore — **H1:** Aluminium Window Price Bangalore — *check `city/bangalore.html`*

### [ ] **C6-03** — `/city/aluminium-window-price-mumbai` — **Title:** Aluminium Window Price in Mumbai — **H1:** Aluminium Window Price Mumbai

### [ ] **C6-04** — `/city/aluminium-window-price-delhi` — **Title:** Aluminium Window Price in Delhi — **H1:** Aluminium Window Price Delhi

### [ ] **C6-05 to C6-10** — *Pune, Chennai, Kolkata, Jaipur, Lucknow — repo mein kuch city files already hain*

---

## Quick stats

| Category | Target count | Rows in this doc (listed) |
|----------|--------------|---------------------------|
| 1 Window type | 20 | 10 + placeholder |
| 2 Size | 25 | 10 + placeholder |
| 3 System | 20 | 5 + placeholder |
| 4 Glass | 15 | 5 + placeholder |
| 5 Design | 10 | 4 + placeholder |
| 6 City | 10 | 4 + placeholder |

**Total planned:** ~100 pages — baaki rows jab final list ho tab isi file mein append karo.
