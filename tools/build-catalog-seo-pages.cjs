/**
 * tools/build-catalog-seo-pages.cjs
 * Generates mirror-profiles & metal-louvers SEO catalog pages.
 * Run: node tools/build-catalog-seo-pages.cjs
 */

const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..');
const ORIGIN = 'https://woodenmax.in';

const mirrorManifest = require('./page-data/catalog/mirror-profiles-pages');
const louverManifest = require('./page-data/catalog/metal-louvers-seo-pages');
const mirrorShared = require('./page-data/catalog/_mirror-shared');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function relPrefix(outRel) {
  const depth = outRel.split('/').length - 1;
  return depth <= 0 ? '' : '../'.repeat(depth);
}

/** GA4 + analytics bundle — same as product hub pages. */
function renderGa4Head(prefix) {
  return (
    '  <!-- Google tag (gtag.js) -->\n' +
    '  <script async src="https://www.googletagmanager.com/gtag/js?id=G-H3574PEDBK"></script>\n' +
    '  <script>\n' +
    '    window.dataLayer = window.dataLayer || [];\n' +
    '    function gtag(){dataLayer.push(arguments);}\n' +
    '    gtag(\'js\', new Date());\n' +
    '    gtag(\'config\', \'G-H3574PEDBK\', { engagement_time_msec: 0, session_engaged: true });\n' +
    '  </script>\n' +
    '  <script defer src="' + prefix + 'js/analytics.js"></script>\n'
  );
}

function breadcrumbHtml(crumbs, prefix) {
  return (
    '<nav class="cluster-breadcrumb" aria-label="Breadcrumb"><div class="container">' +
    crumbs.map(function (c, i) {
      var isLast = i === crumbs.length - 1;
      if (isLast) return '<strong>' + esc(c.label) + '</strong>';
      var href = c.href.indexOf('http') === 0 ? c.href : prefix + c.href.replace(/^\//, '');
      return '<a href="' + esc(href) + '">' + esc(c.label) + '</a><span aria-hidden="true"> &rsaquo; </span>';
    }).join('') +
    '</div></nav>'
  );
}

function breadcrumbJson(crumbs, canonical) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(function (c, i) {
      var isLast = i === crumbs.length - 1;
      var item = isLast ? canonical : (c.href.indexOf('http') === 0 ? c.href : ORIGIN + c.href);
      return { '@type': 'ListItem', position: i + 1, name: c.label, item: item };
    }),
  });
}

function mirrorHubItemListJson(cfg, canonical) {
  if (!cfg.isHub || cfg.silo !== 'mirror-profiles' || !cfg.hubLinks || !cfg.hubLinks.length) return '';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'WoodenMax mirror profile calculators',
    url: canonical,
    numberOfItems: cfg.hubLinks.length,
    itemListElement: cfg.hubLinks.map(function (l, i) {
      return {
        '@type': 'ListItem',
        position: i + 1,
        name: l.title,
        url: ORIGIN + '/products/mirror-profiles/' + l.slug,
      };
    }),
  });
}

function faqJson(faqs) {
  if (!faqs || !faqs.length) return '';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(function (f) {
      return {
        '@type': 'Question',
        name: f.q.replace(/<[^>]+>/g, ''),
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      };
    }),
  });
}

function productJson(cfg, canonical, ogImage) {
  var ps = cfg.productSchema || {};
  var unit = cfg.unit === 'ft' ? 'FOT' : cfg.unit === 'piece' ? 'C62' : 'FTK';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: ps.name || cfg.h1,
    description: cfg.description,
    brand: { '@type': 'Brand', name: 'WoodenMax', url: ORIGIN },
    image: [ogImage],
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: ps.lowPrice || 450,
      highPrice: ps.highPrice || 1450,
      offerCount: 1,
      availability: 'https://schema.org/InStock',
      url: canonical,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        priceCurrency: 'INR',
        unitCode: ps.unitCode || unit,
      },
    },
  });
}

function localBusinessJson() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'WoodenMax Architectural Elements',
    url: ORIGIN,
    telephone: '+91-7895328080',
    email: 'info@woodenmax.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '5-6-411/413, Aaghapura, Nampally',
      addressLocality: 'Hyderabad',
      addressRegion: 'Telangana',
      postalCode: '500001',
      addressCountry: 'IN',
    },
    priceRange: '₹₹',
    areaServed: ['Hyderabad', 'Delhi NCR', 'Jaipur', 'Mumbai', 'Bengaluru'],
  });
}

