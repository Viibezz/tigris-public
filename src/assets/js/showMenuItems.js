// Function to dynamically generate menu items from the menu object
export function showMenuItems(menu, page) {
  const mainContainer = document.getElementById("main-menu");
  // Use a DocumentFragment to avoid multiple reflows and repaints
  // as categories are added to the DOM.
  // Instead of appending each category directly to the DOM one by one,
  // we add them as children of the fragment and then append the fragment all at once.
  // This improves performance, especially when adding many elements.
  // Note: The fragment itself still exists after appending,
  // but its children are moved into the DOM and no longer part of the fragment.
  // Bonus: Unlike innerHTML or some createElement patterns,
  // DocumentFragment is not limited to specific element types.
  const fragment = document.createDocumentFragment();

  // Loop through each category in the menu
  Object.entries(menu).forEach(([key, category]) => {
    // Create a container section for each category
    const categoryContainer = document.createElement("section");
    categoryContainer.id = key;
    categoryContainer.className = "px-3";
    categoryContainer.style.paddingTop = "60px";


    // Create and append the category header
    const header = document.createElement("h2");
    header.textContent = category.header;
    header.className = "display-6 text-danger fw-bold mb-1";
    categoryContainer.appendChild(header);
    
    // Add a note for sections
    const note = document.createElement("p");
    note.className = "alert alert-info border-0 rounded-pill text-center mb-4";
    note.style.background = "#f8f5f0";
    note.style.borderLeft = "4px solid #f2c372";

    // star decorative element
    const decorator = document.createElement("div");
    decorator.className = "header-decorator d-flex align-items-center justify-content-center gap-3 mb-2";
    decorator.innerHTML = `
      <div class="decorator-line flex-grow-1" style="height: 2px; background: #f2c372; max-width: 100px;"></div>
      <i class="bi bi-star-fill text-warning"></i>
      <div class="decorator-line flex-grow-1" style="height: 2px; background: #f2c372; max-width: 100px;"></div>
    `;

    categoryContainer.appendChild(decorator);

    let hasNote = false;
    if (category.header === "PLATES") {
      note.textContent = "All plates include yellow rice, hummus, tabbouleh, pita bread, and the appropriate sauce (garlic for chicken, tahini for beef/falafel, tzatziki for gyro).";
      hasNote = true;
    }
    else if (category.header === "SANDWICHES") {
      note.textContent = "Includes the appropriate sauce inside: garlic for chicken, tahini for beef/falafel, tzatziki for gyro.";
      hasNote = true;
    }
    else if (category.header === "SALADS") {
      note.textContent = "Served with vinaigrette on the side: balsamic, raspberry, lemon, house-made, or herb & vinegar.";
      hasNote = true;
    }
    if (hasNote) {
      categoryContainer.appendChild(note)
    }

    // Create a row div for the item cards
    const rowDiv = document.createElement("div");
    rowDiv.className = "row";

    // Loop through each item in the category
    category.items.forEach(item => {
      const div = document.createElement("div");
      div.className = "col-12 col-md-4 col-xxl-2 my-2";

      let priceInfo = ``;
      if (item.per_piece_price) {
          priceInfo = `Per piece: ${item.per_piece_price}`;
      } else if (item.per_flatbread_price) {
          priceInfo = `Per flatbread: ${item.per_flatbread_price}`;
      } else if (item.per_skewer_price) {
          priceInfo = `Per skewer: ${item.per_skewer_price}`;
      } else if (item.small_price && item.large_price) {
          priceInfo = `Small ${item.small_price}<br>Large ${item.large_price}`;
      } else if (item.price) {
        priceInfo = `${item.price}`;
      }

      let itemId = "";
      if (item.itemId) {
        itemId = item.itemId;
      } else {
        itemId = "-1";
      }

      // Create card HTML structure for the item
      div.innerHTML = `
        <div class="card h-100 menu-card border-0 shadow-sm position-relative"
          data-bs-toggle="modal"
          data-bs-target="#orderModal"
          data-item-id="${itemId}"
          data-full="${item.thumb1200}"
          data-thumb="${item.thumb400}"
          data-name="${item.name}"
          data-description="${item.description}"
          data-price="${priceInfo}"
          data-images='${JSON.stringify(item.images || [])}'
          tabindex="0"
          role="button"
          aria-label="View details for ${item.name}">

          <!-- Paper flip corner effect -->
          <div class="menu-card-corner position-absolute top-0 end-0">
          </div>
        
          <!-- Zoom icon -->
          <i class="bi bi-zoom-in position-absolute text-white menu-card-zoom-icon">
          </i>
      
          <div class="position-relative overflow-hidden">
            <div class="menu-image-container">
              <img 
                srcset="${item.thumb400} 400w, 
                        ${item.thumb800} 800w, 
                        ${item.thumb1200} 1200w"
                sizes="(max-width: 768px) 400px, 400px"
                src="${item.thumb400}"
                width="400" height="400"
                alt="${item.name} ${item.category} menu item"
                loading="lazy"
              />
            </div>
        
            <div class="menu-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center opacity-0"
                style="background: var(--gradient-hero); transition: opacity 0.3s ease;">
              <div class="bg-white bg-opacity-90 rounded-circle p-3" style="transform: scale(0); transition: transform 0.3s ease;">
                <i class="bi bi-plus-lg text-danger fs-4"></i>
              </div>
            </div>
          </div>
        
          <div class="card-body d-flex flex-column text-center p-3">
            <h4 class="menu-title h6 mb-2 fw-bold text-white">${item.name}</h4>
            <p class="menu-price text-danger fw-bold mb-0 small">${priceInfo}</p>
          </div>
      </div>
    `;
      
      
      rowDiv.appendChild(div);
    });
    categoryContainer.appendChild(rowDiv);
    fragment.appendChild(categoryContainer);
  });
  mainContainer.appendChild(fragment);
}