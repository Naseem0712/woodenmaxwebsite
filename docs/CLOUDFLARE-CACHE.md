# Cloudflare Pages — purana site / Add to Cart nahi dikhna

## Kyon hota hai

- Deploy **success** hai lekin visitors ko **purani JS** milti hai.
- `_headers` mein `/js/*` par **7 din cache** tha → Google / browser purana `calculator-mobile-ux.js` use karte hain.
- **Direct Pages link** naya lag sakta hai; **Google search** purana cache + purana HTML/JS.

## Fix (har deploy ke baad)

1. **Code push** → is repo (`woodenmax-live`) ko Cloudflare Pages project se connect karein (jo `woodenmax.in` serve karta hai).
2. **Caching → Configuration → Purge Cache → Purge Everything** (woodenmax.in zone).
3. Browser **Ctrl+Shift+R** ya incognito test.
4. Asset version bump (optional): `node tools/bump-wm-asset-cache.cjs` then commit.

## Add to Cart kab dikhega

1. Naya JS load ho (`calculator-mobile-ux.js?v=…` in page source).
2. Calculator par **size bharein** → price aaye → **Add to Quote Cart** button show hota hai.

## Google search purana

- Google apna cache 1–7 din rakhta hai.
- [Search Console](https://search.google.com/search-console) → URL Inspection → **Request indexing** for key calculator URLs.

## Repo note

Deploy **usi Git repo** se hona chahiye jo Cloudflare Pages → woodenmax.in se linked hai (yeh workspace: `woodenmax-live`). Push ke baad Pages build complete hone ka wait karein, phir cache purge.
