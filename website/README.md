# deendawn.org — static site

Three plain-HTML pages, zero external resources (no fonts, scripts, images, or
trackers — the site keeps the same privacy promise as the app):

- `index.html` → https://deendawn.org
- `privacy.html` → https://deendawn.org/privacy (store Privacy Policy URL)
- `support.html` → https://deendawn.org/support (store Support URL)

Hosted on Cloudflare Pages (project `deendawn`, free tier) in the same
Cloudflare account as the `deendawn-upload` R2 bucket. Pages serves the
extension-less URLs automatically. Deploy:

```bash
npx wrangler pages deploy website --project-name=deendawn
```

Colors are hand-copied from `src/lib/theme/tokens.ts` (light + dark via
`prefers-color-scheme`). Contact email is support@deendawn.org (Cloudflare
Email Routing → Gmail).
