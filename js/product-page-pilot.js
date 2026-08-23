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

  function initializePilot(root) {
    if (root.dataset.productPilotReady === 'true') return;

    var flow = root.querySelector('.wm-product-pilot-flow');
    var gallery = root.querySelector('.wm-product-pilot-gallery');
    var intro = root.querySelector('.wm-product-pilot-intro');
    var context = root.querySelector('.wm-product-pilot-context');
    var identity = root.querySelector('.wm-product-pilot-identity');
    var calculatorColumn = root.querySelector('.wm-product-pilot-calculator-column');
    var calculator = root.querySelector('.price-calculator-container[data-product]');

    if (!flow || !gallery || !intro || !context || !identity || !calculatorColumn || !calculator) return;

    flow.insertBefore(context, flow.firstChild);
    flow.insertBefore(gallery, calculatorColumn);
    flow.insertBefore(identity, calculatorColumn);
    intro.remove();

    var packages = calculatorColumn.querySelector('#wm-standard-packages');
    var accordionGroup = document.createElement('div');
    accordionGroup.className = 'wm-product-pilot-accordions';
    accordionGroup.setAttribute('aria-label', 'Product details');

    var preCalculatorNodes = [];
    Array.prototype.forEach.call(calculatorColumn.children, function (child) {
      if (child === calculator) return;
      if (child.compareDocumentPosition(calculator) & Node.DOCUMENT_POSITION_FOLLOWING) {
        preCalculatorNodes.push(child);
      }
    });

    calculatorColumn.insertBefore(calculator, calculatorColumn.firstChild);
    if (packages) {
      packages.insertAdjacentElement('afterend', accordionGroup);
    } else {
      calculatorColumn.appendChild(accordionGroup);
    }

    if (preCalculatorNodes.length) {
      createAccordion(accordionGroup, 'Pricing, options and calculator guide', preCalculatorNodes);
    }

    Array.prototype.forEach.call(gallery.querySelectorAll(':scope > [data-product-pilot-source]'), function (source) {
      var label = sourceLabel(source);
      stripExistingToggle(source);
      createAccordion(accordionGroup, label, [source]);
    });

    var technicalSpecs = document.querySelector('[data-product-pilot-technical-specs]');
    if (technicalSpecs) {
      createAccordion(accordionGroup, 'Technical specifications', [technicalSpecs]);
    }

    root.dataset.productPilotReady = 'true';
    root.classList.add('wm-product-pilot-ready');
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-product-page-layout="gallery-first"]'), initializePilot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
