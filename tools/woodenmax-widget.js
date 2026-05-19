/**
 * WoodenMax embeddable price calculator widget
 * Usage:
 *   <script src="https://woodenmax.in/tools/woodenmax-widget.js"></script>
 *   <div id="woodenmax-calculator"></div>
 * Attribution: "Powered by WoodenMax" required
 */
(function () {
  'use strict';

  var ORIGIN = 'https://woodenmax.in';
  var container = document.getElementById('woodenmax-calculator');
  if (!container) return;

  container.innerHTML =
    '<div class="wm-widget" style="font-family:system-ui,sans-serif;border:1px solid #ddd;padding:20px;border-radius:8px;max-width:420px;background:#fff;color:#111">' +
    '<h3 style="margin:0 0 12px;font-size:1.1rem">Aluminium Price Calculator</h3>' +
    '<label style="display:block;margin-bottom:8px;font-size:13px">Product<select id="wm-product" style="display:block;width:100%;margin-top:4px;padding:8px">' +
    '<option value="3track-sliding">3-Track Sliding Window</option>' +
    '<option value="29mm-sliding">29mm System Window</option>' +
    '<option value="wooden-finish-aluminium-louvers">Aluminium Louver</option>' +
    '<option value="round-touch">Mirror Profile</option>' +
    '</select></label>' +
    '<label style="display:block;margin-bottom:8px;font-size:13px">Width (ft)<input id="wm-width" type="number" min="0.5" step="0.5" placeholder="6" style="display:block;width:100%;margin-top:4px;padding:8px;box-sizing:border-box"></label>' +
    '<label style="display:block;margin-bottom:8px;font-size:13px">Height (ft)<input id="wm-height" type="number" min="0.5" step="0.5" placeholder="4.5" style="display:block;width:100%;margin-top:4px;padding:8px;box-sizing:border-box"></label>' +
    '<label style="display:block;margin-bottom:12px;font-size:13px">Glass<select id="wm-glass" style="display:block;width:100%;margin-top:4px;padding:8px">' +
    '<option value="6mm">6mm Clear</option><option value="dgu">DGU Glass</option><option value="8mm">8mm Clear</option>' +
    '</select></label>' +
    '<button type="button" id="wm-calc-btn" style="width:100%;padding:10px 16px;background:#1a5f4a;color:#fff;border:0;border-radius:6px;cursor:pointer;font-weight:600">Calculate Price</button>' +
    '<div id="wm-result" style="margin-top:14px;font-size:14px;line-height:1.5"></div>' +
    '<p style="margin:14px 0 0;font-size:11px;color:#888"><a href="https://woodenmax.in" target="_blank" rel="noopener">Powered by WoodenMax</a></p>' +
    '</div>';

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function loadJson(url) {
    return fetch(url, { mode: 'cors' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  var engineReady = loadScript(ORIGIN + '/data/pricing-engine.js')
    .then(function () {
      return Promise.all([
        loadJson(ORIGIN + '/data/products.json'),
        loadJson(ORIGIN + '/data/rates.json'),
        loadJson(ORIGIN + '/data/mirror.json'),
      ]);
    })
    .then(function (arr) {
      window.WoodenMaxPricingEngine.init({
        products: arr[0],
        rates: arr[1],
        mirror: arr[2],
      });
    });

  function formatInr(n) {
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  function runCalc() {
    var resultEl = document.getElementById('wm-result');
    resultEl.textContent = 'Calculating…';
    engineReady
      .then(function () {
        var product = document.getElementById('wm-product').value;
        var width = document.getElementById('wm-width').value;
        var height = document.getElementById('wm-height').value;
        var glass = document.getElementById('wm-glass').value;
        var data = window.WoodenMaxPricingEngine.calculate({
          product: product,
          width: width,
          height: height,
          glass: glass,
        });
        if (data.error) {
          resultEl.innerHTML = '<span style="color:#b00020">' + data.message + '</span>';
          return;
        }
        var wa =
          data.contact.whatsapp_url +
          '?text=' +
          encodeURIComponent(data.contact.whatsapp_message);
        resultEl.innerHTML =
          '<strong>Estimated: ' +
          formatInr(data.result.total_price) +
          '</strong><br>Per sqft: ' +
          formatInr(data.result.price_per_sqft) +
          '<br>With GST 18%: ' +
          formatInr(data.result.total_with_gst) +
          '<br><a href="' +
          wa +
          '" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;color:#1a5f4a">Get exact quote on WhatsApp →</a>' +
          '<p style="font-size:11px;color:#666;margin:8px 0 0">*GST 18% extra | Transport extra | Final price after site visit</p>';
      })
      .catch(function () {
        resultEl.innerHTML =
          'Could not load calculator. <a href="' +
          ORIGIN +
          '/api/calculate?product=' +
          encodeURIComponent(document.getElementById('wm-product').value) +
          '&width=' +
          encodeURIComponent(document.getElementById('wm-width').value) +
          '&height=' +
          encodeURIComponent(document.getElementById('wm-height').value) +
          '" target="_blank" rel="noopener">Open pricing API</a>';
      });
  }

  document.getElementById('wm-calc-btn').addEventListener('click', runCalc);
})();
