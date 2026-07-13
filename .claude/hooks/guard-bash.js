#!/usr/bin/env node
// PreToolUse guard for Bash. Exit 2 blocks the command.
// Enforces human gates and repo-safety rules from CLAUDE.md.
'use strict';

let raw = '';
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const cmd = ((input && input.tool_input) || {}).command || '';

  const rules = [
    {
      re: /\beas\s+submit\b/,
      msg: 'eas submit is Human Gate #1 (App Review submission). Prepare metadata, log to docs/BLOCKERS.md, print GATE:, and continue with other work.',
    },
    {
      re: /\bfastlane\s+(deliver|pilot|supply)\b/,
      msg: 'fastlane deliver/pilot/supply is Human Gate #1. Prepare, do not submit.',
    },
    {
      re: /\bgit\s+push\b[^|;&]*(\s--force\b|\s-f\b|\s--force-with-lease\b)/,
      msg: 'Force-pushing origin is forbidden (Human Gate #4: git history rewrites on origin).',
    },
    {
      re: /\brm\s+-[a-zA-Z]*[rR][a-zA-Z]*\s+(\/(?!private\/tmp|tmp)|~\/)/,
      msg: 'rm -r on absolute paths outside the repo/tmp is forbidden (CLAUDE.md security rule).',
    },
    {
      re: /content\.lock/,
      allow:
        /npm\s+run\s+content:|content-pipeline\/(fetch|verify|build)|\bgit\s+(add|commit|diff|status|log|show)\b|\bcat\b|\bshasum\b|\bsha256sum\b|\bls\b/,
      msg: 'content.lock may only be written by the pipeline scripts (npm run content:*). Reading it is fine (cat/git/shasum).',
    },
  ];

  for (const rule of rules) {
    if (rule.re.test(cmd)) {
      if (rule.allow && rule.allow.test(cmd)) continue;
      console.error('BLOCKED: ' + rule.msg);
      process.exit(2);
    }
  }
  process.exit(0);
});
