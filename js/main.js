/* ============================================
   WOODENMAX - MAIN JAVASCRIPT
   All Interactions & Animations
   ============================================ */

/**
 * Geo + FX display pricing (runs synchronously here). India: unchanged INR.
 * Elsewhere: Indian base × live FX × regional premium (US/UK +45% on FX = ~30–60% band midpoint).
 * Duplicated in js/currency-localization.js — keep both in sync when editing premiums or API URLs.
 */
(function (global) {
  'use strict';

  if (global.__wmPricingModuleLoaded) return;
  global.__wmPricingModuleLoaded = true;

  var CACHE_KEY = 'wm_pricing_ctx_v2';
  var TTL_MS = 12 * 60 * 60 * 1000;
  var FX_URL = 'https://open.er-api.com/v6/latest/INR';
  var GEO_URL = 'https://ipapi.co/json/';

  var EUROZONE = {
    AT: 1, BE: 1, CY: 1, EE: 1, FI: 1, FR: 1, DE: 1, GR: 1, IE: 1, IT: 1,
    LV: 1, LT: 1, LU: 1, MT: 1, NL: 1, PT: 1, SK: 1, SI: 1, ES: 1, HR: 1
  };

  /** Extra % on top of FX (high-inflation markets). US/UK: ~30–60% band → 45% midpoint. */
  function premiumForCountry(code) {
    if (!code || String(code).toUpperCase() === 'IN') return 0;
    var c = String(code).toUpperCase();
    if (c === 'US' || c === 'GB') return 0.45;
    if (EUROZONE[c]) return 0.2;
    if (c === 'SA') return 0.125;
    if (c === 'KW') return 0.165;
    if (c === 'AE' || c === 'QA' || c === 'BH' || c === 'OM') return 0.12;
    return 0.1;
  }

  function targetCurrency(countryCode, geoCurrency) {
    var c = String(countryCode || '').toUpperCase();
    if (c === 'IN') return 'INR';
    if (EUROZONE[c]) return 'EUR';
    var cur = String(geoCurrency || 'USD').toUpperCase();
    if (cur === 'INR') return 'USD';
    return cur;
  }

  function localeFor(countryCode, currency) {
    var c = String(countryCode || '').toUpperCase();
    var cur = String(currency || '').toUpperCase();
    if (c === 'US' || cur === 'USD') return 'en-US';
    if (c === 'GB' || cur === 'GBP') return 'en-GB';
    if (cur === 'EUR') return 'de-DE';
    if (cur === 'SAR') return 'en-SA';
    if (cur === 'AED') return 'en-AE';
    if (cur === 'KWD') return 'ar-KW';
    if (cur === 'QAR') return 'ar-QA';
    if (cur === 'BHD') return 'ar-BH';
    if (cur === 'OMR') return 'ar-OM';
    return 'en-US';
  }

  function bindFormatters(state) {
    global.__wmPricing = state;
    global.formatPriceFromINR = function (amountInr) {
      var n = Number(amountInr) || 0;
      var p = global.__wmPricing;
      if (!p || !p.foreign) {
        try {
          return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            currencyDisplay: 'symbol',
            maximumFractionDigits: 0,
            minimumFractionDigits: 0
          }).format(Math.round(n));
        } catch (e2) {
          return '\u20B9' + Math.round(n).toLocaleString('en-IN');
        }
      }
      var mult = p.rates && p.rates[p.currency];
      if (mult == null || mult === 0) {
        return '\u20B9' + Math.round(n).toLocaleString('en-IN');
      }
      var localVal = n * mult * (1 + p.premium);
      var rounded = Math.round(localVal);
      try {
        return new Intl.NumberFormat(p.locale, {
          style: 'currency',
          currency: p.currency,
          currencyDisplay: 'symbol',
          maximumFractionDigits: 0,
          minimumFractionDigits: 0
        }).format(rounded);
      } catch (e) {
        return rounded.toLocaleString(p.locale) + '\u00a0' + p.currency;
      }
    };
    global.formatPriceRangeFromINR = function (lowInr, highInr) {
      return global.formatPriceFromINR(lowInr) + ' \u2013 ' + global.formatPriceFromINR(highInr);
    };

    // GA4 market experiment: foreign pricing layer shown (Indian SEO unchanged). Explore: Reports → Engagement → Events → wm_global_pricing_view; breakdown by wm_country.
    if (state && state.foreign && state.countryCode) {
      try {
        if (typeof global.gtag === 'function') {
          global.gtag('event', 'wm_global_pricing_view', {
            wm_country: state.countryCode,
            wm_currency: state.currency,
            wm_premium: state.premium,
            wm_url_test: state.pricingTestOverride ? 1 : 0
          });
        }
      } catch (e) {}
    }
  }

  function domesticState() {
    return {
      foreign: false,
      premium: 0,
      currency: 'INR',
      countryCode: 'IN',
      locale: 'en-IN',
      rates: null
    };
  }

  function loadCached() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.ts || Date.now() - o.ts > TTL_MS) return null;
      return o.data;
    } catch (e) {
      return null;
    }
  }

  function saveCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (e) {}
  }

  function buildForeignState(countryCode, currencyFromGeo, rates) {
    var cc = String(countryCode || 'US').toUpperCase();
    var currency = targetCurrency(cc, currencyFromGeo);
    var rate = rates[currency];
    if (rate == null || rate === 0) {
      currency = 'USD';
      rate = rates['USD'];
    }
    return {
      foreign: true,
      premium: premiumForCountry(cc),
      currency: currency,
      countryCode: cc,
      locale: localeFor(cc, currency),
      rates: rates
    };
  }

  function refreshCalculators() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', refreshCalculators);
      return;
    }
    var k;
    for (k in global) {
      if (!Object.prototype.hasOwnProperty.call(global, k) || k.indexOf('calculator_') !== 0) continue;
      var calc = global[k];
      if (calc && typeof calc.calculate === 'function') {
        try {
          calc.calculate();
        } catch (e) {}
      }
    }
    if (typeof global.wmRefreshPergolaPricingDisplay === 'function') {
      try {
        global.wmRefreshPergolaPricingDisplay();
      } catch (e) {}
    }
    if (typeof global.wmRecalculateAllSizeRows === 'function') {
      try {
        global.wmRecalculateAllSizeRows();
      } catch (e) {}
    }
  }

  function dispatchReady() {
    try {
      global.dispatchEvent(new CustomEvent('wm-pricing-ready'));
    } catch (e) {}
    refreshCalculators();
  }

  function fetchJson(url) {
    return fetch(url, { credentials: 'omit' }).then(function (res) {
      if (!res.ok) throw new Error('http');
      return res.json();
    });
  }

  /** Live test: add ?wmPricingCountry=US or GB (ISO2). Skips session cache so IP mismatch na ho. */
  function pricingCountryOverride() {
    try {
      var m = location.search.match(/(?:^|[?&])wmPricingCountry=([A-Za-z]{2})(?:&|$)/);
      return m ? m[1].toUpperCase() : null;
    } catch (e) {
      return null;
    }
  }

  function run() {
    var urlOverride = pricingCountryOverride();
    var cached = urlOverride ? null : loadCached();
    if (cached) {
      bindFormatters(cached);
    } else {
      bindFormatters(domesticState());
    }

    Promise.all([fetchJson(GEO_URL), fetchJson(FX_URL)])
      .then(function (pair) {
        var geo = pair[0];
        var fx = pair[1];
        var rates = fx && fx.rates;
        if (!rates) {
          if (!cached) {
            bindFormatters(domesticState());
            dispatchReady();
          }
          return;
        }
        var cc = urlOverride;
        if (!cc) {
          cc = geo && (geo.country_code || geo.country)
            ? String(geo.country_code || geo.country).toUpperCase()
            : 'IN';
        }
        if (cc === 'IN') {
          var dom = domesticState();
          bindFormatters(dom);
          if (!urlOverride) saveCache(dom);
          dispatchReady();
          return;
        }
        var st = buildForeignState(cc, (geo && geo.currency) || 'USD', rates);
        st.pricingTestOverride = !!urlOverride;
        bindFormatters(st);
        if (!urlOverride) saveCache(st);
        dispatchReady();
      })
      .catch(function () {
        if (!cached) {
          bindFormatters(domesticState());
          dispatchReady();
        }
      });
  }

  run();
})(typeof window !== 'undefined' ? window : this);

