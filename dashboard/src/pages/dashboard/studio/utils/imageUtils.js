import JSZip from 'jszip';

/**
 * Load an image data URL / object URL into an HTMLImageElement using arrow function
 */
export const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + String(e)));
    img.src = src;
  });
};

/**
 * Apply Watermark (Text or PNG Logo) on Canvas Context using arrow function
 */
export const applyWatermarkToCanvas = async (
  ctx,
  config,
  targetWidth = 800,
  targetHeight = 800
) => {
  if (!config || !config.enabled) return;

  const minDim = Math.min(targetWidth, targetHeight);
  const scaleFactor = Math.max(0.5, minDim / 800);
  const margin = Math.max(16, (config.margin || 24) * scaleFactor);
  const baseFontSize = Math.max(13, (config.fontSize || 24) * scaleFactor);

  ctx.save();
  ctx.globalAlpha = Math.max(0.05, Math.min(1, config.opacity ?? 0.75));

  if (config.type === 'text') {
    const text = config.text?.trim() || '© FLOW STUDIO';
    ctx.font = `600 ${Math.round(baseFontSize)}px "Plus Jakarta Sans", -apple-system, sans-serif`;
    ctx.textBaseline = 'middle';

    let x = 0;
    let y = 0;

    switch (config.position) {
      case 'top-left':
        x = margin;
        y = margin + baseFontSize / 2;
        ctx.textAlign = 'left';
        break;
      case 'top-right':
        x = targetWidth - margin;
        y = margin + baseFontSize / 2;
        ctx.textAlign = 'right';
        break;
      case 'bottom-left':
        x = margin;
        y = targetHeight - margin - baseFontSize / 2;
        ctx.textAlign = 'left';
        break;
      case 'center':
        x = targetWidth / 2;
        y = targetHeight / 2;
        ctx.textAlign = 'center';
        break;
      case 'bottom-right':
      default:
        x = targetWidth - margin;
        y = targetHeight - margin - baseFontSize / 2;
        ctx.textAlign = 'right';
        break;
    }

    // Backdrop shadow for maximum readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = config.color || '#ffffff';
    ctx.fillText(text, x, y);
  } else if (config.type === 'logo' && config.logoUrl) {
    try {
      const logoImg = await loadImage(config.logoUrl);
      const lSrcW = logoImg.naturalWidth || logoImg.width;
      const lSrcH = logoImg.naturalHeight || logoImg.height;

      // Scale PNG logo relative to canvas dimension
      const userScale = (config.fontSize || 24) / 24;
      const maxLogoW = targetWidth * 0.22 * userScale;
      const maxLogoH = targetHeight * 0.16 * userScale;
      const scale = Math.min(maxLogoW / lSrcW, maxLogoH / lSrcH);
      const destW = Math.max(20, lSrcW * scale);
      const destH = Math.max(20, lSrcH * scale);

      let x = 0;
      let y = 0;

      switch (config.position) {
        case 'top-left':
          x = margin;
          y = margin;
          break;
        case 'top-right':
          x = targetWidth - margin - destW;
          y = margin;
          break;
        case 'bottom-left':
          x = margin;
          y = targetHeight - margin - destH;
          break;
        case 'center':
          x = (targetWidth - destW) / 2;
          y = (targetHeight - destH) / 2;
          break;
        case 'bottom-right':
        default:
          x = targetWidth - margin - destW;
          y = targetHeight - margin - destH;
          break;
      }

      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 2;
      ctx.drawImage(logoImg, x, y, destW, destH);
    } catch (e) {
      console.warn('Failed to render PNG logo watermark:', e);
    }
  }

  ctx.restore();
};

/**
 * Get image dimensions from a Data URL using arrow function
 */
export const getImageDimensions = async (dataUrl) => {
  const img = await loadImage(dataUrl);
  return {
    width: img.naturalWidth || 800,
    height: img.naturalHeight || 800,
  };
};

/**
 * Convert File to clean Base64 data URL using arrow function
 */
export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Parse Aspect Ratio to decimal ratio number using arrow function
 */
export const getAspectRatioDecimal = (ratio) => {
  switch (ratio) {
    case '1:1':
      return 1;
    case '4:3':
      return 4 / 3;
    case '3:4':
      return 3 / 4;
    case '9:16':
      return 9 / 16;
    case '16:9':
      return 16 / 9;
    default:
      return 1;
  }
};

/**
 * Resize and reframe an image on canvas using arrow function
 */
