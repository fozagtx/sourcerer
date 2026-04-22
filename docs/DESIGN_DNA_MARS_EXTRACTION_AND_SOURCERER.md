# Design DNA: Mars Coin landing (extracted) → Sourcerer (Groq system)

This document captures **every identifiable trait** of the reference “Mars Coin” single-page design (retro space / meme coin maximalism), then maps each trait to what **Sourcerer** uses instead under the **Groq-inspired technical minimalism** system.

---

## Part A — Mars Coin design system (full DNA extraction)

### A1. Brand & narrative

| Trait | Detail |
|--------|--------|
| Product name | “Mars Coin” |
| Metaphor | Mars / space colonization, alien landscape, “to the moon” adjacent |
| Tone | Hype-forward, comic/sci-fi, retail crypto energy |
| Copy posture | Promotional, urgency, meme-friendly |

### A2. Color palette (observed roles)

| Token (descriptive) | Usage | Approximate role |
|---------------------|--------|------------------|
| Deep forest / space teal-green | Primary section backgrounds, footer bars, card fills | Dominant cool dark |
| Rust / Martian red-orange | Ground planes, dividers, hero band, coin body | Warm accent + structural blocks |
| Bright red-orange | Primary headings, key CTAs, coin highlights | Highest saturation accent |
| White | Body copy, outline strokes on display type, button labels | Primary text on dark |
| Dark green (card) | Inner surfaces for About / Tokenomics / Disclaimer | Nested surface |
| Vertical gradients | Background stacks (space-teal → martian red) | Atmosphere, not flat UI |

**Implication:** High contrast **cool dark + hot orange**, **illustration-driven**, **not** warm off-white product chrome.

### A3. Typography

| Role | Treatment |
|------|-----------|
| Hero / display | Heavy, rounded, “bubble” display face; **3D / extrusion**; **thick white outline** on red fill; drop shadow |
| Section titles | Same bubble style, often on **diagonal color bands** |
| Body | Clean sans, **white**, medium weight on dark green |
| Nav / buttons | Small, **bold**, **all-caps** sans |

**Implication:** Display type is **ornament** (outline, shadow, 3D). Hierarchy is **loud**, not airy.

### A4. Shape language

| Element | Shape |
|---------|--------|
| Primary buttons | Small **rounded-rectangle**, not full pill |
| Nav pills | **Red** fills, **white** label |
| About cards | **Tombstone / arch** (rounded top, flat bottom) |
| Disclaimer | Large rectangle with **slight rotation** (tilted card) |
| Section breaks | **Diagonal / slanted** color bands |

**Implication:** **Expressive geometry** (arches, tilt, diagonals), not neutral 20px rounded rects.

### A5. Layout & composition

| Section | Structure |
|---------|-----------|
| Hero | Massive centered **wordmark** over **full-width illustration** (Martian terrain, spires, green sky) |
| About | **2×2 staggered** arch cards; each: **3D coin**, red subheading, white body |
| Tokenomics | Space backdrop + **planet** graphic; **large numeric supply**; taxes in **heavy bordered** dark panel |
| Disclaimer | Tilted panel + **Buy / Twitter** buttons |
| Chrome | **Top + bottom** nav bars (duplicated navigation pattern) |

**Implication:** **Illustration-first** vertical storytelling; grids are **playful**, not 12-col corporate.

### A6. Imagery & assets

| Asset | Role |
|-------|------|
| 3D “MARS” coin | Repeated hero object, card icons, brand anchor |
| Comic / poster illustrations | Environment storytelling |
| Stars / planets | Section theming |

**Implication:** Brand = **object + scene**, not logo + whitespace.

### A7. Motion & interaction (inferred)

| Trait | Likely |
|-------|--------|
| Transitions | Not specified; static poster-like composition |
| Hover | Button color flip possible; no “performance UI” cues |

### A8. Elevation & borders (inferred)

| Trait | Detail |
|-------|--------|
| Cards | Light border on dark green (thin, often light green outline) |
| Depth | Relies on **illustration + 3D type**, less on subtle CSS shadow |

---

## Part B — Sourcerer canonical system (Groq-inspired)

### B1. Principles (replacement DNA)

