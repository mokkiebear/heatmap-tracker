# Website

The product site for Heatmap Tracker, served from GitHub Pages at
<https://mokkiebear.github.io/heatmap-tracker/>.

Plain HTML, CSS and browser JavaScript — no framework, no build step. What is in this
folder is exactly what gets served.

```
website/
├── index.html            the whole page (content + JSON-LD structured data)
├── assets/css/styles.css design tokens, layout, dark/light themes
├── assets/js/main.js     theme toggle, scroll reveals, copy buttons, demo heatmap
├── assets/img/           screenshots and logo, copied from public/
├── llms.txt              machine-readable summary for AI answer engines
├── robots.txt            allows everything, points at the sitemap
├── sitemap.xml           one URL; update lastmod on a content change
└── .nojekyll             tells Pages to serve the files as-is
```

## Preview locally

```bash
npx serve website -l 5175
```

Then open <http://localhost:5175>.

## Deploy

[`.github/workflows/pages.yml`](../.github/workflows/pages.yml) publishes this folder on
every push to `main` that touches `website/`, and on manual dispatch.

One-time setup in the repo: **Settings → Pages → Build and deployment → Source:
GitHub Actions**. Nothing else to configure.

## When the plugin changes

- New feature or renamed parameter → update the copy in `index.html` (features, FAQ and
  the `featureList` in the `SoftwareApplication` JSON-LD) and the capability list in
  `llms.txt`.
- New release → bump `softwareVersion` in the JSON-LD and the version in the hero eyebrow.
- Content change → bump `<lastmod>` in `sitemap.xml`.

## SEO notes

- One `<h1>`, section `<h2>`s carrying the terms people search for ("obsidian heatmap",
  "obsidian habit tracker", "obsidian contribution graph").
- `SoftwareApplication` and `FAQPage` JSON-LD; the FAQ answers in the markup and in the
  structured data must stay in sync.
- The Open Graph and Twitter card images are absolute URLs — they must stay absolute, or
  link previews break.
