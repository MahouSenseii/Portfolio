/* ================================
   MUSIC BUTTON
   ================================ */
const musicBtn = document.getElementById('music-btn');
if (musicBtn) {
  const audio = new Audio('assets/music.mp3'); // replace with your actual music file
  let isPlaying = false;

  musicBtn.addEventListener('click', () => {
    if (!isPlaying) {
      audio.play();
      isPlaying = true;
      musicBtn.textContent = 'Stop Music';
    } else {
      audio.pause();
      audio.currentTime = 0;
      isPlaying = false;
      musicBtn.textContent = 'Play Music';
    }
  });
}

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
