# Razorpay Live keys — WoodenMax go-live checklist

Use this when you have **`rzp_live_…`** keys and want real customer payments (UPI, Card, Netbanking).

**Site code is already integrated.** Keys go only on **Cloudflare Worker** — not in HTML/JS/Git.

Check now: [Worker health](https://jolly-field-be49.finilexnaseem.workers.dev/health) must show `"razorpay_mode":"live"`. If it says `"test"`, complete Step 2 below.

### Quick setup (PC)

```powershell
cd woodenmax-live
npx wrangler login
npm run payments:setup-live
```

Paste **Key ID** + **Key Secret** when prompted. Script sets secrets and deploys `worker.js`.

---

## Step 1 — Razorpay Dashboard (Live mode)

1. Open [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys).
2. Toggle **Live mode** (top — not Test).
3. Copy **Key ID** → starts with `rzp_live_…`
4. Copy **Key Secret** (Reveal / Regenerate if needed) — long random string, **not** `rzp_…`
5. **Account & Settings → Payment methods** — ensure **UPI**, **Cards**, **Netbanking** are enabled.
6. Complete **KYC** if Razorpay shows pending — without KYC live UPI may not work.

**Do not** paste live secret in HTML, JS, Git, or WhatsApp.

---

## Step 2 — Cloudflare Worker (payment API)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **jolly-field-be49**.
2. **Settings** → **Variables and Secrets** → edit secrets:
   - `RAZORPAY_KEY_ID` = `rzp_live_…` (replace test key)
   - `RAZORPAY_KEY_SECRET` = live secret (replace test secret)
3. **Edit code** → paste latest `worker.js` from repo → **Deploy**.

**Or from PC (Wrangler):**

```bash
cd woodenmax-live
npx wrangler secret put RAZORPAY_KEY_ID
npx wrangler secret put RAZORPAY_KEY_SECRET
npm run payments:deploy
```

When prompted, paste **live** Key ID and Secret.

---

## Step 3 — Verify Worker is LIVE

Open in browser:

`https://jolly-field-be49.finilexnaseem.workers.dev/health`

Expected:

```json
{
  "ok": true,
  "razorpay": true,
  "razorpay_mode": "live",
  "upi_qr_real_apps": true
}
```

If `"razorpay_mode":"test"` → Worker still has test Key ID. Fix secrets and **Deploy** again.

---

## Step 4 — Upload site files (live hosting)

Upload these from your PC to **woodenmax.com** (same folders):

| File |
|------|
| `js/razorpay-checkout.js` |
| `js/calculator-mobile-ux.js` |
| `js/site-footer.js` |
| `css/calculator-mobile-ux.css` |
| `worker.js` → **only Cloudflare**, not cPanel |

Hard refresh: **Ctrl+F5** on calculator page.

---

## Step 5 — Small live test (real ₹)

1. Calculator → add item → cart → **Book order — Pay ₹1,000**.
2. Form should show green **Live payment** guide (not yellow test guide).
3. Razorpay modal → try **UPI** (₹1 real charge) or Netbanking.
4. After pay: **receipt print** + email to customer (if email filled) + WoodenMax.

Keep Payment ID from receipt for support.

---

## Test vs Live — quick reference

| | Test `rzp_test_` | Live `rzp_live_` |
|--|------------------|-------------------|
| Money | Simulated | **Real ₹** |
| UPI QR + PhonePe | Usually fails | Works (KYC on) |
| Card | Test cards + mock OTP | Real Indian cards |
| Netbanking | Mock success page | Real bank login |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Authentication failed | Live ID + live secret, same mode, Deploy Worker |
| UPI still invalid on phone | Confirm health = `"live"`; KYC + UPI enabled in Dashboard |
| Payment module not loaded | Upload `site-footer.js` + `calculator-mobile-ux.js` |
| Blank receipt | Upload latest `calculator-mobile-ux.js` + `calculator-mobile-ux.css` |
| Still test guide on form | Worker not live yet — check `/health` |

Support: +91 78953 28080 · info@woodenmax.com
