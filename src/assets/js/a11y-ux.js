// === NAV: mark current page (match pathname + search; skip dropdowns & hashes) ===
(function () {
    const BASE_URL = "{{site.baseUrl}}";
    const currentPath   = (location.pathname.replace(/\/+$/, '') || '/').replace(BASE_URL, '');
    const currentSearch = (location.search || '');

    const links = document.querySelectorAll(
      '#main-navbar .nav-link[href]:not(.dropdown-toggle)'
    );

    links.forEach(a => {
      const raw = a.getAttribute('href') || '';

      if (raw.startsWith('#') || raw.startsWith('javascript:')) return;

      let url;
      try { url = new URL(raw, location.origin); } catch { return; }
      if (url.origin !== location.origin) return;

      let hrefPath   = (url.pathname.replace(/\/+$/,'') || '/').replace(BASE_URL, '');
      const hrefSearch = (url.search || '');

      if (a.closest('.dropdown')) return;

      if (hrefPath && !hrefPath.startsWith('/')) hrefPath = '/' + hrefPath;
      if (currentPath && !currentPath.startsWith('/')) currentPath = '/' + currentPath;

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