// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 1200px)');

const ICONS = {
  chevronDown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8l9 8 9-8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h17M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>',
  arrowLeft: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12H4M11 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5L22 22" stroke="currentColor" stroke-width="2"/></svg>',
};

function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html) e.innerHTML = html;
  return e;
}

/**
 * Fetches the nav fragment: /content first (local preview), then the site root (DA/EDS).
 * Relative image paths are resolved against the fragment URL.
 * @returns {Promise<Element|null>} container holding the nav sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  container.querySelectorAll('img').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
    img.loading = 'lazy';
  });
  return container;
}

/* ---------- content readers (fragment DOM -> plain objects) ---------- */

function directChildren(parent, tag) {
  return parent ? [...parent.children].filter((c) => c.tagName === tag) : [];
}

function readCard(li) {
  const paras = directChildren(li, 'P');
  const img = li.querySelector(':scope > p img');
  const titleP = paras.find((p) => p.querySelector('strong'));
  const titleLink = titleP && titleP.querySelector('a');
  const desc = paras.find((p) => p !== titleP && !p.querySelector('img'));
  const childList = directChildren(li, 'UL')[0];
  return {
    title: titleP ? titleP.textContent.trim() : '',
    href: titleLink ? titleLink.getAttribute('href') : null,
    img,
    desc: desc ? desc.textContent.trim() : '',
    children: childList ? directChildren(childList, 'LI').map(readCard) : null,
  };
}

function readHero(scope) {
  const h = directChildren(scope, 'H3')[0];
  if (!h) return null;
  const imgP = h.nextElementSibling && h.nextElementSibling.querySelector('img')
    ? h.nextElementSibling : null;
  const descP = (imgP || h).nextElementSibling;
  const link = h.querySelector('a');
  return {
    title: h.textContent.trim(),
    href: link ? link.getAttribute('href') : null,
    img: imgP ? imgP.querySelector('img') : null,
    desc: descP && descP.tagName === 'P' ? descP.textContent.trim() : '',
  };
}

function readCards(scope) {
  const list = directChildren(scope, 'UL')[0];
  return list ? directChildren(list, 'LI').map(readCard) : [];
}

/* ---------- renderers ---------- */

function renderHero(hero) {
  const a = el('a', 'nav-hero');
  a.href = hero.href || '#';
  if (hero.img) {
    const img = hero.img.cloneNode(true);
    img.alt = '';
    a.append(img);
  }
  a.append(el('span', 'nav-hero-overlay'));
  const text = el('span', 'nav-hero-text');
  const title = el('span', 'nav-hero-title');
  title.textContent = hero.title;
  title.insertAdjacentHTML('beforeend', `<span class="nav-icon">${ICONS.arrowRight}</span>`);
  text.append(title);
  if (hero.desc) {
    const desc = el('span', 'nav-hero-desc');
    desc.textContent = hero.desc;
    text.append(desc);
  }
  a.append(text);
  return a;
}

function renderCard(card, onDrill) {
  const isDrill = card.children && card.children.length;
  const item = el(isDrill ? 'button' : 'a', `nav-card${isDrill ? ' nav-card-drill' : ''}`);
  if (isDrill) {
    item.type = 'button';
    item.addEventListener('click', () => onDrill(card));
  } else {
    item.href = card.href || '#';
  }
  const media = el('span', 'nav-card-image');
  if (card.img) media.append(card.img.cloneNode(true));
  if (isDrill) media.insertAdjacentHTML('beforeend', `<span class="nav-card-chevron">${ICONS.chevronRight}</span>`);
  item.append(media);
  const title = el('span', 'nav-card-title');
  title.textContent = card.title;
  if (!isDrill) title.insertAdjacentHTML('beforeend', `<span class="nav-icon">${ICONS.arrowRight}</span>`);
  item.append(title);
  if (card.desc) {
    const desc = el('span', 'nav-card-desc');
    desc.textContent = card.desc;
    item.append(desc);
  }
  return item;
}

function renderCardGrid(cards, backLabel) {
  const grid = el('div', 'nav-cards');
  const show = (list, parent) => {
    grid.replaceChildren();
    if (parent) {
      const back = el('button', 'nav-card nav-card-back');
      back.type = 'button';
      back.innerHTML = `<span class="nav-card-image"><span class="nav-icon">${ICONS.chevronLeft}</span></span><span class="nav-card-title"></span>`;
      back.querySelector('.nav-card-title').textContent = backLabel;
      back.addEventListener('click', () => show(cards, null));
      grid.append(back);
    }
    list.forEach((c) => grid.append(renderCard(c, (drill) => show(drill.children, drill))));
  };
  show(cards, null);
  return grid;
}

