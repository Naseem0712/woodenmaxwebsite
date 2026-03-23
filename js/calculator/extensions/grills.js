/**
 * Grills Price Calculator — 100% port of _grills-source/src/pages/Calculator.tsx
 * + QuotationModal.tsx PDF structure
 * Features: SVG live preview, PDF download, click-to-apply color swatches
 */
(function() {
  'use strict';

  // ──────────────────────────────────────────────
  // CONSTANTS — exact copy from Calculator.tsx
  // ──────────────────────────────────────────────
  var OUTER_PROFILES = ['12x12','12x38','12x50','16x16','19x19','20x40','25x25','25x38','25x50'];
  var INNER_RECT_PROFILES = ['12x12','12x25','12x38','12x50','16x16','18x18','19x19','20x40','25x25','25x38','25x50'];
  var INNER_ROUND_PROFILES = ['12','15','18'];
  var INNER_OVAL_PROFILES = ['15x38'];
  var THICKNESSES = [1.2, 1.5, 1.6, 2.0, 2.2];
  var ROD_SIZES = [0, 8, 10];

  var UNIT_MULTIPLIERS = { 'in': 1, 'mm': 1/25.4, 'cm': 1/2.54, 'ft': 12, 'm': 39.3700787 };

  // Actual measured weights per 12ft pipe (kg)
  var ACTUAL_WEIGHTS_12FT = {
    '12x12_1.2':0.550,'12x12_1.5':0.688,'12x12_2':0.917,
    '19x19_1.2':0.950,'19x19_1.5':1.188,'19x19_2':1.583,
    '20x40_1.2':1.450,'20x40_1.5':1.813,'20x40_2':2.417,
    '25x25_1.2':1.250,'25x25_1.5':1.563,'25x25_2':2.083,
    '25x38_1.2':1.050,'25x38_1.5':1.313,'25x38_2':2.300,
    '25x50_1.2':1.900,'25x50_1.5':2.375,'25x50_2':3.167,
    '12_1.2':0.435,'12_1.5':0.544,'12_1.6':0.580,'12_2':0.725,'12_2.2':0.960,
    '18_1.2':0.630,'18_1.5':0.788,'18_2':1.050
  };

  // Color swatches
  var PLAIN_TEXTURE_COLORS = [
    { name: 'Black',          hex: '#1a1a1a', svgStops: ['#2a2a2a','#1a1a1a','#0f0f0f'] },
    { name: 'Grey',           hex: '#6b7280', svgStops: ['#9ca3af','#6b7280','#4b5563'] },
    { name: 'Champagne Gold', hex: '#c9a84c', svgStops: ['#d4b85c','#c9a84c','#a88b3d'] },
    { name: 'White',          hex: '#f0f0f0', svgStops: ['#ffffff','#f0f0f0','#e5e5e5'] },
    { name: 'Off White',      hex: '#e8e0d0', svgStops: ['#f0e8d8','#e8e0d0','#d8d0c0'] }
  ];
  var WOODEN_COLORS = [
    { name: 'Teak Wood',      hex: '#8B5E3C', svgStops: ['#a0714a','#8B5E3C','#6d4930'] },
    { name: 'Walnut',         hex: '#5C3D2E', svgStops: ['#7a5240','#5C3D2E','#3d2820'] },
    { name: 'Mahogany',       hex: '#78350f', svgStops: ['#92400e','#78350f','#5c2a08'] },
    { name: 'Maple',          hex: '#c4956a', svgStops: ['#d4a87a','#c4956a','#a8805a'] }
  ];

  // ──────────────────────────────────────────────
  // MATH HELPERS — exact copy from Calculator.tsx
  // ──────────────────────────────────────────────
  function parseProfile(str) {
    var parts = str.split('x').map(Number);
    var w = parts[0], h = parts[1] || parts[0];
    return { face: Math.min(w,h), depth: Math.max(w,h), w: w, h: h };
  }

  function getAluWeightPerMeter(shape, w, h, t) {
    var key = '';
    if (shape === 'rect' || shape === 'outer') key = w+'x'+h+'_'+t;
    else if (shape === 'round') key = w+'_'+t;

    var w12 = ACTUAL_WEIGHTS_12FT[key];
    if (w12) return w12 / 3.6576;

    var area = 0;
    if (shape === 'rect' || shape === 'outer') {
      area = (w*h) - ((w-2*t)*(h-2*t));
    } else if (shape === 'round') {
      area = (Math.PI/4) * (w*w - Math.pow(w-2*t,2));
    } else if (shape === 'oval') {
      var minor = Math.min(w,h), major = Math.max(w,h);
      var outerA = (major-minor)*minor + (Math.PI/4)*minor*minor;
      var iMinor = Math.max(0,minor-2*t), iMajor = Math.max(0,major-2*t);
      var innerA = (iMajor-iMinor)*iMinor + (Math.PI/4)*iMinor*iMinor;
      area = outerA - innerA;
    }
    return Math.max(0, area * 0.0027);
  }

  function getIronWeightPerMeter(d) {
    if (!d) return 0;
    return (Math.PI/4) * d * d * 0.00785;
  }

  // 1D Bin Packing (First Fit Decreasing) — exact from Calculator.tsx
  function calculateBins(lengths, binSize) {
    var sorted = lengths.slice().sort(function(a,b){return b-a;});
    var bins = [];
    for (var i=0; i<sorted.length; i++) {
      var len = sorted[i];
      if (len > binSize) { bins.push(binSize - (len % binSize)); continue; }
      var placed = false;
      for (var j=0; j<bins.length; j++) {
        if (bins[j] >= len) { bins[j] -= len; placed = true; break; }
      }
      if (!placed) bins.push(binSize - len);
    }
    return bins.length;
  }

  function fmtINR(n) { return '\u20B9' + Math.round(n).toLocaleString('en-IN'); }

  // ──────────────────────────────────────────────
  // CALCULATOR CLASS
  // ──────────────────────────────────────────────
  function GrillsCalculator(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.lastResults = null;
    this.selectedColor = null;
    this.init();
  }

  GrillsCalculator.prototype.init = function() {
    this.injectPreviewAndActions();
    this.injectColorSwatches();
    this.bindEvents();
    this.updateInnerProfiles();
    this.calculate();
  };

  GrillsCalculator.prototype.el = function(id) {
    return this.container.querySelector('#' + id);
  };
  GrillsCalculator.prototype.val = function(id) {
    var e = this.el(id); return e ? e.value : '';
  };
  GrillsCalculator.prototype.numVal = function(id) {
    return parseFloat(this.val(id)) || 0;
  };

  // ── Inject SVG preview container + PDF button ──
  GrillsCalculator.prototype.injectPreviewAndActions = function() {
    var priceDisplay = this.container.querySelector('.calc-price-display');
    if (!priceDisplay) return;

    var wrap = document.createElement('div');
    wrap.id = 'grill-svg-preview-wrap';
    wrap.style.cssText = 'margin-bottom:1.5rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:1rem;';
    wrap.innerHTML =
      '<div style="display:flex;align-items:center;margin-bottom:0.75rem;">' +
        '<h3 style="color:#e2e8f0;font-size:0.95rem;font-weight:600;margin:0;flex:1;">Live Grill Preview</h3>' +
        '<span style="color:#64748b;font-size:0.7rem;background:rgba(255,255,255,0.05);padding:2px 8px;border-radius:4px;">Scale to fit</span>' +
      '</div>' +
      '<div id="grill-svg-container" style="background:rgba(15,23,42,0.5);border-radius:8px;padding:1rem;display:flex;align-items:center;justify-content:center;min-height:200px;position:relative;overflow:hidden;"></div>' +
      '<div id="grill-dim-labels" style="display:flex;justify-content:center;gap:1.5rem;margin-top:0.5rem;"></div>';
    priceDisplay.parentNode.insertBefore(wrap, priceDisplay);

    // PDF download button next to CTA
    var self = this;
    var ctaLink = this.container.querySelector('a[href*="contact"]');
    if (ctaLink && ctaLink.parentNode) {
      var btn = document.createElement('button');
      btn.id = 'grill-download-pdf';
      btn.type = 'button';
      btn.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;background:linear-gradient(135deg,#1e293b,#0f172a);color:#e2e8f0;padding:0.85rem 2rem;border-radius:12px;border:1px solid rgba(255,255,255,0.15);font-weight:600;font-size:0.95rem;cursor:pointer;margin-left:0.75rem;transition:all 0.2s;';
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF';
      btn.addEventListener('click', function(){ self.generatePDF(); });
      btn.addEventListener('mouseenter', function(){ this.style.borderColor='rgba(34,197,94,0.5)'; this.style.color='#22c55e'; });
      btn.addEventListener('mouseleave', function(){ this.style.borderColor='rgba(255,255,255,0.15)'; this.style.color='#e2e8f0'; });
      ctaLink.parentNode.appendChild(btn);
    }
  };

  // ── Inject color swatches ──
  GrillsCalculator.prototype.injectColorSwatches = function() {
    var finishSel = this.el('grill-coating-finish');
    if (!finishSel || !finishSel.parentNode) return;

    var wrap = document.createElement('div');
    wrap.id = 'grill-color-swatches';
    wrap.style.cssText = 'margin-top:0.75rem;';
    finishSel.parentNode.appendChild(wrap);

    this.renderSwatches();

    var self = this;
    finishSel.addEventListener('change', function() { self.renderSwatches(); });
  };

  GrillsCalculator.prototype.renderSwatches = function() {
    var wrap = this.container.querySelector('#grill-color-swatches');
    if (!wrap) return;
    var finish = this.val('grill-coating-finish') || 'plain';
    var colors = finish === 'wooden' ? WOODEN_COLORS : PLAIN_TEXTURE_COLORS;
    var self = this;

    var label = finish === 'wooden' ? 'Wood Finish' : (finish === 'texture' ? 'Texture Color' : 'Color');
    var html = '<label style="display:block;font-size:0.8rem;color:#94a3b8;margin-bottom:0.4rem;">' + label + ' — click to apply</label>';
    html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      var isActive = this.selectedColor && this.selectedColor.name === c.name;
      html += '<button type="button" data-color-idx="' + i + '" style="' +
        'width:40px;height:40px;border-radius:8px;border:2px solid ' + (isActive ? '#22c55e' : 'rgba(255,255,255,0.15)') + ';' +
        'background:' + c.hex + ';cursor:pointer;position:relative;transition:all 0.15s;' +
        (isActive ? 'box-shadow:0 0 0 2px #22c55e;' : '') +
        '" title="' + c.name + '">' +
        (isActive ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + (c.hex === '#f0f0f0' || c.hex === '#e8e0d0' || c.hex === '#c4956a' || c.hex === '#c9a84c' ? '#000' : '#fff') + '" stroke-width="3" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><polyline points="20 6 9 17 4 12"/></svg>' : '') +
        '</button>';
    }
    html += '</div>';
    if (this.selectedColor) {
      html += '<div style="margin-top:0.3rem;font-size:0.75rem;color:#22c55e;font-weight:500;">' + this.selectedColor.name + '</div>';
    }
    wrap.innerHTML = html;

    var btns = wrap.querySelectorAll('button[data-color-idx]');
    btns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-color-idx'));
        self.selectedColor = colors[idx];
        self.renderSwatches();
        self.renderSVG();
      });
    });
  };

  // ── Event binding ──
  GrillsCalculator.prototype.bindEvents = function() {
    var self = this;
    var ids = [
      'grill-unit','grill-width','grill-height','grill-qty',
      'grill-outer-profile','grill-outer-thickness',
      'grill-inner-shape','grill-inner-profile','grill-inner-thickness',
      'grill-rod-size','grill-pattern','grill-gap-type',
      'grill-gap1','grill-gap2','grill-gap3',
      'grill-dividers','grill-divider-count','grill-divider-layout',
      'grill-coating-finish'
    ];
    ids.forEach(function(id) {
      var e = self.el(id);
      if (e) {
        e.addEventListener('change', function(){ self.calculate(); });
        e.addEventListener('input', function(){ self.calculate(); });
      }
    });

    var shapeEl = this.el('grill-inner-shape');
    if (shapeEl) shapeEl.addEventListener('change', function() { self.updateInnerProfiles(); self.calculate(); });

    var gapTypeEl = this.el('grill-gap-type');
    if (gapTypeEl) gapTypeEl.addEventListener('change', function() { self.toggleGapInputs(); self.calculate(); });

    var divEl = this.el('grill-dividers');
    if (divEl) divEl.addEventListener('change', function() { self.toggleDividerInputs(); self.calculate(); });

    var finishEl = this.el('grill-coating-finish');
    if (finishEl) finishEl.addEventListener('change', function() { self.selectedColor = null; self.renderSwatches(); });

    this.toggleGapInputs();
    this.toggleDividerInputs();
  };

  GrillsCalculator.prototype.updateInnerProfiles = function() {
    var shape = this.val('grill-inner-shape') || 'rect';
    var sel = this.el('grill-inner-profile');
    if (!sel) return;
    var profiles = shape === 'round' ? INNER_ROUND_PROFILES : shape === 'oval' ? INNER_OVAL_PROFILES : INNER_RECT_PROFILES;
    sel.innerHTML = '';
    profiles.forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p + (shape === 'round' ? 'mm Round' : 'mm');
      sel.appendChild(opt);
    });
  };

  GrillsCalculator.prototype.toggleGapInputs = function() {
    var type = this.val('grill-gap-type') || 'uniform';
    var g2 = this.el('grill-gap2-row'), g3 = this.el('grill-gap3-row');
    if (g2) g2.style.display = (type === 'alternating2' || type === 'alternating3') ? '' : 'none';
    if (g3) g3.style.display = type === 'alternating3' ? '' : 'none';
  };

  GrillsCalculator.prototype.toggleDividerInputs = function() {
    var row = this.el('grill-divider-options');
    if (row) row.style.display = this.val('grill-dividers') === 'yes' ? '' : 'none';
  };

  // ──────────────────────────────────────────────
  // CALCULATE — exact replica of Calculator.tsx useMemo
  // ──────────────────────────────────────────────
  GrillsCalculator.prototype.calculate = function() {
    var unit = this.val('grill-unit') || 'in';
    var width = this.numVal('grill-width') || 48;
    var height = this.numVal('grill-height') || 48;
    var qty = Math.max(1, this.numVal('grill-qty') || 1);
    var outerProfile = this.val('grill-outer-profile') || '25x25';
    var outerThickness = this.numVal('grill-outer-thickness') || 1.5;
    var innerShape = this.val('grill-inner-shape') || 'rect';
    var innerProfile = this.val('grill-inner-profile') || '12x12';
    var innerThickness = this.numVal('grill-inner-thickness') || 1.2;
    var rodSize = this.numVal('grill-rod-size') || 0;
    var pattern = this.val('grill-pattern') || 'vertical';
    var gapType = this.val('grill-gap-type') || 'uniform';
    var gap1 = this.numVal('grill-gap1') || 2;
    var gap2 = this.numVal('grill-gap2') || 3;
    var gap3 = this.numVal('grill-gap3') || 4;
    var hasDividers = this.val('grill-dividers') === 'yes';
    var dividerCount = hasDividers ? Math.max(1, this.numVal('grill-divider-count') || 1) : 0;
    var dividerLayout = this.val('grill-divider-layout') || 'equal';
    var coatingFinish = this.val('grill-coating-finish') || 'plain';

    var MM_TO_IN = 1/25.4;
    var mult = UNIT_MULTIPLIERS[unit] || 1;
    var wInches = width * mult;
    var hInches = height * mult;
    var g1Inches = (gap1 * mult) || 0.1;
    var g2Inches = (gap2 * mult) || 0.1;
    var g3Inches = (gap3 * mult) || 0.1;

    var outerP = parseProfile(outerProfile);
    var innerP = parseProfile(innerProfile);
    var outerFaceInches = outerP.face * MM_TO_IN;
    var innerFaceInches = innerP.face * MM_TO_IN;

    // 1. Outer Frame
    var outerLengthInches = (wInches * 2) + (hInches * 2);

    // 2. Dividers & Section spaces
    var pipeDirSpaceInches = (pattern === 'vertical' ? wInches : hInches) - (2 * outerFaceInches);
    var supportDirSpaceInches = (pattern === 'vertical' ? hInches : wInches) - (2 * outerFaceInches);

    var sectionSpacesInches = [];
    var actualDividerCount = 0;

    if (!hasDividers || dividerCount <= 0) {
      sectionSpacesInches = [supportDirSpaceInches];
    } else {
      actualDividerCount = dividerCount;
      if (dividerLayout === 'equal') {
        var space = (supportDirSpaceInches - (actualDividerCount * outerFaceInches)) / (actualDividerCount + 1);
        for (var i = 0; i <= actualDividerCount; i++) sectionSpacesInches.push(Math.max(0, space));
      } else {
        var centerGapInches = 2 * mult;
        var totalCenterGaps = (actualDividerCount - 1) * centerGapInches;
        var sideSpace = (supportDirSpaceInches - (actualDividerCount * outerFaceInches) - totalCenterGaps) / 2;
        sectionSpacesInches.push(Math.max(0, sideSpace));
        for (var i = 0; i < actualDividerCount - 1; i++) sectionSpacesInches.push(Math.max(0, centerGapInches));
        sectionSpacesInches.push(Math.max(0, sideSpace));
      }
    }

    outerLengthInches += actualDividerCount * pipeDirSpaceInches;

    var outerLengthMeters = outerLengthInches * 0.0254;
    var outerWeightPerM = getAluWeightPerMeter('outer', outerP.w, outerP.h, outerThickness);
    var outerWeightTotal = outerLengthMeters * outerWeightPerM;

    // 3. Inner Pipes — gap calculation
    var pipeCount = 0;
    var exactGaps = [];

    if (gapType === 'uniform') {
      pipeCount = Math.max(0, Math.round((pipeDirSpaceInches - g1Inches) / (innerFaceInches + g1Inches)));
      var totalGapSpace = pipeDirSpaceInches - (pipeCount * innerFaceInches);
      var exactGap = pipeCount >= 0 ? totalGapSpace / (pipeCount + 1) : pipeDirSpaceInches;
      for (var i = 0; i <= pipeCount; i++) exactGaps.push(exactGap);
    } else if (gapType === 'alternating2') {
      var gAvg = (g1Inches + g2Inches) / 2;
      pipeCount = Math.max(0, Math.round((pipeDirSpaceInches - gAvg) / (innerFaceInches + gAvg)));
      var totalGapSpace = pipeDirSpaceInches - (pipeCount * innerFaceInches);
      var sumNominal = 0;
      for (var i = 0; i <= pipeCount; i++) sumNominal += (i%2===0) ? g1Inches : g2Inches;
      var scale = sumNominal > 0 ? totalGapSpace / sumNominal : 0;
      for (var i = 0; i <= pipeCount; i++) exactGaps.push(((i%2===0)?g1Inches:g2Inches)*scale);
    } else {
      var gAvg = (g1Inches + g2Inches + g3Inches) / 3;
      pipeCount = Math.max(0, Math.round((pipeDirSpaceInches - gAvg) / (innerFaceInches + gAvg)));
      var totalGapSpace = pipeDirSpaceInches - (pipeCount * innerFaceInches);
      var sumNominal = 0;
      for (var i = 0; i <= pipeCount; i++) sumNominal += (i%3===0)?g1Inches:(i%3===1)?g2Inches:g3Inches;
      var scale = sumNominal > 0 ? totalGapSpace / sumNominal : 0;
      for (var i = 0; i <= pipeCount; i++) exactGaps.push(((i%3===0)?g1Inches:(i%3===1)?g2Inches:g3Inches)*scale);
    }

    // Build pipe & divider geometry — exact from Calculator.tsx lines 428-478
    var pipes = [], dividers = [];
    var currentSupportPos = outerFaceInches;

    for (var s = 0; s < sectionSpacesInches.length; s++) {
      var segmentLength = sectionSpacesInches[s];
      var currentPipePos = outerFaceInches + exactGaps[0];

      for (var i = 0; i < pipeCount; i++) {
        if (pattern === 'vertical') {
          pipes.push({ x: currentPipePos, y: currentSupportPos, w: innerFaceInches, h: segmentLength, isRound: innerShape === 'round' });
        } else {
          pipes.push({ x: currentSupportPos, y: currentPipePos, w: segmentLength, h: innerFaceInches, isRound: innerShape === 'round' });
        }
        currentPipePos += innerFaceInches + exactGaps[i + 1];
      }

      currentSupportPos += segmentLength;

      if (s < sectionSpacesInches.length - 1) {
        if (pattern === 'vertical') {
          dividers.push({ x: outerFaceInches, y: currentSupportPos, w: pipeDirSpaceInches, h: outerFaceInches });
        } else {
          dividers.push({ x: currentSupportPos, y: outerFaceInches, w: outerFaceInches, h: pipeDirSpaceInches });
        }
        currentSupportPos += outerFaceInches;
      }
    }

    var totalPipeCount = pipeCount * sectionSpacesInches.length;
    var innerLengthInches = 0;
    for (var s = 0; s < sectionSpacesInches.length; s++) innerLengthInches += sectionSpacesInches[s];
    innerLengthInches *= pipeCount;
    var innerLengthMeters = innerLengthInches * 0.0254;
    var innerWeightPerM = getAluWeightPerMeter(innerShape, innerP.w, innerP.h, innerThickness);
    var innerWeightTotal = innerLengthMeters * innerWeightPerM;

    // Threaded rods
    var singleRodLengthInches = pattern === 'vertical' ? hInches : wInches;
    var rodLengthMeters = (pipeCount * singleRodLengthInches) * 0.0254;
    var rodWeightPerM = getIronWeightPerMeter(rodSize);
    var rodWeightTotal = rodLengthMeters * rodWeightPerM;
    var nutsCount = rodSize > 0 ? pipeCount * 2 : 0;

    // Material pieces for bin packing
    var outerPieces = [wInches, wInches, hInches, hInches];
    for (var i = 0; i < actualDividerCount; i++) outerPieces.push(pipeDirSpaceInches);
    var innerPieces = [];
    for (var s = 0; s < sectionSpacesInches.length; s++) {
      for (var i = 0; i < pipeCount; i++) innerPieces.push(sectionSpacesInches[s]);
    }

    var totalAreaSqFt = (wInches * hInches) / 144;

    // ── BOTTOM-UP COSTING — exact from Calculator.tsx lines 513-636 ──
    var allOuterLengths = [], allInnerLengths = [];
    for (var q = 0; q < qty; q++) {
      allOuterLengths = allOuterLengths.concat(outerPieces);
      allInnerLengths = allInnerLengths.concat(innerPieces);
    }

    function calcAluCostForStdLength(stdLenInches) {
      var outerBins = calculateBins(allOuterLengths, stdLenInches);
      var innerBins = calculateBins(allInnerLengths, stdLenInches);
      var totalOuterPurchasedMeters = outerBins * (stdLenInches * 0.0254);
      var totalInnerPurchasedMeters = innerBins * (stdLenInches * 0.0254);
      var purchasedWeight = totalOuterPurchasedMeters * outerWeightPerM + totalInnerPurchasedMeters * innerWeightPerM;
      var usedWeight = (outerWeightTotal + innerWeightTotal) * qty;
      var wastageWeight = Math.max(0, purchasedWeight - usedWeight);
      return {
        stdLenInches: stdLenInches,
        outerBins: outerBins, innerBins: innerBins,
        usedCost: usedWeight * 550,
        wastageCost: wastageWeight * 380,
        totalAluCost: usedWeight * 550
      };
    }

    var cost12ft = calcAluCostForStdLength(144);
    var cost16ft = calcAluCostForStdLength(192);
    var bestAluCost = cost12ft.totalAluCost <= cost16ft.totalAluCost ? cost12ft : cost16ft;

    // Powder Coating
    var maxPipeSize = Math.max(outerP.w, outerP.h, innerP.w, innerP.h);
    var baseCoatingRate = maxPipeSize >= 20 ? 50 : 35;
    var finishExtra = coatingFinish === 'texture' ? 15 : coatingFinish === 'wooden' ? 30 : 0;
    var totalCoatingCost = totalAreaSqFt * qty * (baseCoatingRate + finishExtra);

    // Labour
    var makingCost = 50 * totalAreaSqFt * qty;
    var installationCost = 30 * totalAreaSqFt * qty;

    // Hardware
    var totalRodCost = 0, totalNutsCost = 0, rodQty = 0;
    if (rodSize > 0) {
      var reqRodLenMeters = singleRodLengthInches * 0.0254;
      var purchasedLenPerRod = reqRodLenMeters <= 1 ? 1 : reqRodLenMeters <= 1.5 ? 1.5 : reqRodLenMeters <= 2 ? 2 : reqRodLenMeters <= 3 ? 3 : Math.ceil(reqRodLenMeters/3)*3;
      var ratePerMeterCurrent = (65/2) * ((rodSize*rodSize)/36);
      rodQty = pipeCount;
      totalRodCost = rodQty * qty * purchasedLenPerRod * ratePerMeterCurrent;
      totalNutsCost = nutsCount * qty * 3;
    }

    // Total
    var totalManufacturingCost = bestAluCost.totalAluCost + totalCoatingCost + makingCost + totalRodCost + totalNutsCost;
    var profit = totalManufacturingCost * 0.30;
    var baseSellingPrice = totalManufacturingCost + profit;
    var finalSellingPrice = baseSellingPrice;
    var perSqftRate = totalAreaSqFt > 0 ? finalSellingPrice / (totalAreaSqFt * qty) : 0;

    var totalAluWeight = outerWeightTotal + innerWeightTotal;
    var totalIronWeight = rodWeightTotal;
    var grandTotal = finalSellingPrice + installationCost + bestAluCost.wastageCost;

    this.lastResults = {
      wInches: wInches, hInches: hInches, width: width, height: height, unit: unit, qty: qty,
      outerFaceInches: outerFaceInches, innerFaceInches: innerFaceInches,
      pipes: pipes, dividers: dividers, pipeCount: pipeCount,
      totalPipeCount: totalPipeCount, totalAreaSqFt: totalAreaSqFt,
      outerWeightTotal: outerWeightTotal, innerWeightTotal: innerWeightTotal,
      totalAluWeight: totalAluWeight, totalIronWeight: totalIronWeight,
      totalWeight: totalAluWeight + totalIronWeight,
      finalSellingPrice: finalSellingPrice, baseSellingPrice: baseSellingPrice,
      perSqftRate: perSqftRate, installationCost: installationCost,
      wastageCost: bestAluCost.wastageCost, grandTotal: grandTotal,
      outerBins: bestAluCost.outerBins, innerBins: bestAluCost.innerBins,
      stdLenInches: bestAluCost.stdLenInches,
      rodQty: rodQty, nutsCount: nutsCount, rodSize: rodSize,
      outerProfile: outerProfile, outerThickness: outerThickness,
      innerProfile: innerProfile, innerThickness: innerThickness, innerShape: innerShape,
      pattern: pattern, gapType: gapType, coatingFinish: coatingFinish,
      hasDividers: hasDividers, sectionSpaces: sectionSpacesInches, exactGaps: exactGaps
    };

    // Update DOM
    this.setText('grill-result-area', totalAreaSqFt.toFixed(2) + ' sq.ft');
    this.setText('grill-result-pipes', pipeCount + ' pipes \u00d7 ' + sectionSpacesInches.length + ' section' + (sectionSpacesInches.length>1?'s':''));
    this.setText('grill-result-alu-weight', (totalAluWeight * qty).toFixed(2) + ' kg');
    this.setText('grill-result-iron-weight', (totalIronWeight * qty).toFixed(2) + ' kg');
    this.setText('grill-result-outer-qty', bestAluCost.outerBins + ' pcs (' + (bestAluCost.stdLenInches===144?'12ft':'16ft') + ')');
    this.setText('grill-result-inner-qty', bestAluCost.innerBins + ' pcs (' + (bestAluCost.stdLenInches===144?'12ft':'16ft') + ')');
    this.setText('grill-result-rod-qty', rodQty > 0 ? rodQty + ' rods' : 'None');
    this.setText('grill-result-nuts', nutsCount > 0 ? (nutsCount*qty) + ' nuts' : 'None');
    this.setText('grill-result-total', fmtINR(finalSellingPrice));
    this.setText('grill-result-per-sqft', fmtINR(perSqftRate) + '/sqft');
    this.setText('grill-result-per-unit', fmtINR(finalSellingPrice/qty) + '/grill');
    this.setText('grill-result-install', fmtINR(installationCost));
    this.setText('grill-result-wastage', fmtINR(bestAluCost.wastageCost));
    this.setText('grill-result-grand', fmtINR(grandTotal));

    this.renderSVG();
  };

  GrillsCalculator.prototype.setText = function(id, text) {
    var e = this.el(id);
    if (e) e.textContent = text;
  };

  // ──────────────────────────────────────────────
  // SVG PREVIEW — exact replica of Calculator.tsx JSX lines 1214-1304
  // ──────────────────────────────────────────────
  GrillsCalculator.prototype.renderSVG = function() {
    var ct = this.container.querySelector('#grill-svg-container');
    var dl = this.container.querySelector('#grill-dim-labels');
    if (!ct || !this.lastResults) return;
    var r = this.lastResults;
    var uid = this.containerId;
    var sw = Math.max(r.wInches, r.hInches) * 0.001;

    // Determine fill gradient based on selected color or coating finish
    var stops;
    if (this.selectedColor) {
      stops = this.selectedColor.svgStops;
    } else if (r.coatingFinish === 'wooden') {
      stops = ['#78350f','#92400e','#b45309'];
    } else if (r.coatingFinish === 'texture') {
      stops = ['#3f3f46','#27272a','#18181b'];
    } else {
      stops = ['#52525b','#27272a','#18181b'];
    }

    var gid = 'gf-' + uid;
    var fid = 'fs-' + uid;

    var svg = [];
    svg.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+r.wInches+' '+r.hInches+'" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;max-height:320px;display:block;">');
    svg.push('<defs>');

    if (r.coatingFinish === 'wooden' && !this.selectedColor) {
      svg.push('<linearGradient id="'+gid+'" x1="0%" y1="0%" x2="100%" y2="0%">');
    } else {
      svg.push('<linearGradient id="'+gid+'" x1="0%" y1="0%" x2="100%" y2="100%">');
    }
    svg.push('<stop offset="0%" stop-color="'+stops[0]+'"/>');
    svg.push('<stop offset="50%" stop-color="'+stops[1]+'"/>');
    svg.push('<stop offset="100%" stop-color="'+stops[2]+'"/>');
    svg.push('</linearGradient>');
    svg.push('<filter id="'+fid+'" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" flood-opacity="0.3"/></filter>');
    svg.push('</defs>');

    var fill = 'url(#'+gid+')';
    var filter = 'url(#'+fid+')';
    var oF = r.outerFaceInches;

    // Outer frame with cutout — exact from JSX
    svg.push('<path d="M0,0 H'+r.wInches+' V'+r.hInches+' H0 Z M'+oF+','+oF+' V'+(r.hInches-oF)+' H'+(r.wInches-oF)+' V'+oF+' Z" fill="'+fill+'" filter="'+filter+'" fill-rule="evenodd"/>');

    // Dividers
    for (var d = 0; d < r.dividers.length; d++) {
      var dv = r.dividers[d];
      svg.push('<rect x="'+dv.x+'" y="'+dv.y+'" width="'+dv.w+'" height="'+dv.h+'" fill="'+fill+'" filter="'+filter+'" stroke="#18181b" stroke-width="'+sw+'"/>');
    }

    // Inner pipes
    for (var p = 0; p < r.pipes.length; p++) {
      var pipe = r.pipes[p];
      var rx = (pipe.isRound || r.innerShape === 'oval') ? Math.min(pipe.w, pipe.h) / 2 : Math.max(r.wInches, r.hInches) * 0.002;
      svg.push('<rect x="'+pipe.x+'" y="'+pipe.y+'" width="'+pipe.w+'" height="'+pipe.h+'" rx="'+rx+'" fill="'+fill+'" filter="'+filter+'" stroke="#27272a" stroke-width="'+sw+'"/>');
    }

    // Rod indicators inside pipes
    if (r.rodSize > 0) {
      for (var p = 0; p < r.pipes.length; p++) {
        var pipe = r.pipes[p];
        var cx = pipe.x + pipe.w / 2;
        var cy = pipe.y + pipe.h / 2;
        var isVert = r.pattern === 'vertical';
        svg.push('<line x1="'+(isVert?cx:pipe.x)+'" y1="'+(isVert?pipe.y:cy)+'" x2="'+(isVert?cx:pipe.x+pipe.w)+'" y2="'+(isVert?pipe.y+pipe.h:cy)+'" stroke="#18181b" stroke-width="'+(Math.max(r.wInches,r.hInches)*0.003)+'" stroke-dasharray="4 2" opacity="0.6"/>');
      }
    }

    svg.push('</svg>');
    ct.innerHTML = svg.join('');

    if (dl) {
      dl.innerHTML = '<span style="color:#94a3b8;font-size:0.75rem;font-weight:500;background:rgba(255,255,255,0.05);padding:2px 10px;border-radius:4px;">'+r.width+' '+r.unit+' W</span>' +
        '<span style="color:#94a3b8;font-size:0.75rem;font-weight:500;background:rgba(255,255,255,0.05);padding:2px 10px;border-radius:4px;">'+r.height+' '+r.unit+' H</span>';
    }
  };

  // ──────────────────────────────────────────────
  // PDF — structure from QuotationModal.tsx buildPDF()
  // ──────────────────────────────────────────────
  GrillsCalculator.prototype.generatePDF = function() {
    var r = this.lastResults;
    if (!r) return;
    var btn = this.container.querySelector('#grill-download-pdf');
    if (btn) { btn.textContent = 'Generating\u2026'; btn.disabled = true; }
    var self = this;
    this._loadJsPDF(function() {
      try { self._buildPDF(r); }
      catch(e) { console.error('PDF generation failed:', e); alert('PDF generation failed.'); }
      if (btn) {
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF';
        btn.disabled = false;
      }
    });
  };

  GrillsCalculator.prototype._loadJsPDF = function(cb) {
    if (window.jspdf && window.jspdf.jsPDF) { cb(); return; }
    var s1 = document.createElement('script');
    s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s1.onerror = function() { alert('Failed to load PDF library. Check your internet connection.'); };
    s1.onload = function() {
      var s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.7.0/jspdf.plugin.autotable.min.js';
      s2.onerror = function() { alert('Failed to load PDF table plugin. Check your internet connection.'); };
      s2.onload = cb;
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  };

  GrillsCalculator.prototype._buildPDF = function(r) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF('p', 'pt', 'a4');
    var pw = doc.internal.pageSize.getWidth();
    var y = 40;

    // ── Header — from QuotationModal buildPDF() ──
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('WoodenMax Architectural Elements', 40, y);
    y += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('5-6-411/413 Aghapura, Nampally, Hyderabad TS-500001', 40, y);
    y += 12;
    doc.text('Email: info@woodenmax.in | Web: www.woodenmax.in', 40, y);
    y += 12;
    doc.text('GSTIN: 36ARWPA9740L1Z3', 40, y);

    // Title on right — from QuotationModal
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('GRILL ESTIMATE', pw - 40, 50, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Date: ' + new Date().toLocaleDateString('en-IN'), pw - 40, 65, { align: 'right' });
    doc.text('Ref: EST-' + Math.floor(Math.random()*10000), pw - 40, 77, { align: 'right' });

    y += 30;
    doc.setDrawColor(200);
    doc.line(40, y, pw - 40, y);
    y += 20;

    // ── Item table — from QuotationModal autoTable structure ──
    var pageTitle = (document.title || 'Custom Grill').split('|')[0].trim();
    var colorName = this.selectedColor ? this.selectedColor.name : '';
    var description = [
      'Outer: ' + r.outerProfile + 'mm (' + r.outerThickness + 'mm wall)',
      'Inner: ' + r.innerProfile + 'mm ' + r.innerShape + ' (' + r.innerThickness + 'mm wall)',
      'Pattern: ' + r.pattern.charAt(0).toUpperCase() + r.pattern.slice(1),
      'Gaps: ' + r.gapType
    ];
    if (r.hasDividers) description.push('Supports: ' + r.sectionSpaces.length + ' sections');
    if (r.rodSize > 0) description.push('Iron Rods: ' + r.rodSize + 'mm');
    description.push('Finish: ' + r.coatingFinish + (colorName ? ' — ' + colorName : ''));

    var itemDesc = pageTitle + '\nSize: ' + r.width + 'x' + r.height + ' ' + r.unit + '\n\nSpecs:\n' + description.join('\n');
    var perGrillWt = r.totalAluWeight + r.totalIronWeight;
    var areaWtCol = r.qty > 1
      ? 'Per: '+r.totalAreaSqFt.toFixed(2)+' sqft\nTotal: '+(r.totalAreaSqFt*r.qty).toFixed(2)+' sqft\n\nPer Wt: '+perGrillWt.toFixed(2)+' kg\nTotal Wt: '+(perGrillWt*r.qty).toFixed(2)+' kg'
      : r.totalAreaSqFt.toFixed(2)+' sqft\n\nWt: '+perGrillWt.toFixed(2)+' kg';

    doc.autoTable({
      startY: y,
      head: [['Ref', 'Description', 'Qty', 'Area & Wt', 'Rate', 'Amount']],
      body: [['G01', itemDesc, r.qty, areaWtCol, 'Rs. '+r.perSqftRate.toFixed(2)+'/sqft', 'Rs. '+Math.round(r.finalSellingPrice).toLocaleString('en-IN')]],
      theme: 'grid',
      headStyles: { fillColor: [39, 39, 42] },
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: { 0:{cellWidth:30}, 1:{cellWidth:140}, 2:{cellWidth:30,halign:'center'}, 3:{cellWidth:80}, 4:{cellWidth:90}, 5:{cellWidth:80,halign:'right'} },
      margin: { left: 40, right: 40 }
    });

    y = doc.lastAutoTable.finalY + 20;

    // ── Totals — from QuotationModal ──
    var totalsX = pw - 200;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Sub Total (Grills):', totalsX, y);
    doc.text('Rs. ' + Math.round(r.finalSellingPrice).toLocaleString('en-IN'), pw - 40, y, { align: 'right' });
    y += 15;

    if (r.wastageCost > 0) {
      doc.text('Wastage Cost:', totalsX, y);
      doc.text('Rs. ' + Math.round(r.wastageCost).toLocaleString('en-IN'), pw - 40, y, { align: 'right' });
      y += 15;
    }

    doc.text('Installation Cost:', totalsX, y);
    doc.text('Rs. ' + Math.round(r.installationCost).toLocaleString('en-IN'), pw - 40, y, { align: 'right' });
    y += 15;

    var totalBeforeGST = r.finalSellingPrice + r.wastageCost + r.installationCost;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Before Tax:', totalsX, y);
    doc.text('Rs. ' + Math.round(totalBeforeGST).toLocaleString('en-IN'), pw - 40, y, { align: 'right' });
    y += 15;

    var gstAmount = totalBeforeGST * 0.18;
    doc.setFont('helvetica', 'normal');
    doc.text('GST (18%):', totalsX, y);
    doc.text('Rs. ' + Math.round(gstAmount).toLocaleString('en-IN'), pw - 40, y, { align: 'right' });
    y += 15;

    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', totalsX, y);
    doc.text('Rs. ' + Math.round(totalBeforeGST + gstAmount).toLocaleString('en-IN'), pw - 40, y, { align: 'right' });
    y += 30;

    // ── Material required ──
    doc.setFontSize(11);
    doc.text('Material Required', 40, y);
    y += 5;
    doc.autoTable({
      startY: y,
      head: [['Material', 'Quantity']],
      body: [
        ['Outer Frame Pipes', r.outerBins + ' pcs x ' + (r.stdLenInches===144?'12ft':'16ft')],
        ['Inner Pipes', r.innerBins + ' pcs x ' + (r.stdLenInches===144?'12ft':'16ft')],
        ['Threaded Rods', r.rodQty > 0 ? r.rodQty + ' rods' : 'None'],
        ['Nuts', r.nutsCount > 0 ? (r.nutsCount*r.qty) + ' pcs' : 'None'],
        ['Total Alu Weight', (r.totalAluWeight*r.qty).toFixed(2)+' kg'],
        ['Total Iron Weight', (r.totalIronWeight*r.qty).toFixed(2)+' kg']
      ],
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 105], fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 160, fontStyle: 'bold' } },
      margin: { left: 40, right: 40 }
    });

    y = doc.lastAutoTable.finalY + 20;

    // ── Terms — from QuotationModal ──
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 40, y);
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    var terms = '1. 50% advance along with PO.\n2. Balance against proforma invoice before dispatch.\n3. Validity: 15 days.';
    var splitTerms = doc.splitTextToSize(terms, pw - 80);
    doc.text(splitTerms, 40, y);
    y += splitTerms.length * 12 + 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Details:', 40, y);
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    var bank = 'Account Name: WoodenMax Architectural Elements\nAccount Number: 5020092938110\nIFSC Code: HDFC0001996\nBranch: Hyderaguda Hyderabad';
    var splitBank = doc.splitTextToSize(bank, pw/2 - 60);
    doc.text(splitBank, 40, y);
    y += splitBank.length * 12 + 20;

    // Signatory
    doc.setFont('helvetica', 'bold');
    doc.text('For WoodenMax Architectural Elements', pw - 40, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized Signatory', pw - 40, y + 40, { align: 'right' });

    // ── Design Preview page — from QuotationModal ──
    var svgEl = this.container.querySelector('#grill-svg-container svg');
    if (svgEl) {
      try {
        doc.addPage();
        var svgY = 40;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Design Previews', 40, svgY);
        svgY += 30;
        doc.setFontSize(11);
        doc.text('Design: ' + pageTitle, 40, svgY);
        svgY += 15;

        var svgData = new XMLSerializer().serializeToString(svgEl);
        var canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1200 * (r.hInches / r.wInches);
        var ctx = canvas.getContext('2d');
        var img = new Image();
        var svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        var url = URL.createObjectURL(svgBlob);

        var docRef = doc;
        var fileName = 'WoodenMax_Grill_Estimate_' + r.width + 'x' + r.height + r.unit + '.pdf';

        img.onload = function() {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);

          var imgData = canvas.toDataURL('image/png');
          var imgWidth = 160;
          var imgHeight = 160 * (r.hInches / r.wInches);
          if (imgHeight > 300) { imgHeight = 300; imgWidth = imgHeight * (r.wInches / r.hInches); }

          docRef.addImage(imgData, 'PNG', 40, svgY, imgWidth, imgHeight);

          var taglineY = svgY + imgHeight + 15;
          docRef.setFontSize(8);
          docRef.setFont('helvetica', 'italic');
          docRef.text('Outer Frame: ' + r.outerProfile + 'mm | Inner Profile: ' + r.innerProfile + 'mm ' + r.innerShape + ' | Gaps: ' + r.gapType + ' | Pattern: ' + r.pattern, 40, taglineY);

          var listY = svgY + 15;
          docRef.setFontSize(9);
          docRef.setFont('helvetica', 'bold');
          docRef.text('Applied to sizes:', 220, listY);
          listY += 15;
          docRef.setFont('helvetica', 'normal');
          docRef.text('\u2022 ' + r.width + 'x' + r.height + ' ' + r.unit + ' (Qty: ' + r.qty + ')', 220, listY);

          docRef.save(fileName);
        };
        img.onerror = function() {
          URL.revokeObjectURL(url);
          docRef.save(fileName);
        };
        img.src = url;
      } catch(e) {
        console.error('SVG to PDF failed:', e);
        doc.save('WoodenMax_Grill_Estimate.pdf');
      }
    } else {
      doc.save('WoodenMax_Grill_Estimate_' + r.width + 'x' + r.height + r.unit + '.pdf');
    }
  };

  // ──────────────────────────────────────────────
  // QUOTATION CART — multi-size for single design
  // ──────────────────────────────────────────────
  GrillsCalculator.prototype.quotationItems = null;
  GrillsCalculator.prototype._qid = 0;

  GrillsCalculator.prototype.injectQuotationCart = function() {
    var priceDisplay = this.container.querySelector('.calc-price-display');
    if (!priceDisplay) return;

    var cartWrap = document.createElement('div');
    cartWrap.id = 'grill-quotation-cart';
    cartWrap.style.cssText = 'margin-top:1.5rem;';

    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.id = 'grill-add-to-quote';
    addBtn.style.cssText = 'width:100%;padding:0.85rem;background:linear-gradient(135deg,#059669,#047857);color:#fff;border:none;border-radius:12px;font-weight:600;font-size:0.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem;transition:all 0.2s;margin-bottom:1rem;';
    addBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Add This Size to Quotation';
    var self = this;
    addBtn.addEventListener('click', function() { self.addToQuotation(); });
    cartWrap.appendChild(addBtn);

    var listDiv = document.createElement('div');
    listDiv.id = 'grill-quote-list';
    listDiv.style.cssText = 'display:none;';
    cartWrap.appendChild(listDiv);

    priceDisplay.parentNode.insertBefore(cartWrap, priceDisplay.nextSibling);
    this.quotationItems = [];
  };

  GrillsCalculator.prototype.addToQuotation = function() {
    var r = this.lastResults;
    if (!r) return;
    this._qid++;
    var item = {
      id: this._qid,
      width: r.width, height: r.height, unit: r.unit, qty: r.qty,
      outerProfile: r.outerProfile, outerThickness: r.outerThickness,
      innerProfile: r.innerProfile, innerShape: r.innerShape, innerThickness: r.innerThickness,
      pattern: r.pattern, gapType: r.gapType, coatingFinish: r.coatingFinish,
      colorName: this.selectedColor ? this.selectedColor.name : '',
      rodSize: r.rodSize, hasDividers: r.hasDividers,
      totalAreaSqFt: r.totalAreaSqFt, grandTotal: r.grandTotal,
      perSqftRate: r.perSqftRate, finalSellingPrice: r.finalSellingPrice,
      installationCost: r.installationCost, wastageCost: r.wastageCost
    };
    this.quotationItems.push(item);
    this.renderQuotationList();

    var addBtn = this.container.querySelector('#grill-add-to-quote');
    if (addBtn) {
      addBtn.textContent = 'Added!';
      addBtn.style.background = 'linear-gradient(135deg,#16a34a,#15803d)';
      setTimeout(function() {
        addBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Add Another Size';
        addBtn.style.background = 'linear-gradient(135deg,#059669,#047857)';
      }, 800);
    }
  };

  GrillsCalculator.prototype.removeFromQuotation = function(id) {
    this.quotationItems = this.quotationItems.filter(function(item) { return item.id !== id; });
    this.renderQuotationList();
  };

  GrillsCalculator.prototype.renderQuotationList = function() {
    var listDiv = this.container.querySelector('#grill-quote-list');
    if (!listDiv) return;
    var items = this.quotationItems;
    if (!items || items.length === 0) { listDiv.style.display = 'none'; return; }

    listDiv.style.display = 'block';
    var self = this;
    var totalGrand = 0;
    var html = '<div style="background:rgba(5,150,105,0.08);border:1px solid rgba(5,150,105,0.25);border-radius:12px;padding:1rem;margin-bottom:1rem;">';
    html += '<h4 style="color:#22c55e;font-size:0.95rem;margin:0 0 0.75rem;display:flex;align-items:center;gap:0.5rem;">';
    html += '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>';
    html += 'Quotation (' + items.length + ' size' + (items.length > 1 ? 's' : '') + ')</h4>';

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      totalGrand += it.grandTotal;
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.08);" data-qitem="' + it.id + '">';
      html += '<div style="flex:1;">';
      html += '<span style="color:#e2e8f0;font-weight:600;font-size:0.9rem;">' + it.width + 'x' + it.height + ' ' + it.unit + '</span>';
      html += '<span style="color:#94a3b8;font-size:0.8rem;margin-left:0.5rem;">Qty: ' + it.qty + '</span>';
      html += '<div style="color:#64748b;font-size:0.75rem;">' + it.outerProfile + 'mm | ' + it.innerProfile + 'mm ' + it.innerShape + ' | ' + it.coatingFinish + (it.colorName ? ' — ' + it.colorName : '') + '</div>';
      html += '</div>';
      html += '<div style="text-align:right;margin-right:0.5rem;">';
      html += '<div style="color:#22c55e;font-weight:600;font-size:0.9rem;">' + fmtINR(it.grandTotal) + '</div>';
      html += '<div style="color:#64748b;font-size:0.7rem;">' + it.totalAreaSqFt.toFixed(1) + ' sqft</div>';
      html += '</div>';
      html += '<button type="button" data-remove-qid="' + it.id + '" style="background:none;border:none;color:#ef4444;cursor:pointer;padding:4px;" title="Remove">';
      html += '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg></button>';
      html += '</div>';
    }

    html += '<div style="display:flex;justify-content:space-between;padding:0.75rem 0 0;margin-top:0.25rem;">';
    html += '<span style="color:#e2e8f0;font-weight:700;">Quotation Total:</span>';
    html += '<span style="color:#22c55e;font-weight:700;font-size:1.1rem;">' + fmtINR(totalGrand) + '</span>';
    html += '</div>';
    html += '</div>';

    listDiv.innerHTML = html;

    listDiv.querySelectorAll('button[data-remove-qid]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        self.removeFromQuotation(parseInt(this.getAttribute('data-remove-qid')));
      });
    });
  };

  // ──────────────────────────────────────────────
  // EMAIL INQUIRY + WHATSAPP
  // ──────────────────────────────────────────────
  GrillsCalculator.prototype.injectInquiryForm = function() {
    var ctaDiv = this.container.querySelector('div[style*="text-align: center"]');
    if (!ctaDiv) {
      ctaDiv = this.container.querySelector('a[href*="contact"]');
      if (ctaDiv) ctaDiv = ctaDiv.parentNode;
    }
    if (!ctaDiv) return;

    var self = this;
    var formDiv = document.createElement('div');
    formDiv.id = 'grill-inquiry-form';
    formDiv.style.cssText = 'margin-top:2rem;padding:1.5rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;';
    formDiv.innerHTML =
      '<h4 style="color:#22c55e;margin:0 0 1rem;font-size:1.1rem;display:flex;align-items:center;gap:0.5rem;">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' +
        'Get Exact Price — Free Quote' +
      '</h4>' +
      '<form id="grill-user-form" onsubmit="return false;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem;">' +
          '<input type="text" id="grill-user-name" placeholder="Your Name *" required style="padding:0.75rem;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:#e2e8f0;font-size:0.9rem;">' +
          '<input type="text" id="grill-user-city" placeholder="City *" required style="padding:0.75rem;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:#e2e8f0;font-size:0.9rem;">' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem;">' +
          '<input type="tel" id="grill-user-mobile" placeholder="Mobile Number *" required style="padding:0.75rem;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:#e2e8f0;font-size:0.9rem;">' +
          '<input type="email" id="grill-user-email" placeholder="Email (optional)" style="padding:0.75rem;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:#e2e8f0;font-size:0.9rem;">' +
        '</div>' +
        '<div style="display:flex;gap:0.75rem;">' +
          '<button type="submit" id="grill-submit-inquiry" style="flex:1;padding:0.85rem;background:linear-gradient(135deg,#059669,#047857);color:#fff;border:none;border-radius:12px;font-weight:600;font-size:0.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem;">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' +
            'Get Exact Price' +
          '</button>' +
          '<button type="button" id="grill-whatsapp-btn" style="padding:0.85rem 1.5rem;background:#25d366;color:#fff;border:none;border-radius:12px;font-weight:600;font-size:0.95rem;cursor:pointer;display:flex;align-items:center;gap:0.5rem;">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.489l4.624-1.467A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.58-5.938-1.592l-.42-.25-4.357 1.143 1.164-4.254-.276-.438A9.79 9.79 0 012.182 12c0-5.42 4.398-9.818 9.818-9.818S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/></svg>' +
            'WhatsApp' +
          '</button>' +
        '</div>' +
        '<p style="color:#64748b;font-size:0.75rem;margin:0.5rem 0 0;text-align:center;">No spam. Your details are sent directly to our team for a personalized quote.</p>' +
      '</form>' +
      '<div id="grill-inquiry-success" style="display:none;text-align:center;padding:1.5rem;">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="margin-bottom:0.75rem;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
        '<h4 style="color:#22c55e;margin:0 0 0.5rem;">Quote Request Sent!</h4>' +
        '<p style="color:#94a3b8;font-size:0.9rem;margin:0;">Our team will contact you within 2 hours with an exact price.</p>' +
      '</div>';

    ctaDiv.parentNode.insertBefore(formDiv, ctaDiv.nextSibling);

    var form = formDiv.querySelector('#grill-user-form');
    form.addEventListener('submit', function(e) { e.preventDefault(); self.submitInquiry(); });

    var waBtn = formDiv.querySelector('#grill-whatsapp-btn');
    waBtn.addEventListener('click', function() { self.sendWhatsApp(); });
  };

  GrillsCalculator.prototype._buildEmailBody = function() {
    var r = this.lastResults;
    if (!r) return '';
    var items = this.quotationItems && this.quotationItems.length > 0 ? this.quotationItems : null;
    var pageTitle = (document.title || 'Grill Quote').split('|')[0].trim();
    var lines = [];
    lines.push('=== GRILL QUOTATION REQUEST ===');
    lines.push('Page: ' + pageTitle);
    lines.push('Date: ' + new Date().toLocaleDateString('en-IN'));
    lines.push('');

    if (items) {
      var totalGrand = 0;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        totalGrand += it.grandTotal;
        lines.push('--- Size ' + (i+1) + ' ---');
        lines.push('Dimensions: ' + it.width + 'x' + it.height + ' ' + it.unit + ' (Qty: ' + it.qty + ')');
        lines.push('Outer: ' + it.outerProfile + 'mm (' + it.outerThickness + 'mm)');
        lines.push('Inner: ' + it.innerProfile + 'mm ' + it.innerShape + ' (' + it.innerThickness + 'mm)');
        lines.push('Pattern: ' + it.pattern + ' | Gaps: ' + it.gapType);
        lines.push('Finish: ' + it.coatingFinish + (it.colorName ? ' — ' + it.colorName : ''));
        if (it.rodSize > 0) lines.push('Rod: ' + it.rodSize + 'mm');
        lines.push('Area: ' + it.totalAreaSqFt.toFixed(2) + ' sqft');
        lines.push('Rate: ' + fmtINR(it.perSqftRate) + '/sqft');
        lines.push('Grand Total: ' + fmtINR(it.grandTotal));
        lines.push('');
      }
      lines.push('=== QUOTATION TOTAL: ' + fmtINR(totalGrand) + ' ===');
    } else {
      lines.push('--- Current Calculation ---');
      lines.push('Dimensions: ' + r.width + 'x' + r.height + ' ' + r.unit + ' (Qty: ' + r.qty + ')');
      lines.push('Outer: ' + r.outerProfile + 'mm (' + r.outerThickness + 'mm)');
      lines.push('Inner: ' + r.innerProfile + 'mm ' + r.innerShape + ' (' + r.innerThickness + 'mm)');
      lines.push('Pattern: ' + r.pattern + ' | Gaps: ' + r.gapType);
      lines.push('Finish: ' + r.coatingFinish + (this.selectedColor ? ' — ' + this.selectedColor.name : ''));
      if (r.rodSize > 0) lines.push('Rod: ' + r.rodSize + 'mm');
      lines.push('Area: ' + r.totalAreaSqFt.toFixed(2) + ' sqft');
      lines.push('Rate: ' + fmtINR(r.perSqftRate) + '/sqft');
      lines.push('Selling Price: ' + fmtINR(r.finalSellingPrice));
      lines.push('Installation: ' + fmtINR(r.installationCost));
      lines.push('Wastage: ' + fmtINR(r.wastageCost));
      lines.push('Grand Total: ' + fmtINR(r.grandTotal));
    }

    return lines.join('\n');
  };

  GrillsCalculator.prototype.submitInquiry = function() {
    var name = (this.container.querySelector('#grill-user-name') || {}).value || '';
    var city = (this.container.querySelector('#grill-user-city') || {}).value || '';
    var mobile = (this.container.querySelector('#grill-user-mobile') || {}).value || '';
    var email = (this.container.querySelector('#grill-user-email') || {}).value || '';

    if (!name.trim() || !city.trim() || !mobile.trim()) {
      alert('Please fill Name, City, and Mobile number.');
      return;
    }

    var submitBtn = this.container.querySelector('#grill-submit-inquiry');
    if (submitBtn) { submitBtn.textContent = 'Sending...'; submitBtn.disabled = true; }

    var body = this._buildEmailBody();
    body += '\n\n--- Customer Details ---\nName: ' + name + '\nCity: ' + city + '\nMobile: ' + mobile + '\nEmail: ' + (email || 'N/A');

    var subject = 'Grill Quote — ' + name + ' — ' + (this.lastResults ? this.lastResults.width + 'x' + this.lastResults.height + this.lastResults.unit : 'Custom');
    var userDetails = { name: name, city: city, mobile: mobile, email: email };
    var self = this;

    if (window.EmailSubmitter) {
      window.EmailSubmitter.submit({
        subject: subject,
        message: body,
        userDetails: userDetails,
        onSuccess: function() { self._showInquirySuccess(); },
        onError: function() { self._fallbackEmail(subject, body, email); }
      });
    } else {
      this._fallbackEmail(subject, body, email);
    }
  };

  GrillsCalculator.prototype._fallbackEmail = function(subject, body, userEmail) {
    var cc = userEmail ? '&cc=' + encodeURIComponent(userEmail) : '';
    window.open('mailto:info@woodenmax.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body) + cc);
    this._showInquirySuccess();
  };

  GrillsCalculator.prototype._showInquirySuccess = function() {
    var form = this.container.querySelector('#grill-user-form');
    var success = this.container.querySelector('#grill-inquiry-success');
    if (form) form.style.display = 'none';
    if (success) success.style.display = 'block';
    var self = this;
    setTimeout(function() {
      if (form) form.style.display = '';
      if (success) success.style.display = 'none';
      var btn = self.container.querySelector('#grill-submit-inquiry');
      if (btn) {
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Get Exact Price';
        btn.disabled = false;
      }
    }, 5000);
  };

  GrillsCalculator.prototype.sendWhatsApp = function() {
    var body = this._buildEmailBody();
    var name = (this.container.querySelector('#grill-user-name') || {}).value || '';
    var city = (this.container.querySelector('#grill-user-city') || {}).value || '';
    var mobile = (this.container.querySelector('#grill-user-mobile') || {}).value || '';
    if (name) body += '\n\nName: ' + name;
    if (city) body += '\nCity: ' + city;
    if (mobile) body += '\nMobile: ' + mobile;
    var waNumber = window.WHATSAPP_BUSINESS_NUMBER || '917895328080';
    var waUrl = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(body);
    window.open(waUrl, '_blank');
  };

  // ──────────────────────────────────────────────
  // INIT — updated to include cart + inquiry
  // ──────────────────────────────────────────────
  var _origInit = GrillsCalculator.prototype.init;
  GrillsCalculator.prototype.init = function() {
    _origInit.call(this);
    this.injectQuotationCart();
    this.injectInquiryForm();
  };

  // ──────────────────────────────────────────────
  // AUTO-INIT
  // ──────────────────────────────────────────────
  function initGrillsCalculators() {
    document.querySelectorAll('[data-grill-calculator]').forEach(function(el) {
      new GrillsCalculator(el.id);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGrillsCalculators);
  } else {
    initGrillsCalculators();
  }

  window.GrillsCalculator = GrillsCalculator;
})();
