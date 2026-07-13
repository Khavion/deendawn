# Things waiting on Zohaib

## NEW from Phase 2 (2026-07-12) — none of these stop my work

### A. Upload the AI model files to your Cloudflare storage (needed before the "Ask" AI answers can be tested end-to-end)

**What this is:** The optional on-phone AI needs three files hosted on your own storage (never from third-party sites, for supply-chain safety): the main model (Qwen3-1.7B, Apache-licensed), a smaller fallback model (Qwen3-0.6B), and a "meaning-matcher" model (all-MiniLM-L6-v2). I'll also generate a fourth file (pre-computed verse embeddings) myself.
**What you'll do:** When I reach that epic (several weeks of work away), I'll give you exact download links and click-by-click upload steps. Nothing needed now — and item 1 on this list (.env with storage keys) may let me do the upload for you.

### B. License-cleared adhan recordings

**What this is:** For the call-to-prayer sound options, we need recordings we legally may ship: short clips (under 30 seconds) plus full-length recordings, with the reciter's (muezzin's) permission documented per recording.
**What you'll do:** If you know a muezzin or own recordings with clear rights, send them over. Otherwise I'll research legally-clear sources and bring you a recommendation. I'm building the whole feature against a silent placeholder meanwhile, so nothing is blocked.

### C. Name a human reviewer for Urdu and Arabic text

**What this is:** I'm drafting the app's Urdu and Arabic interface text myself, but the rules we agreed say a human who reads those languages must approve every line before real users see it (English needs no review).
**What you'll do:** Tell me who will review — a friend, family member, or community member is fine. They'll get a simple checklist document (docs/TRANSLATION_REVIEW.md).

### D. Scholar sign-off queue (grows as I build)

**What this is:** A running list of things that need a knowledgeable reviewer's blessing before shipping: the wording glossary, calendar labels (Eid, Ramadan etc.), the zakat disclaimer, the philosopher pages, and — most importantly — turning ON the AI answers feature for users.
**What you'll do:** Eventually connect me with a scholar or knowledgeable reviewer; I keep the queue organized in docs/SCHOLAR_REVIEW.md.

### E. AI model choice — speak up only if you object

The plan uses Qwen3 (Apache 2.0 license — free, no strings attached). You already approved the overall directive; flag it only if you want a different model.

---

Written in plain English. **Nothing on this list is urgent right now** — the app is being built just fine without these. Each item says what it is, when it's needed, and exactly what to do (I'll also walk you through each one step-by-step when the time comes).

---

## 1. Account keys for Apple, file storage, and donations

**Status: not needed yet — nothing to do right now.**

**What this is:** Later on, the app will need to connect to three paid-or-registered services, and each gives you a kind of password (a "key") that proves the app is yours:

- **Apple** — to put the app on iPhones through the App Store (needs your Apple Developer account).
- **Cloudflare R2** — an online file-storage service where the Quran recitation audio will live, so the app can stream it (like how Netflix streams video instead of storing every movie on your phone).
- **RevenueCat** — a free service that handles the optional "tip jar" donations through Apple.

Those keys get saved into one small private file on your computer (techies call it a ".env file" — it's just a text file of passwords that never leaves your machine and never gets shared).

**When it's needed:** Apple keys — when we're ready to put a test version on your phone. Storage keys — when we upload real recitation audio (the listening feature itself is already built and tested against a stand-in sound). Donations key — the tip jar screen is now built too; without the key it simply shows "Tips are not set up in this build yet," which is honest and fine for testing.

**Update 2026-07-13 — the tip jar is ready for its key whenever you want it live.** What you'd do (10 minutes, free): 1) go to revenuecat.com and click "Start for free", sign up with your email; 2) it will ask you to create a "project" — name it DeenDawn; 3) inside the project, add an "App Store" app; it will ask for the bundle ID — paste exactly: com.khavion.deendawn; 4) it shows you a "Public API key" that starts with "appl_" — copy that and paste it to me. That's all. (The actual tip products also need your Apple Developer account later — I'll walk you through that as part of the App Store setup, so it's fine to wait and do both together.)

**What you'll do:** When each moment comes, I'll give you exact click-by-click instructions ("go to this website, log in, click this button, copy the code it shows you, paste it to me"). Signing up for anything that could cost money is always your call — I'll tell you the price first (Cloudflare and RevenueCat both have free tiers that should cover us; Apple's developer account is the $99/year one you may already have).

---

## 2. Sample Quran recitation recordings

**Status: not needed yet — nothing to do right now.**

