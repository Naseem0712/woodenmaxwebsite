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

## Deploy — Wrangler only

Dashboard Quick Edit **ab kaam nahi karega**. Worker ek single file nahi raha: usko D1 database binding, cron trigger aur `worker/` ke modules chahiye, jo sirf `wrangler.toml` se aate hain.

```bash
npm run db:create          # pehli baar — printed database_id ko wrangler.toml me paste karein
npm run db:migrate         # schema
npx wrangler secret put RAZORPAY_KEY_ID
npx wrangler secret put RAZORPAY_KEY_SECRET
npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CF_ACCOUNT_ID
npx wrangler secret put CF_BROWSER_TOKEN
npm run payments:deploy
```

Phir `https://jolly-field-be49.finilexnaseem.workers.dev/health` kholein. `ok:true` tab aata hai jab saare checks pass hon; jo missing hai wo `missing` array aur `fix` line me naam se dikhta hai:

```json
{"ok":true,"razorpay_mode":"live","checks":{"razorpay":true,"razorpay_webhook":true,"database":true,"pdf":true,"email":true},"missing":[]}
```

Razorpay Dashboard → **Webhooks** → URL `https://jolly-field-be49.finilexnaseem.workers.dev/api/razorpay-webhook`, event **payment.captured**, secret wahi jo `RAZORPAY_WEBHOOK_SECRET` me daala.

## Architecture

| Layer | File | Role |
|-------|------|------|
| Router | `worker/index.js` | saare routes + cron |
| Razorpay | `worker/razorpay.js` | order create, payment + webhook signature |
| Orders | `worker/orders.js` | D1, quote versioning, idempotent `fulfilOrder` |
| PDF | `worker/pdf.js` + `worker/quote-html.js` | Browser Rendering se order confirmation |
| Email | `worker/email.js` | Resend + `email_queue` retry |
| Schema | `migrations/0001_init.sql` | quotes, orders, order_events, email_queue |
| Frontend | `js/razorpay-checkout.js` | Razorpay modal + verify |
| Quote state | `js/quote-store.js` | per-item UUID cart (single source of truth) |
| Cart UI | `js/calculator-mobile-ux.js` | **Book order — Pay ₹1,000** in quote cart |

Local dev: `npm run payments:dev` (`wrangler dev`, local D1 ke saath). Purana express shim (`server/index.mjs`) hata diya gaya hai — wo payment logic ki doosri copy thi aur drift kar rahi thi.

Endpoints: `POST /api/quote`, `POST /api/create-order`, `POST /api/verify-payment`, `POST /api/razorpay-webhook`, `GET /api/order/:orderNo`, `GET /api/order/:orderNo/pdf`. Enquiry form ab bhi worker root par `POST` (multipart) se chalta hai, par email Web3Forms ki jagah **Resend** se jaati hai.

## Setup

1. Copy `.env.example` → `.env` and add keys from [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys).
2. `npm install`
3. Local API + local D1: `npm run db:migrate:local` phir `npm run payments:dev`
4. On static pages (optional, for localhost):

   ```html
   <script>
     window.WOODENMAX_PAYMENTS = { apiBase: 'http://localhost:8787' };
   </script>
   ```

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
