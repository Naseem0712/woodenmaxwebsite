# Form & Event Tracking Setup Guide

## Summary of Fixes Applied

### 1. Form Submission / Email Delivery
- **Fixed:** `submitEmailDirect` in base.js now uses Web3Forms key when EmailSubmitter is not loaded
- **Added:** email-submitter.js to all 14 calculator product pages that were missing it
- **Result:** All calculator forms will now send emails (via EmailSubmitter or direct Web3Forms fallback)
- **Contact form:** Already had EmailSubmitter; sends full body with name, phone, email, city, product, message

### 2. Form Submission Counting (GA4)
- **Contact form:** `generate_lead` + `form_submit` events on submit
- **Calculator forms:** `generate_lead` + `calculator_form_submit` events on submit
- **Where to see in GA4:** Reports → Engagement → Events → filter by `generate_lead` or `form_submit`

### 3. Calculator Event Tracking (Already Existed)
- `calculator_view` – when user lands on calculator page
- `calculator_size_change` – when size/dimensions are entered
- `calculator_material_selection` – when glass/coating/lock/mesh selected
- `calculator_calculation` – when price is calculated
- `calculator_form_submit` – when quote form is submitted

## GA4 Conversion Setup (Recommended)

To track form submissions as **Conversions** in GA4:

1. Go to **Google Analytics 4** → Admin → Events
2. Find `generate_lead` in the event list
3. Toggle **Mark as conversion** = ON
4. Optional: Add custom conversion for `form_submit` too

This lets you see conversion count in GA4 dashboard and use it in campaigns.

## Email Details in Inbox

All forms send to **info@woodenmax.com** with:
- **Subject:** Product-specific (e.g. "New Quote Request - Aluminium Sliding Window")
- **Body:** User contact (name, city, mobile, email) + product/calculator selections + calculated price

If emails are missing details:
- Check browser console (F12) for errors when user clicks Submit
- Verify Web3Forms access key is valid (dashboard.web3forms.com)
- For Worker: ensure Cloudflare Worker is deployed and route is correct
