document.addEventListener('DOMContentLoaded', function () {
  var pricingRoot = document.getElementById('product-pricing-root');
  if (!pricingRoot) return;

  var UNLOCK_KEY = 'woodenmax_pergola_calculator_unlock';
  function isExactUnlocked() {
    if (pricingRoot.getAttribute('data-pergola-always-exact') === 'true') return true;
    try {
      return sessionStorage.getItem(UNLOCK_KEY) === '1';
    } catch (e) {
      return false;
    }
  }
  function setExactUnlocked() {
    try {
      sessionStorage.setItem(UNLOCK_KEY, '1');
    } catch (e) {}
  }

  function range20(n) {
    var x = Number(n) || 0;
    return { lo: Math.round(x * 0.8), hi: Math.round(x * 1.2) };
  }
  function fmtRange(r) {
    return '\u20B9 ' + r.lo.toLocaleString('en-IN') + ' \u2013 \u20B9 ' + r.hi.toLocaleString('en-IN');
  }

  function formatLaminatedLabel(k) {
    var s = String(k).replace(/_/g, ' ');
    return s.replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
  }

  var ratesPath = pricingRoot.getAttribute('data-rates-url') || 'data/rates.json';
  fetch(ratesPath)
    .then(function (r) {
      return r.json();
    })
    .then(function (rates) {
      var areaDefault = 15 * 12;
      var basePerSqft = rates.base_pergola_per_sqft || 850;
      var rangeMin = 800,
        rangeMax = 1200;

      var laminatedOptions = rates.laminated_per_sqft || {};
      var glassUnitRates = rates.glass_unit_rates_per_sqft || {};
      var polycarbonateRates = rates.polycarbonate || {};
      var options = [];
      if (glassUnitRates['10mm_clr']) {
        options.push({
          key: '10mm_clr',
          label: '10 mm toughened clear glass',
          rate: Number(glassUnitRates['10mm_clr']),
          safety:
            'Tempered glass: higher strength but will shatter into small pieces on breakage; consider laminated for overhead safety.',
        });
      }
      if (glassUnitRates['12mm_clr']) {
        options.push({
          key: '12mm_clr',
          label: '12 mm toughened clear glass',
          rate: Number(glassUnitRates['12mm_clr']),
          safety: 'Tempered glass: higher strength; for overhead roof laminated glass is safer.',
        });
      }
      Object.keys(laminatedOptions).forEach(function (k) {
        options.push({
          key: k,
          label: formatLaminatedLabel(k),
          rate: Number(laminatedOptions[k]),
          safety:
            'Laminated glass with PVB/SGP interlayer — holds fragments on breakage and is recommended for roofing and safety-critical applications.',
        });
      });

      if (polycarbonateRates && polycarbonateRates.solid_3mm_per_sqft) {
        options.push({
          key: 'poly_solid_3mm',
          label: '3 mm solid polycarbonate sheet (plain / brown / grey / diamond)',
          rate: Number(polycarbonateRates.solid_3mm_per_sqft),
          safety:
            'High impact resistance and holds well — note: solid sheets can distort under prolonged heat; good for short-term economy.',
        });
      }
      if (polycarbonateRates && polycarbonateRates.hollow_12mm_per_sqft) {
        options.push({
          key: 'poly_hollow_12mm',
          label: '12 mm hollow polycarbonate (multiwall, heat-resistant)',
          rate: Number(polycarbonateRates.hollow_12mm_per_sqft),
          safety:
            'Hollow core improves heat insulation and does not sag easily in sun; expected life ~5–7 years under harsh sun exposure.',
        });
      }

      var coatingOptions = (function () {
        try {
          var pp =
            rates.perforated_panels && rates.perforated_panels.ceiling && rates.perforated_panels.ceiling.coating;
          if (pp) {
            var mapped = {};
            if (pp.wooden_powder_per_sqft) mapped['wooden'] = pp.wooden_powder_per_sqft;
            if (pp.plain_powder_per_sqft) mapped['plain'] = pp.plain_powder_per_sqft;
            if (pp.texture_powder_per_sqft) mapped['textured'] = pp.texture_powder_per_sqft;
            if (Object.keys(mapped).length) return mapped;
          }
        } catch (e) {}
        return rates.coating_price || {};
      })();

      var pergolaCatalog = rates.pergola_catalog || null;
      var pergolaLineId = String(pricingRoot.getAttribute('data-pergola-line') || 'fixed_aluminium_glass').replace(/\s/g, '');

      function findPergolaLine(id) {
        var lines = (pergolaCatalog && pergolaCatalog.lines) || [];
        for (var i = 0; i < lines.length; i++) {
          if (lines[i].id === id) return lines[i];
        }
        return lines.length ? lines[0] : null;
      }
      function findPillarOption(pid) {
        var opts = (pergolaCatalog && pergolaCatalog.pillars && pergolaCatalog.pillars.options) || [];
        for (var j = 0; j < opts.length; j++) {
          if (opts[j].id === pid) return opts[j];
        }
        return opts[0] || { id: 'in_grid', label: '\u2014', rate_per_pc: 0 };
      }
      function findMotorOption(mid) {
        var arr =
          (pergolaCatalog && pergolaCatalog.motor_automation_retractable && pergolaCatalog.motor_automation_retractable.options) || [];
        for (var k = 0; k < arr.length; k++) {
          if (arr[k].id === mid) return arr[k];
        }
        for (var m = 0; m < arr.length; m++) {
          if (arr[m].id === 'basic_tubular') return arr[m];
        }
        return arr[0] || { id: 'none', label: '\u2014', rate_per_sqft: 0, fixed_addon: 0 };
      }

      function buildUI() {
        var ui = '';
        ui += '<div class="pricing-ui controls pergola-controls-row">';
        ui +=
          '<div class="pergola-field-cell"><span id="pergola-lbl-material" class="pergola-lbl-type" aria-hidden="true"></span><select id="select-material" style="padding:6px;border:1px solid #ddd;border-radius:6px;min-width:7rem;"><option value="aluminium">Aluminium</option><option value="iron">Iron</option></select></div>';
        ui +=
          '<div class="pergola-field-cell"><span id="pergola-lbl-width" class="pergola-lbl-type" aria-hidden="true"></span><input id="input-width" type="number" min="1" value="15" autocomplete="off" style="width:100%;max-width:96px;padding:6px;border:1px solid #ddd;border-radius:6px;"></div>';
        ui +=
          '<div class="pergola-field-cell"><span id="pergola-lbl-depth" class="pergola-lbl-type" aria-hidden="true"></span><input id="input-depth" type="number" min="1" value="12" autocomplete="off" style="width:100%;max-width:96px;padding:6px;border:1px solid #ddd;border-radius:6px;"></div>';
        ui +=
          '<div class="pergola-field-cell"><span id="pergola-lbl-framelen" class="pergola-lbl-type" aria-hidden="true"></span><input id="input-frameLen" type="number" min="10" max="24" value="13" style="width:100%;max-width:96px;padding:6px;border:1px solid #ddd;border-radius:6px;" title="Standard aluminium/iron member length"></div>';
        ui +=
          '<div class="pergola-field-cell"><span id="pergola-lbl-coating" class="pergola-lbl-type" aria-hidden="true"></span><select id="select-coating" style="padding:6px;border:1px solid #ddd;border-radius:6px;min-width:7rem;">';
        ui += '<option value="">Standard</option>';
        Object.keys(coatingOptions).forEach(function (c) {
          ui += '<option value="' + c + '">' + c.replace(/_/g, ' ') + '</option>';
        });
        ui += '</select></div>';
        ui +=
          '<div id="label-fitting" class="pergola-field-cell"><span id="pergola-lbl-fitting" class="pergola-lbl-type" aria-hidden="true"></span><select id="select-fitting" style="padding:6px;border:1px solid #ddd;border-radius:6px;min-width:11rem;"><option value="system">System fitting (nuts & bolts)</option><option value="welding">On-site welding</option></select></div>';
        ui +=
          '<div class="pergola-field-cell pergola-field-cell--roof"><span id="pergola-lbl-roof" class="pergola-lbl-type" aria-hidden="true"></span><select id="select-glazing" style="padding:6px;border:1px solid #ddd;border-radius:6px;width:100%;" title="Glass or polycarbonate roof">';
        options.forEach(function (o, idx) {
          ui += '<option value="' + idx + '">' + o.label + '</option>';
        });
        ui += '</select></div>';
        ui += '</div>';
        if (pergolaCatalog && pergolaCatalog.pillars && pergolaCatalog.pillars.options && pergolaCatalog.pillars.options.length) {
          ui +=
            '<div class="pricing-ui controls pergola-controls-row" style="margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;">';
          ui +=
            '<div class="pergola-field-cell pergola-field-cell--roof"><span id="pergola-lbl-pillar-type" class="pergola-lbl-type" aria-hidden="true"></span><select id="select-pillar-type" style="padding:6px;border:1px solid #ddd;border-radius:6px;width:100%;min-width:12rem;">';
          pergolaCatalog.pillars.options.forEach(function (po) {
            ui += '<option value="' + String(po.id).replace(/"/g, '') + '">' + String(po.label || po.id).replace(/</g, '') + '</option>';
          });
          ui += '</select></div>';
          ui +=
            '<div class="pergola-field-cell"><span id="pergola-lbl-pillar-count" class="pergola-lbl-type" aria-hidden="true"></span><input id="input-pillar-count" type="number" min="0" max="48" value="0" autocomplete="off" style="width:100%;max-width:96px;padding:6px;border:1px solid #ddd;border-radius:6px;" title="Number of pillars at listed rate (e.g. corners + intermediates)"></div>';
          if (
            pergolaLineId === 'retractable_motorized' &&
            pergolaCatalog.motor_automation_retractable &&
            pergolaCatalog.motor_automation_retractable.options &&
            pergolaCatalog.motor_automation_retractable.options.length
          ) {
            ui +=
              '<div class="pergola-field-cell pergola-field-cell--roof"><span id="pergola-lbl-motor-package" class="pergola-lbl-type" aria-hidden="true"></span><select id="select-motor-package" style="padding:6px;border:1px solid #ddd;border-radius:6px;width:100%;min-width:12rem;">';
            pergolaCatalog.motor_automation_retractable.options.forEach(function (mo) {
              var sel = mo.id === 'basic_tubular' ? ' selected' : '';
              ui +=
                '<option value="' +
                String(mo.id).replace(/"/g, '') +
                '"' +
                sel +
                '>' +
                String(mo.label || mo.id).replace(/</g, '') +
                '</option>';
            });
            ui += '</select></div>';
          }
          ui += '</div>';
        }
        ui +=
          '<p style="margin:8px 0 0;font-size:0.8rem;color:#64748b;">Each product page uses its own structure \u20b9/sqft line from the supplier schedule in <code style="font-size:0.75rem;">data/rates.json</code> (pergola_catalog). Add pillar qty/type and, on retractable, motor package.</p>';
        ui += '<div class="pricing-output" id="pricing-output" style="margin-top:12px;"></div>';
        ui +=
          '<div id="pergola-inquiry-wrap" style="margin-top:16px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;background:#f8fafc;">';
        ui +=
          '<p style="margin:0 0 10px;font-weight:600;color:#334155;font-size:0.95rem;">Itemised quote on screen &amp; email</p>';
        ui +=
          '<p style="margin:0 0 12px;font-size:0.85rem;color:#64748b;line-height:1.5;">Share your contact below — we send this specification to our team and show the full line-by-line breakdown here for your visit.</p>';
        ui += '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;">';
        ui +=
          '<label style="display:flex;flex-direction:column;min-width:140px;"><small>Name *</small><input id="pergola-user-name" type="text" autocomplete="name" style="padding:8px;border:1px solid #ddd;border-radius:6px;" required></label>';
        ui +=
          '<label style="display:flex;flex-direction:column;min-width:120px;"><small>City *</small><input id="pergola-user-city" type="text" autocomplete="address-level2" style="padding:8px;border:1px solid #ddd;border-radius:6px;" required></label>';
        ui +=
          '<label style="display:flex;flex-direction:column;min-width:120px;"><small>Mobile *</small><input id="pergola-user-mobile" type="tel" autocomplete="tel" style="padding:8px;border:1px solid #ddd;border-radius:6px;" required></label>';
        ui +=
          '<label style="display:flex;flex-direction:column;min-width:180px;"><small>Email</small><input id="pergola-user-email" type="email" autocomplete="email" style="padding:8px;border:1px solid #ddd;border-radius:6px;"></label>';
        ui +=
          '</div><button type="button" id="pergola-inquiry-submit" style="margin-top:12px;padding:10px 18px;background:#1e40af;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Send details &amp; open full breakdown</button>';
        ui += '<p id="pergola-inquiry-status" style="margin:10px 0 0;font-size:0.85rem;color:#64748b;"></p>';
        ui += '</div>';
        return ui;
      }

      pricingRoot.innerHTML = buildUI();

      var inputWidth = document.getElementById('input-width');
      var inputDepth = document.getElementById('input-depth');
      var inputFrameLen = document.getElementById('input-frameLen');
      var glassSheetSizes = rates.glass_sheet_sizes || { default: [{ w_ft: 8, h_ft: 4, sqft: 32 }] };

      function getSheetSizesForGlazing(glazingKey) {
        if (!glazingKey) return glassSheetSizes.default || [];
        if (glazingKey.indexOf('poly') !== -1) return glassSheetSizes.polycarbonate || glassSheetSizes.default || [];
        var mm = (glazingKey.match(/\d+/) || [])[0];
        return mm && glassSheetSizes[mm + 'mm'] ? glassSheetSizes[mm + 'mm'] : glassSheetSizes.default || [];
      }

      function bestSheetForArea(area, sheetSizesList) {
        var best = { w: 8, h: 4, wastePct: 100 };
        if (!sheetSizesList || sheetSizesList.length === 0) return best;
        sheetSizesList.forEach(function (s) {
          var sw = s.w_ft || s.w || 8,
            sh = s.h_ft || s.h || 4;
          var sqft = s.sqft || sw * sh;
          var sheets = sqft > 0 ? Math.ceil(area / sqft) : 1;
          var totalSqft = sheets * sqft;
          var wasteSqft = Math.max(0, totalSqft - area);
          var wastePct = totalSqft > 0 ? (wasteSqft / totalSqft) * 100 : 100;
          if (wastePct < best.wastePct) best = { w: sw, h: sh, wastePct: wastePct };
        });
        return best;
      }

      var selectCoating = document.getElementById('select-coating');
      var selectGlazing = document.getElementById('select-glazing');
      var selectMaterial = document.getElementById('select-material');
      var pricingOutput = document.getElementById('pricing-output');

      window.__pergolaLastEstimate = null;

      function renderPricing() {
        var unlocked = isExactUnlocked();
        var width = Math.max(1, Number(inputWidth.value) || 15);
        var depth = Math.max(1, Number(inputDepth.value) || 12);
        var frameLen = Math.max(10, Number(inputFrameLen && inputFrameLen.value) || 13);
        var area = Math.round(width * depth);
        var glazing = options[Number(selectGlazing.value) || 0];
        var glazingKey = glazing ? glazing.key : '';
        var roofLabel = glazing && glazing.label ? glazing.label : 'Selected roof product';
        var sheetList = getSheetSizesForGlazing(glazingKey);
        var bestSheet = bestSheetForArea(area, sheetList);
        var sheetW = bestSheet.w;
        var sheetH = bestSheet.h;
        var coatingKey = selectCoating.value;
        var coatingAdd = coatingOptions[coatingKey] ? Number(coatingOptions[coatingKey]) : 0;
        var glazingRate = glazing ? Number(glazing.rate) : 0;
        var material = (document.getElementById('select-material') && document.getElementById('select-material').value) || 'aluminium';
        var aluminiumRate =
          Number(
            document.getElementById('input-al-rate') ? document.getElementById('input-al-rate').value : rates.aluminium_rate_per_sqft || basePerSqft
          ) ||
          rates.aluminium_rate_per_sqft ||
          basePerSqft;
        var ironKgPerSqft =
          Number(document.getElementById('input-iron-kg') ? document.getElementById('input-iron-kg').value : rates.iron_kg_per_sqft || 5.5) ||
          rates.iron_kg_per_sqft ||
          5.5;
        var steelRatePerKg =
          Number(document.getElementById('input-steel-rate') ? document.getElementById('input-steel-rate').value : rates.steel_rate_per_kg || 180) ||
          rates.steel_rate_per_kg ||
          180;
        var fittingMode = (document.getElementById('select-fitting') && document.getElementById('select-fitting').value) || 'system';
        var ironRatePerSqft = rates.iron_rate_per_sqft
          ? Number(rates.iron_rate_per_sqft)
          : Math.round(ironKgPerSqft * steelRatePerKg + basePerSqft);

        var lineConf = findPergolaLine(pergolaLineId);
        var scheduleSuffix = lineConf && lineConf.label ? ' \u2014 ' + lineConf.label : '';
        if (lineConf) {
          if (material === 'aluminium' && lineConf.aluminium_structure_per_sqft != null) {
            aluminiumRate = Number(lineConf.aluminium_structure_per_sqft);
          }
          if (material === 'iron' && lineConf.iron_structure_per_sqft != null) {
            ironRatePerSqft = Number(lineConf.iron_structure_per_sqft);
          }
        }

        var baseTotal = 0;
        var materialDetail = '';
        if (material === 'aluminium') {
          baseTotal = Math.round(aluminiumRate * area);
          materialDetail = 'Aluminium structure' + scheduleSuffix;
        } else {
          baseTotal = Math.round(ironRatePerSqft * area);
          materialDetail = 'Iron structure' + scheduleSuffix;
        }

        var glazingTotal = Math.round(glazingRate * area);

        var sheetSqft = sheetW * sheetH;
        var glazingSheets = sheetSqft > 0 ? Math.ceil(area / sheetSqft) : 1;
        var totalSheetSqft = glazingSheets * sheetSqft;
        var glazingWasteSqft = +Math.max(0, totalSheetSqft - area).toFixed(2);
        var glazingWastePct = totalSheetSqft > 0 ? ((glazingWasteSqft / totalSheetSqft) * 100).toFixed(1) : 0;
        var perimeterRft = 2 * (width + depth);
        var beamSpacing = 4;
        var beamsAlongWidth = Math.floor(width / beamSpacing) + 1;
        var beamsAlongDepth = Math.floor(depth / beamSpacing) + 1;
        var totalFrameRft = perimeterRft + beamsAlongWidth * depth + beamsAlongDepth * width;
        var framePieces = frameLen > 0 ? Math.ceil(totalFrameRft / frameLen) : 1;
        var frameWasteRft = +Math.max(0, framePieces * frameLen - totalFrameRft).toFixed(1);

        var coatingTotal = 0;
        if (!(material === 'iron' && fittingMode === 'welding')) {
          coatingTotal = Math.round(coatingAdd * area);
        }

        var pillarCount = 0;
        var pillarOpt = findPillarOption('in_grid');
        var motorOpt = { id: 'none', label: '\u2014', rate_per_sqft: 0, fixed_addon: 0 };
        var pillarTotal = 0;
        var motorTotal = 0;
        if (pergolaCatalog) {
          var ptEl = document.getElementById('select-pillar-type');
          var pcEl = document.getElementById('input-pillar-count');
          pillarCount = pcEl ? Math.max(0, Math.min(48, parseInt(pcEl.value, 10) || 0)) : 0;
          pillarOpt = findPillarOption(ptEl ? ptEl.value : 'in_grid');
          pillarTotal = Math.round(pillarCount * (Number(pillarOpt.rate_per_pc) || 0));
          if (pergolaLineId === 'retractable_motorized') {
            var mEl = document.getElementById('select-motor-package');
            motorOpt = findMotorOption(mEl ? mEl.value : 'basic_tubular');
            motorTotal = Math.round(
              area * (Number(motorOpt.rate_per_sqft) || 0) + (Number(motorOpt.fixed_addon) || 0)
            );
          }
        }
        var estimatedTotal = baseTotal + glazingTotal + coatingTotal + pillarTotal + motorTotal;

        try {
          var labelF = document.getElementById('label-fitting');
          var selectF = document.getElementById('select-fitting');
          var selectC = document.getElementById('select-coating');
          if (labelF && selectF && selectC) {
            if (material === 'iron') {
              labelF.style.display = '';
              try {
                var weldOpt = selectF.querySelector('option[value="welding"]');
                if (!weldOpt) {
                  var opt = document.createElement('option');
                  opt.value = 'welding';
                  opt.text = 'On-site welding';
                  selectF.appendChild(opt);
                } else {
                  weldOpt.disabled = false;
                }
              } catch (ee) {}
              selectC.style.display = fittingMode === 'welding' ? 'none' : '';
            } else {
              labelF.style.display = 'none';
              selectC.style.display = '';
              try {
                var weldOpt2 = selectF.querySelector('option[value="welding"]');
                if (weldOpt2) weldOpt2.disabled = true;
              } catch (ee) {}
            }
          }
        } catch (e) {}

        var hideRates = !!document.getElementById('hide-rates-marker');
        var rb = range20(baseTotal);
        var rg = range20(glazingTotal);
        var rc = range20(coatingTotal);
        var rp = range20(pillarTotal);
        var rm = range20(motorTotal);
        var rt = range20(estimatedTotal);

        var out = '';
        if (!unlocked) {
          out +=
            '<div style="padding:10px 12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;margin-bottom:10px;font-size:0.9rem;color:#0c4a6e;line-height:1.45;"><strong>Planning estimate</strong> — below is a budget band for early sizing. Use the contact form for the full itemised quote on this page and by email.</div>';
          out += '<div class="pergola-breakdown-wrap">';
          out +=
            '<table class="pergola-detail-table"><colgroup><col style="width:52%"><col style="width:48%"></colgroup><thead><tr><th>Item</th><th class="pergola-col-num">Budget band (\u20B9)</th></tr></thead><tbody>';
          out +=
            '<tr><td class="pergola-td-item">' +
            materialDetail +
            '</td><td class="pergola-td-num">' +
            fmtRange(rb) +
            '</td></tr>';
          out +=
            '<tr><td class="pergola-td-item">' +
            roofLabel +
            '</td><td class="pergola-td-num">' +
            fmtRange(rg) +
            '</td></tr>';
          out +=
            '<tr><td class="pergola-td-item">Powder coating (' +
            (coatingKey || 'standard') +
            ')</td><td class="pergola-td-num">' +
            fmtRange(rc) +
            '</td></tr>';
          if (pergolaCatalog && pillarCount > 0) {
            out +=
              '<tr><td class="pergola-td-item">Pillars (' +
              (pillarOpt.label || 'pillars') +
              ' \u00d7 ' +
              pillarCount +
              ')</td><td class="pergola-td-num">' +
              fmtRange(rp) +
              '</td></tr>';
          }
          if (pergolaLineId === 'retractable_motorized' && pergolaCatalog) {
            out +=
              '<tr><td class="pergola-td-item">Motors / automation (' +
              (motorOpt.label || '') +
              ')</td><td class="pergola-td-num">' +
              fmtRange(rm) +
              '</td></tr>';
          }
          out +=
            '<tr><td class="pergola-td-item" style="font-weight:700;">Estimated total</td><td class="pergola-td-num" style="font-weight:700;">' +
            fmtRange(rt) +
            '</td></tr>';
          out += '</tbody></table></div>';
          out +=
            '<p style="margin-top:10px;font-size:0.88rem;color:#64748b;">Area ' +
            area +
            ' sqft (' +
            width +
            ' ft \u00d7 ' +
            depth +
            ' ft). Roof product: <strong>' +
            roofLabel +
            '</strong>.</p>';
        } else {
          if (hideRates) {
            out += '<div class="pergola-breakdown-wrap">';
            out +=
              '<table class="pergola-detail-table"><colgroup><col style="width:52%"><col style="width:48%"></colgroup><thead><tr><th>Item</th><th class="pergola-col-num">Total (\u20B9)</th></tr></thead><tbody>';
            out +=
              '<tr><td class="pergola-td-item">' +
              materialDetail +
              '</td><td class="pergola-td-num">' +
              baseTotal.toLocaleString('en-IN') +
              '</td></tr>';
            out +=
              '<tr><td class="pergola-td-item">' +
              roofLabel +
              '</td><td class="pergola-td-num">' +
              glazingTotal.toLocaleString('en-IN') +
              '</td></tr>';
            out +=
              '<tr><td class="pergola-td-item">Powder coating (' +
              (coatingKey || 'standard') +
              ')</td><td class="pergola-td-num">' +
              coatingTotal.toLocaleString('en-IN') +
              '</td></tr>';
            if (pergolaCatalog && pillarCount > 0) {
              out +=
                '<tr><td class="pergola-td-item">Pillars (' +
                (pillarOpt.label || '') +
                ' \u00d7 ' +
                pillarCount +
                ')</td><td class="pergola-td-num">' +
                pillarTotal.toLocaleString('en-IN') +
                '</td></tr>';
            }
            if (pergolaLineId === 'retractable_motorized' && pergolaCatalog) {
              out +=
                '<tr><td class="pergola-td-item">Motors / automation (' +
                (motorOpt.label || '') +
                ')</td><td class="pergola-td-num">' +
                motorTotal.toLocaleString('en-IN') +
                '</td></tr>';
            }
            out +=
              '<tr><td class="pergola-td-item" style="font-weight:700;">Estimated total</td><td class="pergola-td-num" style="font-weight:700;">' +
              estimatedTotal.toLocaleString('en-IN') +
              '</td></tr>';
            out += '</tbody></table></div>';
          } else {
            out += '<div class="pergola-breakdown-wrap">';
            out +=
              '<table class="pergola-detail-table"><colgroup><col style="width:40%"><col style="width:22%"><col style="width:38%"></colgroup><thead><tr><th>Item</th><th class="pergola-col-num">Rate (\u20B9/sqft)</th><th class="pergola-col-num">Total (\u20B9)</th></tr></thead><tbody>';
            out +=
              '<tr><td class="pergola-td-item">' +
              materialDetail +
              '</td><td class="pergola-td-num">' +
              (material === 'aluminium' ? aluminiumRate : ironRatePerSqft) +
              '</td><td class="pergola-td-num">' +
              baseTotal.toLocaleString('en-IN') +
              '</td></tr>';
            out +=
              '<tr><td class="pergola-td-item">' +
              roofLabel +
              '</td><td class="pergola-td-num">' +
              glazingRate +
              '</td><td class="pergola-td-num">' +
              glazingTotal.toLocaleString('en-IN') +
              '</td></tr>';
            out +=
              '<tr><td class="pergola-td-item">Powder coating (' +
              (coatingKey || 'standard') +
              ')</td><td class="pergola-td-num">' +
              coatingAdd +
              '</td><td class="pergola-td-num">' +
              coatingTotal.toLocaleString('en-IN') +
              '</td></tr>';
            if (pergolaCatalog && pillarCount > 0) {
              out +=
                '<tr><td class="pergola-td-item">Pillars (' +
                (pillarOpt.label || '') +
                ' \u00d7 ' +
                pillarCount +
                ')</td><td class="pergola-td-num">\u20b9' +
                (Number(pillarOpt.rate_per_pc) || 0).toLocaleString('en-IN') +
                '/pc</td><td class="pergola-td-num">' +
                pillarTotal.toLocaleString('en-IN') +
                '</td></tr>';
            }
            if (pergolaLineId === 'retractable_motorized' && pergolaCatalog) {
              var motorRateShow = Number(motorOpt.rate_per_sqft) || 0;
              var motorFix = Number(motorOpt.fixed_addon) || 0;
              var motorRateCol =
                '\u20b9' +
                motorRateShow.toLocaleString('en-IN') +
                '/sqft' +
                (motorFix > 0 ? ' +\u20b9' + motorFix.toLocaleString('en-IN') + ' fixed' : '');
              out +=
                '<tr><td class="pergola-td-item">Motors / automation (' +
                (motorOpt.label || '') +
                ')</td><td class="pergola-td-num">' +
                motorRateCol +
                '</td><td class="pergola-td-num">' +
                motorTotal.toLocaleString('en-IN') +
                '</td></tr>';
            }
            out +=
              '<tr><td class="pergola-td-item" style="font-weight:700;">Estimated total</td><td class="pergola-td-num">\u2014</td><td class="pergola-td-num" style="font-weight:700;">' +
              estimatedTotal.toLocaleString('en-IN') +
              '</td></tr>';
            out += '</tbody></table></div>';
          }
        }

        try {
          try {
            var ironKgInputEl = document.getElementById('input-iron-kg');
            if (ironKgInputEl) ironKgInputEl.style.display = 'none';
          } catch (ee) {}

          var glassKgPerSqftPerMm = (rates.glass_weights && rates.glass_weights.kg_per_sqft_per_mm) || 0.23225806451612903;
          var polyDensityKgPerM3 = 1200;
          var sqftToM3PerMm = 9.290304e-5;
          var polyKgPerSqftPerMm = polyDensityKgPerM3 * sqftToM3PerMm;
          var glazingKey2 = glazing && glazing.key ? glazing.key : '';
          var labelToMatch = glazing && glazing.label ? glazing.label : '';
          var mmMatch = glazingKey2.match(/(\d+(\.\d+)?)\s*mm/i) || labelToMatch.match(/(\d+(\.\d+)?)\s*mm/i) || [null, null];
          var thicknessMm = mmMatch && mmMatch[1] ? Number(mmMatch[1]) : 0;
          var glazingKgPerSqft = 0;
          if (glazingKey2 && glazingKey2.indexOf('poly') === 0) {
            glazingKgPerSqft = polyKgPerSqftPerMm * thicknessMm;
          } else {
            glazingKgPerSqft = glassKgPerSqftPerMm * thicknessMm;
          }
          var glazingWeightTotal = Math.round(glazingKgPerSqft * area * 1000) / 1000;

          var alKgPerSqft = 3.5;
          var metalKgPerSqftUsed = material === 'aluminium' ? alKgPerSqft : ironKgPerSqft;
          var metalWeightTotal = Math.round(metalKgPerSqftUsed * area * 1000) / 1000;

          var metalAmount = 0,
            assemblyAmount = 0;
          if (material === 'aluminium') {
            metalAmount = Math.round(aluminiumRate * area);
            assemblyAmount = 0;
          } else {
            metalAmount = Math.round(ironRatePerSqft * area);
            assemblyAmount = 0;
          }
          var overallWeight = Math.round((glazingWeightTotal + metalWeightTotal) * 1000) / 1000;

          var weightHtml = '';
          if (unlocked) {
            weightHtml += '<p><strong>Area:</strong> ' + area + ' sqft (' + width + 'ft \u00d7 ' + depth + 'ft)</p>';
            weightHtml += '<h4 style="margin-top:10px;">Weight &amp; amount summary</h4>';
            weightHtml += '<div class="pergola-breakdown-wrap">';
            weightHtml +=
              '<table class="pergola-detail-table"><colgroup><col style="width:34%"><col style="width:16%"><col style="width:22%"><col style="width:28%"></colgroup><thead><tr><th class="pergola-td-item">Item</th><th class="pergola-col-num">kg/sqft</th><th class="pergola-col-num">Total kg</th><th class="pergola-col-num">Amount (\u20B9)</th></tr></thead><tbody>';
            weightHtml +=
              '<tr><td class="pergola-td-item">Roof \u2014 ' +
              roofLabel +
              '</td><td class="pergola-td-num">' +
              (glazingKgPerSqft > 0 ? glazingKgPerSqft.toFixed(3) : '0.000') +
              '</td><td class="pergola-td-num">' +
              glazingWeightTotal.toLocaleString('en-IN') +
              '</td><td class="pergola-td-num">' +
              '\u20B9\u00a0' +
              glazingTotal.toLocaleString('en-IN') +
              '</td></tr>';
            weightHtml +=
              '<tr><td class="pergola-td-item">' +
              (material === 'aluminium' ? 'Aluminium structure' : 'Iron structure (' + (fittingMode || 'system') + ')') +
              '</td><td class="pergola-td-num">' +
              metalKgPerSqftUsed.toFixed(3) +
              '</td><td class="pergola-td-num">' +
              metalWeightTotal.toLocaleString('en-IN') +
              '</td><td class="pergola-td-num">\u20B9\u00a0' +
              metalAmount.toLocaleString('en-IN') +
              '</td></tr>';
            if (assemblyAmount > 0)
              weightHtml +=
                '<tr><td class="pergola-td-item">Assembly / labour</td><td class="pergola-td-num">\u2014</td><td class="pergola-td-num">\u2014</td><td class="pergola-td-num">\u20B9\u00a0' +
                assemblyAmount.toLocaleString('en-IN') +
                '</td></tr>';
            weightHtml +=
              '<tr><td class="pergola-td-item" style="font-weight:700;">Total</td><td class="pergola-td-num">\u2014</td><td class="pergola-td-num" style="font-weight:700;">' +
              overallWeight.toLocaleString('en-IN') +
              '</td><td class="pergola-td-num" style="font-weight:700;">\u20B9\u00a0' +
              estimatedTotal.toLocaleString('en-IN') +
              '</td></tr>';
            weightHtml += '</tbody></table></div>';

            weightHtml += '<h4 style="margin-top:14px;">Materials &amp; wastage</h4>';
            weightHtml += '<div class="pergola-breakdown-wrap">';
            weightHtml +=
              '<table class="pergola-detail-table pergola-detail-table-mats"><colgroup><col style="width:40%"><col style="width:60%"></colgroup><thead><tr><th>Material</th><th>Qty / spec</th></tr></thead><tbody>';
            weightHtml += '<tr><td>Roof coverage</td><td>' + area + ' sqft</td></tr>';
            weightHtml += '<tr><td>Standard sheet size</td><td>' + sheetW + ' \u00d7 ' + sheetH + ' ft</td></tr>';
            weightHtml += '<tr><td>Sheets required</td><td>' + glazingSheets + ' pcs</td></tr>';
            weightHtml +=
              '<tr><td>Wastage (roof sheets)</td><td>' + glazingWasteSqft + ' sqft (' + glazingWastePct + '%)</td></tr>';
            weightHtml +=
              '<tr><td>Frame (' + (material === 'aluminium' ? 'Aluminium' : 'Iron') + ')</td><td>' + totalFrameRft.toFixed(1) + ' RFT</td></tr>';
            weightHtml += '<tr><td>Std frame length</td><td>' + frameLen + ' ft</td></tr>';
            weightHtml += '<tr><td>Frame pieces required</td><td>' + framePieces + ' pcs</td></tr>';
            weightHtml += '<tr><td>Frame wastage</td><td>' + frameWasteRft + ' ft</td></tr>';
            weightHtml += '<tr><td>Hardware</td><td>Brackets, bolts, assembly \u2014 included in structure</td></tr>';
            weightHtml += '</tbody></table></div>';
          }

          try {
            var weightRoot = document.getElementById('weight-summary-root');
            if (weightRoot) weightRoot.innerHTML = weightHtml;
            else out += weightHtml;
          } catch (e) {
            out += weightHtml;
          }
        } catch (e) {}

        out +=
          '<p style="margin-top:8px;color:#555;font-size:0.88rem;">Note: final pricing follows site survey and your chosen hardware. Laminated glass is recommended for overhead roof applications.</p>';
        pricingOutput.innerHTML = out;

        var inquiryStatus = document.getElementById('pergola-inquiry-status');
        if (inquiryStatus) {
          if (unlocked) {
            inquiryStatus.innerHTML =
              '<span style="color:#15803d;">Full breakdown is visible for this session.</span>';
            var btn = document.getElementById('pergola-inquiry-submit');
            if (btn) btn.style.display = 'none';
          } else {
            inquiryStatus.textContent = '';
          }
        }

        window.__pergolaLastEstimate = {
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          pageTitle: typeof document !== 'undefined' ? document.title : '',
          pergolaLineId: pergolaLineId,
          pergolaLineLabel: lineConf && lineConf.label ? lineConf.label : '',
          width: width,
          depth: depth,
          area: area,
          material: material,
          materialDetail: materialDetail,
          fittingMode: fittingMode,
          coatingKey: coatingKey || 'standard',
          roofProduct: roofLabel,
          roofKey: glazingKey,
          aluminiumRate: aluminiumRate,
          ironRatePerSqft: ironRatePerSqft,
          glazingRate: glazingRate,
          coatingAdd: coatingAdd,
          baseTotal: baseTotal,
          glazingTotal: glazingTotal,
          coatingTotal: coatingTotal,
          pillarCount: pillarCount,
          pillarLabel: pillarOpt.label || '',
          pillarTotal: pillarTotal,
          motorLabel: motorOpt.label || '',
          motorTotal: motorTotal,
          estimatedTotal: estimatedTotal,
          sheetW: sheetW,
          sheetH: sheetH,
          glazingSheets: glazingSheets,
          glazingWasteSqft: glazingWasteSqft,
          totalFrameRft: totalFrameRft,
          framePieces: framePieces,
        };
      }

      renderPricing();

      var selectFitting = document.getElementById('select-fitting');
      [inputWidth, inputDepth, inputFrameLen, selectCoating, selectGlazing, selectMaterial, selectFitting]
        .filter(Boolean)
        .forEach(function (el) {
          el.addEventListener('input', renderPricing);
          el.addEventListener('change', renderPricing);
        });
      ['select-pillar-type', 'input-pillar-count', 'select-motor-package'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', renderPricing);
          el.addEventListener('change', renderPricing);
        }
      });

      pricingRoot.addEventListener('click', function (ev) {
        if (!ev.target || ev.target.id !== 'pergola-inquiry-submit') return;
        var nameEl = document.getElementById('pergola-user-name');
        var cityEl = document.getElementById('pergola-user-city');
        var mobileEl = document.getElementById('pergola-user-mobile');
        var emailEl = document.getElementById('pergola-user-email');
        var name = nameEl && nameEl.value ? nameEl.value.trim() : '';
        var city = cityEl && cityEl.value ? cityEl.value.trim() : '';
        var mobile = mobileEl && mobileEl.value ? mobileEl.value.trim() : '';
        var email = emailEl && emailEl.value ? emailEl.value.trim() : '';
        var st = document.getElementById('pergola-inquiry-status');
        if (!name || !city || !mobile) {
          if (st) st.textContent = 'Please enter name, city, and mobile.';
          return;
        }
        if (mobile.replace(/\D/g, '').length < 10) {
          if (st) st.textContent = 'Please enter a valid 10-digit mobile number.';
          return;
        }
        var est = window.__pergolaLastEstimate;
        if (!est) {
          renderPricing();
          est = window.__pergolaLastEstimate;
        }
        var userDetails = { name: name, city: city, mobile: mobile, email: email };
        var emailBody =
          '\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n' +
          'NEW QUOTE REQUEST \u2014 Pergola / outdoor roof calculator\n' +
          '\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n\n' +
          '\ud83d\udccb USER CONTACT\n' +
          'Name: ' +
          name +
          '\nCity: ' +
          city +
          '\nMobile: ' +
          mobile +
          '\n' +
          (email ? 'Email: ' + email + '\n' : '') +
          '\n' +
          '\ud83d\udce6 PAGE\n' +
          (est.pageTitle ? 'Title: ' + est.pageTitle + '\n' : '') +
          'URL: ' +
          (est.pageUrl || '') +
          '\n\n' +
          '\ud83d\udccf CONFIGURATION\n' +
          'Pergola line: ' +
          (est.pergolaLineLabel || est.pergolaLineId || '') +
          '\nStructure: ' +
          est.material +
          '\nFitting: ' +
          est.fittingMode +
          '\nSize: ' +
          est.width +
          ' ft \u00d7 ' +
          est.depth +
          ' ft = ' +
          est.area +
          ' sqft\n' +
          'Powder coating: ' +
          est.coatingKey +
          '\n' +
          'Roof product: ' +
          est.roofProduct +
          ' (key: ' +
          est.roofKey +
          ')\n\n' +
          '\ud83d\udcb0 EXACT CALCULATED AMOUNTS (same as on-screen after unlock)\n' +
          est.materialDetail +
          ': \u20b9 ' +
          est.baseTotal.toLocaleString('en-IN') +
          '\n' +
          'Roof (' +
          est.roofProduct +
          ') @ \u20b9' +
          est.glazingRate +
          '/sqft: \u20b9 ' +
          est.glazingTotal.toLocaleString('en-IN') +
          '\n' +
          'Powder coating: \u20b9 ' +
          est.coatingTotal.toLocaleString('en-IN') +
          '\n' +
          (est.pillarCount
            ? 'Pillars (' +
              (est.pillarLabel || '') +
              ' \u00d7 ' +
              est.pillarCount +
              '): \u20b9 ' +
              est.pillarTotal.toLocaleString('en-IN') +
              '\n'
            : '') +
          (est.pergolaLineId === 'retractable_motorized'
            ? 'Motors / automation (' +
              (est.motorLabel || '') +
              '): \u20b9 ' +
              (est.motorTotal != null ? est.motorTotal : 0).toLocaleString('en-IN') +
              '\n'
            : '') +
          'Estimated total: \u20b9 ' +
          est.estimatedTotal.toLocaleString('en-IN') +
          '\n\n' +
          '\ud83d\udce6 MATERIALS / SHEETS\n' +
          'Sheet size used: ' +
          est.sheetW +
          ' \u00d7 ' +
          est.sheetH +
          ' ft\n' +
          'Sheets required: ' +
          est.glazingSheets +
          ' pcs\n' +
          'Roof wastage: ' +
          est.glazingWasteSqft +
          ' sqft\n' +
          'Frame RFT: ' +
          est.totalFrameRft.toFixed(1) +
          ', pieces: ' +
          est.framePieces +
          '\n\n' +
          '\u2014\u2014\nGenerated from WoodenMax pergola price calculator\n';

        if (window.EmailSubmitter) {
          if (st) st.textContent = 'Sending...';
          window.EmailSubmitter.submit({
            subject: 'New Quote Request — Pergola calculator (' + (city || 'India') + ')',
            message: emailBody,
            userDetails: userDetails,
            onSuccess: function () {
              setExactUnlocked();
              if (st) st.innerHTML = '<span style="color:#15803d;">Sent. Full line items are shown below.</span>';
              renderPricing();
            },
            onError: function (err) {
              if (st) st.textContent = 'Could not send email. Please try again or call us.';
              console.error(err);
            },
          });
        } else {
          setExactUnlocked();
          if (st) st.textContent = 'Showing full breakdown below.';
          renderPricing();
        }
      });

      function initPergolaFieldLabelTyping() {
        if (typeof window.createSmoothTypingIndicator !== 'function') return;
        var pairs = [
          ['pergola-lbl-material', 'Structure'],
          ['pergola-lbl-width', 'Width (ft)'],
          ['pergola-lbl-depth', 'Depth (ft)'],
          ['pergola-lbl-framelen', 'Std frame length (ft)'],
          ['pergola-lbl-coating', 'Powder coating'],
          ['pergola-lbl-fitting', 'Fitting mode'],
          ['pergola-lbl-roof', 'Roof product'],
          ['pergola-lbl-pillar-type', 'Pillar type'],
          ['pergola-lbl-pillar-count', 'Pillar qty'],
          ['pergola-lbl-motor-package', 'Motor / automation'],
        ];
        pairs.forEach(function (row, idx) {
          var el = document.getElementById(row[0]);
          if (!el || el.getAttribute('data-typing-initialized')) return;
          setTimeout(function () {
            window.createSmoothTypingIndicator(el, row[1], {
              minTypeSpeed: 50,
              maxTypeSpeed: 100,
              minDeleteSpeed: 28,
              maxDeleteSpeed: 52,
              pauseBeforeDelete: 2000,
              pauseAfterDelete: 450,
              startDelay: 280 + idx * 85,
              loop: true,
            });
          }, 50);
        });
      }
      setTimeout(initPergolaFieldLabelTyping, 320);

      window.ALLUKRAFT_RATES = rates;
      window.ALLUKRAFT_OPTIONS = options;
      window.ALLUKRAFT_BASE = basePerSqft;
      var aluminiumRateDefault = Number(rates.aluminium_rate_per_sqft || basePerSqft) || basePerSqft;
      window.computeAluPergolaEstimate = function (
        widthFt,
        depthFt,
        coatingKey,
        glazingIndex,
        materialType,
        ironKgPerSqftParam,
        steelRatePerKgParam,
        aluminiumRateParam
      ) {
        var w = Math.max(1, Number(widthFt) || 15);
        var d = Math.max(1, Number(depthFt) || 12);
        var area = Math.round(w * d);
        var coatingAddLocal = coatingOptions[coatingKey] ? Number(coatingOptions[coatingKey]) : 0;
        var glazingOpt = options[Number(glazingIndex) || 0] || { rate: 0 };
        var glazingRateLocal = Number(glazingOpt.rate) || 0;
        var material = materialType || 'aluminium';
        var aluminiumRateLocal = Number(aluminiumRateParam || aluminiumRateDefault) || basePerSqft;
        var ironKg = Number(ironKgPerSqftParam || 5.5) || 5.5;
        var steelRate = Number(steelRatePerKgParam || 80) || 80;
        var baseTotalLocal = 0;
        var materialDetailLocal = '';
        if (material === 'aluminium') {
          baseTotalLocal = Math.round(aluminiumRateLocal * area);
          materialDetailLocal = 'Aluminium base @ \u20b9' + aluminiumRateLocal + '/sqft';
        } else {
          var metalTotalLocal = Math.round(ironKg * steelRate * area);
          var assemblyLocal = Math.round(basePerSqft * area);
          baseTotalLocal = metalTotalLocal + assemblyLocal;
          materialDetailLocal = 'Iron material \u20b9' + (ironKg * steelRate).toFixed(2) + '/sqft + assembly';
        }
        var glazingTotalLocal = Math.round(glazingRateLocal * area);
        var coatingTotalLocal = Math.round(coatingAddLocal * area);
        var estimatedTotalLocal = baseTotalLocal + glazingTotalLocal + coatingTotalLocal;
        return {
          width: w,
          depth: d,
          area: area,
          material: material,
          materialDetail: materialDetailLocal,
          baseTotal: baseTotalLocal,
          glazingTotal: glazingTotalLocal,
          coatingTotal: coatingTotalLocal,
          estimatedTotal: estimatedTotalLocal,
          glazingLabel: glazingOpt.label || '',
        };
      };

      try {
        var coatingRoot = document.getElementById('coating-options-root');
        if (coatingRoot) {
          var html =
            '<table class="price-table"><thead><tr><th>Coating</th><th class="rate">Rate (\u20b9/sqft)</th><th>Description</th></tr></thead><tbody>';
          Object.keys(coatingOptions).forEach(function (k) {
            var rate = coatingOptions[k];
            html +=
              '<tr><td>' +
              k.replace(/_/g, ' ') +
              '</td><td class="rate">\u20b9 ' +
              rate +
              '</td><td>Powder coat option</td></tr>';
          });
          html += '</tbody></table>';
          coatingRoot.innerHTML = html;
        }
      } catch (e) {}

      try {
        var exampleRoot = document.getElementById('example-table-root');
        var hideRatesMarker = document.getElementById('hide-rates-marker');
        if (exampleRoot) {
          var area = 12 * 12;
          var glassRate = 0;
          if (rates.glass_unit_rates_per_sqft && rates.glass_unit_rates_per_sqft['12mm_clr'])
            glassRate = Number(rates.glass_unit_rates_per_sqft['12mm_clr']);
          var aluminiumRateExample = 1200;
          var ironKg = 5.5;
          var steelRate = 180;
          var coatingList = coatingOptions || {};
          var rows = [];
          Object.keys(coatingList).forEach(function (k) {
            var coat = Number(coatingList[k]) || 0;
            var base = Math.round(aluminiumRateExample * area);
            var glassTotal = Math.round(glassRate * area);
            var coatTotal = Math.round(coat * area);
            rows.push({ title: 'Aluminium + ' + k, total: base + glassTotal + coatTotal });
          });
          Object.keys(coatingList).forEach(function (k) {
            var coat = Number(coatingList[k]) || 0;
            var metalTotal = Math.round(ironKg * steelRate * area);
            var assembly = Math.round(basePerSqft * area);
            var glassTotal = Math.round(glassRate * area);
            var coatTotal = Math.round(coat * area);
            rows.push({ title: 'Iron (system) + ' + k, total: metalTotal + assembly + glassTotal + coatTotal });
          });
          var metalTotalW = Math.round(ironKg * steelRate * area);
          var assemblyW = Math.round(basePerSqft * area);
          var glassTotalW = Math.round(glassRate * area);
          rows.push({ title: 'Iron (welding, no coating)', total: metalTotalW + assemblyW + glassTotalW });

          var html = '<h4>Example totals \u2014 12ft \u00d7 12ft (144 sqft) with 12 mm toughened glass</h4>';
          html += '<table class="price-table"><thead><tr><th>Scenario</th><th class="rate">Total (\u20b9)</th></tr></thead><tbody>';
          rows.forEach(function (r) {
            html += '<tr><td>' + r.title + '</td><td class="rate">\u20b9 ' + r.total.toLocaleString('en-IN') + '</td></tr>';
          });
          html += '</tbody></table>';
          exampleRoot.innerHTML = html;
        }
        if (hideRatesMarker) {
          try {
            var alInput = document.getElementById('input-al-rate');
            var steelInput = document.getElementById('input-steel-rate');
            if (alInput) alInput.style.display = 'none';
            if (steelInput) steelInput.style.display = 'none';
          } catch (e) {}
        }
      } catch (e) {}
    })
    .catch(function (err) {
      pricingRoot.innerHTML = '<p style="color:#b00;">Unable to load pricing data.</p>';
      console.error('pricing load error', err);
    });
});
