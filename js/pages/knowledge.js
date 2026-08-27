import { clampPercent, deriveLevel, sortByOrder } from '../utils.js';

export function initKnowledge(data) {
  const list = document.getElementById('knowledge-list');
  if (!list) return;

  (data.skills || []).forEach((group) => {
    const section = document.createElement('section');
    section.className = 'skill-group';

    const heading = document.createElement('h2');
    heading.textContent = group.category;
    section.appendChild(heading);

    const items = document.createElement('div');
    items.className = 'skill-list';

    sortByOrder(group.items || []).forEach((skill) => {
      const percent = clampPercent(skill.percent);
      const row = document.createElement('div');
      row.className = 'skill-row';

      const name = document.createElement('span');
      name.className = 'skill-name';
      name.textContent = skill.name;

      const level = document.createElement('span');
      level.className = 'skill-level';
      level.textContent = skill.level || deriveLevel(percent);

      const track = document.createElement('div');
      track.className = 'skill-track';
      track.setAttribute('role', 'progressbar');
      track.setAttribute('aria-label', skill.name);
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', '100');
      track.setAttribute('aria-valuenow', String(percent));

      const fill = document.createElement('span');
      fill.className = 'skill-fill';
      fill.style.width = `${percent}%`;
      track.appendChild(fill);
      row.append(name, level, track);
      items.appendChild(row);
    });

    section.appendChild(items);
    list.appendChild(section);
  });
}
