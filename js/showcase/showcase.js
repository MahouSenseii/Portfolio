import { centerSelectedItem, getCategories } from '../utils.js';

/**
 * The selection engine shared by the project and art showcases.
 *
 * Owns CategorySelector (the rail) and ProjectSelector (the thumbnail
 * track) plus the selection state and the swap transition. It knows
 * nothing about what a selected item looks like - the caller supplies
 * `render` for the scene and `describe` for a thumbnail card.
 */

const ALL = 'All';

function orderCategories(items, fallback, preferred) {
  const used = new Set(items.flatMap((item) => getCategories(item, fallback)));
  const ordered = preferred.filter((category) => used.has(category));
  const rest = [...used].filter((category) => !ordered.includes(category)).sort();
  return [ALL, ...ordered, ...rest];
}

/**
 * @param {object} options
 * @param {HTMLElement} options.root          the .showcase element
 * @param {Array<object>} options.items       already sorted
 * @param {string} options.fallbackCategory   category for items that declare none
 * @param {Array<string>} [options.preferredCategories] rail order from data
 * @param {string} [options.initialCategory]
 * @param {(item: object) => {name: string, thumbnail: string, badge?: string}} options.describe
 * @param {(item: object) => void} options.render
 */
export function createShowcase({
  root,
  items,
  fallbackCategory,
  preferredCategories = [],
  initialCategory = ALL,
  describe,
  render,
}) {
  const railList = root.querySelector('[data-sc-rail]');
  const track = root.querySelector('[data-sc-track]');
  const previousButton = root.querySelector('[data-sc-prev]');
  const nextButton = root.querySelector('[data-sc-next]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const categories = orderCategories(items, fallbackCategory, preferredCategories);
  let activeCategory = categories.includes(initialCategory) ? initialCategory : ALL;
  let selected = null;
  let swapTimer = 0;

  const inCategory = (item, category) => category === ALL
    || getCategories(item, fallbackCategory).includes(category);

  const visibleItems = () => items.filter((item) => inCategory(item, activeCategory));

  const countFor = (category) => items.filter((item) => inCategory(item, category)).length;

  function paint() {
    render(selected);
  }

  /** Fades the scene out, swaps the content, fades it back in. */
  function swapTo(item) {
    if (item === selected) return;
    selected = item;
    renderTrack();

    if (reduceMotion.matches) {
      paint();
      return;
    }

    root.classList.add('is-swapping');
    window.clearTimeout(swapTimer);
    swapTimer = window.setTimeout(() => {
      paint();
      root.classList.remove('is-swapping');
    }, 150);
  }

  function renderRail() {
    if (!railList) return;

    railList.replaceChildren(...categories.map((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sc-rail-item';
      button.setAttribute('aria-pressed', String(category === activeCategory));

      const label = document.createElement('span');
      label.textContent = category;

      const count = document.createElement('span');
      count.className = 'sc-rail-count';
      count.textContent = String(countFor(category));

      button.append(label, count);
      button.addEventListener('click', () => setCategory(category));
      return button;
    }));
  }

  function renderTrack() {
    if (!track) return;

    track.replaceChildren(...visibleItems().map((item) => {
      const meta = describe(item);
      const isSelected = item === selected;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'sc-card';
      card.setAttribute('aria-pressed', String(isSelected));
      card.setAttribute('aria-label', `Show ${meta.name}`);

      const media = document.createElement('span');
      media.className = 'sc-card-media';
      if (meta.thumbnail) {
        const image = document.createElement('img');
        image.src = meta.thumbnail;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        media.appendChild(image);
      }
      if (meta.badge) {
        const badge = document.createElement('span');
        badge.className = 'sc-card-badge';
        badge.textContent = meta.badge;
        media.appendChild(badge);
      }

      const name = document.createElement('span');
      name.className = 'sc-card-name';
      name.textContent = meta.name;

      card.append(media, name);
      card.addEventListener('click', () => swapTo(item));
      return card;
    }));

    window.requestAnimationFrame(() => {
      centerSelectedItem(track, track.querySelector('.sc-card[aria-pressed="true"]'));
    });
  }

  function setCategory(category) {
    if (category === activeCategory) return;
    activeCategory = category;
    renderRail();

    const visible = visibleItems();
    if (!visible.includes(selected)) swapTo(visible[0] || null);
    else renderTrack();
  }

  function step(direction) {
    const visible = visibleItems();
    if (visible.length < 2) return;
    const index = visible.indexOf(selected);
    swapTo(visible[(index + direction + visible.length) % visible.length]);
  }

  const onPrevious = () => step(-1);
  const onNext = () => step(1);
  const onTrackKeyDown = (event) => {
    if (event.key === 'ArrowRight') step(1);
    else if (event.key === 'ArrowLeft') step(-1);
    else return;
    event.preventDefault();
    track.querySelector('.sc-card[aria-pressed="true"]')?.focus();
  };

  previousButton?.addEventListener('click', onPrevious);
  nextButton?.addEventListener('click', onNext);
  track?.addEventListener('keydown', onTrackKeyDown);

  selected = visibleItems()[0] || items[0] || null;
  renderRail();
  renderTrack();
  paint();

  return {
    get selected() {
      return selected;
    },
    destroy() {
      window.clearTimeout(swapTimer);
      previousButton?.removeEventListener('click', onPrevious);
      nextButton?.removeEventListener('click', onNext);
      track?.removeEventListener('keydown', onTrackKeyDown);
    },
  };
}
