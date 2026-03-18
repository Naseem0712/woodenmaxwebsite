/**
 * ACP Elevation Cladding Calculator Extension
 * Shows price range (±20%) before form submission
 * Reveals exact price after form submission
 * 
 * PRICING (per sqft):
 * Commercial:
 *   3mm: Plain ₹270, Wooden ₹320
 *   4mm: Plain ₹310, Wooden ₹380
 *   6mm: Plain ₹390, Wooden ₹450
 * 
 * FR Grade B (Railways/Airports/Govt):
 *   4mm Plain only: ₹520
 */

if (typeof PriceCalculatorBase !== 'undefined') {
class ACPElevationCalculator extends PriceCalculatorBase {
  constructor(productId, productConfig, containerId) {
    super(productId, productConfig, containerId);
    
    // Commercial pricing by thickness and color (all PVDF coating)
    this.commercialRates = {
      '3': { plain: 270, wooden: 320 },
      '4': { plain: 310, wooden: 380 },
      '6': { plain: 390, wooden: 450 }
    };
    
    // FR Grade B pricing (4mm only, plain color)
    this.frGradeRate = 520;
    
    // Standard sheet size for calculation (4x12 feet = 48 sqft)
    this.standardSheetSqft = 48;
    this.sheetSizeDisplay = '4×12 ft (48 sq.ft)';
    
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
    this.initACPCalculator();
  }
  
  // Force recalculation - can be called manually for testing
  forceCalculate() {
    this.calculate();
  }
  
  // Override base class setupEventListeners to prevent conflicts
  setupEventListeners() {
    // Do nothing - we use setupACPEventListeners instead
    this._baseSetupCalled = true;
  }
  
  initACPCalculator() {
    const init = () => {
      setTimeout(() => {
        const container = document.getElementById(this.containerId);
        if (!container) {
          setTimeout(init, 200);
          return;
        }
        
        this.setupACPEventListeners();
          this.updateProjectInfo();
        
        // Initialize display with empty values first
        this.lastCalcDetails = {
          baseArea: 0,
          totalAreaWithWastage: 0,
          sheetsNeeded: 0,
          totalCost: 0,
          priceLow: 0,
          priceHigh: 0
        };
        this.displayACPResults();
        
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
  
  setupACPEventListeners() {
    // Project type selection
    const projectSelect = document.getElementById('calc-project-type');
    if (projectSelect) {
      projectSelect.addEventListener('change', () => {
        this.updateProjectInfo();
        this.calculate();
      });
    }
    
    // Thickness selection
    const thicknessSelect = document.getElementById('calc-thickness');
    if (thicknessSelect) {
      thicknessSelect.addEventListener('change', () => this.calculate());
    }
    
    // Color type selection
    const colorSelect = document.getElementById('calc-color-type');
    if (colorSelect) {
      colorSelect.addEventListener('change', () => this.calculate());
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
  
  updateProjectInfo() {
    const projectSelect = document.getElementById('calc-project-type');
    const projectInfo = document.getElementById('project-info');
    const colorGroup = document.getElementById('color-group');
    const thicknessSelect = document.getElementById('calc-thickness');
    const infoCommercial = document.getElementById('info-commercial');
    const infoFrGrade = document.getElementById('info-fr-grade');
    
    if (!projectSelect) return;
    
    const isFrGrade = projectSelect.value === 'fr-grade';
    
    // Update project info text
    if (projectInfo) {
      projectInfo.textContent = isFrGrade 
        ? 'FR Grade B with GI/Aluminium brackets for wall & ceiling'
        : 'Standard commercial projects with direct mounting';
    }
    
    // Show/hide color selection (FR Grade is plain only)
    if (colorGroup) {
      colorGroup.style.display = isFrGrade ? 'none' : 'block';
    }
    
    // Lock thickness to 4mm for FR Grade
    if (thicknessSelect) {
      if (isFrGrade) {
        thicknessSelect.value = '4';
        thicknessSelect.disabled = true;
      } else {
        thicknessSelect.disabled = false;
      }
    }
    
    // Show/hide info boxes
    if (infoCommercial) {
      infoCommercial.style.display = isFrGrade ? 'none' : 'block';
    }
    if (infoFrGrade) {
      infoFrGrade.style.display = isFrGrade ? 'block' : 'none';
    }
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
  
  getSelectedProjectType() {
    const projectSelect = document.getElementById('calc-project-type');
    return projectSelect ? projectSelect.value : 'commercial';
  }
  
  getSelectedThickness() {
    const thicknessSelect = document.getElementById('calc-thickness');
    return thicknessSelect ? thicknessSelect.value : '4';
  }
  
  getSelectedColorType() {
    const colorSelect = document.getElementById('calc-color-type');
    return colorSelect ? colorSelect.value : 'wooden';
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
  
  getRatePerSqft() {
    const projectType = this.getSelectedProjectType();
    const thickness = this.getSelectedThickness();
    const colorType = this.getSelectedColorType();
    
    if (projectType === 'fr-grade') {
      return this.frGradeRate; // ₹520 for FR Grade B
    }
    
    // Commercial rates
    const thicknessRates = this.commercialRates[thickness];
    if (!thicknessRates) return 0;
    
    return thicknessRates[colorType] || 0;
  }
  
  calculate() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      return;
    }
    
    const projectType = this.getSelectedProjectType();
    const thickness = this.getSelectedThickness();
    const colorType = this.getSelectedColorType();
    const quantity = this.getQuantity();
    const ratePerSqft = this.getRatePerSqft();
    
    // Get base area for one facade/area
    const baseAreaPerUnit = this.getArea();
    const totalBaseArea = baseAreaPerUnit * quantity;
    
    // Calculate wastage (5%)
    const wastageArea = totalBaseArea * (this.wastagePercent / 100);
    const totalAreaWithWastage = totalBaseArea + wastageArea;
    
    // Calculate sheets needed (round UP) - using 4x12ft = 48sqft standard
    let sheetsNeeded = 0;
    if (totalAreaWithWastage > 0) {
      sheetsNeeded = Math.ceil(totalAreaWithWastage / this.standardSheetSqft);
    }
    
    // Calculate total cost
    const totalCost = totalAreaWithWastage * ratePerSqft;
    
    // Calculate price range (±20%)
    const priceLow = Math.round(totalCost * (1 - this.priceVariance));
    const priceHigh = Math.round(totalCost * (1 + this.priceVariance));
    
    // Get display names
    let projectTypeName = projectType === 'fr-grade' 
      ? 'FR Grade B (Fire Retardant)' 
      : 'Commercial';
    
    let colorTypeName = projectType === 'fr-grade'
      ? 'Plain Color (FR Core)'
      : (colorType === 'wooden' ? 'Wooden Color (PVDF)' : 'Plain Color (PVDF)');
    
    // Store for email and reveal
    this.lastCalcDetails = {
      projectType: projectTypeName,
      projectTypeKey: projectType,
      thickness: thickness + 'mm',
      colorType: colorTypeName,
      colorTypeKey: colorType,
      ratePerSqft: ratePerSqft,
      baseArea: totalBaseArea,
      wastagePercent: this.wastagePercent,
      wastageArea: wastageArea,
      totalAreaWithWastage: totalAreaWithWastage,
      standardSheetSqft: this.standardSheetSqft,
      sheetsNeeded: sheetsNeeded,
      totalCost: totalCost,
      priceLow: priceLow,
      priceHigh: priceHigh,
      quantity: quantity,
      isFrGrade: projectType === 'fr-grade'
    };
    
    this.lastCalculatedAmounts = {
      perWindowCost: totalCost / quantity,
      subtotal: totalCost
    };
    
    try {
      this.displayACPResults();
    } catch (error) {
    }
  }
  
  displayACPResults() {
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
    const projectSelect = document.getElementById('calc-project-type');
    const colorSelect = document.getElementById('calc-color-type');
    const thicknessSelect = document.getElementById('calc-thickness');
    const quantityInput = document.getElementById('calc-quantity');
    
    return {
      projectType: projectSelect?.options[projectSelect?.selectedIndex]?.text || '',
      colorType: colorSelect?.options[colorSelect?.selectedIndex]?.text || '',
      thickness: thicknessSelect?.options[thicknessSelect?.selectedIndex]?.text || '',
      width: widthInput?.value || '',
      height: heightInput?.value || '',
      unit: unitSelect?.options[unitSelect?.selectedIndex]?.text || '',
      quantity: quantityInput?.value || '1'
    };
  }
  
  sendEmail(userDetails) {
    const selections = this.getCalculatorSelections();
    const details = this.lastCalcDetails;
    
    // FR Grade specific info
    const frGradeInfo = details.isFrGrade ? `
FR GRADE B SPECIFICATIONS:
- 4mm FR Grade B ACP (Fire Retardant Core)
- GI Brackets: 75×75×6mm with Anchor Bolts 10×100mm
- OR Aluminium Angles: 50×50×50mm with Screws
- Brackets required for wall & ceiling mounting
- Compliant for Railways, Airports, Stations, Govt Projects
` : '';
    
    // Email to business owner includes full pricing details
    const emailBody = `
NEW QUOTE REQUEST - ACP Elevation Cladding
==========================================

CUSTOMER DETAILS:
- Name: ${userDetails.name}
- City: ${userDetails.city}
- Mobile: ${userDetails.mobile}
${userDetails.email ? `- Email: ${userDetails.email}` : ''}

PRODUCT: ACP Elevation Cladding

SELECTED OPTIONS:
- Project Type: ${details.projectType}
- Finish: ${details.colorType}
- Thickness: ${details.thickness}
- Dimensions: ${selections.width} × ${selections.height} ${selections.unit}
- Number of Areas: ${details.quantity}
${frGradeInfo}
AREA CALCULATIONS:
- Base Area: ${details.baseArea?.toFixed(2)} sq.ft
- Wastage (5%): ${details.wastageArea?.toFixed(2)} sq.ft
- Total Area: ${details.totalAreaWithWastage?.toFixed(2)} sq.ft
- Standard Sheet: 4×12 ft (48 sq.ft)
- Sheets Required: ${details.sheetsNeeded} sheets

COST BREAKDOWN (INTERNAL):
- Package Rate: ${this.formatCurrency(details.ratePerSqft)}/sqft
- Total Cost: ${this.formatCurrency(details.totalCost)}

PRICING:
- Price Range Shown: ${this.formatCurrency(details.priceLow)} - ${this.formatCurrency(details.priceHigh)}
- EXACT PRICE: ${this.formatCurrency(details.totalCost)}

PACKAGE INCLUDES:
${details.isFrGrade ? 
`- 4mm FR Grade B ACP Sheets
- GI Brackets 75×75×6mm / Aluminium Angles 50×50×50mm
- Anchor Bolts 10×100mm / Screws
- 4×4 Grid Aluminium Framework
- Silicon Sealant + Professional Installation` :
`- ACP Sheets (PVDF Coating, Top Indian Brands)
- Aluminium Profile Framework (4×4 Grid)
- Wooden Screws + Silicon Sealant
- Professional Installation`}
- 5% Wastage Material

==========================================
Customer saw exact price: ${this.formatCurrency(details.totalCost)} after submission
    `.trim();
    
    this.submitEmailForm(emailBody, userDetails, selections, {
      perWindow: details.totalCost / details.quantity,
      total: details.totalCost
    });
  }
}

// Register this calculator for ACP elevation product
  if (typeof createExtensionInitCalculator !== 'undefined') {
    createExtensionInitCalculator('acp-elevation', ACPElevationCalculator, 'ACPElevationCalculator');
  } else {
    const registerWhenReady = setInterval(() => {
      if (typeof createExtensionInitCalculator !== 'undefined') {
        createExtensionInitCalculator('acp-elevation', ACPElevationCalculator, 'ACPElevationCalculator');
        clearInterval(registerWhenReady);
      }
    }, 100);
    // Stop trying after 5 seconds
    setTimeout(() => clearInterval(registerWhenReady), 5000);
  }
  
  // Export
  window.ACPElevationCalculator = ACPElevationCalculator;
  
  // Export global test function
  window.testACPCalculator = function() {
    const instanceKey = 'calculator_acp-elevation';
    const calc = window[instanceKey];
    if (calc && calc instanceof ACPElevationCalculator) {
      calc.forceCalculate();
      return calc;
    }
    return null;
  };
} else {
  /* PriceCalculatorBase not found - ACP calculator will not initialize */
}
