/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-articles. Base: cards (2-column).
 * Source: https://datacom.com/au/en/insights/articles/why-technology-supply-chains-remain-under-pressure
 * Selector: .gallery.dark-theme .gallery-list
 * Output: one row per card: [image, [tag p, h3>a title, description p]].
 * Share icons and empty placeholder items are omitted; the duplicated
 * desktop/mobile industry tag is emitted once.
 * Generated: 2026-09-30
 */
export default function parse(element, { document }) {
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();

  // Iterate the stable inner details wrapper (block-level div), skipping
  // .gallery-list__item--empty placeholders (they have no details).
  let items = [...element.querySelectorAll('.gallery-list__item-details')].map((details) => {
    const card = details.closest('.gallery-list__item-link, article, .gallery-list__item') || details.parentElement;
    return { details, card };
  });
  if (!items.length) {
    items = [...element.querySelectorAll('.gallery-list__item:not(.gallery-list__item--empty)')]
      .map((card) => ({ details: card, card }));
  }

  const cells = [];
  items.forEach(({ details, card }) => {
    // Image
    const img = card.querySelector('.gallery-list__image img, .gallery-list__image__tags-ctn img, img');

    // Title + link
    const titleEl = details.querySelector('.gallery-list__item-title, a#pageTitle')
      || card.querySelector('.gallery-list__item-title');
    const titleText = clean(titleEl && titleEl.textContent);
    const href = (titleEl && titleEl.getAttribute('href'))
      || card.querySelector('a#itemImageLink, .gallery-list__image__tags-ctn > a[href]')?.getAttribute('href');

    // Industry tag: prefer desktop linked tag, fall back to mobile text tag (de-duplicated)
    const tagLink = card.querySelector('.gallery-list__tags-ctn:not(.gallery-list__tags-ctn--mobile) .gallery-list__tag a[href]');
    const tagMobile = card.querySelector('.gallery-list__tag--mobile');
    const tagText = clean(tagLink ? tagLink.textContent : tagMobile && tagMobile.textContent);

    // Description
    const descEl = details.querySelector('.gallery-list__item-desc');
    const descText = clean(descEl && descEl.textContent);

    if (!titleText && !descText && !img) return;

    const body = [];
    if (tagText) {
      const p = document.createElement('p');
      if (tagLink) {
        const a = document.createElement('a');
        // source leaves "&" unencoded inside tag names (e.g. "Transportation%20&%20logistics")
        a.href = tagLink.getAttribute('href').replace(/%20&%20/g, '%20%26%20');
        a.textContent = tagText;
        p.append(a);
      } else {
        p.textContent = tagText;
      }
      body.push(p);
    }
    if (titleText) {
      const h = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleText;
        h.append(a);
      } else {
        h.textContent = titleText;
      }
      body.push(h);
    }
    if (descText) {
      const p = document.createElement('p');
      p.textContent = descText;
      body.push(p);
    }

    let imageCell = '';
    if (img) {
      const newImg = document.createElement('img');
      newImg.src = img.getAttribute('src');
      newImg.alt = img.getAttribute('alt') || titleText;
      imageCell = newImg;
    }

    cells.push([imageCell, body]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-articles', cells });
  element.replaceWith(block);
}
