# Bisou Bangkok · Static Site

A deploy-ready, single-page, dark-mode, premium static site for Bisou Bangkok. No build step, no framework. Open `index.html` and it runs.

## Structure

```
static/
  index.html          the single page (all sections, all copy)
  css/main.css        full stylesheet (tokens, typography, components, motion)
  js/main.js          preloader, Lenis, cursor, GSAP hero timeline, menu, reveals
  assets/
    b-logo.png        <- DROP YOUR GOLD B HERE (transparent PNG recommended)
    favicon.svg       placeholder favicon
    README.txt        asset instructions
```

## The B asset

Save the gold monogram at `assets/b-logo.png`. Transparent PNG, at least 1200 x 1600 px. If missing, a vector SVG fallback is used automatically so the site never breaks.

## Local preview

Just open `index.html` in Chrome. Or run any static server:

```bash
# Python
python -m http.server 4000
# Node
npx serve .
```

## Deploy

### Vercel

```bash
vercel
```

Or drag the `static/` folder onto vercel.com/new.

### Netlify

Drag-and-drop the `static/` folder onto app.netlify.com, or:

```bash
netlify deploy --dir=static --prod
```

### Cloudflare Pages / GitHub Pages

Push to a repo, set the build output directory to `static/`, deploy.

## Typography system

- **Display:** Italiana (Google Fonts) for hero, sections, headings
- **Serif:** Cormorant Garamond for italic accents and paragraph leads
- **Sans:** Inter for body, UI, prices (Roboto used as fallback to match the live site)

## Animation choreography

The hero is 360vh tall with a sticky inner viewport. Five scroll-linked acts:

1. **Overture (on load):** vector B draws stroke-by-stroke on a black field, fills with gilt gradient, counter ticks to 100, page fades in
2. **Breathing:** subtle scale pulse on the B, 3D cursor-reactive tilt, ambient gold dust
3. **Dilation (0 - 45% scroll):** B scales up, title tracks outward, tagline fades
4. **Fracture (45 - 90%):** the B splits into upper and lower lobes that drift apart, the gilded threshold line extends horizontally, the word BISOU scatters, SVG `feDisplacementMap` molts the gold through a fractal noise distortion, particle burst peaks
5. **Dissolution (90 - 100%):** lobes fade, line settles, next section emerges

Motion is suppressed if the user has `prefers-reduced-motion: reduce`.

## Editing content

All copy lives in `index.html`. All menu data lives in `js/main.js` inside the `MENU` constant, grouped by `food` / `drink` / `wine`. Each item supports: `name`, `price`, `note`, `desc`, `tag`.

## Browser support

Evergreen Chrome, Safari, Firefox, Edge. Safari pre-15 gets a graceful fallback (no blur, no smooth scroll).
