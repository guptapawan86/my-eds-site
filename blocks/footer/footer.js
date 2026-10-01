const ICONS = {
  arrowUpRight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  chevronDown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
};

// below this width headed columns collapse into an accordion
const isDesktop = window.matchMedia('(width >= 900px)');

function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html) e.innerHTML = html;
  return e;
}

function directChildren(parent, tag) {
  return parent ? [...parent.children].filter((c) => c.tagName === tag) : [];
}

/**
 * Fetches the footer fragment: /content first (local preview), then the site root (DA/EDS).
 * Relative image paths are resolved against the fragment URL.
 * @returns {Promise<Element|null>} container holding the footer sections
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  container.querySelectorAll('img').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
    img.loading = 'lazy';
  });
  return container;
}

function isExternal(a) {
  return new URL(a.href, window.location.href).origin !== window.location.origin;
}

/** A column: optional heading + list of links; external links open in a new tab. */
function buildColumn(section) {
  const col = el('div', 'footer-column');
  const heading = directChildren(section, 'H2')[0];
  const list = directChildren(section, 'UL')[0];
  let toggle = null;
  if (heading) {
    toggle = el('button', 'footer-column-label');
    toggle.type = 'button';
    toggle.textContent = heading.textContent.trim();
    toggle.insertAdjacentHTML('beforeend', `<span class="footer-column-chevron">${ICONS.chevronDown}</span>`);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => {
      if (isDesktop.matches) return;
      toggle.setAttribute('aria-expanded', toggle.getAttribute('aria-expanded') !== 'true');
    });
    col.classList.add('footer-column-collapsible');
    col.append(toggle);
  }
  if (list) {
    list.className = 'footer-links';
    list.querySelectorAll('a').forEach((a) => {
      a.className = 'footer-link';
      a.querySelectorAll('img').forEach((img) => img.classList.add('footer-link-icon'));
      if (isExternal(a)) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.insertAdjacentHTML('beforeend', `<span class="footer-link-arrow">${ICONS.arrowUpRight}</span>`);
      }
    });
    if (toggle) {
      // grid wrapper animates the accordion height on mobile
      const panel = el('div', 'footer-column-panel');
      const inner = el('div', 'footer-column-panel-inner');
      inner.append(list);
      panel.append(inner);
      col.append(panel);
    } else {
      col.append(list);
    }
  }
  return col;
}

/**
 * Locale picker: trigger label, title, description, select label, option links, submit label.
 * Continue swaps the locale prefix of the current path for the chosen option's prefix.
 */
function buildLocale(section) {
  const paras = directChildren(section, 'P');
  const [triggerP, descP, selectLabelP] = paras;
  const submitP = paras[paras.length - 1];
  const options = [...section.querySelectorAll('ul a')].map((a) => ({
    label: a.textContent.trim(),
    prefix: a.getAttribute('href').replace(/\/$/, ''),
    flag: a.querySelector('img'),
  }));
  const path = window.location.pathname;
  let selected = options.findIndex((o) => path.includes(`${o.prefix}/`) || path.endsWith(o.prefix));
  if (selected < 0) selected = options.length - 1;

  const wrap = el('div', 'footer-locale');
  const trigger = el('button', 'footer-locale-btn');
  trigger.type = 'button';
  trigger.textContent = triggerP.textContent.trim();
  trigger.insertAdjacentHTML('beforeend', ICONS.globe);

  const dialog = el('dialog', 'footer-locale-dialog');
  const card = el('div', 'footer-locale-card');
  const close = el('button', 'footer-locale-close', ICONS.close);
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  const title = el('h2', 'footer-locale-title');
  title.textContent = directChildren(section, 'H2')[0].textContent.trim();
  const desc = el('p', 'footer-locale-desc');
  desc.textContent = descP.textContent.trim();

  const field = el('div', 'footer-locale-field');
  const fieldLabel = el('span', 'footer-locale-label');
  fieldLabel.textContent = selectLabelP.textContent.trim();
  const select = el('button', 'footer-locale-select');
  select.type = 'button';
  select.setAttribute('aria-haspopup', 'listbox');
  select.setAttribute('aria-expanded', 'false');
  const list = el('ul', 'footer-locale-options');
  list.setAttribute('role', 'listbox');
  const renderSelected = () => {
    const o = options[selected];
    select.replaceChildren();
    if (o.flag) select.append(o.flag.cloneNode(true));
    select.append(document.createTextNode(o.label));
    select.insertAdjacentHTML('beforeend', `<span class="footer-locale-chevron">${ICONS.chevronDown}</span>`);
  };
  options.forEach((o, i) => {
    const li = el('li', 'footer-locale-option');
    li.setAttribute('role', 'option');
    li.tabIndex = 0;
    if (o.flag) li.append(o.flag.cloneNode(true));
    li.append(document.createTextNode(o.label));
    const choose = () => {
      selected = i;
      renderSelected();
      select.setAttribute('aria-expanded', 'false');
    };
    li.addEventListener('click', choose);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter') choose(); });
    list.append(li);
  });
  renderSelected();
  select.addEventListener('click', () => {
    select.setAttribute('aria-expanded', select.getAttribute('aria-expanded') !== 'true');
  });
  field.append(fieldLabel, select, list);

  const submit = el('button', 'footer-locale-continue');
  submit.type = 'button';
  submit.textContent = submitP.textContent.trim();
  submit.addEventListener('click', () => {
    const target = options[selected].prefix;
    const current = options.find((o) => path.includes(`${o.prefix}/`) || path.endsWith(o.prefix));
    window.location.href = current ? path.replace(current.prefix, target) : target;
  });
  const actions = el('div', 'footer-locale-actions');
  actions.append(submit);

  card.append(close, title, desc, field, actions);
  dialog.append(card);
  trigger.addEventListener('click', () => dialog.showModal());
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  wrap.append(trigger, dialog);
  return wrap;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  if (!fragment) return;
  block.textContent = '';

  const columns = el('div', 'footer-columns');
  const extras = [];
  directChildren(fragment, 'DIV').forEach((section) => {
    const hasList = directChildren(section, 'UL').length > 0;
    const isLocale = hasList && directChildren(section, 'P').length > 0;
    if (isLocale) extras.push(buildLocale(section));
    else if (hasList) columns.append(buildColumn(section));
    else {
      const note = el('div', 'footer-copyright');
      note.append(...section.childNodes);
      extras.push(note);
    }
  });

  // locale picker and copyright sit at the foot of the last (legal) column
  const last = columns.lastElementChild;
  if (last) {
    last.classList.add('footer-column-last');
    last.append(...extras);
  } else {
    columns.append(...extras);
  }
  block.append(columns);
}
