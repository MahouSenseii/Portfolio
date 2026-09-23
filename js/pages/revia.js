import { ReviaClient, AVAILABILITY, messageLimits, validateConfig } from '../revia/api-client.js';

export function initRevia() {
  const root = document.querySelector('.revia-page');
  if (!root) return undefined;
  const find = (name) => root.querySelector(`[data-${name}]`);
  const input = root.querySelector('#revia-message');
  const invite = root.querySelector('#revia-invite');
  const listeners = new AbortController();
  let client; let origin; let disposed = false; let busy = false; let availability = 'unavailable'; let refreshTimer;
  let generation = 0;
  const progress = (text) => { if (!disposed) find('progress').textContent = text; };
  function controls() {
    if (disposed) return;
    const active = client?.active;
    const pending = client?.hasPending;
    input.disabled = !active || busy || pending;
    find('send').disabled = input.disabled || !messageLimits(input.value).valid || !['online', 'busy'].includes(availability);
    find('start').disabled = !origin || active || busy || availability !== 'online';
    invite.disabled = !origin || active || busy;
    find('end').disabled = !active && !busy;
    find('cancel').disabled = !pending;
    find('retry').hidden = !pending || busy;
    find('refresh').disabled = !origin || busy;
  }
  function newClient() {
    return new ReviaClient(origin, { onState: (state) => {
      if (state === 'queued') progress('Queued — waiting for a free turn.');
      if (state === 'running') progress('Preparing reply — the completed answer will appear here.');
      controls();
    }});
  }
  async function refresh() {
    clearTimeout(refreshTimer);
    const current = client;
    let state;
    try { state = await current.status(); } catch { state = 'unavailable'; }
    if (disposed) return;
    if (client !== current) { refresh(); return; }
    availability = state;
    const [label, detail] = AVAILABILITY[availability];
    find('availability').textContent = label; find('availability-detail').textContent = detail;
    controls(); refreshTimer = setTimeout(refresh, 15000);
  }
  function append(speaker, text) {
    find('empty')?.remove();
    const entry = document.createElement('article'); entry.className = 'revia-message'; entry.dataset.speaker = speaker;
    const label = document.createElement('strong'); label.textContent = speaker;
    const content = document.createElement('p'); content.textContent = text;
    entry.append(label, content); find('transcript').append(entry);
    // Match ephemeral bounds: keep only the latest 40 entries in this page.
    while (find('transcript').children.length > 40) find('transcript').firstElementChild.remove();
    entry.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }
  function errorMessage(error) {
    if (error.code === 'session_expired') return 'This session expired or the relay restarted. Start a new session.';
    if (error.code === 'expired') return 'The two-minute request limit was reached. No late reply will be shown.';
    if (error.code === 'message_limit') return 'Use 1–2,000 characters and no more than 8 KiB of text.';
    if (error.retryable && client?.hasPending) return 'Connection interrupted. Retry the same message to recover its result, or end the session.';
    return 'The request could not be completed. Check availability and your invitation, then try again.';
  }
  async function turn(retry = false) {
    if (busy || !client?.active || (!retry && (client.hasPending || !messageLimits(input.value).valid))) return;
    const current = client; const version = generation;
    busy = true; progress(retry ? 'Reconnecting to this request…' : 'Sending message…');
    const text = input.value;
    if (!retry) { append('You', text); input.value = ''; updateCount(); }
    controls();
    try {
      const request = retry ? current.retry() : current.send(text);
      controls();
      const result = await request;
      if (disposed || version !== generation) return;
      if (result.state === 'completed') { append('Revia', result.text); progress('Reply received.'); }
      else progress({ cancelled: 'Reply cancelled.', expired: 'The request expired before a reply was ready.', failed: 'Revia could not complete this reply.' }[result.state]);
    } catch (error) { if (version === generation) progress(errorMessage(error)); }
    finally { if (!disposed && version === generation) { busy = false; controls(); if (!input.disabled) input.focus(); } }
  }
  function updateCount() {
    const { points, bytes, valid } = messageLimits(input.value);
    find('count').textContent = `${points.toLocaleString()} / 2,000 characters · ${bytes.toLocaleString()} / 8,192 bytes`;
    input.setAttribute('aria-invalid', String(Boolean(input.value) && !valid)); controls();
  }
  function end() {
    generation++; client?.destroy(); busy = false;
    find('transcript').replaceChildren(); input.value = ''; invite.value = '';
    if (origin && !disposed) client = newClient();
    progress('Session ended. The transcript has been cleared.'); updateCount(); controls();
  }
  const on = (element, event, handler) => element.addEventListener(event, handler, { signal: listeners.signal });
  on(find('session-form'), 'submit', async (event) => {
    event.preventDefault(); if (find('start').disabled) return;
    if (!invite.value.trim()) { progress('Enter an invitation code to start.'); invite.focus(); return; }
    const current = client; const version = generation;
    busy = true; progress('Connecting…'); controls();
    const code = invite.value; invite.value = '';
    try { await current.start(code); if (version === generation) progress('Session ready. Send a message to begin.'); }
    catch (error) { if (version === generation) progress(errorMessage(error)); }
    finally { if (!disposed && version === generation) { busy = false; controls(); if (current.active) input.focus(); } }
  });
  on(find('message-form'), 'submit', (event) => { event.preventDefault(); if (!find('send').disabled) turn(); });
  on(input, 'input', updateCount);
  on(input, 'keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) { event.preventDefault(); if (!find('send').disabled) turn(); }
  });
  on(find('retry'), 'click', () => turn(true));
  on(find('end'), 'click', end);
  on(find('cancel'), 'click', async () => {
    const current = client; const version = ++generation;
    const isCurrent = () => !disposed && version === generation && client === current;
    busy = true; controls();
    try {
      await current.cancel();
      if (!isCurrent()) return;
      progress('Reply cancelled.');
    } catch {
      if (!isCurrent()) return;
      current.destroy(); progress('Cancellation could not be confirmed. Session ended; the server also enforces expiry.');
    }
    if (!isCurrent()) return;
    if (!current.active) client = newClient();
    busy = false; controls();
  });
  on(find('refresh'), 'click', refresh);
  const cleanup = () => {
    if (disposed) return;
    disposed = true; generation++; clearTimeout(refreshTimer); listeners.abort(); client?.destroy();
    input.value = ''; invite.value = ''; find('transcript').replaceChildren();
  };
  on(window, 'pagehide', cleanup);
  fetch('data/revia-demo.json', { cache: 'no-store', signal: listeners.signal }).then(response => response.ok ? response.json() : null).then(config => {
    if (disposed) return;
    origin = validateConfig(config);
    if (!origin) {
      find('availability').textContent = 'Not enabled';
      find('availability-detail').textContent = 'The public text demo is not enabled on this site. Explore the desktop project and its source while deployment is being prepared.';
      controls(); return;
    }
    client = newClient(); refresh();
  }).catch(() => {
    if (!disposed) { find('availability').textContent = 'Unavailable'; find('availability-detail').textContent = AVAILABILITY.unavailable[1]; }
  });
  return cleanup;
}
