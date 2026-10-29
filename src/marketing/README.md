# LoveAll: marketing site & design system

> Every great match begins at Love all. So does every great player.

The marketing website for **loveall.in**, the training management platform for racket-sport academies. LoveAll is live for **badminton**. Tennis, squash, table tennis and pickleball are shown as *Coming soon*.

Stack: React 18 · Vite · TypeScript · Tailwind CSS 4 · React Router · Framer Motion · lucide-react.

---

## Run, build, deploy

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # serve the build locally
```

**Deploy to Vercel:** import the repo, framework preset **Vite**, build command `npm run build`, output `dist`. `vercel.json` rewrites every route to `index.html` so client-side routes such as `/features` work on refresh, and sets long-term caching on hashed assets.

`public/robots.txt` and `public/sitemap.xml` are copied to the site root as they are. Update `sitemap.xml` whenever you add a page.

## Project structure

```
index.css                 Design tokens: @theme (primitives) + semantic light/dark vars + @theme inline
contexts/ThemeContext     System / light / dark preference, persisted to localStorage
data/                     All copy and content (easy to localise, see below)
components/brand/         Crest, Logo, court-line motifs, custom thin-line icons
components/ui/            Design-system components (Button, Field, Tabs, Accordion, cards…)
components/mocks/         Illustrative product screens inside the BrowserFrame
components/sections/      Page sections composed only from ui/ + brand/
components/styleguide/    Living style guide sections
pages/                    One file per route
```

## Design tokens

- **Primitives** (`@theme`): `court-50…900`, `ivory`, `ink`, `gold-300/500/700`, `lime`, warm `neutral-50…950`, the type scale (`text-display`, `text-h1`, `text-h2`, `text-h3`, `text-lead`, `text-body`, `text-caption`), radii (4/6/8px) and `ease-classic`.
- **Semantic** (`--la-*` CSS variables, mapped to Tailwind with `@theme inline`): `bg-canvas`, `bg-surface`, `bg-surface-alt`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `border-rule`, `border-rule-strong`, `bg-primary`, `text-on-primary`, `bg-court`, `text-accent-ink`, `bg-signal`, plus `success | warning | danger | info` with `-bg` pairs.
- **Dark mode** follows `prefers-color-scheme` by default. The manual toggle sets `data-theme` on `<html>`.
- **Utilities**: `container-page`, `eyebrow`, `numerals`, `rule-double`, `grain`, `duotone`.

The living style guide is at **`/style-guide`**.

## Fonts & performance

Libre Caslon Text and Source Sans 3 load from Google Fonts with `display=swap`. To self-host for the best Lighthouse score, download the WOFF2 files, put them in `public/fonts/`, replace the `@import url()` at the top of `index.css` with `@font-face` rules, and add `<link rel="preload" as="font" crossorigin>` for the two main weights in `index.html`.

Images are lazy-loaded with explicit dimensions. For production, swap the CDN photography for optimised AVIF/WebP versions of real academy photos.

## SEO

- Each page calls `usePageMeta()` to set the title, description, canonical URL, Open Graph and Twitter tags.
- `Organization` and `SoftwareApplication` JSON-LD is injected once by `Layout` (see `data/site.ts`).
- For crawlers that don't run JavaScript, consider prerendering routes (e.g. `vite-plugin-prerender`) before launch.

## Content & localisation

All copy lives in `data/*.ts` as plain arrays, separate from markup. To localise into Hindi or a regional language, move these files behind a locale key (e.g. `data/en/`, `data/hi/`) or into an i18n library, and keep component code unchanged. Prices use ₹, and Indian digit grouping (e.g. `1,10,000`) is written directly into the content.

## Adding a new sport when it launches

1. In `data/sports.ts`, change the sport's `status` from `"soon"` to `"live"` and rewrite its `description` to say what is live.
2. Optionally add a sport icon to `components/brand/Icons.tsx` and a sport-specific details block in `pages/Sports.tsx`, following the badminton section.
3. Update the copy that names badminton as the only live sport: the hero chip (`HeroSection.tsx`), the FAQ answer in `data/faqs.ts`, the `SoftwareApplication` description in `data/site.ts`, and page meta descriptions.
4. The Notify-me form lists only sports with `status: "soon"`, so the new sport drops out of it automatically.
5. Redeploy.

## Honesty rules (please keep)

- Never imply that coming-soon sports work today.
- Don't claim video analysis, live scoring or a native mobile app.
- Keep the stats and testimonials labelled as **sample** until they are replaced with real, approved data.
