const { test, expect } = require('@playwright/test');
const relay = 'https://relay.example';
async function enable(page, state = 'online') {
  const calls = []; let turn = 0;
  await page.route('**/data/revia-demo.json', route => route.fulfill({ json: { enabled: true, relayUrl: relay } }));
  await page.route(relay + '/**', async route => {
    const req = route.request(); calls.push({ path: new URL(req.url()).pathname, method: req.method(), body: req.postData(), authorization: req.headers().authorization });
    const path = new URL(req.url()).pathname;
    if (path === '/v1/status') return route.fulfill({ json: { state } });
    if (path === '/v1/sessions') return route.fulfill({ json: { sessionId: 's1', token: 'test-token', expiresAt: Date.now() + 60000 } });
    if (path === '/v1/messages') { turn++; return route.fulfill({ json: { requestId: `r${turn}`, state: 'queued' } }); }
    if (path.startsWith('/v1/messages/')) return route.fulfill({ json: { requestId: `r${turn}`, state: 'completed', text: '<img src=x onerror=alert(1)> **literal code**' } });
    return route.fulfill({ json: {} });
  });
  return calls;
}
for (const base of ['/', '/Portfolio/']) {
  test(`${base} disabled route, source links, music and mobile fit`, async ({ page }) => {
    await page.goto(base + '#revia.html');
    await expect(page.getByRole('heading', { name: 'Talk to Revia', exact: true })).toBeVisible();
    await expect(page.locator('[data-availability]')).toHaveText('Not enabled');
    await expect(page.getByRole('button', { name: 'Start session' })).toBeDisabled();
    await expect(page.locator('#music-btn')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Current C++ source' })).toHaveAttribute('href', 'https://github.com/MahouSenseii/R.E.V.I.A');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const headingBox = await page.getByRole('heading', { name: 'Talk to Revia', exact: true }).boundingBox();
    const navigationBox = await page.locator('.site-nav').boundingBox();
    expect(headingBox.y).toBeGreaterThanOrEqual(navigationBox.y + navigationBox.height);
    await expect(page.locator('#bg-music')).toHaveJSProperty('paused', true);
    await page.screenshot({ path: test.info().outputPath('disabled-page.png'), fullPage: true });
  });
  test(`${base} keyboard, IME, literal rendering and route cleanup`, async ({ page }) => {
    const calls = await enable(page);
    await page.goto(base + '#revia.html');
    await page.getByLabel('Invitation code').fill('test-invite');
    await page.getByRole('button', { name: 'Start session' }).click();
    const input = page.getByLabel('Your message');
    await expect(input).toBeEnabled();
    await input.fill('Hello');
    await input.press('Shift+Enter');
    await expect(input).toHaveValue('Hello\n');
    await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
    expect(calls.filter(c => c.path === '/v1/messages')).toHaveLength(0);
    await input.press('Enter');
    await expect(page.locator('[data-transcript]')).toContainText('<img src=x onerror=alert(1)> **literal code**');
    await expect(page.locator('[data-transcript] img')).toHaveCount(0);
    expect(calls.filter(c => c.path === '/v1/messages')).toHaveLength(1);
    expect(await page.evaluate(() => [localStorage.getItem('token'), sessionStorage.getItem('token')])).toEqual([null, null]);
    await page.evaluate(() => { location.hash = '#home.html'; });
    await expect.poll(() => calls.filter(c => c.path === '/v1/session' && c.method === 'DELETE').length).toBe(1);
    await page.evaluate(() => { location.hash = '#revia.html'; });
    await expect(page.getByRole('button', { name: 'Start session' })).toBeEnabled();
    await expect(page.locator('[data-transcript]')).not.toContainText('literal code');
  });
  test(`${base} Revia project CTA navigates through the existing router`, async ({ page }) => {
    await page.goto(base + '#projects.html?category=AI');
    await page.locator('[data-sc-actions]').getByRole('link', { name: 'Talk to Revia' }).click();
    await expect(page.getByRole('heading', { name: 'Talk to Revia', exact: true })).toBeVisible();
    await expect(page.locator('[data-availability]')).toHaveText('Not enabled');
  });
}
for (const [state, label] of Object.entries({ offline: 'Offline', starting: 'Starting', online: 'Online', busy: 'Busy', paused: 'Paused', unavailable: 'Unavailable' })) {
  test(`availability ${state}`, async ({ page }) => {
    await enable(page, state); await page.goto('/#revia.html');
    await expect(page.locator('[data-availability]')).toHaveText(label);
    if (state === 'online') await expect(page.getByRole('button', { name: 'Start session' })).toBeEnabled();
    else await expect(page.getByRole('button', { name: 'Start session' })).toBeDisabled();
  });
}

test('lost submit response enables safe retry without duplicating transcript', async ({ page }) => {
  const calls = await enable(page); const bodies = [];
  await page.route(relay + '/v1/messages', route => {
    bodies.push(route.request().postData());
    if (bodies.length === 1) return route.abort('failed');
    return route.fulfill({ json: { requestId: 'r0', state: 'queued' } });
  });
  await page.goto('/#revia.html');
  await page.getByLabel('Invitation code').fill('test-invite'); await page.getByRole('button', { name: 'Start session' }).click();
  await page.getByLabel('Your message').fill('Recover this message'); await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('button', { name: 'Retry same message' })).toBeVisible();
  await page.getByRole('button', { name: 'Retry same message' }).click();
  await expect(page.locator('[data-transcript]')).toContainText('literal code');
  expect(bodies).toHaveLength(2); expect(bodies[0]).toBe(bodies[1]);
  await expect(page.locator('[data-speaker="You"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'End session & clear' }).click();
  await expect(page.locator('[data-transcript]')).toBeEmpty();
  await expect.poll(() => calls.filter(c => c.method === 'DELETE').length).toBe(1);
});

test('expired session clears its token and permits a fresh session', async ({ page }) => {
  await enable(page);
  await page.route(relay + '/v1/messages', route => route.fulfill({ status: 401, json: { error: 'unauthorized' } }));
  await page.goto('/#revia.html');
  await page.getByLabel('Invitation code').fill('test-invite'); await page.getByRole('button', { name: 'Start session' }).click();
  await page.getByLabel('Your message').fill('Hello'); await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('[data-progress]')).toContainText('session expired');
  await expect(page.getByRole('button', { name: 'Start session' })).toBeEnabled();
  await expect(page.getByLabel('Your message')).toBeDisabled();
});

test('can cancel while initial submission response is pending', async ({ page }) => {
  const calls = await enable(page);
  await page.route(relay + '/v1/messages', () => {});
  await page.goto('/#revia.html');
  await page.getByLabel('Invitation code').fill('test-invite'); await page.getByRole('button', { name: 'Start session' }).click();
  await page.getByLabel('Your message').fill('Cancel this'); await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('button', { name: 'Cancel reply' })).toBeEnabled();
  await page.getByRole('button', { name: 'Cancel reply' }).click();
  await expect.poll(() => calls.filter(c => c.method === 'DELETE').length).toBe(1);
  await expect(page.getByRole('button', { name: 'Start session' })).toBeEnabled();
});

