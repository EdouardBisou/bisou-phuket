---
title: The headline shown as the H1 on the article page
slug: url-slug-kebab-case
category: Press
publishedAt: 2026-05-08
readMin: 2
hero: /assets/photos/web/hero-dining-kisses-1920.jpg
heroAlt: Describe the hero photo for screen readers and SEO
excerpt: One or two sentences shown on the home and journal index cards, and used as the meta description fallback. Keep under ~280 characters.
seoTitle: A longer keyword-rich title used only in the browser tab and search results
seoDescription: ~155 characters, used as the meta description and Open Graph description.
author: Bisou Phuket
authorRole:
draft: true
---

The opening paragraph. Write in the Bisou voice: confident, warm, modern
French, no em dashes. The body is plain Markdown.

## Use H2 for each section (good for SEO)

Paragraphs, **bold**, *italics*, and [links](https://example.com) all work.
External links automatically open in a new tab. Inline images are lazy-loaded:

![Alt text](/assets/photos/web/some-image-1920.jpg)

> Blockquotes render as a bordeaux pull-quote.

- Bullet lists
- work too

Notes:
- This file is named with a leading underscore and has `draft: true`, so the
  build skips it. Copy it to `content/journal/<slug>.md`, set `draft: false`
  (or remove the line), and fill in the real content.
- `hero` should point to an image in `static/assets/photos/web/`. If a
  `<name>-1920.<ext>` and `<name>-960.<ext>` pair exists, the build emits a
  responsive srcset automatically.
- Newest `publishedAt` sorts first on the index and home.
- Styling comes from `static/journal/post.css` (the `.jp-body` rules), so every
  article matches the site design with no per-post CSS.

SEO/GEO (or just run `/add-article` to automate all of this):
- `seoTitle` <= 60 chars with the keyword near the front; `seoDescription` 140 to 160 chars.
- Use H2/H3 with keywords and natural questions; add a `## FAQ` (one `### question` per item) when it fits, for snippets and AI answer-engines.
- Link to at least 2 internal pages (`/menu`, `/private-events/`, or another article).
- Weave the location naturally (Cherngtalay, Bang Tao, Laguna, Phuket). Never invent facts; no Michelin claim.
