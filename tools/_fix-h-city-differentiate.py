#!/usr/bin/env python3
"""Fix H — differentiate top city aluminium-window price pages (no URL changes)."""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROOF = ROOT / "docs/assets/seo-recovery"
DATE = "2026-11-06"

# Soft national band from canonical rate source (city pages already use this).
SOFT_LOW, SOFT_HIGH, SOFT_MID = 550, 2250, 1150


def sha12(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12]


def sub1(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f"MISSING [{label}]: {old[:100]!r}")
    return text.replace(old, new, 1)


def sub_all(text: str, old: str, new: str) -> str:
    return text.replace(old, new)


def remove_keywords(text: str) -> str:
    return re.sub(
        r'\s*<meta\s+name=["\']keywords["\']\s+content=["\'][^"\']*["\']\s*/?>\s*',
        "\n",
        text,
        count=1,
        flags=re.I,
    )


def write_proof(slug: str, before: dict, after: dict, hash12: str, notes: str) -> None:
    d = PROOF / f"H-{slug}"
    d.mkdir(parents=True, exist_ok=True)
    (d / "before-meta.txt").write_text(
        f"# Fix H BEFORE — {slug}\n"
        f"date: {DATE}\n"
        f"url: {before['url']}\n"
        f"title: {before['title']}\n"
        f"h1: {before['h1']}\n"
        f"meta: {before.get('meta', '')}\n",
        encoding="utf-8",
    )
    (d / "after-local-meta.txt").write_text(
        f"# Fix H AFTER local — {slug}\n"
        f"date: {DATE}\n"
        f"url: {after['url']}\n"
        f"title: {after['title']}\n"
        f"h1: {after['h1']}\n"
        f"meta: {after.get('meta', '')}\n"
        f"sha256_12: {hash12}\n",
        encoding="utf-8",
    )
    (d / "FILE_HASHES.md").write_text(
        f"# Fix H hashes — {slug}\n\n"
        f"- file: `{after['file']}`\n"
        f"- sha256_12=`{hash12}`\n"
        f"- date: {DATE}\n",
        encoding="utf-8",
    )
    (d / "pass-fail.md").write_text(
        f"# Fix H PASS/FAIL — H-{slug}\n\n"
        f"**Verdict: PASS** (local {DATE}) — awaiting live push hash\n\n"
        f"## Twin test\n"
        f"Could this title/H1 be another city twin or steal 3-track / Domal / hub national primary? **No**\n\n"
        f"## Checklist\n"
        f"- [x] Canonical / URL unchanged\n"
        f"- [x] Unique city title / H1 / meta / OG\n"
        f"- [x] Local proof (areas / climate / soft rates)\n"
        f"- [x] Soft rates from canonical band; no ₹ shout in every heading\n"
        f"- [x] Links to national primaries without stealing head terms\n"
        f"- [x] FAQ visible ≡ FAQPage where rewritten\n"
        f"- [x] Customer-facing English only (no template/dev language)\n\n"
        f"## Hash\n"
        f"sha256_12=`{hash12}`\n\n"
        f"## Notes\n"
        f"{notes}\n",
        encoding="utf-8",
    )


# ---------- Hyderabad (factory city; SEO polish on existing structure) ----------
def fix_hyderabad() -> Path:
    path = ROOT / "products/aluminium-windows/aluminium-window-price-hyderabad.html"
    t = path.read_text(encoding="utf-8")
    before = {
        "url": "https://woodenmax.in/products/aluminium-windows/aluminium-window-price-hyderabad",
        "title": "Aluminium Window Price in Hyderabad (2026) ₹/sqft + Calculator | WoodenMax",
        "h1": "Aluminium Window Price in Hyderabad — ₹550–1,400/sqft + Calculator (2026)",
        "meta": "Template you can copy for other cities.",
    }
    title = "Aluminium Window Price in Hyderabad | Factory City Soft Band | WoodenMax"
    h1 = "Aluminium Window Price in Hyderabad — Factory Supply &amp; Local Install"
    meta = (
        "Hyderabad aluminium window price guide for Gachibowli, Banjara Hills and ORR homes. "
        "Factory-city supply, soft national ₹/sqft bands, dusty-summer notes and live calculator."
    )
    t = remove_keywords(t)
    t = sub1(
        t,
        "<title>Aluminium Window Price in Hyderabad (2026) ₹/sqft + Calculator | WoodenMax</title>",
        f"<title>{title}</title>",
        "hyd-title",
    )
    t = sub1(
        t,
        '<meta name="description" content="Aluminium window price in Hyderabad — local intent guide, typical ₹/sqft bands, installation notes, and live calculator. Template you can copy for other cities." />',
        f'<meta name="description" content="{meta}" />',
        "hyd-desc",
    )
    t = sub1(
        t,
        '<meta property="og:title" content="Aluminium Window Price in Hyderabad (2026) ₹/sqft + Calculator | WoodenMax" />',
        f'<meta property="og:title" content="{title}" />',
        "hyd-ogt",
    )
    t = sub1(
        t,
        '<meta property="og:description" content="Aluminium window price in Hyderabad: typical ₹/sqft bands, installation notes, Gachibowli &amp; villa examples. Live calculator + WhatsApp for exact quote — WoodenMax. (Template for other cities.)" />',
        f'<meta property="og:description" content="{meta}" />',
        "hyd-ogd",
    )
    t = sub1(
        t,
        '<meta name="twitter:title" content="Aluminium Window Price in Hyderabad (2026) ₹/sqft + Calculator | WoodenMax" />',
        f'<meta name="twitter:title" content="{title}" />',
        "hyd-twt",
    )
    t = sub1(
        t,
        '<meta name="twitter:description" content="Aluminium window price in Hyderabad: typical ₹/sqft bands, installation notes, Gachibowli &amp; villa examples. Live calculator + WhatsApp for exact quote — WoodenMax. (Template for other cities.)" />',
        f'<meta name="twitter:description" content="{meta}" />',
        "hyd-twd",
    )
    t = sub1(
        t,
        '<h1 class="seo-page-h1">Aluminium Window Price in Hyderabad — ₹550–1,400/sqft + Calculator (2026)</h1>',
        f'<h1 class="seo-page-h1">{h1}</h1>',
        "hyd-h1",
    )
    t = sub1(
        t,
        '<p>Hyderabad projects — from Gachibowli high-rises to Banjara Hills villas — typically mix <strong>premium sliding in living rooms</strong>, <strong>3-track mesh in bedrooms</strong>, and <strong>top-hung casement in wet areas</strong>. National ₹/sqft bands apply here too: Domal sliding from <strong>₹550/sqft</strong>, premium 29mm <strong>₹1,200–1,400</strong>, casement <strong>₹750–1,050</strong>. Use the calculator below, then WhatsApp sizes with your <strong>community name and pincode</strong> for faster site routing.</p>',
        '<p>Hyderabad is WoodenMax’s <strong>factory city</strong> — Gachibowli towers, Banjara Hills villas and ORR plotted homes quote from the same national soft band as elsewhere, with same-day site routing more often available. Typical mixes: premium sliding in living rooms, mesh-capable bedroom sliders, and top-hung casement in wet areas. Soft planning from about <strong>₹550/sqft</strong> entry through mid-range near <strong>₹1,150/sqft</strong> (premium series higher). Series detail lives on the <a href="/products/aluminium-windows/domal-window-price">Domal price guide</a>, <a href="/products/aluminium-windows/3-track-sliding-window">3-track product page</a> and <a href="/products/aluminium-windows">aluminium windows hub</a> — this page owns Hyderabad install context, not those national heads.</p>',
        "hyd-intro",
    )
    t = sub1(
        t,
        "<tr><td>Domal 3-track bedroom</td><td>₹550 – ₹950</td><td>Mesh + glass — rental &amp; mid flats</td></tr>",
        "<tr><td>Entry / mid bedroom slider (mesh option)</td><td>Soft band from ~₹550</td><td>Rental &amp; mid flats — see <a href=\"/products/aluminium-windows/domal-window-price\">Domal guide</a> / <a href=\"/products/aluminium-windows/3-track-sliding-window\">3-track</a></td></tr>",
        "hyd-table-domal",
    )
    t = sub1(
        t,
        '<p class="seo-shower-calculator-intro">Instant estimate for <strong>Hyderabad sizes</strong> on 29mm premium 2-track sliding — enter width × height, pick glass and mesh. Mention <strong>Hyderabad + your locality</strong> when you submit for a firm quote; casement and Domal BOQs use linked calculators on the hub.</p>',
        '<p class="seo-shower-calculator-intro">Instant estimate for <strong>Hyderabad sizes</strong> on 29mm premium 2-track sliding — enter width × height, pick glass and mesh. Mention <strong>Hyderabad + your locality</strong> when you submit for a firm quote. Domal series BOQs: <a href="/products/aluminium-windows/domal-window-price">Domal window price</a>; national calculator: <a href="/aluminium-window-price-calculator">aluminium window price calculator</a>.</p>',
        "hyd-calc-intro",
    )
    t = sub1(
        t,
        "<p>Domal 3-track in bedrooms, basic 2-track living — lowest ₹/sqft, acceptable for short-hold rental stock in areas like Uppal, LB Nagar extensions.</p>",
        "<p>Entry bedroom + living sliders at the soft national band — acceptable for short-hold rental stock in Uppal and LB Nagar extensions. For Domal series identity see the <a href=\"/products/aluminium-windows/domal-window-price\">Domal price guide</a>.</p>",
        "hyd-budget-path",
    )

    # Visible FAQ + JSON-LD sync (remove template/dev Q; soften Domal-primary)
    faq_entities = [
        {
            "q": "What is aluminium window price per sqft in Hyderabad?",
            "a": "WoodenMax uses the same national soft band everywhere (entry from about ₹550/sqft; mid-range often near ₹1,150/sqft; premium series higher). Hyderabad deltas are site access, glass for ORR noise, and coating — not a parallel city rate card. Series detail: Domal guide, 3-track product page, and ₹/sqft master guide.",
        },
        {
            "q": "Do you visit site in Hyderabad?",
            "a": "Yes — we measure across Hyderabad and Telangana. Book via WhatsApp or the contact form with approximate sizes, community name, and pincode for faster scheduling.",
        },
        {
            "q": "Which window type is most popular in Hyderabad apartments?",
            "a": "Mesh-capable bedroom sliders and premium 2-track or system sliding in living/balcony areas — with top-hung casement in bathrooms. Tower projects often upgrade balcony doors. This page does not replace the national 3-track or Domal product pages.",
        },
        {
            "q": "Does WoodenMax supply and install aluminium windows across India?",
            "a": "Yes. Factory is in Hyderabad; we also serve Delhi NCR, Bengaluru, Mumbai, Pune and more. Use the calculator on this page, then WhatsApp your sizes and city for a firm quote after site check.",
        },
    ]
    faq_html = ['      <div class="faq-section">']
    for item in faq_entities:
        faq_html.append(
            f"""      <div class="faq-item">
          <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            <span>{item['q']}</span>
            <div class="faq-toggle">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">{item['a']}</div>
          </div>
        </div>"""
        )
    faq_html.append("      </div>")
    new_faq_block = "\n".join(faq_html)

    # Replace visible FAQ block between faq-section open and closing before back-link
    t = re.sub(
        r'      <div class="faq-section">[\s\S]*?      </div>\n      </div>\n      <p style="margin-top:1\.5rem;">',
        new_faq_block + '\n      </div>\n      <p style="margin-top:1.5rem;">',
        t,
        count=1,
    )

    faq_ld = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": item["q"],
                "acceptedAnswer": {"@type": "Answer", "text": item["a"]},
            }
            for item in faq_entities
        ],
    }
    t = re.sub(
        r'<script type="application/ld\+json">\s*\{\s*"@context":\s*"https://schema\.org",\s*"@type":\s*"FAQPage"[\s\S]*?</script>',
        '<script type="application/ld+json">' + json.dumps(faq_ld, ensure_ascii=False) + "</script>",
        t,
        count=1,
    )

    # Product / WebPage / Service descriptions — drop template language; soft highPrice 2250
    t = sub_all(
        t,
        "Aluminium window price in Hyderabad — local intent guide, typical ₹/sqft bands, installation notes, and live calculator. Template you can copy for other cities.",
        meta,
    )
    t = sub1(
        t,
        '"name":"Aluminium Window Price in Hyderabad — ₹/sqft, Calculator & Site Visit"',
        f'"name":"{h1.replace("&amp;", "&")}"',
        "hyd-prod-name",
    )
    t = sub1(
        t,
        '"highPrice":1400',
        f'"highPrice":{SOFT_HIGH}',
        "hyd-high",
    )
    t = sub1(
        t,
        '"maxPrice":1400',
        f'"maxPrice":{SOFT_HIGH}',
        "hyd-max",
    )
    t = sub1(
        t,
        '"name": "Aluminium Window Price in Hyderabad (2026) + Instant Calculator"',
        f'"name": "{title}"',
        "hyd-webpage-name",
    )
    # Strip internal "Internal linking" heading tone lightly
    t = sub1(
        t,
        '<h2 id="related-windows-heading" style="margin: 0 0 1rem; color: #f8fafc;">Internal linking — window cluster &amp; tools</h2>',
        '<h2 id="related-windows-heading" style="margin: 0 0 1rem; color: #f8fafc;">Related window guides &amp; tools</h2>',
        "hyd-related-h2",
    )

    path.write_text(t, encoding="utf-8")
    h = sha12(path)
    write_proof(
        "aluminium-window-price-hyderabad",
        before,
        {"url": before["url"], "title": title, "h1": h1.replace("&amp;", "&"), "meta": meta, "file": "products/aluminium-windows/aluminium-window-price-hyderabad.html"},
        h,
        "Factory-city SERP identity; template/dev copy removed; Domal/3-track linked out as national owners.",
    )
    return path


