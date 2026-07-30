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
    "system-window-for-villa",
    "full-elevation-villa-facade",
}

# Shower SEO price landings: real calculators + canonical on site root — keep in feed.
SHOWER_PRICE_LANDING_SLUGS = frozenset({
    "corner-shower-partition-price",
    "fixed-glass-shower-panel-price",
    "frameless-glass-shower-price",
    "glass-shower-partition-price",
    "shower-enclosure-price",
    "sliding-shower-door-price",
    "walk-in-shower-glass-price",
})


def should_skip_for_feed(slug: str) -> bool:
    """True if the page is an info / guide / calculator (not a product)."""
    if slug in SHOWER_PRICE_LANDING_SLUGS:
        return False
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
GPC_MIRRORS = "595"  # Home & Garden > Decor > Mirrors

CANONICAL_RE = re.compile(
    r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)["\']',
    re.I,
)

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
IMAGE_STOP_TOKENS = frozenset({
    "price", "india", "aluminium", "aluminum", "window", "windows", "glass",
    "door", "doors", "the", "and", "for", "with", "per", "sqft", "rft",
    "product", "products", "modern", "design", "premium", "home", "bathroom",
    "partition", "partitions",
})
DATA_IMAGE_RE = re.compile(r"""data-image=["']([^"']+)["']""", re.I)
MAIN_IMAGE_RE = re.compile(
    r"""id=["']product-main-image["'][^>]*src=["']([^"']+)["']"""
    r"""|src=["']([^"']+)["'][^>]*id=["']product-main-image["']""",
    re.I,
)

# Verified on-disk product heroes — used when og:image / page imgs 404 on deploy.
SILO_FALLBACK_IMAGES: dict[str, str] = {
    "aluminium-windows": (
        f"{SITE_ORIGIN}/images/products/2 Track Aluminium Window/"
        "2-track-aluminium-sliding-window-modern-home.webp"
    ),
    "glass-elevation": (
        f"{SITE_ORIGIN}/images/products/Glazing/architectural-glass-elevation.webp"
    ),
    "elevation-cladding": (
        f"{SITE_ORIGIN}/images/products/elevation-cladding/"
        "hpl-acp-elevation-house-cladding.webp"
    ),
    "grills": (
        f"{SITE_ORIGIN}/images/products/Grills/aluminium-window-grill-design-modern.webp"
    ),
    "metal-louvers": (
        f"{SITE_ORIGIN}/images/products/metal-louvers/"
        "building-exterior-aluminium-louver-cladding-india.webp"
    ),
    "mirror-profiles": (
        f"{SITE_ORIGIN}/images/products/mirror-profiles/"
        "led-aluminium-mirror-profile-bathroom-price-india.webp"
    ),
    "shower-partitions": (
        f"{SITE_ORIGIN}/images/products/Glass Shower Partition Price/"
        "glass-shower-partition-modern-bathroom.webp"
    ),
    "glass-railing": (
        f"{SITE_ORIGIN}/images/products/balcony-glass-railing-system/"
        "luxury-balcony-glass-railing.webp"
    ),
    "pergola": (
        f"{SITE_ORIGIN}/images/products/metal-louvers/"
        "aluminium-ceiling-louver-pergola-design.webp"
    ),
    "telescope-windows": (
        f"{SITE_ORIGIN}/images/products/telescope-windows/"
        "telescopic-slim-profile-soft-close-fluted-glass-kitchen-partition.webp"
    ),
    "folding-systems": (
        f"{SITE_ORIGIN}/images/products/folding-systems/"
        "folding-aluminium-balcony-door-toughened-glass-india.webp"
    ),
}
DEFAULT_FEED_LOGO = f"{SITE_ORIGIN}/images/woodenmax-logo.webp"


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
        "mirror-profiles":    720,     # hub: ₹720–1,850/ft LED profile
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
        "mirror-profiles": "Home & Garden > Decor > LED & Aluminium Mirror Profiles",
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
        "mirror-profiles": "Home > LED Mirror Profiles",
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
        "mirror-profiles": GPC_MIRRORS,
    }
    return gpc.get(key, GPC_DOORS)


