# Things waiting on Zohaib

This is the one file you need to read. The top section — **WHAT NEEDS YOU** — is ranked:
the first items unlock testing DeenDawn on your phone; the later ones are nice-to-haves and
far-off decisions. Every item is plain English, says when it's needed, and ends with a
**yes/no recommendation** you can approve in one word. Nothing here is stopping my work —
I keep building everything that doesn't need you.

---

## WHAT NEEDS YOU

### 1. Get DeenDawn onto your iPhone — the Apple setup (the single thing that unlocks your first real test)

**Why this is #1:** Everything else in the app is built and tested (397 automated tests pass,
including a test that proves the whole app works with no internet). The one thing I cannot do
for you is prove to Apple that the app is *yours* — that needs your Apple account and a couple
of keys. Once you hand me those, I can build DeenDawn and push it straight to TestFlight
(Apple's official "try a test app on your phone" system), and it shows up on your iPhone. No
public release, no App Review — just you testing your own app. That step is allowed without any
further sign-off from you.

**What it costs:** Apple's Developer Program is **$99/year** (you've already agreed to this).
The other two things below are **free**.

**When it's needed:** Whenever you want to hold DeenDawn on your own phone. Say the word and do
the three steps below — it's about 20–30 minutes total, most of it waiting for Apple to approve
the enrollment.

**My recommendation: YES — do this when you're ready to test on your phone.** Here's the
click-by-click. Do the steps in order and paste me what each one gives you.

---

#### Step A — Make a free Expo account (2 minutes) — this lets me build the app for you

1. Go to **expo.dev** and click **Sign up** (top right). Use your email; it's free.
2. After signing in, click your avatar (top right) → **Account settings**.
3. In the left menu click **Access tokens** → **Create token**. Name it "DeenDawn" and click Create.
4. It shows you a long secret string **once** — copy it and **paste it to me**. (I'll store it in
   the private keys file on the computer; it never gets shared or committed anywhere.)

*What this is for: it lets me run the build machines for you without you having to log in each time.*

---

#### Step B — Join the Apple Developer Program ($99/year, ~10 min + Apple's approval wait)

1. Go to **developer.apple.com/programs/enroll** and sign in with your normal Apple ID (the one
   on your iPhone).
2. Follow Apple's steps — it asks for your name, address, and the $99 payment. Choose the
   **Individual** account type unless you have a registered company.
3. Apple usually approves within a few hours (sometimes up to a day). You'll get an email.
   **Nothing more to do here until that email arrives.**

---

#### Step C — Create the "API key" that lets me upload builds (5 minutes, after Step B is approved)

