// itemModal.js

function getItemCategory(itemIdStr) {
  const itemId = parseInt(itemIdStr, 10);
  if (Number.isNaN(itemId)) throw new Error("Invalid itemId: Must be a number.");
  if ((itemId >= 0 && itemId <= 5) || (itemId >= 100 && itemId <= 105)) return "Salad";
  if ((itemId >= 6 && itemId <= 10) || (itemId >= 106 && itemId <= 110)) return "Flatbread";
  if (itemId >= 11 && itemId <= 21) return "Plate";
  if (itemId >= 22 && itemId <= 29) return "Sandwich";
  return "";
}

function setBusy(contentEl, spinnerEl, busy) {
  if (!contentEl || !spinnerEl) return;
  contentEl.setAttribute('aria-busy', String(busy));
  spinnerEl.classList.toggle('visually-hidden', !busy);
  spinnerEl.setAttribute('aria-hidden', String(!busy));
}

/**
 * Preload with minimum spinner time, fade in, and proper ARIA.
 */
function preloadAndShowImage(imgElement, spinnerElement, dataSrc, afterLoad = () => {}) {
  if (!imgElement || !spinnerElement || !dataSrc) {
    console.error("preloadAndShowImage: Missing params.");
    afterLoad();
    return;
  }

  const contentEl = imgElement.closest('.modal-content');
  setBusy(contentEl, spinnerElement, true);

  imgElement.style.opacity = '0';
  imgElement.style.transition = 'opacity .2s ease-in-out';

  const MIN_SPINNER_TIME = 200;
  const t0 = performance.now();
  const tmp = new Image();
  tmp.decoding = "async";
  tmp.onload = () => {
    const delay = Math.max(MIN_SPINNER_TIME - (performance.now() - t0), 0);
    setTimeout(() => {
      imgElement.src = tmp.src;
      requestAnimationFrame(() => {
        imgElement.style.opacity = '1';
        setBusy(contentEl, spinnerElement, false);
        afterLoad();
      });
    }, delay);
  };
  tmp.onerror = () => {
    console.error("preloadAndShowImage: Failed to load image:", dataSrc);
    imgElement.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 200'%3E%3Crect width='320' height='200' fill='%23eee'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='system-ui, -apple-system, Segoe UI, Roboto' font-size='14'%3EImage unavailable%3C/text%3E%3C/svg%3E";
    imgElement.alt = "Image failed to load";
    setBusy(contentEl, spinnerElement, false);
    afterLoad();
  };
  tmp.src = dataSrc;
}

/** Prevent background focus while modals/lightboxes are open */
function toggleMainContentInert(isInert) {
  const kids = document.body.children;
  for (let i = 0; i < kids.length; i++) {
    const el = kids[i];
    if (!el.classList.contains('modal') &&
        !el.classList.contains('fancybox__container') &&
        !el.classList.contains('modal-backdrop')) {
      isInert ? el.setAttribute('inert', '') : el.removeAttribute('inert');
    }
  }
}

export function itemModal() {
  const orderModal      = document.getElementById('orderModal');
  const modalImage      = document.getElementById('modalImage');
  const modalTitle      = document.getElementById('modalTitle');
  const modalDesc       = document.getElementById('modalDesc');
  const modalPrice      = document.getElementById('modalPrice');
  const orderSpinner    = document.getElementById('orderSpinner');
  const modalBody       = document.getElementById('modalBodyContent');
  const zoomTrigger     = document.getElementById('zoomTrigger');

  if (!orderModal || !modalImage || !modalTitle || !modalDesc ||
      !modalPrice || !orderSpinner || !modalBody || !zoomTrigger) {
    console.error("itemModal: Missing essential DOM nodes.");
    return;
  }

  let fullImageSrc = '';
  let elementBeforeModalOpen = null;

  // Safety: unbind in case something bound Fancybox earlier with defaults
  if (window.Fancybox?.unbind) Fancybox.unbind('[data-fancybox="item-image"]');

  const BACK_TPL = `
    <button class="f-button f-button--back" title="Back" aria-label="Back">
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2"
              fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>`;

  Fancybox.bind('[data-fancybox="item-image"]', {
    closeButton: false,
    Carousel: {
      Toolbar: {
        display: {
          left:   ['back'],
          middle: ['zoomIn','zoomOut','toggle1to1','rotateCCW','rotateCW','flipX','flipY'],
          right:  []
        },
        items: { back: { tpl: BACK_TPL, click: () => Fancybox.close() } }
      }
    },
    mainStyle: { '--f-toolbar-padding': '8px' },
    on: {
      beforeShow: () => toggleMainContentInert(true),
      afterClose: () => {
        toggleMainContentInert(false);
        const modal = bootstrap.Modal.getOrCreateInstance(orderModal);
        modal.show();
        orderModal.addEventListener('shown.bs.modal', function handler() {
          orderModal.removeEventListener('shown.bs.modal', handler);
          zoomTrigger?.focus();
        }, { once: true });
      }
    }
  });

  // Populate modal on open
  orderModal.addEventListener('show.bs.modal', (event) => {
    elementBeforeModalOpen = event.relatedTarget || document.activeElement;

    const trigger = event.relatedTarget;
    if (!trigger) return;

    fullImageSrc = trigger.getAttribute('data-full');
    const itemName   = trigger.getAttribute('data-name') || '';
    const itemDesc   = trigger.getAttribute('data-description') || '';
    const itemPrice  = trigger.getAttribute('data-price') || '';
    const itemId     = trigger.getAttribute('data-item-id') || '';
    const category   = getItemCategory(itemId);

    // Hide body while we load, but keep it in DOM for a11y
    modalBody.hidden = true;

    // Keep Fancybox source + caption in sync
    zoomTrigger.setAttribute('href', fullImageSrc || '#');
    zoomTrigger.setAttribute('data-caption', itemDesc);

    preloadAndShowImage(modalImage, orderSpinner, fullImageSrc, () => {
      modalImage.alt = itemDesc || modalImage.alt;
      modalTitle.textContent = category ? `${itemName} ${category}` : itemName;
      modalDesc.textContent  = itemDesc;
      modalPrice.textContent = (itemPrice || '').replace(/<br>/g, ' | ');
      modalBody.hidden = false;

      orderModal.addEventListener('shown.bs.modal', function focusHandler() {
        orderModal.removeEventListener('shown.bs.modal', focusHandler);
        zoomTrigger?.focus();
        toggleMainContentInert(true);
      }, { once: true });
    });
  });

  // Restore background and focus on close
  orderModal.addEventListener('hidden.bs.modal', () => {
    toggleMainContentInert(false);
    if (elementBeforeModalOpen?.focus) elementBeforeModalOpen.focus();
    elementBeforeModalOpen = null;
  });
}
