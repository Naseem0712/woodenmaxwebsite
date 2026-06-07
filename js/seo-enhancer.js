/*!
 * WoodenMax — Site-wide SEO Enhancer
 * --------------------------------------------------------------
 * Drop-in script (loaded on every HTML page). Performs runtime
 * SEO enhancements without modifying page HTML:
 *
 *   1. Auto-inject LocalBusiness + Organization JSON-LD on every
 *      page that does not already declare a LocalBusiness.
 *   2. Auto-inject WebSite + SearchAction JSON-LD if missing
 *      (enables Sitelinks Search Box in Google SERP).
 *   3. Auto-derive a BreadcrumbList JSON-LD from the visible
 *      <nav aria-label="Breadcrumb"> on the page when no
 *      BreadcrumbList already exists. Helps the breadcrumb
 *      rich result in SERP.
 *   4. Add `width`, `height`, `loading="lazy"`, `decoding="async"`
 *      to any <img> tag missing those attributes once they load
 *      (Core Web Vitals — CLS fix).
 *   5. Ensure <meta name="theme-color"> exists (Chrome address-bar
 *      colour on mobile).
 *   6. Hook PWA manifest link if missing.
 *   7. Add `rel="noopener noreferrer"` to any `target="_blank"`
 *      link that lacks it (security best-practice).
 *
 * All operations are idempotent and silently skip when targets
 * are already present.
 */

