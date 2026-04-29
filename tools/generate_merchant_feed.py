"""
Generate products-feed.csv for Google Merchant Center from all products/**/*.html
and pricing hints from data/products.json + data-product attributes.

Outputs fields suitable for scheduled fetch URL (e.g. https://woodenmax.in/products-feed.csv).
Google taxonomy: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
"""
from __future__ import annotations

import csv
import hashlib
import html as html_module
import json
import re
from pathlib import Path
from urllib.parse import quote, unquote, urljoin, urlparse, urlunparse

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS_DIR = ROOT / "products"
DATA_JSON = ROOT / "data" / "products.json"
SITE_ORIGIN = "https://woodenmax.in"
# Seller GSTIN (India) — dedicated feed column; not repeated in description.
GSTIN = "36ARWPA9740L1Z3"
BRAND = "Woodenmax"

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
    stem = rel.replace(".html", "")
    first = stem.split("/")[0]
    if first.startswith("grills"):
        return 200
    defaults = {
        "aluminium-windows": 578,
        "telescope-windows": 1447,
        "folding-systems": 2024,
        "metal-louvers": 520,
        "shower-partitions": 405,
        "elevation-cladding": 312,
        "glass-elevation": 800,
        "glass-railing": 289,
        "grills": 200,
        "pergola": 1500,
    }
    return defaults.get(first, 550)


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


def main() -> None:
    lookup = load_price_lookup()
    rows: list[dict] = []
    seen_link: set[str] = set()

    html_files = sorted(PRODUCTS_DIR.rglob("*.html"))
    for path in html_files:
        rel = path.relative_to(PRODUCTS_DIR).as_posix()
        link_path = rel.replace(".html", "")
        link = f"{SITE_ORIGIN}/products/{link_path}"
        if link in seen_link:
            continue
        seen_link.add(link)

        fid = path.stem
        if len(fid) > 50:
            fid = hashlib.sha256(link.encode("utf-8")).hexdigest()[:16]
        text = path.read_text(encoding="utf-8", errors="replace")
        meta = parse_html(text, path.stem)
        img_candidates = collect_product_image_urls(text, rel)
        price_val = lookup.get(meta["data_product"]) or lookup.get(path.stem)
        if price_val is None:
            price_val = lookup.get(path.stem)
        if price_val is None:
            price_val = default_price_for_path(rel)

        title = html_module.unescape(meta["title"])
        if "woodenmax" not in title.lower():
            if len(title) > 120:
                title = title[:117] + "..."
            title = f"{title} | {BRAND}"
        if len(title) > 150:
            title = title[:147] + "..."

        desc = html_module.unescape(meta["description"])
        suffix = (
            f" Indicative ₹/sq.ft from {BRAND} live calculators "
            "(taxes per final quote). Final BOQ after site verification."
        )
        if desc:
            desc = desc + suffix
        else:
            desc = (
                f"Premium architectural product by {BRAND} — online ₹/sq.ft calculator on this page. "
                f"{suffix.strip()}"
            )

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
        extras = [
            u
            for u in img_candidates
            if dedupe_image_key(u) != pk
        ][:EXTRA_IMAGE_CAP]
        additional = ", ".join(extras)

        # sale_price: only when you run a promotion — leave empty so GMC uses `price` as regular price.
        sale_price = ""

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
                "sale_price": sale_price,
                "condition": "new",
                "brand": BRAND,
                "google_product_category": google_product_category_for(rel),
                "product_type": product_type_for(rel),
                "category": category_label_for(rel),
                "gst": GSTIN,
            }
        )

    rows.sort(key=lambda r: (r["product_type"], r["id"]))

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
        "google_product_category",
        "product_type",
        "category",
        "gst",
    ]
    with out_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    print(f"Wrote {len(rows)} rows to {out_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
