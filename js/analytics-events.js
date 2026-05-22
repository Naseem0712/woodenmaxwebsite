/**
 * Site-wide GA4 click tracking via event delegation.
 * Requires gtag + analytics.js on the page.
 */
(function () {
  'use strict';

  function track(name, params) {
    if (typeof gtag !== 'function') return;
    var base = {
      page_path: typeof location !== 'undefined' ? location.pathname : '',
      non_interaction: false
    };
    gtag('event', name, Object.assign(base, params || {}));
  }

  function labelFrom(el) {
    return (
      el.getAttribute('data-ga-event') ||
      el.getAttribute('data-track') ||
      (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) ||
      'interaction'
    );
  }

  document.addEventListener(
    'click',
    function (ev) {
      var el = ev.target && ev.target.closest ? ev.target.closest('a, button') : null;
      if (!el || el.hasAttribute('data-ga-skip')) return;

      var gaEv = el.getAttribute('data-ga-event');
      if (gaEv) {
        track(gaEv, {
          event_category: el.getAttribute('data-ga-category') || 'Engagement',
          event_label: labelFrom(el)
        });
        return;
      }

      var href = (el.getAttribute('href') || '').toLowerCase();

      if (
        /wa\.me|whatsapp\.com|api\.whatsapp/.test(href) ||
        el.classList.contains('whatsapp-btn') ||
        el.classList.contains('catalog-wa-btn')
      ) {
        track('wm_whatsapp_click', { event_category: 'Lead', event_label: labelFrom(el) });
        return;
      }

      if (href.indexOf('tel:') === 0) {
        track('wm_phone_click', { event_category: 'Lead', event_label: labelFrom(el) });
        return;
      }

      if (
        el.classList.contains('cluster-cta-primary') ||
        el.classList.contains('cluster-cta-secondary') ||
        el.classList.contains('cluster-cta-link')
      ) {
        track('wm_cta_click', { event_category: 'Lead', event_label: labelFrom(el) });
        return;
      }

      if (el.id === 'catalogCalcBtn' || el.classList.contains('catalog-calc-submit')) {
        track('calculator_run', {
          event_category: 'Calculator',
          event_label: 'catalog_quick_calc',
          non_interaction: true
        });
      }
    },
    true
  );
})();
