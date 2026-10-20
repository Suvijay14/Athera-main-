---
name: Contextual Serenity
colors:
  surface: '#f7faf4'
  surface-dim: '#d7dbd5'
  surface-bright: '#f7faf4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f5ef'
  surface-container: '#ebefe9'
  surface-container-high: '#e5e9e3'
  surface-container-highest: '#e0e4de'
  on-surface: '#181d19'
  on-surface-variant: '#414843'
  inverse-surface: '#2d322e'
  inverse-on-surface: '#eef2ec'
  outline: '#717973'
  outline-variant: '#c1c8c2'
  surface-tint: '#406653'
  primary: '#0b3323'
  on-primary: '#ffffff'
  primary-container: '#244a38'
  on-primary-container: '#90b9a2'
  inverse-primary: '#a6d0b8'
  secondary: '#586157'
  on-secondary: '#ffffff'
  secondary-container: '#dce5d9'
  on-secondary-container: '#5e675d'
  tertiary: '#002e51'
  on-tertiary: '#ffffff'
  tertiary-container: '#1a456c'
  on-tertiary-container: '#8cb3e0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c2ecd3'
  primary-fixed-dim: '#a6d0b8'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#284e3c'
  secondary-fixed: '#dce5d9'
  secondary-fixed-dim: '#c0c9be'
  on-secondary-fixed: '#161d16'
  on-secondary-fixed-variant: '#404940'
  tertiary-fixed: '#d1e4ff'
  tertiary-fixed-dim: '#a3caf8'
  on-tertiary-fixed: '#001d35'
  on-tertiary-fixed-variant: '#1f4971'
  background: '#f7faf4'
  on-background: '#181d19'
  surface-variant: '#e0e4de'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 13.5px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 17px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 11.5px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10.5px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

This design system is crafted for high-performing professionals managing multi-threaded lives across freelance work, parenting, household management, and personal health. The brand personality embodies quiet clarity, grounded intentionality, and gentle competence. Rather than inducing cognitive overwhelm through aggressive alert reds or stark enterprise grays, the UI evokes pastoral composure, mental breathing room, and structured warmth.

The design movement blends **Warm Organic Minimalism** with **Tactile Soft Precision**. It replaces sterile techno-minimalism with a biotic palette inspired by dried sage, mossy stone, and deep pine, offset by crisp porcelain cards. UI structures feature generous corner radiuses, delicate non-distracting outlines, circular badge markers, and soft chromatic chips that assign distinct domains of life without chaotic visual noise.

## Colors

The palette grounds itself in natural, low-saturation earth-mineral hues designed to lower cortisol during multi-task scheduling.

- **Primary (`#244A38` / `#1E3E30`)**: Deep Forest Pine. Used for high-emphasis call-to-actions, active navigation states, primary buttons, and focused date rings.
- **Secondary (`#DFE8DC`)**: Eucalyptus Sage. Acts as the container background for proactive AI recommendations, gentle highlights, and subtle notification ribbons.
- **Tertiary (`#3B628B`)**: Muted Atlantic Blue. Represents freelance, professional, and deep focus domains.
- **Neutral Canvas (`#EEF2EC` / `#ECEFEA`)**: Pale Moss Warm Gray. The non-glare foundation underpinning the entire app canvas, setting a tranquil ambient plane.
- **Surface Pure (`#FFFFFF`)**: Pure crisp white applied to primary cards, active toolbars, popovers, and selected navigation pills.
- **Borders & Dividers (`#E2E6DE`)**: Subtle 1px warm structural lines offering soft tactile separation without visual heaviness.
- **Domain Accent Tokens**:
  - *Kids & Family*: Soft Peach background (`#F7EBE1`) with Earth Umber text (`#965C38`).
  - *Life Errands*: Soft Olive background (`#EAECE1`) with Herb Green text (`#5E6C47`).
  - *Freelance*: Soft Slate Blue background (`#E3EAF3`) with Slate Navy text (`#3B628B`).
  - *Urgent/Time-Critical*: Muted Terracotta tint (`#FBEFEF`) with Rust text (`#A8423F`).
- **Typography Neutrals**: Primary text sits at Deep Slate Pine (`#19231D`), secondary at Warm Stone (`#5F6B61`), and tertiary/placeholder at Muted Lichen (`#8C998F`).

## Typography

The type system balances the organic geometric posture of Plus Jakarta Sans for titles, headers, chips, and navigational anchors with the utilitarian reading comfort of Inter for structured lists, metadata, and timestamps.

- **Headlines**: Set in Plus Jakarta Sans with subtle negative tracking (`-0.02em` to `-0.01em`) to create compact, authoritative headlines without feeling cold or clinical.
- **Body**: Set in Inter with balanced tabular numeric features enabled for clear alignment of dates, clock times (`10:30–11:15 AM`), and progress metrics.
- **Labels & Microcopy**: Use uppercase Plus Jakarta Sans (`label-sm`) with deliberate wide tracking (`0.06em`) for group headers (e.g., `SPACES`, `TODAY`, `SUGGESTED NEXT`) to preserve quick skimming across dense dashboard layouts.

## Layout & Spacing

The architecture employs an asymmetrical composite dashboard layout configured on an adaptive 12-column grid.

