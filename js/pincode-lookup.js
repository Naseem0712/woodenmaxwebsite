/*!
 * js/pincode-lookup.js — enquiry-form location auto-fetch for WoodenMax.
 *
 * Datasets (lazy-loaded only when a field is focused, so page speed is unaffected):
 *   data/pincodes.min.json  { "<pincode>": [district, region, state, [areas...]] }
 *   data/cities.min.json    [[city, pincode, region, state], ...]
 *
 * Usage:
 *   WMPincode.attach({
 *     pincode:  document.getElementById('pincode'),  // optional <input>
 *     city:     document.getElementById('city'),     // optional <input> (gets autocomplete)
 *     area:     document.getElementById('area'),     // optional <input list="..."> for locality
 *     areaList: document.getElementById('areaList'),  // optional <datalist> populated per pincode
 *     onChange: function (info) { ... }              // info = {pincode, office, city, district, region, state, source}
 *   });
 */
(function () {
  'use strict';

  var DATA_VER = '20260620b';
  var pinMap = null, pinPromise = null;
  var cities = null, citiesPromise = null;
  var stylesInjected = false;

  function loadPins() {
    if (pinMap) return Promise.resolve(pinMap);
    if (pinPromise) return pinPromise;
    pinPromise = fetch('/data/pincodes.min.json?v=' + DATA_VER)
      .then(function (r) { if (!r.ok) throw new Error('pin fetch ' + r.status); return r.json(); })
      .then(function (j) { pinMap = j; return j; })
      .catch(function (e) { pinPromise = null; throw e; });
    return pinPromise;
  }

  function loadCities() {
    if (cities) return Promise.resolve(cities);
    if (citiesPromise) return citiesPromise;
    citiesPromise = fetch('/data/cities.min.json?v=' + DATA_VER)
      .then(function (r) { if (!r.ok) throw new Error('city fetch ' + r.status); return r.json(); })
      .then(function (j) { cities = j; return j; })
      .catch(function (e) { citiesPromise = null; throw e; });
    return citiesPromise;
  }

  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    var css =
      '.wm-ac-wrap{position:relative}' +
      '.wm-ac-list{position:absolute;z-index:50;left:0;right:0;top:100%;margin-top:2px;background:#fff;' +
      'border:1px solid #d7dbe3;border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,.12);max-height:240px;' +
      'overflow-y:auto;display:none}' +
      '.wm-ac-list.is-open{display:block}' +
      '.wm-ac-item{padding:.55rem .75rem;font-size:.9rem;color:#1f2937;cursor:pointer;line-height:1.3;' +
      'border-bottom:1px solid #f1f5f9}' +
      '.wm-ac-item:last-child{border-bottom:0}' +
      '.wm-ac-item:hover,.wm-ac-item.is-active{background:#eff3fb}' +
      '.wm-ac-item small{display:block;color:#64748b;font-size:.78rem;margin-top:1px}';
    var s = document.createElement('style');
    s.id = 'wm-pincode-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function attach(opts) {
    opts = opts || {};
    var pinEl = opts.pincode || null;
    var cityEl = opts.city || null;
    var areaEl = opts.area || null;
    var areaList = opts.areaList || null;
    var onChange = typeof opts.onChange === 'function' ? opts.onChange : function () {};

    function fillAreaList(areas) {
      if (!areaList) return;
      areaList.innerHTML = (areas || []).map(function (a) {
        return '<option value="' + a.replace(/"/g, '&quot;') + '"></option>';
      }).join('');
    }

    var info = { pincode: '', office: '', city: '', district: '', region: '', state: '', source: '' };
    function emit(src) { info.source = src; onChange(Object.assign({}, info)); }

    // Warm the datasets as soon as the user engages a field.
    function warm() { loadPins().catch(function () {}); loadCities().catch(function () {}); }
    if (pinEl) pinEl.addEventListener('focus', warm, { once: true });
    if (cityEl) cityEl.addEventListener('focus', warm, { once: true });

    // ---- Pincode -> details + area list ----
    if (pinEl) {
      pinEl.addEventListener('input', function () {
        var v = (pinEl.value || '').replace(/\D/g, '').slice(0, 6);
        if (pinEl.value !== v) pinEl.value = v;
        if (v.length < 6) {
          // PIN cleared/incomplete: clear auto-filled values so user isn't stuck.
          if (info.source === 'pincode' || info.source === 'area') {
            info.pincode = v; info.office = ''; info.district = ''; info.region = ''; info.state = '';
            if (areaEl && areaEl.dataset.wmAuto === '1') { areaEl.value = ''; areaEl.dataset.wmAuto = ''; }
            fillAreaList([]);
            emit('clear');
          }
          return;
        }
        loadPins().then(function (map) {
          var rec = map[v];
          if (!rec) { info.pincode = v; info.district = ''; info.region = ''; info.state = ''; info.office = ''; fillAreaList([]); emit('pincode-unknown'); return; }
          var areas = rec[3] || [];
          info.pincode = v;
          info.district = rec[0] || '';
          info.region = rec[1] || '';
          info.state = rec[2] || '';
          info.city = info.district;
          fillAreaList(areas);
          if (areaEl && (!areaEl.value.trim() || areaEl.dataset.wmAuto === '1')) {
            areaEl.value = areas[0] || '';
            areaEl.dataset.wmAuto = '1';
          }
          info.office = areaEl ? areaEl.value.trim() : (areas[0] || '');
          if (cityEl && (!cityEl.value.trim() || cityEl.dataset.wmAuto === '1')) {
            cityEl.value = info.district;
            cityEl.dataset.wmAuto = '1';
          }
          emit('pincode');
        }).catch(function () {});
      });
    }

    // ---- Area / locality (free text + datalist) ----
    if (areaEl) {
      areaEl.addEventListener('input', function () {
        areaEl.dataset.wmAuto = '';
        info.office = areaEl.value.trim();
        emit('area');
      });
    }

    // ---- City autocomplete -> main pincode + details ----
    if (cityEl) {
      injectStyles();
      // Wrap only the input so the dropdown anchors directly under it.
      var wrap = document.createElement('div');
      wrap.className = 'wm-ac-wrap';
      cityEl.parentNode.insertBefore(wrap, cityEl);
      wrap.appendChild(cityEl);

      var list = document.createElement('div');
      list.className = 'wm-ac-list';
      list.setAttribute('role', 'listbox');
      wrap.appendChild(list);

      var matches = [];
      var activeIdx = -1;

      function closeList() { list.classList.remove('is-open'); list.innerHTML = ''; activeIdx = -1; matches = []; }
      function pick(rec) {
        info.city = rec[0];
        info.pincode = rec[1];
        info.region = rec[2];
        info.state = rec[3];
        info.district = rec[0];
        info.office = '';
        cityEl.value = rec[0];
        cityEl.dataset.wmAuto = '';
        if (pinEl && (!pinEl.value.trim() || pinEl.dataset.wmAuto === '1')) {
          pinEl.value = rec[1];
          pinEl.dataset.wmAuto = '1';
        }
        // City pick is district-level: refresh the area list for that PIN so the user can still pick a locality.
        if (areaEl && areaEl.dataset.wmAuto === '1') { areaEl.value = ''; areaEl.dataset.wmAuto = ''; }
        loadPins().then(function (map) {
          var r2 = map[rec[1]];
          fillAreaList(r2 ? (r2[3] || []) : []);
        }).catch(function () {});
        closeList();
        emit('city');
      }
      function render() {
        if (!matches.length) { closeList(); return; }
        list.innerHTML = matches.map(function (m, i) {
          return '<div class="wm-ac-item' + (i === activeIdx ? ' is-active' : '') + '" role="option" data-i="' + i + '">' +
            m[0] + ' <small>PIN ' + m[1] + ' · ' + m[3] + '</small></div>';
        }).join('');
        list.classList.add('is-open');
      }

      cityEl.addEventListener('input', function () {
        cityEl.dataset.wmAuto = '';
        var q = (cityEl.value || '').trim().toLowerCase();
        if (q.length < 2) { closeList(); return; }
        loadCities().then(function (arr) {
          var starts = [], contains = [];
          for (var i = 0; i < arr.length && starts.length < 8; i++) {
            var name = arr[i][0].toLowerCase();
            if (name.indexOf(q) === 0) starts.push(arr[i]);
          }
          if (starts.length < 8) {
            for (var j = 0; j < arr.length && (starts.length + contains.length) < 8; j++) {
              var n2 = arr[j][0].toLowerCase();
              if (n2.indexOf(q) > 0) contains.push(arr[j]);
            }
          }
          matches = starts.concat(contains);
          activeIdx = -1;
          render();
        }).catch(function () {});
      });

      cityEl.addEventListener('keydown', function (e) {
        if (!list.classList.contains('is-open')) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, matches.length - 1); render(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); render(); }
        else if (e.key === 'Enter') { if (activeIdx >= 0 && matches[activeIdx]) { e.preventDefault(); pick(matches[activeIdx]); } }
        else if (e.key === 'Escape') { closeList(); }
      });

      list.addEventListener('mousedown', function (e) {
        var item = e.target.closest('.wm-ac-item');
        if (!item) return;
        e.preventDefault();
        var idx = parseInt(item.getAttribute('data-i'), 10);
        if (matches[idx]) pick(matches[idx]);
      });

      document.addEventListener('click', function (e) {
        if (e.target !== cityEl && !list.contains(e.target)) closeList();
      });
    }

    return { get: function () { return Object.assign({}, info); } };
  }

  // ---- Single unified field: type city / area / pincode, pick or free-type ----
  var areaIndex = null;
  function buildAreaIndex(map) {
    if (areaIndex) return areaIndex;
    var idx = [];
    for (var pin in map) {
      var rec = map[pin]; // [district, region, state, [areas]]
      var d = rec[0], s = rec[2], areas = rec[3] || [];
      for (var i = 0; i < areas.length; i++) idx.push([areas[i], pin, d, s]);
    }
    areaIndex = idx;
    return idx;
  }

  function attachSingle(opts) {
    opts = opts || {};
    var el = opts.input;
    if (!el) return { get: function () { return {}; } };
    var onChange = typeof opts.onChange === 'function' ? opts.onChange : function () {};
    injectStyles();

    var info = { query: '', pincode: '', area: '', city: '', district: '', region: '', state: '', source: '' };
    function emit(src) { info.source = src; info.query = el.value.trim(); onChange(Object.assign({}, info)); }

    var wrap = document.createElement('div');
    wrap.className = 'wm-ac-wrap';
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);
    var list = document.createElement('div');
    list.className = 'wm-ac-list';
    list.setAttribute('role', 'listbox');
    wrap.appendChild(list);

    var matches = [], activeIdx = -1, timer = null;

    el.addEventListener('focus', function () { loadPins().then(buildAreaIndex).catch(function () {}); loadCities().catch(function () {}); }, { once: true });

    function closeList() { list.classList.remove('is-open'); list.innerHTML = ''; activeIdx = -1; matches = []; }
    function render() {
      if (!matches.length) { closeList(); return; }
      list.innerHTML = matches.map(function (m, i) {
        return '<div class="wm-ac-item' + (i === activeIdx ? ' is-active' : '') + '" role="option" data-i="' + i + '">' +
          m.label + ' <small>' + m.sub + '</small></div>';
      }).join('');
      list.classList.add('is-open');
    }
    function pick(m) {
      info.pincode = m.pincode || '';
      info.area = m.area || '';
      info.city = m.district || '';
      info.district = m.district || '';
      info.state = m.state || '';
      el.value = m.plain;
      closeList();
      emit('select');
    }

    function compute(q) {
      q = q.trim().toLowerCase();
      var res = [];
      if (q.length < 2) return res;
      if (/^\d+$/.test(q)) {
        if (!pinMap) return res;
        for (var pin in pinMap) {
          if (pin.indexOf(q) === 0) {
            var r = pinMap[pin]; var a0 = (r[3] && r[3][0]) || r[0];
            res.push({ label: a0 + ', ' + r[0], sub: 'PIN ' + pin + ' · ' + r[2], plain: a0 + ', ' + r[0] + ' (' + pin + ')', pincode: pin, area: (r[3] && r[3][0]) || '', district: r[0], state: r[2] });
            if (res.length >= 8) break;
          }
        }
        return res;
      }
      // City/district matches first (short, friendly)
      if (cities) {
        for (var i = 0; i < cities.length && res.length < 4; i++) {
          if (cities[i][0].toLowerCase().indexOf(q) === 0) {
            var c = cities[i];
            res.push({ label: c[0], sub: 'City · PIN ' + c[1] + ' · ' + c[3], plain: c[0] + ' (' + c[1] + ')', pincode: c[1], area: '', district: c[0], state: c[3] });
          }
        }
      }
      // Area / locality matches
      if (areaIndex) {
        for (var j = 0; j < areaIndex.length && res.length < 8; j++) {
          if (areaIndex[j][0].toLowerCase().indexOf(q) === 0) {
            var ai = areaIndex[j];
            res.push({ label: ai[0] + ', ' + ai[2], sub: 'PIN ' + ai[1] + ' · ' + ai[3], plain: ai[0] + ', ' + ai[2] + ' (' + ai[1] + ')', pincode: ai[1], area: ai[0], district: ai[2], state: ai[3] });
          }
        }
      }
      return res;
    }

    el.addEventListener('input', function () {
      // Free typing invalidates any previously resolved selection.
      info.pincode = ''; info.area = ''; info.district = ''; info.state = '';
      emit('type');
      var q = el.value;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        Promise.all([loadPins().then(buildAreaIndex), loadCities()]).then(function () {
          matches = compute(q);
          activeIdx = -1;
          render();
        }).catch(function () {});
      }, 120);
    });

    el.addEventListener('keydown', function (e) {
      if (!list.classList.contains('is-open')) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, matches.length - 1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); render(); }
      else if (e.key === 'Enter') { if (activeIdx >= 0 && matches[activeIdx]) { e.preventDefault(); pick(matches[activeIdx]); } }
      else if (e.key === 'Escape') { closeList(); }
    });
    list.addEventListener('mousedown', function (e) {
      var item = e.target.closest('.wm-ac-item');
      if (!item) return;
      e.preventDefault();
      var idx = parseInt(item.getAttribute('data-i'), 10);
      if (matches[idx]) pick(matches[idx]);
    });
    document.addEventListener('click', function (e) { if (e.target !== el && !list.contains(e.target)) closeList(); });

    return { get: function () { return Object.assign({}, info); } };
  }

  window.WMPincode = { attach: attach, attachSingle: attachSingle, loadPins: loadPins, loadCities: loadCities };
})();
