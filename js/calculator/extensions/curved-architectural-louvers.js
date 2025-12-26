/**
 * Architectural Curved Aluminium Louvers Calculator
 * 
 * Custom calculation logic for sleek curved louver projects:
 * - Profile: 60x40x1.2MM Aluminium (Sleek Design)
 * - Louvers installed every 8" gap
 * - Available in 12ft and 16ft sections
 * - Optimizes cutting to minimize wastage
 * - Adds 10% extra wastage on top of actual wastage
 * - Rates loaded from products.json config
 */

class CurvedLouversCalculator {
  constructor(productId, productConfig, containerId) {
    this.productId = productId;
    this.config = productConfig;
    this.containerId = containerId || `price-calculator-${productId}`;
    
    // Rates from config
    this.BASE_RATE_PER_SQFT = productConfig.rates.baseRate || 490;
    this.PROFILE_LENGTHS = productConfig.rates.profileLengths || [12, 16];
    this.PROFILE_WEIGHT_12FT = productConfig.rates.profileWeight12ft || 4.8;
    this.ALUMINIUM_RATE_PER_KG = productConfig.rates.aluminiumRatePerKg || 330;
    this.COATING_RATE_PER_FT = productConfig.rates.coatingRatePerFt || 50;
    this.PROFILE_GAP_INCHES = productConfig.rates.profileGap || 8;
    this.EXTRA_WASTAGE_PERCENT = productConfig.rates.extraWastagePercent || 10;
    
    // Derived values
    this.WEIGHT_PER_FOOT = this.PROFILE_WEIGHT_12FT / 12; // 0.4 kg/ft
    this.LOUVERS_PER_FOOT = 12 / this.PROFILE_GAP_INCHES; // 1.5 louvers per foot (8" gap)
    
    // User details
    this.userDetailsSubmitted = false;
    this.userDetails = null;
    this.isSubmittingEmail = false;
    
    // Store calculated amounts
    this.lastCalculatedAmounts = {
      mainCost: 0,
      wastageCost: 0,
      totalCost: 0,
      wastageDetails: null
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
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    const quantityInput = document.getElementById('calc-quantity');
    
    if (widthInput) widthInput.addEventListener('input', () => this.calculate());
    if (heightInput) heightInput.addEventListener('input', () => this.calculate());
    if (unitSelect) unitSelect.addEventListener('change', () => this.calculate());
    if (quantityInput) quantityInput.addEventListener('input', () => this.calculate());
    
    this.setupFormSubmission();
  }
  
  convertToFeet(value, unit) {
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
  
  getInputValues() {
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    const quantityInput = document.getElementById('calc-quantity');
    
    const unit = unitSelect?.value || 'ft';
    const width = this.convertToFeet(parseFloat(widthInput?.value) || 0, unit);
    const height = this.convertToFeet(parseFloat(heightInput?.value) || 0, unit);
    const quantity = Math.max(1, parseInt(quantityInput?.value) || 1);
    
    return { width, height, quantity, unit };
  }
  
  /**
   * Calculate optimal cutting from available profile lengths
   * Returns the best combination with minimum wastage
   */
  calculateOptimalCutting(heightFt, numberOfPieces) {
    const available = this.PROFILE_LENGTHS.sort((a, b) => b - a);
    
    let bestCombination = null;
    let minWastage = Infinity;
    
    for (const profileLength of available) {
      const piecesPerProfile = Math.floor(profileLength / heightFt);
      
      if (piecesPerProfile >= 1) {
        const profilesNeeded = Math.ceil(numberOfPieces / piecesPerProfile);
        const totalMaterial = profilesNeeded * profileLength;
        const actualRequired = numberOfPieces * heightFt;
        const wastage = totalMaterial - actualRequired;
        
        if (wastage < minWastage) {
          minWastage = wastage;
          bestCombination = {
            profileLength,
            piecesPerProfile,
            profilesNeeded,
            totalMaterial,
            actualRequired,
            wastage
          };
        }
      }
    }
    
    if (!bestCombination) {
      const profileLength = Math.max(...available);
      const profilesNeeded = numberOfPieces * Math.ceil(heightFt / profileLength);
      const totalMaterial = profilesNeeded * profileLength;
      const actualRequired = numberOfPieces * heightFt;
      const wastage = totalMaterial - actualRequired;
      
      bestCombination = {
        profileLength,
        piecesPerProfile: 1,
        profilesNeeded,
        totalMaterial,
        actualRequired,
        wastage,
        needsJoining: true
      };
    }
    
    return bestCombination;
  }
  
  /**
   * Calculate wastage cost with 10% extra wastage
   */
  calculateWastageCost(wastageFt) {
    if (wastageFt <= 0) return { aluminiumCost: 0, coatingCost: 0, totalCost: 0, actualWastage: 0, extraWastage: 0, totalWastage: 0 };
    
    // Add 10% extra wastage
    const extraWastage = wastageFt * (this.EXTRA_WASTAGE_PERCENT / 100);
    const totalWastage = wastageFt + extraWastage;
    
    const wastageWeight = totalWastage * this.WEIGHT_PER_FOOT;
    const aluminiumCost = wastageWeight * this.ALUMINIUM_RATE_PER_KG;
    const coatingCost = totalWastage * this.COATING_RATE_PER_FT;
    const totalCost = aluminiumCost + coatingCost;
    
    return {
      actualWastage: wastageFt,
      extraWastage,
      totalWastage,
      wastageWeight,
      aluminiumCost,
      coatingCost,
      totalCost
    };
  }
  
  calculate() {
    if (!document.getElementById(this.containerId)) return;
    
    const { width, height, quantity } = this.getInputValues();
    
    const areaSqft = width * height;
    const areaEl = document.getElementById('calc-area-display');
    if (areaEl) {
      areaEl.textContent = areaSqft > 0 ? areaSqft.toFixed(2) + ' sq.ft' : '0.00 sq.ft';
    }
    
    if (width <= 0 || height <= 0) {
      this.displayResults(0, 0, 0, null);
      return;
    }
    
    // Calculate number of louver pieces needed (8" gap = 1.5 per foot)
    const numberOfPieces = Math.ceil(width * this.LOUVERS_PER_FOOT);
    
    const piecesEl = document.getElementById('calc-pieces-display');
    if (piecesEl) {
      piecesEl.textContent = numberOfPieces + ' pcs';
    }
    
    // Calculate main cost
    const mainCost = areaSqft * this.BASE_RATE_PER_SQFT * quantity;
    
    // Calculate optimal cutting and wastage
    const cuttingPlan = this.calculateOptimalCutting(height, numberOfPieces * quantity);
    const wastageCost = this.calculateWastageCost(cuttingPlan.wastage);
    
    // Total cost
    const totalCost = mainCost + wastageCost.totalCost;
    
    this.lastCalculatedAmounts = {
      mainCost,
      wastageCost: wastageCost.totalCost,
      totalCost,
      wastageDetails: {
        ...cuttingPlan,
        ...wastageCost
      }
    };
    
    this.displayResults(mainCost, wastageCost.totalCost, totalCost, cuttingPlan, wastageCost);
  }
  
  displayResults(mainCost, wastageCost, totalCost, cuttingPlan, wastageDetails) {
    const formatCurrency = (amount) => '₹' + Math.round(amount).toLocaleString('en-IN');
    
    const showActual = this.userDetailsSubmitted;
    
    const mainCostEl = document.getElementById('calc-result-main');
    if (mainCostEl) {
      if (showActual) {
        mainCostEl.textContent = formatCurrency(mainCost);
      } else {
        const low = mainCost * 0.8;
        const high = mainCost * 1.2;
        mainCostEl.textContent = formatCurrency(low) + ' - ' + formatCurrency(high);
      }
    }
    
    const wastageEl = document.getElementById('calc-result-wastage');
    if (wastageEl) {
      if (showActual) {
        wastageEl.textContent = formatCurrency(wastageCost);
      } else {
        const low = wastageCost * 0.8;
        const high = wastageCost * 1.2;
        wastageEl.textContent = wastageCost > 0 ? formatCurrency(low) + ' - ' + formatCurrency(high) : '₹0';
      }
    }
    
    const totalEl = document.getElementById('calc-result-total');
    if (totalEl) {
      if (showActual) {
        totalEl.textContent = formatCurrency(totalCost);
      } else {
        const low = totalCost * 0.8;
        const high = totalCost * 1.2;
        totalEl.textContent = formatCurrency(low) + ' - ' + formatCurrency(high);
      }
    }
    
    const detailsEl = document.getElementById('calc-cutting-details');
    if (detailsEl && cuttingPlan && wastageDetails) {
      detailsEl.innerHTML = `
        <div style="font-size: 0.85rem; color: #b0b0b0; margin-top: 0.5rem;">
          <span>Profile: ${cuttingPlan.profileLength}ft</span> • 
          <span>${cuttingPlan.profilesNeeded} profiles</span> • 
          <span>Wastage: ${wastageDetails.totalWastage?.toFixed(1) || cuttingPlan.wastage.toFixed(1)}ft (+10%)</span>
        </div>
      `;
    }
  }
  
  setupFormSubmission() {
    const form = document.getElementById('calc-user-form');
    if (!form) return;
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (this.isSubmittingEmail) return false;
      
      const name = newForm.querySelector('#calc-user-name')?.value?.trim();
      const city = newForm.querySelector('#calc-user-city')?.value?.trim();
      const mobile = newForm.querySelector('#calc-user-mobile')?.value?.trim();
      const email = newForm.querySelector('#calc-user-email')?.value?.trim();
      
      if (!name || !city || !mobile) {
        alert('Please fill in Name, City, and Mobile Number');
        return false;
      }
      
      if (mobile.length < 10) {
        alert('Please enter a valid mobile number');
        return false;
      }
      
      this.submitUserDetails({ name, city, mobile, email: email || '' });
      return false;
    });
  }
  
