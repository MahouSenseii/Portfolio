/**
 * AmbientBackground - the atmospheric layers behind every showcase scene:
 * a crossfading image wash, a light veil, an accent glow, decorative
 * corner framing, and slow-drifting motes.
 *
 * Owns no content knowledge: callers push a background image and it
 * crossfades between two stacked layers.
 */

const CORNER_ORNAMENT = `
<svg class="sc-corner-tl" viewBox="0 0 200 120" fill="none" stroke="currentColor" aria-hidden="true">
  <path d="M2 36V2h34" stroke-width="1.3"/>
  <path d="M2 48C2 22.6 22.6 2 48 2" stroke-width="0.8" opacity="0.7"/>
  <path d="M11 76C11 40.1 40.1 11 76 11" stroke-width="0.6" opacity="0.4"/>
  <path d="M64 2h134" stroke-width="0.7" opacity="0.32"/>
  <path d="M2 64v54" stroke-width="0.7" opacity="0.32"/>
  <rect x="17.5" y="17.5" width="8" height="8" fill="currentColor" stroke="none" transform="rotate(45 21.5 21.5)"/>
</svg>
<svg class="sc-corner-br" viewBox="0 0 200 120" fill="none" stroke="currentColor" aria-hidden="true">
  <path d="M2 36V2h34" stroke-width="1.3"/>
  <path d="M2 48C2 22.6 22.6 2 48 2" stroke-width="0.8" opacity="0.7"/>
  <path d="M64 2h134" stroke-width="0.7" opacity="0.32"/>
  <path d="M2 64v54" stroke-width="0.7" opacity="0.32"/>
  <rect x="17.5" y="17.5" width="8" height="8" fill="currentColor" stroke="none" transform="rotate(45 21.5 21.5)"/>
</svg>`;

/** Percent-encodes the characters that could break out of a CSS url() token. */
export function cssUrl(path) {
  if (!path) return '';
  return `url("${String(path).replace(/["'()\\\s]/g, encodeURIComponent)}")`;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function randomBetween(min, max) {
  return min + (Math.random() * (max - min));
}

function buildMotes(container, count) {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < count; index += 1) {
    const mote = document.createElement('span');
    mote.className = 'sc-mote';
    mote.style.setProperty('--x', `${randomBetween(2, 96).toFixed(2)}%`);
    mote.style.setProperty('--y', `${randomBetween(8, 92).toFixed(2)}%`);
    mote.style.setProperty('--size', `${randomBetween(2, 6).toFixed(1)}px`);
    mote.style.setProperty('--dx', `${randomBetween(-70, 70).toFixed(0)}px`);
    mote.style.setProperty('--dy', `${randomBetween(-150, -50).toFixed(0)}px`);
    mote.style.setProperty('--life', `${randomBetween(14, 30).toFixed(1)}s`);
    mote.style.setProperty('--delay', `${randomBetween(-24, 0).toFixed(1)}s`);
    mote.style.setProperty('--mote-opacity', randomBetween(0.24, 0.7).toFixed(2));
    fragment.appendChild(mote);
  }

  container.appendChild(fragment);
}

/**
 * @param {HTMLElement} root  element the layers are appended to
 * @param {{ motes?: number, ornaments?: boolean }} options
 */
export function createAmbientBackground(root, { motes = 18, ornaments = true } = {}) {
  if (!root) return { setScene() {}, destroy() {} };

  const atmosphere = document.createElement('div');
  atmosphere.className = 'sc-atmosphere';
  atmosphere.setAttribute('aria-hidden', 'true');

  const layers = [document.createElement('div'), document.createElement('div')];
  layers.forEach((layer) => {
    layer.className = 'sc-scene';
    atmosphere.appendChild(layer);
  });

  const wash = document.createElement('div');
  wash.className = 'sc-wash';
  const glow = document.createElement('div');
  glow.className = 'sc-glow';
  atmosphere.append(wash, glow);
  root.prepend(atmosphere);

  let ornamentLayer = null;
  if (ornaments) {
    ornamentLayer = document.createElement('div');
    ornamentLayer.className = 'sc-ornament';
    ornamentLayer.setAttribute('aria-hidden', 'true');
    ornamentLayer.innerHTML = CORNER_ORNAMENT;
    atmosphere.after(ornamentLayer);
  }

  let particleLayer = null;
  if (motes > 0 && !prefersReducedMotion()) {
    particleLayer = document.createElement('div');
    particleLayer.className = 'sc-particles';
    particleLayer.setAttribute('aria-hidden', 'true');
    buildMotes(particleLayer, motes);
    (ornamentLayer || atmosphere).after(particleLayer);
  }

  let front = 0;
  let currentSource = '';

  return {
    /** Crossfades the atmospheric image. Repeated calls with the same source are ignored. */
    setScene(source) {
      if (source === currentSource) return;
      currentSource = source;

      const next = layers[front ^ 1];
      const previous = layers[front];

      next.style.backgroundImage = cssUrl(source);
      next.classList.toggle('is-active', Boolean(source));
      previous.classList.remove('is-active');
      front ^= 1;
    },

    destroy() {
      atmosphere.remove();
      ornamentLayer?.remove();
      particleLayer?.remove();
    },
  };
}
