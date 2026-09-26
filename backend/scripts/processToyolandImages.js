import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import mongoose from 'mongoose';
import { ProductModel } from '../src/common/models/product.model.js';

const MONGODB_URI = 'mongodb://admin:toyoland_dev_pass_2026@144.79.218.112:27018/toyoland-db?authSource=admin';
const imgSourceDir = 'C:\\Users\\dev\\Downloads\\Toyoland-20260828T093952Z-1-001\\Toyoland';
const outputDir = path.resolve('uploads', '2608', '260829');
const uploadUrlPrefix = '/uploads/2608/260829';

const productMapping = {
  'superman-spiderman-batman': [
    '01_superman_spiderman_batman_01.jpg',
    '01_superman_plush_02.jpg'
  ],
  'stuff-toys': [
    '02_stuff_toys_animals_01.jpg'
  ],
  'colourful-fish': [
    '03_colourful_fish_pull_back_01.png',
    '03_colourful_fish_pull_back_02.png'
  ],
  'happy-bus': [
    '04_happy_bus_01.png'
  ],
  'cartoon-try-cycle': [
    '05_cartoon_try_cycle_01.png'
  ],
  'mini-cartoon-car': [
    '06_mini_cartoon_car_01.png'
  ],
  'caterpillar-press-slide-series': [
    '07_caterpillar_press_slide_series_01.jpg',
    '07_caterpillar_press_slide_series_02.jpg',
    '07_caterpillar_press_slide_series_03.png'
  ],
  'flashing-top-minions': [
    '08_flashing_top_minions_01.png'
  ],
  'mini-air-craft-plane-inertia': [
    '09_mini_air_craft_plane_inertia_01.png'
  ],
  'coasting-rabbit': [
    '10_coasting_rabbit_01.png'
  ],
  'flashing-ball-spike': [
    '11_flashing_ball_spike_01.png',
    '11_flashing_ball_spike_02.png'
  ],
  'puffer-ball-sensory': [
    '12_puffer_ball_sensory_smile_01.png'
  ],
  'bubbles': [
    '13_bubbles_01.jpg',
    '13_bubbles_02.jpg'
  ],
  'ball-colourful': [
    '14_ball_colourful_01.jpg'
  ],
  'mouth-organ': [
    '15_mouth_organ_harmonica_01.png',
    '15_mouth_organ_harmonica_02.png'
  ],
  'magnetic-dart-board': [
    '16_magnetic_dart_board_01.png'
  ],
  'puzzle-building-blocks-soft': [
    '17_puzzle_building_blocks_soft_01.png',
    '17_puzzle_building_blocks_soft_02.png'
  ],
  'rainbow-tower': [
    '18_rainbow_tower_stacking_cups_01.png',
    '18_rainbow_tower_stacking_cups_02.png'
  ],
  'slime-crystal-mud': [
    '19_slime_crystal_mud_01.png',
    '19_slime_crystal_mud_02.png'
  ],
  'pack-board': [],
  'snow-flakes-flower-coin': [
    '21_snow_flakes_flower_coin_blocks_01.png'
  ],
  'animals-set-animal-farmers-world': [
    '22_animals_set_animal_farmers_world_01.png',
    '22_animals_set_animal_farmers_world_02.png'
  ],
  'intelligence-talking-board': [
    '23_intelligence_talking_board_book_01.png'
  ],
  'pvc-ball': [
    '24_pvc_ball_set_01.png'
  ],
  'pvc-ball-single': [
    '24_pvc_ball_set_01.png'
  ],
  'vocal-piano': [
    '26_vocal_piano_01.jpg',
    '26_vocal_piano_02.jpg',
    '26_vocal_piano_03.png',
    '26_vocal_piano_04.png'
  ],
  'six-in-one-logarithmic-board': [
    '27_six_in_one_logarithmic_board_01.jpg',
    '27_six_in_one_logarithmic_board_02.jpg'
  ],
  'gym-ball-spike': [
    '28_gym_ball_spike_01.png'
  ],
  'gym-ball-plane': [],
  'kazo-bashi': [
    '30_kazo_metal_flute_01.png'
  ],
  'respirometer': [
    '31_respirometer_3_ball_spirometer_01.png',
    '31_respirometer_3_ball_spirometer_02.png'
  ],
  'flash-card': [
    '32_flash_card_01.png',
    '32_flash_card_02.png'
  ],
  'wooden-toy-hammer': [
    '33_wooden_toy_hammer_01.jpg',
    '33_wooden_toy_hammer_02.jpg'
  ],
  'rainbow-beads-mala': [
    '34_rainbow_beads_mala_threading_01.png',
    '34_rainbow_beads_mala_threading_02.png'
  ],
  'wooden-double-layered-fishing-mala': [
    '35_wooden_double_layered_fishing_mala_01.jpg',
    '35_wooden_double_layered_fishing_mala_02.jpg'
  ],
  'four-in-a-row-on-a-journey': [
    '36_four_in_a_row_on_a_journey_01.png'
  ]
};

