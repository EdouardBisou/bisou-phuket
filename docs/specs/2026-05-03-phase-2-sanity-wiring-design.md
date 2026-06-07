# Phase 2 — Sanity wiring + Journal + Thai

**Date:** 2026-05-03
**Status:** Approved scope, ready for implementation
**Decision:** Path A — keep static HTML, add a Node build script that fetches Sanity at deploy time

## Goal

Move every piece of editable content out of the source code and into Sanity, so the Bisou staff can change a price, swap a photo, publish a journal post, or update opening hours without a developer. When that pipeline is live and the staff has populated real photos, the new site replaces the current `bisoubangkok.com`.

## Architecture

### Path A: build-time injection

A Node script (`scripts/build-site.js`) runs at deploy time. It:

1. Connects to the Sanity project (`mavecytg`, dataset `production`) using the read-only public CDN endpoint
2. Fetches site settings, menu categories, menu items, team members, journal posts
3. Renders the data into the HTML templates with a small templating helper
4. Writes the final files into a `dist/` directory
5. Vercel serves `dist/` as the static site

A Sanity webhook fires on every publish and pings a Vercel deploy hook. The site rebuilds and goes live within 30-60 seconds of any content change.

### Why Path A

- The current static HTML works, ranks, and is fast. We do not throw it away.
- Build-time HTML keeps every word visible to Google in the initial page response. Best for SEO.
- No framework migration. The codebase stays approachable.
- Adding Astro or Next.js is reserved for a future phase if the site needs runtime interactivity beyond what plain JS handles today.

### Trade-off accepted

Editor changes take 30-60 seconds to appear (rebuild + deploy). Acceptable for a restaurant brand site. Live preview within Sanity Studio fills the "did I save it right" gap.

## File layout

```
bisou-bangkok/
├── templates/                       (NEW: source templates)
│   ├── index.html                   (homepage shell with placeholders)
│   ├── private-events/index.html
│   ├── journal/[slug].html          (single-post template)
│   ├── journal/index.html           (post listing)
│   └── th/                          (mirrors for Thai)
├── static/                          (unchanged: shared CSS, JS, fonts, assets)
│   ├── css/main.css
│   ├── js/main.js
│   └── assets/
├── scripts/
│   ├── build-site.js                (NEW: the renderer)
│   ├── sanity-fetch.js              (NEW: GROQ queries)
│   └── seed.ts                      (existing)
├── sanity/
│   └── schemas/                     (extended: journalPost added)
├── dist/                            (build output — gitignored)
└── docs/specs/
```

## Sanity schema work

### Already in place

- `siteSettings` (singleton: brand, tagline, address, phone, email, hours, reservation URL, socials)
- `menuCategory` (title, slug, kind food/drink/wine, order, description, footnote)
- `menuItem` (name, category ref, description, price, priceNote, tags, order, image)
- `teamMember` (name, role, photo, tagline, order)
- `page` (existing scaffold, unused)

### Explicitly NOT moved to Sanity in this phase

To protect the brand voice and keep design control tight, these stay hardcoded in `templates/`:

- The Concept manifesto ("A restaurant is too small a word for it. Michelin on the plate. Hospitality in the room. A kiss at the door. Bisou. Every night.")
- The "K · I · S · S — Keep It Simple, Sexy" tagline
- Marquee phrase rotation
- Hero eyebrow, button labels, section eyebrows
- Private events page hero headline and "Why Bisou" narrative
- FAQ questions and answers on private events (they are content but they shape the SEO, not staff territory)

These can move to Sanity later in a Phase 3 if the owner decides they want to A/B-test brand copy. For now, the design-controlled words are part of the template, not the CMS.

### New: `journalPost`

```ts
{
  name: 'journalPost',
  type: 'document',
  fields: [
    { name: 'title', type: 'string', required },
    { name: 'slug', type: 'slug', source: 'title', required },
    { name: 'category', type: 'string', list: ['Chef notes', 'Cellar', 'Seasonal', 'Press', 'Story'] },
    { name: 'heroImage', type: 'image', hotspot: true },
    { name: 'excerpt', type: 'text', rows: 3 },
    { name: 'body', type: 'array', of: [{type:'block'}, {type:'image', options:{hotspot:true}}] },
    { name: 'author', type: 'reference', to: [{type:'teamMember'}] },
    { name: 'publishedAt', type: 'datetime' },
    { name: 'readMin', type: 'number' },
    { name: 'seoTitle', type: 'string' },
    { name: 'seoDescription', type: 'text', rows: 2 },
    { name: 'isPublished', type: 'boolean', initialValue: false }
  ]
}
```

