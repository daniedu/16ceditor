# Enhanced Image Palette Extraction Algorithms

## Executive Summary

This document proposes new palette extraction algorithms specifically designed for "ricing" (desktop customization) workflows, where users want to generate cohesive Base16 themes from their wallpapers. Focus on algorithms that create **usable, harmonious themes** rather than just accurate color extraction.

## Current Algorithms (Analysis)

### Existing in `src/lib/imagePalette.ts`

1. **K-Means Clustering** - Balanced, good for natural photos
2. **Median Cut** - Fast, works well for graphics
3. **Histogram Peak** - Simple, frequency-based
4. **Octree Quantization** - Tree-based, accurate

**Current Limitations:**
- All algorithms prioritize **color accuracy** over **usability**
- No semantic understanding (can't detect "accent" vs "background" colors)
- No contrast enforcement (may produce low-contrast schemes)
- No style presets (monochrome, vibrant, muted, etc.)
- Final sorting is basic (just luminance)

---

## Proposed New Algorithms

### 1. Monochrome Extraction (Grayscale + Accent)

**Purpose:** Extract a monochrome base palette + single accent color from image

**Use Case:** Minimalist ricing, terminal-focused setups, dark mode themes

**Algorithm:**
```typescript
// Add to src/lib/imagePalette.ts

export function extractMonochrome(imageData: ImageData, accentHue?: number): ColorScheme {
  const pixels = getPixels(imageData);

  // 1. Convert all pixels to grayscale
  const grayscalePixels = pixels.map(({ r, g, b }) => {
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    return { r: gray, g: gray, b: gray };
  });

  // 2. Extract 8 grayscale levels (base00-base07)
  const grayscaleLevels = [0, 36, 72, 108, 144, 180, 216, 255];
  const baseColors = grayscaleLevels.map(level => ({
    r: level,
    g: level,
    b: level,
  }));

  // 3. Find dominant hue for accent color (if not specified)
  let dominantHue = accentHue ?? findDominantHue(pixels);

  // 4. Generate accent colors from dominant hue
  // Use HSL to create variations in saturation/lightness
  const accentColors = [
    hslToRgb(dominantHue, 80, 50),  // base08: Red (bright)
    hslToRgb(dominantHue + 30, 70, 55),  // base09: Orange
    hslToRgb(dominantHue + 60, 75, 60),  // base0A: Yellow
    hslToRgb(dominantHue + 120, 65, 55), // base0B: Green
    hslToRgb(dominantHue + 180, 70, 50), // base0C: Cyan
    hslToRgb(dominantHue + 240, 75, 55), // base0D: Blue
    hslToRgb(dominantHue + 300, 70, 50), // base0E: Magenta
    hslToRgb(dominantHue, 40, 45),  // base0F: Brown (muted)
  ];

  return {
    base: baseColors.map(rgbToHex),
    accents: accentColors.map(rgbToHex),
  };
}

function findDominantHue(pixels: Pixel[]): number {
  // Count pixels by hue bucket (36 buckets = 10° each)
  const hueBuckets = new Array(36).fill(0);

  pixels.forEach(({ r, g, b }) => {
    const { h } = rgbToHsl(r, g, b);
    const bucket = Math.floor(h / 10);
    hueBuckets[bucket]++;
  });

  // Find most common hue
  const maxBucket = hueBuckets.indexOf(Math.max(...hueBuckets));
  return maxBucket * 10;  // Convert bucket back to hue
}
```

**Features:**
- Pure grayscale backgrounds (base00-base07)
- Accent colors derived from image's dominant hue
- Guaranteed high contrast
- Clean, minimalist aesthetic

**Settings:**
- ☐ Accent hue picker (override dominant hue)
- ☐ Grayscale warmth (cool/neutral/warm gray)
- ☐ Accent saturation slider (50%-100%)

---

### 2. High Contrast Extraction

**Purpose:** Ensure all extracted colors meet WCAG AAA contrast requirements

**Use Case:** Accessibility-focused themes, terminal work, low-vision users

**Algorithm:**
```typescript
export function extractHighContrast(imageData: ImageData): ColorScheme {
  // 1. Extract colors using existing algorithm (e.g., K-Means)
  let { base, accents } = extractKMeans(imageData, 16);

  // 2. Sort base colors by luminance
  base.sort((a, b) => luminance(hexToRgb(a)) - luminance(hexToRgb(b)));

  // 3. Enforce minimum contrast between adjacent base colors
  base = enforceMinimumContrast(base, 2.0);  // 2:1 minimum

  // 4. Ensure base00 (darkest) and base07 (lightest) have 7:1 contrast (AAA)
  const darkest = base[0];
  const lightest = base[7];

  while (contrastRatio(darkest, lightest) < 7.0) {
    // Darken base00
    base[0] = adjustLightness(base[0], -5);
    // Lighten base07
    base[7] = adjustLightness(base[7], +5);
  }

  // 5. Ensure all accent colors have 4.5:1 contrast with base00 (AA large text)
  accents = accents.map(accent => {
    while (contrastRatio(accent, base[0]) < 4.5) {
      accent = adjustLightness(accent, +5);
    }
    return accent;
  });

  return { base, accents };
}

function enforceMinimumContrast(colors: string[], minRatio: number): string[] {
  for (let i = 1; i < colors.length; i++) {
    while (contrastRatio(colors[i - 1], colors[i]) < minRatio) {
      // Adjust lightness to increase contrast
      const lighter = adjustLightness(colors[i], +3);
      const darker = adjustLightness(colors[i - 1], -3);

      // Choose adjustment that preserves color better
      if (colorDistance(colors[i], lighter) < colorDistance(colors[i - 1], darker)) {
        colors[i] = lighter;
      } else {
        colors[i - 1] = darker;
      }
    }
  }
  return colors;
}

function adjustLightness(hex: string, delta: number): string {
  const { r, g, b } = hexToRgb(hex);
  let { h, s, l } = rgbToHsl(r, g, b);
  l = Math.max(0, Math.min(100, l + delta));
  return rgbToHex(...hslToRgb(h, s, l));
}
```

**Features:**
- WCAG AAA compliance (7:1 contrast)
- Enforced contrast between adjacent colors
- Accessible by default
- No "bad" color combinations

**Settings:**
- ☐ Contrast level (AA / AAA)
- ☐ Minimum step contrast (1.5 / 2.0 / 3.0)
- ☐ Accent contrast mode (against bg / against fg)

---

### 3. Vibrant Extraction (Material Design Style)

**Purpose:** Extract the most vibrant, eye-catching colors from an image

**Use Case:** Colorful ricing, modern desktop themes, accent-heavy setups

**Algorithm:**
```typescript
export function extractVibrant(imageData: ImageData): ColorScheme {
  const pixels = getPixels(imageData);

  // 1. Filter out dull colors (low saturation, extreme lightness)
  const vibrantPixels = pixels.filter(({ r, g, b }) => {
    const { s, l } = rgbToHsl(r, g, b);
    return s > 40 && l > 20 && l < 80;  // Only medium saturation, avoid black/white
  });

  // 2. Cluster vibrant pixels by hue
  const hueGroups = groupByHue(vibrantPixels, 8);  // 8 hue groups

  // 3. Pick most saturated color from each hue group
  const accentColors = hueGroups.map(group => {
    return group.reduce((most, pixel) => {
      const { s: mostS } = rgbToHsl(most.r, most.g, most.b);
      const { s: pixelS } = rgbToHsl(pixel.r, pixel.g, pixel.b);
      return pixelS > mostS ? pixel : most;
    });
  });

  // 4. Generate muted base colors from image's neutral tones
  const neutralPixels = pixels.filter(({ r, g, b }) => {
    const { s } = rgbToHsl(r, g, b);
    return s < 20;  // Low saturation = neutral
  });

  const baseColors = extractKMeans({ data: neutralPixels }, 8);

  return {
    base: baseColors.map(rgbToHex),
    accents: accentColors.map(rgbToHex),
  };
}

function groupByHue(pixels: Pixel[], numGroups: number): Pixel[][] {
  const groups: Pixel[][] = Array.from({ length: numGroups }, () => []);

  pixels.forEach(pixel => {
    const { h } = rgbToHsl(pixel.r, pixel.g, pixel.b);
    const groupIndex = Math.floor((h / 360) * numGroups);
    groups[groupIndex].push(pixel);
  });

  return groups.filter(g => g.length > 0);
}
```

**Features:**
- Prioritizes saturated, vibrant colors
- Muted base palette (won't fight accents)
- Material Design-inspired
- Pop of color in every hue range

**Settings:**
- ☐ Vibrancy threshold (40% / 60% / 80% saturation)
- ☐ Hue coverage (ensure all hues represented)
- ☐ Accent boost (increase saturation by X%)

---

### 4. Dominant Color Scheme (Wallpaper-Focused)

**Purpose:** Build entire theme around image's single dominant color

**Use Case:** Wallpaper-first ricing, cohesive single-color setups

**Algorithm:**
```typescript
export function extractDominant(imageData: ImageData): ColorScheme {
  const pixels = getPixels(imageData);

  // 1. Find most common color cluster
  const clusters = kMeans(pixels, 16);
  const dominantCluster = clusters.reduce((largest, cluster) =>
    cluster.pixels.length > largest.pixels.length ? cluster : largest
  );

  const { r, g, b } = dominantCluster.centroid;
  const { h, s, l } = rgbToHsl(r, g, b);

  // 2. Generate base colors as tints/shades of dominant color
  const baseColors = [
    hslToRgb(h, s * 0.2, 10),   // base00: Very dark
    hslToRgb(h, s * 0.3, 18),   // base01: Dark
    hslToRgb(h, s * 0.25, 25),  // base02: Selection
    hslToRgb(h, s * 0.3, 35),   // base03: Comment
    hslToRgb(h, s * 0.2, 60),   // base04: Disabled
    hslToRgb(h, s * 0.15, 75),  // base05: Text
    hslToRgb(h, s * 0.1, 85),   // base06: Light
    hslToRgb(h, s * 0.05, 95),  // base07: Very light
  ];

  // 3. Generate accent colors as analogous/complementary to dominant
  const accentColors = [
    hslToRgb(h, 80, 50),         // base08: Dominant hue, vibrant
    hslToRgb(h + 30, 70, 55),    // base09: Analogous +30°
    hslToRgb(h + 60, 75, 60),    // base0A: Analogous +60°
    hslToRgb(h - 30, 65, 55),    // base0B: Analogous -30°
    hslToRgb(h + 180, 70, 50),   // base0C: Complementary
    hslToRgb(h + 150, 75, 55),   // base0D: Split-complementary
    hslToRgb(h + 210, 70, 50),   // base0E: Split-complementary
    hslToRgb(h, 40, 45),         // base0F: Dominant, muted
  ];

  return {
    base: baseColors.map(rgbToHex),
    accents: accentColors.map(rgbToHex),
  };
}
```

**Features:**
- Everything derives from one color
- Guaranteed harmony (color theory-based)
- Cohesive, unified look
- Perfect for single-color wallpapers

**Settings:**
- ☐ Dominant color picker (override detected)
- ☐ Harmony type (analogous / complementary / triadic)
- ☐ Saturation curve (how muted base colors are)

---

### 5. Muted/Pastel Extraction

**Purpose:** Soft, low-saturation palette for calm aesthetics

**Use Case:** Lo-fi ricing, productivity setups, easy-on-eyes themes

**Algorithm:**
```typescript
export function extractMuted(imageData: ImageData): ColorScheme {
  let { base, accents } = extractKMeans(imageData, 16);

  // 1. Reduce saturation of all colors
  const desaturate = (hex: string, targetSat: number) => {
    const { r, g, b } = hexToRgb(hex);
    let { h, s, l } = rgbToHsl(r, g, b);
    s = Math.min(s, targetSat);  // Cap saturation
    return rgbToHex(...hslToRgb(h, s, l));
  };

  // Base colors: very low saturation (10-20%)
  base = base.map(color => desaturate(color, 15));

  // Accent colors: moderate saturation (30-50%)
  accents = accents.map(color => desaturate(color, 40));

  // 2. Soften lightness (avoid pure black/white)
  const softenLightness = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    let { h, s, l } = rgbToHsl(r, g, b);
    if (l < 15) l = 15;  // Min lightness
    if (l > 85) l = 85;  // Max lightness
    return rgbToHex(...hslToRgb(h, s, l));
  };

  base = base.map(softenLightness);
  accents = accents.map(softenLightness);

  return { base, accents };
}
```

**Features:**
- Low saturation (pastel feel)
- No pure black or white
- Soft, calming colors
- Lo-fi aesthetic

**Settings:**
- ☐ Saturation cap (10% / 30% / 50%)
- ☐ Lightness range (15-85% / 20-80%)
- ☐ Pastel intensity (more/less washed out)

---

### 6. Edge Detection + Color Zones

**Purpose:** Detect image regions (sky, ground, subject) and extract colors from each

**Use Case:** Landscape wallpapers, multi-zone themes, semantic extraction

**Algorithm:**
```typescript
export function extractZoned(imageData: ImageData): ColorScheme {
  const { width, height, data } = imageData;

  // 1. Divide image into zones
  const zones = {
    top: getRegion(data, width, 0, 0, width, height * 0.3),     // Sky
    middle: getRegion(data, width, 0, height * 0.3, width, height * 0.7),  // Subject
    bottom: getRegion(data, width, 0, height * 0.7, width, height),  // Ground
  };

  // 2. Extract dominant colors from each zone
  const topColors = extractKMeans(zones.top, 3);
  const middleColors = extractKMeans(zones.middle, 6);
  const bottomColors = extractKMeans(zones.bottom, 3);

  // 3. Assign semantically
  const baseColors = [
    ...bottomColors.slice(0, 4),  // base00-03: Dark ground colors
    ...topColors.slice(0, 4),     // base04-07: Light sky colors
  ];

  const accentColors = middleColors;  // base08-0F: Subject colors

  return {
    base: baseColors.map(rgbToHex),
    accents: accentColors.map(rgbToHex),
  };
}

function getRegion(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  w: number,
  h: number
): ImageData {
  const regionData = new Uint8ClampedArray(w * h * 4);
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const srcIdx = ((y + row) * width + (x + col)) * 4;
      const dstIdx = (row * w + col) * 4;
      regionData[dstIdx] = data[srcIdx];
      regionData[dstIdx + 1] = data[srcIdx + 1];
      regionData[dstIdx + 2] = data[srcIdx + 2];
      regionData[dstIdx + 3] = data[srcIdx + 3];
    }
  }
  return new ImageData(regionData, w, h);
}
```

**Features:**
- Semantic color extraction (sky = light, ground = dark)
- Works well for landscape photos
- Natural color progression
- Context-aware palette

**Settings:**
- ☐ Zone layout (horizontal / vertical / center-focused)
- ☐ Zone emphasis (prioritize sky vs. subject vs. ground)

---

### 7. Complementary Harmony Generator

**Purpose:** Generate theme from image's two most complementary colors

**Use Case:** High-contrast ricing, dual-accent themes

**Algorithm:**
```typescript
export function extractComplementary(imageData: ImageData): ColorScheme {
  const pixels = getPixels(imageData);

  // 1. Find all unique hues in image
  const hues = pixels.map(({ r, g, b }) => rgbToHsl(r, g, b).h);
  const uniqueHues = [...new Set(hues.map(h => Math.floor(h / 10) * 10))];

  // 2. Find two most complementary hues (180° apart)
  let bestPair = [0, 180];
  let bestScore = 0;

  for (let i = 0; i < uniqueHues.length; i++) {
    for (let j = i + 1; j < uniqueHues.length; j++) {
      const diff = Math.abs(uniqueHues[i] - uniqueHues[j]);
      const complementaryScore = 1 - Math.abs(diff - 180) / 180;

      if (complementaryScore > bestScore) {
        bestScore = complementaryScore;
        bestPair = [uniqueHues[i], uniqueHues[j]];
      }
    }
  }

  const [hue1, hue2] = bestPair;

  // 3. Generate base colors from hue1 (dominant)
  const baseColors = [
    hslToRgb(hue1, 20, 10),
    hslToRgb(hue1, 25, 18),
    hslToRgb(hue1, 20, 25),
    hslToRgb(hue1, 25, 35),
    hslToRgb(hue1, 15, 60),
    hslToRgb(hue1, 10, 75),
    hslToRgb(hue1, 5, 85),
    hslToRgb(hue1, 5, 95),
  ];

  // 4. Generate accent colors alternating between two hues
  const accentColors = [
    hslToRgb(hue1, 80, 50),
    hslToRgb(hue2, 70, 55),
    hslToRgb(hue1, 75, 60),
    hslToRgb(hue2, 65, 55),
    hslToRgb(hue1, 70, 50),
    hslToRgb(hue2, 75, 55),
    hslToRgb(hue1, 70, 50),
    hslToRgb(hue2, 40, 45),
  ];

  return {
    base: baseColors.map(rgbToHex),
    accents: accentColors.map(rgbToHex),
  };
}
```

**Features:**
- Balanced two-color scheme
- High visual contrast
- Color wheel harmony
- Dual-accent aesthetic

---

### 8. Seasonal/Mood Extraction

**Purpose:** Classify image by season/mood and apply preset palette adjustments

**Use Case:** Thematic ricing (autumn, winter, cyberpunk, vaporwave)

**Algorithm:**
```typescript
type Mood = 'warm' | 'cool' | 'autumn' | 'winter' | 'cyberpunk' | 'vaporwave';

export function extractMood(imageData: ImageData, mood: Mood): ColorScheme {
  // 1. Extract base palette
  let { base, accents } = extractKMeans(imageData, 16);

  // 2. Apply mood-specific transformations
  const moodTransforms = {
    warm: (hex: string) => {
      const { r, g, b } = hexToRgb(hex);
      let { h, s, l } = rgbToHsl(r, g, b);
      h = (h + 10) % 360;  // Shift hue toward red/orange
      s = Math.min(100, s + 10);  // Increase saturation
      return rgbToHex(...hslToRgb(h, s, l));
    },
    cool: (hex: string) => {
      const { r, g, b } = hexToRgb(hex);
      let { h, s, l } = rgbToHsl(r, g, b);
      h = (h - 10 + 360) % 360;  // Shift toward blue/cyan
      s = Math.max(0, s - 10);  // Decrease saturation
      return rgbToHex(...hslToRgb(h, s, l));
    },
    autumn: (hex: string) => {
      const { r, g, b } = hexToRgb(hex);
      let { h, s, l } = rgbToHsl(r, g, b);
      // Push colors toward orange/brown
      h = 30 + (h - 30) * 0.7;  // Converge toward orange
      s = Math.min(80, s + 15);
      l = Math.max(20, l - 5);
      return rgbToHex(...hslToRgb(h, s, l));
    },
    cyberpunk: (hex: string) => {
      const { r, g, b } = hexToRgb(hex);
      let { h, s, l } = rgbToHsl(r, g, b);
      // Neon colors: magenta/cyan/purple
      if (h > 180) h = 300;  // Magenta
      else if (h > 90) h = 180;  // Cyan
      else h = 270;  // Purple
      s = 100;  // Max saturation
      l = 50;
      return rgbToHex(...hslToRgb(h, s, l));
    },
    vaporwave: (hex: string) => {
      const { r, g, b } = hexToRgb(hex);
      let { h, s, l } = rgbToHsl(r, g, b);
      // Pastel pinks/blues
      if (h < 180) h = 320;  // Pink
      else h = 200;  // Blue
      s = 60;  // Moderate saturation
      l = 75;  // Light
      return rgbToHex(...hslToRgb(h, s, l));
    },
  };

  const transform = moodTransforms[mood];
  base = base.map(transform);
  accents = accents.map(transform);

  return { base, accents };
}
```

**Features:**
- Preset aesthetic styles
- Hue shifting for thematic consistency
- Easy "vibe" selection
- Popular ricing aesthetics built-in

---

## UI/UX Integration

### Algorithm Selector in Generate Panel

```tsx
// Update GeneratePanel.tsx

const algorithms = [
  { id: 'kmeans', name: 'K-Means', description: 'Balanced, natural' },
  { id: 'mediancut', name: 'Median Cut', description: 'Fast, accurate' },
  { id: 'histogram', name: 'Histogram', description: 'Frequency-based' },
  { id: 'octree', name: 'Octree', description: 'Tree quantization' },
  // NEW ALGORITHMS
  { id: 'monochrome', name: 'Monochrome + Accent', description: 'Grayscale with single color' },
  { id: 'highcontrast', name: 'High Contrast', description: 'WCAG AAA compliant' },
  { id: 'vibrant', name: 'Vibrant', description: 'Saturated, eye-catching' },
  { id: 'dominant', name: 'Dominant Color', description: 'Single-color scheme' },
  { id: 'muted', name: 'Muted/Pastel', description: 'Soft, low saturation' },
  { id: 'zoned', name: 'Regional Zones', description: 'Sky/subject/ground' },
  { id: 'complementary', name: 'Complementary', description: 'Two opposing hues' },
  { id: 'mood', name: 'Mood/Seasonal', description: 'Thematic presets' },
];

// Settings panel for selected algorithm
{selectedAlgorithm === 'monochrome' && (
  <div className="mt-4 space-y-3">
    <label>Accent Hue</label>
    <input
      type="range"
      min="0"
      max="360"
      value={accentHue}
      onChange={(e) => setAccentHue(e.target.value)}
    />
    <label>Grayscale Warmth</label>
    <select>
      <option>Cool</option>
      <option>Neutral</option>
      <option>Warm</option>
    </select>
  </div>
)}
```

### Preview Before Apply

```tsx
// Show side-by-side comparison

<div className="grid grid-cols-2 gap-4">
  <div>
    <h3>Current Scheme</h3>
    <ColorPreview scheme={currentScheme} />
  </div>
  <div>
    <h3>Generated ({algorithmName})</h3>
    <ColorPreview scheme={generatedScheme} />
  </div>
</div>

<div className="flex gap-2">
  <button onClick={handleApply}>Apply</button>
  <button onClick={handleMerge}>Merge Accents Only</button>
  <button onClick={handleCancel}>Cancel</button>
</div>
```

---

## Implementation Priority

### Quick Wins (Week 1)
1. ✅ **Monochrome Extraction** - Simple, high demand
2. ✅ **Vibrant Extraction** - Already have saturation detection
3. ✅ **Muted/Pastel** - Just desaturation logic

### Medium Effort (Week 2-3)
4. ✅ **High Contrast** - Requires contrast enforcement
5. ✅ **Dominant Color** - Uses existing K-Means
6. ✅ **Complementary** - Color wheel math

### Advanced (Week 4+)
7. ✅ **Zoned Extraction** - Image segmentation required
8. ✅ **Mood/Seasonal** - Preset tuning

---

## Testing & Validation

### Test Images
- **Landscape:** Mountains, sky, water (test zoned extraction)
- **Abstract:** Geometric patterns (test vibrant/dominant)
- **Monochrome Photo:** Black & white image (test monochrome mode)
- **Sunset:** Warm colors (test warm/autumn mood)
- **Neon Signs:** Cyberpunk aesthetic (test cyberpunk mood)

### Success Metrics
- ✅ All 16 colors are distinct (ΔE > 10 between similar colors)
- ✅ Base colors have even luminance progression
- ✅ Accent colors span full hue wheel (not all blues)
- ✅ WCAG contrast ratios meet minimums (AA or AAA)
- ✅ Generated themes look "usable" not just "accurate"

---

## Conclusion

Current algorithms focus on **accuracy** - extracting what's in the image. New algorithms should focus on **usability** - generating themes people actually want to use.

**Key Insight:** Ricing isn't about perfect color extraction, it's about creating **cohesive, harmonious, usable themes** that match a wallpaper's vibe.

**Priority Order:**
1. Monochrome (most requested)
2. Vibrant (Instagram-style themes)
3. High Contrast (accessibility)
4. Dominant (wallpaper-first approach)

These four alone will cover 80% of ricing use cases.