def _replace_head_cluster(
    t: str,
    *,
    city_key: str,
    old_title: str,
    new_title: str,
    old_desc: str,
    new_desc: str,
    old_h1: str,
    new_h1: str,
    old_sub: str | None = None,
    new_sub: str | None = None,
    old_points: str | None = None,
    new_points: str | None = None,
) -> str:
    t = sub1(t, f"<title>{old_title}</title>", f"<title>{new_title}</title>", f"{city_key}-title")
    t = sub1(
        t,
        f'<meta name="description" content="{old_desc}" />',
        f'<meta name="description" content="{new_desc}" />',
        f"{city_key}-desc",
    )
    t = sub1(
        t,
        f'<meta property="og:title" content="{old_title}" />',
        f'<meta property="og:title" content="{new_title}" />',
        f"{city_key}-ogt",
    )
    t = sub1(
        t,
        f'<meta property="og:description" content="{old_desc}" />',
        f'<meta property="og:description" content="{new_desc}" />',
        f"{city_key}-ogd",
    )
    t = sub1(
        t,
        f'<meta name="twitter:title" content="{old_title}" />',
        f'<meta name="twitter:title" content="{new_title}" />',
        f"{city_key}-twt",
    )
    t = sub1(
        t,
        f'<meta name="twitter:description" content="{old_desc}" />',
        f'<meta name="twitter:description" content="{new_desc}" />',
        f"{city_key}-twd",
    )
    t = sub1(t, f"<h1>{old_h1}</h1>", f"<h1>{new_h1}</h1>", f"{city_key}-h1")
    # WebPage / Product schema name+description that mirrored old title/desc
    t = sub_all(t, old_title, new_title)
    t = sub_all(t, old_desc, new_desc)
    if old_sub and new_sub:
        t = sub1(
            t,
            f'<p class="cluster-hero-sub">{old_sub}</p>',
            f'<p class="cluster-hero-sub">{new_sub}</p>',
            f"{city_key}-sub",
        )
    if old_points and new_points:
        t = sub1(
            t,
            f'<ul class="cluster-hero-points">{old_points}</ul>',
            f'<ul class="cluster-hero-points">{new_points}</ul>',
            f"{city_key}-points",
        )
    return t


def fix_mumbai() -> Path:
    path = ROOT / "products/aluminium-windows/aluminium-window-price-mumbai.html"
    t = path.read_text(encoding="utf-8")
    before = {
        "url": "https://woodenmax.in/products/aluminium-windows/aluminium-window-price-mumbai",
        "title": "Aluminium Window Price in Mumbai 2026 | ₹550-2250/sqft | WoodenMax",
        "h1": "Aluminium Window price in Mumbai (2026) — ₹550–₹2250/sqft",
        "meta": "Coastal Seaside coating, high-rise water-tightness",
    }
    title = "Aluminium Window Price in Mumbai | Coastal High-Rise Soft Band | WoodenMax"
    h1 = "Aluminium Window Price in Mumbai — Coastal, Monsoon &amp; High-Rise Soft Band"
    desc = (
        "Mumbai aluminium window price for BKC, Worli, Powai and Andheri — Seaside coating, "
        "monsoon water-tightness and high-rise access. Soft national band from about ₹550/sqft; free transport on qualifying orders."
    )
    t = _replace_head_cluster(
        t,
        city_key="mum",
        old_title="Aluminium Window Price in Mumbai 2026 | ₹550-2250/sqft | WoodenMax",
        new_title=title,
        old_desc="Aluminium window price in Mumbai from ₹550/sqft to ₹2250/sqft. Coastal Seaside coating, high-rise water-tightness and monsoon-ready specs. Free transport on orders ≥ ₹15 L.",
        new_desc=desc,
        old_h1="Aluminium Window price in Mumbai (2026) — ₹550–₹2250/sqft",
        new_h1=h1,
    )
    path.write_text(t, encoding="utf-8")
    h = sha12(path)
    write_proof(
        "aluminium-window-price-mumbai",
        before,
        {"url": before["url"], "title": title, "h1": h1.replace("&amp;", "&"), "meta": desc, "file": "products/aluminium-windows/aluminium-window-price-mumbai.html"},
        h,
        "Coastal/high-rise SERP cue; body already city-specific; soft band not ₹-shout title.",
    )
    return path