export const resizeImageToCanvas = async (
  sourceUrl,
  targetWidth,
  targetHeight,
  fitMode = 'contain',
  format = 'image/png',
  quality = 0.95,
  watermarkConfig
) => {
  const img = await loadImage(sourceUrl);
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  if (fitMode === 'blur-extend') {
    // Render blurred ambient background
    ctx.filter = 'blur(24px) brightness(0.9)';
    ctx.drawImage(img, -20, -20, targetWidth + 40, targetHeight + 40);
    ctx.filter = 'none';

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const scale = Math.min(targetWidth / srcW, targetHeight / srcH) * 0.9;
    const destW = srcW * scale;
    const destH = srcH * scale;
    const destX = (targetWidth - destW) / 2;
    const destY = (targetHeight - destH) / 2;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    ctx.drawImage(img, destX, destY, destW, destH);
    ctx.shadowColor = 'transparent';
  } else if (fitMode === 'cover') {
    const scale = Math.max(targetWidth / srcW, targetHeight / srcH);
    const destW = srcW * scale;
    const destH = srcH * scale;
    const destX = (targetWidth - destW) / 2;
    const destY = (targetHeight - destH) / 2;

    ctx.drawImage(img, destX, destY, destW, destH);
  } else if (fitMode === 'smart-fill') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const scale = Math.min(targetWidth / srcW, targetHeight / srcH) * 0.92;
    const destW = srcW * scale;
    const destH = srcH * scale;
    const destX = (targetWidth - destW) / 2;
    const destY = (targetHeight - destH) / 2;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 8;
    ctx.drawImage(img, destX, destY, destW, destH);
    ctx.shadowColor = 'transparent';
  } else {
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    const scale = Math.min(targetWidth / srcW, targetHeight / srcH);
    const destW = srcW * scale;
    const destH = srcH * scale;
    const destX = (targetWidth - destW) / 2;
    const destY = (targetHeight - destH) / 2;

    ctx.drawImage(img, destX, destY, destW, destH);
  }

  if (watermarkConfig && watermarkConfig.enabled) {
    await applyWatermarkToCanvas(ctx, watermarkConfig, targetWidth, targetHeight);
  }

  return canvas.toDataURL(format, quality);
};

/**
 * Trigger browser file download using arrow function
 */
export const downloadDataUrl = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export processed batch images to a structured ZIP file using arrow function
 */
export const exportBulkZip = async (
  items,
  format = 'image/png',
  includeOriginals = true,
  watermarkConfig
) => {
  const zip = new JSZip();
  const resultsFolder = zip.folder('studio-transformed-images');
  const originalsFolder = includeOriginals ? zip.folder('original-uploads') : null;

  const extMap = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  const ext = extMap[format] || 'png';

  let index = 1;
  for (const item of items) {
    const safeName = item.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const pad = String(index).padStart(2, '0');

    if (item.resultUrl && resultsFolder) {
      const finalDataUrl = await resizeImageToCanvas(
        item.resultUrl,
        item.targetWidth,
        item.targetHeight,
        item.fitMode,
        format,
        0.95,
        watermarkConfig
      );
      const base64Data = finalDataUrl.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
      resultsFolder.file(
        `${pad}_${safeName}_${item.targetWidth}x${item.targetHeight}_${item.aspectRatio.replace(':', 'by')}.${ext}`,
        base64Data,
        { base64: true }
      );
    }

    if (originalsFolder && item.originalBase64) {
      const origBase64 = item.originalBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
      const origExt = item.mimeType.includes('png') ? 'png' : item.mimeType.includes('webp') ? 'webp' : 'jpg';
      originalsFolder.file(`${pad}_original_${safeName}.${origExt}`, origBase64, { base64: true });
    }

    index++;
  }

  const manifestContent = `
======================================================
 AI PRODUCT PHOTO STUDIO - BULK EXPORT MANIFEST
 Generated: ${new Date().toISOString()}
 Total Items Processed: ${items.filter((i) => i.status === 'completed').length} / ${items.length}
 PNG Logo Watermark: ${watermarkConfig?.enabled ? `YES ("${watermarkConfig.logoName || watermarkConfig.text || 'Client Logo'}" at ${watermarkConfig.position})` : 'NO'}
======================================================

BATCH SPECIFICATIONS:
${items
  .map(
    (item, idx) => `
#${idx + 1} - ${item.name}
- Status: ${item.status}
- Output Resolution: ${item.targetWidth} x ${item.targetHeight} (${item.aspectRatio})
- Fit Mode: ${item.fitMode}
- Prompt: "${item.customPromptOverride || item.prompt}"
- Output File: ${String(idx + 1).padStart(2, '0')}_${item.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}_${item.targetWidth}x${item.targetHeight}_${item.aspectRatio.replace(':', 'by')}.${ext}
`
  )
  .join('\n')}
======================================================
Powered by Google GenAI Models
`.trim();

  zip.file('README_batch_details.txt', manifestContent);

  return zip.generateAsync({ type: 'blob' });
};
