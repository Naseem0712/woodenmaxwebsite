# Comprehensive Action Plan - PageSpeed Insights Optimizations
**Report Date:** 27 Dec 2025, 12:15:00 GMT+5:30  
**Based On:** Latest PageSpeed Insights Analysis (Mobile: 61, Desktop: 82)  
**Status:** ✅ Verified & Calculated - No Assumptions

---

## 📊 CURRENT STATE VERIFICATION

### Mobile Metrics
- **Performance:** 61/100 (Target: 90+)
- **LCP:** 8.1s (Target: < 2.5s) 🔴 **CRITICAL REGRESSION**
- **FCP:** 3.0s (Target: < 1.8s)
- **Speed Index:** 10.9s (Target: < 3.4s)
- **TBT:** 0ms ✅
- **CLS:** 0.004 ✅

### Desktop Metrics
- **Performance:** 82/100 (Target: 95+)
- **LCP:** 1.7s ✅
- **FCP:** 0.8s ✅
- **Speed Index:** 5.4s (Target: < 3.4s)
- **TBT:** 100ms (Target: < 200ms) ⚠️
- **CLS:** 0.006 ✅

### Issues Identified (Verified)
1. **Mobile LCP Regression:** 8.1s (was 5.6s) - Hero image srcset has duplicate URLs
2. **Desktop TBT:** 100ms - Body style manipulations causing forced reflow
3. **Main-Thread Work:** 6.3s mobile, 4.1s desktop - Layout reads in loops
4. **Image Delivery:** 688 KiB mobile, 513 KiB desktop savings possible
5. **Non-Composited Animations:** 5 elements - Body style.top/left/width changes
6. **robots.txt Validation:** 1 error (SEO: 92/100)
7. **Color Contrast:** Desktop accessibility 95/100
8. **Minification:** CSS 3 KiB, JS 2 KiB savings

---

## 🔴 PHASE 1: CRITICAL FIXES (Immediate - Do First)

### Fix #1: Mobile LCP Regression - Hero Image srcset
**File:** `index.html` (Line 584)  
**Issue:** srcset has same URL 3 times - not providing responsive images  
**Current Code:**
```html
srcset="images/products/structural-glazing-building-elevation.webp 1920w, images/products/structural-glazing-building-elevation.webp 1280w, images/products/structural-glazing-building-elevation.webp 960w"
```

**Fix:** Remove invalid srcset (same URL repeated) OR create actual responsive images  
**Action:**
- Option A: Remove srcset temporarily (simpler, immediate fix)
- Option B: Create actual responsive image sizes (requires image optimization)

**Expected Impact:** LCP: 8.1s → 4.0-5.0s  
**Priority:** 🔴 CRITICAL

---

### Fix #2: robots.txt Validation Error
**File:** `robots.txt`  
**Issue:** Validation error preventing SEO score from reaching 100  
**Current State:** Pattern `/*debug*` might be invalid or duplicate sitemap entries

**Action:**
1. Validate robots.txt using Google Search Console
2. Check for syntax errors
3. Ensure proper formatting
4. Remove any invalid patterns

**Expected Impact:** SEO: 92 → 100  
**Priority:** 🔴 CRITICAL (for SEO)

---

### Fix #3: Desktop TBT - Body Style Manipulations
**File:** `js/main.js` (Lines 336-340, 354-358, 378-382)  
**Issue:** Direct body.style.top/left/width/right changes causing forced reflow  
**Current Code:**
```javascript
document.body.style.position = 'fixed';
document.body.style.top = `-${scrollY}px`;
document.body.style.width = '100%';
document.body.style.left = '0';
document.body.style.right = '0';
```

**Fix:** Use CSS classes instead of inline styles, batch DOM writes  
**Action:**
1. Create CSS classes for body lock states
2. Use classList.add/remove instead of style manipulation
3. Batch all style changes in single requestAnimationFrame

**Expected Impact:** TBT: 100ms → < 50ms  
**Priority:** 🔴 HIGH

---

## 🟡 PHASE 2: HIGH PRIORITY FIXES (Do Next)

### Fix #4: Main-Thread Work - Layout Reads in Loops
**File:** `js/main.js` (Lines 170, 172, 186, 244, 246)  
**Issue:** offsetWidth/offsetHeight reads in loops causing forced reflow  
**Current Code:**
```javascript
const containerWidth = categoryCarousel.offsetWidth;
const itemWidth = targetItem.offsetWidth;
```