def normalize_site_url(url: str) -> str:
    """Normalize woodenmax.in page URLs (canonical / product link)."""
    u = html_module.unescape(url.strip()).split("#")[0]
    if u.startswith("/"):
        u = SITE_ORIGIN + u
    if not u.startswith("http"):
        return u
    p = urlparse(u)
    host = p.netloc.lower()
    if host.startswith("www.woodenmax.in"):
        host = "woodenmax.in"
    path = unquote(p.path)
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    enc_path = quote(path, safe="/")
    return urlunparse(("https", host, enc_path, "", p.query, ""))


def feed_link_from_html(text: str, rel: str) -> str:
    """Prefer <link rel=canonical> so GMC landing URL matches the live page."""
    head = text[:50000]
    m = CANONICAL_RE.search(head)
    if m:
        href = html_module.unescape(m.group(1).strip())
        if href:
            return normalize_site_url(href)
    stem = rel.replace(".html", "").strip("/")
    parts = stem.split("/")
    if parts and parts[-1] == "index":
        parts = parts[:-1]
    path = "/".join(parts)
    if not path:
        return f"{SITE_ORIGIN}/products/"
    # Hubs use trailing slash (matches site canonicals).
    if len(parts) == 1:
        return f"{SITE_ORIGIN}/products/{path}/"
    return f"{SITE_ORIGIN}/products/{path}"


def feed_id_for_path(path: Path, rel: str) -> str:
    """Stable Merchant Center id — never use bare 'index'."""
    stem = path.stem
    if stem != "index":
        fid = stem
    else:
        parent = path.parent.name
        fid = parent if parent and parent != "products" else stem
    if len(fid) > 50:
        link = feed_link_from_html(
            path.read_text(encoding="utf-8", errors="replace"), rel
        )
        fid = hashlib.sha256(link.encode("utf-8")).hexdigest()[:16]
    return fid


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
    base = url.split("?")[0].rstrip("/").lower()
    return re.sub(r"-1200(\.[a-z0-9]+)$", r"\1", base)


def should_skip_image_url(url: str) -> bool:
    low = url.lower()
    if "woodenmax-logo" in low or "/icons/" in low:
        return True
    if low.endswith(".svg"):
        return True
    if "/images/" not in low:
        return True
    return False


def local_path_for_site_url(url: str) -> Path | None:
    """Map https://woodenmax.in/images/... to a repo file (if under images/)."""
    u = normalize_feed_image_url(url)
    if not u.startswith(SITE_ORIGIN + "/"):
        return None
    rel = unquote(urlparse(u).path.lstrip("/"))
    if not rel.startswith("images/"):
        return None
    return ROOT / rel


def feed_image_exists(url: str) -> bool:
    p = local_path_for_site_url(url)
    if p and p.is_file():
        return True
    # Accept -1200 twin when only one variant is on disk
    u = normalize_feed_image_url(url)
    try:
        rel = unquote(urlparse(u).path.lstrip("/"))
    except Exception:
        return False
    if not rel.startswith("images/"):
        return False
    twin = re.sub(r"-1200(\.[a-z0-9]+)$", r"\1", rel, flags=re.I)
    if twin != rel and (ROOT / twin).is_file():
        return True
    with1200 = re.sub(r"(\.[a-z0-9]+)$", r"-1200\1", rel, flags=re.I)
    if with1200 != rel and (ROOT / with1200).is_file():
        return True
    return False


def silo_fallback_image(rel: str) -> str:
    key = folder_key(rel)
    raw = SILO_FALLBACK_IMAGES.get(key)
    if raw:
        return normalize_feed_image_url(raw)
    return normalize_feed_image_url(DEFAULT_FEED_LOGO)


