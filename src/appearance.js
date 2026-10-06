export const ELEMENTS = {
  neutral: { name: 'Neutral', hue: null, saturation: 0, orb: null },
  water: { name: 'Water', hue: 207, saturation: 0.62, orb: [86, 195, 234] },
  earth: { name: 'Earth', hue: 113, saturation: 0.30, orb: [134, 170, 93] },
  fire: { name: 'Fire', hue: 7, saturation: 0.60, orb: [246, 121, 57] },
  wind: { name: 'Wind', hue: 169, saturation: 0.28, orb: [164, 219, 207] },
  lightning: { name: 'Lightning', hue: 48, saturation: 0.58, orb: [248, 218, 89] }
};
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  const pairs = [[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]];
  return pairs[Math.floor(h / 60) % 6].map(v => Math.round((v + m) * 255));
}
export function recolorCloth(r, g, b, element) {
  const palette = ELEMENTS[element] || ELEMENTS.neutral;
  // Only purple textile pixels. Skin, brown hair/leather/wood and tan trim are excluded.
  if (palette.hue === null || !(b > g * 1.16 && r > g * 1.12 && b >= r * 0.87)) return [r,g,b];
  const light = (Math.max(r,g,b) + Math.min(r,g,b)) / 510;
  return hslToRgb(palette.hue, palette.saturation, light);
}
export function recolorOrb(r, g, b, element, normalizedY) {
  const palette = ELEMENTS[element] || ELEMENTS.neutral;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  // The neutral gray/ivory sphere is inside the top fifth of the staff.
  if (!palette.orb || normalizedY > 0.22 || max < 100 || max - min > 42) return [r,g,b];
  const shade = (r + g + b) / (3 * 230);
  return palette.orb.map(channel => Math.min(255, Math.round(channel * shade)));
}
