# Things waiting on Zohaib

This is the one file you need to read. The top section — **WHAT NEEDS YOU** — is ranked:
the first items unlock testing DeenDawn on your phone; the later ones are nice-to-haves and
far-off decisions. Every item is plain English, says when it's needed, and ends with a
**yes/no recommendation** you can approve in one word. Nothing here is stopping my work —
I keep building everything that doesn't need you.

---

# 📌 FINAL DOMAIN FACTS (31 Jul 2026) — for the store-listing session

Everything below is live, verified, and free of ongoing cost beyond the ~$24/yr GoDaddy renewal:

- **Website:** https://deendawn.org (also https://www.deendawn.org)
- **Privacy Policy URL (both stores):** https://deendawn.org/privacy
- **Support URL (both stores):** https://deendawn.org/support
- **Support email (both stores):** support@deendawn.org → forwards to Zohaib's Gmail
  (Cloudflare Email Routing, free; reply from Gmail as normal)
- **Audio streaming (production):** https://audio.deendawn.org (R2 bucket `deendawn-upload`)
- Site source lives in `website/` in this repo; deploy with
  `npx wrangler pages deploy website --project-name=deendawn`.
- Domain registrar: GoDaddy (renews Jul 31, 2027). DNS + hosting + email: Zohaib's personal
  Cloudflare account (free plan).

---

# ⭐ THE ONE SITTING — everything I need from you, in order (31 Jul 2026)

Read only this section. It is everything that is humanly yours to do, batched so you can do it
once and be done. Total: about **45 minutes of clicking**, **$134 of spending**, and one text
message to friends. After this I can run the rest and only come back to you for the final
"publish" clicks.

**Why the order matters:** step 3 (Google Play) starts a **14-day clock** that nothing can speed
up. Do it first if you only have 10 minutes today. Apple has no such clock.

**Total money: $99 Apple (per year) + $25 Google (once) + ~$10 domain (per year) = ~$134.**

---

### ① Google Play account — $25 — DO THIS FIRST (starts the 14-day clock)

1. Go to **play.google.com/console** and sign in with **apps@khavion.com**.
2. Choose account type **Personal** (not organization).
3. Pay the **$25** one-time fee.
4. Google will verify your identity: your legal name and your **real home address** (no PO boxes,
   no mailbox stores — they reject those). They may ask for a photo of your ID or a utility bill.
   **This address is never published**, because the app takes no money.
5. Google also makes you prove you can use a real Android phone. Install the **Google Play Console**
   app on any Android phone running Android 10 or newer (borrow a family member's for 5 minutes if
   you only have an iPhone) and sign in with the same account. One-time, five minutes.
6. **Tell me: "Play account created."**

---

### ② Recruit 15 testers — free — start the same day

Google will not let the app go public until **12 people are signed up to a private test and stay
signed up for 14 days in a row**. If it drops below 12, the clock restarts. So sign up **15** for
slack.

They can be anyone with a Google account — family, friends, people at the masjid. They do **not**
need an Android phone to count.

**Copy-paste this to 15 people now** (I will send you the real link once the account exists;
send this first so people are ready):

> Salam — I built a free, no-ads, no-tracking Islamic app called Deen Dawn (prayer times, adhan,
> Quran, qibla, tasbih, zakat calculator). Google requires 12 people to be signed up as testers
> for 14 days before it can go public. Would you help? It's one tap on a link I'll send, takes
> 30 seconds, and you don't need an Android phone. **The only thing that matters: please don't
> tap "Leave the test" for the next few weeks** — if we drop below 12 the clock restarts.
> Just reply "in" and I'll send the link. JazakAllah khair.

**Tell me: "testers lined up"** and roughly how many said yes.

---

### ③ Apple Developer Program — $99/year — DO IT ON YOUR IPHONE, NOT THE WEBSITE

**Updated 5 Aug 2026.** Two things changed from the original plan, both decided with Zohaib in
session: (a) use **your personal Apple ID** — the one already signed in on your iPhone — not a
new apps@khavion.com one; (b) enroll in the **Apple Developer app on your iPhone**, not in a web
browser. Apple's own enrollment page now leads with the app. For an individual, Apple requires a
photo of your government ID plus a Face ID / passcode check on one device used start-to-finish,
so the website just sends you back to your phone anyway.