- **Navigation Rail / Sidebar**: A collapsible left-hand column spanning 260px on desktop, containing space switchers, interactive miniature calendar widgets, and system status indicators. Collapses into an ultra-slim 64px icon rail on compact viewports or when minimized.
- **Main Canvas**: A 12-column fluid grid with 20px–24px gutters.
  - Recommended actions and header greetings span the full 12 columns.
  - Active lists (Urgent, Today, Daily To-Dos) occupy 7 to 8 columns on the left.
  - Contextual schedule panels (Upcoming 3 Days, Calendar integration) anchor the right 4 to 5 columns.
  - Bottom analytical cards span 4 columns each in a balanced 3-card trio.
- **Breakpoints**:
  - `Mobile` (< 768px): 1-column layout, bottom navigation bar replacing the sidebar, edge margins at 16px (`1rem`).
  - `Tablet` (768px - 1024px): 8-column layout, rail collapsed into icons, main modules stacked into single/double blocks.
  - `Desktop` (> 1024px): 12-column expansive canvas with fixed sidebar, full card grouping, and expansive 36px outer padding.

## Elevation & Depth

Visual hierarchy uses a refined technique of **layered porcelain surfaces and atmospheric botanical tinting**, rather than muddy drop shadows.

- **Level 0 (Canvas Base)**: The ambient `#EEF2EC` surface. Flat and grounded.
- **Level 1 (Card & Modular Tier)**: Pure white `#FFFFFF` surface accompanied by a crisp `1px solid #E2E6DE` hairline border. Shadow is an ultra-soft ambient bloom: `0 2px 10px rgba(36, 74, 56, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)`.
- **Level 2 (Floating Popovers, Search Palettes & Floating Rails)**: Pure white `#FFFFFF` with `1px solid #D5DBD0` and an elevated diffused feather: `0 12px 32px -4px rgba(25, 35, 29, 0.08), 0 4px 12px -2px rgba(25, 35, 29, 0.03)`.
- **Banners & Highlight States**: Solid eucalyptus fill (`#DFE8DC`) framed by a subtle 1px border (`#C6D4C2`) without drop shadows, using pure tonal contrast to signal priority.

## Shapes

The design language uses roundedness to communicate warmth, accessibility, and an unhurried workflow.

- **Cards & Primary Modules**: Styled with a signature `16px` to `20px` (`rounded-2xl`) corner radius. This softens high-density dashboard layouts and removes harsh structural corners.
- **Navigation Active Badges & Quick Filters**: Smooth capsule-shaped pills (`rounded-full` / `9999px`) creating clear touch-friendly targets.
- **Icon Pods**: Circular geometries (`36px` to `40px` diameter, `rounded-full`) holding category glyphettes with 10% chromatic tint fills matching their parent domain.
- **Input Fields & Search Bars**: Balanced `rounded-xl` (`12px`) geometry, matching interior card item padding.
- **Interactive Checkboxes**: Generous `6px` softened squares (`rounded-md`) that balance crisp precision with comfortable hit areas.

## Components

### Buttons
- **Primary**: Deep Forest Pine (`#244A38`), text in pure white (`#FFFFFF`), full pill curvature (`rounded-full`), padded `10px 20px`. Hover transitions to `#1E3E30` with slight scale bounce (`scale(1.01)`). Includes an optional trailing micro-icon (`→`).
- **Secondary / Ghost**: Transparent fill with `1px solid #D5DBD0` or pure ghost on hover (`#E6ECE3`), text in `#244A38`.
- **Icon Actions**: Subtle circular utility buttons (`32px` to `36px`) in white or neutral gray with delicate icon strokes (`1.5px`).

### Cards & Panels
- **Structure**: Constructed in pure white (`#FFFFFF`) with `16px`–`20px` padding, framed in `1px solid #E2E6DE`.
- **Header**: Features clear `headline-md` titles, actionable right-aligned link triggers (`Open calendar →`, `View all`), and quantitative badge pills (e.g., `2 due today`).
- **Dividers**: Interior task dividers use `1px solid #F0F3EE` terminating 12px before card edges.

### Checkboxes & Task Rows
- **Checkbox Element**: `18px × 18px` with `6px` radius. Neutral state features an unselected hairline border in `#C5CCC0`. Hover deepens border to `#244A38`. Checked state fills `#244A38` with an interior white checkmark.
- **Urgent Task State**: Border transitions to soft terracotta `#D96B66`, with red-tinted due badge pills (`#FBEFEF`).
- **Task Row**: Hover initiates a soft background fill (`#F7FAF5`) with inline micro-actions sliding in from the right edge (snooze clock, external link arrow).

### Contextual Category Chips (Badges)
- **Geometry**: Compact capsules (`height: 22px`, `padding: 2px 10px`, `border-radius: 9999px`).
- **Structure**: Preceded by an inline `5px` solid dot indicator.
- **Themes**:
  - *Freelance*: `#E3EAF3` background, `#3B628B` dot and text.
  - *Kids & Family*: `#F7EBE1` background, `#965C38` dot and text.
  - *Life Errands*: `#EAECE1` background, `#5E6C47` dot and text.

### Search & Global Input Bar
- Floating rounded pill or `12px` box with `#FFFFFF` background, `1px solid #E2E6DE`, search glyph icon prefix, and a sleek keyboard shortcut badge (`⌘ K`) in subtle warm gray (`#F0F3EE`).

### Banner / Proactive Recommendation
- Eucalyptus Sage fill (`#DFE8DC`) paired with dark pine typography and a floating pure white circular icon pod. Right side holds a dismiss button (`Not now`) and a primary pill button (`Review invoice →`).