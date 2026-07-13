// Shared helpers for the content pipeline. These scripts are the ONLY
// sanctioned writers of content-pipeline/data/*, content.lock, and
// assets/db/* (CLAUDE.md rule 1 — NO-AI ZONE).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, utimesSync, closeSync, openSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const PIPELINE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.dirname(PIPELINE_DIR);
export const DATA_DIR = path.join(PIPELINE_DIR, 'data');
export const LOCK_PATH = path.join(PIPELINE_DIR, 'content.lock');
export const MARKER_PATH = path.join(PIPELINE_DIR, '.pipeline-ran');

export function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

export function loadSources() {
  return JSON.parse(readFileSync(path.join(PIPELINE_DIR, 'sources.json'), 'utf8')).artifacts;
}

export function loadLock() {
  if (!existsSync(LOCK_PATH)) return { version: 1, artifacts: {}, derived: {} };
  return JSON.parse(readFileSync(LOCK_PATH, 'utf8'));
}

export function saveLock(lock) {
  writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 2) + '\n');
}

/** Touch the session marker read by .claude/hooks/guard-files.js. */
export function markPipelineRan() {
  const now = new Date();
  try {
    utimesSync(MARKER_PATH, now, now);
  } catch {
    closeSync(openSync(MARKER_PATH, 'w'));
  }
}

/**
 * Parse Tanzil txt format: data lines are `sura|aya|text`; comment/copyright
 * block lines start with `#`; blank lines ignored. Returns verses in file
 * order plus the raw copyright block (which must be retained).
 */
export function parseTanzilTxt(buf) {
  const text = buf.toString('utf8');
  const verses = [];
  const copyright = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('#')) {
      copyright.push(line);
      continue;
    }
    if (line.trim() === '') continue;
    const first = line.indexOf('|');
    const second = line.indexOf('|', first + 1);
    if (first === -1 || second === -1) {
      throw new Error(`Malformed Tanzil line: ${line.slice(0, 40)}...`);
    }
    verses.push({
      sura: Number(line.slice(0, first)),
      aya: Number(line.slice(first + 1, second)),
      text: line.slice(second + 1),
    });
  }
  return { verses, copyright: copyright.join('\n') };
}

/** Parse the pieces of Tanzil quran-data.xml we need (suras + juz starts). */
export function parseQuranDataXml(buf) {
  const xml = buf.toString('utf8');
  const attrs = (tag) => {
    const out = {};
    for (const m of tag.matchAll(/(\w+)="([^"]*)"/g)) out[m[1]] = m[2];
    return out;
  };
  const suras = [...xml.matchAll(/<sura\b[^>]*\/>/g)].map((m) => attrs(m[0]));
  const juzs = [...xml.matchAll(/<juz\b[^>]*\/>/g)].map((m) => attrs(m[0]));
  if (suras.length !== 114) throw new Error(`Expected 114 <sura> entries, got ${suras.length}`);
  if (juzs.length !== 30) throw new Error(`Expected 30 <juz> entries, got ${juzs.length}`);
  return { suras, juzs };
}

/**
 * Search normalization for DERIVED FTS columns only. Source text is never
 * modified (CLAUDE.md rule 1: normalization for search indexes happens in
 * derived columns only). Uses escape sequences on purpose — no Arabic
 * literals in AI-authored code.
 */
export function normalizeArabicForSearch(s) {
  return s
    .replace(/[\u0640\u06D6-\u06ED\u08D3-\u08FF]/g, '') // tatweel, Quranic annotation signs
    .replace(/[\u064B-\u065F\u0670]/g, '') // harakat, tanwin, hamza marks, superscript alef
    .replace(/[\u0622\u0623\u0625\u0671-\u0673\u0675]/g, '\u0627') // alef variants -> alef
    .replace(/\u0629/g, '\u0647') // ta marbuta -> ha
    .replace(/\u0649/g, '\u064A') // alef maksura -> ya
    .replace(/\u0624/g, '\u0648') // waw with hamza -> waw
    .replace(/\u0626/g, '\u064A') // ya with hamza -> ya
    .replace(/\s+/g, ' ')
    .trim();
}

/** Hafs/Kufan ayah counts are fixed facts of the numbering scheme. */
export const EXPECTED_SURAHS = 114;
export const EXPECTED_AYAHS = 6236;
