# Journal Post #2 — "Best Rooftop Bars in Bangkok" — Design

Date: 2026-06-06
Status: Approved, ready to write

## Goal

The second Bisou journal post, written as an SEO play to rank for **"best
rooftop bangkok"** / "best rooftop bars in Bangkok". Editorial, useful, in the
Bisou brand voice, framed as *where to continue the night after dinner at
Bisou*. No ranking, no numbered list — a flowing guide organised by proximity.

## Decisions (locked during brainstorming)

- **Structure:** Approach A — "the night unfolds", grouped by distance from
  Bisou (Soi Langsuan outward). H2 per area.
- **Tone:** trendy, current. Explicitly **no** classic/touristy rooftops
  (Vertigo & Moon Bar and Sky Bar at Lebua were rejected by the user).
- **Length:** ~1000-1150 words, English.
- **Hero:** a designed Bangkok-skyline-at-dusk image in the Bisou palette
  (bordeaux + cream), landscape — not a stock photo. Generated and committed at
  `static/assets/photos/web/bangkok-rooftops-1920.jpg` (+ `-960`). Default 16:10
  hero (no `heroFit: portrait`).
- **No ranking / numbers.** Venues woven into prose.

## Venues (facts verified via web search, June 2026)

1. **Bar.Yard** — Kimpton Maa-Lai Bangkok, 40th floor, **on Soi Langsuan**
   (same street as Bisou). Pan-Latin / Nikkei kitchen, garden-party vibe,
   sunset views. The proximity hook.
2. **Spire Rooftop Bar** — Dusit Thani Bangkok, 39th floor, edge of Silom
   across Lumphini Park; reopened Sept 2024 as part of Dusit Central Park; set
   below the hotel's golden spire, 360° views.
3. **Penthouse Bar + Grill** — Park Hyatt Bangkok, rooftop on the 36th floor
   (top of three levels), Ploenchit / Central Embassy; alfresco garden bar.
4. **Sky Beach / Ojo** — King Power Mahanakhon, Silom. Sky Beach (78th, the
   highest rooftop bar in Bangkok / SE Asia, DJs, glass floor) and Ojo (76th,
   modern Mexican by chef Paco Ruano).
5. **Pastel** — Aira Hotel, 22nd floor, Sukhumvit Soi 11 (Nana). Mediterranean
   dining + bar, pastel/neon design, DJs, sunset terrace.
6. **Tribe Sky Beach Club** — top floor of EmSphere, Sukhumvit (Phrom Phong).
   Rooftop beach club: beach beds, palms, DJs.
7. **Tichuca** — 46th floor, T-One Building, Sukhumvit 40 (Ekkamai). The
   jungle-temple rooftop with the signature glowing LED tree.

Descriptions stay evocative but accurate. No invented prices or hours.

## Structure (H2 outline)

1. **Intro** (2 short paragraphs) — keyword early; the hook: dinner at Bisou is
   over but the night isn't, and Soi Langsuan sits in the middle of Bangkok's
   best rooftops.
2. **H2 — Steps from the table: Soi Langsuan** → Bar.Yard (Kimpton Maa-Lai).
3. **H2 — A few minutes away: Lumphini & Ploenchit** → Spire (Dusit Thani),
   Penthouse Bar + Grill (Park Hyatt).
4. **H2 — Up in Silom** → Sky Beach + Ojo (King Power Mahanakhon).
5. **H2 — Out east: Sukhumvit** → Pastel (Soi 11), Tribe Sky Beach Club
   (EmSphere), Tichuca (Ekkamai).
6. **H2 — Start the night at Bisou** → close: have dinner first; reservation +
   menu links; keyword wrap-up.

## Frontmatter

- `slug`: best-rooftop-bars-bangkok
- `title` (on-page H1): The Best Rooftop Bars in Bangkok, for After Dinner
- `seoTitle`: The Best Rooftop Bars in Bangkok: Where to Go After Dinner · Bisou
- `category`: City Guide
- `hero`: /assets/photos/web/bangkok-rooftops-1920.jpg
- `heroAlt`: A Bangkok skyline at dusk
- `excerpt` + `seoDescription`: contain "best rooftop bars in Bangkok" + the
  after-Bisou angle.
- `publishedAt`: 2026-06-06 · `readMin`: 5 · `author`: Bisou Bangkok

## SEO

- Keyword "best rooftop bars in Bangkok" (and natural variants "best rooftop in
  Bangkok", "rooftop bars in Bangkok") in: title, H1, seoTitle, seoDescription,
  first paragraph, a couple of H2s, and the closing line. Natural density, no
  stuffing.
- **Internal links:** "dinner at Bisou" → `/`, "our menu" → `/menu`, the
  reservation URL on the closing CTA.
- **External links:** each venue name links to its official site, opening in a
  new tab (the markdown pipeline already adds target/rel + lazy-loads images).
- The post becomes the newest journal entry (sorts above the LSA post). It will
  appear on the home journal section and the `/journal/` index automatically.

## Out of scope

- Vertigo & Moon Bar, Sky Bar at Lebua (explicitly excluded).
- Numbered ranking / "top N" framing.
- Any new build-script or template changes — this rides the existing markdown
  journal pipeline. (Optionally add the post to `sitemap.xml`.)

## Success criteria

- Reads as a genuine, trendy Bangkok rooftop guide, not a listicle.
- All venue facts accurate.
- Renders cleanly (cream theme, H2s, landscape hero) on desktop + mobile.
- Targets "best rooftop bangkok" without keyword stuffing.
