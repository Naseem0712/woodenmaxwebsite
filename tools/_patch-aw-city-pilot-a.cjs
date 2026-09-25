/**
 * City Differentiation Pilot A — patch Bengaluru + Mumbai AW money pages.
 * Preserves polished shell (CSS, nav, schema wrappers, city-hub banner, H1,
 * title, canonical). Swaps hero sub/points/CTA, sections, FAQ, related rail,
 * and description meta to differentiated configs.
 *
 * Usage: node tools/_patch-aw-city-pilot-a.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = [
  {
    config: './page-data/money/aluminium-window-price-bangalore.js',
    html: 'products/aluminium-windows/aluminium-window-price-bangalore.html'
  },
  {
    config: './page-data/money/aluminium-window-price-mumbai.js',
    html: 'products/aluminium-windows/aluminium-window-price-mumbai.html'
  }
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
  var id = (s.id || s.heading || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  var html = '<section class="cluster-section" id="' + esc(id) + '">';
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
        acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') }
      };
    })
  });
}

function replaceDescriptionAttrs (html, desc) {
  const safe = esc(desc);
  html = html.replace(/<meta name="description" content="[^"]*" \/>/, '<meta name="description" content="' + safe + '" />');
  html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, '<meta property="og:description" content="' + safe + '" />');
  html = html.replace(/<meta name="twitter:description" content="[^"]*" \/>/, '<meta name="twitter:description" content="' + safe + '" />');
  const jsonSafe = desc.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  html = html.replace(/("description":\s*")[^"]*(")/g, function (m, a, b) {
    // Only touch descriptions that look like page meta (aluminium window price…)
    if (/Aluminium window price|Live aluminium window price/i.test(m) || /from ₹550/.test(m)) {
      return a + jsonSafe + b;
    }
    return m;
  });
  html = html.replace(/("description":")[^"]*(")/g, function (m, a, b) {
    if (/Aluminium window price|Live aluminium window price|from ₹550/i.test(m)) {
      return a + jsonSafe + b;
    }
    return m;
  });
  return html;
}

function replaceFaqJsonLd (html, faqs) {
  const json = renderFaqJsonLd(faqs);
  return html.replace(
    /<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"FAQPage",[\s\S]*?<\/script>/,
    '<script type="application/ld+json">' + json + '</script>'
  );
}

function replaceHero (html, cfg) {
  html = html.replace(
    /<p class="cluster-hero-sub">[\s\S]*?<\/p>/,
    '<p class="cluster-hero-sub">' + esc(cfg.hero.sub) + '</p>'
  );
  html = html.replace(
    /<ul class="cluster-hero-points">[\s\S]*?<\/ul>/,
    '<ul class="cluster-hero-points">' +
      cfg.hero.points.map(function (p) { return '<li>' + p + '</li>'; }).join('') +
      '</ul>'
  );
  html = html.replace(
    /(<div class="cluster-hero-cta">\s*)<a href="[^"]*" class="cluster-cta-primary">[^<]*<\/a>/,
    '$1<a href="' + esc(cfg.hero.cta.href) + '" class="cluster-cta-primary">' + esc(cfg.hero.cta.label) + ' &rarr;</a>'
  );
  return html;
}

function replaceSectionsBlock (html, cfg) {
  const sectionsHtml = cfg.sections.map(renderSection).join('\n');
  const faqHtml = renderFaqHtml(cfg.faqs);
  const relatedHtml = renderRelated(cfg.internalLinks);
  const re = /<section class="cluster-section"[\s\S]*?<section class="cluster-final-cta">/;
  if (!re.test(html)) {
    throw new Error('Could not locate sections block to replace');
  }
  return html.replace(re, sectionsHtml + '\n' + faqHtml + '\n' + relatedHtml + '\n<section class="cluster-final-cta">');
}

function patchOne (target) {
  delete require.cache[require.resolve(target.config)];
  const cfg = require(target.config).pageConfig;
  const abs = path.join(ROOT, target.html);
  let html = fs.readFileSync(abs, 'utf8');

  // Guard: never touch H1 / title / canonical in this pilot
  const h1Before = (html.match(/<h1>[^<]*<\/h1>/) || [])[0];
  const titleBefore = (html.match(/<title>[^<]*<\/title>/) || [])[0];
  const canonicalBefore = (html.match(/<link rel="canonical"[^>]*>/) || [])[0];

  html = replaceDescriptionAttrs(html, cfg.description);
  html = replaceFaqJsonLd(html, cfg.faqs);
  html = replaceHero(html, cfg);
  html = replaceSectionsBlock(html, cfg);

  const h1After = (html.match(/<h1>[^<]*<\/h1>/) || [])[0];
  const titleAfter = (html.match(/<title>[^<]*<\/title>/) || [])[0];
  const canonicalAfter = (html.match(/<link rel="canonical"[^>]*>/) || [])[0];
  if (h1Before !== h1After || titleBefore !== titleAfter || canonicalBefore !== canonicalAfter) {
    throw new Error('Protected identity changed for ' + target.html);
  }

  fs.writeFileSync(abs, html, 'utf8');
  console.log('✓ patched', target.html);
}

for (const t of TARGETS) patchOne(t);
console.log('Pilot A patch complete');
