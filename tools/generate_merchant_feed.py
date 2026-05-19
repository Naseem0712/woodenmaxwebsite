"""
Generate products-feed.csv for Google Merchant Center.

Source of truth for price (in order):
  1.  Per-product override in PRICE_OVERRIDES below (when title says one
      thing but a slightly different rate is the canonical starting MRP).
  2.  Price band parsed from the <title>: "₹350-450/sqft" → 350,
      "₹22K-99K" → 22000, "₹950+/sqft" → 950.
  3.  Same regex against <meta description>.
  4.  data/products.json `rates.baseRate` (matched by id or slug).
  5.  Per-category fallback (LAST resort — flag in stderr).

This avoids the previous bug where the whole grill folder shared
the `200.00 INR` default, all pergolas shared `1500.00 INR`, etc.

Other fixes vs. previous version:
  - Titles are truncated at the nearest ` | ` / ` — ` boundary before
    150 chars, never mid-word with `...`.
  - `| Woodenmax` is only appended when not already present.
  - Adds GMC-recommended fields: identifier_exists, shipping,
    custom_label_0, custom_label_1, custom_label_2.
  - Deduplicates by `title` (case-insensitive) — second occurrence is
    dropped with a stderr warning so editorial conflicts surface.
  - Outputs `id` from page slug, kept stable so GMC re-uses click data.

Outputs fields suitable for scheduled fetch URL (e.g. https://woodenmax.in/products-feed.csv).
Google taxonomy: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
"""
from __future__ import annotations

import csv
import hashlib
import html as html_module
import json
import re
import sys
from pathlib import Path
from urllib.parse import quote, unquote, urljoin, urlparse, urlunparse

# Force UTF-8 stdout so ₹ / ⚠ / em-dashes in our progress logs survive
# Windows cp1252 consoles.
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except (AttributeError, OSError):
    pass

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS_DIR = ROOT / "products"
DATA_JSON = ROOT / "data" / "products.json"
SITE_ORIGIN = "https://woodenmax.in"
# Tax / GSTIN: add in Merchant Center → Business settings (not in product feed).
BRAND = "Woodenmax"

# ----------------------------------------------------------------------
# Per-product price overrides (₹/sqft or ₹/piece).  Only fill in when
# the title-parsed minimum is wrong (e.g. the canonical sell price
# differs from the rate band in the meta description).  Most pages do
# NOT need an entry here — title parsing handles them.
# ----------------------------------------------------------------------
PRICE_OVERRIDES: dict[str, int] = {
    # slug -> starting INR price
    # (intentionally empty — populate only on editorial demand)
}

# ----------------------------------------------------------------------
# Pages that look like products on the website but are actually
# guides / comparisons / calculators / info-style content.  Google
# Merchant Center will disapprove these as "non-product content",
# so we keep them on the site (great for SEO) but exclude from the feed.
#
# Match is performed on the page slug (filename without .html).
# ----------------------------------------------------------------------
SKIP_FROM_FEED_PATTERNS = [
    re.compile(r"-price-calculator$"),
    re.compile(r"-price-breakdown$"),
    re.compile(r"-price-per-sqft$"),
    re.compile(r"-vs-"),                 # comparisons
    re.compile(r"^what-is-"),
    re.compile(r"^best-.*-for-home$"),
    re.compile(r"-maintenance$"),
    re.compile(r"-thickness$"),
    re.compile(r"-types$"),
    re.compile(r"-glass-options$"),
    re.compile(r"-tools-guide$"),
    re.compile(r"-brands-india$"),
    re.compile(r"-design-price$"),       # design idea articles
    re.compile(r"^small-.*-design$"),
    re.compile(r"-installation$"),       # installation cost / process pages
    re.compile(r"-installation-cost$"),
]
SKIP_FROM_FEED_EXACT = {
    # explicit one-offs that don't fit a clean pattern
    "shower-curtain-vs-glass-partition",
    "corner-shower-partition-price",
    "fixed-glass-shower-panel-price",
    "frameless-glass-shower-price",
    "glass-shower-partition-price",
    "shower-enclosure-price",
    "sliding-shower-door-price",
    "walk-in-shower-glass-price",
    "system-window-for-villa",
    "full-elevation-villa-facade",
}


