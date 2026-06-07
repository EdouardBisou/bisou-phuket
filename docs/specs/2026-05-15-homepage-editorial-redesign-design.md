# Homepage Editorial Redesign — "Le Journal de Bisou"

Date: 2026-05-15
Status: Approved (verbal), implementation pending

## Problem

The current homepage reads as generic "dark luxury restaurant": near-black
background end to end, gold accents, serif display, glassmorphism pills. Every
upscale restaurant site looks like this. It uses only 2 of the 7 brand colors
and ignores the brand's stated signature motif (bold black & white vertical
stripes).

## Goal

Give the site a unique, recognizable personality without changing structure,
concept, content, menu, dish photos, or the hero video. Keep the existing brand
palette tokens exactly. Change the visual language only.

## Preserved (do not touch)

- Brand palette tokens in `main.css` (`--noir`, `--gold`, `--olive`,
  `--mustard`, `--ocre`, `--peach`, `--cream`, etc.)
- All section structure and order: hero, marquee, concept, menu, team, journal,
  reserve, private-events CTA, footer
- All copy and content
- Menu data + dish photos
- Team content
- The hero `<video>`
- The Sanity build pipeline (`BUILD:` markers, mustache vars)

## The five design moves

1. **Stripe signature.** A bold vertical black/cream stripe motif (a Parisian
   brasserie awning) becomes the connective thread. A thin striped band caps
   the top of the page; slim striped rules separate major sections. Pure CSS
   (`repeating-linear-gradient`), no images.

2. **Warm sections, not an all-black tunnel.** Alternate cinematic dark sections
   with warm "paper" sections so the page has rhythm:
   - Hero: dark (video)
   - Marquee: olive band (kept)
   - Concept (01): warm cream "paper", dark text — the big breathe moment
   - Menu (02): dark cinematic (dish photos pop on dark), ocre/mustard accents
   - Team (03): warm — soft olive tint
   - Journal (04): cream "paper"
   - Reserve: dark, peach accent — the CTA crescendo
   - Footer: dark, striped top edge

3. **Editorial typography.** Champagne display font at magazine scale. Each
   major section gets a numbered index label ("01 — Le Concept", "02 — La
   Carte") set in tracked uppercase sans, like a French revue contents page.

4. **Asymmetric layouts.** Break the everything-centered monotony. Offset text
   columns, images that bleed off one edge, a magazine-style grid on concept
   and team. Centered stays only where it earns it (hero, reserve).

5. **The kiss stamp.** A small lip/kiss-mark SVG used as a recurring brand
   stamp — beside section numbers and as a divider accent. Ties the visual
   system to the name "Bisou".

## Color usage rules

- Dark sections: `--noir` family backgrounds, `--cream` text, `--gold` hairline
  accents (as today).
- Paper sections: `--cream` background, `--noir` text, `--olive`/`--ocre`
  section-number and accent color.
- `--peach` reserved for the Reserve section accent and primary CTA emphasis.
- `--olive` used as a full section background (marquee, team tint).
- Stripes: `--noir` and `--cream` only.
- No new colors introduced.

## Section-by-section homepage treatment

- **Top edge:** ~10px striped awning band, fixed above the nav.
- **Hero:** keep video + wordmark. Add a thin striped frame inset and an
  editorial label ("Langsuan, Bangkok / Modern French"). Stays dark.
- **Marquee:** keep the olive band; restyle type to editorial weight.
- **Concept (01):** invert to cream paper. Big "01" index + kiss stamp.
  Asymmetric: heading left, manifesto offset right. Dark text.
- **Menu (02):** stays dark. "02" index in ocre. Dish photos unchanged.
- **Team (03):** soft olive-tinted section. "03" index. Magazine grid.
- **Journal (04):** cream paper. "04" index. Editorial card list.
- **Reserve:** dark, peach accent, striped rule above. Confident CTA block.
- **Footer:** dark, striped top edge.

## Scope

Phase 1: homepage only (`templates/index.html` + `static/css/main.css`, plus
`static/js/main.js` only if a motif needs JS). Ship and review live.

Phase 2 (after the direction is confirmed on the homepage): propagate the same
visual language to `/private-events/`, `/journal/`, and the menu/other pages.

## Technical approach

- Edit `static/css/main.css` section by section. The brand tokens stay; new
  rules layer the editorial system on top.
- Edit `templates/index.html` to add section-index labels, the kiss stamp SVG,
  and any wrapper elements needed for asymmetric layouts. Keep all `BUILD:`
  markers and mustache vars intact.
- Stripe motif and kiss stamp are pure CSS / inline SVG — no downloaded assets,
  consistent with the no-external-images constraint.
- Verify at mobile (375) and desktop (1280) before shipping.

## Risks

- Cream "paper" sections must hit strong contrast for accessibility; body text
  on cream uses `--noir`, not a mid-grey.
- The stripe motif can get loud; keep stripes thin and used as accents, not
  full backgrounds.
- Mobile: asymmetric layouts collapse to a single clean column; section-index
  labels stay but shrink.
