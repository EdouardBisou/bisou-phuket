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
- **Edouard Marquis**: Director of Operations, Bisou (across both restaurants; the byline on journal articles).

## Recognition

- **None to date.** Bisou Phuket is **NOT in the MICHELIN Guide.** Never write or imply that Bisou Phuket is Michelin-listed, Michelin-selected, or Michelin-starred. **But do NOT volunteer the negative either (owner rule, 2026-07): never write sentences like "Bisou is not in the MICHELIN Guide" in article prose or FAQs. Simply stay silent about Michelin for Bisou. A neutral "Not listed" cell in a comparison table's MICHELIN column is acceptable.**
- For context only (do not attribute to Bisou): Phuket's single MICHELIN Star is PRU at Trisara (not French). The French restaurant listed in the MICHELIN Guide Thailand 2026 (Selected) is L'Arôme by the Sea above Kalim, a different restaurant.

## First-party data (use only verified numbers)

- Founded 2025. Dinner nightly 6:00 PM to 1:00 AM. Prices in THB (Sanity menu is the source of truth for current prices).
- Do NOT reuse Bangkok's figures (covers per night, follower count, Google rating, awards). Those are Bangkok-only. If you want to cite a Phuket-specific number (covers, followers, reviews, capacity), confirm it with the owner first, then add it here.

## Birthdays and celebrations (owner-confirmed 2026-08-04)

- **Birthday month offer, Phuket only: 10% off the whole bill, for the entire table**, on presentation of an ID showing the guest was born in the current month. Not a birthday-day offer: any dinner during the birth month qualifies. Bisou Bangkok has NO equivalent offer, so never describe this as a group-wide policy.
- **The birthday dessert plate is offered systematically**, at no charge. "Happy Birthday" is piped in chocolate across a large plate, with quenelles, edible flowers and a candle. Guests do not have to ask or pay for it.
- **Guests may bring their own birthday cake, free of charge. There is no cakeage or corkage fee**, and the team will cut and serve it to the guests.
- Bisou Phuket does not sell gift vouchers. Do not mention vouchers in Phuket copy.

## Practical (owner-confirmed 2026-08-23, use for "before you book" questions)

- **Dress code**: smart casual, no flip-flops (worth saying to a table arriving from the beach).
- **Children**: welcome, no minimum age, high chairs available. The room and the later evening are adult in mood (the music lifts as the night goes on), so an early seating suits a table with children best. Do not call Bisou a family restaurant.
- **Parking**: close by the restaurant (the birthday article says "at the rear via the side street").
- **Vegetarian / vegan / allergies**: plenty of vegetarian options; vegan guests are welcome and the kitchen plates dedicated vegan dishes for them. Mention allergies when booking.
- **Walk-ins**: accepted when there is room, booking is better.
- **Bar**: coming just for a cocktail is fine; the bar runs to 1 AM.
- **Languages spoken in the room**: French and Thai (and English, the working language of the site and reservations).
- **Outdoors**: none to write about. **The whole restaurant is indoors (owner-confirmed 2026-09-06): do NOT mention a terrace in Phuket copy.** (The line "There is a terrace in front." still sits in /journal/bisou-phuket-guide and its four translations, to be removed.)
- NOT confirmed, do not write: wine corkage policy or fee, deposit / cancellation / no-show terms, days ahead to book, Google rating / review count / capacity / IG followers, the DJ night weekday or name, any chef sharing menu or a la carte average.

## Signature dishes

Truffle French toast; house beef Wellington, carved at the table (as published in /journal/best-steakhouses-phuket); whole seabass in salt crust, flambéed at the table; black truffle pasta; Prunier caviar service. Cocktails 490 THB (Sanity menu). Warm sourdough and French butter go to every table at no charge (documented in /journal/bread-and-butter-phuket). (Confirm current dishes and prices against the Sanity menu.)
- **Weekly DJ night** (owner-confirmed 2026-07): one night a week a DJ plays. The weekday and the DJ's name are NOT confirmed; never name them.
- **[TO CONFIRM with the owner]**: Sanity teamMember roles list Manon Bares as "Co-Owner & Head Chef" and Louis Chartier as "Co-Owner & General Manager"; the site and articles present them as head chef and GM only. Do not call them co-owners until the owner confirms.

## Existing journal posts (for internal links / topic cluster)

- `/journal/bisou-phuket-guide` (the entity article: the canonical first-party answer about Bisou itself. Link to it whenever an article explains who we are.)
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

Confident, warm, modern French, sensual but precise; "simple & sexy". **Never describe Bisou as "fine dining" (owner rule 2026-08-24): say "modern French restaurant" or modern dining, in every language.** **Never print Edouard Marquis's name or title anywhere public (owner rule 2026-08-24): no byline, no author credit, no first-person "I run operations" prose. Articles sign as Bisou Bangkok / Bisou Phuket.** Short sentences mixed with longer ones, active voice, real names and concrete details. Earned credibility over hype. Banned clichés: nestled, hidden gem, culinary journey, elevated, fusion, melt-in-your-mouth, foodie, must-visit, a feast for the senses, gastronomic, reimagined, curated experience, vibes, iconic, world-class, stunning, boasts.

## Sister location

Bisou's first restaurant is **Bisou Bangkok** (Soi Langsuan, opened 2024), which IS in the MICHELIN Guide Thailand, Selected in both 2025 and 2026. That recognition belongs to Bangkok only. Keep the two locations' facts separate, and never carry Bangkok's Michelin status over to Phuket.
