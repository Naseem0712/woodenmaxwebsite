/**
 * WoodenMax — show calculator prices in the visitor's currency outside India.
 * India (IN): unchanged INR. Elsewhere: Indian base amount × live FX × regional premium.
 * Geo: ipapi.co · FX: open.er-api.com (INR base, no API key).
 *
 * NOTE: The same logic is inlined at the top of js/main.js so it runs before calculators.
 *       If you change premiums or URLs, update both this file and main.js.
 */
(function (global) {
  'use strict';

  if (global.__wmPricingModuleLoaded) return;
  global.__wmPricingModuleLoaded = true;

  var CACHE_KEY = 'wm_pricing_ctx_v2';
  var TTL_MS = 12 * 60 * 60 * 1000;
  var FX_URL = 'https://open.er-api.com/v6/latest/INR';
  var GEO_URL = 'https://ipapi.co/json/';

  var EUROZONE = {
    AT: 1, BE: 1, CY: 1, EE: 1, FI: 1, FR: 1, DE: 1, GR: 1, IE: 1, IT: 1,
    LV: 1, LT: 1, LU: 1, MT: 1, NL: 1, PT: 1, SK: 1, SI: 1, ES: 1, HR: 1
  };

  /** Extra % on top of FX. US/UK: ~30–60% band → 45% midpoint. India = 0. */
  function premiumForCountry(code) {
    if (!code || String(code).toUpperCase() === 'IN') return 0;
    var c = String(code).toUpperCase();
    if (c === 'US' || c === 'GB') return 0.45;
    if (EUROZONE[c]) return 0.2;
    if (c === 'SA') return 0.125;
    if (c === 'KW') return 0.165;
    if (c === 'AE' || c === 'QA' || c === 'BH' || c === 'OM') return 0.12;
    return 0.1;
  }

  function targetCurrency(countryCode, geoCurrency) {
    var c = String(countryCode || '').toUpperCase();
    if (c === 'IN') return 'INR';
    if (EUROZONE[c]) return 'EUR';
    var cur = String(geoCurrency || 'USD').toUpperCase();
    if (cur === 'INR') return 'USD';
    return cur;
  }

  function localeFor(countryCode, currency) {
    var c = String(countryCode || '').toUpperCase();
    var cur = String(currency || '').toUpperCase();
    if (c === 'US' || cur === 'USD') return 'en-US';
    if (c === 'GB' || cur === 'GBP') return 'en-GB';
    if (cur === 'EUR') return 'de-DE';
    if (cur === 'SAR') return 'en-SA';
    if (cur === 'AED') return 'en-AE';
    if (cur === 'KWD') return 'ar-KW';
    if (cur === 'QAR') return 'ar-QA';
    if (cur === 'BHD') return 'ar-BH';
    if (cur === 'OMR') return 'ar-OM';
    return 'en-US';
  }

  function bindFormatters(state) {
    global.__wmPricing = state;
    global.formatPriceFromINR = function (amountInr) {
      var n = Number(amountInr) || 0;
      var p = global.__wmPricing;
      if (!p || !p.foreign) {
        try {
          return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            currencyDisplay: 'symbol',
            maximumFractionDigits: 0,
            minimumFractionDigits: 0
          }).format(Math.round(n));
        } catch (e2) {
          return '\u20B9' + Math.round(n).toLocaleString('en-IN');
        }
      }
      var mult = p.rates && p.rates[p.currency];
      if (mult == null || mult === 0) {
        return '\u20B9' + Math.round(n).toLocaleString('en-IN');
      }
      var localVal = n * mult * (1 + p.premium);
      var rounded = Math.round(localVal);
      try {
        return new Intl.NumberFormat(p.locale, {
          style: 'currency',
          currency: p.currency,
          currencyDisplay: 'symbol',
          maximumFractionDigits: 0,
          minimumFractionDigits: 0
        }).format(rounded);
      } catch (e) {
        return rounded.toLocaleString(p.locale) + '\u00a0' + p.currency;
      }
    };
    global.formatPriceRangeFromINR = function (lowInr, highInr) {
      return global.formatPriceFromINR(lowInr) + ' \u2013 ' + global.formatPriceFromINR(highInr);
    };

    if (state && state.foreign && state.countryCode) {
      try {
        if (typeof global.gtag === 'function') {
          global.gtag('event', 'wm_global_pricing_view', {
            wm_country: state.countryCode,
            wm_currency: state.currency,
            wm_premium: state.premium,
            wm_url_test: state.pricingTestOverride ? 1 : 0
          });
        }
      } catch (e) {}
    }
  }

  function domesticState() {
    return {
      foreign: false,
      premium: 0,
      currency: 'INR',
      countryCode: 'IN',
      locale: 'en-IN',
      rates: null
    };
  }

  function loadCached() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.ts || Date.now() - o.ts > TTL_MS) return null;
      return o.data;
    } catch (e) {
      return null;
    }
  }

  function saveCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (e) {}
  }

  function buildForeignState(countryCode, currencyFromGeo, rates) {
    var cc = String(countryCode || 'US').toUpperCase();
    var currency = targetCurrency(cc, currencyFromGeo);
    var rate = rates[currency];
    if (rate == null || rate === 0) {
      currency = 'USD';
      rate = rates['USD'];
    }
    return {
      foreign: true,
      premium: premiumForCountry(cc),
      currency: currency,
      countryCode: cc,
      locale: localeFor(cc, currency),
      rates: rates
    };
  }

  function refreshCalculators() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', refreshCalculators);
      return;
    }
    var k;
    for (k in global) {
      if (!Object.prototype.hasOwnProperty.call(global, k) || k.indexOf('calculator_') !== 0) continue;
      var calc = global[k];
      if (calc && typeof calc.calculate === 'function') {
        try {
          calc.calculate();
        } catch (e) {}
      }
    }
    if (typeof global.wmRefreshPergolaPricingDisplay === 'function') {
      try {
        global.wmRefreshPergolaPricingDisplay();
      } catch (e) {}
    }
    if (typeof global.wmRecalculateAllSizeRows === 'function') {
      try {
        global.wmRecalculateAllSizeRows();
      } catch (e) {}
    }
  }

  function dispatchReady() {
    try {
      global.dispatchEvent(new CustomEvent('wm-pricing-ready'));
    } catch (e) {}
    refreshCalculators();
  }

  function fetchJson(url) {
    return fetch(url, { credentials: 'omit' }).then(function (res) {
      if (!res.ok) throw new Error('http');
      return res.json();
    });
  }

  /** Live test: ?wmPricingCountry=US (ISO2). Skips session cache. */
  function pricingCountryOverride() {
    try {
      var m = location.search.match(/(?:^|[?&])wmPricingCountry=([A-Za-z]{2})(?:&|$)/);
      return m ? m[1].toUpperCase() : null;
    } catch (e) {
      return null;
    }
  }

  function run() {
    var urlOverride = pricingCountryOverride();
    var cached = urlOverride ? null : loadCached();
    if (cached) {
      bindFormatters(cached);
    } else {
      bindFormatters(domesticState());
    }

    Promise.all([fetchJson(GEO_URL), fetchJson(FX_URL)])
      .then(function (pair) {
        var geo = pair[0];
        var fx = pair[1];
        var rates = fx && fx.rates;
        if (!rates) {
          if (!cached) {
            bindFormatters(domesticState());
            dispatchReady();
          }
          return;
        }
        var cc = urlOverride;
        if (!cc) {
          cc = geo && (geo.country_code || geo.country)
            ? String(geo.country_code || geo.country).toUpperCase()
            : 'IN';
        }
        if (cc === 'IN') {
          var dom = domesticState();
          bindFormatters(dom);
          if (!urlOverride) saveCache(dom);
          dispatchReady();
          return;
        }
        var st = buildForeignState(cc, (geo && geo.currency) || 'USD', rates);
        st.pricingTestOverride = !!urlOverride;
        bindFormatters(st);
        if (!urlOverride) saveCache(st);
        dispatchReady();
      })
      .catch(function () {
        if (!cached) {
          bindFormatters(domesticState());
          dispatchReady();
        }
      });
  }

  run();
})(typeof window !== 'undefined' ? window : this);
