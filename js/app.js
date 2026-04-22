const VALID_PAGES = new Set([
  'home.html',
  'projects.html',
  'art.html',
  'about.html',
  'knowledge.html',
  'contact.html'
]);

const pageCache = {};
let portfolioDataPromise = null;
let currentProjectIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  loadPartial('nav.html', '#navbar-placeholder').then(() => {
    initNavLinks();
    initMusicPlayer();
    updateActiveNav(getCurrentPage());
  });

  loadPartial('footer.html', '#footer-placeholder').then(updateFooter);
  loadPortfolioData().then(updateFooter);

  loadPage(getCurrentPage(), false);
  initNavbarScroll();

  window.addEventListener('hashchange', () => {
    loadPage(getCurrentPage(), false);
  });
});

function loadPartial(url, selector) {
  return fetch(url)
    .then(response => {
      if (!response.ok) throw new Error(`Unable to load ${url}`);
      return response.text();
    })
    .then(html => {
      const target = document.querySelector(selector);
      if (target) target.innerHTML = html;
    })
    .catch(error => {
      console.error(error);
    });
}

function loadPortfolioData() {
  if (!portfolioDataPromise) {
    portfolioDataPromise = fetch('data/portfolio.json')
      .then(response => {
        if (!response.ok) throw new Error('Unable to load portfolio data.');
        return response.json();
      })
      .catch(error => {
        console.error(error);
        return {
          profile: {
            name: 'Portfolio',
            roles: [],
            tagline: 'Portfolio content is temporarily unavailable.',
            about: []
          },
          contact: {},
          projects: [],
          skills: [],
          art: [],
          music: []
        };
      });
  }

  return portfolioDataPromise;
}

function getCurrentPage() {
  const rawPage = window.location.hash.replace('#', '') || 'home.html';
  return normalizePage(rawPage);
}

function normalizePage(page) {
  const cleanPage = page.replace('pages/', '').trim();
  return VALID_PAGES.has(cleanPage) ? cleanPage : 'home.html';
}