test('ending during availability polling keeps availability checks alive', async ({ page }) => {
  await page.clock.install(); await enable(page); let statusCalls = 0;
  await page.route(relay + '/v1/status', route => {
    statusCalls++;
    if (statusCalls === 2) return;
    return route.fulfill({ json: { state: 'online' } });
  });
  await page.goto('/#revia.html');
  await page.getByLabel('Invitation code').fill('test-invite'); await page.getByRole('button', { name: 'Start session' }).click();
  await expect(page.getByLabel('Your message')).toBeEnabled();
  await page.clock.fastForward(15000);
  await expect.poll(() => statusCalls).toBe(2);
  await page.getByRole('button', { name: 'End session & clear' }).click();
  await expect.poll(() => statusCalls).toBe(3);
  await expect(page.getByRole('button', { name: 'Start session' })).toBeEnabled();
});

for (const outcome of ['resolve', 'reject']) {
  test(`late cancel ${outcome} cannot alter a replacement session`, async ({ page }) => {
    await page.addInitScript(() => {
      const original = window.fetch;
      window.fetch = (url, options) => {
        if (String(url).endsWith('/cancel')) return new Promise((resolve, reject) => {
          window.finishOldCancel = (outcome) => outcome === 'reject' ? reject(new TypeError('late network error')) : resolve(new Response(JSON.stringify({ requestId: 'r1', state: 'cancelled' })));
        });
        return original(url, options);
      };
    });
    await enable(page);
    await page.route(relay + '/v1/messages/r1', route => route.fulfill({ json: { requestId: 'r1', state: 'running' } }));
    await page.goto('/#revia.html');
    await page.getByLabel('Invitation code').fill('first'); await page.getByRole('button', { name: 'Start session' }).click();
    await page.getByLabel('Your message').fill('First turn'); await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('[data-progress]')).toContainText('Preparing reply');
    await page.getByRole('button', { name: 'Cancel reply' }).click();
    await page.getByRole('button', { name: 'End session & clear' }).click();
    await page.getByLabel('Invitation code').fill('second'); await page.getByRole('button', { name: 'Start session' }).click();
    await expect(page.getByLabel('Your message')).toBeEnabled();
    await page.evaluate(value => window.finishOldCancel(value), outcome);
    await expect(page.locator('[data-progress]')).toHaveText('Session ready. Send a message to begin.');
    await expect(page.getByLabel('Your message')).toBeEnabled();
  });
}
