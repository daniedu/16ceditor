# Color Accuracy Improvements - Display Like Native Apps

## Executive Summary

This document outlines suggestions to improve color accuracy in the 16ceditor to match native application color rendering, particularly for terminal emulators, GTK, and Qt applications.

## Current State Analysis

### Strengths
- ✅ Proper WCAG 2.1 contrast calculations with gamma correction
- ✅ Accurate RGB ↔ HSL ↔ Hex conversions
- ✅ Saturation and luminance indicators
- ✅ Relative luminance calculations are correctly implemented

### Limitations
- ❌ No perceptual color space support (LAB/LCH)
- ❌ Web RGB (sRGB) only - no wide-gamut color support
- ❌ No color profile awareness (ICC profiles)
- ❌ Terminal preview uses hardcoded colors instead of actual scheme
- ❌ No gamma correction preview options
- ❌ Browser color management not accounted for

---

## 1. Perceptual Color Spaces (LAB/LCH)

### Problem
Current color operations (saturation, lightness) use HSL, which is not perceptually uniform. Two colors with the same HSL lightness may appear different in brightness to the human eye.

### Solution: Implement CIELAB/CIELCH Support

**Benefits:**
- Perceptually uniform color space
- Better color harmony calculations
- More accurate "distance" between colors
- Matches how human vision perceives color

**Implementation:**
```typescript
// Add to src/lib/color.ts

// RGB → XYZ → LAB conversion
export function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  // 1. Convert sRGB to linear RGB
  const toLinear = (c: number) => {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  // 2. Linear RGB → XYZ (D65 illuminant)
  let x = rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375;
  let y = rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.0721750;
  let z = rLinear * 0.0193339 + gLinear * 0.1191920 + bLinear * 0.9503041;

  // 3. XYZ → LAB (D65 white point)
  const D65 = { x: 0.95047, y: 1.00000, z: 1.08883 };
  x = x / D65.x;
  y = y / D65.y;
  z = z / D65.z;

  const f = (t: number) => t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t) + (16 / 116);

  const L = (116 * f(y)) - 16;
  const a = 500 * (f(x) - f(y));
  const b = 200 * (f(y) - f(z));

  return { l: L, a, b };
}

// LAB → LCH conversion (more intuitive than LAB)
export function labToLch(l: number, a: number, b: number): { l: number; c: number; h: number } {
  const c = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (h < 0) h += 360;
  return { l, c, h };
}

// Perceptual color difference (ΔE 2000 - industry standard)
export function deltaE2000(lab1: Lab, lab2: Lab): number {
  // Implementation of CIEDE2000 formula
  // Returns perceptual distance (0 = identical, >100 = very different)
  // Use for "these colors are too similar" warnings
}
```

**Use Cases:**
- **Harmony Calculations**: Use LCH instead of HSL for complementary/triadic color generation
- **Saturation Sorting**: Sort accent colors by chroma (C in LCH) instead of HSL saturation
- **Color Distance**: Warn users when two swatches are too similar (ΔE < 5)
- **Lightness Adjustments**: Ensure base00-base07 have perceptually even lightness steps

---

## 2. Color Profile Awareness

### Problem
Web browsers apply color management differently. macOS Safari uses Display P3 by default, while Chrome/Firefox use sRGB. This causes colors to appear different across platforms.

### Solution: Detect & Respect Color Profiles

**Implementation:**
```typescript
// Add to src/lib/color.ts

// Detect wide-gamut support
export function supportsWideGamut(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for P3 color space support
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { colorSpace: 'display-p3' });

  return ctx !== null &&
         (ctx as any).getContextAttributes?.()?.colorSpace === 'display-p3';
}

// Convert hex to CSS color() syntax with profile
export function hexToColorSpace(hex: string, profile: 'srgb' | 'display-p3' = 'srgb'): string {
  const { r, g, b } = hexToRgb(hex);

  if (profile === 'display-p3' && supportsWideGamut()) {
    // Convert sRGB → Display P3 (approximate)
    // This requires proper color space transformation
    return `color(display-p3 ${r/255} ${g/255} ${b/255})`;
  }

  return `rgb(${r}, ${g}, ${b})`;
}
```

