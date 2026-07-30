// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    // NO-AI ZONE: religious text artifacts are never linted, formatted, or
    // auto-fixed (CLAUDE.md rule 1). content-pipeline/data holds source bytes.
    ignores: ['dist/*', 'content-pipeline/data/**', 'assets/db/**', '.claude/hooks/**'],
  },
  {
    // Node-only tooling: the content pipeline, repo scripts, and Expo config
    // plugins run under Node, not the React Native runtime, so they need Node
    // globals. eslint-config-expo grants these to metro.config.js only;
    // everything else gets browser/RN globals, which is why `Buffer` tripped
    // no-undef here.
    files: [
      'scripts/**/*.{js,mjs,cjs}',
      'content-pipeline/**/*.{js,mjs,cjs}',
      'plugins/**/*.{js,mjs,cjs}',
    ],
    languageOptions: {
      globals: globals.node,
    },
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
          // 'DeenDawn' is the untranslatable brand name; ' / ' is a numeric separator.
          allowedStrings: [
            '★',
            '☆',
            '—',
            '·',
            ':',
            '✓',
            '(',
            ')',
            '.',
            ',',
            '?',
            '‹',
            '›',
            'DeenDawn',
            'Deen Dawn',
            ' / ',
          ],
          ignoreProps: true,
          noAttributeStrings: false,
        },
      ],
    },
  },
]);