function renderTable(tbl) {
  if (!tbl) return '';
  return (
    '<div class="cluster-table-wrap"><table class="cluster-table"><thead><tr>' +
    tbl.head.map(function (h) { return '<th>' + h + '</th>'; }).join('') +
    '</tr></thead><tbody>' +
    tbl.rows.map(function (row) {
      return '<tr>' + row.map(function (cell) { return '<td>' + cell + '</td>'; }).join('') + '</tr>';
    }).join('') +
    '</tbody></table></div>'
  );
}

function renderColorSwatchSvg(color) {
  var id = color.id;
  var fill = color.fill;
  if (id === 'brush-gold') {
    return (
      '<svg class="catalog-color-swatch" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">' +
      '<defs><linearGradient id="sw-brush-gold" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#e8c872"/><stop offset="45%" stop-color="#b8860b"/><stop offset="100%" stop-color="#8b6914"/>' +
      '</linearGradient></defs>' +
      '<rect width="20" height="20" rx="3" fill="url(#sw-brush-gold)" stroke="#9a7b2f" stroke-width="0.6"/></svg>'
    );
  }
  if (id === 'rose-gold') {
    return (
      '<svg class="catalog-color-swatch" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">' +
      '<rect width="20" height="20" rx="3" fill="' + fill + '" stroke="#a67c6d" stroke-width="0.6"/>' +
      '<rect x="3" y="3" width="14" height="14" rx="2" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="0.5"/></svg>'
    );
  }
  return (
    '<svg class="catalog-color-swatch" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">' +
    '<rect width="20" height="20" rx="3" fill="' + fill + '" stroke="rgba(0,0,0,.18)" stroke-width="0.6"/></svg>'
  );
}

function renderMirrorColorPicker() {
  var colors = mirrorShared.MIRROR_PROFILE_COLORS;
  var premium = mirrorShared.MIRROR_PREMIUM_COLOR_PER_SQFT;
  return (
    '<div class="catalog-calc-field catalog-calc-field-full"><label>Profile colour</label>' +
    '<div class="catalog-color-picker" role="radiogroup" aria-label="Profile colour">' +
    colors.map(function (col, i) {
      var prem = col.premium ? ' <span class="catalog-color-premium">+₹' + premium + '/sq.ft</span>' : '';
      return (
        '<label class="catalog-color-option">' +
        '<input type="radio" name="catalogCalcColor" value="' + esc(col.id) + '"' + (i === 0 ? ' checked' : '') + '>' +
        renderColorSwatchSvg(col) +
        '<span class="catalog-color-label">' + esc(col.label) + prem + '</span></label>'
      );
    }).join('') +
    '</div></div>'
  );
}

function renderMirrorGlassBrand() {
  var brands = mirrorShared.MIRROR_GLASS_BRANDS;
  return (
    '<div class="catalog-calc-field"><label>Mirror glass</label><select id="catalogCalcGlassBrand">' +
    brands.map(function (b) {
      return '<option value="' + esc(b.id) + '">' + esc(b.label) + '</option>';
    }).join('') +
    '</select><small class="catalog-field-hint">Same rate — select brand for your BOQ</small></div>'
  );
}

