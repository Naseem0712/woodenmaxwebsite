# PageSpeed Insights - Latest Analysis Report
**Report Date:** 27 Dec 2025, 12:05:04 GMT+5:30  
**Analysis Based On:** Latest PageSpeed Insights Reports After Optimizations

---

## 📊 CURRENT SCORES (After Optimizations)

### Mobile
- **Performance:** 61/100 ⚠️ (Previous: 65, Target: 90+)
- **Accessibility:** 100/100 ✅ (EXCELLENT - Perfect Score!)
- **Best Practices:** 100/100 ✅ (EXCELLENT - Perfect Score!)
- **SEO:** 92/100 ⚠️ (Target: 100)

**Core Web Vitals (Mobile):**
- FCP: 3.0s (Target: < 1.8s) ⚠️
- LCP: 8.1s (Target: < 2.5s) 🔴 **CRITICAL** (Worse than before: 5.6s)
- TBT: 0ms ✅ (EXCELLENT)
- CLS: 0.004 ✅ (EXCELLENT - Near Perfect)
- Speed Index: 10.9s (Target: < 3.4s) ⚠️ (Improved from 13.4s)

### Desktop
- **Performance:** 82/100 ⚠️ (Previous: 85, Target: 95+)
- **Accessibility:** 95/100 ✅ (Improved from 89 - Good Progress!)
- **Best Practices:** 100/100 ✅ (EXCELLENT - Perfect Score!)
- **SEO:** 92/100 ⚠️ (Target: 100)

**Core Web Vitals (Desktop):**
- FCP: 0.8s ✅ (EXCELLENT)
- LCP: 1.7s ✅ (Good, but slightly worse than 1.5s)
- TBT: 100ms ⚠️ (New issue - was 0ms)
- CLS: 0.006 ✅ (EXCELLENT)
- Speed Index: 5.4s (Target: < 3.4s) ⚠️ (Worse than 4.7s)

---

## 📈 COMPARISON: BEFORE vs AFTER OPTIMIZATIONS

| Metric | Before | After | Change | Status |
|--------|--------|-------|--------|--------|
| **Mobile Performance** | 65 | 61 | -4 ⬇️ | ⚠️ Needs Attention |
| **Desktop Performance** | 85 | 82 | -3 ⬇️ | ⚠️ Needs Attention |
| **Mobile LCP** | 5.6s | 8.1s | +2.5s ⬇️ | 🔴 **CRITICAL** |
| **Desktop LCP** | 1.5s | 1.7s | +0.2s ⬇️ | ⚠️ Slight Regression |
| **Mobile Speed Index** | 13.4s | 10.9s | -2.5s ⬆️ | ✅ Improved |
| **Desktop Speed Index** | 4.7s | 5.4s | +0.7s ⬇️ | ⚠️ Regression |
| **Mobile Accessibility** | 100 | 100 | 0 | ✅ Maintained |
| **Desktop Accessibility** | 89 | 95 | +6 ⬆️ | ✅ Improved |
| **Mobile CLS** | 0 | 0.004 | +0.004 | ✅ Still Excellent |
| **Desktop CLS** | 0.006 | 0.006 | 0 | ✅ Maintained |
| **Mobile TBT** | 0ms | 0ms | 0 | ✅ Maintained |
| **Desktop TBT** | 0ms | 100ms | +100ms ⬇️ | ⚠️ New Issue |

---

## 🔴 CRITICAL ISSUES (High Priority)

### 1. **Mobile LCP Regression** (CRITICAL)
**Current:** 8.1s (Target: < 2.5s)  
**Previous:** 5.6s  
**Status:** 🔴 **SIGNIFICANT REGRESSION**

**Possible Causes:**
- Hero image not loading optimally
- Missing or incorrect preload
- Large image file size
- Network conditions during test
- Server response time

**Recommendations:**
- ⚠️ Verify hero image preload is working correctly
- ⚠️ Check if hero image is being served from CDN
- ⚠️ Consider using a smaller hero image for mobile
- ⚠️ Add explicit `fetchpriority="high"` to hero image
- ⚠️ Ensure hero image is in WebP format and optimized
- ⚠️ Check server response times

---

### 2. **robots.txt Validation Error** (SEO)
**Impact:** SEO score stuck at 92/100  
**Status:** ⚠️ Still Present

**Issue:** robots.txt is not valid — 1 error found

**Action Required:**
- ⚠️ Check Google Search Console for specific error
- ⚠️ Validate robots.txt using online validators
- ⚠️ Ensure proper formatting and syntax

---

### 3. **Desktop TBT Regression** (New Issue)
**Current:** 100ms (Target: < 200ms)  
**Previous:** 0ms  
**Status:** ⚠️ New Issue

**Possible Causes:**
- JavaScript execution blocking main thread
- Long-running tasks
- Non-optimized scripts