def should_skip_for_feed(slug: str) -> bool:
    """True if the page is an info / guide / calculator (not a product)."""
    if slug in SKIP_FROM_FEED_EXACT:
        return True
    for pat in SKIP_FROM_FEED_PATTERNS:
        if pat.search(slug):
            return True
    return False

# Google product category IDs (verified against Google taxonomy-with-ids.en-US.txt)
GPC_WINDOWS = "124"  # Hardware > Building Materials > Windows
GPC_HOME_DOORS = "4634"  # Hardware > Building Materials > Doors > Home Doors
GPC_DOORS = "119"  # Hardware > Building Materials > Doors (parent)
GPC_SHOWER_DOORS = "1779"  # ... > Shower Doors & Enclosures
GPC_RAILINGS = "499949"  # Hardware > Building Materials > Handrails & Railing Systems
GPC_SIDING = "503775"  # Hardware > Building Materials > Siding
GPC_FENCE_PANELS = "502973"  # Hardware > Fencing & Barriers > Fence Panels
GPC_PERGOLA = "703"  # ... > Garden Arches, Trellises, Arbors & Pergolas

OG_IMAGE_RE = re.compile(
    r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']',
    re.I,
)
TITLE_RE = re.compile(r"<title>([^<]+)</title>", re.I)
DESC_RE = re.compile(
    r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)["\']',
    re.I,
)
DATA_PRODUCT_RE = re.compile(r'data-product=["\']([^"\']+)["\']')
IMG_SRC_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.I)
IMG_DATA_SRC_RE = re.compile(
    r"<img[^>]*?\b(?:data-src|data-lazy-src)=[\"']([^\"']+)[\"']", re.I
)
IMG_SRCSET_RE = re.compile(r"<img[^>]*?\bsrcset=[\"']([^\"']+)[\"']", re.I)
LINK_TAG_RE = re.compile(r"<link\b([^>]+)>", re.I)
CSS_BG_URL_RE = re.compile(
    r"background-image\s*:\s*url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", re.I
)
# JSON may escape slashes: https:\/\/woodenmax.in\/images\/...
JSONLD_IMG_ESC_RE = re.compile(
    r"https:\\/\\/woodenmax\.in\\/images\\/[^\"\\]+",
    re.I,
)
# Allow spaces in paths (many og:image filenames); end at quotes or angle brackets.
ABS_IMG_RE = re.compile(r'https://woodenmax\.in/images/[^"\'<>]+', re.I)

SCAN_CHARS = 350_000
EXTRA_IMAGE_CAP = 10


def min_numeric_from_rates(rates: dict) -> int | None:
    """Best-effort minimum ₹/sq.ft (or primary rate) from a product rates blob."""
    if not isinstance(rates, dict):
        return None
    if "baseRate" in rates and isinstance(rates["baseRate"], (int, float)):
        return int(rates["baseRate"])
    if "baseGlassRate" in rates and isinstance(rates["baseGlassRate"], (int, float)):
        return int(rates["baseGlassRate"])
    if "glassRate" in rates and isinstance(rates["glassRate"], (int, float)):
        return int(rates["glassRate"])
    nums: list[int] = []
    hinged = rates.get("hinged")
    if isinstance(hinged, dict) and "glassRate" in hinged:
        nums.append(int(hinged["glassRate"]))
    sliding = rates.get("sliding")
    if isinstance(sliding, dict) and "glassRate" in sliding:
        nums.append(int(sliding["glassRate"]))
    commercial = rates.get("commercial")
    if isinstance(commercial, dict):
        for thk, row in commercial.items():
            if isinstance(row, dict):
                for _, v in row.items():
                    if isinstance(v, (int, float)):
                        nums.append(int(v))
    frg = rates.get("frGradeB")
    if isinstance(frg, dict):
        for _, row in frg.items():
            if isinstance(row, dict) and "plain" in row:
                v = row["plain"]
                if isinstance(v, (int, float)):
                    nums.append(int(v))
            elif isinstance(row, (int, float)):
                nums.append(int(row))
    brands = rates.get("brands")
    if isinstance(brands, dict):
        for b in brands.values():
            if isinstance(b, dict) and "ratePerSqft" in b:
                v = b["ratePerSqft"]
                if isinstance(v, (int, float)):
                    nums.append(int(v))
    return min(nums) if nums else None


