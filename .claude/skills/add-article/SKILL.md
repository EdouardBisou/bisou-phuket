---
name: add-article
description: Create a new SEO/GEO-optimized journal article for the Bisou Phuket website. Use whenever the user wants to add a journal post, write a blog article, publish to the journal, or says "/add-article". Researches the topic across sources, writes in Bisou's brand voice, generates the markdown with full SEO frontmatter, publishes to content/journal, rebuilds and deploys. Invoke with "/add-article <topic or title>" and optionally a target keyword.
---

# Add a Bisou Phuket journal article (SEO/GEO first)

The journal lives as Markdown in `content/journal/*.md` (NOT Sanity). The build
(`scripts/build-site.mjs`) renders each post to `/journal/<slug>/` with Article +
BreadcrumbList JSON-LD and twitter cards (from `templates/journal/_post.html`),
and adds it to the build-time `sitemap.xml` with `lastmod`. Format reference:
`content/journal/_TEMPLATE.md`.

This is the priority workflow: SEO/GEO is non-negotiable before publishing.

## Hard rules
- **NO em dashes (—) anywhere.** Ever. Use commas, colons, parentheses. (Project-wide rule.)
- Copy in **English**.
- **Brand voice**: modern French, "simple & sexy", romantic and understated-confident, editorial. The restaurant is in **Cherngtalay, Phuket** (No.4 Bandon-Cherngtalay Rd, Choeng Thale, Thalang). Co-founders: Antoine Darquin (chef) and Théo Lavergne (sommelier); Phuket co-owners Louis Chartier (GM) and Manon Bares (head chef, runs the kitchen). Signatures: truffle French toast, house Beef Wellington, salt-crust seabass flambeed at the table, caviar linguine. Dinner nightly, 5:30 PM to midnight.
- **Never invent facts** (names, dates, prices, awards). Phuket is NOT in the Michelin Guide: do not claim it. Research, verify, and if unsure, omit.
- **No stock photos.** Use an existing image in `static/assets/photos/web/`, or flag that the owner must supply a hero.

## Workflow

1. **Scope**: take the topic and a target keyword. If missing, ask ONE clarifying question (topic + primary keyword). Choose a `category` (e.g. Chef notes, Cellar, Seasonal, Guide, Dispatch).

2. **Research** (3 to 6 web searches): the keyword's search intent, what currently ranks, verifiable facts, and a Phuket / Cherngtalay / Bang Tao / Laguna local angle. Keep 2 to 3 credible sources. Triple-check every fact, date, name, and number.

3. **SEO/GEO plan** (decide before writing):
   - `seoTitle`: <= 60 chars, primary keyword near the front, brand at the end.
   - `seoDescription`: 140 to 160 chars, keyword + hook + Phuket relevance.
   - `slug`: short kebab-case, keyword-bearing, no stop-word filler.
   - Headings: H2/H3 carrying secondary keywords and natural questions (snippets + AI).
   - Internal links: at least 2 (`/menu`, `/private-events/`, `/`, or another article).
   - Location: weave Cherngtalay / Bang Tao / Laguna / Phuket naturally, no stuffing.
   - If the topic suits Q&A, add a `## FAQ` with 2 to 4 `### Question` blocks (great for GEO and featured snippets).
   - Length 500 to 900 words, scannable.

4. **Hero image**: pick an existing `static/assets/photos/web/<name>-1920.jpg` that fits the topic (the build derives the `-960` sibling for srcset). Set `hero`, a descriptive keyword-bearing `heroAlt`, and `heroFit: portrait` if the source is portrait. If nothing fits, leave `hero` empty and tell the owner a hero photo is needed (do not download stock).

5. **Write** `content/journal/<slug>.md` with flat `key: value` frontmatter matching `_TEMPLATE.md`:
   `title, slug, category, publishedAt (today YYYY-MM-DD), readMin, hero, heroAlt, heroFit?, excerpt (~150 chars), seoTitle, seoDescription, author (Bisou Phuket or a named person), authorRole`.
   Then the Markdown body: opening hook, H2/H3 sections, internal links, optional `## FAQ`. Set `draft: true` while iterating; remove it (or set false) to publish.

6. **Build + verify**: `npm run build`. Confirm `dist/journal/<slug>/index.html` exists, the Article + BreadcrumbList JSON-LD and `<title>`/meta/canonical/og resolve (no leftover `{{...}}`), and the post is in `dist/sitemap.xml`.

7. **Deploy**: `git add -A`, commit (clear English message ending with `Co-Authored-By: Claude`), `git push` (Vercel auto-deploys). Give the user the live URL.

## Pre-publish checklist
- [ ] Zero em dashes.
- [ ] seoTitle <= 60; seoDescription 140 to 160; both unique and keyword-rich.
- [ ] Clean keyword slug; canonical/og/Article schema all resolve in `dist`.
- [ ] >= 2 internal links; location terms present naturally.
- [ ] One H1 (from title) + structured H2/H3 in body.
- [ ] Every fact verified against a source; no fabrication; no Michelin claim.
- [ ] Hero image exists (or owner flagged); `heroAlt` descriptive.
- [ ] Appears in `dist/sitemap.xml` with `lastmod`.
