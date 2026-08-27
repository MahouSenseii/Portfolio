import { setSocialLink, setText } from '../utils.js';

export function updateFooter(data) {
  const contact = data.contact || {};
  setText('#footer-year', new Date().getFullYear());
  setText('#footer-name', data.profile?.name);
  setSocialLink('#footer-github', contact.githubUrl);
  setSocialLink('#footer-linkedin', contact.linkedinUrl);
}