def slug_image_tokens(rel: str) -> list[str]:
    stem = Path(rel).stem
    if stem == "index":
        stem = Path(rel).parent.name
    return [
        t for t in re.split(r"[^a-z0-9]+", stem.lower())
        if len(t) >= 3 and t not in IMAGE_STOP_TOKENS
    ]


def image_relevance(url: str, tokens: list[str]) -> int:
    if not tokens:
        return 0
    path = unquote(urlparse(url).path).lower()
    return sum(10 for t in tokens if t in path)


def strip_related_product_blocks(text: str) -> str:
    """Drop related-product cards so sibling heroes never enter additional_image_link."""
    low = text.lower()
    markers = (
        'class="related-products"',
        "class='related-products'",
        'class="related-product-card"',
        "class='related-product-card'",
    )
    cut = -1
    for m in markers:
        i = low.find(m)
        if i >= 0 and (cut < 0 or i < cut):
            cut = i
    return text[:cut] if cut >= 0 else text


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
    if "woodenmax.in" not in host:
        return u
    raw_path = unquote(p.path)
    enc_path = quote(raw_path, safe="/")
    return urlunparse(("https", host, enc_path, "", p.query, ""))


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


def _push_image(raw: str, rel: str, seen: set[str], out: list[str]) -> None:
    u = resolve_product_image(raw, rel)
    if not u:
        return
    # Prefer on-disk twin when -1200 missing or vice versa
    if not feed_image_exists(u):
        return
    # Normalize to an existing file URL when twin swap needed
    p = local_path_for_site_url(u)
    if not (p and p.is_file()):
        rel_path = unquote(urlparse(u).path.lstrip("/"))
        twin = re.sub(r"-1200(\.[a-z0-9]+)$", r"\1", rel_path, flags=re.I)
        if twin != rel_path and (ROOT / twin).is_file():
            u = normalize_feed_image_url(f"{SITE_ORIGIN}/{twin}")
        else:
            with1200 = re.sub(r"(\.[a-z0-9]+)$", r"-1200\1", rel_path, flags=re.I)
            if with1200 != rel_path and (ROOT / with1200).is_file():
                u = normalize_feed_image_url(f"{SITE_ORIGIN}/{with1200}")
    k = dedupe_image_key(u)
    if k in seen:
        return
    seen.add(k)
    out.append(u)


def collect_gallery_image_urls(text: str, rel: str) -> list[str]:
    """Highest-trust images: main image, data-image thumbs, thumbnail strip, Product JSON-LD."""
    clean = strip_related_product_blocks(text)
    seen: set[str] = set()
    out: list[str] = []

    for m in MAIN_IMAGE_RE.finditer(clean):
        _push_image(m.group(1) or m.group(2) or "", rel, seen, out)
    for m in DATA_IMAGE_RE.finditer(clean):
        _push_image(m.group(1), rel, seen, out)
    for block in re.finditer(r"product-thumbnail-gallery[\s\S]{0,25000}", clean, re.I):
        chunk = block.group(0)
        for m in IMG_SRC_RE.finditer(chunk):
            _push_image(m.group(1), rel, seen, out)
        for m in IMG_DATA_SRC_RE.finditer(chunk):
            _push_image(m.group(1), rel, seen, out)

    head = clean[:SCAN_CHARS]
    for m in JSONLD_IMG_ESC_RE.finditer(head):
        _push_image(m.group(0).replace("\\/", "/"), rel, seen, out)
    # Early absolute image URLs from Product schema (not related cards — those are relative)
    for m in ABS_IMG_RE.finditer(head[:80_000]):
        _push_image(m.group(0), rel, seen, out)
        if len(out) >= EXTRA_IMAGE_CAP + 4:
            break
    return out


