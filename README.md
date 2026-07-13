# DeenDawn

A privacy-first, free, no-ads Islamic app for iOS (Android to follow): prayer times, adhan
notifications, qibla, Quran with translation and streamed audio, tasbih, hijri calendar,
suhoor/iftar times, and a zakat calculator.

- **Free forever.** No ads, no paywalls on worship features. Optional developer tips only.
- **Private by design.** No accounts, no trackers, no analytics. Location never leaves the device.
- **Offline-first.** Prayer times, Quran text, qibla, tasbih, hijri, and zakat work in airplane mode.

## Development

Expo SDK 54 / React Native 0.81 / TypeScript strict / expo-router.

```bash
npm install
npm run content:fetch && npm run content:verify && npm run content:build
npm run ios
```

Gates on every commit: `npm run typecheck`, `npm run lint`, `npm test`, and the religious-text
checksum test. See `CLAUDE.md` for the engineering constitution — in particular the **NO-AI ZONE**:
Quranic text and translations are imported byte-for-byte from pinned sources via
`content-pipeline/` and verified against `content-pipeline/content.lock`; they are never edited by
hand or by tooling.

Docs live in `docs/`: PROGRESS, TODO, BLOCKERS, DECISIONS, SCHOLAR_REVIEW, TESTPLAN.
