---
name: Stylix Lab
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1c1c'
  surface-container: '#1f2020'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e4e2e1'
  on-surface-variant: '#c9c8af'
  inverse-surface: '#e4e2e1'
  inverse-on-surface: '#303030'
  outline: '#93927b'
  outline-variant: '#484835'
  surface-tint: '#cacd39'
  primary: '#d4d742'
  on-primary: '#313300'
  primary-container: '#b8bb26'
  on-primary-container: '#484900'
  inverse-primary: '#606200'
  secondary: '#d5c59e'
  on-secondary: '#393013'
  secondary-container: '#504627'
  on-secondary-container: '#c3b48d'
  tertiary: '#b4d8ca'
  on-tertiary: '#16362c'
  tertiary-container: '#99bcae'
  on-tertiary-container: '#2c4c42'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e7ea54'
  primary-fixed-dim: '#cacd39'
  on-primary-fixed: '#1c1d00'
  on-primary-fixed-variant: '#484a00'
  secondary-fixed: '#f2e1b8'
  secondary-fixed-dim: '#d5c59e'
  on-secondary-fixed: '#221b02'
  on-secondary-fixed-variant: '#504627'
  tertiary-fixed: '#c7eadc'
  tertiary-fixed-dim: '#abcec0'
  on-tertiary-fixed: '#002018'
  on-tertiary-fixed-variant: '#2d4d42'
  background: '#131313'
  on-background: '#e4e2e1'
  surface-variant: '#353535'
typography:
  headline-lg:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
spacing:
  unit: 4px
  gutter: 16px
  margin-page: 32px
  panel-padding: 12px
---

## Brand & Style

The design system is engineered for developers, systems integrators, and UI designers who require a precise, utilitarian environment for color orchestration. The brand personality is "Industrial-Technical"—prioritizing functional density, high legibility, and a retro-modern workstation aesthetic.

The visual style is a blend of **Brutalism** and **Modern Corporate**, utilizing heavy strokes, fixed-width proportions, and a structured "terminal-influenced" hierarchy. It avoids unnecessary decoration, focusing instead on the technical data of color theory (hex codes, contrast ratios, and terminal color slots). The emotional response should be one of confidence, precision, and tool-centric reliability.

## Colors

The design system utilizes a palette inspired by retro-terminal color schemes, specifically targeting the high-contrast, earthy "Gruvbox" spectrum. 

- **Primary Surface**: A deep, desaturated charcoal (`base00`) serves as the canvas to ensure color swatches are perceived without chromatic interference.
- **Accents**: Primary green (`base0B`) and secondary cream (`base06`) denote active states and primary actions.
- **16-Color Matrix**: The system must provide a clear, standardized display for the 16 base slots (00-0F). These are categorized into Backgrounds/Surfaces (00-03), Foregrounds (04-07), and Accent Colors (08-0F).
- **Functionality**: Colors are used semantically. For example, red (`base08`) is reserved for contrast-ratio warnings and syntax errors in the theme previewer.

## Typography

This design system uses **JetBrains Mono** exclusively to maintain a consistent developer-tool aesthetic. The monospaced nature of the font ensures that hex codes, RGB values, and terminal indices align perfectly in tables and lists.

- **Scale**: Small, efficient type sizes are preferred to maximize information density. 
- **Hierarchy**: Distinction is created through font weight and color (e.g., `base04` for labels vs. `base06` for values) rather than large variations in font size.
- **Contrast**: Critical data like hex codes must be rendered in `base07` or `base0B` to stand out against the dark backgrounds.

## Layout & Spacing

The layout follows a **Fixed Grid** model with a "Dashboard" configuration. The screen is divided into functional zones: a left-hand sidebar for color inputs, a central workspace for theme previews (GTK/Qt simulations), and a right-hand panel for analysis and exports.

- **Rhythm**: A 4px baseline grid ensures tight, professional alignment.
- **Density**: High density is encouraged. Elements should be packed efficiently to allow users to see all 16 colors and their applications simultaneously without scrolling.
- **Borders**: Sections are separated by 1px solid borders in `base02` or `base03`, mimicking the window dividers of tiling window managers.

## Elevation & Depth

Depth is achieved through **Tonal Layers** and **Hard Outlines** rather than shadows. This maintains the "Pro-Tool" feel and avoids the softness of consumer-grade UIs.

- **Layer 0**: `base00` (Main background).
- **Layer 1**: `base01` (Sidebars and toolbars).
- **Layer 2**: `base02` (Input fields, cards, and dropdowns).
- **Interactions**: Hover states utilize a subtle shift to `base03` or a 1px border highlight using the primary accent color.
- **Focus**: Active inputs or selected color swatches should use a distinct `base0B` (green) border to indicate focus.

## Shapes

The design system employs **Sharp (0px)** corners for all UI components. This reinforces the technical, brutalist nature of the tool and ensures that color swatches can be tiled perfectly against one another without gaps. 

Button and input shapes are strictly rectangular. Circular elements are only permitted for status indicators (e.g., "Pass/Fail" contrast indicators) or specific iconography.

## Components

### Color Swatches
Horizontal bars or square blocks displaying the color. The hex code is overlaid in a contrasting foreground color (`base00` for light swatches, `base07` for dark).

### Buttons
- **Primary**: Solid `base0B` background with `base00` text.
- **Secondary**: 1px border of `base04` with no fill.
- **Ghost**: Text-only, shifting to `base02` background on hover.

### Input Fields
Strictly rectangular with a `base02` fill and `base03` border. Text is monospaced. When invalid (e.g., malformed hex), the border changes to `base08` (red).

### Data Tables
Used for contrast analysis. Headers are `base03` with `label-caps` typography. Rows alternate between `base00` and `base01` for readability.

### Preview Window
A specialized component that renders mock UI elements (title bars, buttons, scrollbars, and text editors) using the currently defined 16-color palette to simulate real-world usage in GTK or Qt environments.