def collect_product_image_urls(text: str, rel: str) -> list[str]:
    """Ordered unique on-site product images: gallery first, then meta, then slug-relevant imgs."""
    clean = strip_related_product_blocks(text)
    tokens = slug_image_tokens(rel)
    seen: set[str] = set()
    gallery: list[str] = []
    meta: list[str] = []
    rest: list[str] = []

    for u in collect_gallery_image_urls(clean, rel):
        k = dedupe_image_key(u)
        if k in seen:
            continue
        seen.add(k)
        gallery.append(u)

    head = clean[:50000]
    og = OG_IMAGE_RE.search(head)
    if og:
        _push_image(og.group(1), rel, seen, meta)
    for m in LINK_TAG_RE.finditer(head):
        inner = m.group(1)
        if "preload" not in inner.lower():
            continue
        if not re.search(r'\bas\s*=\s*["\']image["\']', inner, re.I):
            continue
        hm = re.search(r'\bhref\s*=\s*["\']([^"\']+)["\']', inner, re.I)
        if hm:
            _push_image(hm.group(1), rel, seen, meta)

    blob = clean[:SCAN_CHARS]
    for m in DATA_IMAGE_RE.finditer(blob):
        _push_image(m.group(1), rel, seen, rest)
    for m in IMG_SRC_RE.finditer(blob):
        _push_image(m.group(1), rel, seen, rest)
    for m in IMG_DATA_SRC_RE.finditer(blob):
        _push_image(m.group(1), rel, seen, rest)
    for m in IMG_SRCSET_RE.finditer(blob):
        for part in m.group(1).split(","):
            tok = part.strip().split()
            if tok:
                _push_image(tok[0], rel, seen, rest)
    for m in CSS_BG_URL_RE.finditer(blob):
        _push_image(m.group(1), rel, seen, rest)

    scored_rest = [
        u for u in rest
        if (not tokens) or image_relevance(u, tokens) > 0
    ]
    scored_rest.sort(key=lambda u: image_relevance(u, tokens), reverse=True)

    ordered: list[str] = []
    order_seen: set[str] = set()
    for bucket in (gallery, meta, scored_rest):
        for u in bucket:
            k = dedupe_image_key(u)
            if k in order_seen:
                continue
            order_seen.add(k)
            ordered.append(u)

    # Prefer slug-relevant / dedicated *-pic folders as primary when available
    if tokens:
        def _score(u: str) -> int:
            path_l = unquote(urlparse(u).path).lower()
            bonus = 15 if ("-pic/" in path_l or "/pic/" in path_l or "-gallery/" in path_l) else 0
            return image_relevance(u, tokens) + bonus
        ordered.sort(key=_score, reverse=True)
    return ordered


def pick_feed_primary_image(text: str, rel: str, meta: dict) -> str:
    """First fetchable product image: gallery → og → slug-relevant imgs → silo hero."""
    img_candidates = collect_product_image_urls(text, rel)
    og_raw = (meta.get("image") or "").strip()
    if og_raw.startswith("/"):
        og_raw = SITE_ORIGIN + og_raw
    primary_og = normalize_feed_image_url(og_raw) if og_raw else ""
    if primary_og and should_skip_image_url(primary_og):
        primary_og = ""

    # Gallery / page candidates first (product-specific), then og as backup
    ordered: list[str] = list(img_candidates)
    if primary_og and "woodenmax-logo" not in primary_og.lower():
        # Insert og after gallery hits if not already present
        if dedupe_image_key(primary_og) not in {dedupe_image_key(u) for u in ordered}:
            if feed_image_exists(primary_og):
                # Prefer page gallery when present; otherwise og leads
                if ordered:
                    ordered.insert(min(1, len(ordered)), primary_og)
                else:
                    ordered.insert(0, primary_og)

    seen: set[str] = set()
    for u in ordered:
        k = dedupe_image_key(u)
        if k in seen:
            continue
        seen.add(k)
        if feed_image_exists(u):
            return u

    fb = silo_fallback_image(rel)
    if feed_image_exists(fb):
        return fb
    return normalize_feed_image_url(DEFAULT_FEED_LOGO)


