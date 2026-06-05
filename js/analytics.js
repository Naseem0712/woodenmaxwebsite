/**
 * Google Analytics — WoodenMax
 * One generate_lead per successful form/email only; debounced calculator noise.
 */
(function () {
  'use strict';

  /** Always queue/send — never skip registering handlers if gtag loads late. */
  function sendEvent(eventName, params) {
    var payload = Object.assign({}, params || {});
    if (!payload.page_path && typeof window !== 'undefined' && window.location) {
      payload.page_path = window.location.pathname;
    }
    if (typeof gtag === 'function') {
      gtag('event', eventName, payload);
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, payload));
  }

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
    sendEvent('generate_lead', params);
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
    sendEvent('engagement_time', {
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
    sendEvent(eventName, Object.assign({}, defaultParams, eventParams || {}));
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
    }, 3500);
  };

  var lastLiveCalcKey = '';
  var lastLiveCalcAt = 0;

  /** Fired when sticky bar / mobile UX shows a live total (all calculator types). */
  window.trackLiveEstimateCalculated = function (totalCost, totalArea, productId) {
    var key = (productId || '') + '|' + Math.round(totalCost || 0);
    var now = Date.now();
    if (key === lastLiveCalcKey && now - lastLiveCalcAt < 5000) return;
    lastLiveCalcKey = key;
    lastLiveCalcAt = now;
    trackCalculatorEvent('calculator_calculation', {
      event_label: 'Live Estimate Calculated',
      total_cost: totalCost,
      total_area: totalArea,
      product_id: productId || '',
      value: Math.round(totalCost || 0)
    });
  };

  window.trackEstimateEvent = function (eventName, params) {
    var base = {
      event_category: 'Project Estimate',
      page_path: typeof window !== 'undefined' && window.location ? window.location.pathname : '',
      non_interaction: !(params && params.non_interaction === false)
    };
    sendEvent(eventName, Object.assign(base, params || {}));
  };

  window.trackEstimateItemSaved = function (addedCount, meta) {
    trackEstimateEvent('estimate_item_saved', {
      event_label: 'Configuration Saved',
      items_added: addedCount || 1,
      estimate_item_count: meta && meta.totalItems,
      product_name: meta && meta.productName,
      total_amount: meta && meta.amount,
      non_interaction: false,
      value: meta && meta.amount ? Math.round(meta.amount) : 0
    });
    sendEvent('calculator_save_configuration', {
      event_category: 'Project Estimate',
      event_label: 'Configuration Saved',
      items_added: addedCount || 1,
      estimate_item_count: meta && meta.totalItems,
      product_name: meta && meta.productName,
      total_amount: meta && meta.amount,
      value: meta && meta.amount ? Math.round(meta.amount) : 0,
      non_interaction: false
    });
  };

  window.trackEstimateOpened = function (itemCount) {
    trackEstimateEvent('estimate_opened', {
      event_label: 'Project Estimate Opened',
      estimate_item_count: itemCount || 0,
      non_interaction: false
    });
  };

  window.trackEstimatePdfDownload = function (itemCount, totalInr) {
    trackEstimateEvent('estimate_pdf_download', {
      event_label: 'Quote PDF Downloaded',
      estimate_item_count: itemCount || 0,
      total_amount: totalInr || 0,
      non_interaction: false,
      value: Math.round(totalInr || 0)
    });
    sendEvent('calculator_pdf_download', {
      event_category: 'Project Estimate',
      event_label: 'Quote PDF Downloaded',
      estimate_item_count: itemCount || 0,
      total_amount: totalInr || 0,
      value: Math.round(totalInr || 0),
      non_interaction: false
    });
    trackLeadConversion('estimate_pdf', { wm_items: itemCount || 0 });
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

  window.trackEstimateItemRemoved = function (itemCount) {
    trackEstimateEvent('estimate_item_removed', {
      estimate_item_count: itemCount || 0,
      non_interaction: false
    });
  };

  window.trackEstimatePrint = function (kind, itemCount, totalInr) {
    trackEstimateEvent('estimate_print', {
      event_label: kind === 'payment_receipt' ? 'Payment Receipt Print' : 'Quote PDF Print',
      print_kind: kind || 'quote_pdf',
      estimate_item_count: itemCount || 0,
      total_amount: totalInr || 0,
      non_interaction: false
    });
  };

  window.trackEstimateShare = function (channel, itemCount) {
    trackEstimateEvent('estimate_share', {
      event_label: channel === 'whatsapp' ? 'WhatsApp Share' : 'Email Share',
      share_channel: channel || 'unknown',
      estimate_item_count: itemCount || 0,
      non_interaction: false
    });
  };

  var lastCalcViewKey = '';

  window.trackCalculatorPageView = function (productId, productName) {
    var key = String(productId || '') + '|' + String(productName || '');
    if (key === lastCalcViewKey) return;
    lastCalcViewKey = key;
    sendEvent('calculator_view', {
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
    sendEvent('contact_page_view', {
      event_category: 'Contact',
      wm_intent: intent || 'general',
      wm_source: source || 'direct',
      non_interaction: true
    });
  };
})();
