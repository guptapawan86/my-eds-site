/**
 * Cards (related tags) - taxonomy tag groups (e.g. "Related industries").
 * Each row is one group: a title (heading or bold paragraph) followed by tag links.
 * Authors may put the title and links in one cell or in separate cells, and may
 * author the links as paragraphs (one per tag), a list, or several links in one paragraph.
 * @param {Element} block
 */

const HEADING = /^H[1-6]$/;

/** Removes the button styling decorateButtons() may have applied to a tag link. */
function unbutton(a) {
  a.classList.remove('button', 'primary', 'secondary', 'accent');
  const wrapper = a.closest('.button-wrapper, .button-container');
  if (wrapper) {
    wrapper.classList.remove('button-wrapper', 'button-container');
    if (!wrapper.classList.length) wrapper.removeAttribute('class');
  }
}

/** Finds the group title: a heading, else a paragraph that is only bold text. */
function findTitle(nodes) {
  const heading = nodes.find((el) => HEADING.test(el.tagName));
  if (heading) return heading;
  return nodes.find((el) => {
    if (el.tagName !== 'P' || el.querySelector('a')) return false;
    const strong = el.querySelector('strong, b');
    return strong && el.textContent.trim() === strong.textContent.trim();
  }) || null;
}

/** Builds the title element, reusing an authored heading so its id (anchor) survives. */
function buildTitle(titleEl, looseText) {
  let heading;
  if (titleEl && HEADING.test(titleEl.tagName)) {
    heading = titleEl;
  } else {
    heading = document.createElement('h3');
    if (titleEl) heading.append(...titleEl.childNodes);
    else heading.textContent = looseText;
  }
  heading.classList.add('cards-related-tags-title');
  // unwrap a lone <strong>/<b> used as the title marker
  const strong = heading.querySelector(':scope > strong:only-child, :scope > b:only-child');
  if (strong && heading.textContent.trim() === strong.textContent.trim()) {
    strong.replaceWith(...strong.childNodes);
  }
  return heading;
}

export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'cards-related-tags-groups';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const nodes = cells.flatMap((cell) => [...cell.children]);
    // Plain text directly in a cell (no wrapping element) is treated as the title.
    const looseText = cells
      .map((c) => (c.children.length ? '' : c.textContent.trim()))
      .find(Boolean);

    const titleEl = findTitle(nodes);
    const links = nodes
      .filter((el) => el !== titleEl)
      .flatMap((el) => (el.tagName === 'A' ? [el] : [...el.querySelectorAll('a[href]')]))
      .filter((a) => a.textContent.trim());

    if (!titleEl && !looseText && !links.length) return;

    const li = document.createElement('li');
    li.className = 'cards-related-tags-group';

    if (titleEl || looseText) li.append(buildTitle(titleEl, looseText));

    if (links.length) {
      const tags = document.createElement('ul');
      tags.className = 'cards-related-tags-list';
      links.forEach((a) => {
        unbutton(a);
        a.classList.add('cards-related-tags-tag');
        const tag = document.createElement('li');
        tag.append(a);
        tags.append(tag);
      });
      li.append(tags);
    }

    list.append(li);
  });

  block.replaceChildren(list);
}