def pick_feed_extra_images(text: str, rel: str, primary: str) -> list[str]:
    """Additional images from this product's gallery — not related-product cards."""
    pk = dedupe_image_key(primary)
    tokens = slug_image_tokens(rel)
    # Trust set: anything harvested as gallery/data-image/main/json-ld
    trusted = {dedupe_image_key(u) for u in collect_gallery_image_urls(text, rel)}
    out: list[str] = []
    for u in collect_product_image_urls(text, rel):
        if dedupe_image_key(u) == pk:
            continue
        if not feed_image_exists(u):
            continue
        uk = dedupe_image_key(u)
        if uk not in trusted:
            if tokens and image_relevance(u, tokens) <= 0:
                path_l = unquote(urlparse(u).path).lower()
                if "-pic/" not in path_l and "/pic/" not in path_l and "-gallery/" not in path_l:
                    try:
                        primary_dir = unquote(urlparse(primary).path).rsplit("/", 1)[0].lower()
                        u_dir = unquote(urlparse(u).path).rsplit("/", 1)[0].lower()
                    except Exception:
                        primary_dir = u_dir = ""
                    if u_dir != primary_dir:
                        continue
        out.append(u)
        if len(out) >= EXTRA_IMAGE_CAP:
            break
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
        f'  <title>{_xml_escape("WoodenMax Products — Aluminium Windows, Glass Facades, Pergolas & More")}</title>',
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
        text = path.read_text(encoding="utf-8", errors="replace")
        link = feed_link_from_html(text, rel)
        if link in seen_link:
            continue
        seen_link.add(link)

        if should_skip_for_feed(path.stem):
            skipped_info_pages.append(rel)
            continue

        fid = feed_id_for_path(path, rel)
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

        image = pick_feed_primary_image(text, rel, meta)
        extras = pick_feed_extra_images(text, rel, image)
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
        unit = "rft" if cat_key in ("glass-railing", "mirror-profiles") else (
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
            "image_link": normalize_feed_image_url(DEFAULT_FEED_LOGO),
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
    csv_target = out_path
    try:
        fh = out_path.open("w", encoding="utf-8", newline="")
    except PermissionError:
        csv_target = ROOT / "products-feed.generated.csv"
        fh = csv_target.open("w", encoding="utf-8", newline="")
        print(
            f"⚠ {out_path.name} is locked (close Excel). Wrote {csv_target.name} instead.",
            file=sys.stderr,
        )
    with fh as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    print(f"Wrote {len(rows)} rows to {csv_target.relative_to(ROOT)}")
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

    by_silo: dict[str, int] = {}
    for r in rows:
        silo = r.get("custom_label_0") or "other"
        by_silo[silo] = by_silo.get(silo, 0) + 1
    print("\nFeed rows by silo (custom_label_0):")
    for silo in sorted(by_silo):
        print(f"  {silo}: {by_silo[silo]}")

    broken_images = [r for r in rows if not feed_image_exists(r["image_link"])]
    if broken_images:
        print(
            f"\n⚠ {len(broken_images)} feed rows still point at missing image files:",
            file=sys.stderr,
        )
        for r in broken_images[:25]:
            print(f"  {r['id']}: {r['image_link']}", file=sys.stderr)
    else:
        print(f"\n✓ All {len(rows)} feed image_link URLs resolve to files on disk.")

    from collections import Counter
    img_counts = Counter(r["image_link"] for r in rows)
    with_extras = sum(1 for r in rows if (r.get("additional_image_link") or "").strip())
    print(f"\nDistinct image_link URLs: {len(img_counts)}")
    print(f"Rows with additional_image_link: {with_extras}/{len(rows)}")
    print("Most reused image_link values:")
    for u, n in img_counts.most_common(10):
        print(f"  {n}×  {u.replace(SITE_ORIGIN, '')}")


if __name__ == "__main__":
    main()
