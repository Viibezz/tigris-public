/**
 * menu.js - Tigris Mediterranean Food Menu
 *
 * This script handles the dynamic creation and interaction of the menu.
 * It performs the following functions:
 *
 * 1. Fetch menu.json containing categories with details for each 
 *    menu item (name, price, description, images)
 * 2. Dynamically generates menu item cards using DOM manipulation
 * 3. Implements smooth scrolling navigation between menu categories
 * 4. Uses Intersection Observer for scrollspy functionality to highlight
 *    the active menu category in the navigation
 * 5. Manages modal interactions for viewing item details and zooming images
 * 6. Handles image preloading with loading animations
 * 7. Provides cart functionality for adding items
 *
 * The script initializes when the DOM is fully loaded, generating the menu
 * and setting up all event listeners and observers.
 */

import { showMenuItems } from './showMenuItems.js';
import { scrollspyeHighlight } from './scrollspye.js';
import { itemModal } from './itemModal.js';

document.addEventListener("DOMContentLoaded", () => {
  const menuData = window.tigrisMenuData;
  handleMenuData(menuData);
});

function handleMenuData(menu) {
  if (!menu || typeof menu !== 'object' || Object.keys(menu).length === 0) {
    console.error("handleMenuData: Invalid or empty menu data provided.", menu);
    return;
  }

  // Display menu items
  showMenuItems(menu, 'menu');

  // Initialize scrollspy for navbar highlighting
  scrollspyeHighlight();

  // Initialize item modal functionality
  itemModal();
}