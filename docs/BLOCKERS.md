# Things waiting on Zohaib

Written in plain English. **Nothing on this list is urgent right now** — the app is being built just fine without these. Each item says what it is, when it's needed, and exactly what to do (I'll also walk you through each one step-by-step when the time comes).

---

## 1. Account keys for Apple, file storage, and donations

**Status: not needed yet — nothing to do right now.**

**What this is:** Later on, the app will need to connect to three paid-or-registered services, and each gives you a kind of password (a "key") that proves the app is yours:

- **Apple** — to put the app on iPhones through the App Store (needs your Apple Developer account).
- **Cloudflare R2** — an online file-storage service where the Quran recitation audio will live, so the app can stream it (like how Netflix streams video instead of storing every movie on your phone).
- **RevenueCat** — a free service that handles the optional "tip jar" donations through Apple.

Those keys get saved into one small private file on your computer (techies call it a ".env file" — it's just a text file of passwords that never leaves your machine and never gets shared).

**When it's needed:** Apple keys — when we're ready to put a test version on your phone. Storage keys — when we build the audio-listening feature. Donations key — when we build the tip jar.

**What you'll do:** When each moment comes, I'll give you exact click-by-click instructions ("go to this website, log in, click this button, copy the code it shows you, paste it to me"). Signing up for anything that could cost money is always your call — I'll tell you the price first (Cloudflare and RevenueCat both have free tiers that should cover us; Apple's developer account is the $99/year one you may already have).

---

## 2. Sample Quran recitation recordings

**Status: not needed yet — nothing to do right now.**

**What this is:** For the "listen to the Quran" feature, the app streams audio recordings of a reciter. To build and test that feature, we only need 2–3 chapters' worth of audio from one reciter, placed in the online storage from item 1. The full library of reciters comes later, and which recordings we ship in the final app is your decision (item 4 below).

**When it's needed:** When I start building the listening feature (a few work sessions from now).

**What you'll do:** Probably nothing hard. Before then, I will research which recitation recordings are free to use legally, recommend one, and either give you simple upload steps or find the easiest possible path. You'll just say yes or no to the choice.

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
