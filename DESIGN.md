---
name: MLBB International
description: A premium tournament dashboard for MSC and M-Series statistics.
colors:
  primary: "#FFD700"
  primary-dim: "#B8960A"
  neutral-bg: "#0F0F1A"
  neutral-surface: "#14141F"
  neutral-surface-hover: "#1B1B2B"
  border: "#26263E"
  border-strong: "#34345A"
  win: "#2BD49B"
  loss: "#F0506E"
  text: "#F0F0FF"
  text-muted: "#C0C8F0"
  text-muted-dim: "#8090C8"
typography:
  display:
    fontFamily: "Anton, sans-serif"
    fontSize: "clamp(28px, 4vw, 44px)"
    fontWeight: "normal"
    lineHeight: "1.6"
    letterSpacing: "0.5px"
  body:
    fontFamily: "General Sans, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: "normal"
    lineHeight: "1.6"
  label:
    fontFamily: "SF Mono, Fira Code, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: "600"
    letterSpacing: "0.12em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  pill: "999px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "20px"
  space-6: "24px"
  space-8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#000000"
    rounded: "{rounded.sm}"
  button-primary-hover:
    backgroundColor: "{colors.primary-dim}"
    textColor: "#000000"
    rounded: "{rounded.sm}"
---

# Design System: MLBB International

## 1. Overview

**Creative North Star: "The Arena Archive"**

The Arena Archive represents a premium, clean, and highly structured statistics platform for international MLBB tournaments. The design philosophy is centered around statistical clarity and visual restraint. It treats esports data not as a chaotic stream of flashes and neon, but as a rich historical archive that demands precision, readability, and structural elegance. 

We explicitly reject the standard warm-neutral SaaS clichés (cream backgrounds, sand tones, ghost cards with wide shadows) and the overly loud, neon-drenched gamer tropes. Instead, the interface relies on a deep midnight canvas highlighted by a singular, strategic gold accent and clean, tabular layouts that feel premium and authoritative.

**Key Characteristics:**
- Dark, immersive midnight void backdrop
- High contrast, data-first hierarchy
- Restrained, purposeful use of gold accents (≤10% density)
- Clean, structured border divisions without nested boxes

## 2. Colors

The palette is built around deep dark-neutral hues, offset by clean slate borders and a singular championship gold accent.

