/**
 * Product Image Gallery - Reusable Script
 * Lightweight image gallery with thumbnail navigation
 * Usage: Add class "product-image-gallery" to container and initialize
 */

(function() {
  'use strict';

  function initProductImageGallery(container) {
    if (!container) return;

    const mainImage = container.querySelector('.product-main-image');
    const thumbnails = container.querySelectorAll('.thumbnail-item');

    if (!mainImage || thumbnails.length === 0) return;

    // Handle thumbnail clicks
    thumbnails.forEach(thumbnail => {
      thumbnail.addEventListener('click', function() {
        const newImageSrc = this.getAttribute('data-image');
        const newImageAlt = this.getAttribute('data-alt');

        if (!newImageSrc) return;

        // Update main image with fade effect (maintains container size - no shift)
        mainImage.style.opacity = '0';

        setTimeout(() => {
          mainImage.src = newImageSrc;
          mainImage.alt = newImageAlt || mainImage.alt;
          mainImage.style.opacity = '1';
        }, 150);

        // Update active state
        thumbnails.forEach(thumb => {
          thumb.classList.remove('active');
          thumb.style.opacity = '0.7';
          thumb.style.borderColor = 'transparent';
        });

        this.classList.add('active');
        this.style.opacity = '1';
        this.style.borderColor = 'var(--gold-400)';
      });
    });

    // Handle main image click to enlarge (optional - can add lightbox later)
    mainImage.addEventListener('click', function() {
      // Can add lightbox modal here if needed
      console.log('Main image clicked - can add lightbox here');
    });
  }

  // Auto-initialize on DOM ready
  function autoInit() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        const galleries = document.querySelectorAll('.product-image-gallery');
        galleries.forEach(initProductImageGallery);
      });
    } else {
      const galleries = document.querySelectorAll('.product-image-gallery');
      galleries.forEach(initProductImageGallery);
    }
  }

  // Initialize
  autoInit();

  // Export for manual initialization if needed
  window.initProductImageGallery = initProductImageGallery;
})();

