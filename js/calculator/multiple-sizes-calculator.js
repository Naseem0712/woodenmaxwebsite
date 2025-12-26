/**
 * Multiple Sizes Calculator - Global Reusable Component
 * Allows users to input multiple width/height/quantity combinations
 * with per-row selections and auto-apply functionality
 */

(function() {
  'use strict';
  
  let sizeRowCounter = 0;
  let calculatorInstance = null;
  
  // Store selections for each row
  const rowSelections = new Map(); // rowId -> {glass, coating, lock, mesh, unit}
  
  // Expose rowSelections globally for email submission
  window.rowSelections = rowSelections;
  
  // Track if we're in auto-apply mode (when adding new row)
  let isAutoApplying = false;
  
  // Get current global selections
  function getCurrentSelections() {
    return {
      glass: document.getElementById('calc-glass')?.value || '6mm',
      coating: document.getElementById('calc-coating')?.value || 'texture',
      lock: document.getElementById('calc-lock')?.value || 'single',
      mesh: document.getElementById('calc-mesh')?.checked || false,
      unit: document.getElementById('calc-unit')?.value || 'ft'
    };
  }
  
  // Store selections for a row
  function storeRowSelections(rowId, selections) {
    rowSelections.set(rowId, { ...selections });
    checkAndShowSyncButton();
  }
  
  // Get stored selections for a row
  function getRowSelections(rowId) {
    return rowSelections.get(rowId) || getCurrentSelections();
  }
  
  // Check if all rows have same selections
  function areSelectionsSynced() {
    const rows = document.querySelectorAll('.calc-size-row');
    if (rows.length <= 1) return true;
    
    const firstRowId = rows[0].id;
    const firstSelections = getRowSelections(firstRowId);
    const currentSelections = getCurrentSelections();
    
    // Check if current selections match first row
    if (JSON.stringify(firstSelections) !== JSON.stringify(currentSelections)) {
      return false;
    }
    
    // Check if all rows have same selections
    for (let i = 1; i < rows.length; i++) {
      const rowId = rows[i].id;
      const rowSelections = getRowSelections(rowId);
      if (JSON.stringify(rowSelections) !== JSON.stringify(firstSelections)) {
        return false;
      }
    }
    
    return true;
  }
  
  // Show/hide sync button based on selection differences
  function checkAndShowSyncButton() {
    const syncBtn = document.getElementById('calc-sync-selections-btn');
    if (!syncBtn) return;
    
    if (areSelectionsSynced()) {
      syncBtn.style.display = 'none';
    } else {
      syncBtn.style.display = 'flex';
    }
  }
  
  // Apply current selections to all rows
  function applySelectionsToAll() {
    const currentSelections = getCurrentSelections();
    const rows = document.querySelectorAll('.calc-size-row');
    
    console.log('Applying selections to all rows:', currentSelections);
    
    rows.forEach(row => {
      const rowId = row.id;
      storeRowSelections(rowId, currentSelections);
    });
    
    // Recalculate all rows with new selections
    recalculateAll();
    
    // Hide sync button after applying
    const syncBtn = document.getElementById('calc-sync-selections-btn');
    if (syncBtn) {
      syncBtn.style.display = 'none';
    }
    
    console.log('✅ Selections applied to all rows successfully');
  }
  
  // Try to get calculator instance (non-blocking)
  function tryGetCalculatorInstance() {
    // Find calculator container to get product ID
    const calcContainer = document.querySelector('.price-calculator-container[data-product]') ||
                         document.querySelector('[id*="price-calculator"][data-product]') ||
                         document.querySelector('[id*="calculator"][data-product]');
    
    if (calcContainer) {
      const productId = calcContainer.getAttribute('data-product');
      if (productId) {
        const instanceKey = `calculator_${productId}`;
        calculatorInstance = window[instanceKey] || null;
        
        if (calculatorInstance) {
          console.log(`✅ Calculator instance found for: ${productId}`);
          recalculateAll();
          return;
        }
      }
    }
    
    // Fallback: Try to find any calculator instance
    const allKeys = Object.keys(window);
    for (const key of allKeys) {
      if (key.startsWith('calculator_') && window[key] && typeof window[key].calculatePrice === 'function') {
        calculatorInstance = window[key];
        console.log(`✅ Calculator instance found via fallback: ${key}`);
        recalculateAll();
        return;
      }
    }
    
    // Retry after a delay (max 10 seconds to allow for async loading)
    const elapsed = Date.now() - (window.calcInitStartTime || Date.now());
    if (elapsed < 10000) {
      setTimeout(tryGetCalculatorInstance, 500);
    } else {
      console.log('⚠️ Calculator instances not available after 10s, using fallback rates');
    }
  }
  
  function convertToSqft(width, height, unit) {
    // Linear unit conversions to feet
    const linearToFeet = {
      'mm': 0.00328084,     // 1 mm = 0.00328084 ft
      'cm': 0.0328084,     // 1 cm = 0.0328084 ft
      'inch': 0.0833333,   // 1 inch = 1/12 ft = 0.0833333 ft
      'ft': 1,             // 1 ft = 1 ft
      'm': 3.28084,        // 1 m = 3.28084 ft
      'ft-in': 1           // Will handle separately
    };
    
    if (unit === 'ft-in') {
      // Parse feet and inches format (e.g., "6'8" or "6 8")
      // For now, treat as feet
      return width * height;
    }
    
    // Convert linear dimensions to feet, then multiply for area
    const factor = linearToFeet[unit] || 1;
    const widthInFt = width * factor;
    const heightInFt = height * factor;
    const areaSqft = widthInFt * heightInFt;
    
    return areaSqft;
  }
  
  function calculateRowCost(areaSqft, qty, glassOption, coatingOption, lockOption, hasMesh) {
    // Fallback rates (use these if calculator instance not available)
    const FALLBACK_BASE_RATE = 750;
    const FALLBACK_HARDWARE = 2200;
    const FALLBACK_GLASS_RATES = {
      '8mm': 30,
      '10mm': 50,
      '12mm': 80,
      'dgu': 180,
      'dgu-20mm': 180,
      'safety': 220,
      'safety-13.52mm': 220
    };
    const FALLBACK_COATING_RATES = {
      'wooden': 65
    };
    const FALLBACK_MESH_RATE = 120;
    const FALLBACK_LOCK_RATES = {
      'multi': 1200,
      'multiPoint': 1200
    };
    
    // Use calculator instance rates if available, otherwise use fallback
    const BASE_RATE = calculatorInstance?.BASE_RATE_PER_SQFT || FALLBACK_BASE_RATE;
    const BASE_HARDWARE = calculatorInstance?.BASE_HARDWARE_COST || FALLBACK_HARDWARE;
    
    // Base cost per window
    let baseCostPerWindow = (BASE_RATE * areaSqft) + BASE_HARDWARE;
    
    // Add-ons per sqft
    let addOnsPerSqft = 0;
    
    // Glass add-ons
    if (glassOption !== '6mm') {
      let glassKey = glassOption;
      if (glassOption === '8mm') glassKey = '8mm';
      else if (glassOption === '10mm') glassKey = '10mm';
      else if (glassOption === '12mm') glassKey = '12mm';
      else if (glassOption === 'dgu' || glassOption === 'dgu-20mm') glassKey = 'dgu';
      else if (glassOption === 'safety' || glassOption === 'safety-13.52mm') glassKey = 'safety';
      
      // Try calculator instance first, then fallback
      if (calculatorInstance?.GLASS_RATES?.[glassKey]) {
        addOnsPerSqft += calculatorInstance.GLASS_RATES[glassKey];
      } else if (FALLBACK_GLASS_RATES[glassKey]) {
        addOnsPerSqft += FALLBACK_GLASS_RATES[glassKey];
      }
    }
    
    // Coating add-ons
    if (coatingOption === 'wooden') {
      if (calculatorInstance?.COATING_RATES?.wooden) {
        addOnsPerSqft += calculatorInstance.COATING_RATES.wooden;
      } else if (FALLBACK_COATING_RATES.wooden) {
        addOnsPerSqft += FALLBACK_COATING_RATES.wooden;
      }
    }
    
    // Mesh add-on
    if (hasMesh) {
      if (typeof calculatorInstance?.MESH_RATE === 'number' && calculatorInstance.MESH_RATE > 0) {
        addOnsPerSqft += calculatorInstance.MESH_RATE;
      } else if (calculatorInstance?.MESH_RATES?.standard) {
        addOnsPerSqft += calculatorInstance.MESH_RATES.standard;
      } else {
        addOnsPerSqft += FALLBACK_MESH_RATE;
      }
    }
    
    // Lock add-ons (per window)
    let lockAdditionPerWindow = 0;
    if (lockOption === 'multi') {
      if (calculatorInstance?.LOCK_RATES?.multiPoint) {
        lockAdditionPerWindow = calculatorInstance.LOCK_RATES.multiPoint;
      } else if (FALLBACK_LOCK_RATES.multiPoint) {
        lockAdditionPerWindow = FALLBACK_LOCK_RATES.multiPoint;
      }
    }
    
    // Calculate per window cost
    const addOnsCost = addOnsPerSqft * areaSqft;
    const perWindowCost = baseCostPerWindow + addOnsCost + lockAdditionPerWindow;
    
    // Total for this row
    const totalCost = perWindowCost * qty;
    
    return totalCost;
  }
  
  function recalculateRow(rowId) {
    const row = document.getElementById(rowId);
    if (!row) {
      return;
    }
    
    const widthInput = row.querySelector('.calc-size-width');
    const heightInput = row.querySelector('.calc-size-height');
    const qtyInput = row.querySelector('.calc-size-qty');
    const amountDisplay = row.querySelector('.row-amount-text');
    
    if (!widthInput || !heightInput || !qtyInput || !amountDisplay) {
      return;
    }
    
    const width = parseFloat(widthInput.value) || 0;
    const height = parseFloat(heightInput.value) || 0;
    const qty = parseInt(qtyInput.value) || 1;
    
    // Get options from stored selections for this row (not global)
    const rowSelections = getRowSelections(rowId);
    const unit = rowSelections.unit;
    
    // Calculate area immediately (even if 0)
    const areaSqft = convertToSqft(width, height, unit);
    const totalAreaForRow = areaSqft * qty;
    
    // Update row area display if exists
    let rowAreaDisplay = row.querySelector('.row-area-text');
    if (!rowAreaDisplay && (width > 0 || height > 0)) {
      // Create area display if doesn't exist
      const areaDiv = document.createElement('div');
      areaDiv.className = 'row-area-text';
      areaDiv.style.cssText = 'grid-column: 1 / -1; font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem;';
      amountDisplay.parentElement.insertBefore(areaDiv, amountDisplay);
      rowAreaDisplay = areaDiv;
    }
    if (rowAreaDisplay) {
      if (width > 0 && height > 0) {
        rowAreaDisplay.textContent = `Area: ${areaSqft.toFixed(2)} sq.ft × ${qty} = ${totalAreaForRow.toFixed(2)} sq.ft`;
      } else {
        rowAreaDisplay.textContent = '';
      }
    }
    
    if (width <= 0 || height <= 0) {
      amountDisplay.textContent = '₹0';
      return;
    }
    
    const glassOption = rowSelections.glass;
    const coatingOption = rowSelections.coating;
    const lockOption = rowSelections.lock;
    const hasMesh = rowSelections.mesh;
    
    // Calculate cost for this row
    const rowCost = calculateRowCost(areaSqft, qty, glassOption, coatingOption, lockOption, hasMesh);
    
    if (rowCost <= 0) {
      amountDisplay.textContent = '₹0';
      return;
    }
    
    // Display amount
    const rangeLow = Math.round(rowCost * 0.8);
    const rangeHigh = Math.round(rowCost * 1.2);
    amountDisplay.textContent = `₹${rangeLow.toLocaleString('en-IN')} - ₹${rangeHigh.toLocaleString('en-IN')}`;
  }
  
  function recalculateAll() {
    const container = document.getElementById('calc-sizes-container');
    if (!container) return;
    
    // Recalculate each row immediately
    const rows = container.querySelectorAll('.calc-size-row');
    rows.forEach(row => {
      const rowId = row.id;
      if (rowId) recalculateRow(rowId);
    });
    
    // Update total area and total amount immediately
    updateTotalArea();
    triggerMainCalculator();
  }
  
  function updateTotalArea() {
    const container = document.getElementById('calc-sizes-container');
    const areaDisplay = document.getElementById('calc-area-display');
    if (!container || !areaDisplay) return;
    
    let totalArea = 0;
    
    container.querySelectorAll('.calc-size-row').forEach(row => {
      const widthInput = row.querySelector('.calc-size-width');
      const heightInput = row.querySelector('.calc-size-height');
      const qtyInput = row.querySelector('.calc-size-qty');
      
      if (widthInput && heightInput && qtyInput) {
        const width = parseFloat(widthInput.value) || 0;
        const height = parseFloat(heightInput.value) || 0;
        const qty = parseInt(qtyInput.value) || 1;
        
        if (width > 0 && height > 0) {
          const rowId = row.id;
          const rowSelections = getRowSelections(rowId);
          const unit = rowSelections.unit;
          const areaSqft = convertToSqft(width, height, unit);
          totalArea += areaSqft * qty;
        }
      }
    });
    
    areaDisplay.textContent = `Total Area: ${totalArea.toFixed(2)} sq.ft`;
  }
  
  function triggerMainCalculator() {
    // Calculate total from all rows
    const container = document.getElementById('calc-sizes-container');
    if (!container) return;
    
    let totalCost = 0;
    let totalArea = 0;
    let totalQty = 0;
    
    container.querySelectorAll('.calc-size-row').forEach(row => {
      const widthInput = row.querySelector('.calc-size-width');
      const heightInput = row.querySelector('.calc-size-height');
      const qtyInput = row.querySelector('.calc-size-qty');
      
      if (widthInput && heightInput && qtyInput) {
        const width = parseFloat(widthInput.value) || 0;
        const height = parseFloat(heightInput.value) || 0;
        const qty = parseInt(qtyInput.value) || 1;
        
        if (width > 0 && height > 0) {
          const rowId = row.id;
          const rowSelections = getRowSelections(rowId);
          const unit = rowSelections.unit;
          
          const areaSqft = convertToSqft(width, height, unit);
          totalArea += areaSqft * qty;
          totalQty += qty;
          
          // Get options from stored selections for this row (not global)
          const glassOption = rowSelections.glass;
          const coatingOption = rowSelections.coating;
          const lockOption = rowSelections.lock;
          const hasMesh = rowSelections.mesh;
          
          // Calculate cost for this row
          const rowCost = calculateRowCost(areaSqft, qty, glassOption, coatingOption, lockOption, hasMesh);
          totalCost += rowCost;
        }
      }
    });
    
    // Update total area display
    const areaDisplay = document.getElementById('calc-area-display');
    if (areaDisplay) {
      areaDisplay.textContent = `Total Area: ${totalArea.toFixed(2)} sq.ft`;
    }
    
    // Update main calculator total display
    updateMainCalculatorDisplay(totalCost, totalArea, totalQty);
  }
  
  function updateMainCalculatorDisplay(totalCost, totalArea, totalQty) {
    // Update the main calculator's total display
    const totalDisplay = document.getElementById('calc-result-total');
    const perWindowDisplay = document.getElementById('calc-result-per-window');
    
    if (totalCost > 0) {
      const rangeLow = Math.round(totalCost * 0.8);
      const rangeHigh = Math.round(totalCost * 1.2);
      
      if (totalDisplay) {
        totalDisplay.textContent = `₹${rangeLow.toLocaleString('en-IN')} - ₹${rangeHigh.toLocaleString('en-IN')}`;
      }
      
      // Calculate per window average
      if (totalQty > 0 && perWindowDisplay) {
        const avgPerWindow = totalCost / totalQty;
        const perWindowLow = Math.round(avgPerWindow * 0.8);
        const perWindowHigh = Math.round(avgPerWindow * 1.2);
        perWindowDisplay.textContent = `₹${perWindowLow.toLocaleString('en-IN')} - ₹${perWindowHigh.toLocaleString('en-IN')}`;
      }
    } else {
      if (totalDisplay) {
        totalDisplay.textContent = '₹0 - ₹0';
      }
      if (perWindowDisplay) {
        perWindowDisplay.textContent = '₹0 - ₹0';
      }
    }
  }
  
  function addSizeRow() {
    console.log('addSizeRow called');
    const container = document.getElementById('calc-sizes-container');
    if (!container) {
      console.error('Container not found!');
      return;
    }
    
    sizeRowCounter++;
    const rowId = `size-row-${sizeRowCounter}`;
    console.log('Adding row:', rowId);
    
    // Get selections from last row (if exists) or current global selections
    let selectionsToApply;
    const existingRows = container.querySelectorAll('.calc-size-row');
    if (existingRows.length > 0) {
      // Auto-apply: Use selections from last row
      const lastRow = existingRows[existingRows.length - 1];
      const lastRowId = lastRow.id;
      selectionsToApply = getRowSelections(lastRowId);
      console.log('Auto-applying selections from last row:', selectionsToApply);
    } else {
      // First row: Use current global selections
      selectionsToApply = getCurrentSelections();
    }
    
    // Set auto-apply flag
    isAutoApplying = true;
    
    // Temporarily update global selections to match last row (for calculation)
    const glassSelect = document.getElementById('calc-glass');
    const coatingSelect = document.getElementById('calc-coating');
    const lockSelect = document.getElementById('calc-lock');
    const meshCheckbox = document.getElementById('calc-mesh');
    const unitSelect = document.getElementById('calc-unit');
    
    if (glassSelect) glassSelect.value = selectionsToApply.glass;
    if (coatingSelect) coatingSelect.value = selectionsToApply.coating;
    if (lockSelect) lockSelect.value = selectionsToApply.lock;
    if (meshCheckbox) meshCheckbox.checked = selectionsToApply.mesh;
    if (unitSelect) unitSelect.value = selectionsToApply.unit;
    
    const row = document.createElement('div');
    row.className = 'calc-size-row';
    row.id = rowId;
    row.innerHTML = `
      <div>
        <div class="size-label">Width</div>
        <input type="text" class="calc-size-width" inputmode="decimal" placeholder="Width" data-row="${rowId}">
      </div>
      <div>
        <div class="size-label">Height</div>
        <input type="text" class="calc-size-height" inputmode="decimal" placeholder="Height" data-row="${rowId}">
      </div>
      <div>
        <div class="size-label">Qty</div>
        <input type="number" class="calc-size-qty" min="1" value="1" data-row="${rowId}">
      </div>
      <button type="button" class="remove-size-btn" onclick="window.removeSizeRow('${rowId}')" title="Remove">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
      <div class="row-amount" style="grid-column: 1 / -1; text-align: right; padding-top: 0.5rem; border-top: 1px solid rgba(59, 130, 246, 0.2); margin-top: 0.5rem;">
        <span class="row-amount-text">₹0</span>
      </div>
    `;
    
    container.appendChild(row);
    console.log('Row added successfully, total rows:', container.children.length);
    
    // Store selections for this new row
    storeRowSelections(rowId, selectionsToApply);
    
    // Reset auto-apply flag after a short delay
    setTimeout(() => {
      isAutoApplying = false;
      // Recalculate to ensure proper display
      recalculateRow(rowId);
      checkAndShowSyncButton();
    }, 100);
    
    // Add event listeners
    const widthInput = row.querySelector('.calc-size-width');
    const heightInput = row.querySelector('.calc-size-height');
    const qtyInput = row.querySelector('.calc-size-qty');
    
    [widthInput, heightInput, qtyInput].forEach(input => {
      if (input) {
        // Real-time updates on every keystroke
        input.addEventListener('input', () => {
          recalculateRow(rowId);
          updateTotalArea();
          triggerMainCalculator();
        });
        input.addEventListener('change', () => {
          recalculateRow(rowId);
          updateTotalArea();
          triggerMainCalculator();
        });
        // Also trigger on paste
        input.addEventListener('paste', () => {
          setTimeout(() => {
            recalculateRow(rowId);
            updateTotalArea();
            triggerMainCalculator();
          }, 10);
        });
      }
    });
    
    // Initialize smooth typing indicator for new inputs
    if (widthInput && typeof window.createSmoothTypingIndicator === 'function') {
      widthInput.setAttribute('placeholder', '');
      setTimeout(() => {
        window.createSmoothTypingIndicator(widthInput, 'Width', {
          minTypeSpeed: 60,
          maxTypeSpeed: 120,
          minDeleteSpeed: 30,
          maxDeleteSpeed: 60,
          pauseBeforeDelete: 2500,
          pauseAfterDelete: 600,
          startDelay: 200
        });
      }, 100);
    }
    
    if (heightInput && typeof window.createSmoothTypingIndicator === 'function') {
      heightInput.setAttribute('placeholder', '');
      setTimeout(() => {
        window.createSmoothTypingIndicator(heightInput, 'Height', {
          minTypeSpeed: 60,
          maxTypeSpeed: 120,
          minDeleteSpeed: 30,
          maxDeleteSpeed: 60,
          pauseBeforeDelete: 2500,
          pauseAfterDelete: 600,
          startDelay: 200
        });
      }, 300);
    }
    
    // Immediate calculation for new row
    setTimeout(() => {
      recalculateRow(rowId);
      updateTotalArea();
      triggerMainCalculator();
      checkAndShowSyncButton();
    }, 50);
  }
  
  function removeSizeRow(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    
    const container = document.getElementById('calc-sizes-container');
    if (container && container.children.length <= 1) {
      alert('At least one size is required');
      return;
    }
    
    // Remove stored selections for this row
    rowSelections.delete(rowId);
    
    row.remove();
    recalculateAll();
    checkAndShowSyncButton();
  }
  
  // Make removeSizeRow globally accessible
  window.removeSizeRow = removeSizeRow;
  
  // Initialize immediately, don't wait for calculator
  function initMultipleSizes() {
    const container = document.getElementById('calc-sizes-container');
    const addBtn = document.getElementById('calc-add-size-btn');
    
    if (!container || !addBtn) {
      console.log('Multiple sizes container or button not found, skipping...');
      return;
    }
    
    // Prevent duplicate initialization
    if (addBtn.hasAttribute('data-listener-attached')) {
      console.log('Event listener already attached, skipping...');
      return;
    }
    
    console.log('Initializing multiple sizes calculator...');
    
    // Mark button as having listener attached
    addBtn.setAttribute('data-listener-attached', 'true');
    
    // Add first row if container is empty
    if (container.children.length === 0) {
      addSizeRow();
    }
    
    // Add button click handler (only once)
    addBtn.addEventListener('click', function handleAddClick(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Add button clicked');
      addSizeRow();
    });
    
    // Listen for unit changes (prevent duplicate)
    const unitSelect = document.getElementById('calc-unit');
    if (unitSelect && !unitSelect.hasAttribute('data-listener-attached')) {
      unitSelect.setAttribute('data-listener-attached', 'true');
      unitSelect.addEventListener('change', () => {
        recalculateAll();
      });
      unitSelect.addEventListener('input', () => {
        recalculateAll();
      });
    }
    
    // Sync button click handler (prevent duplicate)
    const syncBtn = document.getElementById('calc-sync-selections-btn');
    if (syncBtn && !syncBtn.hasAttribute('data-listener-attached')) {
      syncBtn.setAttribute('data-listener-attached', 'true');
      syncBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        applySelectionsToAll();
      });
    }
    
    // Listen for global options changes (Glass, Coating, Lock, Mesh)
    // These changes should only apply to the last row (or current active row)
    const glassSelect = document.getElementById('calc-glass');
    const coatingSelect = document.getElementById('calc-coating');
    const lockSelect = document.getElementById('calc-lock');
    const meshCheckbox = document.getElementById('calc-mesh');
    
    // Function to apply selection change to last row only
    function applyToLastRow() {
      if (isAutoApplying) return; // Don't interfere with auto-apply
      
      const rows = document.querySelectorAll('.calc-size-row');
      if (rows.length === 0) return;
      
      const lastRow = rows[rows.length - 1];
      const lastRowId = lastRow.id;
      const currentSelections = getCurrentSelections();
      
      // Store selections for last row
      storeRowSelections(lastRowId, currentSelections);
      
      // Recalculate all
      recalculateAll();
    }
    
    // Prevent duplicate listeners for option selects
    if (glassSelect && !glassSelect.hasAttribute('data-listener-attached')) {
      glassSelect.setAttribute('data-listener-attached', 'true');
      glassSelect.addEventListener('change', () => {
        applyToLastRow();
      });
      glassSelect.addEventListener('input', () => {
        applyToLastRow();
      });
    }
    
    if (coatingSelect && !coatingSelect.hasAttribute('data-listener-attached')) {
      coatingSelect.setAttribute('data-listener-attached', 'true');
      coatingSelect.addEventListener('change', () => {
        applyToLastRow();
      });
      coatingSelect.addEventListener('input', () => {
        applyToLastRow();
      });
    }
    
    if (lockSelect && !lockSelect.hasAttribute('data-listener-attached')) {
      lockSelect.setAttribute('data-listener-attached', 'true');
      lockSelect.addEventListener('change', () => {
        applyToLastRow();
      });
      lockSelect.addEventListener('input', () => {
        applyToLastRow();
      });
    }
    
    if (meshCheckbox && !meshCheckbox.hasAttribute('data-listener-attached')) {
      meshCheckbox.setAttribute('data-listener-attached', 'true');
      meshCheckbox.addEventListener('change', () => {
        applyToLastRow();
      });
      meshCheckbox.addEventListener('click', () => {
        setTimeout(() => applyToLastRow(), 10);
      });
    }
    
    // Try to get calculator instance
    window.calcInitStartTime = Date.now();
    tryGetCalculatorInstance();
  }
  
  // Initialize when DOM is ready
  function startInit() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initMultipleSizes, 100);
      });
    } else {
      setTimeout(initMultipleSizes, 100);
    }
  }
  
  startInit();
})();

