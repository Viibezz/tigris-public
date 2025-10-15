/**
 * menu-schema.js
 * ---------------
 * Purpose:
 *   Build and inject Schema.org JSON-LD for the Menu page using the same data
 *   that renders UI (window.tigrisMenuData).
 *
 * Expects:
 *   window.tigrisMenuData  // object shaped like { salads: { header, items: [...] }, ... }
 *   window.__SITE_URL__    // canonical origin (fallback: location.origin)
 *   window.__COMPANY__     // business name (fallback: document.title sans separators)
 *
 * Output:
 *   <script type="application/ld+json">{ ...Menu graph... }</script> appended to <head>
 */

(function () {
  if (!/\/menu\/?$/.test(location.pathname)) return; // Only run on /menu
  const data = window.tigrisMenuData;
  if (!data || typeof data !== 'object') return;

  const origin = (typeof window.__SITE_URL__ === 'string' && window.__SITE_URL__) || location.origin;
  const company = (typeof window.__COMPANY__ === 'string' && window.__COMPANY__)
    || (document.title || '').split('|')[0].trim() || 'Restaurant';
  const menuUrl = origin + '/menu';

  const slugify = (str, id) => {
    const core = String(str || '')
      .toLowerCase()
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')   // strip accents
      .replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') // hyphenize
      .replace(/-{2,}/g, '-');
    return typeof id !== 'undefined' && id !== null ? `${core}-${id}` : core;
  };

  const parsePrice = (p) => {
    // Accept "$16.50", "16.50", 16.5, etc. Return string numeric per schema.
    if (typeof p === 'number') return p.toFixed(2);
    if (typeof p === 'string') {
      const m = p.replace(',', '.').match(/(\d+(?:\.\d+)?)/);
      if (m) return Number(m[1]).toFixed(2);
    }
    return undefined; // omit invalid prices
  };

  // Transform { salads: { header, items: [...] }, ... } → sections[]
  const sections = Object.keys(data).map((key) => {
    const section = data[key] || {};
    const title = section.header || key.toUpperCase();
    const items = Array.isArray(section.items) ? section.items : [];

    const hasMenuItem = items.map((it) => {
      const name = it.name || 'Item';
      const desc = it.description || '';
      const price = parsePrice(it.price);
      const img = it.image || it.thumb || undefined;
      const available = typeof it.available === 'boolean' ? it.available : true;
      const slug = slugify(name, it.itemId);

      const item = {
        "@context": "https://schema.org",
        "@type": "MenuItem",
        "name": name,
        "description": desc
      };

      if (img) item.image = img;

      // Offer is strongly recommended
      item.offers = {
        "@type": "Offer",
        "priceCurrency": "USD",
        "availability": available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "url": `${menuUrl}#${slug}`
      };
      if (price) item.offers.price = price;

      return item;
    });

    return {
      "@type": "MenuSection",
      "name": title,
      "hasMenuItem": hasMenuItem
    };
  });

  const graph = {
    "@context": "https://schema.org",
    "@type": "Menu",
    "name": `${company} Menu`,
    "url": menuUrl,
    "hasMenuSection": sections
  };

  try {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(graph);
    document.head.appendChild(s);
  } catch (e) {
    console.warn('Menu JSON-LD injection failed:', e);
  }
})();
