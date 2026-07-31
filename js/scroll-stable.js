/**
 * js/scroll-stable.js — stop unwanted auto-scroll on refresh/load.
 *
 * Root causes this guards against:
 *  1. html { scroll-behavior: smooth } animating browser scroll restoration
 *  2. Late layout shifts (nav/footer/EEAT/sticky bar) fighting restoration
 *
 * Intentional user clicks (anchor chips, FAB, package → calc) still use
 * scrollIntoView / scrollTo with behavior:'smooth' in their handlers.
 */
(function (global) {
  'use strict';

  if (global.WMScrollStable) return;

  var html = document.documentElement;
  var userInteracted = false;
  var armedUntil = 0;
  var pinnedY = 0;
  var pinTimer = null;
  var settleTimer = null;
  var settling = true;

  function now () { return Date.now(); }

  function readY () {
    return global.scrollY || global.pageYOffset || html.scrollTop || 0;
  }

  function writeY (y) {
    var top = Math.max(0, Math.round(Number(y) || 0));
    try {
      global.scrollTo({ top: top, left: 0, behavior: 'auto' });
    } catch (e) {
      global.scrollTo(0, top);
    }
  }

  /** Kill CSS smooth-scroll so refresh restoration is instant, not animated. */
  function disableSmoothScroll () {
    try {
      html.style.setProperty('scroll-behavior', 'auto');
    } catch (e) { /* ignore */ }
  }

  function stopPin () {
    armedUntil = 0;
    if (pinTimer) {
      clearInterval(pinTimer);
      pinTimer = null;
    }
  }

  function markInteracted () {
    userInteracted = true;
    settling = false;
    stopPin();
    if (settleTimer) {
      clearTimeout(settleTimer);
      settleTimer = null;
    }
  }

  function capture () {
    return readY();
  }

  function restore (y) {
    if (userInteracted) return;
    if (typeof y !== 'number' || isNaN(y)) return;
    writeY(y);
  }

  /** Run a layout-mutating fn without letting scrollY drift. */
  function around (fn) {
    var y = capture();
    var result;
    try {
      result = typeof fn === 'function' ? fn() : undefined;
    } finally {
      restore(y);
      if (global.requestAnimationFrame) {
        global.requestAnimationFrame(function () { restore(y); });
      }
    }
    return result;
  }

  /**
   * Re-pin scroll against late layout shifts after the browser has settled.
   * Aborts immediately on any real user input.
   */
  function arm (ms) {
    if (userInteracted) return;
    pinnedY = readY();
    armedUntil = now() + (typeof ms === 'number' ? ms : 1600);

    if (pinTimer) clearInterval(pinTimer);
    pinTimer = setInterval(function () {
      if (userInteracted || now() > armedUntil) {
        stopPin();
        return;
      }
      if (Math.abs(readY() - pinnedY) > 4) writeY(pinnedY);
    }, 50);
  }

  function beginSettleWatch () {
    settling = true;
    pinnedY = readY();

    function onScroll () {
      if (userInteracted) return;
      if (!settling) return;
      // Track browser restoration / hash positioning while settling.
      pinnedY = readY();
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(function () {
        settling = false;
        arm(1600);
      }, 140);
    }

    global.addEventListener('scroll', onScroll, { passive: true });

    settleTimer = setTimeout(function () {
      settling = false;
      arm(1600);
    }, 220);
  }

  function boot () {
    disableSmoothScroll();

    if ('scrollRestoration' in global.history) {
      try { global.history.scrollRestoration = 'auto'; } catch (e2) { /* ignore */ }
    }

    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (evt) {
      global.addEventListener(evt, markInteracted, { passive: true, capture: true });
    });

    function afterLoad () {
      disableSmoothScroll();
      beginSettleWatch();
    }

    if (document.readyState === 'complete') {
      afterLoad();
    } else {
      global.addEventListener('load', afterLoad, { once: true });
    }

    global.addEventListener('pageshow', function (e) {
      disableSmoothScroll();
      if (e && e.persisted && !userInteracted) {
        beginSettleWatch();
      }
    });
  }

  global.WMScrollStable = {
    disableSmoothScroll: disableSmoothScroll,
    capture: capture,
    restore: restore,
    around: around,
    arm: arm,
    markInteracted: markInteracted
  };

  boot();
})(typeof window !== 'undefined' ? window : this);
