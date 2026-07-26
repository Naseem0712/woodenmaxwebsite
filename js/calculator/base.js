/**
 * Base Price Calculator Class
 * Reusable calculator for all products
 * Marketplace-ready architecture
 */

/**
 * Extension Helper Utility
 * Reduces code duplication in calculator extensions
 */
function createExtensionInitCalculator(productIdOrIds, CalculatorClass, className) {
  const productIds = Array.isArray(productIdOrIds) ? productIdOrIds : [productIdOrIds];
  const originalInitCalculator = window.initCalculator;

  window.initCalculator = async function(calcProductId, containerId = null) {
    if (productIds.includes(calcProductId)) {
      try {
        if (typeof PriceCalculatorBase === 'undefined' || typeof productManager === 'undefined') {
          return null;
        }
        const productData = await productManager.getProduct(calcProductId);
        if (!productData) return null;
        const calcContainerId = containerId || `price-calculator-${calcProductId}`;
        const container = document.getElementById(calcContainerId);
        if (!container) return null;
        const calculator = new CalculatorClass(calcProductId, productData, calcContainerId);
        window[`calculator_${calcProductId}`] = calculator;
        return calculator;
      } catch (error) {
        return null;
      }
    } else if (originalInitCalculator) {
      return originalInitCalculator(calcProductId, containerId);
    }
    return null;
  };
}

// Export helper function
if (typeof window !== 'undefined') {
  window.createExtensionInitCalculator = createExtensionInitCalculator;
}

class PriceCalculatorBase {
  constructor(productId, productConfig, containerId) {
    this.productId = productId;
    this.config = productConfig;
    this.containerId = containerId || `price-calculator-${productId}`;
    
    // Rates from config
    this.BASE_RATE_PER_SQFT = productConfig.rates.baseRate || 750;
    this.BASE_HARDWARE_COST = productConfig.rates.hardwareCost || 2200;
    this.GLASS_RATES = productConfig.rates.glass || {};
    this.COATING_RATES = productConfig.rates.coating || {};
    this.LOCK_RATES = productConfig.rates.lock || {};
    // Mesh can be number (legacy) or object (new format with standard/openable)
    this.MESH_RATE = productConfig.rates.mesh || 0;
    this.MESH_RATES = typeof productConfig.rates.mesh === 'object' ? productConfig.rates.mesh : null;
    
    // Features
    this.hasMesh = productConfig.features?.includes('mesh') || false;
    this.hasMorticeLock = productConfig.features?.includes('morticeLock') || false;
    this.hasTopFixed = productConfig.features?.includes('topFixed') || false;
    
    // User details
    this.userDetailsSubmitted = false;
    this.userDetails = null;
    this.isSubmittingEmail = false;
    
    // Store calculated amounts for email
    this.lastCalculatedAmounts = {
      perWindowCost: 0,
      subtotal: 0
    };
    
    // Unit conversions
    this.unitConversions = {
      'mm': 0.010764,
      'cm': 1.0764,
      'inch': 144,
      'ft': 1,
      'm': 10.764
    };
    
    // Initialize
    this.initializeCalculator();
  }
  