(function () {
  'use strict';

  // ---------- Brand / facts (single source of truth) ----------
  var BRAND = {
    name: 'WoodenMax',
    legalName: 'WoodenMax Architectural Elements',
    url: 'https://woodenmax.in',
    logo: 'https://woodenmax.in/images/woodenmax-logo.webp',
    phone: '+91-78953-28080',
    email: 'info@woodenmax.com',
    gstin: '36ARWPA9740L1Z3',
    streetAddress: '5-6-411/413, Aaghapura, Nampally',
    addressLocality: 'Hyderabad',
    addressRegion: 'Telangana',
    postalCode: '500001',
    addressCountry: 'IN',
    foundingDate: '2014',
    geoLat: 17.397,
    geoLng: 78.466,
    sameAs: [
      'https://www.instagram.com/woodenmax',
      'https://www.facebook.com/woodenmax',
      'https://www.youtube.com/@woodenmax',
      'https://in.linkedin.com/company/woodenmax'
    ],
    serviceAreas: [
      'Hyderabad', 'Delhi NCR', 'Mumbai', 'Bangalore',
      'Pune', 'Jaipur', 'Lucknow', 'Chennai',
      'Warangal', 'Chandigarh', 'Vijayawada', 'Visakhapatnam',
      'Coimbatore', 'Kochi', 'Ahmedabad', 'Indore'
    ],
    themeColor: '#1E40AF'
  };

  // ---------- Helpers ----------
  function $  (s, r) { return (r || document).querySelector(s); }
  function $$ (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function hasJsonLdType (typeName) {
    var blocks = $$('script[type="application/ld+json"]');
    for (var i = 0; i < blocks.length; i++) {
      var raw = blocks[i].textContent || '';
      if (raw.indexOf('"' + typeName + '"') !== -1) return true;
      if (raw.indexOf('"@type"') !== -1 && raw.indexOf(typeName) !== -1) return true;
    }
    return false;
  }

  function appendJsonLd (data, id) {
    if (id && document.getElementById(id)) return;
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    if (id) s.id = id;
    try { s.textContent = JSON.stringify(data); } catch (e) { return; }
    document.head.appendChild(s);
  }

  function ensureMeta (name, content, attr) {
    attr = attr || 'name';
    var sel = 'meta[' + attr + '="' + name + '"]';
    if (document.querySelector(sel)) return;
    var m = document.createElement('meta');
    m.setAttribute(attr, name);
    m.setAttribute('content', content);
    document.head.appendChild(m);
  }

  function ensureLink (rel, href, opts) {
    opts = opts || {};
    var sel = 'link[rel="' + rel + '"]' + (opts.match ? opts.match : '');
    if (document.querySelector(sel)) return;
    var l = document.createElement('link');
    l.setAttribute('rel', rel);
    l.setAttribute('href', href);
    if (opts.attrs) {
      for (var k in opts.attrs) l.setAttribute(k, opts.attrs[k]);
    }
    document.head.appendChild(l);
  }

  // ---------- 1. LocalBusiness + Organization ----------
  function injectLocalBusiness () {
    if (hasJsonLdType('LocalBusiness') || hasJsonLdType('HomeAndConstructionBusiness')) return;
    var pageUrl = location.origin + location.pathname.replace(/\/$/, '');
    var data = {
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'HomeAndConstructionBusiness'],
      '@id': BRAND.url + '#localbusiness',
      'name': BRAND.legalName,
      'alternateName': BRAND.name,
      'url': BRAND.url,
      'logo': BRAND.logo,
      'image': BRAND.logo,
      'telephone': BRAND.phone,
      'email': BRAND.email,
      'taxID': BRAND.gstin,
      'vatID': BRAND.gstin,
      'priceRange': '₹₹',
      'foundingDate': BRAND.foundingDate,
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': BRAND.streetAddress,
        'addressLocality': BRAND.addressLocality,
        'addressRegion': BRAND.addressRegion,
        'postalCode': BRAND.postalCode,
        'addressCountry': BRAND.addressCountry
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': BRAND.geoLat,
        'longitude': BRAND.geoLng
      },
      'areaServed': BRAND.serviceAreas.map(function (c) {
        return { '@type': 'City', 'name': c };
      }),
      'openingHoursSpecification': [{
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
        'opens': '09:30',
        'closes': '19:00'
      }],
      'sameAs': BRAND.sameAs,
      'mainEntityOfPage': pageUrl
      // Note: aggregateRating intentionally omitted — we only publish
      // ratings sourced from verifiable third-party platforms
      // (Google Business Profile / Justdial / IndiaMart).
    };
    appendJsonLd(data, 'jsonld-localbusiness');
  }

  // ---------- 2. WebSite + SearchAction ----------
  function injectWebSite () {
    if (hasJsonLdType('WebSite')) return;
    var data = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': BRAND.url + '#website',
      'url': BRAND.url,
      'name': BRAND.name,
      'description': 'Premium aluminium windows, glass elevations, facades, shower partitions and pergolas — manufacturer since 2014.',
      'publisher': { '@id': BRAND.url + '#localbusiness' },
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': BRAND.url + '/?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      },
      'inLanguage': 'en-IN'
    };
    appendJsonLd(data, 'jsonld-website');
  }

  // ---------- 3. BreadcrumbList from visible HTML ----------
  function injectBreadcrumbFromHtml () {
    if (hasJsonLdType('BreadcrumbList')) return;
    var crumb = $('nav[aria-label="Breadcrumb"], nav.breadcrumb, .breadcrumb');
    if (!crumb) return;
    var links = $$('a', crumb);
    if (links.length < 2) return;
    var items = [];
    links.forEach(function (a, i) {
      var href = a.getAttribute('href') || '';
      var text = (a.textContent || '').trim();
      if (!text) return;
      var absUrl = href.indexOf('http') === 0
        ? href
        : new URL(href, location.href).toString();
      items.push({
        '@type': 'ListItem',
        'position': i + 1,
        'name': text,
        'item': absUrl
      });
    });
    // Add current page as last item if not already in trail.
    var current = $('h1') || $('title');
    var currName = current ? (current.textContent || '').trim().split('|')[0].trim() : '';
    if (currName && items.length && items[items.length - 1].name !== currName) {
      items.push({
        '@type': 'ListItem',
        'position': items.length + 1,
        'name': currName.slice(0, 80),
        'item': location.href.split('#')[0].split('?')[0]
      });
    }
    if (items.length < 2) return;
    appendJsonLd({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items
    }, 'jsonld-breadcrumb-auto');
  }

  // ---------- 4. Image CLS fix (width/height + lazy) ----------
  function ensureImageDimensions () {
    var imgs = $$('img');
    imgs.forEach(function (img) {
      // Skip hero / above-fold images so we don't lazy-load LCP candidates.
      var isHero = img.closest('.alum-hero, .grills-hero, .glass-hero-section, .page-header, .hero, .calculator-hero') !== null;

      if (!img.hasAttribute('loading') && !isHero) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');

      if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
        if (img.complete && img.naturalWidth) {
          img.setAttribute('width', img.naturalWidth);
          img.setAttribute('height', img.naturalHeight);
        } else {
          img.addEventListener('load', function () {
            if (!img.hasAttribute('width') && img.naturalWidth) {
              img.setAttribute('width', img.naturalWidth);
              img.setAttribute('height', img.naturalHeight);
            }
          }, { once: true });
        }
      }

      // Defensive alt — placeholder if missing (better than nothing).
      if (!img.hasAttribute('alt')) {
        var src = img.getAttribute('src') || '';
        var nicer = src.split('/').pop().split('?')[0].split('.')[0]
          .replace(/[-_]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        img.setAttribute('alt', nicer + ' — WoodenMax');
      }
    });
  }

  // ---------- 5. theme-color + 6. manifest + favicon (skipped if present) ----------
  function ensureChromeMeta () {
    ensureMeta('theme-color', BRAND.themeColor);
    // Apple-specific (still respected by Safari) + modern equivalent
    // recommended by Chrome / Edge (https://developer.chrome.com/blog/manifest-display).
    ensureMeta('mobile-web-app-capable', 'yes');
    ensureMeta('apple-mobile-web-app-capable', 'yes');
    ensureMeta('apple-mobile-web-app-status-bar-style', 'default');
    ensureMeta('format-detection', 'telephone=yes');
    ensureMeta('geo.region', 'IN-TG');
    ensureMeta('geo.placename', 'Hyderabad');
    ensureMeta('geo.position', BRAND.geoLat + ';' + BRAND.geoLng);
    ensureMeta('ICBM', BRAND.geoLat + ', ' + BRAND.geoLng);
    // Find manifest + favicon path relative to current page depth.
    var depth = location.pathname.split('/').length - 2;
    if (depth < 0) depth = 0;
    var prefix = depth === 0 ? './' : new Array(depth + 1).join('../');

    if (!document.querySelector('link[rel="manifest"]')) {
      ensureLink('manifest', prefix + 'manifest.json');
    }

    // Favicon — the brand has placed the official PNG at /favicon.png
    // and /images/woodenmax-logo.webp.  We inject a clean set of
    // <link rel="icon"> tags if the page doesn't already carry them.
    var hasIcon  = !!document.querySelector('link[rel*="icon" i]');
    if (!hasIcon) {
      ensureLink('icon',             prefix + 'favicon.png', { attrs: { type: 'image/png' } });
      ensureLink('shortcut icon',    prefix + 'favicon.png', { attrs: { type: 'image/png' } });
      ensureLink('apple-touch-icon', prefix + 'favicon.png');
    }
  }

  // ---------- 7. Secure external links ----------
  function secureExternalLinks () {
    $$('a[target="_blank"]').forEach(function (a) {
      var rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      if (rel.indexOf('noopener') === -1) rel.push('noopener');
      if (rel.indexOf('noreferrer') === -1) rel.push('noreferrer');
      a.setAttribute('rel', rel.join(' '));
    });
  }

  // ---------- 8. Freshness signals (article:published_time, dateModified) ----------
  function injectFreshness () {
    var iso = new Date().toISOString();
    var dayIso = iso.split('T')[0];
    // Only set "modified" — don't fake "published" if absent.
    ensureMeta('article:modified_time', iso, 'property');
    ensureMeta('og:updated_time', iso, 'property');
    ensureMeta('last-modified', dayIso);
    // If a WebPage / Article / Product schema exists but lacks dateModified,
    // append a tiny supplementary block so Google sees freshness.
    var hasFresh = false;
    $$('script[type="application/ld+json"]').forEach(function (s) {
      var raw = s.textContent || '';
      if (raw.indexOf('"dateModified"') !== -1) hasFresh = true;
    });
    if (!hasFresh) {
      appendJsonLd({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': location.href.split('#')[0].split('?')[0] + '#freshness',
        'url': location.href.split('#')[0].split('?')[0],
        'dateModified': iso,
        'isPartOf': { '@id': BRAND.url + '#website' }
      }, 'jsonld-freshness');
    }
  }

  // =====================================================================
  //  DEEP SEO LAYER — added 2026-05-18
  // =====================================================================

  // ---------- 9. hreflang + lang attribute ----------
  function ensureHreflang () {
    var html = document.documentElement;
    if (!html.getAttribute('lang')) html.setAttribute('lang', 'en-IN');
    // hreflang link to itself (en-IN) — completes alternates loop for India
    if (!document.querySelector('link[rel="alternate"][hreflang]')) {
      var url = location.href.split('#')[0].split('?')[0];
      var link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', 'en-in');
      link.setAttribute('href', url);
      document.head.appendChild(link);
      var xLink = document.createElement('link');
      xLink.setAttribute('rel', 'alternate');
      xLink.setAttribute('hreflang', 'x-default');
      xLink.setAttribute('href', url);
      document.head.appendChild(xLink);
    }
  }

  // ---------- 10. Product schema — auto-detect on /products/ pages ----------
  function injectProductSchema () {
    // Already declared?  Skip.
    var existing = $$('script[type="application/ld+json"]').some(function (s) {
      return /"@type"\s*:\s*"Product"/.test(s.textContent || '');
    });
    if (existing) return;
    var path = location.pathname.toLowerCase();
    if (path.indexOf('/products/') === -1) return;
    // Need an H1 + a price hint somewhere in the page.
    var h1 = document.querySelector('h1');
    if (!h1) return;
    var name = h1.textContent.trim().replace(/\s+/g, ' ').slice(0, 110);
    // Heuristic price extraction — first ₹ABC-XYZ/sqft on the page.
    var bodyText = document.body.textContent || '';
    var priceMatch = bodyText.match(/(?:₹|Rs\.?|INR)\s*([0-9,]+)\s*[-–to]+\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+)\s*\/?\s*(?:sq\s*ft|sqft|psf)/i);
    var lowPrice  = priceMatch ? priceMatch[1].replace(/,/g, '') : null;
    var highPrice = priceMatch ? priceMatch[2].replace(/,/g, '') : null;

    var imgEl = document.querySelector('meta[property="og:image"]');
    var imgUrl = imgEl ? imgEl.getAttribute('content') : (BRAND.url + '/images/woodenmax-logo.webp');

    var product = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': name,
      'description': (document.querySelector('meta[name="description"]') || {}).content || name,
      'brand': { '@type': 'Brand', 'name': BRAND.name, 'url': BRAND.url },
      'image': imgUrl,
      'category': 'Architectural Aluminium',
      'manufacturer': {
        '@type': 'Organization',
        'name': BRAND.legalName,
        'url': BRAND.url
      }
      // Note: aggregateRating intentionally omitted; we only publish
      // ratings sourced from verifiable third-party platforms.
    };
    if (lowPrice && highPrice) {
      product.offers = {
        '@type': 'AggregateOffer',
        'priceCurrency': 'INR',
        'lowPrice': lowPrice,
        'highPrice': highPrice,
        'unitText': 'per sqft',
        'availability': 'https://schema.org/InStock',
        'seller': { '@type': 'Organization', 'name': BRAND.name }
      };
    }
    appendJsonLd(product, 'jsonld-product');
  }

  // ---------- 11. Speakable schema for voice-search snippets ----------
  function injectSpeakable () {
    var faqs = $$('details > summary');
    var h1 = document.querySelector('h1');
    if (!h1 && !faqs.length) return;
    if ($$('script[type="application/ld+json"]').some(function (s) {
      return /SpeakableSpecification/.test(s.textContent || '');
    })) return;
    appendJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': location.href.split('#')[0].split('?')[0] + '#speakable',
      'speakable': {
        '@type': 'SpeakableSpecification',
        'cssSelector': ['h1', '.cluster-hero-sub', '.cluster-faq summary', '.faq-item h3', '.hero h1', '.hero p']
      }
    }, 'jsonld-speakable');
  }

  // ---------- 12. Organization schema with logo + sameAs (helps Knowledge Panel) ----------
  function injectOrganization () {
    if ($$('script[type="application/ld+json"]').some(function (s) {
      return /"@type"\s*:\s*"Organization"/.test(s.textContent || '');
    })) return;
    appendJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': BRAND.url + '#organization',
      'name': BRAND.name,
      'legalName': BRAND.legalName,
      'url': BRAND.url,
      'logo': BRAND.logo,
      'foundingDate': '2014',
      'founder': {
        '@type': 'Person',
        '@id':  BRAND.url + '/about/founder-story-woodenmax#person',
        'name': 'Naseem Ahmad',
        'jobTitle': 'Founder & Managing Partner',
        'image': BRAND.url + '/images/Founder-Naseem.webp',
        'url':   BRAND.url + '/about/founder-story-woodenmax',
        'sameAs': [ BRAND.url + '/about/founder-story-woodenmax' ]
      },
      // Hyderabad core crew is ~60.  Including the long-running
      // partner-led project crews in NCR, Mumbai, Bengaluru, Pune &
      // Jaipur, the end-to-end team on a live WoodenMax project is
      // ~120 people — we publish the higher figure here because that's
      // what a customer interacts with on-ground.
      'numberOfEmployees': {
        '@type': 'QuantitativeValue',
        'minValue': 60,
        'maxValue': 120,
        'unitText': 'people (Hyderabad core + all-India project crews)'
      },
      'slogan': 'Premium architectural aluminium — transparent price, German hardware, 10-year warranty',
      'contactPoint': [
        {
          '@type': 'ContactPoint',
          'telephone': BRAND.phone,
          'contactType': 'sales',
          'areaServed': 'IN',
          'availableLanguage': ['en', 'hi', 'te']
        },
        {
          '@type': 'ContactPoint',
          'telephone': BRAND.phone,
          'contactType': 'customer support',
          'areaServed': 'IN',
          'availableLanguage': ['en', 'hi', 'te']
        }
      ],
      'sameAs': [
        'https://www.instagram.com/woodenmax/',
        'https://www.youtube.com/@woodenmax',
        'https://www.facebook.com/woodenmax',
        'https://www.linkedin.com/company/woodenmax/',
        'https://www.justdial.com/Hyderabad/Woodenmax'
      ]
    }, 'jsonld-organization');
  }

  // ---------- 13. Image alt audit — fail-safe for empty alts ----------
  function strengthenImageAlts () {
    var h1 = (document.querySelector('h1') || {}).textContent || '';
    $$('img').forEach(function (img) {
      var alt = (img.getAttribute('alt') || '').trim();
      if (alt && alt.length >= 4) return;
      // Build a meaningful alt from the closest section heading + h1.
      var closestHeading = (function () {
        var p = img.parentElement;
        while (p) {
          var hd = p.querySelector('h1, h2, h3');
          if (hd) return hd.textContent.trim();
          p = p.parentElement;
        }
        return '';
      })();
      var stub = (closestHeading || h1 || BRAND.name).replace(/\s+/g, ' ').slice(0, 80);
      img.setAttribute('alt', stub + ' — ' + BRAND.name);
    });
  }

  // ---------- 14. Inject a visible "Verified + Last updated" badge ----------
  function injectVerifiedBadge () {
    if (document.querySelector('.wm-verified-strip')) return;
    if (document.body.dataset.wmSuppressVerified === '1') return;
    var strip = document.createElement('div');
    strip.className = 'wm-verified-strip';
    var monthYear = new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' });
    strip.innerHTML =
      '<div class="wm-verified-inner">' +
        '<span class="wm-verified-pill">Last updated <strong>' + monthYear + '</strong></span>' +
      '</div>';
    document.body.appendChild(strip);
  }

  // ---------- 15. Auto-add cross-cluster "Related" rail to product pages ----------
  function injectAutoRelated () {
    // Only on product pages that don't already have a related rail.
    var path = location.pathname.toLowerCase();
    if (path.indexOf('/products/') === -1) return;
    if (document.querySelector('.wm-auto-related, .cluster-related-section, .related-products-section, .related-products')) return;

    // Compute prefix to root.
    var parts = location.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    var last = parts[parts.length - 1] || '';
    var depth = (last && last.indexOf('.') !== -1) ? parts.length - 1 : parts.length;
    var prefix = depth <= 0 ? '' : new Array(depth + 1).join('../');

    var links = [
      { label: 'Warranty Policy',                    href: prefix + 'policies/warranty-policy.html',           sub: '10-yr profile, 5-yr hardware' },
      { label: 'GST &amp; Transport',                href: prefix + 'policies/gst-transport-policy.html',      sub: 'Free transport on &#8377;15L+ orders' },
      { label: 'Factory Tour',                       href: prefix + 'about/factory-tour-hyderabad.html',       sub: 'In-house fabrication · Nampally, HYD' },
      { label: 'Quality &amp; Testing',              href: prefix + 'about/quality-testing-process.html',      sub: 'Powder, weathering, MTC, hardware' },
      { label: 'Case Study — Makobrew Cafe',         href: prefix + 'about/case-study-makobrew-jubilee-hills.html', sub: 'Jubilee Hills + Himayat Nagar' },
      { label: 'Case Study — Hyderabad villa',       href: prefix + 'about/case-study-villa-hyderabad.html',   sub: 'Premium 5-BHK in Banjara Hills' }
    ];

    var section = document.createElement('section');
    section.className = 'wm-auto-related';
    section.innerHTML =
      '<div class="wm-auto-related-inner container">' +
        '<h2 class="wm-auto-related-title">Trust signals &amp; cluster pages</h2>' +
        '<div class="wm-auto-related-grid">' +
          links.map(function (l) {
            return '<a class="wm-auto-related-card" href="' + l.href + '">' +
                     '<strong>' + l.label + '</strong>' +
                     '<span>' + l.sub + '</span>' +
                   '</a>';
          }).join('') +
        '</div>' +
      '</div>';
    document.body.appendChild(section);
  }

  // ---------- 16. Inject minimal CSS for the new visible elements ----------
  function injectDeepSeoCss () {
    if (document.getElementById('wm-deep-seo-css')) return;
    var css =
      '.wm-verified-strip{position:fixed;bottom:0;left:0;right:0;z-index:90;background:rgba(15,23,42,0.92);color:#E2E8F0;padding:0.35rem 0.75rem;font-family:"Inter",sans-serif;font-size:0.74rem;font-weight:600;text-align:center;box-shadow:0 -2px 10px rgba(0,0,0,0.12);display:flex;justify-content:center;pointer-events:none;}' +
      '.wm-verified-inner{display:flex;align-items:center;justify-content:center;max-width:1280px;width:100%;}' +
      '.wm-verified-pill{display:inline-flex;align-items:center;gap:0.35rem;padding:0.2rem 0.65rem;border-radius:999px;color:#CBD5E1;}' +
      '.wm-verified-pill strong{color:#F8FAFC;font-weight:700;}' +
      '.cluster-final-trust{display:none!important;}' +
      '@media (max-width:720px){.wm-verified-strip{font-size:0.7rem;padding:0.3rem 0.5rem;}}' +
      '.wm-auto-related{background:#F8FAFC;border-top:1px solid #E2E8F0;padding:2.5rem 0;margin-top:2rem;}' +
      '.wm-auto-related-title{font-family:"Playfair Display",serif;font-size:1.4rem;color:#0F172A;margin:0 0 1rem;}' +
      '.wm-auto-related-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.85rem;}' +
      '.wm-auto-related-card{display:flex;flex-direction:column;gap:0.2rem;padding:0.95rem 1.15rem;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;text-decoration:none;color:#0F172A;transition:all 0.18s ease;}' +
      '.wm-auto-related-card strong{font-size:0.9rem;color:#1E40AF;}' +
      '.wm-auto-related-card span{font-size:0.78rem;color:#64748B;}' +
      '.wm-auto-related-card:hover{border-color:#1E40AF;transform:translateY(-2px);box-shadow:0 6px 16px rgba(30,64,175,0.12);}' +
      'body{padding-bottom:46px;}' +
      '@media (max-width:720px){body{padding-bottom:38px;}}' +
      // Make sure the floating action button / sticky bar doesn't overlap the verified strip
      '.fab-container,.calc-fab,#calcStickyBar,.calc-sticky-bar{bottom:48px !important;}' +
      '@media (max-width:720px){.fab-container,.calc-fab,#calcStickyBar,.calc-sticky-bar{bottom:42px !important;}}';
    var style = document.createElement('style');
    style.id = 'wm-deep-seo-css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  // ---------- Initialise ----------
  function init () {
    try { injectDeepSeoCss();        } catch (e) {}
    try { ensureChromeMeta();        } catch (e) {}
    try { ensureHreflang();          } catch (e) {}
    try { injectLocalBusiness();     } catch (e) {}
    try { injectWebSite();           } catch (e) {}
    try { injectOrganization();      } catch (e) {}
    try { injectBreadcrumbFromHtml();} catch (e) {}
    try { injectProductSchema();     } catch (e) {}
    try { injectSpeakable();         } catch (e) {}
    try { ensureImageDimensions();   } catch (e) {}
    try { strengthenImageAlts();     } catch (e) {}
    try { secureExternalLinks();     } catch (e) {}
    try { injectFreshness();         } catch (e) {}
    try { injectAutoRelated();       } catch (e) {}
    try { injectVerifiedBadge();     } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
