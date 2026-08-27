import { setHref, setSocialLink, setText } from '../utils.js';

export function initContact(data) {
  const contact = data.contact || {};
  const email = contact.email || '';
  const form = document.getElementById('contact-form');
  const copyButton = document.getElementById('copy-email');
  const copyStatus = document.getElementById('copy-email-status');

  setText('#contact-availability', contact.availability);
  setText('#contact-location', contact.location);
  setText('#contact-email-text', email);
  setHref('#contact-email-link', email ? `mailto:${email}` : '');
  setSocialLink('#contact-github', contact.githubUrl);
  setSocialLink('#contact-linkedin', contact.linkedinUrl);

  if (!email) {
    copyButton?.setAttribute('hidden', '');
    form?.setAttribute('hidden', '');
    return;
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      if (copyStatus) copyStatus.textContent = 'Email address copied.';
      if (copyButton) copyButton.textContent = 'Copied';
    } catch {
      if (copyStatus) copyStatus.textContent = `Email address: ${email}`;
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const values = new FormData(form);
    const subject = String(values.get('subject') || 'Portfolio Job Opportunity').trim();
    const body = [
      `Name: ${String(values.get('name') || '').trim()}`,
      `Reply Email: ${String(values.get('email') || '').trim()}`,
      '',
      String(values.get('message') || '').trim(),
    ].join('\n');

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  copyButton?.addEventListener('click', onCopy);
  form?.addEventListener('submit', onSubmit);

  return () => {
    copyButton?.removeEventListener('click', onCopy);
    form?.removeEventListener('submit', onSubmit);
  };
}
