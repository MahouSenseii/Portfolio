import { getVideoEmbedUrl, safeHttpUrl } from '../utils.js';

/**
 * Dev log - a dated timeline of development entries for a project.
 *
 * Adding an entry is deliberately a one-object edit in portfolio.json:
 *
 *   { "date": "2026-08-20", "title": "Swept-volume damage traces" }
 *
 * Everything past `date` and `title` is optional: `body` (a string or a
 * list of paragraphs), `videoUrl`, `images`, and `tags`.
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Formatted without Date() so the calendar day never shifts by timezone. */
export function formatEntryDate(value) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!parts) return value || '';

  const month = MONTHS[Number(parts[2]) - 1];
  return month ? `${Number(parts[3])} ${month} ${parts[1]}` : value;
}

/** Newest first; undated entries sink to the bottom. */
export function sortEntries(entries = []) {
  return [...entries].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

export function getDevlogEntries(project) {
  return sortEntries(Array.isArray(project?.devlog) ? project.devlog : []);
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function buildEntry(entry, project, mediaViewer) {
  const article = element('article', 'devlog-entry');

  if (entry.date) article.append(element('p', 'devlog-date', formatEntryDate(entry.date)));
  article.append(element('h3', 'devlog-title', entry.title));

  if (entry.tags?.length) {
    const tags = element('ul', 'chip-list devlog-tags');
    tags.append(...entry.tags.map((tag) => element('li', 'chip', tag)));
    article.append(tags);
  }

  const paragraphs = Array.isArray(entry.body) ? entry.body : [entry.body];
  paragraphs.filter(Boolean).forEach((text) => article.append(element('p', '', text)));

  const actions = element('div', 'button-row devlog-actions');

  const embed = getVideoEmbedUrl(entry.videoUrl) || safeHttpUrl(entry.embed);
  if (embed) {
    const watch = element('button', 'btn btn--small', 'Watch Clip');
    watch.type = 'button';
    watch.addEventListener('click', () => mediaViewer.openEmbed(embed, `${project.name}: ${entry.title}`));
    actions.append(watch);
  }

  const images = (entry.images || []).filter((image) => image?.src);
  if (images.length) {
    const grid = element('div', 'devlog-shots');
    images.forEach((image, index) => {
      const button = element('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Open ${image.alt || `image ${index + 1}`}`);

      const thumbnail = document.createElement('img');
      thumbnail.src = image.src;
      thumbnail.alt = '';
      thumbnail.loading = 'lazy';
      button.append(thumbnail);
      button.addEventListener('click', () => {
        mediaViewer.openGallery(images.slice(index).concat(images.slice(0, index)), `${project.name}: ${entry.title}`);
      });
      grid.append(button);
    });
    article.append(grid);
  }

  if (actions.childElementCount) article.append(actions);
  return article;
}

export function buildDevlog(project, { mediaViewer }) {
  const entries = getDevlogEntries(project);

  const wrapper = element('div', 'detail devlog');
  const header = element('header', 'detail-header');
  header.append(element('p', 'detail-kicker', 'Development Log'));
  header.append(element('h2', 'detail-title', project.name));
  header.append(element('p', 'detail-lead', `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`));
  wrapper.append(header);

  if (!entries.length) {
    wrapper.append(element('p', 'detail-overview', 'No entries yet.'));
    return wrapper;
  }

  const timeline = element('div', 'devlog-timeline');
  timeline.append(...entries.map((entry) => buildEntry(entry, project, mediaViewer)));
  wrapper.append(timeline);
  return wrapper;
}
