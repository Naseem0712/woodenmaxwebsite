"""Audit + fill honest Product/Offer JSON-LD gaps on public product pages."""
from __future__ import annotations

import html as html_lib
import json
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(r"D:\Downloads\woodenmax-live")
BASE = "https://woodenmax.in"
SKIP = {".git", "node_modules", ".wrangler", "GSC", "analysis", "apps", "_tmp_untracked_hold", "SGC ISSUE", "docs", "tools", "components", "partials"}

# Pages that should typically have Product schema (commercial product/PDP/price guides)
PRODUCTISH_PREFIXES = (
    "products/",
)
# Pure hubs often already CollectionPage; still ensure Product children ok.
HUB_FILES = {
    "products/aluminium-windows.html",
    "products/shower-partitions.html",
    "products/pergola.html",
    "products/metal-louvers.html",
    "products/mirror-profiles/index.html",
    "products/folding-systems.html",
    "products/glass-railing.html",
    "products/grills.html",
    "products/elevation-cladding.html",
    "products/glass-elevation.html",
    "products/telescope-windows.html",
}


def unescape(s: str) -> str:
    return html_lib.unescape(s or "").strip()


def clean_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


def extract_title(html: str) -> str:
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
    return clean_ws(unescape(m.group(1))) if m else ""


def extract_h1(html: str) -> str:
    m = re.search(r"<h1\b[^>]*>([\s\S]*?)</h1>", html, re.I)
    if not m:
        return ""
    return clean_ws(unescape(re.sub(r"<[^>]+>", " ", m.group(1))))


def meta_content(html: str, *, name=None, prop=None) -> str:
    if name:
        pats = [
            rf'<meta[^>]+name=["\']{re.escape(name)}["\'][^>]+content=["\']([^"\']*)["\']',
            rf'<meta[^>]+content=["\']([^"\']*)["\'][^>]+name=["\']{re.escape(name)}["\']',
        ]
    else:
        pats = [
            rf'<meta[^>]+property=["\']{re.escape(prop)}["\'][^>]+content=["\']([^"\']*)["\']',
            rf'<meta[^>]+content=["\']([^"\']*)["\'][^>]+property=["\']{re.escape(prop)}["\']',
        ]
    for p in pats:
        m = re.search(p, html, re.I)
        if m:
            return unescape(m.group(1))
    return ""


def canonical_url(html: str, rel: str) -> str:
    m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', html, re.I)
    if not m:
        m = re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']', html, re.I)
    if m:
        return m.group(1).strip()
    if rel.endswith("/index.html"):
        path = "/" + rel[: -len("index.html")]
    elif rel == "index.html":
        path = "/"
    else:
        path = "/" + rel.replace("\\", "/")
        if path.endswith(".html"):
            path = path[:-5]
    return BASE + path


def abs_url(u: str) -> str:
    u = (u or "").strip()
    if not u:
        return ""
    if u.startswith("//"):
        return "https:" + u
    if u.startswith("http"):
        return u
    if not u.startswith("/"):
        u = "/" + u
    return BASE + u


def parse_ld_blocks(html: str) -> list[dict]:
    out = []
    for m in re.finditer(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.I | re.S):
        raw = m.group(1).strip()
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except Exception:
            continue
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    out.append({"data": item, "raw": raw, "span": m.span()})
        elif isinstance(data, dict):
            out.append({"data": data, "raw": raw, "span": m.span()})
    return out


def find_products(blocks: list[dict]) -> list[dict]:
    prods = []
    for b in blocks:
        d = b["data"]
        t = d.get("@type")
        types = t if isinstance(t, list) else [t]
        if any(x == "Product" for x in types):
            prods.append(b)
        # @graph
        for g in d.get("@graph") or []:
            if isinstance(g, dict):
                gt = g.get("@type")
                gtypes = gt if isinstance(gt, list) else [gt]
                if any(x == "Product" for x in gtypes):
                    prods.append({"data": g, "raw": b["raw"], "span": b["span"], "graph_parent": d})
    return prods


def rate_bounds(html: str) -> tuple[float | None, float | None]:
    text = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = unescape(re.sub(r"<[^>]+>", " ", text))
    vals = []
    for m in re.finditer(r"₹\s*([\d,]+)", text):
        try:
            v = float(m.group(1).replace(",", ""))
        except Exception:
            continue
        # ignore tiny artifacts and huge package totals for band; keep sqft-like 200-5000 and package 5k-5L separately
        if 200 <= v <= 8000:
            vals.append(v)
    if not vals:
        return None, None
    return min(vals), max(vals)


