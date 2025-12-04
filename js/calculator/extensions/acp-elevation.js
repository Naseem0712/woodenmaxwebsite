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
    
    this.initACPCalculator();
  }
  
  initACPCalculator() {
    const init = () => {
      setTimeout(() => {
        if (document.getElementById(this.containerId)) {
          this.setupACPEventListeners();
          this.updateProjectInfo();
          this.calculate();
        }
      }, 150);
    };
    
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
    
    // Size inputs
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    const quantityInput = document.getElementById('calc-quantity');
    
    if (widthInput) widthInput.addEventListener('input', () => this.calculate());
    if (heightInput) heightInput.addEventListener('input', () => this.calculate());
    if (unitSelect) unitSelect.addEventListener('change', () => this.calculate());
    if (quantityInput) quantityInput.addEventListener('input', () => this.calculate());
    
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
    if (!document.getElementById(this.containerId)) return;
    
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
    
    // Display results
    this.displayACPResults();
  }
  
  displayACPResults() {
    const details = this.lastCalcDetails;
    
    // Area displays
    const areaEl = document.getElementById('calc-area-display');
    const wastageAreaEl = document.getElementById('calc-wastage-area');
    const sheetsEl = document.getElementById('calc-sheets-needed');
    
    if (areaEl) areaEl.textContent = details.baseArea > 0 ? details.baseArea.toFixed(2) + ' sq.ft' : '0.00 sq.ft';
    if (wastageAreaEl) wastageAreaEl.textContent = details.totalAreaWithWastage > 0 ? details.totalAreaWithWastage.toFixed(2) + ' sq.ft' : '0.00 sq.ft';
    if (sheetsEl) sheetsEl.textContent = details.sheetsNeeded || '0';
    
    // Price range display (before form submission)
    const priceRangeEl = document.getElementById('calc-price-range');
    if (priceRangeEl) {
      if (details.totalCost > 0) {
        priceRangeEl.textContent = `${this.formatCurrency(details.priceLow)} - ${this.formatCurrency(details.priceHigh)}`;
      } else {
        priceRangeEl.textContent = '₹0 - ₹0';
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
    console.log('📧 Preparing ACP cladding quote email...');
    
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
createExtensionInitCalculator('acp-elevation', ACPElevationCalculator, 'ACPElevationCalculator');

console.log('✅ ACP Elevation Cladding Calculator extension loaded');
