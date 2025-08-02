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
     Handle Back/Forward Browser Buttons
     ================================ */
  window.addEventListener('popstate', () => {
    let path = window.location.pathname.replace('/', '');
    if (!path || path === 'index.html') path = 'home.html';
    loadPage(`pages/${path}`);
  });

});
