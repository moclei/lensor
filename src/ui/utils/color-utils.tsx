// Utility functions for color manipulation
export function parseRgbColor(
  color: string
): { r: number; g: number; b: number } | null {
  const rgbMatch = color.match(/\d+/g);
  if (!rgbMatch || rgbMatch.length !== 3) {
    console.error('Invalid RGB color string:', color);
    return null;
  }

  return {
    r: parseInt(rgbMatch[0]),
    g: parseInt(rgbMatch[1]),
    b: parseInt(rgbMatch[2])
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

// Convert hex color to rgba string with specified opacity
export function hexToRgba(hex: string, opacity: number = 1): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0, 0, 0, ${opacity})`;

  // Ensure opacity is between 0 and 1
  const alpha = Math.max(0, Math.min(1, opacity));

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

// Convert a color to its grayscale equivalent
// Primary function that takes and returns hex color strings
export function toGrayscale(color: string): string {
  // If it's not a hex color, try to parse it
  if (!color.startsWith('#')) {
    const rgbRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/i;
    const rgbMatch = color.match(rgbRegex);

    if (rgbMatch) {
      // Convert rgb/rgba to hex first
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      color = rgbToHex(r, g, b);
    }
  }

  // Now treat as hex
  const rgb = hexToRgb(color);
  if (!rgb) return '#808080'; // Default gray if parsing fails

  // Calculate grayscale value using luminance formula
  // This preserves perceived brightness of the original color
  const grayValue = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);

  // Return a hex grayscale color
  return rgbToHex(grayValue, grayValue, grayValue);
}

// Optional utility that preserves the original format of the color
export function convertToGrayscalePreservingFormat(color: string): string {
  const grayscaleHex = toGrayscale(color);
  const grayscaleRgb = hexToRgb(grayscaleHex);

  if (!grayscaleRgb) return grayscaleHex; // Fallback to hex

  // Handle rgba format
  const rgbaRegex = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/i;
  const rgbaMatch = color.match(rgbaRegex);

  if (rgbaMatch) {
    const alpha = parseFloat(rgbaMatch[4]);
    return `rgba(${grayscaleRgb.r}, ${grayscaleRgb.g}, ${grayscaleRgb.b}, ${alpha})`;
  }

  // Handle rgb format
  const rgbRegex = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/i;
  const rgbMatch = color.match(rgbRegex);

  if (rgbMatch) {
    return `rgb(${grayscaleRgb.r}, ${grayscaleRgb.g}, ${grayscaleRgb.b})`;
  }

  // Default to hex
  return grayscaleHex;
}

// export const getContrastColor = React.useCallback((color: string): string => {
//   const rgbMatch = color.match(/\d+/g);
//   if (!rgbMatch || rgbMatch.length !== 3) {
//     console.error('Invalid RGB color string:', color);
//     return '#ffffff'; // Default to white if parsing fails
//   }

//   const [r, g, b] = rgbMatch.map(Number);

//   // Calculate relative luminance
//   const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

//   // Choose white or black based on luminance
//   const contrastColor = luminance > 0.5 ? '#000000' : '#ffffff';
//   return contrastColor;
// }, []);

export const extractPixelColor = (
  canvas: HTMLCanvasElement,
  x: number = canvas.width / 2,
  y: number = canvas.height / 2
): string => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get canvas context');
    return 'rgb(0,0,0)';
  }

  const pixel = ctx.getImageData(x, y, 1, 1);
  return `rgb(${pixel.data[0]}, ${pixel.data[1]}, ${pixel.data[2]})`;
};

export const getContrastColorFromRGB = (color: string): string => {
  const rgbMatch = color.match(/\d+/g);
  if (!rgbMatch || rgbMatch.length !== 3) {
    console.error('Invalid RGB color string:', color);
    return '#ffffff';
  }

  const [r, g, b] = rgbMatch.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Grid-specific contrast function with lower threshold
// Only switches to white grid for very dark colors (luminance < 0.3)
export const getGridContrastColor = (color: string): string => {
  const rgbMatch = color.match(/\d+/g);
  if (!rgbMatch || rgbMatch.length !== 3) {
    return '#000000'; // Default to black grid
  }

  const [r, g, b] = rgbMatch.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Use white grid only for very dark colors
  return luminance < 0.3 ? '#ffffff' : '#000000';
};

// Convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Generate a palette using different color harmony rules
export function generatePalette(
  rgbStr: string,
  type:
    | 'analogous'
    | 'triadic'
    | 'complementary'
    | 'monochromatic'
    | 'tetradic' = 'analogous'
): string[] {
  const rgb = parseRgbColor(rgbStr);
  if (!rgb) {
    console.error('Invalid rgb string:', rgbStr);
    return [rgbStr];
  }
  const baseColor = rgbToHex(rgb.r, rgb.g, rgb.b);

  const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const palette: string[] = [];

  switch (type) {
    case 'monochromatic':
      // Same hue, different lightness/saturation
      palette.push(baseColor); // Original color

      // Darker variants
      palette.push(rgbToHex(...hslToRgb(h, s, Math.max(l - 20, 0))));
      palette.push(rgbToHex(...hslToRgb(h, s, Math.max(l - 40, 0))));

      // Lighter variants
      palette.push(rgbToHex(...hslToRgb(h, s, Math.min(l + 20, 100))));
      palette.push(rgbToHex(...hslToRgb(h, s, Math.min(l + 40, 100))));

      break;

    case 'analogous':
      // Colors adjacent on the color wheel
      palette.push(rgbToHex(...hslToRgb((h - 30 + 360) % 360, s, l))); // -30 degrees
      palette.push(baseColor); // Original color
      palette.push(rgbToHex(...hslToRgb((h + 30) % 360, s, l))); // +30 degrees
      palette.push(rgbToHex(...hslToRgb((h - 60 + 360) % 360, s, l))); // -60 degrees
      palette.push(rgbToHex(...hslToRgb((h + 60) % 360, s, l))); // +60 degrees
      break;

    case 'triadic':
      // Three colors evenly spaced on the color wheel
      palette.push(baseColor); // Original color
      palette.push(rgbToHex(...hslToRgb((h + 120) % 360, s, l))); // +120 degrees
      palette.push(rgbToHex(...hslToRgb((h + 240) % 360, s, l))); // +240 degrees
      break;

    case 'complementary':
      // Colors opposite on the color wheel
      palette.push(baseColor); // Original color
      palette.push(rgbToHex(...hslToRgb((h + 180) % 360, s, l))); // Opposite color

      // Add variations
      palette.push(rgbToHex(...hslToRgb(h, s, Math.max(l - 15, 0)))); // Darker original
      palette.push(
        rgbToHex(...hslToRgb((h + 180) % 360, s, Math.max(l - 15, 0)))
      ); // Darker opposite
      break;

    case 'tetradic':
      // Four colors arranged in two complementary pairs
      palette.push(baseColor); // Original color
      palette.push(rgbToHex(...hslToRgb((h + 90) % 360, s, l))); // +90 degrees
      palette.push(rgbToHex(...hslToRgb((h + 180) % 360, s, l))); // +180 degrees
      palette.push(rgbToHex(...hslToRgb((h + 270) % 360, s, l))); // +270 degrees
      break;
  }

  return palette;
}

// Create Material-style tonal palette (based on a primary color)
export function generateMaterialPalette(
  rgbStr: string
): Record<number, string> {
  const rgb = parseRgbColor(rgbStr);
  if (!rgb) {
    console.error('Invalid hex color:', rgbStr);
    return { 500: rgbStr };
  }

  const baseColor = rgbToHex(rgb.r, rgb.g, rgb.b);
  const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Create a palette with different brightness levels (similar to Material's 100-900 scale)
  const tonalMap: Record<number, string> = {
    50: rgbToHex(...hslToRgb(h, Math.max(s - 15, 0), 95)),
    100: rgbToHex(...hslToRgb(h, Math.max(s - 10, 0), 90)),
    200: rgbToHex(...hslToRgb(h, Math.max(s - 5, 0), 80)),
    300: rgbToHex(...hslToRgb(h, s, 70)),
    400: rgbToHex(...hslToRgb(h, s, 60)),
    500: baseColor, // Original color
    600: rgbToHex(...hslToRgb(h, Math.min(s + 5, 100), 50)),
    700: rgbToHex(...hslToRgb(h, Math.min(s + 10, 100), 40)),
    800: rgbToHex(...hslToRgb(h, Math.min(s + 15, 100), 30)),
    900: rgbToHex(...hslToRgb(h, Math.min(s + 20, 100), 20))
  };

  return tonalMap;
}

// Generate a complete Material Design-like theme with primary, secondary, and tertiary colors
export function generateMaterialTheme(primaryColor: string): {
  primary: Record<number, string>;
  secondary: Record<number, string>;
  tertiary: Record<number, string>;
  error: Record<number, string>;
} {
  const rgb = hexToRgb(primaryColor);
  if (!rgb) {
    console.error('Invalid hex color:', primaryColor);
    return {
      primary: { 500: primaryColor },
      secondary: { 500: '#03DAC6' },
      tertiary: { 500: '#BB86FC' },
      error: { 500: '#B00020' }
    };
  }

  const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Create secondary and tertiary colors based on color theory
  // Secondary: Analogous (+60 degrees on the color wheel)
  const secondaryHue = (h + 60) % 360;
  const secondaryColor = rgbToHex(...hslToRgb(secondaryHue, s, l));

  // Tertiary: Analogous in the other direction (-60 degrees)
  const tertiaryHue = (h - 60 + 360) % 360;
  const tertiaryColor = rgbToHex(...hslToRgb(tertiaryHue, s, l));

  // Error color (red-based)
  const errorColor = '#B00020';

  return {
    primary: generateMaterialPalette(primaryColor),
    secondary: generateMaterialPalette(secondaryColor),
    tertiary: generateMaterialPalette(tertiaryColor),
    error: generateMaterialPalette(errorColor)
  };
}

// Additional utility: Get contrasting text color for a background
export function getTextColorForBackground(bgColor: string): string {
  const rgb = hexToRgb(bgColor);
  if (!rgb) return '#000000';

  // Calculate relative luminance
  const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;

  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 128 ? '#000000' : '#ffffff';
}

// Get texture colors for knurling effect - lighter and darker variants
// Used for embossed/knurling effects where we want visible but not stark contrast
export function getSubtleTextureColor(
  baseColor: string,
  highlightIntensity: number = 5,
  shadowIntensity: number = 25
): { highlight: string; highlightBright: string; highlightBrightest: string; shadow: string } {
  // Try to parse as hex first, then as rgb
  let rgb = hexToRgb(baseColor);
  
  if (!rgb) {
    // Try parsing as rgb/rgba string
    const rgbMatch = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgbMatch) {
      rgb = {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10)
      };
    }
  }
  
  if (!rgb) {
    return { highlight: '#ffffff', highlightBright: '#ffffff', highlightBrightest: '#ffffff', shadow: '#000000' };
  }

  const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // Create highlight variants (progressively lighter)
  const highlight = rgbToHex(
    ...hslToRgb(h, Math.max(s - 10, 0), Math.min(l + highlightIntensity, 100))
  );
  const highlightBright = rgbToHex(
    ...hslToRgb(h, Math.max(s - 15, 0), Math.min(l + highlightIntensity + 12, 100))
  );
  const highlightBrightest = rgbToHex(
    ...hslToRgb(h, Math.max(s - 20, 0), Math.min(l + highlightIntensity + 20, 100))
  );
  
  // Create shadow (darker)
  const shadow = rgbToHex(
    ...hslToRgb(h, Math.max(s - 10, 0), Math.max(l - shadowIntensity, 0))
  );
  
  return { highlight, highlightBright, highlightBrightest, shadow };
}

// Enhanced color palette generator with variants
export function generateEnhancedPalette(baseColor: string): {
  main: string;
  light: string;
  dark: string;
  contrast: string;
  variants: string[];
} {
  const rgb = hexToRgb(baseColor);
  if (!rgb) {
    console.error('Invalid hex color:', baseColor);
    return {
      main: baseColor,
      light: '#ffffff',
      dark: '#000000',
      contrast: '#ffffff',
      variants: [baseColor]
    };
  }

  const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Create main variants
  const light = rgbToHex(
    ...hslToRgb(h, Math.max(s - 10, 0), Math.min(l + 15, 95))
  );
  const dark = rgbToHex(
    ...hslToRgb(h, Math.min(s + 10, 100), Math.max(l - 15, 15))
  );

  // Get contrast color for text
  const contrast = getTextColorForBackground(baseColor);

  // Create 5 variants with different saturations and lightness
  const variants = [
    rgbToHex(...hslToRgb(h, Math.max(s - 20, 0), Math.min(l + 30, 95))), // Very light
    rgbToHex(...hslToRgb(h, Math.max(s - 10, 0), Math.min(l + 15, 90))), // Light
    baseColor, // Original color
    rgbToHex(...hslToRgb(h, Math.min(s + 10, 100), Math.max(l - 15, 25))), // Dark
    rgbToHex(...hslToRgb(h, Math.min(s + 20, 100), Math.max(l - 30, 15))) // Very dark
  ];

  return { main: baseColor, light, dark, contrast, variants };
}