// Utility function to normalize URLs by removing project folder name
// This ensures URLs work correctly both in local dev (with folder name) and production (without)
function normalizeUrl(url) {
  if (!url) return url;
  
  // Remove the folder name from URLs
  // Example: /woodenmaxwebsite-main/products/... -> /products/...
  const folderName = 'woodenmaxwebsite-main';
  
  // Handle both pathname and full URLs
  try {
    const urlObj = new URL(url, window.location.origin);
    let pathname = urlObj.pathname;
    
    // Remove folder name from pathname
    if (pathname.startsWith(`/${folderName}/`)) {
      pathname = pathname.replace(`/${folderName}`, '');
    } else if (pathname === `/${folderName}`) {
      pathname = '/';
    }
    
    // Reconstruct URL with normalized pathname
    urlObj.pathname = pathname;
    return urlObj.href;
  } catch (e) {
    // If URL parsing fails, try simple string replacement
    if (url.includes(`/${folderName}/`)) {
      return url.replace(`/${folderName}`, '');
    } else if (url.endsWith(`/${folderName}`)) {
      return url.replace(`/${folderName}`, '/');
    }
    return url;
  }
}

// Utility function to normalize pathname
function normalizePathname(pathname) {
  if (!pathname) return pathname;
  const folderName = 'woodenmaxwebsite-main';
  
  if (pathname.startsWith(`/${folderName}/`)) {
    return pathname.replace(`/${folderName}`, '');
  } else if (pathname === `/${folderName}`) {
    return '/';
  }
  return pathname;
}

