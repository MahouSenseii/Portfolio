const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const data = require('../data/portfolio.json');

const KNOWN_THEMES = new Set(['apps', 'ai', 'games', 'art']);
const moduleCache = new Map();

/**
 * Loads a browser ES module in Node by inlining it (and its relative
 * dependencies) as data URLs. Only works for modules that do not touch
 * the DOM at import time.
 */
async function loadModule(relativePath) {
  if (moduleCache.has(relativePath)) return moduleCache.get(relativePath);

  let source = await fs.readFile(path.join(root, relativePath), 'utf8');
  const directory = path.posix.dirname(relativePath);

  for (const [, specifier] of source.matchAll(/from '(\.[^']+)'/g)) {
    const dependency = path.posix.normalize(path.posix.join(directory, specifier));
    const url = await loadModule(dependency);
    source = source.split(`from '${specifier}'`).join(`from '${url}'`);
  }

  const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  moduleCache.set(relativePath, url);
  return url;
}

const importModule = async (relativePath) => import(await loadModule(relativePath));

test('projects and artwork support multiple categories', async () => {
  const { getCategories } = await importModule('js/utils.js');
  const revia = data.projects.find((project) => project.name === 'R.E.V.I.A');
  const artwork = data.art.find((item) => item.title === 'Karen Poses Lineup');

  assert.deepEqual(getCategories(revia, 'Projects'), ['AI', 'Apps']);
  assert.deepEqual(getCategories(artwork, 'Artwork'), ['Character Art', 'Visual Novel Scene']);
});

test('external URL validation rejects relative and unsafe URLs', async () => {
  const { safeHttpUrl } = await importModule('js/utils.js');

  assert.equal(safeHttpUrl('github.com/example'), '');
  assert.equal(safeHttpUrl('/local-page'), '');
  assert.equal(safeHttpUrl('javascript:alert(1)'), '');
  assert.equal(safeHttpUrl('https://github.com/example'), 'https://github.com/example');
});

test('portfolio collections use unique sort orders', () => {
  for (const [label, items] of [['projects', data.projects], ['art', data.art]]) {
    const orders = items.map((item) => item.sortOrder);
    assert.equal(new Set(orders).size, orders.length, `${label} sort orders must be unique`);
  }
});

test('atmosphere is resolved from data, never from item names', async () => {
  const { resolveTheme } = await importModule('js/showcase/theme.js');

  assert.equal(resolveTheme({ theme: 'ai', categories: ['Games'] }), 'ai', 'explicit theme wins');
  assert.equal(resolveTheme({ categories: ['Games'] }), 'games', 'category names an atmosphere');
  assert.equal(resolveTheme({ categories: ['Internal Ops'] }), 'apps', 'unknown category falls back');
  assert.equal(resolveTheme({ categories: ['Internal Ops'] }, 'art'), 'art');
});

test('every project declares an atmosphere the stylesheet knows', () => {
  data.projects.forEach((project) => {
    assert.ok(KNOWN_THEMES.has(project.theme), `${project.name} has an unknown theme: ${project.theme}`);
  });
});

test('hero presentation is chosen from asset fields', async () => {
  const { resolveHero, collectGallery } = await importModule('js/showcase/assets.js');

  assert.deepEqual(
    resolveHero({ characterImage: 'img/a.webp', characterAlt: 'A', image: 'img/b.webp' }),
    { src: 'img/a.webp', alt: 'A', style: 'cutout' },
    'character art is presented as a free-standing cutout',
  );

  assert.equal(resolveHero({ image: 'img/b.webp' }).style, 'frame', 'screenshots get a window frame');
  assert.equal(resolveHero({ heroImage: 'img/c.webp', image: 'img/b.webp' }).src, 'img/c.webp');
  assert.equal(resolveHero({ heroStyle: 'frame', characterImage: 'img/a.webp' }).style, 'frame');
  assert.equal(resolveHero({ src: 'img/art/one.webp' }).src, 'img/art/one.webp', 'artwork uses src');

  const gallery = collectGallery({
    name: 'Demo',
    image: 'img/one.webp',
    imageAlt: 'One',
    galleryImages: ['img/one.webp', { src: 'img/two.webp', alt: 'Two' }],
  });
  assert.deepEqual(gallery.map((entry) => entry.src), ['img/one.webp', 'img/two.webp']);
});

test('deep links carry showcase state in the hash', async () => {
  const { normalizePage, parseParams } = await importModule('js/router.js');

  assert.equal(normalizePage('#projects.html?category=AI'), 'projects.html');
  assert.equal(normalizePage('#nope.html'), 'home.html');
  assert.equal(parseParams('#projects.html?category=AI').get('category'), 'AI');
  assert.equal(parseParams('#projects.html').get('category'), null);
});

test('configured filters match categories actually in use', () => {
  const check = (configured, items, label) => {
    const used = new Set(items.flatMap((item) => item.categories));
    (configured || []).forEach((category) => {
      assert.ok(used.has(category), `${label} filter "${category}" matches no entries`);
    });
  };

  check(data.filters?.projects, data.projects, 'projects');
  check(data.filters?.art, data.art, 'art');
});

test('a project can carry several status labels', async () => {
  const { formatStatus } = await importModule('js/showcase/fragments.js');

  assert.equal(formatStatus('Deployed'), 'Deployed');
  assert.equal(formatStatus(['In Development', 'Migrated to C++']), 'In Development • Migrated to C++');
  assert.equal(formatStatus(undefined), '');

  const villar = data.projects.find((project) => project.name === 'Villar Signature Solutions');
  assert.deepEqual(villar.status, ['Launched'], 'a launched client site is tagged as launched');

  const revia = data.projects.find((project) => project.name === 'R.E.V.I.A');
  assert.ok(Array.isArray(revia.status) && revia.status.length === 2, 'R.E.V.I.A carries two status labels');
});

test('dev log entries sort newest first and format without timezone drift', async () => {
  const { formatEntryDate, sortEntries, getDevlogEntries } = await importModule('js/showcase/devlog.js');

  assert.equal(formatEntryDate('2026-01-05'), '5 January 2026');
  assert.equal(formatEntryDate('2026-12-31'), '31 December 2026', 'no rollover into the next year');
  assert.equal(formatEntryDate(''), '');

  const sorted = sortEntries([
    { date: '2026-01-05', title: 'a' },
    { date: '2026-08-20', title: 'b' },
    { title: 'undated' },
  ]);
  assert.deepEqual(sorted.map((entry) => entry.title), ['b', 'a', 'undated']);

  assert.deepEqual(getDevlogEntries({}), [], 'a project with no dev log yields no entries');
});

test('every project declares a dev log array or none at all', () => {
  data.projects.forEach((project) => {
    if ('devlog' in project) {
      assert.ok(Array.isArray(project.devlog), `${project.name}.devlog must be an array`);
    }
  });
});
