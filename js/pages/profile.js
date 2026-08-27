import { setHref, setText } from '../utils.js';
import { createAmbientBackground } from '../showcase/ambient.js';
import { resolveSceneVideo } from '../showcase/assets.js';

const HOME_SCENE = 'img/bghome.webp';

export function initHome(data) {
  const profile = data.profile || {};
  const home = document.getElementById('home');

  setText('#home-name', profile.name);
  setText('#home-tagline', profile.tagline);

  const roles = document.getElementById('home-roles');
  roles?.replaceChildren(...(profile.roles || []).map((role) => {
    const item = document.createElement('li');
    item.textContent = role;
    return item;
  }));

  const gateways = document.getElementById('home-gateways');
  gateways?.replaceChildren(...(profile.disciplines || []).map((discipline, index) => {
    const link = document.createElement('a');
    link.className = 'home-gateway';
    link.href = discipline.href;
    if (discipline.theme) link.dataset.theme = discipline.theme;

    const order = document.createElement('span');
    order.className = 'home-gateway-index';
    order.textContent = String(index + 1).padStart(2, '0');

    const title = document.createElement('h2');
    title.className = 'home-gateway-title';
    title.textContent = discipline.title;

    const blurb = document.createElement('p');
    blurb.className = 'home-gateway-blurb';
    blurb.textContent = discipline.blurb;

    const go = document.createElement('span');
    go.className = 'home-gateway-go';
    go.textContent = 'Enter →';

    link.append(order, title, blurb, go);
    return link;
  }));

  const ambient = createAmbientBackground(home, { motes: 26, ornaments: false });
  ambient.setScene(HOME_SCENE);

  const video = resolveSceneVideo(profile);
  ambient.setVideo(video.src, video.rotate);

  return () => ambient.destroy();
}

export function initAbout(data) {
  const copy = document.getElementById('about-copy');
  copy?.replaceChildren(...(data.profile?.about || []).map((paragraph) => {
    const item = document.createElement('p');
    item.textContent = paragraph;
    return item;
  }));
}

export function initResume(data) {
  const email = data.contact?.email || '';
  const resume = data.resume || {};

  setHref('#resume-download-link', resume.url || 'documents/quentin_davis_resume.docx');
  setHref('#resume-email-link', email ? `mailto:${email}` : '');
  setText('#resume-email-text', email || 'Email Quentin');
  setText('#resume-role', resume.role);
  setText('#resume-summary', resume.summary);

  appendList('#resume-skills', resume.technicalSkills, 'chip');
  appendList('#resume-strengths', resume.strengths);

  const experience = document.getElementById('resume-experience');
  experience?.replaceChildren(...(resume.experience || []).map((job) => {
    const item = document.createElement('article');
    item.className = 'resume-job';

    const title = document.createElement('h3');
    title.textContent = job.title;

    const meta = document.createElement('p');
    meta.className = 'resume-job-meta';
    meta.textContent = [job.organization, job.location, job.timeframe].filter(Boolean).join(' • ');

    const highlights = document.createElement('ul');
    highlights.append(...(job.highlights || []).map((highlight) => {
      const listItem = document.createElement('li');
      listItem.textContent = highlight;
      return listItem;
    }));

    item.append(title, meta, highlights);
    return item;
  }));

  const education = document.getElementById('resume-education');
  education?.replaceChildren(...(resume.education || []).map((entry) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = entry;
    return paragraph;
  }));
}

function appendList(selector, values = [], className = '') {
  const list = document.querySelector(selector);
  list?.replaceChildren(...values.map((value) => {
    const item = document.createElement('li');
    if (className) item.className = className;
    item.textContent = value;
    return item;
  }));
}