def load_price_lookup() -> dict[str, int]:
    """Map product id (data-product) and slug to indicative minimum ₹/sq.ft."""
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    out: dict[str, int] = {}
    for p in data.get("products", []):
        if not isinstance(p, dict):
            continue
        pid = p.get("id")
        slug = p.get("slug")
        rates = p.get("rates") or {}
        m = min_numeric_from_rates(rates)
        if m is None:
            continue
        if isinstance(pid, str):
            out[pid] = m
        if isinstance(slug, str):
            out[slug] = m
    return out


def default_price_for_path(rel: str) -> int:
    """Last-resort starting price per category, aligned to live hub minimums."""
    stem = rel.replace(".html", "")
    first = stem.split("/")[0]
    if first.startswith("grills"):
        return 200      # iron-safety-grill ₹200-300 is cheapest grill
    defaults = {
        "aluminium-windows":  550,     # hub: ₹550-2250
        "telescope-windows":  1650,    # hub: ₹1650-2250
        "folding-systems":    1550,    # hub: ₹1550-2850
        "metal-louvers":      520,     # wooden-finish base
        "shower-partitions":  440,     # hub: ₹440-1320
        "elevation-cladding": 312,     # 3mm ACP base
        "glass-elevation":    800,     # hub: ₹800-1200
        "glass-railing":      1850,    # balcony glass railing ₹1850/rft min
        "grills":             200,
        "pergola":            1500,
    }
    return defaults.get(first, 550)


# ----------------------------------------------------------------------
# Price extraction from title / meta-description
# ----------------------------------------------------------------------

# Matches: ₹350-450, ₹350–450, ₹350—450, ₹1,200-1,400, ₹1850-2250
_PRICE_RANGE_RE = re.compile(
    r"₹\s*([\d,]+)\s*[-–—]\s*₹?\s*([\d,]+)"
)
# Matches: ₹22K-99K, ₹22,000-99,000  (k/K means thousands)
_PRICE_RANGE_K_RE = re.compile(
    r"₹\s*(\d+)\s*K\s*[-–—]\s*₹?\s*(\d+)\s*K",
    re.I,
)
# Matches: ₹950+, ₹1500+ , ₹132+/sqft  → start from that number
_PRICE_PLUS_RE = re.compile(r"₹\s*([\d,]+)\s*\+")
# Matches: ₹554/sqft, ₹601/sqft  (single fixed value)
_PRICE_FIXED_RE = re.compile(
    r"₹\s*([\d,]+)\s*/\s*(?:sqft|rft|sft|sq\.?\s*ft)",
    re.I,
)
# Matches: 1,80,000–2,10,000 (Indian comma format ranges)
_PRICE_BIG_RANGE_RE = re.compile(
    r"₹\s*([\d,]{5,})\s*[-–—]\s*₹?\s*([\d,]{5,})"
)


def _to_int(s: str) -> int | None:
    try:
        return int(s.replace(",", "").strip())
    except (ValueError, AttributeError):
        return None


def extract_price_from_text(text: str) -> int | None:
    """Return the lowest INR figure mentioned as a starting/from price.

    Prefers small range bands first (₹350-450/sqft), then K-bands,
    then fixed (₹554/sqft), then '+' open bands, then large project
    ranges.  This biases toward the per-sqft figure that Google Shopping
    expects rather than a 6-figure total.
    """
    candidates: list[int] = []

    for m in _PRICE_RANGE_RE.finditer(text):
        lo = _to_int(m.group(1))
        if lo is not None and 50 <= lo <= 50_000:
            candidates.append(lo)
    for m in _PRICE_RANGE_K_RE.finditer(text):
        lo = _to_int(m.group(1))
        if lo is not None:
            candidates.append(lo * 1000)
    for m in _PRICE_FIXED_RE.finditer(text):
        v = _to_int(m.group(1))
        if v is not None and 50 <= v <= 50_000:
            candidates.append(v)
    for m in _PRICE_PLUS_RE.finditer(text):
        v = _to_int(m.group(1))
        if v is not None and 50 <= v <= 50_000:
            candidates.append(v)
    if not candidates:
        for m in _PRICE_BIG_RANGE_RE.finditer(text):
            lo = _to_int(m.group(1))
            if lo is not None and lo >= 10_000:
                candidates.append(lo)

    return min(candidates) if candidates else None