  submitUserDetails(userDetails) {
    if (this.isSubmittingEmail) return;
    
    this.isSubmittingEmail = true;
    this.userDetailsSubmitted = true;
    this.userDetails = userDetails;
    
    this.calculate();
    this.sendEmail(userDetails);
    
    setTimeout(() => {
      this.isSubmittingEmail = false;
    }, 10000);
  }
  
  sendEmail(userDetails) {
    const { width, height, quantity } = this.getInputValues();
    const amounts = this.lastCalculatedAmounts;
    
    const emailBody = `
New Quote Request - Architectural Curved Aluminium Louvers

User Details:
- Name: ${userDetails.name}
- City: ${userDetails.city}
- Mobile: ${userDetails.mobile}
${userDetails.email ? `- Email: ${userDetails.email}` : ''}

Product: Architectural Curved Aluminium Louvers
Profile: 60x40x1.2MM Sleek Design

Dimensions:
- Width: ${width.toFixed(2)} ft
- Height: ${height.toFixed(2)} ft
- Area: ${(width * height).toFixed(2)} sq.ft
- Quantity: ${quantity}

Cutting Plan:
- Profile Length: ${amounts.wastageDetails?.profileLength || '-'}ft sections
- Profiles Needed: ${amounts.wastageDetails?.profilesNeeded || '-'}
- Wastage: ${amounts.wastageDetails?.totalWastage?.toFixed(1) || '0'}ft (incl. 10% extra)

Cost Breakdown:
- Louver Panel Cost: ₹${Math.round(amounts.mainCost).toLocaleString('en-IN')}
- Profile Wastage Cost: ₹${Math.round(amounts.wastageCost).toLocaleString('en-IN')}
- Total Cost: ₹${Math.round(amounts.totalCost).toLocaleString('en-IN')}

---
Generated from Curved Louvers Price Calculator
    `.trim();
    
    this.submitEmailForm(emailBody, userDetails);
  }
  