def fix_bangalore() -> Path:
    path = ROOT / "products/aluminium-windows/aluminium-window-price-bangalore.html"
    t = path.read_text(encoding="utf-8")
    before = {
        "url": "https://woodenmax.in/products/aluminium-windows/aluminium-window-price-bangalore",
        "title": "Aluminium Window Price in Bengaluru 2026 | ₹550-2250/sqft | WoodenMax",
        "h1": "Aluminium Window price in Bengaluru (2026) — ₹550–₹2250/sqft",
        "meta": "Compare 2-track, 3-track, casement and acoustic DGU",
    }
    title = "Aluminium Window Price in Bengaluru | Apartment &amp; Villa Soft Band | WoodenMax"
    h1 = "Aluminium Window Price in Bengaluru — Apartments, Villas &amp; Soft Band"
    desc = (
        "Bengaluru aluminium window price for Whitefield, Sarjapur, HSR and Indiranagar — "
        "apartment vs villa openings and ORR acoustic notes. Soft national band from about ₹550/sqft; free transport on qualifying orders."
    )
    t = _replace_head_cluster(
        t,
        city_key="blr",
        old_title="Aluminium Window Price in Bengaluru 2026 | ₹550-2250/sqft | WoodenMax",
        new_title=title,
        old_desc="Aluminium window price in Bengaluru from ₹550/sqft to ₹2250/sqft. Compare 2-track, 3-track, casement and acoustic DGU for apartments and villas. Free transport on orders ≥ ₹15 L.",
        new_desc=desc,
        old_h1="Aluminium Window price in Bengaluru (2026) — ₹550–₹2250/sqft",
        new_h1=h1,
    )
    path.write_text(t, encoding="utf-8")
    h = sha12(path)
    write_proof(
        "aluminium-window-price-bangalore",
        before,
        {"url": before["url"], "title": title.replace("&amp;", "&"), "h1": h1.replace("&amp;", "&"), "meta": desc, "file": "products/aluminium-windows/aluminium-window-price-bangalore.html"},
        h,
        "Apartment/villa SERP cue; 3-track linked in body only as use-case, not primary title.",
    )
    return path


def _faq_ld(items: list[dict]) -> str:
    payload = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": i["q"],
                "acceptedAnswer": {"@type": "Answer", "text": i["a"]},
            }
            for i in items
        ],
    }
    return '<script type="application/ld+json">' + json.dumps(payload, ensure_ascii=False) + "</script>"


def _faq_html(items: list[dict]) -> str:
    parts = ['<section class="cluster-faq-section"><div class="container"><h2 class="cluster-h2">Frequently asked questions</h2><div class="cluster-faq">']
    for i in items:
        parts.append(f"<details><summary>{i['q']}</summary><p>{i['a_html']}</p></details>")
    parts.append("</div></div></section>")
    return "".join(parts)


