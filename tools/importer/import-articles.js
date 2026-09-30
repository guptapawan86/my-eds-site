/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsRelatedTagsParser from './parsers/cards-related-tags.js';
import cardsArticlesParser from './parsers/cards-articles.js';

// TRANSFORMER IMPORTS
import datacomCleanupTransformer from './transformers/datacom-cleanup.js';
import datacomDmImagesTransformer from './transformers/datacom-dm-images.js';
import datacomSectionsTransformer from './transformers/datacom-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "articles",
  "description": "Datacom insights article: cover header, full-width cover image, long-form body with related-tags sidebar, and dark Discover more related-article cards",
  "urls": [
    "https://datacom.com/au/en/insights/articles/why-technology-supply-chains-remain-under-pressure"
  ],
  "blocks": [
    {
      "name": "cards-related-tags",
      "instances": [
        ".article-body__right-column"
      ]
    },
    {
      "name": "cards-articles",
      "instances": [
        ".gallery.dark-theme .gallery-list"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Article header",
      "selector": [
        ".article-cover"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".article-cover__top-row",
        "h1.article-cover__heading",
        ".article-cover__left-column p",
        ".article-cover__bottom-row"
      ]
    },
    {
      "id": "section-2",
      "name": "Cover image",
      "selector": [
        ".article-cover-image.wide-cover-image",
        ".article-cover-image"
      ],
      "style": "full-width",
      "blocks": [],
      "defaultContent": [
        ".article-cover-image img"
      ]
    },
    {
      "id": "section-3",
      "name": "Article body with sidebar",
      "selector": [
        ".article-body"
      ],
      "style": "article-body",
      "blocks": [
        "cards-related-tags"
      ],
      "defaultContent": [
        ".article-body__left-column .article-body-text",
        ".article-body__left-column .heading.title",
        ".article-body__left-column .article-body-image"
      ]
    },
    {
      "id": "section-4",
      "name": "Discover more",
      "selector": [
        ".gallery.dark-theme"
      ],
      "style": "dark",
      "blocks": [
        "cards-articles"
      ],
      "defaultContent": [
        ".gallery__heading"
      ]
    }
  ]
};

// PARSER REGISTRY
const parsers = {
  'cards-related-tags': cardsRelatedTagsParser,
  'cards-articles': cardsArticlesParser,
};

// TRANSFORMER REGISTRY
// Order: cleanup, then DM/Scene7 image carriers, then section breaks/metadata
const transformers = [
  datacomCleanupTransformer,
  datacomDmImagesTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [datacomSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. beforeTransform transformers (cleanup, section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced by an earlier parser
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform transformers (final cleanup, DM carriers, section metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root maps to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