  initializeCalculator() {
    const init = () => {
      setTimeout(() => {
        if (document.getElementById(this.containerId)) {
          this.setupEventListeners();
          this.calculate();
          
          // Track calculator page view
          if (typeof trackCalculatorPageView === 'function') {
            trackCalculatorPageView(this.productId, this.config.name || this.productId);
          }
        }
      }, 100);
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
  
  setupEventListeners() {
    // Size inputs
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    
    if (widthInput) {
      widthInput.addEventListener('input', () => {
        this.updateAreaDisplay();
        this.trackSizeChange();
        this.calculate();
      });
    }
    if (heightInput) {
      heightInput.addEventListener('input', () => {
        this.updateAreaDisplay();
        this.trackSizeChange();
        this.calculate();
      });
    }
    if (unitSelect) {
      unitSelect.addEventListener('change', () => {
        this.updateUnitHints();
        this.updateAreaDisplay();
        this.trackSizeChange();
        this.calculate();
      });
    }
    
    // Number of windows/doors
    const windowsInput = document.getElementById('calc-windows');
    if (windowsInput) {
      windowsInput.addEventListener('input', () => {
        this.trackSizeChange();
        this.calculate();
      });
    }
    
    // Options
    const glassSelect = document.getElementById('calc-glass');
    const coatingSelect = document.getElementById('calc-coating');
    const lockSelect = document.getElementById('calc-lock');
    
    if (glassSelect) {
      glassSelect.addEventListener('change', () => {
        this.trackMaterialSelection('glass', glassSelect.value);
        this.calculate();
      });
    }
    if (coatingSelect) {
      coatingSelect.addEventListener('change', () => {
        this.trackMaterialSelection('coating', coatingSelect.value);
        this.calculate();
      });
    }
    if (lockSelect) {
      lockSelect.addEventListener('change', () => {
        this.trackMaterialSelection('lock', lockSelect.value);
        this.calculate();
      });
    }
    
    // Mesh checkbox (if available)
    const meshCheckbox = document.getElementById('calc-mesh');
    if (meshCheckbox) {
      meshCheckbox.addEventListener('change', () => {
        this.trackMaterialSelection('mesh', meshCheckbox.checked ? 'yes' : 'no');
        this.calculate();
      });
    }
    
    // Top fixed checkbox (if available)
    const topFixedCheckbox = document.getElementById('calc-top-fixed');
    if (topFixedCheckbox) {
      topFixedCheckbox.addEventListener('change', () => {
        this.trackMaterialSelection('top_fixed', topFixedCheckbox.checked ? 'yes' : 'no');
        this.calculate();
      });
    }
    
    // Form submission
    this.setupFormSubmission();
  }
  
  // Track size changes
  trackSizeChange() {
    if (typeof trackCalculatorSize === 'undefined') return;
    
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    const windowsInput = document.getElementById('calc-windows');
    
    const width = widthInput?.value || 0;
    const height = heightInput?.value || 0;
    const unit = unitSelect?.value || 'ft';
    const quantity = windowsInput?.value || 1;
    
    trackCalculatorSize(width, height, unit, quantity);
  }
  
  // Track material selections
  trackMaterialSelection(materialType, materialValue) {
    if (typeof trackCalculatorMaterial === 'undefined') return;
    trackCalculatorMaterial(materialType, materialValue);
  }
  
  updateUnitHints() {
    const unitSelect = document.getElementById('calc-unit');
    const widthHint = document.getElementById('calc-width-hint');
    const heightHint = document.getElementById('calc-height-hint');
    
    if (!unitSelect) return;
    
    const showHints = unitSelect.value === 'ft-in';
    
    if (widthHint) widthHint.style.display = showHints ? 'block' : 'none';
    if (heightHint) heightHint.style.display = showHints ? 'block' : 'none';
  }
  
  convertLengthToFeet(value, unit) {
    if (!value || isNaN(value)) return 0;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return 0;
    
    if (!unit) return numValue;
    
    switch(unit) {
      case 'mm': return numValue / 304.8;
      case 'cm': return numValue / 30.48;
      case 'inch': return numValue / 12;
      case 'ft': return numValue;
      case 'm': return numValue * 3.28084;
      case 'ft-in': return numValue;
      default: return numValue;
    }
  }
  
  parseFeetInches(input) {
    if (!input) return 0;
    const str = input.toString().trim();
    
    const match = str.match(/(\d+)[\s']*(\d+)?/);
    if (match) {
      const feet = parseFloat(match[1]) || 0;
      const inches = parseFloat(match[2]) || 0;
      return feet + (inches / 12);
    }
    
    const decimal = parseFloat(str);
    return isNaN(decimal) ? 0 : decimal;
  }
  
  getArea() {
    // Check if multiple sizes container exists (new multi-size input feature)
    const multipleSizesContainer = document.getElementById('calc-sizes-container');
    if (multipleSizesContainer) {
      // Calculate total area from all size rows
      const rows = multipleSizesContainer.querySelectorAll('.calc-size-row');
      let totalArea = 0;
      const unitSelect = document.getElementById('calc-unit');
      const unit = unitSelect?.value || 'ft';
      
      rows.forEach(row => {
        const widthInput = row.querySelector('.calc-size-width');
        const heightInput = row.querySelector('.calc-size-height');
        const quantityInput = row.querySelector('.calc-size-qty');
        
        if (!widthInput || !heightInput) return;
        
        try {
          let width, height;
          
          if (unit === 'ft-in') {
            width = this.parseFeetInches(widthInput.value);
            height = this.parseFeetInches(heightInput.value);
          } else {
            width = parseFloat(widthInput.value) || 0;
            height = parseFloat(heightInput.value) || 0;
            width = this.convertLengthToFeet(width, unit);
            height = this.convertLengthToFeet(height, unit);
          }
          
          if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
            const quantity = parseInt(quantityInput?.value) || 1;
            const rowArea = width * height * quantity;
            totalArea += rowArea;
          }
        } catch (error) {
        }
      });
      
      return totalArea > 0 ? totalArea : 0;
    }
    
    // Standard single size input
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    
    if (!widthInput || !heightInput || !unitSelect) return 0;
    
    const unit = unitSelect.value || 'ft';
    let width, height;
    
    try {
      if (unit === 'ft-in') {
        width = this.parseFeetInches(widthInput.value);
        height = this.parseFeetInches(heightInput.value);
      } else {
        width = parseFloat(widthInput.value) || 0;
        height = parseFloat(heightInput.value) || 0;
        width = this.convertLengthToFeet(width, unit);
        height = this.convertLengthToFeet(height, unit);
      }
      
      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        return 0;
      }
      
      return width * height;
    } catch (error) {
      return 0;
    }
  }
  
  updateAreaDisplay() {
    const areaSqft = this.getArea();
    const areaEl = document.getElementById('calc-area-display');
    if (areaEl) {
      areaEl.textContent = areaSqft > 0 ? areaSqft.toFixed(2) + ' sq.ft' : '0.00 sq.ft';
    }
  }
  
  getNumberOfWindows() {
    // Check if multiple sizes container exists (new multi-size input feature)
    const multipleSizesContainer = document.getElementById('calc-sizes-container');
    if (multipleSizesContainer) {
      // Calculate total quantity from all size rows
      const rows = multipleSizesContainer.querySelectorAll('.calc-size-row');
      let totalQuantity = 0;
      
      rows.forEach(row => {
        const quantityInput = row.querySelector('.calc-size-qty');
        if (quantityInput) {
          const qty = parseInt(quantityInput.value) || 0;
          if (qty > 0) {
            totalQuantity += qty;
          }
        }
      });
      
      return Math.max(1, totalQuantity);
    }
    
    // Standard single input
    const input = document.getElementById('calc-windows');
    return Math.max(1, parseInt(input?.value) || 1);
  }
  
  getGlassOption() {
    const select = document.getElementById('calc-glass');
    return select?.value || '6mm';
  }
  
  getCoatingOption() {
    const select = document.getElementById('calc-coating');
    return select?.value || 'texture';
  }
  
  getLockOption() {
    const select = document.getElementById('calc-lock');
    return select?.value || 'single';
  }
  
  getMeshOption() {
    if (!this.hasMesh) return false;
    const checkbox = document.getElementById('calc-mesh');
    return checkbox?.checked || false;
  }
  
  getTopFixedOption() {
    if (!this.hasTopFixed) return false;
    const checkbox = document.getElementById('calc-top-fixed');
    return checkbox?.checked || false;
  }
  
  calculate() {
    if (!document.getElementById(this.containerId)) {
      return;
    }
    
    // Update area display first
    this.updateAreaDisplay();
    
    const areaSqft = this.getArea();
    const numberOfWindows = this.getNumberOfWindows();
    const glassOption = this.getGlassOption();
    const coatingOption = this.getCoatingOption();
    const lockOption = this.getLockOption();
    const hasMesh = this.getMeshOption();
    const hasTopFixed = this.getTopFixedOption();
    
    if (areaSqft <= 0) {
      this.displayResults(0, 0, 0, 0, 0, 0, 0);
      return;
    }
    
    // Base cost per window
    const baseCostPerWindow = (this.BASE_RATE_PER_SQFT * areaSqft) + this.BASE_HARDWARE_COST;
    
    // Add-ons (per sqft)
    let addOnsPerSqft = 0;
    
    // Glass add-ons (use global rates from config)
    if (glassOption !== '6mm') {
      let glassKey = glassOption;
      // Map glass options to config keys
      if (glassOption === '8mm') glassKey = '8mm';
      else if (glassOption === '10mm') glassKey = '10mm';
      else if (glassOption === '12mm') glassKey = '12mm';
      else if (glassOption === 'dgu' || glassOption === 'dgu-20mm') glassKey = 'dgu';
      else if (glassOption === 'laminated') glassKey = 'laminated';
      else if (glassOption === 'safety' || glassOption === 'safety-13.52mm') glassKey = 'safety';
      
      if (this.GLASS_RATES[glassKey]) {
        addOnsPerSqft += this.GLASS_RATES[glassKey];
      }
    }
    
    // Coating add-ons (use global rates from config)
    if (coatingOption === 'wooden' && this.COATING_RATES.wooden) {
      addOnsPerSqft += this.COATING_RATES.wooden;
    }
    
    // Mesh add-on (use global rates from config)
    // Handle both numeric (legacy) and object (new) formats
    // Standard mesh (120 per sqft) is only for sliding windows
    if (hasMesh) {
      if (typeof this.MESH_RATE === 'number' && this.MESH_RATE > 0) {
        addOnsPerSqft += this.MESH_RATE;
      } else if (this.MESH_RATES && typeof this.MESH_RATES === 'object') {
        // Use standard mesh for sliding windows (120 per sqft)
        if (this.MESH_RATES.standard) {
          addOnsPerSqft += this.MESH_RATES.standard;
        }
      } else if (this.config.rates.mesh && typeof this.config.rates.mesh === 'object') {
        // Fallback to config rates
        if (this.config.rates.mesh.standard) {
          addOnsPerSqft += this.config.rates.mesh.standard;
        }
      }
    }
    
    // Lock add-ons (per window) - use global rates from config
    let lockAdditionPerWindow = 0;
    if (lockOption === 'multi' && this.LOCK_RATES.multiPoint) {
      lockAdditionPerWindow = this.LOCK_RATES.multiPoint;
    } else if (lockOption === 'mortice' && this.LOCK_RATES.mortice) {
      lockAdditionPerWindow = this.LOCK_RATES.mortice;
    }
    
    // Calculate per window cost
    const addOnsCost = addOnsPerSqft * areaSqft;
    const perWindowCost = baseCostPerWindow + addOnsCost + lockAdditionPerWindow;
    
    // Total cost
    const subtotal = perWindowCost * numberOfWindows;
    
    // Calculate ranges
    const perWindowPlus20 = perWindowCost * 1.2;
    const perWindowMinus20 = perWindowCost * 0.8;
    const totalPlus20 = subtotal * 1.2;
    const totalMinus20 = subtotal * 0.8;
    
    // Display results
    this.displayResults(perWindowCost, perWindowPlus20, perWindowMinus20, subtotal, totalPlus20, totalMinus20, areaSqft);
    
    // Track calculation event
    if (typeof trackCalculatorCalculation === 'function' && areaSqft > 0) {
      const selections = {
        glass: glassOption,
        coating: coatingOption,
        lock: lockOption,
        mesh: hasMesh
      };
      trackCalculatorCalculation(subtotal, areaSqft, selections);
    }
  }
  
  displayResults(perWindowCost, perWindowPlus20, perWindowMinus20, subtotal, totalPlus20, totalMinus20, areaSqft = 0) {
    const formatCurrency = (amount) =>
      typeof window.formatPriceFromINR === 'function'
        ? window.formatPriceFromINR(amount)
        : '\u20B9' + Math.round(amount).toLocaleString('en-IN');
    const formatCurrencyRange = (lo, hi) =>
      typeof window.formatPriceRangeFromINR === 'function'
        ? window.formatPriceRangeFromINR(lo, hi)
        : formatCurrency(lo) + ' - ' + formatCurrency(hi);
    
    // Store actual amounts for email (the ones shown to user)
    this.lastCalculatedAmounts = {
      perWindowCost: perWindowCost,
      subtotal: subtotal
    };
    
    const showActualAmounts = this.userDetailsSubmitted || false;
    
    try {
      const areaEl = document.getElementById('calc-area-display');
      if (areaEl) {
        areaEl.textContent = areaSqft > 0 ? areaSqft.toFixed(2) + ' sq.ft' : '0.00 sq.ft';
      }
      
      if (showActualAmounts) {
        // Hide per window display if multi-size calculator is used (qty is in each row)
        const multipleSizesContainer = document.getElementById('calc-sizes-container');
        const perWindowEl = document.getElementById('calc-result-per-window');
        if (multipleSizesContainer && perWindowEl) {
          perWindowEl.parentElement.style.display = 'none';
        } else if (perWindowEl) {
          // Show per window cost only for single-size calculators
          const perWindowLabel = document.getElementById('calc-label-per-window');
          perWindowEl.textContent = formatCurrency(perWindowCost);
          perWindowEl.parentElement.style.display = 'flex';
          if (perWindowLabel) {
            perWindowLabel.textContent = 'Per Window Cost:';
          }
        }
        
        const totalEl = document.getElementById('calc-result-total');
        const totalLabel = document.getElementById('calc-label-total');
        if (totalEl) {
          totalEl.textContent = formatCurrency(subtotal);
          totalEl.parentElement.style.display = 'flex';
        }
        if (totalLabel) {
          totalLabel.textContent = 'Total Cost (All Windows):';
        }
        
        // Hide range displays
        ['calc-result-per-window-plus20', 'calc-result-per-window-minus20', 
         'calc-result-total-plus20', 'calc-result-total-minus20'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.parentElement.style.display = 'none';
        });
      } else {
        // Show range
        const perWindowEl = document.getElementById('calc-result-per-window');
        if (perWindowEl) {
          perWindowEl.textContent = formatCurrencyRange(perWindowMinus20, perWindowPlus20);
          perWindowEl.parentElement.style.display = 'flex';
        }
        
        const totalEl = document.getElementById('calc-result-total');
        if (totalEl) {
          totalEl.textContent = formatCurrencyRange(totalMinus20, totalPlus20);
          totalEl.parentElement.style.display = 'flex';
        }
        
        // Hide individual rows
        ['calc-result-per-window-plus20', 'calc-result-per-window-minus20', 
         'calc-result-total-plus20', 'calc-result-total-minus20'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.parentElement.style.display = 'none';
        });
      }
    } catch (error) {
    }
  }
  