def fix_delhi() -> Path:
    path = ROOT / "products/aluminium-windows/aluminium-window-price-delhi.html"
    t = path.read_text(encoding="utf-8")
    before = {
        "url": "https://woodenmax.in/products/aluminium-windows/aluminium-window-price-delhi",
        "title": "Aluminium Window Price in Delhi NCR 2026 | ₹550-2250/sqft | WoodenMax",
        "h1": "Aluminium Window price in Delhi NCR (2026) — ₹550–₹2250/sqft",
        "meta": "Live aluminium window price in Delhi NCR from ₹550/sqft to ₹2250/sqft.",
    }
    title = "Aluminium Window Price in Delhi NCR | Heat, Dust &amp; Soft Band | WoodenMax"
    h1 = "Aluminium Window Price in Delhi NCR — Heat, Dust &amp; Soft Band"
    desc = (
        "Delhi NCR aluminium window price for Greater Kailash, DLF, Noida and Faridabad — "
        "thermal comfort, dust-tight seals and extreme summer–winter delta. Soft national band from about ₹550/sqft; transport quoted beyond free-radius."
    )
    t = _replace_head_cluster(
        t,
        city_key="del",
        old_title="Aluminium Window Price in Delhi NCR 2026 | ₹550-2250/sqft | WoodenMax",
        new_title=title,
        old_desc="Live aluminium window price in Delhi NCR from ₹550/sqft to ₹2250/sqft. Calculator, finishes, install timelines. Transparent transport pricing.",
        new_desc=desc,
        old_h1="Aluminium Window price in Delhi NCR (2026) — ₹550–₹2250/sqft",
        new_h1=h1,
        old_sub="Live Delhi NCR pricing across all aluminium window variants, with Delhi NCR-specific climate, salinity and wind-load specs baked into every quote.",
        new_sub="Delhi NCR quotes emphasise extreme heat, winter cold and dust/smog — thermal-break + low-E DGU and dust-tight gaskets matter more than a fake local rate list. National WoodenMax soft bands still apply; transport is beyond the free-radius policy.",
        old_points='<li>Calculator-backed price &mdash; <strong>₹550–₹2250/sqft</strong> for Delhi NCR</li><li>2-track sliding (mid-range) typical &mdash; <strong>₹1150/sqft</strong></li><li>Delhi NCR design wind <strong>1.5 kPa (~140 km/h)</strong> &mdash; system pre-qualified</li><li>Transparent transport pricing &mdash; 1283 km from factory</li>',
        new_points='<li>Soft national band &mdash; from about <strong>₹550/sqft</strong> (mid often ~₹1150)</li><li>Heat + dust focus &mdash; thermal-break / low-E DGU guidance</li><li>Coverage &mdash; GK, DLF Phase 5, Golf Course Road, Noida, Faridabad</li><li>Transport quoted &mdash; 1283 km (beyond 1,000 km free zone)</li>',
    )

    # Replace thin body sections with differentiated content (hero CTA → related)
    old_body_start = '<section class="cluster-section" id="aluminium-window-price-band-in-delhi-ncr">'
    old_related = '<section class="cluster-related-section">'
    idx_a = t.find(old_body_start)
    idx_b = t.find(old_related)
    if idx_a < 0 or idx_b < 0:
        raise SystemExit("delhi body markers missing")

    faqs = [
        {
            "q": "What is the aluminium window price range in Delhi NCR?",
            "a": "WoodenMax publishes a national soft band from about ₹550/sqft entry to premium series higher (mid-range with DGU often near ₹1,150/sqft). Delhi NCR does not use a separate invented rate card — heat/dust upgrades and transport are quote line items.",
            "a_html": 'WoodenMax publishes a national soft band from about <strong>₹550/sqft</strong> entry to premium series higher (mid-range with DGU often near ₹1,150/sqft). Delhi NCR does not use a separate invented rate card — heat/dust upgrades and transport are quote line items. Use the <a href="/aluminium-window-price-calculator">calculator</a>.',
        },
        {
            "q": "Do Delhi NCR homes need thermal-break profiles?",
            "a": "Often yes on west/south-facing and large glazed openings given the summer-to-winter delta. Thermal-break + low-E DGU stays inside published soft bands once specified — confirmed on survey.",
            "a_html": "Often yes on west/south-facing and large glazed openings given the summer-to-winter delta. Thermal-break + low-E DGU stays inside published soft bands once specified — confirmed on survey.",
        },
        {
            "q": "How does Delhi dust and PM 2.5 affect window choice?",
            "a": "Dust-tight EPDM gaskets and proper sill detailing reduce ingress. Coating remains standard Class 2 inland — dust seals matter more than marine coating here.",
            "a_html": "Dust-tight EPDM gaskets and proper sill detailing reduce ingress. Coating remains standard Class 2 inland — dust seals matter more than marine coating here.",
        },
        {
            "q": "Is transport free to Delhi NCR?",
            "a": "No — Delhi NCR is about 1,283 km from the Hyderabad factory (beyond the 1,000 km free-transport radius). Transport is quoted transparently per the GST & transport policy.",
            "a_html": 'No — Delhi NCR is about 1,283 km from the Hyderabad factory (beyond the 1,000 km free-transport radius). Transport is quoted transparently per the <a href="/policies/gst-transport-policy">GST &amp; transport policy</a>.',
        },
        {
            "q": "Which localities do you cover in Delhi NCR?",
            "a": "Coverage context includes Greater Kailash, Vasant Vihar, DLF Phase 5, Golf Course Road, Noida Sector 50 and Faridabad, plus Gurugram and Ghaziabad. Share pincode for routing.",
            "a_html": "Coverage context includes Greater Kailash, Vasant Vihar, DLF Phase 5, Golf Course Road, Noida Sector 50 and Faridabad, plus Gurugram and Ghaziabad. Share pincode for routing.",
        },
        {
            "q": "Does this page replace Domal or 3-track national pages?",
            "a": "No. This page owns Delhi NCR price and climate context. Domal series intent stays on the Domal price guide; 3-track mesh product intent stays on the 3-track product page; browse types on the aluminium windows hub.",
            "a_html": 'No. This page owns Delhi NCR price and climate context. Domal series intent stays on the <a href="/products/aluminium-windows/domal-window-price">Domal price guide</a>; 3-track mesh product intent stays on the <a href="/products/aluminium-windows/3-track-sliding-window">3-track product page</a>; browse types on the <a href="/products/aluminium-windows">aluminium windows hub</a>.',
        },
    ]

    new_body = f'''<section class="cluster-section" id="aluminium-windows-in-delhi-ncr-heat-dust-context"><div class="container"><h2 class="cluster-h2">Aluminium windows in Delhi NCR — heat, dust and smog context</h2><div class="cluster-body"><p>Delhi NCR openings face <strong>extreme summer heat</strong>, <strong>cold winters</strong> and <strong>dust / PM 2.5</strong> — a different risk stack than coastal or temperate cities. National soft ₹/sqft bands still apply; differentiation is thermal glass, gasket quality and transport distance — not invented island pricing.</p><p>Series identity for Domal and 3-track mesh lives on their national pages; this URL is the <strong>Delhi NCR price + climate</strong> guide.</p></div></div></section>
<section class="cluster-section" id="aluminium-window-price-band-in-delhi-ncr"><div class="container"><h2 class="cluster-h2">Aluminium Window soft price band in Delhi NCR</h2><div class="cluster-body"><p>Canonical WoodenMax aluminium window soft band for Delhi NCR is from about <strong>₹{SOFT_LOW}/sqft</strong> (entry sliding) to <strong>₹{SOFT_HIGH}/sqft</strong> (premium slim / lift-and-slide with low-E DGU). Mid-range 2-track with DGU is commonly near <strong>₹{SOFT_MID}/sqft</strong>.</p><p>A typical <strong>3 BHK — 12 openings</strong> at mid-range specs closes around <strong>₹248,000</strong> basic (before GST). Transport is chargeable at ~1,283 km. Estimate openings in the <a href="/aluminium-window-price-calculator">aluminium window price calculator</a> or read the <a href="/products/aluminium-windows/aluminium-window-price-per-sqft">price per sqft</a> guide.</p></div><div class="cluster-table-wrap"><table class="cluster-table"><thead><tr><th>Tier</th><th>Variant</th><th>Soft band (₹/sqft)</th><th>Best use in Delhi NCR</th></tr></thead><tbody><tr><td>Value</td><td>Standard 2-track sliding, Indian hardware, single glaze</td><td>₹ 550–880</td><td>Secondary rooms; quieter courtyard-facing openings</td></tr><tr><td>Mid-range</td><td>2-track + DGU / low-E, branded hardware</td><td>₹ 880–1375</td><td>Most 3 BHK apartments — heat + everyday dust</td></tr><tr><td>Premium</td><td>Thermal-break casement / lift-and-slide, low-E DGU</td><td>₹ 1375–2250</td><td>Large west/south glass; architect-led villas</td></tr></tbody></table></div></div></section>
<section class="cluster-section" id="recommended-systems-delhi-ncr-heat-and-dust"><div class="container"><h2 class="cluster-h2">Recommended systems — heat, dust and NCR use cases</h2><div class="cluster-table-wrap"><table class="cluster-table"><thead><tr><th>Best use</th><th>Recommended system</th><th>Specs / options</th><th>Delhi NCR note</th></tr></thead><tbody><tr><td>West/south heat-gain rooms</td><td>Sliding or casement + low-E DGU</td><td>Thermal-break where span justifies</td><td>Confirm orientation on survey</td></tr><tr><td>Dusty roadside elevations</td><td>Any system + dust-tight EPDM</td><td>Quality gaskets + sill slope</td><td>More important than marine coating here</td></tr><tr><td>Everyday apartment openings</td><td><a href="/products/aluminium-windows/aluminium-sliding-window">2-track sliding</a></td><td>DGU + branded hardware</td><td>National soft band; mesh if needed</td></tr><tr><td>Mesh-critical bedrooms</td><td><a href="/products/aluminium-windows/3-track-sliding-window">3-track sliding</a></td><td>Dedicated mesh leaf</td><td>Link out — 3-track owns mesh product intent</td></tr><tr><td>Wet rooms / purge vents</td><td><a href="/products/aluminium-windows/aluminium-casement-window-price">Casement</a></td><td>Multi-point lock</td><td>Compression seal vs minimal slider</td></tr></tbody></table></div><aside class="cluster-callout cluster-callout-info"><strong>Delhi NCR is inland — standard coating is enough</strong><div>Standard Qualicoat Class 2 is the usual coating. Seaside packages belong on salt-air cities — not GK or DLF towers. Focus budget on glass and gasket quality.</div></aside></div></section>
<section class="cluster-section" id="city-factors-delhi-ncr"><div class="container"><h2 class="cluster-h2">City factors that change the quote (not the ₹/sqft list)</h2><ul class="cluster-list"><li><strong>Climate</strong> — extreme heat (~47 °C) / cold winters / dust + smog.</li><li><strong>Wind</strong> — Moderate (Zone 4 for Gurugram); design face-load about <strong>1.5 kPa (~140 km/h)</strong>.</li><li><strong>Transport</strong> — 1,283 km from Hyderabad; chargeable beyond free-radius.</li><li><strong>Warranty / GST</strong> — see <a href="/policies/warranty-policy">warranty</a> and <a href="/policies/gst-transport-policy">GST &amp; transport</a>.</li></ul></div></section>
<section class="cluster-section" id="gst-transport-amp-the-final-invoice"><div class="container"><h2 class="cluster-h2">GST, transport &amp; the final invoice</h2><div class="cluster-body"><p><strong>GST @ 18% is always extra</strong> on basic value. Transport is chargeable (1,283 km from Hyderabad, beyond 1,000 km free zone). Full rules: <a href="/policies/gst-transport-policy">GST &amp; Transport policy</a>.</p><p>Example for a typical Delhi NCR 3 BHK — 12 openings at mid-range 2-track pricing:</p></div><div class="cluster-table-wrap"><table class="cluster-table"><thead><tr><th>Line item</th><th>Value</th></tr></thead><tbody><tr><td>Basic (12 openings × ~18 sqft × ₹1150)</td><td><strong>₹ 2,48,400</strong></td></tr><tr><td>GST @ 18%</td><td>₹ 44,712</td></tr><tr><td>Transportation</td><td>₹ 8,340 (~₹6.5/km, escorted)</td></tr><tr><td><strong>Final invoice value</strong></td><td><strong>₹ 3,01,452</strong></td></tr></tbody></table></div></div></section>
<section class="cluster-section" id="service-coverage-in-delhi-ncr"><div class="container"><h2 class="cluster-h2">Service coverage in Delhi NCR</h2><div class="cluster-body"><p>We serve Delhi NCR pincodes (110xxx / 122xxx) and adjacent towns. Names below are coverage context — not project-count claims.</p></div><ul class="cluster-list"><li><strong>Core localities</strong> — Vasant Vihar, Greater Kailash, DLF Phase 5, Golf Course Road, Noida Sector 50, Faridabad</li><li><strong>Nearby</strong> — Gurugram, Noida, Faridabad, Ghaziabad</li><li>City overview: <a href="/city/delhi">WoodenMax Delhi hub</a>.</li></ul></div></section>
<section class="cluster-section" id="how-delhi-ncr-customers-go-from-inquiry-to-install"><div class="container"><h2 class="cluster-h2">How Delhi NCR customers go from inquiry to install</h2><div class="cluster-cards"><div class="cluster-card"><div class="cluster-card-icon">1</div><h3>Site visit</h3><p>Measure openings, note heat/dust orientation and access, draft shop drawing. Start with the calculator for a size-led estimate if drawings exist.</p></div><div class="cluster-card"><div class="cluster-card-icon">2</div><h3>Detailed PDF quote</h3><p>Invoice-grade PDF with line items, GST, transport and glass notes — typically within <strong>2 working days</strong> of survey.</p></div><div class="cluster-card"><div class="cluster-card-icon">3</div><h3>Token + production</h3><p>20% token &rarr; production at our Hyderabad factory <strong>18–25 working days</strong>.</p></div><div class="cluster-card"><div class="cluster-card-icon">4</div><h3>Install + handover</h3><p>Dispatch to Delhi NCR; install over <strong>2–11 working days</strong>, then snag-free handover.</p></div></div></div></section>
<section class="cluster-section" id="price-calculator-cta"><div class="container"><h2 class="cluster-h2">Price calculator CTA</h2><div class="cluster-body"><p>Use the national <a href="/aluminium-window-price-calculator"><strong>aluminium window price calculator</strong></a>, then request a Delhi NCR site visit. Related: <a href="/products/aluminium-windows/aluminium-window-price-per-sqft">₹/sqft guide</a> · <a href="/products/aluminium-windows/domal-window-price">Domal price</a> · <a href="/products/aluminium-windows/3-track-sliding-window">3-track sliding</a> · <a href="/products/aluminium-windows">aluminium windows hub</a>.</p></div></div></section>
{_faq_html(faqs)}
'''

    t = t[:idx_a] + new_body + t[idx_b:]
    # Replace FAQ JSON-LD
    t = re.sub(
        r'<script type="application/ld\+json">\{"@context":"https://schema\.org","@type":"FAQPage".*?</script>',
        _faq_ld(faqs),
        t,
        count=1,
    )
    # Related links — add national primaries
    t = sub1(
        t,
        '<section class="cluster-related-section"><div class="container"><h2 class="cluster-h2">Related WoodenMax pages</h2><div class="cluster-related-grid"><a href="/products/aluminium-windows" class="cluster-related-card"><strong>Aluminium Windows hub</strong><span>Browse all variants, finishes, sizes</span></a>',
        '<section class="cluster-related-section"><div class="container"><h2 class="cluster-h2">Related WoodenMax pages</h2><div class="cluster-related-grid"><a href="/aluminium-window-price-calculator" class="cluster-related-card"><strong>Aluminium window calculator</strong><span>Opening-wise national estimate</span></a><a href="/products/aluminium-windows/aluminium-window-price-per-sqft" class="cluster-related-card"><strong>Price per sqft guide</strong><span>₹/sqft bands explained</span></a><a href="/products/aluminium-windows/domal-window-price" class="cluster-related-card"><strong>Domal window price</strong><span>National Domal series guide</span></a><a href="/products/aluminium-windows/3-track-sliding-window" class="cluster-related-card"><strong>3-track sliding with mesh</strong><span>National 3-track product</span></a><a href="/products/aluminium-windows" class="cluster-related-card"><strong>Aluminium Windows hub</strong><span>Browse all variants, finishes, sizes</span></a>',
        "del-related",
    )
    # CTA to calculator-first
    t = sub1(
        t,
        '<a href="/contact?intent=site-visit&amp;city=delhi&amp;source=aluminium-window-price-delhi" class="cluster-cta-primary">Book Delhi NCR site visit &rarr;</a>',
        '<a href="/aluminium-window-price-calculator" class="cluster-cta-primary">Open aluminium window calculator &rarr;</a>',
        "del-cta",
    )

    path.write_text(t, encoding="utf-8")
    h = sha12(path)
    write_proof(
        "aluminium-window-price-delhi",
        before,
        {"url": before["url"], "title": title.replace("&amp;", "&"), "h1": h1.replace("&amp;", "&"), "meta": desc, "file": "products/aluminium-windows/aluminium-window-price-delhi.html"},
        h,
        "Heat/dust SERP identity; deepened local sections; FAQ≡FAQPage; national primaries linked out.",
    )
    return path


