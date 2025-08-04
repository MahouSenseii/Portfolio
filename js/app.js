/* ================================
   SPA NAVIGATION + MUSIC PLAYER (Hash Routing + Mini Player)
   ================================ */
const pageCache = {}; // ✅ Global cache for preloaded pages

document.addEventListener('DOMContentLoaded', () => {

  //  Load head dynamically
  fetch('head.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('head-placeholder').innerHTML = html;
    });

  //  Load navbar dynamically
  fetch('nav.html')
    .then(res => res.text())
    .then(html => {
      const navbarPlaceholder = document.getElementById('navbar-placeholder');
      navbarPlaceholder.innerHTML = html;

      initMusicPlayer();
      initNavLinks();

      if (typeof bootstrap !== 'undefined') {
        document.querySelectorAll('.collapse').forEach(el => {
          new bootstrap.Collapse(el, { toggle: false });
        });
      }
    });

  //  Load footer dynamically
  fetch('footer.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('footer-placeholder').innerHTML = html;
    });

  //  Load initial page based on hash or default to home
  const initialPage = window.location.hash ? window.location.hash.replace('#', '') : 'home.html';
  loadPage(`pages/${initialPage}`, false);

  /* ================================
     Function to dynamically load pages
     ================================ */
  function loadPage(url, updateHash = true) {
    console.log("✅ Loaded page:", url);

    if (pageCache[url]) {
      document.getElementById('content').innerHTML = pageCache[url];
      afterPageLoad(url, updateHash);
      return;
    }

    fetch(url)
      .then(res => res.text())
      .then(html => {
        pageCache[url] = html;
        document.getElementById('content').innerHTML = html;
        afterPageLoad(url, updateHash);
      });
  }

  function afterPageLoad(url, updateHash) {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Initialize page-specific features
    if (url.includes('art')) initArtGallery();
    if (url.includes('knowledge')) initKnowledgeBars();
    if (url.includes('projects')) initProjectSlider();

    const cleanUrl = url.replace('pages/', '');

    // ✅ Update hash instead of using pushState
    if (updateHash) {
      window.location.hash = cleanUrl;
    }

    // ✅ Update active navbar link
    updateActiveNav(cleanUrl);
  }

  /* ================================
     Update Active Navbar Link
     ================================ */
  function updateActiveNav(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === page) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  //  Navbar opacity on scroll
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.custom-navbar');
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  /* ================================
     Init Navigation Links
     ================================ */
  function initNavLinks() {
    document.querySelectorAll('.nav-link, .navbar-brand').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');

        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        // Add active class to clicked link
        if (link.classList.contains('nav-link')) {
          link.classList.add('active');
        } else {
          const homeLink = document.querySelector('.nav-link[href="home.html"]');
          if (homeLink) homeLink.classList.add('active');
        }

        loadPage(`pages/${href}`);
      });
    });

    // ✅ Preload pages on hover
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = `pages/${link.getAttribute('href')}`;
      link.addEventListener('mouseenter', () => {
        if (!pageCache[href]) {
          fetch(href)
            .then(res => res.text())
            .then(html => {
              pageCache[href] = html;
              console.log(`⚡ Preloaded: ${href}`);
            });
        }
      });
    });
  }

  /* ================================
     Handle Back/Forward Browser Buttons
     ================================ */
  window.addEventListener('hashchange', () => {
    const page = window.location.hash ? window.location.hash.replace('#', '') : 'home.html';
    loadPage(`pages/${page}`, false);
    updateActiveNav(page); // ✅ keeps navbar in sync
  });

  /* ================================
     Init Music Player (with mini player)
     ================================ */
  function initMusicPlayer() {
    const playlist = [
      { src: 'music/myScene.mp3', name: 'My Scene' },
      { src: 'music/secondTrack.mp3', name: 'Second Track' }
      // ✅ Add more songs here
    ];
    let currentIndex = 0;

    const audio = document.getElementById('bg-music');
    let isPlaying = false;

    const musicBtn = document.getElementById('music-btn');
    const miniPlayer = document.getElementById('mini-music-player');
    const songTitle = document.getElementById('song-title');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    const progressBar = document.getElementById('progress-bar');
    const prevBtn = document.getElementById('prev-song');
    const nextBtn = document.getElementById('next-song');
    const togglePlayBtn = document.getElementById('toggle-play');

    function loadSong(index) {
      audio.src = playlist[index].src;
      songTitle.textContent = playlist[index].name;
    }

    function playMusic() {
      if (!audio.src) loadSong(currentIndex);
      audio.play();
      isPlaying = true;
      musicBtn.src = 'img/music-on.png';
      miniPlayer.style.display = 'flex'; // ✅ Show mini player
    }

    function pauseMusic() {
      audio.pause();
      isPlaying = false;
      musicBtn.src = 'img/music-off.png';
      miniPlayer.style.display = 'none'; // ✅ Hide when music is off
    }

    function updateProgress() {
      const current = audio.currentTime;
      const duration = audio.duration || 0;
      progressBar.value = (current / duration) * 100 || 0;
      currentTimeEl.textContent = formatTime(current);
      totalTimeEl.textContent = formatTime(duration);
    }

    function formatTime(sec) {
      const m = Math.floor(sec / 60) || 0;
      const s = Math.floor(sec % 60) || 0;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }

    musicBtn.addEventListener('click', () => isPlaying ? pauseMusic() : playMusic());
    togglePlayBtn.addEventListener('click', () => isPlaying ? pauseMusic() : playMusic());

    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % playlist.length;
      loadSong(currentIndex);
      if (isPlaying) audio.play();
    });

    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
      loadSong(currentIndex);
      if (isPlaying) audio.play();
    });

    progressBar.addEventListener('input', () => {
      audio.currentTime = (progressBar.value / 100) * audio.duration;
    });

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
  }


  /* ================================
     ART GALLERY
     ================================ */
  function initArtGallery() {
    const gallery = document.getElementById('art-gallery');
    if (!gallery) return;

    const images = [
      { src: 'img/beach.jpg', title: 'Artwork 1' },
    ];

    gallery.innerHTML = '';
    images.forEach(img => {
      const div = document.createElement('div');
      div.classList.add('art-card');
      div.innerHTML = `<img src="${img.src}" alt="${img.title}">`;
      gallery.appendChild(div);

      div.addEventListener('click', () => openLightbox(img.src, img.title));
    });
  }

  /* ================================
     Project Slider
     ================================ */
  function initProjectSlider() {
    const projects = [
      {
        name: "Project Hunter",
        media: '<img src="img/project1.jpg" alt="Project Hunter">',
        timeframe: "Jan 2023 - Mar 2023",
        engine: " Pixi.js",
        description: "A survival horror game built in Unreal Engine 5 with custom AI systems."
      },
      {
        name: "First Five",
        media: '<iframe src="https://pixidev.azurewebsites.net/VisualNovel/FirstFive" frameborder="0" allowfullscreen webkitallowfullscreen mozallowfullscreen></iframe>',
        timeframe: " Jan 2017 - Nov 2017",
        engine: " Pixi.js",
        description: "First Five, a passion project that showcases the fundamentals of a dating sim game. Developed from scratch, this game allows players" +
          " to dive into various levels, while interacting with the main heroine, Karen. As the developer, " +
          "I designed and developed every aspect of this game to showcase the immersive experience that players engage in while playing a dating sim game."
      },
      {
        name: "3D Art Showcase",
        media: '<img src="img/project2.jpg" alt="3D Art Showcase">',
        timeframe: "Jan 2017 - 2024",
        engine: " Pixi.js",
        description: "A gallery of 3D models and textures created in Blender and Substance Painter."
      }
    ];

    let currentIndex = 0;

    const nameEl = document.querySelector('.project-name');
    const mediaEl = document.querySelector('.project-media');
    const timeEl = document.querySelector('.project-timeframe');
    const engineEl = document.querySelector('.project-engine');
    const descEl = document.querySelector('.project-description');

    function renderProject(index) {
      const project = projects[index];
      nameEl.textContent = project.name;
      mediaEl.innerHTML = project.media;

      // ✅ If it's an iframe, add a fullscreen button
      const iframe = mediaEl.querySelector('iframe');
      if (iframe) {
        const btn = document.createElement('button');
        btn.textContent = "Fullscreen";
        btn.classList.add('fullscreen-btn');
        mediaEl.appendChild(btn);

        btn.addEventListener('click', () => {
          if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
          } else if (iframe.webkitRequestFullscreen) {
            iframe.webkitRequestFullscreen();
          } else if (iframe.mozRequestFullScreen) {
            iframe.mozRequestFullScreen();
          }
        });
      }

      engineEl.textContent = `Engine: ${project.engine}`;
      timeEl.textContent = `Timeframe: ${project.timeframe}`;
      descEl.textContent = project.description;
    }

    document.querySelector('.prev-btn').addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + projects.length) % projects.length;
      renderProject(currentIndex);
    });

    document.querySelector('.next-btn').addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % projects.length;
      renderProject(currentIndex);
    });

    renderProject(currentIndex);
  }

  /* ================================
     KNOWLEDGE PROGRESS BARS
     ================================ */
  function initKnowledgeBars() {
    const container = document.getElementById('knowledge-list');
    if (!container) return;

    const skills = [
      { category: 'Digital Art', name: 'Concept Art', percent: 85 },
      { category: 'Digital Art', name: 'Character Design', percent: 80 },
      { category: 'Digital Art', name: 'Environment Design', percent: 75 },
      { category: 'Illustration', name: 'Digital Painting', percent: 90 },
      { category: '3D Modeling', name: 'Blender', percent: 70 },
      { category: 'Graphic Design', name: 'Photoshop', percent: 85 },
      { category: 'UI/UX Design', name: 'Interface Design', percent: 78 },
      { category: 'Programming Languages', name: 'C++', percent: 65 },
      { category: 'Programming Languages', name: 'JavaScript', percent: 75 },
      { category: 'Programming Languages', name: 'Python', percent: 60 },
      { category: 'Game Engines', name: 'Unreal Engine', percent: 80 },
      { category: 'Game Engines', name: 'Unity', percent: 55 },
      { category: 'Frameworks & Libraries', name: 'React', percent: 70 },
      { category: 'Version Control', name: 'Git & GitHub', percent: 85 },
      { category: 'Database Management', name: 'MySQL', percent: 60 },
      { category: 'Optimization & Performance', name: 'Game Profiling', percent: 75 }
    ];

    const grouped = {};
    skills.forEach(skill => {
      if (!grouped[skill.category]) grouped[skill.category] = [];
      grouped[skill.category].push(skill);
    });

    container.innerHTML = '';

    Object.keys(grouped).forEach(category => {
      const section = document.createElement('div');
      section.classList.add('knowledge-category');
      section.innerHTML = `<h2 class="knowledge-heading">${category}</h2>`;
      container.appendChild(section);

      grouped[category].forEach(skill => {
        const item = document.createElement('div');
        item.classList.add('knowledge-item');

        item.innerHTML = `
        <div class="knowledge-title">
          <strong>${skill.name}</strong> - ${skill.percent}%
        </div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar" style="width: 0%"></div>
        </div>
      `;

        section.appendChild(item);

        const bar = item.querySelector('.progress-bar');
        bar.style.width = '0%';
        void bar.offsetWidth;
        setTimeout(() => {
          bar.style.width = skill.percent + '%';
        }, 300);
      });
    });
  }

  /* ================================
     LIGHTBOX
     ================================ */
  function openLightbox(src, title) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <img src="${src}" alt="${title}">
        <span class="close">&times;</span>
      </div>
    `;
    document.body.appendChild(lightbox);

    lightbox.querySelector('.close').addEventListener('click', () => {
      lightbox.remove();
    });
  }

});
