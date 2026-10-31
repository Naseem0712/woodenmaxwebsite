/* Reusable progressive enhancement for gallery-first product page pilots. */
(function () {
  'use strict';

  function createAccordion(group, label, nodes) {
    var item = document.createElement('section');
    var heading = document.createElement('h2');
    var button = document.createElement('button');
    var content = document.createElement('div');
    var contentId = 'wm-product-pilot-panel-' + (group.children.length + 1);

    item.className = 'wm-product-pilot-accordion-item';
    heading.className = 'wm-product-pilot-accordion-heading';
    button.type = 'button';
    button.className = 'wm-product-pilot-accordion-trigger';
    button.textContent = label;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', contentId);
    content.className = 'wm-product-pilot-accordion-content';
    content.id = contentId;
    content.hidden = true;

    nodes.forEach(function (node) {
      content.appendChild(node);
    });

    button.addEventListener('click', function () {
      var opening = content.hidden;
      Array.prototype.forEach.call(group.querySelectorAll('.wm-product-pilot-accordion-content'), function (panel) {
        panel.hidden = true;
      });
      Array.prototype.forEach.call(group.querySelectorAll('.wm-product-pilot-accordion-trigger'), function (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
      });
      content.hidden = !opening;
      button.setAttribute('aria-expanded', opening ? 'true' : 'false');
    });

    heading.appendChild(button);
    item.appendChild(heading);
    item.appendChild(content);
    group.appendChild(item);
  }

  function sourceLabel(source) {
    var heading = source.querySelector('h2, h3, h4');
    return heading ? heading.textContent.trim() : 'Product details';
  }

  function stripExistingToggle(source) {
    Array.prototype.forEach.call(source.querySelectorAll('.mobile-toggle-btn'), function (toggle) {
      toggle.remove();
    });
  }

  function wireOneOpenDetails(root) {
    Array.prototype.forEach.call(root.querySelectorAll('[data-product-pilot-one-open-details] details'), function (detail) {
      if (detail.dataset.productPilotBound === 'true') return;
      detail.addEventListener('toggle', function () {
        if (!detail.open) return;
        Array.prototype.forEach.call(detail.closest('[data-product-pilot-one-open-details]').querySelectorAll('details[open]'), function (other) {
          if (other !== detail) other.open = false;
        });
      });
      detail.dataset.productPilotBound = 'true';
    });
  }

  function initializePilot(root) {
    if (root.dataset.productPilotReady === 'true') return;

    var flow = root.querySelector('.wm-product-pilot-flow');
    var gallery = root.querySelector('.wm-product-pilot-gallery');
    var intro = root.querySelector('.wm-product-pilot-intro');
    var context = root.querySelector('.wm-product-pilot-context');
    var identity = root.querySelector('.wm-product-pilot-identity');
    var calculatorColumn = root.querySelector('.wm-product-pilot-calculator-column');
    var calculator = root.querySelector('.price-calculator-container[data-product], .wm-product-pilot-calculator');

    if (!flow || !gallery || !identity || !calculatorColumn || !calculator) return;

    if (context) flow.insertBefore(context, flow.firstChild);
    flow.insertBefore(gallery, calculatorColumn);
    flow.insertBefore(identity, calculatorColumn);
    if (intro) intro.remove();

    var packages = calculatorColumn.querySelector('#wm-standard-packages, .wm-std-pkg[data-product-id]');
    var accordionGroup = document.createElement('div');
    accordionGroup.className = 'wm-product-pilot-accordions';
    accordionGroup.setAttribute('aria-label', 'Product details');

    var preCalculatorNodes = [];
    Array.prototype.forEach.call(calculatorColumn.children, function (child) {
      if (calculator.parentElement !== calculatorColumn) return;
      if (child === calculator) return;
      if (child.compareDocumentPosition(calculator) & Node.DOCUMENT_POSITION_FOLLOWING) {
        preCalculatorNodes.push(child);
      }
    });

    if (calculator.parentElement === calculatorColumn) {
      calculatorColumn.insertBefore(calculator, calculatorColumn.firstChild);
    }
    if (packages) {
      packages.insertAdjacentElement('afterend', accordionGroup);
    } else {
      calculatorColumn.appendChild(accordionGroup);
    }

    if (preCalculatorNodes.length && !calculatorColumn.hasAttribute('data-product-pilot-preserve-calculator-lead')) {
      createAccordion(accordionGroup, 'Pricing, options and calculator guide', preCalculatorNodes);
    }

    Array.prototype.forEach.call(root.querySelectorAll('[data-product-pilot-source]'), function (source) {
      var label = sourceLabel(source);
      stripExistingToggle(source);
      createAccordion(accordionGroup, label, [source]);
    });

    var technicalSpecs = document.querySelector('[data-product-pilot-technical-specs]');
    if (technicalSpecs) {
      createAccordion(accordionGroup, 'Technical specifications', [technicalSpecs]);
    }

    wireOneOpenDetails(root);

    root.dataset.productPilotReady = 'true';
    root.classList.add('wm-product-pilot-ready');
  }

  function resolveFinderTarget(button) {
    var href = button ? button.getAttribute('href') : '';
    if (href && href.indexOf('#') === 0) {
      var byId = document.getElementById(href.slice(1));
      if (byId) return byId;
    }
    return document.querySelector(
      '.price-calculator-container[data-product], ' +
      '.wm-product-pilot-calculator, ' +
      '.wm-window-calc, ' +
      '[id^="price-calculator"], ' +
      '[id^="price-calc-"]'
    );
  }

  function isMasterCostFinderPage() {
    var family = document.body.getAttribute('data-product-family') || '';
    // Master v1 floating capsule pages (windows / folding / telescope children).
    return document.body.classList.contains('page-window-pro') ||
      family === 'aluminium-window' ||
      family === 'folding-system' ||
      family === 'telescope-window';
  }

  function elementIntersectsViewport(el) {
    if (!el || typeof el.getBoundingClientRect !== 'function') return false;
    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!vh) return false;
    // Require a meaningful slice in view — a 1px peek at the bottom must not hide the capsule.
    var visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    return visible > Math.min(120, vh * 0.18);
  }

  /**
   * Master v1 Cost Calculator capsule: rename label, smooth-scroll to calc top,
   * hide while the calculator block intersects the viewport.
   * Reparent to <body> so position:fixed is never trapped by transform/filter ancestors.
   */
  function initWindowCostCalculatorFinder() {
    var buttons = document.querySelectorAll('.wm-calculator-finder');
    if (!buttons.length) return;
    if (!isMasterCostFinderPage()) return;

    Array.prototype.forEach.call(buttons, function (button) {
      if (button.dataset.wmCostFinderBound === 'true') return;
      button.dataset.wmCostFinderBound = 'true';
      button.textContent = 'Cost Calculator';
      button.setAttribute('aria-label', 'Cost Calculator');

      if (button.parentElement !== document.body) {
        document.body.appendChild(button);
      }

      var calculator = resolveFinderTarget(button);
      var calcInView = false;

      function refreshVisibility() {
        var overlayOpen = document.body.classList.contains('calc-sheet-open') ||
          document.body.classList.contains('calc-form-open');
        button.classList.toggle('is-calc-in-view', !!calcInView);
        button.classList.toggle('is-suppressed', !!overlayOpen);
      }

      function syncCalcInView(next) {
        calcInView = !!next;
        refreshVisibility();
      }

      function measureCalcInView() {
        syncCalcInView(elementIntersectsViewport(calculator));
      }

      function scrollToCalculator(e) {
        if (e) e.preventDefault();
        if (!calculator) return;
        var rect = calculator.getBoundingClientRect();
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var offset = 96;
        window.scrollTo({ top: Math.max(0, rect.top + scrollTop - offset), behavior: 'smooth' });
        // Smooth scroll may finish after IO settles — re-measure at end of frame + shortly after.
        window.requestAnimationFrame(measureCalcInView);
        window.setTimeout(measureCalcInView, 320);
      }

      button.addEventListener('click', scrollToCalculator);

      if (calculator && typeof IntersectionObserver === 'function') {
        var io = new IntersectionObserver(function () {
          measureCalcInView();
        }, {
          root: null,
          // Shrink the observation box so a calc footer peek does not count as "in view".
          rootMargin: '-12% 0px -28% 0px',
          threshold: [0, 0.08, 0.16, 0.28]
        });
        io.observe(calculator);
        measureCalcInView();
      } else if (calculator) {
        measureCalcInView();
        window.addEventListener('scroll', measureCalcInView, { passive: true });
        window.addEventListener('resize', measureCalcInView);
      } else {
        refreshVisibility();
      }

      document.addEventListener('wm-fab-overlay-change', refreshVisibility);
    });
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-product-page-layout="gallery-first"]'), initializePilot);
    initWindowCostCalculatorFinder();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
