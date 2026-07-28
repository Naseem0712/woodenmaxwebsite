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
    if (it.category && /mirror profiles/i.test(String(it.category))) return true;
    if (it.category && /mirror/i.test(it.category) && it.mirrorMeta) return true;
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
   * @param {'booking'|'mirror_full'|'order_full'|'custom'} payChoice
   * @param {number} [customAmountInr]
   */
  function buildPaymentPlan (items, payChoice, customAmountInr) {
    var list = items || [];
    var sub = cartSubtotalInr(list);
    var allMirror = isCartAllMirror(list);
    var mixed = isCartMixed(list);
    var choice = payChoice || 'booking';

    if (mixed) {
      choice = 'booking';
    }

    if (choice === 'custom' && !mixed) {
      var custom = Math.round(Number(customAmountInr) || 0);
      // ₹1 floor (Razorpay), ₹5L ceiling — no ₹100 / ₹1,000 gate on custom.
      if (custom >= 1 && custom <= 500000) {
        return {
          mode: 'custom',
          amountInr: custom,
          amountPaise: custom * 100,
          label: 'Pay custom amount — ' + fmtInr(custom),
          description: 'Custom advance / part payment (pre-GST). Balance after site approval. Non-refundable after 3 days once processing starts.',
          cartKind: mixed ? 'mixed' : (allMirror ? 'mirror_only' : 'other'),
        };
      }
      // Invalid custom amount — keep mode=custom with 0 so UI can show the error
      // instead of silently switching to ₹1,000 booking.
      return {
        mode: 'custom',
        amountInr: 0,
        amountPaise: 0,
        label: 'Enter custom amount (₹1–₹5,00,000)',
        description: 'Custom amount must be between ₹1 and ₹5,00,000.',
        cartKind: mixed ? 'mixed' : (allMirror ? 'mirror_only' : 'other'),
      };
    }

    if ((choice === 'mirror_full' || choice === 'order_full') && !mixed && sub >= 1) {
      if (allMirror || choice === 'mirror_full') {
        if (allMirror) {
          return {
            mode: 'mirror_full',
            amountInr: sub,
            amountPaise: sub * 100,
            label: 'Confirm order — Pay ' + fmtInr(sub),
            description: 'Mirror order — exact sizes (pre-GST). Non-refundable after 3 days. GST & transit extra.',
            cartKind: 'mirror_only',
          };
        }
      }
      if (!allMirror) {
        return {
          mode: 'order_full',
          amountInr: sub,
          amountPaise: sub * 100,
          label: 'Confirm order — Pay ' + fmtInr(sub),
          description: 'Full order — calculator / package total (pre-GST). Non-refundable after 3 days once processing starts. GST & transport extra.',
          cartKind: 'other',
        };
      }
    }

    return {
      mode: 'booking',
      amountInr: 1000,
      amountPaise: BOOKING_PAISE,
      label: 'Book order — Pay ₹1,000',
      description: mixed
        ? 'Mixed estimate booking — ₹1,000 slot (balance after site visit & approval)'
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

  /**
   * Persist the estimate server-side before opening the payment modal.
   *
   * This is what lets the server price the order itself, generate the PDF and
   * email it — none of which is possible while the cart lives only in the
   * customer's browser. The quote id is reused across edits so the server keeps
   * versions (v1, v2, …) instead of a pile of unrelated quotes.
   */
  function saveQuoteOnServer (lead, items) {
    var store = window.WoodenMaxQuoteStore;
    var meta = store ? store.meta() : null;
    var list = Array.isArray(items) ? items : (items ? [items] : []);
    // Strip frozen/prototype quirks so the Worker always receives plain JSON.
    var safeItems;
    try {
      safeItems = JSON.parse(JSON.stringify(list));
    } catch (e) {
      return Promise.reject(new Error('Could not prepare your estimate items. Please re-save configurations and try again.'));
    }
    if (!safeItems.length) {
      return Promise.reject(new Error('Save at least one configuration to your project estimate before paying.'));
    }
    return postJson('/api/quote', {
      quote_id: meta ? meta.quoteId : null,
      customer: lead || {},
      items: safeItems,
      source_url: location.href,
    }).then(function (saved) {
      if (store && saved && saved.quote_no) {
        try { store.setQuoteNo(saved.quote_no); } catch (e) { /* non-fatal */ }
      }
      return saved;
    });
  }

  /**
   * Pull the freshly generated PDF down for the customer. Called after a
   * successful payment; a failure here is never fatal because the same PDF is
   * also emailed and stays available at the order URL.
   */
  function downloadOrderPdf (orderNo, attempt) {
    if (!orderNo) return Promise.resolve(false);
    var tries = typeof attempt === 'number' ? attempt : 0;
    var url = paymentsApiBase() + '/api/order/' + encodeURIComponent(orderNo) + '/pdf';
    return fetch(url)
      .then(function (res) {
        if (res.status === 409 && tries < 4) {
          return new Promise(function (resolve) {
            setTimeout(function () {
              resolve(downloadOrderPdf(orderNo, tries + 1));
            }, 1200 * (tries + 1));
          });
        }
        if (!res.ok) throw new Error('PDF not ready (HTTP ' + res.status + ')');
        return res.blob();
      })
      .then(function (blob) {
        if (!blob || typeof blob === 'boolean') return !!blob;
        var href = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = href;
        a.download = 'WoodenMax-' + orderNo + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(href); }, 30000);
        return true;
      })
      .catch(function () { return false; });
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
    var code = payload && payload.code;
    if (code === 'QUOTE_REQUIRED' || /save your estimate|quote required/i.test(msg)) {
      return '<strong>Could not prepare checkout.</strong> Refresh the page (Ctrl+F5), save your configurations again, then retry payment.';
    }
    if (/quote not found|rebuild your estimate/i.test(msg)) {
      return '<strong>Estimate expired.</strong> Please rebuild your project estimate and try again.';
    }
    if (/quote needs at least one item|at least one item/i.test(msg)) {
      return '<strong>Estimate is empty.</strong> Save at least one configuration, then pay.';
    }
    if (/authentication failed/i.test(msg) || (errOrDesc && errOrDesc.status === 401)) {
      var hint = payload && payload.hint;
      var prefix = payload && payload.key_id_prefix;
      return '<strong>Payment gateway keys are misconfigured.</strong> ' +
        (hint || 'Update Razorpay Key ID + Secret on the Cloudflare Worker and redeploy.') +
        (prefix ? ' Key: <code>' + prefix + '…</code>' : '') +
        ' If money was debited, call +91 78953 28080.';
    }
    if (/international/i.test(msg)) {
      return '<strong>Card declined.</strong> Please use an Indian debit/credit card, or enable international cards in Razorpay Dashboard → Payment methods.';
    }
    if (/invalid|incorrect|not correct|does not exist/i.test(msg) && /upi|vpa/i.test(msg)) {
      var live = payload && payload.razorpay_mode === 'live';
      if (live) {
        return '<strong>UPI failed.</strong> Scan the QR again with PhonePe / Google Pay and approve on your phone, or try netbanking / card. Help: +91 78953 28080.';
      }
      return '<strong>UPI (test mode).</strong> Real PhonePe QR scans do not work with test keys. Use live keys, or try netbanking / card.';
    }
    if (/upi/i.test(msg) && /qr|scan|timeout/i.test(msg)) {
      return 'UPI: scan the QR with PhonePe / Google Pay / Paytm and approve the payment on your phone — success will show here afterwards.';
    }
    if (errOrDesc && errOrDesc.status === 400) {
      return '<strong>Checkout rejected.</strong> ' + msg + ' Please refresh and try again, or call +91 78953 28080.';
    }
    return msg;
  }

  function purposeForPlan (plan) {
    if (!plan) return 'order_booking';
    if (plan.mode === 'mirror_full' || plan.mode === 'order_full') return 'order_full_pay';
    if (plan.mode === 'custom') return 'order_custom_pay';
    return 'order_booking';
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
      var purpose = purposeForPlan(plan);
      var quoteId = order.quote_id || null;

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
        // Payment notes are what the webhook sees — quote_id MUST be here.
        notes: {
          quote_id: quoteId || '',
          purpose: purpose,
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
            quote_id: quoteId,
            purpose: purpose,
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
    var rawItems = options.items || [];
    var items = Array.isArray(rawItems) ? rawItems : (rawItems ? [rawItems] : []);
    var onStatus = typeof options.onStatus === 'function' ? options.onStatus : function () {};

    if (!items.length) {
      return Promise.reject(new Error('Save at least one configuration to your project estimate before paying.'));
    }

    if (isCartMixed(items)) {
      options.payChoice = 'booking';
    }

    var plan = buildPaymentPlan(items, options.payChoice, options.customAmountInr);

    if ((plan.mode === 'mirror_full' || plan.mode === 'order_full' || plan.mode === 'custom') && plan.amountPaise < 100) {
      return Promise.reject(new Error(
        plan.mode === 'custom'
          ? 'Enter a custom amount of at least ₹1 (max ₹5,00,000).'
          : 'Payment amount is too low. Check sizes or try again.'
      ));
    }

    onStatus('loading', 'Saving your estimate…');

    var purpose =
      (plan.mode === 'mirror_full' || plan.mode === 'order_full') ? 'order_full_pay' :
      (plan.mode === 'custom' ? 'order_custom_pay' : 'order_booking');
    var quoteId = null;

    return loadCheckoutScript()
      .then(function () {
        return saveQuoteOnServer(lead, items);
      })
      .then(function (saved) {
        quoteId = saved && saved.quote_id;
        if (!quoteId) throw new Error('Could not save your estimate. Please check your connection and try again.');
        onStatus('order', 'Creating secure payment…');
        var payload = {
          purpose: purpose,
          quote_id: quoteId,
          currency: 'INR',
          receipt: (purpose === 'order_full_pay' ? 'wm_full_' : (purpose === 'order_custom_pay' ? 'wm_custom_' : 'wm_book_')) + Date.now(),
          notes: {
            lead_name: lead.name || '',
            lead_mobile: lead.mobile || '',
            lead_city: lead.city || '',
            lead_email: lead.email || '',
            item_count: String(items.length),
            payment_mode: plan.mode,
            cart_kind: plan.cartKind,
          },
        };
        if (plan.mode === 'custom') {
          payload.amount_inr = plan.amountInr;
          payload.notes.custom_amount_inr = String(plan.amountInr);
        }
        return postJson('/api/create-order', payload);
      })
      .then(function (order) {
        if (!order || !order.order_id || !order.key_id) {
          throw new Error('Invalid order response from server');
        }
        order.quote_id = quoteId;
        var liveMode = isRazorpayLiveKey(order.key_id) || order.razorpay_mode === 'live';
        if (liveMode) {
          onStatus('live', 'Live payment — opening checkout…');
        } else if (isRazorpayTestKey(order.key_id)) {
          onStatus('test', 'Test mode — opening checkout…');
        }
        var payLabel = plan.mode === 'custom'
          ? ('Pay ' + fmtInr(plan.amountInr) + ' securely')
          : (plan.mode === 'mirror_full' || plan.mode === 'order_full')
            ? ('Pay ' + fmtInr(plan.amountInr) + ' securely')
            : 'Pay ₹1,000 booking securely';
        onStatus('modal', payLabel);
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
    saveQuoteOnServer: saveQuoteOnServer,
    downloadOrderPdf: downloadOrderPdf,
  };
})();