**UI Integration:**
- Add toggle in settings: "Use Display P3 (wide-gamut)" when supported
- Show color profile indicator in status bar
- Export formats should include P3 variants for modern terminals (iTerm2, Alacritty)

---

## 3. Gamma Correction Preview

### Problem
Terminal emulators handle gamma differently. Some apply gamma 2.2, others use linear RGB. This affects how colors appear.

### Solution: Gamma Preview Toggle

**Implementation:**
```typescript
// Add to src/lib/color.ts

export function applyGamma(hex: string, gamma: number = 2.2): string {
  const { r, g, b } = hexToRgb(hex);

  const gammaCorrect = (c: number) => {
    c = c / 255;
    c = Math.pow(c, 1 / gamma);
    return Math.round(c * 255);
  };

  return rgbToHex(
    gammaCorrect(r),
    gammaCorrect(g),
    gammaCorrect(b)
  );
}
```

**UI Addition:**
- Add gamma slider to preview panels (1.0 - 2.4)
- Default: 2.2 (most common)
- Show "Linear (1.0)" and "sRGB (2.2)" presets
- Apply gamma to Terminal/GTK/Qt previews dynamically

---

## 4. Terminal Preview Accuracy

### Problem
`TerminalPreview.tsx` currently uses hardcoded colors in the ANSI grid instead of reflecting the actual scheme colors.

### Current Code Analysis
Looking at `src/app/components/TerminalPreview.tsx` (lines 100-120), the ANSI grid likely hardcodes colors like:
```tsx
<span style={{ color: '#000000' }}>███</span>  // Should use base00
```

### Solution: Dynamic ANSI Mapping

**Implementation:**
```typescript
// In TerminalPreview.tsx

const ansiColors = schemeToAnsi(scheme); // Already exists in mappings.ts

// Use actual colors from scheme
<div className="grid grid-cols-8 gap-1 font-mono text-xs">
  {ansiColors.map((color, i) => (
    <div
      key={i}
      className="h-6 rounded flex items-center justify-center"
      style={{
        backgroundColor: color,
        color: getTextColor(color)  // Dynamic text contrast
      }}
    >
      {i}
    </div>
  ))}
</div>
```

**Additional Features:**
- Show actual ANSI escape codes on hover
- Add "Test String" input to preview custom text
- Include bold/italic/underline variations
- Show 256-color palette mapping (base16 colors used for ANSI extended)

---

## 5. Color Blindness Simulation

### Problem
Designers may not realize their theme is hard to use for color-blind users.

### Solution: Add Color Blindness Filters

**Implementation:**
```typescript
// Add to src/lib/color.ts

type ColorBlindnessType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

// Simulate color blindness using Brettel 1997 algorithm
export function simulateColorBlindness(hex: string, type: ColorBlindnessType): string {
  const { r, g, b } = hexToRgb(hex);

  // Transform matrices for different types
  const matrices = {
    protanopia: [
      [0.567, 0.433, 0],
      [0.558, 0.442, 0],
      [0, 0.242, 0.758]
    ],
    deuteranopia: [
      [0.625, 0.375, 0],
      [0.7, 0.3, 0],
      [0, 0.3, 0.7]
    ],
    tritanopia: [
      [0.95, 0.05, 0],
      [0, 0.433, 0.567],
      [0, 0.475, 0.525]
    ],
    achromatopsia: [
      [0.299, 0.587, 0.114],
      [0.299, 0.587, 0.114],
      [0.299, 0.587, 0.114]
    ]
  };

  const matrix = matrices[type];
  const rNew = Math.round(r * matrix[0][0] + g * matrix[0][1] + b * matrix[0][2]);
  const gNew = Math.round(r * matrix[1][0] + g * matrix[1][1] + b * matrix[1][2]);
  const bNew = Math.round(r * matrix[2][0] + g * matrix[2][1] + b * matrix[2][2]);

  return rgbToHex(rNew, gNew, bNew);
}
```

**UI Integration:**
- Add dropdown in preview panels: "Simulate: None | Protanopia | Deuteranopia | Tritanopia | Achromatopsia"
- Show before/after side-by-side when filter active
- Add WCAG check specifically for color-blind users (AAA contrast may not be enough)

