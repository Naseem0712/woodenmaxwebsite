/**
 * Mobile Collapsible Sections
 * Handles open/close functionality for product descriptions and key features on mobile
 */
(function() {
  'use strict';

  function initMobileCollapsible() {
    // Only run on mobile
    if (window.innerWidth > 768) {
      // Desktop - ensure all content is visible
      document.querySelectorAll('.mobile-collapsible-content').forEach(content => {
        content.classList.remove('collapsed', 'expanded');
        content.style.maxHeight = 'none';
      });
      document.querySelectorAll('.mobile-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      return;
    }

    const toggleButtons = document.querySelectorAll('.mobile-toggle-btn');
    
    if (toggleButtons.length === 0) {
      return; // No toggle buttons found
    }
    
    toggleButtons.forEach(button => {
      // Prevent duplicate event listeners
      if (button.hasAttribute('data-listener-attached')) {
        return;
      }
      button.setAttribute('data-listener-attached', 'true');
      
      const targetId = button.getAttribute('data-target');
      if (!targetId) {
        console.warn('Toggle button missing data-target attribute');
        return;
      }
      
      const targetContent = document.getElementById(targetId);
      if (!targetContent) {
        console.warn('Target content not found for:', targetId);
        return;
      }
      
      // Set initial state (collapsed on mobile)
      if (window.innerWidth <= 768) {
        // Ensure collapsed state on mobile
        if (!targetContent.classList.contains('expanded')) {
          targetContent.classList.add('collapsed');
          targetContent.classList.remove('expanded');
        }
        button.classList.remove('active');
      } else {
        // Desktop - show all content
        targetContent.classList.remove('collapsed', 'expanded');
        button.classList.remove('active');
      }
      
      // Toggle on button click
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Check current state
        const isExpanded = targetContent.classList.contains('expanded');
        
        if (isExpanded) {
          // Collapse - remove expanded, add collapsed
          targetContent.classList.remove('expanded');
          targetContent.classList.add('collapsed');
          button.classList.remove('active');
        } else {
          // Expand - remove collapsed, add expanded
          targetContent.classList.remove('collapsed');
          targetContent.classList.add('expanded');
          button.classList.add('active');
        }
        
        // Debug log
        console.log('Toggle clicked:', targetId, 'isExpanded:', isExpanded, 'new state:', isExpanded ? 'collapsed' : 'expanded');
      });
    });
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        if (window.innerWidth > 768) {
          // Desktop - show all content
          document.querySelectorAll('.mobile-collapsible-content').forEach(content => {
            content.classList.remove('collapsed', 'expanded');
            content.style.maxHeight = 'none';
          });
          document.querySelectorAll('.mobile-toggle-btn').forEach(btn => {
            btn.classList.remove('active');
          });
        } else {
          // Mobile - reset to collapsed if not expanded
          document.querySelectorAll('.mobile-collapsible-content').forEach(content => {
            if (!content.classList.contains('expanded')) {
              content.classList.add('collapsed');
            }
          });
        }
      }, 250);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileCollapsible);
  } else {
    initMobileCollapsible();
  }
  
  // Re-initialize on dynamic content changes (for calculators that add content)
  const observer = new MutationObserver(function(mutations) {
    let shouldReinit = false;
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 && (node.classList.contains('mobile-toggle-btn') || node.querySelector('.mobile-toggle-btn'))) {
            shouldReinit = true;
          }
        });
      }
    });
    if (shouldReinit) {
      setTimeout(initMobileCollapsible, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();

