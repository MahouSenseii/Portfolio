/**
 * Resolves which artwork a showcase uses, purely from item data.
 *
 * Adding a project never requires touching the renderer: it declares
 * heroImage / characterImage / backgroundImage / galleryImages and the
 * shared showcase decides the presentation from those fields alone.
 */

/**
 * The large foreground subject.
 * `cutout` = free-standing art (characters, renders, illustrations).
 * `frame`  = a screenshot presented as a floating application window.
 */
export function resolveHero(item) {
  const source = item?.heroImage || item?.characterImage || item?.image || item?.src || '';
  const declared = item?.heroStyle;
  const style = declared || (item?.characterImage ? 'cutout' : 'frame');
  const alt = item?.heroAlt || item?.characterAlt || item?.imageAlt || '';

  return { src: source, alt, style };
}

/** The atmospheric plate behind everything. */
export function resolveScene(item, fallback = '') {
  return item?.backgroundImage || item?.image || item?.src || fallback;
}

/** Every image worth putting in the media viewer, deduplicated. */
export function collectGallery(item) {
  const entries = [
    item?.image ? { src: item.image, alt: item.imageAlt || `${item.name} screenshot` } : null,
    ...(item?.galleryImages || []).map((entry, index) => (typeof entry === 'string'
      ? { src: entry, alt: `${item.name} screenshot ${index + 2}` }
      : entry)),
  ].filter((entry) => entry?.src);

  const seen = new Set();
  return entries.filter((entry) => {
    if (seen.has(entry.src)) return false;
    seen.add(entry.src);
    return true;
  });
}
