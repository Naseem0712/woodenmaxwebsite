/**
 * Google Analytics — WoodenMax
 * One generate_lead per successful form/email only; debounced calculator noise.
 */
(function () {
  'use strict';

  if (typeof gtag === 'undefined') return;

  var lastLeadKey = '';
  var lastLeadAt = 0;
  var debounceTimers = {};

  function debounce(key, fn, ms) {
    if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
    debounceTimers[key] = setTimeout(fn, ms);
  }

  /** Single GA4 conversion event — deduped within 5s for same method+path */
  function trackLeadConversion(method, extra) {
    var pagePath = typeof window !== 'undefined' && window.location ? window.location.pathname : '';
    var dedupeKey = (method || 'unknown') + '|' + pagePath;
    var now = Date.now();
    if (dedupeKey === lastLeadKey && now - lastLeadAt < 5000) return;
    lastLeadKey = dedupeKey;
    lastLeadAt = now;

    var params = {
      method: method || 'unknown',
      event_category: 'Lead',
      page_path: pagePath,
      value: 1
    };
    if (extra && typeof extra === 'object') {
      Object.keys(extra).forEach(function (k) {
        params[k] = extra[k];
      });
    }
    gtag('event', 'generate_lead', params);
  }

  window.trackLeadConversion = trackLeadConversion;

  // --- Light engagement (no periodic spam; GA4 already measures engagement) ---
  var totalEngagementMs = 0;
  var lastActiveAt = Date.now();
  var pageVisible = true;
  var engagementSent = false;

  function tickEngagement() {
    if (pageVisible) totalEngagementMs += Date.now() - lastActiveAt;
    lastActiveAt = Date.now();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (pageVisible) tickEngagement();
      pageVisible = false;
    } else {
      lastActiveAt = Date.now();
      pageVisible = true;
    }
  });

  ['scroll', 'click', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function () {
      if (!pageVisible) return;
      tickEngagement();
    }, { passive: true });
  });

  function sendEngagementOnce() {
    if (engagementSent) return;
    tickEngagement();
    if (totalEngagementMs < 10000) return;
    engagementSent = true;
    gtag('event', 'engagement_time', {
      engagement_time_msec: totalEngagementMs,
      non_interaction: true
    });
  }

  window.addEventListener('pagehide', sendEngagementOnce);
  window.addEventListener('beforeunload', sendEngagementOnce);

  // --- Calculator helpers ---
  window.trackCalculatorEvent = function (eventName, eventParams) {
    var defaultParams = {
      event_category: 'Calculator',
      non_interaction: true
    };
    gtag('event', eventName, Object.assign({}, defaultParams, eventParams || {}));
  };

  window.trackCalculatorSize = function (width, height, unit, quantity) {
    debounce('calc_size', function () {
      trackCalculatorEvent('calculator_size_change', {
        event_label: 'Size Input',
        width: width,
        height: height,
        unit: unit,
        quantity: quantity
      });
    }, 4000);
  };

  window.trackCalculatorMaterial = function (materialType, materialValue) {
    debounce('calc_mat_' + materialType, function () {
      trackCalculatorEvent('calculator_material_selection', {
        event_label: 'Material Selection',
        material_type: materialType,
        material_value: materialValue
      });
    }, 3000);
  };

  window.trackCalculatorCalculation = function (totalCost, totalArea, selections) {
    debounce('calc_run', function () {
      trackCalculatorEvent('calculator_calculation', {
        event_label: 'Price Calculated',
        total_cost: totalCost,
        total_area: totalArea,
        glass_type: (selections && selections.glass) || 'unknown',
        coating_type: (selections && selections.coating) || 'unknown',
        lock_type: (selections && selections.lock) || 'unknown',
        has_mesh: (selections && selections.mesh) || false,
        value: Math.round(totalCost || 0)
      });
    }, 8000);
  };

  /** After email API success only — one custom + one generate_lead */
  window.trackCalculatorFormSubmit = function (formType, hasPrice) {
    trackCalculatorEvent('calculator_quote_submit', {
      event_label: 'Form Submitted',
      form_type: formType,
      has_price: !!hasPrice,
      non_interaction: false
    });
    trackLeadConversion(formType || 'calculator_quote', { has_price: hasPrice ? 1 : 0 });
  };

  window.trackContactFormSubmit = function (extra) {
    trackLeadConversion('contact_form', extra || {});
  };

  window.trackCalculatorPageView = function (productId, productName) {
    gtag('event', 'calculator_view', {
      event_category: 'Calculator',
      event_label: 'Calculator Opened',
      product_id: productId,
      product_name: productName,
      non_interaction: true
    });
  };

  /** Mobile quote cart / PDF gate — success only */
  window.trackMobileLeadSubmit = function (intent, itemCount) {
    trackCalculatorEvent('calculator_mobile_submit', {
      wm_intent: intent,
      wm_items: itemCount,
      non_interaction: false
    });
    trackLeadConversion(intent === 'export-pdf' ? 'calc_pdf_quote' : 'calc_exact_price', {
      wm_items: itemCount
    });
  };

  window.trackContactPageContext = function (intent, source) {
    gtag('event', 'contact_page_view', {
      event_category: 'Contact',
      wm_intent: intent || 'general',
      wm_source: source || 'direct',
      non_interaction: true
    });
  };
})();
