import { getCategories } from '../utils.js';

const THEMES = new Set(['apps', 'ai', 'games', 'art']);
const ACCENT_PATTERN = /^#[0-9a-f]{6}$/i;

/**
 * Which atmosphere an item is presented with. Driven entirely by data:
 * an explicit `theme`, otherwise the first category that names one.
 */
export function resolveTheme(item, fallback = 'apps') {
  if (THEMES.has(item?.theme)) return item.theme;

  const fromCategory = getCategories(item, '')
    .map((category) => category.trim().toLowerCase())
    .find((category) => THEMES.has(category));

  return fromCategory || fallback;
}

/** Applies the atmosphere, plus an optional per-item accent override. */
export function applyTheme(root, item, fallback = 'apps') {
  if (!root) return;

  root.dataset.theme = resolveTheme(item, fallback);

  if (ACCENT_PATTERN.test(item?.accent || '')) root.style.setProperty('--accent', item.accent);
  else root.style.removeProperty('--accent');
}
