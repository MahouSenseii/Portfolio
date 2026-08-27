# Quentin F. Davis Portfolio

Static, responsive portfolio built with native JavaScript modules and bundled with Webpack for GitHub Pages.

The site is an interactive showcase rather than a page of cards: selecting a project or artwork
re-composes a layered scene (atmospheric background, large foreground artwork, information, and
selection UI) with a smooth transition between selections.

## Development

```powershell
npm install
npm start
```

Use `npm test` to validate content and run the unit tests. Use `npm run build` to create the production site in `dist/`.

## Content Updates

Portfolio content lives in `data/portfolio.json`. Its schema is in `data/portfolio.schema.json` and validates
project categories, URLs, sort order fields, and local asset references. Run `npm test` after every content update.

- Add one or more values to a project's or artwork's `categories` array to place it in multiple filters.
- `filters.projects` / `filters.art` set the order categories appear in the selector rail. Anything not listed
  is appended alphabetically.
- Keep `sortOrder` values unique within projects, artwork, and each skill group.
- Add full images under `img/projects` or `img/art` and small 3:2 thumbnails under the matching `thumbs` directory.

### Presentation is data-driven

The showcase renders every project through the same engine; a project describes what it needs and the
engine decides the presentation. Never special-case a project by name in CSS or JavaScript.

| Field | Effect |
| --- | --- |
| `theme` | Atmosphere preset: `apps`, `ai`, `games`, or `art`. Falls back to the first category that names one. |
| `accent` | Optional `#rrggbb` override for the scene's accent colour. |
| `heroImage` / `heroAlt` | The large foreground subject. Falls back to `characterImage`, then `image`. |
| `heroStyle` | `cutout` for free-standing art, `frame` to present a screenshot as a floating window. Inferred from whether `characterImage` is set. |
| `backgroundImage` | The atmospheric plate behind the scene. Falls back to `image`. |
| `status` / `platform` | Level-4 detail shown as a badge and in the kicker. |
| `detail` | Content for the expanded details drawer: `overview`, `sections[]`, and a `roadmap` of `implemented` / `inProgress` / `planned`. |
| `devlog` | Dated development entries. Adds a "Dev Log" button that opens the drawer. See below. |

`status` takes one label or several: `"Deployed"` or `["In Development", "Migrated to C++"]`.
The badge colour is chosen from the wording, so new labels work without a code change:

| Wording contains | Badge |
| --- | --- |
| deployed, launched, playable, released, live, shipped, complete | teal |
| migrated, rewritten, rebuilt, ported, superseded, replaced | accent |
| cancelled, archived, on hold, paused, retired | grey outline |
| anything else | gold (in progress) |

Adding a project with richer art therefore needs no renderer changes.

### Adding a dev log entry

Append one object to a project's `devlog` array in `data/portfolio.json`. Only `date` and
`title` are required; entries sort newest first automatically and the button appears as soon
as there is one.

```json
{
  "date": "2026-08-20",
  "title": "Swept-volume damage traces",
  "body": [
    "What changed and why.",
    "A second paragraph if you need one."
  ],
  "tags": ["Combat", "GAS"],
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "images": [
    { "src": "img/projects/ph/trace-debug.webp", "alt": "Debug view of the trace volume" }
  ]
}
```

`body` accepts a string or a list of paragraphs. `videoUrl` accepts YouTube or Vimeo and opens
in the media viewer. `images` open as a gallery. Run `npm test` afterwards - the schema
validates the shape and checks that every referenced image actually exists.

## Architecture

- `js/pages` — one module per route; each composes showcase pieces and returns a cleanup function.
- `js/showcase` — the reusable showcase system:
  - `showcase.js` — selection state, the category rail, the thumbnail selector, and swap transitions
  - `ambient.js` — the layered background, decorative framing, and ambient motes
  - `assets.js` — resolves hero/background/gallery imagery from item data
  - `theme.js` — maps an item to an atmosphere and accent
  - `fragments.js` — status badge, tag list, meta list, action buttons
  - `drawer.js` — the shared side panel
  - `details-panel.js` / `devlog.js` — the two things the drawer can show
  - `media-viewer.js` — fullscreen images, galleries, and embeds
- `js/components` — site-wide controls (navigation, music player, footer, modal controller).
- `css` — split by responsibility: `tokens` (palette, type, the four atmospheres), `base`, `navigation`,
  `showcase`, `overlays`, `home`, `pages`.

Atmospheres are pure CSS custom property scopes on `[data-theme]`; all structural rules are shared, so
the four areas stay variations of one design system.

Motion respects `prefers-reduced-motion`: ambient motes are not created and selection changes apply instantly.
