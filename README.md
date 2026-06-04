# 16 Colour Editor

Design, preview, and export **Base16 colour schemes** for terminal, GTK, and Qt environments.  
Upload an image, pick an algorithm (K-Means, Median Cut, Histogram, Octree) to extract a palette, then tweak each colour individually. Export to Alacritty, Xresources, GTK CSS, Qt stylesheets, KDE Konsole, Base16 JSON/YAML, or Terminal.sexy JSON.

Built for people who want full control over their terminal and desktop theme colours — import into [Stylix](https://github.com/danth/stylix) or your NixOS config directly.

## Features

- **16 Base16 colour swatches** — edit with hex input or a colour picker popover
- **Undo/redo** per colour — history is per-swatch, survives scheme switches
- **Image palette extraction** — upload an image, pick from 4 algorithms:
  - *K-Means* — balanced clustering
  - *Median Cut* — fast, good for dominant colours
  - *Histogram Peak* — preserves actual image tones
  - *Octree Quantization* — clean quantisation
- **Large image picker** — pan, zoom, pick any pixel colour straight from the image
- **Saturation badges** — hover any swatch to see saturation % (green/yellow/red)
- **Previews** — terminal ANSI, GTK, Qt, code syntax highlight
- **WCAG contrast analysis** — checks 5 key background/foreground pairs
- **Export** — 8 formats, all with colour-highlighted hex values
- **Import** — paste Base16 JSON or YAML
- **Persistent** — schemes saved to `localStorage`; also bakes in as preset defaults

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