/** Mobile sub-panel header: back, centred title, close. Hidden on desktop. */
function renderPanelHead(title) {
  const head = el('div', 'nav-panel-head');
  const back = el('button', 'nav-back', ICONS.arrowLeft);
  back.type = 'button';
  back.setAttribute('aria-label', 'Back');
  const heading = el('p', 'nav-panel-title');
  heading.textContent = title;
  const close = el('button', 'nav-close', ICONS.close);
  close.type = 'button';
  close.setAttribute('aria-label', 'Close menu');
  head.append(back, heading, close);
  return head;
}

function renderTieredPanel(categories) {
  const panel = el('div', 'nav-panel-inner nav-panel-tiered');
  const tabs = el('div', 'nav-cats');
  tabs.setAttribute('role', 'tablist');
  const content = el('div', 'nav-cat-content');
  const views = [];
  const activate = (index) => {
    tabs.querySelectorAll('.nav-cat').forEach((t, i) => t.setAttribute('aria-selected', i === index));
    views.forEach((v, i) => { v.hidden = i !== index; });
  };
  categories.forEach((cat, index) => {
    const tab = el('button', 'nav-cat');
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.textContent = cat.label;
    tab.insertAdjacentHTML('beforeend', `<span class="nav-icon">${ICONS.chevronRight}</span>`);
    tab.addEventListener('click', () => {
      activate(index);
      panel.classList.add('cat-open');
    });
    tabs.append(tab);
    const view = el('div', 'nav-cat-view');
    view.setAttribute('role', 'tabpanel');
    view.append(renderPanelHead(cat.label));
    if (cat.hero) view.append(renderHero(cat.hero));
    view.append(renderCardGrid(cat.cards));
    views.push(view);
    content.append(view);
  });
  activate(0);
  panel.append(tabs, content);
  return panel;
}

function renderCardsPanel(hero, cards, label) {
  const panel = el('div', 'nav-panel-inner nav-panel-cards');
  if (hero) panel.append(renderHero(hero));
  panel.append(renderCardGrid(cards, `Back to ${label.toLowerCase()}`));
  return panel;
}

/**
 * Builds a top-level nav item: a plain link, or a trigger with its megamenu panel.
 * Tiered panels have categories (each with its own hero + cards); flat panels have cards.
 */
function buildNavItem(li) {
  const item = el('li', 'nav-item');
  const directLink = li.querySelector(':scope > a');
  if (directLink) {
    const a = directLink.cloneNode(true);
    a.className = 'nav-link';
    a.insertAdjacentHTML('beforeend', `<span class="nav-icon nav-link-chevron">${ICONS.chevronRight}</span>`);
    item.append(a);
    return item;
  }
  const label = directChildren(li, 'P')[0].textContent.trim();
  const trigger = el('button', 'nav-link nav-trigger');
  trigger.type = 'button';
  trigger.textContent = label;
  trigger.insertAdjacentHTML('beforeend', `<span class="nav-icon nav-link-chevron">${ICONS.chevronRight}</span>`);
  trigger.setAttribute('aria-expanded', 'false');
  item.append(trigger);

  const panel = el('div', 'nav-panel');
  panel.append(renderPanelHead(label));
  const list = directChildren(li, 'UL')[0];
  const lis = directChildren(list, 'LI');
  // categories start with a text-only label; cards start with their image
  const tiered = lis.length && lis.every((c) => {
    const first = directChildren(c, 'P')[0];
    return directChildren(c, 'UL').length && first && !first.querySelector('img');
  });
  if (tiered) {
    panel.append(renderTieredPanel(lis.map((c) => ({
      label: directChildren(c, 'P')[0].textContent.trim(),
      hero: readHero(c),
      cards: readCards(c),
    }))));
  } else {
    panel.append(renderCardsPanel(readHero(li), readCards(li), label));
  }
  item.classList.add('nav-drop');
  item.append(panel);
  return item;
}

function buildAlert(section) {
  const alert = el('div', 'nav-alert');
  const inner = el('div', 'nav-alert-inner');
  const text = el('div', 'nav-alert-text');
  text.append(...section.childNodes);
  const expand = el('button', 'nav-alert-expand', ICONS.chevronDown);
  expand.type = 'button';
  expand.setAttribute('aria-label', 'Show full message');
  expand.setAttribute('aria-expanded', 'false');
  expand.addEventListener('click', () => {
    const open = expand.getAttribute('aria-expanded') !== 'true';
    expand.setAttribute('aria-expanded', open);
    alert.classList.toggle('expanded', open);
  });
  const close = el('button', 'nav-alert-close', ICONS.close);
  close.type = 'button';
  close.setAttribute('aria-label', 'Close message');
  close.addEventListener('click', () => {
    alert.hidden = true;
    alert.closest('header').classList.add('alert-dismissed');
  });
  inner.append(text, expand, close);
  alert.append(inner);
  return alert;
}

