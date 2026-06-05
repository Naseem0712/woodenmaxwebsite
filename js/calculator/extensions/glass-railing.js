/**
 * Glass Railing Calculator - Complete Rewrite
 * Balcony & Staircase Glass Railing Price Calculator
 * Uses rates from products.json
 * Live calculation with range display before submit, exact after submit
 */

class GlassRailingCalculator {
  constructor(productId, productConfig, containerId) {
    this.productId = productId;
    this.config = productConfig;
    this.containerId = containerId || `price-calculator-${productId}`;
    this.FEET_PER_METER = 3.28084;
    
    // Load rates from config
    this.GLASS_RATES = productConfig.rates?.glass || {};
    this.BOTTOM_PROFILES = productConfig.rates?.bottomProfiles || [];
    this.HANDRAILS = productConfig.rates?.handrails || [];
    this.PILLAR_BRACKETS = productConfig.rates?.pillarBrackets || [];
    this.STUDS = productConfig.rates?.studs || [];
    this.HARDWARE_PACKAGE_PER_RFT = productConfig.rates?.hardwarePackagePerRft || 0;
    this.ANCHOR_BOLT_PER_RFT = productConfig.rates?.anchorBoltPerRft || 0;
    this.INSTALLATION_PER_RFT = productConfig.rates?.installationPerRft || 0;
    this.GLASS_WASTAGE_PERCENT = productConfig.rates?.glassWastagePercent || 0;
    
    // Form submission state
    this.userDetailsSubmitted = false;
    this.isSubmittingEmail = false;
    
    // Initialize
    this.initializeCalculator();
  }
  
  initializeCalculator() {
    let retryCount = 0;
    const maxRetries = 30;
    
    const init = () => {
      const container = document.getElementById(this.containerId);
      if (!container) {
        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(init, 200);
        }
        return;
      }
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Init typing indicators
      this.initTypingIndicators();
      
      // Initial calculation
      setTimeout(() => {
        this.calculate();
      }, 300);
    };
    
    // Start immediately
    init();
    
