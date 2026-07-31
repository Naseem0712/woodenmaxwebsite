/**
 * Product Image Gallery - Reusable Script
 * - Wires thumbnail clicks → main image swap
 * - Repairs incomplete galleries (missing container / thumbs)
 * - Supports data-gallery-images JSON for multi-photo enrichment
 * - Auto-upgrades stacked image grids into a thumbnail gallery
 */
(function () {
  'use strict';

  function esc (s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function isDecorativeImage (img) {
    var src = (img.getAttribute('src') || '').toLowerCase();
    var alt = (img.getAttribute('alt') || '').toLowerCase();
    if (/logo|icon|avatar|badge|svg/.test(src + alt)) return true;
    var w = parseInt(img.getAttribute('width'), 10) || 0;
    return w > 0 && w < 100;
  }

  function isSkipRoot (el) {
    return Boolean(el.closest(
      'nav, footer, .wm-footer, header, .navbar, .wm-navbar, .wm-drawer, ' +
      '.product-thumbnail-gallery, .wm-logo, .footer, .calc-sticky-bar, .wm-global-quote-cart, ' +
      '.catalog-hub-grid, .catalog-hub-card, .catalog-hub-section--priority, .catalog-products-grid, .product-card'
    ));
  }

  function normalizeSrc (src) {
    return String(src || '').split('?')[0].replace(/-1200(\.[a-z0-9]+)$/i, '$1');
  }

  function uniqueBySrc (items) {
    var seen = {};
    var out = [];
    items.forEach(function (item) {
      var src = item.src || item.getAttribute && (item.getAttribute('src') || item.currentSrc) || '';
      var key = normalizeSrc(src);
      if (!key || seen[key]) return;
      seen[key] = true;
      if (item.getAttribute) {
        out.push({
          src: src,
          alt: item.getAttribute('alt') || 'Product photo'
        });
      } else {
        out.push({ src: src, alt: item.alt || 'Product photo' });
      }
    });
    return out;
  }

  function parseGalleryDataAttr (container) {
    var raw = container.getAttribute('data-gallery-images');
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(function (entry) {
        if (typeof entry === 'string') return { src: entry, alt: 'Product photo' };
        return { src: entry.src || entry.url || '', alt: entry.alt || 'Product photo' };
      }).filter(function (e) { return e.src; });
    } catch (e) {
      return raw.split(',').map(function (s) {
        return { src: s.trim(), alt: 'Product photo' };
      }).filter(function (e) { return e.src; });
    }
  }

  function buildThumbHtml (item, active) {
    return (
      '<div class="thumbnail-item' + (active ? ' active' : '') + '" data-image="' + esc(item.src) + '" data-alt="' + esc(item.alt) + '" role="button" tabindex="0" aria-label="' + esc(item.alt || 'Show photo') + '">' +
        '<img src="' + esc(item.src) + '" alt="' + esc(item.alt) + '" loading="lazy" decoding="async" width="72" height="72">' +
      '</div>'
    );
  }

  function normalizeThumbMarkup (container) {
    var thumbs = container.querySelectorAll('.product-thumbnail-gallery .thumbnail-item');
    thumbs.forEach(function (thumb) {
      var img = thumb.querySelector('img');
      if (!img) return;
      if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      img.setAttribute('width', '72');
      img.setAttribute('height', '72');
      if (!thumb.getAttribute('role')) thumb.setAttribute('role', 'button');
      if (!thumb.hasAttribute('tabindex')) thumb.setAttribute('tabindex', '0');
      if (!thumb.getAttribute('aria-label')) {
        thumb.setAttribute('aria-label', thumb.getAttribute('data-alt') || img.getAttribute('alt') || 'Show photo');
      }
    });
  }

  function buildGalleryHtml (imgs) {
    var first = imgs[0];
    var mainSrc = first.src || first.getAttribute('src') || first.currentSrc;
    var mainAlt = first.alt || (first.getAttribute && first.getAttribute('alt')) || 'Product photo';
    var items = imgs.map(function (img) {
      if (img.src && !img.getAttribute) return img;
      return {
        src: img.getAttribute('src') || img.currentSrc,
        alt: img.getAttribute('alt') || mainAlt
      };
    });
    var thumbs = items.map(function (item, i) {
      return buildThumbHtml(item, i === 0);
    }).join('');

    return (
      '<div class="product-main-image-container">' +
        '<img loading="eager" fetchpriority="high" decoding="async" class="product-main-image" id="product-main-image" src="' + esc(mainSrc) + '" alt="' + esc(mainAlt) + '">' +
      '</div>' +
      '<div class="product-thumbnail-gallery">' + thumbs + '</div>'
    );
  }

  function ensureMainId (main) {
    if (main && !main.id) main.id = 'product-main-image';
  }

  function insertThumbStrip (container, strip) {
    var anchor = container.querySelector('.product-main-image-container');
    var desc = container.querySelector('.product-description-section, .key-features-section, .calc-info-box');
    if (anchor) {
      if (desc && desc.parentNode === container) container.insertBefore(strip, desc);
      else if (anchor.nextSibling) anchor.parentNode.insertBefore(strip, anchor.nextSibling);
      else container.appendChild(strip);
      return;
    }
    var main = container.querySelector('.product-main-image');
    if (main && main.parentNode === container) {
      if (main.nextSibling) container.insertBefore(strip, main.nextSibling);
      else container.appendChild(strip);
      return;
    }
    container.insertBefore(strip, container.firstChild);
  }

  function repairIncompleteGallery (container) {
    if (!container) return;
    var main = container.querySelector('.product-main-image');
    if (!main) return;

    ensureMainId(main);

    if (!container.querySelector('.product-main-image-container')) {
      var wrap = document.createElement('div');
      wrap.className = 'product-main-image-container';
      main.parentNode.insertBefore(wrap, main);
      wrap.appendChild(main);
    }

    var existingThumbs = container.querySelectorAll('.thumbnail-item');
    var dataImages = parseGalleryDataAttr(container);
    var mainSrc = main.getAttribute('src') || main.currentSrc || '';
    var mainAlt = main.getAttribute('alt') || 'Product photo';

    var photos = uniqueBySrc(
      [{ src: mainSrc, alt: mainAlt }].concat(dataImages)
    );

    // Enrich sparse galleries (0–1 thumbs) from data-gallery-images
    if (existingThumbs.length <= 1 && photos.length > 1) {
      var strip = container.querySelector('.product-thumbnail-gallery');
      if (!strip) {
        strip = document.createElement('div');
        strip.className = 'product-thumbnail-gallery';
        insertThumbStrip(container, strip);
      }
      strip.innerHTML = photos.map(function (item, i) {
        return buildThumbHtml(item, i === 0);
      }).join('');
      return;
    }

    if (existingThumbs.length === 0) {
      var fallback = document.createElement('div');
      fallback.className = 'product-thumbnail-gallery';
      fallback.innerHTML = buildThumbHtml({ src: mainSrc, alt: mainAlt }, true);
      insertThumbStrip(container, fallback);
    }
  }

  function upgradeStackedImageGrids () {
    var upgraded = [];

    document.querySelectorAll('img.alum-seo-hero-compact').forEach(function (img) {
      var grid = img.closest('div[style*="grid"]') || img.closest('div');
      if (!grid || grid.dataset.wmGalleryUpgraded === '1' || isSkipRoot(grid)) return;
      if (grid.closest('.product-image-gallery')) return;
      var imgs = uniqueBySrc(Array.prototype.slice.call(grid.querySelectorAll('img')).filter(function (i) {
        return !isDecorativeImage(i);
      }));
      if (imgs.length < 2) return;
      var gallery = document.createElement('div');
      gallery.className = 'product-image-gallery wm-gallery-auto';
      gallery.innerHTML = buildGalleryHtml(imgs);
      grid.parentNode.replaceChild(gallery, grid);
      gallery.dataset.wmGalleryUpgraded = '1';
      upgraded.push(gallery);
    });

    document.querySelectorAll('section').forEach(function (section) {
      if (section.querySelector('.product-image-gallery, .price-calculator-container, table')) return;
      if (section.querySelector('.catalog-hub-grid, .catalog-products-grid')) return;
      if (section.classList.contains('catalog-hub-section--priority')) return;
      if (section.querySelector('img.alum-seo-hero-compact')) return;
      var imgs = uniqueBySrc(Array.prototype.slice.call(section.querySelectorAll('img')).filter(function (img) {
        if (isSkipRoot(img)) return false;
        if (img.closest('.product-image-gallery')) return false;
        if (isDecorativeImage(img)) return false;
        return true;
      }));
      if (imgs.length < 2) return;

      var grid = section.querySelector('img') && section.querySelector('img').closest('div');
      if (!grid) return;
      var allInGrid = imgs.every(function (item) {
        return Array.prototype.some.call(grid.querySelectorAll('img'), function (img) {
          return normalizeSrc(img.getAttribute('src') || img.currentSrc) === normalizeSrc(item.src);
        });
      });
      if (!allInGrid) return;
      if (grid.classList.contains('catalog-hub-grid') || grid.classList.contains('catalog-products-grid')) return;
      if (grid.closest('.catalog-hub-section--priority')) return;
      if (grid.dataset.wmGalleryUpgraded === '1') return;
      if (grid.querySelectorAll('img').length !== imgs.length) return;

      var gallery = document.createElement('div');
      gallery.className = 'product-image-gallery wm-gallery-auto';
      gallery.innerHTML = buildGalleryHtml(imgs);
      grid.parentNode.replaceChild(gallery, grid);
      gallery.dataset.wmGalleryUpgraded = '1';
      upgraded.push(gallery);
    });

    return upgraded;
  }

  function initProductImageGallery (container) {
    if (!container || container.dataset.wmGalleryBound === '1') return;
    repairIncompleteGallery(container);
    normalizeThumbMarkup(container);

    var mainImage = container.querySelector('.product-main-image');
    var thumbStrip = container.querySelector('.product-thumbnail-gallery');
    var thumbnails = container.querySelectorAll('.product-thumbnail-gallery .thumbnail-item, .thumbnail-item');
    if (!mainImage || thumbnails.length === 0) return;

    ensureMainId(mainImage);
    if (thumbStrip) {
      thumbStrip.setAttribute('role', 'list');
      thumbStrip.setAttribute('aria-label', 'Product photos');
    }

    var descriptionEl = container.querySelector('.product-image-description');
    if (!descriptionEl) {
      var mainImageContainer = container.querySelector('.product-main-image-container');
      descriptionEl = document.createElement('div');
      descriptionEl.className = 'product-image-description';
      descriptionEl.style.cssText = 'position:relative;margin:0 0 1rem;padding:1rem 2.5rem 1rem 1rem;background:#1a1a1a;border-radius:8px;color:#fff;font-size:0.9rem;line-height:1.6;transition:opacity 0.3s ease;min-height:50px;display:none;';
      var closeBtn = document.createElement('button');
      closeBtn.className = 'product-image-description-close';
      closeBtn.innerHTML = '✕';
      closeBtn.setAttribute('aria-label', 'Close description');
      closeBtn.style.cssText = 'position:absolute;top:0.5rem;right:0.5rem;background:transparent;border:none;color:#fff;font-size:1.2rem;cursor:pointer;padding:0.25rem 0.5rem;line-height:1;opacity:0.7;';
      closeBtn.addEventListener('click', function () { descriptionEl.style.display = 'none'; });
      descriptionEl.appendChild(closeBtn);
      var thumbnailGallery = container.querySelector('.product-thumbnail-gallery');
      if (mainImageContainer && thumbnailGallery) {
        mainImageContainer.parentElement.insertBefore(descriptionEl, thumbnailGallery);
      } else if (mainImageContainer) {
        mainImageContainer.parentElement.appendChild(descriptionEl);
      } else {
        container.appendChild(descriptionEl);
      }
    }

    function activateThumb (thumbnail) {
      var newImageSrc = thumbnail.getAttribute('data-image');
      var newImageAlt = thumbnail.getAttribute('data-alt');
      var newImageDesc = thumbnail.getAttribute('data-description') || '';
      if (!newImageSrc) return;

      mainImage.style.opacity = '0';
      if (descriptionEl) descriptionEl.style.opacity = '0';

      setTimeout(function () {
        mainImage.src = newImageSrc;
        mainImage.alt = newImageAlt || mainImage.alt;
        mainImage.style.opacity = '1';
        if (descriptionEl) {
          var descText = descriptionEl.querySelector('.product-image-description-text');
          if (descText) descText.textContent = newImageDesc || '';
          descriptionEl.style.display = newImageDesc ? 'block' : 'none';
          descriptionEl.style.opacity = newImageDesc ? '1' : '0';
        }
      }, 150);

      thumbnails.forEach(function (thumb) {
        thumb.classList.remove('active');
        thumb.style.opacity = '0.7';
        thumb.style.borderColor = 'transparent';
      });
      thumbnail.classList.add('active');
      thumbnail.style.opacity = '1';
      thumbnail.style.borderColor = 'var(--gold-400, #b8893d)';
      // Scroll only the thumbnail strip — never the page (scrollIntoView can jump the window).
      var strip = thumbnail.parentElement;
      if (strip && typeof strip.scrollTo === 'function') {
        var left = thumbnail.offsetLeft - (strip.clientWidth - thumbnail.clientWidth) / 2;
        try {
          strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
        } catch (e) {
          strip.scrollLeft = Math.max(0, left);
        }
      }
    }

    thumbnails.forEach(function (thumbnail) {
      thumbnail.addEventListener('click', function () {
        activateThumb(this);
      });
      thumbnail.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateThumb(this);
        }
      });
    });

    container.dataset.wmGalleryBound = '1';
    container.dataset.wmGalleryReady = '1';
  }

  function bootGalleries () {
    upgradeStackedImageGrids();
    document.querySelectorAll('.product-image-gallery').forEach(initProductImageGallery);
  }

  function autoInit () {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootGalleries);
    } else {
      bootGalleries();
    }
  }

  autoInit();
  window.initProductImageGallery = initProductImageGallery;
  window.wmBootProductGalleries = bootGalleries;
})();
