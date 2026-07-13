#!/usr/bin/env node
// PreToolUse guard for file-editing tools. Exit 2 blocks the tool call.
// Enforces the NO-AI ZONE from CLAUDE.md:
//  (a) content-pipeline/content.lock and assets/db/* change only via a pipeline run
//  (b) Arabic-script text enters the repo only via the pipeline scripts
'use strict';
const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0); // malformed input: don't block unrelated tooling
  }
  const ti = (input && input.tool_input) || {};
  const filePath = ti.file_path || ti.path || ti.notebook_path || '';
  const written = [ti.content, ti.new_string, ti.new_source]
    .filter((v) => typeof v === 'string')
    .join('\n');

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const rel = path.isAbsolute(filePath) ? path.relative(projectDir, filePath) : filePath;

  const isProtected =
    rel === 'content-pipeline/content.lock' ||
    rel.startsWith('assets/db/') ||
    rel.startsWith('assets' + path.sep + 'db' + path.sep);

  if (isProtected) {
    // Sanctioned path: the pipeline scripts touch this marker when they run.
    const marker = path.join(projectDir, 'content-pipeline', '.pipeline-ran');
    let recentRun = false;
    try {
      recentRun = Date.now() - fs.statSync(marker).mtimeMs < 60 * 60 * 1000;
    } catch {}
    if (!recentRun) {
      console.error(
        `BLOCKED: ${rel} is a verified religious-content artifact. ` +
          'It may only change via the content pipeline (npm run content:fetch / content:verify / content:build). ' +
          'No pipeline run detected in the last hour. Never hand-edit checksums to make a failure pass.'
      );
      process.exit(2);
    }
  }

  // Arabic-script detection (Arabic, Supplement, Extended-A, Presentation Forms A/B).
  const arabic = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
  if (written && arabic.test(written)) {
    console.error(
      'BLOCKED: attempted to write Arabic-script text with an editing tool. ' +
        'Quranic/religious Arabic text enters the repo byte-for-byte via the content pipeline only (NO-AI ZONE, CLAUDE.md rule 1).'
    );
    process.exit(2);
  }

  process.exit(0);
});
