# Bisou Phuket: site facts

Single source of truth for the `/add-article` skill (and any content work) in this repo. The skill reads this file in Step 0. Keep it accurate and current. Verified June 2026 against this repo.

> Hard rule for all copy: never use em dashes or en dashes. Use commas, periods, colons, or parentheses. Ordinary hyphens in compound words are fine.

## Identity

- **Name / meaning**: Bisou (Bisou Phuket). "Bisou" is French for "kiss".
- **Concept**: a modern French restaurant and cocktail bar, plated to share. Candlelight, a bar you actually want to sit at, and French cooking that feels generous rather than fussy.
- **Tagline**: simple & sexy.
- **Year opened**: 2025 (the site brands it "Est. 2025"). Founded in 2025 by chef Antoine Darquin and sommelier Théo Lavergne.
- **Room**: kiss wall, spiral staircase, cocktail bar.

## Location and contact (canonical NAP)

- **Address**: No.4 Bandon-Cherngtalay Rd, Choeng Thale, Thalang, Phuket 83110.
- **Area**: Cherngtalay, on Phuket's west coast, a short drive from Laguna, Boat Avenue and Bang Tao Beach.
- **Nearest landmarks** (Phuket has no train): Laguna Phuket, Boat Avenue, Bang Tao Beach.
- **Hours**: dinner nightly, 6:00 PM to 1:00 AM (the cocktail bar runs throughout; last food order around 11 PM).
- **Phone**: +66 96 378 9668
- **Email**: contact@bisouphuket.com
- **Reservations**: https://book.bistrochat.com/bisou-phuket
- **Site URL**: https://bisouphuket.com
- **Socials**: Instagram instagram.com/bisouphuket

## People

- **Antoine Darquin**: Chef and co-founder (also co-founded Bisou Bangkok).
- **Théo Lavergne**: Sommelier and co-founder (also co-founded Bisou Bangkok).
- **Manon Bares**: Head Chef (runs the kitchen).
- **Louis Chartier**: General Manager (looks after the room).

## Recognition

- **None to date.** Bisou Phuket is **NOT in the MICHELIN Guide.** Never write or imply that Bisou Phuket is Michelin-listed, Michelin-selected, or Michelin-starred. **But do NOT volunteer the negative either (owner rule, 2026-07): never write sentences like "Bisou is not in the MICHELIN Guide" in article prose or FAQs. Simply stay silent about Michelin for Bisou. A neutral "Not listed" cell in a comparison table's MICHELIN column is acceptable.**
- For context only (do not attribute to Bisou): Phuket's single MICHELIN Star is PRU at Trisara (not French). The French restaurant listed in the MICHELIN Guide Thailand 2026 (Selected) is L'Arôme by the Sea above Kalim, a different restaurant.

## First-party data (use only verified numbers)

- Founded 2025. Dinner nightly 6:00 PM to 1:00 AM. Prices in THB (Sanity menu is the source of truth for current prices).
- Do NOT reuse Bangkok's figures (covers per night, follower count, Google rating, awards). Those are Bangkok-only. If you want to cite a Phuket-specific number (covers, followers, reviews, capacity), confirm it with the owner first, then add it here.

## Signature dishes

Truffle French toast; house beef Wellington; whole seabass in salt crust, flambeed at the table; black truffle pasta. (Confirm current dishes against the Sanity menu.)

## Existing journal posts (for internal links / topic cluster)

- `/journal/best-french-restaurants-phuket` (the strongest existing guide; read it before writing)
- `/journal/where-to-eat-bang-tao`
- `/journal/best-beach-clubs-phuket`
- `/journal/cocktail-bar-cherngtalay`

Conversion pages to link toward: `/` (home), `/menu`, `/private-events`.

## Build / CMS

- **Sanity**: projectId `5oq4q4y4`, dataset `production` (public CDN reads, fetched at build time).
- **Cover generator**: `scripts/build-cover.mjs`. **Preview**: `scripts/build-article-preview.mjs`.
- The `dist/llms.txt` site blurb is generated in `scripts/build-site.mjs` (renderLlmsTxt). If the facts above change materially, update that blurb too so they stay in sync.

## Cover photo bank (local, in static/assets/photos/web, use the -1920 file)

- `exterior-night-1920.jpg` (facade at night; neighbourhood/location guides)
- `phuket-beach-sunset-1920.jpg` (beach / west-coast / Bang Tao topics)
- `dishes-spread-1920.jpg` (food / French guides)
- `hero-dining-kisses-1920.jpg`, `kiss-wall-1920.jpg` (date night / romance)
- `cocktail-bar-1920.jpg` (cocktails / bar)
- `cellar-red-1920.jpg`, `bathtub-wine-1920.jpg` (wine)
- `antoine-kitchen-1920.jpg`, `founders-1920.jpg`, `theo-portrait-1920.jpg`, `antoine-portrait-1920.jpg` (chef / team)
- `spiral-staircase-1920.jpg`, `private-room-portrait-1920.jpg` (room / private events)

Dish photos live on this repo's Sanity (project `5oq4q4y4`); pass the asset id to build-cover.mjs and it fetches from the CDN. Never use AI or stock images, and never reuse another article's base photo.

## Brand voice

Confident, warm, modern French, sensual but precise; "simple & sexy". Short sentences mixed with longer ones, active voice, real names and concrete details. Earned credibility over hype. Banned clichés: nestled, hidden gem, culinary journey, elevated, fusion, melt-in-your-mouth, foodie, must-visit, a feast for the senses, gastronomic, reimagined, curated experience, vibes, iconic, world-class, stunning, boasts.

## Sister location

Bisou's first restaurant is **Bisou Bangkok** (Soi Langsuan), which IS in the MICHELIN Guide Thailand 2026 (Selected). That recognition belongs to Bangkok only. Keep the two locations' facts separate, and never carry Bangkok's Michelin status over to Phuket.