1. Go to **appstoreconnect.apple.com** and sign in.
2. Click **Users and Access** (top menu).
3. Click the **Integrations** tab, then the **App Store Connect API** section on the left.
4. Click the **＋ (plus)** button next to "Active."
5. Give the key a name like "DeenDawn EAS." For **Access / Role**, pick **App Manager**
   (that's enough to upload test builds). Click **Generate**.
6. On the new key's row, click **Download** — this downloads a small file ending in **.p8**.
   ⚠️ **Apple only lets you download this file once.** Save it somewhere safe and send it to me.
7. On that same page, note down two short codes and paste them to me too:
   - the **Key ID** (shown on the key's row), and
   - the **Issuer ID** (shown near the top of the page, above the list of keys).

**So Step C gives me three things:** the **.p8 file**, the **Key ID**, and the **Issuer ID**.
I put them in the private keys file (they're covered by our "secrets never enter the code" rule)
and from that moment I can build DeenDawn and put it on your phone via TestFlight.

**After you've done A–C:** just tell me "keys are in." I'll (1) link the project to your Expo
account, (2) build the app on Expo's cloud machines, and (3) upload it to TestFlight. You then
install Apple's free **TestFlight** app from the App Store, and DeenDawn appears inside it ready
to open. (If anything in Apple's screens looks different from the steps above — Apple tweaks its
wording occasionally — send me a screenshot and I'll adjust the instructions.)

---

### 2. Two simple web pages: a Support page and a Privacy Policy page

**What this is:** Apple's store listing requires two public web links — one "support" page and one
"privacy policy" page. They can be extremely simple (even a free one-page site). The app already
has a privacy screen built in; I'll write the text for both pages so you only have to publish them.

**When it's needed:** Only when we go for a **public** release — **not** needed for testing on your
own phone. Listed here so it's not a surprise.

**My recommendation: YES, later — I'll draft both pages; you click publish when we're near public
launch.** (Publishing anything public is always your call.)

### 3. RevenueCat key — only if you want the "tip jar" live (free, 10 minutes)

**What this is:** The optional "Support DeenDawn's development" tip jar is fully built. Without a
key it simply shows "Tips aren't set up in this build yet," which is honest and fine for testing.
To make it live you need one free key.

**Steps (free):** 1) go to **revenuecat.com**, click "Start for free," sign up; 2) create a
**project** named DeenDawn; 3) add an **App Store** app; when it asks for the bundle ID, paste
exactly **com.khavion.deendawn**; 4) it shows a **Public API key** starting with **appl_** — copy
it and paste it to me. (The actual tip products also need your Apple Developer account from item 1,
so it's fine to do both together.)

**When it's needed:** Any time you want the tip jar working. Not required for testing.

**My recommendation: OPTIONAL — skip for your first phone test; do it before public launch.**

### 4. A five-minute prayer-times spot check

**What this is:** I built and tested the prayer-time math against 1,680 reference values. Our
project rules also ask a human to eyeball a few results against a trusted source (your mosque's
timetable or a site like IslamicFinder), just to be safe. I'll hand you a tiny table like "App
says Fajr in Houston on July 20 is 5:18 AM — does your mosque agree within a minute?" You check
2–3 rows.

**When it's needed:** Before the app goes to *outside* testers — not for your own testing.

**My recommendation: YES, later — I'll bring you the table when we're close to outside testers.**

### 5. Quran recitation recordings (the "listen" feature) — I did the deep research; here's the plan

**What this is:** The "listen" feature is fully built and tested, but it currently plays a
clearly-labeled **stand-in tone**, not real recitation. To play actual recitation we need
recordings we're legally allowed to put in the app. The Quran's words belong to no one, but a
*recording* of a specific reciter is that person's (or a radio station's) property — like a song.

**What the research found (done 2026-07-21):** I researched this thoroughly. The uncomfortable but
honest headline: **almost none** of the popular "free Quran audio" websites actually post written
permission saying "you may put this in your app." Because DeenDawn has a tip jar, we count as
slightly commercial, so "free for personal use only" audio is legally risky for us — I won't ship
on a "probably fine." Specifically: **Mishary Alafasy** (the most popular reciter) does **not**
allow free use — ruled out. **Live Quran radio streams** are also out (no permission to relay them,
and it would break our "no other companies' servers" privacy promise).