/** Path segments from a nav link href (for matching current page to category). */
function categoryHrefPathSegments(href) {
  if (!href || href === '#' || href.toLowerCase().indexOf('javascript:') === 0) return [];
  try {
    const abs = new URL(href, window.location.href);
    let p = normalizePathname(abs.pathname).replace(/\/+$/, '') || '/';
    return p.split('/').filter(Boolean);
  } catch (e) {
    return [];
  }
}

/**
 * Pick which carousel item matches the current URL — avoids brittle keyword maps
 * (e.g. "glass" matching glass-railing before glass-elevation) and out-of-range indices.
 */
function detectCategoryCarouselIndex(originalItems) {
  const path = normalizePathname(window.location.pathname).toLowerCase().replace(/\/+$/, '') || '/';
  const pathSegs = path.split('/').filter(Boolean);

  for (let i = 0; i < originalItems.length; i++) {
    if (originalItems[i].classList && originalItems[i].classList.contains('active')) {
      return i;
    }
  }

  let bestIdx = 0;
  let bestScore = -1;

  for (let idx = 0; idx < originalItems.length; idx++) {
    const href = originalItems[idx].getAttribute('href') || '';
    const segs = categoryHrefPathSegments(href);
    if (segs.length === 0) continue;

    const last = segs[segs.length - 1].toLowerCase();
    let score = 0;

    for (let j = 0; j < pathSegs.length; j++) {
      if (pathSegs[j].toLowerCase() === last) {
        score = Math.max(score, last.length);
      }
    }

    const hrefPath = '/' + segs.map((s) => s.toLowerCase()).join('/');
    if (path.indexOf(hrefPath) >= 0) {
      score = Math.max(score, hrefPath.length);
    }

    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  }

  return bestIdx;
}

