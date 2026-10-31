# 16 Colour Editor

Design, preview, and export **Base16 colour schemes** for terminal, GTK, and Qt environments.  
Upload an image, pick an algorithm to extract a palette, then tweak each colour individually. Export to Alacritty, Xresources, GTK CSS, Qt stylesheets, KDE Konsole, Kitty, Ghostty, Neovim (Lua), Base16 JSON/YAML, or Terminal.sexy JSON.

Built for people who want full control over their terminal and desktop theme colours — import into [Stylix](https://github.com/danth/stylix) or your NixOS config directly.

## Features

- **16 Base16 colour swatches** — edit with hex input or a colour picker popover
- **Undo/redo** per colour — history is per-swatch, survives scheme switches
- **Hyprland-style fake desktop preview** — wallpaper, Waybar-style top bar, active/inactive window borders, launcher, all driven by the scheme (terminal.sexy-style screenshot simulation)
- **Image palette extraction** — upload an image and pick from 16 algorithms (each ported from / inspired by its namesake tool):
  - *K-Means* — balanced clustering
  - *Median Cut* — fast, good for dominant colours
  - *Histogram Peak* — preserves actual image tones
  - *Octree Quantization* — clean quantisation
  - *Monochrome / Vibrant / Muted / Dominant* — material-style themed subsets
  - *High Contrast / Complementary* — accessibility-oriented
  - *QuickTheme* — perceptual OKLab-based clustering
  - *pywal (wal backend)* — ImageMagick-style `-unique-colors` emulation
  - *pywal (colorz)* — k-means hue-ordered 6-colour palette
  - *pywal (colorthief)* — 8-colour palette sorted by YIQ luminance
  - *wallust kmeans* — Lab-space 16-colour clustering with ΔE-2000 dedup
  - *wallust ansi* — HSV hue-range TTY palette (matches wallust's `ansi` scheme)
- **Dark / Light polarity** — pywal & wallust backends adapt their contrast rules to the chosen style
- **Hover inspection** — hover a colour row to highlight every element it paints across all previews (Stylix role check)
- **Large image picker** — pan, zoom, pick any pixel colour straight from the image
- **Saturation badges** — hover any swatch to see saturation % (green/yellow/red)
- **Previews** — fake Hyprland desktop, terminal ANSI, GTK, Qt, multi-language code editor
- **Syntax preview in 4 languages** — Rust, TypeScript, Python, Bash; paste your own code to preview it with the scheme
- **WCAG contrast analysis** — checks 5 key background/foreground pairs
- **Export** — 11 formats, all with colour-highlighted hex values
- **Import** — paste Base16 JSON or YAML
- **Persistent** — schemes saved to `localStorage` (debounced writes; images stored separately so editing colours never re-serialises the wallpaper)

## How other ricing tools generate palettes from a wallpaper

These tools were used as references for the algorithms above — the site now ports their logic so you can reproduce their output without installing them:

| Tool | Strategy | Ported here as |
|---|---|---|
| [pywal](https://github.com/dylanaraps/pywal) | ImageMagick quantise → 16 unique colours, then rules to darken/lighten bg/fg | `pywal` |
| [pywal `colorz`](https://github.com/dylanaraps/pywal/blob/master/pywal/backends/colorz.py) | k-means in hue-ordered 6-colour palette | `pywal-colorz` |
| [pywal `colorthief`](https://github.com/dylanaraps/pywal/blob/master/pywal/backends/colorthief.py) | colour thief 8-palette sorted by YIQ | `pywal-colorthief` |
| [wallust](https://codeberg.org/explosion-mental/wallust) | `salience` (top contrast cluster), `kmeans` (Lab 16-colour), `ansi` (HSV TTY slot matching) | `wallust-kmeans`, `wallust-ansi` |
| [wpgtk](https://github.com/deviantfero/wpgtk) | GUI wrapper around pywal; uses pywal's backends | — (use the pywal algorithms) |
| [Chameleon](https://github.com/GideonWolfe/Chameleon) | shell wrapper around pywal's wal binary | — (use the pywal algorithms) |
| [Stylix](https://github.com/danth/stylix) | consumes a Base16 scheme — see the site's role mappings which match Stylix defaults exactly | site previews apply colours the same way |
| [pywal-themes-preview](https://github.com/adamrutter/pywal-themes-preview) | fake-terminal per-theme screenshot blocks for the 250 built-in pywal themes | same fake-terminal technique in our previews |
| [Paletty](https://paletty.dev/) | extract palettes from images, preview on terminal mockups, community gallery | extraction + terminal mockup previews |

Verified-unavailable: some guide references (ricetheme, miozu-theme, a specific "Hyprland simulator in the Stylix community") could not be confirmed to exist as described; techniques from them are implemented directly instead of citing them.

## Adding default schemes

Edit [`src/lib/presets.ts`](src/lib/presets.ts) and add a new object to the `presets` array:

```ts
{
  name: "My Custom Theme",
  slug: "my-custom-theme",
  author: "Your Name",
  base00: "#1e1e2e",
  base01: "#2a2a3e",
  base02: "#36364e",
  base03: "#4a4a62",
  base04: "#9a9ab2",
  base05: "#cdd6f4",
  base06: "#e0e0f0",
  base07: "#ffffff",
  base08: "#f38ba8",
  base09: "#fab387",
  base0A: "#f9e2af",
  base0B: "#a6e3a1",
  base0C: "#94e2d5",
  base0D: "#89b4fa",
  base0E: "#cba6f7",
  base0F: "#f2cdcd",
},
```

Push to `main` — the GitHub Actions workflow builds the static site and deploys automatically.

## Development

```sh
pnpm install
pnpm dev        # local dev server at http://localhost:3000
pnpm build      # static export to out/
```

## Deployment

The repo includes `.github/workflows/deploy.yml` — every push to `main` builds and publishes to GitHub Pages via the `gh-pages` branch.  
Enable Pages in your repo settings: **Settings → Pages → Source: Deploy from a branch → gh-pages / (root)**.

Live at: <https://daniedu.github.io/16ceditor/>