  setupFormSubmission() {
    const form = document.getElementById('calc-user-form');
    const submitBtn = form?.querySelector('button[type="submit"]');
    
    if (!form || !submitBtn) return;
    
    // Remove any existing listeners to prevent duplicates
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    // Smart city/area/pincode field (lazy-loads location data on focus)
    this.attachLocationField(newForm);
    
    newForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent multiple submissions
      if (this.isSubmittingEmail) {
        return false;
      }
      
      const name = newForm.querySelector('#calc-user-name')?.value?.trim();
      const city = newForm.querySelector('#calc-user-city')?.value?.trim();
      const mobile = newForm.querySelector('#calc-user-mobile')?.value?.trim();
      const email = newForm.querySelector('#calc-user-email')?.value?.trim();
      const leadType = newForm.querySelector('#calc-user-lead-type')?.value?.trim() || '';
      
      if (!name || !city || !mobile) {
        alert('Please fill in Name, City, and Mobile Number');
        return false;
      }
      
      if (mobile.length < 10) {
        alert('Please enter a valid mobile number');
        return false;
      }
      
      const loc = this._locInfo || {};
      const userDetails = { name, city, mobile, email: email || '', leadType: leadType || '',
        pincode: loc.pincode || '', area: loc.area || '', district: loc.district || '', state: loc.state || '' };

      // generate_lead is fired only after email API succeeds — see submitEmailForm() onSuccess
      this.submitUserDetails(userDetails);
      
      return false;
    });
  }

  // Attach the unified city/area/pincode autocomplete to the calculator lead form.
  attachLocationField(scope, attempt) {
    try {
      const el = (scope || document).querySelector('#calc-user-city');
      if (!el) return;
      if (!window.WMPincode || !window.WMPincode.attachSingle) {
        if ((attempt || 0) < 20) { setTimeout(() => this.attachLocationField(scope, (attempt || 0) + 1), 250); }
        return;
      }
      if (el.dataset.wmAttached === '1') return;
      el.dataset.wmAttached = '1';
      if (/enter your city/i.test(el.getAttribute('placeholder') || '')) {
        el.setAttribute('placeholder', 'Type city, area or PIN — e.g. Tejalhera or 251310');
      }
      const self = this;
      self._locInfo = {};
      window.WMPincode.attachSingle({ input: el, onChange: function (info) { self._locInfo = info; } });
    } catch (e) { /* non-fatal */ }
  }

  // Build resolved-location rows for the enquiry email (only when populated).
  locationRows(ud) {
    const rows = [];
    if (ud && ud.pincode) rows.push({ label: 'Pincode', value: ud.pincode });
    if (ud && ud.area) rows.push({ label: 'Area', value: ud.area });
    const ds = [ud && ud.district, ud && ud.state].filter(Boolean).join(', ');
    if (ds) rows.push({ label: 'District / State', value: ds });
    return rows;
  }
  locationLines(ud) {
    return this.locationRows(ud).map((r) => `${r.label}: ${r.value}`);
  }
  
  submitUserDetails(userDetails) {
    // Prevent duplicate submissions
    if (this.isSubmittingEmail) {
      return;
    }
    
    // Set flag immediately to prevent multiple calls
    this.isSubmittingEmail = true;
    this.userDetailsSubmitted = true;
    this.userDetails = userDetails;
    
    // Recalculate to get latest prices
    this.calculate();
    
    // Send email
    try {
      this.sendEmail(userDetails);
    } catch (error) {
      this.isSubmittingEmail = false;
    }
    
    // Reset flag after 10 seconds (longer timeout for reliability)
    setTimeout(() => {
      this.isSubmittingEmail = false;
    }, 10000);
  }
  
  getCalculatorSelections() {
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    const numberOfWindows = document.getElementById('calc-windows');
    const glassSelect = document.getElementById('calc-glass');
    const coatingSelect = document.getElementById('calc-coating');
    const lockSelect = document.getElementById('calc-lock');
    const meshCheckbox = document.getElementById('calc-mesh');
    const topFixedCheckbox = document.getElementById('calc-top-fixed');
    
    return {
      width: widthInput?.value || '',
      height: heightInput?.value || '',
      unit: unitSelect?.options[unitSelect?.selectedIndex]?.text || '',
      numberOfWindows: numberOfWindows?.value || '1',
      glass: glassSelect?.options[glassSelect?.selectedIndex]?.text || '',
      coating: coatingSelect?.options[coatingSelect?.selectedIndex]?.text || '',
      lock: lockSelect?.options[lockSelect?.selectedIndex]?.text || '',
      mesh: meshCheckbox?.checked ? 'Yes' : 'No',
      topFixed: topFixedCheckbox?.checked ? 'Yes' : 'No',
      area: document.getElementById('calc-area-display')?.textContent || '0.00 sq.ft'
    };
  }
  
  sendEmail(userDetails) {
    // Check if multiple sizes calculator is active
    const multipleSizesContainer = document.getElementById('calc-sizes-container');
    const hasMultipleSizes = multipleSizesContainer && multipleSizesContainer.querySelectorAll('.calc-size-row').length > 0;
    
    if (hasMultipleSizes) {
      // Handle multiple sizes
      this.sendEmailMultipleSizes(userDetails);
      return;
    }
    
    // Single size handling (original code)
    const selections = this.getCalculatorSelections();
    
    // Always get area and numberOfWindows (needed for email body and logging)
    let areaSqft = this.getArea();
    if (isNaN(areaSqft) || areaSqft <= 0) {
      areaSqft = 0;
    }
    
    let numberOfWindows = this.getNumberOfWindows();
    if (isNaN(numberOfWindows) || numberOfWindows <= 0) {
      numberOfWindows = 1;
    }
    
    // Use stored amounts from calculate() method (the ones shown to user)
    // This ensures email has the exact same amounts that user sees
    let finalPerWindow = 0;
    let finalTotal = 0;
    
    // Variables for logging (defined in broader scope)
    let baseRate = 0;
    let baseHardware = 0;
    let baseCostPerWindow = 0;
    let addOnsPerSqft = 0;
    let addOnsCost = 0;
    let lockAdditionPerWindow = 0;
    
    if (this.lastCalculatedAmounts && this.lastCalculatedAmounts.perWindowCost > 0) {
      // Use stored amounts (actual amounts shown to user)
      finalPerWindow = Math.round(this.lastCalculatedAmounts.perWindowCost);
      finalTotal = Math.round(this.lastCalculatedAmounts.subtotal);
    } else {
      // Fallback: Calculate if stored amounts not available
      // Validate rates
      baseRate = isNaN(this.BASE_RATE_PER_SQFT) ? 0 : Number(this.BASE_RATE_PER_SQFT);
      baseHardware = isNaN(this.BASE_HARDWARE_COST) ? 0 : Number(this.BASE_HARDWARE_COST);
      
      // Calculate amounts with validation
      baseCostPerWindow = (baseRate * areaSqft) + baseHardware;
      const glassOption = this.getGlassOption();
      const coatingOption = this.getCoatingOption();
      const lockOption = this.getLockOption();
      const hasMesh = this.getMeshOption();
      
      // Glass
      if (glassOption !== '6mm' && this.GLASS_RATES) {
        let glassKey = glassOption;
        // Map glass options to config keys
        if (glassOption === '8mm') glassKey = '8mm';
        else if (glassOption === '10mm') glassKey = '10mm';
        else if (glassOption === '12mm') glassKey = '12mm';
        else if (glassOption === 'dgu' || glassOption === 'dgu-20mm') glassKey = 'dgu';
        else if (glassOption === 'laminated') glassKey = 'laminated';
        else if (glassOption === 'safety' || glassOption === 'safety-13.52mm') glassKey = 'safety';
        
        if (this.GLASS_RATES[glassKey] !== undefined) {
          const glassRate = isNaN(this.GLASS_RATES[glassKey]) ? 0 : Number(this.GLASS_RATES[glassKey]);
          addOnsPerSqft += glassRate;
        }
      }
      
      // Coating
      if (coatingOption === 'wooden' && this.COATING_RATES && this.COATING_RATES.wooden) {
        const coatingRate = isNaN(this.COATING_RATES.wooden) ? 0 : Number(this.COATING_RATES.wooden);
        addOnsPerSqft += coatingRate;
      }
      
      // Mesh
      if (hasMesh && this.MESH_RATE) {
        const meshRate = isNaN(this.MESH_RATE) ? 0 : Number(this.MESH_RATE);
        addOnsPerSqft += meshRate;
      }
      
      // Lock
      if (lockOption === 'multi' && this.LOCK_RATES && this.LOCK_RATES.multiPoint) {
        lockAdditionPerWindow = isNaN(this.LOCK_RATES.multiPoint) ? 0 : Number(this.LOCK_RATES.multiPoint);
      } else if (lockOption === 'mortice' && this.LOCK_RATES && this.LOCK_RATES.mortice) {
        lockAdditionPerWindow = isNaN(this.LOCK_RATES.mortice) ? 0 : Number(this.LOCK_RATES.mortice);
      }
      
      addOnsCost = addOnsPerSqft * areaSqft;
      const perWindowCost = baseCostPerWindow + addOnsCost + lockAdditionPerWindow;
      const totalCost = perWindowCost * numberOfWindows;
      
      // Validate final amounts
      finalPerWindow = isNaN(perWindowCost) || perWindowCost <= 0 ? 0 : Math.round(perWindowCost);
      finalTotal = isNaN(totalCost) || totalCost <= 0 ? 0 : Math.round(totalCost);
    }
    
    
    // Email body — plain text (the inbox shows message as text, not HTML)
    const matRows = [
      { label: 'Glass type', value: selections.glass },
      { label: 'Coating', value: selections.coating },
      { label: 'Lock', value: selections.lock },
    ];
    if (this.hasMesh) matRows.push({ label: 'Mesh', value: selections.mesh });
    if (this.hasTopFixed) matRows.push({ label: 'Top fixed', value: selections.topFixed });

    let emailBody;
    const ES = window.EmailSubmitter;
    if (ES && typeof ES.buildStructuredPlainText === 'function') {
      emailBody = ES.buildStructuredPlainText(
        `New quote request — ${this.config.name || this.productId}`,
        [
          {
            title: 'Customer contact',
            rows: [
              { label: 'Name', value: userDetails.name || 'Not provided' },
              { label: 'City', value: userDetails.city || 'Not provided' },
              ...this.locationRows(userDetails),
              { label: 'Mobile', value: userDetails.mobile || 'Not provided' },
              { label: 'Email', value: userDetails.email || 'Not provided' },
            ],
          },
          {
            title: 'Product',
            rows: [{ label: 'Product', value: this.config.name || this.productId }],
          },
          {
            title: 'Size & quantity',
            rows: [
              {
                label: 'Dimensions',
                value: `${selections.width} × ${selections.height} ${selections.unit}`,
              },
              { label: 'Area', value: String(selections.area) },
              { label: 'Number of windows', value: String(selections.numberOfWindows) },
            ],
          },
          {
            title: 'Materials & options',
            rows: matRows,
          },
          {
            title: 'Calculated price',
            rows: [
              {
                label: 'Per window',
                value:
                  typeof window.formatPriceFromINR === 'function'
                    ? window.formatPriceFromINR(Math.round(finalPerWindow))
                    : '\u20B9' + finalPerWindow.toLocaleString('en-IN'),
              },
              {
                label: 'Total',
                value:
                  (typeof window.formatPriceFromINR === 'function'
                    ? window.formatPriceFromINR(Math.round(finalTotal))
                    : '\u20B9' + finalTotal.toLocaleString('en-IN')) +
                  ` (${selections.numberOfWindows} window(s))`,
              },
            ],
          },
        ]
      );
    } else {
      emailBody = [
        `NEW QUOTE REQUEST - ${this.config.name || this.productId}`,
        `Name: ${userDetails.name || 'Not provided'}`,
        `City: ${userDetails.city || 'Not provided'}`,
        ...this.locationLines(userDetails),
        `Mobile: ${userDetails.mobile || 'Not provided'}`,
        `Email: ${userDetails.email || 'Not provided'}`,
        `Dimensions: ${selections.width} × ${selections.height} ${selections.unit}`,
        `Total: ${
          typeof window.formatPriceFromINR === 'function'
            ? window.formatPriceFromINR(Math.round(finalPerWindow))
            : '\u20B9' + finalPerWindow.toLocaleString('en-IN')
        } per window; ${
          typeof window.formatPriceFromINR === 'function'
            ? window.formatPriceFromINR(Math.round(finalTotal))
            : '\u20B9' + finalTotal.toLocaleString('en-IN')
        } total`,
      ].join('\n');
    }

    this.submitEmailForm(emailBody, userDetails, selections, {
      perWindow: finalPerWindow,
      total: finalTotal
    });
  }
  
  sendEmailMultipleSizes(userDetails) {
    const multipleSizesContainer = document.getElementById('calc-sizes-container');
    if (!multipleSizesContainer) {
      return;
    }
    
    const rows = multipleSizesContainer.querySelectorAll('.calc-size-row');
    if (rows.length === 0) {
      return;
    }
    
    // Get row selections from multiple-sizes-calculator.js
    // Access the rowSelections Map if available
    const rowSelectionsMap = window.rowSelections || new Map();
    
    // Collect all row details
    const rowDetails = [];
    let totalArea = 0;
    let totalQty = 0;
    let totalCost = 0;
    
    rows.forEach((row, index) => {
      const rowId = row.id;
      const widthInput = row.querySelector('.calc-size-width');
      const heightInput = row.querySelector('.calc-size-height');
      const qtyInput = row.querySelector('.calc-size-qty');
      const amountDisplay = row.querySelector('.row-amount-text');
      
      if (!widthInput || !heightInput || !qtyInput) return;
      
      const width = parseFloat(widthInput.value) || 0;
      const height = parseFloat(heightInput.value) || 0;
      const qty = parseInt(qtyInput.value) || 1;
      
      if (width <= 0 || height <= 0) return;
      
      // Get selections for this row
      const rowSelections = rowSelectionsMap.get(rowId) || {
        glass: document.getElementById('calc-glass')?.value || '6mm',
        coating: document.getElementById('calc-coating')?.value || 'texture',
        lock: document.getElementById('calc-lock')?.value || 'single',
        mesh: document.getElementById('calc-mesh')?.checked || false,
        unit: document.getElementById('calc-unit')?.value || 'ft'
      };
      
      // Calculate area (using same logic as multiple-sizes-calculator.js)
      const unit = rowSelections.unit || 'ft';
      const linearToFeet = {
        'mm': 0.00328084,     // 1 mm = 0.00328084 ft
        'cm': 0.0328084,      // 1 cm = 0.0328084 ft
        'inch': 0.0833333,    // 1 inch = 1/12 ft = 0.0833333 ft
        'ft': 1,              // 1 ft = 1 ft
        'm': 3.28084,         // 1 m = 3.28084 ft
        'ft-in': 1            // Will handle separately
      };
      
      let areaSqft = 0;
      if (unit === 'ft-in') {
        // Parse feet and inches format (e.g., "6'8" or "6 8")
        // For now, treat as feet
        areaSqft = width * height;
      } else {
        // Convert linear dimensions to feet, then multiply for area
        const factor = linearToFeet[unit] || 1;
        const widthInFt = width * factor;
        const heightInFt = height * factor;
        areaSqft = widthInFt * heightInFt;
      }
      const totalAreaForRow = areaSqft * qty;
      
      // Get displayed price range
      const priceText = amountDisplay?.textContent || '₹0 - ₹0';
      
      // Get option names
      const glassSelect = document.getElementById('calc-glass');
      const coatingSelect = document.getElementById('calc-coating');
      const lockSelect = document.getElementById('calc-lock');
      const glassText = glassSelect?.options[glassSelect.selectedIndex]?.text || rowSelections.glass;
      const coatingText = coatingSelect?.options[coatingSelect.selectedIndex]?.text || rowSelections.coating;
      const lockText = lockSelect?.options[lockSelect.selectedIndex]?.text || rowSelections.lock;
      
      rowDetails.push({
        rowNumber: index + 1,
        width: width,
        height: height,
        unit: unit,
        qty: qty,
        area: areaSqft.toFixed(2),
        totalArea: totalAreaForRow.toFixed(2),
        glass: glassText,
        coating: coatingText,
        lock: lockText,
        mesh: rowSelections.mesh ? 'Yes' : 'No',
        price: priceText
      });
      
      totalArea += totalAreaForRow;
      totalQty += qty;
    });
    
    // Get total price from calculator display
    const totalDisplay = document.getElementById('calc-result-total');
    const totalPriceText = totalDisplay?.textContent || '₹0 - ₹0';
    
    // Get actual calculated amounts from lastCalculatedAmounts if available
    let totalCalculatedAmount = 0;
    if (this.lastCalculatedAmounts && this.lastCalculatedAmounts.subtotal > 0) {
      totalCalculatedAmount = Math.round(this.lastCalculatedAmounts.subtotal);
    } else {
      try {
        const match = totalPriceText.match(/[\d,]+/g);
        if (match && match.length) {
          const last = match[match.length - 1];
          totalCalculatedAmount = parseInt(last.replace(/,/g, ''), 10) || 0;
        }
      } catch (e) {}
    }

    // Calculate per-row amounts from displayed prices
    rows.forEach((row, index) => {
      const amountDisplay = row.querySelector('.row-amount-text');
      if (amountDisplay && rowDetails[index]) {
        const inrAttr = amountDisplay.getAttribute('data-wm-inr-total');
        if (inrAttr != null && inrAttr !== '') {
          rowDetails[index].calculatedAmount = parseInt(inrAttr, 10) || 0;
        } else {
          const priceText = amountDisplay.textContent || '₹0';
          const priceMatch = priceText.match(/[\d,]+/);
          if (priceMatch) {
            const priceValue = parseInt(priceMatch[0].replace(/,/g, ''), 10) || 0;
            rowDetails[index].calculatedAmount = priceValue;
          } else {
            rowDetails[index].calculatedAmount = 0;
          }
        }
      }
    });

    if (!totalCalculatedAmount && rowDetails.length) {
      var sumInr = 0;
      rowDetails.forEach(function (rd) {
        if (rd.calculatedAmount) sumInr += rd.calculatedAmount;
      });
      if (sumInr > 0) totalCalculatedAmount = sumInr;
    }
    
    const ES = window.EmailSubmitter;
    let emailBody;
    if (ES && typeof ES.buildStructuredPlainText === 'function' && typeof ES.buildSizeRowsPlain === 'function') {
      const lineItemsPlain = ES.buildSizeRowsPlain(rowDetails, this.hasMesh);
      emailBody = ES.buildStructuredPlainText(
        `New quote request — ${this.config.name || this.productId} (multiple sizes)`,
        [
          {
            title: 'Customer contact',
            rows: [
              { label: 'Name', value: userDetails.name || 'Not provided' },
              { label: 'City', value: userDetails.city || 'Not provided' },
              ...this.locationRows(userDetails),
              { label: 'Mobile', value: userDetails.mobile || 'Not provided' },
              { label: 'Email', value: userDetails.email || 'Not provided' },
            ],
          },
          {
            title: 'Product',
            rows: [{ label: 'Product', value: this.config.name || this.productId }],
          },
          {
            title: 'Sizes & materials',
            rows: [{ label: 'Line items', value: lineItemsPlain }],
          },
          {
            title: 'Summary',
            rows: [
              { label: 'Total units', value: String(totalQty) },
              { label: 'Total area', value: `${totalArea.toFixed(2)} sq.ft` },
              {
                label: 'Total price',
                value:
                  totalCalculatedAmount > 0
                    ? '₹' + totalCalculatedAmount.toLocaleString('en-IN')
                    : totalPriceText,
              },
            ],
          },
        ]
      );
    } else {
      emailBody = [
        `NEW QUOTE REQUEST (multiple sizes) - ${this.config.name || this.productId}`,
        `Name: ${userDetails.name || ''}`,
        `City: ${userDetails.city || 'Not provided'}`,
        ...this.locationLines(userDetails),
        `Total: ${totalCalculatedAmount > 0 ? '₹' + totalCalculatedAmount.toLocaleString('en-IN') : totalPriceText}`,
      ].join('\n');
    }

    this.submitEmailForm(emailBody, userDetails, { multipleSizes: true, rows: rowDetails }, {
      perWindow: 0,
      total: 0
    });
  }
  
  submitEmailForm(emailBody, userDetails, selections, amounts) {
    // Validate amounts before creating form data
    const validPerWindow = isNaN(amounts.perWindow) || amounts.perWindow <= 0 ? 0 : Math.round(amounts.perWindow);
    const validTotal = isNaN(amounts.total) || amounts.total <= 0 ? 0 : Math.round(amounts.total);
    
    // Use shared email submitter utility
    if (window.EmailSubmitter) {
      window.EmailSubmitter.submit({
        subject: `New Quote Request - ${this.config.name || this.productId}`,
        message: emailBody,
        userDetails: userDetails,
        onSuccess: () => {
          if (typeof trackCalculatorFormSubmit === 'function') {
            const hasPrice = this.lastCalculatedAmounts && this.lastCalculatedAmounts.subtotal > 0;
            trackCalculatorFormSubmit('quote_request', hasPrice);
          }
          this.showSuccessMessage();
        },
        onError: (error) => {
          this.showEmailSubmitFailed(error);
        }
      });
    } else {
      this.submitEmailDirect(emailBody, userDetails);
    }
  }
  
  /**
   * Fallback used when EmailSubmitter has not loaded. It posts to the same
   * Worker, so mail always leaves from our verified domain — the old direct
   * Web3Forms call put an API key in page source and sent `from` as the
   * customer's own address, which fails SPF/DKIM/DMARC.
   */
  submitEmailDirect(emailBody, userDetails) {
    const workerEndpoint = window.EMAIL_WORKER_URL || 'https://jolly-field-be49.finilexnaseem.workers.dev';

    const formData = new FormData();
    formData.append('_subject', `New Quote Request - ${this.config.name || this.productId}`);
    formData.append('message', emailBody);
    formData.append('Name', userDetails.name || '');
    formData.append('Email', userDetails.email || '');
    formData.append('City', userDetails.city || '');
    formData.append('Mobile', userDetails.mobile || '');

    fetch(workerEndpoint, { method: 'POST', body: formData })
      .then(response => response.json().then(data => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data.success) throw new Error(data.error || data.message || 'Failed to send email');
        if (typeof trackCalculatorFormSubmit === 'function') {
          const hasPrice = this.lastCalculatedAmounts && this.lastCalculatedAmounts.subtotal > 0;
          trackCalculatorFormSubmit('quote_request', hasPrice);
        }
        this.showSuccessMessage();
      })
      .catch(error => {
        this.showEmailSubmitFailed(error);
      });
  }
  
  showEmailSubmitFailed(error) {
    console.error('Quote email failed:', error);
    const form = document.getElementById('calc-user-form');
    let errEl = document.getElementById('calc-email-error');
    if (!errEl && form) {
      errEl = document.createElement('p');
      errEl.id = 'calc-email-error';
      errEl.setAttribute('role', 'alert');
      errEl.style.cssText = 'color:#f87171;margin:0 0 1rem 0;font-size:0.95rem;';
      form.insertBefore(errEl, form.firstChild);
    }
    if (errEl) {
      errEl.textContent = 'Email could not be sent right now. Please try again or call +91 789-5328080.';
      errEl.style.display = 'block';
    } else {
      alert('Could not send your quote by email. Please try again or call +91 789-5328080.');
    }
  }

  showSuccessMessage() {
    const errEl = document.getElementById('calc-email-error');
    if (errEl) errEl.style.display = 'none';
    const form = document.getElementById('calc-user-form');
    const successMsg = document.getElementById('calc-success-message');
    
    if (form) form.style.display = 'none';
    if (successMsg) {
      successMsg.style.display = 'block';
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.PriceCalculatorBase = PriceCalculatorBase;
}

