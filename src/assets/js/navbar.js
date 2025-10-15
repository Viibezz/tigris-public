const userNavbar = document.getElementById('main-navbar');
const navbarToggler = document.getElementById('main-navbar-toggler');
const navbarCollapse = document.getElementById('navbarCollapse');

let lastScrollY = 0;
let accumulatedScroll = 0; // to track slow scroll down
const SCROLL_THRESHOLD = 60; // Total downward movement required to hide the navbar
const TOP_PAGE_BUFFER = 20; // Buffer zone at the top of the page (to prevent mobile 'pull' bug)

let ticking = false;
let ignoreScroll = false;
let documentHeight = 0;

function updateDocumentHeight() {
    documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
    );
}

window.addEventListener('DOMContentLoaded', updateDocumentHeight);
window.addEventListener('resize', updateDocumentHeight);

function isUserInMenuSection() {
  const menuSection = document.getElementById('main-menu'); 
  if (!menuSection) return false;
  const rect = menuSection.getBoundingClientRect();
  const viewportHeight = window.innerHeight;

  // The menu is "in view" if any significant part of it is within the viewport,
  // even during overscroll. We need a generous overlap.
  const threshold = 50; // pixels of overlap needed
  
  // Menu is considered "in view" if its bottom edge hasn't passed above the viewport
  // and its top edge hasn't passed below the viewport.
  return (rect.bottom > threshold) && (rect.top < viewportHeight - threshold);
}

// Function to handle the navbar visibility logic
function handleNavbarVisibility() {
  if (ignoreScroll) {
    ticking = false;
    return;
  }

  const currentScrollY = window.scrollY;
  const deltaY = currentScrollY - lastScrollY;
  
  // Detect if we are in the "overscroll at bottom" zone
  const isAtBottomOverscroll = (currentScrollY + window.innerHeight >= documentHeight - 50); // Allow small buffer

// Check if the user is currently viewing content within the designated menu area
  const inMenuSection = isUserInMenuSection();

  // --- Logic for Mobile Menu Interaction (Preventing immediate hide on link click) ---
  // If a jump scroll is detected (a huge delta) AND we've moved past the buffer, 
  // we should immediately hide the bar, as the intent was to move down the page.
  if (deltaY > 100 && currentScrollY > TOP_PAGE_BUFFER) {
    userNavbar.classList.add('hidden');
    // No need to accumulate, the jump itself is the action.
    accumulatedScroll = 0; 
  }
  
  // --- Logic for Hiding (Scrolling Down) ---
  else if (deltaY > 0) {
    // Accumulate downward scroll only if we are past the top buffer
    if (currentScrollY > TOP_PAGE_BUFFER) {
      accumulatedScroll += deltaY;

      if (accumulatedScroll >= SCROLL_THRESHOLD) {
          userNavbar.classList.add('hidden');
          
          // Collapse the mobile menu if it's open
          if (navbarCollapse.classList.contains('show')) {
              navbarToggler.blur();
              // Use Bootstrap's method if available
              if (window.bootstrap && window.bootstrap.Collapse) {
                  new bootstrap.Collapse(navbarCollapse, { toggle: false }).hide();
              } else {
                  navbarToggler.classList.add('collapsed');
                  navbarCollapse.classList.remove('show');
              }
          }
          // Reset accumulated scroll after hiding
          accumulatedScroll = 0; 
        }
    } else {
        // If scrolling down within the buffer, reset accumulation and keep visible
        accumulatedScroll = 0;
        userNavbar.classList.remove('hidden');
    }
  } 
  
  // --- Logic for Showing (Scrolling Up) ---
  else if (deltaY < 0) {
    // Only show navbar if NOT in menu section OR if near top OR NOT in bottom overscroll
    if ((!inMenuSection && !isAtBottomOverscroll) || currentScrollY <= TOP_PAGE_BUFFER + SCROLL_THRESHOLD) {
            userNavbar.classList.remove('hidden');
        }
    // Reset accumulated scroll on *any* scroll up movement
    accumulatedScroll = 0;
  }
  
  // --- Final Check for Top Position ---
  // Ensure the navbar is always visible when the user is at the very top
  if (currentScrollY <= TOP_PAGE_BUFFER) {
      userNavbar.classList.remove('hidden');
  }

  // Force hide if at bottom overscroll AND navbar is currently showing
  // This is the direct fix for the navbar reappearing during bottom overscroll.
  if (isAtBottomOverscroll && !userNavbar.classList.contains('hidden')) {
    userNavbar.classList.add('hidden');
  }
  
  lastScrollY = currentScrollY;
  ticking = false;
}

// Global scroll event listener
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(handleNavbarVisibility);
    ticking = true;
  }
});

// Reset logic on page load to ensure visibility at the very top
window.addEventListener('DOMContentLoaded', () => {
  if (window.scrollY < TOP_PAGE_BUFFER) {
    userNavbar.classList.remove('hidden');
  }
  lastScrollY = window.scrollY; // Set initial baseline
  accumulatedScroll = 0;
});

// Mobile menu ignore scroll logic (for toggler click)
navbarToggler.addEventListener('click', () => {
  ignoreScroll = true;
  setTimeout(() => {
    ignoreScroll = false;
    lastScrollY = window.scrollY; // Reset baseline after animation
  }, 400); // Adjust based on animation transition
});

// Close mobile navbar when clicking outside
document.addEventListener('DOMContentLoaded', function() {
  const navbarToggler = document.getElementById('main-navbar-toggler');
  const navbarCollapse = document.getElementById('navbarCollapse');
  
  document.addEventListener('click', function(event) {
    const isClickInsideNav = navbarCollapse.contains(event.target);
    const isClickOnToggler = navbarToggler.contains(event.target);
    const isNavbarOpen = navbarCollapse.classList.contains('show');
    
    if (!isClickInsideNav && !isClickOnToggler && isNavbarOpen) {
      // Trigger the collapse
      const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
        toggle: false
      });
      bsCollapse.hide();
    }
  });
});

