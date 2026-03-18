/**
 * HPL Exterior Cladding Calculator Extension
 * Shows price range (±20%) before form submission
 * Reveals exact price after form submission
 */

if (typeof PriceCalculatorBase !== 'undefined') {
class HPLCladdingCalculator extends PriceCalculatorBase {
  constructor(productId, productConfig, containerId) {
    super(productId, productConfig, containerId);
    
    // Prevent base class from setting up listeners (we'll do it ourselves)
    this._baseSetupCalled = false;
    
    // Grade configurations (internal pricing)
    this.grades = {
      'fundermax': {
        name: 'Premium Imported (European)',
        displayName: 'Premium Imported',
        hint: 'Austrian/European origin',
        sheetWidth: 1300, // mm
        sheetHeight: 3050, // mm
        ratePerSqft: 465,
        sheetAreaSqft: this.mmToSqft(1300, 3050) // ~42.68 sqft
      },
      'greenlam': {
        name: 'Standard Indian (Leading Brand)',
        displayName: 'Standard Indian',
        hint: 'Leading domestic manufacturer',
        sheetWidth: 1300,
        sheetHeight: 3050,
        ratePerSqft: 350,
        sheetAreaSqft: this.mmToSqft(1300, 3050)
      },
      'newmika': {
        name: 'Economy Range (Value Brand)',
        displayName: 'Economy Range',
        hint: 'Value brand from major group',
        sheetWidth: 1220,
        sheetHeight: 2440,
        ratePerSqft: 295,
        sheetAreaSqft: this.mmToSqft(1220, 2440) // ~32.04 sqft
      }
    };
    
    // Installation rates (internal use)
    this.installationRates = {
      'ceiling': 165, // per sqft - 16-18" frame gaps
      'facade': 145   // per sqft - 22-24" frame gaps
    };
    
    // Wastage percentage
    this.wastagePercent = 5;
    
    // Price range variance (±20%)
    this.priceVariance = 0.20;
    
    // Store calculated values for email and reveal
    this.lastCalcDetails = {};
    
    // Prevent base class from setting up listeners (we'll do it ourselves)
    this._baseSetupCalled = false;
    
    // Initialize will be called by base class constructor via initializeCalculator()
    // But we override initializeCalculator() below
  }
  
  // Override base class initializeCalculator to use our own
  initializeCalculator() {
    this.initHPLCalculator();
  }
  
  // Convert mm dimensions to sqft
  mmToSqft(widthMM, heightMM) {
    const widthFt = widthMM / 304.8;
    const heightFt = heightMM / 304.8;
    return widthFt * heightFt;
  }
  
  initHPLCalculator() {
    const init = () => {
      setTimeout(() => {
        const container = document.getElementById(this.containerId);
        if (!container) {
          setTimeout(init, 200);
          return;
        }
        
        this.setupHPLEventListeners();
          this.updateGradeInfo();
        
        // Initialize display with empty values first
        this.lastCalcDetails = {
          baseArea: 0,
          totalAreaWithWastage: 0,
          sheetsNeeded: 0,
          totalCost: 0,
          priceLow: 0,
          priceHigh: 0
        };
        this.displayHPLResults();
        
        // Verify inputs exist and trigger initial calculation
        const widthInput = document.getElementById('calc-width');
        const heightInput = document.getElementById('calc-height');
        if (widthInput && heightInput) {
          // Manually trigger once to verify everything works
          setTimeout(() => {
          this.calculate();
          }, 150);
        }
      }, 100);
    };
    
    // Don't wait for DOMContentLoaded if already loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
  
  // Override base class setupEventListeners to prevent conflicts
  setupEventListeners() {
    // Do nothing - we use setupHPLEventListeners instead
    this._baseSetupCalled = true;
  }
  
  // Force recalculation - can be called manually for testing
  forceCalculate() {
    this.calculate();
  }
  
  setupHPLEventListeners() {
    // Grade selection
    const gradeSelect = document.getElementById('calc-brand');
    if (gradeSelect) {
      gradeSelect.addEventListener('change', () => {
        this.updateGradeInfo();
        this.calculate();
      });
    }
    
    // Installation type
    const installSelect = document.getElementById('calc-installation-type');
    if (installSelect) {
      installSelect.addEventListener('change', () => this.calculate());
    }
    
    // Size inputs - use direct event binding
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    const quantityInput = document.getElementById('calc-quantity');
    
    const handleCalculate = () => {
      this.calculate();
    };
    
    // Store handler reference for cleanup
    this._calculateHandler = handleCalculate;
    
    if (widthInput) {
      // Remove old listener if exists
      if (this._oldCalculateHandler) {
        widthInput.removeEventListener('input', this._oldCalculateHandler);
      }
      widthInput.addEventListener('input', handleCalculate, { passive: true });
    }
    
    if (heightInput) {
      if (this._oldCalculateHandler) {
        heightInput.removeEventListener('input', this._oldCalculateHandler);
      }
      heightInput.addEventListener('input', handleCalculate, { passive: true });
    }
    
    if (unitSelect) {
      if (this._oldCalculateHandler) {
        unitSelect.removeEventListener('change', this._oldCalculateHandler);
      }
      unitSelect.addEventListener('change', handleCalculate, { passive: true });
    }
    
    if (quantityInput) {
      if (this._oldCalculateHandler) {
        quantityInput.removeEventListener('input', this._oldCalculateHandler);
      }
      quantityInput.addEventListener('input', handleCalculate, { passive: true });
    }
    
    this._oldCalculateHandler = handleCalculate;
    
    // Form submission with price reveal
    this.setupFormSubmissionWithReveal();
  }
  
  setupFormSubmissionWithReveal() {
    const form = document.getElementById('calc-user-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector('.calc-submit-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;
      
      const userDetails = {
        name: document.getElementById('calc-user-name')?.value || '',
        city: document.getElementById('calc-user-city')?.value || '',
        mobile: document.getElementById('calc-user-mobile')?.value || '',
        email: document.getElementById('calc-user-email')?.value || ''
      };
      
      // Send email
      await this.sendEmail(userDetails);
      
      // Hide form and show success with exact price
      form.style.display = 'none';
      
      const successMessage = document.getElementById('calc-success-message');
      const exactPriceEl = document.getElementById('calc-exact-price');
      
      if (exactPriceEl && this.lastCalcDetails.totalCost > 0) {
        exactPriceEl.textContent = this.formatCurrency(this.lastCalcDetails.totalCost);
      }
      
      if (successMessage) {
        successMessage.style.display = 'block';
      }
      
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
  }
  
  formatCurrency(amount) {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  }
  
  updateGradeInfo() {
    const gradeSelect = document.getElementById('calc-brand');
    const gradeInfo = document.getElementById('brand-info');
    const sheetSizeEl = document.getElementById('calc-sheet-size');
    
    if (!gradeSelect) return;
    
    const grade = this.grades[gradeSelect.value];
    
    if (gradeInfo) {
      gradeInfo.textContent = `Sheet Size: ${grade.sheetWidth}×${grade.sheetHeight}mm | 6mm thick | 30+ colors`;
    }
    
    if (sheetSizeEl) {
      sheetSizeEl.textContent = `${grade.sheetWidth}×${grade.sheetHeight}mm`;
    }
  }
  
  getSelectedGrade() {
    const gradeSelect = document.getElementById('calc-brand');
    return gradeSelect ? gradeSelect.value : 'fundermax';
  }
  
  getInstallationType() {
    const installSelect = document.getElementById('calc-installation-type');
    return installSelect ? installSelect.value : 'ceiling';
  }
  
  getQuantity() {
    const quantityInput = document.getElementById('calc-quantity');
    return Math.max(1, parseInt(quantityInput?.value) || 1);
  }
  
  convertLengthToFeet(value, unit) {
    if (!value || isNaN(value)) return 0;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return 0;
    
    switch(unit) {
      case 'mm': return numValue / 304.8;
      case 'cm': return numValue / 30.48;
      case 'inch': return numValue / 12;
      case 'ft': return numValue;
      case 'm': return numValue * 3.28084;
      default: return numValue;
    }
  }
  
  getArea() {
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    
    if (!widthInput || !heightInput) return 0;
    
    const unit = unitSelect?.value || 'ft';
    const width = this.convertLengthToFeet(parseFloat(widthInput.value), unit);
    const height = this.convertLengthToFeet(parseFloat(heightInput.value), unit);
    
    if (width <= 0 || height <= 0) return 0;
    
    return width * height;
  }
  
  calculate() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      return;
    }
    
    const gradeKey = this.getSelectedGrade();
    const grade = this.grades[gradeKey];
    const installationType = this.getInstallationType();
    const quantity = this.getQuantity();
    
    // Get base area for one wall/area
    const baseAreaPerUnit = this.getArea();
    const totalBaseArea = baseAreaPerUnit * quantity;
    
    // Calculate wastage (5%)
    const wastageArea = totalBaseArea * (this.wastagePercent / 100);
    const totalAreaWithWastage = totalBaseArea + wastageArea;
    
    // Calculate sheets needed (round UP)
    let sheetsNeeded = 0;
    if (totalAreaWithWastage > 0 && grade.sheetAreaSqft > 0) {
      sheetsNeeded = Math.ceil(totalAreaWithWastage / grade.sheetAreaSqft);
    }
    
    // Calculate exact costs (internal)
    const actualSheetArea = sheetsNeeded * grade.sheetAreaSqft;
    const sheetCost = actualSheetArea * grade.ratePerSqft;
    const wastageCost = Math.max(0, (actualSheetArea - totalBaseArea) * grade.ratePerSqft);
    
    // Installation cost
    const installationRate = this.installationRates[installationType];
    const installationCost = totalAreaWithWastage * installationRate;
    
    // Total exact cost
    const totalCost = sheetCost + installationCost;
    
    // Calculate price range (±20%)
    const priceLow = Math.round(totalCost * (1 - this.priceVariance));
    const priceHigh = Math.round(totalCost * (1 + this.priceVariance));
    
    // Store for email and reveal
    this.lastCalcDetails = {
      grade: grade.name,
      displayName: grade.displayName,
      gradeKey: gradeKey,
      sheetSize: `${grade.sheetWidth}×${grade.sheetHeight}mm`,
      sheetAreaSqft: grade.sheetAreaSqft,
      ratePerSqft: grade.ratePerSqft,
      baseArea: totalBaseArea,
      wastagePercent: this.wastagePercent,
      wastageArea: wastageArea,
      totalAreaWithWastage: totalAreaWithWastage,
      sheetsNeeded: sheetsNeeded,
      actualSheetArea: actualSheetArea,
      sheetCost: sheetCost,
      wastageCost: wastageCost,
      installationType: installationType,
      installationRate: installationRate,
      installationCost: installationCost,
      totalCost: totalCost,
      priceLow: priceLow,
      priceHigh: priceHigh,
      quantity: quantity
    };
    
    this.lastCalculatedAmounts = {
      perWindowCost: totalCost / quantity,
      subtotal: totalCost
    };
    
    try {
      this.displayHPLResults();
    } catch (error) {
    }
  }
  
  displayHPLResults() {
    if (!this.lastCalcDetails || typeof this.lastCalcDetails !== 'object') {
      this.lastCalcDetails = {};
      // Still try to display with zeros
    }
    
    const details = this.lastCalcDetails || {};
    
    // Area displays
    const areaEl = document.getElementById('calc-area-display');
    const wastageAreaEl = document.getElementById('calc-wastage-area');
    const sheetsEl = document.getElementById('calc-sheets-needed');
    const priceRangeEl = document.getElementById('calc-price-range');
    
    // Safe value access with defaults
    const baseArea = (details && typeof details.baseArea === 'number') ? details.baseArea : 0;
    const totalAreaWithWastage = (details && typeof details.totalAreaWithWastage === 'number') ? details.totalAreaWithWastage : 0;
    const sheetsNeeded = (details && typeof details.sheetsNeeded === 'number') ? details.sheetsNeeded : 0;
    const totalCost = (details && typeof details.totalCost === 'number') ? details.totalCost : 0;
    const priceLow = (details && typeof details.priceLow === 'number') ? details.priceLow : 0;
    const priceHigh = (details && typeof details.priceHigh === 'number') ? details.priceHigh : 0;
    
    // Update area display - FORCE update
    if (areaEl) {
      const areaText = baseArea > 0 ? baseArea.toFixed(2) + ' sq.ft' : '0.00 sq.ft';
      areaEl.textContent = areaText;
      areaEl.innerText = areaText;
    }
    
    // Update wastage area display - FORCE update
    if (wastageAreaEl) {
      const wastageText = totalAreaWithWastage > 0 ? totalAreaWithWastage.toFixed(2) + ' sq.ft' : '0.00 sq.ft';
      wastageAreaEl.textContent = wastageText;
      wastageAreaEl.innerText = wastageText;
    }
    
    // Update sheets needed - FORCE update
    if (sheetsEl) {
      const sheetsText = String(sheetsNeeded);
      sheetsEl.textContent = sheetsText;
      sheetsEl.innerText = sheetsText;
    }
    
    // Price range display (before form submission) - FORCE update
    if (priceRangeEl) {
      if (totalCost > 0 && priceLow > 0 && priceHigh > 0) {
        const priceText = `${this.formatCurrency(priceLow)} - ${this.formatCurrency(priceHigh)}`;
        priceRangeEl.textContent = priceText;
        priceRangeEl.innerText = priceText;
      } else {
        priceRangeEl.textContent = '₹0 - ₹0';
        priceRangeEl.innerText = '₹0 - ₹0';
      }
    }
  }
  
  getCalculatorSelections() {
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    const gradeSelect = document.getElementById('calc-brand');
    const installSelect = document.getElementById('calc-installation-type');
    const quantityInput = document.getElementById('calc-quantity');
    
    return {
      grade: gradeSelect?.options[gradeSelect?.selectedIndex]?.text || '',
      installationType: installSelect?.options[installSelect?.selectedIndex]?.text || '',
      width: widthInput?.value || '',
      height: heightInput?.value || '',
      unit: unitSelect?.options[unitSelect?.selectedIndex]?.text || '',
      quantity: quantityInput?.value || '1'
    };
  }
  
  sendEmail(userDetails) {
    const selections = this.getCalculatorSelections();
    const details = this.lastCalcDetails;
    
    // Email to business owner includes full pricing details
    const emailBody = `
NEW QUOTE REQUEST - HPL Exterior Cladding
==========================================

CUSTOMER DETAILS:
- Name: ${userDetails.name}
- City: ${userDetails.city}
- Mobile: ${userDetails.mobile}
${userDetails.email ? `- Email: ${userDetails.email}` : ''}

PRODUCT: HPL Exterior Cladding

SELECTED OPTIONS:
- Grade: ${details.displayName}
- Sheet Size: ${details.sheetSize}
- Installation Type: ${selections.installationType}
- Dimensions: ${selections.width} × ${selections.height} ${selections.unit}
- Number of Areas: ${details.quantity}

AREA CALCULATIONS:
- Base Area: ${details.baseArea?.toFixed(2)} sq.ft
- Wastage (5%): ${details.wastageArea?.toFixed(2)} sq.ft
- Total Area: ${details.totalAreaWithWastage?.toFixed(2)} sq.ft
- Sheets Required: ${details.sheetsNeeded} sheets

COST BREAKDOWN (INTERNAL):
- Sheet Rate: ${this.formatCurrency(details.ratePerSqft)}/sqft
- Sheet Cost: ${this.formatCurrency(details.sheetCost)}
- Installation Rate: ${this.formatCurrency(details.installationRate)}/sqft
- Installation Cost: ${this.formatCurrency(details.installationCost)}

PRICING:
- Price Range Shown: ${this.formatCurrency(details.priceLow)} - ${this.formatCurrency(details.priceHigh)}
- EXACT PRICE: ${this.formatCurrency(details.totalCost)}
- Price Per Sqft: ${this.formatCurrency(details.totalCost / details.baseArea || 0)}/sqft

PACKAGE INCLUDES:
- HPL Sheets (${details.displayName})
- 50×25mm Aluminium Framework with Powder Coating
- Rivets + 75×10mm SS Screws with Wall Plugs
- Professional Installation

==========================================
Customer saw exact price: ${this.formatCurrency(details.totalCost)} after submission
    `.trim();
    
    this.submitEmailForm(emailBody, userDetails, selections, {
      perWindow: details.totalCost / details.quantity,
      total: details.totalCost
    });
  }
}

// Register this calculator for HPL cladding product
  if (typeof createExtensionInitCalculator !== 'undefined') {
    createExtensionInitCalculator('hpl-exterior-cladding', HPLCladdingCalculator, 'HPLCladdingCalculator');
  } else {
    const registerWhenReady = setInterval(() => {
      if (typeof createExtensionInitCalculator !== 'undefined') {
        createExtensionInitCalculator('hpl-exterior-cladding', HPLCladdingCalculator, 'HPLCladdingCalculator');
        clearInterval(registerWhenReady);
      }
    }, 100);
    // Stop trying after 5 seconds
    setTimeout(() => clearInterval(registerWhenReady), 5000);
  }
  
  // Export
  window.HPLCladdingCalculator = HPLCladdingCalculator;
  
  // Export global test function
  window.testHPLCalculator = function() {
    const instanceKey = 'calculator_hpl-exterior-cladding';
    const calc = window[instanceKey];
    if (calc && calc instanceof HPLCladdingCalculator) {
      calc.forceCalculate();
      return calc;
    }
    return null;
  };
} else {
  /* PriceCalculatorBase not found - HPL calculator will not initialize */
}