Why your personal Apple ID: it already has two-factor turned on, your legal name, and a payment
method, and long-standing Apple accounts pass the identity check quickly — brand-new ones often
get held for extra review. A separate account would buy nothing, because your public seller name
is your legal name either way.

**Have ready:** driver's license or passport, your real street address (no PO boxes), a working
payment method on your Apple account.

**Step 0 (30 seconds, do first):** iPhone **Settings → tap your name → Personal Information →
Name.** It must read your real legal name exactly as printed on your ID. A mismatch here is the
number-one cause of enrollment being held up.

1. **App Store** → search **"Apple Developer"** → install Apple's free app (grey hammer-and-wrench).
2. Open it → **Account** tab at the bottom.
3. **Sign in** with your personal Apple ID.
4. If the **Apple Developer Agreement** appears, tap **Agree**.
5. Tap **Enroll Now** → read the benefits page → **Continue**.
6. Enter **first name, last name, phone number**. Legal name only — no nicknames, no "Khavion".
   ⚠️ **This becomes the public seller name on your App Store page, permanently.**
7. **Identity check:** photograph your driver's license or passport when asked. Apple reads your
   name and address off it, checks it's genuine, and does not keep the image.
8. Review what you submitted → **Continue**.
9. **Entity type → choose `Individual`.** ⚠️ The one screen where a wrong tap is expensive —
   Organization demands a D-U-N-S number and weeks of waiting.
10. Read the **Apple Developer Program License Agreement** → **Agree**.
11. Review the yearly membership → **you tap Subscribe.** That's the $99, billed to the payment
    method already on your Apple account.
12. Approval usually arrives by email in **1–3 days**. Nothing can speed it up.
13. **Tell me: "Apple approved."**

*Note on the $99:* enrolling in the app makes it an auto-renewing yearly subscription. That is
what you want — if the membership ever lapses, DeenDawn vanishes from the App Store until you
re-pay. Cancellable any time in Settings up to a day before renewal.

---

### ④ Free Expo account + one token — 2 minutes, no cost

1. Go to **expo.dev** → **Sign up** (top right). Free.
2. Click your avatar (top right) → **Account settings**.
3. Left menu → **Access tokens** → **Create token**. Name it `DeenDawn`. Create.
4. It shows a long secret string **once**. **Copy it and paste it to me.**

*This is what lets me build the app on Expo's machines without you logging in every time.*

---

### ⑤ Apple upload key — 5 minutes, no cost — only after ③ is approved

1. Go to **appstoreconnect.apple.com**, sign in.
2. Top menu → **Users and Access** → **Integrations** tab → **App Store Connect API** on the left.
3. Click the **＋** next to "Active."
4. Name it `DeenDawn EAS`. For Role, pick **App Manager**. Click **Generate**.
5. On the new row click **Download** — you get a small file ending in **.p8**.
   ⚠️ **Apple lets you download it exactly once.** Save it, then send it to me.