- **Warm off-white** page (`#F3F3EE`), **charcoal** text (`#2D2F33`), **never** pure black / stark white as default.
- **One dominant CTA color:** burnt orange `#F43E01`; hover dark `#C23101`; primary button **inverts** to white fill + orange text on hover.
- **Headings:** Space Grotesk, **weight 300** at large sizes, **negative tracking** (~−0.02em class scale).
- **Eyebrows / labels:** IBM Plex Mono, **12px / 500**, **ALL CAPS**, **letter-spaced**, **orange** `#F43E01`.
- **Interactivity:** **Pill** radius (`1000px`) for buttons and filters; cards **`~1.429rem`** radius; **1px** border `rgba(0,0,0,0.2)`.
- **Voice:** Blunt, performance-obsessed, no corporate fluff (applied in marketing strings).
- **Fluorescent accents** (green, yellow, blue, purple, pink): **data / badges / chart**, not primary chrome.
- **No:** bubble 3D type, diagonal section bands, tombstone cards, tilted panels, martian gradients, duplicated top/bottom nav as brand pattern, illustration-first hero.

### B2. Implementation surface

| Layer | Where |
|--------|--------|
| Tokens | `apps/web/tailwind.config.ts` |
| Global base + wallet overrides | `apps/web/src/app/globals.css` |
| Fonts | `apps/web/src/app/layout.tsx` (`next/font`: Space Grotesk, IBM Plex Mono) |
| Components | `apps/web/src/components/*`, `apps/web/src/app/*` |

---

## Part C — DNA strip checklist (Mars out → Groq in)

| # | Mars DNA | Sourcerer action |
|---|----------|------------------|
| 1 | Deep green / teal page dominance | **Strip:** use `bg-page` cream |
| 2 | Martian red gradient atmospheres | **Strip:** flat cream + white cards; optional subtle `shadow-elev1/2` |
| 3 | Bubble 3D outlined display type | **Strip:** `font-light` / `text-hero` scale, no outline effect |
| 4 | White body on dark green | **Strip:** `text-ink` / `text-muted` on light surfaces |
| 5 | Arch / tombstone cards | **Strip:** `rounded-card` uniform radius |
| 6 | Tilted disclaimer panel | **Strip:** no rotation; standard card |
| 7 | Diagonal section dividers | **Strip:** horizontal `border-surface-border` only |
| 8 | Small rounded-rect red CTAs | **Replace:** `rounded-pill` + spec hover invert |
| 9 | All-caps bold nav only | **Replace:** UI caps only on **eyebrow** (mono); nav sentence case |
| 10 | 3D coin as repeated brand | **Strip:** ⚡ + wordmark; token images are **user** assets |
| 11 | Comic full-bleed hero illustration | **Strip:** typographic hero + white card |
| 12 | Green chart / terminal aesthetic | **Strip:** light chart area + flu green / orange candles |
| 13 | “Crypto hype” copy default | **Replace:** blunt / speed / execution copy |

---

## Part D — Reference captures (Mars only; not shipped in app)

Reference PNGs live under the repo `assets/` folder (for comparison only):

| File | What it shows |
|------|----------------|
| `image-229ff9e3-fbac-4b82-a10a-d6bf8e874d3d.png` | Long single-page Mars Coin layout |
| `image-88e06fd7-37df-417c-a87f-31f14fdc1797.png` | Hero + taxes card + “about” band (bubble type, teal ground) |
| `image-c947d8ef-bf2c-4aa2-9cf6-639b473f9503.png` | Full scroll: arches, slanted headers, tokenomics, disclaimer, footer |

Sourcerer **does not** embed these assets in the product UI.

When adding new UI, **run Part C mentally**: if it introduces Martian gradients, novelty display type, or tilted/arch geometry, it is **out of system**.

---

## Part E — Pattern confirmation (Mars reference → Groq implementation)

Audit: each **Mars pattern** from the references above is either **replaced** or **absent** in `apps/web` as follows.