**The one good path I found:** a library called **QUL** (qul.tarteel.ai, run by the makers of the
Tarteel app). It's the **only** source that states *in writing* you may use its data in commercial
projects (it asks you to check each recording's own terms), and it uniquely includes the
verse-by-verse timing data we'd need to highlight each ayah as it plays. My plan: use the classic
teaching reciter **Sheikh Mahmoud al-Husary** from QUL, copy the files onto **our own** Cloudflare
storage (never streaming from anyone else's site), with **Sheikh Abdul Basit** as a fallback.

**My recommendation (YES / NO for you):** **Approve me drafting one short, polite permission email**
so we have proof-on-file before shipping any recitation. I've already written the draft — see
`docs/AUDIO_PERMISSION_EMAIL.md`. What you'd do:
1. Read the draft (2 minutes). Say **yes** if the wording is fine (or tell me what to change).
2. Because sending an email on your behalf is your call, **you send it** (I'll give you the exact
   addresses). If they reply, forward it to me and I'll keep it on file.
3. Separately, when you set up the Cloudflare storage (item 1's storage keys), I'll download the
   Husary files from QUL, double-check that recording's specific license, and upload them to your
   storage — then flip the listen feature from the stand-in tone to real recitation.

**Until then:** the listen feature stays on the honest stand-in tone (and hides itself entirely if
no audio is configured), so nothing is blocked. Choosing the final reciter is your call (a Human
Gate) — I've narrowed it to a clear first choice + fallback and prepared everything else.

### 6. Name a human reviewer for the Urdu and Arabic text (before public release)

**What this is:** I draft the app's Urdu and Arabic interface text myself, but our agreed rules say
a human who reads those languages must approve every line before real users see it. English needs
no review and ships freely.

**When it's needed:** Before a **public** release in those languages — not for your English testing.

**My recommendation: YES, later — just tell me who'll review** (a friend, family, or community
member is fine); they get a simple checklist in `docs/TRANSLATION_REVIEW.md`.

### 7. Scholar sign-off queue (grows as I build; needed before public release)

**What this is:** A running list of things that want a knowledgeable reviewer's blessing before
shipping publicly: the wording glossary, calendar labels (Eid, Ramadan), the zakat disclaimer, the
philosopher pages, and — most importantly — turning **on** the optional on-device AI answers. I keep
this organized in `docs/SCHOLAR_REVIEW.md`.

**My recommendation: YES, eventually — connect me with a scholar when convenient.** Nothing here
blocks your own testing.

### 8. Upload the AI-answer model files (weeks away — nothing to do now)

**What this is:** The optional on-phone AI ("Ask") needs three model files hosted on your own
Cloudflare storage (never third-party sites, for safety): the main model (Qwen3-1.7B), a smaller
fallback (Qwen3-0.6B), and a "meaning-matcher" (all-MiniLM-L6-v2). I generate a fourth file myself.
The feature ships **off** and stays provably inert until these land and a scholar signs off.

**When it's needed:** Only when I reach that epic (several weeks out). I'll give you exact download
links and upload steps then.

**My recommendation: NOTHING NOW.** The model choice (Qwen3, free Apache-2.0 license) is already
approved — flag it only if you object.

---

## READY FOR HUMAN SUBMIT — the path from here to the App Store

The app is **feature-complete for a first test version**: **397 automated tests green** (47 suites),
including an offline test that proves everything works without internet. Store text (description,
keywords, reviewer notes, privacy answers = "Data Not Collected") is drafted in `fastlane/metadata/`.
The build pipeline is now configured too: **`eas.json` exists** with build + submit profiles, so
the moment your keys (item 1) land I can build and upload with essentially one command.

**You (whenever you're ready — walkthroughs above):**
1. **Apple setup (item 1)** — the single item that unlocks your first real test on your phone.
2. Support + Privacy web pages (item 2) — only for a public release; I draft them.
3. RevenueCat key (item 3) — optional; the app is fine without it.
4. The 5-minute prayer spot check (item 4) — before outside testers.
5. Recitation recordings decision (item 5) — until then the listen feature hides itself.

**Reviewers (before PUBLIC release, not for your own TestFlight testing):**
6. Urdu/Arabic review (item 6) — English-only shipping is fine meanwhile.
7. Scholar sign-off queue (item 7) — includes the final Quran translation choice; the current
   1930 public-domain translation is clearly watermarked as temporary.

**Me (no waiting on anyone):**
8. `eas.json` build + submit pipeline is **done**. The moment item 1 lands I run `eas init`
   (links the project) → `eas build -p ios --profile production` → `eas submit` to TestFlight
   **internal** (allowed without a gate). Getting it onto *outside* testers or the public store is
   a separate step I'll bring to you.
9. Final store screenshots at Apple's required sizes (captured from the big-screen simulator).
10. The in-app privacy screen already exists; I'll mirror it to the public page from item 2.

**Bottom line: item 1 (the Apple setup) is the only thing between you and testing DeenDawn on your
own iPhone.** Everything on my side is ready for it.

---

## Note on the AI model choice

The plan uses **Qwen3** (Apache-2.0 license — free, no strings). You already approved the overall
direction; speak up only if you want a different model. The on-device AI ships **off** behind a flag
and only turns on after your + a scholar's sign-off (item 7).
