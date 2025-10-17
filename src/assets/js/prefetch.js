/**
 * Prefetch.js
 * -----------
 * Purpose:
 *    Improves perceived navigation speed by prefetching selected internal pages 
 *    before the user clicks the link. When a link is visible or hovered, the 
 *    target page is fetched in the background and stored in the browser cache, 
 *    making the actual navigation feel instant.
 *
 * How It Works:
 *    - Observes selected internal links (here: /menu and /catering).
 *    - When the link is visible in the viewport or hovered, prefetches it via 
 *      a <link rel="prefetch"> element.
 *    - Browser downloads with low priority to avoid slowing down the current page.
 *
 * Best Practices for Use:
 *    - Only target high-traffic, high-intent pages.
 *    - Avoid prefetching on slow connections or low-end devices.
 *
 * Example:
 *    Prefetching /menu and /catering ensures these pages load almost instantly 
 *    when clicked from the homepage or navbar.
 */

(function () {
  const PREFETCH_TARGETS = ['/menu/', '/catering/'];

  /**
   * Create a <link rel="prefetch"> for the given URL.
   */
  function prefetch(url) {
    if (!url || document.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'document';
    document.head.appendChild(link);
  }

  /**
   * Observe target links in the viewport and prefetch when visible.
   */
  function observeLinks() {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          prefetch(entry.target.href);
          observer.unobserve(entry.target);
        }
      }
    });

    document.querySelectorAll('a[href]').forEach((a) => {
      const url = new URL(a.href, location.origin);
      if (url.origin === location.origin && PREFETCH_TARGETS.includes(url.pathname)) {
        observer.observe(a);
        a.addEventListener('mouseenter', () => prefetch(a.href), { once: true });
      }
    });
  }

  if ('IntersectionObserver' in window) {
    document.addEventListener('DOMContentLoaded', observeLinks);
  }
})();
