export const AVAILABILITY = Object.freeze({
  offline: ['Offline', 'Revia’s computer is offline. You can still explore the project below.'],
  starting: ['Starting', 'The local runtime is preparing. Check again shortly.'],
  online: ['Online', 'Revia is ready for an invite-only text conversation.'],
  busy: ['Busy', 'Revia is busy. An existing session may join the bounded queue.'],
  paused: ['Paused', 'The developer has paused public conversations.'],
  unavailable: ['Unavailable', 'Live chat is unavailable. The project and source remain accessible.'],
});

export function messageLimits(text) {
  const points = [...text].length;
  const bytes = new TextEncoder().encode(text).length;
  return { points, bytes, valid: Boolean(text.trim()) && points <= 2000 && bytes <= 8192 };
}

export function validateConfig(config) {
  if (config?.enabled !== true || typeof config.relayUrl !== 'string') return null;
  try {
    const url = new URL(config.relayUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return null;
    return url.origin;
  } catch { return null; }
}

export class DemoError extends Error {
  constructor(code, retryable = false) { super(code); this.code = code; this.retryable = retryable; }
}

// Credentials and pending text live only in this page instance. No browser storage.
export class ReviaClient {
  #token = null;
  #pending = null;
  #controllers = new Set();
  #turnController = null;
  #destroyed = false;
  #starting = false;
  constructor(origin, { fetch: fetcher = globalThis.fetch.bind(globalThis), pollMs = 1200, now = Date.now, lifetimeMs = 120000, onState = () => {} } = {}) {
    this.origin = origin; this.fetch = fetcher; this.pollMs = pollMs;
    this.now = now; this.lifetimeMs = lifetimeMs; this.onState = onState;
  }
  get active() { return Boolean(this.#token) && !this.#destroyed; }
  get hasPending() { return Boolean(this.#pending); }
  async #request(path, { method = 'GET', body, token = this.#token, signal, keepalive = false } = {}) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    this.#controllers.add(controller);
    const timer = setTimeout(abort, 10000);
    try {
      const response = await this.fetch(this.origin + path, {
        method, signal: controller.signal, cache: 'no-store', credentials: 'omit', redirect: 'error', keepalive,
        headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const raw = await response.text();
      if (raw.length > 65536) throw new DemoError('invalid_response');
      let data;
      try { data = raw ? JSON.parse(raw) : {}; } catch { throw new DemoError('invalid_response'); }
      if (!response.ok) {
        if (response.status === 401) { this.#token = null; this.#pending = null; }
        throw new DemoError(response.status === 401 ? 'session_expired' : typeof data.error === 'string' ? data.error : 'unavailable', response.status === 429 || response.status >= 500);
      }
      return data;
    } catch (error) {
      if (error instanceof DemoError || signal?.aborted) throw error;
      throw new DemoError('connection_lost', true);
    } finally {
      clearTimeout(timer); this.#controllers.delete(controller); signal?.removeEventListener('abort', abort);
    }
  }
  async status() {
    if (this.#destroyed) throw new DemoError('session_ended');
    const data = await this.#request('/v1/status', { token: null });
    return Object.hasOwn(AVAILABILITY, data.state) ? data.state : 'unavailable';
  }
  async start(inviteCode) {
    if (this.#destroyed || this.#starting || this.active) throw new DemoError('session_ended');
    this.#starting = true;
    try {
      const data = await this.#request('/v1/sessions', { method: 'POST', body: { inviteCode }, token: null });
      if (typeof data.token !== 'string' || !data.token || typeof data.sessionId !== 'string') throw new DemoError('invalid_response');
      if (this.#destroyed) {
        await this.#request('/v1/session', { method: 'DELETE', token: data.token, keepalive: true }).catch(() => {});
        throw new DemoError('session_ended');
      }
      this.#token = data.token;
    } finally { this.#starting = false; }
  }
  async send(text) {
    if (!this.active || this.#pending) throw new DemoError('session_not_ready');
    if (!messageLimits(text).valid) throw new DemoError('message_limit');
    this.#pending = { text, idempotencyKey: crypto.randomUUID(), started: this.now(), requestId: null };
    return this.retry();
  }
  async retry() {
    if (!this.active || !this.#pending || this.#turnController) throw new DemoError('session_not_ready');
    const pending = this.#pending;
    const controller = new AbortController(); this.#turnController = controller;
    const remaining = this.lifetimeMs - (this.now() - pending.started);
    const deadline = setTimeout(() => controller.abort(), Math.max(0, remaining));
    try {
      if (remaining <= 0) throw new DemoError('expired');
      if (!pending.requestId) {
        const accepted = await this.#request('/v1/messages', { method: 'POST', body: { text: pending.text, idempotencyKey: pending.idempotencyKey }, signal: controller.signal });
        if (controller.signal.aborted || this.#pending !== pending) throw new DemoError('cancelled');
        if (typeof accepted.requestId !== 'string' || !/^[\w-]{1,128}$/.test(accepted.requestId)) throw new DemoError('invalid_response');
        pending.requestId = accepted.requestId;
        this.onState(accepted.state);
      }
      while (!controller.signal.aborted) {
        const result = await this.#request(`/v1/messages/${encodeURIComponent(pending.requestId)}`, { signal: controller.signal });
        if (controller.signal.aborted || this.#pending !== pending) throw new DemoError('cancelled');
        if (result.requestId !== pending.requestId || !['queued', 'running', 'completed', 'cancelled', 'expired', 'failed'].includes(result.state)) throw new DemoError('invalid_response');
        this.onState(result.state);
        if (!['queued', 'running'].includes(result.state)) {
          this.#pending = null;
          if (result.state === 'completed' && (typeof result.text !== 'string' || result.text.length > 32000)) throw new DemoError('invalid_response');
          return result;
        }
        await new Promise((resolve, reject) => {
          const abort = () => { clearTimeout(timer); reject(new DemoError('cancelled')); };
          const timer = setTimeout(() => { controller.signal.removeEventListener('abort', abort); resolve(); }, this.pollMs);
          controller.signal.addEventListener('abort', abort, { once: true });
          if (controller.signal.aborted) abort();
        });
      }
      throw new DemoError('cancelled');
    } catch (error) {
      if (this.now() - pending.started >= this.lifetimeMs || error.code === 'expired') {
        this.#pending = null;
        if (pending.requestId) this.#request(`/v1/messages/${encodeURIComponent(pending.requestId)}/cancel`, { method: 'POST' }).catch(() => {});
        throw new DemoError('expired');
      }
      if (!error.retryable) this.#pending = null;
      throw error;
    } finally { clearTimeout(deadline); if (this.#turnController === controller) this.#turnController = null; }
  }
  async cancel() {
    const pending = this.#pending;
    this.#turnController?.abort(); this.#pending = null;
    // An unknown request ID means the submit response was lost. End the session
    // rather than permit an untracked request to continue beside a new turn.
    if (pending && !pending.requestId) { this.destroy(); return; }
    if (pending?.requestId && this.active) await this.#request(`/v1/messages/${encodeURIComponent(pending.requestId)}/cancel`, { method: 'POST' });
  }
  destroy() {
    if (this.#destroyed) return;
    const token = this.#token;
    this.#destroyed = true; this.#token = null; this.#pending = null;
    this.#turnController?.abort();
    for (const controller of this.#controllers) controller.abort();
    if (token) this.#request('/v1/session', { method: 'DELETE', token, keepalive: true }).catch(() => {});
  }
}