# ----------------------------------------------------------------------
# Title cleanup
# ----------------------------------------------------------------------

_MAX_TITLE = 150          # GMC hard cap is 150
_SOFT_TITLE = 140         # leave breathing room for `| Woodenmax`
_SEPARATORS = (" | ", " — ", " – ", " - ", " · ")


def clean_title(raw: str) -> str:
    """Sanitise an HTML <title> for the Merchant feed.

    - Collapses whitespace.
    - Removes redundant `( … )` aliases when title is already long.
    - Truncates at the last clause boundary (` | `, ` — `, …) BEFORE the
      soft cap so we never break mid-word with `...`.
    - Appends ` | Woodenmax` only when brand isn't already present.
    """
    t = html_module.unescape(raw or "").strip()
    t = re.sub(r"\s+", " ", t)

    if len(t) > _SOFT_TITLE:
        # Drop parenthetical aliases if they push us over
        t_alt = re.sub(r"\s*\([^)]*\)", "", t).strip()
        if 30 < len(t_alt) <= _SOFT_TITLE:
            t = t_alt

    if len(t) > _MAX_TITLE:
        best_cut = -1
        for sep in _SEPARATORS:
            idx = t.rfind(sep, 0, _SOFT_TITLE)
            if idx > best_cut:
                best_cut = idx
        if best_cut > 30:
            t = t[:best_cut].rstrip()
        else:
            # No good clause break — cut at last word boundary
            cut = t.rfind(" ", 0, _SOFT_TITLE)
            if cut > 30:
                t = t[:cut].rstrip()
            else:
                t = t[:_SOFT_TITLE].rstrip()

    if "woodenmax" not in t.lower():
        joined = f"{t} | {BRAND}"
        if len(joined) <= _MAX_TITLE:
            t = joined

    return t[:_MAX_TITLE]


def folder_key(rel: str) -> str:
    stem = rel.replace(".html", "")
    parts = stem.split("/")
    cat = parts[0]
    if cat.startswith("grills"):
        return "grills"
    return cat


def product_type_for(rel: str) -> str:
    """Merchant-friendly product_type (your shop taxonomy)."""
    key = folder_key(rel)
    mapping = {
        "aluminium-windows": "Home & Garden > Building Materials > Windows",
        "telescope-windows": "Home & Garden > Building Materials > Doors",
        "folding-systems": "Home & Garden > Building Materials > Doors",
        "metal-louvers": "Home & Garden > Building Materials > Facade Louvers",
        "shower-partitions": "Home & Garden > Bathroom > Shower Partitions",
        "elevation-cladding": "Home & Garden > Building Materials > Cladding & Facade",
        "glass-elevation": "Home & Garden > Building Materials > Glass Facade & Windows",
        "glass-railing": "Home & Garden > Building Materials > Glass Railings",
        "grills": "Home & Garden > Building Materials > Safety Grills",
        "pergola": "Home & Garden > Outdoor Living > Pergolas",
    }
    return mapping.get(key, "Home & Garden > Building Materials")


def category_label_for(rel: str) -> str:
    """Short bucket for reports / humans (Home, Windows, Doors, …)."""
    key = folder_key(rel)
    labels = {
        "aluminium-windows": "Home > Windows & Façade",
        "glass-elevation": "Home > Glass Elevation",
        "telescope-windows": "Home > Doors & Partitions",
        "folding-systems": "Home > Folding Doors",
        "metal-louvers": "Home > Louvers & Façade",
        "elevation-cladding": "Home > Cladding & ACP/HPL",
        "shower-partitions": "Home > Bathroom Shower",
        "glass-railing": "Home > Glass Railing",
        "grills": "Home > Safety Grills",
        "pergola": "Home > Pergola Outdoor",
    }
    return labels.get(key, "Home > Building Materials")


