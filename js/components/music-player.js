function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60) || 0;
  const remainder = Math.floor(seconds % 60) || 0;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export function initMusicPlayer(data) {
  const playlist = Array.isArray(data.music) ? data.music.filter((song) => song.src) : [];
  const audio = document.getElementById('bg-music');
  const button = document.getElementById('music-btn');
  const icon = button?.querySelector('.music-icon');
  const player = document.getElementById('mini-music-player');
  const title = document.getElementById('song-title');
  const currentTime = document.getElementById('current-time');
  const totalTime = document.getElementById('total-time');
  const progress = document.getElementById('progress-bar');
  const previous = document.getElementById('prev-song');
  const next = document.getElementById('next-song');
  const toggle = document.getElementById('toggle-play');

  if (!audio || !button || !playlist.length) {
    if (button) button.hidden = true;
    return;
  }

  let index = 0;
  let loadedIndex = -1;
  let panelOpen = false;

  const setPanelOpen = (open) => {
    panelOpen = open;
    if (player) player.hidden = !open;
    // The title can only be measured once the panel is on screen.
    if (open) updateTitle();
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /**
   * Renders the track name, scrolling it only when it genuinely does not
   * fit. The text is duplicated so the loop is seamless; the duplicate is
   * hidden from assistive tech so the name is not announced twice.
   * Needs the panel to be visible to measure, so it also runs on open.
   */
  const updateTitle = () => {
    if (!title) return;
    const name = playlist[index].name || 'Portfolio Track';

    title.classList.remove('is-scrolling');

    if (reduceMotion.matches) {
      title.textContent = name;
      return;
    }

    const marquee = document.createElement('span');
    marquee.className = 'mini-player-marquee';
    const item = document.createElement('span');
    item.className = 'mini-player-marquee-item';
    item.textContent = name;
    marquee.appendChild(item);
    title.replaceChildren(marquee);

    if (title.scrollWidth <= title.clientWidth + 1) return;

    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    marquee.appendChild(clone);
    title.classList.add('is-scrolling');

    // Roughly 40px per second, so short and long names read at one pace.
    const distance = marquee.scrollWidth / 2;
    title.style.setProperty('--marquee-duration', `${Math.max(7, distance / 40).toFixed(1)}s`);
  };

  const loadCurrent = () => {
    if (loadedIndex === index) return;
    audio.src = playlist[index].src;
    loadedIndex = index;
    updateTitle();
  };

  const setPlayingState = (isPlaying) => {
    button.setAttribute('aria-pressed', String(isPlaying));
    button.setAttribute('aria-label', isPlaying ? 'Pause background music' : 'Play background music');
    if (icon) icon.src = isPlaying ? 'img/music-on.webp' : 'img/music-off.webp';
    // Drives the play/pause icon swap in CSS.
    if (player) player.dataset.playing = String(isPlaying);
    if (toggle) toggle.setAttribute('aria-label', isPlaying ? 'Pause music' : 'Play music');
  };

  const play = async () => {
    loadCurrent();
    try {
      await audio.play();
      setPlayingState(true);
    } catch (error) {
      console.error('Unable to play portfolio audio.', error);
      setPlayingState(false);
    }
  };

  const pause = () => {
    audio.pause();
    setPlayingState(false);
  };

  const togglePlayback = () => audio.paused ? play() : pause();

  const changeTrack = (direction) => {
    const wasPlaying = !audio.paused;
    index = (index + direction + playlist.length) % playlist.length;
    loadedIndex = -1;
    updateTitle();
    if (wasPlaying) play();
  };

  const updateProgress = () => {
    const duration = audio.duration || 0;
    const played = duration ? (audio.currentTime / duration) * 100 : 0;
    if (progress) {
      progress.value = String(played);
      // Fills the played portion of the scrubber track.
      progress.style.setProperty('--played', `${played}%`);
    }
    if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
    if (totalTime) totalTime.textContent = formatTime(duration);
  };

  button.addEventListener('click', () => {
    if (panelOpen) {
      setPanelOpen(false);
      pause();
      return;
    }
    setPanelOpen(true);
    play();
  });
  toggle?.addEventListener('click', togglePlayback);
  previous?.addEventListener('click', () => changeTrack(-1));
  next?.addEventListener('click', () => changeTrack(1));
  progress?.addEventListener('input', () => {
    progress.style.setProperty('--played', `${Number(progress.value)}%`);
    if (audio.duration) audio.currentTime = (Number(progress.value) / 100) * audio.duration;
  });
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', updateProgress);
  audio.addEventListener('pause', () => setPlayingState(false));
  audio.addEventListener('play', () => setPlayingState(true));
  updateTitle();
}