// Converts an image to WebP format with specified dimensions and quality
const convertToWebp = async (sourcePath, destPath, maxSize, quality = 90) => {
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  await sharp(sourcePath)
    .rotate()
    .resize({
      width: maxSize,
      height: maxSize,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toFile(destPath);
};

// Processes all source images, converts them to WebP, and updates database records
const run = async () => {
  if (!fs.existsSync(imgSourceDir)) {
    console.error('Image source directory not found:', imgSourceDir);
    process.exit(1);
  }

  await fs.promises.mkdir(outputDir, { recursive: true });

  const allFiles = await fs.promises.readdir(imgSourceDir);
  console.log('Total source image files found:', allFiles.length);

  for (const file of allFiles) {
    const ext = path.extname(file);
    const base = path.basename(file, ext);
    const sourcePath = path.join(imgSourceDir, file);

    const mainOut = path.join(outputDir, `${base}.webp`);
    const thumbOut = path.join(outputDir, `thumb_${base}.webp`);

    await convertToWebp(sourcePath, mainOut, 1200, 90);
    await convertToWebp(sourcePath, thumbOut, 200, 90);

    const mainStat = await fs.promises.stat(mainOut);
    const thumbStat = await fs.promises.stat(thumbOut);
    console.log(`Processed: ${base} -> Main (${(mainStat.size / 1024).toFixed(1)} KB) | Thumb (${(thumbStat.size / 1024).toFixed(1)} KB)`);
  }

  console.log('\nConnecting to Toyoland MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to Toyoland MongoDB.');

  let updatedCount = 0;

  for (const [slug, imgFiles] of Object.entries(productMapping)) {
    if (!imgFiles || imgFiles.length === 0) {
      console.log(`Skipping ${slug} (No images assigned)`);
      continue;
    }

    const primaryFile = imgFiles[0];
    const primaryBase = path.basename(primaryFile, path.extname(primaryFile));
    const mainImageUrl = `${uploadUrlPrefix}/${primaryBase}.webp`;
    const thumbnailUrl = `${uploadUrlPrefix}/thumb_${primaryBase}.webp`;

    const galleryImages = [];
    for (let i = 1; i < imgFiles.length; i++) {
      const gFile = imgFiles[i];
      const gBase = path.basename(gFile, path.extname(gFile));
      galleryImages.push(`${uploadUrlPrefix}/${gBase}.webp`);
    }

    const updateRes = await ProductModel.updateOne(
      { slug },
      {
        $set: {
          imageUrl: mainImageUrl,
          thumbnailUrl,
          images: galleryImages
        }
      }
    );

    if (updateRes.matchedCount > 0) {
      updatedCount++;
      console.log(`✔ Updated product [${slug}] -> main: ${mainImageUrl}, thumb: ${thumbnailUrl}, gallery: ${galleryImages.length}`);
    } else {
      console.warn(`✖ Product not found in DB with slug: ${slug}`);
    }
  }

  console.log(`\nDatabase update complete. Total products updated: ${updatedCount}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Fatal error in processToyolandImages:', err);
  process.exit(1);
});
