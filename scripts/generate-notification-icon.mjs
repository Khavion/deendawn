/**
 * Generates the Android notification small icon: 96x96, ALL-WHITE with the
 * source's alpha preserved (Android renders status-bar icons as a white
 * silhouette; color is applied via the plugin `color` tint — brand forest
 * green #274D3D). Source of truth is the REAL brand mark (splash-icon.png,
 * the gold-dawn-on-forest mark from 2026-07-30), NOT the stale
 * android-icon-monochrome.png (pre-brand template asset).
 *
 * Usage: node scripts/generate-notification-icon.mjs
 * Output: assets/images/notification-icon.png (referenced by the
 * expo-notifications plugin `icon` option in app.json).
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// jimp-compact ships with the expo toolchain — no new dependency.
const Jimp = require('jimp-compact');

const SRC = 'assets/images/splash-icon.png';
const OUT = 'assets/images/notification-icon.png';
const SIZE = 96;

const img = await Jimp.read(SRC);
// Trim the source's transparent padding, then fit into the canvas with a
// small margin (status-bar glyphs should fill most of the 96px frame).
img.autocrop({ tolerance: 0.001, cropOnlyFrames: false });
const MARGIN = 8;
const inner = SIZE - MARGIN * 2;
img.contain(inner, inner);
const canvas = new Jimp(SIZE, SIZE, 0x00000000);
canvas.composite(img, MARGIN, MARGIN);
canvas.scan(0, 0, SIZE, SIZE, function (x, y, idx) {
  // White silhouette: keep alpha, blow out RGB.
  this.bitmap.data[idx] = 255;
  this.bitmap.data[idx + 1] = 255;
  this.bitmap.data[idx + 2] = 255;
});
await canvas.writeAsync(OUT);
console.log(`wrote ${OUT} (${SIZE}x${SIZE} white-on-alpha from ${SRC})`);
