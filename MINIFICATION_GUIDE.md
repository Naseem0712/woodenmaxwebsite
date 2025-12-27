# CSS & JavaScript Minification Guide

## Overview
This guide explains how to minify CSS and JavaScript files for production deployment to improve PageSpeed Insights scores.

## Estimated Savings
- **CSS Minification:** ~3 KiB savings
- **JavaScript Minification:** ~2 KiB savings

## Methods

### Option 1: Online Tools (Quick & Easy)
1. **CSS Minifier:**
   - https://www.minifier.org/
   - https://cssminifier.com/
   - Copy `css/styles.css` → Minify → Replace original

2. **JavaScript Minifier:**
   - https://www.minifier.org/
   - https://javascript-minifier.com/
   - Minify all files in `js/` folder

### Option 2: Build Tools (Recommended for Production)

#### Using npm packages:
```bash
# Install minification tools
npm install -g clean-css-cli terser

# Minify CSS
cleancss -o css/styles.min.css css/styles.css

# Minify JavaScript files
terser js/main.js -o js/main.min.js -c -m
```

#### Using Gulp (Advanced):
```bash
npm install --save-dev gulp gulp-clean-css gulp-terser gulp-rename

# Create gulpfile.js
# Run: gulp minify
```

### Option 3: Server-Side Minification (Best for Production)

#### Apache (.htaccess)
Add to `.htaccess`:
```apache
# Enable compression (already enabled)
# Minification should be done at build time
```

#### PHP Script (if using PHP)
```php
<?php
// minify-css.php
$css = file_get_contents('css/styles.css');
$css = preg_replace('/\s+/', ' ', $css);
$css = str_replace('; ', ';', $css);
$css = str_replace(' {', '{', $css);
$css = str_replace('{ ', '{', $css);
$css = str_replace(' }', '}', $css);
file_put_contents('css/styles.min.css', $css);
?>
```

## Current Status
- ✅ CSS files are readable and maintainable
- ✅ JavaScript files are readable and maintainable
- ⚠️ Minification recommended for production

## Recommendation
For now, keep files unminified for easier debugging. When ready for production:
1. Use online tools for quick minification
2. Or set up build process with npm/gulp
3. Update HTML to reference `.min.css` and `.min.js` files

## Files to Minify
- `css/styles.css` → `css/styles.min.css`
- `css/calculator-global.css` → `css/calculator-global.min.css`
- `css/product-pages-global.css` → `css/product-pages-global.min.css`
- `js/main.js` → `js/main.min.js`
- `js/email-submitter.js` → `js/email-submitter.min.js`
- All files in `js/calculator/` folder

## Notes
- Always keep original unminified files for development
- Test minified files thoroughly before deployment
- Use source maps for debugging if needed
- Update HTML references after minification

