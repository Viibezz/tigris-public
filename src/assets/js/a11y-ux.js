// === NAV: mark current page (match pathname + search; skip dropdowns & hashes) ===
(function () {
  const currentPath   = (location.pathname.replace(/\/+$/,'') || '/');
  const currentSearch = (location.search || ''); // includes leading "?" or ""

  const links = document.querySelectorAll(
    '#main-navbar .nav-link[href]:not(.dropdown-toggle)'
  );

  links.forEach(a => {
    const raw = a.getAttribute('href') || '';

    // Ignore hash-only or JS pseudo links
    if (raw.startsWith('#') || raw.startsWith('javascript:')) return;

    // Build absolute URL and ensure same-origin
    let url;
    try { url = new URL(raw, location.origin); } catch { return; }
    if (url.origin !== location.origin) return;

    const hrefPath   = (url.pathname.replace(/\/+$/,'') || '/');
    const hrefSearch = (url.search || '');

    // Skip items inside dropdown menus
    if (a.closest('.dropdown')) return;

    // Exact match requires both path AND query string to match
    const isExact = (hrefPath === currentPath) && (hrefSearch === currentSearch);

    if (isExact) {
      a.setAttribute('aria-current', 'page');
      a.classList.add('active');
    } else {
      a.removeAttribute('aria-current');
      a.classList.remove('active');
    }
  });
})();
