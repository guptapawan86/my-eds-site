const isGap = (n) => n && (n.nodeName === 'BR' || (n.nodeType === 3 && !n.textContent.trim()));

/**
 * Prepares media in a fetched plain.html fragment (nav, footer) for use on any page:
 * - resolves relative img/source URLs against the fragment URL
 * - rejoins linked images: Word stores them as the image followed by a link whose
 *   text is the URL, so the image is moved into that link
 * - merges adjacent links to the same URL (e.g. a label link and its icon link)
 * @param {Element} container the parsed fragment
 * @param {string} base URL the fragment was fetched from
 */
// eslint-disable-next-line import/prefer-default-export
export function normalizeFragmentMedia(container, base) {
  container.querySelectorAll('img').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), base).href;
    img.loading = 'lazy';
  });
  container.querySelectorAll('source[srcset]').forEach((source) => {
    source.srcset = source.getAttribute('srcset').split(',').map((part) => {
      const [url, descriptor] = part.trim().split(/\s+/);
      return [new URL(url, base).href, descriptor].filter(Boolean).join(' ');
    }).join(', ');
  });

  container.querySelectorAll('a').forEach((a) => {
    if (a.textContent.trim() !== a.getAttribute('href')) return;
    let prev = a.previousSibling;
    const gaps = [];
    while (isGap(prev)) {
      gaps.push(prev);
      prev = prev.previousSibling;
    }
    if (!prev || !['PICTURE', 'IMG'].includes(prev.nodeName)) return;
    gaps.forEach((n) => n.remove());
    a.replaceChildren(prev);
  });

  container.querySelectorAll('a').forEach((a) => {
    if (!a.isConnected) return;
    let next = a.nextSibling;
    const gaps = [];
    while (isGap(next)) {
      gaps.push(next);
      next = next.nextSibling;
    }
    if (next && next.nodeName === 'A' && next.getAttribute('href') === a.getAttribute('href')) {
      gaps.forEach((n) => n.remove());
      a.append(...next.childNodes);
      next.remove();
    }
  });
}
