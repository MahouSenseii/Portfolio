import {
  formatCategories,
  getCategories,
  getVideoEmbedUrl,
  safeHttpUrl,
  sortByOrder,
} from '../utils.js';
import { createAmbientBackground } from '../showcase/ambient.js';
import { collectGallery, resolveHero, resolveScene } from '../showcase/assets.js';
import { buildProjectDetails } from '../showcase/details-panel.js';
import { buildDevlog, getDevlogEntries } from '../showcase/devlog.js';
import { createDrawer } from '../showcase/drawer.js';
import {
  createFeaturedBadge,
  createStatusBadges,
  renderActions,
  renderMeta,
  renderTags,
} from '../showcase/fragments.js';
import { createMediaViewer } from '../showcase/media-viewer.js';
import { createShowcase } from '../showcase/showcase.js';
import { applyTheme } from '../showcase/theme.js';

const FALLBACK_CATEGORY = 'Projects';
const FALLBACK_SCENE = 'img/bgprojects.webp';

export function initProjects(data, params) {
  const root = document.querySelector('.showcase');
  if (!root) return undefined;

  const projects = sortByOrder(Array.isArray(data.projects) ? data.projects : []);
  const view = {
    watermark: root.querySelector('[data-sc-watermark]'),
    badges: root.querySelector('[data-sc-badges]'),
    title: root.querySelector('[data-sc-title]'),
    kicker: root.querySelector('[data-sc-kicker]'),
    summary: root.querySelector('[data-sc-summary]'),
    meta: root.querySelector('[data-sc-meta]'),
    tags: root.querySelector('[data-sc-tags]'),
    actions: root.querySelector('[data-sc-actions]'),
    hero: root.querySelector('[data-sc-hero]'),
    heroImage: root.querySelector('[data-sc-hero-img]'),
  };

  const ambient = createAmbientBackground(root, { motes: 20 });
  const mediaViewer = createMediaViewer(root);
  const drawer = createDrawer(root);

  const openDetails = (project) => drawer.open(
    buildProjectDetails(project, { mediaViewer, fallbackCategory: FALLBACK_CATEGORY }),
    `${project.name} details`,
  );
  const openDevlog = (project) => drawer.open(
    buildDevlog(project, { mediaViewer }),
    `${project.name} development log`,
  );

  if (!projects.length) {
    ambient.setScene(FALLBACK_SCENE);
    if (view.title) view.title.textContent = 'Projects coming soon';
    if (view.summary) view.summary.textContent = 'No projects have been added yet.';
    if (view.hero) view.hero.hidden = true;
    return () => {
      ambient.destroy();
      mediaViewer.destroy();
      drawer.destroy();
    };
  }

  function renderHero(project) {
    if (!view.hero || !view.heroImage) return;

    const hero = resolveHero(project);
    view.hero.hidden = !hero.src;
    view.hero.dataset.heroStyle = hero.style;
    root.dataset.heroStyle = hero.style;

    if (hero.src) {
      view.heroImage.src = hero.src;
      view.heroImage.alt = hero.alt;
    } else {
      view.heroImage.removeAttribute('src');
      view.heroImage.alt = '';
    }
  }

  function buildActions(project) {
    const gallery = collectGallery(project);
    const embed = safeHttpUrl(project.embed) || getVideoEmbedUrl(project.videoUrl);
    const links = (project.links || [])
      .map((link) => ({ ...link, url: safeHttpUrl(link.url) }))
      .filter((link) => link.url);

    const devlogEntries = getDevlogEntries(project);

    const actions = [
      {
        label: 'Explore Project',
        variant: 'primary',
        onClick: () => openDetails(project),
      },
      devlogEntries.length && {
        label: `Dev Log (${devlogEntries.length})`,
        onClick: () => openDevlog(project),
      },
      embed && {
        label: project.embed ? 'Play Demo' : 'Watch Video',
        onClick: () => mediaViewer.openEmbed(embed, `${project.name} demo`),
      },
      gallery.length && {
        label: gallery.length > 1 ? `Gallery (${gallery.length})` : 'View Screenshot',
        onClick: () => mediaViewer.openGallery(gallery, `${project.name} gallery`),
      },
      ...links.map((link) => ({ label: link.label, href: link.url, external: true })),
    ].filter(Boolean);

    if (!links.length && data.contact?.email) {
      actions.push({
        label: 'Request Details',
        href: `mailto:${data.contact.email}?subject=${encodeURIComponent(`${project.name} project inquiry`)}`,
      });
    }

    return actions;
  }

  function render(project) {
    if (!project) return;

    applyTheme(root, project, 'apps');
    ambient.setScene(resolveScene(project, FALLBACK_SCENE));

    if (view.watermark) view.watermark.textContent = project.name;

    if (view.badges) {
      const badges = createStatusBadges(project.status);
      if (project.featured) badges.push(createFeaturedBadge());
      view.badges.replaceChildren(...badges);
    }

    if (view.title) view.title.textContent = project.name;
    if (view.kicker) {
      view.kicker.textContent = [formatCategories(project, FALLBACK_CATEGORY), project.platform]
        .filter(Boolean)
        .join(' • ');
    }
    if (view.summary) view.summary.textContent = project.summary || project.subtitle || '';

    renderMeta(view.meta, [
      ['Role', project.role],
      ['Built with', project.engine],
      ['Timeline', project.timeframe],
    ]);
    renderTags(view.tags, project.tags);
    renderActions(view.actions, buildActions(project));
    renderHero(project);
  }

  const showcase = createShowcase({
    root,
    items: projects,
    fallbackCategory: FALLBACK_CATEGORY,
    preferredCategories: data.filters?.projects || [],
    initialCategory: params?.get('category') || 'All',
    describe: (project) => ({
      name: project.name,
      thumbnail: project.thumbnail || project.image,
      badge: getCategories(project, FALLBACK_CATEGORY)[0],
    }),
    render,
  });

  return () => {
    showcase.destroy();
    drawer.destroy();
    mediaViewer.destroy();
    ambient.destroy();
  };
}