**Recommendations:**
- ⚠️ Audit JavaScript for long-running tasks
- ⚠️ Code-split large JavaScript bundles
- ⚠️ Defer non-critical JavaScript further
- ⚠️ Use Web Workers for heavy computations

---

## 🟡 HIGH PRIORITY ISSUES

### 4. **Image Delivery Optimization** (HIGH)
**Impact:** Mobile: 688 KiB savings, Desktop: 513 KiB savings  
**Priority:** 🟡 HIGH

**Issues:**
- Images not using modern formats optimally
- Missing responsive images (srcset) for all images
- Large image files not compressed enough

**Recommendations:**
- ⚠️ Add `srcset` for all product images, not just hero
- ⚠️ Further compress images (target: 80-85% quality)
- ⚠️ Consider AVIF format for modern browsers
- ⚠️ Implement proper responsive image sizes

---

### 5. **Main-Thread Work** (HIGH)
**Impact:** Mobile: 6.3s, Desktop: 4.1s  
**Priority:** 🟡 HIGH

**Issues:**
- JavaScript execution taking too long
- Long-running tasks blocking main thread
- Non-optimized animations

**Recommendations:**
- ⚠️ Code-split JavaScript bundles
- ⚠️ Use Web Workers for heavy computations
- ⚠️ Further optimize animations
- ⚠️ Reduce DOM manipulation
- ⚠️ Break up long tasks into smaller chunks

---

### 6. **Speed Index - Mobile** (MEDIUM-HIGH)
**Current:** 10.9s (Target: < 3.4s)  
**Priority:** 🟡 MEDIUM-HIGH

**Issues:**
- Large CSS blocking render
- JavaScript execution blocking paint
- Images loading synchronously

**Recommendations:**
- ⚠️ Further optimize critical CSS (reduce size)
- ⚠️ Defer non-critical JavaScript more aggressively
- ⚠️ Preload critical resources
- ⚠️ Use font-display: swap (already implemented)

---

### 7. **Speed Index - Desktop** (MEDIUM)
**Current:** 5.4s (Target: < 3.4s)  
**Previous:** 4.7s  
**Priority:** 🟡 MEDIUM

**Recommendations:**
- ⚠️ Optimize resource loading order
- ⚠️ Reduce render-blocking resources
- ⚠️ Further inline critical CSS

---

## 🟢 MEDIUM PRIORITY ISSUES

### 8. **Non-Composited Animations** (MEDIUM)
**Impact:** 5 animated elements found (both mobile & desktop)  
**Priority:** 🟢 MEDIUM

**Recommendations:**
- ⚠️ Audit all animations (check for width, height, top, left changes)
- ⚠️ Ensure all animations use only transform/opacity
- ⚠️ Add will-change hints to animated elements

---

### 9. **Long Main-Thread Tasks** (MEDIUM)
**Impact:** Mobile: 1 long task, Desktop: 3 long tasks  
**Priority:** 🟢 MEDIUM

**Recommendations:**
- ⚠️ Identify and break up long tasks
- ⚠️ Use `setTimeout` or `requestIdleCallback` to split work
- ⚠️ Defer non-critical work

---

### 10. **Forced Reflow** (MEDIUM)
**Impact:** Layout thrashing  
**Priority:** 🟢 MEDIUM

**Recommendations:**
- ⚠️ Batch DOM reads/writes
- ⚠️ Use requestAnimationFrame for layout changes
- ⚠️ Avoid reading layout properties in loops

---

### 11. **Color Contrast - Desktop** (MEDIUM)
**Impact:** Desktop Accessibility: 95/100  
**Priority:** 🟢 MEDIUM

**Issue:** Background and foreground colours do not have a sufficient contrast ratio

**Recommendations:**
- ⚠️ Identify elements with low contrast
- ⚠️ Fix color contrast ratios (WCAG AA: 4.5:1, AAA: 7:1)
- ⚠️ Test with contrast checker tools

---

## 🟢 LOW PRIORITY ISSUES

### 12. **CSS/JS Minification** (LOW)
**Impact:** CSS: 3 KiB, JS: 2 KiB savings  
**Priority:** 🟢 LOW

**Recommendations:**
- ⚠️ Minify CSS and JavaScript for production
- ⚠️ Use build tools for automatic minification
- ⚠️ Remove unused CSS/JS

---

### 13. **Cache Lifetimes** (LOW)
**Impact:** 13 KiB savings  
**Priority:** 🟢 LOW

**Status:** ✅ Already optimized in `.htaccess`  
**Note:** May need time to propagate or verify server configuration

---

### 14. **DOM Size** (LOW)
**Impact:** Large DOM affecting performance  
**Priority:** 🟢 LOW

**Recommendations:**
- ⚠️ Audit DOM structure
- ⚠️ Remove unnecessary wrapper divs
- ⚠️ Simplify HTML structure

---