| Mars pattern (from references) | Groq / Sourcerer pattern | Confirmed in repo |
|--------------------------------|---------------------------|-------------------|
| Deep teal / forest green page ground (`~#1B3D33` family) | Warm off-white page `#F3F3EE` (`page`, `bg-page`, `globals.css` `html,body`) | Yes |
| Bright meme red CTAs / headings (`~#E63946`) | Brand burnt orange `#F43E01`, hover `#C23101` (`tailwind` `brand`) | Yes |
| Bubble / sticker display type (outline, 3D, gloss) | Space Grotesk **300** display scale (`text-hero`, `text-section-*`, negative tracking) | Yes |
| White lowercase body on dark cards | Charcoal `#2D2F33` + muted `#69695D` on white / cream (`ink`, `muted`) | Yes |
| Red pill nav, white label, on dark chrome | Orange **pill** primary + **hover invert** (`.btn-primary`, wallet button CSS); nav is **sentence case** charcoal, not all-caps red | Yes |
| Circular **planet / MARS coin** mark in header | **⚡** before wordmark “Sourcerer” (`site-header.tsx`); no planet logo | Yes |
| Full-bleed Martian **illustration** hero | Typographic hero inside **white card** on cream (`app/page.tsx`); no scene art | Yes |
| **Tombstone / arch** card tops | Uniform **`rounded-card`** (~20px) (`token-card`, forms, feeds) | Yes |
| **Slanted / diagonal** section title bands | **Horizontal** `border-surface-border` only; eyebrows are mono caps, not diagonal strips | Yes |
| **Tilted** disclaimer / panel | No `rotate` / skew; standard cards | Yes |
| Duplicated **top + bottom** nav bars | **Single** sticky header (`site-header.tsx`); no mirrored footer nav | Yes |
| “Taxes 0%” dark teal panel + casual meme copy | Not a Mars clone page; app uses **blunt** product copy (`page.tsx`, `create/page.tsx`, `trade-panel` graduated) | Yes (different IA) |
| Tight overlap / poster composition | **Grid + max-width** (`max-w-wrap`, `section-x`), card spacing | Yes |
| Heavy borders on dark green | **`1px` `rgba(0,0,0,0.2)`** on light cards (`surface-border`) | Yes |
| Pills **shape** retained, color system swapped | `rounded-pill` on buttons, filters, chain switcher, country pills | Yes |
| Monospace only for “engineering” labels | **IBM Plex Mono** on `.eyebrow`, form micro-labels, trade feed badges (`font-mono` / `eyebrow`) | Yes |
| Illustration / 3D coin as brand repetition | **User token images** only; no branded coin asset in chrome | Yes |
| Dark terminal-style chart | **Light** chart surface `#FAFAF8`, grid `#E8E8DE`, flu green / orange-dark candles (`price-chart.tsx`) | Yes |

**Summary:** The Mars references are **maximalist illustration + bubble type + teal/red world**. Sourcerer is **cream field + charcoal type + orange CTAs + pills + mono eyebrows + no arches/diagonals/tilt**. Part E confirms that mapping is what the codebase implements.

---

## Part F — Whole UI verification inventory (`apps/web/src`)

Every user-visible surface has been checked against Part B (Groq tokens). API route handlers have **no UI** and are omitted from styling audit.

| Area | Files | Design system |
|------|--------|----------------|
| Shell | `app/layout.tsx`, `app/globals.css` | Space Grotesk + IBM Plex Mono, `bg-page`, `text-ink`, Sonner `light` |
| Marketing / flows | `app/page.tsx`, `app/create/page.tsx`, `app/news/page.tsx`, `app/token/[mint]/page.tsx` | `eyebrow`, `rounded-card`, `ink` / `muted`, orange accents |
| Errors | `app/not-found.tsx` | Same tokens + `btn-primary` / `btn-secondary` |
| Header / chain / wallet | `components/site-header.tsx`, `chain-switcher.tsx`, `chain-tab-filter.tsx`, `connect-button.tsx` | ⚡ wordmark, pills, `brand-500` active states |
| Token / data UI | `token-card.tsx`, `hot-news-rail.tsx`, `price-chart.tsx`, `trade-feed.tsx`, `trade-panel.tsx`, `holders-list.tsx`, `comment-section.tsx` | Cards, mono labels, light chart, dark band only for graduated notice |
| Forms | `create-token-form.tsx` | Pills, mono field labels, orange primary |
| Providers | `app-providers.tsx`, `evm-provider.tsx` (RainbowKit light + orange), `wallet-provider.tsx` (adapter + `globals.css` modal), `query-provider.tsx`, `chain-provider.tsx` | Wallet modal + buttons match orange pill spec; no extra visual components |

**Automated grep (regression guard):** no `slate-*`, no legacy `#141923` / mint green chart, no Mars teal page background in `src/**/*.tsx`.

**Caveat:** Third-party widgets (RainbowKit modal internals, Solana wallet modal list) inherit from our CSS overrides in `globals.css`; pixel-perfect match to Groq marketing site is not guaranteed, but **colors, radius, and hover invert** are aligned.
