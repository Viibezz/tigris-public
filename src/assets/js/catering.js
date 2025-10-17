import { initializeForm } from './formHandler.js';
import { itemModal } from './itemModal.js';
import { scrollspyeHighlight } from './scrollspye.js';
import { showMenuItems } from './showMenuItems.js';
// import { menuData } from '../menu-data/menuData.js';

document.addEventListener("DOMContentLoaded", () => {
  const menuData = window.tigrisCateringData; 

  handleMenuData(menuData);
});

function handleMenuData(menu) {
  // display menu items
  showMenuItems(menu, 'catering');
  
  // scrollspy navbar
  scrollspyeHighlight();
  
  // item modal
  itemModal();
  
  // Initialize form handling
  const formSelector = '#inquireModal form';
  initializeForm(
    formSelector,
    '6LdzKe0rAAAAAFUuRz7eXzlS65GMXPuIN4MMPsze', // reCAPTCHA Site Key
    'https://o3pe4aw2c8.execute-api.us-east-1.amazonaws.com/FormSubmissionHandler' // API URL
  );
  
  // Scroll to catering menu button
  const btnCateringMenu = document.getElementById("btn-catering-menu");
  const cateringMenu = document.getElementById("catering-menu-heading");
  if (btnCateringMenu && cateringMenu) {
    btnCateringMenu.addEventListener("click", () => {
      const mainNavHeightElement = document.querySelector("header");
      const mainNavHeight = mainNavHeightElement ? mainNavHeightElement.offsetHeight : 0;
      const offsetTop = cateringMenu.getBoundingClientRect().top + window.pageYOffset - 0;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth"
      });
    });
  }
}
