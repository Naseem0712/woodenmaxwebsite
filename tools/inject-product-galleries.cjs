/**
 * Inject multi-photo product galleries into pages that only have a single main image.
 * Matches the shared .product-image-gallery + .product-thumbnail-gallery pattern.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const GALLERIES = {
  'products/shower-partitions/frameless-shower-partition.html': [
    {
      src: '/images/products/shower-partitions/frameless-shower-glass-door-openable-sliding-india.webp',
      alt: 'Frameless shower glass door with 10mm toughened glass'
    },
    {
      src: '/images/products/Frameless Shower/frameless-glass-shower-design.webp',
      alt: 'Frameless glass shower design — clear toughened glass enclosure'
    },
    {
      src: '/images/products/Frameless Shower/minimal-shower-glass-pane.webp',
      alt: 'Minimal frameless shower glass pane — profile-less look'
    },
    {
      src: '/images/products/Fixed Glass Shower Panel/frameless-fixed-shower-glass.webp',
      alt: 'Frameless fixed shower glass panel — walk-in style'
    },
    {
      src: '/images/products/Corner Shower Partition/corner-glass-shower-partition.webp',
      alt: 'Corner frameless glass shower partition — L-shape layout'
    },
    {
      src: '/images/products/Glass Shower Partition Price/frameless-shower-partition-glass.webp',
      alt: 'Frameless shower partition glass — bathroom installation'
    }
  ],
  'products/shower-partitions/black-profile-shower-partition.html': [
    {
      src: '/images/products/shower-partitions/black-profile-shower-glass-partition.webp',
      alt: 'Black profile soft-close sliding shower glass partition'
    },
    {
      src: '/images/products/Sliding Shower Door/sliding-glass-shower-door-design.webp',
      alt: 'Black profile sliding glass shower door design'
    },
    {
      src: '/images/products/Sliding Shower Door/shower-door-track-system-detail.webp',
      alt: 'Shower door soft-close track system detail'
    },
    {
      src: '/images/products/shower-partitions/premium-black-profile-bathroom-shower-glass-sliding-soft-close-door.webp',
      alt: 'Premium black profile bathroom shower glass door'
    },
    {
      src: '/images/products/Glass Shower Partition Price/glass-shower-partition-modern-bathroom.webp',
      alt: 'Modern bathroom black profile glass shower partition'
    },
    {
      src: '/images/products/Shower Design Page/luxury-bathroom-shower-glass.webp',
      alt: 'Luxury bathroom shower glass with black profile'
    }
  ],
  'products/shower-partitions/premium-black-profile-shower.html': [
    {
      src: '/images/products/shower-partitions/premium-black-profile-bathroom-shower-glass-sliding-soft-close-door.webp',
      alt: 'Premium black profile openable shower with slim aluminium frame'
    },
    {
      src: '/images/products/shower-partitions/black-profile-shower-glass-partition.webp',
      alt: 'Black profile shower glass partition — slim aluminium frame'
    },
    {
      src: '/images/products/Sliding Shower Door/sliding-glass-shower-door-design.webp',
      alt: 'Premium sliding glass shower door — soft-close hardware'
    },
    {
      src: '/images/products/Shower Design Page/luxury-bathroom-shower-glass.webp',
      alt: 'Luxury bathroom shower glass — premium black profile'
    },
    {
      src: '/images/products/Shower Design Page/modern-bathroom-shower-design.webp',
      alt: 'Modern bathroom shower design with black aluminium profile'
    },
    {
      src: '/images/products/Shower Enclosure/glass-shower-enclosure-bathroom.webp',
      alt: 'Glass shower enclosure bathroom — premium black frame'
    }
  ],
  'products/shower-partitions/frosted-glass-bathroom-door.html': [
    {
      src: '/images/products/shower-partitions/frosted-glass-bathroom-door-aluminium-frame-openable-india.webp',
      alt: 'Frosted glass fold and slide bathroom door with 95% opening'
    },
    {
      src: '/images/products/fold-sliding-window-pic/fold-sliding-window-system-slim-aluminium-profiles.webp',
      alt: 'Fold and slide aluminium glass door — slim profiles'
    },
    {
      src: '/images/products/Glass Types/bathroom-glass-options.webp',
      alt: 'Bathroom frosted and clear glass options'
    },
    {
      src: '/images/products/Small Bathroom Shower/small-bathroom-glass-shower.webp',
      alt: 'Small bathroom frosted glass shower partition'
    },
    {
      src: '/images/products/Shower Enclosure/corner-shower-enclosure-design.webp',
      alt: 'Corner shower enclosure with frosted privacy glass'
    },
    {
      src: '/images/products/Framed vs Frameless/framed-vs-frameless-shower.webp',
      alt: 'Framed frosted glass bathroom door vs frameless comparison'
    }
  ],
  'products/shower-partitions/slim-frame-shower-partition.html': [
    {
      src: '/images/products/shower-partitions/slim-gold-profile-fluted-shower-glass-partition.webp',
      alt: 'Slim gold profile fluted shower glass partition'
    },
    {
      src: '/images/products/Shower Design Page/luxury-bathroom-shower-glass.webp',
      alt: 'Luxury bathroom shower glass — slim gold profile'
    },
    {
      src: '/images/products/Shower Design Page/modern-bathroom-shower-design.webp',
      alt: 'Modern bathroom shower with slim aluminium frame'
    },
    {
      src: '/images/products/Glass Types/shower-glass-types-comparison.webp',
      alt: 'Fluted and clear shower glass types comparison'
    },
    {
      src: '/images/products/Glass Shower Partition Price/glass-shower-partition-modern-bathroom.webp',
      alt: 'Modern bathroom slim frame glass shower partition'
    },
    {
      src: '/images/products/Small Bathroom Shower/compact-shower-partition-design.webp',
      alt: 'Compact slim-frame shower partition design'
    }
  ],
  'products/metal-louvers/curved-architectural-louvers.html': [
    {
      src: '/images/products/metal-louvers/architectural-curved-aluminium-louvers-facade.webp',
      alt: 'Architectural louvers — sleek curved facade aluminium louvers on a signature building elevation – WoodenMax'
    },
    {
      src: '/images/products/metal-louvers/aluminium-louver-curved-architectural-design.webp',
      alt: 'Curved architectural aluminium louver design detail'
    },
    {
      src: '/images/products/metal-louvers/Aluminium-elevation-twisted-louvers.webp',
      alt: 'Twisted aluminium elevation louvers — sculptural facade'
    },
    {
      src: '/images/products/metal-louvers/black-powder-coat-aluminium-louver-facade.webp',
      alt: 'Black powder coat aluminium louver facade'
    },
    {
      src: '/images/products/metal-louvers/commercial-building-aluminium-louver-installation.webp',
      alt: 'Commercial building aluminium louver installation'
    },
    {
      src: '/images/products/metal-louvers/building-exterior-aluminium-louver-cladding-india.webp',
      alt: 'Building exterior aluminium louver cladding India'
    }
  ],
  'products/metal-louvers/louver-canopy-facade.html': [
    {
      src: '/images/products/metal-louvers/aluminium-louver-canopy-elevation-facade.webp',
      alt: 'Duct shaft louvers & aluminium louver canopy — AHU screening and entry canopy sunshade – WoodenMax'
    },
    {
      src: '/images/products/metal-louvers/aluminium-louver-canopy-entrance-design.webp',
      alt: 'Aluminium louver canopy entrance design'
    },
    {
      src: '/images/products/metal-louvers/residential-aluminium-facade-louver-hyderabad.webp',
      alt: 'Residential aluminium facade louver Hyderabad'
    },
    {
      src: '/images/products/metal-louvers/building-exterior-aluminium-louver-cladding-india.webp',
      alt: 'Building exterior aluminium louver cladding'
    },
    {
      src: '/images/products/metal-louvers/fixed-aluminium-luxury-louver-ventilation-panel.webp',
      alt: 'Fixed aluminium luxury louver ventilation panel'
    },
    {
      src: '/images/products/metal-louvers/aluminium-louver-installation-ncr-project.webp',
      alt: 'Aluminium louver canopy installation — NCR project'
    }
  ],
  'products/metal-louvers/ceiling-pergola-louvers.html': [
    {
      src: '/images/products/metal-louvers/aluminium-ceiling-louvers-pergola-backyard.webp',
      alt: 'Ceiling louvers & rafters — aluminium ceiling rafters pergola over a backyard deck – WoodenMax'
    },
    {
      src: '/images/products/metal-louvers/aluminium-ceiling-louver-pergola-design.webp',
      alt: 'Aluminium ceiling louver pergola design'
    },
    {
      src: '/images/products/metal-louvers/luxury-villa-ceiling-rafters.webp',
      alt: 'Luxury villa ceiling rafters — aluminium louvers'
    },
    {
      src: '/images/products/metal-louvers/elevation-louvers-rafters-3d.webp',
      alt: 'Elevation louvers and rafters 3D design'
    },
    {
      src: '/images/products/metal-louvers/blacony-seafty-railing-rafters.webp',
      alt: 'Balcony railing with aluminium rafters'
    },
    {
      src: '/images/products/metal-louvers/img-4033.webp',
      alt: 'Ceiling pergola louvers installation photo'
    }
  ],
  'products/metal-louvers/wooden-finish-aluminium-louvers.html': [
    {
      src: '/images/products/metal-louvers/wooden-finish-aluminium-louvers-elevation.webp',
      alt: 'Wooden finish aluminium rafters — elevation rafters & wood-look elevation louvers for villa facade'
    },
    {
      src: '/images/products/metal-louvers/wooden-finish-aluminium-louver-building-exterior.webp',
      alt: 'Wooden finish aluminium louver building exterior'
    },
    {
      src: '/images/products/metal-louvers/aluminium-facade-louver-75x38mm-wooden-finish-delhi.webp',
      alt: '75x38mm wooden finish aluminium facade louver Delhi'
    },
    {
      src: '/images/products/metal-louvers/fixed-aluminium-luxury-louver-ventilation-panel.webp',
      alt: 'Fixed aluminium luxury louver ventilation panel wood look'
    },
    {
      src: '/images/products/metal-louvers/residential-aluminium-facade-louver-hyderabad.webp',
      alt: 'Residential wood-finish aluminium facade louver Hyderabad'
    },
    {
      src: '/images/products/metal-louvers/aluminium-louver-75x38mm-profile-close-up.webp',
      alt: 'Aluminium louver 75x38mm profile close-up'
    }
  ]
};

function buildGalleryBlock (photos) {
  const main = photos[0];
  const thumbs = photos
    .map((p, i) => {
      const active = i === 0 ? ' active' : '';
      return (
        `            <div class="thumbnail-item${active}" data-image="${p.src}" data-alt="${escapeAttr(p.alt)}">\n` +
        `              <img loading="lazy" src="${p.src}" alt="${escapeAttr(p.alt)}" title="${escapeAttr(p.alt)}" width="300" height="200" decoding="async">\n` +
        `            </div>`
      );
    })
    .join('\n');

  return (
    `        <div class="product-image-gallery">\n` +
    `          <!-- Main Image Display -->\n` +
    `          <div class="product-main-image-container">\n` +
    `            <img loading="eager" fetchpriority="high" id="product-main-image" src="${main.src}" alt="${escapeAttr(main.alt)}" class="product-main-image" width="1200" height="800" decoding="async">\n` +
    `          </div>\n` +
    `\n` +
    `          <!-- Thumbnail Gallery -->\n` +
    `          <div class="product-thumbnail-gallery">\n` +
    `${thumbs}\n` +
    `          </div>\n`
  );
}

function escapeAttr (s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function injectFile (rel, photos) {
  const file = path.join(ROOT, rel);
  let html = fs.readFileSync(file, 'utf8');

  if (/product-thumbnail-gallery/.test(html)) {
    console.log('SKIP (already has thumbs):', rel);
    return false;
  }

  // Replace from opening product-image-gallery through the bare main img
  // Keep everything after (description sections etc.)
  const re =
    /([ \t]*)<div class="product-image-gallery">\s*(?:<!--[\s\S]*?-->\s*)?<img\b[^>]*class="[^"]*product-main-image[^"]*"[^>]*>\s*/i;

  if (!re.test(html)) {
    // Try alt attribute order (class before/after src)
    const re2 =
      /([ \t]*)<div class="product-image-gallery">\s*(?:<!--[\s\S]*?-->\s*)?<img\b[^>]*class='[^']*product-main-image[^']*'[^>]*>\s*/i;
    if (!re2.test(html)) {
      console.error('NO MATCH:', rel);
      return false;
    }
  }

  const block = buildGalleryBlock(photos);
  const next = html.replace(re, () => block + '\n');

  if (next === html) {
    console.error('REPLACE FAILED:', rel);
    return false;
  }

  // Verify images exist
  const missing = photos.filter((p) => {
    const local = path.join(ROOT, p.src.replace(/^\//, '').replace(/\//g, path.sep));
    return !fs.existsSync(local);
  });
  if (missing.length) {
    console.warn('MISSING IMAGES in', rel);
    missing.forEach((m) => console.warn('  ', m.src));
  }

  fs.writeFileSync(file, next, 'utf8');
  console.log('OK', rel, '(' + photos.length + ' photos)');
  return true;
}

let ok = 0;
for (const [rel, photos] of Object.entries(GALLERIES)) {
  if (injectFile(rel, photos)) ok++;
}
console.log('\nInjected', ok, 'of', Object.keys(GALLERIES).length);
