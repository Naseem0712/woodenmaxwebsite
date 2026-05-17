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
    
    // CRITICAL FIX: Ensure text is visible immediately on page load
    // This prevents the issue where text doesn't show if animation script fails
    const defaultText = buttonText.textContent.trim() || buttonText.getAttribute('data-original-text') || buttonText.innerHTML.trim() || 'Try Calculator';
    
    // Force set text content - this ensures it's always visible
    buttonText.textContent = defaultText;
    buttonText.innerHTML = defaultText; // Also set innerHTML as backup
    
    buttonText.setAttribute('data-original-text', defaultText);
    
    // Always use light grey text and icon for light grey button background
    function setButtonColors() {
      buttonText.style.color = '#475569';
      buttonText.style.textShadow = 'none';
      if (button.querySelector('svg')) {
        button.querySelector('svg').style.stroke = '#475569';
      }
    }
    
    // Set initial colors (always light grey for light grey button)
    setTimeout(setButtonColors, 100);
    
    // Update colors on scroll (maintain consistency)
    let colorCheckTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(colorCheckTimeout);
      colorCheckTimeout = setTimeout(setButtonColors, 150);
    }, { passive: true });
    
    // Force visibility with !important equivalent via inline styles
    buttonText.style.cssText += 'display: inline-block !important; opacity: 1 !important; visibility: visible !important; font-weight: 700 !important; font-size: 0.95rem !important; overflow: visible !important; line-height: 1.2 !important;';
    
    // Use CSS-defined light grey background (don't override)
    // Button background is set in CSS: #F3F4F6 with border #E5E7EB

    // Find calculator area - try multiple methods
    let calculatorArea = null;
    
    // Method 1: Check if href points to external page (calculator pages, city/blog pages)
    const href = button.getAttribute('href');
    if (href && !href.startsWith('#')) {
      // External link - allow normal link behavior, don't add any click handlers
      // Button will work as a normal link, navigating to the calculator page
      // Ensure button is visible and clickable
      button.style.display = '';
      button.style.opacity = '1';
      button.style.visibility = 'visible';
      button.style.pointerEvents = 'auto';
      // Ensure text is visible for external links too
      if (buttonText.textContent.trim() === '') {
        buttonText.textContent = buttonText.getAttribute('data-original-text') || 'Try Calculator';
      }
      buttonText.style.cssText = 'display: inline-block !important; opacity: 1 !important; visibility: visible !important; color: #475569 !important; font-weight: 700 !important; text-shadow: none !important;';
      // Use CSS-defined light grey background (don't override)
      return; // Exit early - no need to set up scroll/visibility logic
    }
    
    // Method 2: Try to find by href if button has one (internal anchor)
    if (href && href.startsWith('#')) {
      const calculatorId = href.substring(1);
      calculatorArea = document.getElementById(calculatorId);
    }
    
    // Method 3: Try common calculator container patterns
    if (!calculatorArea) {
      // Try multiple selectors in order of specificity
      calculatorArea = document.querySelector('.price-calculator-container') ||
                      document.querySelector('[id^="price-calculator"]') ||
                      document.querySelector('[id*="price-calculator"]') ||
                      document.querySelector('[id*="calculator"]') ||
                      document.querySelector('[id*="calc"]') ||
                      document.querySelector('#glass-calculator') ||
                      document.querySelector('[class*="calculator"]') ||
                      document.querySelector('[class*="calc"]');
    }
    
    // If calculator not found, wait for DOM to fully load
    if (!calculatorArea) {
      // Try again after a short delay
      setTimeout(() => {
        calculatorArea = document.querySelector('.price-calculator-container') ||
                         document.querySelector('[id^="price-calculator"]') ||
                         document.querySelector('[id*="price-calculator"]');
        if (!calculatorArea) {
          // No calculator found - hide button
          button.style.display = 'none';
          return;
        }
        // Found calculator - initialize
        initializeCalculatorVisibility();
      }, 500);
      
      // Exit early if calculator not found immediately
      if (!calculatorArea) {
        return;
      }
    }

    // Initialize calculator visibility tracking
    let isScrolling = false;
    let scrollTimeout = null;
    let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const usePergolaIntersection =
      calculatorArea &&
      calculatorArea.id === 'price-calculator-pergola' &&
      typeof IntersectionObserver !== 'undefined';

    function initializeCalculatorVisibility() {
      if (!calculatorArea) return;

      // Pergola / outdoor calculator: hide floating button while section is on screen (stable, no gap glitches)
      if (usePergolaIntersection) {
        const io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              const onScreen = entry.isIntersecting && entry.intersectionRatio > 0.06;
              requestAnimationFrame(function () {
                if (onScreen) {
                  button.style.transition =
                    'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.45s';
                  button.style.opacity = '0';
                  button.style.visibility = 'hidden';
                  button.style.pointerEvents = 'none';
                  button.style.transform = 'translateY(12px) scale(0.97)';
                } else {
                  button.style.transition =
                    'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.5s';
                  button.style.opacity = '1';
                  button.style.visibility = 'visible';
                  button.style.pointerEvents = 'auto';
                  button.style.transform = 'translateY(0) scale(1)';
                }
              });
            });
          },
          { root: null, rootMargin: '-12px 0px -12px 0px', threshold: [0, 0.02, 0.08, 0.15, 0.35] }
        );
        io.observe(calculatorArea);
        button.addEventListener('click', function (e) {
          e.preventDefault();
          isScrolling = true;
          const rect = calculatorArea.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetPosition = rect.top + scrollTop - 96;
          window.scrollTo({ top: Math.max(0, targetPosition), behavior: 'smooth' });
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(function () {
            isScrolling = false;
          }, 900);
        });
        return;
      }

      // Function to check if calculator is visible in viewport (strict — no buffer)
      // Owner requirement: FAB should hide ONLY when the user is in front of the
      // calculator, not 200px before they reach it. The new IntersectionObserver
      // in js/calculator-mobile-ux.js handles this with even finer control;
      // when it sets data-strict-hide we back off entirely.
      function isCalculatorInViewport() {
        if (!calculatorArea) return false;
        if (button.hasAttribute('data-strict-hide')) {
          // strict observer is in control — never report true so we don't fight it
          return false;
        }

        try {
          const rect = calculatorArea.getBoundingClientRect();
          const windowHeight = window.innerHeight || document.documentElement.clientHeight;
          const windowWidth = window.innerWidth || document.documentElement.clientWidth;

          if (rect.width === 0 && rect.height === 0) return false;

          // Zero buffer — hide only when calc actually intersects the viewport
          const bufferZone = 0;

          const isTopInView = rect.top < (windowHeight + bufferZone);
          const isBottomInView = rect.bottom > (-bufferZone);
          const isHorizontallyVisible = rect.left < windowWidth && rect.right > 0;

          return isTopInView && isBottomInView && isHorizontallyVisible;
        } catch (e) {
          return false;
        }
      }

      // Function to update button visibility with smooth, soft transitions
      function updateButtonVisibility() {
        if (isScrolling) return; // Don't update during programmatic scroll
        if (!calculatorArea) return; // Safety check
        
        const calculatorInView = isCalculatorInViewport();
        
        // Use requestAnimationFrame for smooth transitions
        requestAnimationFrame(() => {
          if (calculatorInView) {
            // Calculator area is visible - smoothly hide button (soft fade out)
            // Longer duration (0.8s) for very smooth, soft transition
            button.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.8s';
            button.style.opacity = '0';
            button.style.visibility = 'hidden';
            button.style.pointerEvents = 'none';
            button.style.transform = 'translateY(15px) scale(0.96)';
          } else {
            // Calculator area not visible - smoothly show button (soft fade in)
            // Longer duration (0.8s) for very smooth, soft transition
            button.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.8s';
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
            // Update on every scroll (reduced threshold for smoother detection)
            // This ensures button hides/shows smoothly as user enters/exits calculator area
            if (Math.abs(currentScrollTop - lastScrollTop) > 5) {
              updateButtonVisibility();
              lastScrollTop = currentScrollTop;
            }
          }
        }, 16); // ~60fps throttling for smooth updates
      }, { passive: true });

      // Initial check - set correct state immediately, then check again after delay
      updateButtonVisibility(); // Immediate check for correct initial state
      
      // Also check after delay to allow page to fully load
      setTimeout(() => {
        updateButtonVisibility();
      }, 500);
      
      // Also check on resize
      window.addEventListener('resize', function() {
        setTimeout(updateButtonVisibility, 100);
      }, { passive: true });
    }
    
    // Call initialization
    initializeCalculatorVisibility();
  }

  // Initialize auto-typing animation for button text
  function initButtonTextTyping() {
    const buttonText = document.querySelector('.floating-calc-button-text');
    if (!buttonText) {
      // Retry if button text not found yet
      setTimeout(initButtonTextTyping, 200);
      return;
    }

    const originalText = buttonText.textContent.trim() || buttonText.getAttribute('data-original-text') || buttonText.innerHTML.trim() || 'Try Calculator';
    
    // Store original text
    buttonText.setAttribute('data-original-text', originalText);
    
    // CRITICAL: Ensure text is ALWAYS visible immediately, even before animation starts
    // Force set text - don't rely on existing content
    buttonText.textContent = originalText;
    buttonText.innerHTML = originalText;
    
    // Force visibility - color will be set by background detection
    buttonText.style.cssText += 'display: inline-block !important; opacity: 1 !important; visibility: visible !important; font-weight: 700 !important; font-size: 0.95rem !important; overflow: visible !important; line-height: 1.2 !important;';
    
    // OPTIONAL: Initialize typing animation only if script is available
    // Text is already visible, so animation is just a nice-to-have
    function tryInitTyping() {
      if (window.createSmoothTypingIndicator) {
        // Only start animation after text has been visible for a while
        setTimeout(() => {
          if (buttonText && buttonText.textContent.trim() === originalText) {
            window.createSmoothTypingIndicator(buttonText, originalText, {
              minTypeSpeed: 70,
              maxTypeSpeed: 130,
              minDeleteSpeed: 35,
              maxDeleteSpeed: 65,
              pauseBeforeDelete: 3000,
              pauseAfterDelete: 800,
              startDelay: 3000, // Show text for 3 seconds first, then start animation
              loop: true
            });
          }
        }, 1000);
      } else {
        // Animation script not available - text is already visible, so no problem
        // Just ensure it stays visible
        const elapsed = Date.now() - (window.typingInitStartTime || Date.now());
        if (elapsed < 3000) {
          setTimeout(tryInitTyping, 200);
        }
      }
    }
    
    window.typingInitStartTime = Date.now();
    // Start trying to init animation (but text is already visible)
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

