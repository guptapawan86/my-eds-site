/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-articles.js
  var import_articles_exports = {};
  __export(import_articles_exports, {
    default: () => import_articles_default
  });

  // tools/importer/parsers/cards-related-tags.js
  function parse(element, { document: document2 }) {
    let groups = [...element.querySelectorAll(":scope .article-body__tag-ctn")];
    if (!groups.length) {
      groups = [...element.querySelectorAll(":scope > div")].filter((d) => d.querySelector('[class*="tag-header"]'));
    }
    const cells = [];
    groups.forEach((group) => {
      const headerEl = group.querySelector('.article-body__tag-header, [class*="tag-header"], h2, h3, h4');
      const titleText = headerEl ? headerEl.textContent.replace(/\s+/g, " ").trim() : "";
      const list = group.querySelector('.article-body__tag-list, [class*="tag-list"]') || group;
      let links = [...list.querySelectorAll(":scope .article-body__tag, :scope .datacom-tag")].map((span) => span.querySelector("a[href]")).filter(Boolean);
      if (!links.length) links = [...list.querySelectorAll("a[href]")];
      links = links.filter((a, i, arr) => arr.indexOf(a) === i);
      if (!titleText && !links.length) return;
      const contentCell = [];
      if (titleText) {
        const h = document2.createElement("h3");
        h.textContent = titleText;
        contentCell.push(h);
      }
      links.forEach((a) => {
        const link = document2.createElement("a");
        link.href = a.getAttribute("href");
        link.textContent = a.textContent.replace(/\s+/g, " ").trim();
        const p = document2.createElement("p");
        p.append(link);
        contentCell.push(p);
      });
      cells.push([contentCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-related-tags", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-articles.js
  function parse2(element, { document: document2 }) {
    const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
    let items = [...element.querySelectorAll(".gallery-list__item-details")].map((details) => {
      const card = details.closest(".gallery-list__item-link, article, .gallery-list__item") || details.parentElement;
      return { details, card };
    });
    if (!items.length) {
      items = [...element.querySelectorAll(".gallery-list__item:not(.gallery-list__item--empty)")].map((card) => ({ details: card, card }));
    }
    const cells = [];
    items.forEach(({ details, card }) => {
      var _a;
      const img = card.querySelector(".gallery-list__image img, .gallery-list__image__tags-ctn img, img");
      const titleEl = details.querySelector(".gallery-list__item-title, a#pageTitle") || card.querySelector(".gallery-list__item-title");
      const titleText = clean(titleEl && titleEl.textContent);
      const href = titleEl && titleEl.getAttribute("href") || ((_a = card.querySelector("a#itemImageLink, .gallery-list__image__tags-ctn > a[href]")) == null ? void 0 : _a.getAttribute("href"));
      const tagLink = card.querySelector(".gallery-list__tags-ctn:not(.gallery-list__tags-ctn--mobile) .gallery-list__tag a[href]");
      const tagMobile = card.querySelector(".gallery-list__tag--mobile");
      const tagText = clean(tagLink ? tagLink.textContent : tagMobile && tagMobile.textContent);
      const descEl = details.querySelector(".gallery-list__item-desc");
      const descText = clean(descEl && descEl.textContent);
      if (!titleText && !descText && !img) return;
      const body = [];
      if (tagText) {
        const p = document2.createElement("p");
        if (tagLink) {
          const a = document2.createElement("a");
          a.href = tagLink.getAttribute("href").replace(/%20&%20/g, "%20%26%20");
          a.textContent = tagText;
          p.append(a);
        } else {
          p.textContent = tagText;
        }
        body.push(p);
      }
      if (titleText) {
        const h = document2.createElement("h3");
        if (href) {
          const a = document2.createElement("a");
          a.href = href;
          a.textContent = titleText;
          h.append(a);
        } else {
          h.textContent = titleText;
        }
        body.push(h);
      }
      if (descText) {
        const p = document2.createElement("p");
        p.textContent = descText;
        body.push(p);
      }
      let imageCell = "";
      if (img) {
        const newImg = document2.createElement("img");
        newImg.src = img.getAttribute("src");
        newImg.alt = img.getAttribute("alt") || titleText;
        imageCell = newImg;
      }
      cells.push([imageCell, body]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-articles", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/datacom-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // OneTrust cookie consent: <div id="onetrust-consent-sdk">
        "#onetrust-consent-sdk",
        // Sticky header tabs bar (duplicate title + Marketo "Connect with an expert" modal):
        // <div class="sticky-header tabs panelcontainer ...">
        ".sticky-header",
        // Reading progress bar: <div class="page-scroll-indicator ...">
        ".page-scroll-indicator",
        // Social share / clap widgets: <div class="article-cover__social-media-ctn">,
        // <div class="article-body__social-media-ctn"> (both wrap .social-shares-claps__ctn)
        ".article-cover__social-media-ctn",
        ".article-body__social-media-ctn",
        ".social-shares-claps__ctn",
        // Marketo / reCAPTCHA leftovers at body root
        "form.mktoForm",
        "#mktoStyleLoaded",
        ".grecaptcha-badge"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Header + mega nav + site-update alert banner:
        // <div class="header-mega ..."><header class="cmp-header-mega">
        //   <div class="datacom cmp-header-mega__alert-banner">...
        ".header-mega",
        "header.cmp-header-mega",
        ".cmp-header-mega-overlay",
        ".cmp-alert-banner__ctn",
        // Footer: <footer class="footer aem-GridColumn ...">
        "footer.footer",
        // Empty embedded video placeholder: <div class="embedded-video ..."> </div>
        ".embedded-video",
        // Empty spacer: <div class="ghost aem-GridColumn ...">
        ".ghost",
        // Decorative clock icon before read time: <i class="fal fa-clock">
        ".article-cover__top-row i.fa-clock",
        // Tracking / cross-domain iframes
        "#destination_publishing_iframe_datacom_0",
        "#MktoForms2XDIframe",
        '[id^="batBeacon"]',
        // Twitter/X ad pixels (consent-gated 1x1 imgs): <img height="1" width="1" data-src="https://t.co/i/adsct...">
        'img[height="1"][width="1"]',
        'img[src*="/i/adsct"]',
        // Safe generic removals
        "iframe",
        "link",
        "noscript",
        "script",
        "style",
        "source"
      ]);
    }
  }

  // tools/importer/transformers/datacom-dm-images.js
  function detectDynamicMediaUrl(urlStr) {
    if (typeof urlStr !== "string") return false;
    if (!/^(https?:\/\/|\/\/)/i.test(urlStr)) return false;
    let u;
    try {
      u = new URL(urlStr, "https://x/");
    } catch (e) {
      return false;
    }
    if (u.pathname.startsWith("/is/image/")) {
      return "scene7";
    }
    if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname) && u.pathname.startsWith("/adobe/assets/urn:")) {
      return "dm-openapi";
    }
    return false;
  }
  var LINKED_DM_INLINE_WRAPPER_TAGS = /* @__PURE__ */ new Set(["PICTURE"]);
  var LINKED_DM_WRAPPER_SIBLING_TAGS = /* @__PURE__ */ new Set(["SOURCE"]);
  function findLinkedDmCarrier(img) {
    if (!img || !img.parentElement) return null;
    let node = img;
    let parent = img.parentElement;
    while (parent && LINKED_DM_INLINE_WRAPPER_TAGS.has(parent.tagName)) {
      let foundNode = false;
      for (const child of parent.children) {
        if (child === node) {
          foundNode = true;
        } else if (!LINKED_DM_WRAPPER_SIBLING_TAGS.has(child.tagName)) {
          return null;
        }
      }
      if (!foundNode) return null;
      node = parent;
      parent = parent.parentElement;
    }
    if (!parent || parent.tagName !== "A") return null;
    if (parent.children.length !== 1 || parent.children[0] !== node) return null;
    if (parent.textContent.trim() !== "") return null;
    return parent;
  }
  var EMPTY_ALT_SENTINEL = "Image without alt text";
  function altToLinkText(alt) {
    return alt || EMPTY_ALT_SENTINEL;
  }
  function transform2(hookName, element, payload) {
    if (hookName === "afterTransform") {
      const doc = element.ownerDocument;
      element.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        if (!detectDynamicMediaUrl(src)) return;
        const alt = img.getAttribute("alt") || "";
        const linkedAnchor = findLinkedDmCarrier(img);
        if (linkedAnchor) {
          linkedAnchor.setAttribute("title", src);
          linkedAnchor.textContent = altToLinkText(alt);
          return;
        }
        const parent = img.parentElement;
        if (parent && parent.tagName === "A") {
          console.warn("DM image inside mixed-content anchor, skipped:", src);
          return;
        }
        const a = doc.createElement("a");
        a.href = src;
        a.textContent = altToLinkText(alt);
        img.replaceWith(a);
      });
    }
  }

  // tools/importer/transformers/datacom-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform3(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-articles.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "cards-related-tags": parse,
    "cards-articles": parse2
  };
  var transformers = [
    transform,
    transform2,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform3] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_articles_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_articles_exports);
})();
