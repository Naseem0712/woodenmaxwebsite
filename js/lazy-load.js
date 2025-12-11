/**
 * Lazy Loading Script for Images
 * Improves page load speed by deferring image loading until they're near viewport
 */

(function() {
  'use strict';

  // Check if browser supports Intersection Observer
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // Handle data-src for lazy loading
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          // Handle data-srcset for responsive images
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          
          // Add loaded class for styling
          img.classList.add('lazy-loaded');
          img.classList.remove('lazy-loading');
          
          // Stop observing this image
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px' // Start loading 50px before image enters viewport
    });

    // Observe all images with lazy loading
    document.addEventListener('DOMContentLoaded', function() {
      const lazyImages = document.querySelectorAll('img[loading="lazy"], img[data-src]');
      lazyImages.forEach(img => {
        img.classList.add('lazy-loading');
        imageObserver.observe(img);
      });
    });
  } else {
    // Fallback for older browsers - load all images immediately
    document.addEventListener('DOMContentLoaded', function() {
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
        }
        img.classList.add('lazy-loaded');
      });
    });
  }

  // Add loading placeholder style if not exists
  if (!document.getElementById('lazy-load-styles')) {
    const style = document.createElement('style');
    style.id = 'lazy-load-styles';
    style.textContent = `
      img.lazy-loading {
        opacity: 0.3;
        transition: opacity 0.3s;
      }
      img.lazy-loaded {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }
})();

