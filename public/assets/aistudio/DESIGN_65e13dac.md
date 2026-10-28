---
name: Obsidian Cyber-Grid
colors:
  surface: '#0f1512'
  surface-dim: '#0f1512'
  surface-bright: '#353a38'
  surface-container-lowest: '#0a0f0d'
  surface-container-low: '#171d1a'
  surface-container: '#1b211e'
  surface-container-high: '#252b29'
  surface-container-highest: '#303633'
  on-surface: '#dee4e0'
  on-surface-variant: '#b9cbbd'
  inverse-surface: '#dee4e0'
  inverse-on-surface: '#2c322f'
  outline: '#849588'
  outline-variant: '#3b4a40'
  surface-tint: '#00e293'
  primary: '#bfffd7'
  on-primary: '#003921'
  primary-container: '#00f29d'
  on-primary-container: '#006942'
  inverse-primary: '#006d44'
  secondary: '#bdf4ff'
  on-secondary: '#00363d'
  secondary-container: '#00e3fd'
  on-secondary-container: '#00616d'
  tertiary: '#d7f9e5'
  on-tertiary: '#193629'
  tertiary-container: '#bbdcc9'
  on-tertiary-container: '#446253'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#50ffae'
  primary-fixed-dim: '#00e293'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#005232'
  secondary-fixed: '#9cf0ff'
  secondary-fixed-dim: '#00daf3'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#004f58'
  tertiary-fixed: '#c9ead7'
  tertiary-fixed-dim: '#adcebc'
  on-tertiary-fixed: '#022015'
  on-tertiary-fixed-variant: '#304d3f'
  background: '#0f1512'
  on-background: '#dee4e0'
  surface-variant: '#303633'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
---

## Brand & Style

This design system embodies futuristic deep-tech engineering and computational precision. Designed for industrial simulation SaaS, aerospace, high-fidelity power systems, and cyber-physical operations, the visual identity communicates extreme speed, algorithmic reliability, and next-generation mathematical modeling. 

The aesthetic is a synthesis of **High-Contrast Dark Mode**, **Tactile Glassmorphism**, and **Cybernetic Engineering**:
- Deep obsidian and pitch-black backgrounds infused with diffuse bioluminescent radial emerald and cyan blooms.
- Faint, laser-etched orthogonal engineering grids (32px to 48px square rhythm) overlaying the canvas to ground interactive data surfaces.
- Pristine, sharp typography paired with neon mint/cyan telemetry badges and glowing interactive focal points that guide complex engineering decisions effortlessly.

## Colors

The palette is engineered around deep optical density and bioluminescent spectral accents, minimizing ocular fatigue during long telemetry and simulation sessions while ensuring primary data surfaces stand out with clarity:

- **Primary Glow Accent (`#00F29D`)**: Electric Mint Emerald. Used for high-priority interactive calls-to-action, active workflow states, glowing focal nodes, and real-time computation status indicators.
- **Secondary Technical Accent (`#00E5FF`)**: Cyan Aqua. Used for secondary telemetry metrics, auxiliary data vectors, and complementary link states.
- **Tertiary Border & Structural Spine (`#1B382B`)**: Deep mineral emerald. Used for subtle glass container stroke borders, division rules, and inactive hardware connection lines.
- **Base Canvas & Neutral (`#060B09` / `#0A120E`)**: Near-black obsidian canvas that absorbs scattered ambient light. Elevated surfaces transition through `#0E1A14` with variable alpha channels (`rgba(14, 26, 20, 0.7)`).
- **Text Layers**:
  - Primary (`#FFFFFF`): Maximum legibility for display typography, critical data readouts, and active input values.
  - Secondary (`#D1E7DD`): Light silvery mint for subheadings, descriptive summaries, and prominent metadata.
  - Muted (`#7C988B`): Technical slate-green for labels, deactivated tabs, axes, and structural grid rules.

## Typography

The typographic hierarchy balances expressive aerospace engineering aesthetics with uncompromised analytical utility:

- **Headlines (`Space Grotesk`)**: Geometric, sharp, and confident. Features tight negative tracking (`-0.02em` to `-0.03em`) to anchor landing views, section headers, and simulation dashboard cards.
- **Body Content (`Inter`)**: Neutral, systematically neutral, and optimized for dense multi-line documentation, simulation parameter tables, and engineering specifications.
- **Technical Readouts & Badges (`JetBrains Mono`)**: Monospaced precision for numerical values, system status chips, process steps, code snippets, and unit measurements. Uppercase styling is standard for `label-sm`.

## Layout & Spacing

The layout is built upon an architectural 12-column responsive fluid grid structured around an underlying 8px spatial grid and a visible 40px engineering grid backdrop.

