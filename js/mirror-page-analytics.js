/**
 * GA4 helpers for /products/mirror-profiles/* pages.
 * Requires gtag + analytics.js in <head>.
 */
(function () {
  'use strict';

  var path = typeof location !== 'undefined' ? location.pathname || '' : '';
  if (!/\/products\/mirror-profiles\/?/i.test(path)) return;

  function track(name, params) {
    if (typeof gtag !== 'function') return;
    gtag('event', name, Object.assign({
      event_category: 'Mirror Profiles',
      page_path: path,
      content_group: 'mirror_profiles'
    }, params || {}));
  }

  var slug = path.replace(/\/+$/, '').split('/').pop() || 'hub';
  if (slug === 'mirror-profiles') slug = 'hub';

  track('mirror_page_view', {
    mirror_slug: slug,
    page_title: document.title || '',
    non_interaction: true
  });

  if (typeof window.trackCalculatorPageView === 'function') {
    window.trackCalculatorPageView(slug, document.title || slug);
  }

  window.trackMirrorCalculatorRun = function (snap) {
    if (!snap) return;
    var key = (snap.slug || slug) + '|' + Math.round(snap.orderTotal || snap.perPiece || 0);
    var now = Date.now();
    if (key === window.__wmLastMirrorCalcKey && now - (window.__wmLastMirrorCalcAt || 0) < 4000) return;
    window.__wmLastMirrorCalcKey = key;
    window.__wmLastMirrorCalcAt = now;
    track('mirror_calculator_run', {
      event_label: snap.slug || slug,
      mirror_slug: snap.slug || slug,
      total_cost: snap.orderTotal || snap.perPiece || 0,
      mirror_area_sqft: snap.dims ? snap.dims.sqft : 0,
      value: Math.round(snap.orderTotal || snap.perPiece || 0),
      non_interaction: true
    });
    if (typeof window.trackCalculatorCalculation === 'function') {
      window.trackCalculatorCalculation(snap.orderTotal || snap.perPiece, snap.dims ? snap.dims.sqft : 0, {
        glass: snap.opts && snap.opts.glassBrand,
        coating: snap.opts && snap.opts.color,
        lock: snap.mode || 'mirror',
        mesh: false
      });
    }
  };

  window.trackMirrorInquirySubmit = function (snap) {
    track('mirror_inquiry_submit', {
      event_label: snap && snap.slug ? snap.slug : slug,
      mirror_slug: snap && snap.slug ? snap.slug : slug,
      non_interaction: false
    });
    if (typeof window.trackLeadConversion === 'function') {
      window.trackLeadConversion('mirror_catalog_inquiry', {
        mirror_slug: snap && snap.slug ? snap.slug : slug
      });
    }
  };
})();
