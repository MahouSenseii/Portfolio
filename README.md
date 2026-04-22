# Quentin F. Davis Portfolio

This is a static portfolio site. The layout lives in `pages/`, `css/`, and `js/`, but the portfolio content you will usually edit is in `data/portfolio.json`.

## Update Your Content

- Projects: edit the `"projects"` list in `data/portfolio.json`.
- Project categories are intentionally broad: `Games`, `Interactive Web`, `Art & 3D`, and `Tools & Apps`. Use tags for the specific type.
- Skills: edit the `"skills"` list and change each `"percent"` value. The level badge is calculated automatically from that number.
- Art: add image files to `img/art/`, then add matching entries to the `"art"` list.
- Contact info: edit the `"contact"` section.

More detailed editing notes are in `data/README.md`.

## Run Locally

```bash
npm install
npm start
```

## Build

```bash
npm run build
```

The production files are generated in `dist/`.