**What this is:** For the "listen to the Quran" feature, the app streams audio recordings of a reciter. To build and test that feature, we only need 2–3 chapters' worth of audio from one reciter, placed in the online storage from item 1. The full library of reciters comes later, and which recordings we ship in the final app is your decision (item 4 below).

**When it's needed:** The listening feature is now BUILT and tested (it plays a clearly-labeled stand-in sound for now). Real recordings are needed before outside testers should hear actual recitation.

**What I found (researched 2026-07-13):** A reciter's recording is like a musician's performance — the Quran itself belongs to no one, but each recording legally belongs to whoever made it. The most popular reciter online (Mishary Alafasy) explicitly does NOT allow free use — his official app's terms say so. The biggest free collection site (everyayah.com) is generally described as "free for NON-commercial use" — and because our app has a tip jar, a lawyer could argue we're not purely non-commercial. I don't ship anything into your app on a "probably fine."

**My recommendation (yes/no for you):** the safest path is written permission — either from a rights-holder of classic recordings, or from a living reciter who'd love to have his recitation in a free, no-ads app. Many would say yes to a polite email. When you're ready, I'll draft that email for you to send.

**Optional homework for your research assistant** — paste this into Claude chat's Research feature and send me back what it finds:
"Find Quran recitation audio recordings (full Quran, mp3, by a qualified reciter) that are explicitly licensed for free redistribution inside a free mobile app that also has an optional tip jar (i.e., commercial-adjacent use). I need: the reciter's name, where the files are hosted, the exact license text or permission statement and its URL, and any attribution requirements. Explicit written licenses only — not 'everyone uses it' assumptions. Check sources like archive.org collections, quranicaudio.com, everyayah.com, kingfahdcomplex releases, and any reciter who has publicly waived rights in writing."

---

## 3. Five-minute check of the prayer times

**Status: not needed until we're close to giving the app to outside testers.**

**What this is:** I built the part of the app that calculates daily prayer times and tested it against 1,680 automatically-generated reference values. Company policy for this project (the rules file you set up) says a human should also eyeball a few of the results against a trusted public source — like your local mosque's timetable or a site like IslamicFinder — just to be sure the math matches the real world.

**When it's needed:** Before the app goes to outside testers.

**What you'll do:** When the time comes I'll hand you a tiny table like "App says Fajr in Houston on July 20 is 5:18 AM — does your mosque's website agree within a minute or two?" You check 2–3 rows and tell me. Five minutes, tops.

---

## 4. Final religious-content decisions (further away)

**Status: far off — listed so it's not a surprise.**

Before the app ships to the public, a few choices are yours (ideally with a scholar's input): which English translation of the Quran ships in the final app (I'm building with a public-domain 1930 translation clearly labeled as temporary), which reciter's audio ships, and sign-off on any sentence in the app that states a religious position. I'll prepare researched recommendations for each so every decision is a yes/no for you.

---

## READY FOR HUMAN SUBMIT — the path from here to the App Store (written 2026-07-13)

The app itself is feature-complete for a first test version, with 324 automated tests green and an offline test that proves everything works without internet. Store text (description, keywords, reviewer notes, privacy answers) is drafted in `fastlane/metadata/`. Here is the honest, ordered checklist of what remains — split by who does it.

**You (whenever you're ready — I'll walk you through each click):**

1. Apple Developer account keys → lets me upload a test build to TestFlight so the app appears on YOUR phone. This is the single item that unlocks your first real test.
2. A support web page and a privacy policy web page (Apple requires both URLs for the store listing — a simple free page is enough; making anything public is your call, and I'll draft the pages).
3. RevenueCat key (10-minute free signup, steps in item 1 above) — only if you want the tip jar live in v1; the app is fine without it.
4. The 5-minute prayer-times spot check (item 3 above).
5. Recitation recordings decision (item 2 above) — until then the app ships with the listen feature hidden (it hides itself automatically when no audio source is configured).

**Reviewers (before PUBLIC release, not needed for your own TestFlight testing):** 6. Urdu/Arabic text review (item C) — English-only shipping is fine meanwhile. 7. Scholar sign-off queue (item D) — includes the final Quran translation choice; the current 1930 public-domain translation is clearly watermarked as temporary.

**Me (no waiting on anyone):** 8. EAS preview/production build + TestFlight upload the moment item 1 lands. 9. Final store screenshots at Apple's required sizes (I'll capture them from the big-screen simulator). 10. In-app privacy policy screen already exists; I'll mirror it to the public page from item 2.

Bottom line: **item 1 (Apple keys) is the only thing between you and testing DeenDawn on your own iPhone.** Say the word and I'll give you the click-by-click.
