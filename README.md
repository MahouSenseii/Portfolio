# Portfolio

Plain JavaScript modules, HTML fragments, CSS design tokens, JSON content, and Webpack. The compiled site is `dist/`. Routes use hashes, so `#revia.html` works at either a domain root or `/Portfolio/` without server rewrite rules. Existing project/art pages and the explicit music control remain available.

## Local verification

Use Node 24 LTS and npm. From this repository in PowerShell:

```powershell
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

The browser suite starts its own loopback static server and tests the actual compiled output at both deployment bases, including a mobile viewport. Test relay responses are intercepted only in tests; no mock conversation ships in production. `npm start` runs the existing development server. Build products, test traces, and dependencies are ignored.

## Optional Revia text demo

The default `data/revia-demo.json` is deliberately disabled with an empty relay URL. No live service has been fabricated. The static page explains the project when disabled or offline.

Once the compatible [Revia relay, connector, and isolated native guest runtime](https://github.com/MahouSenseii/R.E.V.I.A/tree/main/Tools/Presence/WebDemo) are deployed and verified:

1. Configure the relay's allowed origin to the exact portfolio scheme/host/port. For GitHub project Pages this is `https://mahousenseii.github.io`, with no `/Portfolio/` path. Other projects under that origin share its browser origin; CORS cannot isolate paths.
2. Keep relay host credentials, native loopback credentials, and invitation verification secrets in operator environment/secret storage. None belong in this repository. The first release uses server-verified invite-only admission.
3. Set `relayUrl` to the real public HTTPS relay origin, with no path, credentials, query, or fragment. Set `enabled` to `true` only after a genuine end-to-end smoke test. Localhost/HTTP origins are rejected by production configuration.
4. Run the commands above, review, then publish the compiled site. Pause or disable the native public source to stop guest access. To withdraw the page's chat controls, restore `enabled: false` and `relayUrl: ""`, rebuild and publish; server-side pause/revocation remains the immediate control.

The browser calls version 1 status/session/message/cancel/end routes, keeps its opaque bearer token only in memory, and sends no credentials in URLs. Submission retries reuse exactly the same text and idempotency key. Result polling is bounded by a 120-second total lifetime. Network errors never produce a fabricated answer. HTTP 401 clears the local token and requires a new session. Route departure aborts fetches/timers/listeners, clears text, and best-effort deletes the session. Lost unload requests are covered by server TTLs; a browser cannot guarantee delivery during shutdown.

Text is inserted through `textContent`, including apparent HTML/Markdown/code. Enter sends, Shift+Enter inserts a newline, and IME composition is respected. Limits are 2,000 Unicode code points and 8,192 UTF-8 bytes; one request runs per page session. The transcript retains at most 40 entries in the current page only. Screen-reader labels, polite status/log announcements, visible focus, touch targets, and reduced-motion styling are included. This release has no microphone, synthesized playback, or computer-control actions.

Guest text passes through the relay to the developer's machine; the relay can read it. Use non-sensitive input. Public guest context is separate from durable owner memory. Application expiry/end removes application-owned guest data; hosting/CDN logs and browser/device retention are separate. See the runtime operational documentation for the server retention and isolation boundaries. Do not describe this path as end-to-end encrypted or as all text staying on one machine.

## Static hosting and CI

The workflow verifies every push/PR without production secrets and prints the exact checked-out commit SHA. It installs from the lockfile, validates content, runs Node tests, builds, and tests the compiled output in Chromium desktop/mobile configurations.

Automatic Pages deployment is gated by the repository variable `PAGES_DEPLOY_ENABLED=true`. Before enabling it, inspect the repository's existing Pages publishing source. To use this workflow, select **Settings → Pages → Build and deployment → GitHub Actions**, grant the workflow Pages and OIDC permissions, and allow `main` in the `github-pages` environment. Then set the variable and run the workflow. Without that owner setup the verification runs while deployment stays skipped; this does not claim the live site has been updated. If an existing compatible publishing workflow is in use, leave the variable unset and publish `dist/` through that workflow instead.

At implementation time the existing site uses branch-based Pages from `main` (last confirmed successful Pages run `33132904768`, revision `bfbbc1c`). Preserve that source and leave the optional deployment variable unset. The root `index.html` also loads the original ES modules and relative static assets, so this page works with the existing branch publishing method; Webpack output is independently verified for a future migration. No Pages settings change is required for this release.

Release order: deploy the compatible backend disabled, configure its origins/credentials/admission, verify native isolation and genuine model output, enable the owner-controlled public source, then publish enabled frontend configuration. Cross-repository commits are not atomic. Roll back frontend configuration first and pause the native/relay service; never use an older frontend as a substitute for server revocation. Static Pages availability does not imply the developer's PC is online.

This is a noncommercial personal portfolio. GitHub Pages serves static files only; it does not host the relay or native process. Provider costs/quotas and relay hosting setup are documented in Revia.

## Verification evidence

Starting revision: `bfbbc1c8e98af507a2cea064265063b31a5907b9` on `main`. Local tests run against the implementation working tree before the reviewed commit; CI records the final exact SHA when run. Deployment and genuine local-model inference are separate release gates, not demonstrated by frontend test doubles.

Local verification on 2026-09-22 used Node `24.15.0`, npm `11.12.1`, and Playwright `1.63.0`:

| Check | Result | Exit |
| --- | --- | --- |
| `npm test` | 20 passed; content schema valid (7 projects, 8 artworks) | 0 |
| `npm run build` | Compiled successfully; existing video performance warnings | 0 |
| `npm run test:browser` | 36 passed against `dist/`, desktop/mobile and both path bases | 0 |
| `PORTFOLIO_TEST_SOURCE=1` with browser command | 36 passed against original ES modules used by existing Pages | 0 |
| `npm audit` | 0 vulnerabilities | 0 |
| `git diff --check` | No whitespace errors | 0 |

For the source check in PowerShell, set `$env:PORTFOLIO_TEST_SOURCE='1'`, run `npm run test:browser`, then remove the variable with `Remove-Item Env:PORTFOLIO_TEST_SOURCE` before testing the build again. CI runs both modes separately. Screenshots in ignored `test-results/` were visually reviewed at desktop and mobile sizes; a regression checks that the fixed navigation cannot obscure the heading. Tests cover all six availability states, disabled configuration, project CTAs, Unicode limits, retry identity, literal malicious-looking text, IME/keyboard behavior, 401 recovery, late session creation cleanup, cancellation/deadlines, and late cancel success/failure after a replacement session starts.

The baseline contained `profile.backgroundVideoRotate: 360`, which failed both its JSON schema and existing quarter-turn test. It is normalized to the visually equivalent `0`; no other unrelated project/profile content was changed. The build retains an existing performance warning for the 2.8 MiB homepage video. Existing `fast-uri` and `qs` transitive development dependencies were updated within their allowed ranges after npm audit reported vulnerabilities.

Official references checked for this implementation: [Playwright installation and Node support](https://playwright.dev/docs/intro), [Playwright 1.63 release notes](https://playwright.dev/docs/release-notes), and [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). `@playwright/test` is pinned to `1.63.0` in the committed lockfile.
