/**
 * Smooth Auto-Typing Indicator Animation
 * Creates natural, smooth typing effect for input placeholders and button text
 * Stops automatically when user interacts
 */

(function() {
  'use strict';

  // Smooth typing function with natural variations
  function createSmoothTypingIndicator(element, text, options = {}) {
    // Prevent duplicate initialization
    if (element.hasAttribute('data-typing-initialized')) {
      return;
    }
    element.setAttribute('data-typing-initialized', 'true');

    const {
      minTypeSpeed = 60,        // Minimum typing speed (ms) - faster for smooth feel
      maxTypeSpeed = 120,       // Maximum typing speed (ms)
      minDeleteSpeed = 30,      // Minimum deleting speed (ms)
      maxDeleteSpeed = 60,      // Maximum deleting speed (ms)
      pauseBeforeDelete = 2500, // Pause before deleting (ms)
      pauseAfterDelete = 600,   // Pause after deleting (ms)
      loop = true,
      startDelay = 500          // Initial delay before starting
    } = options;

    let currentText = '';
    let isDeleting = false;
    let charIndex = 0;
    let timeoutId = null;
    let isPaused = false;
    let hasStarted = false; // Track if animation has started

    // Get random speed for natural variation
    function getRandomSpeed(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function type() {
      // Stop if element has value (for inputs) or is focused
      if (element.value && element.value.trim() !== '') {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (element.setAttribute) {
          element.setAttribute('placeholder', '');
        }
        return;
      }

      // Stop if element is focused (for inputs only, not for button text)
      if (element.setAttribute && element === document.activeElement) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (element.setAttribute) {
          element.setAttribute('placeholder', '');
        }
        return;
      }

      // Stop if paused
      if (isPaused) {
        return;
      }

      const fullText = text;

      if (!isDeleting && charIndex < fullText.length) {
        // Typing with smooth, natural speed variation
        currentText = fullText.substring(0, charIndex + 1);
        
        // Check if element is an input element (not just if it has setAttribute)
        if (element.tagName === 'INPUT' && element.setAttribute) {
          // For input elements - set placeholder
          element.setAttribute('placeholder', currentText);
        } else if (element.textContent !== undefined) {
          // For text elements (span, div, etc.) - set text content directly
          // Fixed width CSS prevents layout shifts
          element.textContent = currentText;
        }
        
        charIndex++;

        // Natural speed variation: faster for common letters, slower for spaces/punctuation
        let speed = getRandomSpeed(minTypeSpeed, maxTypeSpeed);
        const char = fullText[charIndex - 1];
        
        if (char && ['a', 'e', 'i', 'o', 'u', 'r', 's', 't', 'n'].includes(char.toLowerCase())) {
          speed = getRandomSpeed(minTypeSpeed, minTypeSpeed + 20); // Faster for common letters
        } else if (char && [' ', '.', ',', '!', '-'].includes(char)) {
          speed = getRandomSpeed(maxTypeSpeed - 15, maxTypeSpeed + 10); // Slightly slower for punctuation
        }

        timeoutId = setTimeout(type, speed);
      } else if (!isDeleting && charIndex >= fullText.length) {
        // Finished typing, wait then start deleting
        timeoutId = setTimeout(() => {
          isDeleting = true;
          type();
        }, pauseBeforeDelete);
      } else if (isDeleting && currentText.length > 0) {
        // Deleting with smooth speed
        currentText = currentText.substring(0, currentText.length - 1);
        
        // Check if element is an input element (not just if it has setAttribute)
        if (element.tagName === 'INPUT' && element.setAttribute) {
          element.setAttribute('placeholder', currentText);
        } else if (element.textContent !== undefined) {
          // For text elements - set text content
          // Fixed width container prevents layout shifts
          element.textContent = currentText;
        }
        
        const deleteSpeed = getRandomSpeed(minDeleteSpeed, maxDeleteSpeed);
        timeoutId = setTimeout(type, deleteSpeed);
      } else if (isDeleting && currentText.length === 0) {
        // Finished deleting, reset
        isDeleting = false;
        charIndex = 0;
        hasStarted = false; // Reset flag for next loop
        if (loop) {
          timeoutId = setTimeout(() => {
            type();
          }, pauseAfterDelete);
        }
      }
    }

    // Start typing when element is not focused and empty
    function checkAndStart() {
      // Only check focus for input elements, not for button text
      if (element.setAttribute && element === document.activeElement) {
        return; // Don't start if focused (inputs only)
      }
      
      // For input elements, check if has value
      if (element.value && element.value.trim() !== '') {
        return; // Don't start if has value
      }
      
      // For text elements (like button text), check if empty or matches original
      if (element.textContent !== undefined) {
        const currentTextContent = element.textContent.trim();
        const targetText = text.trim();
        
        // If text matches original exactly and animation hasn't started, clear it to start typing animation
        if (currentTextContent === targetText && !hasStarted) {
          element.textContent = '';
          // Reset animation state for fresh start
          currentText = '';
          charIndex = 0;
          isDeleting = false;
          hasStarted = true;
        }
        // If text is empty, start typing from beginning
        else if (currentTextContent === '') {
          // Already empty, ready to start typing
          currentText = '';
          charIndex = 0;
          isDeleting = false;
          hasStarted = true;
        }
        // If text is partially typed (animation in progress), continue from current position
        else if (currentTextContent.length > 0 && currentTextContent.length < targetText.length && targetText.startsWith(currentTextContent)) {
          // Animation is in progress, continue from current position
          charIndex = currentTextContent.length;
          currentText = currentTextContent;
          isDeleting = false;
          hasStarted = true;
        }
        // If text doesn't match at all, don't start (user might have changed it)
        else if (currentTextContent !== '' && !targetText.startsWith(currentTextContent)) {
          return;
        }
      }

      if (!timeoutId && !isPaused) {
        // Reset state if needed
        if (!hasStarted) {
          currentText = '';
          charIndex = 0;
          isDeleting = false;
          hasStarted = true;
        }
        type();
      }
    }

    // Stop typing when user focuses/interacts (only for input elements)
    if (element.addEventListener && element.setAttribute) {
      // Only add focus/click handlers for input elements, not for button text
      element.addEventListener('focus', function() {
        isPaused = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (element.setAttribute) {
          element.setAttribute('placeholder', '');
        }
      });

      element.addEventListener('click', function() {
        isPaused = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (element.setAttribute) {
          element.setAttribute('placeholder', '');
        }
      });

      // Resume typing when user blurs and input is empty (for inputs only)
      element.addEventListener('blur', function() {
        if (!element.value || element.value.trim() === '') {
          isPaused = false;
          setTimeout(checkAndStart, 500);
        }
      });
    }

    // Start typing with delay
    setTimeout(() => {
      checkAndStart();
    }, startDelay);
  }

  // Initialize for input fields
  function initInputFieldTyping() {
    // Standard calculator inputs
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');

    // Glass elevation page inputs
    const glassWidthInput = document.getElementById('glassWidth');
    const glassHeightInput = document.getElementById('glassHeight');

    // Multiple sizes calculator inputs
    const container = document.getElementById('calc-sizes-container');
    
    // Handle standard calculator inputs
    if (widthInput) {
      widthInput.setAttribute('placeholder', '');
      createSmoothTypingIndicator(widthInput, 'Width', {
        minTypeSpeed: 60,
        maxTypeSpeed: 120,
        minDeleteSpeed: 30,
        maxDeleteSpeed: 60,
        pauseBeforeDelete: 2500,
        pauseAfterDelete: 600,
        startDelay: 500
      });
    }

    if (heightInput) {
      heightInput.setAttribute('placeholder', '');
      setTimeout(() => {
        createSmoothTypingIndicator(heightInput, 'Height', {
          minTypeSpeed: 60,
          maxTypeSpeed: 120,
          minDeleteSpeed: 30,
          maxDeleteSpeed: 60,
          pauseBeforeDelete: 2500,
          pauseAfterDelete: 600,
          startDelay: 500
        });
      }, 700);
    }

    // Handle glass elevation page inputs
    if (glassWidthInput) {
      glassWidthInput.setAttribute('placeholder', '');
      createSmoothTypingIndicator(glassWidthInput, 'Width', {
        minTypeSpeed: 60,
        maxTypeSpeed: 120,
        minDeleteSpeed: 30,
        maxDeleteSpeed: 60,
        pauseBeforeDelete: 2500,
        pauseAfterDelete: 600,
        startDelay: 500
      });
    }

    if (glassHeightInput) {
      glassHeightInput.setAttribute('placeholder', '');
      setTimeout(() => {
        createSmoothTypingIndicator(glassHeightInput, 'Height', {
          minTypeSpeed: 60,
          maxTypeSpeed: 120,
          minDeleteSpeed: 30,
          maxDeleteSpeed: 60,
          pauseBeforeDelete: 2500,
          pauseAfterDelete: 600,
          startDelay: 500
        });
      }, 700);
    }

    // Handle multiple sizes calculator inputs
    if (container) {
      // Initialize for existing rows
      initMultipleSizesInputs(container);

      // Watch for new rows being added
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1 && node.classList && node.classList.contains('calc-size-row')) {
                setTimeout(() => {
                  initMultipleSizesInputs(node);
                }, 200);
              }
            });
          }
        });
      });

      observer.observe(container, {
        childList: true,
        subtree: false
      });
    }
  }

  // Initialize typing for multiple sizes inputs
  function initMultipleSizesInputs(containerElement) {
    const container = containerElement || document.getElementById('calc-sizes-container');
    if (!container) return;

    const widthInputs = container.querySelectorAll('.calc-size-width:not([data-typing-initialized])');
    const heightInputs = container.querySelectorAll('.calc-size-height:not([data-typing-initialized])');

    widthInputs.forEach((input, index) => {
      if (input && !input.hasAttribute('data-typing-initialized')) {
        input.setAttribute('placeholder', '');
        createSmoothTypingIndicator(input, 'Width', {
          minTypeSpeed: 60,
          maxTypeSpeed: 120,
          minDeleteSpeed: 30,
          maxDeleteSpeed: 60,
          pauseBeforeDelete: 2500,
          pauseAfterDelete: 600,
          startDelay: 300 + (index * 100) // Stagger each row
        });
      }
    });

    heightInputs.forEach((input, index) => {
      if (input && !input.hasAttribute('data-typing-initialized')) {
        input.setAttribute('placeholder', '');
        setTimeout(() => {
          createSmoothTypingIndicator(input, 'Height', {
            minTypeSpeed: 60,
            maxTypeSpeed: 120,
            minDeleteSpeed: 30,
            maxDeleteSpeed: 60,
            pauseBeforeDelete: 2500,
            pauseAfterDelete: 600,
            startDelay: 300 + (index * 100) // Stagger each row
          });
        }, 400 + (index * 100));
      }
    });
  }


  // Export function globally for multiple-sizes-calculator.js
  window.createSmoothTypingIndicator = createSmoothTypingIndicator;
  window.initMultipleSizesInputs = initMultipleSizesInputs;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        initInputFieldTyping();
      }, 800);
    });
  } else {
    setTimeout(() => {
      initInputFieldTyping();
    }, 800);
  }
})();

