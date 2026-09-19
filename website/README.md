# Website

The product site for Heatmap Tracker, served from GitHub Pages at
<https://mokkiebear.github.io/heatmap-tracker/>.

Plain HTML, CSS and browser JavaScript — no framework, no build step. What is in this
folder is exactly what gets served.

```
website/
├── index.html            the landing page (content + JSON-LD structured data)
├── 404.html              noindexed, links back into the site
├── guides/               long-form pages, one per search intent
├── assets/css/styles.css design tokens, layout, dark/light themes
├── assets/js/main.js     theme toggle, scroll reveals, copy buttons, demo heatmap
├── assets/img/           WebP screenshots, the 1200x630 OG card, logo, favicon
├── llms.txt              machine-readable summary for AI answer engines
├── robots.txt            allows everything, points at the sitemap
├── sitemap.xml           every page; update lastmod on a content change
└── .nojekyll             tells Pages to serve the files as-is
```

## Guides

Each page in `guides/` targets one thing people search for, carries its own
`TechArticle` + `FAQPage` + `BreadcrumbList` structured data, and links to the other two
plus the landing page. They are generated from one template so the head, nav and footer
cannot drift — but the generated HTML is what is committed and edited from here on.

Adding a page means: write it, link it from the `#guides` section on `index.html` and
from the footer, and add it to `sitemap.xml` and `llms.txt`.

## Images

Screenshots are WebP at 1600px wide, converted from `public/*.png`:

```bash
python3 -c "from PIL import Image; im=Image.open('public/x.png').convert('RGB'); im.thumbnail((1600,1600)); im.save('website/assets/img/x.webp','WEBP',quality=80,method=6)"
```

`assets/img/og.jpg` is the 1200x630 social card — every Open Graph and Twitter tag on
every page points at it. Keep every `<img>` tag's `width`/`height` equal to the real pixel
size, or the page shifts while images load (Core Web Vitals counts that against you).

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

## Getting found

What is in the repo is only half of it. The rest has to be done once, by hand:

1. **Google Search Console** — add the property `https://mokkiebear.github.io/heatmap-tracker/`,
   verify it (the HTML-file method works: drop the file in `website/` and redeploy), then
   submit `sitemap.xml` and use **URL inspection → Request indexing** for the landing page
   and each guide. This is what turns "some weeks" into "a few days".
2. **Bing Webmaster Tools** — same, and it feeds ChatGPT's web search.
3. **Links pointing at the site.** Ranking on a `github.io` subdomain needs them, and they
   are the slowest part to get: the repo's About field, the README, the Obsidian forum,
   r/ObsidianMD, any "best Obsidian plugins" roundup that will have you.
4. **Settings → Pages → Enforce HTTPS** must be on, so the `http://` version redirects
   instead of splitting the signal.

## SEO notes

- One `<h1>` per page, section `<h2>`s carrying the terms people search for ("obsidian
  heatmap", "obsidian habit tracker", "obsidian contribution graph").
- `SoftwareApplication` and `FAQPage` JSON-LD on the landing page, `TechArticle` +
  `FAQPage` + `BreadcrumbList` on each guide. The FAQ answers in the markup and in the
  structured data must stay in sync — Google treats a mismatch as a reason to drop the
  rich result.
- Every page carries `max-image-preview:large`, a canonical URL and the same OG card.
- The Open Graph and Twitter card images are absolute URLs — they must stay absolute, or
  link previews break.