def package_prices(html: str) -> list[float]:
    """Detect standard package offer prices if present in ItemList / SSR."""
    prices = []
    for m in re.finditer(r'"price"\s*:\s*"?([\d.]+)"?', html):
        try:
            v = float(m.group(1))
        except Exception:
            continue
        if 1000 <= v <= 500000:
            prices.append(v)
    return prices


def first_image(html: str) -> str:
    img = meta_content(html, prop="og:image") or meta_content(html, name="twitter:image")
    if img:
        return abs_url(img)
    m = re.search(r'<meta[^>]+property=["\']og:image:secure_url["\'][^>]+content=["\']([^"\']+)["\']', html, re.I)
    if m:
        return abs_url(m.group(1))
    # gallery first
    m = re.search(r'<img[^>]+(?:data-src|src)=["\']([^"\']+\.(?:webp|jpg|jpeg|png))["\']', html, re.I)
    if m:
        return abs_url(m.group(1))
    return ""


def product_name(html: str) -> str:
    h1 = extract_h1(html)
    if h1:
        return h1
    title = extract_title(html)
    title = re.sub(r"\s*[|—–-]\s*WoodenMax.*$", "", title, flags=re.I)
    title = re.sub(r"\s*\|\s*(Live Calculator|Live Estimate|Live Cost|Instant Quote|Size & Cost Tool).*$", "", title, flags=re.I)
    return clean_ws(title) or "WoodenMax Product"


def has_visible_faq(html: str) -> bool:
    return bool(re.search(r'class=["\'][^"\']*faq|id=["\']faq|FAQ', html, re.I))