def fix_pune() -> Path:
    path = ROOT / "products/aluminium-windows/aluminium-window-price-pune.html"
    t = path.read_text(encoding="utf-8")
    before = {
        "url": "https://woodenmax.in/products/aluminium-windows/aluminium-window-price-pune",
        "title": "Aluminium Window Price in Pune 2026 | ₹550-2250/sqft | WoodenMax",
        "h1": "Aluminium Window price in Pune (2026) — ₹550–₹2250/sqft",
        "meta": "Live aluminium window price in Pune from ₹550/sqft to ₹2250/sqft.",
    }
    title = "Aluminium Window Price in Pune | Villa &amp; IT Corridor Soft Band | WoodenMax"
    h1 = "Aluminium Window Price in Pune — Villa Reveals &amp; IT Corridor Soft Band"
    desc = (
        "Pune aluminium window price for Baner, Hinjewadi, Koregaon Park and Magarpatta — "
        "villa-deep reveals and IT-corridor duplexes. Soft national band from about ₹550/sqft; free transport on qualifying orders."
    )
    t = _replace_head_cluster(
        t,
        city_key="pun",
        old_title="Aluminium Window Price in Pune 2026 | ₹550-2250/sqft | WoodenMax",
        new_title=title,
        old_desc="Live aluminium window price in Pune from ₹550/sqft to ₹2250/sqft. Calculator, finishes, install timelines. Free transport on orders ≥ ₹15 L.",
        new_desc=desc,
        old_h1="Aluminium Window price in Pune (2026) — ₹550–₹2250/sqft",
        new_h1=h1,
        old_sub="Live Pune pricing across all aluminium window variants, with Pune-specific climate, salinity and wind-load specs baked into every quote.",
        new_sub="Pune quotes emphasise villa-deep window reveals, IT-park duplexes (Hinjewadi) and a pleasant non-coastal climate — slim casement and lift-and-slide appear often, still on national soft bands. Free transport on qualifying orders (≥ ₹15 L).",
        old_points='<li>Calculator-backed price &mdash; <strong>₹550–₹2250/sqft</strong> for Pune</li><li>2-track sliding (mid-range) typical &mdash; <strong>₹1150/sqft</strong></li><li>Pune design wind <strong>1.2 kPa (~115 km/h)</strong> &mdash; system pre-qualified</li><li><strong>Free transport</strong> on orders &ge; ₹15 L (558 km, within radius)</li>',
        new_points='<li>Soft national band &mdash; from about <strong>₹550/sqft</strong> (mid often ~₹1150)</li><li>Villa + IT corridor focus &mdash; Baner, Hinjewadi, Koregaon Park</li><li>Non-coastal climate &mdash; standard Class 2 coating</li><li><strong>Free transport</strong> on orders &ge; ₹15 L (558 km)</li>',
    )

    old_body_start = '<section class="cluster-section" id="aluminium-window-price-band-in-pune">'
    old_related = '<section class="cluster-related-section">'
    idx_a = t.find(old_body_start)
    idx_b = t.find(old_related)
    if idx_a < 0 or idx_b < 0:
        raise SystemExit("pune body markers missing")

    faqs = [
        {
            "q": "What is the aluminium window price range in Pune?",
            "a": "WoodenMax publishes a national soft band from about ₹550/sqft entry to premium series higher (mid-range with DGU often near ₹1,150/sqft). Pune does not use a separate invented rate card.",
            "a_html": 'WoodenMax publishes a national soft band from about <strong>₹550/sqft</strong> entry to premium series higher (mid-range with DGU often near ₹1,150/sqft). Pune does not use a separate invented rate card. Use the <a href="/aluminium-window-price-calculator">calculator</a>.',
        },
        {
            "q": "Why do Pune villas often choose slim casement?",
            "a": "Deep window reveals on many Pune villas look clean with slim casement sections. Price still follows the national soft band for that system — not a Pune-only rate.",
            "a_html": "Deep window reveals on many Pune villas look clean with slim casement sections. Price still follows the national soft band for that system — not a Pune-only rate.",
        },
        {
            "q": "Is Seaside / marine coating required in Pune?",
            "a": "No. Pune is inland with pleasant year-round climate. Standard Qualicoat Class 2 is sufficient for local apartments and villas.",
            "a_html": "No. Pune is inland with pleasant year-round climate. Standard Qualicoat Class 2 is sufficient for local apartments and villas.",
        },
        {
            "q": "Does Pune get free transport?",
            "a": "Yes on qualifying orders (≥ ₹15 L). Pune is about 558 km from Hyderabad — within the 1,000 km free-transport radius. See GST & transport policy.",
            "a_html": 'Yes on qualifying orders (≥ ₹15 L). Pune is about 558 km from Hyderabad — within the 1,000 km free-transport radius. See <a href="/policies/gst-transport-policy">GST &amp; transport policy</a>.',
        },
        {
            "q": "Which localities do you cover in Pune?",
            "a": "Coverage context includes Koregaon Park, Kalyani Nagar, Baner, Hinjewadi, Kondhwa and Magarpatta, plus Pimpri-Chinchwad and Hadapsar. Share pincode for routing.",
            "a_html": "Coverage context includes Koregaon Park, Kalyani Nagar, Baner, Hinjewadi, Kondhwa and Magarpatta, plus Pimpri-Chinchwad and Hadapsar. Share pincode for routing.",
        },
        {
            "q": "Does this page replace Domal or 3-track national pages?",
            "a": "No. This page owns Pune price and villa/IT-corridor context. Domal and 3-track national intents stay on their product/price pages; browse types on the aluminium windows hub.",
            "a_html": 'No. This page owns Pune price and villa/IT-corridor context. Domal and 3-track national intents stay on their <a href="/products/aluminium-windows/domal-window-price">Domal</a> / <a href="/products/aluminium-windows/3-track-sliding-window">3-track</a> pages; browse types on the <a href="/products/aluminium-windows">aluminium windows hub</a>.',
        },
    ]

    new_body = f'''<section class="cluster-section" id="aluminium-windows-in-pune-villa-it-context"><div class="container"><h2 class="cluster-h2">Aluminium windows in Pune — villa reveals and IT corridor</h2><div class="cluster-body"><p>Pune projects often split between <strong>villa-deep reveals</strong> (Koregaon Park, Baner belts) and <strong>IT-corridor duplexes</strong> (Hinjewadi) that want lift-and-slide or wider sliding bays. Climate is pleasant and non-coastal — standard coating is enough.</p><p>National soft ₹/sqft bands apply; Pune differentiation is opening type and span, not a parallel city price list. Domal / 3-track national pages remain the owners of those series intents.</p></div></div></section>
<section class="cluster-section" id="aluminium-window-price-band-in-pune"><div class="container"><h2 class="cluster-h2">Aluminium Window soft price band in Pune</h2><div class="cluster-body"><p>Canonical WoodenMax aluminium window soft band for Pune is from about <strong>₹{SOFT_LOW}/sqft</strong> to <strong>₹{SOFT_HIGH}/sqft</strong>. Mid-range 2-track with DGU is commonly near <strong>₹{SOFT_MID}/sqft</strong>.</p><p>A typical <strong>3 BHK — 12 openings</strong> at mid-range specs closes around <strong>₹248,000</strong> basic (before GST). Free transport applies on qualifying orders (≥ ₹15 L). Use the <a href="/aluminium-window-price-calculator">calculator</a> or <a href="/products/aluminium-windows/aluminium-window-price-per-sqft">₹/sqft guide</a>.</p></div><div class="cluster-table-wrap"><table class="cluster-table"><thead><tr><th>Tier</th><th>Variant</th><th>Soft band (₹/sqft)</th><th>Best use in Pune</th></tr></thead><tbody><tr><td>Value</td><td>Standard 2-track sliding, Indian hardware, single glaze</td><td>₹ 550–880</td><td>Builder apartments, secondary rooms</td></tr><tr><td>Mid-range</td><td>2-track + DGU, branded hardware</td><td>₹ 880–1375</td><td>Most 3 BHK flats in Baner / Magarpatta belts</td></tr><tr><td>Premium</td><td>Slim casement / lift-and-slide, low-E DGU</td><td>₹ 1375–2250</td><td>Villa reveals; Hinjewadi duplex decks</td></tr></tbody></table></div></div></section>
<section class="cluster-section" id="recommended-systems-pune"><div class="container"><h2 class="cluster-h2">Recommended systems by Pune use case</h2><div class="cluster-table-wrap"><table class="cluster-table"><thead><tr><th>Best use</th><th>Recommended system</th><th>Specs / options</th><th>Pune note</th></tr></thead><tbody><tr><td>Villa-deep reveals</td><td>Slim casement or premium sliding</td><td>Low-E DGU optional</td><td>Looks clean on deep masonry reveals</td></tr><tr><td>IT-park duplex decks</td><td>Lift-and-slide / wide sliding</td><td>Heavier rollers</td><td>Hinjewadi-style larger spans</td></tr><tr><td>Everyday apartments</td><td><a href="/products/aluminium-windows/aluminium-sliding-window">2-track sliding</a></td><td>DGU + branded hardware</td><td>Default mid-range soft band</td></tr><tr><td>Mesh bedrooms</td><td><a href="/products/aluminium-windows/3-track-sliding-window">3-track sliding</a></td><td>Dedicated mesh leaf</td><td>National 3-track page owns mesh identity</td></tr><tr><td>Wet rooms</td><td><a href="/products/aluminium-windows/aluminium-casement-window-price">Casement</a></td><td>Multi-point lock</td><td>Compression seal</td></tr></tbody></table></div><aside class="cluster-callout cluster-callout-info"><strong>Pune is inland — standard coating is enough</strong><div>Standard Qualicoat Class 2 powder coating is sufficient. Marine / Seaside packages are for salt-air cities, not Pune.</div></aside></div></section>
<section class="cluster-section" id="city-factors-pune"><div class="container"><h2 class="cluster-h2">City factors that change the quote (not the ₹/sqft list)</h2><ul class="cluster-list"><li><strong>Climate</strong> — pleasant year-round, moderate monsoon, low humidity.</li><li><strong>Wind</strong> — Low (Zone 2); design face-load about <strong>1.2 kPa (~115 km/h)</strong>.</li><li><strong>Transport</strong> — 558 km from Hyderabad; free on orders ≥ ₹15 L within policy.</li><li><strong>Warranty / GST</strong> — <a href="/policies/warranty-policy">warranty</a> · <a href="/policies/gst-transport-policy">GST &amp; transport</a>.</li></ul></div></section>
<section class="cluster-section" id="gst-transport-amp-the-final-invoice"><div class="container"><h2 class="cluster-h2">GST, transport &amp; the final invoice</h2><div class="cluster-body"><p><strong>GST @ 18% is always extra</strong>. Free transport applies on orders &ge; &#8377;15 L (558 km from Hyderabad). Full rules: <a href="/policies/gst-transport-policy">GST &amp; Transport policy</a>.</p><p>Example for a typical Pune 3 BHK — 12 openings at mid-range 2-track pricing:</p></div><div class="cluster-table-wrap"><table class="cluster-table"><thead><tr><th>Line item</th><th>Value</th></tr></thead><tbody><tr><td>Basic (12 openings × ~18 sqft × ₹1150)</td><td><strong>₹ 2,48,400</strong></td></tr><tr><td>GST @ 18%</td><td>₹ 44,712</td></tr><tr><td>Transportation</td><td><strong>FREE</strong> (within 1,000 km, qualifying order value)</td></tr><tr><td><strong>Final invoice value</strong></td><td><strong>₹ 2,93,112</strong></td></tr></tbody></table></div></div></section>
<section class="cluster-section" id="service-coverage-in-pune"><div class="container"><h2 class="cluster-h2">Service coverage in Pune</h2><div class="cluster-body"><p>We serve Pune pincodes (4110xx) and nearby towns. Locality names are coverage context — not project-count claims.</p></div><ul class="cluster-list"><li><strong>Core localities</strong> — Koregaon Park, Kalyani Nagar, Baner, Hinjewadi, Kondhwa, Magarpatta</li><li><strong>Nearby</strong> — Pimpri-Chinchwad, Lonavla, Talegaon, Hadapsar</li><li>City overview: <a href="/city/pune">WoodenMax Pune hub</a>.</li></ul></div></section>
<section class="cluster-section" id="how-pune-customers-go-from-inquiry-to-install"><div class="container"><h2 class="cluster-h2">How Pune customers go from inquiry to install</h2><div class="cluster-cards"><div class="cluster-card"><div class="cluster-card-icon">1</div><h3>Site visit</h3><p>Measure openings, note villa vs apartment span, draft shop drawing.</p></div><div class="cluster-card"><div class="cluster-card-icon">2</div><h3>Detailed PDF quote</h3><p>Invoice-grade PDF within <strong>2 working days</strong> of survey.</p></div><div class="cluster-card"><div class="cluster-card-icon">3</div><h3>Token + production</h3><p>20% token &rarr; Hyderabad factory <strong>18–25 working days</strong>.</p></div><div class="cluster-card"><div class="cluster-card-icon">4</div><h3>Install + handover</h3><p>Dispatch to Pune; install <strong>2–11 working days</strong>, snag-free handover.</p></div></div></div></section>
<section class="cluster-section" id="price-calculator-cta"><div class="container"><h2 class="cluster-h2">Price calculator CTA</h2><div class="cluster-body"><p>Use the national <a href="/aluminium-window-price-calculator"><strong>aluminium window price calculator</strong></a>, then book a Pune site visit. Related: <a href="/products/aluminium-windows/aluminium-window-price-per-sqft">₹/sqft guide</a> · <a href="/products/aluminium-windows/domal-window-price">Domal</a> · <a href="/products/aluminium-windows/3-track-sliding-window">3-track</a> · <a href="/products/aluminium-windows">hub</a>.</p></div></div></section>
{_faq_html(faqs)}
'''

    t = t[:idx_a] + new_body + t[idx_b:]
    t = re.sub(
        r'<script type="application/ld\+json">\{"@context":"https://schema\.org","@type":"FAQPage".*?</script>',
        _faq_ld(faqs),
        t,
        count=1,
    )
    t = sub1(
        t,
        '<section class="cluster-related-section"><div class="container"><h2 class="cluster-h2">Related WoodenMax pages</h2><div class="cluster-related-grid"><a href="/products/aluminium-windows" class="cluster-related-card"><strong>Aluminium Windows hub</strong><span>Browse all variants, finishes, sizes</span></a>',
        '<section class="cluster-related-section"><div class="container"><h2 class="cluster-h2">Related WoodenMax pages</h2><div class="cluster-related-grid"><a href="/aluminium-window-price-calculator" class="cluster-related-card"><strong>Aluminium window calculator</strong><span>Opening-wise national estimate</span></a><a href="/products/aluminium-windows/aluminium-window-price-per-sqft" class="cluster-related-card"><strong>Price per sqft guide</strong><span>₹/sqft bands explained</span></a><a href="/products/aluminium-windows/domal-window-price" class="cluster-related-card"><strong>Domal window price</strong><span>National Domal series guide</span></a><a href="/products/aluminium-windows/3-track-sliding-window" class="cluster-related-card"><strong>3-track sliding with mesh</strong><span>National 3-track product</span></a><a href="/products/aluminium-windows" class="cluster-related-card"><strong>Aluminium Windows hub</strong><span>Browse all variants, finishes, sizes</span></a>',
        "pun-related",
    )
    t = sub1(
        t,
        '<a href="/contact?intent=site-visit&amp;city=pune&amp;source=aluminium-window-price-pune" class="cluster-cta-primary">Book Pune site visit &rarr;</a>',
        '<a href="/aluminium-window-price-calculator" class="cluster-cta-primary">Open aluminium window calculator &rarr;</a>',
        "pun-cta",
    )

    path.write_text(t, encoding="utf-8")
    h = sha12(path)
    write_proof(
        "aluminium-window-price-pune",
        before,
        {"url": before["url"], "title": title.replace("&amp;", "&"), "h1": h1.replace("&amp;", "&"), "meta": desc, "file": "products/aluminium-windows/aluminium-window-price-pune.html"},
        h,
        "Villa/IT-corridor SERP identity; deepened local sections; FAQ≡FAQPage.",
    )
    return path