  submitEmailForm(emailBody, userDetails) {
    if (window.EmailSubmitter) {
      window.EmailSubmitter.submit({
        subject: 'New Quote - Curved Architectural Louvers',
        message: emailBody,
        userDetails: userDetails,
        onSuccess: () => this.showSuccessMessage(),
        onError: () => this.showSuccessMessage()
      });
    } else {
      // Fallback if utility not loaded
      console.warn('⚠️ EmailSubmitter not loaded');
      this.showSuccessMessage();
    }
  }
  
  submitEmailFallback(emailBody, userDetails) {
    // Legacy method - now uses EmailSubmitter
    this.submitEmailForm(emailBody, userDetails);
  }
  
  showSuccessMessage() {
    const form = document.getElementById('calc-user-form');
    const successMsg = document.getElementById('calc-success-message');
    
    if (form) form.style.display = 'none';
    if (successMsg) {
      successMsg.style.display = 'block';
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// Override initCalculator for this product
(function() {
  const originalInitCalculator = window.initCalculator;
  
  window.initCalculator = async function(productId, containerId = null) {
    if (productId === 'curved-architectural-louvers') {
      try {
        if (typeof productManager === 'undefined') {
          console.error('productManager not found');
          return null;
        }
        
        const productData = await productManager.getProduct(productId);
        if (!productData) return null;
        
        const calcContainerId = containerId || `price-calculator-${productId}`;
        const container = document.getElementById(calcContainerId);
        if (!container) return null;
        
        const calculator = new CurvedLouversCalculator(productId, productData, calcContainerId);
        window[`calculator_${productId}`] = calculator;
        console.log('✅ Curved Louvers Calculator initialized:', productData.name);
        return calculator;
      } catch (error) {
        console.error('Error initializing curved louvers calculator:', error);
        return null;
      }
    } else if (originalInitCalculator) {
      return originalInitCalculator(productId, containerId);
    }
    return null;
  };
  
  // Auto-initialize after extension loads
  const initCurvedLouversCalculator = async () => {
    const productId = 'curved-architectural-louvers';
    const container = document.getElementById(`price-calculator-${productId}`);
    
    if (!container) return;
    
    if (typeof productManager === 'undefined') {
      console.warn('productManager not ready, retrying...');
      setTimeout(initCurvedLouversCalculator, 200);
      return;
    }
    
    const existingCalc = window[`calculator_${productId}`];
    if (existingCalc && existingCalc instanceof CurvedLouversCalculator) {
      console.log('✅ Curved Louvers Calculator already initialized correctly');
      return;
    }
    
    console.log('🔄 Initializing Curved Louvers Calculator...');
    
    // Prevent duplicate initialization
    if (window[`calculator_${productId}`]) {
      console.log('⚠️ Calculator already initialized for:', productId);
      return;
    }
    
    try {
      const productData = await productManager.getProduct(productId);
      if (!productData) {
        console.error('Product data not found for:', productId);
        return;
      }
      
      const calculator = new CurvedLouversCalculator(productId, productData, `price-calculator-${productId}`);
      window[`calculator_${productId}`] = calculator;
      console.log('✅ Curved Louvers Calculator initialized with wastage calculation (+10%)');
    } catch (error) {
      console.error('Error initializing curved louvers calculator:', error);
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initCurvedLouversCalculator, 300));
  } else {
    setTimeout(initCurvedLouversCalculator, 300);
  }
})();

// Export
if (typeof window !== 'undefined') {
  window.CurvedLouversCalculator = CurvedLouversCalculator;
}

