import { formatCategories, getCategories, sortByOrder } from '../utils.js';
import { createAmbientBackground } from '../showcase/ambient.js';
import { resolveScene } from '../showcase/assets.js';
import { createFeaturedBadge, renderActions, renderMeta } from '../showcase/fragments.js';
import { createMediaViewer } from '../showcase/media-viewer.js';
import { createShowcase } from '../showcase/showcase.js';
import { applyTheme } from '../showcase/theme.js';

const FALLBACK_CATEGORY = 'Artwork';

export function initArt(data, params) {
  const root = document.querySelector('.showcase');
  if (!root) return undefined;

  const artworks = sortByOrder(Array.isArray(data.art) ? data.art : []);
  const view = {
    watermark: root.querySelector('[data-sc-watermark]'),
    badges: root.querySelector('[data-sc-badges]'),
    title: root.querySelector('[data-sc-title]'),
    kicker: root.querySelector('[data-sc-kicker]'),
    summary: root.querySelector('[data-sc-summary]'),
    meta: root.querySelector('[data-sc-meta]'),
    actions: root.querySelector('[data-sc-actions]'),
    hero: root.querySelector('[data-sc-hero]'),
    heroImage: root.querySelector('[data-sc-hero-img]'),
  };

  // The art scene stays quiet: fewer motes, no corner filigree competing
  // with the work itself.
  const ambient = createAmbientBackground(root, { motes: 10, ornaments: false });
  const mediaViewer = createMediaViewer(root);

  if (!artworks.length) {
    if (view.title) view.title.textContent = 'Gallery coming soon';
    if (view.summary) view.summary.textContent = 'No artwork has been added yet.';
    if (view.hero) view.hero.hidden = true;
    return () => {
      ambient.destroy();
      mediaViewer.destroy();
    };
  }

  function render(artwork) {
    if (!artwork) return;

    applyTheme(root, artwork, 'art');
    ambient.setScene(resolveScene(artwork));

    if (view.watermark) view.watermark.textContent = artwork.title;

    if (view.badges) {
      view.badges.replaceChildren(...(artwork.featured ? [createFeaturedBadge()] : []));
    }

    if (view.title) view.title.textContent = artwork.title;
    if (view.kicker) view.kicker.textContent = formatCategories(artwork, FALLBACK_CATEGORY);
    if (view.summary) view.summary.textContent = artwork.description || '';

    renderMeta(view.meta, [
      ['Year', artwork.year],
      ['From', artwork.relatedProject],
    ]);

    renderActions(view.actions, [
      {
        label: 'View Fullscreen',
        variant: 'primary',
        onClick: () => mediaViewer.openImage(artwork.src, artwork.alt || artwork.title, artwork.title),
      },
      artwork.relatedProject && {
        label: `See ${artwork.relatedProject}`,
        href: '#projects.html',
      },
    ].filter(Boolean));

    if (view.hero && view.heroImage) {
      view.hero.dataset.heroStyle = 'art';
      root.dataset.heroStyle = 'art';
      view.heroImage.src = artwork.src;
      view.heroImage.alt = artwork.alt || artwork.title;
    }
  }

  const showcase = createShowcase({
    root,
    items: artworks,
    fallbackCategory: FALLBACK_CATEGORY,
    preferredCategories: data.filters?.art || [],
    initialCategory: params?.get('category') || 'All',
    describe: (artwork) => ({
      name: artwork.title,
      thumbnail: artwork.thumbnail || artwork.src,
      badge: getCategories(artwork, FALLBACK_CATEGORY)[0],
    }),
    render,
  });

  return () => {
    showcase.destroy();
    mediaViewer.destroy();
    ambient.destroy();
  };
}
