/**
 * Google Analytics Enhanced Tracking
 * Tracks engagement time and calculator interactions
 */

(function() {
  'use strict';

  // Check if gtag is available
  if (typeof gtag === 'undefined') {
    return;
  }

  // Enhanced Engagement Time Tracking
  let engagementStartTime = Date.now();
  let lastActiveTime = Date.now();
  let totalEngagementTime = 0;
  let isPageVisible = true;
  let engagementTimer = null;

  // Track page visibility
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      // Page hidden - save engagement time
      if (isPageVisible) {
        totalEngagementTime += (Date.now() - lastActiveTime);
        isPageVisible = false;
      }
    } else {
      // Page visible - resume tracking
      lastActiveTime = Date.now();
      isPageVisible = true;
    }
  });

  // Track user activity (scroll, click, keypress, etc.)
  const activityEvents = ['scroll', 'click', 'keydown', 'mousemove', 'touchstart'];
  let activityTimeout = null;

  function updateActivity() {
    if (isPageVisible) {
      const now = Date.now();
      totalEngagementTime += (now - lastActiveTime);
      lastActiveTime = now;
    }
    
    // Clear existing timeout
    if (activityTimeout) {
      clearTimeout(activityTimeout);
    }
    
    // Set timeout to send engagement time after 30 seconds of inactivity
    activityTimeout = setTimeout(() => {
      sendEngagementTime();
    }, 30000);
  }

  // Add activity listeners
  activityEvents.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });

  // Send engagement time to GA
  function sendEngagementTime() {
    if (isPageVisible) {
      totalEngagementTime += (Date.now() - lastActiveTime);
      lastActiveTime = Date.now();
    }

    if (totalEngagementTime > 0) {
      const engagementSeconds = Math.round(totalEngagementTime / 1000);
      
      // Send custom event for engagement time
      gtag('event', 'engagement_time', {
        'engagement_time_msec': totalEngagementTime,
        'value': engagementSeconds
      });

      // Also update page_view with engagement time
      gtag('event', 'page_view', {
        'engagement_time_msec': totalEngagementTime
      });
    }
  }

  // Send engagement time on page unload
  window.addEventListener('beforeunload', function() {
    sendEngagementTime();
  });
  
  // Also use pagehide for better mobile support
  window.addEventListener('pagehide', function() {
    sendEngagementTime();
  });

  // Send engagement time every 60 seconds while active
  setInterval(function() {
    if (isPageVisible && document.hasFocus()) {
      sendEngagementTime();
    }
  }, 60000);

  // Calculator Event Tracking Functions
  window.trackCalculatorEvent = function(eventName, eventParams) {
    if (typeof gtag === 'undefined') return;

    const defaultParams = {
      'event_category': 'Calculator',
      'event_label': eventName,
      'non_interaction': false
    };

    gtag('event', eventName, {
      ...defaultParams,
      ...eventParams
    });
  };

  // Track calculator size changes
  window.trackCalculatorSize = function(width, height, unit, quantity) {
    trackCalculatorEvent('calculator_size_change', {
      'event_category': 'Calculator',
      'event_label': 'Size Input',
      'width': width,
      'height': height,
      'unit': unit,
      'quantity': quantity,
      'area_sqft': calculateArea(width, height, unit) * quantity
    });
  };

  // Track material selections
  window.trackCalculatorMaterial = function(materialType, materialValue) {
    trackCalculatorEvent('calculator_material_selection', {
      'event_category': 'Calculator',
      'event_label': 'Material Selection',
      'material_type': materialType,
      'material_value': materialValue
    });
  };

  // Track calculator calculation
  window.trackCalculatorCalculation = function(totalCost, totalArea, selections) {
    trackCalculatorEvent('calculator_calculation', {
      'event_category': 'Calculator',
      'event_label': 'Price Calculated',
      'total_cost': totalCost,
      'total_area': totalArea,
      'glass_type': selections?.glass || 'unknown',
      'coating_type': selections?.coating || 'unknown',
      'lock_type': selections?.lock || 'unknown',
      'has_mesh': selections?.mesh || false,
      'value': Math.round(totalCost)
    });
  };

  // Track form submission (GA4 generate_lead for conversion tracking)
  window.trackCalculatorFormSubmit = function(formType, hasPrice) {
    const pagePath = typeof window !== 'undefined' && window.location ? window.location.pathname : '';
    trackCalculatorEvent('calculator_form_submit', {
      'event_category': 'Calculator',
      'event_label': 'Form Submitted',
      'form_type': formType,
      'has_price': hasPrice,
      'value': hasPrice ? 1 : 0,
      'page_path': pagePath
    });
    // GA4 recommended: generate_lead for conversion counting
    gtag('event', 'generate_lead', {
      'event_category': 'Lead',
      'event_label': 'Calculator Quote',
      'method': formType,
      'value': hasPrice ? 1 : 0
    });
  };

  // Track contact form submission (for mail count)
  window.trackContactFormSubmit = function() {
    if (typeof gtag === 'undefined') return;
    gtag('event', 'generate_lead', {
      'event_category': 'Lead',
      'event_label': 'Contact Form',
      'method': 'contact_form',
      'value': 1
    });
    gtag('event', 'form_submit', {
      'event_category': 'Form',
      'event_label': 'Contact Form Submit'
    });
  };

  // Helper function to calculate area
  function calculateArea(width, height, unit) {
    if (!width || !height) return 0;
    
    let areaSqft = 0;
    if (unit === 'ft') {
      areaSqft = width * height;
    } else if (unit === 'inch') {
      areaSqft = (width * height) / 144;
    } else if (unit === 'mm') {
      areaSqft = (width * height) / 92903.04;
    } else if (unit === 'cm') {
      areaSqft = (width * height) / 929.0304;
    } else if (unit === 'm') {
      areaSqft = (width * height) * 10.764;
    }
    
    return areaSqft;
  }

  // Track calculator page view
  window.trackCalculatorPageView = function(productId, productName) {
    if (typeof gtag === 'undefined') return;

    gtag('event', 'calculator_view', {
      'event_category': 'Calculator',
      'event_label': 'Calculator Page View',
      'product_id': productId,
      'product_name': productName
    });
  };

  // Initialize engagement tracking
  updateActivity();
})();

