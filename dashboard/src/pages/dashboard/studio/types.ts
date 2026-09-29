// Type definitions for AI Studio components and state management
export type AspectRatioType = '1:1' | '4:3' | '3:4' | '9:16' | '16:9';

export type FitMode = 'cover' | 'contain' | 'smart-fill' | 'blur-extend';

export type ImageModelType = 'gemini-3.1-flash-lite-image' | 'gemini-3.1-flash-image';

export type WatermarkPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';

export interface WatermarkConfig {
  enabled: boolean;
  type: 'logo';
  logoUrl?: string;
  logoName?: string;
  opacity: number;
  position: WatermarkPosition;
  fontSize: number;
  color: string;
  margin: number;
}

export interface CustomSavedPreset {
  id: string;
  name: string;
  createdAt: number;
  prompt: string;
  aspectRatio: AspectRatioType;
  selectedSizePresetId?: string;
  customWidth?: number;
  customHeight?: number;
  fitMode?: FitMode;
  watermark: WatermarkConfig;
  selectedPresetId?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  originalUrl: string;
  originalBase64: string;
  mimeType: string;
  originalDimensions: {
    width: number;
    height: number;
  };
  prompt: string;
  customPromptOverride?: string;
  aspectRatio: AspectRatioType;
  targetWidth: number;
  targetHeight: number;
  fitMode: FitMode;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  resultUrl?: string;
  rawResultUrl?: string;
  resultDimensions?: {
    width: number;
    height: number;
  };
  resultElapsedMs?: number;
  error?: string;
  analysis?: {
    productName?: string;
    category?: string;
    dominantColors?: string[];
    recommendedScenes?: Array<{
      title: string;
      prompt: string;
    }>;
    compositionAdvice?: string;
  };
  isAnalyzing?: boolean;
}

export interface StylePreset {
  id: string;
  name: string;
  icon: string;
  category: 'Studio' | 'Nature' | 'Luxury' | 'Lifestyle' | 'Urban' | 'Creative';
  promptModifier: string;
  description: string;
  badge?: string;
  previewBg: string;
}

export interface SizePreset {
  id: string;
  name: string;
  platform: string;
  aspectRatio: AspectRatioType;
  width: number;
  height: number;
  icon: string;
  description: string;
}

export interface BatchSettings {
  globalPrompt: string;
  selectedPresetId: string;
  aspectRatio: AspectRatioType;
  selectedSizePresetId: string;
  customWidth: number;
  customHeight: number;
  fitMode: FitMode;
  model: ImageModelType;
  imageSize: '512px' | '1K' | '2K';
  exportFormat: 'image/png' | 'image/jpeg' | 'image/webp';
  jpegQuality: number;
  concurrency: number;
  watermark: WatermarkConfig;
}

export interface GeneratedBatchItem {
  id: string;
  prompt: string;
  aspectRatio: AspectRatioType;
  imageUrl?: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  error?: string;
  createdAt: number;
}
