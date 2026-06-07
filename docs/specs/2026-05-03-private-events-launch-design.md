# Private events page launch — design

**Date:** 2026-05-03
**Status:** Approved, ready for implementation
**Goal:** Ship a standalone, SEO-optimized landing page at `/private-events/` that ranks for "private event Bangkok" and adjacent queries, and convert that traffic into private-booking enquiries via phone, email, and Instagram.

## What we're shipping

A new static page at `/private-events/` with:

1. Full editorial copy (hero, three spaces, occasions, what's included, FAQ, CTA)
2. Brand styling consistent with the homepage (Champagne italic headlines, gold accents, glass pill buttons)
3. Open Graph + JSON-LD Restaurant + JSON-LD FAQPage structured data so Google understands the page
4. `sitemap.xml` and `robots.txt` so Google can discover the page
5. Three internal links from the homepage so Google crawls the page and visitors find it
6. No backend lead-capture form in v1. Phone, email, Instagram CTAs are enough to ship today.

## Page structure

Top to bottom of `static/private-events/index.html` (already written, awaiting CSS):

| Section | Purpose | Key content |
| --- | --- | --- |
| Top nav | Brand return + reservation | Logo + nav anchors back to home + gold "Reserve a table" CTA |
| Hero | Headline + lede + double CTA + social proof | H1 "Private Events in Bangkok", lede mentions Michelin + Langsuan + 110 guests, Enquire/Phone buttons, awards line |
| Why Bisou | Brand narrative for context | Two paragraphs; reuses KISS-era voice (custom menu by Antoine, paired wines by Theo, tableside flambé, hospitality as theatre) |
| Three spaces | The pricing decision | Private Dining Room (17, THB 25,000+++), Second Floor (45, THB 150,000+++), Full Venue Buyout (75 seated / 110 standing, THB 300,000+++) |
| Built for every occasion | SEO keyword breadth | Bullet list: wedding receptions, corporate dinners, product launches, birthday parties, anniversary dinners, family celebrations, investor and press dinners |
| Included | Reduces friction by listing what they get | 6 cards: custom menu, curated wine pairing, custom music + ambiance, dedicated event coordinator, free valet parking, decor + entertainment assistance |
| FAQ | Conversion + featured-snippet eligibility | 8 collapsible `<details>` questions covering minimum spend, headcount, lead time, dietary, wine pairings, parking, vendors, exact location |
| Plan your event | Final CTA | Three pill buttons: Email contact@bisoubangkok.com, Call +66 96 025 5858, Message on Instagram |
| Footer | Light footer | Address, hours, phone, email, links to home/menu/reserve |

## SEO infrastructure

### `static/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bisoubangkok.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://bisoubangkok.com/private-events/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

### `static/robots.txt`

```
User-agent: *
Allow: /

Sitemap: https://bisoubangkok.com/sitemap.xml
```

### Structured data already on the page

- `<script type="application/ld+json">` Restaurant schema with address, geo, opening hours, aggregate rating (4.9 / 2,500), awards (Michelin Guide 2026, Tatler Best Restaurants 2026, **Thailand's Best Restaurants** — adding the third per the existing live page)
- `<script type="application/ld+json">` FAQPage schema mirroring the 8 FAQ entries

### Meta + Open Graph

- `<title>` "Private Events Bangkok | Bisou Bangkok" (52 chars)
- `<meta name="description">` under 160 chars, mentions Michelin, Langsuan, custom menus, up to 110 guests
- Canonical URL `https://bisoubangkok.com/private-events/`
- OG title / OG description / OG image (the team photo from your WordPress; can swap later)

## Naming alignment with the existing live page

| My draft | Live page (https://bisoubangkok.com/private-event/) | Decision |
| --- | --- | --- |
| Upper Floor | Second Floor | Switch to **Second Floor** |
| Awards: Michelin Guide 2026, Tatler Best Restaurants 2026 | Adds **Thailand's Best Restaurants** | Add the third badge to the page social-proof line and the JSON-LD `award` array |
| Capacity numbers | 17 / 45 / 75 seated / 110 standing | Match exactly (already aligned) |
| Minimum spends | THB 25,000+++ / 150,000+++ / 300,000+++ | Match exactly (already aligned) |

## Styling — `static/private-events/page.css` (~200 lines, new file)

- Reuses brand tokens from `main.css`: `--noir`, `--gold`, `--gold-light`, `--cream`, `--font-display`, `--font-sans`, `--ease-luxe`
- Sections alternate between `.pe-section` (default dark) and `.pe-section--alt` (slightly tinted) for rhythm
- Typography:
  - `.pe-h1` — clamp(3rem, 7vw, 5.5rem), Champagne italic, gold for `<em>` words
  - `.pe-h2` — clamp(1.8rem, 3.5vw, 2.6rem), Champagne, italic gold for `<em>`
  - Body — Inter 300, line-height 1.65
- Three spaces grid: 1 column mobile, 3 columns at 800px+
- Six "included" cards: 1 / 2 / 3 columns at 480px / 720px / 1024px breakpoints
- FAQ `<details>`: chevron rotation on open, 1px gold underline below summary
- Buttons: reuse the new `.btn` (glass pill) and `.btn--gilt` (solid gold pill) from main.css
- Mobile: hero buttons stack, three-spaces stack, included cards stack, FAQ stays single-column

## Homepage integration — `static/index.html` (3 small changes)

1. Add `<a href="/private-events/" class="nav__link">Private events</a>` to the desktop nav, between `Infos` and the Reserve button
2. Same link in the `[data-sheet]` mobile sheet nav
3. Add a small "Private events" CTA card just above the existing footer:
   ```
   <section class="home-private-cta">
     <h2>Hosting a private event?</h2>
     <p>Wedding receptions, corporate dinners, full venue buyouts. Up to 110 guests.</p>
     <a href="/private-events/" class="btn btn--xl btn--gilt">Explore private events</a>
   </section>
   ```
   (Tiny new CSS block, ~30 lines)

## Files touched

| File | Status | Lines |
| --- | --- | --- |
| `static/private-events/index.html` | Already written, will commit | ~370 (existing) |
| `static/private-events/page.css` | New | ~200 |
| `static/index.html` | Modified (3 small additions) | +15 |
| `static/css/main.css` | Modified (`.home-private-cta` block) | +30 |
| `static/sitemap.xml` | New | ~20 |
| `static/robots.txt` | New | ~5 |

## Out of scope (deliberate, to keep this shippable today)

- **Backend lead-capture form.** Phone, email, Instagram cover v1. We can add Formspree or a Vercel serverless function later if conversion is weak.
- **French / Russian / Thai translations.** The homepage doesn't have these wired yet either; this is the existing site-wide debt. Out of scope for this spec.
- **Custom photography for the events page.** The Open Graph image and Restaurant schema both use existing WordPress URLs; we can swap to first-party assets later.
- **Sanity-driven content for the events page.** This is a write-once landing page; Sanity migration is the next spec ("Gap 1") and will not retrofit this page.

## Acceptance

- `/private-events/` renders correctly on desktop, tablet, mobile
- All three CTAs work (mailto, tel, Instagram link)
- All 8 FAQ items expand and collapse
- View source contains both JSON-LD scripts (Restaurant + FAQPage)
- Google Rich Results Test passes for both schemas
- `https://bisoubangkok.com/sitemap.xml` resolves and lists both URLs
- `https://bisoubangkok.com/robots.txt` resolves
- Homepage nav + mobile sheet + bottom CTA card all link to `/private-events/`
- Lighthouse SEO score ≥ 95 on the new page

## Implementation sequence

1. Write `page.css` with all `.pe-*` styles and breakpoints
2. Verify the page renders in the local preview server
3. Add the "Thailand's Best Restaurants" badge to the social-proof line and the JSON-LD `award` array
4. Rename "Upper Floor" → "Second Floor" everywhere on the page
5. Add `static/sitemap.xml` and `static/robots.txt`
6. Add the three homepage integration points (nav, mobile sheet, CTA card)
7. Bump the homepage CSS cache buster
8. Commit, push, verify on Vercel preview, run Google Rich Results Test
