# Bisou Phuket

Official website for Bisou Phuket, a modern French restaurant in Phuket.

Live: https://bisouphuket.com

## Project structure

```
bisou-phuket/
├── templates/             Source HTML (build script injects Sanity content)
│   ├── index.html
│   ├── private-events/
│   ├── team/
│   └── journal/
├── static/                Shared assets copied as-is to dist/
│   ├── css/main.css
│   ├── js/main.js
│   ├── assets/            Photos, fonts, favicon, brand marks
│   ├── sitemap.xml
│   └── robots.txt
├── scripts/
│   ├── build-site.mjs     Production build (Vercel runs `npm run build`)
│   ├── sanity-fetch.mjs   Sanity content fetcher
│   ├── seed-team.mjs      One-shot team member seeder
│   ├── seed-journal.mjs   One-shot journal article seeder
│   └── compress-photos.py Photo optimization (Pillow)
├── sanity/                Sanity Studio schemas (deployed at bisoubangkok.sanity.studio)
└── seed-data/             Original scraped content for reference
```

## Development

```bash
# Install
npm install

# Build the site (output to dist/)
npm run build

# Serve locally
python -m http.server 4311 --directory dist

# Open
open http://localhost:4311
```

## Deploy

- Push to `main` on GitHub → Vercel auto-deploys
- Build command: `npm run build`
- Output directory: `dist`

## Sanity Studio

```bash
# Edit schemas in sanity/schemas/
# Local development of the studio
npm run sanity:dev

# Push schema changes to the deployed studio
npm run sanity:deploy
```

Studio lives at https://bisoubangkok.sanity.studio.

## Brand identity

- Palette: cream paper (#FFF8EF), ink noir (#0E0E0E), deep bordeaux (#6E1F2A)
- Display font: Champagne & Limousines (self-hosted in `static/assets/fonts/`)
- Sans body: Jost (Google Fonts)
- Hero motif on home: kiss-wall composite (desktop) + cinematic vertical video (mobile)
- Marquee: bordeaux background, Impact font, all caps

## Content sources

- Menu, team, journal posts, opening hours, contact info → fetched from Sanity at build time
- Falls back to hardcoded values in `scripts/build-site.mjs` if Sanity is unreachable