def ensure_product(html: str, rel: str) -> tuple[str, str]:
    """Return (new_html, action)."""
    blocks = parse_ld_blocks(html)
    prods = find_products(blocks)
    url = canonical_url(html, rel)
    name = product_name(html)
    image = first_image(html)
    lo, hi = rate_bounds(html)
    pkgs = package_prices(html)
    desc = meta_content(html, name="description") or name

    def make_offers():
        if pkgs:
            return {
                "@type": "AggregateOffer",
                "priceCurrency": "INR",
                "lowPrice": str(int(min(pkgs))),
                "highPrice": str(int(max(pkgs))),
                "offerCount": str(len(set(int(x) for x in pkgs))),
                "availability": "https://schema.org/InStock",
                "url": url,
            }
        if lo is not None and hi is not None:
            # sqft planning bands — AggregateOffer with unit note in description only
            return {
                "@type": "AggregateOffer",
                "priceCurrency": "INR",
                "lowPrice": str(int(lo)),
                "highPrice": str(int(hi)),
                "offerCount": "1",
                "availability": "https://schema.org/InStock",
                "url": url,
            }
        return None

    if prods:
        # Patch first Product if missing fields
        # Work on raw script replacement for the first product block
        b = prods[0]
        d = dict(b["data"])
        changed = False
        if not d.get("name"):
            d["name"] = name
            changed = True
        if not d.get("image") and image:
            d["image"] = image
            changed = True
        if not d.get("url"):
            d["url"] = url
            changed = True
        if not d.get("description") and desc:
            d["description"] = desc
            changed = True
        # Remove fake aggregateRating / review if somehow present empty? leave existing honest ones
        offers = d.get("offers")
        if not offers:
            off = make_offers()
            if off:
                d["offers"] = off
                changed = True
        else:
            # fill missing offer fields
            if isinstance(offers, dict):
                if not offers.get("priceCurrency"):
                    offers["priceCurrency"] = "INR"
                    changed = True
                if not offers.get("availability"):
                    offers["availability"] = "https://schema.org/InStock"
                    changed = True
                if not offers.get("url"):
                    offers["url"] = url
                    changed = True
                if offers.get("@type") == "AggregateOffer" and not offers.get("offerCount"):
                    offers["offerCount"] = "1"
                    changed = True
                if offers.get("@type") in ("Offer", "AggregateOffer"):
                    if offers.get("@type") == "AggregateOffer":
                        if offers.get("lowPrice") in (None, "", "0") and lo is not None:
                            offers["lowPrice"] = str(int(lo))
                            offers["highPrice"] = str(int(hi or lo))
                            changed = True
                    elif offers.get("price") in (None, "", "0") and lo is not None:
                        offers["price"] = str(int(lo))
                        changed = True
                d["offers"] = offers
        if not changed:
            return html, "OK"
        # replace JSON in script
        new_json = json.dumps(d, ensure_ascii=False, separators=(",", ":"))
        # If product was inside @graph, skip complex rewrite — inject standalone instead if critical missing
        if b.get("graph_parent"):
            # inject patched standalone Product before </head>
            script = f'<script type="application/ld+json">{new_json}</script>'
            if "</head>" in html.lower():
                # case-sensitive replace first </head>
                idx = re.search(r"</head>", html, re.I).start()
                html = html[:idx] + script + "\n" + html[idx:]
                return html, "INJECTED_PATCH"
            return html, "SKIP_GRAPH"
        start, end = b["span"]
        # Replace entire script content carefully
        script_m = re.search(r'(<script[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)', html[start:end], re.I | re.S)
        # Use original span on full html
        full = html[start:end]
        full_m = re.match(r'(<script[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)', full, re.I | re.S)
        if not full_m:
            return html, "SKIP_PARSE"
        # If original script had a list or graph, safer to inject
        try:
            orig_obj = json.loads(full_m.group(2).strip())
        except Exception:
            return html, "SKIP_BADJSON"
        if isinstance(orig_obj, dict) and orig_obj.get("@type") == "Product":
            replaced = full_m.group(1) + new_json + full_m.group(3)
            html = html[:start] + replaced + html[end:]
            return html, "PATCHED"
        # else inject
        script = f'<script type="application/ld+json">{new_json}</script>'
        idx = re.search(r"</head>", html, re.I).start()
        html = html[:idx] + script + "\n" + html[idx:]
        return html, "INJECTED_PATCH"

    # No Product — only add for productish pages with rates/images (not pure guides without prices)
    if not rel.startswith("products/"):
        return html, "SKIP_NONPRODUCT"
    if rel in HUB_FILES or rel.endswith("/index.html") and any(rel.startswith(h.replace("index.html", "")) for h in HUB_FILES):
        # Prefer CollectionPage if missing — light touch
        has_collection = any(
            (b["data"].get("@type") in ("CollectionPage", "ItemList"))
            or ("CollectionPage" in (b["data"].get("@type") if isinstance(b["data"].get("@type"), list) else []))
            for b in blocks
        )
        if has_collection:
            return html, "HUB_OK"
        # If hub has package ItemList already OK
        return html, "HUB_NO_FORCE_PRODUCT"

    off = make_offers()
    if not off and not image:
        return html, "SKIP_NO_RATES"
    product = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": name,
        "description": desc,
        "brand": {"@type": "Brand", "name": "WoodenMax", "url": BASE},
        "url": url,
    }
    if image:
        product["image"] = image
    if off:
        product["offers"] = off
    script = f'<script type="application/ld+json">{json.dumps(product, ensure_ascii=False, separators=(",", ":"))}</script>'
    m = re.search(r"</head>", html, re.I)
    if not m:
        return html, "NO_HEAD"
    html = html[: m.start()] + script + "\n" + html[m.start() :]
    return html, "INJECTED"


def main():
    report = []
    for p in sorted(ROOT.rglob("*.html")):
        if any(x in SKIP for x in p.parts):
            continue
        rel = str(p.relative_to(ROOT)).replace("\\", "/")
        if not (rel.startswith("products/") or rel in ("aluminium-window-price-calculator.html",)):
            continue
        html = p.read_text(encoding="utf-8", errors="ignore")
        new_html, action = ensure_product(html, rel)
        if new_html != html and action in ("PATCHED", "INJECTED", "INJECTED_PATCH"):
            p.write_text(new_html, encoding="utf-8", newline="\n")
        # post status
        blocks = parse_ld_blocks(new_html if new_html != html else html)
        prods = find_products(blocks)
        missing = []
        if prods:
            d = prods[0]["data"]
            if not d.get("name"):
                missing.append("name")
            if not d.get("image"):
                missing.append("image")
            if not d.get("offers"):
                missing.append("offers")
        else:
            if rel.startswith("products/") and rel not in HUB_FILES and "/index.html" not in rel:
                missing.append("Product")
        report.append({"file": rel, "action": action, "missing_after": missing, "has_product": bool(prods)})

    out = ROOT / "tools" / "_serp_schema_fill_report.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    patched = sum(1 for r in report if r["action"] in ("PATCHED", "INJECTED", "INJECTED_PATCH"))
    still = [r for r in report if r["missing_after"]]
    print(f"product_pages={len(report)} schema_writes={patched} still_gaps={len(still)}")
    for r in still[:25]:
        print(r["file"], r["action"], r["missing_after"])


if __name__ == "__main__":
    main()
