const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export class ModalController {
  constructor(modal, content, closeButton) {
    this.modal = modal;
    this.content = content;
    this.closeButton = closeButton;
    this.originalParent = modal?.parentElement || null;
    this.originalNextSibling = modal?.nextSibling || null;
    this.previouslyFocused = null;
    this.inertElements = [];
    this.onKeyDown = (event) => this.handleKeyDown(event);
    this.onBackdropClick = (event) => {
      if (event.target === this.modal) this.close();
    };

    this.closeButton?.addEventListener('click', () => this.close());
    this.modal?.addEventListener('click', this.onBackdropClick);
  }

  open(node, label) {
    if (!this.modal || !this.content) return;
    document.body.appendChild(this.modal);
    this.content.replaceChildren(node);
    if (label) this.modal.setAttribute('aria-label', label);
    this.previouslyFocused = document.activeElement;
    this.setSurroundingsInert(true);
    this.modal.hidden = false;
    document.body.classList.add('is-locked');
    document.addEventListener('keydown', this.onKeyDown);
    this.closeButton?.focus();
  }

  close() {
    if (!this.modal || this.modal.hidden) return;
    this.modal.hidden = true;
    this.content?.replaceChildren();
    document.body.classList.remove('is-locked');
    document.removeEventListener('keydown', this.onKeyDown);
    this.setSurroundingsInert(false);
    if (this.originalParent?.isConnected) {
      this.originalParent.insertBefore(this.modal, this.originalNextSibling);
    }
    this.previouslyFocused?.focus?.();
    this.previouslyFocused = null;
  }

  destroy() {
    this.close();
    this.modal?.removeEventListener('click', this.onBackdropClick);
    // The router may have replaced the page the overlay came from; if its
    // original home is gone, close() left it parked on <body>.
    if (this.modal && !this.originalParent?.isConnected) this.modal.remove();
  }

  handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = [...this.modal.querySelectorAll(focusableSelector)]
      .filter((element) => !element.hidden && element.offsetParent !== null);
    if (!focusable.length) {
      event.preventDefault();
      this.closeButton?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  setSurroundingsInert(makeInert) {
    if (!this.modal) return;
    if (!makeInert) {
      this.inertElements.forEach(({ element, wasInert }) => {
        element.inert = wasInert;
      });
      this.inertElements = [];
      return;
    }

    let activeBranch = this.modal;
    while (activeBranch.parentElement) {
      [...activeBranch.parentElement.children].forEach((element) => {
        if (element === activeBranch || this.inertElements.some((entry) => entry.element === element)) return;
        this.inertElements.push({ element, wasInert: element.inert });
        element.inert = true;
      });
      if (activeBranch.parentElement === document.body) break;
      activeBranch = activeBranch.parentElement;
    }
  }
}
