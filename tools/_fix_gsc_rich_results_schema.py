#!/usr/bin/env python3
"""Fix actionable GSC Product / Review rich-result schema issues (honest markup only)."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = []

LD_RE = re.compile(
    r'(<script[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)',
    re.I | re.S,
)


def html_unescape_light(s):
    return (
        s.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&#39;", "'")
    )


def strip_tags(s):
    return re.sub(r"<[^>]+>", "", s)


def parse_ld(raw):
    return json.loads(raw.strip())


def dump_ld(data):
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))


def walk_strip_reviews(obj, changed):
    if isinstance(obj, list):
        for item in obj:
            walk_strip_reviews(item, changed)
        return
    if not isinstance(obj, dict):
        return
    for key in ("review", "aggregateRating"):
        if key in obj:
            del obj[key]
            changed.append(key)
    for v in obj.values():
        if isinstance(v, (dict, list)):
            walk_strip_reviews(v, changed)


def ensure_offer_count(obj, changed, default_count=None):
    if isinstance(obj, list):
        for item in obj:
            ensure_offer_count(item, changed, default_count)
        return
    if not isinstance(obj, dict):
        return
    if obj.get("@type") == "AggregateOffer" and "offerCount" not in obj:
        count = default_count
        if count is None:
            offers = obj.get("offers")
            if isinstance(offers, list) and offers:
                count = len(offers)
            else:
                count = 1
        obj["offerCount"] = int(count)
        changed.append("offerCount=%s" % count)
    for v in obj.values():
        if isinstance(v, (dict, list)):
            ensure_offer_count(v, changed, default_count)


def rewrite_ld_blocks(html, mutator):
    notes = []

    def repl(m):
        open_tag, body, close_tag = m.group(1), m.group(2), m.group(3)
        try:
            data = parse_ld(body)
        except Exception:
            return m.group(0)
        new_data, note = mutator(data)
        if note:
            notes.append(note)
            return open_tag + dump_ld(new_data) + close_tag
        return m.group(0)

    return LD_RE.sub(repl, html), notes


def fix_broken_city_product(path, category, low, high, unit):
    html = path.read_text(encoding="utf-8")
    rel = str(path.relative_to(ROOT)).replace("\\", "/")
    url_path = "/" + rel[:-5] if rel.endswith(".html") else "/" + rel
    url = "https://woodenmax.in" + url_path

    product_name = None
    h1_m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.I | re.S)
    if h1_m:
        product_name = re.sub(r"\s+", " ", strip_tags(html_unescape_light(h1_m.group(1)))).strip()
        if " — " in product_name:
            product_name = product_name.split(" — ")[0].strip()

    desc_m = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']',
        html,
        re.I | re.S,
    )
    description = html_unescape_light(desc_m.group(1)).strip() if desc_m else product_name

    img_m = re.search(
        r'<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']',
        html,
        re.I | re.S,
    )
    image = img_m.group(1).strip() if img_m else "https://woodenmax.in/images/woodenmax-logo.webp"

    product = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product_name or path.stem.replace("-", " ").title(),
        "description": description,
        "image": image,
        "brand": {"@type": "Brand", "name": "WoodenMax", "url": "https://woodenmax.in"},
        "manufacturer": {"@type": "Organization", "name": "WoodenMax"},
        "category": category,
        "offers": {
            "@type": "AggregateOffer",
            "url": url,
            "priceCurrency": "INR",
            "lowPrice": low,
            "highPrice": high,
            "offerCount": 1,
            "availability": "https://schema.org/InStock",
            "priceValidUntil": "2026-12-31",
            "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "priceCurrency": "INR",
                "unitCode": "SQFT",
                "unitText": unit,
                "minPrice": low,
                "maxPrice": high,
            },
        },
    }

    changed = False

    def mutator(data):
        nonlocal changed
        if isinstance(data, dict) and data.get("@type") == "Product" and (
            "headline" in data or "offers" not in data or "name" not in data
        ):
            changed = True
            return product, "replaced broken Product"
        return data, None

    new_html, notes = rewrite_ld_blocks(html, mutator)
    if changed:
        path.write_text(new_html, encoding="utf-8")
        REPORT.append("FIXED Product: %s (%s %s-%s)" % (rel, product_name, low, high))
        return True
    REPORT.append("SKIP Product (no broken block): %s" % rel)
    return False


def fix_frameless_product(path):
    html = path.read_text(encoding="utf-8")
    rel = str(path.relative_to(ROOT)).replace("\\", "/")
    prices = []
    for m in LD_RE.finditer(html):
        try:
            data = parse_ld(m.group(2))
        except Exception:
            continue
        if isinstance(data, dict) and data.get("@type") == "ItemList":
            for el in data.get("itemListElement") or []:
                item = el.get("item", el) if isinstance(el, dict) else None
                if isinstance(item, dict) and item.get("@type") == "Offer" and "price" in item:
                    try:
                        prices.append(float(item["price"]))
                    except Exception:
                        pass
    if not prices:
        REPORT.append("SKIP frameless (no package prices): %s" % rel)
        return False

    low = int(min(prices))
    high = int(max(prices))
    product = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Frameless Shower Partition — Walk-in Glass Enclosure 10mm toughened · hinged or sliding",
        "description": "Frameless walk-in shower partition in 10mm toughened glass — hinged or sliding. Standard-size package band from visible WoodenMax packages.",
        "image": "https://woodenmax.in/images/products/Glass%20Shower%20Partition%20Price/frameless-shower-partition-glass.webp",
        "brand": {"@type": "Brand", "name": "WoodenMax", "url": "https://woodenmax.in"},
        "category": "Bathroom Shower Partitions & Frameless Enclosures",
        "offers": {
            "@type": "AggregateOffer",
            "url": "https://woodenmax.in/products/shower-partitions/frameless-shower-partition",
            "priceCurrency": "INR",
            "lowPrice": low,
            "highPrice": high,
            "offerCount": len(prices),
            "availability": "https://schema.org/InStock",
            "priceValidUntil": "2026-12-31",
        },
    }

    has_product = False
    for m in LD_RE.finditer(html):
        try:
            data = parse_ld(m.group(2))
        except Exception:
            continue
        if isinstance(data, dict) and data.get("@type") == "Product":
            has_product = True
            break

    block = '<script type="application/ld+json">' + dump_ld(product) + "</script>\n"
    if has_product:
        def mutator(data):
            if isinstance(data, dict) and data.get("@type") == "Product":
                return product, "updated frameless Product"
            return data, None
        new_html, notes = rewrite_ld_blocks(html, mutator)
        path.write_text(new_html, encoding="utf-8")
        REPORT.append("UPDATED frameless Product: %s (%s-%s n=%s)" % (rel, low, high, len(prices)))
        return True

    if re.search(r"</head>", html, re.I):
        new_html = re.sub(r"</head>", block + "</head>", html, count=1, flags=re.I)
    else:
        new_html = block + html
    path.write_text(new_html, encoding="utf-8")
    REPORT.append("ADDED frameless Product: %s (%s-%s n=%s)" % (rel, low, high, len(prices)))
    return True


def strip_reviews_file(path):
    html = path.read_text(encoding="utf-8")
    rel = str(path.relative_to(ROOT)).replace("\\", "/")
    file_notes = []

    def mutator(data):
        changed = []
        if (
            isinstance(data, dict)
            and data.get("@type") == "Product"
            and "review" in data
            and "Glass Elevation Price Calculator" in str(data.get("name", ""))
        ):
            data["@type"] = "SoftwareApplication"
            data["applicationCategory"] = "BusinessApplication"
            data["url"] = "https://woodenmax.in/glass-elevation-price-calculator"
            data["offers"] = {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR",
                "description": "Free online estimate tool; final rate after site measurement",
            }
            changed.append("Product->SoftwareApplication+free Offer")
        walk_strip_reviews(data, changed)
        if changed:
            file_notes.append(";".join(changed))
            return data, "stripped reviews"
        return data, None

    new_html, notes = rewrite_ld_blocks(html, mutator)
    if notes:
        path.write_text(new_html, encoding="utf-8")
        REPORT.append("STRIPPED review/agg: %s :: %s" % (rel, file_notes))
        return True
    REPORT.append("SKIP reviews: %s" % rel)
    return False


def add_offer_counts(path):
    html = path.read_text(encoding="utf-8")
    rel = str(path.relative_to(ROOT)).replace("\\", "/")
    file_notes = []

    def mutator(data):
        changed = []
        ensure_offer_count(data, changed)
        if changed:
            file_notes.extend(changed)
            return data, "offerCount"
        return data, None

    new_html, notes = rewrite_ld_blocks(html, mutator)
    if notes:
        path.write_text(new_html, encoding="utf-8")
        REPORT.append("ADDED offerCount: %s :: %s" % (rel, file_notes))
        return True
    REPORT.append("SKIP offerCount: %s" % rel)
    return False


def main():
    alum_cities = [
        "aluminium-window-price-bangalore.html",
        "aluminium-window-price-chandigarh.html",
        "aluminium-window-price-delhi.html",
        "aluminium-window-price-mumbai.html",
        "aluminium-window-price-pune.html",
    ]
    for fname in alum_cities:
        fix_broken_city_product(
            ROOT / "products" / "aluminium-windows" / fname,
            category="Aluminium Windows",
            low=550,
            high=2250,
            unit="per square foot",
        )

    for p in sorted((ROOT / "products" / "glass-elevation").glob("glass-elevation-price-*.html")):
        fix_broken_city_product(
            p,
            category="Glass Elevations",
            low=850,
            high=3400,
            unit="per square foot",
        )

    fix_frameless_product(ROOT / "products" / "shower-partitions" / "frameless-shower-partition.html")

    review_files = [
        ROOT / "glass-elevation-price-calculator.html",
        ROOT / "calculators.html",
    ] + list((ROOT / "city").glob("*.html"))
    for p in review_files:
        if p.exists():
            strip_reviews_file(p)

    offercount_files = [
        ROOT / "products" / "grills" / "window-safety-grills.html",
        ROOT / "products" / "grills" / "balcony-safety-grills.html",
        ROOT / "products" / "grills" / "iron-safety-grills.html",
        ROOT / "products" / "grills" / "aluminium-window-grills.html",
        ROOT / "products" / "grills" / "staircase-balustrade-grills.html",
        ROOT / "products" / "pergola" / "profile-pergola.html",
        ROOT / "products" / "pergola" / "profile-iron-canopy.html",
    ] + list((ROOT / "city").glob("*.html"))
    for p in offercount_files:
        if p.exists():
            add_offer_counts(p)

    print("\n".join(REPORT))
    print("\nTotal report lines: %s" % len(REPORT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