6. Also copy me two short codes from that same page: the **Key ID** (on the key's row) and the
   **Issuer ID** (near the top, above the list).

**So step ⑤ gives me three things: the .p8 file, the Key ID, the Issuer ID.**

---

### ⑥ ~~Buy deendawn.com~~ — DONE: you bought **deendawn.org** (31 Jul) — I'm wiring it up now

You bought **deendawn.org** at GoDaddy. That covers everything this item wanted (the exact
spelling — .org instead of .com — changes nothing). I'm doing all the wiring in this session:
moving the domain's traffic control to your Cloudflare account, binding `audio.deendawn.org`
to the audio storage, hosting the website on it, and setting up a free support@deendawn.org
email that forwards to your Gmail. The only things I need from you are two quick logins in my
browser pane and one verification-email click — I'll ask for each at the right moment.

---

### ⑦ ~~Two web pages onto khavion.com~~ — CHANGED: the pages now live on deendawn.org, and I host them (nothing for you to do)

Since you bought deendawn.org, the Privacy Policy and Support pages go on it directly — nicer
URLs, and zero work for you (the old plan needed you to copy files into the khavion.com repo).
The site source now lives in this project under `website/`. Final URLs will be listed in the
"FINAL DOMAIN FACTS" block near the top of this file once everything is verified.

---

### What happens after you've done ①-⑦

Say **"all done"** and I will, without stopping you again:
- link the project to your Expo account and build DeenDawn on both platforms,
- fill in the entire Google Play listing, data-safety form, content rating, and closed-test track,
- hand you the one Android file Google makes you upload manually (their rule) and point at the button,
- give you the tester link to send to your 15 people,
- fill in the entire App Store listing, screenshots, keywords, privacy answers, and reviewer notes,
- push a build to TestFlight so you can use the real app on your own phone.

**The only things I will come back to you for after that** are the three buttons the rulebook says
are yours alone: Google's "start rollout", Apple's "Submit for Review", and the final "publish".

---

## WHAT NEEDS YOU (the older, longer list — everything above supersedes it)

### 0 (new, 31 Jul). Two small notes from the design build — nothing to click yet

**What this is:** I started building the new design (the one from the design
tool). Two things you should know about, neither needs action today:

1. **iPhone home-screen widget is coming.** The app now contains the Apple
   widget machinery ("app extension" + a shared storage group). It builds and
   tests fine on my side, but Apple's signing for it can only be fully proven
   by a cloud build once your Apple Developer account exists (that's already
   item 1 below). When that account lands, the very first cloud build will
   validate the widget automatically — I'll check it and tell you the result.
2. **Tasbih counting with the volume buttons works on Android only.** On
   iPhone, Apple rejects apps that repurpose the volume buttons, so the
   tasbih hint text will say "Tap anywhere to count" on iPhone and "…volume
   keys work too" on Android. The design document wanted identical text on
   both — this is the one deliberate deviation, made to protect the App
   Store review. Fine to just know about; reply only if you disagree.


### 1. Publish DeenDawn so people can download it — the developer-account setup

**Goal:** get DeenDawn onto the App Store (and Google Play) so anyone can download it, free, and
see for themselves that it collects zero data. Everything on my side is ready: the app is built
and tested (**412 automated tests pass**, including one proving it works with no internet), the
store text, privacy answers ("Data Not Collected"), and the two required web pages are all drafted,
and the build+upload is one command. The only things I *can't* do for you are: create the developer
accounts, and click the final "publish" button. Here's the honest, current plan.

**Your plan (decided 2026-07-29): personal / individual accounts on both stores, and NO tip jar —
the app takes no money at all.** You weighed the trade-offs and accepted them. **No D-U-N-S number
is needed**, which removes the single longest wait from the plan. What you accepted, on the record
so neither of us re-opens it later:
- **Your legal name will be the seller name on the App Store**, permanently. Apple only allows a
  trade name like "Khavion Apps" on company accounts, and the name can't be edited after the first
  app is created. You said you're fine with this app being attached to your name.
- **No revenue from this app, ever** — I removed the tip jar and the payment library from the code
  on 2026-07-29. Turning it back on later would republish your home address on the Google Play
  listing, so treat this as a one-way door.

**The good news, and it's real:** dropping the tip jar is what *protects* your address. Google only
publishes a personal developer's full address when the account takes money. With nothing to buy,
Google shows your name, country, and an email — no address. Same for the EU: with no money changing
hands you'll declare **"not a trader"**, and Apple then publishes no address or phone number for you
either. (The one visible side effect: EU users see a small note that EU consumer-protection rules
don't apply to a non-trader's app. That's normal for free apps and costs you nothing.)

**"Khavion Apps" still survives as your brand** — it stays on the in-app About screen, on
khavion.com, on the legal pages, and in the copyright line. The only place it can't appear is
Apple's seller-name field.

**The one thing this costs you: Google's 12-tester rule.** Personal Play accounts have to run a
closed test with **12 people opted in for 14 continuous days** before the app can go public. That's
unavoidable on a personal account and it doesn't care that the app is free. iOS is unaffected — it
can ship while the Android clock runs. See item 1b for exactly how to line up the 12 people.

**What it costs:** Apple **$99/year**; Google Play **$25 one-time**. Nothing else.

Do the Apple steps below (A–C); Google Play steps are in item 1b. Do them in order and paste me
what each gives you.

---

#### Step A — Make a free Expo account (2 minutes) — this lets me build the app for you

1. Go to **expo.dev** and click **Sign up** (top right). Use your email; it's free.
2. After signing in, click your avatar (top right) → **Account settings**.
3. In the left menu click **Access tokens** → **Create token**. Name it "DeenDawn" and click Create.
4. It shows you a long secret string **once** — copy it and **paste it to me**. (I'll store it in
   the private keys file on the computer; it never gets shared or committed anywhere.)

*What this is for: it lets me run the build machines for you without you having to log in each time.*

---

#### Step B — Join the Apple Developer Program ($99/year, as an Individual)

1. Go to **developer.apple.com/programs/enroll** and sign in with the Apple ID for apps@khavion.com.
   (You can still use that address — an individual account just means Apple verifies *you*, it
   doesn't force you to use a personal email.)
2. Choose **Individual / Sole Proprietor** (NOT Organization). No D-U-N-S number is asked for.
3. Enter your name **exactly as it appears on your government ID**. Apple warns that a nickname or a
   company name here delays or fails approval — so no "Khavion", just your legal name. ⚠️ This is
   the name that will show as the seller on your App Store page, and it can't be changed later.
4. Give a real street address (Apple's membership record doesn't accept PO boxes) and pay the $99.
   This address is for Apple's records only — it is **not** published anywhere, because you'll be
   declaring "not a trader" in the EU.
5. Approval is usually quick — often same-day to a couple of days, since there's no company to
   verify. You'll get an email. **Nothing more to do here until it arrives.**

*(One field I'll fill in later, not you: when I create the app record, App Store Connect asks
whether you're an EU "trader." With no purchases in the app the honest answer is **no**, and that's
what keeps your address and phone number off the listing. I'll set it and show you before anything
goes public.)*

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
account, (2) build DeenDawn on Expo's cloud machines, (3) create the App Store listing and fill in
everything I've already prepared (name, description, keywords, screenshots, the "Data Not Collected"
privacy answers, and the two web-page links from item 2), and (4) upload the build. Then **you** do
the two things only you can: paste in your two web-page links, and click **"Submit for Review"** in
App Store Connect (making it public is always your call). Apple reviews it in ~1–2 days and it goes
live for anyone to download. (If Apple's screens look different from the steps above — they tweak
wording — send me a screenshot and I'll adjust.)

*(Want it on your own phone first, before the public? The same keys let me push a build to
TestFlight for you instantly — no review needed. Just say so.)*

---

### 1b. Google Play — Android (doing this alongside Apple)

Android is 100% ready too. On a **personal** account there's one extra hoop — the 12-tester test —
so **start Android early and let it run in the background while iOS ships.**

1. Go to **play.google.com/console**, sign in with apps@khavion.com, pay the **$25 one-time** fee.
2. Choose the **Personal** account type. Google will verify your identity (name, address, and
   possibly a photo ID or a utility bill). ⚠️ Use your real home address — Google rejects PO boxes
   and virtual offices for personal accounts. It is **not** published, because the app takes no
   money; only paid apps have to show an address.
3. Then I'll walk you through two clicks: (a) create one **service account key** in Google Cloud
   (a permission file, like Apple's `.p8`) and grant it access in the Play Console, so I can upload
   builds headlessly, and (b) create the app entry. I'll fill the whole listing — title, description,
   screenshots, and the mandatory **Data Safety form** ("no data collected") — all already drafted in
   `docs/store/PLAY_LISTING.md` and `fastlane/metadata/android/`.
4. **Note:** Google requires the very first build to be uploaded manually once (their rule) before my
   headless uploads work — I'll hand you that one file and the exact click.

**The 12-tester requirement — what you actually have to do.** Before Google will let the app go
public, 12 people must be signed up to a private test and *stay* signed up for 14 days in a row.
- **Who:** any 12 adults with a Google account — family, friends, people at the masjid. They do
  **not** need Android phones to count as opted in, but real Android users give you useful feedback,
  so aim for a mix.
- **What they do:** I'll give you one link. They open it, tap "Become a tester," and that's it.
  About 30 seconds each.
- **The one rule that trips people up:** they must not leave the test. The 14 days restart if you
  drop below 12. So sign up **15–16 people** for slack, and tell them "don't tap Leave."
- **Timing:** get the 12 signed up on day 1, wait 14 days, then apply for production access
  (Google reviews that in about a week). So Android is roughly **3 weeks behind** the day you
  create the account — which is exactly why it's worth starting now, in parallel with Apple.

**Recommendation: YES — create the Google Play account at the same time as the Apple one, and
start collecting your 12 testers immediately. iOS doesn't wait for any of this.**

---

### 2. ~~The two required web pages on khavion.com~~ — ✅ DONE differently 2026-07-31: they live on deendawn.org now, nothing for you to do (see FINAL DOMAIN FACTS at the top). Original text kept below for history.

**What this is:** Both stores require a public **Privacy Policy** link and a **Support** link.
**I've written both** (plus a small Deen Dawn app page), styled in the app's colours, with your
email already filled in. They're in `docs/legal/`:
- `index.html` (app page) · `privacy.html` · `support.html`

**Your idea to host them on khavion.com is the right call** — you already own the domain, the URLs
look professional, and it matches the "Khavion Apps" publisher name. khavion.com is a Next.js site
on Vercel, which makes this a copy-paste job with **no code changes**:

**What you'd do (5 minutes):** copy the three files into the khavion.com repo at:
```
public/apps/deendawn/index.html
public/apps/deendawn/privacy.html
public/apps/deendawn/support.html
```
Anything in `public/` is served as-is. Commit + push → Vercel deploys automatically. That gives you:
- `https://khavion.com/apps/deendawn/` — the app page
- `https://khavion.com/apps/deendawn/privacy.html` — **Privacy Policy**
- `https://khavion.com/apps/deendawn/support.html` — **Support**

I've **already recorded those exact URLs** in the store metadata, so nothing else needs changing.

**My recommendation: YES — drop the three files into khavion.com's `public/apps/deendawn/` folder.**
(If you'd rather I prepare them as proper Next.js pages with extension-less URLs, or want an "Apps"
link added to the khavion.com nav, say the word — but the `.html` URLs work perfectly for both
stores.) Full instructions: `docs/legal/README.md`.

### 3. ~~RevenueCat key / tip jar~~ — CLOSED 2026-07-29, nothing for you to do

You decided the app takes no money at all, so I removed the tip jar, the payment library, and the
tip text from the store listings. There is no key to sign up for and no account to create. **Item
closed — skip it.**

Two knock-on effects, both good: the App Store "Data Not Collected" answer is now unconditional
(there's no payment company touching the app at all), and your address stays off the Google Play
listing. If you ever want to revisit this, tell me — but note it's the one change that would
republish your home address, so it's a real decision, not a toggle.

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
permission saying "you may put this in your app." **Live Quran radio streams** are out regardless
(no permission to relay them, and it would break our "no other companies' servers" privacy promise).

**⚠️ This item improved on 2026-07-29 and I owe you a re-check.** The original research assumed the
tip jar made us "slightly commercial," which is what ruled out several reciters whose audio is
offered for **non-commercial use only** — including **Mishary Alafasy**, the most popular one. Now
that the app takes no money at all, has no ads, and has no revenue of any kind, our non-commercial
claim is much stronger. That doesn't automatically clear anyone — "non-commercial" is a fuzzy term
and I still want permission in writing rather than a "probably fine" — but it plausibly re-opens
options I'd closed. **I'll redo that piece of research and report back**; nothing below is blocked
on it, and it may end up giving you a better-known reciter than the current plan.

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

### 9. (Entirely optional) Report a bug we found to the React Native project

**What this is:** While polishing dark mode I found a genuine bug in React Native itself (the
framework the app is built on): in development versions, the app can flip between light and dark
by mistake. I researched it, confirmed nobody has reported it yet, fixed our app so it doesn't
affect us anymore, and wrote up a report that would help the framework's maintainers fix it for
everyone. Publishing anything publicly is your call, so the report sits unposted at
`docs/reports/rn-appearance-oscillation-issue-draft.md`.

**What you'd do if you say yes:** nothing technical — just say "yes, post the bug report" and I'll
give you the exact text to paste on the React Native website (it takes about 2 minutes, needs a
free GitHub account), or you can tell me to skip it entirely.

**When it's needed:** never — DeenDawn is already fixed either way. This is purely a good-citizen
gesture to the open-source project the app is built on.

**My recommendation: YES when you have a spare 5 minutes, but genuinely zero urgency.**

---

## READY FOR HUMAN SUBMIT — the path from here to the App Store

The app is **feature-complete for a first test version**: **425 automated tests green**,
including an offline test that proves everything works without internet — now verified end-to-end
on a store-style release build. Store text (description, keywords, reviewer notes, privacy answers
= "Data Not Collected") is drafted in `fastlane/metadata/`. The build pipeline is configured
(**`eas.json`** with build + submit profiles), so the moment your keys (item 1) land I can build
and upload with essentially one command.

**New since 2026-07-30 (the "make it excellent" pass):** the app got a big quality overhaul —
it now looks and feels native on the newest iPhones and iPads (the new "liquid glass" look),
works beautifully at the largest accessibility text sizes, in Arabic and Urdu, in dark mode, and
on iPads (which Apple requires screenshots for — **those screenshots now exist**, so nothing
blocks the store listing anymore on my side). It also finally has a **real app icon** — a gold
dawn rising over the horizon on the deep green — replacing a leftover placeholder none of us had
noticed. Proof of all of it: 205 screenshots across 8 simulated devices in `docs/screens/final/`.

**You (whenever you're ready — walkthroughs above):**
1. **Apple setup (item 1)** — the single item that unlocks your first real test on your phone.
2. **Google Play setup + start collecting 12 testers (item 1b)** — start it the same day as Apple;
   the 14-day clock is the long pole on Android and it runs in the background.
3. Support + Privacy web pages (item 2) — only for a public release; I draft them.
4. ~~RevenueCat key~~ (item 3) — **closed, nothing to do.**
5. The 5-minute prayer spot check (item 4) — before outside testers.
6. Recitation recordings decision (item 5) — until then the listen feature hides itself.

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

---

## READY FOR HUMAN SUBMIT (Google Play) — Android is built, tested, and waiting on you

Written 2026-07-30, the day the Android perfection phase ran. Everything below is in plain
English. The app side is DONE: Android now has real tab icons, exact adhan timing (with an
honest "Allow exact timing" card), per-prayer notification sounds that actually work, background
Quran audio with lock-screen controls, a home-screen prayer-times widget, app shortcuts, a
"Pin next prayer" option, an "Adhan not playing?" help screen, Urdu/Arabic with flawless
right-to-left layout, and the same offline-proof as iOS — all verified on the Android emulator,
on the real store-style build. The store upload file passes Google's technical checks
(the new "16 KB" requirement and the permissions audit) on my side.

**What only you can do, in order (about 30 minutes of clicking + a 3-week clock):**

1. **Create the Google Play account** ($25 one-time) at play.google.com/console — Personal
   account type, your real home address (Google verifies it; it is NOT published because the
   app takes no money). Full steps are in item 1b above.
2. **Verify a real Android phone** — Google requires proving you can access a physical Android
   phone (Android 10 or newer, not rooted) using the Play Console phone app. ⚠️ If you only
   have an iPhone, borrow a family member's Android for this 5-minute step — it's one-time.
3. **Create the app entry** ("Deen Dawn", Free — this choice is permanent) and the **service
   account key** (like Apple's .p8 — I'll walk you through the ~6 clicks when you're there).
4. **Upload the first build manually once** (Google's rule) — I hand you one file
   (the .aab) and point at the exact upload button. After that, my uploads are headless.
5. **Start the closed test + recruit 15–16 testers** — the 12-tester/14-day rule (item 1b has
   the script to send people). This is the 3-week clock; start it the same day as step 1.
6. While the clock runs, I fill the whole listing from what's already prepared: description,
   screenshots (Android-native, from the emulator evidence run), the feature graphic, the
   "Data safety: No data collected" answers, content rating questionnaire, "no financial
   features", the non-trader (DSA) declaration, and the one video Google wants showing
   background audio (I record it).
7. **After 14 continuous days with 12+ testers: "Apply for production"** (a 3-question form —
   I draft the answers, you click submit). Google reviews in about a week.
8. **You click the final "publish"** — always your call (constitution gate).

**What I still do before step 6 finishes** (no waiting on you): finish the Android evidence
sweep review, run the destructive notification tests (clock-jump/Doze/reboot), record the
demo video, and export the final screenshot set.

**One heads-up for October:** from Oct 28, 2026 Google adds a form for ANY app that uses
location. Ours is the easiest case (on-device only, never sent anywhere, manual city works
without it) — I'll draft the answers when the form appears.

## Turn on the audio bucket (Cloudflare R2) — ✅ FULLY DONE 2026-07-31 (step 7 closed)

**Steps 1-7 are all complete.** Step 7 (the custom domain) closed on 31 Jul:
you bought **deendawn.org**, I connected `audio.deendawn.org` to the bucket
in your Cloudflare account, verified it end-to-end (correct file bytes,
seek/skip requests working), and switched BOTH build profiles (internal
testing and production) to stream from it. The rate-limited test address is
no longer used by any build. Nothing left here.

### (original instructions, kept for reference)

**What this is.** The Quran listening feature is now fully built with a real,
legally-cleared reciter (Mishary Rashid Alafasy — the most popular voice in
the world, used under the Islamic Network's published terms). I downloaded
and verified all 114 surah recordings. The last piece is the free online
storage they stream from — Cloudflare R2 — which only you can switch on,
because Cloudflare asks for a card (it stays at $0: our usage fits their
free tier, and they never charge for the streaming bandwidth itself).

**What to do (about 15 minutes):**
1. Go to dash.cloudflare.com and sign up (or log in) with your email.
2. In the left menu click **R2 Object Storage**, then **Get started** /
   **Enable R2**. It will ask for a card — this is the "spending" step I
   can't do for you. Expected monthly bill: **$0**.
3. Click **Create bucket**. Name it exactly: `deendawn-audio`. Leave
   everything else as-is and create it.
4. Go back to the R2 page → **API** → **Manage API tokens** → **Create API
   token**. Give it a name like "deendawn-upload", choose **Object Read &
   Write**, limit it to the `deendawn-audio` bucket, and create it.
5. Cloudflare shows you four values ONE TIME: Account ID, Access Key ID,
   Secret Access Key. Create a file called `.env` in the project folder
   (Desktop/Khavion/deendawn) containing exactly these four lines, pasting
   your values after each `=`:
   R2_ACCOUNT_ID=
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   R2_BUCKET=deendawn-audio
6. Tell me ".env is in" — I upload all 114 files and verify streaming
   end-to-end myself.
7. LATER (before the app goes to real users, not needed for our own
   testing): the bucket needs a web address on a domain you own, added to
   the same Cloudflare account (for example audio.khavion.com). If you own
   a domain already, tell me which; if not, buying one (~$10/year) is a
   spending decision — my recommendation: **yes, one domain**, it also
   serves the future website and support email.

**My recommendation:** do steps 1–6 whenever you have 15 minutes; step 7
can wait until we're near the Play release.

## Reciter sign-off (Human Gate #5 — audio half) — APPROVED 2026-07-30 ("Approved: Alafasy")

**What this is.** The rule book says you personally approve the shipping
reciter. I recommend **Mishary Rashid Alafasy (Murattal)**: the world's most
recognized modern voice, complete 114-surah set, clean license basis (the
Islamic Network states in writing that the recitations are licensed to them
for free non-commercial redistribution — full quote shown in the app's About
screen). The app is built so more reciters can be added later without code
changes.

**What to do:** reply "approved: Alafasy" (or name another reciter and I'll
research their licensing). Optional but recommended: I'll draft a short
permission-confirmation email to the Islamic Network community team that you
send from your address — one sentence asking them to confirm re-hosting for
a free app is within their terms. Want it? Say "draft the email".
