import { ModalController } from '../components/modal.js';

/**
 * MediaViewer - fullscreen presentation for a single image, a gallery,
 * or an embedded demo/video. Shared by the project and art showcases.
 */

function createGallery(images) {
  const gallery = document.createElement('div');
  gallery.className = 'gallery';

  const image = document.createElement('img');
  const status = document.createElement('p');
  status.className = 'gallery-status';
  status.setAttribute('aria-live', 'polite');

  let index = 0;
  const show = () => {
    image.src = images[index].src;
    image.alt = images[index].alt || '';
    status.textContent = `${index + 1} of ${images.length}`;
  };

  gallery.appendChild(image);

  if (images.length > 1) {
    const controls = document.createElement('div');
    controls.className = 'gallery-controls';

    const previous = document.createElement('button');
    previous.type = 'button';
    previous.className = 'btn btn--small';
    previous.textContent = 'Previous';
    previous.addEventListener('click', () => {
      index = (index - 1 + images.length) % images.length;
      show();
    });

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn btn--small';
    next.textContent = 'Next';
    next.addEventListener('click', () => {
      index = (index + 1) % images.length;
      show();
    });

    controls.append(previous, status, next);
    gallery.appendChild(controls);
  }

  show();
  return gallery;
}

export function createMediaViewer(root) {
  const modal = root.querySelector('[data-media-viewer]');
  const controller = new ModalController(
    modal,
    modal?.querySelector('[data-media-stage]'),
    modal?.querySelector('[data-overlay-close]'),
  );

  return {
    openImage(src, alt, label) {
      if (!src) return;
      const image = document.createElement('img');
      image.src = src;
      image.alt = alt || '';
      controller.open(image, label);
    },

    openGallery(images, label) {
      const valid = images.filter((item) => item?.src);
      if (!valid.length) return;
      if (valid.length === 1) {
        this.openImage(valid[0].src, valid[0].alt, label);
        return;
      }
      controller.open(createGallery(valid), label);
    },

    openEmbed(url, label) {
      if (!url) return;
      const frame = document.createElement('iframe');
      frame.src = url;
      frame.title = label || 'Embedded media';
      frame.allowFullscreen = true;
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      controller.open(frame, label);
    },

    destroy() {
      controller.destroy();
    },
  };
}
