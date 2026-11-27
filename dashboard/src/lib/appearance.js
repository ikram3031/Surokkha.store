const STYLE_ID = 'user-appearance-styles';
const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

export const COLOR_PRESETS = [
  { name: 'Gold', value: '#c5a059' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Slate', value: '#475569' },
];

export const RADIUS_OPTIONS = [
  { key: 'sharp', label: 'Sharp', value: '0rem' },
  { key: 'small', label: 'Small', value: '0.25rem' },
  { key: 'medium', label: 'Medium', value: '0.5rem' },
  { key: 'large', label: 'Large', value: '0.75rem' },
  { key: 'round', label: 'Round', value: '1rem' },
];

export const BACKGROUND_PRESETS = [
  { key: 'neutral', label: 'Neutral', light: '#ffffff', dark: '#111113' },
  { key: 'tint', label: 'Brand tint', light: '', dark: '' },
  { key: 'warm', label: 'Warm', light: '#fbf8f3', dark: '#16130f' },
  { key: 'cool', label: 'Cool', light: '#f6f8fb', dark: '#0f1218' },
];

export const isValidColor = (value) => HEX_PATTERN.test(String(value || ''));

// Relative luminance of a hex colour, used to pick readable text on top of it
const luminanceOf = (hex) => {
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Text colour that stays readable on top of the chosen brand colour
const foregroundFor = (hex) => (luminanceOf(hex) > 0.4 ? '#111827' : '#ffffff');

// CSS colour mix of two colours, giving b the stated share
const mix = (a, b, pct) => `color-mix(in oklch, ${a}, ${b} ${pct}%)`;

// Every surface, text, border and chart token for one mode, derived from the brand colour and page background
const buildPalette = (brand, bg, dark) => {
  const fg = dark ? '#e7e5e4' : '#111827';
  const border = mix(mix(bg, fg, dark ? 14 : 11), brand, 10);
  const sidebar = mix(mix(bg, fg, dark ? 3 : 4), brand, dark ? 8 : 7);
  return {
    '--background': bg,
    '--foreground': fg,
    '--card': mix(bg, '#ffffff', dark ? 4 : 60),
    '--card-foreground': fg,
    '--popover': mix(bg, '#ffffff', dark ? 5 : 70),
    '--popover-foreground': fg,
    '--secondary': mix(bg, brand, dark ? 20 : 13),
    '--secondary-foreground': mix(brand, dark ? '#ffffff' : '#000000', dark ? 55 : 40),
    '--muted': mix(mix(bg, fg, dark ? 7 : 5), brand, 4),
    '--muted-foreground': mix(fg, bg, 42),
    '--accent': mix(bg, brand, dark ? 16 : 10),
    '--accent-foreground': fg,
    '--border': border,
    '--input': border,
    '--ring': brand,
    '--chart-1': brand,
    '--chart-2': mix(brand, bg, 35),
    '--chart-3': mix(brand, fg, 30),
    '--chart-4': mix(brand, bg, 60),
    '--chart-5': mix(brand, fg, 55),
    '--sidebar': sidebar,
    '--sidebar-foreground': fg,
    '--sidebar-primary': brand,
    '--sidebar-accent': mix(sidebar, brand, dark ? 22 : 15),
    '--sidebar-accent-foreground': fg,
    '--sidebar-border': border,
    '--sidebar-ring': brand,
  };
};

// Page background for one mode from the saved choice: a preset key, a custom hex, or neutral by default
const backgroundFor = (choice, brand, dark) => {
  if (isValidColor(choice)) return choice;
  if (choice === 'tint') return mix(dark ? '#0f0f10' : '#ffffff', brand, dark ? 8 : 4);
  const preset = BACKGROUND_PRESETS.find((p) => p.key === choice) || BACKGROUND_PRESETS[0];
  return dark ? preset.dark : preset.light;
};

// Reads the tenant brand colour currently in effect, used when the user keeps the tenant colour
const tenantPrimary = () => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#c5a059';

export const clearAppearance = () => {
  if (typeof document === 'undefined') return;
  document.getElementById(STYLE_ID)?.remove();
};

// Overrides the tenant theme for the signed-in user: brand colour, page background and corner roundness across the whole dashboard
export const applyAppearance = (appearance) => {
  if (typeof document === 'undefined') return;
  const color = isValidColor(appearance?.primaryColor) ? appearance.primaryColor : '';
  const radius = RADIUS_OPTIONS.some((o) => o.value === appearance?.radius) ? appearance.radius : '';
  const background = appearance?.background || '';

  if (!color && !radius && !background) {
    clearAppearance();
    return;
  }

  clearAppearance();
  const brand = color || tenantPrimary();
  const block = (dark) => {
    const tokens = color || background ? buildPalette(brand, backgroundFor(background, brand, dark), dark) : {};
    if (color) {
      tokens['--primary'] = color;
      tokens['--primary-foreground'] = foregroundFor(color);
      tokens['--sidebar-primary-foreground'] = foregroundFor(color);
    }
    if (isValidColor(background)) {
      const text = luminanceOf(background) > 0.4 ? '#111827' : '#e7e5e4';
      Object.assign(tokens, { '--foreground': text, '--card-foreground': text, '--popover-foreground': text, '--accent-foreground': text, '--sidebar-foreground': text, '--sidebar-accent-foreground': text });
    }
    if (radius) tokens['--radius'] = radius;
    return Object.entries(tokens).map(([k, v]) => `${k}: ${v} !important`).join('; ');
  };

  const tag = document.createElement('style');
  tag.id = STYLE_ID;
  tag.textContent = `html:root { ${block(false)}; } html.dark { ${block(true)}; }`;
  document.head.appendChild(tag);
};

// Reads the saved appearance from the stored login so it applies before the profile is fetched
export const readStoredAppearance = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    return stored?.preferences?.appearance || null;
  } catch {
    return null;
  }
};
