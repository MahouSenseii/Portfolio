/* ================================
   NAVBAR INCLUDE + ACTIVE LINK
   ================================ */
document.addEventListener('DOMContentLoaded', () => {
  fetch('nav.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('navbar-placeholder').innerHTML = html;

      fetch('head.html')
        .then(res => res.text())
        .then(html => {
          document.getElementById('head-placeholder').innerHTML = html;
        });

      // ✅ Highlight active link
      let current = window.location.pathname.split("/").pop();
      if (!current || current === "/") current = "index.html";
      current = current.split("?")[0].split("#")[0];
      document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === current) {
          link.classList.add('active');
        }
      });

      // ✅ Playlist
      const playlist = [
        'music/myScene.mp3',
        // 'music/song2.mp3',
        // 'music/song3.mp3'
      ];

      // ✅ Audio setup
      let audio = new Audio();
      audio.loop = false; // we want next song after end
      let isPlaying = false;

      function playRandomSong() {
        const index = Math.floor(Math.random() * playlist.length);
        audio.src = playlist[index];
        audio.play();
      }

      // ✅ When one song ends, pick another
      audio.addEventListener('ended', playRandomSong);

      // ✅ Music button
      const musicBtn = document.getElementById('music-btn');
      if (musicBtn) {
        musicBtn.addEventListener('click', () => {
          if (!isPlaying) {
            playRandomSong(); // start playing
            isPlaying = true;
            musicBtn.src = 'img/music-on.png';
          } else {
            audio.pause();
            audio.currentTime = 0;
            isPlaying = false;
            musicBtn.src = 'img/music-off.png';
          }
        });
      }
    });
});



/* ================================
   NAVBAR SCROLL BACKGROUND
   ================================ */
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.custom-navbar');
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
});
