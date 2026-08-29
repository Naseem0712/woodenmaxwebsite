/*!
 * js/site-nav.js — single source of truth for the WoodenMax top navigation.
 *
 * Desktop: logo + category carousel + utility links + CTA.
 * Mobile:  logo + burger → right-side drawer with hub accordions + all product pages.
 *
 * Requires js/nav-tree.js (window.WM_NAV_TREE) loaded before this script.
 */
(function () {
  'use strict';

  // Prevent CSS smooth-scroll from animating refresh restoration before nav mounts.
  try { document.documentElement.style.setProperty('scroll-behavior', 'auto'); } catch (eScroll0) { /* ignore */ }

  var BRAND_LOGO   = '/images/woodenmax-logo.webp';
  var BRAND_NAME   = 'WoodenMax';
  var BRAND_PHONE  = '+91 78953 28080';
  var BRAND_HREF_CONTACT = '/contact';
  var BRAND_HREF_HOME    = '/';

  var CATEGORIES = [
    { slug: 'aluminium-windows',  label: 'Aluminium',  href: '/products/aluminium-windows' },
    { slug: 'telescope-windows',  label: 'Telescope',  href: '/products/telescope-windows' },
    { slug: 'folding-systems',    label: 'Folding',    href: '/products/folding-systems'   },
    { slug: 'pergola',            label: 'Pergola',    href: '/products/pergola' },
    { slug: 'metal-louvers',      label: 'Louvers',    href: '/products/metal-louvers'     },
    { slug: 'mirror-profiles',    label: 'Mirrors',    href: '/products/mirror-profiles'   },
    { slug: 'shower-partitions',  label: 'Shower',     href: '/products/shower-partitions' },
    { slug: 'elevation-cladding', label: 'Elevation',  href: '/products/elevation-cladding'},
    { slug: 'glass-elevation',    label: 'Glass',      href: '/products/glass-elevation'   },
    { slug: 'glass-railing',      label: 'Railing',    href: '/products/glass-railing'     },
    { slug: 'grills',             label: 'Grills',     href: '/products/grills'            }
  ];

  var UTILITY = [
    { label: 'System Windows', href: 'https://systemwindows.woodenmax.in/', cls: 'nav-link-secondary' },
    { label: 'Calculators', href: '/calculators',                 cls: 'nav-link-secondary' },
    { label: 'Blog',        href: '/blog',                        cls: 'nav-link-secondary' },
    { label: 'About',       href: '/about',                       cls: 'nav-link-secondary' },
    { label: 'Partner Program', href: '/partner',                cls: 'nav-link-secondary' }
  ];

  var NAV_TREE = window.WM_NAV_TREE || null;

  /**
   * Navigation emits root-absolute URLs only. There is deliberately no
   * path-depth prefix calculation here: the old ../ logic produced a different
   * target depending on which URL the page happened to be served at, which is
   * how duplicate crawl paths were being generated. This only guarantees a
   * leading slash for internal links.
   */
  function url (href) {
    if (!href) return '#';
    if (/^(?:[a-z]+:|\/\/|tel:|mailto:|#|\/)/i.test(href)) return href;
    return '/' + href.replace(/^\.\/+/, '');
  }

  function normPath (p) {
    return String(p || '')
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/\.html$/i, '')
      .replace(/\/+$/, '')
      .toLowerCase();
  }

  function currentPagePath () {
    return normPath(window.location.pathname);
  }

  function isActiveHref (href) {
    var target = normPath(href);
    var cur = currentPagePath();
    if (!target) return false;
    if (cur === target) return true;
    if (cur.indexOf(target + '/') === 0) return false;
    return false;
  }

  function detectActiveSlug () {
    var path = window.location.pathname.toLowerCase();
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (path.indexOf('/' + CATEGORIES[i].slug) !== -1) return CATEGORIES[i].slug;
    }
    return null;
  }

  function hubHasActiveChild (hub) {
    if (!hub || !hub.children) return false;
    for (var i = 0; i < hub.children.length; i++) {
      if (isActiveHref(hub.children[i].href)) return true;
    }
    return false;
  }

  function listHasActiveChild (items) {
    if (!items) return false;
    for (var i = 0; i < items.length; i++) {
      if (isActiveHref(items[i].href)) return true;
    }
    return false;
  }

  function isCitySectionActive () {
    var cur = currentPagePath();
    if (cur.indexOf('city/') === 0) return true;
    if (/aluminium-window-price-(bangalore|delhi|mumbai|pune|hyderabad|jaipur|chandigarh|vijayawada|visakhapatnam|warangal)$/.test(cur)) return true;
    if (/glass-elevation-price-(bangalore|delhi|mumbai|pune|hyderabad|jaipur|chandigarh|vijayawada|visakhapatnam|warangal)$/.test(cur)) return true;
    if (/louver-price-(delhi|hyderabad|jaipur)$/.test(cur)) return true;
    if (/led-mirror-profile-(delhi|hyderabad)$/.test(cur)) return true;
    return false;
  }

  function isBlogSectionActive () {
    var cur = currentPagePath();
    return cur === 'blog' || cur.indexOf('blog/') === 0;
  }

  function buildDrawerAccordion (opts) {
    var expanded = opts.expanded;
    var panelId = opts.panelId;
    var children = (opts.children || []).map(function (child) {
      var activeCls = isActiveHref(child.href) ? ' is-active' : '';
      return '<a class="wm-drawer-link' + activeCls + '" href="' + url(child.href) + '">' + child.label + '</a>';
    }).join('');

    return (
      '<div class="wm-drawer-hub' + (expanded ? ' is-open' : '') + '" data-slug="' + opts.slug + '">' +
        '<button type="button" class="wm-drawer-hub-toggle" aria-expanded="' + (expanded ? 'true' : 'false') + '" aria-controls="' + panelId + '">' +
          '<span class="wm-drawer-hub-label">' + opts.label + '</span>' +
          '<svg class="wm-drawer-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' +
        '</button>' +
        '<div class="wm-drawer-hub-panel" id="' + panelId + '"' + (expanded ? '' : ' hidden') + '>' + children + '</div>' +
      '</div>'
    );
  }

  function buildMobileDrawerHtml (activeSlug) {
    var hubs = (NAV_TREE && NAV_TREE.hubs) ? NAV_TREE.hubs : CATEGORIES.map(function (c) {
      return { slug: c.slug, label: c.label, href: c.href, children: [{ label: c.label, href: c.href }] };
    });
    var cityLinks = (NAV_TREE && NAV_TREE.cities) ? NAV_TREE.cities : [];
    var blogLinks = (NAV_TREE && NAV_TREE.blog) ? NAV_TREE.blog : [{ label: 'All blog posts', href: '/blog' }];
    var siteLinks = (NAV_TREE && NAV_TREE.site) ? NAV_TREE.site : UTILITY.concat([
      { label: 'Warranty', href: '/policies/warranty-policy' },
      { label: 'GST & Transport', href: '/policies/gst-transport-policy' }
    ]);

    var hubHtml = hubs.map(function (hub) {
      return buildDrawerAccordion({
        slug: hub.slug,
        label: hub.label,
        panelId: 'wmHubPanel-' + hub.slug,
        expanded: hub.slug === activeSlug || hubHasActiveChild(hub),
        children: hub.children || []
      });
    }).join('');

    var citiesHtml = cityLinks.length ? buildDrawerAccordion({
      slug: 'cities',
      label: 'Cities & local rates',
      panelId: 'wmHubPanel-cities',
      expanded: isCitySectionActive(),
      children: cityLinks
    }) : '';

    var blogHtml = buildDrawerAccordion({
      slug: 'blog',
      label: 'Blog & guides',
      panelId: 'wmHubPanel-blog',
      expanded: isBlogSectionActive(),
      children: blogLinks
    });

    var siteHtml = siteLinks.map(function (link) {
      var activeCls = isActiveHref(link.href) ? ' is-active' : '';
      return '<a class="wm-drawer-link wm-drawer-link--site' + activeCls + '" href="' + url(link.href) + '">' + link.label + '</a>';
    }).join('');

    return (
      '<div class="wm-drawer-backdrop" id="wmDrawerBackdrop" hidden aria-hidden="true"></div>' +
      '<aside class="wm-drawer" id="wmMobileDrawer" hidden aria-hidden="true" aria-label="Site menu">' +
        '<div class="wm-drawer-head">' +
          '<div class="wm-drawer-head-text">' +
            '<span class="wm-drawer-kicker">WoodenMax</span>' +
            '<span class="wm-drawer-title">Browse products</span>' +
          '</div>' +
          '<button type="button" class="wm-drawer-close" id="wmDrawerClose" aria-label="Close menu">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="wm-drawer-scroll">' +
          '<div class="wm-drawer-section">' +
            '<div class="wm-drawer-heading">Product categories</div>' +
            '<div class="wm-drawer-accordions">' + hubHtml + '</div>' +
          '</div>' +
          '<div class="wm-drawer-section">' +
            '<div class="wm-drawer-heading">Cities &amp; blog</div>' +
            '<div class="wm-drawer-accordions">' + citiesHtml + blogHtml + '</div>' +
          '</div>' +
          '<div class="wm-drawer-section">' +
            '<div class="wm-drawer-heading">Site pages</div>' +
            siteHtml +
          '</div>' +
          '<a class="wm-drawer-cta" href="' + url(BRAND_HREF_CONTACT) + '?intent=site-visit&amp;source=nav-mobile">Get free quote</a>' +
          '<a class="wm-drawer-call" href="tel:+917895328080">' + BRAND_PHONE + '</a>' +
        '</div>' +
      '</aside>'
    );
  }

  function buildHtml () {
    var activeSlug = detectActiveSlug();

    var catItems = CATEGORIES.map(function (c) {
      var activeCls = (c.slug === activeSlug) ? ' active' : '';
      return '<a href="' + url(c.href) + '" class="cat-item' + activeCls + '" data-slug="' + c.slug + '">' + c.label + '</a>';
    }).join('');

    var utilHtml = UTILITY.map(function (u) {
      return '<a href="' + url(u.href) + '" class="' + (u.cls || 'nav-link') + '">' + u.label + '</a>';
    }).join('');

    return (
      '<nav class="wm-navbar" id="wmNavbar" role="navigation" aria-label="Main navigation">' +
        '<div class="wm-navbar-inner container">' +
          '<a class="wm-logo" href="' + BRAND_HREF_HOME + '" aria-label="' + BRAND_NAME + ' — home">' +
            '<img src="' + url(BRAND_LOGO) + '" alt="' + BRAND_NAME + ' logo" width="36" height="36" loading="eager" decoding="async">' +
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

          '<a class="wm-cta" href="' + url(BRAND_HREF_CONTACT) + '?intent=site-visit&amp;source=nav">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' +
            ' Get free quote' +
          '</a>' +

          '<button type="button" class="wm-burger" id="wmBurger" aria-label="Open menu" aria-expanded="false" aria-controls="wmMobileDrawer">' +
            '<svg id="wmBurgerOpen"  width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>' +
            '<svg id="wmBurgerClose" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
          '</button>' +
        '</div>' +
      '</nav>' +
      buildMobileDrawerHtml(activeSlug)
    );
  }

  function purgeLegacyNav () {
    var legacy = document.querySelectorAll(
      'nav.navbar, header.site-header, .wm-navbar, .wm-drawer, .wm-drawer-backdrop, ' +
      '#mobileMenu, .mobile-menu, #mobileToggle, .mobile-toggle, .mobile-menu-overlay'
    );
    legacy.forEach(function (n) { n.parentNode && n.parentNode.removeChild(n); });
  }

  function focusDrawerTrigger (burger, drawer) {
    if (!burger || typeof burger.focus !== 'function') return;
    var active = document.activeElement;
    if (drawer && active && drawer.contains(active) && typeof active.blur === 'function') {
      try { active.blur(); } catch (eBlur) { /* ignore */ }
    }
    try { burger.focus({ preventScroll: true }); }
    catch (eFocus) {
      try { burger.focus(); } catch (eFocus2) { /* ignore */ }
    }
  }

  function setDrawerOpen (open, root) {
    var drawer = root.querySelector('#wmMobileDrawer');
    var backdrop = root.querySelector('#wmDrawerBackdrop');
    var burger = root.querySelector('#wmBurger');
    var openIcon = root.querySelector('#wmBurgerOpen');
    var closeIcon = root.querySelector('#wmBurgerClose');
    if (!drawer || !backdrop || !burger) return;

    if (open) {
      drawer.removeAttribute('hidden');
      drawer.setAttribute('aria-hidden', 'false');
      backdrop.removeAttribute('hidden');
      backdrop.setAttribute('aria-hidden', 'false');
      burger.setAttribute('aria-expanded', 'true');
      openIcon.style.display = 'none';
      closeIcon.style.display = '';
      document.body.classList.add('wm-nav-open');
      requestAnimationFrame(function () {
        drawer.classList.add('is-visible');
        backdrop.classList.add('is-visible');
      });
    } else {
      drawer.classList.remove('is-visible');
      backdrop.classList.remove('is-visible');
      burger.setAttribute('aria-expanded', 'false');
      openIcon.style.display = '';
      closeIcon.style.display = 'none';
      document.body.classList.remove('wm-nav-open');
      window.setTimeout(function () {
        // Focus burger immediately before aria-hidden/hidden so click focus has settled.
        focusDrawerTrigger(burger, drawer);
        if (!drawer.classList.contains('is-visible')) {
          drawer.setAttribute('hidden', '');
          drawer.setAttribute('aria-hidden', 'true');
          backdrop.setAttribute('hidden', '');
          backdrop.setAttribute('aria-hidden', 'true');
        }
      }, 280);
    }
  }

  function wireInteractivity (root) {
    var cats   = root.querySelector('#wmCats');
    var prev   = root.querySelector('#wmCatPrev');
    var next   = root.querySelector('#wmCatNext');
    var burger = root.querySelector('#wmBurger');
    var drawer = root.querySelector('#wmMobileDrawer');
    var backdrop = root.querySelector('#wmDrawerBackdrop');
    var closeBtn = root.querySelector('#wmDrawerClose');

    if (cats && prev && next) {
      function step (dir) {
        cats.scrollBy({ left: dir * cats.clientWidth * 0.66, behavior: 'smooth' });
      }
      prev.addEventListener('click', function () { step(-1); });
      next.addEventListener('click', function () { step(1);  });
      function updateArrowVisibility () {
        prev.disabled = cats.scrollLeft <= 4;
        next.disabled = cats.scrollLeft + cats.clientWidth >= cats.scrollWidth - 4;
      }
      cats.addEventListener('scroll', updateArrowVisibility, { passive: true });
      window.addEventListener('resize', updateArrowVisibility);
      updateArrowVisibility();
      var activeItem = cats.querySelector('.cat-item.active');
      if (activeItem) {
        cats.scrollLeft = Math.max(0, activeItem.offsetLeft - (cats.clientWidth / 2) + (activeItem.clientWidth / 2));
        setTimeout(updateArrowVisibility, 50);
      }
    }

    function closeDrawer () { setDrawerOpen(false, root); }
    function openDrawer () { setDrawerOpen(true, root); }

    if (burger && drawer) {
      burger.addEventListener('click', function () {
        if (drawer.hasAttribute('hidden') || !drawer.classList.contains('is-visible')) openDrawer();
        else closeDrawer();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });
      closeBtn.addEventListener('click', closeDrawer);
    }
    if (backdrop) {
      backdrop.addEventListener('mousedown', function (e) { e.preventDefault(); });
      backdrop.addEventListener('click', closeDrawer);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('wm-nav-open')) closeDrawer();
    });

    if (drawer) {
      drawer.querySelectorAll('.wm-drawer-hub-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var hub = btn.closest('.wm-drawer-hub');
          var panel = hub && hub.querySelector('.wm-drawer-hub-panel');
          if (!hub || !panel) return;
          var open = hub.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
          if (open) panel.removeAttribute('hidden');
          else panel.setAttribute('hidden', '');
        });
      });

      drawer.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', closeDrawer);
      });
    }
  }

  function init () {
    if (document.getElementById('wmNavbar')) return;

    var run = function () {
      purgeLegacyNav();

      var skel = document.getElementById('wmNavSkel');
      if (skel && skel.parentNode) skel.parentNode.removeChild(skel);

      var holder = document.createElement('div');
      holder.innerHTML = buildHtml();
      while (holder.firstChild) {
        if (document.body.firstChild) document.body.insertBefore(holder.firstChild, document.body.firstChild);
        else document.body.appendChild(holder.firstChild);
      }

      // scroll-padding-top lives in css/site-nav.css so hash jumps don't reflow after JS sets it.
      document.body.classList.add('has-wm-navbar');

      wireInteractivity(document.body);
    };

    if (window.WMScrollStable && typeof window.WMScrollStable.around === 'function') {
      window.WMScrollStable.around(run);
    } else {
      var y = window.scrollY || window.pageYOffset || 0;
      run();
      try { window.scrollTo({ top: y, left: 0, behavior: 'auto' }); } catch (eY) { window.scrollTo(0, y); }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
