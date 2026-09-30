/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-related-tags. Base: cards (1-column, no images).
 * Source: https://datacom.com/au/en/insights/articles/why-technology-supply-chains-remain-under-pressure
 * Selector: .article-body__right-column
 * Output: one row per tag group; single cell = [h3 group title, p>a per tag].
 * Matches blocks/cards-related-tags decorator (heading title + tag links per row).
 * Generated: 2026-09-30
 */
export default function parse(element, { document }) {
  // Groups: .article-body__tag-ctn (industries-tags / solutions-tags).
  // Fallback: any direct child that contains a tag header.
  let groups = [...element.querySelectorAll(':scope .article-body__tag-ctn')];
  if (!groups.length) {
    groups = [...element.querySelectorAll(':scope > div')].filter((d) => d.querySelector('[class*="tag-header"]'));
  }

  const cells = [];
  groups.forEach((group) => {
    const headerEl = group.querySelector('.article-body__tag-header, [class*="tag-header"], h2, h3, h4');
    const titleText = headerEl ? headerEl.textContent.replace(/\s+/g, ' ').trim() : '';

    // Tag links: iterate the stable span wrappers, not the anchors themselves.
    const list = group.querySelector('.article-body__tag-list, [class*="tag-list"]') || group;
    let links = [...list.querySelectorAll(':scope .article-body__tag, :scope .datacom-tag')]
      .map((span) => span.querySelector('a[href]'))
      .filter(Boolean);
    if (!links.length) links = [...list.querySelectorAll('a[href]')];
    links = links.filter((a, i, arr) => arr.indexOf(a) === i);

    if (!titleText && !links.length) return;

    const contentCell = [];
    if (titleText) {
      const h = document.createElement('h3');
      h.textContent = titleText;
      contentCell.push(h);
    }
    links.forEach((a) => {
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
      const p = document.createElement('p');
      p.append(link);
      contentCell.push(p);
    });
    cells.push([contentCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-related-tags', cells });
  element.replaceWith(block);
}