def google_product_category_for(rel: str) -> str:
    """Google Merchant `google_product_category` numeric ID."""
    key = folder_key(rel)
    gpc = {
        "aluminium-windows": GPC_WINDOWS,
        "glass-elevation": GPC_WINDOWS,
        "telescope-windows": GPC_HOME_DOORS,
        "folding-systems": GPC_HOME_DOORS,
        "metal-louvers": GPC_SIDING,
        "elevation-cladding": GPC_SIDING,
        "shower-partitions": GPC_SHOWER_DOORS,
        "glass-railing": GPC_RAILINGS,
        "grills": GPC_FENCE_PANELS,
        "pergola": GPC_PERGOLA,
    }
    return gpc.get(key, GPC_DOORS)


def products_page_base_url(rel: str) -> str:
    """HTTPS base for resolving relative <img src> — mirrors /products/<path>/ on the live site."""
    stem = rel.replace(".html", "").strip("/")
    parts = stem.split("/")
    if len(parts) >= 2:
        parent = "/".join(parts[:-1])
        return f"{SITE_ORIGIN}/products/{parent}/"
    return f"{SITE_ORIGIN}/products/"


def abs_img_url(src: str, rel: str) -> str | None:
    src = src.strip()
    if not src or src.startswith("data:"):
        return None
    if re.match(r"^[a-zA-Z]:[/\\]", src) or src.lower().startswith("file:"):
        return None
    if src.startswith("//"):
        return "https:" + src
    if src.startswith("http://") or src.startswith("https://"):
        if re.match(r"^https?://[^/]+/[a-zA-Z]:[/\\]", src):
            return None
        return src.split("#")[0]
    base = products_page_base_url(rel)
    out = urljoin(base, src.split("#")[0])
    if not out.startswith(SITE_ORIGIN):
        return None
    return out.split("#")[0]


def dedupe_image_key(url: str) -> str:
    return url.split("?")[0].rstrip("/").lower()


def should_skip_image_url(url: str) -> bool:
    low = url.lower()
    if "woodenmax-logo" in low or "/icons/" in low:
        return True
    if low.endswith(".svg"):
        return True
    if "/images/" not in low:
        return True
    return False


def normalize_feed_image_url(url: str) -> str:
    """Percent-encode path so Merchant Center can fetch (spaces, unicode, en-dashes in filenames)."""
    u = html_module.unescape(url.strip())
    u = u.rstrip(",.;)")
    u = u.split("#")[0]
    if not u.startswith("http"):
        return u
    p = urlparse(u)
    if not p.netloc:
        return u
    host = p.netloc.lower()
    if host.startswith("www.woodenmax.in"):
        host = "woodenmax.in"
    scheme = "https" if "woodenmax.in" in host else p.scheme
    raw_path = unquote(p.path)
    enc_path = quote(raw_path, safe="/")
    return urlunparse((scheme, host, enc_path, "", p.query, ""))


def resolve_product_image(raw: str, rel: str) -> str | None:
    raw_st = html_module.unescape(raw.strip()).rstrip(",.;)")
    if not raw_st or raw_st.startswith("data:"):
        return None
    if raw_st.startswith("//"):
        raw_st = "https:" + raw_st
    if raw_st.startswith("http://") or raw_st.startswith("https://"):
        p = urlparse(raw_st)
        if "woodenmax.in" not in p.netloc.lower():
            return None
        out = normalize_feed_image_url(raw_st)
    else:
        out_u = abs_img_url(raw_st, rel)
        if not out_u:
            return None
        out = normalize_feed_image_url(out_u)
    if should_skip_image_url(out):
        return None
    return out


