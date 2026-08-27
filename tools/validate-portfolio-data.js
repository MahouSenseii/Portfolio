const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv');

const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/portfolio.json'), 'utf8'));
const schema = JSON.parse(fs.readFileSync(path.join(root, 'data/portfolio.schema.json'), 'utf8'));
const validate = new Ajv({ allErrors: true }).compile(schema);
const errors = [];

if (!validate(data)) {
  validate.errors.forEach((error) => {
    errors.push(`${error.instancePath || '/'} ${error.message}`);
  });
}

function assertUniqueOrder(items, label) {
  const seen = new Set();
  items.forEach((item) => {
    if (seen.has(item.sortOrder)) errors.push(`${label} has duplicate sortOrder ${item.sortOrder}`);
    seen.add(item.sortOrder);
  });
}

function assertFile(file, label) {
  if (file && !fs.existsSync(path.join(root, file))) errors.push(`${label} references missing file ${file}`);
}

function assertFilterCoverage(configured, items, label) {
  const used = new Set(items.flatMap((item) => item.categories || []));
  (configured || []).forEach((category) => {
    if (!used.has(category)) errors.push(`${label} filter "${category}" matches no entries`);
  });
}

assertUniqueOrder(data.projects, 'projects');
assertUniqueOrder(data.art, 'art');
assertFilterCoverage(data.filters && data.filters.projects, data.projects, 'projects');
assertFilterCoverage(data.filters && data.filters.art, data.art, 'art');
data.skills.forEach((group) => assertUniqueOrder(group.items, `skills.${group.category}`));

assertFile(data.resume.url, 'resume');
data.music.forEach((song) => assertFile(song.src, `music.${song.name}`));
data.projects.forEach((project) => {
  assertFile(project.image, `projects.${project.name}.image`);
  assertFile(project.thumbnail, `projects.${project.name}.thumbnail`);
  assertFile(project.characterImage, `projects.${project.name}.characterImage`);
  assertFile(project.heroImage, `projects.${project.name}.heroImage`);
  assertFile(project.backgroundImage, `projects.${project.name}.backgroundImage`);
  project.galleryImages.forEach((image) => {
    assertFile(typeof image === 'string' ? image : image.src, `projects.${project.name}.galleryImages`);
  });
  (project.devlog || []).forEach((entry) => {
    (entry.images || []).forEach((image) => {
      assertFile(image.src, `projects.${project.name}.devlog[${entry.date}]`);
    });
  });
});
data.art.forEach((art) => {
  assertFile(art.src, `art.${art.title}.src`);
  assertFile(art.thumbnail, `art.${art.title}.thumbnail`);
});

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`Portfolio data valid: ${data.projects.length} projects, ${data.art.length} artworks.`);
