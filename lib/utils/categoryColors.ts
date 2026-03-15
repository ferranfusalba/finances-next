export const CATEGORY_PALETTE = [
  "4F46E5", "7C3AED", "DB2777", "DC2626", "EA580C",
  "D97706", "CA8A04", "65A30D", "16A34A", "0D9488",
  "0891B2", "0284C7", "2563EB", "4338CA", "7E22CE",
  "A21CAF", "BE185D", "B91C1C", "C2410C", "A16207",
  "4D7C0F", "15803D", "0F766E", "0E7490",
];

export function getRandomCategoryColor(): string {
  return CATEGORY_PALETTE[Math.floor(Math.random() * CATEGORY_PALETTE.length)];
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v].map((x) => x.toString(16).padStart(2, "0")).join("");
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function deriveSubcategoryColor(
  parentHex: string,
  index: number,
): string {
  const { h, s, l } = hexToHsl(parentHex);
  const step = 0.08;
  const newL = Math.min(0.85, l + step * (index + 1));
  return hslToHex(h, s * 0.9, newL);
}