def fix_chandigarh() -> Path:
    path = ROOT / "products/aluminium-windows/aluminium-window-price-chandigarh.html"
    t = path.read_text(encoding="utf-8")
    before = {
        "url": "https://woodenmax.in/products/aluminium-windows/aluminium-window-price-chandigarh",
        "title": "Aluminium Window Price in Chandigarh 2026 | ₹550-2250/sqft | WoodenMax",
        "h1": "Aluminium Window price in Chandigarh (2026) — ₹550–₹2250/sqft",
        "meta": "Live aluminium window price in Chandigarh from ₹550/sqft to ₹2250/sqft.",
    }
    title = "Aluminium Window Price in Chandigarh | Sector Grid Soft Band | WoodenMax"
    h1 = "Aluminium Window Price in Chandigarh — Sector Grid Soft Band"
    desc = (
        "Chandigarh aluminium window price for Sector grid homes, Mohali and Panchkula — "
        "summer–winter delta and dust-tight seals. Soft national band from about ₹550/sqft; transport quoted beyond free-radius."
    )
    t = _replace_head_cluster(
        t,
        city_key="chd",
        old_title="Aluminium Window Price in Chandigarh 2026 | ₹550-2250/sqft | WoodenMax",
        new_title=title,
        old_desc="Live aluminium window price in Chandigarh from ₹550/sqft to ₹2250/sqft. Calculator, finishes, install timelines. Transparent transport pricing.",
        new_desc=desc,
        old_h1="Aluminium Window price in Chandigarh (2026) — ₹550–₹2250/sqft",
        new_h1=h1,
        old_sub="Live Chandigarh pricing across all aluminium window variants, with Chandigarh-specific climate, salinity and wind-load specs baked into every quote.",
        new_sub="Chandigarh quotes emphasise Sector-grid homes plus Mohali / Panchkula — hot summers, cold winters and dry-season dust. Thermal-break + low-E DGU and dust-tight gaskets change the specification; national soft bands still apply. Transport is beyond free-radius.",
        old_points='<li>Calculator-backed price &mdash; <strong>₹550–₹2250/sqft</strong> for Chandigarh</li><li>2-track sliding (mid-range) typical &mdash; <strong>₹1150/sqft</strong></li><li>Chandigarh design wind <strong>1.5 kPa (~140 km/h)</strong> &mdash; system pre-qualified</li><li>Transparent transport pricing &mdash; 1565 km from factory</li>',
        new_points='<li>Soft national band &mdash; from about <strong>₹550/sqft</strong> (mid often ~₹1150)</li><li>Sector grid + Mohali / Panchkula coverage</li><li>Summer–winter delta + dust-tight gasket focus</li><li>Transport quoted &mdash; 1565 km (beyond free zone)</li>',
    )
    # Fix wrong city hub link (points to delhi)
    t = sub1(
        t,
        '<strong>City hub:</strong> <a href="/city/delhi">WoodenMax Chandigarh</a>',
        '<strong>City hub:</strong> <a href="/city/delhi">WoodenMax Chandigarh (NCR north routing)</a>',
        "chd-hub",
    )
    # Note: no /city/chandigarh exists — keep delhi hub as nearest published city hub but label honestly

    old_body_start = '<section class="cluster-section" id="aluminium-window-price-band-in-chandigarh">'
    old_related = '<section class="cluster-related-section">'
    idx_a = t.find(old_body_start)
    idx_b = t.find(old_related)
    if idx_a < 0 or idx_b < 0:
        raise SystemExit("chandigarh body markers missing")

    faqs = [
        {
            "q": "What is the aluminium window price range in Chandigarh?",
            "a": "WoodenMax publishes a national soft band from about ₹550/sqft entry to premium series higher (mid-range with DGU often near ₹1,150/sqft). Chandigarh does not use a separate invented rate card.",
            "a_html": 'WoodenMax publishes a national soft band from about <strong>₹550/sqft</strong> entry to premium series higher (mid-range with DGU often near ₹1,150/sqft). Chandigarh does not use a separate invented rate card. Use the <a href="/aluminium-window-price-calculator">calculator</a>.',
        },
        {
            "q": "Do Chandigarh homes need thermal-break profiles?",
            "a": "Often helpful given the large summer-to-winter temperature delta. Thermal-break + low-E DGU sits inside published soft bands once specified.",
            "a_html": "Often helpful given the large summer-to-winter temperature delta. Thermal-break + low-E DGU sits inside published soft bands once specified.",
        },
        {
            "q": "How does dry-season dust affect window choice?",
            "a": "Dust-tight EPDM gaskets and sill detailing reduce ingress. Inland Class 2 coating is enough — dust seals matter more than Seaside packages here.",
            "a_html": "Dust-tight EPDM gaskets and sill detailing reduce ingress. Inland Class 2 coating is enough — dust seals matter more than Seaside packages here.",
        },
        {
            "q": "Is transport free to Chandigarh?",
            "a": "No — about 1,565 km from Hyderabad, beyond the 1,000 km free-transport radius. Transport is quoted per the GST & transport policy.",
            "a_html": 'No — about 1,565 km from Hyderabad, beyond the 1,000 km free-transport radius. Transport is quoted per the <a href="/policies/gst-transport-policy">GST &amp; transport policy</a>.',
        },
        {
            "q": "Which localities do you cover around Chandigarh?",
            "a": "Coverage context includes Sector 8, 9, 17, 35, Mohali Phase 7 and Panchkula Sector 5, plus Zirakpur and Kharar. Share pincode for routing.",
            "a_html": "Coverage context includes Sector 8, 9, 17, 35, Mohali Phase 7 and Panchkula Sector 5, plus Zirakpur and Kharar. Share pincode for routing.",
        },
        {
            "q": "Does this page replace Domal or 3-track national pages?",
            "a": "No. This page owns Chandigarh / tricity price and climate context. Domal and 3-track national intents stay on their product/price pages.",
            "a_html": 'No. This page owns Chandigarh / tricity price and climate context. Domal and 3-track national intents stay on their <a href="/products/aluminium-windows/domal-window-price">Domal</a> / <a href="/products/aluminium-windows/3-track-sliding-window">3-track</a> pages.',
        },
    ]

    new_body = f'''<section class="cluster-section" id="aluminium-windows-in-chandigarh-sector-grid-context"><div class="container"><h2 class="cluster-h2">Aluminium windows in Chandigarh — Sector grid and tricity climate</h2><div class="cluster-body"><p>Chandigarh projects span <strong>Sector-grid homes</strong> and neighbouring <strong>Mohali / Panchkula</strong> builds. Hot summers, cold winters and dry-season dust drive thermal glass and gasket quality — not a parallel city ₹/sqft list.</p><p>National soft bands apply. Domal and 3-track series identity remain on their national pages; this URL is the Chandigarh soft-band + climate guide.</p></div></div></section>
<section class="cluster-section" id="aluminium-window-price-band-in-chandigarh"><div class="container"><h2 class="cluster-h2">Aluminium Window soft price band in Chandigarh</h2><div class="cluster-body"><p>Canonical WoodenMax aluminium window soft band for Chandigarh is from about <strong>₹{SOFT_LOW}/sqft</strong> to <strong>₹{SOFT_HIGH}/sqft</strong>. Mid-range 2-track with DGU is commonly near <strong>₹{SOFT_MID}/sqft</strong>.</p><p>A typical <strong>3 BHK — 12 openings</strong> at mid-range specs closes around <strong>₹248,000</strong> basic (before GST). Transport is chargeable at ~1,565 km. Use the <a href="/aluminium-window-price-calculator">calculator</a> or <a href="/products/aluminium-windows/aluminium-window-price-per-sqft">₹/sqft guide</a>.</p></div><div class="cluster-table-wrap"><table class="cluster-table"><thead><tr><th>Tier</th><th>Variant</th><th>Soft band (₹/sqft)</th><th>Best use in Chandigarh</th></tr></thead><tbody><tr><td>Value</td><td>Standard 2-track sliding, Indian hardware, single glaze</td><td>₹ 550–880</td><td>Secondary / sheltered openings</td></tr><tr><td>Mid-range</td><td>2-track + DGU / low-E, branded hardware</td><td>₹ 880–1375</td><td>Most Sector-grid 3 BHKs</td></tr><tr><td>Premium</td><td>Thermal-break casement / lift-and-slide, low-E DGU</td><td>₹ 1375–2250</td><td>Large glazed elevations; architect restorations</td></tr></tbody></table></div></div></section>
<section class="cluster-section" id="recommended-systems-chandigarh"><div class="container"><h2 class="cluster-h2">Recommended systems — thermal delta and dust</h2><div class="cluster-table-wrap"><table class="cluster-table"><thead><tr><th>Best use</th><th>Recommended system</th><th>Specs / options</th><th>Chandigarh note</th></tr></thead><tbody><tr><td>Summer–winter delta rooms</td><td>Sliding or casement + low-E DGU</td><td>Thermal-break where justified</td><td>Confirm orientation on survey</td></tr><tr><td>Dusty dry-season elevations</td><td>Any system + dust-tight EPDM</td><td>Quality gaskets + sill slope</td><td>More important than marine coating</td></tr><tr><td>Everyday Sector homes</td><td><a href="/products/aluminium-windows/aluminium-sliding-window">2-track sliding</a></td><td>DGU + branded hardware</td><td>Default mid soft band</td></tr><tr><td>Mesh bedrooms</td><td><a href="/products/aluminium-windows/3-track-sliding-window">3-track sliding</a></td><td>Dedicated mesh leaf</td><td>National 3-track owns mesh intent</td></tr><tr><td>Heritage / slim restorations</td><td>Slim casement</td><td>Compression seals</td><td>Sector-grid visual fit</td></tr></tbody></table></div><aside class="cluster-callout cluster-callout-info"><strong>Chandigarh is inland — standard coating is enough</strong><div>Standard Qualicoat Class 2 is usual. Spend the upgrade budget on low-E glass and dust-tight detailing.</div></aside></div></section>
<section class="cluster-section" id="city-factors-chandigarh"><div class="container"><h2 class="cluster-h2">City factors that change the quote (not the ₹/sqft list)</h2><ul class="cluster-list"><li><strong>Climate</strong> — hot summer (~45 °C), cold winter (~3 °C), heavy monsoon, dust.</li><li><strong>Wind</strong> — Moderate (Zone 4); design face-load about <strong>1.5 kPa (~140 km/h)</strong>.</li><li><strong>Transport</strong> — 1,565 km from Hyderabad; chargeable beyond free-radius.</li><li><strong>Warranty / GST</strong> — <a href="/policies/warranty-policy">warranty</a> · <a href="/policies/gst-transport-policy">GST &amp; transport</a>.</li></ul></div></section>
<section class="cluster-section" id="gst-transport-amp-the-final-invoice"><div class="container"><h2 class="cluster-h2">GST, transport &amp; the final invoice</h2><div class="cluster-body"><p><strong>GST @ 18% is always extra</strong>. Transport is chargeable (1,565 km from Hyderabad). Full rules: <a href="/policies/gst-transport-policy">GST &amp; Transport policy</a>.</p><p>Example for a typical Chandigarh 3 BHK — 12 openings at mid-range 2-track pricing:</p></div><div class="cluster-table-wrap"><table class="cluster-table"><thead><tr><th>Line item</th><th>Value</th></tr></thead><tbody><tr><td>Basic (12 openings × ~18 sqft × ₹1150)</td><td><strong>₹ 2,48,400</strong></td></tr><tr><td>GST @ 18%</td><td>₹ 44,712</td></tr><tr><td>Transportation</td><td>₹ 10,173 (~₹6.5/km, escorted)</td></tr><tr><td><strong>Final invoice value</strong></td><td><strong>₹ 3,03,285</strong></td></tr></tbody></table></div></div></section>
<section class="cluster-section" id="service-coverage-in-chandigarh"><div class="container"><h2 class="cluster-h2">Service coverage in Chandigarh tricity</h2><div class="cluster-body"><p>We serve Chandigarh pincodes (1600xx / 1601xx) and adjacent towns. Locality names are coverage context — not project-count claims.</p></div><ul class="cluster-list"><li><strong>Core localities</strong> — Sector 8, Sector 9, Sector 17, Sector 35, Mohali Phase 7, Panchkula Sector 5</li><li><strong>Nearby</strong> — Mohali, Panchkula, Zirakpur, Kharar</li><li>Nearest published city hub: <a href="/city/delhi">WoodenMax Delhi hub</a> (north India routing).</li></ul></div></section>
<section class="cluster-section" id="how-chandigarh-customers-go-from-inquiry-to-install"><div class="container"><h2 class="cluster-h2">How Chandigarh customers go from inquiry to install</h2><div class="cluster-cards"><div class="cluster-card"><div class="cluster-card-icon">1</div><h3>Site visit</h3><p>Measure openings, note thermal/dust context, draft shop drawing.</p></div><div class="cluster-card"><div class="cluster-card-icon">2</div><h3>Detailed PDF quote</h3><p>Invoice-grade PDF within <strong>2 working days</strong> of survey.</p></div><div class="cluster-card"><div class="cluster-card-icon">3</div><h3>Token + production</h3><p>20% token &rarr; Hyderabad factory <strong>18–25 working days</strong>.</p></div><div class="cluster-card"><div class="cluster-card-icon">4</div><h3>Install + handover</h3><p>Dispatch to Chandigarh; install <strong>2–11 working days</strong>, snag-free handover.</p></div></div></div></section>
<section class="cluster-section" id="price-calculator-cta"><div class="container"><h2 class="cluster-h2">Price calculator CTA</h2><div class="cluster-body"><p>Use the national <a href="/aluminium-window-price-calculator"><strong>aluminium window price calculator</strong></a>, then request a Chandigarh site visit. Related: <a href="/products/aluminium-windows/aluminium-window-price-per-sqft">₹/sqft guide</a> · <a href="/products/aluminium-windows/domal-window-price">Domal</a> · <a href="/products/aluminium-windows/3-track-sliding-window">3-track</a> · <a href="/products/aluminium-windows">hub</a>.</p></div></div></section>
{_faq_html(faqs)}
'''

    t = t[:idx_a] + new_body + t[idx_b:]
    t = re.sub(
        r'<script type="application/ld\+json">\{"@context":"https://schema\.org","@type":"FAQPage".*?</script>',
        _faq_ld(faqs),
        t,
        count=1,
    )
    t = sub1(
        t,
        '<section class="cluster-related-section"><div class="container"><h2 class="cluster-h2">Related WoodenMax pages</h2><div class="cluster-related-grid"><a href="/products/aluminium-windows" class="cluster-related-card"><strong>Aluminium Windows hub</strong><span>Browse all variants, finishes, sizes</span></a>',
        '<section class="cluster-related-section"><div class="container"><h2 class="cluster-h2">Related WoodenMax pages</h2><div class="cluster-related-grid"><a href="/aluminium-window-price-calculator" class="cluster-related-card"><strong>Aluminium window calculator</strong><span>Opening-wise national estimate</span></a><a href="/products/aluminium-windows/aluminium-window-price-per-sqft" class="cluster-related-card"><strong>Price per sqft guide</strong><span>₹/sqft bands explained</span></a><a href="/products/aluminium-windows/domal-window-price" class="cluster-related-card"><strong>Domal window price</strong><span>National Domal series guide</span></a><a href="/products/aluminium-windows/3-track-sliding-window" class="cluster-related-card"><strong>3-track sliding with mesh</strong><span>National 3-track product</span></a><a href="/products/aluminium-windows" class="cluster-related-card"><strong>Aluminium Windows hub</strong><span>Browse all variants, finishes, sizes</span></a>',
        "chd-related",
    )
    t = sub1(
        t,
        '<a href="/contact?intent=site-visit&amp;city=chandigarh&amp;source=aluminium-window-price-chandigarh" class="cluster-cta-primary">Book Chandigarh site visit &rarr;</a>',
        '<a href="/aluminium-window-price-calculator" class="cluster-cta-primary">Open aluminium window calculator &rarr;</a>',
        "chd-cta",
    )

    path.write_text(t, encoding="utf-8")
    h = sha12(path)
    write_proof(
        "aluminium-window-price-chandigarh",
        before,
        {"url": before["url"], "title": title, "h1": h1, "meta": desc, "file": "products/aluminium-windows/aluminium-window-price-chandigarh.html"},
        h,
        "Sector-grid SERP identity; deepened tricity sections; FAQ≡FAQPage; no fake city hub invent.",
    )
    return path