- **Grid Alignment**: Outer margins adapt from `1.25rem` (20px) on mobile viewports up to `2.5rem` (40px) or `5rem` (80px) on expansive widescreen monitors. Gutters remain tightly locked at `1.5rem` on desktop for dense technical coherence.
- **The Atmospheric Overlay Grid**: The base canvas renders an SVG/CSS repeating background grid with lines sized at 1px using `#00E599` at `0.06` to `0.08` opacity spaced in 40px × 40px increments.
- **Viewport Fluidity**: On desktop, complex dashboards adopt modular multi-pane split layouts (e.g., side parameters panel at 4 columns, interactive 3D simulation canvas at 8 columns). On mobile, layout panels collapse into stacked, swipeable tabs and bottom sheets.

## Elevation & Depth

Visual depth does not rely on traditional muddy drop shadows; instead, it is synthesized through **luminous diffusion**, **radial backlights**, and **glassmorphic border refraction**:

- **Level 0 (Canvas Base)**: Pure obsidian (`#050907`), augmented with layered radial gradients:
  `radial-gradient(circle at 80% 20%, rgba(0, 242, 157, 0.15) 0%, transparent 60%)`.
- **Level 1 (Card & Module Layer)**: Translucent obsidian-emerald glass (`rgba(14, 26, 20, 0.65)`) with `backdrop-filter: blur(16px)` and a crisp perimeter border: `1px solid rgba(27, 56, 43, 0.8)`.
- **Level 2 (Active/Elevated Modals & Overlays)**: Surface lightens to `rgba(18, 34, 26, 0.85)`, framed with a highlighted stroke: `1px solid rgba(0, 242, 157, 0.3)`.
- **Glow Signatures**:
  - *Standard Hover Glow*: `box-shadow: 0 0 20px -4px rgba(0, 242, 157, 0.25)`
  - *Primary CTA Button Bloom*: `box-shadow: 0 0 28px 2px rgba(0, 242, 157, 0.35)`
  - *Cyber Node Focus*: Dual outer halo with `0 0 0 1px #00F29D, 0 0 16px rgba(0, 229, 255, 0.4)`

## Shapes

The design system employs a **Rounded** shape language with tailored corner treatment depending on component context:

- **Interactive CTAs and Status Pills**: Fully radiused pill geometry (`rounded-full` / `9999px`) for action chips, status pills, and system tags to signal high tactile reactivity.
- **Structural Modules & Glass Panels**: `1rem` (16px) corner radius (`rounded-lg`), producing an ergonomic enclosure that feels modern and approachable while maintaining technological discipline.
- **Form Controls & Micro Inputs**: `0.5rem` (8px) corner radius (`rounded-md`), establishing clean alignment when stacked in data entry grids.

## Components

### Buttons
- **Primary Glowing Button**: Background `#00F29D`, text `#060B09` (Space Grotesk, bold, 14px), rounded-full geometry with padding `10px 24px`. Emits a permanent subtle bloom `box-shadow: 0 0 20px rgba(0, 242, 157, 0.35)`, intensifying on hover.
- **Secondary Ghost Button**: Translucent background `rgba(14, 26, 20, 0.6)`, text `#FFFFFF`, with a 1px border `rgba(0, 242, 157, 0.3)`. On hover, the border brightens to full primary accent and background shifts to `rgba(0, 242, 157, 0.1)`.

### Chips & Telemetry Badges
- Compact pill-shaped modules (`padding: 4px 12px`, JetBrains Mono 11px uppercase).
- Features a glowing 6px status dot inside the leading edge. Inactive states use gray-green borders, while active or simulated states ignite with cyan/mint neon backgrounds at 10% opacity and 1px borders.

### Cards & Container Panels
- Backdrops render dark glass (`rgba(14, 26, 20, 0.7)` with `backdrop-filter: blur(20px)`).
- Framed with subtle 1px border in `#1B382B`. Cards can contain an internal top-edge highlight using a linear gradient pseudo-border (`linear-gradient(90deg, rgba(0,242,157,0.4) 0%, transparent 100%)`).

### Input Fields & Controls
- Inputs use dark inset backgrounds `rgba(8, 16, 12, 0.8)` with `#D1E7DD` value text and `#7C988B` placeholder styling.
- Focus state triggers an immediate electric neon cyan glow `box-shadow: 0 0 0 1px #00F29D, 0 0 12px rgba(0, 242, 157, 0.25)`.
- Custom checkboxes and radios feature angular check icons rendered in `#00F29D` inside dark-emerald bordered containers.

### Hardware & Industry Category Switchers
- Horizontally arranged interactive icon cards (such as Automotive, Off-highway, Defense, Aerospace).
- Cards display stylized 3D/vector vehicle thumbnails centered over an obsidian base. Active state activates an emerald halo surrounding the vehicle graphic, with active mint typography below.