# WoodenMax – Google Store / Marketplace Setup Guide

Site ko Google mein store jaisa dikhane ke liye ye steps follow karein.

---

## 1. Product Feed (Already Created)

**File:** `products-feed.xml`  
**Live URL (deploy ke baad):** `https://woodenmax.in/products-feed.xml`

Is feed mein 25 products hain – aluminium windows, shower partitions, glass railing, louvers, elevation cladding, etc.

---

## 2. Kahan Upload Karna Hai

### Option A: Google Merchant Center (Recommended – Free Product Listings)

1. **Merchant Center account banao**
   - https://merchantcenter.google.com pe jao
   - Google account se sign in karo
   - "Get started" pe click karo

2. **Business verify karo**
   - Business name: WoodenMax
   - Country: India
   - Website: https://woodenmax.in
   - Verification: Domain ownership verify karo (HTML file ya DNS record)

3. **Product feed add karo**
   - Left menu → **Products** → **Feeds**
   - **Add feed** → **Scheduled fetch**
   - Feed name: `WoodenMax Products`
   - **Input method:** URL
   - **File URL:** `https://woodenmax.in/products-feed.xml`
   - **Fetch schedule:** Daily
   - Save karo

4. **Feed process hone do**
   - 24–48 hours ke andar products process ho jayenge
   - **Diagnostics** mein errors check karein

---

### Option B: Google Sheets (Easiest – Edit karne mein aasaan)

1. **CSV import karo**
   - `products-feed.csv` file kholo (project folder mein hai)
   - Apni Google Sheet kholo: https://docs.google.com/spreadsheets/d/1uyz24_lE5J6Fim6fFLZ8oiCbzCbi09cIYqh3pFM4g7Y/
   - **File** → **Import** → **Upload** → `products-feed.csv` select karo
   - "Replace spreadsheet" ya "Insert new sheet" choose karo
   - Delimiter: Comma

2. **Merchant Center mein connect karo**
   - Merchant Center → **Products** → **Feeds** → **Add feed**
   - **Input method:** Google Sheets
   - Apni Sheet select karo (same Google account hona chahiye)
   - Sheet name / range select karo (e.g. Sheet1 ya data wala range)
   - **Fetch schedule:** Daily

3. **Fayda:** Sheet mein direct edit karo – price, title, description change – Merchant Center next fetch pe update le lega.

---

### Option C: Manual Upload (Agar URL fetch kaam na kare)

1. Merchant Center → Products → Feeds
2. **Add feed** → **Primary feed** → **Upload**
3. `products-feed.xml` file download karo (site deploy ke baad `https://woodenmax.in/products-feed.xml` se)
4. File upload karo (XML format)
5. Har 1–2 hafte baad naya upload karo jab products update hon

---

## 3. Google Search Console (Already Setup)

- Sitemap: `https://woodenmax.in/sitemap.xml` (already submitted hona chahiye)
- Product pages pe Product schema hai – Google automatically rich results dikha sakta hai

---

## 4. Deploy Checklist

1. **Git push** – `products-feed.xml` aur `MERCHANT_SETUP.md` repo mein hon
2. **Site deploy** – Cloudflare Pages / hosting pe deploy karo
3. **Verify** – Browser mein open karo: `https://woodenmax.in/products-feed.xml`
4. **Merchant Center** – Feed URL submit karo (Step 2)

---

## 5. Kya Expect Karein

| Feature | Kahan Dikhega |
|--------|----------------|
| Product rich results (price, rating) | Google Search – product pages pe |
| Free product listings | Google Shopping tab (India mein available ho to) |
| Sitelinks, breadcrumbs | Google Search – time ke saath |

---

## 6. Feed Update Kaise Karein

- **URL fetch:** Merchant Center daily khud fetch karega
- **Manual change:** `products-feed.xml` edit karo, push karo, 24 hrs baad Merchant Center naya data le lega
- **Naya product:** Feed mein naya `<entry>` add karo, same process

---

## Support Links

- [Google Merchant Center Help](https://support.google.com/merchants/)
- [Product feed specification](https://support.google.com/merchants/answer/7052112)
- [Free product listings (India)](https://support.google.com/merchants/answer/9199328)
