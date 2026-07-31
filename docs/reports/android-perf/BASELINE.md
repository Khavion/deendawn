# Android perf baseline (emulator trends — NOT budget numbers)

| date | build | cold start p50 | janky | p90 | p95 |
| ---- | ----- | -------------- | ----- | --- | --- |
| 20260730-1551 | release-first | 493ms | Janky frames: 1 (0.22%) | 90th percentile: 21ms | 95th percentile: 22ms |
| 20260731-1412 | skia-batch-a | 504ms | Janky frames: 113 (43.80%) | 90th percentile: 133ms | 95th percentile: 150ms |
| 20260731-1413 | skia-batch-a-warm | 5502ms | Janky frames: 130 (71.43%) | 90th percentile: 150ms | 95th percentile: 200ms |
| 20260731-1415 | skia-batch-a-quiet | 3882ms | Janky frames: 126 (55.02%) | 90th percentile: 109ms | 95th percentile: 133ms |
| 20260731-1420 | skia-batch-a-settled | 512ms | Janky frames: 1 (0.23%) | 90th percentile: 17ms | 95th percentile: 18ms |

Note (2026-07-31): the `skia-batch-a` / `-warm` / `-quiet` rows were captured
while the host was saturated (parallel xcodebuild + Gradle + Metro + several
iOS simulators) — invalid as trends. `skia-batch-a-settled` (fresh emulator,
90s settle, quiet host) is the comparable post-Skia number: cold start
512ms vs 493ms pre-Skia, jank 0.23% vs 0.22% — no material regression.
