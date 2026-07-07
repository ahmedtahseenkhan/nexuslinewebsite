# NexusLine — GRC marketing site

A fast, SEO-friendly, **static** multi-page website. No build step, no framework — just
open the files or serve the folder with any static host (Netlify, Vercel, S3, Nginx, GitHub Pages).

Previously the whole site was a single 2.4 MB self-unpacking `NexusLine.html` where all content
was JSON-encoded on one line and rendered by JavaScript. Search engines saw almost nothing and it
couldn't grow. It has been **de-bundled** into the structure below. The original is kept in
`legacy/` for reference and can be deleted.

## Structure

```
.
├── index.html            # Home (full landing page)
├── platform.html         # Platform overview
├── modules.html          # 57-module catalogue (anchors: #risk #compliance #governance …)
├── intelligence.html     # Document intelligence
├── security.html         # Security & audit
├── deployment.html       # Cloud / on-premise / air-gapped
├── pakistan.html         # Pakistan · SBP
├── contact.html          # Contact + demo request form
├── 404.html              # Not-found page
│
├── assets/
│   ├── css/
│   │   ├── fonts.css      # @font-face — self-hosted Newsreader / IBM Plex Sans / IBM Plex Mono
│   │   └── styles.css     # design tokens (:root) + all component styles — edit once, restyles every page
│   ├── js/
│   │   └── main.js        # nav scroll state, mobile menu, reveal-on-scroll, tabs, count-up, active-nav
│   ├── fonts/             # self-hosted .woff2 subsets (privacy / on-prem friendly)
│   ├── img/               # dashboard-preview.png (also the OG/Twitter share image)
│   └── partials/
│       ├── header.html    # canonical header markup — source of truth for the nav
│       └── footer.html    # canonical footer markup
│
├── favicon.svg
├── site.webmanifest
├── robots.txt
├── sitemap.xml           # update <lastmod> and add new <url> entries when you add pages
└── legacy/               # the original single-file bundle (archived)
```

## How to add a new page

1. Copy an existing page (e.g. `platform.html`) to `your-page.html`.
2. Update the `<head>`: `<title>`, `<meta name="description">`, `<link rel="canonical">`,
   the Open Graph / Twitter tags, and the JSON-LD `WebPage` + `BreadcrumbList`.
3. Set `<body data-page="your-page">` — `main.js` uses it to highlight the matching nav link.
4. Keep the header/footer identical to `assets/partials/header.html` / `footer.html`
   (paste them in). To add a nav link, edit **both** partials and every page's inline copy,
   or switch to a static-site generator (see below).
5. Add the page to `sitemap.xml` and, if relevant, link to it from the header/footer.

## SEO checklist (already in place)

- One `<h1>` per page, semantic `<header>/<main>/<footer>/<nav>`, descriptive `alt` text.
- Unique `<title>` + `<meta name="description">` + `<link rel="canonical">` per page.
- Open Graph + Twitter Card tags; share image at `assets/img/dashboard-preview.png`.
- JSON-LD structured data: `Organization`, `WebSite`, `WebPage`, `BreadcrumbList`
  (+ `SoftwareApplication` on home & platform).
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, SVG favicon, `theme-color`.
- Self-hosted fonts with `font-display:swap` (no third-party requests — good for privacy and for
  the on-prem/air-gapped positioning).

## Design tokens

All colours, fonts and spacing live in `:root` at the top of `assets/css/styles.css`
(navy `--ink:#122238`, brass `--brass:#b48a4c`, paper `--paper:#f6f1e7`; Newsreader / IBM Plex
Sans / IBM Plex Mono). Change them there to re-theme the whole site.

## Local preview

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

Use a server (not `file://`) so root-relative paths, the manifest and fonts all resolve.

## Scaling up later

If nav/footer duplication across pages becomes a chore, move to a static-site generator
(Eleventy, Astro, Hugo). The `assets/partials/` files are already structured to become
includes/layouts with minimal changes, and the CSS/JS/asset split stays exactly as-is.
