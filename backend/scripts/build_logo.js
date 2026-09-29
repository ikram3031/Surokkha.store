import sharp from 'sharp';

// Source: high-res logo_engulfic.png (2752x1536, already orange)
const SRC = 'src/assets/logo_engulfic.png';

// Bounding boxes discovered from pixel analysis:
// Emblem: x=132..862, y=463..1086 → 731×624
// Text:   x=934..2567, y=456..1081 → 1634×626
const EMBLEM = { left: 132, top: 463, width: 731, height: 624 };
const TEXT   = { left: 934, top: 456, width: 1634, height: 626 };

// Target canvas: 1000×180px
// Both emblem and text rendered at same height (USABLE_H), widths proportional
const CANVAS_W = 1000;
const CANVAS_H = 180;
const PAD = 16;
const USABLE_H = CANVAS_H - PAD * 2; // 148px

const emblemTargetH = USABLE_H;
const emblemTargetW = Math.round(USABLE_H * (EMBLEM.width / EMBLEM.height)); // 148*(731/624)=173

const textTargetH = USABLE_H;
const textTargetW = Math.round(USABLE_H * (TEXT.width / TEXT.height)); // 148*(1634/626)=386

const GAP = 24;
const totalW = emblemTargetW + GAP + textTargetW; // 173+24+386=583
const startX  = Math.round((CANVAS_W - totalW) / 2); // (1000-583)/2=208

// Extract and resize emblem region
const emblemBuf = await sharp(SRC)
  .extract(EMBLEM)
  .resize(emblemTargetW, emblemTargetH, { fit: 'fill', kernel: 'lanczos3' })
  .png()
  .toBuffer();

// Extract and resize text region
const textBuf = await sharp(SRC)
  .extract(TEXT)
  .resize(textTargetW, textTargetH, { fit: 'fill', kernel: 'lanczos3' })
  .png()
  .toBuffer();

// Compose onto a 1000×180 dark canvas
const darkCanvas = await sharp({
  create: { width: CANVAS_W, height: CANVAS_H, channels: 3, background: { r: 15, g: 15, b: 15 } }
})
  .composite([
    { input: emblemBuf, top: PAD, left: startX },
    { input: textBuf,   top: PAD, left: startX + emblemTargetW + GAP },
  ])
  .png()
  .toFile('src/assets/logo_engulfic_horizontal_dark.png');

// Compose onto transparent canvas
const transparentCanvas = await sharp({
  create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
})
  .composite([
    { input: emblemBuf, top: PAD, left: startX },
    { input: textBuf,   top: PAD, left: startX + emblemTargetW + GAP },
  ])
  .png()
  .toFile('src/assets/logo_engulfic_horizontal.png');

console.log(`emblem: ${emblemTargetW}x${emblemTargetH}, text: ${textTargetW}x${textTargetH}`);
console.log(`canvas startX=${startX}, total=${totalW}`);
console.log('✅ Done: logo_engulfic_horizontal_dark.png and logo_engulfic_horizontal.png');
