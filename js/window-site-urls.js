/**
 * Canonical URLs for woodenmax.in ↔ window.woodenmax.in topical linking.
 * Data source: data/window-subdomain-urls.json (keep in sync manually or via build).
 */
(function () {
  if (typeof window === 'undefined') return;
  window.WOODENMAX_URLS = {
    mainBase: 'https://woodenmax.in',
    windowBase: 'https://window.woodenmax.in',
    /** @param {string} path e.g. /products/aluminium-windows */
    onWindowSite: function (path) {
      var p = path.indexOf('/') === 0 ? path : '/' + path;
      return 'https://window.woodenmax.in' + p;
    },
    /** @param {string} path */
    onMainSite: function (path) {
      var p = path.indexOf('/') === 0 ? path : '/' + path;
      return 'https://woodenmax.in' + p;
    }
  };
})();