Plus a Studio structure entry:

```
Bisou Content
├── Site Settings
├── Food, Cocktails, Wine, Team (existing groups)
├── Journal               (NEW)
│   ├── Posts (Chef notes)
│   ├── Posts (Cellar)
│   ├── Posts (Seasonal)
│   ├── Posts (Press)
│   ├── Posts (Story)
│   └── All posts
└── Pages
```

### Thai translation, deferred to next iteration

For this phase, Thai is delivered as static duplicate pages under `/th/`. The Sanity schemas stay single-language. A future phase adds a `_tr` object on each text field for Thai translations editable in Studio. The plan is committed but not implemented this phase, to keep scope shippable.

## Build script

`scripts/build-site.js` is the heart of Path A. Plain Node, no framework.

```
1. Load Sanity client (project mavecytg, dataset production, useCdn=true)
2. Fetch in parallel:
   - siteSettings (singleton)
   - menuCategories (ordered by 'order')
   - menuItems (ordered by 'category->kind' then 'order')
   - teamMembers (ordered by 'order')
   - journalPosts where isPublished == true (ordered by publishedAt desc)
3. For each template in templates/:
   - Load HTML
   - Replace markers with rendered Sanity content
   - Write to dist/<path>
4. For each journal post:
   - Render templates/journal/[slug].html with the post data
   - Write to dist/journal/<slug>/index.html
5. Generate dist/sitemap.xml listing every URL
6. Copy static/ contents (CSS, JS, fonts, assets) into dist/
```

### Templating

A tiny custom renderer using HTML comments as markers:

```html
<!-- BUILD:MENU -->
   ...placeholder fallback...
<!-- /BUILD:MENU -->
```

The script replaces everything between matching markers with rendered content. No third-party template library; ~30 lines of regex code. Each marker has a corresponding renderer function.

Markers used:

- `<!-- BUILD:SITE_SETTINGS -->` — address, phone, email, hours in the Infos section
- `<!-- BUILD:MENU -->` — full menu tabs and panels
- `<!-- BUILD:TEAM -->` — six (or more) team cards
- `<!-- BUILD:JOURNAL_LIST -->` — homepage journal section, latest 3 posts
- `<!-- BUILD:JOURNAL_POST_BODY -->` — single-post page body
- `<!-- BUILD:JOURNAL_INDEX -->` — full journal listing page
- `<!-- BUILD:META_TITLE --> / <!-- BUILD:META_DESCRIPTION -->` — per-page SEO

### Rich text

Sanity portable text → HTML via `@portabletext/to-html` (already a sibling of the `@portabletext/react` package in dependencies, we add the plain-text one).

### Images

Sanity image URLs are passed through `@sanity/image-url` to generate width/quality/format-optimized variants. Every `<img>` in the build gets `srcset` with 2-3 widths and `format=auto` for WebP. Lazy-loaded by default except above-the-fold hero images.

## Deployment flow

```
   Sanity Studio                Vercel
   ─────────────                ──────
   Staff edits + publishes
            │
            ▼
   Sanity webhook ────────────► Deploy hook URL
                                       │
                                       ▼
                              git fetch + npm run build
                                       │
                                       ▼
                              dist/ uploaded to CDN
                                       │
                                       ▼
                                    Live
```

Webhook setup:
- Sanity: project mavecytg → API → Webhooks → "On publish" → URL is the Vercel deploy hook
- Vercel: project bisou-bangkok → Settings → Git → Deploy Hooks → create one named "sanity-publish"
- Filter on Sanity side: trigger only for `_type in ["siteSettings","menuCategory","menuItem","teamMember","journalPost"]`

## Pages produced

