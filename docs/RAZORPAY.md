# Razorpay — ₹1,000 order confirmation booking

**Live keys ready?** Follow **[RAZORPAY-GO-LIVE.md](./RAZORPAY-GO-LIVE.md)** (Cloudflare secrets + site upload + health check).

| Cart type | Online payment | Balance / dispatch |
|-----------|----------------|-------------------|
| **Mirror only** | User choice: **full exact order** OR **₹1,000 booking** | Full pay → make to your sizes → pack → **dispatch 10–15 days**. Booking → balance then same lead time |
| **Mixed** (mirror + windows) | **₹1,000 booking only** | Site visit & BOQ for entire cart — booking terms only |
| **Windows / other** | **₹1,000** booking | Site approval → 50/40/10% |

After payment: **printable receipt** + **email to WoodenMax and customer** (if email given) with timeline, terms, GST, transport, packing lines.

## Cancellation & refund

| Payment | Refund |
|---------|--------|
| **₹1,000 booking** | **Returnable** if customer cancels before WoodenMax starts order processing / production. Contact with Payment ID. |
| **Full order amount** | **Non-refundable after 3 calendar days** from payment — material cutting & factory processing typically starts within 3 days. After that: **only products** are supplied; **no cash refund**. |
| **Within 3 days (full order)** | Cancellation only if factory work has **not** started — contact +91 78953 28080 immediately. |

## Cloudflare Dashboard deploy (Quick Edit — ONE file only)

Dashboard editor mein **sirf `worker.js`** paste karo. **`import './lib/razorpay-handlers.mjs'` mat rakho** — woh file Dashboard par upload nahi hoti, isliye error:

`No such module "lib/razorpay-handlers.mjs"`

Repo ka `worker.js` ab **sab code ek hi file** mein hai (no import).

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **jolly-field-be49** → **Edit code**
2. Purana code delete → apne PC se latest `worker.js` **poora copy-paste**
3. **Settings → Variables** (Secrets):
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `WEB3FORMS_ACCESS_KEY` (optional)
   - `RECIPIENT_EMAIL` (optional)
4. **Deploy** button
5. Test: `https://jolly-field-be49.finilexnaseem.workers.dev/health`

   Success looks like:

   ```json
   {"ok":true,"razorpay":true,"has_key_id":true,"has_key_secret":true}
   ```

   If `razorpay:false` — check `has_key_id` / `has_key_secret` (which one is false), fix that secret name, **Deploy** again.

Preview mein **GET** se `Method not allowed` normal hai — payment **POST** se chalti hai.

## Architecture

| Layer | File | Role |
|-------|------|------|
| API (production) | `worker.js` (single file) | `POST /api/create-order`, `POST /api/verify-payment` |
| API (local dev) | `server/index.mjs` | Same routes on `http://localhost:8787` |
| Frontend | `js/razorpay-checkout.js` | Razorpay modal + verify |
| Cart UI | `js/calculator-mobile-ux.js` | **Book order — Pay ₹1,000** in quote cart |

Email relay still works on `POST` to the worker root URL (unchanged).

## Setup

1. Copy `.env.example` → `.env` and add keys from [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys).
2. `npm install`
3. Local API: `npm run payments:dev`
4. On static pages (optional, for localhost):

   ```html
   <script>
     window.WOODENMAX_PAYMENTS = { apiBase: 'http://localhost:8787' };
   </script>
   ```

5. **Option B** — PC se Wrangler (poora project upload):

   ```bash
   npx wrangler secret put RAZORPAY_KEY_ID
   npx wrangler secret put RAZORPAY_KEY_SECRET
   npm run payments:deploy
   ```

   (Yeh bhi sirf `worker.js` deploy karta hai — `lib/` ab worker ke andar merged hai.)

**Never** commit `.env` or put `KEY_SECRET` in frontend JS.

## Test (Razorpay test mode)

