# Deen Dawn public web pages (for khavion.com)

Both app stores require a public **Privacy Policy URL** and **Support URL**. These three
self-contained HTML files provide them, styled in the Deen Dawn / Khavion palette (light + dark).

| File | Purpose |
| --- | --- |
| `index.html` | Simple Deen Dawn app page (so `/apps/deendawn/` isn't a 404) |
| `privacy.html` | **Privacy Policy** — the URL both stores require |
| `support.html` | **Support** page — the URL both stores require |

## Where to put them (khavion.com is a Next.js site on Vercel)

Copy the folder into the khavion.com repo's **`public/`** directory:

```
public/apps/deendawn/index.html
public/apps/deendawn/privacy.html
public/apps/deendawn/support.html
```

Anything in `public/` is served as-is — **no code changes, no new routes needed**. Commit and push;
Vercel deploys automatically.

## Resulting URLs (these go in both store listings)

- App page — `https://khavion.com/apps/deendawn/`
- **Privacy Policy — `https://khavion.com/apps/deendawn/privacy.html`**
- **Support — `https://khavion.com/apps/deendawn/support.html`**

These exact URLs are already recorded in `fastlane/metadata/en-US/privacy_url.txt` and
`support_url.txt`, and in `docs/store/PLAY_LISTING.md`.

## Optional polish
- Add a link to `/apps/deendawn/` from the khavion.com nav (e.g. an "Apps" item) once you're happy.
- If you'd rather have extension-less URLs (`/apps/deendawn/privacy`), the pages can be converted to
  Next.js routes instead — tell me and I'll produce those files. The `.html` URLs work fine for both
  stores, so this is cosmetic.

## Before publishing
Nothing to edit — the contact email (`apps@khavion.com`) is already filled in. Just confirm the
"Last updated" date on `privacy.html` still reads sensibly when you publish.
