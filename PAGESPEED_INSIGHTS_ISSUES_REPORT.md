# PageSpeed Insights Issues Report - woodenmax.in
**Report Date:** 27 Dec 2025, 11:09:36 GMT+5:30

## 📊 Overall Scores

### Mobile
- **Performance:** 36/100 ⚠️ (CRITICAL - Needs immediate attention)
- **Accessibility:** 98/100 ✅
- **Best Practices:** 81/100 ✅
- **SEO:** 92/100 ✅

### Desktop
- **Performance:** 66/100 ⚠️ (Needs improvement)
- **Accessibility:** 87/100 ✅
- **Best Practices:** 100/100 ✅
- **SEO:** 92/100 ✅

---

## 🚨 CRITICAL PERFORMANCE METRICS

### Mobile Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **First Contentful Paint (FCP)** | 3.0s | < 1.8s | ❌ FAIL |
| **Largest Contentful Paint (LCP)** | 8.7s | < 2.5s | ❌ CRITICAL |
| **Total Blocking Time (TBT)** | 0ms | < 200ms | ✅ PASS |
| **Cumulative Layout Shift (CLS)** | 1.419 | < 0.1 | ❌ CRITICAL |
| **Speed Index (SI)** | 9.5s | < 3.4s | ❌ CRITICAL |

### Desktop Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **First Contentful Paint (FCP)** | 0.3s | < 1.8s | ✅ PASS |
| **Largest Contentful Paint (LCP)** | 0.9s | < 2.5s | ✅ PASS |
| **Total Blocking Time (TBT)** | 0ms | < 200ms | ✅ PASS |
| **Cumulative Layout Shift (CLS)** | 0.843 | < 0.1 | ❌ CRITICAL |
| **Speed Index (SI)** | 4.7s | < 3.4s | ❌ FAIL |

---

## 🔴 HIGH PRIORITY ISSUES (Performance)

### 1. **Image Delivery Optimization** ⚠️ CRITICAL
- **Mobile:** Estimated savings of **656 KiB**
- **Desktop:** Estimated savings of **516 KiB**
- **Impact:** Major contributor to slow LCP (8.7s on mobile)
- **Solution:**
  - Convert all images to WebP format (already done, but check if all are being served)
  - Implement responsive images with `srcset`
  - Add `loading="lazy"` to below-the-fold images
  - Use CDN for image delivery
  - Compress images further (aim for 80-85% quality)

### 2. **Cumulative Layout Shift (CLS)** ⚠️ CRITICAL
- **Mobile:** 1.419 (should be < 0.1)
- **Desktop:** 0.843 (should be < 0.1)
- **Impact:** Poor user experience, content jumping
- **Causes:**
  - Images without dimensions
  - Dynamic content injection
  - Fonts causing layout shifts
  - Ads or embeds without reserved space
- **Solution:**
  - Add `width` and `height` attributes to all images
  - Reserve space for dynamic content
  - Use `font-display: swap` with proper fallbacks
  - Preload critical fonts

### 3. **Layout Shift Culprits** ⚠️ HIGH
- Elements causing visual instability
- **Solution:**
  - Identify elements causing shifts using Chrome DevTools
  - Add explicit dimensions to all media
  - Avoid inserting content above existing content

### 4. **Speed Index** ⚠️ HIGH
- **Mobile:** 9.5s (target: < 3.4s)
- **Desktop:** 4.7s (target: < 3.4s)
- **Impact:** Slow visual completion
- **Solution:**
  - Optimize above-the-fold content
  - Reduce render-blocking resources
  - Minimize main-thread work

### 5. **Minimize Main-Thread Work** ⚠️ HIGH
- **Mobile:** 5.7s
- **Desktop:** 5.0s
- **Impact:** Blocks page interactivity
- **Solution:**
  - Defer non-critical JavaScript
  - Use Web Workers for heavy computations
  - Optimize JavaScript execution
  - Code splitting and lazy loading

### 6. **Render Blocking Requests** ⚠️ MEDIUM
- **Desktop:** Estimated savings of 120ms
- **Impact:** Delays initial render
- **Solution:**
  - Already using deferred CSS loading (good!)
  - Ensure all non-critical CSS is deferred
  - Inline critical CSS (already done - good!)

### 7. **Non-Composited Animations** ⚠️ MEDIUM
- **Mobile:** 86 animated elements found
- **Desktop:** 34 animated elements found
- **Impact:** Causes jank and performance issues
- **Solution:**
  - Use CSS `transform` and `opacity` for animations
  - Avoid animating `width`, `height`, `top`, `left`
  - Use `will-change` property judiciously
  - Consider using `requestAnimationFrame` for JS animations

### 8. **Long Main-Thread Tasks** ⚠️ MEDIUM
- **Both:** 1 long task found
- **Impact:** Blocks user interaction
- **Solution:**
  - Break up long tasks into smaller chunks
  - Use `setTimeout` or `requestIdleCallback`
  - Optimize JavaScript execution

