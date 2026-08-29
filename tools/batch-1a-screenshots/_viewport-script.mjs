
export default async function run(page, ui) {
  const widths = [390,768,1024,1366,1440,1920];
  const outDir = "D:\\Downloads\\woodenmax-reference-v1-batch-1a\\tools\\batch-1a-screenshots";
  const slug = process.env.QA_SLUG;
  const results = [];
  await page.waitForSelector('.wm-product-pilot-ready, [data-product-page-layout="gallery-first"]', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(400);
    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const overflowX = Math.max(doc.scrollWidth, body.scrollWidth) > Math.ceil(window.innerWidth) + 1;
      const finder = document.querySelectorAll('.wm-calculator-finder, a.wm-calculator-finder').length;
      const finderText = Array.from(document.querySelectorAll('a')).filter(a => (a.textContent||'').trim() === 'Calculator Finder').length;
      const ready = document.querySelector('[data-product-page-layout="gallery-first"].wm-product-pilot-ready') != null;
      const gallery = document.querySelector('.wm-product-pilot-gallery, .product-image-gallery') != null;
      const calc = document.querySelector('.price-calculator-container[data-product]') != null;
      const packages = document.querySelector('#wm-standard-packages') != null;
      const header = !!(document.querySelector('header, .wm-navbar, nav.navbar, #site-nav, [data-wm-nav]'));
      const footer = !!(document.querySelector('footer, #site-footer, .wm-footer, [data-wm-footer]'));
      const h1 = (document.querySelector('h1')||{}).textContent || '';
      return {
        overflowX,
        innerWidth: window.innerWidth,
        scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
        finder: Math.max(finder, finderText),
        ready,
        gallery,
        calc,
        packages,
        header,
        footer,
        h1: h1.replace(/\s+/g,' ').trim().slice(0,120),
        title: document.title,
      };
    });
    const shot = outDir + '/' + slug + '-' + w + '.png';
    await page.screenshot({ path: shot, fullPage: false });
    results.push({ width: w, shot, ...metrics });
  }
  return { slug, results };
}
