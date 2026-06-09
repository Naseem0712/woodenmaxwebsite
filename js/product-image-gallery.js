/**
 * Product Image Gallery - Reusable Script
 * Auto-upgrades stacked image grids into a thumbnail gallery on any page.
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

  function uniqueImages (imgs) {
    var seen = {};
    var out = [];
    imgs.forEach(function (img) {
      var src = img.getAttribute('src') || img.currentSrc || '';
      if (!src || seen[src]) return;
      seen[src] = true;
      out.push(img);
    });
    return out;
  }

  function buildGalleryHtml (imgs) {
    var first = imgs[0];
    var mainSrc = first.getAttribute('src') || first.currentSrc;
    var mainAlt = first.getAttribute('alt') || 'Product photo';
    var thumbs = imgs.map(function (img, i) {
      var src = img.getAttribute('src') || img.currentSrc;
      var alt = img.getAttribute('alt') || mainAlt;
      return (
        '<div class="thumbnail-item' + (i === 0 ? ' active' : '') + '" data-image="' + esc(src) + '" data-alt="' + esc(alt) + '">' +
          '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="product-main-image-container">' +
        '<img loading="eager" fetchpriority="high" decoding="async" class="product-main-image" id="product-main-image" src="' + esc(mainSrc) + '" alt="' + esc(mainAlt) + '">' +
      '</div>' +
      '<div class="product-thumbnail-gallery">' + thumbs + '</div>'
    );
  }

  function repairIncompleteGallery (container) {
    if (!container || container.dataset.wmGalleryReady === '1') return;
    var main = container.querySelector('.product-main-image');
    var thumbs = container.querySelectorAll('.thumbnail-item');
    if (!main) return;

    if (!container.querySelector('.product-main-image-container')) {
      var wrap = document.createElement('div');
      wrap.className = 'product-main-image-container';
      main.parentNode.insertBefore(wrap, main);
      wrap.appendChild(main);
    }

    if (thumbs.length === 0) {
      var src = main.getAttribute('src') || main.currentSrc;
      var alt = main.getAttribute('alt') || 'Product photo';
      var strip = document.createElement('div');
      strip.className = 'product-thumbnail-gallery';
      strip.innerHTML =
        '<div class="thumbnail-item active" data-image="' + esc(src) + '" data-alt="' + esc(alt) + '">' +
          '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">' +
        '</div>';
      var anchor = container.querySelector('.product-main-image-container');
      if (anchor && anchor.nextSibling) anchor.parentNode.insertBefore(strip, anchor.nextSibling);
      else container.insertBefore(strip, container.firstChild.nextSibling);
    }

    container.dataset.wmGalleryReady = '1';
  }

  function upgradeStackedImageGrids () {
    var upgraded = [];

    document.querySelectorAll('img.alum-seo-hero-compact').forEach(function (img) {
      var grid = img.closest('div[style*="grid"]') || img.closest('div');
      if (!grid || grid.dataset.wmGalleryUpgraded === '1' || isSkipRoot(grid)) return;
      if (grid.closest('.product-image-gallery')) return;
      var imgs = uniqueImages(Array.prototype.slice.call(grid.querySelectorAll('img')).filter(function (i) {
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
      var imgs = uniqueImages(Array.prototype.slice.call(section.querySelectorAll('img')).filter(function (img) {
        if (isSkipRoot(img)) return false;
        if (img.closest('.product-image-gallery')) return false;
        if (isDecorativeImage(img)) return false;
        return true;
      }));
      if (imgs.length < 2) return;

      var grid = imgs[0].closest('div');
      if (!grid || !imgs.every(function (i) { return grid.contains(i); })) return;
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
    if (!container) return;
    repairIncompleteGallery(container);

    var mainImage = container.querySelector('.product-main-image');
    var thumbnails = container.querySelectorAll('.thumbnail-item');
    if (!mainImage || thumbnails.length === 0) return;

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

    thumbnails.forEach(function (thumbnail) {
      thumbnail.addEventListener('click', function () {
        var newImageSrc = this.getAttribute('data-image');
        var newImageAlt = this.getAttribute('data-alt');
        var newImageDesc = this.getAttribute('data-description') || '';
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
        this.classList.add('active');
        this.style.opacity = '1';
        this.style.borderColor = 'var(--gold-400, #b8893d)';
      });
    });

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
