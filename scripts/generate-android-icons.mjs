/**
 * Generates the Android adaptive-icon layers from the REAL brand sources
 * (assets/images/icon.png = gold-dawn-on-forest gradient square,
 * assets/images/splash-icon.png = the mark alone on transparency). The
 * previous android-icon-* assets predated the 2026-07-30 brand icon.
 *
 * Layers (1024x1024, Android composes on a 108dp canvas, mask-safe zone is
 * the middle 66dp = 61%):
 * - foreground: the mark contained into 58% of the canvas, centered
 * - background: the icon's own vertical forest-green gradient
 * - monochrome: white silhouette of the foreground (Android 13+ themed
 *   icons; Android 16 QPR2 force-themes apps without one)
 *
 * Usage: node scripts/generate-android-icons.mjs
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Jimp = require('jimp-compact');

const SIZE = 1024;
const MARK_FRACTION = 0.58;

const icon = await Jimp.read('assets/images/icon.png');
const mark = await Jimp.read('assets/images/splash-icon.png');

// --- background: vertical gradient sampled from the brand icon's edges ---
const top = Jimp.intToRGBA(icon.getPixelColor(8, 8));
const bottom = Jimp.intToRGBA(icon.getPixelColor(8, SIZE - 8));
const bg = new Jimp(SIZE, SIZE, 0x000000ff);
bg.scan(0, 0, SIZE, SIZE, function (x, y, idx) {
  const t = y / (SIZE - 1);
  this.bitmap.data[idx] = Math.round(top.r + (bottom.r - top.r) * t);
  this.bitmap.data[idx + 1] = Math.round(top.g + (bottom.g - top.g) * t);
  this.bitmap.data[idx + 2] = Math.round(top.b + (bottom.b - top.b) * t);
  this.bitmap.data[idx + 3] = 255;
});
await bg.writeAsync('assets/images/android-icon-background.png');

// --- foreground: the mark centered in the mask-safe zone ---
const fgMark = mark.clone();
fgMark.autocrop({ tolerance: 0.001, cropOnlyFrames: false });
const inner = Math.round(SIZE * MARK_FRACTION);
fgMark.contain(inner, inner);
const fg = new Jimp(SIZE, SIZE, 0x00000000);
fg.composite(fgMark, Math.round((SIZE - fgMark.bitmap.width) / 2), Math.round((SIZE - fgMark.bitmap.height) / 2));
await fg.writeAsync('assets/images/android-icon-foreground.png');

// --- monochrome: white silhouette of the foreground ---
const mono = fg.clone();
mono.scan(0, 0, SIZE, SIZE, function (x, y, idx) {
  this.bitmap.data[idx] = 255;
  this.bitmap.data[idx + 1] = 255;
  this.bitmap.data[idx + 2] = 255;
});
await mono.writeAsync('assets/images/android-icon-monochrome.png');

console.log('wrote android-icon-{background,foreground,monochrome}.png (1024px, brand sources)');