function buildSearch(section, nav) {
  const search = el('div', 'nav-search');
  const actionLink = section.querySelector(':scope > p > a');
  const labels = directChildren(section, 'P');
  const form = el('form', 'nav-search-form');
  form.action = actionLink ? actionLink.getAttribute('href') : '/search';
  form.setAttribute('role', 'search');
  const back = el('button', 'nav-search-back', ICONS.arrowLeft);
  back.type = 'button';
  back.setAttribute('aria-label', 'Close search');
  const input = el('input', 'nav-search-input');
  input.type = 'search';
  input.name = 'search';
  input.autocomplete = 'off';
  input.placeholder = actionLink ? actionLink.textContent.trim() : '';
  input.setAttribute('aria-label', input.placeholder);
  form.append(back, el('span', 'nav-search-icon', ICONS.search), input);

  const quick = el('div', 'nav-search-quick');
  const quickTitle = labels[1];
  if (quickTitle) quick.append(el('p', 'nav-search-quick-title', quickTitle.innerHTML));
  const list = directChildren(section, 'UL')[0];
  if (list) quick.append(list);
  search.append(form, quick);

  const open = el('button', 'nav-search-open', ICONS.search);
  open.type = 'button';
  open.setAttribute('aria-label', 'Search');
  const setOpen = (state) => {
    nav.classList.toggle('search-open', state);
    nav.closest('header').classList.toggle('overlay-open', state);
    if (state) input.focus();
  };
  open.addEventListener('click', () => setOpen(true));
  back.addEventListener('click', () => setOpen(false));
  return { search, open, close: () => setOpen(false) };
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  if (!fragment) return;
  const sections = directChildren(fragment, 'DIV');
  const [alertSection, brandSection, navSection, toolsSection, searchSection] = sections;

  block.textContent = '';
  const wrapper = el('div', 'nav-wrapper');
  const nav = el('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');

  if (alertSection) wrapper.append(buildAlert(alertSection));

  const bar = el('div', 'nav-bar');
  const brand = el('div', 'nav-brand');
  if (brandSection) brand.append(...brandSection.childNodes);
  const brandImg = brand.querySelector('img');
  if (brandImg) brandImg.loading = 'eager';

  const navSections = el('div', 'nav-sections');
  const navList = el('ul', 'nav-list');
  const sourceList = navSection ? navSection.querySelector(':scope > ul') : null;
  directChildren(sourceList, 'LI').forEach((li) => navList.append(buildNavItem(li)));
  navSections.append(navList);

  const tools = el('div', 'nav-tools');
  if (toolsSection) {
    const signIn = toolsSection.querySelector('a');
    if (signIn) {
      signIn.className = 'nav-cta';
      tools.append(signIn);
    }
  }

  const overlay = el('div', 'nav-overlay');
  const closeAllPanels = () => {
    navList.querySelectorAll('.nav-trigger[aria-expanded="true"]').forEach((t) => t.setAttribute('aria-expanded', 'false'));
    navList.querySelectorAll('.cat-open').forEach((t) => t.classList.remove('cat-open'));
    wrapper.closest('header').classList.toggle('overlay-open', nav.classList.contains('search-open'));
  };

  // mobile menu: hamburger morphs to a cross and opens the full-screen menu
  const hamburger = el('button', 'nav-hamburger', '<span></span><span></span><span></span>');
  hamburger.type = 'button';
  hamburger.setAttribute('aria-controls', 'nav');
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  const toggleMenu = (open) => {
    const header = wrapper.closest('header');
    header.classList.toggle('menu-open', open);
    hamburger.setAttribute('aria-expanded', open);
    hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.style.overflowY = open && !isDesktop.matches ? 'hidden' : '';
    if (!open) closeAllPanels();
  };
  hamburger.addEventListener('click', () => toggleMenu(hamburger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => {
    const back = e.target.closest('.nav-back');
    if (back) {
      const tiered = back.closest('.nav-cat-view') && back.closest('.nav-panel-tiered');
      if (tiered) tiered.classList.remove('cat-open');
      else closeAllPanels();
    }
    if (e.target.closest('.nav-close')) toggleMenu(false);
  });

  let searchApi = null;
  if (searchSection) {
    searchApi = buildSearch(searchSection, nav);
    tools.append(searchApi.open);
  }

  navList.querySelectorAll('.nav-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      closeAllPanels();
      if (!expanded) {
        trigger.setAttribute('aria-expanded', 'true');
        wrapper.closest('header').classList.add('overlay-open');
      }
    });
  });

  overlay.addEventListener('click', () => {
    closeAllPanels();
    if (searchApi) searchApi.close();
  });
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    closeAllPanels();
    if (searchApi) searchApi.close();
    if (!isDesktop.matches) toggleMenu(false);
  });

  bar.append(brand, navSections, tools, hamburger);
  if (searchApi) bar.append(searchApi.search);
  nav.append(bar);
  wrapper.append(nav, overlay);
  block.append(wrapper);

  // reset open states when crossing the desktop breakpoint
  isDesktop.addEventListener('change', () => {
    toggleMenu(false);
    if (searchApi) searchApi.close();
  });
}