### Primary
- **Championship Gold** (#FFD700 / oklch(84.44% 0.198 84.57)): Used as the primary brand accent for active states, key interactive indicators, and primary action buttons.
- **Gold Dim** (#B8960A / oklch(67.43% 0.165 84.57)): Hover states for primary gold elements.

### Neutral
- **Midnight Void** (#0F0F1A / oklch(12.78% 0.015 264.44)): The canonical background canvas of the application.
- **Abyss Surface** (#14141F / oklch(15.2% 0.012 264.44)): Primary container, table row, and card background.
- **Abyss Surface Hover** (#1B1B2B / oklch(18.57% 0.012 264.44)): Secondary hover backgrounds and active filters.
- **Deep Slate Border** (#26263E / oklch(23.95% 0.02 264.44)): Default boundary dividing sections and tables.
- **Deep Slate Border Strong** (#34345A / oklch(29.68% 0.029 264.44)): Highlight borders or visual thresholds.
- **Ink Text** (#F0F0FF / oklch(95.42% 0.01 264.44)): High-contrast text color.
- **Ink Text Muted** (#C0C8F0 / oklch(82.68% 0.034 264.44)): Secondary labels and descriptions.
- **Ink Text Muted Dim** (#8090C8 / oklch(62.8% 0.068 264.44)): Tertiary indicators, labels, and helper text.

### Named Rules
**The Gold Accent Rule.** Championship Gold is used for interactive states, key callouts, and active highlights. It must cover no more than 10% of any given screen. Its rarity is what gives it strategic significance.

**The Muted Contrast Rule.** All placeholder and secondary text must hit a minimum of 4.5:1 contrast against their respective backgrounds (Midnight Void or Abyss Surface).

## 3. Typography

**Display Font:** Anton (with fallback sans-serif)
**Body Font:** General Sans (with fallbacks system-ui, -apple-system, sans-serif)
**Label/Mono Font:** SF Mono (with fallbacks Fira Code, ui-monospace, monospace)

The typographic system pairs the bold, condensed display energy of Anton for primary headings with the clean, highly legible grotesque characteristics of General Sans for body layout.

### Hierarchy
- **Display** (Regular, clamp(28px, 4vw, 44px), 1.6): Hero headers, major titles.
- **Headline** (Bold, 20px, 1.4): Section headers, list groups.
- **Title** (Semi-Bold, 15px, 1.4): Card titles, sub-headers.
- **Body** (Regular, 15px, 1.6): Standard prose, table cells, lists. Max line length: 75ch.
- **Label** (Semi-Bold, 11px, 1.2, uppercase, 0.12em tracking): Metadata labels, small details, buttons.

### Named Rules
**The Display Letter Spacing Rule.** Display typography (Anton) must never have letter-spacing below -0.04em, and default to 0.5px. Anything tighter causes touching letters and reads as cramped.
**The Line Length Rule.** Prose text blocks must be restricted to a maximum width of 75ch to prevent scanning fatigue.

## 4. Elevation

The application is flat-by-default, utilizing flat surfaces and clean borders to establish structure. We rely on tonal changes (Abyss Surface vs. Midnight Void) and thin border outlines rather than heavy drop shadows to distinguish containers.

### Shadow Vocabulary
- **Ambient Low** (`0 1px 2px rgba(0, 0, 0, 0.25)`): Subtle anchoring shadow for small floating elements.
- **Ambient Deep** (`0 6px 20px rgba(0, 0, 0, 0.35)`): Used only for dropdowns, flyouts, and modals to elevate them above the background grid.

### Named Rules
**The Flat Structure Rule.** Containers and cards are flat at rest. Depth is established through border-color transitions and background token shifts, not decorative drop shadows.

## 5. Components

### Buttons
- **Shape:** Gently rounded (8px radius).
- **Primary:** Championship Gold (#FFD700) with solid black text. Padding is 8px 16px.
- **Hover / Focus:** Fades to Gold Dim (#B8960A). visible keyboard focus draws an outline of 2px solid Championship Gold offset by 2px.

### Cards / Containers
- **Corner Style:** Gently rounded (10px or 12px radius).
- **Background:** Abyss Surface (#14141F) at rest.
- **Border:** 1px solid Deep Slate Border (#26263E). No shadows at rest.

### Navigation
- **Style:** Sticky top nav with Midnight Void background at 85% opacity, combined with a 10px backdrop-filter blur.
- **Links:** Muted ink text (#C0C8F0) that highlights to pure white on hover and Championship Gold (#FFD700) when active.

### Data Tables
- **Rows:** Alternate background shading using Abyss Surface (#14141F) and Midnight Void (#0F0F1A).
- **Headers:** SF Mono uppercase label style with a solid Deep Slate Border bottom boundary. Background is set to `var(--surface2)` (#1B1B2B) for high contrast and visual alignment.
- **Sorting Indicators:** Interactive header columns must use the `.th-sort` button styling with a nested `.sort-ind` element that dynamically renders `▲` or `▼` depending on the active sort state. Raw text symbols or CSS pseudo-elements (like ` ↕`) are prohibited to avoid visual noise.
- **Sticky Columns:** High-priority columns (such as ranks, player names, and heroes) are pinned using the `.sticky-col-...` or `.tbl-sticky` primitive. They use a flat style with `border-right: 2px solid var(--border-strong)` instead of soft drop shadows, and transition seamlessly to `var(--surface)` (#14141F) on hover.

## 6. Do's and Don't's

### Do:
- **Do** maintain a strict 4.5:1 text contrast for body and secondary metadata labels.
- **Do** use `text-wrap: balance` on display headings to prevent awkward text wrapping.
- **Do** use native `:focus-visible` outline rings on all custom button elements.

### Don't:
- **Don't** use border-left or border-right accent stripes on cards, alerts, or list items.
- **Don't** apply gradients to text headers (`background-clip: text` is prohibited).
- **Don't** use soft/wide drop shadows combined with thin borders on default dashboard cards.
- **Don't** use cream, beige, or warm-tinted off-white backgrounds (e.g., bone, ivory, sand) for the layout canvas.
- **Don't** use card radii larger than 12px; keep shapes structured and restrained.