## ✅ SUCCESSES (What's Working Well)

1. **✅ Accessibility - Mobile:** Perfect 100/100 score maintained
2. **✅ Accessibility - Desktop:** Improved from 89 to 95
3. **✅ Best Practices:** Perfect 100/100 on both mobile and desktop
4. **✅ CLS (Cumulative Layout Shift):** Excellent scores (0.004 mobile, 0.006 desktop)
5. **✅ TBT - Mobile:** Perfect 0ms maintained
6. **✅ FCP - Desktop:** Excellent 0.8s
7. **✅ Security Headers:** All properly configured

---

## 🎯 PRIORITY ACTION PLAN

### Phase 1: Critical Fixes (Do Immediately)
1. 🔴 **Fix Mobile LCP Regression** (8.1s → < 2.5s)
   - Verify hero image preload
   - Check server/CDN response times
   - Optimize hero image further
   - Consider mobile-specific smaller hero image

2. 🔴 **Fix robots.txt Validation Error**
   - Check Google Search Console for specific error
   - Validate and fix robots.txt

3. ⚠️ **Fix Desktop TBT** (100ms → < 200ms)
   - Audit JavaScript for long tasks
   - Code-split and defer scripts

### Phase 2: High Priority (Do Next)
4. ⚠️ **Optimize Image Delivery** (688 KiB mobile, 513 KiB desktop)
   - Add srcset to all product images
   - Further compress images
   - Consider AVIF format

5. ⚠️ **Reduce Main-Thread Work** (6.3s mobile, 4.1s desktop)
   - Code-split JavaScript
   - Use Web Workers
   - Break up long tasks

6. ⚠️ **Improve Speed Index** (10.9s mobile, 5.4s desktop)
   - Further optimize critical CSS
   - Defer non-critical JS more aggressively

### Phase 3: Medium Priority
7. ⚠️ **Fix Non-Composited Animations** (5 elements)
8. ⚠️ **Fix Long Main-Thread Tasks** (1-3 tasks)
9. ⚠️ **Fix Forced Reflow**
10. ⚠️ **Fix Color Contrast** (Desktop)

### Phase 4: Low Priority (Optional)
11. ⚠️ Minify CSS/JS
12. ⚠️ Optimize DOM size

---

## 📊 EXPECTED IMPROVEMENTS (After Phase 1 & 2)

| Metric | Current | Target | Expected After Fixes |
|--------|---------|--------|---------------------|
| **Mobile Performance** | 61 | 90+ | 75-85 |
| **Desktop Performance** | 82 | 95+ | 88-92 |
| **Mobile LCP** | 8.1s | < 2.5s | 3.0-4.0s |
| **Desktop LCP** | 1.7s | < 2.5s | 1.5-1.8s |
| **Mobile Speed Index** | 10.9s | < 3.4s | 5.0-7.0s |
| **Desktop Speed Index** | 5.4s | < 3.4s | 4.0-4.5s |
| **Desktop TBT** | 100ms | < 200ms | < 50ms |
| **Mobile SEO** | 92 | 100 | 100 |
| **Desktop SEO** | 92 | 100 | 100 |
| **Desktop Accessibility** | 95 | 100 | 98-100 |

---

## 🔍 ROOT CAUSE ANALYSIS

### Why Mobile LCP Got Worse?
Possible reasons:
1. **Server/CDN Response Time:** Slower response during test
2. **Image Size:** Hero image might be larger than expected
3. **Preload Not Working:** Preload link might not be effective
4. **Network Conditions:** Test was run on slower network
5. **Cache Not Applied:** Browser cache might not be working

### Why Desktop TBT Increased?
Possible reasons:
1. **New JavaScript:** Additional scripts added
2. **Long Tasks:** Some JavaScript creating long-running tasks
3. **Animation Issues:** Non-composited animations causing work
4. **DOM Manipulation:** Heavy DOM operations

---

## 📝 NOTES

- **Google Indexing:** All changes are safe, no URLs will change
- **Functionality:** All features will continue working
- **Performance:** Some metrics improved, but LCP regression needs immediate attention
- **Accessibility:** Excellent progress, especially on desktop

---

## 🔗 REFERENCES

- [Mobile Report](https://pagespeed.web.dev/analysis/https-woodenmax-in/nnu3qo7zrw?utm_source=search_console&form_factor=mobile&hl=en_GB)
- [Desktop Report](https://pagespeed.web.dev/analysis/https-woodenmax-in/nnu3qo7zrw?utm_source=search_console&form_factor=desktop&hl=en_GB)
- [Web.dev Performance Guide](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)

---

**Report Generated:** December 27, 2025, 12:05:04 GMT+5:30  
**Status:** ⚠️ **CRITICAL ISSUES IDENTIFIED - IMMEDIATE ACTION REQUIRED**  
**Next Steps:** Fix Mobile LCP regression and robots.txt validation error

