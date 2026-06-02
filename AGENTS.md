# Repository Guidelines

## Project Structure & Module Organization

This repository is a static GitHub Pages portfolio site. The main page is `index.html`, with `privacy-policy.html` for the privacy page. Shared CSS and JavaScript live in `Helper/`: `styles.css` is the primary stylesheet, `script.js` contains navigation, date, and animation behavior, and the other CSS files are vendored Pure CSS assets. Static assets are organized by type: `img/` for images and company logos, `ico/` for favicons and the web manifest, `fonts/` for local web fonts, and `downloads/` for files such as the resume. Deployment is configured in `.github/workflows/deploy-pages.yml`.

## Build, Test, and Development Commands

There is no package manager or build step. Edit files directly and preview them in a browser.

- `python3 -m http.server 8000`: serve the site locally from the repository root at `http://localhost:8000`.
- `git status --short`: check for changed files before committing.
- `rg "pattern"`: search HTML, CSS, and JavaScript quickly.

Deployment happens automatically on pushes to `master`; the workflow uploads the repository root as the Pages artifact.

## Coding Style & Naming Conventions

Use 2-space indentation in CSS and JavaScript. Keep HTML indentation consistent with nearby markup. Prefer semantic HTML sections and descriptive class names, for example `.experience-company` or `.header-content--nav-only`. CSS custom properties belong near the top of `Helper/styles.css`. Keep JavaScript vanilla and scoped inside the existing `DOMContentLoaded` handler unless a change requires another structure. Use ASCII text unless existing content requires special characters.

## Testing Guidelines

No automated test suite is currently present. For each change, run a local static server and manually verify the affected page at desktop and mobile widths. Check navigation, responsive menu behavior, anchor scrolling, dark mode styling, and any edited assets or downloads. When editing metadata, also inspect `sitemap.xml`, `robots.txt`, and relevant `<meta>` tags.

## Commit & Pull Request Guidelines

Recent commits use short, imperative or descriptive messages such as `Remove homepage logo link`, `Update resume`, and `Fix footer color`. Keep commits focused on one visible change or maintenance task. Pull requests should include a brief summary, list changed pages or assets, note manual verification performed, and include screenshots for visual changes. Link related issues when available.

## Security & Configuration Tips

Do not commit private keys, analytics secrets, or unpublished personal documents. Keep `CNAME` intact unless changing the production domain. When replacing files in `downloads/`, confirm filenames and links remain stable or update every reference.
