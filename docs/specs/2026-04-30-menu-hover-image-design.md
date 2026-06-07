# Menu dish hover image — design

**Date:** 2026-04-30
**Status:** Approved, ready for implementation plan
**Scope:** Static site (`static/`) with forward-compatible Sanity schema

## Goal

Make the menu visceral. When a guest hovers a dish on desktop or taps one on mobile, they see the dish. Until staff can upload real photographs through Sanity, every dish shows a "Coming soon" placeholder of identical dimensions, so the layout never shifts when real photos arrive.

## User-facing behavior

### Desktop (hover)

1. Cursor enters a `.menu__item` row.
2. A 240×170 image card fades in over 200ms, positioned 20px to the right and below the cursor.
3. Cursor moves → card follows with a per-frame lerp at factor 0.2 (each rAF frame, position moves 20% of the remaining distance to the target). Movement feels weighted, not jittery.
4. If the card would clip the right or bottom viewport edge, it flips to the opposite side of the cursor.
5. Cursor leaves the row → card fades out 200ms.
6. Only one card is visible at any time. Moving from one dish to another animates the same card; it does not stack.

### Mobile (tap)

1. Tap a `.menu__item` row.
2. Bottom sheet slides up from the bottom over 300ms with ease-out.
3. Sheet contents: image (or placeholder), dish name, price, priceNote.
4. Backdrop dims to 60% black behind the sheet.
5. Drag the sheet handle down OR tap the dim backdrop → sheet slides down and dismisses.
6. While the sheet is open, the source dish row stays subtly highlighted.

### Mode selection (hover vs sheet)

Decided once at page load with `matchMedia('(pointer: coarse)').matches`. Coarse pointer (phones, tablets) → sheet mode. Fine pointer (mouse, including touch-screen laptops with a mouse) → hover mode. The mode is not re-evaluated on resize; reload required to switch. Touch-screen laptops use hover mode and behave normally; tapping a dish there still triggers hover via the underlying mouse simulation, so behavior is consistent.

### Placeholder card

Used when `image` is null. Identical frame and dimensions as a real image.

- Background: `#0e0e0e` with a soft radial gold glow at 30% 30% (rgba 229,207,145, 0.15).
- Centered: outline camera icon, ~28×22px, color `#6a6a6a`, 1px stroke.
- Below icon: "COMING SOON" in 9px, letter-spacing 0.3em, uppercase, color `#8a7a55`.
- 1px border `rgba(229,207,145,0.2)`, border-radius 4px.
- Subtle paper-grain texture via two radial-gradient dot patterns.

## Architecture

### Data shape

Add a single field to every entry in the `MENU` array in [`static/js/main.js`](static/js/main.js):

```js
{
  name: 'Beef tartare & potato millefeuille',
  price: 220,
  note: 'caviar +400',
  image: null  // null = placeholder. Future: '/assets/menu/beef-tartare.jpg' or Sanity URL.
}
```

`null` is the deliberate sentinel for "no image yet — render placeholder." Empty string `""` is treated as null.

### Components in `static/index.html`

Two new top-level elements added once, hidden until activated:

```html
<!-- Desktop floating card -->
<div class="menu-hover" data-menu-hover aria-hidden="true">
  <div class="menu-hover__inner">
    <img class="menu-hover__img" alt="" hidden />
    <div class="menu-hover__placeholder"><!-- camera icon SVG + COMING SOON --></div>
  </div>
</div>

<!-- Mobile bottom sheet -->
<div class="menu-sheet" data-menu-sheet aria-hidden="true">
  <div class="menu-sheet__backdrop"></div>
  <div class="menu-sheet__panel" role="dialog" aria-modal="true">
    <div class="menu-sheet__handle"></div>
    <div class="menu-sheet__image"><!-- img or placeholder --></div>
    <div class="menu-sheet__meta">
      <div class="menu-sheet__name"></div>
      <div class="menu-sheet__price"></div>
    </div>
  </div>
</div>
```

Both elements are reused for every dish. Content swaps; nodes don't churn.

### JavaScript wiring (`static/js/main.js`)

Two new functions wired in the existing `wireMenu` flow:

- **`wireMenuHover()`** — desktop only. Attaches one `mousemove` listener to the menu section, uses event delegation to detect which `.menu__item` is under the cursor, updates card position with rAF-throttled lerp.
- **`wireMenuSheet()`** — touch only. Click delegation on `.menu__item`. Opens sheet with content from the dish's data attributes. Attaches dismiss listeners on backdrop, drag-down, and Escape.

Mode selection follows the rule defined in the desktop/mobile section above. Only one of the two `wire*` functions runs per page load.

### CSS additions (`static/css/main.css`)

- `.menu-hover` block: fixed positioning, transform-translated each frame, opacity 0 default, `transition: opacity .2s var(--ease-luxe)`.
- `.menu-sheet` block: fixed bottom, transform translateY(100%) default, opens to translateY(0).
- `.menu-hover__placeholder` and `.menu-sheet__image .placeholder`: shared placeholder styles.

### Sanity schema update

Add an `image` field to [`sanity/schemas/menuItem.ts`](sanity/schemas/menuItem.ts):

```ts
defineField({
  name: 'image',
  title: 'Dish photograph',
  type: 'image',
  options: { hotspot: true },
  description: 'Optional. When set, replaces the "Coming soon" placeholder on hover.',
}),
```

Today this field has no consumer (the static site reads from the JS array, not Sanity). Adding it now means staff can start populating it the moment the Sanity-backed Next.js site lands (separate migration). The field schema is stable and won't change.

## Files touched

| File | Change |
| --- | --- |
| `static/js/main.js` | Add `image` to every MENU item; add `wireMenuHover` and `wireMenuSheet` |
| `static/index.html` | Add `[data-menu-hover]` and `[data-menu-sheet]` markup once |
| `static/css/main.css` | Add `.menu-hover`, `.menu-sheet`, placeholder styles |
| `sanity/schemas/menuItem.ts` | Add `image` field |

No changes to `components/Menu.tsx` (the unused Next.js scaffold). When the Sanity migration happens, that component will be rebuilt to consume the same data shape.

## Out of scope

- Photographer shoot, real image assets, image optimization pipeline. Staff handles uploads later through Sanity.
- Image lightbox / full-screen view. Sheet and hover card are the only image surfaces.
- Per-dish text descriptions (not requested).
- Wine bottle photo strategy. Same `image` field works whether the photo is plated food, a cocktail glass, or a wine label.
- Migrating the static site to Next.js + Sanity. That is a separate spec already in flight.

## Acceptance

- Hover any dish on desktop → placeholder card appears within 200ms, follows cursor smoothly, fades out on leave.
- Tap any dish on touch device → bottom sheet slides up, dismisses on backdrop tap or drag-down.
- Card never clips outside the viewport on desktop.
- Placeholder is visually consistent across cuisine, cocktails, and cellar tabs.
- Setting `image: '/path/to.jpg'` on any item swaps the placeholder for the real image with zero other code changes.
- Reduced-motion users get instant fade with no lerp/slide animation.

## Reduced motion

Wrap `transform` and `opacity` transitions in `@media (prefers-reduced-motion: no-preference)`. Under reduced motion, card snaps to position, sheet appears instantly. No visual feature is lost.
