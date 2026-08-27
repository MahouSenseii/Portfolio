export function getCategories(item, fallback) {
  const value = item?.categories ?? item?.category;
  const categories = Array.isArray(value) ? value : [value];
  const cleaned = categories.filter((category) => typeof category === 'string' && category.trim());
  return cleaned.length ? cleaned : [fallback];
}

export function formatCategories(item, fallback) {
  return getCategories(item, fallback).join(' / ');
}

export function safeHttpUrl(value) {
  if (!value) return '';

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

export function getVideoEmbedUrl(value) {
  const safeUrl = safeHttpUrl(value);
  if (!safeUrl) return '';

  const url = new URL(safeUrl);
  if (url.hostname === 'youtu.be' || url.hostname.endsWith('.youtube.com') || url.hostname === 'youtube.com') {
    const videoId = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
    return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : '';
  }

  if (url.hostname === 'vimeo.com' || url.hostname.endsWith('.vimeo.com')) {
    const videoId = url.pathname.split('/').filter(Boolean).pop();
    return videoId ? `https://player.vimeo.com/video/${encodeURIComponent(videoId)}` : '';
  }

  return '';
}

export function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value || '';
}

export function setHref(selector, href) {
  const element = document.querySelector(selector);
  if (!element) return;

  if (href) {
    element.href = href;
    element.hidden = false;
  } else {
    element.removeAttribute('href');
    element.hidden = true;
  }
}

export function setSocialLink(selector, value) {
  const element = document.querySelector(selector);
  if (!element) return;

  const url = safeHttpUrl(value);
  element.hidden = !url;
  if (!url) {
    element.removeAttribute('href');
    return;
  }

  element.href = url;
}

export function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

export function deriveLevel(percent) {
  if (percent >= 85) return 'Expert';
  if (percent >= 70) return 'Advanced';
  if (percent >= 50) return 'Intermediate';
  return 'Beginner';
}

export function centerSelectedItem(container, item) {
  if (!container || !item) return;
  const left = item.offsetLeft - ((container.clientWidth - item.clientWidth) / 2);
  container.scrollTo({ left, behavior: 'smooth' });
}

export function sortByOrder(items) {
  return [...items].sort((a, b) => (Number(a.sortOrder) || 999) - (Number(b.sortOrder) || 999));
}