function loadPage(page, updateHash = true) {
  const cleanPage = normalizePage(page);

  if (updateHash) {
    const nextHash = `#${cleanPage}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = cleanPage;
      return;
    }
  }

  const url = `pages/${cleanPage}`;
  const cached = pageCache[url];

  const render = html => {
    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = html;
    afterPageLoad(cleanPage);
  };

  if (cached) {
    render(cached);
    return;
  }

  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error(`Unable to load ${url}`);
      return response.text();
    })
    .then(html => {
      pageCache[url] = html;
      render(html);
    })
    .catch(error => {
      console.error(error);
      loadPage('home.html', true);
    });
}

function afterPageLoad(page) {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateActiveNav(page);

  loadPortfolioData().then(data => {
    if (page === 'home.html')      renderHome(data);
    if (page === 'about.html')     renderAbout(data);
    if (page === 'projects.html')  renderProjects(data);
    if (page === 'art.html')       renderArtGallery(data);
    if (page === 'knowledge.html') renderKnowledgeBars(data);
    if (page === 'contact.html')   renderContact(data);
  });
}

function initNavLinks() {
  document.querySelectorAll('.nav-link, .navbar-brand, .nav-cta').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      loadPage(link.getAttribute('href'));

      const navMenu = document.getElementById('mainNav');
      if (navMenu && navMenu.classList.contains('show') && window.bootstrap) {
        window.bootstrap.Collapse.getOrCreateInstance(navMenu).hide();
      }
    });
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    const href = normalizePage(link.getAttribute('href'));
    const url = `pages/${href}`;

    link.addEventListener('mouseenter', () => {
      if (pageCache[url]) return;

      fetch(url)
        .then(response => response.ok ? response.text() : '')
        .then(html => {
          if (html) pageCache[url] = html;
        })
        .catch(() => {});
    });
  });
}

function updateActiveNav(page) {
  const cleanPage = normalizePage(page);

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === cleanPage);
  });
}

function initNavbarScroll() {
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.custom-navbar');
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

function initMusicPlayer() {
  loadPortfolioData().then(data => {
    const playlist = Array.isArray(data.music) ? data.music.filter(song => song.src) : [];
    const audio = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-btn');
    const miniPlayer = document.getElementById('mini-music-player');
    const songTitle = document.getElementById('song-title');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    const progressBar = document.getElementById('progress-bar');
    const prevBtn = document.getElementById('prev-song');
    const nextBtn = document.getElementById('next-song');
    const togglePlayBtn = document.getElementById('toggle-play');

    if (!audio || !musicBtn || !playlist.length) {
      if (musicBtn) musicBtn.hidden = true;
      return;
    }

    let currentIndex = 0;
    let isPlaying = false;

    const loadSong = index => {
      const song = playlist[index];
      audio.src = song.src;
      if (songTitle) songTitle.textContent = song.name || 'Portfolio Track';
    };

    const playMusic = () => {
      if (!audio.src) loadSong(currentIndex);

      audio.play()
        .then(() => {
          isPlaying = true;
          musicBtn.src = 'img/music-on.png';
          if (miniPlayer) miniPlayer.hidden = false;
          if (togglePlayBtn) togglePlayBtn.setAttribute('aria-label', 'Pause music');
        })
        .catch(error => console.error(error));
    };

    const pauseMusic = () => {
      audio.pause();
      isPlaying = false;
      musicBtn.src = 'img/music-off.png';
      if (miniPlayer) miniPlayer.hidden = true;
      if (togglePlayBtn) togglePlayBtn.setAttribute('aria-label', 'Play music');
    };

    const updateProgress = () => {
      const current = audio.currentTime;
      const duration = audio.duration || 0;
      if (progressBar) progressBar.value = duration ? (current / duration) * 100 : 0;
      if (currentTimeEl) currentTimeEl.textContent = formatTime(current);
      if (totalTimeEl) totalTimeEl.textContent = formatTime(duration);
    };

    const toggleFromControl = () => isPlaying ? pauseMusic() : playMusic();

    musicBtn.addEventListener('click', toggleFromControl);
    musicBtn.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleFromControl();
      }
    });
    if (togglePlayBtn) togglePlayBtn.addEventListener('click', toggleFromControl);

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % playlist.length;
        loadSong(currentIndex);
        if (isPlaying) audio.play().catch(error => console.error(error));
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        loadSong(currentIndex);
        if (isPlaying) audio.play().catch(error => console.error(error));
      });
    }

    if (progressBar) {
      progressBar.addEventListener('input', () => {
        if (audio.duration) audio.currentTime = (progressBar.value / 100) * audio.duration;
      });
    }

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    loadSong(currentIndex);
  });
}

// ─── Page renderers ────────────────────────────────────────────────────────────

function renderHome(data) {
  setText('#home-name', data.profile.name);
  setText('#home-tagline', data.profile.tagline);

  const roleList = document.getElementById('home-roles');
  if (!roleList) return;

  roleList.innerHTML = '';
  (data.profile.roles || []).forEach(role => {
    const item = document.createElement('span');
    item.textContent = role;
    roleList.appendChild(item);
  });
}

function renderAbout(data) {
  setText('#about-name', data.profile.name);

  const copy = document.getElementById('about-copy');
  if (!copy) return;

  copy.innerHTML = '';
  (data.profile.about || []).forEach(paragraph => {
    const p = document.createElement('p');
    p.textContent = paragraph;
    copy.appendChild(p);
  });
}

// ─── Project showcase ───────────────────────────────────────────────────────
// Full-bleed art background + left tag sidebar + info card + bottom strip
function renderProjects(data) {
  const rawProjects = Array.isArray(data.projects) ? data.projects : [];
  const projects = [...rawProjects].sort((a, b) => {
    const ao = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 999;
    const bo = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 999;
    return ao - bo;
  });

  const gpBg = document.getElementById('gp-bg');
  const categoryNav = document.getElementById('gp-category-nav');
  const strip = document.getElementById('gp-strip');
  const stripPrev = document.querySelector('.gp-strip-prev');
  const stripNext = document.querySelector('.gp-strip-next');
  const modal = document.getElementById('gp-modal');
  const modalInner = document.getElementById('gp-modal-inner');
  const modalClose = document.querySelector('.gp-modal-close');
  const projectPage = document.querySelector('.proj-page');
  const characterWrap = document.getElementById('gp-character');
  const characterImg = document.getElementById('gp-character-img');

  if (!strip || !categoryNav) return;

  if (!projects.length) {
    strip.innerHTML = '<p class="empty-state">No projects have been added yet.</p>';
    categoryNav.innerHTML = '';
    return;
  }

  let activeCategory = 'All';
  currentProjectIndex = Math.min(currentProjectIndex, projects.length - 1);

  const categorySet = new Set(['All']);
  projects.forEach(project => categorySet.add(project.category || 'Projects'));
  const allCategories = [...categorySet];

  function getFiltered() {
    if (activeCategory === 'All') return projects;
    return projects.filter(project => (project.category || 'Projects') === activeCategory);
  }

  // ── Tag sidebar ────────────────────────────────────────────────────────
  function renderCategoryNav() {
    categoryNav.innerHTML = '';
    allCategories.forEach(category => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `gp-category-item${category === activeCategory ? ' active' : ''}`;
      btn.setAttribute('role', 'listitem');
      btn.textContent = category;
      btn.addEventListener('click', () => {
        activeCategory = category;
        const filtered = getFiltered();
        if (filtered.length && !filtered.includes(projects[currentProjectIndex])) {
          currentProjectIndex = projects.indexOf(filtered[0]);
        }
        renderCategoryNav();
        renderStrip();
        updatePanel(projects[currentProjectIndex]);
      });
      categoryNav.appendChild(btn);
    });
  }

  // ── Bottom thumbnail strip ─────────────────────────────────────────────
  function renderStrip() {
    strip.innerHTML = '';
    const filtered = getFiltered();

    filtered.forEach(project => {
      const globalIdx = projects.indexOf(project);
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = `gp-thumb${globalIdx === currentProjectIndex ? ' active' : ''}`;
      thumb.setAttribute('role', 'listitem');
      thumb.setAttribute('aria-label', project.name || 'Project');

      const imgBox = document.createElement('div');
      imgBox.className = 'gp-thumb-img';

      const thumbSrc = project.thumbnail || project.image;

      if (thumbSrc) {
        const img = document.createElement('img');
        img.src = thumbSrc;
        img.alt = project.imageAlt || project.name || '';
        img.loading = 'lazy';
        imgBox.appendChild(img);
      } else {
        const ph = document.createElement('div');
        ph.className = 'gp-thumb-placeholder';
        ph.textContent = project.name || 'Project';
        imgBox.appendChild(ph);
      }

      const nameEl = document.createElement('span');
      nameEl.className = 'gp-thumb-name';
      nameEl.textContent = project.name || '';

      thumb.append(imgBox, nameEl);
      thumb.addEventListener('click', () => {
        currentProjectIndex = globalIdx;
        renderStrip();
        updatePanel(project);
      });

      strip.appendChild(thumb);
    });

    // Scroll active into view
    requestAnimationFrame(() => {
      const active = strip.querySelector('.gp-thumb.active');
      if (active) active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    });
  }

  // ── Arrow navigation ───────────────────────────────────────────────────
  function navigate(dir) {
    const filtered = getFiltered();
    if (!filtered.length) return;
    const cur = filtered.indexOf(projects[currentProjectIndex]);
    const next = (cur + dir + filtered.length) % filtered.length;
    currentProjectIndex = projects.indexOf(filtered[next]);
    renderStrip();
    updatePanel(projects[currentProjectIndex]);
  }

  if (stripPrev) stripPrev.onclick = () => navigate(-1);
  if (stripNext) stripNext.onclick = () => navigate(1);

  // ── Project detail panel ───────────────────────────────────────────────
  function updatePanel(project) {
    if (!project) return;

    // Background art
    if (gpBg) {
      gpBg.style.backgroundImage = project.image
        ? `url('${project.image}')`
        : "url('img/bgprojects.png')";
      gpBg.style.backgroundPosition = 'center right';
      gpBg.style.backgroundSize = 'cover';
    }

    // Watermark project name
    const wmName = document.getElementById('gp-watermark-name');
    if (wmName) wmName.textContent = project.name || '';

    // Optional right-side project character/render image
    const characterImage = project.characterImage || '';
    if (characterWrap && characterImg) {
      characterWrap.hidden = !characterImage;
      if (projectPage) projectPage.classList.toggle('has-character', Boolean(characterImage));
      if (characterImage) {
        characterImg.src = characterImage;
        characterImg.alt = project.characterAlt || `${project.name || 'Project'} character render`;
      } else {
        characterImg.removeAttribute('src');
        characterImg.alt = '';
      }
    }

    // Featured badge
    const featEl = document.getElementById('gp-featured');
    if (featEl) featEl.hidden = !project.featured;

    // Title, role, summary, description
    setText('#gp-name',    project.name    || 'Untitled Project');
    setText('#gp-subtitle', project.subtitle || project.category || '');
    setText('#gp-role',    project.role    || '');
    setText('#gp-summary', project.summary || '');
    setText('#gp-desc',    project.details || '');

    // Tag chips
    const tagsEl = document.getElementById('gp-tags');
    if (tagsEl) {
      tagsEl.innerHTML = '';
      (project.tags || []).forEach(tag => {
        const chip = document.createElement('span');
        chip.className = 'project-tag';
        chip.textContent = tag;
        tagsEl.appendChild(chip);
      });
    }

    // Meta pills (engine + timeframe)
    const metaEl = document.getElementById('gp-meta');
    if (metaEl) {
      metaEl.innerHTML = '';
      if (project.engine)    appendMeta(metaEl, 'Engine',    project.engine);
      if (project.timeframe) appendMeta(metaEl, 'Timeframe', project.timeframe);
    }

    // Highlights
    const hiEl = document.getElementById('gp-highlights');
    if (hiEl) {
      hiEl.innerHTML = '';
      hiEl.className = (project.highlights || []).length ? 'project-highlights' : '';
      (project.highlights || []).forEach(h => {
        const li = document.createElement('li');
        li.textContent = h;
        hiEl.appendChild(li);
      });
    }

    // Links
    const linksEl = document.getElementById('gp-links');
    if (linksEl) {
      linksEl.innerHTML = '';
      linksEl.className = (project.links || []).length ? 'project-links' : '';
      (project.links || []).forEach(link => {
        const url = safeHttpUrl(link.url);
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = link.label || 'Open';
        linksEl.appendChild(a);
      });
    }

    // Media action buttons
    const actionsEl = document.getElementById('gp-actions');
    if (actionsEl) {
      actionsEl.innerHTML = '';

      const embedSrc = safeHttpUrl(project.embed);
      const videoSrc = project.videoUrl ? getVideoEmbedUrl(project.videoUrl) : '';

      if (embedSrc || videoSrc) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gp-media-btn';
        btn.textContent = embedSrc ? 'Play Project' : 'Watch Video';
        btn.addEventListener('click', () => openMedia(embedSrc || videoSrc, false));
        actionsEl.appendChild(btn);
      }

      // Gallery button for any project image/gallery image.
      const allImgs = [];
      if (project.image) allImgs.push({ src: project.image, alt: project.imageAlt || project.name || '' });
      (project.galleryImages || []).forEach((img, i) => {
        const src = typeof img === 'string' ? img : img.src;
        const alt = typeof img === 'string'
          ? `${project.name || 'Project'} image ${allImgs.length + 1}`
          : img.alt || `${project.name || 'Project'} image ${allImgs.length + 1}`;
        if (src) allImgs.push({ src, alt });
      });

      if (allImgs.length) {
        const galBtn = document.createElement('button');
        galBtn.type = 'button';
        galBtn.className = 'gp-media-btn';
        galBtn.textContent = allImgs.length === 1 ? 'View Image' : `Gallery (${allImgs.length})`;
        galBtn.addEventListener('click', () => openGallery(allImgs));
        actionsEl.appendChild(galBtn);
      }
    }
  }

  // ── Media modal helpers ────────────────────────────────────────────────
  function openMedia(src, isImage) {
    if (!modal || !modalInner) return;
    modalInner.innerHTML = '';

    if (isImage) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Project media';
      modalInner.appendChild(img);
    } else {
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = 'Project media';
      iframe.allowFullscreen = true;
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      modalInner.appendChild(iframe);
    }

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function openGallery(images) {
    if (!modal || !modalInner) return;
    let galIdx = 0;

    function showImg(idx) {
      modalInner.innerHTML = '';
      const img = document.createElement('img');
      img.src = images[idx].src;
      img.alt = images[idx].alt;
      modalInner.appendChild(img);

      if (images.length > 1) {
        const nav = document.createElement('div');
        nav.className = 'gp-gallery-nav';

        const prev = document.createElement('button');
        prev.type = 'button';
        prev.className = 'gp-gallery-arrow';
        prev.textContent = '<';
        prev.addEventListener('click', () => { galIdx = (galIdx - 1 + images.length) % images.length; showImg(galIdx); });

        const counter = document.createElement('span');
        counter.textContent = `${idx + 1} / ${images.length}`;

        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'gp-gallery-arrow';
        next.textContent = '>';
        next.addEventListener('click', () => { galIdx = (galIdx + 1) % images.length; showImg(galIdx); });

        nav.append(prev, counter, next);
        modalInner.appendChild(nav);
      }
    }

    showImg(galIdx);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    if (modalInner) modalInner.innerHTML = '';
    document.body.style.overflow = '';
  }

  if (modalClose) modalClose.onclick = closeModal;
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  const escHandler = e => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);

  // ── First render ───────────────────────────────────────────────────────
  renderCategoryNav();
  renderStrip();
  updatePanel(projects[currentProjectIndex]);
}

function appendMeta(parent, label, value) {
  if (!value) return;
  const item = document.createElement('span');
  item.textContent = `${label}: ${value}`;
  parent.appendChild(item);
}

function renderArtGallery(data) {
  const gallery = document.getElementById('art-gallery');
  if (!gallery) return;

  const rawImages = Array.isArray(data.art) ? data.art : [];
  const images = [...rawImages].sort((a, b) => {
    const ao = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 999;
    const bo = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 999;
    return ao - bo;
  });

  gallery.innerHTML = '';

  if (!images.length) {
    gallery.innerHTML = '<p class="empty-state">No artwork has been added yet.</p>';
    return;
  }

  images.forEach(art => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'art-card';

    const image = document.createElement('img');
    image.src = art.src;
    image.alt = art.alt || art.title || 'Portfolio artwork';
    image.loading = 'lazy';

    const caption = document.createElement('span');
    caption.className = 'art-caption';
    caption.textContent = [art.title, art.category, art.year].filter(Boolean).join(' - ');

    card.append(image, caption);
    card.addEventListener('click', () => openLightbox(art));
    gallery.appendChild(card);
  });
}

function renderKnowledgeBars(data) {
  const container = document.getElementById('knowledge-list');
  if (!container) return;

  const categories = Array.isArray(data.skills) ? data.skills : [];
  container.innerHTML = '';

  if (!categories.length) {
    container.innerHTML = '<p class="empty-state">No skills have been added yet.</p>';
    return;
  }

  categories.forEach(category => {
    const section = document.createElement('section');
    section.className = 'knowledge-category';

    const heading = document.createElement('h2');
    heading.className = 'knowledge-heading';
    heading.textContent = category.category || 'Skills';
    section.appendChild(heading);

    // Sort items by sortOrder
    const items = Array.isArray(category.items) ? [...category.items].sort((a, b) => {
      const ao = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 999;
      const bo = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 999;
      return ao - bo;
    }) : [];

    items.forEach(skill => {
      const percent = clampPercent(skill.percent);
      const levelLabel = deriveLevel(percent);

      const item = document.createElement('div');
      item.className = 'knowledge-item';

      const row = document.createElement('div');
      row.className = 'knowledge-title';

      const nameGroup = document.createElement('div');
      nameGroup.className = 'knowledge-name-group';

      const name = document.createElement('strong');
      name.textContent = skill.name || 'Unnamed Skill';

      const levelBadge = document.createElement('span');
      levelBadge.className = `skill-level-badge skill-level-${levelLabel.toLowerCase()}`;
      levelBadge.textContent = levelLabel;

      nameGroup.append(name, levelBadge);

      const value = document.createElement('span');
      value.className = 'skill-percent';
      value.textContent = `${percent}%`;

      const barWrapper = document.createElement('div');
      barWrapper.className = 'progress-bar-wrapper';
      barWrapper.setAttribute('aria-label', `${name.textContent} comfort level ${percent}%`);

      const bar = document.createElement('div');
      bar.className = 'skill-progress';
      bar.style.width = '0%';

      row.append(nameGroup, value);
      barWrapper.appendChild(bar);
      item.append(row, barWrapper);
      section.appendChild(item);

      requestAnimationFrame(() => {
        bar.style.width = `${percent}%`;
      });
    });

    container.appendChild(section);
  });
}

function renderContact(data) {
  const contact = data.contact || {};
  const email = contact.email || '';
  const phone = contact.phone || '';
  const location = contact.location || '';

  setText('#contact-availability', contact.availability);
  setText('#contact-email-text', email);
  setText('#contact-phone-text', phone);
  setText('#contact-location', location);

  setHref('#contact-email-link', email ? `mailto:${email}` : '');
  setHref('#contact-phone-link', phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '');

  setSocialLink('#contact-github', contact.githubUrl);
  setSocialLink('#contact-linkedin', contact.linkedinUrl);
  setSocialLink('#contact-discord', contact.discord);
  setSocialLink('#contact-itch', contact.itchUrl);
  setSocialLink('#footer-discord', contact.discord);
  setSocialLink('#footer-itch', contact.itchUrl);

  const form = document.getElementById('contact-form');
  if (!form || !email) return;

  form.addEventListener('submit', event => {
    event.preventDefault();

    const formData = new FormData(form);
    const senderName = String(formData.get('name') || '').trim();
    const senderEmail = String(formData.get('email') || '').trim();
    const subject = String(formData.get('subject') || 'Portfolio Job Opportunity').trim();
    const message = String(formData.get('message') || '').trim();

    const body = [
      senderName ? `Name: ${senderName}` : '',
      senderEmail ? `Reply Email: ${senderEmail}` : '',
      '',
      message
    ].join('\n');

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

function updateFooter() {
  loadPortfolioData().then(data => {
    const contact = data.contact || {};

    setText('#footer-year', new Date().getFullYear());
    setText('#footer-name', data.profile.name);
    setSocialLink('#footer-github', contact.githubUrl);
    setSocialLink('#footer-linkedin', contact.linkedinUrl);
    setSocialLink('#footer-discord', contact.discord);
    setSocialLink('#footer-itch', contact.itchUrl);
  });
}

function openLightbox(art) {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <div class="lightbox-content">
      <button class="lightbox-close" type="button" aria-label="Close artwork preview">&times;</button>
      <img src="" alt="">
      <div class="lightbox-caption">
        <p class="lightbox-title"></p>
        <p class="lightbox-description"></p>
      </div>
    </div>
  `;

  const image = lightbox.querySelector('img');
  const titleEl = lightbox.querySelector('.lightbox-title');
  const descEl = lightbox.querySelector('.lightbox-description');

  image.src = art.src;
  image.alt = art.alt || art.title || 'Portfolio artwork';
  titleEl.textContent = [art.title, art.category, art.year].filter(Boolean).join(' — ');
  if (art.description) {
    descEl.textContent = art.description;
  } else {
    descEl.remove();
  }

  const closeLightbox = () => {
    lightbox.remove();
    document.removeEventListener('keydown', closeLightboxOnEscape);
  };

  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });

  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);

  document.addEventListener('keydown', closeLightboxOnEscape);
  document.body.appendChild(lightbox);

  function closeLightboxOnEscape(event) {
    if (event.key === 'Escape') closeLightbox();
  }
}

