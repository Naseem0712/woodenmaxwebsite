/**
 * Floating Calculator Button
 * All-device floating button that scrolls to calculator
 * Auto-hides when calculator is visible, shows when scrolled away
 * Includes auto-typing text animation
 */
(function() {
  'use strict';

  function initFloatingCalcButton() {
    // Find the floating button
    const button = document.querySelector('.floating-calc-button');
    if (!button) return;

    const buttonText = button.querySelector('.floating-calc-button-text');
    if (!buttonText) return;

    // Find calculator area - try multiple methods
    let calculatorArea = null;
    
    // Method 1: Check if href points to external page (city/blog pages)
    const href = button.getAttribute('href');
    if (href && !href.startsWith('#')) {
      // External link - don't hide/show based on calculator visibility
      // Just show button always (no visibility logic needed)
      return;
    }
    
    // Method 2: Try to find by href if button has one (internal anchor)
    if (href && href.startsWith('#')) {
      const calculatorId = href.substring(1);
      calculatorArea = document.getElementById(calculatorId);
    }
    
    // Method 3: Try common calculator container patterns
    if (!calculatorArea) {
      calculatorArea = document.querySelector('.price-calculator-container') ||
                      document.querySelector('[id*="price-calculator"]') ||
                      document.querySelector('[id*="calculator"]') ||
                      document.querySelector('[id*="calc"]') ||
                      document.querySelector('#glass-calculator') ||
                      document.querySelector('[class*="calculator"]');
    }
    
    if (!calculatorArea) {
      // No calculator found - hide button for product pages
      button.style.display = 'none';
      return;
    }

    let isScrolling = false;
    let scrollTimeout = null;
    let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Function to check if calculator is visible in viewport
    function isCalculatorVisible() {
      const rect = calculatorArea.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const windowWidth = window.innerWidth || document.documentElement.clientWidth;
      
      // Check if calculator is significantly visible (not just touching edges)
      const threshold = 50; // pixels
      const isTopVisible = rect.top < (windowHeight - threshold);
      const isBottomVisible = rect.bottom > threshold;
      const isHorizontallyVisible = rect.left < windowWidth && rect.right > 0;
      
      // Calculator is visible if it's well within viewport
      return isTopVisible && isBottomVisible && isHorizontallyVisible;
    }

    // Function to update button visibility with smooth transitions
    function updateButtonVisibility() {
      if (isScrolling) return; // Don't update during programmatic scroll
      
      const isVisible = isCalculatorVisible();
      
      // Use requestAnimationFrame for smooth transitions
      requestAnimationFrame(() => {
        if (isVisible) {
          // Calculator is visible - smoothly hide button
          button.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out, visibility 0.4s';
          button.style.opacity = '0';
          button.style.visibility = 'hidden';
          button.style.pointerEvents = 'none';
          button.style.transform = 'translateY(20px) scale(0.95)';
        } else {
          // Calculator is not visible - smoothly show button
          button.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out, visibility 0.4s';
          button.style.opacity = '1';
          button.style.visibility = 'visible';
          button.style.pointerEvents = 'auto';
          button.style.transform = 'translateY(0) scale(1)';
        }
      });
    }

    // Smooth scroll to calculator on button click
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Mark as scrolling
      isScrolling = true;
      
      // Smoothly hide button
      button.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      button.style.opacity = '0';
      button.style.pointerEvents = 'none';
      button.style.transform = 'translateY(20px) scale(0.95)';
      
      // Calculate scroll position (calculator top - some offset)
      const calculatorRect = calculatorArea.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetPosition = calculatorRect.top + scrollTop - 100; // 100px offset from top
      
      // Smooth scroll
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
      
      // Reset scrolling flag after scroll completes
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function() {
        isScrolling = false;
        // Check visibility after scroll
        setTimeout(updateButtonVisibility, 200);
      }, 1000); // Wait for smooth scroll to complete
    });

    // Update visibility on scroll with smooth throttling
    let scrollTimeout2 = null;
    
    window.addEventListener('scroll', function() {
      if (scrollTimeout2) {
        clearTimeout(scrollTimeout2);
      }
      
      // Throttle scroll events for smooth performance
      scrollTimeout2 = setTimeout(function() {
        if (!isScrolling) {
          const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
          // Only update if scroll position changed significantly (reduces jitter)
          if (Math.abs(currentScrollTop - lastScrollTop) > 10) {
            updateButtonVisibility();
            lastScrollTop = currentScrollTop;
          }
        }
      }, 16); // ~60fps throttling for smooth updates
    }, { passive: true });

    // Initial check - delay to allow typing animation to start first
    setTimeout(() => {
      updateButtonVisibility();
    }, 1500);
    
    // Also check on resize
    window.addEventListener('resize', function() {
      setTimeout(updateButtonVisibility, 100);
    }, { passive: true });
  }

  // Initialize auto-typing animation for button text
  function initButtonTextTyping() {
    const buttonText = document.querySelector('.floating-calc-button-text');
    if (!buttonText) {
      // Retry if button text not found yet
      setTimeout(initButtonTextTyping, 200);
      return;
    }

    const originalText = buttonText.textContent.trim() || 'Calculate Price';
    
    // Store original text
    buttonText.setAttribute('data-original-text', originalText);
    
    // Ensure text is visible initially
    const currentText = buttonText.textContent.trim();
    if (currentText === '' || currentText !== originalText) {
      buttonText.textContent = originalText;
    }
    
    // Wait for smooth-typing-indicator to be available
    function tryInitTyping() {
      if (window.createSmoothTypingIndicator) {
        console.log('Initializing button text typing animation...');
        window.createSmoothTypingIndicator(buttonText, originalText, {
          minTypeSpeed: 70,
          maxTypeSpeed: 130,
          minDeleteSpeed: 35,
          maxDeleteSpeed: 65,
          pauseBeforeDelete: 3000,
          pauseAfterDelete: 800,
          startDelay: 2000, // Show text for 2 seconds, then start animation
          loop: true
        });
      } else {
        // Retry after delay (max 5 seconds)
        const elapsed = Date.now() - (window.typingInitStartTime || Date.now());
        if (elapsed < 5000) {
          setTimeout(tryInitTyping, 200);
        } else {
          console.log('⚠️ createSmoothTypingIndicator not available, skipping button text animation');
        }
      }
    }
    
    window.typingInitStartTime = Date.now();
    tryInitTyping();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(() => {
        initFloatingCalcButton();
        // Delay typing init to ensure smooth-typing-indicator.js is loaded
        setTimeout(initButtonTextTyping, 1000);
      }, 500);
    });
  } else {
    setTimeout(() => {
      initFloatingCalcButton();
      // Delay typing init to ensure smooth-typing-indicator.js is loaded
      setTimeout(initButtonTextTyping, 1000);
    }, 500);
  }
})();

