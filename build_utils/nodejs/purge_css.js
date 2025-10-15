// build_utils/nodejs/purge_css.js
const { PurgeCSS } = require('purgecss');
const fs = require('fs');
const path = require('path');

async function runPurgeCSS() {
    // Expected arguments: the full paths to CSS files to be purged
    const cssFilePaths = process.argv.slice(2); // Get arguments after 'node purge_css.js'

    if (cssFilePaths.length === 0) {
        console.error('Error: No CSS files provided to purge_css.js. Usage: node purge_css.js <path/to/css1.css> <path/to/css2.css> ...');
        process.exit(1);
    }

    // Docs directory for content scanning (relative to build_utils/nodejs)
    const docsDir = path.resolve(__dirname, '../../../docs'); // Adjust path to point to 'docs'

    // Verify all input CSS files exist
    for (const cssPath of cssFilePaths) {
        if (!fs.existsSync(cssPath)) {
            console.error(`Error: Input CSS file not found at ${cssPath}. PurgeCSS skipped for this file.`);
            process.exit(1); // Exit if any input file is missing
        }
    }

    try {
        console.log(`PurgeCSS: Processing CSS files: ${cssFilePaths.map(p => path.basename(p)).join(', ')}`);

        const result = await new PurgeCSS().purge({
            content: [
                `${docsDir}/**/*.html`,
                `${docsDir}/**/*.js`
            ], // Scan all HTML and JS in 'docs'
            css: cssFilePaths, // The CSS files to purge (now dynamic)
            safelist: {
                standard: [
                    'modal', 'fade', 'show', 'collapsing', 'active', 'open',
                    'fancybox-container', 'fancybox-is-open', 'fancybox-is-closing',
                    
                    // === ADDITIONS FOR DROPDOWNS, ACCORDIONS, NAVBAR COLLAPSE ===
                    'dropdown-menu', 'dropdown-item', 'dropdown-toggle', 'dropup', 'dropright', 'dropleft',
                    'collapse', 'collapsing', 'collapsed', // 'collapsing' is for the transition state
                    'navbar-toggler', 'navbar-collapse',
                    'data-bs-toggle', 'data-bs-target', // Common attributes used by Bootstrap JS
                    'data-bs-parent', // For accordions
                    // =============================================================

                    // Add any other specific classes your JS adds or toggles
                    'is-valid', 'is-invalid', 'valid-feedback', 'invalid-feedback',
                ],
                greedy: [
                    /^col-/, /^p-/, /^m-/, /^d-/, /^text-/, /^bg-/, /^border-/,
                    /^position-/, /^top-/, /^start-/, /^translate-/,
                    
                    // === ADDITIONS FOR DROPDOWNS, ACCORDIONS, NAVBAR COLLAPSE (GREEDY) ===
                    /^navbar-/, // Catches navbar-expand-lg, navbar-light, etc.
                    /^accordion-/, // Catches accordion-item, accordion-header, accordion-button
                    /^dropdown-/, // Catches dropdown-divider, dropdown-header, etc.
                    // =====================================================================

                    /^btn-outline-/,
                    /^align-items-/, /^justify-content-/, /^flex-/,
                    /^d-(sm|md|lg|xl|xxl)-/,
                    /^[wh]-\d+/,
                    /^js-/,
                ]
            }
        });

        // The result will be an array, one entry per input CSS file
        if (result.length > 0) {
            result.forEach((purgedFile, index) => {
                const originalPath = cssFilePaths[index];
                const originalSize = fs.statSync(originalPath).size;
                fs.writeFileSync(originalPath, purgedFile.css); // Overwrite original with purged content
                const purgedSize = fs.statSync(originalPath).size;
                console.log(`Purged ${path.basename(originalPath)}. Original: ${originalSize} bytes, Purged: ${purgedSize} bytes. Reduction: ${(((originalSize - purgedSize) / originalSize) * 100).toFixed(2)}%`);
            });
            console.log('PurgeCSS: All specified CSS files processed successfully.');
        } else {
            console.warn('PurgeCSS: No CSS files processed or result was empty. Check configuration and input paths.');
        }
        process.exit(0);
    } catch (error) {
        console.error('PurgeCSS Error:', error);
        process.exit(1);
    }
}

runPurgeCSS();