def collect_product_image_urls(text: str, rel: str) -> list[str]:
    """Ordered unique on-site product images: visible imgs, srcset, JSON-LD, preload, CSS backgrounds."""
    blob = text[:SCAN_CHARS]
    seen: set[str] = set()
    out: list[str] = []

    def push(raw: str) -> None:
        u = resolve_product_image(raw, rel)
        if not u:
            return
        k = dedupe_image_key(u)
        if k in seen:
            return
        seen.add(k)
        out.append(u)

    for m in JSONLD_IMG_ESC_RE.finditer(blob):
        push(m.group(0).replace("\\/", "/"))
    for m in ABS_IMG_RE.finditer(blob):
        push(m.group(0))
    for m in IMG_SRC_RE.finditer(blob):
        push(m.group(1))
    for m in IMG_DATA_SRC_RE.finditer(blob):
        push(m.group(1))
    for m in IMG_SRCSET_RE.finditer(blob):
        for part in m.group(1).split(","):
            tok = part.strip().split()
            if tok:
                push(tok[0])
    for m in LINK_TAG_RE.finditer(blob):
        inner = m.group(1)
        if "preload" not in inner.lower():
            continue
        if not re.search(r'\bas\s*=\s*["\']image["\']', inner, re.I):
            continue
        hm = re.search(r'\bhref\s*=\s*["\']([^"\']+)["\']', inner, re.I)
        if hm:
            push(hm.group(1))
    for m in CSS_BG_URL_RE.finditer(blob):
        push(m.group(1))
    return out


def parse_html(text: str, stem: str) -> dict:
    head = text[:20000]
    og = OG_IMAGE_RE.search(head)
    image = og.group(1).strip() if og else ""
    if image and image.startswith("/"):
        image = SITE_ORIGIN + image
    tit = TITLE_RE.search(head)
    title = (tit.group(1).strip() if tit else stem.replace("-", " ").title())
    title = re.sub(r"\s+", " ", title)
    d = DESC_RE.search(head)
    desc = (d.group(1).strip() if d else "")[:4900]
    dp_match = DATA_PRODUCT_RE.search(text)
    data_product = dp_match.group(1).strip() if dp_match else ""
    return {"title": title, "description": desc, "image": image, "data_product": data_product}


def _xml_escape(s: str) -> str:
    return (
        str(s)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def write_xml_feed(rows: list[dict]) -> None:
    """Write products-feed.xml (Atom + Google Merchant namespace) from the same rows."""
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    out: list[str] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">',
        '  <title>WoodenMax Products — Aluminium Windows, Glass Facades, Pergolas & More</title>',
        f'  <link href="{SITE_ORIGIN}"/>',
        f'  <link href="{SITE_ORIGIN}/products-feed.xml" rel="self"/>',
        f'  <updated>{now}</updated>',
    ]
    for r in rows:
        out.append("  <entry>")
        out.append(f'    <g:id>{_xml_escape(r["id"])}</g:id>')
        out.append(f'    <g:title>{_xml_escape(r["title"])}</g:title>')
        out.append(f'    <g:description>{_xml_escape(r["description"])}</g:description>')
        out.append(f'    <g:link>{_xml_escape(r["link"])}</g:link>')
        out.append(f'    <g:image_link>{_xml_escape(r["image_link"])}</g:image_link>')
        if r.get("additional_image_link"):
            for img in [u.strip() for u in r["additional_image_link"].split(",") if u.strip()][:10]:
                out.append(f'    <g:additional_image_link>{_xml_escape(img)}</g:additional_image_link>')
        out.append(f'    <g:price>{_xml_escape(r["price"])}</g:price>')
        out.append(f'    <g:availability>{_xml_escape(r["availability"])}</g:availability>')
        out.append(f'    <g:condition>{_xml_escape(r["condition"])}</g:condition>')
        out.append(f'    <g:brand>{_xml_escape(r["brand"])}</g:brand>')
        out.append(f'    <g:identifier_exists>{_xml_escape(r["identifier_exists"])}</g:identifier_exists>')
        out.append(f'    <g:google_product_category>{_xml_escape(r["google_product_category"])}</g:google_product_category>')
        out.append(f'    <g:product_type>{_xml_escape(r["product_type"])}</g:product_type>')
        out.append(f'    <g:shipping>')
        out.append(f'      <g:country>IN</g:country>')
        out.append(f'      <g:service>Standard</g:service>')
        out.append(f'      <g:price>0.00 INR</g:price>')
        out.append(f'    </g:shipping>')
        for i in range(5):
            key = f"custom_label_{i}"
            val = r.get(key, "")
            if val:
                out.append(f'    <g:{key}>{_xml_escape(val)}</g:{key}>')
        out.append("  </entry>")
    out.append("</feed>")
    out.append("")
    (ROOT / "products-feed.xml").write_text("\n".join(out), encoding="utf-8")