    // Also try after DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(init, 100);
      });
    } else {
      setTimeout(init, 100);
    }
  }
  
  setupEventListeners() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error('❌ Container not found in setupEventListeners:', this.containerId);
      return;
    }
    
    // Setting up event listeners
    
    // Unit selector
    const unitSelect = container.querySelector('#calc-unit');
    if (unitSelect) {
      unitSelect.addEventListener('change', () => this.calculate());
    }
    
    // Height input - live update
    const heightInput = container.querySelector('#calc-height');
    if (heightInput) {
      heightInput.addEventListener('input', () => this.calculate());
      heightInput.addEventListener('change', () => this.calculate());
    }
    
    // Length inputs container - event delegation
    const lengthsContainer = container.querySelector('#calc-lengths-container');
    if (lengthsContainer) {
      lengthsContainer.addEventListener('input', (e) => {
        if (e.target && e.target.classList.contains('calc-length-input')) {
          this.calculate();
        }
      });
      lengthsContainer.addEventListener('change', (e) => {
        if (e.target && e.target.classList.contains('calc-length-input')) {
          this.calculate();
        }
      });
      
      // Bind listeners to existing inputs
      const existingInputs = lengthsContainer.querySelectorAll('.calc-length-input');
      existingInputs.forEach(input => {
        if (!input.hasAttribute('data-listener-bound')) {
          input.setAttribute('data-listener-bound', 'true');
          input.addEventListener('input', () => this.calculate());
        }
      });
      
      // Bind remove buttons for existing rows
      const existingRemoveBtns = lengthsContainer.querySelectorAll('.calc-remove-length-btn');
      existingRemoveBtns.forEach(btn => {
        if (!btn.hasAttribute('data-listener-bound')) {
          btn.setAttribute('data-listener-bound', 'true');
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const row = btn.closest('.calc-length-row');
            if (row) {
              row.remove();
              const mainContainer = document.getElementById(this.containerId);
              const container = mainContainer?.querySelector('#calc-lengths-container');
              if (container && container.children.length === 0) {
                this.addLengthRow();
              }
              this.calculate();
            }
          });
        }
      });
    }
    
    // Add length button
    const addLengthBtn = container.querySelector('#calc-add-length-btn');
    if (addLengthBtn) {
      // Add length button found
      const newBtn = addLengthBtn.cloneNode(true);
      if (addLengthBtn.parentNode) {
        addLengthBtn.parentNode.replaceChild(newBtn, addLengthBtn);
      }
      
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Add length button clicked
        this.addLengthRow();
      });
      
      // Event delegation as backup
      container.addEventListener('click', (e) => {
        if (e.target && (e.target.id === 'calc-add-length-btn' || e.target.closest('#calc-add-length-btn'))) {
          e.preventDefault();
          e.stopPropagation();
          // Add length button clicked (delegation)
          this.addLengthRow();
        }
      });
    } else {
      console.error('❌ Add length button not found!');
    }
    
    // Material selects - live update
    const glassSelect = container.querySelector('#calc-glass');
    const bottomProfileSelect = container.querySelector('#calc-bottom-profile');
    const bottomFinishSelect = container.querySelector('#calc-bottom-finish');
    const handrailSelect = container.querySelector('#calc-handrail');
    const handrailFinishSelect = container.querySelector('#calc-handrail-finish');
    
    // Handle bottom profile change - show/hide finish select and info text
    if (bottomProfileSelect) {
      bottomProfileSelect.addEventListener('change', () => {
        const bottomFinishSelect = container.querySelector('#calc-bottom-finish');
        const infoText = container.querySelector('#calc-bottom-profile-info');
        const selectedValue = bottomProfileSelect.value;
        
        if (bottomFinishSelect) {
          if (selectedValue === 'none') {
            bottomFinishSelect.style.opacity = '0.5';
            bottomFinishSelect.disabled = true;
          } else {
            bottomFinishSelect.style.opacity = '1';
            bottomFinishSelect.disabled = false;
          }
        }
        
        // Update info text based on selection
        if (infoText) {
          if (selectedValue.startsWith('pillar_')) {
            infoText.textContent = 'Installed every 3 steps. For 6-7 feet glass: 3 pcs (2 corners + 1 middle). Quantity calculated automatically. Recommended for stair.';
            infoText.style.display = 'block';
          } else if (selectedValue.startsWith('stud_')) {
            infoText.textContent = 'Vertical studs on stair sides. Average 1 pc per RFT. For 6-7 feet glass: 3 locations × 2 pcs each = 6 pcs total. Quantity calculated automatically. Recommended for stair.';
            infoText.style.display = 'block';
          } else {
            infoText.style.display = 'none';
          }
        }
        
        this.calculate();
      });
    }
    
    if (glassSelect) glassSelect.addEventListener('change', () => this.calculate());
    if (bottomFinishSelect) bottomFinishSelect.addEventListener('change', () => this.calculate());
    if (handrailSelect) handrailSelect.addEventListener('change', () => this.calculate());
    if (handrailFinishSelect) handrailFinishSelect.addEventListener('change', () => this.calculate());
    
    // Initialize bottom finish select state and info text
    if (bottomProfileSelect && bottomFinishSelect) {
      const selectedValue = bottomProfileSelect.value;
      const infoText = container.querySelector('#calc-bottom-profile-info');
      
      if (selectedValue === 'none') {
        bottomFinishSelect.style.opacity = '0.5';
        bottomFinishSelect.disabled = true;
      }
      
      // Initialize info text
      if (infoText) {
        if (selectedValue.startsWith('pillar_')) {
          infoText.textContent = 'Installed every 3 steps. For 6-7 feet glass: 3 pcs (2 corners + 1 middle). Quantity calculated automatically. Recommended for stair.';
          infoText.style.display = 'block';
        } else if (selectedValue.startsWith('stud_')) {
          infoText.textContent = 'Vertical studs on stair sides. Average 1 pc per RFT. For 6-7 feet glass: 3 locations × 2 pcs each = 6 pcs total. Quantity calculated automatically. Recommended for stair.';
          infoText.style.display = 'block';
        } else {
          infoText.style.display = 'none';
        }
      }
    }
    
    // Form submission
    this.setupFormSubmission();
  }
  
  addLengthRow() {
    const mainContainer = document.getElementById(this.containerId);
    if (!mainContainer) return;
    
    const container = mainContainer.querySelector('#calc-lengths-container');
    if (!container) return;
    
    const rowIndex = container.querySelectorAll('.calc-length-row').length;
    const inputId = `calc-length-${rowIndex + 1}`;
    
    const row = document.createElement('div');
    row.className = 'calc-length-row';
    row.innerHTML = `
      <div>
        <label class="calc-length-label" for="${inputId}">Length</label>
        <input type="text" id="${inputId}" name="${inputId}" inputmode="decimal" class="calc-input calc-length-input" placeholder="Enter Length">
      </div>
      <button type="button" class="calc-remove-length-btn" aria-label="Remove length">✕</button>
    `;
    
    container.appendChild(row);
    
    // Setup input listener
    const input = row.querySelector('.calc-length-input');
    if (input) {
      input.addEventListener('input', () => this.calculate());
      input.addEventListener('change', () => this.calculate());
    }
    
    // Setup remove button
    const removeBtn = row.querySelector('.calc-remove-length-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        row.remove();
        const lengthsContainer = mainContainer.querySelector('#calc-lengths-container');
        if (lengthsContainer && lengthsContainer.children.length === 0) {
          this.addLengthRow();
        }
        this.calculate();
      });
    }
    
    // Init typing indicator
    this.initTypingIndicators();
    
    // Calculate after adding
    setTimeout(() => {
      this.calculate();
    }, 50);
  }
  
  initTypingIndicators() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    // Retry mechanism for typing indicator initialization
    let retryCount = 0;
    const maxRetries = 20;
    
    const initTyping = () => {
      if (typeof window.createSmoothTypingIndicator !== 'function') {
        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(initTyping, 200);
        }
        return;
      }
      
      // Initialize height input
      const heightInput = container.querySelector('#calc-height');
      if (heightInput && !heightInput.hasAttribute('data-typing-initialized')) {
        heightInput.setAttribute('placeholder', '');
        heightInput.setAttribute('data-typing-initialized', 'true');
        setTimeout(() => {
          window.createSmoothTypingIndicator(heightInput, 'Height', {
            minTypeSpeed: 60,
            maxTypeSpeed: 120,
            minDeleteSpeed: 30,
            maxDeleteSpeed: 60,
            pauseBeforeDelete: 2500,
            pauseAfterDelete: 600,
            startDelay: 500
          });
        }, 100);
      }
      
      // Initialize length inputs
      const lengthInputs = container.querySelectorAll('.calc-length-input:not([data-typing-initialized])');
      lengthInputs.forEach((input, index) => {
        if (input && !input.hasAttribute('data-typing-initialized')) {
          input.setAttribute('placeholder', '');
          input.setAttribute('data-typing-initialized', 'true');
          setTimeout(() => {
            window.createSmoothTypingIndicator(input, 'Length', {
              minTypeSpeed: 60,
              maxTypeSpeed: 120,
              minDeleteSpeed: 30,
              maxDeleteSpeed: 60,
              pauseBeforeDelete: 2500,
              pauseAfterDelete: 600,
              startDelay: 300 + (index * 100)
            });
          }, 200 + (index * 100));
        }
      });
    };
    
    initTyping();
  }
  
  getUnit() {
    const container = document.getElementById(this.containerId);
    if (!container) return 'rft';
    const unitSelect = container.querySelector('#calc-unit');
    return unitSelect?.value || 'rft';
  }
  
  convertToFeet(value, unit) {
    if (!value) return 0;
    const numValue = parseFloat(String(value).trim());
    if (isNaN(numValue) || numValue <= 0) return 0;
    return unit === 'rmt' ? numValue * this.FEET_PER_METER : numValue;
  }
  
  getTotalLengthFt() {
    const container = document.getElementById(this.containerId);
    if (!container) return 0;
    
    const unit = this.getUnit();
    const lengthsContainer = container.querySelector('#calc-lengths-container');
    if (!lengthsContainer) return 0;
    
    let totalFt = 0;
    const lengthInputs = lengthsContainer.querySelectorAll('.calc-length-input');
    lengthInputs.forEach(input => {
      const value = this.convertToFeet(input.value, unit);
      totalFt += value;
    });
    
    return totalFt;
  }
  
  getHeightFt() {
    const container = document.getElementById(this.containerId);
    if (!container) return 0;
    const heightInput = container.querySelector('#calc-height');
    if (!heightInput) return 0;
    const unit = this.getUnit();
    return this.convertToFeet(heightInput.value, unit);
  }
  
  getSelectedBottomProfile() {
    const container = document.getElementById(this.containerId);
    if (!container) return null;
    const select = container.querySelector('#calc-bottom-profile');
    const value = select?.value || 'none';
    if (value === 'none') return null;
    
    // Check if it's a pillar/bracket
    if (value.startsWith('pillar_')) {
      return this.PILLAR_BRACKETS.find(p => p.id === value) || null;
    }
    
    // Check if it's a stud
    if (value.startsWith('stud_')) {
      return this.STUDS.find(s => s.id === value) || null;
    }
    
    // Regular bottom profile
    return this.BOTTOM_PROFILES.find(p => p.id === value) || null;
  }
  
  isPillarBracket(profile) {
    return profile && profile.id && profile.id.startsWith('pillar_');
  }
  
  isStud(profile) {
    return profile && profile.id && profile.id.startsWith('stud_');
  }
  
  getSelectedHandrail() {
    const container = document.getElementById(this.containerId);
    if (!container) return null;
    const select = container.querySelector('#calc-handrail');
    const value = select?.value || 'al_25x25';
    return this.HANDRAILS.find(h => h.id === value) || this.HANDRAILS[0];
  }
  
  getBottomFinish() {
    const container = document.getElementById(this.containerId);
    if (!container) return 'plain';
    const select = container.querySelector('#calc-bottom-finish');
    return select?.value || 'plain';
  }
  
  getHandrailFinish() {
    const container = document.getElementById(this.containerId);
    if (!container) return 'plain';
    const select = container.querySelector('#calc-handrail-finish');
    return select?.value || 'plain';
  }
  
  calculatePillarBracketQuantity(totalLengthFt, pillarBracket) {
    if (!pillarBracket) return 0;
    
    // For 6-7 feet glass: 3 pcs (2 corners + 1 middle)
    // Every 3 steps = 1 pc
    // Average: approximately 1 pc per 2-2.5 feet
    // Using formula: For every ~2.5 feet, 1 pc (minimum 3 pcs for any length > 0)
    const spacing = pillarBracket.spacing || 3; // steps
    const stepsPerFoot = 0.5; // approximate: 2 steps per foot
    const pcsPerFoot = 1 / (spacing * stepsPerFoot); // approximately 1 pc per 2.5 feet
    
    let quantity = Math.ceil(totalLengthFt * pcsPerFoot);
    
    // Minimum 3 pcs for any length > 0 (for corners + middle)
    if (totalLengthFt > 0 && quantity < 3) {
      quantity = 3;
    }
    
    return quantity;
  }
  
  calculateStudQuantity(totalLengthFt, stud) {
    if (!stud) return 0;
    
    // Studs are installed vertically on staircase sides
    // For 6-7 feet glass: 3 locations × 2 pcs each (both sides) = 6 pcs total
    // Average: approximately 1 location per 2-2.5 feet
    // Each location has 2 pcs (one on each side)
    const pcsPerLocation = stud.pcsPerLocation || 2;
    
    // Calculate locations: approximately 1 location per 2.5 feet
    // For 6-7 feet: 6.5 / 2.5 = 2.6 ≈ 3 locations
    const locations = Math.ceil(totalLengthFt / 2.5);
    const quantity = locations * pcsPerLocation;
    
    // Minimum 6 pcs for any length > 0 (for 3 locations × 2 pcs = 6 pcs)
    if (totalLengthFt > 0 && quantity < 6) {
      return 6;
    }
    
    return quantity;
  }
  
  updateDisplays(areaSqft, totalLengthFt) {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    // Update area display
    let areaEl = container.querySelector('#calc-area-display');
    if (!areaEl) {
      areaEl = document.querySelector(`#${this.containerId} #calc-area-display`);
    }
    if (areaEl) {
      areaEl.textContent = areaSqft > 0 ? `${areaSqft.toFixed(2)} sq.ft` : '0.00 sq.ft';
    }
    
    // Update length display
    let lengthEl = container.querySelector('#calc-length-display');
    if (!lengthEl) {
      lengthEl = document.querySelector(`#${this.containerId} #calc-length-display`);
    }
    if (lengthEl) {
      const lengthRmt = totalLengthFt / this.FEET_PER_METER;
      lengthEl.textContent = `Total Length: ${totalLengthFt.toFixed(2)} rft / ${lengthRmt.toFixed(2)} rmt`;
    }
  }
  
  calculate() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    // Step 1: Get user inputs
    const totalLengthFt = this.getTotalLengthFt();
    const heightFt = this.getHeightFt();
    
    // Step 2: Calculate area = height × total length
    const areaSqft = totalLengthFt * heightFt;
    
    // Step 3: ALWAYS update displays first (even if 0)
    this.updateDisplays(areaSqft, totalLengthFt);
    
    // Step 4: If no valid inputs, show zeros in results
    if (totalLengthFt <= 0 || heightFt <= 0) {
      this.displayResults(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      return;
    }
    
    // Step 5: Get glass selection and rate
    const glassSelect = container.querySelector('#calc-glass');
    const glassKey = glassSelect?.value || '12mm';
    const glassRatePerSqft = this.GLASS_RATES[glassKey] || 0;
    
    // Step 6: Calculate glass cost with wastage
    let glassAreaWithWastage = areaSqft;
    if (this.GLASS_WASTAGE_PERCENT > 0) {
      glassAreaWithWastage = areaSqft * (1 + this.GLASS_WASTAGE_PERCENT / 100);
    }
    
    // Step 7: Glass rate per RFT = (area sqft × glass rate per sqft) ÷ total length rft
    const glassCostTotal = glassAreaWithWastage * glassRatePerSqft;
    const glassRatePerRft = totalLengthFt > 0 ? glassCostTotal / totalLengthFt : 0;
    
    // Step 8: Get bottom profile rate per RFT (or pillar/bracket/stud)
    const bottomProfile = this.getSelectedBottomProfile();
    const bottomFinish = this.getBottomFinish();
    let bottomProfileRatePerRft = 0;
    let bottomProfileCost = 0;
    let pillarBracketCost = 0;
    let pillarBracketQty = 0;
    let studCost = 0;
    let studQty = 0;
    
    if (bottomProfile) {
      if (this.isPillarBracket(bottomProfile)) {
        // It's a pillar/bracket - calculate by quantity
        pillarBracketQty = this.calculatePillarBracketQuantity(totalLengthFt, bottomProfile);
        const pillarCoatingRate = bottomProfile.coatingRates?.[bottomFinish] || 0;
        const pillarRatePerPc = (bottomProfile.baseRate || 0) + pillarCoatingRate;
        pillarBracketCost = pillarRatePerPc * pillarBracketQty;
        bottomProfileCost = pillarBracketCost;
        bottomProfileRatePerRft = totalLengthFt > 0 ? pillarBracketCost / totalLengthFt : 0;
      } else if (this.isStud(bottomProfile)) {
        // It's a stud - calculate by quantity
        studQty = this.calculateStudQuantity(totalLengthFt, bottomProfile);
        const studCoatingRate = bottomProfile.coatingRates?.[bottomFinish] || 0;
        const studRatePerPc = (bottomProfile.baseRate || 0) + studCoatingRate;
        studCost = studRatePerPc * studQty;
        bottomProfileCost = studCost;
        bottomProfileRatePerRft = totalLengthFt > 0 ? studCost / totalLengthFt : 0;
      } else {
        // Regular bottom profile - calculate per RFT
        const bottomCoatingRate = bottomProfile.coatingRates?.[bottomFinish] || 0;
        bottomProfileRatePerRft = (bottomProfile.baseRate || 0) + bottomCoatingRate;
        bottomProfileCost = bottomProfileRatePerRft * totalLengthFt;
      }
    }
    
    // Step 9: Get handrail (top) rate per RFT
    const handrail = this.getSelectedHandrail();
    const handrailFinish = this.getHandrailFinish();
    let handrailRatePerRft = handrail?.baseRate || 0;
    if (handrail?.material === 'aluminium') {
      const handrailCoatingRate = handrail?.coatingRates?.[handrailFinish] || 0;
      handrailRatePerRft += handrailCoatingRate;
    }
    
    // Step 10: Get other rates per RFT
    const hardwarePackageRatePerRft = this.HARDWARE_PACKAGE_PER_RFT || 0;
    const anchorBoltRatePerRft = this.ANCHOR_BOLT_PER_RFT || 0;
    const installationRatePerRft = this.INSTALLATION_PER_RFT || 0;
    
    // Step 11: Calculate package rate per RFT
    const packageRatePerRft = glassRatePerRft + 
                                bottomProfileRatePerRft + 
                                handrailRatePerRft + 
                                hardwarePackageRatePerRft + 
                                anchorBoltRatePerRft + 
                                installationRatePerRft;
    
    // Step 12: Calculate total amount = package rate per rft × total length
    const totalAmount = packageRatePerRft * totalLengthFt;
    
    // Step 13: Calculate individual costs for display
    const glassCost = glassRatePerRft * totalLengthFt;
    const handrailCost = handrailRatePerRft * totalLengthFt;
    const hardwareCost = hardwarePackageRatePerRft * totalLengthFt;
    const anchorBoltCost = anchorBoltRatePerRft * totalLengthFt;
    const installationCost = installationRatePerRft * totalLengthFt;
    
    // Step 14: Store calculated amounts
    this.lastCalculatedAmounts = {
      glassCost,
      bottomProfileCost,
      handrailCost,
      hardwareCost,
      anchorBoltCost,
      installationCost,
      pillarBracketCost,
      pillarBracketQty,
      studCost,
      studQty,
      totalCost: totalAmount,
      packageRatePerRft
    };
    
    // Step 15: Display results
    this.displayResults(glassCost, bottomProfileCost, handrailCost, hardwareCost, anchorBoltCost, installationCost, totalAmount, packageRatePerRft, pillarBracketCost, pillarBracketQty, studCost, studQty);
  }
  
  formatCurrency(amount) {
    if (typeof window.formatPriceFromINR === 'function') {
      return window.formatPriceFromINR(amount);
    }
    return '\u20B9' + Math.round(amount).toLocaleString('en-IN');
  }

  formatRange(min, max) {
    if (typeof window.formatPriceRangeFromINR === 'function') {
      return window.formatPriceRangeFromINR(min, max);
    }
    return this.formatCurrency(min) + ' - ' + this.formatCurrency(max);
  }
  
  formatAmount(amount) {
    if (this.userDetailsSubmitted) {
      return this.formatCurrency(amount);
    } else {
      const min = amount * 0.8;
      const max = amount * 1.2;
      return this.formatRange(min, max);
    }
  }
  
  displayResults(glassCost, bottomProfileCost, handrailCost, hardwareCost, anchorBoltCost, installationCost, totalAmount, packageRatePerRft, pillarBracketCost = 0, pillarBracketQty = 0, studCost = 0, studQty = 0) {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    // Convert RFT to RMT for rates
    const packageRatePerRmt = packageRatePerRft * this.FEET_PER_METER;
    
    const perRftEl = container.querySelector('#calc-result-per-rft');
    const glassEl = container.querySelector('#calc-result-glass');
    const bottomEl = container.querySelector('#calc-result-bottom');
    const handrailEl = container.querySelector('#calc-result-handrail');
    const hardwareEl = container.querySelector('#calc-result-hardware');
    const anchorEl = container.querySelector('#calc-result-anchor');
    const installationEl = container.querySelector('#calc-result-install') || container.querySelector('#calc-result-installation');
    const pillarRow = container.querySelector('#calc-result-pillar-row');
    const pillarEl = container.querySelector('#calc-result-pillar');
    const pillarQtyEl = container.querySelector('#calc-result-pillar-qty');
    const studRow = container.querySelector('#calc-result-stud-row');
    const studEl = container.querySelector('#calc-result-stud');
    const studQtyEl = container.querySelector('#calc-result-stud-qty');
    const totalEl = container.querySelector('#calc-result-total');
    
    // Display package rate with both RFT and RMT
    if (perRftEl) {
      const formattedRft = this.formatAmount(packageRatePerRft);
      const formattedRmt = this.formatAmount(packageRatePerRmt);
      perRftEl.textContent = `${formattedRft} / rft (${formattedRmt} / rmt)`;
    }
    
    if (glassEl) glassEl.textContent = this.formatAmount(glassCost);
    
    // Display bottom profile with quantity if it's pillar/bracket or stud
    if (bottomEl) {
      const bottomProfile = this.getSelectedBottomProfile();
      if (pillarBracketQty > 0) {
        bottomEl.textContent = `${this.formatAmount(bottomProfileCost)} (${pillarBracketQty} pcs)`;
      } else if (studQty > 0) {
        bottomEl.textContent = `${this.formatAmount(bottomProfileCost)} (${studQty} pcs)`;
      } else {
        bottomEl.textContent = this.formatAmount(bottomProfileCost);
      }
    }
    
    if (handrailEl) handrailEl.textContent = this.formatAmount(handrailCost);
    if (hardwareEl) hardwareEl.textContent = this.formatAmount(hardwareCost);
    if (anchorEl) anchorEl.textContent = this.formatAmount(anchorBoltCost);
    if (installationEl) installationEl.textContent = this.formatAmount(installationCost);
    
    // Hide separate pillar/bracket and stud rows (they're now part of bottom profile)
    if (pillarRow) pillarRow.style.display = 'none';
    if (studRow) studRow.style.display = 'none';
    
    if (totalEl) {
      totalEl.textContent = this.formatAmount(totalAmount);
      totalEl.setAttribute('data-wm-inr-total', String(Math.round(totalAmount)));
    }
  }

  getSelectLabel(selectId) {
    const container = document.getElementById(this.containerId);
    if (!container) return '';
    const sel = container.querySelector('#' + selectId);
    if (!sel || !sel.options || sel.selectedIndex < 0) return '';
    return String(sel.options[sel.selectedIndex].textContent || '').replace(/\s+/g, ' ').trim();
  }

  getFinishLabel(finish) {
    const map = {
      plain: 'Plain powder coating',
      wooden: 'Wooden powder coating',
      texture: 'Texture finish'
    };
    return map[finish] || finish || '—';
  }

  getIndividualLengthLines() {
    const container = document.getElementById(this.containerId);
    if (!container) return [];
    const unit = this.getUnit();
    const lengthsContainer = container.querySelector('#calc-lengths-container');
    if (!lengthsContainer) return [];
    const lines = [];
    lengthsContainer.querySelectorAll('.calc-length-input').forEach((input, index) => {
      const raw = parseFloat(String(input.value || '').trim());
      if (!(raw > 0)) return;
      const rft = this.convertToFeet(raw, unit);
      lines.push('Run ' + (index + 1) + ': ' + raw + ' ' + unit.toUpperCase() + ' = ' + rft.toFixed(2) + ' rft');
    });
    return lines;
  }

  getAnchorBoltCount(totalLengthFt) {
    if (!(totalLengthFt > 0)) return 0;
    return Math.ceil(totalLengthFt / 2);
  }

  /** Structured snapshot for project estimate / PDF print (amounts only, no hidden rates). */
  getQuoteSnapshot() {
    const totalLengthFt = this.getTotalLengthFt();
    const heightFt = this.getHeightFt();
    if (!(totalLengthFt > 0) || !(heightFt > 0)) return null;

    const amounts = this.lastCalculatedAmounts || {};
    const totalCost = Math.round(amounts.totalCost || 0);
    if (!(totalCost > 0)) return null;

    const unit = this.getUnit();
    const lengthRmt = totalLengthFt / this.FEET_PER_METER;
    const areaSqft = totalLengthFt * heightFt;
    const glassKey = this.getSelectLabel('calc-glass') || '—';
    const bottomProfile = this.getSelectedBottomProfile();
    const bottomFinish = this.getBottomFinish();
    const handrail = this.getSelectedHandrail();
    const handrailFinish = this.getHandrailFinish();
    const pillarQty = amounts.pillarBracketQty || 0;
    const studQty = amounts.studQty || 0;
    const anchorCount = this.getAnchorBoltCount(totalLengthFt);
    const fmt = (n) => this.formatCurrency(Math.round(n || 0));

    const lengthLines = this.getIndividualLengthLines();
    const details = [
      { label: 'Product', value: this.config.name || this.productId },
      { label: 'Height', value: heightFt.toFixed(2) + ' ft' },
      lengthLines.length
        ? { label: 'Length runs', value: lengthLines.join(' · ') }
        : null,
      { label: 'Total length', value: totalLengthFt.toFixed(2) + ' rft (' + lengthRmt.toFixed(2) + ' rmt)' },
      { label: 'Glass area', value: areaSqft.toFixed(2) + ' sq.ft' + (this.GLASS_WASTAGE_PERCENT > 0 ? ' (incl. ' + this.GLASS_WASTAGE_PERCENT + '% wastage)' : '') },
      { label: 'Glass type', value: glassKey },
      bottomProfile
        ? {
            label: this.isPillarBracket(bottomProfile) ? 'Bottom (pillar / balustrade)' : this.isStud(bottomProfile) ? 'Bottom (vertical stud)' : 'Bottom profile',
            value: bottomProfile.label + (bottomProfile.id !== 'none' ? ' · ' + this.getFinishLabel(bottomFinish) : '')
          }
        : { label: 'Bottom profile', value: 'No bottom profile' },
      pillarQty > 0 ? { label: 'Pillar / balustrade qty', value: pillarQty + ' pcs' } : null,
      studQty > 0 ? { label: 'Stud qty', value: studQty + ' pcs (both sides)' } : null,
      {
        label: 'Handrail (top)',
        value: (handrail?.label || '—') + (handrail?.material === 'aluminium' ? ' · ' + this.getFinishLabel(handrailFinish) : '')
      },
      { label: 'Hardware package', value: 'Wall + 180° + 90° connectors · ' + fmt(amounts.hardwareCost) },
      { label: 'Anchor bolts', value: anchorCount + ' pcs · ' + fmt(amounts.anchorBoltCost) },
      { label: 'Installation', value: fmt(amounts.installationCost) },
      { label: 'Glass cost', value: fmt(amounts.glassCost) },
      bottomProfile ? { label: 'Bottom profile cost', value: fmt(amounts.bottomProfileCost) + (pillarQty > 0 ? ' (' + pillarQty + ' pcs)' : studQty > 0 ? ' (' + studQty + ' pcs)' : '') } : null,
      { label: 'Handrail cost', value: fmt(amounts.handrailCost) },
      { label: 'Estimated total', value: fmt(totalCost) }
    ].filter(Boolean);

    const productKey = this.productId;
    return {
      productKey: productKey,
      productName: this.config.name || productKey,
      category: 'Glass Railing',
      details: details,
      specs: details.map(function (d) { return d.label + ': ' + d.value; }),
      area: totalLengthFt.toFixed(2) + ' rft running · height ' + heightFt.toFixed(2) + ' ft',
      railingRft: totalLengthFt,
      railingHeightFt: heightFt,
      exactAmount: totalCost,
      amount: fmt(totalCost),
      range: { min: totalCost, max: totalCost },
      pageUrl: typeof location !== 'undefined' ? location.href : '',
      ts: Date.now()
    };
  }
  
  setupFormSubmission() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    const form = container.querySelector('form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitUserDetails();
    });
  }
  
  submitUserDetails() {
    if (this.isSubmittingEmail) return;
    
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    // Try both ID formats for compatibility
    const nameInput = container.querySelector('#calc-user-name') || container.querySelector('#calc-name');
    const cityInput = container.querySelector('#calc-user-city') || container.querySelector('#calc-city');
    const mobileInput = container.querySelector('#calc-user-mobile') || container.querySelector('#calc-mobile');
    const emailInput = container.querySelector('#calc-user-email') || container.querySelector('#calc-email');
    
    const name = nameInput?.value?.trim() || '';
    const city = cityInput?.value?.trim() || '';
    const mobile = mobileInput?.value?.trim() || '';
    const email = emailInput?.value?.trim() || '';
    
    if (!name || !city || !mobile) {
      alert('Please fill in Name, City, and Mobile number.');
      // Focus on the first empty field
      if (!name && nameInput) nameInput.focus();
      else if (!city && cityInput) cityInput.focus();
      else if (!mobile && mobileInput) mobileInput.focus();
      return;
    }
    
    this.userDetailsSubmitted = true;
    this.isSubmittingEmail = true;
    
    // Recalculate to show exact amounts
    this.calculate();
    
    // Send email
    this.sendEmail({ name, city, mobile, email });
  }
  
  async sendEmail(userDetails) {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    const totalLengthFt = this.getTotalLengthFt();
    const heightFt = this.getHeightFt();
    const areaSqft = totalLengthFt * heightFt;
    const unit = this.getUnit();
    const lengthRmt = totalLengthFt / this.FEET_PER_METER;
    
    // Get all individual lengths
    const lengthsContainer = container.querySelector('#calc-lengths-container');
    const lengthInputs = lengthsContainer ? lengthsContainer.querySelectorAll('.calc-length-input') : [];
    const individualLengths = [];
    lengthInputs.forEach((input, index) => {
      const value = parseFloat(input.value) || 0;
      if (value > 0) {
        const lengthFt = unit === 'rmt' ? value * this.FEET_PER_METER : value;
        const lengthRmt = lengthFt / this.FEET_PER_METER;
        individualLengths.push({
          input: value,
          rft: lengthFt.toFixed(2),
          rmt: lengthRmt.toFixed(2)
        });
      }
    });
    
    const glassSelect = container.querySelector('#calc-glass');
    const glassKey = glassSelect?.value || '12mm';
    const glassRatePerSqft = this.GLASS_RATES[glassKey] || 0;
    
    const bottomProfile = this.getSelectedBottomProfile();
    const bottomFinish = this.getBottomFinish();
    let bottomProfileRatePerRft = 0;
    let bottomCoatingRate = 0;
    let pillarBracketQty = 0;
    let studQty = 0;
    
    if (bottomProfile) {
      if (this.isPillarBracket(bottomProfile)) {
        pillarBracketQty = this.calculatePillarBracketQuantity(totalLengthFt, bottomProfile);
        bottomCoatingRate = bottomProfile.coatingRates?.[bottomFinish] || 0;
        const pillarRatePerPc = (bottomProfile.baseRate || 0) + bottomCoatingRate;
        const pillarBracketCost = pillarRatePerPc * pillarBracketQty;
        bottomProfileRatePerRft = totalLengthFt > 0 ? pillarBracketCost / totalLengthFt : 0;
      } else if (this.isStud(bottomProfile)) {
        studQty = this.calculateStudQuantity(totalLengthFt, bottomProfile);
        bottomCoatingRate = bottomProfile.coatingRates?.[bottomFinish] || 0;
        const studRatePerPc = (bottomProfile.baseRate || 0) + bottomCoatingRate;
        const studCost = studRatePerPc * studQty;
        bottomProfileRatePerRft = totalLengthFt > 0 ? studCost / totalLengthFt : 0;
      } else {
        bottomCoatingRate = bottomProfile.coatingRates?.[bottomFinish] || 0;
        bottomProfileRatePerRft = (bottomProfile.baseRate || 0) + bottomCoatingRate;
      }
    }
    
    const handrail = this.getSelectedHandrail();
    const handrailFinish = this.getHandrailFinish();
    let handrailRatePerRft = handrail?.baseRate || 0;
    if (handrail?.material === 'aluminium') {
      const handrailCoatingRate = handrail?.coatingRates?.[handrailFinish] || 0;
      handrailRatePerRft += handrailCoatingRate;
    }
    
    const amounts = this.lastCalculatedAmounts || {};
    const packageRatePerRft = amounts.packageRatePerRft || 0;
    
    // Calculate glass area with wastage
    let glassAreaWithWastage = areaSqft;
    if (this.GLASS_WASTAGE_PERCENT > 0) {
      glassAreaWithWastage = areaSqft * (1 + this.GLASS_WASTAGE_PERCENT / 100);
    }
    
    const emailBody = `
═══════════════════════════════════════════════════════
NEW QUOTE REQUEST - GLASS RAILING CALCULATOR
═══════════════════════════════════════════════════════

👤 USER DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Name: ${userDetails.name}
• City: ${userDetails.city}
• Mobile: ${userDetails.mobile}
${userDetails.email ? `• Email: ${userDetails.email}` : ''}

📦 PRODUCT INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Product: ${this.config.name || this.productId}
• Unit: ${unit.toUpperCase()}

📏 SIZE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Height: ${heightFt.toFixed(2)} ft

• Individual Lengths:
${individualLengths.length > 0 ? individualLengths.map((len, idx) => `  ${idx + 1}. Length ${idx + 1}: ${len.input} ${unit} = ${len.rft} rft / ${len.rmt} rmt`).join('\n') : '  No lengths entered'}

• Total Length: ${totalLengthFt.toFixed(2)} rft / ${lengthRmt.toFixed(2)} rmt
• Glass Area: ${areaSqft.toFixed(2)} sq.ft
${this.GLASS_WASTAGE_PERCENT > 0 ? `• Glass Area (with ${this.GLASS_WASTAGE_PERCENT}% wastage): ${glassAreaWithWastage.toFixed(2)} sq.ft` : ''}

🎨 MATERIAL SELECTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Glass Type: ${glassKey}
• Bottom Profile: ${bottomProfile ? bottomProfile.label : 'No Bottom Profile'}
• Bottom Finish: ${bottomProfile ? bottomFinish : 'N/A'}
${pillarBracketQty > 0 ? `• Quantity: ${pillarBracketQty} pcs (installed every 3 steps)` : ''}
${studQty > 0 ? `• Quantity: ${studQty} pcs (vertical studs on both sides)` : ''}
• Handrail: ${handrail?.label || 'N/A'}
${handrail?.material === 'aluminium' ? `• Handrail Finish: ${handrailFinish}` : '• Handrail Finish: N/A (SS handrail)'}

💰 PACKAGE RATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Package Rate per RFT: ${this.formatCurrency(packageRatePerRft)} per rft
• Package Rate per RMT: ${this.formatCurrency(packageRatePerRft * this.FEET_PER_METER)} per rmt

💵 COST BREAKDOWN (Total):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Glass Cost: ${this.formatCurrency(Math.round(amounts.glassCost || 0))}
${bottomProfile ? (() => {
  if (pillarBracketQty > 0) {
    return `• Bottom Profile Cost (Pillar/Bracket): ${this.formatCurrency(Math.round(amounts.bottomProfileCost || 0))} (${pillarBracketQty} pcs)`;
  } else if (studQty > 0) {
    return `• Bottom Profile Cost (Stud): ${this.formatCurrency(Math.round(amounts.bottomProfileCost || 0))} (${studQty} pcs)`;
  } else {
    return `• Bottom Profile Cost: ${this.formatCurrency(Math.round(amounts.bottomProfileCost || 0))}`;
  }
})() : '• Bottom Profile Cost: Not selected'}
• Handrail Cost: ${this.formatCurrency(Math.round(amounts.handrailCost || 0))}
• Hardware Package: ${this.formatCurrency(Math.round(amounts.hardwareCost || 0))}
• Anchor Bolts: ${this.formatCurrency(Math.round(amounts.anchorBoltCost || 0))}
• Installation: ${this.formatCurrency(Math.round(amounts.installationCost || 0))}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• TOTAL ESTIMATED COST: ${this.formatCurrency(Math.round(amounts.totalCost || 0))}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 NOTES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Hardware package includes wall connector, 180° connector, and 90° connector
• Anchor bolts are calculated at 1 pc per 2 rft
• Installation charges are included in package rate. Shifting/lifting extra as per actual
${this.GLASS_WASTAGE_PERCENT > 0 ? `• Glass wastage of ${this.GLASS_WASTAGE_PERCENT}% included in calculation` : ''}
${this.productId === 'glass-railing-staircase' ? '• Customer responsible for 8-10mm ply/MDF board template' : ''}
${pillarBracketQty > 0 ? `• Bottom Profile (Pillar/Bracket): ${bottomProfile.label} - ${pillarBracketQty} pcs installed every 3 steps (approximately every 2.5 feet)` : ''}
${studQty > 0 ? `• Bottom Profile (Stud): ${bottomProfile.label} - ${studQty} pcs installed vertically on both sides (approximately 1 location per RFT, 2 pcs per location)` : ''}

═══════════════════════════════════════════════════════
Generated from Glass Railing Calculator on WoodenMax.in
═══════════════════════════════════════════════════════
    `.trim();
    
    if (window.EmailSubmitter) {
      window.EmailSubmitter.submit({
        subject: 'New Quote - Glass Railing',
        message: emailBody,
        userDetails: userDetails,
        onSuccess: () => {
          this.showSuccessMessage();
          this.isSubmittingEmail = false;
        },
        onError: (e) => {
          console.error('Quote email failed:', e);
          alert('Could not send email. Please try again or call +91 789-5328080.');
          this.isSubmittingEmail = false;
        }
      });
    } else {
      console.error('EmailSubmitter not found');
      // Show success message anyway (user experience)
      this.showSuccessMessage();
      this.isSubmittingEmail = false;
    }
  }
  
  showSuccessMessage() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    const successMsg = container.querySelector('.calc-success-message');
    if (successMsg) {
      successMsg.style.display = 'block';
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// Initialize calculator for glass railing products
(function() {
  const originalInitCalculator = window.initCalculator;
  
  // Override initCalculator to handle glass railing products
  const glassRailingInitCalculator = async function(productId, containerId = null) {
    if (productId === 'glass-railing-balcony' || productId === 'glass-railing-staircase') {
      try {
        const instanceKey = `calculator_${productId}`;
        if (window[instanceKey] && window[instanceKey] instanceof GlassRailingCalculator) {
          return window[instanceKey];
        }
        
        if (typeof productManager === 'undefined') {
          console.error('❌ productManager not found');
          return null;
        }
        
        const productData = await productManager.getProduct(productId);
        if (!productData) {
          console.error('❌ Product data not found:', productId);
          return null;
        }
        
        const calcContainerId = containerId || `price-calculator-${productId}`;
        const container = document.getElementById(calcContainerId);
        if (!container) {
          console.error('❌ Container not found:', calcContainerId);
          return null;
        }
        
        const calculator = new GlassRailingCalculator(productId, productData, calcContainerId);
        window[instanceKey] = calculator;
        return calculator;
      } catch (error) {
        console.error('❌ Error initializing glass railing calculator:', error);
        console.error('Error stack:', error.stack);
        return null;
      }
    } else if (originalInitCalculator) {
      return originalInitCalculator(productId, containerId);
    }
    return null;
  };
  
  // Set the function immediately - make sure it's our function
  window.initCalculator = glassRailingInitCalculator;
  
  // Make it non-configurable to prevent override
  try {
    Object.defineProperty(window, 'initCalculator', {
      value: glassRailingInitCalculator,
      writable: false,
      configurable: false
    });
  } catch (e) {
    // Silent fail - function still works
  }
  
  // Auto-initialize calculators
  const initGlassRailingCalculator = async (productId) => {
    const containerId = `price-calculator-${productId}`;
    const container = document.getElementById(containerId);
    
    if (!container) {
      return;
    }
    
    if (typeof productManager === 'undefined') {
      setTimeout(() => initGlassRailingCalculator(productId), 200);
      return;
    }
    
    const instanceKey = `calculator_${productId}`;
    const existing = window[instanceKey];
    if (!existing || !(existing instanceof GlassRailingCalculator)) {
      try {
        await window.initCalculator(productId);
      } catch (err) {
        console.error('❌ Error initializing glass railing calculator:', err);
      }
    }
  };
  
  // Initialize calculators - only for containers that exist on current page
  const initializeCalculators = () => {
    const balconyContainer = document.getElementById('price-calculator-glass-railing-balcony');
    const staircaseContainer = document.getElementById('price-calculator-glass-railing-staircase');
    
    if (balconyContainer) {
      const instanceKey = 'calculator_glass-railing-balcony';
      if (!window[instanceKey]) {
        initGlassRailingCalculator('glass-railing-balcony');
      }
    }
    
    if (staircaseContainer) {
      const instanceKey = 'calculator_glass-railing-staircase';
      if (!window[instanceKey]) {
        initGlassRailingCalculator('glass-railing-staircase');
      }
    }
  };
  
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeCalculators, 500);
      setTimeout(initializeCalculators, 1000);
    });
  } else {
    setTimeout(initializeCalculators, 500);
    setTimeout(initializeCalculators, 1000);
  }
  
  // Also try after window load
  window.addEventListener('load', () => {
    setTimeout(initializeCalculators, 500);
  });
})();
