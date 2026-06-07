# Photo Menu (`/menu`) — Design

Date: 2026-05-30
Status: Approved, ready for implementation plan

## Goal

Guests sitting in the restaurant scan a QR code on the table and land on a
page where they can **see photos of every dish fast**, browsing by category,
without clicking into individual item pages. The food is fully photographed
(58/58 dishes across 9 food categories), so the menu should feel like a quick,
appetizing visual lookbook on a phone.

## Decisions (locked during brainstorming)

- **Navigation model:** one long vertical scroll (not swipeable tabs, not a
  mixed feed). Categories stack top to bottom.
- **Architecture:** a dedicated `/menu` page, responsive, single URL.
- **Theme:** cream paper (matches Team / Journal / Private Events).
- **Density:** 2-column grid (~6 dishes per screen) — fastest to scan.
- **Fonts:** the real site fonts — Champagne & Limousines for the brand mark
  and category labels, Jost for dish names and prices. (Not the mockup's
  placeholder system fonts.)
- **Scope:** food only — the 9 photographed food categories. Drinks and wine
  are NOT on `/menu`; they stay in the existing home menu.
- **Per dish:** photo + name + price. No detail pages (names are already
  descriptive, e.g. "Beef wellington, foie gras, mushroom").
- **Tap-to-zoom:** tapping a photo opens it full-screen (a lightbox of just the
  image, not a detail page).
- **Nav link:** the site nav "Menu" link repoints from `/#menu` to `/menu` on
  every page.
- **QR:** a branded QR PNG (bordeaux on cream) pointing to
  `https://bisoubangkok.com/menu`, committed to the repo for printing.

## Architecture

A new dedicated page at `/menu` (built to `dist/menu/index.html`, served at
`/menu` thanks to `cleanUrls`). One URL, responsive by CSS media query — no
client-side redirect, no layout flash:

- **Desktop (≥701px):** the existing menu experience, unchanged — the tabbed
  Kitchen / Drinks / Cellar panels with the floating hover preview, exactly
  like the home `#menu` section.
- **Mobile (≤700px):** the new long-scroll photo menu.

The page is intentionally **lightweight**: no preloader, no hero video, and it
does NOT load the heavy `static/js/main.js` (preloader / cursor / Lenis / GSAP
hero timeline). It loads only `main.css` (for shared tokens + the desktop menu
styles), a small page stylesheet, and a small dedicated script. This keeps the
QR open-to-photos time under ~1s.

The home page and its inline `#menu` section are untouched.

## Mobile photo menu — UX

- **Sticky top bar:** "Bisou" wordmark + a horizontally scrollable row of
  category **chips**: Bites · Crudo · Plates · Chef Signature · Steak · Mains ·
  Pasta · Sides · Dessert.
  - The chips are a **scroll-spy**: the chip for the category currently in view
    highlights in bordeaux.
  - **Tapping a chip** smooth-scrolls to that category section.
- **Each category** renders as a section: a category label (Champagne &
  Limousines, bordeaux) followed by a **2-column grid**.
- **Each dish card:** square photo (object-fit: cover) + name (Jost) + price
  (bordeaux). The whole grid is the experience — no per-item navigation.
- **Tap-to-zoom:** tapping a photo opens a full-screen lightbox showing just
  that image; tap again / tap the backdrop to close.
- **Drinks & wine link:** because the nav "Menu" link now points here (and the
  photo menu is food-only), the bottom of the scroll has a clear text link
  "Cocktails & wine →" pointing to `/#menu` (the home menu's Drinks / Cellar
  tabs), so mobile guests can still reach the full drinks and wine list. This
  closes the gap created by repointing the nav. No drink photos are added.
- **Performance:** dish images are lazy-loaded below the fold and served from
  the Sanity CDN at a mobile-appropriate width (square crop, `auto=format`,
  `q≈70`), so scrolling stays smooth on 4G.

## Data & build

- The page is generated at build time by `scripts/build-site.mjs` from the same
  Sanity data the menu already uses (`menuCategory` + `menuItem`, `kind ==
  'food'`).
- New template `templates/menu/index.html` containing:
  - the existing menu markup/markers for the desktop view (reusing the current
    `renderMenu` output so desktop is identical to home), and
  - a new `<!-- BUILD:PHOTOMENU -->` marker that the build fills with the
    mobile photo-grid sections (food categories only, in `order` ascending).
- New small client script (e.g. `static/menu/menu.js`) handling only:
  scroll-spy for the chips, tap-to-jump, and the tap-to-zoom lightbox. The
  desktop hover preview is provided by reusing the existing menu-hover logic
  (extracted into / shared with this script so `main.js` is not needed).
- New stylesheet (e.g. `static/menu/menu.css`) for the photo grid, sticky
  chips, and lightbox, layered on `main.css` tokens. Cache-busted with a `?v=`
  query like the other stylesheets.
- When staff add or change a dish photo in Sanity, it appears on `/menu` on the
  next deploy (any commit, or a manual Vercel redeploy).

## Navigation change

The nav "Menu" link changes from `/#menu` to `/menu` on all five templates
(home, team, journal index, journal post, private-events). On mobile this takes
visitors to the photo menu; on desktop to the familiar tabbed menu. The home
page keeps its inline `#menu` section as-is.

## QR code

Generate a high-resolution branded QR PNG (deep bordeaux `#6E1F2A` modules on
cream `#FFF8EF`, generous quiet zone) encoding `https://bisoubangkok.com/menu`,
committed at `static/assets/qr-menu.png` for printing on table cards. It can be
regenerated any time.

## SEO / meta

`/menu` gets its own `<title>`, meta description, canonical
(`https://bisoubangkok.com/menu`), and Open Graph tags, consistent with the
other pages. It uses the same favicon set as the rest of the site. It is added
to `sitemap.xml`.

## Edge cases

- **Food dish without a photo:** still shown (name + price on a discreet cream
  placeholder tile) so a category never has a hole. (Today all 58 food dishes
  have photos, but the build must not assume that.)
- **Empty category:** skipped (no label, no empty grid).
- **Sanity unreachable at build:** the page degrades gracefully like the rest
  of the build (the existing fallback behavior).

## Out of scope

- Drinks, cocktails, mocktails, and wine on `/menu` (they remain in the home
  menu).
- Per-dish detail pages, descriptions beyond the dish name, ordering, or
  add-to-cart.
- Changing the home page menu section (desktop or mobile).
- A "signature dishes shown larger" mixed grid (uniform 2-column for now; can
  revisit later).

## Success criteria

- Scanning the QR on a phone opens `/menu` to the photo grid in roughly a
  second, with no preloader.
- A guest can see every food dish photo by scrolling, and jump to any category
  via the sticky chips.
- Desktop `/menu` is visually identical to today's home menu.
- No horizontal overflow, correct typography scaling, tap targets comfortable
  on a phone.
- Adding a dish photo in Sanity surfaces it on `/menu` after a deploy.

## Files touched (anticipated)

- `templates/menu/index.html` (new)
- `static/menu/menu.css` (new)
- `static/menu/menu.js` (new)
- `static/assets/qr-menu.png` (new)
- `scripts/build-site.mjs` (new `BUILD:PHOTOMENU` renderer for food categories)
- `static/sitemap.xml` (add `/menu`)
- `templates/index.html`, `templates/team/index.html`,
  `templates/journal/index.html`, `templates/journal/_post.html`,
  `templates/private-events/index.html` (nav "Menu" link → `/menu`)