function requestFullscreen(element) {
  if (element.requestFullscreen) element.requestFullscreen();
  else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
  else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts a YouTube or Vimeo watch URL into an embeddable iframe src.
 * Returns empty string if the URL is not a recognised video platform.
 */
function getVideoEmbedUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);

    // YouTube: youtube.com/watch?v=ID  or  youtu.be/ID
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      let videoId = u.searchParams.get('v');
      if (!videoId) videoId = u.pathname.split('/').filter(Boolean).pop();
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }

    // Vimeo: vimeo.com/ID
    if (u.hostname.includes('vimeo.com')) {
      const videoId = u.pathname.split('/').filter(Boolean).pop();
      return videoId ? `https://player.vimeo.com/video/${videoId}` : '';
    }

    return '';
  } catch {
    return '';
  }
}

/**
 * Derives a human-readable level label from a percent value when
 * no explicit level is stored in the data.
 */
function deriveLevel(percent) {
  if (percent >= 85) return 'Expert';
  if (percent >= 70) return 'Advanced';
  if (percent >= 50) return 'Intermediate';
  return 'Beginner';
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60) || 0;
  const remainder = Math.floor(seconds % 60) || 0;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function safeHttpUrl(value) {
  if (!value) return '';

  try {
    const url = new URL(value, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value || '';
}

function setHref(selector, href) {
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

function setSocialLink(selector, url) {
  const element = document.querySelector(selector);
  if (!element) return;

  const safeUrl = safeHttpUrl(url);
  if (safeUrl) {
    element.href = safeUrl;
    element.hidden = false;
  } else {
    element.hidden = true;
  }
}
