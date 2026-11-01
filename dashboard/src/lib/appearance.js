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

export const isValidColor = (value) => HEX_PATTERN.test(String(value || ''));

// Text colour that stays readable on top of the chosen brand colour
const foregroundFor = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.4 ? '#111827' : '#ffffff';
};

export const clearAppearance = () => {
  if (typeof document === 'undefined') return;
  document.getElementById(STYLE_ID)?.remove();
};

// Overrides the tenant theme for the signed-in user: brand colour and corner roundness across the whole dashboard
export const applyAppearance = (appearance) => {
  if (typeof document === 'undefined') return;
  const color = isValidColor(appearance?.primaryColor) ? appearance.primaryColor : '';
  const radius = RADIUS_OPTIONS.some((o) => o.value === appearance?.radius) ? appearance.radius : '';

  if (!color && !radius) {
    clearAppearance();
    return;
  }

  const declarations = [];
  if (color) {
    const fg = foregroundFor(color);
    declarations.push(
      `--primary: ${color} !important`,
      `--primary-foreground: ${fg} !important`,
      `--secondary: ${color} !important`,
      `--secondary-foreground: ${fg} !important`,
      `--ring: ${color} !important`,
      `--sidebar-primary: ${color} !important`,
      `--sidebar-primary-foreground: ${fg} !important`,
      `--sidebar-ring: ${color} !important`,
      `--chart-1: ${color} !important`,
      `--chart-2: ${color} !important`,
    );
  }
  if (radius) declarations.push(`--radius: ${radius} !important`);

  let tag = document.getElementById(STYLE_ID);
  if (!tag) {
    tag = document.createElement('style');
    tag.id = STYLE_ID;
    document.head.appendChild(tag);
  }
  tag.textContent = `html:root, html.dark { ${declarations.join('; ')}; }`;
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
