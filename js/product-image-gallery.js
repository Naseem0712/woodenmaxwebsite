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

    // Create description display element just below main image, above thumbnail gallery, with close button
    let descriptionEl = container.querySelector('.product-image-description');
    if (!descriptionEl) {
      const mainImageContainer = container.querySelector('.product-main-image-container');
      descriptionEl = document.createElement('div');
      descriptionEl.className = 'product-image-description';
      descriptionEl.style.cssText = 'position: relative; margin-top: 0; margin-bottom: 1rem; padding: 1rem 2.5rem 1rem 1rem; background: #1a1a1a; border-radius: 8px; color: #ffffff; font-size: 0.9rem; line-height: 1.6; transition: opacity 0.3s ease; min-height: 50px; display: none;';
      
      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'product-image-description-close';
      closeBtn.innerHTML = '✕';
      closeBtn.setAttribute('aria-label', 'Close description');
      closeBtn.style.cssText = 'position: absolute; top: 0.5rem; right: 0.5rem; background: transparent; border: none; color: #ffffff; font-size: 1.2rem; cursor: pointer; padding: 0.25rem 0.5rem; line-height: 1; opacity: 0.7; transition: opacity 0.2s ease;';
      closeBtn.addEventListener('mouseenter', () => { closeBtn.style.opacity = '1'; });
      closeBtn.addEventListener('mouseleave', () => { closeBtn.style.opacity = '0.7'; });
      closeBtn.addEventListener('click', () => {
        descriptionEl.style.display = 'none';
      });
      descriptionEl.appendChild(closeBtn);
      
      // Insert after main image container, before thumbnail gallery
      const thumbnailGallery = container.querySelector('.product-thumbnail-gallery');
      if (mainImageContainer && thumbnailGallery) {
        mainImageContainer.parentElement.insertBefore(descriptionEl, thumbnailGallery);
      } else if (mainImageContainer) {
        mainImageContainer.parentElement.appendChild(descriptionEl);
      } else {
        container.appendChild(descriptionEl);
      }
    }

    // Handle thumbnail clicks
    thumbnails.forEach(thumbnail => {
      thumbnail.addEventListener('click', function() {
        const newImageSrc = this.getAttribute('data-image');
        const newImageAlt = this.getAttribute('data-alt');
        const newImageDesc = this.getAttribute('data-description') || '';

        if (!newImageSrc) return;

        // Update main image with fade effect (maintains container size - no shift)
        mainImage.style.opacity = '0';
        if (descriptionEl) descriptionEl.style.opacity = '0';

        setTimeout(() => {
          mainImage.src = newImageSrc;
          mainImage.alt = newImageAlt || mainImage.alt;
          mainImage.style.opacity = '1';
          
          // Update description
          if (descriptionEl) {
            const descText = descriptionEl.querySelector('.product-image-description-text');
            if (descText) {
              descText.textContent = newImageDesc || '';
            } else {
              const textEl = document.createElement('div');
              textEl.className = 'product-image-description-text';
              textEl.textContent = newImageDesc || '';
              // Insert before close button
              const closeBtn = descriptionEl.querySelector('.product-image-description-close');
              if (closeBtn) {
                descriptionEl.insertBefore(textEl, closeBtn);
              } else {
                descriptionEl.appendChild(textEl);
              }
            }
            descriptionEl.style.display = newImageDesc ? 'block' : 'none';
            descriptionEl.style.opacity = newImageDesc ? '1' : '0';
          }
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
    
    // Initialize description for first image
    const firstThumbnail = thumbnails[0];
    if (firstThumbnail && descriptionEl) {
      const firstDesc = firstThumbnail.getAttribute('data-description') || '';
      const descText = descriptionEl.querySelector('.product-image-description-text');
      if (descText) {
        descText.textContent = firstDesc;
      } else {
        const textEl = document.createElement('div');
        textEl.className = 'product-image-description-text';
        textEl.textContent = firstDesc;
        const closeBtn = descriptionEl.querySelector('.product-image-description-close');
        if (closeBtn) {
          descriptionEl.insertBefore(textEl, closeBtn);
        } else {
          descriptionEl.appendChild(textEl);
        }
      }
      descriptionEl.style.display = firstDesc ? 'block' : 'none';
      descriptionEl.style.opacity = firstDesc ? '1' : '0';
    }

    // Handle main image click to enlarge (optional - can add lightbox later)
    mainImage.addEventListener('click', function() {
      // Can add lightbox modal here if needed
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