// Enable browser's scroll position restoration on page refresh
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'auto';
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  
  // ============================================
  // NAVBAR SCROLL EFFECT (Optimized with RAF)
  // ============================================
  const navbar = document.getElementById('navbar');
  let ticking = false;
  
  function handleNavbarScroll() {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    ticking = false;
  }
  
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(handleNavbarScroll);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', onScroll, { passive: true });
  handleNavbarScroll(); // Check on load
  
  // ============================================
  // CATEGORY CAROUSEL IN HEADER (Infinite Wheel)
  // ============================================
  const categoryCarousel = document.getElementById('categoryCarousel');
  const catPrev = document.getElementById('catPrev');
  const catNext = document.getElementById('catNext');
  
  if (categoryCarousel && catPrev && catNext) {
    const originalItems = Array.from(categoryCarousel.querySelectorAll('.cat-item'));
    const totalCategories = originalItems.length;
    
    // Clone items for infinite scroll effect (add clones before and after)
    const clonesBefore = [];
    const clonesAfter = [];
    
    // Create clones
    originalItems.forEach((item, index) => {
      const cloneBefore = item.cloneNode(true);
      const cloneAfter = item.cloneNode(true);
      cloneBefore.classList.add('clone');
      cloneAfter.classList.add('clone');
      cloneBefore.dataset.originalIndex = index;
      cloneAfter.dataset.originalIndex = index;
      clonesBefore.push(cloneBefore);
      clonesAfter.push(cloneAfter);
    });
    
    // Add clones to carousel
    clonesBefore.reverse().forEach(clone => {
      categoryCarousel.insertBefore(clone, categoryCarousel.firstChild);
    });
    clonesAfter.forEach(clone => {
      categoryCarousel.appendChild(clone);
    });
    
    // Get all items including clones
    const allItems = Array.from(categoryCarousel.querySelectorAll('.cat-item'));
    
    // Detect current page from nav link hrefs (same labels as home; no missing/wrong highlight)
    let currentCatIndex = detectCategoryCarouselIndex(originalItems);
    currentCatIndex = Math.max(0, Math.min(currentCatIndex, totalCategories - 1));
    let isAnimating = false;
    
    // Wheel rotation easing - very smooth, like a spinning wheel slowing down
    function easeOutQuint(t) {
      return 1 - Math.pow(1 - t, 5);
    }
    
    // Smooth scroll to position with wheel rotation effect
    function smoothScrollTo(targetPos, duration, callback) {
      const startPos = categoryCarousel.scrollLeft;
      const distance = targetPos - startPos;
      const startTime = performance.now();
      
      // Cancel any existing animation
      if (categoryCarousel.animationId) {
        cancelAnimationFrame(categoryCarousel.animationId);
      }
      
      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuint(progress);
        
        categoryCarousel.scrollLeft = startPos + (distance * easedProgress);
        
        if (progress < 1) {
          categoryCarousel.animationId = requestAnimationFrame(animate);
        } else {
          isAnimating = false;
          categoryCarousel.animationId = null;
          if (callback) callback();
        }
      }
      
      categoryCarousel.animationId = requestAnimationFrame(animate);
    }
    
    // Update visual states of all items
    function updateItemStates() {
      allItems.forEach((item) => {
        item.classList.remove('active', 'near');
        
        // Get the original index of this item
        const itemIndex = item.classList.contains('clone') 
          ? parseInt(item.dataset.originalIndex) 
          : originalItems.indexOf(item);
        
        // Calculate relative position
        let diff = itemIndex - currentCatIndex;
        
        // Handle wrap-around for visual state
        if (diff > totalCategories / 2) diff -= totalCategories;
        if (diff < -totalCategories / 2) diff += totalCategories;
        
        if (diff === 0) {
          item.classList.add('active');
        } else if (Math.abs(diff) === 1) {
          item.classList.add('near');
        }
      });
    }
    
    // Scroll to specific index (in the middle set)
    function scrollToIndex(index, animate = true, duration = 1000) {
      // Find the original item (not clone) at this index
      const targetItem = originalItems[index];
      if (!targetItem) return;
      
      // Cache all layout reads in one batch (optimized to prevent forced reflow)
      const containerWidth = categoryCarousel.offsetWidth;
      const itemLeft = targetItem.offsetLeft;
      const itemWidth = targetItem.offsetWidth;
      const targetScroll = itemLeft - (containerWidth / 2) + (itemWidth / 2);
      
      // Batch DOM write in requestAnimationFrame
      if (animate) {
        requestAnimationFrame(() => {
          smoothScrollTo(targetScroll, duration);
        });
      } else {
        requestAnimationFrame(() => {
          categoryCarousel.scrollLeft = targetScroll;
          isAnimating = false;
        });
      }
    }
    
    // Handle infinite loop - reset position when reaching clones
    function checkInfiniteLoop() {
      // Cache all layout reads in one batch (optimized to prevent forced reflow)
      const scrollLeft = categoryCarousel.scrollLeft;
      const containerWidth = categoryCarousel.offsetWidth;
      const totalWidth = categoryCarousel.scrollWidth;
      const singleSetWidth = totalWidth / 3; // 3 sets: clones + originals + clones
      
      // Batch DOM writes in requestAnimationFrame
      requestAnimationFrame(() => {
        // If scrolled too far left (into left clones), jump to right side
        if (scrollLeft < singleSetWidth * 0.3) {
          categoryCarousel.scrollLeft = scrollLeft + singleSetWidth;
        }
        // If scrolled too far right (into right clones), jump to left side
        else if (scrollLeft > singleSetWidth * 1.7) {
          categoryCarousel.scrollLeft = scrollLeft - singleSetWidth;
        }
      });
    }
    
    function updateCarousel(direction) {
      if (isAnimating) return;
      isAnimating = true;
      
      // Update visual states
      updateItemStates();
      
      // Scroll to the target item with smooth animation
      scrollToIndex(currentCatIndex, true, 1000);
    }
    
    // Arrow navigation - infinite loop
    catNext.addEventListener('click', function() {
      if (isAnimating) return;
      currentCatIndex = (currentCatIndex + 1) % totalCategories;
      updateCarousel('right');
    });
    
    catPrev.addEventListener('click', function() {
      if (isAnimating) return;
      currentCatIndex = (currentCatIndex - 1 + totalCategories) % totalCategories;
      updateCarousel('left');
    });
    
    // Click on any item (original or clone)
    allItems.forEach((item) => {
      item.addEventListener('click', function(e) {
        if (isAnimating) return;
        
        // Get original index
        const clickedIndex = item.classList.contains('clone') 
          ? parseInt(item.dataset.originalIndex) 
          : originalItems.indexOf(item);
        
        if (clickedIndex === currentCatIndex) return;
        
        isAnimating = true;
        currentCatIndex = clickedIndex;
        
        // Update visual states
        updateItemStates();
        
        // Scroll to the CLICKED item directly (not the original)
        // This ensures wheel rotates in the direction user clicked
        // Cache all layout reads in one batch (optimized to prevent forced reflow)
        const containerWidth = categoryCarousel.offsetWidth;
        const itemLeft = item.offsetLeft;
        const itemWidth = item.offsetWidth;
        const targetScroll = itemLeft - (containerWidth / 2) + (itemWidth / 2);
        
        // Batch DOM operations in requestAnimationFrame
        requestAnimationFrame(() => {
          // Smooth scroll to clicked item
          smoothScrollTo(targetScroll, 1000, function() {
            // After animation, silently reset to original item position if needed
            checkInfiniteLoop();
          });
        });
      });
    });
    
    // Initialize - NO animation on page load, instant positioning
    // Disable all transitions temporarily
    categoryCarousel.style.scrollBehavior = 'auto';
    allItems.forEach(item => {
      item.style.transition = 'none';
    });
    
    // Set initial state instantly
    updateItemStates();
    scrollToIndex(currentCatIndex, false);
    
    // Re-enable transitions after a brief delay (after browser renders)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        allItems.forEach(item => {
          item.style.transition = '';
        });
      });
    });
    
    // Check for infinite loop on scroll end
    categoryCarousel.addEventListener('scroll', function() {
      if (!isAnimating) {
        checkInfiniteLoop();
      }
    });
  }
  
  // ============================================
  // MOBILE MENU TOGGLE - Fixed for all pages
  // ============================================
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuIcon = document.getElementById('menuIcon');
  const closeIcon = document.getElementById('closeIcon');
  
  let isMobileMenuOpen = false;
  
  // Always ensure menu is closed on page load
  function initializeMobileMenu() {
    isMobileMenuOpen = false;
    if (mobileMenu) {
      mobileMenu.classList.remove('active');
    }
    if (menuIcon) {
      menuIcon.style.display = 'block';
    }
    if (closeIcon) {
      closeIcon.style.display = 'none';
    }
    // Reset body overflow and remove menu-open class - using CSS classes
    document.body.classList.remove('menu-open');
    document.documentElement.classList.remove('menu-open');
    // Remove CSS custom property
    document.documentElement.style.removeProperty('--scroll-y');
    delete document.body.dataset.scrollY;
  }
  
  // Initialize on page load
  initializeMobileMenu();
  
  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
    
    if (isMobileMenuOpen) {
      // Open menu
      if (mobileMenu) mobileMenu.classList.add('active');
      if (menuIcon) menuIcon.style.display = 'none';
      if (closeIcon) closeIcon.style.display = 'block';
      
      // Prevent body scroll - using CSS classes (optimized for performance)
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      // Use CSS custom property to prevent scroll jump
      document.documentElement.style.setProperty('--scroll-y', `-${scrollY}px`);
      document.body.classList.add('menu-open');
      document.documentElement.classList.add('menu-open');
      
      // Store scroll position
      document.body.dataset.scrollY = scrollY;
    } else {
      // Close menu
      if (mobileMenu) mobileMenu.classList.remove('active');
      if (menuIcon) menuIcon.style.display = 'block';
      if (closeIcon) closeIcon.style.display = 'none';
      
      // Restore body scroll - using CSS classes (optimized for performance)
      const scrollY = document.body.dataset.scrollY || '0';
      document.body.classList.remove('menu-open');
      document.documentElement.classList.remove('menu-open');
      // Remove CSS custom property
      document.documentElement.style.removeProperty('--scroll-y');
      
      // Restore scroll position
      window.scrollTo(0, parseInt(scrollY || '0', 10));
      delete document.body.dataset.scrollY;
    }
  }
  
  function closeMobileMenu() {
    if (!isMobileMenuOpen) return;
    
    isMobileMenuOpen = false;
    if (mobileMenu) mobileMenu.classList.remove('active');
    if (menuIcon) menuIcon.style.display = 'block';
    if (closeIcon) closeIcon.style.display = 'none';
    
    // Restore body scroll
    const scrollY = document.body.dataset.scrollY || '0';
    document.body.classList.remove('menu-open');
    document.documentElement.classList.remove('menu-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.left = '';
    document.body.style.right = '';
    
    // Restore scroll position
    window.scrollTo(0, parseInt(scrollY || '0', 10));
    delete document.body.dataset.scrollY;
  }
  
  // Toggle button event - works even if mobileMenu doesn't exist yet
  if (mobileToggle) {
    mobileToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMobileMenu();
    });
    
    // Also handle touch events for better mobile support
    mobileToggle.addEventListener('touchend', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMobileMenu();
    });
  }
  
  // Menu interactions - only if menu exists
  if (mobileMenu) {
    // Close menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        closeMobileMenu();
      });
    });
    
    // Close on background click (outside content)
    mobileMenu.addEventListener('click', function(e) {
      if (e.target === mobileMenu || e.target.classList.contains('mobile-menu-bg')) {
        closeMobileMenu();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu();
      }
    });
  }
  
  // Close menu on window resize (if resizing to desktop)
  window.addEventListener('resize', function() {
    if (window.innerWidth >= 1024 && isMobileMenuOpen) {
      closeMobileMenu();
    }
  });
  
  // Ensure menu is closed when page unloads
  window.addEventListener('beforeunload', function() {
    closeMobileMenu();
  });
  
  // ============================================
  // MOBILE ACCORDION (Products)
  // ============================================
  const accordions = document.querySelectorAll('.mobile-accordion');
  
  accordions.forEach(function(accordion) {
    const trigger = accordion.querySelector('.mobile-accordion-trigger');
    
    if (trigger) {
      trigger.addEventListener('click', function() {
        accordion.classList.toggle('open');
      });
    }
  });
  
  // ============================================
  // HERO SLIDER
  // ============================================
  const heroSlider = document.getElementById('heroSlider');
  
  if (heroSlider) {
    const slides = heroSlider.querySelectorAll('.slide');
    const dots = heroSlider.querySelectorAll('.slider-dot');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    
    let currentSlide = 0;
    let isAnimating = false;
    // autoPlayInterval removed - using requestAnimationFrame instead
    
    function goToSlide(index) {
      if (isAnimating) return;
      isAnimating = true;
      
      // Remove active class from all slides and dots
      slides.forEach(function(slide) {
        slide.classList.remove('active');
      });
      dots.forEach(function(dot) {
        dot.classList.remove('active');
      });
      
      // Add active class to current slide and dot
      currentSlide = index;
      slides[currentSlide].classList.add('active');
      dots[currentSlide].classList.add('active');
      
      // Reset animation lock after transition
      setTimeout(function() {
        isAnimating = false;
      }, 1000);
    }
    
    function nextSlide() {
      const next = (currentSlide + 1) % slides.length;
      goToSlide(next);
    }
    
    function prevSlide() {
      const prev = (currentSlide - 1 + slides.length) % slides.length;
      goToSlide(prev);
    }
    
    // Arrow button events
    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        nextSlide();
        resetAutoPlay();
      });
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        prevSlide();
        resetAutoPlay();
      });
    }
    
    // Dot click events
    dots.forEach(function(dot, index) {
      dot.addEventListener('click', function() {
        goToSlide(index);
        resetAutoPlay();
      });
    });
    
    // Auto-play (Optimized with requestAnimationFrame)
    let autoPlayAnimationId = null;
    let lastAutoPlayTime = performance.now();
    const autoPlayInterval = 6000;
    
    function autoPlayLoop(currentTime) {
      if (currentTime - lastAutoPlayTime >= autoPlayInterval) {
        nextSlide();
        lastAutoPlayTime = currentTime;
      }
      autoPlayAnimationId = requestAnimationFrame(autoPlayLoop);
    }
    
    function startAutoPlay() {
      if (!autoPlayAnimationId) {
        lastAutoPlayTime = performance.now();
        autoPlayAnimationId = requestAnimationFrame(autoPlayLoop);
      }
    }
    
    function stopAutoPlay() {
      if (autoPlayAnimationId) {
        cancelAnimationFrame(autoPlayAnimationId);
        autoPlayAnimationId = null;
      }
    }
    
    function resetAutoPlay() {
      stopAutoPlay();
      startAutoPlay();
    }
    
    startAutoPlay();
  }
  
  // ============================================
  // MOBILE FILTER DRAWER (Catalog Page)
  // ============================================
  const mobileFilterBtn = document.getElementById('mobileFilterBtn');
  const mobileFilterDrawer = document.getElementById('mobileFilterDrawer');
  const mobileFilterClose = document.getElementById('mobileFilterClose');
  const mobileFilterBackdrop = document.querySelector('.mobile-filter-backdrop');
  
  if (mobileFilterBtn && mobileFilterDrawer) {
    mobileFilterBtn.addEventListener('click', function() {
      mobileFilterDrawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    function closeFilterDrawer() {
      mobileFilterDrawer.classList.remove('active');
      document.body.style.overflow = '';
    }
    
    if (mobileFilterClose) {
      mobileFilterClose.addEventListener('click', closeFilterDrawer);
    }
    
    if (mobileFilterBackdrop) {
      mobileFilterBackdrop.addEventListener('click', closeFilterDrawer);
    }
  }
  
  // ============================================
  // CATEGORY FILTER (Catalog Page)
  // ============================================
  const categoryBtns = document.querySelectorAll('.category-btn');
  const categorySections = document.querySelectorAll('.category-section-wrapper');
  
  if (categoryBtns.length > 0) {
    categoryBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        const category = this.dataset.category;
        
        // Update active button
        categoryBtns.forEach(function(b) {
          b.classList.remove('active');
        });
        this.classList.add('active');
        
        // Update URL without reload
        if (category === 'all') {
          history.pushState({}, '', 'catalog.html');
        } else {
          history.pushState({}, '', 'catalog.html?category=' + category);
        }
        
        // Show/hide sections
        if (category === 'all') {
          categorySections.forEach(function(section) {
            section.style.display = 'block';
          });
        } else {
          categorySections.forEach(function(section) {
            if (section.dataset.category === category) {
              section.style.display = 'block';
            } else {
              section.style.display = 'none';
            }
          });
        }
        
        // Close mobile filter if open
        if (mobileFilterDrawer) {
          mobileFilterDrawer.classList.remove('active');
          document.body.style.overflow = '';
        }
        
        // Scroll to top of catalog
        window.scrollTo({ top: 200, behavior: 'smooth' });
      });
    });
    
    // Check URL params on load
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    if (categoryParam) {
      const targetBtn = document.querySelector('.category-btn[data-category="' + categoryParam + '"]');
      if (targetBtn) {
        targetBtn.click();
      }
    }
  }
  
  // ============================================
  // SEARCH FILTER (Catalog Page)
  // ============================================
  const searchInput = document.getElementById('catalogSearch');
  const productCards = document.querySelectorAll('.product-card');
  
  if (searchInput && productCards.length > 0) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase().trim();
      
      productCards.forEach(function(card) {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('.product-description').textContent.toLowerCase();
        const category = card.querySelector('.product-category-badge').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm)) {
          card.closest('.product-card').style.display = 'block';
        } else {
          card.closest('.product-card').style.display = 'none';
        }
      });
    });
  }
  
  // Contact page uses inline submitContactForm + EmailSubmitter (js/email-submitter.js) — do not attach a second handler here.

  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
  
  // ============================================
  // INTERSECTION OBSERVER FOR ANIMATIONS
  // ============================================
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe elements with data-animate attribute
  document.querySelectorAll('[data-animate]').forEach(function(el) {
    el.style.opacity = '0';
    observer.observe(el);
  });

});

