/* ================================
   SPA NAVIGATION + MUSIC PLAYER
   ================================ */
document.addEventListener('DOMContentLoaded', () => {

  // ✅ Load head and navbar dynamically
  fetch('head.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('head-placeholder').innerHTML = html;
    });

  fetch('nav.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('navbar-placeholder').innerHTML = html;
      initMusicPlayer();   // ✅ Call after nav loads so the button exists
      initNavLinks();
    });

  fetch('footer.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('footer-placeholder').innerHTML = html;
    });

  // ✅ Load default page content (home)
  loadPage('pages/home.html');

  /* ================================
     Function to dynamically load pages
     ================================ */
  function loadPage(url) {
    fetch(url)
      .then(res => res.text())
      .then(html => {
        document.getElementById('content').innerHTML = html;

        // ✅ Initialize gallery if art page is loaded
        if (url.includes('art.html')) {
          initArtGallery();
        }

        // Update URL without reloading page
        const cleanUrl = url.replace('pages/', '');
        window.history.pushState({}, '', cleanUrl);
      });
  }

  /* ================================
     Init Navigation Links
     ================================ */
  function initNavLinks() {
    document.querySelectorAll('.nav-link, .navbar-brand').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');

        // ✅ Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        // ✅ Add active class to the clicked link
        if (link.classList.contains('nav-link')) {
          link.classList.add('active');
        } else {
          // if it's the logo, set Home as active
          const homeLink = document.querySelector('.nav-link[href="home.html"]');
          if (homeLink) homeLink.classList.add('active');
        }

        loadPage(`pages/${href}`);
      });
    });
  }

  /* ================================
     Init Music Player
     ================================ */
  function initMusicPlayer() {
    const playlist = ['music/myScene.mp3'];  // ✅ add more songs if needed
    const audio = document.getElementById('bg-music');
    let isPlaying = false;

    const musicBtn = document.getElementById('music-btn'); // get after nav loads
    if (!musicBtn) return; // no button found, exit

    musicBtn.addEventListener('click', () => {
      if (!isPlaying) {
        if (!audio.src) {
          audio.src = playlist[0]; // set song if it's empty
        }
        audio.play();
        isPlaying = true;
        musicBtn.src = 'img/music-on.png';
      } else {
        audio.pause();
        isPlaying = false;
        musicBtn.src = 'img/music-off.png';
      }
    });
  }

  /* ================================
     ART GALLERY
     ================================ */
  function initArtGallery() {
    const gallery = document.getElementById('art-gallery');
    if (!gallery) return; // not on art page

    const images = [
      { src: 'img/beach.jpg', title: 'Artwork 1' },
      { src: 'img/art2.jpg', title: 'Artwork 2' },
      { src: 'img/art3.jpg', title: 'Artwork 3' },
      { src: 'img/art4.jpg', title: 'Artwork 4' },
    ];

    gallery.innerHTML = ''; // clear before adding
    images.forEach(img => {
      const div = document.createElement('div');
      div.classList.add('art-card');
      div.innerHTML = `<img src="${img.src}" alt="${img.title}">`;
      gallery.appendChild(div);

      div.addEventListener('click', () => openLightbox(img.src, img.title));
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

  /* ================================
     Handle Back/Forward Browser Buttons
     ================================ */
  window.addEventListener('popstate', () => {
    let path = window.location.pathname.replace('/', '');
    if (!path || path === 'index.html') path = 'home.html';
    loadPage(`pages/${path}`);
  });

});