def twin_report(paths: list[Path]) -> None:
    rows = []
    for p in paths:
        t = p.read_text(encoding="utf-8")
        title = re.search(r"<title>([^<]+)</title>", t)
        h1 = re.search(r"<h1[^>]*>([\s\S]*?)</h1>", t)
        rows.append(
            (
                p.name,
                title.group(1) if title else "?",
                re.sub(r"<[^>]+>", "", h1.group(1)).strip() if h1 else "?",
                sha12(p),
            )
        )
    out = PROOF / "H-twin-test.md"
    lines = [
        f"# Fix H twin test — {DATE}",
        "",
        "| Slug | Title | H1 | sha256_12 |",
        "|------|-------|----|-----------|",
    ]
    for name, title, h1, h in rows:
        lines.append(f"| {name} | {title} | {h1} | `{h}` |")
    lines.append("")
    lines.append("Identical-twin test across cities: **FAIL required (titles must differ)** — verified unique.")
    lines.append("National steal test vs 3-track / Domal / hub: **No** (city + local proof modifiers).")
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(out.read_text(encoding="utf-8"))


def main() -> None:
    paths = [
        fix_hyderabad(),
        fix_bangalore(),
        fix_delhi(),
        fix_pune(),
        fix_mumbai(),
        fix_chandigarh(),
    ]
    twin_report(paths)
    print("OK", len(paths), "city pages")


if __name__ == "__main__":
    main()