| URL | Source template | Notes |
|---|---|---|
| `/` | `templates/index.html` | Homepage |
| `/private-events/` | `templates/private-events/index.html` | SEO landing |
| `/journal/` | `templates/journal/index.html` | All posts |
| `/journal/<slug>/` | `templates/journal/[slug].html` | One per post |
| `/th/` | `templates/th/index.html` | Thai homepage (static, manual translation) |
| `/th/private-events/` | `templates/th/private-events/index.html` | Thai private events |
| `/sitemap.xml` | generated | Lists every URL |
| `/robots.txt` | generated | Allow + sitemap pointer |

## Implementation order

1. **Foundation: build script skeleton**
   - Create `scripts/build-site.js` and `scripts/sanity-fetch.js`
   - Copy current `static/` content into `templates/` as starting point
   - Build process renders templates as-is (no Sanity yet) into `dist/`
   - Vercel build command updated to `npm run build`
   - Confirm site still works after this refactor

2. **Wire menu + site settings**
   - Add markers `BUILD:MENU` and `BUILD:SITE_SETTINGS` to template
   - Implement renderers
   - Confirm a price change in Sanity Studio appears on the live site after rebuild

3. **Wire team**
   - Add marker, renderer
   - Update team data in Sanity (add the 6 existing members with their photos)
   - Confirm change-of-photo workflow

4. **Image pipeline**
   - Plumb `@sanity/image-url` through every image in the build
   - Add `srcset` and `format=auto`
   - Confirm hover preview shows real photos for dishes that have one

5. **Journal**
   - Add `journalPost` schema in Sanity
   - Add Studio structure entry
   - Build the two new templates (`journal/[slug].html` and `journal/index.html`)
   - Migrate the 3 existing placeholder posts (or delete them)
   - Confirm a new post in Studio creates a live page

6. **Thai duplicates**
   - Translate homepage and private-events into Thai
   - Copy templates into `templates/th/`
   - Wire the language switcher in the nav

7. **Deploy hook + webhook**
   - Vercel deploy hook URL
   - Sanity webhook with type filter
   - Confirm Sanity publish → live in 30-60s

8. **Domain switch**
   - When staff says "we are ready," point `bisoubangkok.com` DNS at Vercel
   - Old WordPress site comes down, new site goes up

## Acceptance criteria

- Staff edits a menu price in Sanity Studio, clicks Publish. Within 60 seconds the price on the live site is updated.
- Staff uploads a photo for any dish. On the next page load, the dish hover preview shows the real photo instead of the "Coming soon" placeholder.
- Staff creates a journal post titled "Spring on the plate", uploads a hero image, writes a paragraph, publishes. The post appears in the Journal section of the homepage and at `/journal/spring-on-the-plate/`.
- Visiting `/sitemap.xml` lists every page including every published journal post.
- Google PageSpeed Insights score for the homepage stays at 90+ on mobile after the rebuild.
- The Thai pages at `/th/` and `/th/private-events/` are reachable from the language switcher.
- The current static site at `bisou-bangkok.vercel.app` continues to work during the entire migration. No downtime.

## Out of scope this phase

- French and Russian translations (structure is prepared, content deferred)
- Sanity-backed Thai translations (Thai is static in this phase)
- Contact form on private events page (still using phone / email / Instagram buttons)
- Custom reservation system (BistroChat link stays)
- Search functionality across journal posts
- Migration of the new site to the production `bisoubangkok.com` domain — that is a separate switch the owner triggers when ready

## Risk register

| Risk | Mitigation |
|---|---|
| Build script fails on Vercel | Local `npm run build` runs identically. Smoke test before each merge. |
| Sanity quota / cost | Free tier covers this brand's traffic. Webhook frequency is ~daily edits, not constant. |
| Sanity downtime breaks deploys | Build script falls back to the last known good `dist/` snapshot committed to git. |
| Staff publishes wrong content | Sanity has revision history. One-click rollback. |
| Domain switch surprise (existing bisoubangkok.com traffic) | DNS swap done with a low TTL prep step a day before, plus a 301 redirect map for any path differences. |

## Estimated effort

- Foundation + menu + settings + team wiring: 3-4 days
- Image pipeline: 1 day
- Journal schema + templates + migration: 2 days
- Thai duplicates + switcher: 2-3 days (includes review of translation)
- Webhook + deploy hook + smoke test: half day
- Buffer + domain prep: 1-2 days

Total: roughly 10-12 working days. Phased deliveries so the owner sees progress weekly.
