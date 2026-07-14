# Prayer-countdown Home Screen widget — build guide

Research Rec #3/#12. The widget shows the next prayer and a live countdown on
the Home Screen, updating without opening the app. It reads prayer times the
app already computed on-device and writes to a shared App Group — **no network,
no tracking**, so the "Data Not Collected" label is unaffected.

## Status

- **DONE & tested (app side):** `src/features/widget/widgetData.ts` — the exact
  serializable snapshot the widget reads and the "which prayer is next" logic
  the Swift side mirrors (5 unit tests). This is the single source of truth.
- **PREPARED (native, below):** the SwiftUI widget, the config-plugin wiring,
  the App Group, and the one call site that writes the snapshot. Not wired into
  the main build yet — see "Why device-gated."

## Why device-gated (not committed into the build yet)

A widget is a separate app-extension target with its own entitlement (App
Group) and App Store review surface. Its defining behaviors — appearing on the
Home Screen and refreshing its timeline across prayer boundaries — cannot be
validated in the iOS Simulator via automation. Rather than destabilize the
freshly-simplified precompiled build with an unverifiable native target, the
native pieces are staged here and applied in one short pass on a physical
device (or a careful EAS build) during the TestFlight device pass.

Note for the owner: adding a widget introduces a new **App Group** entitlement
and a new extension target that will appear in the App Store submission. It is
not privacy-affecting (data stays on-device), so it's not a constitution Human
Gate, but it's worth knowing it changes the submission slightly.

## Native steps (apply during the device pass)

### 1. Add the config plugin

```
npx expo install @bacons/apple-targets
```

app.json → add the plugin and an App Group to the main app:

```json
["@bacons/apple-targets", { "appleTeamId": "<YOUR_TEAM_ID>" }]
```

and under `ios`:

```json
"entitlements": { "com.apple.security.application-groups": ["group.com.khavion.deendawn"] }
```

### 2. The widget target

Create `targets/prayer-widget/expo-target.config.js`:

```js
module.exports = {
  type: 'widget',
  icon: '../../assets/images/icon.png',
  entitlements: {
    'com.apple.security.application-groups': ['group.com.khavion.deendawn'],
  },
};
```

Create `targets/prayer-widget/index.swift` (SwiftUI). It reads the snapshot the
app wrote and mirrors `nextFromSnapshot`:

```swift
import WidgetKit
import SwiftUI

let APP_GROUP = "group.com.khavion.deendawn"
let SNAPSHOT_KEY = "widget.snapshot.v1"

struct Prayer: Decodable { let key: String; let iso: String }
struct Snapshot: Decodable { let cityLabel: String; let timeZone: String; let prayers: [Prayer] }

func loadSnapshot() -> Snapshot? {
    guard let defaults = UserDefaults(suiteName: APP_GROUP),
          let raw = defaults.string(forKey: SNAPSHOT_KEY),
          let data = raw.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(Snapshot.self, from: data)
}

struct Entry: TimelineEntry { let date: Date; let name: String?; let time: Date? }

struct Provider: TimelineProvider {
    func placeholder(in: Context) -> Entry { Entry(date: Date(), name: "Fajr", time: Date()) }
    func getSnapshot(in: Context, completion: @escaping (Entry) -> Void) {
        completion(entryFor(Date()))
    }
    func getTimeline(in: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        // One entry now + one at each upcoming prayer, so the countdown flips
        // to the next prayer automatically without the app running.
        let now = Date()
        var entries = [entryFor(now)]
        if let snap = loadSnapshot() {
            let iso = ISO8601DateFormatter()
            for p in snap.prayers {
                if let d = iso.date(from: p.iso), d > now { entries.append(entryFor(d)) }
            }
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
    private func entryFor(_ date: Date) -> Entry {
        guard let snap = loadSnapshot() else { return Entry(date: date, name: nil, time: nil) }
        let iso = ISO8601DateFormatter()
        let next = snap.prayers.compactMap { p -> (String, Date)? in
            guard let d = iso.date(from: p.iso), d > date else { return nil }
            return (p.key.capitalized, d)
        }.first
        return Entry(date: date, name: next?.0, time: next?.1)
    }
}

struct PrayerWidgetView: View {
    var entry: Entry
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Next prayer").font(.caption2).foregroundStyle(.secondary)
            Text(entry.name ?? "—").font(.headline)
            if let t = entry.time {
                Text(t, style: .timer).font(.title2).monospacedDigit()
                Text(t, style: .time).font(.caption).foregroundStyle(.secondary)
            }
        }.padding()
    }
}

@main
struct PrayerWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PrayerWidget", provider: Provider()) { PrayerWidgetView(entry: $0) }
            .configurationDisplayName("Next Prayer")
            .description("Countdown to the next prayer.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

### 3. Write the snapshot from the app

`@bacons/apple-targets` ships `ExtensionStorage` for App Group writes. Add the
one integration point where the app recomputes prayer times (the Today screen /
the notification reschedule), using the already-tested `buildWidgetSnapshot`:

```ts
import { ExtensionStorage } from '@bacons/apple-targets';
import { buildWidgetSnapshot } from '@/src/features/widget/widgetData';

const storage = new ExtensionStorage('group.com.khavion.deendawn');
export function publishWidgetSnapshot(today, tomorrowFajr, cityLabel, timeZone) {
  const snap = buildWidgetSnapshot(today, tomorrowFajr, cityLabel, timeZone, new Date());
  storage.set('widget.snapshot.v1', JSON.stringify(snap));
  ExtensionStorage.reloadWidget();
}
```

Call `publishWidgetSnapshot(...)` wherever the Today screen computes the day's
times (and on notification reschedule, so it stays fresh in the background).

### 4. Build & verify (device)

- `npx expo prebuild --clean` → `npx expo run:ios` on a device (or an EAS build).
- Add the widget to the Home Screen; confirm it shows the next prayer.
- Verify the countdown flips to the next prayer at a prayer time WITHOUT opening
  the app (timeline refresh). Check across midnight (isha → tomorrow fajr).
- Confirm it degrades to "—" gracefully before the app has ever run.

## Stretch: Live Activity / Dynamic Island

Same target can host an ActivityKit Live Activity using `Text(timerInterval:)`
for a local (no-push) countdown. An activity lasts up to ~8h, comfortably more
than the gap between prayers, so start one at each prayer and let it expire.
