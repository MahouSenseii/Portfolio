import { formatCategories, getVideoEmbedUrl, safeHttpUrl } from '../utils.js';
import { collectGallery } from './assets.js';
import { createFeaturedBadge, createStatusBadges, formatStatus, renderActions } from './fragments.js';

/**
 * ProjectDetails - the expanded view. The main showcase stays visually
 * clean; everything deeper (architecture, progress, full media) lives
 * here. Returns a node for the shared drawer to display.
 */

const ROADMAP_TRACKS = [
  ['implemented', 'Implemented', 'implemented'],
  ['inProgress', 'In Development', 'progress'],
  ['planned', 'Planned', 'planned'],
];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function buildList(items = []) {
  if (!items.length) return null;
  const list = document.createElement('ul');
  list.append(...items.map((item) => element('li', '', item)));
  return list;
}

function buildFacts(project) {
  const entries = [
    ['Role', project.role],
    ['Built with', project.engine],
    ['Platform', project.platform],
    ['Timeline', project.timeframe],
    ['Status', formatStatus(project.status)],
  ].filter(([, value]) => Boolean(value));

  if (!entries.length) return null;

  const facts = element('dl', 'detail-facts');
  facts.append(...entries.map(([label, value]) => {
    const group = element('div', 'detail-fact');
    group.append(element('dt', '', label), element('dd', '', value));
    return group;
  }));
  return facts;
}

function buildSection(section) {
  const node = element('section', 'detail-section');
  node.append(element('h3', '', section.title));
  if (section.body) node.append(element('p', '', section.body));
  const list = buildList(section.items);
  if (list) node.append(list);
  return node;
}

function buildRoadmap(roadmap) {
  const tracks = ROADMAP_TRACKS
    .map(([key, label, modifier]) => [label, modifier, roadmap[key] || []])
    .filter(([, , items]) => items.length);

  if (!tracks.length) return null;

  const section = element('section', 'detail-section');
  section.append(element('h3', '', 'Development Progress'));

  const wrapper = element('div', 'detail-roadmap');
  wrapper.append(...tracks.map(([label, modifier, items]) => {
    const track = element('div', `detail-track detail-track--${modifier}`);
    track.append(element('h4', '', label));
    track.append(buildList(items));
    return track;
  }));

  section.append(wrapper);
  return section;
}

function buildGallery(images, onOpen) {
  if (!images.length) return null;

  const section = element('section', 'detail-section');
  section.append(element('h3', '', 'Media'));

  const grid = element('div', 'detail-gallery');
  images.forEach((image, index) => {
    const button = element('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Open ${image.alt || `image ${index + 1}`}`);

    const thumbnail = document.createElement('img');
    thumbnail.src = image.src;
    thumbnail.alt = '';
    thumbnail.loading = 'lazy';
    button.append(thumbnail);
    button.addEventListener('click', () => onOpen(index));
    grid.append(button);
  });

  section.append(grid);
  return section;
}

export function buildProjectDetails(project, { mediaViewer, fallbackCategory = 'Projects' }) {
  const wrapper = element('div', 'detail');
  const header = element('header', 'detail-header');

  const badges = element('div', 'sc-badges');
  badges.append(...createStatusBadges(project.status));
  if (project.featured) badges.append(createFeaturedBadge());
  if (badges.childElementCount) header.append(badges);

  header.append(element('h2', 'detail-title', project.name));

  const kicker = [formatCategories(project, fallbackCategory), project.platform]
    .filter(Boolean)
    .join(' • ');
  if (kicker) header.append(element('p', 'detail-kicker', kicker));

  wrapper.append(header);

  const detail = project.detail || {};
  if (project.subtitle) wrapper.append(element('p', 'detail-lead', project.subtitle));
  wrapper.append(element('p', 'detail-overview', detail.overview || project.summary || ''));

  const facts = buildFacts(project);
  if (facts) wrapper.append(facts);

  (detail.sections || []).forEach((section) => wrapper.append(buildSection(section)));

  if (!detail.sections?.length && project.details) {
    wrapper.append(buildSection({ title: 'Overview', body: project.details }));
  }

  if (project.highlights?.length && !detail.sections?.length) {
    wrapper.append(buildSection({ title: 'Highlights', items: project.highlights }));
  }

  if (detail.roadmap) {
    const roadmap = buildRoadmap(detail.roadmap);
    if (roadmap) wrapper.append(roadmap);
  }

  const gallery = collectGallery(project);
  const galleryNode = buildGallery(gallery, (index) => {
    mediaViewer.openGallery(gallery.slice(index).concat(gallery.slice(0, index)), `${project.name} gallery`);
  });
  if (galleryNode) wrapper.append(galleryNode);

  const embed = safeHttpUrl(project.embed) || getVideoEmbedUrl(project.videoUrl);
  const actions = element('div', 'detail-actions button-row');
  renderActions(actions, [
    embed && {
      label: project.embed ? 'Play Demo' : 'Watch Video',
      variant: 'primary',
      onClick: () => mediaViewer.openEmbed(embed, `${project.name} demo`),
    },
    ...(project.links || [])
      .map((link) => ({ ...link, url: safeHttpUrl(link.url) }))
      .filter((link) => link.url)
      .map((link) => ({ label: link.label, href: link.url, external: true })),
  ].filter(Boolean));

  if (actions.childElementCount) wrapper.append(actions);

  return wrapper;
}
