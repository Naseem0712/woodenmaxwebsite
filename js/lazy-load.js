/**
 * Lazy Loading Script for Images
 * Only handles data-src / data-srcset progressive enhancement.
 * Native loading="lazy" images are left alone (no opacity flicker).
 */

(function() {
  'use strict';

  function reveal (img) {
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }
    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset;
      img.removeAttribute('data-srcset');
    }
    img.classList.add('lazy-loaded');
    img.classList.remove('lazy-loading');
  }

  if ('IntersectionObserver' in window) {
    var imageObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var img = entry.target;
        reveal(img);
        observer.unobserve(img);
      });
    }, { rootMargin: '200px' });

    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('img[data-src], img[data-srcset]').forEach(function (img) {
        img.classList.add('lazy-loading');
        imageObserver.observe(img);
      });
    });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('img[data-src], img[data-srcset]').forEach(reveal);
    });
  }

  if (!document.getElementById('lazy-load-styles')) {
    var style = document.createElement('style');
    style.id = 'lazy-load-styles';
    style.textContent =
      'img.lazy-loading{opacity:0.3;transition:opacity 0.3s}' +
      'img.lazy-loaded{opacity:1}';
    document.head.appendChild(style);
  }
})();
