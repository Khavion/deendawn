// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    // NO-AI ZONE: religious text artifacts are never linted, formatted, or
    // auto-fixed (CLAUDE.md rule 1). content-pipeline/data holds source bytes.
    ignores: ['dist/*', 'content-pipeline/data/**', 'assets/db/**', '.claude/hooks/**'],
  },
  {
    // PHASE_2 E1: no hardcoded user-facing strings — everything through i18n.
    // Symbols/punctuation that are locale-neutral are allowed.
    files: ['app/**/*.tsx', 'src/features/**/components/**/*.tsx'],
    rules: {
      'react/jsx-no-literals': [
        'error',
        {
          noStrings: true,
          allowedStrings: ['★', '☆', '—', '·', ':', '✓', '(', ')', '.', ',', '?'],
          ignoreProps: true,
          noAttributeStrings: false,
        },
      ],
    },
  },
]);