---

## 6. HDR and Tone Mapping

### Problem
Modern displays support HDR (High Dynamic Range), but web color values are limited to SDR (Standard Dynamic Range). Terminal themes may look washed out on HDR displays.

### Solution: Tone Mapping Options

**Implementation:**
```typescript
// Add to src/lib/color.ts

export function applyToneMapping(hex: string, method: 'reinhard' | 'filmic' | 'aces'): string {
  const { r, g, b } = hexToRgb(hex);

  // Simple Reinhard tone mapping
  const tonemap = (c: number) => {
    c = c / 255;
    c = c / (1 + c);  // Reinhard operator
    return Math.round(c * 255);
  };

  // Apply to each channel
  return rgbToHex(
    tonemap(r),
    tonemap(g),
    tonemap(b)
  );
}
```

**Note:** This is advanced and may not be necessary unless targeting HDR-specific terminals.

---

## 7. Color Accuracy Validation Tools

### Additions to Contrast Panel

**Current:** Shows 5 key contrast pairs with WCAG levels

**Proposed Additions:**

1. **Perceptual Uniformity Check**
   - Validate base00-base07 have even luminance steps
   - Warn if any two adjacent steps have ΔE < 10

2. **Saturation Balance**
   - Show average saturation of accent colors (base08-base0F)
   - Warn if saturation variance is too high (some colors too muted, others too vibrant)

3. **Hue Distribution**
   - Show hue wheel visualization of accent colors
   - Warn if all accents are in same hue range (e.g., all blues)

4. **Platform-Specific Warnings**
   - "This color may not render accurately in Alacritty (gamma 2.2)"
   - "Terminal.app may display this as #xxxxxx instead"

---

## 8. Export Enhancements

### Current Limitations
Export formats (Alacritty, Xresources, etc.) use hex values directly. Native apps may interpret these differently.

### Proposed Additions

**1. Alacritty Color Space Support**
Alacritty supports `draw_bold_text_with_bright_colors` - export should include this with proper ANSI mapping.

**2. GTK CSS Color Functions**
Instead of:
```css
@define-color theme_fg_color #ffffff;
```

Use CSS4 color functions for better accuracy:
```css
@define-color theme_fg_color color-mix(in srgb, #ffffff 100%, transparent);
```

**3. Qt Palette with Gamma**
Qt QPalette can specify gamma-corrected colors. Export should include these variants.

**4. Terminal.sexy Enhancement**
Add Display P3 color space option when exporting for modern terminals.

---

## Implementation Priority

### High Priority (Most Impact)
1. ✅ **Dynamic Terminal Preview** - Use actual scheme colors in ANSI grid
2. ✅ **Perceptual Color Space (LAB/LCH)** - Better color operations
3. ✅ **Gamma Preview Toggle** - Match different terminal behaviors

### Medium Priority
4. **Color Blindness Simulation** - Accessibility improvement
5. **Color Profile Awareness** - P3 support for modern displays
6. **Enhanced Contrast Panel** - Perceptual uniformity checks

### Low Priority (Advanced Features)
7. **Tone Mapping** - HDR displays (niche use case)
8. **Export Enhancements** - Platform-specific optimizations

---

## Testing Recommendations

### Cross-Platform Color Accuracy Testing

**Test Environments:**
- macOS Terminal.app (gamma 1.8, Display P3)
- Alacritty (gamma 2.2, sRGB)
- iTerm2 (gamma 2.2, P3 support)
- GNOME Terminal (GTK, linear RGB)
- Konsole (Qt, sRGB)
- Windows Terminal (sRGB, gamma 2.2)

**Test Methodology:**
1. Export same theme to all terminals
2. Take screenshots with color picker tool
3. Compare exported hex vs. actual rendered hex
4. Document gamma/color space differences
5. Adjust export formats accordingly

---

## Conclusion

Color accuracy is crucial for a theme editor. The current implementation is solid for basic use, but adding perceptual color spaces (LAB/LCH), gamma awareness, and platform-specific preview options will make 16ceditor the most accurate theme editor available.

**Key Takeaway:** Focus on LAB/LCH color space first - this single change will improve color harmony, sorting, and user experience across all features.