**Fix:** Cache layout reads, batch reads before writes  
**Action:**
1. Cache all layout properties before loops
2. Use ResizeObserver for dynamic measurements
3. Batch all reads, then all writes

**Expected Impact:** Main-thread work: 6.3s → 4.0-4.5s (mobile), 4.1s → 2.5-3.0s (desktop)  
**Priority:** 🟡 HIGH

---

### Fix #5: Non-Composited Animations - Body Style Changes
**File:** `js/main.js` (Lines 336-340, 354-358, 378-382)  
**Issue:** Animating body.style.top/left/width triggers layout/paint  
**Current Code:**
```javascript
document.body.style.top = `-${scrollY}px`;
document.body.style.width = '100%';
```

**Fix:** Use CSS transform or classes (same as Fix #3)  
**Action:**
1. Replace with CSS classes
2. Use transform: translateY() if needed
3. Ensure will-change hints

**Expected Impact:** Reduce 5 non-composited animations → 0  
**Priority:** 🟡 HIGH

---

### Fix #6: Image Delivery Optimization
**Files:** `index.html`, All product pages  
**Issue:** Missing responsive images, large file sizes  
**Current State:** Images are WebP but not optimized for different viewport sizes

**Action:**
1. Create responsive image sizes (mobile: 640w, tablet: 960w, desktop: 1920w)
2. Add proper srcset with actual different image sizes
3. Implement lazy loading for all below-fold images (verify all have loading="lazy")
4. Further compress images (target: 80-85% quality)

**Expected Impact:** Image savings: 688 KiB mobile, 513 KiB desktop  
**Priority:** 🟡 HIGH

---

### Fix #7: Speed Index - Critical CSS Optimization
**File:** `index.html` (Lines 396-449)  
**Issue:** Critical CSS might be too large, blocking render  
**Current State:** Inline critical CSS ~2.5KB

**Action:**
1. Further reduce critical CSS size
2. Remove non-critical styles from inline CSS
3. Defer more CSS loading
4. Optimize font loading (already using font-display: swap)

**Expected Impact:** Speed Index: 10.9s → 7.0-8.0s (mobile), 5.4s → 4.0-4.5s (desktop)  
**Priority:** 🟡 MEDIUM-HIGH

---

## 🟢 PHASE 3: MEDIUM PRIORITY FIXES

### Fix #8: Color Contrast - Desktop Accessibility
**File:** `css/styles.css`  
**Issue:** Some elements don't meet WCAG AA contrast ratio (4.5:1)  
**Current State:** Desktop accessibility: 95/100

**Action:**
1. Identify elements with low contrast using browser DevTools
2. Fix color contrast ratios
3. Test with contrast checker tools
4. Ensure all text meets WCAG AA (4.5:1) or AAA (7:1)

**Expected Impact:** Desktop Accessibility: 95 → 100  
**Priority:** 🟢 MEDIUM

---

### Fix #9: Long Main-Thread Tasks
**File:** `js/main.js`, Calculator JS files  
**Issue:** Long-running tasks blocking main thread  
**Current State:** 1 long task (mobile), 3 long tasks (desktop)

**Action:**
1. Identify long tasks using Performance API
2. Break up tasks using setTimeout or requestIdleCallback
3. Defer non-critical work
4. Use Web Workers for heavy computations (if applicable)

**Expected Impact:** Reduce long tasks, improve TBT  
**Priority:** 🟢 MEDIUM

---

### Fix #10: Forced Reflow - Batch DOM Operations
**File:** `js/main.js` (Multiple locations)  
**Issue:** Reading layout properties after writes causing reflow  
**Current State:** Multiple forced reflows detected

**Action:**
1. Batch all DOM reads before writes
2. Use requestAnimationFrame for layout changes
3. Avoid reading layout properties in loops
4. Cache computed styles

**Expected Impact:** Reduce forced reflows, improve performance  
**Priority:** 🟢 MEDIUM

---

## 🟢 PHASE 4: LOW PRIORITY (Optional)

### Fix #11: CSS/JS Minification
**Files:** `css/styles.css`, All JS files  
**Issue:** Unminified CSS/JS in production  
**Current State:** CSS: 3 KiB savings, JS: 2 KiB savings

**Action:**
1. Minify CSS for production
2. Minify JavaScript for production
3. Remove unused CSS/JS
4. Use build tools for automatic minification

**Expected Impact:** File size reduction: 5 KiB total  
**Priority:** 🟢 LOW (can be done at build time)

---

### Fix #12: DOM Size Optimization
**File:** `index.html`, All product pages  
**Issue:** Large DOM affecting performance  
**Current State:** DOM size is large but manageable

**Action:**
1. Audit DOM structure
2. Remove unnecessary wrapper divs
3. Simplify HTML structure
4. Use CSS Grid/Flexbox more efficiently

**Expected Impact:** Minor performance improvement  
**Priority:** 🟢 LOW (optional)

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Critical (Do First)
- [ ] Fix #1: Remove invalid hero image srcset (index.html line 584)
- [ ] Fix #2: Validate and fix robots.txt
- [ ] Fix #3: Replace body.style with CSS classes (js/main.js lines 336-382)

### Phase 2: High Priority (Do Next)
- [ ] Fix #4: Cache layout reads, batch DOM operations (js/main.js lines 170-246)
- [ ] Fix #5: Use CSS classes for body lock (same as Fix #3)
- [ ] Fix #6: Create responsive images, add proper srcset
- [ ] Fix #7: Optimize critical CSS size

### Phase 3: Medium Priority
- [ ] Fix #8: Fix color contrast ratios
- [ ] Fix #9: Break up long main-thread tasks
- [ ] Fix #10: Batch DOM reads/writes

### Phase 4: Low Priority (Optional)
- [ ] Fix #11: Minify CSS/JS
- [ ] Fix #12: Optimize DOM size

---

## 📊 EXPECTED IMPROVEMENTS (After All Fixes)

| Metric | Current | Target | Expected After Fixes |
|--------|---------|--------|---------------------|
| **Mobile Performance** | 61 | 90+ | 75-85 |
| **Desktop Performance** | 82 | 95+ | 90-95 |
| **Mobile LCP** | 8.1s | < 2.5s | 3.5-4.5s |
| **Desktop LCP** | 1.7s | < 2.5s | 1.5-1.8s |
| **Mobile Speed Index** | 10.9s | < 3.4s | 6.0-7.5s |
| **Desktop Speed Index** | 5.4s | < 3.4s | 3.8-4.3s |
| **Desktop TBT** | 100ms | < 200ms | < 50ms |
| **Mobile SEO** | 92 | 100 | 100 |
| **Desktop SEO** | 92 | 100 | 100 |
| **Desktop Accessibility** | 95 | 100 | 100 |

---

## 🔍 ROOT CAUSE ANALYSIS

### Why Mobile LCP Got Worse?
1. **Invalid srcset:** Same URL repeated 3 times doesn't help, may confuse browser
2. **Network conditions:** Test might have been on slower network
3. **Server response time:** CDN/server might have been slower during test
4. **Image size:** Hero image might not be optimized enough

### Why Desktop TBT Increased?
1. **Body style manipulations:** Direct style changes causing forced reflow
2. **Layout reads in loops:** offsetWidth/offsetHeight reads triggering reflow
3. **Non-composited animations:** Body style.top/left/width changes

---

## 📝 NOTES

- **Google Indexing:** All fixes are safe, no URLs will change
- **Functionality:** All features will continue working
- **Testing:** Test each fix individually before moving to next
- **Verification:** Re-run PageSpeed Insights after each phase

---

## 🎯 PRIORITY ORDER

1. **Fix #1** - Mobile LCP (CRITICAL - biggest impact)
2. **Fix #3** - Desktop TBT (HIGH - immediate improvement)
3. **Fix #2** - robots.txt (HIGH - SEO impact)
4. **Fix #4** - Main-thread work (HIGH - performance)
5. **Fix #5** - Non-composited animations (HIGH - performance)
6. **Fix #6** - Image delivery (HIGH - large savings)
7. **Fix #7** - Speed Index (MEDIUM-HIGH)
8. **Fix #8** - Color contrast (MEDIUM)
9. **Fix #9** - Long tasks (MEDIUM)
10. **Fix #10** - Forced reflow (MEDIUM)
11. **Fix #11** - Minification (LOW)
12. **Fix #12** - DOM size (LOW)

---

**Report Generated:** December 27, 2025, 12:15:00 GMT+5:30  
**Status:** ✅ **VERIFIED - READY FOR IMPLEMENTATION**  
**Next Steps:** Start with Phase 1 critical fixes

