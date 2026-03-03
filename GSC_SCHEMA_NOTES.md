# Google Search Console - Schema & Enhancement Notes

## ✅ Fixed (March 2026)

### Product Schema – Missing Field 'price' in 'offers'
**Issue:** Product pages used `@type: "Offer"` with `lowPrice`/`highPrice` instead of `price`. Google requires either:
- **Offer** → `price` (required)
- **AggregateOffer** → `lowPrice` (required), `highPrice` (optional)

**Fix:** All 20+ product pages updated from `Offer` to `AggregateOffer`. Invalid Product rich results should now be valid.

---

## 📷 Why Only ~18 Images in GSC "Image" Report?

**vs 83 Review snippets:** Review counts pages with AggregateRating; Image counts pages with validated image metadata. Main sitemap had no `image:image` tags – fixed.

Possible reasons:
1. **Indexing lag** – New pages take time to be crawled and validated
2. **Image sitemap** – `sitemap-images.xml` is submitted (via robots.txt). Ensure it’s also added in GSC → Sitemaps
3. **Alt text** – All product images should have descriptive `alt` attributes
4. **ImageObject schema** – 43+ pages already have ImageObject schema
5. **Image sitemap limits** – Google recommends max 1,000 images per sitemap; `sitemap-images.xml` has many more – consider splitting if needed

**Recommendations:**
- Submit `sitemap-images.xml` in GSC if not already done
- Add `<image:title>` and `<image:caption>` to images in sitemap (already done for homepage/category; product pages may need expansion)
- Use “URL Inspection” in GSC to request indexing for important product pages

---

## ❓ Why Only ~26 FAQ Pages (vs 34 with FAQ Schema)?

- **34 pages** have FAQ schema in the codebase
- **26** show in GSC

Likely causes:
1. **Crawl/indexing delay** – Not all pages crawled yet
2. **Duplicate or similar content** – Very similar FAQs might be deduplicated
3. **Validation issues** – Some FAQ schemas may have errors; check “FAQ” in GSC → Enhancements
4. **Eligibility** – Google doesn’t guarantee FAQ rich results on every page

**Check:** GSC → Enhancements → FAQ → View affected pages for any reported issues

---

## 🍞 Breadcrumbs – 31 Pages

- Breadcrumbs are implemented on product and category pages
- **31** is normal – homepage, about, contact, calculators, etc. often don’t use breadcrumbs
- Verify coverage: All product and category pages should use `BreadcrumbList` schema

---

## Summary of Schema Fixes Applied

| File | Change |
|------|--------|
| 20 product pages | `Offer` → `AggregateOffer` (lowPrice/highPrice now valid) |
| 3-track-sliding-window | Fixed both main Product and HowTo nested Product offers |

After deployment, use [Rich Results Test](https://search.google.com/test/rich-results) and GSC (after re-crawl) to confirm valid Product, FAQ, and Breadcrumb enhancements.
