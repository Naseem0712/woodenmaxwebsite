# ✅ Sitemap Submission Guide - Fix "Feed URL is not part of the site" Error

## ❌ Common Error:
When submitting sitemap, you get error:
**"Feed url is not part of the site"**

## 🔍 Problem:
You're submitting the **GitHub URL** instead of your **website URL**.

### ❌ Wrong URLs (Don't Use These):
- ❌ https://github.com/Naseem0712/woodenmaxwebsite/blob/main/sitemap.xml
- ❌ https://github.com/Naseem0712/woodenmaxwebsite/blob/main/ALL_URLS.txt

### ✅ Correct URL to Submit:
- ✅ **sitemap.xml** (just this, or full URL: https://woodenmax.in/sitemap.xml)

---

## 🚀 Correct Steps to Submit Sitemap:

### Step 1: Make Sure Sitemap is Live on Your Website

**Check if sitemap is accessible:**
1. Open your browser
2. Go to: `https://woodenmax.in/sitemap.xml`
3. You should see the XML sitemap content
4. If you see 404 error, upload `sitemap.xml` to your website root folder

---

### Step 2: Submit to Google Search Console

1. **Go to Google Search Console:**
   - Visit: https://search.google.com/search-console
   - Select your property: **woodenmax.in**

2. **Go to Sitemaps Section:**
   - Click **"Sitemaps"** in the left menu

3. **Submit Sitemap:**
   - In the "Add a new sitemap" field, enter:
     ```
     sitemap.xml
     ```
   - **OR** enter full URL:
     ```
     https://woodenmax.in/sitemap.xml
     ```
   - Click **"Submit"** button

4. **Wait for Confirmation:**
   - You should see: "Sitemap submitted successfully"
   - Status will show "Success" after a few minutes

---

### Step 3: Submit to Bing Webmaster Tools

1. **Go to Bing Webmaster Tools:**
   - Visit: https://www.bing.com/webmasters
   - Select your site: **woodenmax.in**

2. **Go to Sitemaps:**
   - Click **"Sitemaps"** in the left menu

3. **Submit Sitemap:**
   - Enter: `sitemap.xml`
   - Click **"Submit"**

---

## 📝 Important Notes:

### ✅ DO:
- ✅ Submit: `sitemap.xml` (just the filename)
- ✅ OR submit: `https://woodenmax.in/sitemap.xml` (full URL)
- ✅ Make sure sitemap.xml is in your website root folder
- ✅ Verify sitemap is accessible at https://woodenmax.in/sitemap.xml

### ❌ DON'T:
- ❌ Submit GitHub URLs
- ❌ Submit ALL_URLS.txt (not a valid sitemap format)
- ❌ Submit blob URLs
- ❌ Submit raw GitHub URLs

---

## 🔧 If You Still Get Error:

### Check 1: Sitemap File Location
Make sure `sitemap.xml` is in your website's **root folder**:
```
https://woodenmax.in/sitemap.xml  ✅ Correct location
https://woodenmax.in/files/sitemap.xml  ❌ Wrong location
```

### Check 2: Sitemap Format
Open your sitemap in browser:
- ✅ Should show XML content
- ❌ Should NOT show 404 error or download

### Check 3: File Permissions
Make sure sitemap.xml file is:
- ✅ Readable by web server
- ✅ Not blocked by .htaccess
- ✅ Accessible publicly

---

## 📋 Quick Checklist:

- [ ] sitemap.xml uploaded to website root folder
- [ ] Can access https://woodenmax.in/sitemap.xml in browser
- [ ] Submit only `sitemap.xml` (not GitHub URL)
- [ ] Submit to Google Search Console
- [ ] Submit to Bing Webmaster Tools
- [ ] Wait 24-48 hours for indexing

---

## 🆘 Still Having Issues?

**Verify your sitemap is accessible:**
1. Open browser
2. Go to: https://woodenmax.in/sitemap.xml
3. You should see XML content
4. If 404 error, upload the file to your server

**Check your submission:**
- In Google Search Console → Sitemaps
- Look for "sitemap.xml" in the list
- Status should be "Success" not "Error"

---

## ✅ Correct Submission Format:

**What to enter in Google Search Console:**
```
sitemap.xml
```

**OR**

```
https://woodenmax.in/sitemap.xml
```

**Both will work!** Just make sure it's your website URL, not GitHub URL.

---

**Remember:** Submit your website URL, not GitHub URL! 🎯

