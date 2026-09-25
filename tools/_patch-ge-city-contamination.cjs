/**
 * Surgical patch: rewrite contaminated Glass Elevation city-price HTML from
 * the fixed money-page factory — preserves polished shell (CSS, nav, schema
 * wrappers, city-hub banner) while swapping product copy + calc CTA.
 *
 * Usage: node tools/_patch-ge-city-contamination.cjs
 */
const fs = require('fs');
const path = require('path');
const makeCityPage = require('./page-data/money/_make-city-page.js');

const ROOT = path.resolve(__dirname, '..');
const CITIES = [
  'bangalore',
  'chandigarh',
  'delhi',
  'mumbai',
  'pune',
  'vijayawada',
  'visakhapatnam',
  'warangal'
];

function esc (s) {
  return String(s == null ? '' : s)
    .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSection (s) {
  var html = '<section class="cluster-section" id="' + esc((s.id || s.heading || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '">';
  html += '<div class="container">';
  if (s.heading) html += '<h2 class="cluster-h2">' + esc(s.heading) + '</h2>';
  if (s.body) html += '<div class="cluster-body">' + s.body + '</div>';
  if (s.list) {
    html += '<ul class="cluster-list">' + s.list.map(function (li) { return '<li>' + li + '</li>'; }).join('') + '</ul>';
  }
  if (s.table) {
    html += '<div class="cluster-table-wrap"><table class="cluster-table">' +
      '<thead><tr>' + s.table.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead>' +
      '<tbody>' +
      s.table.rows.map(function (r) {
        return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
      }).join('') +
      '</tbody></table></div>';
  }
  if (s.cards) {
    html += '<div class="cluster-cards">' +
      s.cards.map(function (c) {
        return '<div class="cluster-card"><div class="cluster-card-icon">' + c.icon + '</div>' +
          (c.title ? '<h3>' + esc(c.title) + '</h3>' : '') +
          (c.body ? '<p>' + c.body + '</p>' : '') +
          '</div>';
      }).join('') +
      '</div>';
  }
  if (s.callout) {
    html += '<aside class="cluster-callout cluster-callout-' + esc(s.callout.tone || 'info') + '">' +
      '<strong>' + esc(s.callout.title || '') + '</strong>' +
      '<div>' + s.callout.body + '</div></aside>';
  }
  html += '</div></section>';
  return html;
}

function renderFaqHtml (faqs) {
  return (
    '<section class="cluster-faq-section"><div class="container"><h2 class="cluster-h2">Frequently asked questions</h2><div class="cluster-faq">' +
    faqs.map(function (f) {
      return '<details><summary>' + esc(f.q) + '</summary><p>' + f.a + '</p></details>';
    }).join('') +
    '</div></div></section>'
  );
}

function renderRelated (links) {
  return (
    '<section class="cluster-related-section"><div class="container"><h2 class="cluster-h2">Related WoodenMax pages</h2><div class="cluster-related-grid">' +
    links.map(function (l) {
      return '<a href="' + esc(l.href) + '" class="cluster-related-card">' +
        '<strong>' + esc(l.title) + '</strong>' +
        '<span>' + esc(l.desc || '') + '</span></a>';
    }).join('') +
    '</div></div></section>'
  );
}

function renderFaqJsonLd (faqs) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(function (f) {
      return {
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      };
    })
  });
}

function replaceDescriptionAttrs (html, desc) {
  const safe = esc(desc);
  html = html.replace(/<meta name="description" content="[^"]*" \/>/, '<meta name="description" content="' + safe + '" />');
  html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, '<meta property="og:description" content="' + safe + '" />');
  html = html.replace(/<meta name="twitter:description" content="[^"]*" \/>/, '<meta name="twitter:description" content="' + safe + '" />');
  // WebPage schema description (pretty-printed block)
  html = html.replace(/("description":\s*")Live aluminium window price[^"]*(")/g, '$1' + desc.replace(/"/g, '\\"') + '$2');
  // Product schema description inside minified JSON-LD
  html = html.replace(/("description":"Live aluminium window price[^"]*")/g, '"description":"' + desc.replace(/"/g, '\\"') + '"');
  return html;
}

function replaceFaqJsonLd (html, faqs) {
  const json = renderFaqJsonLd(faqs);
  return html.replace(
    /<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"FAQPage",[\s\S]*?<\/script>/,
    '<script type="application/ld+json">' + json + '</script>'
  );
}

function replaceCalcCta (html, cfg) {
  const href = cfg.hero.cta.href;
  const label = cfg.hero.cta.label;
  // Existing polished pages may have hub-anchor or wrong calc links.
  html = html.replace(
    /<a href="[^"]*glass[^"]*calculator[^"]*" class="cluster-cta-primary">[^<]*<\/a>/i,
    '<a href="' + esc(href) + '" class="cluster-cta-primary">' + esc(label) + ' &rarr;</a>'
  );
  html = html.replace(
    /<a href="\/products\/glass-elevation#glass-calculator" class="cluster-cta-primary">[^<]*<\/a>/,
    '<a href="' + esc(href) + '" class="cluster-cta-primary">' + esc(label) + ' &rarr;</a>'
  );
  return html;
}

function replaceSectionsBlock (html, cfg) {
  const sectionsHtml = cfg.sections.map(renderSection).join('\n');
  const faqHtml = renderFaqHtml(cfg.faqs);
  const relatedHtml = renderRelated(cfg.internalLinks);

  // From first price-band section through related rail (before final CTA).
  const re = /<section class="cluster-section" id="[^"]*price-band[\s\S]*?<section class="cluster-final-cta">/;
  if (!re.test(html)) {
    throw new Error('Could not locate sections block to replace');
  }
  return html.replace(re, sectionsHtml + '\n' + faqHtml + '\n' + relatedHtml + '\n<section class="cluster-final-cta">');
}

function patchOne (citySlug) {
  const cfg = makeCityPage(citySlug, 'glass-elevation');
  // Absolute related links to match polished pages
  cfg.internalLinks = cfg.internalLinks.map(function (l) {
    return Object.assign({}, l, {
      href: l.href.indexOf('http') === 0 ? l.href : l.href
    });
  });
  // Fix GST policy link to absolute (polished pages use /policies/...)
  cfg.sections = cfg.sections.map(function (s) {
    if (!s.body) return s;
    return Object.assign({}, s, {
      body: s.body.replace(/\.\/\.\/policies\/gst-transport-policy/g, '/policies/gst-transport-policy')
    });
  });

  const rel = path.join('products', 'glass-elevation', 'glass-elevation-price-' + citySlug + '.html');
  const abs = path.join(ROOT, rel);
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;

  html = replaceDescriptionAttrs(html, cfg.description);
  html = replaceFaqJsonLd(html, cfg.faqs);
  html = replaceCalcCta(html, cfg);
  html = replaceSectionsBlock(html, cfg);

  if (html === before) {
    console.log('= unchanged', rel);
    return false;
  }
  fs.writeFileSync(abs, html, 'utf8');
  console.log('✓ patched', rel);
  return true;
}

let n = 0;
for (const city of CITIES) {
  if (patchOne(city)) n++;
}
console.log('done:', n, 'of', CITIES.length, 'updated');