### 9. **Forced Reflow** ⚠️ MEDIUM
- Layout thrashing detected
- **Solution:**
  - Batch DOM reads and writes
  - Use `requestAnimationFrame` for visual updates
  - Avoid reading layout properties in loops

---

## 🟡 MEDIUM PRIORITY ISSUES

### 10. **Minify CSS** ⚠️ LOW
- **Savings:** 3 KiB
- **Solution:** Use CSS minification in production build

### 11. **Minify JavaScript** ⚠️ LOW
- **Savings:** 2 KiB
- **Solution:** Use JS minification in production build

### 12. **Use Efficient Cache Lifetimes** ⚠️ LOW
- **Savings:** 13 KiB
- **Solution:** Set proper cache headers for static assets

### 13. **Network Dependency Tree** ⚠️ INFO
- Review resource loading order
- **Solution:** Optimize critical rendering path

### 14. **LCP Breakdown** ⚠️ INFO
- Analyze LCP element loading
- **Solution:** Ensure LCP image is optimized and preloaded

### 15. **Third Parties** ⚠️ INFO
- Review third-party scripts
- **Solution:** Defer or async load third-party scripts

### 16. **Optimize DOM Size** (Desktop only) ⚠️ INFO
- Large DOM can slow down rendering
- **Solution:** Reduce DOM complexity where possible

---

## 🔵 ACCESSIBILITY ISSUES

### Mobile & Desktop
1. **Heading elements are not in sequentially-descending order**
   - **Impact:** Screen reader navigation issues
   - **Solution:** Ensure proper heading hierarchy (h1 → h2 → h3)

### Desktop Only
2. **Buttons do not have an accessible name**
   - **Impact:** Screen readers can't identify buttons
   - **Solution:** Add `aria-label` or text content to buttons

3. **Background and foreground colours do not have sufficient contrast ratio**
   - **Impact:** Text readability issues
   - **Solution:** Increase contrast ratio to at least 4.5:1 for normal text

---

## 🟢 BEST PRACTICES ISSUES

### Security (Both Mobile & Desktop)
1. **Ensure CSP is effective against XSS attacks**
   - **Solution:** Implement Content Security Policy headers

2. **Use a strong HSTS policy**
   - **Solution:** Add HSTS header with `max-age` and `includeSubDomains`

3. **Ensure proper origin isolation with COOP**
   - **Solution:** Add Cross-Origin-Opener-Policy header

4. **Mitigate clickjacking with XFO or CSP**
   - **Solution:** Add X-Frame-Options or frame-ancestors in CSP

5. **Mitigate DOM-based XSS with trusted types**
   - **Solution:** Implement Trusted Types policy

### Mobile Only
6. **Uses deprecated APIs — 1 warning found**
   - **Solution:** Identify and replace deprecated API usage

---

## 🔍 SEO ISSUES

### Both Mobile & Desktop
1. **robots.txt is not valid — 1 error found**
   - **Impact:** Search engine crawling issues
   - **Solution:** Fix robots.txt syntax and ensure it's accessible at `/robots.txt`

---

## 📋 PRIORITY ACTION PLAN

### 🔴 IMMEDIATE (This Week)
1. ✅ Fix CLS issues (add image dimensions, reserve space)
2. ✅ Optimize images further (reduce size, ensure WebP delivery)
3. ✅ Fix robots.txt validation error
4. ✅ Fix heading hierarchy for accessibility

### 🟡 HIGH PRIORITY (Next Week)
5. ✅ Reduce main-thread work (optimize JavaScript)
6. ✅ Fix non-composited animations
7. ✅ Implement proper cache headers
8. ✅ Add security headers (CSP, HSTS, COOP, XFO)

### 🟢 MEDIUM PRIORITY (This Month)
9. ✅ Minify CSS and JavaScript
10. ✅ Optimize third-party scripts
11. ✅ Fix accessibility issues (button labels, contrast)
12. ✅ Review and optimize DOM size

---

## 📈 EXPECTED IMPROVEMENTS

After implementing these fixes:
- **Mobile Performance:** 36 → **70-80** (target: 90+)
- **Desktop Performance:** 66 → **85-90** (target: 95+)
- **CLS:** 1.419 → **< 0.1** (both mobile & desktop)
- **LCP (Mobile):** 8.7s → **< 2.5s**
- **Speed Index:** 9.5s → **< 3.4s** (mobile), 4.7s → **< 3.4s** (desktop)

---

## 🔗 References
- [PageSpeed Insights Report - Mobile](https://pagespeed.web.dev/analysis/https-woodenmax-in/29ggxzw29q?utm_source=search_console&form_factor=mobile&hl=en_GB)
- [PageSpeed Insights Report - Desktop](https://pagespeed.web.dev/analysis/https-woodenmax-in/29ggxzw29q?utm_source=search_console&form_factor=desktop&hl=en_GB)
- [Web.dev Performance Guide](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)

