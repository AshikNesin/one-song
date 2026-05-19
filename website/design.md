# Design — One Song

A locked design system for this site. Every page redesign reads this file before emitting code. Do not regenerate per page — extend or amend this file when the system needs to grow.

## Genre
modern-minimal (with editorial warmth — the app is intimate and personal)

## Macrostructure family

- Marketing pages (`index.html`): **Letter** — first-person, intimate, founder's voice leads. No buttons in the fold. The story earns the CTA.
- Content pages (`architecture.html`, `privacy.html`): **Long Document** — reads like a memo, continuous prose with inline section heads.

## Theme

Custom OKLCH palette anchored on warm oat (hue 75).

- `--color-paper`    `oklch(97% 0.008 75)` — warm off-white
- `--color-paper-2`  `oklch(93% 0.012 75)` — slightly deeper warm surface
- `--color-paper-3`  `oklch(89% 0.014 75)` — hover/active surface
- `--color-rule`     `oklch(82% 0.010 75)` — warm border
- `--color-muted`    `oklch(55% 0.008 75)` — warm secondary text
- `--color-ink`      `oklch(18% 0.012 75)` — warm near-black (never pure #000)
- `--color-accent`   `oklch(52% 0.16 35)`  — warm amber/terracotta
- `--color-focus`    `oklch(55% 0.19 35)`  — focus ring

## Typography

- Display: **Instrument Serif** (Google Fonts) — tight contrast, intimate editorial, italic available
- Body: **Geist** (Google Fonts) — clean, modern grotesque; replaces banned Inter
- Outlier: **Geist Mono** (Google Fonts) — code blocks in architecture page only (≤ 2 slots)
- Display tracking: `letter-spacing: -0.02em`
- Type scale anchor: `--text-display: clamp(2.5rem, 5vw + 1rem, 4rem)`

## Spacing

4-point named scale. Pages use named tokens (`var(--space-md)`), never raw values.

```
--space-3xs: 0.125rem   (2px)
--space-2xs: 0.25rem    (4px)
--space-xs:  0.5rem     (8px)
--space-sm:  0.75rem    (12px)
--space-md:  1rem       (16px)
--space-lg:  1.5rem     (24px)
--space-xl:  2.5rem     (40px)
--space-2xl: 4rem       (64px)
--space-3xl: 6rem       (96px)
```

## Motion

Motion-cut project. No motion library installed.

- Easings: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` · `--ease-in: cubic-bezier(0.7, 0, 0.84, 0)`
- Durations: `--dur-short: 180ms` · `--dur-med: 280ms`
- Reveal pattern: none — Letter and Long Document are default-off archetypes
- Reduced-motion fallback: opacity-only, ≤ 150ms

## Microinteractions stance

- Silent success (no celebratory toasts)
- Hover delay 800ms · focus delay 0ms on tooltips
- Button press: `translateY(1px)` on `:active`, 100ms
- CTA hover: `translateY(-1px)` + ink/paper swap, 180ms `--ease-out`
- Focus rings: instant, 2px solid `var(--color-focus)`, offset 3px — never animated

## CTA voice

- Primary CTA: filled ink background, warm paper text, no border-radius (rectangular), `font-family: var(--font-body)`, weight 500
- Secondary CTA: typographic link with arrow, no box, no fill
- Store badge: image link, no custom styling beyond hover lift

## Nav — N9 Edge-aligned minimal

Wordmark hard-left (logo + "One Song" in Instrument Serif italic), single "Get on Google Play" store badge hard-right, vast empty space between. No link row. Sticky on scroll with warm paper backdrop.

## Footer — Ft6 Letter close

Closes the page like a letter. Format:
```
— Ashik, Dad & Developer. 2026.
```
Minimal links (Home · Architecture · Privacy) in small muted type beneath. No columns, no social icons.

## What pages MUST share

- The wordmark (logo SVG + "One Song" in Instrument Serif italic)
- The warm oat palette and accent placement (≤ 5% per viewport)
- Instrument Serif display + Geist body
- CTA voice (rectangular filled ink button)
- N9 nav + Ft6 footer

## What pages MAY differ on

- Macrostructure within the page-type family
- Section rhythm and prose density
- Presence of code blocks (architecture page only)

## Exports

### tokens.css
```css
/* Hallmark · genre: modern-minimal · design-system: design.md · designed-as-app */
:root {
  --color-paper:    oklch(97% 0.008 75);
  --color-paper-2:  oklch(93% 0.012 75);
  --color-paper-3:  oklch(89% 0.014 75);
  --color-rule:     oklch(82% 0.010 75);
  --color-muted:    oklch(55% 0.008 75);
  --color-ink:      oklch(18% 0.012 75);
  --color-accent:   oklch(52% 0.16 35);
  --color-focus:    oklch(55% 0.19 35);

  --font-display: "Instrument Serif", Georgia, serif;
  --font-body:    "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-outlier: "Geist Mono", ui-monospace, monospace;

  --space-3xs: 0.125rem;
  --space-2xs: 0.25rem;
  --space-xs:  0.5rem;
  --space-sm:  0.75rem;
  --space-md:  1rem;
  --space-lg:  1.5rem;
  --space-xl:  2.5rem;
  --space-2xl: 4rem;
  --space-3xl: 6rem;

  --text-xs:      0.75rem;
  --text-sm:      0.875rem;
  --text-base:    1rem;
  --text-md:      1.125rem;
  --text-lg:      1.375rem;
  --text-xl:      1.75rem;
  --text-2xl:     2.25rem;
  --text-display: clamp(2.5rem, 5vw + 1rem, 4rem);

  --ease-out:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:    cubic-bezier(0.7, 0, 0.84, 0);
  --dur-short:  180ms;
  --dur-med:    280ms;

  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;

  --z-base:     1;
  --z-raised:   10;
  --z-dropdown: 100;
  --z-sticky:   200;
  --z-modal:    400;
  --z-toast:    500;
}
```
