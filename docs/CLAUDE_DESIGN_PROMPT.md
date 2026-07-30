<!-- REPO COPY: the [[AR_SAMPLES]]/[[SURAH_ROWS]]/[[LANG_NAMES]] placeholders below are filled
mechanically (byte-for-byte from assets/db/quran.db + locale meta) by the generator snippet
logged in docs/DECISIONS.md 2026-07-30 (design-prompt entry). The filled copy was delivered to
Zohaib directly; religious text is never typed into this repo by hand (CLAUDE.md rule 1). -->

# Claude Design mega-prompt — "Deen Dawn: Pristine"

**For Zohaib — how to use this file:** copy everything below the horizontal line into a new Claude Design session (design.claude.com — the same tool that made the Rich Screens design last time). It is one single prompt; paste it whole. When Claude Design finishes, export/save the result as ONE html file (like last time), and hand that file to a fresh Claude Code session together with the short "implementation kickoff prompt" at the very end of this document.

*(Drafted 2026-07-30 by the engineering session; grounded in the live codebase, the release-build screenshot sweep, and three deep-research reports: Islamic design norms, 2026 iOS/Android motion specs, and worship-app UI patterns. The Arabic sample strings in §11 were extracted byte-for-byte from the app's checksum-verified quran.db — they were not typed by hand.)*

---

# DEEN DAWN — COMPLETE DESIGN SYSTEM & EVERY-SCREEN REFINEMENT ("PRISTINE" PASS)

## 1. Who you are and what you are making

You are the design director for **Deen Dawn**, a privacy-first, free, no-ads Islamic app by **Khavion Apps** (iOS + Android, one React Native codebase). The app is real, shipping-grade, and already has an owner-approved visual identity ("Rich Screens / Direction 1c"): forest-green + bronze-gold on warm ivory / near-black, Newsreader serif + Public Sans, dawn-sky ambient gradients, one gold-framed featured card per screen, illuminated gold section rules.

Your job is **not** to invent a new identity. Your job is to take this identity to a flawless, App-Store-feature-worthy standard: every screen, every loading/empty/error state, every animation, both platforms. The bar: a practicing Muslim designer at Apple would call it **pristine, reverent, and restrained** — premium with zero gaudiness, calm with zero clutter. Think the discipline of the Pillars app and the editorial quiet of a well-set book, never the clutter of ad-heavy prayer apps. The palette itself is traditionally grounded — deep green is the color of Paradise in the Quran (18:31, 55:76, 76:21) and gold is the manuscript tradition's accent of honor, never a surface-covering flex — treat both accordingly: green carries, gold punctuates.

One more framing rule: in this market, users' single loudest design complaint is commercial clutter around worship moments, and their highest praise is "distraction-free." Every screen should read as an act of subtraction — when in doubt, remove one element rather than add one.

**Your output is a single self-contained HTML document** (spec + high-fidelity mockups + live motion demos + implementation annotations). An AI engineer will implement it 1:1 in React Native (Expo SDK 57, Reanimated 4). Format requirements are in §10. Follow them exactly.

## 2. Non-negotiable constraints (violating any of these makes the design unusable)

**Religious integrity (hard rules):**
1. **Never write, alter, complete, or abbreviate Quranic Arabic, translations, du'as, or hadith.** The ONLY Arabic scripture you may render is the verbatim sample strings in §11 — byte-for-byte, no additions, no "decorative" Arabic words, no calligraphic name-of-God lockups, no shahada art, no Arabic you compose yourself anywhere (including backgrounds and ornaments). Where a mockup needs more ayah rows than provided, repeat the provided strings and label the repetition in an annotation. Never truncate an ayah mid-verse with an ellipsis; translations may clamp to 2–3 lines, Arabic ayah text is always shown whole.
2. **Never invent religious metadata**: no made-up surah names, verse counts, citation numbers, hadith numbers, or hijri holidays. Use only the sample data in §11. If you need a number you don't have, write `–` and annotate.
3. **Reverence holds (existing rule, keep absolutely):** Quranic text surfaces stay serene — no gradients, textures, shimmer, parallax, or decoration on or behind ayah text; no animation applied to ayah glyphs themselves (cross-fade of a whole block is the maximum); ambient gradients and gold ornament live in the chrome around scripture, never on it. Scripture is **never** a background texture, watermark, or ornament — it appears only at legible reading sizes, for reading, with its citation (the scholarly rulings on this are explicit: Quran text is "for reminding, not adornment"). The reader, qibla dial, and prayer-list surfaces stay quiet. Scripture also stays OFF always-visible surfaces (widgets, lock screen, notifications) — the verse of the day lives in-app only.
4. **Aniconism:** zero depictions of animate beings anywhere (people, animals, faces, silhouettes of either, emoji of living things). Allowed imagery: geometric pattern (girih / 8-point star family), arcs and horizon lines echoing the app icon, celestial bodies (sun disc, crescent, stars) drawn abstractly, botanical-abstract arabesque lines, architecture only as abstract arch/mihrab geometry (no famous-mosque likenesses), landscape gradients.
5. **Sacred-name care:** never place scripture inside buttons, badges, or UI chrome; never position ayah text directly adjacent to destructive controls (delete/trash); no sparkle/glitter effects on scripture.
6. **Existing honesty markers must stay designed-in, not designed-out** — give each a dignified, consistent treatment (they are legally/religiously required): the DEV-translation badge, DEV-audio badge, tajweed "draft — pending review" legend, library "Draft summaries — pending scholar review" note, hijri "Calculated (Umm al-Qura)…" disclaimer, zakat "calculation aid, not a religious ruling" disclaimer, Tier-B "never answers religious rulings" copy.
7. **The Ask feature never renders an "opinion" UI.** Ruling-type questions always show the scholar-redirect card (§7.5). Design that card to feel respectful and helpful, never like an error.

**Product invariants:**
8. **Zero monetization surfaces** — no tip jars, donate links, premium badges, locks, upsells, or "pro" anything, anywhere, including in sample content.
9. **Privacy-absolute** — no account/profile/avatar UI, no social features, no cloud icons, no "sync" affordances. Privacy reassurance copy (§11) is part of the brand voice; keep it visible where it exists today.
10. **Offline-first** — the app works fully offline except streamed recitation audio and the optional Tier-B model download. Do not design generic "you're offline" walls; design offline handling ONLY for those two surfaces (§7.4, §7.5).
11. **No music iconography and no melodic sound** for anything. Recitation audio gets restrained playback glyphs and a plain progress line — no note glyphs, no equalizer-style visualizers. UI sound design is silence + haptics only (mainstream rulings treat melodic chimes as impermissible while plain non-melodic alerts are fine — so the app never chimes; the adhan itself is the only intentional sound, via notifications).
12. **Free-forever tone of voice**: warm, plain, brief. Sentence case everywhere except eyebrow labels (tracked uppercase). No exclamation marks, no guilt-tinged copy, and **zero gamification of worship**: no streaks, badges, confetti, leaderboards, share-your-progress, or any "reward points" framing (quantifying divine reward is theologically presumptuous and the sincerity concern — riya — is real for these users). Data views state observable facts only.

## 3. Design foundation (existing system — build WITH it, not over it)

**Design tokens are law.** Annotate every color in your output with its token name. Never introduce a new hex without declaring it as a proposed token in the token appendix of your deliverable.

### 3.1 Color palettes (3 themes)

| Token | Light | Dark | Night-warm (reader) |
|---|---|---|---|
| bgCanvas | #F7F6F2 | #15181D | #16130D |
| bgSurface | #FFFFFF | #1B1F25 | #1E1A12 |
| bgElevated | #F0EEE7 | #232830 | #251F16 |
| textPrimary | #20242A | #F4F3EE | #ECE3D2 |
| textSecondary | #6B675C | #9AA1AA | #AEA286 |
| textOnAccent | #F7F6F2 | #15181D | #16130D |
| accent (PRIMARY, forest/sage) | #274D3D | #6FA28B | #C69B5F |
| accentSoft | #B9CDC2 | #24352E | #2A2417 |
| textOnAccentSoft | #20242A | #F4F3EE | #ECE3D2 |
| ochre (GOLD accent) | #8A6430 | #C69B5F | #C69B5F |
| ochreSoft | #F4ECDE | #2A2519 | #2A2417 |
| success | #2E6A48 | #7FB98F | #9DB58F |
| border | #DCD9D0 | #343A43 | #322A1E |
| icon | #8B8677 | #8E96A0 | #9C8B72 |

Gradients (verbatim from tokens):
- **Featured card fill:** light `#2C5646 → #23402F` (text #F7F6F2), dark `#78AB93 → #66997F` (text #15181D).
- **Ambient period gradients** (top of screen → canvas): Fajr/dawn light `#F0D8BE → #F3E5D4 → #F6F0E7 → #F7F6F2`, day `#F4EBE0 → #F7F6F2`, asr `#F4E7D7 → #F7F6F2`, maghrib `#F3E6D6 → #F7F6F2`, isha `#F4E7D7 → #F7F6F2`; dark variants `#232A38 → #15181D` (fajr), `#1E242F →` (day), `#1F2530 →` (asr), `#222836 →` (maghrib), isha `#222836 → #191E27 → #15181D`.
- **Illuminated gold rule:** transparent → rgba(138,100,48,.45) → transparent (light); rgba(198,155,95,.5) center (dark).
- **Radial gold glow** (hero areas only): rgba(198,155,95,.12–.14) → transparent.

Elevation (already tuned; keep): e1 subtle / e2 card / e3 featured-only, with the light-mode e3 casting a faint **green-tinted** shadow (#1C372C at 14–20%). Dark themes use deeper neutral shadows. No other shadows.

### 3.2 Type

- **Newsreader** (display serif; 300–700 + italic). Display 32/38 (−0.5 tracking), Title 22/28 (−0.2), Subtitle 18/28. The signature "displayAccent" move: ONE italic word in a headline, in accent green.
- **Public Sans** (UI sans; 400–700). Body 16/24, Caption 13/18, Eyebrow 12/16 tracked +1.9 uppercase.
- **Amiri Quran** for all Quranic Arabic: reader 28/56 base (user-scalable ×0.85–1.5, effective cap ×2.6 with Dynamic Type), Verse-of-day card 24/46, surah names in lists 20/36. **Never letter-space Arabic. Never clip tashkeel** — keep ≥2.0 leading.
- **Noto Nastaliq Urdu** for Urdu UI (≈×1.55 Latin line-height). Not needed in mockups; obey the rules note in §9.
- Numerals: Latin digits in Latin UI, tabular (monospaced) numerals for time columns and counters.
- In the HTML deliverable load Newsreader, Public Sans, and **Amiri Quran** from Google Fonts (or embed); if unavailable, closest serif/sans + an annotation.

### 3.3 Shape, space, texture

- Radii: **8 (cards/sheets) / 6 (controls)** only. Full-round (999) allowed solely for: circular icon buttons, the tasbih ring, number badges, chips.
- Spacing scale: 4/8/12/16/24/32/48. Hairline borders. Content measures: 640pt (forms/settings), 680pt (reading), 520pt (calendar grid) for tablet/wide.
- **Girih texture:** ≤6% opacity fine-line geometric tiling, only inside ambient gradient zones, never behind text blocks, never on scripture surfaces, auto-off on low tier. Provide it as an inline SVG tile (8-point star / khatam family) in the deliverable with exact opacity/scale specs.
- **The dawn mark** (app icon): a gold semicircle sun rising over a gold horizon line, under two thin concentric arcs, on forest green. This is the app's signature motif — echo its geometry (arcs + horizon + rising disc) in the splash, progress rings, empty states, and the widget. Do not redraw the icon itself.

### 3.4 Iconography

- iOS: **SF Symbols** (already used: sun.max.fill, book.fill, magnifyingglass, safari.fill, ellipsis.circle.fill, location.fill, play.fill, pause.fill, checkmark, xmark, chevrons). Android: Material Icons equivalents (wb-sunny, menu-book, search, explore, more-horiz…). Design with this dual mapping in mind; annotate icon names per platform for any new icon you introduce, choosing symbols that exist in both sets.
- Replace the current literal-text glyphs (the star characters used for bookmarks, the angle-quote calendar arrows, the letter-"A" size steppers) with proper icon treatments — spec them.
- Weight: regular/medium, geometric, consistent optical size; tint = icon token, accent for active states. No filled/outlined mixing within one surface.

## 4. What to KEEP, what to ELEVATE, what to CREATE

**KEEP exactly (owner-approved, verified in release builds):** the palette/tokens; Newsreader/Public Sans/Amiri; the Today screen's structure (period eyebrow → city/date header → featured next-prayer card → times list → verse of the day); the gold-frame + corner-bracket featured-card concept (one per screen max); illuminated section rules; the reverence rules; the native iOS 26 "Liquid Glass" tab bar and Android Material bottom nav (do NOT design a custom tab bar); the honest disclaimers.

**ELEVATE (your main canvas — same bones, pristine execution):** Tasbih (weakest screen today), Qibla dial, Ask (all states), Settings/More architecture, Calendar grid, Zakat, Onboarding, Bookmarks, Library/Thinker/Work reader, About, city picker, all picker sheets, the audio bar, the full-adhan banner.

**CREATE from scratch (currently unstyled or nonexistent):** splash→home handoff; a complete skeleton-loading system; a designed empty-state illustration kit; audio failure/retry state; Tier-B model download + on-device answer card; toast/confirmation pattern; iOS + Android home-screen widget; notification appearance spec; Ramadan seasonal mode; "flat/essential" tier renderings; RTL mirroring spec panel.

## 5. Platform strategy (same design, native feel)

Design one visual language, then annotate the deltas. Show iPhone frames as primary (390×844 with Dynamic Island); include Android frames (412×915, Pixel-style) for the screens where the delta is visible (Today, a picker sheet, widget, notifications, splash).

| Surface | iOS | Android |
|---|---|---|
| Tab bar | Native UITabBarController — iOS-26 Liquid Glass floating pill (inset ≈21pt from sides/bottom, 11pt labels) + a separate circular search island for the Ask tab. NEVER mock a custom bar or override its material; content scrolls under it with a bottom clearance ≈64pt + safe area. (Minimize-on-scroll exists in iOS 26 but is unreliable in this stack — do not design around it.) | Material 3 bottom navigation bar, app-themed (tokens), NOT translucent glass; active tint accent. Dynamic color NOT adopted (fixed brand palette) — annotate that choice |
| Press feedback | Pressed-state dim (opacity .72 + scale .98) — the iOS list-highlight idiom; no ripple | Same + native ripple in border token (Android-12+ ripples are subtle by design) |
| Sheets/pickers | pageSheet/formSheet modals with grabber, radius-8 top corners (iOS 26 trends larger concentric radii on sheets — acceptable to round sheets to 12–16 while cards stay radius 8; annotate as a proposed sheet-only token) | M3 bottom sheet with drag handle, same radii; system back closes it |
| Back | Native swipe-back edge gesture, minimal back chevron | System back gesture/button. Predictive back is NOT supported by the app's navigation stack — design back affordances that never depend on it |
| Switches | Native iOS switch, onTint accent | Material switch, themed track/thumb |
| Scroll edges | iOS-26 style: content fades/blurs slightly under top bars ("soft" edge), hairline appears on scroll | Elevation/tonal shift on the header instead of blur; Android-12+ stretch overscroll stays system-default |
| Splash | Static mark on canvas color; fade-out ≤400ms (fade is iOS-only) | Android 12+ SplashScreen API is icon-only: icon 288dp fitting a 192dp circle (or 240dp in a 160dp circle with bg), single opaque window color, NO full-bleed art, exit is instant — design within exactly that |
| Status/nav bars | Content-derived light/dark; edge-to-edge | Edge-to-edge is mandatory (Android 15/16 — no opt-out); transparent nav bar; annotate scrim/contrast rules per screen |
| Haptics | impact/selection/notification semantics (System Haptics; suppressed in Low Power) | Native haptic constants (Segment_Tick, Confirm, Toggle_On/Off…) — NOT emulated iOS buzzes; fewer, softer |
| Widgets | WidgetKit small + medium + lock-screen circular (vibrant/tinted modes) | Modern RemoteViews 4×2 resizable (dynamic-color aware) |

## 6. Motion language — "light moves like the sun: slowly, inevitably, without noise"

Principles: motion explains (state, hierarchy, continuity), never entertains; **nothing animates for waits under ~300ms** (show nothing, then skeleton); nothing loops except during active waiting (skeleton pulse, download progress); nothing bounces on scripture surfaces; everything has a Reduce-Motion/flat-tier equivalent (cross-fade or instant). 60fps floor; springs on capable devices, timed curves elsewhere.

**Named curves to use in specs** (the engineer maps these to Reanimated 4): `standard` = cubic-bezier(0.2, 0, 0, 1) · `decelerate` = cubic-bezier(0.05, 0.7, 0.1, 1) (entrances) · `accelerate` = cubic-bezier(0.3, 0, 0.8, 0.15) (exits) · `springSmooth` ≈ 0.45s perceptual, no bounce (default spring) · `springSnappy` ≈ 0.45s, slight bounce ≤15% (reserved for the tasbih count and chips). Never exceed 15% bounce anywhere; zero bounce near scripture.

**Global spec (each row names duration + curve; annotate these on the mockups):**

| Element | Spec | Reduce-Motion fallback |
|---|---|---|
| Press feedback | in 80ms accelerate / out 140ms decelerate, scale .98 + dim | state-only (instant highlight) |
| Screen push/pop | native stack transitions (iOS system push ≈350ms; Android fade-through 300–400ms standard — never a fake iOS push on Android) | system-handled |
| Sheet present | native pageSheet/bottom-sheet (system springs) | system-handled |
| Content settle-in (per screen, once) | fade + rise 12pt, 300ms decelerate; stagger siblings 30–50ms, first screenful only, whole choreography <500ms | single cross-fade ≤200ms |
| Element exit | 150–200ms accelerate (exits always faster than entrances) | instant |
| Skeleton pulse | opacity .35↔.75, ~1000ms breathing loop (deliberately a pulse, NOT a shimmer sweep — calmer and RTL-safe; matches the shipped Skeleton primitive) | static fill |
| Countdown minute tick | rolling-digit odometer on the changing digit only, ≤400ms springSmooth, digits roll in the count direction; ticks never overlap; NO per-tick haptic | instant swap |
| Tasbih count | rolling odometer 300ms springSnappy + ring arc progress 300ms standard; detent flash 700ms at 33/99 | instant number + static ring states |
| Qibla needle | UI-thread sensor tracking (exists, keep); aligned moment: dial fill cross-fades to accentSoft + success border 250ms standard + gentle gold glow bloom 600ms decelerate | keep needle (functional), skip bloom |
| Ambient gradient period change | 1200ms cross-fade when the prayer period flips while the app is open | instant |
| Theme switch | 250ms full-screen cross-fade, standard | instant |
| Gold section rules | draw-in once per screen visit (scaleX 0→1 from the label edge, 400ms decelerate) | static |
| Audio play/pause | glyph cross-fade 150ms; progress bar continuous; buffering indicator appears only after ~300ms | same (functional) |
| Adhan banner | slide-up + fade 300ms decelerate from bottom; dismiss = slide-down 200ms accelerate | fade |
| Download progress (Tier-B model) | determinate 3pt bar + MB count + % (progress bars earn ~3× user patience — never an indeterminate spinner for a GB-scale download); pause/resume/retry affordances; never restarts from zero | same |
| Toast/confirmation | fade + rise 200ms decelerate, hold 1600ms, fade 200ms | fade only |
| Number changes (zakat total) | 300–600ms springSmooth digit roll, direction = value direction | cross-fade |

**Signature moments (design each as a storyboard strip + a live CSS demo):**
1. **Splash → Today handoff:** the dawn mark's sun disc + arcs on canvas → the mark settles as the Today ambient gradient and content fade-rise in staggered groups. One continuous sunrise feeling, ≤600ms after load; nothing blocks interaction.
2. **Prayer-time arrival:** when a prayer time hits while the app is open, the featured card's countdown resolves to the prayer name, the ambient gradient cross-fades to the new period, and a single soft pulse runs along the gold section rule. No sound, no confetti.
3. **Tasbih round completion:** ring completes → 700ms success bloom (border → success color + faint glow) + haptic; the count settles at the target; a quiet reset affordance appears. Calm, not celebratory.
4. **Qibla alignment:** described above; the one allowed "reward" glow in the app.
5. **Verse-of-day reveal:** the card's content cross-fades in AFTER the rest of Today settles (scripture never animates in pieces — whole-block fade only).

**Haptics vocabulary (already in code — your annotations reference these verbs):** press / select / detent (33) / success (round complete, qibla aligned) / warning (reset) / error. Tied to the user's "Touch feedback" toggle, not to Reduce Motion.

## 7. Screen-by-screen briefs

For EVERY screen below, deliver: light + dark mockups (night-warm additionally where noted), each listed state, motion notes, and an annotation layer (token names, spacing, icon names, platform deltas). Use the exact copy strings given in §11 — do not rewrite product copy except where a brief explicitly says PROPOSE (and those are UI-chrome strings only, never religious content).

### 7.1 Launch & loading system
- **Splash (both platforms):** dawn mark centered on bgCanvas (light) / #15181D (dark). Android: icon-in-circle constraint. Spec the exact handoff choreography to Today (signature moment 1) including the existing 200ms native fade.
- **Boot skeleton:** the first frame of Today if fonts/db resolve slowly — a content-shaped skeleton (header line, featured-card block, 6 list rows) in canvas tones. No logo-spinner screen, ever.
- **Skeleton system:** one spec block: shapes mirror real content (text bars 45–100% widths, card blocks, row grids), radius 6, border-token fill, breathing pulse; used today in Ask (Books), Library search, Work reader — design one exemplar per shape family so the engineer can extend it to any async surface.

### 7.2 Onboarding (3 steps) + city picker
Current: three centered static steps, functional but bare. Elevate into the app's first impression while keeping the exact same steps and copy:
- Step structure: Welcome (greeting + free-forever/privacy body + "Begin"), City ("Where do you pray?" + "Choose your city"), Reminders ("Prayer reminders" + "Turn on reminders" / "Not now").
- Design: dawn-arc geometric illustration kit (icon-motif line art, no beings), per-step shared-axis transition (slide + fade 300ms; the steps are sequential state, not a swipe pager — keep it that way), progress shown as three small gold diamonds, ambient fajr gradient on step 1 only, deliberately quiet on the permission step (a trust moment — the "you can change your mind anytime" caption stays visible).
- **City picker (modal, used app-wide):** search field ("Search city or country"), ranked offline results (city + country line), states: hint ("Type a city name, e.g. Houston."), no-match ("No match — try the nearest big city."). Design the keyboard-open composition, row anatomy, and selection feedback.

### 7.3 Today (home)
Keep the structure; refine the craft. States to render:
1. Populated (sample data §11; show the fajr-period ambient in light + the isha-period in dark).
2. Ramadan mode: the ochreSoft suhoor/iftar card ("Suhoor ends" fajr time / "Iftar" maghrib time) + PROPOSE a restrained Ramadan ambient variation. Explicitly NO lanterns or skyline art.
3. Empty/no-city (icon + greeting + privacy body + "Choose your city").
4. Tomorrow state ("Fajr (tomorrow)" after Isha) and the high-latitude invalid time (an em-dash row).
5. **Adhan-moment banner** (global, bottom-floating above the tab bar): "Playing the Fajr adhan" + "Stop". Redesign as a dignified floating pill (accent fill, e2, radius 8).
6. Notification mockups (§7.13 has the spec): one iOS banner + one Android notification using "It's time for Fajr prayer."
Refinements to solve deliberately: the typographic rhythm of the six time rows (tabular numerals, baseline alignment; past prayers dim to textSecondary — no checkmarks, this app does not log worship), the next-row highlight (accentSoft + 3pt gold start-border — keep, polish), countdown typography (32pt display serif + rolling digits), the city-row tap affordance, the dual date line ("Thursday, July 30 · 16 Safar 1448").
**Calm-countdown rule (research-backed):** countdown timers are documented anxiety triggers — the hero shows minutes granularity ("in 4h 58m"), switching to minutes+seconds only inside the final five minutes; never a ticking-seconds display all day, never urgency colors (no red, no pulsing). The ambient gradient, not the number, is what communicates the passage of the day.

### 7.4 Quran: list, reader, bookmarks, audio
- **Surah list:** header + Bookmarks link (redesign as icon + label chip); search field; continue-reading gold chip ("Continue reading — 2:255"); 114 rows: number badge (36pt circle, accent outline), transliteration + "The Opening · 7 verses", Arabic name right-aligned (Amiri 20/36). Search mode: ayah hits (surah:ayah + 2-line translation). Empty: "No matches." Design the row rhythm, badge weight, and Arabic/Latin baseline harmony. Lists load instantly — no skeleton here.
- **Reader (the sanctuary — maximum restraint):** native header "1. Al-Faatiha" + size steppers + "Arabic only"/"Translation" toggle (redesign the steppers as proper controls); DEV-translation badge; tajweed legend card (8 color dots + labels + draft note; tajweed hex values are in the token file — ask the engineer's handoff notes to reference them, and show the legend with its 8 labels: Long madd, Natural madd, Ghunnah, Qalqalah, Ikhfa, Iqlab, Idghaam, Silent); ayah block: Arabic 28/56 RTL → translation (reading serif 16/26) → footer row (surah:ayah in accent, bookmark star, "Share"). Calm hairlines between ayat. States: default light/dark/**night-warm** (mandatory third render), Arabic-only, tajweed-on, text-scaled 150%, not-found ("Surah not found."). Reverence: zero decoration on the text surface; the ONE featured element is the audio card. Typography verdicts (research-backed): Arabic line-height stays ≥2.0× (tashkeel clip below that), letter-spacing exactly 0, translation visually subordinate (smaller, muted, serif). Do not introduce the mushaf ayah-end rosette marker (U+06DD) into this card layout — it belongs to continuous mushaf text; the neutral "1:1" chrome badge is the correct convention for an ayah-by-ayah reader.
- **Audio card (top of reader):** gold-framed card with a 44pt circular play button, "Listen", caption states: idle "Streamed — nothing stored on your phone" / playing "0:42 / 12:08" + progress line / buffering (activity glyph inside the button, never a page spinner) / **NEW error state: retry affordance for stream failure — PROPOSE copy in the "name what still works" pattern, e.g. "Audio needs a connection. Your Quran text, prayer times, and qibla all work offline." + a quiet Retry** / DEV-audio badge ("DEV audio — placeholder tone, not recitation"). Also spec the lock-screen/now-playing appearance (title "Al-Faatiha", artist "DeenDawn", the dawn mark as artwork).
- **Bookmarks:** rows (surah name + surah:ayah + Arabic + 2-line translation + remove star) and the empty state ("No saved verses yet. Tap the star on any verse to bookmark it.") with a geometric illustration.

### 7.5 Ask (search tab)
The most state-rich screen; design ALL of them:
1. Idle Quran hint + idle Books hint (exact copy §11) — elevate from bare centered text to a composed, quiet zero-state (geometric motif + the hint + 2–3 plain example topic chips: PROPOSE e.g. patience · charity · mercy — plain topic words only, no religious claims).
2. Source chips Quran/Books (selected = filled accent, unselected = hairline).
3. Loading (Books): skeleton rows.
4. **Count answer:** serif answer line (see §11 sample) + wrapping reference chips — design the chips as tappable accentSoft pills with real touch targets.
5. **Verse-list results:** rows surah:ayah + translation snippet.
6. **Scholar redirect card** (Quran + Books variants): ochreSoft, gold start-border, exact copy — warm and respectful, visually distinct from results, never error-styled; the Quran variant is followed by related-verse rows.
7. Empty ("Nothing in the text matches that — try a different word.").
8. **Tier-B card** (lives in Settings today; design its states as one component sheet): idle with "Download model ({size})" + body copy, downloading (3pt progress + "Downloading… you can keep using the app."), verifying, failed + retry, ready + "Delete model" link, ineligible-device, wifi-only, pending-upload.
9. **Tier-B answer surface (FUTURE — design it now):** an "On-device answer" card that visually subordinates itself to scripture: a ≤2-sentence generated summary set in UI sans (NEVER the serif or any Arabic styling — generated text must not look like scripture), tappable [1][2][3] citation superscripts linking to the retrieved verses listed beneath, and a permanent hairline footer label — PROPOSE: "Generated on this phone from the verses shown — not a ruling." Distinct background (bgElevated) so generated text can never be mistaken for quoted text.

### 7.6 Qibla
States: no-city empty, permission-denied ("The compass needs location permission to work. Your location never leaves your phone." + "Enable compass"), active seeking ("Qibla is 23° to your right" + "45° from north · Houston"), **aligned** ("Facing the qibla" — accentSoft dial fill, success ring + needle, glow bloom), calibration chip ("Compass needs calibration — move your phone in a figure-8 motion"), magnetic-north caveat chip.
Redesign the dial: 280pt (360 on tablet) e2 surface; fine degree ticks (majors at the cardinals, minors every 15° — quiet, hairline weight), cardinal N marker, needle as a refined accent bar with an ochre pivot. The **qibla marker on the ring**: a small flat stylized Kaaba glyph is traditionally acceptable (centuries of prayer-rug precedent — aniconism restricts animate beings, not architecture); alternatively the app's gold diamond motif. Choose whichever composes better; flat and minimal either way, never photoreal or 3D. Alignment behavior stays at the app's ±3° window (stricter than the ~5° market convention — keep it) with ONE soft haptic on entering alignment, never continuous vibration while aligned. Calibration UX: the figure-8 chip appears only at low sensor accuracy, as a persistent quiet chip — never a modal interruption. Show off-target vs aligned side by side. The caveat chips become one consistent component (ochreSoft + gold start-border).

### 7.7 Tasbih (weakest screen — full recomposition, same features)
Keep: tap-anywhere ring, optional label field, 33/99 targets, reset, 7-day history, milestone flashes, haptics. Redesign:
- The ring becomes a **progress ring**: thin track (border token) + accent arc filling toward the target; 80pt serif rolling count centered; "12 / 33" caption; subtle gold tick marks at the 33/66 positions when the target is 99.
- Milestones: 33 detent → ochre arc flash 700ms; round complete → success bloom (signature moment 3).
- Target chips + Reset as one coherent chip row (Reset = quiet destructive styling with **hold-to-reset** — a ring that fills during the hold, the premium accidental-reset protection — plus an optional small Undo affordance for a stray tap; annotate both).
- History: replace the bare date rows with a 7-day mini dot/bar strip (ochre for active days, icon-token for zero) + counts; keep it data-quiet.
- The label field ("Add your own label (optional)") styled as an editorial serif caption input. NO Arabic dhikr text anywhere (scholar gate — user-typed labels only).
- Ambient day-gradient stays. States: fresh 0/33, mid-count 12/33, detent flash at 33, round complete, history-populated, flat tier.

### 7.8 Islamic calendar
Keep the dual-date grid, key-date gold dots, today = accentSoft cell, legend, ochre-bordered disclaimer, month nav (make the arrows proper icon buttons + a 250ms month cross-fade/slide). Refine: cell typography (Gregorian primary 17, hijri caption 12), PROPOSE a weekday header row (S M T W T F S captions), month header hierarchy ("July 2026" serif + hijri month range caption + "Today: 16 Safar 1448"), key-date legend rows (labels in §11). States: default, a Ramadan month (mark the first-day row), flat tier.

### 7.9 Zakat calculator
Keep: the featured result card with 3 states (due "Zakat due (2.5%)" + amount / needPrices / belowNisab) + nisab line; sections "What you own" (5 fields) / "What you owe" (1) / "Today's metal prices" (2 + privacy note); the disclaimer callout. Refine: form-row anatomy (label left, decimal input right, tabular numerals), focused-input state, keyboard-open composition, result-card number typography (32 serif, digit-roll on change), the three result states side by side, currency-agnostic number formatting (plain numbers, no currency symbol; thousands separators applied on blur, never mid-keystroke — annotate), the disclaimer treatment. In the privacy note's placeholders use the app's nisab constants: **85 g gold / 595 g silver** (these exact numbers are what the app ships, flagged for scholar review — do not substitute other fiqh values).

### 7.10 Library (Thinkers & books), Thinker, Work reader
- Library: review-pending note (ochreSoft), search ("Search the bundled books…"), thinker rows (name + "era · school"), search-section results, loading skeleton, empty ("No matches in the bundled books.").
- Thinker page: name/era/school header, "Key ideas" bullets (ochre dots), "Major works", "Read in the app" work cards ("Translated by Claud Field (1909)").
- Work reader: an editorial serif book page at the 680 measure, section-number deep links, header caption "Translated by {name} ({year}) · Public domain", loading skeleton (exists — polish it), error/empty ("This book could not be loaded — try reopening it.").
Give this trio a subtle "manuscript study" flavor within tokens (e.g., ochre folio numbers) — still zero figurative art.

### 7.11 Settings (More tab) — information-architecture pass
Today: one long undifferentiated card + section rules. Redesign into grouped cards with leading icons (SF/Material pairs annotated; accentSoft icon tiles 28pt, radius 6):
- **Prayer settings:** Location · Calculation method · Asr time (madhab) · High-latitude nights.
- **Adhan notifications:** the silent/Focus caveat hint + 5 prayer rows (name + sound value + native switch) — resolve the row so the tappable sound zone and the switch are unambiguous; the sound picker sheet (Standard ping / Short adhan clip / Full adhan / Silent + the honesty hint).
- **Reading:** Reading size stepper row (dec · 100% · inc; disabled ends at 35% opacity) · Night reading (warm) switch · Tajweed colors switch (draft note).
- **Appearance & feel:** Theme (System/Light/Dark picker) · Touch feedback switch · Language (English + Urdu + Arabic in their native scripts, values in §11) + the bilingual restart dialog (design it: title "Restart required · {language}", body in both languages, buttons "Not now" / "Restart now").
- **App:** Islamic calendar · Hijri date adjustment (−1/0/+1) · Suhoor reminder (Off/20/30/45/60 minutes) · Tasbih · Zakat calculator · Thinkers & books · About & attributions.
- Footer: the Tier-B card slot + the gold-framed privacy statement ("DeenDawn stores everything on your phone. No account, no ads, no tracking.").
Also design the generic **picker sheet** anatomy once as a component (title, hint, option rows, selected checkmark, close affordance).

### 7.12 About & attributions + Not found
- About: brand lockup "Deen Dawn" with the italic accent word, "Version 1.0.0", "A Khavion Apps product", the privacy card, "Texts, translations & fonts" attribution rows (name + license caption + dev-placeholder note where flagged), footer "Free forever. Built with care for the ummah." Make it a colophon — the credits page of a beautiful book.
- Not-found: "Screen not found" + "That link doesn't match anything in DeenDawn." + "Go to Today" link + a small geometric motif.

### 7.13 System surfaces (design fresh)
- **Notifications:** an iOS banner (app icon, "Deen Dawn", "It's time for Fajr prayer.") and an Android notification including its small-icon treatment (monochrome dawn-mark lineart); the suhoor variant ("Suhoor reminder" / "Fajr is coming soon — suhoor is ending.").
- **Widgets (design now, built next):** iOS small (next prayer + countdown + city), iOS medium (next prayer + full-day 5-time strip), iOS lock-screen circular (prayer glyph + time), Android 4×2 (equivalent medium). Data available: city, timezone, today's 5 prayers + tomorrow's fajr, next-prayer index. Match system widget conventions (tight margins, iOS vibrant/tinted rendering modes, Android dynamic-color note) while carrying the dawn-gradient identity. No scripture in widgets.
- **Toast/confirmation chip (new pattern):** a bottom-floating quiet pill above the tab bar for: bookmark added / bookmark removed / share-copied confirmations. PROPOSE the final microcopy; spec safe-area + tab-bar clearance behavior.

### 7.14 Ramadan mode (seasonal, tasteful)
When the hijri month is Ramadan: Today shows the suhoor/iftar card (exists); PROPOSE a maghrib-warm ambient bias and, at most, a hairline single-weight crescent in the period eyebrow; the calendar highlights the month. **Seasonality is functional, not decorative** — the countdown quietly becoming "Iftar" IS the Ramadan design; that reads as care, while decoration reads as marketing. Explicitly NO: lanterns, dates-and-lanterns clip art, mosque skylines, sparkles, gold-foil textures, or countdown-to-Eid gamification. The stereotype test (from Ramadan design criticism): if the treatment could belong to any festive occasion with minor edits, it is wrong.

### 7.15 Component library sheet (one section of the deliverable)
Render every primitive in all 3 themes + flat tier: Buttons (primary/secondary/disabled/pressed), chips (selection, reference-pill, caveat), cards (surface e1–e3, gold-frame + brackets), section rule, period eyebrow, list rows (setting, prayer-time, surah, verse-hit, attribution), inputs (search, decimal, label), stepper, switches (per platform), picker sheet, skeleton set, toast, banner, badges (DEV/draft/dev-audio), progress (ring, 3pt bar, download), the empty-state kit (3 geometric illustrations: dawn-arc, star-lattice, open-horizon), dialogs (bilingual restart, permission priming).

## 8. The "flat / essential" tier is a first-class design
Low-end devices and Reduce Motion collapse to: no gradients (solid canvas), no gold corner brackets (border only), no shadows (hairlines), no pulse/press-scale, instant state changes. Render Today + Tasbih + Reader once in this tier so the engineer has a visual target, and include the degradation table.

## 9. Accessibility & international rules (annotate throughout)
- WCAG AA minimum on every text/background pair in all 3 themes (the repo enforces this in automated tests — any new pair you propose must clear 4.5:1 body / 3:1 large text).
- Tap targets ≥44pt iOS / 48dp Android — including the header steppers and chips.
- Dynamic Type: content scales ×2.0, headings ×1.6, chrome labels ×1.4; show one Today render at 200% content scale to prove the layout survives (rows wrap, nothing truncates an ayah).
- RTL: one annotation panel (not full mockups). MIRRORS: row order, chevrons/disclosure arrows, start-borders (the gold accent bars), the section-rule fade direction, back affordance, progress-bar fill direction, calendar day order. NEVER MIRRORS (per Apple + Material bidirectionality rules): media playback glyphs and the audio scrubber, clocks and clock times, numerals and phone numbers, the compass dial, the search magnifier. Arabic UI snippets are provided-strings-only; mixed-direction strings (an Arabic name inside a Latin sentence) get bidi isolation — annotate it.
- Urdu note: Nastaliq script needs ~1.9–2.1× line-height (the font's tall metrics are correct — constraining them clips letterforms; accept the generous spacing); never clip descenders; keep chrome labels in containers sized for Latin metrics + that factor. Urdu uses its own extended Arabic-Indic digit forms — an implementation note, not a mockup task.
- Reduce Motion parity per §8. Haptics ride the user's toggle, not Reduce Motion.

## 10. Deliverable format (hard requirements)
1. **One self-contained HTML file** (inline CSS/JS/SVG; Google-Fonts links allowed for Newsreader, Public Sans, Amiri Quran). No external images. It must open perfectly from a local file.
2. A sticky **table of contents**; sections: 0 Cover & principles · 1 Tokens & type · 2 Components · 3 Motion (live demos) · 4 Screens (grouped as §7) · 5 Platform deltas · 6 Widgets & notifications · 7 Flat tier · 8 A11y/RTL · 9 Handoff notes.
3. Screens rendered inside **device frames** at 390×844 (iOS primary) and 412×915 (Android where the delta matters), pixel-perfect at 1×, with a **global light/dark/night-warm theme switcher** that re-themes every frame live (CSS variables = the token table).
4. **Live motion demos**: each §6 signature moment + skeleton pulse + rolling digits + ring progress as small looping CSS/JS demos beside the relevant screen, each with a visible spec caption (duration/easing/trigger) and a "reduced" variant toggle.
5. **Annotation layer**: numbered callouts on every mockup (token names, sizes, spacing, icon names per platform, behavior notes). Prefer token names over raw hex everywhere.
6. **Handoff notes per screen**: 3–6 bullets telling the React Native engineer exactly what changes vs today (they know the current code; reference components by name: TodayScreen, GoldFrameCard, SectionRule, PeriodEyebrow, Skeleton, AppPressable, Gradient, SurahAudioBar, TierBCard, FullAdhanPlayer, PickerModal, CityPickerModal).
7. **Definition of done — verify before finishing:** every screen in §7 rendered with EVERY listed state ✓ · all 3 themes via the switcher ✓ · flat-tier renders ✓ · 200% type render ✓ · RTL panel ✓ · motion demos with numbers ✓ · component sheet complete ✓ · zero invented Arabic/religious data (§2) ✓ · zero undeclared new hexes ✓ · a single file ✓.
If output length forces multiple responses, continue in the SAME html document structure until the checklist passes — do not summarize or skip states to save space.

## 11. Verbatim sample data (the ONLY religious content you may render)

**Quranic Arabic + translation (byte-exact, extracted from the app's verified database; render in Amiri Quran; do not edit, extend, or re-type):**

[[AR_SAMPLES]]

(The translation lines are Pickthall 1930 — the DEV translation — so reader mockups always carry the DEV badge. Citation format: "Al-Faatiha 1:1". For longer reader scrolls, repeat these rows with the annotation "rows repeat — the real app renders the full surah from quran.db".)

**Surah list rows (real metadata, Arabic names extracted from the database):**

[[SURAH_ROWS]]

(Annotate: the remaining 109 rows repeat the pattern.)

**Language names for the Settings language picker (native scripts, extracted from the app's locale files):**

[[LANG_NAMES]]

**Prayer times (real app output — Houston · Thursday, July 30 · 16 Safar 1448):** Fajr 5:27 AM · Sunrise 6:40 AM · Dhuhr 1:29 PM · Asr 5:04 PM · Maghrib 8:16 PM · Isha 9:29 PM. Next-prayer card sample: "Next prayer / Fajr / 5:27 AM / in 4h 58m".
**Countdown formats:** "in 4h 58m", "in 4m 12s".
**Continue reading:** "Continue reading — 2:255". **Bookmarks sample rows:** reuse only the provided ayah strings (e.g. Al-Faatiha 1:2).
**Ask samples:** count answer "4 verses match "bribery" in the bundled translation" with reference chips 2:188 · – · – · – (label extra chips with a dash and annotate "illustrative — real counts and references come from the app's exact-match search"); example idle topic chips: patience · charity · mercy.
**Tasbih:** mid-state 12 / 33; history 07-24…07-30 with counts 33, 99, 0, 33, 0, 66, 12.
**Zakat sample:** inputs 12,500 / 40 g / 0 g / 3,000 / 500 / 1,200; prices 85 and 1.05 per gram; result card "Zakat due (2.5%): 371.58" + "Nisab threshold: 3,400" (annotate: illustrative numbers — the app computes real values).
**Library:** works — The Confessions of Al-Ghazali (Claud Field, 1909) · The Persian Mystics: Rumi (F. Hadland Davis, 1907) · Religious and Moral Teachings of Al-Ghazali (Syed Nawab Ali, 1920); all "Public domain".
**Hijri:** today = 16 Safar 1448 · month header "July 2026 / Muharram 1448 – Safar 1448". Key-date legend labels only: Ashura, Ramadan begins, Eid al-Fitr, Eid al-Adha, First days of Dhul-Hijjah, White day.

**Exact UI strings (use verbatim; this is the product's shipped copy):**
- Tabs: Today · Quran · Ask · Qibla · More. Prayers: Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha. Periods: Dawn, Day, Afternoon, Dusk, Night.
- Today: "Next prayer" · "Today's times" · "Verse of the day" · greeting "As-salamu alaykum" · empty body "Choose your city to see today's prayer times. Everything stays on your phone — nothing is sent anywhere." · button "Choose your city" · "Suhoor ends" / "Iftar" · "{prayer} (tomorrow)".
- City picker: "Choose your city" / "Search city or country" / "Type a city name, e.g. Houston." / "No match — try the nearest big city."
- Quran: "Search the Quran (Arabic or English)" · "No matches." · "Arabic only" / "Translation" · "Share" · "Bookmarks" · "No saved verses yet. Tap the star on any verse to bookmark it." · "Surah not found." · DEV badge "DEV translation (Pickthall, 1930) — final translation pending review" · tajweed "Tajweed colors — draft, pending scholarly review" + "Tajweed data: cpfair/quran-tajweed (CC BY 4.0)" + rule labels Long madd / Natural madd / Ghunnah / Qalqalah / Ikhfa / Iqlab / Idghaam / Silent.
- Audio: "Listen" · "Streamed — nothing stored on your phone" · "DEV audio — placeholder tone, not recitation" · lock-screen artist "DeenDawn".
- Ask: Quran hint "Search-powered answers from the Quran text itself — counts, verses, and topics. Tap any reference to read it in context." · Books hint "Search the classical works in the library — for example 'the soul' or 'knowledge'. Tap a passage to read it in its book." · redirect "Questions about what is permissible deserve a qualified scholar, not an app — please ask one you trust. Verses related to your topic:" · empty "Nothing in the text matches that — try a different word." · source chips "Quran" / "Books" · input placeholder "Ask about a topic, word, or count…".
- Tier B: "On-device AI answers (optional)" · "A small AI model can rephrase retrieved verses into a short answer, entirely on your phone. It never goes online and never answers religious rulings." · "Download model ({size})" · "Downloading… you can keep using the app." · "Verifying the download…" · "Download failed. Check your connection and try again." · "Model ready — answers are generated on this phone." · "Delete model" · "The model files are not published yet. Exact search answers remain fully available."
- Qibla: "Facing the qibla" · "Qibla is {n}° to your right/left" · "{n}° from north · Houston" · "Compass needs calibration — move your phone in a figure-8 motion" · "Using magnetic north — your device could not provide true north" · "The compass needs location permission to work. Your location never leaves your phone." · "Enable compass" · "Choose your city to find the qibla direction." · north marker "N".
- Tasbih: "Tasbih" · "Tap anywhere in the circle to count" · "Add your own label (optional)" · "Reset" · milestone announcement "Round complete".
- Calendar: "Islamic calendar" · "Today: 16 Safar 1448" · disclaimer "Calculated (Umm al-Qura) — may differ from local moonsighting. You can adjust by ±1 day in Settings."
- Zakat: "Zakat calculator" · sections "What you own" / "What you owe" / "Today's metal prices" · fields "Cash & bank balances", "Gold (grams)", "Silver (grams)", "Business inventory & assets", "Money owed to you", "Debts & bills due", "Gold price per gram", "Silver price per gram" · "Zakat due (2.5%)" · "Nisab threshold: {amount}" · "Enter at least one metal price to work out the nisab threshold." · "Your zakatable wealth is below the nisab threshold — no zakat is due." · "Enter current prices yourself — the app never fetches prices online (privacy). Nisab uses {gold}g of gold or {silver}g of silver, whichever is lower in value." · disclaimer "This is a calculation aid, not a religious ruling. Situations differ — please confirm with a knowledgeable scholar."
- Settings: header hint "Prayer time settings. If you are not sure, the automatic options follow the most common conventions for your region." · rows per §7.11 · adhan hint "Get a reminder at each prayer time. Your phone's silent switch and Focus modes can mute these — that is an iPhone setting, not the app." · sound options "Standard ping / Short adhan clip / Full adhan / Silent" + honesty hint "iPhones cannot play a full-length adhan from a notification. With "Full adhan", the reminder plays the short clip, and the full adhan plays when you open the app from it." · "Reading size" · "Night reading (warm) — Amber tones in the Quran reader, easier on the eyes before dawn" · "Tajweed colors — Color the Quran by pronunciation rules (draft — pending review)" · "Theme" System/Light/Dark · "Touch feedback — Gentle taps confirm actions" · "Language" · privacy card "DeenDawn stores everything on your phone. No account, no ads, no tracking."
- Restart dialog: "Restart required · {language}" · buttons "Not now" / "Restart now".
- About: "About" · "Version 1.0.0" · "A Khavion Apps product" · "Your privacy" + body "DeenDawn keeps everything on your phone. No account, no ads, no analytics, no tracking. Your location is used only on this device for prayer times and the qibla, and is never transmitted. The only network use is streaming recitation audio you request." · "Texts, translations & fonts" · "Development placeholder — final selection pending review" · "Free forever. Built with care for the ummah."
- Library: "Thinkers & books" · "Search the bundled books…" · "Draft summaries — pending scholar review before public release." · "Key ideas" / "Major works" / "Read in the app" · "Translated by {name} ({year})" · "No matches in the bundled books." · "This book could not be loaded — try reopening it." · work header "Translated by {name} ({year}) · Public domain".
- Onboarding: "As-salamu alaykum" + "Prayer times, the Quran, qibla, and more — free forever, no ads, no accounts. Everything stays on your phone." + "Begin" · "Where do you pray?" + "Pick your city so prayer times are right. You can change it anytime in Settings." + "Choose your city" · "Prayer reminders" + "Get a gentle reminder at each prayer time. Your iPhone will ask for permission — you can change your mind anytime." + "Turn on reminders" / "Not now".
- Notifications: "It's time for {prayer} prayer." · "Suhoor reminder" / "Fajr is coming soon — suhoor is ending." · adhan banner "Playing the {prayer} adhan" + "Stop".
- Not found: "Screen not found" · "That link doesn't match anything in DeenDawn." · "Go to Today".

## 12. Reference points (calibrate your taste against these)

**Emulate the discipline of:** **Pillars** (thepillarsapp.com — the market's design benchmark: time-of-day scene keyed to prayer periods, one hero fact per screen, "simple and elegant" widgets, proudly ad-free calm; its formula = absence of clutter + one focal moment + time-of-day atmosphere); **Ayah** (the no-dashboard mushaf purity — "you're simply looking at the Quran itself"); **Quran.com** (a "clean, calm interface that lets the text breathe"; light/sepia/dark reading modes); **Tarteel** (minimal, mushaf-respecting reading surface); **Sajda** (clean, calm, ad-free since 2012). Secular restraint benchmarks: Headspace (Apple Design Award, Social Impact 2023) and the calm-wellness genre's one-action-per-screen discipline.

**Never resemble:** Muslim Pro and Athan — the documented complaints are ads at the moment of worship, busy dashboards ("the UI tries to do too much"), and stale widgets. DeenDawn's zero-ads/zero-tracking posture is its structural advantage; the design's job is to make that calm *visible*.

**Distilled do/don't (from the research):** one pattern family tone-on-tone at 2–6% opacity, never layered ornament · gold as punctuation, never as fill · muted warm palettes, never neon/candy gradients · time-of-day atmosphere over static dashboards · widgets as a hero surface, never an afterthought · calm facts over urgency (no red countdowns) · subtraction as the final polish pass on every screen.

---

# IMPLEMENTATION KICKOFF PROMPT (for the NEXT Claude Code session — not for Claude Design)

*(Zohaib: after Claude Design finishes and you saved its output as one html file — e.g. `docs/design-source/pristine.dc.html` — start a fresh Claude Code session in the repo and paste this:)*

> The owner-approved "Pristine" design pass is saved at `docs/design-source/pristine.dc.html` (open it and read every section: tokens, components, motion specs with durations/easings, per-screen states, platform deltas, flat-tier, a11y/RTL notes, and the per-screen handoff bullets). Implement it into the app for BOTH iOS and Android, following the constitution (CLAUDE.md) exactly — reverence rules, tokens-first (extend `src/lib/theme/tokens.ts`, never hardcode), Reduce Motion / device-tier degradation, and the existing primitives (GoldFrameCard, SectionRule, PeriodEyebrow, Skeleton, Gradient, AppPressable). Use Reanimated 4 for the motion specs. Native-dependency additions (e.g. expo-linear-gradient, react-native-svg or @shopify/react-native-skia for girih/progress rings, expo-device) are allowed — run a fresh prebuild afterwards. Never render mockup religious text from the design file into the app: all scripture keeps coming from quran.db at runtime, and the design's Arabic samples are layout references only. Work screen by screen in the design's §7 order, committing green after each (tsc, eslint, jest including the contrast and religious-text checksum tests). Verify each screen visually as you go: iOS via the iOS Simulator (attach the panel, capture screenshots), Android via the installed emulator (`source scripts/android/env.sh`, avd `deendawn_pixel`), in light/dark/night-warm, at 200% type, in RTL (ar), and with Reduce Motion on. Run the Maestro suites after each phase. Do not touch religious text files, content-pipeline, or checksums. Anything the design leaves ambiguous: decide like a senior engineer, log it in docs/DECISIONS.md, keep moving. Finish with a full-device screenshot sweep and updated docs (PROGRESS/TODO/DECISIONS).
>
> Engineering landmines (verified 2026-07): do NOT use Moti (broken on Reanimated 4 — use Reanimated directly); the legacy `FileSystem.createDownloadResumable` throws on SDK 57 — the Tier-B model download must use the new `File.createDownloadTask()` (pause/resume/progress + iOS background session); keep `android.predictiveBackGestureEnabled: false` (react-native-screens does not support predictive back); the expo-splash-screen `fade` option is iOS-only (Android exit is system-controlled, icon-only splash); merely importing Reanimated costs ~25–30% memory on this RN version — re-measure cold start (<2s budget) after wiring it in; skeletons/buffering indicators appear only after ~300ms so fast loads render nothing.
