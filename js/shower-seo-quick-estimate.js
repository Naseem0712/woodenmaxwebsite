/**
 * Lightweight shower glass area × ₹/sqft estimate for SEO guide pages.
 * Full hardware pricing: link to frameless-shower-partition calculator.
 */
(function () {
  function parseBand(select) {
    var v = select.value.split(',').map(Number);
    return { low: v[0], high: v[1] };
  }

  function fmt(n) {
    if (typeof window.formatPriceFromINR === 'function') return window.formatPriceFromINR(n);
    return '\u20B9' + Math.round(n).toLocaleString('en-IN');
  }

  function fmtBand(lo, hi) {
    if (typeof window.formatPriceRangeFromINR === 'function') return window.formatPriceRangeFromINR(lo, hi);
    return fmt(lo) + ' \u2013 ' + fmt(hi);
  }

  function bind(root) {
    var w = root.querySelector('.js-shower-est-w');
    var h = root.querySelector('.js-shower-est-h');
    var band = root.querySelector('.js-shower-est-band');
    var out = root.querySelector('.js-shower-est-out');
    if (!w || !h || !band || !out) return;

    function update() {
      var wf = parseFloat(w.value, 10);
      var hf = parseFloat(h.value, 10);
      if (!wf || !hf || wf <= 0 || hf <= 0) {
        out.textContent = 'Enter width and height in feet for a ballpark glass-area budget.';
        return;
      }
      var sq = wf * hf;
      var b = parseBand(band);
      var lo = sq * b.low;
      var hi = sq * b.high;
      out.innerHTML =
        'Approx. glass area <strong>' +
        sq.toFixed(2) +
        ' sq.ft</strong> × selected band → about <strong>' +
        fmtBand(lo, hi) +
        '</strong> (indicative only; hardware, profile, site work &amp; GST extra).';
    }

    w.addEventListener('input', update);
    h.addEventListener('input', update);
    band.addEventListener('change', update);
    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-shower-quick-estimate]').forEach(bind);
  });
})();
