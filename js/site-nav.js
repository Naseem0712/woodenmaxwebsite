/*!
 * js/site-nav.js — single source of truth for the WoodenMax top navigation.
 *
 * What it does (on every page, on DOMContentLoaded):
 *  1. Removes any existing <nav class="navbar">… and any old <header> the page hard-coded.
 *  2. Rebuilds the canonical navbar (logo + categories + utility links + CTA + mobile menu).
 *  3. Wires the category carousel (left / right arrows + smooth scroll + active highlight).
 *  4. Wires the mobile hamburger (slide-down menu).
 *  5. Computes the correct relative prefix from the current pathname so the nav works at
 *     any folder depth (root, /products/grills/, /about/, /policies/, /products/glass-elevation/…).
 *  6. Sets the "active" highlight on whatever silo the current page lives in.
 *
 * Result: 130 pages × 16 navbar variants → 130 pages × 1 navbar.
 */
(function () {
  'use strict';

  // ----------------------------------------------------------------------
  //  1. Canonical menu structure (single source of truth)
  // ----------------------------------------------------------------------
  var BRAND_LOGO   = 'images/woodenmax-logo.webp';
  var BRAND_NAME   = 'WoodenMax';
  var BRAND_PHONE  = '+91 78953 28080';
  var BRAND_HREF_CONTACT = 'contact.html';

  // Each category links to its hub. Cluster href uses .html so it works on plain
  // hosting and on local file:// without any rewrite.
  var CATEGORIES = [
    { slug: 'aluminium-windows',  label: 'Aluminium',  href: 'products/aluminium-windows.html' },
    { slug: 'telescope-windows',  label: 'Telescope',  href: 'products/telescope-windows.html' },
    { slug: 'folding-systems',    label: 'Folding',    href: 'products/folding-systems.html'   },
    { slug: 'pergola',            label: 'Pergola',    href: 'products/pergola/aluminium-pergola.html' },
    { slug: 'metal-louvers',      label: 'Louvers',    href: 'products/metal-louvers.html'     },
    { slug: 'mirror-profiles',    label: 'Mirrors',    href: 'products/mirror-profiles/'       },
    { slug: 'shower-partitions',  label: 'Shower',     href: 'products/shower-partitions.html' },
    { slug: 'elevation-cladding', label: 'Elevation',  href: 'products/elevation-cladding.html'},
    { slug: 'glass-elevation',    label: 'Glass',      href: 'products/glass-elevation.html'   },
    { slug: 'glass-railing',      label: 'Railing',    href: 'products/glass-railing.html'     },
    { slug: 'grills',             label: 'Grills',     href: 'products/grills.html'            }
  ];

  // Right-side utility links — same on every page.
  var UTILITY = [
    { label: 'Calculators', href: 'calculators.html',                  cls: 'nav-link-secondary' },
    { label: 'Blog',        href: 'blog.html',                         cls: 'nav-link-secondary' },
    { label: 'About',       href: 'about.html',                        cls: 'nav-link-secondary' },
    { label: 'Case studies',href: 'about/case-study-makobrew-jubilee-hills.html', cls: 'nav-link-secondary' }
  ];

  // ----------------------------------------------------------------------
  //  2. Path utility — compute the right "../" prefix for current page
  // ----------------------------------------------------------------------
  function computePrefix () {
    // On http(s) we have a real path. On file:// we still have a path.
    var pathname = window.location.pathname.replace(/\\/g, '/');
    // Strip leading slash
    var parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    // Last segment is the file if it has an extension; otherwise it's a dir.
    var last = parts[parts.length - 1] || '';
    var depth = (last && last.indexOf('.') !== -1) ? parts.length - 1 : parts.length;
    if (depth < 0) depth = 0;
    return depth === 0 ? '' : new Array(depth + 1).join('../');
  }

  function abs (href) {
    if (!href) return '#';
    if (/^(?:[a-z]+:|\/\/|tel:|mailto:|#)/i.test(href)) return href;
    return PREFIX + href;
  }

  var PREFIX = computePrefix();

  // ----------------------------------------------------------------------
  //  3. Determine the "active" category from the current URL
  // ----------------------------------------------------------------------
  function detectActiveSlug () {
    var path = window.location.pathname.toLowerCase();
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (path.indexOf('/' + CATEGORIES[i].slug) !== -1) return CATEGORIES[i].slug;
    }
    return null;
  }

  // ----------------------------------------------------------------------
  //  4. Build the navbar HTML
  // ----------------------------------------------------------------------
  function buildHtml () {
    var activeSlug = detectActiveSlug();

    var catItems = CATEGORIES.map(function (c) {
      var activeCls = (c.slug === activeSlug) ? ' active' : '';
      return '<a href="' + abs(c.href) + '" class="cat-item' + activeCls + '" data-slug="' + c.slug + '">' + c.label + '</a>';
    }).join('');

    var utilHtml = UTILITY.map(function (u) {
      return '<a href="' + abs(u.href) + '" class="' + (u.cls || 'nav-link') + '">' + u.label + '</a>';
    }).join('');

    return (
      '<nav class="wm-navbar" id="wmNavbar" role="navigation" aria-label="Main navigation">' +
        '<div class="wm-navbar-inner container">' +
          '<a class="wm-logo" href="' + abs('index.html') + '" aria-label="' + BRAND_NAME + ' — home">' +
            '<img src="' + abs(BRAND_LOGO) + '" alt="' + BRAND_NAME + ' logo" width="36" height="36" loading="eager" decoding="async">' +
            '<span class="wm-logo-text">' + BRAND_NAME + '</span>' +
          '</a>' +

          '<div class="wm-cats-wrap" aria-label="Product categories">' +
            '<button type="button" class="wm-cat-arrow wm-cat-prev" id="wmCatPrev" aria-label="Previous categories">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>' +
            '</button>' +
            '<div class="wm-cats" id="wmCats">' + catItems + '</div>' +
            '<button type="button" class="wm-cat-arrow wm-cat-next" id="wmCatNext" aria-label="Next categories">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' +
            '</button>' +
          '</div>' +

          '<div class="wm-utility">' + utilHtml + '</div>' +

          '<a class="wm-cta" href="' + abs(BRAND_HREF_CONTACT) + '?intent=site-visit&amp;source=nav">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' +
            ' Get free quote' +
          '</a>' +

          '<button type="button" class="wm-burger" id="wmBurger" aria-label="Open menu" aria-expanded="false">' +
            '<svg id="wmBurgerOpen"  width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>' +
            '<svg id="wmBurgerClose" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
          '</button>' +
        '</div>' +

        '<div class="wm-mobile-menu" id="wmMobileMenu" hidden>' +
          '<div class="wm-mobile-section">' +
            '<div class="wm-mobile-heading">Products</div>' +
            CATEGORIES.map(function (c) {
              var activeCls = (c.slug === activeSlug) ? ' is-active' : '';
              return '<a class="wm-mobile-link' + activeCls + '" href="' + abs(c.href) + '">' + c.label + '</a>';
            }).join('') +
          '</div>' +
          '<div class="wm-mobile-section">' +
            '<div class="wm-mobile-heading">More</div>' +
            UTILITY.map(function (u) {
              return '<a class="wm-mobile-link" href="' + abs(u.href) + '">' + u.label + '</a>';
            }).join('') +
            '<a class="wm-mobile-link" href="' + abs('policies/warranty-policy.html') + '">Warranty</a>' +
            '<a class="wm-mobile-link" href="' + abs('policies/gst-transport-policy.html') + '">GST &amp; Transport</a>' +
          '</div>' +
          '<a class="wm-mobile-cta" href="' + abs(BRAND_HREF_CONTACT) + '?intent=site-visit&amp;source=nav-mobile">Get free quote &rarr;</a>' +
          '<a class="wm-mobile-call" href="tel:+917895328080">' + BRAND_PHONE + '</a>' +
        '</div>' +
      '</nav>'
    );
  }

  // ----------------------------------------------------------------------
  //  5. Remove any legacy navbar(s)
  // ----------------------------------------------------------------------
  function purgeLegacyNav () {
    // Remove the old `<nav class="navbar">` (any variant) and any hard-coded site header.
    var legacy = document.querySelectorAll(
      'nav.navbar, header.site-header, .wm-navbar, .floating-calc-button-old, .cluster-breadcrumb + nav.navbar'
    );
    legacy.forEach(function (n) { n.parentNode && n.parentNode.removeChild(n); });
  }

  // ----------------------------------------------------------------------
  //  6. Wire interactivity (carousel arrows + mobile menu)
  // ----------------------------------------------------------------------
  function wireInteractivity (root) {
    var cats   = root.querySelector('#wmCats');
    var prev   = root.querySelector('#wmCatPrev');
    var next   = root.querySelector('#wmCatNext');
    var burger = root.querySelector('#wmBurger');
    var menu   = root.querySelector('#wmMobileMenu');
    var openIcon  = root.querySelector('#wmBurgerOpen');
    var closeIcon = root.querySelector('#wmBurgerClose');

    if (cats && prev && next) {
      function step (dir) {
        var w = cats.clientWidth * 0.66;
        cats.scrollBy({ left: dir * w, behavior: 'smooth' });
      }
      prev.addEventListener('click', function () { step(-1); });
      next.addEventListener('click', function () { step(1);  });
      function updateArrowVisibility () {
        var atStart = cats.scrollLeft <= 4;
        var atEnd   = cats.scrollLeft + cats.clientWidth >= cats.scrollWidth - 4;
        prev.disabled = atStart;
        next.disabled = atEnd;
      }
      cats.addEventListener('scroll', updateArrowVisibility, { passive: true });
      window.addEventListener('resize', updateArrowVisibility);
      updateArrowVisibility();

      // Scroll active item into view on load
      var activeItem = cats.querySelector('.cat-item.active');
      if (activeItem) {
        var offset = activeItem.offsetLeft - (cats.clientWidth / 2) + (activeItem.clientWidth / 2);
        cats.scrollLeft = Math.max(0, offset);
        setTimeout(updateArrowVisibility, 50);
      }
    }

    if (burger && menu) {
      burger.addEventListener('click', function () {
        var open = !menu.hasAttribute('hidden');
        if (open) {
          menu.setAttribute('hidden', '');
          burger.setAttribute('aria-expanded', 'false');
          openIcon.style.display = '';
          closeIcon.style.display = 'none';
          document.body.classList.remove('wm-nav-open');
        } else {
          menu.removeAttribute('hidden');
          burger.setAttribute('aria-expanded', 'true');
          openIcon.style.display = 'none';
          closeIcon.style.display = '';
          document.body.classList.add('wm-nav-open');
        }
      });
      menu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          menu.setAttribute('hidden', '');
          burger.setAttribute('aria-expanded', 'false');
          openIcon.style.display = '';
          closeIcon.style.display = 'none';
          document.body.classList.remove('wm-nav-open');
        });
      });
    }
  }

  // ----------------------------------------------------------------------
  //  7. Boot
  // ----------------------------------------------------------------------
  function init () {
    if (document.getElementById('wmNavbar')) return; // safety
    purgeLegacyNav();

    var holder = document.createElement('div');
    holder.innerHTML = buildHtml();
    var nav = holder.firstChild;

    // Insert at the very top of <body>
    if (document.body.firstChild) {
      document.body.insertBefore(nav, document.body.firstChild);
    } else {
      document.body.appendChild(nav);
    }

    // Reserve scroll padding so anchor jumps don't hide under the sticky nav
    document.documentElement.style.scrollPaddingTop = '76px';
    document.body.classList.add('has-wm-navbar');

    wireInteractivity(nav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
