/**
 * tools/build-cluster-page.cjs
 *
 * Config-driven page generator for the WoodenMax 16-silo authority cluster.
 *
 * Each page is one JS config file under `tools/page-data/<silo>/<slug>.js`.
 * The config exports a single `pageConfig` object describing every block
 * the page needs:
 *
 *   {
 *     slug, silo, title, description, canonical,
 *     ogImage, breadcrumb, h1, hero, sections, faqs,
 *     internalLinks, schemaType, lastUpdated
 *   }
 *
 * Run:
 *   node tools/build-cluster-page.cjs <relative-config-path>
 *   node tools/build-cluster-page.cjs --all
 *
 * Output:
 *   The rendered HTML page is written to its `out` path
 *   (defaults to <slug under products/<silo>/>.html).
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ----------------------------------------------------------------------
//  Template render helpers
// ----------------------------------------------------------------------
function esc (s) {
  return String(s == null ? '' : s)
    .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function relPrefix (outRelPath) {
  // outRelPath is something like "products/aluminium-windows/foo.html"
  const depth = outRelPath.split('/').length - 1;
  return depth <= 0 ? '' : '../'.repeat(depth);
}

function renderBreadcrumbHtml (crumbs, prefix) {
  return (
    '<nav class="cluster-breadcrumb" aria-label="Breadcrumb">' +
      '<div class="container">' +
        crumbs.map(function (c, i) {
          var isLast = (i === crumbs.length - 1);
          var href = null;
          if (c.href && !isLast) {
            if (c.href.indexOf('http') === 0) href = c.href;
            else href = prefix + c.href.replace(/^\//, '');
          }
          return isLast
            ? '<strong>' + esc(c.label) + '</strong>'
            : '<a href="' + esc(href) + '">' + esc(c.label) + '</a>' +
              '<span aria-hidden="true"> &rsaquo; </span>';
        }).join('') +
      '</div>' +
    '</nav>'
  );
}

function renderBreadcrumbJsonLd (crumbs, originUrl, canonicalUrl) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': crumbs.map(function (c, i) {
      var isLast = (i === crumbs.length - 1);
      var item;
      if (isLast) {
        item = canonicalUrl;
      } else if (c.href) {
        item = c.href.indexOf('http') === 0
          ? c.href
          : originUrl + '/' + c.href.replace(/^\//, '');
      } else {
        item = canonicalUrl;
      }
      return {
        '@type': 'ListItem',
        'position': i + 1,
        'name': c.label,
        'item': item
      };
    })
  });
}

function renderFaqJsonLd (faqs) {
  if (!faqs || !faqs.length) return null;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(function (f) {
      return {
        '@type': 'Question',
        'name': f.q,
        'acceptedAnswer': { '@type': 'Answer', 'text': f.a }
      };
    })
  });
}

function renderPersonJsonLd (person, originUrl) {
  if (!person) return null;
  // EEAT — real named human authorship signal for Google.  Used on
  // founder-story, team-leadership and any blog post authored by a
  // named individual.
  var img = person.image || '';
  if (img && img.indexOf('http') !== 0) {
    img = originUrl + '/' + img.replace(/^\//, '');
  }
  var json = {
    '@context': 'https://schema.org',
    '@type':    'Person',
    'name':     person.name,
    'givenName':  person.givenName  || (person.name ? person.name.split(' ')[0] : undefined),
    'familyName': person.familyName || (person.name ? person.name.split(' ').slice(1).join(' ') : undefined),
    'jobTitle': person.jobTitle,
    'description': person.description,
    'image': img || undefined,
    'worksFor': person.worksFor ? {
      '@type': 'Organization',
      'name':  typeof person.worksFor === 'string' ? person.worksFor : person.worksFor.name,
      'url':   (typeof person.worksFor === 'object' && person.worksFor.url) || originUrl
    } : undefined,
    'url': person.url || (originUrl + '/about/founder-story-woodenmax'),
    'sameAs':     person.sameAs     || undefined,
    'knowsAbout': person.knowsAbout || undefined,
    'alumniOf':   person.alumniOf   || undefined,
    'birthPlace': person.birthPlace || undefined,
    'nationality': person.nationality || undefined,
    'address': person.address || undefined
  };
  Object.keys(json).forEach(function (k) {
    if (json[k] == null || json[k] === '') delete json[k];
  });
  return JSON.stringify(json);
}

function renderArticleJsonLd (cfg, originUrl) {
  // Use the named author (if provided) — stronger EEAT than a faceless
  // org byline.  Falls back to the organisation otherwise.
  var author;
  if (cfg.person && cfg.person.name) {
    var pImg = cfg.person.image || '';
    if (pImg && pImg.indexOf('http') !== 0) {
      pImg = originUrl + '/' + pImg.replace(/^\//, '');
    }
    author = {
      '@type':    'Person',
      'name':     cfg.person.name,
      'jobTitle': cfg.person.jobTitle,
      'url':      cfg.person.url || (originUrl + '/about/founder-story-woodenmax'),
      'image':    pImg || undefined,
      'worksFor': {
        '@type': 'Organization',
        'name': 'WoodenMax',
        'url':  'https://woodenmax.in'
      }
    };
    Object.keys(author).forEach(function (k) { if (author[k] == null) delete author[k]; });
  } else {
    author = {
      '@type': 'Organization',
      'name': 'WoodenMax',
      'url': 'https://woodenmax.in'
    };
  }
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': cfg.schemaType || 'Article',
    'headline': cfg.title,
    'description': cfg.description,
    'image': cfg.ogImage,
    'datePublished': cfg.datePublished || '2026-05-18',
    'dateModified': cfg.lastUpdated || new Date().toISOString().split('T')[0],
    'author': author,
    'publisher': {
      '@type': 'Organization',
      'name': 'WoodenMax',
      'url': 'https://woodenmax.in',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://woodenmax.in/images/woodenmax-logo.webp'
      }
    },
    'mainEntityOfPage': originUrl + '/' + cfg.canonical.replace(/^\//, '')
  });
}

function renderSection (s) {
  // Section shape: { heading, body (markdown-like html), image?: {src, alt, type}, list?: [], table?: {head, rows}, cards?: [], callout?: {} }
  var html = '<section class="cluster-section" id="' + esc((s.id || s.heading || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '">';
  html += '<div class="container">';

  if (s.heading) {
    html += '<h2 class="cluster-h2">' + esc(s.heading) + '</h2>';
  }
  if (s.subheading) {
    html += '<p class="cluster-sub">' + esc(s.subheading) + '</p>';
  }
  if (s.image) {
    html += '<figure class="cluster-fig">' +
              '<img src="' + esc(s.image.src) + '" alt="' + esc(s.image.alt || s.heading || '') + '" width="' + (s.image.w || 1200) + '" height="' + (s.image.h || 750) + '" loading="lazy" decoding="async">' +
              (s.image.caption ? '<figcaption>' + esc(s.image.caption) + '</figcaption>' : '') +
            '</figure>';
  }
  if (s.body) {
    html += '<div class="cluster-body">' + s.body + '</div>'; // raw HTML allowed
  }
  if (s.list) {
    html += '<ul class="cluster-list">' +
            s.list.map(function (li) { return '<li>' + li + '</li>'; }).join('') +
            '</ul>';
  }
  if (s.table) {
    html += '<div class="cluster-table-wrap"><table class="cluster-table">' +
              '<thead><tr>' + s.table.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead>' +
              '<tbody>' +
                s.table.rows.map(function (r) {
                  return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
                }).join('') +
              '</tbody>' +
            '</table></div>';
  }
  if (s.cards) {
    html += '<div class="cluster-cards">' +
            s.cards.map(function (c) {
              var head = '';
              if (c.photo) {
                // EEAT — real human photo instead of an alphabet icon
                var src = c.photo.src || c.photo;
                var alt = c.photo.alt || (c.title || '') + ' photo';
                var w   = c.photo.w   || 320;
                var h   = c.photo.h   || 320;
                head = '<div class="cluster-card-photo">' +
                         '<img src="' + esc(src) + '" alt="' + esc(alt) +
                         '" width="' + w + '" height="' + h +
                         '" loading="lazy" decoding="async">' +
                       '</div>';
              } else if (c.icon) {
                head = '<div class="cluster-card-icon">' + c.icon + '</div>';
              }
              return '<div class="cluster-card' + (c.photo ? ' cluster-card-has-photo' : '') + '">' +
                       head +
                       (c.title    ? '<h3>'      + esc(c.title)    + '</h3>'      : '') +
                       (c.subtitle ? '<div class="cluster-card-subtitle">' + esc(c.subtitle) + '</div>' : '') +
                       (c.body     ? '<p>'       + c.body          + '</p>'       : '') +
                       (c.meta     ? '<div class="cluster-card-meta">' + c.meta + '</div>' : '') +
                     '</div>';
            }).join('') +
            '</div>';
  }
  if (s.callout) {
    html += '<aside class="cluster-callout cluster-callout-' + esc(s.callout.tone || 'info') + '">' +
              '<strong>' + esc(s.callout.title || '') + '</strong>' +
              '<div>' + s.callout.body + '</div>' +
            '</aside>';
  }
  if (s.cta) {
    html += '<div class="cluster-cta-block"><a href="' + esc(s.cta.href) + '" class="cluster-cta-link">' + esc(s.cta.label) + ' &rarr;</a></div>';
  }

  html += '</div></section>';
  return html;
}

function renderFaqHtml (faqs) {
  if (!faqs || !faqs.length) return '';
  return (
    '<section class="cluster-faq-section">' +
      '<div class="container">' +
        '<h2 class="cluster-h2">Frequently asked questions</h2>' +
        '<div class="cluster-faq">' +
          faqs.map(function (f) {
            return '<details><summary>' + esc(f.q) + '</summary><p>' + f.a + '</p></details>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</section>'
  );
}

function renderInternalLinksRail (links, prefix) {
  if (!links || !links.length) return '';
  return (
    '<section class="cluster-related-section">' +
      '<div class="container">' +
        '<h2 class="cluster-h2">Related WoodenMax pages</h2>' +
        '<div class="cluster-related-grid">' +
          links.map(function (l) {
            var href = l.href.indexOf('http') === 0
              ? l.href
              : prefix + l.href.replace(/^\//, '');
            return '<a href="' + esc(href) + '" class="cluster-related-card">' +
                     '<strong>' + esc(l.title) + '</strong>' +
                     '<span>' + esc(l.desc || '') + '</span>' +
                   '</a>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</section>'
  );
}

// ----------------------------------------------------------------------
//  Master template
// ----------------------------------------------------------------------
function renderPage (cfg, outRelPath) {
  const prefix = relPrefix(outRelPath);
  const originUrl = 'https://woodenmax.in';
  const canonical = originUrl + (cfg.canonical || ('/' + outRelPath.replace(/\.html$/, '')));

  const crumbHtml = renderBreadcrumbHtml(cfg.breadcrumb, prefix);
  const crumbJson = renderBreadcrumbJsonLd(cfg.breadcrumb, originUrl, canonical);
  const faqJson   = renderFaqJsonLd(cfg.faqs);
  const articleJson = renderArticleJsonLd(cfg, originUrl);
  const personJson  = renderPersonJsonLd(cfg.person, originUrl);

  const sectionsHtml = (cfg.sections || []).map(renderSection).join('\n');
  const faqHtml = renderFaqHtml(cfg.faqs);
  const relatedHtml = renderInternalLinksRail(cfg.internalLinks, prefix);

  return (
'<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'  <meta charset="UTF-8" />\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />\n' +
'  <title>' + esc(cfg.title) + '</title>\n' +
'  <meta name="description" content="' + esc(cfg.description) + '" />\n' +
'  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />\n' +
'  <meta name="theme-color" content="#1E40AF" />\n' +
'  <link rel="canonical" href="' + esc(canonical) + '" />\n' +
'  ' + (cfg.ogImage ? '<link rel="preload" as="image" href="' + esc(cfg.ogImage) + '" />' : '') + '\n' +

'  <meta property="og:type" content="' + (cfg.schemaType === 'Product' ? 'product' : 'article') + '" />\n' +
'  <meta property="og:title" content="' + esc(cfg.title) + '" />\n' +
'  <meta property="og:description" content="' + esc(cfg.description) + '" />\n' +
'  <meta property="og:url" content="' + esc(canonical) + '" />\n' +
'  ' + (cfg.ogImage ? '<meta property="og:image" content="' + esc(cfg.ogImage) + '" />' : '') + '\n' +
'  <meta property="og:site_name" content="WoodenMax" />\n' +
'  <meta property="og:locale" content="en_IN" />\n' +

'  <meta name="twitter:card" content="summary_large_image" />\n' +
'  <meta name="twitter:title" content="' + esc(cfg.title) + '" />\n' +
'  <meta name="twitter:description" content="' + esc(cfg.description) + '" />\n' +
'  ' + (cfg.ogImage ? '<meta name="twitter:image" content="' + esc(cfg.ogImage) + '" />' : '') + '\n' +

'  <link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">\n' +

'  <link rel="stylesheet" href="' + prefix + 'css/styles.css">\n' +
'  <link rel="stylesheet" href="' + prefix + 'css/product-pages-global.css">\n' +
'  <link rel="stylesheet" href="' + prefix + 'css/calculator-mobile-ux.css">\n' +
'  <link rel="stylesheet" href="' + prefix + 'css/cluster-pages.css">\n' +
'  <link rel="stylesheet" href="' + prefix + 'css/site-nav.css">\n' +
'  <link rel="stylesheet" href="' + prefix + 'css/site-footer.css">\n' +

'  <script type="application/ld+json">' + crumbJson + '</script>\n' +
'  <script type="application/ld+json">' + articleJson + '</script>\n' +
(faqJson ? '  <script type="application/ld+json">' + faqJson + '</script>\n' : '') +
(personJson ? '  <script type="application/ld+json">' + personJson + '</script>\n' : '') +

'</head>\n' +
'<body class="cluster-page silo-' + esc(cfg.silo || 'misc') + '">\n' +

  crumbHtml + '\n' +

  '<header class="cluster-hero">\n' +
  '  <div class="container cluster-hero-grid">\n' +
  '    <div class="cluster-hero-text">\n' +
  '      <h1>' + esc(cfg.h1 || cfg.title) + '</h1>\n' +
  '      ' + (cfg.hero && cfg.hero.sub ? '<p class="cluster-hero-sub">' + esc(cfg.hero.sub) + '</p>' : '') + '\n' +
  '      ' + (cfg.hero && cfg.hero.points
        ? '<ul class="cluster-hero-points">' + cfg.hero.points.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>'
        : '') + '\n' +
  '      <div class="cluster-hero-cta">\n' +
  '        ' + (cfg.hero && cfg.hero.cta
              ? '<a href="' + esc(cfg.hero.cta.href) + '" class="cluster-cta-primary">' + esc(cfg.hero.cta.label) + ' &rarr;</a>'
              : '<a href="' + prefix + 'contact?intent=site-visit" class="cluster-cta-primary">Book free site visit &rarr;</a>') + '\n' +
  '      </div>\n' +
  '    </div>\n' +
  '    ' + (cfg.hero && cfg.hero.image
        ? (function () {
            var im = cfg.hero.image;
            // Semantics:
            //   placeholder:true  → we still need to shoot a real photo
            //                       (renders data-real-needed for the QC pass)
            //   real:true / default → this IS the real photo (no flag)
            // (legacy: configs still using `real:true` to mean "need real"
            //  must migrate to `placeholder:true` — flagged below.)
            var needsReal = im.placeholder === true;
            var imgTag = '<img src="' + esc(im.src) + '" alt="' + esc(im.alt) +
                         '" width="' + (im.w || 1200) + '" height="' + (im.h || 750) +
                         '"' + (needsReal ? ' data-real-needed="true"' : '') + '>';
            var captionTag = '';
            if (im.caption || im.credit) {
              captionTag = '<figcaption class="cluster-hero-caption">' +
                            (im.caption ? '<span class="cluster-hero-caption-text">' + esc(im.caption) + '</span>' : '') +
                            (im.credit  ? '<span class="cluster-hero-caption-credit">' + esc(im.credit)  + '</span>' : '') +
                          '</figcaption>';
              return '<div class="cluster-hero-media"><figure class="cluster-hero-figure">' + imgTag + captionTag + '</figure></div>';
            }
            return '<div class="cluster-hero-media">' + imgTag + '</div>';
          })()
        : '<div class="cluster-hero-media cluster-hero-gfx">' + (cfg.hero && cfg.hero.gfx ? cfg.hero.gfx : '') + '</div>') + '\n' +
  '  </div>\n' +
  '</header>\n' +

  sectionsHtml + '\n' +
  faqHtml + '\n' +
  relatedHtml + '\n' +

  '<section class="cluster-final-cta">\n' +
  '  <div class="container">\n' +
  '    <h2>Ready to lock down a final binding quote?</h2>\n' +
  '    <p>WoodenMax engineers visit free within 48 hours, measure on site, and share a locked PDF quote with GST &amp; transport pre-confirmed.</p>\n' +
  '    <a href="' + prefix + 'contact?intent=site-visit&amp;source=' + esc(cfg.slug || '') + '" class="cluster-cta-primary">Book free site visit &rarr;</a>\n' +
  '    <p class="cluster-final-trust">GST 18% extra &bull; Free transport on &#8377;15L+ orders &le; 1,000 km from Hyderabad &bull; <a href="' + prefix + 'policies/gst-transport-policy">policy</a></p>\n' +
  '  </div>\n' +
  '</section>\n' +

'  <script src="' + prefix + 'js/site-nav.js" defer></script>\n' +
'  <script src="' + prefix + 'js/site-footer.js" defer></script>\n' +
'  <script src="' + prefix + 'js/seo-enhancer.js" defer></script>\n' +
'</body>\n' +
'</html>\n'
  );
}

// ----------------------------------------------------------------------
//  Build runner
// ----------------------------------------------------------------------
function buildOne (configPath) {
  const abs = path.resolve(ROOT, configPath);
  if (!fs.existsSync(abs)) {
    console.error('✗ Config not found:', configPath);
    return false;
  }
  delete require.cache[require.resolve(abs)];
  const mod = require(abs);
  const cfg = mod.pageConfig || mod;

  if (!cfg.out) {
    console.error('✗', configPath, 'missing pageConfig.out');
    return false;
  }
  const outAbs = path.resolve(ROOT, cfg.out);
  const outRel = path.relative(ROOT, outAbs).split(path.sep).join('/');
  const dir = path.dirname(outAbs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outAbs, renderPage(cfg, outRel), 'utf8');
  console.log('  ✓', outRel);
  return true;
}

function walkConfigs (dir, out) {
  out = out || [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkConfigs(p, out);
    else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.startsWith('_')) out.push(p);
  }
  return out;
}

function main () {
  const args = process.argv.slice(2);
  let configs = [];
  if (args[0] === '--all' || args.length === 0) {
    const base = path.join(ROOT, 'tools', 'page-data');
    if (!fs.existsSync(base)) {
      console.error('No tools/page-data/ folder found. Create configs first.');
      process.exit(1);
    }
    configs = walkConfigs(base);
  } else {
    configs = args;
  }

  console.log(`\n[BUILD] ${configs.length} cluster pages.\n`);
  let ok = 0;
  for (const c of configs) {
    if (buildOne(c)) ok++;
  }
  console.log(`\nDone: ${ok}/${configs.length} pages built.`);
}

main();
