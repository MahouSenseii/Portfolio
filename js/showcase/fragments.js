/**
 * Small reusable presentation pieces: StatusBadge, TagList, MetaList and
 * ActionButtons. Every showcase surface composes these rather than
 * hand-rolling its own markup.
 */

/**
 * StatusBadge - the tone is picked from the wording, so new labels work
 * without touching this file. Anything unrecognised gets the default
 * in-progress treatment.
 */
const STATUS_VARIANTS = [
  [/deployed|launched|playable|released|live|shipped|complete/i, 'live'],
  [/migrated|rewrit|rebuil|ported|superseded|replaced/i, 'migrated'],
  [/cancelled|canceled|archived|on hold|paused|retired/i, 'ended'],
];

export function createStatusBadge(status) {
  if (!status) return null;

  const badge = document.createElement('span');
  const variant = STATUS_VARIANTS.find(([pattern]) => pattern.test(status));
  badge.className = variant ? `status-pill status-pill--${variant[1]}` : 'status-pill';
  badge.textContent = status;
  return badge;
}

/** Accepts a single status or a list of them, e.g. ["In Development", "Migrated to C++"]. */
export function createStatusBadges(status) {
  const values = Array.isArray(status) ? status : [status];
  return values.map(createStatusBadge).filter(Boolean);
}

/** Flattens a status field to a single readable string for meta and fact lists. */
export function formatStatus(status) {
  return (Array.isArray(status) ? status : [status]).filter(Boolean).join(' • ');
}

export function createFeaturedBadge(label = 'Featured') {
  const badge = document.createElement('span');
  badge.className = 'chip chip--accent';
  badge.textContent = label;
  return badge;
}

/** TagList - technology chips. */
export function renderTags(container, tags = []) {
  if (!container) return;

  container.replaceChildren(...tags.filter(Boolean).map((tag) => {
    const item = document.createElement('li');
    item.className = 'chip';
    item.textContent = tag;
    return item;
  }));
}

/**
 * MetaList - optional labelled facts.
 * @param {Array<[string, string]>} entries label/value pairs; empty values are dropped
 */
export function renderMeta(container, entries = []) {
  if (!container) return;

  const nodes = entries
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => {
      const group = document.createElement('div');
      const term = document.createElement('dt');
      term.textContent = label;
      const definition = document.createElement('dd');
      definition.textContent = value;
      group.append(term, definition);
      return group;
    });

  container.replaceChildren(...nodes);
}

/**
 * ActionButtons - level 5 of the information hierarchy.
 * @param {Array<{label: string, href?: string, onClick?: Function, variant?: string, external?: boolean}>} actions
 */
export function renderActions(container, actions = []) {
  if (!container) return;

  const nodes = actions.filter(Boolean).map((action) => {
    const variant = action.variant ? ` btn--${action.variant}` : '';
    const node = action.href
      ? document.createElement('a')
      : document.createElement('button');

    node.className = `btn${variant}`;
    node.textContent = action.label;

    if (action.href) {
      node.href = action.href;
      if (action.external) {
        node.target = '_blank';
        node.rel = 'noopener noreferrer';
      }
    } else {
      node.type = 'button';
      node.addEventListener('click', action.onClick);
    }

    return node;
  });

  container.replaceChildren(...nodes);
}
