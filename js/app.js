import { loadPartial, loadPortfolioData } from './data.js';
import { Router } from './router.js';
import { initNav } from './components/nav.js';
import { initMusicPlayer } from './components/music-player.js';
import { updateFooter } from './components/footer.js';
import { initHome, initAbout, initResume } from './pages/profile.js';
import { initProjects } from './pages/projects.js';
import { initArt } from './pages/art.js';
import { initKnowledge } from './pages/knowledge.js';
import { initContact } from './pages/contact.js';

const pages = {
  'home.html': initHome,
  'projects.html': initProjects,
  'art.html': initArt,
  'about.html': initAbout,
  'knowledge.html': initKnowledge,
  'resume.html': initResume,
  'contact.html': initContact,
};

async function start() {
  const [, , data] = await Promise.all([
    loadPartial('nav.html', '#navbar-placeholder'),
    loadPartial('footer.html', '#footer-placeholder'),
    loadPortfolioData(),
  ]);

  initNav();
  updateFooter(data);
  initMusicPlayer(data);

  const router = new Router({ pages, data });
  router.start();
}

start().catch((error) => {
  console.error(error);
  const content = document.getElementById('content');
  if (content) {
    content.innerHTML = '<section class="page-error"><h1>Portfolio unavailable</h1><p>Please refresh the page and try again.</p></section>';
  }
});
