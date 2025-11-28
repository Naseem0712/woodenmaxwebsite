# ⚡ Quick Setup Guide - Google & Bing Indexing

## ✅ Current Status:
- ✅ Bing Webmaster Tools: **Domain Already Verified!**
- ⏳ Google Search Console: Needs verification
- ⏳ Sitemap: Ready to submit

---

## 🚀 Quick Steps:

### 1. Upload Files (If not done):
Upload these to your server root:
- ✅ sitemap.xml
- ✅ robots.txt
- ✅ .htaccess

### 2. Google Search Console (5 minutes):
1. Go to: https://search.google.com/search-console
2. Click "Add Property" → "URL prefix"
3. Enter: `https://woodenmax.in`
4. **Verify Ownership:**
   - Google will give you a meta tag
   - Add it to `index.html` in `<head>` section:
     ```html
     <meta name="google-site-verification" content="YOUR_CODE_HERE" />
     ```
   - Click "Verify"
5. **Submit Sitemap:**
   - Go to "Sitemaps" in left menu
   - Enter: `sitemap.xml`
   - Click "Submit"

### 3. Bing Webmaster Tools (2 minutes):
✅ **Already Verified!**
1. Go to: https://www.bing.com/webmasters
2. Click on your verified site
3. Go to "Sitemaps"
4. Click "Submit a sitemap"
5. Enter: `sitemap.xml`
6. Click "Submit"

### 4. Request Indexing:
- Go to "URL Inspection" in Google Search Console
- Enter: `https://woodenmax.in`
- Click "Request Indexing"

---

## ✅ Checklist:
- [ ] Files uploaded (sitemap.xml, robots.txt, .htaccess)
- [ ] Google Search Console verified
- [ ] Google sitemap submitted
- [x] Bing already verified ✅
- [ ] Bing sitemap submitted
- [ ] Homepage indexing requested

---

## 📊 Test URLs After Upload:
- https://woodenmax.in/sitemap.xml
- https://woodenmax.in/robots.txt

---

**Estimated Time:** 10-15 minutes total
**Expected Indexing:** 1-2 weeks

🎉 **You're all set!**

