/**
 * Razorpay Standard Checkout
 * - Mixed cart: ₹1,000 booking only
 * - Mirror-only cart: user chooses ₹1,000 booking OR exact order amount
 */
(function () {
  'use strict';

  var BOOKING_PAISE = 100000;
  var DEFAULT_API = 'https://jolly-field-be49.finilexnaseem.workers.dev';

  function paymentsApiBase () {
    if (window.WOODENMAX_PAYMENTS && window.WOODENMAX_PAYMENTS.apiBase) {
      return String(window.WOODENMAX_PAYMENTS.apiBase).replace(/\/$/, '');
    }
    if (window.EMAIL_WORKER_URL) {
      return String(window.EMAIL_WORKER_URL).replace(/\/$/, '');
    }
    return DEFAULT_API;
  }

  function fmtInr (n) {
    var x = Math.round(Number(n) || 0);
    return '₹' + x.toLocaleString('en-IN');
  }

  function isMirrorItem (it) {
    if (!it) return false;
    if (it.category && /mirror/i.test(it.category)) return true;
    if (it.mirrorMeta) return true;
    return false;
  }

  function cartSubtotalInr (items) {
    var sum = 0;
    (items || []).forEach(function (it) {
      if (it && typeof it.exactAmount === 'number' && it.exactAmount > 0) {
        sum += it.exactAmount;
      } else if (it && it.amount) {
        var digits = String(it.amount).replace(/[^0-9]/g, '');
        sum += parseInt(digits, 10) || 0;
      }
    });
    return Math.round(sum);
  }

  function isCartAllMirror (items) {
    var list = items || [];
    return list.length > 0 && list.every(isMirrorItem);
  }

  function isCartMixed (items) {
    var list = items || [];
    if (!list.length) return false;
    var hasMirror = list.some(isMirrorItem);
    var hasOther = list.some(function (it) { return !isMirrorItem(it); });
    return hasMirror && hasOther;
  }

  /**
   * @param {object[]} items
   * @param {'booking'|'mirror_full'} payChoice
   */
  function buildPaymentPlan (items, payChoice) {
    var list = items || [];
    var sub = cartSubtotalInr(list);
    var allMirror = isCartAllMirror(list);
    var mixed = isCartMixed(list);
    var choice = payChoice || 'booking';

    if (mixed) {
      choice = 'booking';
    }

    if (choice === 'mirror_full' && allMirror && sub >= 1) {
      return {
        mode: 'mirror_full',
        amountInr: sub,
        amountPaise: sub * 100,
        label: 'Confirm order — Pay ' + fmtInr(sub),
        description: 'Mirror order — exact sizes (pre-GST). Non-refundable after 3 days. GST & transit extra.',
        cartKind: 'mirror_only',
      };
    }

    return {
      mode: 'booking',
      amountInr: 1000,
      amountPaise: BOOKING_PAISE,
      label: 'Book order — Pay ₹1,000',
      description: mixed
        ? 'Mixed cart booking — ₹1,000 slot (balance after site visit & approval)'
        : (allMirror
          ? 'Mirror booking — ₹1,000 returnable before production'
          : 'Order confirmation — ₹1,000 booking (returnable before production starts)'),
      cartKind: mixed ? 'mixed' : (allMirror ? 'mirror_only' : 'other'),
    };
  }

  /** Default plan for cart label (booking). */
  function resolvePaymentPlan (items) {
    return buildPaymentPlan(items, 'booking');
  }

  function loadCheckoutScript () {
    return new Promise(function (resolve, reject) {
      if (window.Razorpay) {
        resolve();
        return;
      }
      if (document.querySelector('script[src*="checkout.razorpay.com"]')) {
        var wait = setInterval(function () {
          if (window.Razorpay) {
            clearInterval(wait);
            resolve();
          }
        }, 50);
        setTimeout(function () {
          clearInterval(wait);
          if (window.Razorpay) resolve();
          else reject(new Error('Razorpay checkout script failed to load'));
        }, 8000);
        return;
      }
      var s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Could not load Razorpay checkout.js')); };
      document.head.appendChild(s);
    });
  }

  function postJson (path, payload) {
    return fetch(paymentsApiBase() + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var err = new Error((data && data.error) || (data && data.message) || ('HTTP ' + res.status));
          err.status = res.status;
          err.payload = data;
          throw err;
        }
        return data;
      });
    });
  }

  function isRazorpayTestKey (keyId) {
    return /^rzp_test_/i.test(String(keyId || ''));
  }

  function isRazorpayLiveKey (keyId) {
    return /^rzp_live_/i.test(String(keyId || ''));
  }

  var _paymentsHealthCache = null;

  function fetchPaymentsHealth (forceRefresh) {
    if (_paymentsHealthCache && !forceRefresh) {
      return Promise.resolve(_paymentsHealthCache);
    }
    return fetch(paymentsApiBase() + '/health', { method: 'GET' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        _paymentsHealthCache = data || {};
        return _paymentsHealthCache;
      })
      .catch(function () {
        return { ok: false, razorpay_mode: null };
      });
  }

  function formatPaymentError (errOrDesc) {
    var msg = typeof errOrDesc === 'string'
      ? errOrDesc
      : (errOrDesc && errOrDesc.message) ? errOrDesc.message : 'Payment failed';
    var payload = errOrDesc && errOrDesc.payload;
    if (/authentication failed/i.test(msg) || (errOrDesc && errOrDesc.status === 401)) {
      var hint = payload && payload.hint;
      var prefix = payload && payload.key_id_prefix;
      return '<strong>Razorpay keys galat (Cloudflare Worker).</strong> ' +
        (hint || 'Dashboard → API Keys se Key ID + Secret dubara copy karein, Deploy karein.') +
        (prefix ? ' Key: <code>' + prefix + '…</code>' : '') +
        ' Test/Live dono same mode hon. Amount debit hua ho to +91 78953 28080.';
    }
    if (/international/i.test(msg)) {
      return '<strong>Card rejected.</strong> Indian debit/credit card try karein. International cards ke liye Razorpay Dashboard → Payment methods → enable karein.';
    }
    if (/invalid|incorrect|not correct|does not exist/i.test(msg) && /upi|vpa/i.test(msg)) {
      var live = payload && payload.razorpay_mode === 'live';
      if (live) {
        return '<strong>UPI failed.</strong> QR dubara scan karein (PhonePe / GPay) aur phone par approve karein. Ya Netbanking / Card try karein. Issue rahe to +91 78953 28080.';
      }
      return '<strong>UPI (test keys).</strong> Real PhonePe QR scan kaam nahi karta. Live keys lagao ya Netbanking / Card test karein.';
    }
    if (/upi/i.test(msg) && /qr|scan|timeout/i.test(msg)) {
      return 'UPI: QR ko phone se scan karein (PhonePe / Google Pay / Paytm). Payment phone par approve karein, tab yahan success dikhega.';
    }
    return msg;
  }

  function openRazorpayModal (lead, plan, order) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      function done (fn, val) {
        if (settled) return;
        settled = true;
        fn(val);
      }

      var testMode = isRazorpayTestKey(order.key_id);

      var rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'WoodenMax Architectural Elements',
        description: plan.description,
        order_id: order.order_id,
        prefill: {
          name: lead.name || '',
          email: lead.email || '',
          contact: lead.mobile || '',
        },
        notes: {
          purpose: plan.mode === 'mirror_full' ? 'mirror_full_pay' : 'order_booking',
          env: testMode ? 'test' : 'live',
        },
        theme: { color: '#B45309' },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        handler: function (response) {
          postJson('/api/verify-payment', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
            .then(function (verified) {
              done(resolve, {
                verified: verified,
                payment: response,
                order: order,
                plan: plan,
              });
            })
            .catch(function (err) {
              done(reject, err);
            });
        },
        modal: {
          ondismiss: function () {
            done(reject, new Error('Payment cancelled'));
          },
        },
      });

      rzp.on('payment.failed', function (resp) {
        var desc =
          (resp.error && resp.error.description) ||
          (resp.error && resp.error.reason) ||
          'Payment failed';
        var err = new Error(formatPaymentError(desc));
        err.razorpay = resp.error || {};
        done(reject, err);
      });

      rzp.open();
    });
  }

  /**
   * @param {{ lead: object, items: object[], payChoice?: string, onStatus?: function }} options
   */
  function startCheckout (options) {
    options = options || {};
    var lead = options.lead || {};
    var items = options.items || [];
    var onStatus = typeof options.onStatus === 'function' ? options.onStatus : function () {};

    if (!items.length) {
      return Promise.reject(new Error('Add at least one item to the quote cart before paying.'));
    }

    if (isCartMixed(items)) {
      options.payChoice = 'booking';
    }

    var plan = buildPaymentPlan(items, options.payChoice);

    if (plan.mode === 'mirror_full' && plan.amountPaise < 100) {
      return Promise.reject(new Error('Calculator total is too low. Check mirror size & options.'));
    }

    onStatus('loading', 'Preparing secure payment…');

    return loadCheckoutScript()
      .then(function () {
        return postJson('/api/create-order', {
          purpose: plan.mode === 'mirror_full' ? 'mirror_full_pay' : 'order_booking',
          amount: plan.amountPaise,
          currency: 'INR',
          receipt: (plan.mode === 'mirror_full' ? 'wm_mirror_' : 'wm_book_') + Date.now(),
          notes: {
            lead_name: lead.name || '',
            lead_mobile: lead.mobile || '',
            lead_city: lead.city || '',
            lead_email: lead.email || '',
            item_count: String(items.length),
            payment_mode: plan.mode,
            cart_kind: plan.cartKind,
            amount_inr: String(plan.amountInr),
          },
        });
      })
      .then(function (order) {
        if (!order || !order.order_id || !order.key_id) {
          throw new Error('Invalid order response from server');
        }
        var liveMode = isRazorpayLiveKey(order.key_id) || order.razorpay_mode === 'live';
        if (liveMode) {
          onStatus('live', 'Live payment — real amount will be charged');
        } else if (isRazorpayTestKey(order.key_id)) {
          onStatus('test', 'Test mode — no real money');
        }
        onStatus('modal', plan.mode === 'mirror_full'
          ? ('Pay ' + fmtInr(plan.amountInr) + ' securely')
          : 'Pay ₹1,000 booking securely');
        return openRazorpayModal(lead, plan, order);
      });
  }

  function startBookingCheckout (options) {
    return startCheckout(options);
  }

  window.WoodenMaxRazorpay = {
    BOOKING_AMOUNT_INR: 1000,
    BOOKING_AMOUNT_PAISE: BOOKING_PAISE,
    apiBase: paymentsApiBase,
    isRazorpayTestKey: isRazorpayTestKey,
    isRazorpayLiveKey: isRazorpayLiveKey,
    fetchPaymentsHealth: fetchPaymentsHealth,
    buildPaymentPlan: buildPaymentPlan,
    resolvePaymentPlan: resolvePaymentPlan,
    formatPaymentError: formatPaymentError,
    cartSubtotalInr: cartSubtotalInr,
    isMirrorItem: isMirrorItem,
    isCartAllMirror: isCartAllMirror,
    isCartMixed: isCartMixed,
    startCheckout: startCheckout,
    startBookingCheckout: startBookingCheckout,
  };
})();
