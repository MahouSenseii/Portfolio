import { ModalController } from '../components/modal.js';

/**
 * The side drawer. One panel, many contents: project details, dev logs,
 * or anything else a page wants to slide in. Callers build the node.
 */
export function createDrawer(root) {
  const modal = root.querySelector('[data-details-panel]');
  const controller = new ModalController(
    modal,
    modal?.querySelector('[data-details-body]'),
    modal?.querySelector('[data-overlay-close]'),
  );

  return {
    open(node, label) {
      if (node) controller.open(node, label);
    },
    destroy() {
      controller.destroy();
    },
  };
}