def _resolve_price(
    *,
    slug: str,
    data_product: str,
    title: str,
    description: str,
    rel: str,
    lookup: dict[str, int],
    log: list[str],
) -> tuple[int, str]:
    """Return (price, source) for a product page.

    Source is one of: 'override', 'title', 'desc', 'json', 'fallback'.
    """
    if slug in PRICE_OVERRIDES:
        return PRICE_OVERRIDES[slug], "override"

    p_title = extract_price_from_text(title)
    if p_title is not None:
        return p_title, "title"

    p_desc = extract_price_from_text(description)
    if p_desc is not None:
        return p_desc, "desc"

    p_json = lookup.get(data_product) or lookup.get(slug)
    if p_json is not None:
        return p_json, "json"

    log.append(f"⚠ fallback price for {rel} (no ₹ in title/desc, not in products.json)")
    return default_price_for_path(rel), "fallback"


def main() -> None:
    lookup = load_price_lookup()
    rows: list[dict] = []
    seen_link: set[str] = set()
    seen_title: dict[str, str] = {}   # title_lower → first slug
    fallback_log: list[str] = []
    price_source_counts: dict[str, int] = {}

    skipped_info_pages: list[str] = []
    html_files = sorted(PRODUCTS_DIR.rglob("*.html"))
    for path in html_files:
        rel = path.relative_to(PRODUCTS_DIR).as_posix()
        link_path = rel.replace(".html", "")
        link = f"{SITE_ORIGIN}/products/{link_path}"
        if link in seen_link:
            continue
        seen_link.add(link)

        if should_skip_for_feed(path.stem):
            skipped_info_pages.append(rel)
            continue

        fid = path.stem
        if len(fid) > 50:
            fid = hashlib.sha256(link.encode("utf-8")).hexdigest()[:16]
        text = path.read_text(encoding="utf-8", errors="replace")
        meta = parse_html(text, path.stem)

        title = clean_title(meta["title"])

        raw_desc = html_module.unescape(meta["description"] or "").strip()
        raw_desc = re.sub(r"\s+", " ", raw_desc)
        # Avoid double Woodenmax suffix if description already names us
        if "woodenmax" in raw_desc.lower() and "calculator" in raw_desc.lower():
            desc = raw_desc
        else:
            suffix = (
                f"Indicative ₹/sq.ft from {BRAND} live calculators "
                "(taxes per final quote). Final BOQ after site verification."
            )
            desc = f"{raw_desc} {suffix}".strip() if raw_desc else (
                f"Premium architectural product by {BRAND} — live ₹/sq.ft calculator on this page. "
                f"{suffix}"
            )
        desc = desc[:4990]

        price_val, price_src = _resolve_price(
            slug=path.stem,
            data_product=meta["data_product"],
            title=title,
            description=desc,
            rel=rel,
            lookup=lookup,
            log=fallback_log,
        )
        price_source_counts[price_src] = price_source_counts.get(price_src, 0) + 1

        # ---------- duplicate-title check ----------
        norm_t = title.lower()
        if norm_t in seen_title:
            print(
                f"⚠ duplicate title (kept first): '{title[:80]}…'  "
                f"first={seen_title[norm_t]}  dropped={path.stem}",
                file=sys.stderr,
            )
            continue
        seen_title[norm_t] = path.stem

        img_candidates = collect_product_image_urls(text, rel)
        logo_fallback = normalize_feed_image_url(f"{SITE_ORIGIN}/images/woodenmax-logo.png")
        og_raw = (meta["image"] or "").strip()
        if og_raw.startswith("/"):
            og_raw = SITE_ORIGIN + og_raw
        primary_og = normalize_feed_image_url(og_raw) if og_raw else ""
        if primary_og and should_skip_image_url(primary_og):
            primary_og = ""

        if primary_og and "woodenmax-logo" not in primary_og.lower():
            image = primary_og
        elif img_candidates:
            image = img_candidates[0]
        else:
            image = logo_fallback

        pk = dedupe_image_key(image)
        extras = [u for u in img_candidates if dedupe_image_key(u) != pk][:EXTRA_IMAGE_CAP]
        additional = ", ".join(extras)

        cat_key = folder_key(rel)
        # custom_label_0 = top silo (for Shopping ad-group segmentation)
        # custom_label_1 = price band  (Budget / Mid / Premium / Luxury)
        # custom_label_2 = unit       (sqft / rft / piece / project)
        if price_val < 400:
            band = "budget"
        elif price_val < 1000:
            band = "mid"
        elif price_val < 2200:
            band = "premium"
        else:
            band = "luxury"
        unit = "rft" if cat_key == "glass-railing" else (
            "project" if cat_key == "pergola" and price_val > 5000 else "sqft"
        )

        rows.append(
            {
                "id": fid,
                "title": title,
                "description": desc,
                "link": link,
                "image_link": image,
                "additional_image_link": additional,
                "availability": "in stock",
                "price": f"{float(price_val):.2f} INR",
                "sale_price": "",        # only set during a real promo
                "condition": "new",
                "brand": BRAND,
                "gtin": "",              # custom-fabricated — no UPC
                "mpn": "",
                "identifier_exists": "no",
                "google_product_category": google_product_category_for(rel),
                "product_type": product_type_for(rel),
                "category": category_label_for(rel),
                "shipping": "IN::Standard:0.00 INR",   # delivered free PAN-India for qualifying orders
                "shipping_weight": "",
                "custom_label_0": cat_key,
                "custom_label_1": band,
                "custom_label_2": unit,
                "custom_label_3": "live-calculator",
                "custom_label_4": "2026",
            }
        )

    rows.append(
        {
            "id": "pricing-api-calculate",
            "title": f"WoodenMax Live Pricing API | {BRAND} Aluminium Calculator",
            "description": (
                "Public pricing API for aluminium windows, louvers, and mirror profiles. "
                "Pass width, height, product id — get JSON breakdown with GST. "
                f"Powered by {BRAND} Pricing Engine v1.0."
            )[:4990],
            "link": f"{SITE_ORIGIN}/api/calculate",
            "image_link": f"{SITE_ORIGIN}/images/og-default.webp",
            "additional_image_link": "",
            "availability": "in stock",
            "price": "578.00 INR",
            "sale_price": "",
            "condition": "new",
            "brand": BRAND,
            "gtin": "",
            "mpn": "",
            "identifier_exists": "no",
            "google_product_category": "Hardware > Building Materials",
            "product_type": "Services > Pricing API",
            "category": "Pricing API",
            "shipping": "IN::Standard:0.00 INR",
            "shipping_weight": "",
            "custom_label_0": "pricing-api",
            "custom_label_1": "tool",
            "custom_label_2": "api",
            "custom_label_3": "live-calculator",
            "custom_label_4": "2026",
        }
    )

    rows.sort(key=lambda r: (r["product_type"], r["id"]))

    write_xml_feed(rows)

    out_path = ROOT / "products-feed.csv"
    fieldnames = [
        "id",
        "title",
        "description",
        "link",
        "image_link",
        "additional_image_link",
        "availability",
        "price",
        "sale_price",
        "condition",
        "brand",
        "gtin",
        "mpn",
        "identifier_exists",
        "google_product_category",
        "product_type",
        "category",
        "shipping",
        "shipping_weight",
        "custom_label_0",
        "custom_label_1",
        "custom_label_2",
        "custom_label_3",
        "custom_label_4",
    ]
    with out_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    print(f"Wrote {len(rows)} rows to {out_path.relative_to(ROOT)}")
    print("Price source distribution:")
    for src in ("override", "title", "desc", "json", "fallback"):
        n = price_source_counts.get(src, 0)
        print(f"  {src:<9} : {n}")
    if fallback_log:
        print("\nFallback-priced pages (consider adding ₹ in title or PRICE_OVERRIDES):")
        for line in fallback_log:
            print(" ", line)
    if skipped_info_pages:
        print(f"\nExcluded {len(skipped_info_pages)} info / guide / comparison pages "
              "(kept on site, not in Merchant feed):")
        for p in skipped_info_pages:
            print(f"  - {p}")


if __name__ == "__main__":
    main()
