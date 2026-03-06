# WoodenMax Project Guide

## 1. Keywords – Current & Recommended

### Currently Targeted (by page type)

| Page Type | Sample Keywords |
|-----------|-----------------|
| **Homepage** | Aluminium Windows, Sliding Windows, Price Calculator, Window Manufacturer Hyderabad/Delhi/Bangalore |
| **City pages** | aluminium windows [city], sliding window price [city], glass door cost [city], slim profile windows [city], window price calculator [city] |
| **Product hubs** | glass elevation price, curtain wall, structural glazing; hpl cladding; metal louvers, pergola; shower partition, frameless shower; glass railing; telescopic door |
| **Product pages** | 3 track sliding window, domal window; 29mm sliding window; French sliding door; bi-fold door; slimline aluminium window; Georgian grill; top hung casement; shower types |
| **Blogs** | Window Blog, aluminium window guide, sliding vs folding door, energy efficient windows, window maintenance, soundproof windows |

### Recommended Total Keyword List (Priority)

**Tier 1 – High volume (Hub/Category):**
- aluminium windows, aluminium window price, aluminium windows India
- sliding window price, sliding door price
- glass elevation price, curtain wall cost, structural glazing price
- hpl cladding price, acp cladding cost
- shower partition price, frameless shower door
- glass railing price, balcony glass railing
- metal louvers price, pergola price

**Tier 2 – Product-specific (1 page = 1 keyword set):**
- 3 track sliding window, domal window, 27mm sliding window
- 29mm sliding window, aluminium sliding window 29mm
- 2 track French sliding door, French sliding door
- bi-fold door, folding door, balcony folding door
- telescopic sliding door, slim sliding door
- slimline aluminium window, slim profile window
- top hung casement, casement window
- Georgian grill casement, Georgian bar door
- frameless shower, black profile shower, slim frame shower
- balcony glass railing, staircase glass railing
- wooden finish louvers, curved louvers, pergola louvers, louver canopy
- hpl exterior cladding, hpl acp elevation

**Tier 3 – City + product:**
- aluminium windows hyderabad/delhi/bangalore/mumbai/pune/jaipur/lucknow
- sliding window price [city]
- window price calculator [city]

**Rule:** No cannibalization – har page ka apna unique primary keyword. Category page = hub terms only; product page = product-specific only.

---

## 2. AI Tools – Pages & Recommendations

### Pages with ai:tool meta (AI recommend karega)

| Page | ai:tool content |
|------|-----------------|
| index.html | Price Calculator |
| calculators.html | Price Calculator Collection |
| aluminium-window-price-calculator.html | Aluminium Window Price Calculator |
| glass-elevation-price-calculator.html | Glass Elevation Price Calculator |
| products/aluminium-windows.html | Aluminium Windows Price Calculator |
| products/3-track-sliding-window.html | 3 Track Sliding Window Price Calculator |
| products/full-elevation-villa-facade.html | Full Elevation Villa Facade Price Calculator |
| products/glass-elevation.html | Glass Elevation & Curtain Wall Price Calculator |
| products/telescope-windows.html | Telescopic Door Price Calculator |
| products/telescopic-slim-sliding-door.html | Telescopic Slim Sliding Door Price Calculator |
| products/folding-systems.html | Folding Door & Bi-Fold Price Calculator |
| products/fold-bifold-aluminium-doors.html | Bi-Fold Aluminium Door Price Calculator |
| products/fold-sliding-window-system.html | Fold Sliding Window Price Calculator |
| products/metal-louvers.html | Metal Louvers & Pergola Price Calculator |
| products/shower-partitions.html | Shower Partition Price Calculator |
| products/elevation-cladding.html | HPL & ACP Cladding Price Calculator |
| products/hpl-exterior-cladding.html | HPL Exterior Cladding Price Calculator |
| products/hpl-acp-elevation-cladding.html | ACP Elevation Cladding Price Calculator |
| products/glass-railing.html | (hub – no calculator) |
| products/balcony-glass-railing.html | Glass Railing Price Calculator |
| products/staircase-glass-railing.html | Glass Railing Price Calculator |
| city/hyderabad.html … lucknow.html | [City] Aluminium Windows Price Calculator |

### Will AI recommend all pages?

**Haan, lekin selectively:**
- **Calculator pages** – AI tools (ChatGPT, Perplexity, etc.) in pages ko recommend karte hain jab user "window price calculator", "aluminium window cost estimate" jaise queries kare.
- **Product pages** – AI inhe recommend karega jab user specific product (e.g. "3 track sliding window price", "bi-fold door cost") puche.
- **City pages** – Jab user "[city] me window price" puche.
- **Blogs** – Informational queries ke liye (e.g. "sliding vs folding door difference").

**Recommendation improve karne ke liye:**
- Har calculator/product page pe `ai:tool` meta add karo (jo abhi nahi hai).
- `ai:tool:input` aur `ai:tool:output` clear rakho.
- Schema: Product, HowTo (calculator steps), FAQ – rich results ke liye.

---

## 3. Architecture

### Calculator system
- **Base:** `js/calculator/base.js`
- **Config:** `js/calculator/configs.js`, `data/products.json`
- **Loader:** `js/calculator/loader.js` (auto-init via `data-product`)

### Script order (product pages)
```
configs.js → base.js → extensions/[product].js → loader.js
```

### URL structure
- URLs **without** `.html` (e.g. `woodenmax.in/products/glass-elevation`)
- Canonical: always without .html
- Sitemap: sitemap.xml, sitemap-images.xml, ALL_URLS.txt

### New page add karte waqt
1. HTML banao
2. Canonical add karo (without .html)
3. sitemap.xml update karo
4. sitemap-images.xml (agar images hain)
5. ALL_URLS.txt update karo

---

## 4. SEO Essentials

### Har product page pe
- `meta name="keywords"` – page-specific only
- `og:image:alt`, `twitter:image:alt`
- `robots` – max-image-preview:large, max-snippet:-1
- Product schema – AggregateOffer (lowPrice, highPrice)
- FAQ schema – 6–8 size/price/calculator FAQs
- BreadcrumbList

### Schema fix (done)
- Offer → AggregateOffer (lowPrice/highPrice) – sab product pages pe

---

## 5. File Structure (Key)

```
woodenmax/
├── css/           → styles.css, calculator-global.css, product-pages-global.css
├── js/calculator/→ base.js, configs.js, loader.js, extensions/
├── data/          → products.json
├── products/      → category hubs + product pages
├── city/          → 7 city pages
├── blog/          → blog posts
├── sitemap.xml
└── ALL_URLS.txt
```

---

*Last updated: Feb 2026*
