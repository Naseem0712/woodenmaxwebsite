/*!
 * js/site-footer.js — single source of truth for the WoodenMax footer.
 *
 * What it does (on every page, on DOMContentLoaded):
 *  1. Removes any existing <footer> (45 different variants are in the wild).
 *  2. Rebuilds the canonical 5-column footer (Brand · Products · Resources · Policies · Contact).
 *  3. Adds a "cities we serve" strip + final bottom bar (©, social, compliance).
 *  4. Computes the right "../" prefix from the current pathname so internal
 *     links work at every folder depth.
 *  5. Wires the newsletter form (writes to localStorage; production should POST to API).
 *
 * Result: 130 pages × 45 footer variants → 130 pages × 1 footer.
 */
(function () {
  'use strict';

  /** Bump after deploy so CDN/browser fetch new cart + payment JS (see _headers). */
  var WM_ASSET_V = '20260531';

  // ----------------------------------------------------------------------
  //  1. Canonical content (single source of truth)
  // ----------------------------------------------------------------------
  var BRAND = {
    name:    'WoodenMax',
    legal:   'WoodenMax Architectural Elements',
    logo:    'images/woodenmax-logo.webp',
    tagline: 'Premium architectural aluminium — manufactured in our own 28,000 sq ft Hyderabad facility. Site visits, transparent pricing, 10-year warranty.',
    phone:       '+91 78953 28080',
    phoneDigits: '917895328080',
    email:       'info@woodenmax.com',
    emailSupport:'info@woodenmax.com',
    addr1: '5-6-411/413, Aaghapura',
    addr2: 'Nampally, Hyderabad',
    addr3: 'Telangana 500001, India',
    hours: 'Mon–Sat · 9:00 AM – 7:00 PM IST',
    gstin: '36ARWPA9740L1Z3',
    foundYear: 2014
  };

  var SOCIAL = [
    { name: 'Instagram', url: 'https://www.instagram.com/woodenmax/', icon:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>' },
    { name: 'YouTube', url: 'https://www.youtube.com/@woodenmax', icon:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>' },
    { name: 'Facebook', url: 'https://www.facebook.com/woodenmax', icon:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/company/woodenmax/', icon:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>' },
    { name: 'Pinterest', url: 'https://in.pinterest.com/woodenmax/', icon:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12a4 4 0 1 1 4 4"/><path d="M12 16v6"/></svg>' },
    { name: 'WhatsApp', url: 'https://wa.me/917895328080', icon:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-6.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' }
  ];

  // 5-column structure — exact order locked here.
  var COLUMNS = [
    {
      // Column 1 is rendered separately (brand block).  This entry is unused but kept for parity.
      type: 'brand'
    },
    {
      heading: 'Products',
      links: [
        { label: 'Aluminium Windows',  href: 'products/aluminium-windows'   },
        { label: 'Telescope Windows',  href: 'products/telescope-windows'   },
        { label: 'Folding Systems',    href: 'products/folding-systems'     },
        { label: 'Pergola',            href: 'products/pergola/aluminium-pergola' },
        { label: 'Metal Louvers',      href: 'products/metal-louvers'       },
        { label: 'Mirror Profiles',    href: 'products/mirror-profiles/'         },
        { label: 'Shower Partitions',  href: 'products/shower-partitions'   },
        { label: 'Elevation Cladding', href: 'products/elevation-cladding'  },
        { label: 'Glass Elevation',    href: 'products/glass-elevation'     },
        { label: 'Glass Railing',      href: 'products/glass-railing'       },
        { label: 'Grills',             href: 'products/grills'              }
      ]
    },
    {
      heading: 'Resources',
      links: [
        { label: 'About WoodenMax',         href: 'about'                                 },
        { label: 'Factory Tour',            href: 'about/factory-tour-hyderabad'          },
        { label: 'Manufacturing Process',   href: 'about/manufacturing-process'           },
        { label: 'Quality &amp; Testing',   href: 'about/quality-testing-process'         },
        { label: 'Certifications',          href: 'about/certifications-iso-qualicoat'    },
        { label: 'Case Study — Makobrew',   href: 'about/case-study-makobrew-jubilee-hills' },
        { label: 'Case Study — Hyderabad',  href: 'about/case-study-villa-hyderabad'      },
        { label: 'Case Study — Delhi',      href: 'about/case-study-luxury-bungalow-delhi' },
        { label: 'Case Study — Mumbai',     href: 'about/case-study-commercial-tower-mumbai' },
        { label: 'Material sourcing',       href: 'about/material-sourcing-india'       },
        { label: 'Team &amp; leadership',   href: 'about/team-leadership'                 },
        { label: 'Calculators',             href: 'calculators'                           },
        { label: 'Blog',                    href: 'blog'                                  },
        { label: 'Catalog',                 href: 'catalog'                               }
      ]
    },
    {
      heading: 'Policies',
      links: [
        { label: 'Warranty Policy',                   href: 'policies/warranty-policy'              },
        { label: 'Installation Policy',               href: 'policies/installation-policy'          },
        { label: 'GST &amp; Transport',               href: 'policies/gst-transport-policy'         },
        { label: 'Cancellation &amp; Refund',         href: 'policies/cancellation-refund-policy'   },
        { label: 'Privacy Policy',                    href: 'policies/privacy-policy'               },
        { label: 'Return Policy',                     href: 'return-policy'                         }
      ]
    },
    {
      heading: 'Contact',
      type: 'contact' // rendered specially
    }
  ];

  var CITIES = [
    { label: 'Hyderabad',     href: 'city/hyderabad'  },
    { label: 'Bengaluru',     href: 'city/bangalore'  },
    { label: 'Mumbai',        href: 'city/mumbai'     },
    { label: 'Delhi NCR',     href: 'city/delhi'      },
    { label: 'Pune',          href: 'city/pune'       },
    { label: 'Jaipur',        href: 'city/jaipur'     },
    { label: 'Lucknow',       href: 'city/lucknow'    }
  ];

  // EEAT trust pills shown in the brand column.
  var TRUST = [
    'ISO 9001:2015',
    'Qualicoat Class 2',
    'BIS-grade alloy',
    '10-yr warranty'
  ];

  // ----------------------------------------------------------------------
  //  2. Path utility
  // ----------------------------------------------------------------------
  function computePrefix () {
    var pathname = window.location.pathname.replace(/\\/g, '/');
    var parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    var last = parts[parts.length - 1] || '';
    var depth = (last && last.indexOf('.') !== -1) ? parts.length - 1 : parts.length;
    if (depth < 0) depth = 0;
    return depth === 0 ? '' : new Array(depth + 1).join('../');
  }
  var PREFIX = computePrefix();

  function abs (href) {
    if (!href) return '#';
    if (/^(?:[a-z]+:|\/\/|tel:|mailto:|#)/i.test(href)) return href;
    return PREFIX + href;
  }

  // ----------------------------------------------------------------------
  //  3. Build the footer HTML
  // ----------------------------------------------------------------------
  function buildLinkColumn (col) {
    return (
      '<div class="wmf-col">' +
        '<h4 class="wmf-heading">' + col.heading + '</h4>' +
        '<ul class="wmf-list">' +
          col.links.map(function (l) {
            return '<li><a href="' + abs(l.href) + '">' + l.label + '</a></li>';
          }).join('') +
        '</ul>' +
      '</div>'
    );
  }

  function buildBrandColumn () {
    return (
      '<div class="wmf-col wmf-brand">' +
        '<a class="wmf-logo" href="' + abs('index') + '" aria-label="' + BRAND.name + ' home">' +
          '<img src="' + abs(BRAND.logo) + '" alt="' + BRAND.name + ' logo" width="44" height="44" loading="lazy" decoding="async">' +
          '<span class="wmf-logo-text">' + BRAND.name + '</span>' +
        '</a>' +
        '<p class="wmf-tagline">' + BRAND.tagline + '</p>' +
        '<div class="wmf-rating" aria-label="WoodenMax trust signals">' +
          '<span class="wmf-stars" aria-hidden="true">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
          '</span>' +
          '<span class="wmf-rating-text"><strong>10&ndash;12 live projects</strong> across India at any time &middot; family-led with trained partner crews</span>' +
        '</div>' +
        '<div class="wmf-trust">' +
          TRUST.map(function (t) { return '<span class="wmf-pill">' + t + '</span>'; }).join('') +
        '</div>' +
        '<form class="wmf-news" id="wmfNews" novalidate>' +
          '<label class="wmf-news-label" for="wmfNewsEmail">Get monthly design ideas + price drops</label>' +
          '<div class="wmf-news-row">' +
            '<input id="wmfNewsEmail" type="email" required placeholder="your@email.com" autocomplete="email">' +
            '<button type="submit" aria-label="Subscribe">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>' +
            '</button>' +
          '</div>' +
          '<small class="wmf-news-note" id="wmfNewsNote">No spam. Unsubscribe any time.</small>' +
        '</form>' +
      '</div>'
    );
  }

  function buildContactColumn () {
    return (
      '<div class="wmf-col wmf-contact-col">' +
        '<h4 class="wmf-heading">Contact</h4>' +
        '<ul class="wmf-list wmf-contact">' +
          '<li><a href="tel:+' + BRAND.phoneDigits + '" class="wmf-contact-item">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
            '<span>' + BRAND.phone + '</span></a></li>' +
          '<li><a href="mailto:' + BRAND.email + '" class="wmf-contact-item">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>' +
            '<span>' + BRAND.email + '</span></a></li>' +
          '<li class="wmf-contact-item wmf-contact-static">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' +
            '<span>' + BRAND.addr1 + '<br>' + BRAND.addr2 + '<br>' + BRAND.addr3 + '</span>' +
          '</li>' +
          '<li class="wmf-contact-item wmf-contact-static">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
            '<span>' + BRAND.hours + '</span>' +
          '</li>' +
        '</ul>' +
        '<a class="wmf-cta" href="' + abs('contact') + '?intent=site-visit&amp;source=footer">' +
          'Book site visit' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>' +
        '</a>' +
      '</div>'
    );
  }

  function buildCitiesStrip () {
    return (
      '<div class="wmf-cities">' +
        '<span class="wmf-cities-label">Cities we serve:</span>' +
        '<span class="wmf-cities-list">' +
          CITIES.map(function (c) {
            return '<a href="' + abs(c.href) + '">' + c.label + '</a>';
          }).join('<span aria-hidden="true">·</span>') +
        '<span aria-hidden="true">·</span> &amp; 7 more' +
        '</span>' +
      '</div>'
    );
  }

  function buildBottomBar () {
    var year = new Date().getFullYear();
    return (
      '<div class="wmf-bottom">' +
        '<div class="wmf-bottom-inner">' +
          '<div class="wmf-bottom-left">' +
            '<span>&copy; ' + BRAND.foundYear + '&ndash;' + year + ' ' + BRAND.legal + '. All rights reserved.</span>' +
            '<span class="wmf-mi">Made in India <span aria-hidden="true">&#127470;&#127475;</span></span>' +
          '</div>' +
          '<div class="wmf-bottom-meta">' +
            '<span>GSTIN: ' + BRAND.gstin + '</span>' +
          '</div>' +
          '<div class="wmf-social">' +
            SOCIAL.map(function (s) {
              return '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer" aria-label="' + s.name + '" title="' + s.name + '">' + s.icon + '</a>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function buildHtml () {
    var middleCols = COLUMNS
      .filter(function (c) { return c.heading; })
      .map(function (c) { return c.type === 'contact' ? buildContactColumn() : buildLinkColumn(c); })
      .join('');

    return (
      '<footer class="wm-footer" id="wmFooter" role="contentinfo">' +
        '<div class="wmf-top">' +
          '<div class="wmf-inner container">' +
            buildBrandColumn() +
            middleCols +
          '</div>' +
        '</div>' +
        '<div class="wmf-divider container">' +
          buildCitiesStrip() +
        '</div>' +
        buildBottomBar() +
      '</footer>'
    );
  }

  // ----------------------------------------------------------------------
  //  4. Purge legacy footer
  // ----------------------------------------------------------------------
  function purgeLegacyFooter () {
    document.querySelectorAll('footer:not(.wm-footer), .wm-footer').forEach(function (f) {
      f.parentNode && f.parentNode.removeChild(f);
    });
  }

  // ----------------------------------------------------------------------
  //  5. Newsletter form (saves to localStorage; replace with API in prod)
  // ----------------------------------------------------------------------
  function wireNewsletter (root) {
    var form = root.querySelector('#wmfNews');
    var note = root.querySelector('#wmfNewsNote');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      if (!input || !input.value || !/^[^@]+@[^@]+\.[^@]+$/.test(input.value)) {
        note.textContent = 'Please enter a valid email.';
        note.style.color = '#FCA5A5';
        return;
      }
      try {
        var key = 'wm_newsletter_subs';
        var raw = localStorage.getItem(key);
        var list = raw ? JSON.parse(raw) : [];
        list.push({ email: input.value, at: new Date().toISOString(), src: location.pathname });
        localStorage.setItem(key, JSON.stringify(list));
      } catch (err) {}
      note.textContent = '✓ Subscribed. We send 1 email a month, never spam.';
      note.style.color = '#10F2A0';
      input.value = '';
    });
  }

  // ----------------------------------------------------------------------
  //  6. Boot
  // ----------------------------------------------------------------------
  function ensureQuoteCartAssets () {
    if (window.__wmQuoteCartAssetsLoading) return;

    var hasUxOnPage = Boolean(document.querySelector('script[src*="calculator-mobile-ux.js"]'));
    var hasRzpOnPage = Boolean(document.querySelector('script[src*="razorpay-checkout.js"]'));
    var needUx = !hasUxOnPage && !window.WoodenMaxQuote;
    var needRzp = !window.WoodenMaxRazorpay && !hasRzpOnPage;

    /* Calculator HTML pages include UX script but not razorpay — old guard skipped payment entirely */
    if (hasUxOnPage && !window.WoodenMaxRazorpay && !hasRzpOnPage) needRzp = true;

    if (!needUx && !needRzp) return;
    if (window.WoodenMaxRazorpay && (hasUxOnPage || window.WoodenMaxQuote)) return;

    if (!document.querySelector('link[href*="calculator-mobile-ux.css"]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = PREFIX + 'css/calculator-mobile-ux.css?v=' + WM_ASSET_V;
      document.head.appendChild(link);
    }

    window.__wmQuoteCartAssetsLoading = true;

    function loadScript (src, cb) {
      var s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.onload = s.onerror = cb;
      document.body.appendChild(s);
    }

    function afterRzp () {
      if (needUx) {
        loadScript(PREFIX + 'js/calculator-mobile-ux.js?v=' + WM_ASSET_V, function () {
          window.__wmQuoteCartAssetsLoading = false;
        });
      } else {
        window.__wmQuoteCartAssetsLoading = false;
      }
    }

    if (needRzp) {
      loadScript(PREFIX + 'js/razorpay-checkout.js?v=' + WM_ASSET_V, afterRzp);
    } else {
      afterRzp();
    }
  }

  function init () {
    purgeLegacyFooter();

    var holder = document.createElement('div');
    holder.innerHTML = buildHtml();
    var footer = holder.firstChild;
    document.body.appendChild(footer);
    wireNewsletter(footer);
    ensureQuoteCartAssets();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
