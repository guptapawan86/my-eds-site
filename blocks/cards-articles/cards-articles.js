import { createOptimizedPicture } from '../../scripts/aem.js';

/** Removes the button styling decorateButtons() may have applied to a card link. */
function unbutton(a) {
  a.classList.remove('button', 'primary', 'secondary', 'accent');
  if (!a.classList.length) a.removeAttribute('class');
  const wrapper = a.closest('.button-wrapper, .button-container');
  if (wrapper) {
    wrapper.classList.remove('button-wrapper', 'button-container');
    if (!wrapper.classList.length) wrapper.removeAttribute('class');
  }
}

/**
 * When image and text were authored in one cell, lift the leading image
 * (a <picture>, optionally linked and/or wrapped in a <p>) into its own cell.
 * @param {Element} body
 * @returns {Element|null} the new image cell
 */
function extractImageCell(body) {
  const pic = body.querySelector('picture');
  if (!pic) return null;
  let top = pic.closest('a') && body.contains(pic.closest('a')) ? pic.closest('a') : pic;
  if (top.parentElement !== body && top.parentElement.tagName === 'P'
    && top.parentElement.parentElement === body
    && top.parentElement.textContent.trim() === top.textContent.trim()) {
    top = top.parentElement;
  }
  if (top.parentElement !== body) return null;
  const cell = document.createElement('div');
  cell.append(top);
  return cell;
}

/**
 * Cards (articles) - related-article cards.
 * Each row is one card: an image cell (optionally linked) and a body cell holding
 * an industry tag paragraph, a linked title heading and a description paragraph.
 * Cells may be omitted or reordered; the image cell is detected by content.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-articles-card';

    const cells = [...row.children];
    let imageCell = null;
    const bodyCells = [];
    cells.forEach((cell) => {
      const pic = cell.querySelector('picture, img');
      const textOnlyImage = pic && !cell.querySelector('h1, h2, h3, h4, h5, h6')
        && cell.querySelectorAll('p').length <= 2;
      if (!imageCell && textOnlyImage) imageCell = cell;
      else if (cell.textContent.trim() || cell.children.length) bodyCells.push(cell);
    });

    if (!imageCell && !bodyCells.length) return;

    const body = bodyCells[0] || null;
    if (body) bodyCells.slice(1).forEach((extra) => body.append(...extra.childNodes));
    if (!imageCell && body) imageCell = extractImageCell(body);

    if (imageCell) {
      imageCell.className = 'cards-articles-card-image';
      li.append(imageCell);
    }

    if (body && (body.textContent.trim() || body.children.length)) {
      body.className = 'cards-articles-card-body';

      const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        heading.classList.add('cards-articles-card-title');
        // paragraphs before the title are the tag line
        let prev = heading.previousElementSibling;
        while (prev) {
          if (prev.tagName === 'P') prev.classList.add('cards-articles-card-tag');
          prev = prev.previousElementSibling;
        }
        // paragraphs after the title are the description
        let next = heading.nextElementSibling;
        while (next) {
          if (next.tagName === 'P') next.classList.add('cards-articles-card-description');
          next = next.nextElementSibling;
        }
      } else {
        // no heading: treat a lone bold/linked paragraph as the title
        const paras = [...body.querySelectorAll(':scope > p')];
        const titleP = paras.find((p) => p.querySelector('a, strong')) || null;
        if (titleP) titleP.classList.add('cards-articles-card-title');
      }

      // links inside the card body should not be decorated as buttons
      body.querySelectorAll('a').forEach(unbutton);

      li.append(body);
    }

    // if the image is not linked but the title is, link the image to the same article
    const titleLink = li.querySelector('.cards-articles-card-title a');
    const picture = li.querySelector('.cards-articles-card-image picture');
    if (titleLink && picture && !picture.closest('a')) {
      const a = document.createElement('a');
      a.href = titleLink.getAttribute('href');
      a.setAttribute('aria-hidden', 'true');
      a.tabIndex = -1;
      picture.replaceWith(a);
      a.append(picture);
    }

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    // external (e.g. Scene7) pictures are already responsive; optimizing them strips the host
    if (new URL(img.src, window.location.href).origin !== window.location.origin) return;
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
    );
  });

  block.replaceChildren(ul);
}