1. Start `npm run payments:dev` (or deploy worker with test keys).
2. Open any calculator page → add sizes → **Add to cart** → open cart.
3. Tap **Book order — Pay ₹1,000** → fill lead form → pay in modal.
4. **Test payment (`rzp_test_` keys) — kya chalega:**

   | Method | Test mode |
   |--------|-----------|
   | **Netbanking** | ✅ Reliable (mock success/fail page) |
   | **Card** | ✅ Domestic test card: `5267 3181 8797 5449` · CVV random · expiry future → **Success** on mock bank · OTP 4–10 digits. ❌ `4111 1111 1111 1111` agar international cards Dashboard par off hon |
   | **UPI QR + PhonePe scan** | ❌ Real app par fail (dummy VPA) |
   | **UPI ID field** | ✅ `success@razorpay` (agar modal mein type box ho; laptop QR par nahi) |

   **Netbanking pass = integration OK.** Card/UPI fail test mode limitation hai, live customers ke liye **`rzp_live_` keys** lagao.

5. **Live payments:** Worker secrets ko **`rzp_live_`** keys se replace karein, KYC + UPI enabled in Dashboard. Tab QR / PhonePe / GPay real customers ke liye chalega.

## Error: "Razorpay authentication failed"

**Cause:** Cloudflare Worker par `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` Razorpay ko pasand nahi (401). Keys **set** hain lekin **galat / purani / swap**.

**Fix (step-by-step):**

1. [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys) → **Test mode** (ya Live) ON
2. **Key ID** copy — `rzp_test_…` ya `rzp_live_…`
3. **Generate / reveal Key Secret** — lambi random string (**`rzp_` se start nahi** hoti)
4. Cloudflare → **Workers** → **jolly-field-be49** → **Settings** → **Variables and Secrets**
   - `RAZORPAY_KEY_ID` = Key ID only
   - `RAZORPAY_KEY_SECRET` = Key Secret only (webhook secret **nahi**)
5. **Deploy** (Save secrets ke baad bhi Deploy zaroori)
6. Browser: `https://jolly-field-be49.finilexnaseem.workers.dev/health` — `razorpay_mode` check

| Galati | Result |
|--------|--------|
| Test Key ID + Live Secret | Authentication failed |
| ID aur Secret swap | Authentication failed |
| Purana secret (regenerate ke baad) | Authentication failed |
| Secret mein space / extra line | Authentication failed (ab Worker trim karta hai) |

Payment **modal se pehle** fail hota hai → amount **debit nahi** hota (order create hi nahi hota).

---

## Error: PhonePe — "UPI ID correct nahi hai" (payment failed)

**Cause:** Cloudflare Worker par abhi **`rzp_test_`** (test) keys hain. Test mode QR real banking network par valid nahi hota — PhonePe/GPay reject karte hain.

**Fix (testing abhi):** Razorpay modal → **Netbanking** → koi bank → complete.

**Fix (real customer UPI):**

1. Razorpay Dashboard → [API Keys](https://dashboard.razorpay.com/app/keys) → **Live** mode keys
2. Cloudflare Worker secrets: `RAZORPAY_KEY_ID` = `rzp_live_…`, `RAZORPAY_KEY_SECRET` = live secret → **Deploy**
3. Dashboard → **Account & Settings** → UPI activated, KYC complete
4. Upload latest `js/razorpay-checkout.js` to site → Ctrl+F5

## Business flow

1. Customer pays **₹1,000** → payment verified on server (HMAC signature).
2. Team receives email with payment IDs + cart snapshot.
3. Site visit → final measurements → binding quote → **50% / 40% / 10%** balance per your PDF terms.

Rotate API keys if they were shared in chat or tickets.

## Error: "Unrecognized Content-Type header value. FormData can only parse..."

**Cause:** Cloudflare Worker par purana code deployed hai — saari `POST` requests email handler (`formData()`) par ja rahi hain, jabki Razorpay **JSON** bhejta hai.

**Fix:**

```bash
cd woodenmax-live
npx wrangler secret put RAZORPAY_KEY_ID
npx wrangler secret put RAZORPAY_KEY_SECRET
npm run payments:deploy
```

Phir `https://jolly-field-be49.finilexnaseem.workers.dev/health` open karo — `"razorpay": true` hona chahiye.

Hard refresh site (Ctrl+F5) aur payment dubara try karo.
