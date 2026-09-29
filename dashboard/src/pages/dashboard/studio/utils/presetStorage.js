import { formatDate } from '@/utils/dateHelper';
const STORAGE_KEY = 'studio_custom_presets_v1';

export const DEFAULT_SAVED_PRESETS = [
  {
    id: 'default-luxury-lookbook',
    name: 'E-Commerce Luxury Lookbook',
    createdAt: Date.now() - 86400000 * 2,
    prompt:
      'High-end luxury editorial photography on textured stone pedestal, dramatic directional warm side-lighting, subtle atmospheric shadows, 8k commercial quality.',
    aspectRatio: '3:4',
    selectedSizePresetId: 'size-fashion-lookbook',
    customWidth: 1200,
    customHeight: 1600,
    fitMode: 'contain',
    watermark: {
      enabled: true,
      type: 'logo',
      logoName: 'Client Logo',
      opacity: 0.75,
      position: 'bottom-right',
      fontSize: 20,
      color: '#ffffff',
      margin: 24,
    },
    selectedPresetId: 'preset-luxury-stone',
  },
  {
    id: 'default-social-reel-brand',
    name: 'Social Reel Vertical + Watermark',
    createdAt: Date.now() - 86400000,
    prompt:
      'Modern lifestyle setting with warm sunlight streaming through window blinds, architectural concrete backdrop, dynamic shadow play, hyperrealistic.',
    aspectRatio: '9:16',
    selectedSizePresetId: 'size-story-reel',
    customWidth: 1080,
    customHeight: 1920,
    fitMode: 'contain',
    watermark: {
      enabled: true,
      type: 'logo',
      logoName: 'Client Logo',
      opacity: 0.6,
      position: 'top-right',
      fontSize: 18,
      color: '#fbbf24',
      margin: 24,
    },
    selectedPresetId: 'preset-lifestyle-sunlight',
  },
];

/**
 * Load all custom saved presets from browser localStorage using arrow function
 */
export const getSavedCustomPresets = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SAVED_PRESETS));
      return DEFAULT_SAVED_PRESETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_SAVED_PRESETS;
  } catch (err) {
    console.warn('Failed to load custom presets from localStorage:', err);
    return DEFAULT_SAVED_PRESETS;
  }
};

/**
 * Save a new custom preset to localStorage using arrow function
 */
export const saveCustomPreset = (name, settings) => {
  const currentList = getSavedCustomPresets();

  const newPreset = {
    id: `custom-preset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || `Preset ${formatDate(Date.now())}`,
    createdAt: Date.now(),
    prompt: settings.globalPrompt,
    aspectRatio: settings.aspectRatio,
    selectedSizePresetId: settings.selectedSizePresetId,
    customWidth: settings.customWidth,
    customHeight: settings.customHeight,
    fitMode: settings.fitMode,
    watermark: JSON.parse(JSON.stringify(settings.watermark)),
    selectedPresetId: settings.selectedPresetId,
  };

  const updatedList = [newPreset, ...currentList];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Failed to save preset to localStorage:', err);
  }

  return { preset: newPreset, allPresets: updatedList };
};

/**
 * Delete a custom preset from localStorage by ID using arrow function
 */
export const deleteCustomPreset = (id) => {
  const currentList = getSavedCustomPresets();
  const updatedList = currentList.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Failed to delete preset from localStorage:', err);
  }
  return updatedList;
};
