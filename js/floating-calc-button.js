/**
 * Floating Calculator Button
 * Scroll-to-calculator FAB; hides when calculator is in view or estimate overlays are open.
 */
(function () {
  'use strict';

  function resolveCalculatorTarget (button) {
    var href = button ? button.getAttribute('href') : '';
    var anchor = null;

    if (href && href.indexOf('#') === 0) {
      anchor = document.getElementById(href.substring(1));
    }

    if (anchor) {
      var inner = anchor.querySelector('.price-calculator-container') ||
        anchor.querySelector('#product-pricing-root') ||
        anchor.querySelector('#wmCatalogCalc') ||
        anchor.querySelector('[data-grill-calculator]');
      if (inner) return inner;
      return anchor;
    }

    return document.querySelector('.price-calculator-container') ||
      document.querySelector('#product-pricing-root') ||
      document.querySelector('#wmCatalogCalc') ||
      document.querySelector('[data-grill-calculator]') ||
      document.querySelector('[id^="price-calculator"]');
  }

  function overlayBlocksFab () {
    return document.body.classList.contains('calc-sheet-open') ||
      document.body.classList.contains('calc-form-open');
  }

  function initFloatingCalcButton () {
    var button = document.querySelector('.floating-calc-button');
    if (!button) return;

    var buttonText = button.querySelector('.floating-calc-button-text');
    if (!buttonText) return;

    var defaultText = buttonText.textContent.trim() ||
      buttonText.getAttribute('data-original-text') ||
      buttonText.innerHTML.trim() ||
      'Try Calculator';

    buttonText.textContent = defaultText;
    buttonText.innerHTML = defaultText;
    buttonText.setAttribute('data-original-text', defaultText);

    function setButtonColors () {
      buttonText.style.color = '#475569';
      buttonText.style.textShadow = 'none';
      var svg = button.querySelector('svg');
      if (svg) svg.style.stroke = '#475569';
    }

    setTimeout(setButtonColors, 100);

    var colorCheckTimeout;
    window.addEventListener('scroll', function () {
      clearTimeout(colorCheckTimeout);
      colorCheckTimeout = setTimeout(setButtonColors, 150);
    }, { passive: true });

    buttonText.style.cssText += 'display: inline-block !important; opacity: 1 !important; visibility: visible !important; font-weight: 700 !important; font-size: 0.95rem !important; overflow: visible !important; line-height: 1.2 !important;';

    var href = button.getAttribute('href');
    if (href && href.indexOf('#') !== 0) {
      button.style.display = '';
      button.style.opacity = '1';
      button.style.visibility = 'visible';
      button.style.pointerEvents = 'auto';
      if (buttonText.textContent.trim() === '') {
        buttonText.textContent = buttonText.getAttribute('data-original-text') || 'Try Calculator';
      }
      return;
    }

    var calculatorArea = resolveCalculatorTarget(button);
    var calcInView = false;
    var scrollTimeout = null;
    var isScrolling = false;

    function setFabSuppressed (suppressed) {
      button.classList.toggle('is-suppressed', !!suppressed);
    }

    function refreshFabVisibility () {
      setFabSuppressed(calcInView || overlayBlocksFab());
    }

    function wireVisibilityObserver () {
      if (!calculatorArea || typeof IntersectionObserver === 'undefined') {
        refreshFabVisibility();
        return;
      }

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          calcInView = entry.isIntersecting && entry.intersectionRatio > 0.08;
          refreshFabVisibility();
        });
      }, {
        root: null,
        rootMargin: '-8px 0px -8px 0px',
        threshold: [0, 0.05, 0.1, 0.2, 0.35, 0.5]
      });

      io.observe(calculatorArea);
      refreshFabVisibility();
    }

    function scrollToCalculator () {
      if (!calculatorArea) return;
      isScrolling = true;
      setFabSuppressed(true);

      var rect = calculatorArea.getBoundingClientRect();
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var targetPosition = rect.top + scrollTop - 96;

      window.scrollTo({ top: Math.max(0, targetPosition), behavior: 'smooth' });

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        isScrolling = false;
        refreshFabVisibility();
      }, 900);
    }

    button.addEventListener('click', function (e) {
      e.preventDefault();
      scrollToCalculator();
    });

    document.addEventListener('wm-fab-overlay-change', refreshFabVisibility);

    if (!calculatorArea) {
      setTimeout(function () {
        calculatorArea = resolveCalculatorTarget(button);
        if (!calculatorArea) {
          button.style.display = 'none';
          return;
        }
        wireVisibilityObserver();
      }, 500);
      return;
    }

    wireVisibilityObserver();

    window.addEventListener('resize', function () {
      if (!isScrolling) refreshFabVisibility();
    }, { passive: true });
  }

  function initButtonTextTyping () {
    var buttonText = document.querySelector('.floating-calc-button-text');
    if (!buttonText) {
      setTimeout(initButtonTextTyping, 200);
      return;
    }

    var originalText = buttonText.textContent.trim() ||
      buttonText.getAttribute('data-original-text') ||
      buttonText.innerHTML.trim() ||
      'Try Calculator';

    buttonText.setAttribute('data-original-text', originalText);
    buttonText.textContent = originalText;
    buttonText.innerHTML = originalText;
    buttonText.style.cssText += 'display: inline-block !important; opacity: 1 !important; visibility: visible !important; font-weight: 700 !important; font-size: 0.95rem !important; overflow: visible !important; line-height: 1.2 !important;';

    function tryInitTyping () {
      if (window.createSmoothTypingIndicator) {
        setTimeout(function () {
          if (buttonText && buttonText.textContent.trim() === originalText) {
            window.createSmoothTypingIndicator(buttonText, originalText, {
              minTypeSpeed: 70,
              maxTypeSpeed: 130,
              minDeleteSpeed: 35,
              maxDeleteSpeed: 65,
              pauseBeforeDelete: 3000,
              pauseAfterDelete: 800,
              startDelay: 3000,
              loop: true
            });
          }
        }, 1000);
      } else {
        var elapsed = Date.now() - (window.typingInitStartTime || Date.now());
        if (elapsed < 3000) setTimeout(tryInitTyping, 200);
      }
    }

    window.typingInitStartTime = Date.now();
    tryInitTyping();
  }

  window.WMFloatingCalcButton = {
    refresh: function () {
      document.dispatchEvent(new CustomEvent('wm-fab-overlay-change'));
    }
  };

  function boot () {
    setTimeout(function () {
      initFloatingCalcButton();
      setTimeout(initButtonTextTyping, 1000);
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