function renderMirrorCalc(cfg, prefix) {
  var mode = cfg.calcMode;
  var c = cfg.calcConfig || {};
  var presets = c.presetSizes || [[1.5, 2.5], [2, 3], [2.5, 4], [3, 5]];
  var presetOpts = '<option value="">Custom size</option>' +
    presets.map(function (sz) {
      return '<option value="' + sz[0] + ',' + sz[1] + '">' + sz[0] + ' × ' + sz[1] + ' ft</option>';
    }).join('');
  var packingLine =
    '<label class="catalog-calc-check"><input type="checkbox" id="catalogCalcPacking"' +
    (mode === 'imported-motion' ? ' checked' : '') +
    '> Add export packing (approx ₹500/piece)</label>';
  var extras = packingLine;
  if (mode === 'bevel-modular') {
    extras +=
      '<label class="catalog-calc-check"><input type="checkbox" id="catalogCalcProfile"> Add imported profile</label>' +
      '<label class="catalog-calc-check"><input type="checkbox" id="catalogCalcLedV120"> Add LED V120</label>' +
      '<label class="catalog-calc-check"><input type="checkbox" id="catalogCalcLedV220"> Add LED V220</label>';
  }
  if (mode === 'luxury-glass') {
    extras +=
      '<div class="catalog-calc-field"><label>Glass pieces</label><input type="number" id="catalogCalcGlassCount" min="1" max="6" value="' + (c.defaultGlassCount || 2) + '"></div>' +
      '<div class="catalog-calc-field"><label>Sensor type</label><select id="catalogCalcSensor">' +
      '<option value="none">Backlight only</option><option value="motion">Motion sensor</option><option value="touch">Touch sensor</option></select></div>';
  }
  var intro = cfg.calcIntro || 'Select size & options — amount updates live. GST, packing & transit extra.';
  var cfgJson = JSON.stringify(c).replace(/'/g, '&#39;');
  var hubCompact = !!cfg.isHub;
  var calcSectionClass = 'catalog-calc-section catalog-calc-mirror' + (hubCompact ? ' catalog-calc-section--hub-compact' : '');
  var calcTitle = hubCompact ? 'Quick mirror estimate' : 'Live mirror calculator';
  var calcIntroHtml = hubCompact
    ? '<p class="catalog-calc-intro catalog-calc-intro--short">V120 ₹850/sqft · V220 ₹950/sqft — size, colour &amp; hardware update instantly.</p>'
    : '<p class="catalog-calc-intro">' + esc(intro) + '</p>';
  var inquiryHtml = hubCompact
    ? ('<details class="catalog-calc-inquiry-fold" id="catalogCalcInquiry">' +
      '<summary class="catalog-inq-summary">Request formal quote</summary>' +
      '<div class="catalog-calc-inquiry catalog-calc-inquiry--nested">' +
      '<div class="catalog-inq-grid"><div class="catalog-calc-field"><label>Name</label><input type="text" id="catalogInqName"></div>' +
      '<div class="catalog-calc-field"><label>Mobile</label><input type="tel" id="catalogInqPhone"></div>' +
      '<div class="catalog-calc-field"><label>Email</label><input type="email" id="catalogInqEmail"></div>' +
      '<div class="catalog-calc-field"><label>City</label><input type="text" id="catalogInqCity"></div>' +
      '<div class="catalog-calc-field catalog-calc-field-full"><label>Notes</label><textarea id="catalogInqNotes" rows="2"></textarea></div></div>' +
      '<button type="button" class="catalog-calc-submit catalog-inq-submit" id="catalogInqSubmit">Send inquiry</button>' +
      '<p class="catalog-inq-status" id="catalogInqStatus" role="status"></p></div></details>')
    : ('<div class="catalog-calc-inquiry" id="catalogCalcInquiry"><h3 class="catalog-inq-title">Request formal quote</h3>' +
      '<div class="catalog-inq-grid"><div class="catalog-calc-field"><label>Name</label><input type="text" id="catalogInqName"></div>' +
      '<div class="catalog-calc-field"><label>Mobile</label><input type="tel" id="catalogInqPhone"></div>' +
      '<div class="catalog-calc-field"><label>Email</label><input type="email" id="catalogInqEmail"></div>' +
      '<div class="catalog-calc-field"><label>City</label><input type="text" id="catalogInqCity"></div>' +
      '<div class="catalog-calc-field catalog-calc-field-full"><label>Notes</label><textarea id="catalogInqNotes" rows="2"></textarea></div></div>' +
      '<button type="button" class="catalog-calc-submit catalog-inq-submit" id="catalogInqSubmit">Send inquiry</button>' +
      '<p class="catalog-inq-status" id="catalogInqStatus" role="status"></p></div>');
  return (
    '<section class="' + calcSectionClass + '" id="wmCatalogCalc" data-calc-mode="' + esc(mode) + '" data-calc-config=\'' + cfgJson + '\' data-page-title="' + esc(cfg.h1) + '" data-page-slug="' + esc(cfg.slug || '') + '">' +
    '<div class="container"><h2 class="cluster-h2">' + calcTitle + '</h2>' +
    calcIntroHtml +
    '<div class="catalog-calc-grid catalog-calc-grid-mirror">' +
    '<div class="catalog-calc-field"><label>Preset size</label><select id="catalogCalcPreset">' + presetOpts + '</select></div>' +
    '<div class="catalog-calc-field"><label>Width (ft)</label><input type="number" id="catalogCalcWidth" min="0.5" step="0.5" value="' + (c.defaultW || 2) + '"></div>' +
    '<div class="catalog-calc-field"><label>Height (ft)</label><input type="number" id="catalogCalcHeight" min="0.5" step="0.5" value="' + (c.defaultH || 3) + '"></div>' +
    '<div class="catalog-calc-field"><label>Qty (pieces)</label><input type="number" id="catalogCalcQty" min="1" max="99" value="1"></div>' +
    renderMirrorGlassBrand() +
    renderMirrorColorPicker() +
    (mode === 'bevel-modular' ? '' : '<div class="catalog-calc-field"><label>LED strip</label><select id="catalogCalcLed"><option value="v120">V120</option><option value="v220">V220</option></select></div>') +
    (mode === 'bevel-modular' || mode === 'luxury-glass' ? '' : '<div class="catalog-calc-field"><label>Touch sensor</label><select id="catalogCalcTouchAmp"><option value="3">3A (standard)</option><option value="5">5A upgrade</option></select></div><div class="catalog-calc-field"><label>LED driver</label><select id="catalogCalcDriver"><option value="5">5A (standard)</option><option value="7">7A upgrade</option><option value="10">10A upgrade</option></select></div>') +
    (extras ? '<div class="catalog-calc-extras catalog-calc-field-full">' + extras + '</div>' : '') +
    '</div>' +
    '<div class="catalog-calc-result" id="catalogCalcResult"><p class="catalog-calc-placeholder">Enter size to see amount per piece.</p></div>' +
    '<p class="note catalog-calc-note">*GST 18% extra | Transport charges extra | Final price confirmed on formal quote</p>' +
    (hubCompact ? '' : '<p class="source catalog-calc-source">Calculated by WoodenMax Pricing Engine v1.0 | woodenmax.in</p>') +
    '<div class="catalog-calc-hardware-summary" id="catalogCalcHwSummary"></div>' +
    inquiryHtml +
    '<div class="catalog-wa-row">' +
    '<a class="catalog-wa-btn whatsapp-btn" id="catalogCalcWa" href="https://wa.me/917895328080" target="_blank" rel="noopener" data-ga-event="wm_whatsapp_click">Get exact quote on WhatsApp &rarr;</a>' +
    '</div></div></section>'
  );
}

function renderCalc(cfg, prefix) {
  if (cfg.calcMode) return renderMirrorCalc(cfg, prefix);

  var unit = cfg.unit || 'sqft';
  var types = cfg.calcTypes || [];
  var sizeLabel = unit === 'ft' ? 'Length (ft)' : unit === 'piece' ? 'Qty (units)' : 'Area (sq.ft)';
  var defaultVal = unit === 'piece' ? '1' : unit === 'ft' ? '8' : '120';
  var intent = cfg.silo === 'mirror-profiles' ? 'mirror' : 'louver';
  return (
    '<section class="catalog-calc-section" id="wmCatalogCalc" data-unit="' + esc(unit) + '" data-page-title="' + esc(cfg.h1) + '" data-types=\'' + JSON.stringify(types).replace(/'/g, '&#39;') + '\'>' +
    '<div class="container">' +
    '<h2 class="cluster-h2">Quick price estimate</h2>' +
    '<p class="catalog-calc-intro">' + esc(cfg.calcIntro || 'Indicative range only — GST 18% extra. WhatsApp for exact BOQ after site measurement.') + '</p>' +
    '<div class="catalog-calc-grid">' +
    '<div class="catalog-calc-field"><label data-size-label>' + sizeLabel + '</label><input type="number" id="catalogCalcSize" min="1" step="0.5" value="' + defaultVal + '"></div>' +
    '<div class="catalog-calc-field" style="display:none"><label>Width</label><input type="number" id="catalogCalcWidth"></div>' +
    '<div class="catalog-calc-field"><label>Type</label><select id="catalogCalcType">' +
    types.map(function (t) {
      return '<option data-min="' + t.min + '" data-max="' + t.max + '">' + esc(t.label) + '</option>';
    }).join('') +
    '</select></div>' +
    '<div class="catalog-calc-field"><label>City</label><select id="catalogCalcCity">' +
    (cfg.cities || ['Hyderabad', 'Delhi NCR', 'Jaipur']).map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') +
    '</select></div>' +
    '<div class="catalog-calc-field"><label>&nbsp;</label><button type="button" class="catalog-calc-submit" id="catalogCalcBtn">Calculate</button></div>' +
    '</div>' +
    '<div class="catalog-calc-result" id="catalogCalcResult"></div>' +
    '<p class="note catalog-calc-note">*GST 18% extra | Transport charges extra | Final price after site visit</p>' +
    '<p class="source catalog-calc-source">Calculated by WoodenMax Pricing Engine v1.0 | woodenmax.in</p>' +
    '<div class="catalog-wa-row">' +
    '<a class="catalog-wa-btn whatsapp-btn" id="catalogCalcWa" href="https://wa.me/917895328080" target="_blank" rel="noopener" data-ga-event="wm_whatsapp_click">Get exact quote on WhatsApp &rarr;</a>' +
    '<a class="cluster-cta-link" href="' + prefix + 'contact?intent=' + intent + '-quote" data-ga-event="wm_cta_click">Book site visit &rarr;</a>' +
    '</div></div></section>'
  );
}

function renderSubsections(subs) {
  if (!subs || !subs.length) return '';
  return subs.map(function (sub) {
    var h = '';
    if (sub.h3) h += '<h3 class="cluster-h3">' + esc(sub.h3) + '</h3>';
    if (sub.body) h += '<div class="cluster-prose">' + sub.body + '</div>';
    if (sub.list) {
      h += '<ul class="cluster-list">' + sub.list.map(function (li) { return '<li>' + li + '</li>'; }).join('') + '</ul>';
    }
    return h;
  }).join('');
}

function renderEeat(cfg, prefix) {
  var e = cfg.eeatBlock;
  if (!e) return '';
  var links = (e.links || []).map(function (l) {
    var href = l.href.indexOf('http') === 0 ? l.href : prefix + l.href.replace(/^\//, '');
    return '<a href="' + esc(href) + '" class="cluster-cta-secondary">' + esc(l.label) + '</a>';
  }).join('');
  return (
    '<section class="cluster-section cluster-section-alt catalog-eeat-block"><div class="container">' +
    '<h2 class="cluster-h2">' + esc(e.heading) + '</h2>' +
    '<div class="cluster-prose">' + e.body + '</div>' +
    renderSubsections(e.subsections) +
    (links ? '<div class="cluster-hero-cta" style="margin-top:1.25rem">' + links + '</div>' : '') +
    '</div></section>'
  );
}

function renderCalcProductLinks(links, prefix, title) {
  if (!links || !links.length) return '';
  return (
    '<section class="cluster-section"><div class="container"><h2 class="cluster-h2">' + esc(title || 'Live product calculators') + '</h2>' +
    '<p class="cluster-prose">Item-wise BOQ with profile, gap, brackets and finish — use our dedicated calculator pages:</p>' +
    '<div class="cluster-related-grid" style="margin-top:1rem">' +
    links.map(function (l) {
      var href = l.href.indexOf('http') === 0 ? l.href : prefix + 'products/metal-louvers/' + l.href.replace(/^\//, '');
      return '<a href="' + esc(href) + '" class="cluster-related-card"><strong>' + esc(l.title) + '</strong><span>' + esc(l.desc || '') + '</span></a>';
    }).join('') +
    '</div></div></section>'
  );
}

function renderSections(cfg) {
  var html = '';
  if (cfg.priceTable) {
    var pt = cfg.priceTableTitle || 'Price guide';
    html += '<section class="cluster-section"><div class="container"><h2 class="cluster-h2">' + esc(pt) + '</h2>' + renderTable(cfg.priceTable) + '</div></section>';
  }
  if (cfg.specsTable) {
    html += '<section class="cluster-section cluster-section-alt"><div class="container"><h2 class="cluster-h2">Technical specifications</h2>' + renderTable(cfg.specsTable) + '</div></section>';
  }
  if (cfg.hardwareTable) {
    html += '<section class="cluster-section"><div class="container"><h2 class="cluster-h2">Hardware list &amp; warranty</h2>' + renderTable(cfg.hardwareTable) + '<p class="cluster-prose" style="margin-top:1rem">All electronic hardware carries <strong>1 year warranty</strong>. Packing &amp; transit charged separately. Dispatch within <strong>7 working days</strong> after order confirmation.</p></div></section>';
  }
  if (cfg.comparisonTable) {
    var ct = cfg.comparisonTableTitle || (cfg.silo === 'mirror-profiles' ? 'LED comparison' : 'Comparison table');
    html += '<section class="cluster-section cluster-section-alt"><div class="container"><h2 class="cluster-h2">' + esc(ct) + '</h2>' + renderTable(cfg.comparisonTable) + '</div></section>';
  }
  (cfg.bodySections || []).forEach(function (s) {
    var cls = s.alt ? 'cluster-section cluster-section-alt' : 'cluster-section';
    html += '<section class="' + cls + '"><div class="container">';
    if (s.heading) html += '<h2 class="cluster-h2">' + esc(s.heading) + '</h2>';
    if (s.body) html += '<div class="cluster-prose">' + s.body + '</div>';
    html += renderSubsections(s.subsections);
    if (s.list) {
      html += '<ul class="cluster-list">' + s.list.map(function (li) { return '<li>' + li + '</li>'; }).join('') + '</ul>';
    }
    html += '</div></section>';
  });
  return html;
}

function renderHub(cfg, prefix) {
  var imgBase = cfg.silo === 'mirror-profiles'
    ? 'images/products/mirror-profiles/'
    : 'images/products/metal-louvers/';
  var hubHeading = cfg.silo === 'mirror-profiles' ? 'Choose your mirror line' : 'Browse all pages';
  var hubSub = cfg.silo === 'mirror-profiles'
    ? '<p class="catalog-hub-lead">Each product has its own live calculator — tap a card to open sizes, sensors &amp; exact rates.</p>'
    : '';
  return (
    '<section class="cluster-section catalog-hub-section--priority" id="mirror-product-lines"><div class="container"><h2 class="cluster-h2">' + hubHeading + '</h2>' +
    hubSub +
    '<div class="catalog-hub-grid catalog-hub-grid--compact">' +
    (cfg.hubLinks || []).map(function (l) {
      var href = l.slug;
      return '<a href="' + href + '" class="catalog-hub-card">' +
        '<img src="' + prefix + imgBase + l.img + '" alt="' + esc(l.title) + '" width="400" height="160" loading="lazy">' +
        '<div class="catalog-hub-card-body"><strong>' + esc(l.title) + '</strong><span>' + esc(l.desc) + '</span></div></a>';
    }).join('') +
    '</div></div></section>'
  );
}

function renderRelated(links, prefix) {
  if (!links || !links.length) return '';
  return (
    '<section class="cluster-related-section"><div class="container"><h2 class="cluster-h2">Related pages</h2><div class="cluster-related-grid">' +
    links.map(function (l) {
      var href = l.href.indexOf('http') === 0 ? l.href : prefix + l.href.replace(/^\//, '');
      return '<a href="' + esc(href) + '" class="cluster-related-card"><strong>' + esc(l.title) + '</strong><span>' + esc(l.desc || '') + '</span></a>';
    }).join('') +
    '</div></div></section>'
  );
}

function renderFaq(faqs) {
  if (!faqs || !faqs.length) return '';
  return (
    '<section class="cluster-faq-section"><div class="container"><h2 class="cluster-h2">Frequently asked questions</h2><div class="cluster-faq">' +
    faqs.map(function (f) {
      return '<details><summary>' + esc(f.q) + '</summary><p>' + f.a + '</p></details>';
    }).join('') +
    '</div></div></section>'
  );
}

function renderPage(cfg) {
  var outRel = cfg.out;
  var prefix = relPrefix(outRel);
  var canonical = ORIGIN + cfg.canonical;
  var imgFolder = cfg.silo === 'mirror-profiles' ? 'mirror-profiles' : 'metal-louvers';
  var imgSrc = prefix + 'images/products/' + imgFolder + '/' + cfg.image;
  var ogImage = ORIGIN + '/images/products/' + imgFolder + '/' + cfg.image;
  var imgAlt = cfg.imageAlt || cfg.h1;
  var crumb = breadcrumbHtml(cfg.breadcrumb, prefix);
  var calc = (cfg.calcMode || (cfg.calcTypes && cfg.calcTypes.length)) ? renderCalc(cfg, prefix) : '';
  var hub = cfg.isHub ? renderHub(cfg, prefix) : '';
  var sections = renderSections(cfg);
  var eeat = renderEeat(cfg, prefix);
  var calcProducts = renderCalcProductLinks(cfg.calcProductLinks, prefix, cfg.calcProductLinksTitle);
  var faq = renderFaq(cfg.faqs);
  var related = cfg.isHub ? '' : renderRelated(cfg.internalLinks, prefix);
  var fj = faqJson(cfg.faqs);
  var hubList = mirrorHubItemListJson(cfg, canonical);

  return (
'<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
renderGa4Head(prefix) +
'  <meta charset="UTF-8" />\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />\n' +
'  <title>' + esc(cfg.title) + '</title>\n' +
'  <meta name="description" content="' + esc(cfg.description) + '" />\n' +
'  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />\n' +
'  <meta name="author" content="WoodenMax" />\n' +
'  <link rel="canonical" href="' + esc(canonical) + '" />\n' +
'  <link rel="preload" as="image" href="' + esc(ogImage) + '" />\n' +
'  <meta property="og:type" content="product" />\n' +
'  <meta property="og:title" content="' + esc(cfg.title) + '" />\n' +
'  <meta property="og:description" content="' + esc(cfg.description) + '" />\n' +
'  <meta property="og:url" content="' + esc(canonical) + '" />\n' +
'  <meta property="og:image" content="' + esc(ogImage) + '" />\n' +
'  <meta property="og:site_name" content="WoodenMax" />\n' +
'  <meta property="og:locale" content="en_IN" />\n' +
'  <meta name="twitter:card" content="summary_large_image" />\n' +
'  <meta name="twitter:title" content="' + esc(cfg.title) + '" />\n' +
'  <meta name="twitter:description" content="' + esc(cfg.description) + '" />\n' +
'  <meta name="twitter:image" content="' + esc(ogImage) + '" />\n' +
'  <link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">\n' +
'  <link rel="stylesheet" href="' + prefix + 'css/styles.css">\n' +
'  <link rel="stylesheet" href="' + prefix + 'css/product-pages-global.css">\n' +
'  <link rel="stylesheet" href="' + prefix + 'css/cluster-pages.css">\n' +
'  <link rel="stylesheet" href="' + prefix + 'css/catalog-seo.css">\n' +
'  <link rel="stylesheet" href="' + prefix + 'css/site-nav.css">\n' +
'  <link rel="stylesheet" href="' + prefix + 'css/site-footer.css">\n' +
'  <script type="application/ld+json">' + breadcrumbJson(cfg.breadcrumb, canonical) + '</script>\n' +
'  <script type="application/ld+json">' + productJson(cfg, canonical, ogImage) + '</script>\n' +
'  <script type="application/ld+json">' + localBusinessJson() + '</script>\n' +
(fj ? '  <script type="application/ld+json">' + fj + '</script>\n' : '') +
(hubList ? '  <script type="application/ld+json">' + hubList + '</script>\n' : '') +
'</head>\n<body class="cluster-page silo-' + esc(cfg.silo) + ' catalog-seo-page">\n' +
crumb + '\n' +
'<header class="cluster-hero' + (cfg.isHub && cfg.silo === 'mirror-profiles' ? ' cluster-hero--hub-slim' : '') + '">\n  <div class="container cluster-hero-grid">\n' +
'    <div class="cluster-hero-text">\n      <h1>' + esc(cfg.h1) + '</h1>\n' +
(cfg.heroSub ? '      <p class="cluster-hero-sub">' + esc(cfg.heroSub) + '</p>\n' : '') +
'      <div class="cluster-hero-cta">' + (cfg.isHub && cfg.silo === 'mirror-profiles'
      ? '<a href="#mirror-product-lines" class="cluster-cta-primary" data-ga-event="wm_cta_click">Browse mirror lines &rarr;</a><a href="' + prefix + 'contact?intent=mirror-quote" class="cluster-cta-secondary" data-ga-event="wm_cta_click">Get quote</a>'
      : (cfg.silo === 'mirror-profiles' ? '<a href="' + prefix + 'contact?intent=mirror-quote" class="cluster-cta-primary" data-ga-event="wm_cta_click">Get mirror quote &rarr;</a>' : '<a href="' + prefix + 'contact?intent=' + (cfg.silo === 'mirror-profiles' ? 'mirror' : 'louver') + '-quote" class="cluster-cta-primary" data-ga-event="wm_cta_click">Book free site visit &rarr;</a>')) + '</div>\n' +
'    </div>\n    <div class="cluster-hero-media"><figure class="cluster-hero-figure">' +
'<img class="catalog-hero-product-img" src="' + esc(imgSrc) + '" alt="' + esc(imgAlt) + '" width="800" height="600" loading="lazy" decoding="async">' +
(cfg.imageCaption ? '<figcaption class="cluster-hero-caption"><span class="cluster-hero-caption-text">' + esc(cfg.imageCaption) + '</span></figcaption>' : '') +
'</figure></div>\n  </div>\n</header>\n' +
(cfg.isHub ? (calc + '\n' + hub + '\n') : (calc + '\n')) +
sections + eeat + calcProducts + (cfg.isHub ? '' : hub) + faq + related +
'<section class="cluster-final-cta"><div class="container"><h2>Ready for a locked PDF quote?</h2>' +
'<p>' + (cfg.silo === 'mirror-profiles' ? 'Submit calculator details for a formal mirror BOQ. GST 18% extra. Dispatch in 7 working days after confirmation.' : 'WoodenMax visits free within 48 hours in Hyderabad, Delhi NCR &amp; Jaipur. GST 18% extra on all rates.') + '</p>' +
(cfg.silo === 'mirror-profiles' ? '<a href="' + prefix + 'contact?intent=mirror-quote&amp;source=' + esc(cfg.slug) + '" class="cluster-cta-primary" data-ga-event="wm_cta_click">Request formal quote &rarr;</a>' : '<a href="' + prefix + 'contact?intent=' + (cfg.silo === 'mirror-profiles' ? 'mirror' : 'louver') + '-quote&amp;source=' + esc(cfg.slug) + '" class="cluster-cta-primary" data-ga-event="wm_cta_click">Book free site visit &rarr;</a>') + '</div></section>\n' +
'  <script src="' + prefix + 'js/site-nav.js" defer></script>\n' +
'  <script src="' + prefix + 'js/site-footer.js" defer></script>\n' +
(cfg.calcMode ? '  <script src="' + prefix + 'js/mirror-rates-data.js" defer></script>\n' : '') +
(cfg.calcMode ? '  <script src="' + prefix + 'js/email-submitter.js" defer></script>\n' : '') +
'  <script src="' + prefix + 'js/catalog-quick-calc.js" defer></script>\n' +
'  <script defer src="' + prefix + 'js/analytics-events.js?v=20260521"></script>\n' +
(cfg.silo === 'mirror-profiles' ? '  <script defer src="' + prefix + 'js/mirror-page-analytics.js"></script>\n' : '') +
'  <script src="' + prefix + 'js/seo-enhancer.js" defer></script>\n' +
'</body>\n</html>\n'
  );
}

function buildPages(pages) {
  var n = 0;
  pages.forEach(function (cfg) {
    var outAbs = path.join(ROOT, cfg.out);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, renderPage(cfg), 'utf8');
    console.log('  ✓', cfg.out);
    n++;
  });
  return n;
}

function writeMirrorRatesJs() {
  var ratesPath = path.join(ROOT, 'data', 'rates.json');
  var data = JSON.parse(fs.readFileSync(ratesPath, 'utf8')).mirror_profiles;
  if (!data) throw new Error('rates.json missing mirror_profiles section');
  var outPath = path.join(ROOT, 'js', 'mirror-rates-data.js');
  var body = '/* Auto-generated from data/rates.json → mirror_profiles — run: node tools/build-catalog-seo-pages.cjs */\n' +
    'window.WM_MIRROR_RATES=' + JSON.stringify({
      hardware: data.hardware,
      calculators: data.calculators,
      profileColors: data.profileColors,
    }) + ';\n';
  fs.writeFileSync(outPath, body, 'utf8');
  console.log('  ✓ js/mirror-rates-data.js (from rates.json → mirror_profiles)');
}

function main() {
  var only = process.argv[2];
  console.log('\n[BUILD] Catalog SEO pages\n');
  writeMirrorRatesJs();
  var total = 0;
  if (!only || only === '--mirror') total += buildPages(mirrorManifest.pages);
  if (!only || only === '--louvers') total += buildPages(louverManifest.pages);
  console.log('\nDone: ' + total + ' pages.\n');
}

main();
