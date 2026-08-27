const VALID_PAGES = new Set([
  'home.html',
  'projects.html',
  'art.html',
  'about.html',
  'knowledge.html',
  'resume.html',
  'contact.html',
]);

export function normalizePage(value = '') {
  const page = value
    .replace(/^#/, '')
    .replace(/^pages\//, '')
    .split('?')[0]
    .trim();

  return VALID_PAGES.has(page) ? page : 'home.html';
}

/** Deep links carry state after the page, e.g. `#projects.html?category=AI`. */
export function parseParams(value = '') {
  const query = value.split('?')[1] || '';
  return new URLSearchParams(query);
}

export class Router {
  constructor({ pages, data }) {
    this.pages = pages;
    this.data = data;
    this.cache = new Map();
    this.cleanup = null;
    this.requestId = 0;
    this.onHashChange = () => this.loadCurrentPage();
    this.onPrefetch = (event) => this.handlePrefetch(event);
  }

  start() {
    if (!window.location.hash) history.replaceState(null, '', '#home.html');

    window.addEventListener('hashchange', this.onHashChange);
    document.addEventListener('pointerover', this.onPrefetch);
    document.addEventListener('focusin', this.onPrefetch);
    this.loadCurrentPage();
  }

  async loadCurrentPage() {
    const hash = window.location.hash;
    const page = normalizePage(hash);
    const params = parseParams(hash);
    const requestId = ++this.requestId;

    this.cleanup?.();
    this.cleanup = null;
    this.updateActiveNav(page);

    try {
      const html = await this.fetchPage(page);
      if (requestId !== this.requestId) return;

      const content = document.getElementById('content');
      if (!content) return;
      content.innerHTML = html;
      window.scrollTo({ top: 0, behavior: 'auto' });

      const initializer = this.pages[page];
      this.cleanup = initializer?.(this.data, params) || null;
      const heading = document.querySelector('main h1');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    } catch (error) {
      console.error(error);
      this.renderError(page);
    }
  }

  async fetchPage(page) {
    if (this.cache.has(page)) return this.cache.get(page);

    const response = await fetch(`pages/${page}`);
    if (!response.ok) throw new Error(`Unable to load pages/${page}`);
    const html = await response.text();
    this.cache.set(page, html);
    return html;
  }

  renderError(page) {
    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
      <section class="page-error">
        <h1 tabindex="-1">Page unavailable</h1>
        <p>The requested section could not be loaded.</p>
        <button class="btn btn--primary" type="button">Try Again</button>
      </section>
    `;
    content.querySelector('button')?.addEventListener('click', () => {
      this.cache.delete(page);
      this.loadCurrentPage();
    }, { once: true });
  }

  updateActiveNav(page) {
    document.querySelectorAll('.nav-link').forEach((link) => {
      const isActive = normalizePage(link.getAttribute('href')) === page;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  handlePrefetch(event) {
    const link = event.target.closest?.('.nav-link, .home-gateway');
    if (!link) return;
    const page = normalizePage(link.getAttribute('href'));
    this.fetchPage(page).catch(() => {});
  }
}
