#!/usr/bin/env python3
"""Generate SERP_CTR_TITLE_EXAMPLES.md + SERP_PAGE_INVENTORY_GOOGLE_STYLE.md."""
from __future__ import annotations

import html as html_lib
import re
import subprocess
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(r"D:\Downloads\woodenmax-live")
HIST_COMMIT = "b85fe94"  # 2026-04-30 Mar–Apr era snapshot
TODAY = "2026-11-12"
BASE = "https://woodenmax.in"

# Primary cue rotation pool — never stamp same cue on sibling URLs in a batch
CUES = [
    "live calculator",
    "live estimate",
    "live cost",
    "instant quote",
    "price",
    "cost",
    "size & cost tool",
    "estimate",
]


def unescape(s: str) -> str:
    return html_lib.unescape(s or "").strip()


def clean_ws(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip()


def url_to_candidates(url: str) -> list[Path]:
    path = urlparse(url).path.strip("/")
    if not path:
        return [ROOT / "index.html", ROOT / "index.htm"]
    # Root SEO pages that live under product folders (canonical URL without folder)
    shower_root_aliases = {
        "bathroom-shower-design-price",
        "corner-shower-partition-price",
        "fixed-glass-shower-panel-price",
        "framed-vs-frameless-shower",
        "frameless-glass-shower-price",
        "glass-shower-partition-price",
        "shower-curtain-vs-glass-partition",
        "shower-enclosure-price",
        "shower-glass-maintenance",
        "shower-glass-thickness",
        "shower-glass-types",
        "shower-installation-cost",
        "sliding-shower-door-price",
        "small-bathroom-shower-design",
        "walk-in-shower-glass-price",
    }
    cands: list[Path] = [
        ROOT / f"{path}.html",
        ROOT / path / "index.html",
        ROOT / f"{path}.htm",
        ROOT / path,
    ]
    leaf = path.split("/")[-1]
    if leaf in shower_root_aliases:
        cands.insert(0, ROOT / "products" / "shower-partitions" / f"{leaf}.html")
    return cands


def resolve_file(url: str) -> Path | None:
    for c in url_to_candidates(url):
        if c.is_file():
            return c
    return None


def meta_content(html: str, *, name: str | None = None, prop: str | None = None) -> str:
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


def extract_title(html: str) -> str:
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
    return clean_ws(unescape(m.group(1))) if m else ""


def extract_headings(html: str, tag: str, limit: int = 6) -> list[str]:
    # strip scripts/styles to reduce noise
    body = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    body = re.sub(r"<style[\s\S]*?</style>", " ", body, flags=re.I)
    out = []
    for m in re.finditer(rf"<{tag}\b[^>]*>([\s\S]*?)</{tag}>", body, re.I):
        t = clean_ws(re.sub(r"<[^>]+>", " ", m.group(1)))
        if t and t not in out:
            out.append(t)
        if len(out) >= limit:
            break
    return out


def og_twitter_status(html: str) -> dict:
    checks = {
        "og:title": bool(meta_content(html, prop="og:title")),
        "og:description": bool(meta_content(html, prop="og:description")),
        "og:image": bool(meta_content(html, prop="og:image")),
        "og:url": bool(meta_content(html, prop="og:url")),
        "og:type": bool(meta_content(html, prop="og:type")),
        "twitter:card": bool(meta_content(html, name="twitter:card")),
        "twitter:title": bool(meta_content(html, name="twitter:title")),
        "twitter:description": bool(meta_content(html, name="twitter:description")),
        "twitter:image": bool(meta_content(html, name="twitter:image")),
    }
    present = [k for k, v in checks.items() if v]
    missing = [k for k, v in checks.items() if not v]
    status = "OK" if not missing else ("PARTIAL" if present else "MISSING")
    return {"status": status, "present": present, "missing": missing, "checks": checks}


def git_hist_title(rel: str) -> str:
    try:
        raw = subprocess.check_output(
            ["git", "show", f"{HIST_COMMIT}:{rel}"],
            cwd=ROOT,
            stderr=subprocess.DEVNULL,
        )
        html = raw.decode("utf-8", errors="ignore")
        t = extract_title(html)
        return t or "N/A"
    except Exception:
        return "N/A"


def breadcrumb(url: str) -> str:
    path = urlparse(url).path.strip("/")
    if not path:
        return "woodenmax.in ›"
    parts = path.split("/")
    nice = " › ".join(parts)
    return f"woodenmax.in › {nice}"


def rate_hints(html: str) -> list[str]:
    """Pull honest ₹ bands already present in page HTML (no invention)."""
    text = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    bands = []
    for m in re.finditer(
        r"₹\s*[\d,]+(?:\s*[–—-]\s*₹?\s*[\d,]+)?\s*/?\s*(?:sq\.?\s*ft|sqft|rft|ft)?",
        text,
        re.I,
    ):
        b = clean_ws(m.group(0)).replace("—", "–").replace("-", "–")
        if b not in bands:
            bands.append(b)
        if len(bands) >= 8:
            break
    return bands


def pick_cue(idx: int, url: str, title: str, h1: str) -> str:
    u = url.lower()
    blob = f"{title} {h1}".lower()
    path = urlparse(url).path.strip("/")
    # Informational / policy / about — not commercial PDP cues
    if (
        path.startswith("about")
        or path.startswith("policies")
        or path.startswith("blog")
        or path in ("contact", "partner", "catalog", "return-policy")
        or path == ""
    ):
        info = ["manufacturer", "factory", "brand", "guide"]
        if path == "" or path == "catalog":
            return "estimate"
        if path == "contact":
            return "instant quote"
        return info[idx % len(info)]
    if "/city/" in u or (
        "price-" in u
        and any(
            c in u
            for c in (
                "hyderabad",
                "delhi",
                "bangalore",
                "mumbai",
                "pune",
                "jaipur",
                "chandigarh",
                "vijayawada",
                "lucknow",
                "visakhapatnam",
                "warangal",
            )
        )
    ):
        return "instant quote"
    if "calculator" in u or "calculator" in blob:
        return "size & cost tool" if idx % 2 == 0 else "live calculator"
    if u.rstrip("/").endswith(
        (
            "/aluminium-windows",
            "/metal-louvers",
            "/pergola",
            "/shower-partitions",
            "/mirror-profiles",
            "/glass-railing",
            "/grills",
            "/folding-systems",
            "/elevation-cladding",
            "/glass-elevation",
            "/telescope-windows",
        )
    ) or u.rstrip("/").endswith("/products"):
        return "price" if "price" in blob else "estimate"
    if "price" in u or "price" in blob:
        pool = ["price", "cost", "live estimate", "instant quote"]
        return pool[idx % len(pool)]
    return CUES[idx % len(CUES)]


def natural_product_label(url: str, h1: str, title: str) -> str:
    # Prefer H1 as human label; trim brand suffixes
    label = h1 or title
    label = re.sub(r"\s*[|—–-]\s*WoodenMax.*$", "", label, flags=re.I)
    label = re.sub(r"\s*\|\s*.*$", "", label)
    label = clean_ws(label)
    if len(label) > 70:
        label = label[:67].rsplit(" ", 1)[0] + "…"
    return label or "WoodenMax page"


def first_band(bands: list[str]) -> str:
    if not bands:
        return ""
    # Prefer range or from-style
    for b in bands:
        if "–" in b or "-" in b:
            return b
    return bands[0]


def propose(
    idx: int,
    url: str,
    title: str,
    meta: str,
    h1: str,
    h2s: list[str],
    bands: list[str],
) -> dict:
    cue = pick_cue(idx, url, title, h1)
    label = natural_product_label(url, h1, title)
    band = first_band(bands)
    u = url.lower()

    # Natural search-intent title shapes (rotate; no "soft" jargon)
    if cue == "live calculator":
        prop_title = f"{label} | Live Calculator" + (f" · from {band}" if band and "from" not in label.lower() else "") + " | WoodenMax"
        if band and "from" not in prop_title and "₹" not in prop_title:
            prop_title = f"{label} | Live Calculator · from {band} | WoodenMax"
    elif cue == "live estimate":
        prop_title = f"{label} — Live Estimate for Your Size | WoodenMax"
        if band and "₹" not in prop_title:
            prop_title = f"{label} | Live Estimate · {band} | WoodenMax"
    elif cue == "live cost":
        prop_title = f"{label} | Live Cost for Your Opening | WoodenMax"
    elif cue == "instant quote":
        if any(c in u for c in ("hyderabad", "delhi", "bangalore", "mumbai", "pune", "jaipur")):
            city = "Hyderabad" if "hyderabad" in u else (
                "Delhi NCR" if "delhi" in u else (
                    "Bangalore" if "bangalore" in u else (
                        "Mumbai" if "mumbai" in u else (
                            "Pune" if "pune" in u else "Jaipur"
                        )
                    )
                )
            )
            base = label if city.lower() in label.lower() else f"{label} in {city}"
            prop_title = f"{base} | Instant Quote | WoodenMax"
        else:
            prop_title = f"{label} | Instant Quote" + (f" · from {band}" if band else "") + " | WoodenMax"
    elif cue == "price":
        if band:
            prop_title = f"{label} Price India | {band} | WoodenMax"
        else:
            prop_title = f"{label} Price India (2026) | WoodenMax"
    elif cue == "cost":
        if band:
            prop_title = f"{label} Cost in India | {band} | WoodenMax"
        else:
            prop_title = f"{label} Cost in India (2026) | WoodenMax"
    elif cue == "size & cost tool":
        prop_title = f"{label} | Size & Cost Tool | WoodenMax"
    elif cue == "manufacturer":
        prop_title = f"{label} | Aluminium Manufacturer | WoodenMax"
    elif cue == "factory":
        prop_title = f"{label} | Hyderabad Factory | WoodenMax"
    elif cue == "brand":
        prop_title = f"{label} | WoodenMax India"
    elif cue == "guide":
        prop_title = f"{label} | WoodenMax Guide"
    else:  # estimate
        prop_title = f"{label} | Get an Estimate | WoodenMax"

    prop_title = clean_ws(prop_title)
    prop_title = re.sub(r"\s*\|\s*\|", " | ", prop_title)
    # Cap length roughly for SERP
    if len(prop_title) > 72:
        # drop trailing WoodenMax if needed later; keep readable
        short_label = label
        if len(short_label) > 42:
            short_label = short_label[:40].rsplit(" ", 1)[0]
        if cue in ("live calculator", "live estimate", "instant quote", "size & cost tool"):
            prop_title = f"{short_label} | {cue.title()} | WoodenMax"
        elif band:
            prop_title = f"{short_label} | {band} | WoodenMax"
        else:
            prop_title = f"{short_label} | WoodenMax"

    # Meta: keep rates natural, no "soft"
    meta_bits = []
    if meta:
        # strip soft jargon from current meta as seed
        seed = re.sub(r"\b[Ss]oft\b\s*", "", meta)
        seed = clean_ws(seed)
        meta_bits.append(seed[:220])
    else:
        lead = f"{label}."
        if band:
            lead += f" Planning from {band}."
        lead += f" {cue.capitalize()} on WoodenMax. Manufacturer India."
        meta_bits.append(lead)
    prop_meta = meta_bits[0]
    prop_meta = re.sub(r"\bsoft\b", "", prop_meta, flags=re.I)
    prop_meta = clean_ws(prop_meta)
    if len(prop_meta) > 165:
        prop_meta = prop_meta[:162].rsplit(" ", 1)[0] + "…"

    # H1: intent-aligned, no soft
    prop_h1 = re.sub(r"\b[Ss]oft\b\s*", "", h1 or label)
    prop_h1 = clean_ws(prop_h1) or label
    # Light intent polish for hubs / calc / price
    if "calculator" in u and "Calculator" not in prop_h1:
        prop_h1 = f"{prop_h1} — Price Calculator"
    elif prop_h1.lower() == label.lower() and cue == "price" and "price" not in prop_h1.lower():
        prop_h1 = f"{prop_h1} — Price Guide"

    h2_note = "; ".join(h2s[:3]) if h2s else "—"
    h3_note = "Keep H2/H3 tied to page job (types / cost factors / how calculator works / FAQs)."

    # Special ownership locks for known money pages — override with curated proposals later
    return {
        "cue": cue,
        "prop_title": prop_title,
        "prop_meta": prop_meta,
        "prop_h1": prop_h1,
        "h2_note": h2_note,
        "h3_note": h3_note,
        "band": band,
    }


# Curated proposals for the examples file (no soft jargon; natural intent)
CURATED = {
    f"{BASE}/products/aluminium-windows": {
        "prop_title": "Aluminium Windows for Homes | Sliding, Casement, Slim | WoodenMax",
        "prop_meta": "Browse aluminium window types for Indian homes — 2-track, 3-track with mesh, casement, balcony and entrance. Installed planning from about ₹550–2,250/sqft by type. Open the matching size & cost tool.",
        "prop_h1": "Aluminium Windows by WoodenMax — Types for Homes & Villas",
        "h2_h3": "H2: window types to compare · H2: which calculator to open · H3: room/use picks",
        "cue": "estimate",
        "bands": "3-track mesh ₹550–950/sqft · premium 2-track ₹1,200–1,400/sqft · casement ₹750–1,050/sqft · French ₹1,850–2,250/sqft",
    },
    f"{BASE}/products/aluminium-windows/3-track-sliding-window": {
        "prop_title": "3-Track Sliding Window with Mesh | Live Calculator · from ₹850/sqft",
        "prop_meta": "3-track aluminium sliding with mosquito mesh for bedrooms and balconies. From ₹850/sqft (2-track without mesh from ₹650/sqft). Live calculator for your opening size. Manufacturer WoodenMax.",
        "prop_h1": "3-Track Aluminium Sliding Window with Mesh",
        "h2_h3": "H2: mesh vs 2-track · H2: size & glass options · H3: install notes",
        "cue": "live calculator",
        "bands": "from ₹850/sqft · 2-track without mesh from ₹650/sqft",
    },
    f"{BASE}/products/aluminium-windows/2-track-aluminium-window-price": {
        "prop_title": "2-Track Aluminium Window Price (2026) | ₹1,200–1,400/sqft | WoodenMax",
        "prop_meta": "2-track aluminium window price guide for premium 29mm sliding — about ₹1,200–1,400/sqft. Glass and hardware notes; mesh needs 3-track. Size planning on the linked product calculator.",
        "prop_h1": "2-Track Aluminium Window Price — India Guide",
        "h2_h3": "H2: what changes ₹/sqft · H2: mesh needs 3-track · H3: link to PDP calculator",
        "cue": "price",
        "bands": "₹1,200–1,400/sqft",
    },
    f"{BASE}/products/aluminium-windows/aluminium-sliding-window": {
        "prop_title": "2-Track Sliding Window for Balcony & Entrance | Live Estimate | WoodenMax",
        "prop_meta": "Premium 2-track aluminium sliding (S29–S40) for view openings, balcony and entrance. S29 planning about ₹1,200–1,400/sqft. Live estimate by size — WoodenMax factory India.",
        "prop_h1": "2-Track Aluminium Sliding Window — S29 to S40",
        "h2_h3": "H2: balcony vs entrance height · H2: S29–S40 options · H3: glass/hardware",
        "cue": "live estimate",
        "bands": "S29 ₹1,200–1,400/sqft",
    },
    f"{BASE}/products/aluminium-windows/aluminium-casement-window-price": {
        "prop_title": "Casement & Openable Aluminium Windows | Live Cost | WoodenMax",
        "prop_meta": "Hinged casement windows and openable aluminium doors — 50 mm and 65 mm series. Planning about ₹950–1,550/sqft by series. Live cost for glass and lock choices. Manufacturer WoodenMax.",
        "prop_h1": "Openable Aluminium Doors & Casement Windows",
        "h2_h3": "H2: 50mm vs 65mm · H2: locks & mesh · H3: vs sliding",
        "cue": "live cost",
        "bands": "about ₹950–1,550/sqft",
    },
    f"{BASE}/products/aluminium-windows/domal-window-price": {
        "prop_title": "Domal Window Price — 27mm Series | from ₹650/sqft | WoodenMax",
        "prop_meta": "Domal 27mm / 27×65 aluminium series by WoodenMax — from ₹650/sqft (2-track) and ₹850/sqft (3-track with mesh). Height limits, upgrades, and on-page estimate. Not the generic 3-track product page.",
        "prop_h1": "Domal Aluminium Window Price — 27mm / 27×65",
        "h2_h3": "H2: 27mm series limits · H2: 2-track vs 3-track mesh · H3: upgrades",
        "cue": "price",
        "bands": "₹650/sqft (2-track) · ₹850/sqft (3-track with mesh)",
    },
    f"{BASE}/products/aluminium-windows/aluminium-window-price-hyderabad": {
        "prop_title": "Aluminium Window Price in Hyderabad | Instant Quote | WoodenMax",
        "prop_meta": "Hyderabad aluminium window cost for Gachibowli, Banjara Hills and ORR homes. Factory-city supply; national planning about ₹550–2,250/sqft by type. Instant quote via live size tool.",
        "prop_h1": "Aluminium Window Price in Hyderabad — Factory Supply",
        "h2_h3": "H2: city areas · H2: type bands · H3: site measure / quote",
        "cue": "instant quote",
        "bands": "₹550–2,250/sqft",
    },
    f"{BASE}/products/aluminium-windows/aluminium-system-window-price": {
        "prop_title": "Aluminium System Window Cost India (2026) | ₹1,180–2,680/sqft | WoodenMax",
        "prop_meta": "Premium aluminium system window cost for certified-style packages and DGU facades. About ₹1,180–2,680/sqft. Live 30mm system sliding estimate — manufacturer WoodenMax.",
        "prop_h1": "Aluminium System Window Price — India Cost Guide (2026)",
        "h2_h3": "H2: what ‘system’ means · H2: ₹/sqft drivers · H3: calculator path",
        "cue": "cost",
        "bands": "₹1,180–2,680/sqft",
    },
    f"{BASE}/products/aluminium-windows/aluminium-window-price-per-sqft": {
        "prop_title": "Aluminium Window Price Per Sqft India | ₹550–2,250 | WoodenMax",
        "prop_meta": "One ₹/sqft guide for Domal sliding, premium 2-track, casement, system, slim and French door bands — about ₹550–2,250/sqft. Compare types, then open the right calculator. WoodenMax.",
        "prop_h1": "Aluminium Window Price Per Sq Ft — India Guide (2026)",
        "h2_h3": "H2: band table by type · H2: what is included · H3: pick a calculator",
        "cue": "price",
        "bands": "₹550–2,250/sqft",
    },
    f"{BASE}/aluminium-window-price-calculator": {
        "prop_title": "Aluminium Window Price Calculator | Size & Cost Tool | WoodenMax",
        "prop_meta": "Size & cost tool for sliding, casement and French aluminium windows. Enter opening size, glass and finish for a live planning estimate from WoodenMax rates. Manufacturer India.",
        "prop_h1": "Aluminium Window Price Calculator — Size & Cost Tool",
        "h2_h3": "H2: how to enter size · H2: glass/finish impact · H3: next step quote",
        "cue": "size & cost tool",
        "bands": "",
    },
    f"{BASE}/products/metal-louvers": {
        "prop_title": "Aluminium Louvers for Facades | Elevation, Canopy, Motorized | WoodenMax",
        "prop_meta": "Aluminium louvers and rafters for Indian facades — elevation, curved, ceiling, canopy and motorized. Installed planning about ₹450–1,450/sqft by profile. Browse types, then open a child estimate.",
        "prop_h1": "Aluminium Louvers for Indian Facades",
        "h2_h3": "H2: louver types · H2: profile bands · H3: city supply",
        "cue": "estimate",
        "bands": "₹450–1,450/sqft",
    },
    f"{BASE}/products/metal-louvers/aluminium-facade-louver-price": {
        "prop_title": "Facade Louver Price in India (2026) | ₹450–950/sqft | WoodenMax",
        "prop_meta": "Aluminium facade louver price guide — about ₹450–950/sqft by profile (50–25 to 150–50 mm). Gap, finish and bracket BOQ. Live planning on-page. WoodenMax Delhi, Hyderabad, Jaipur.",
        "prop_h1": "Aluminium Facade Louver Price — India Guide",
        "h2_h3": "H2: profile sizes · H2: finish & brackets · H3: BOQ calculator",
        "cue": "price",
        "bands": "≈ ₹450–950/sqft",
    },
    f"{BASE}/products/pergola": {
        "prop_title": "Pergola Types for Indian Terraces | Glass Roof, Louver, Retractable | WoodenMax",
        "prop_meta": "Browse glass-roof aluminium, profile louver, skylight and retractable pergolas. Child pages show installed planning about ₹1,200–2,500/sqft. WoodenMax factory — open the matching estimate.",
        "prop_h1": "Pergolas for Indian Homes & Terraces",
        "h2_h3": "H2: pergola types · H2: terrace vs garden · H3: child calculators",
        "cue": "estimate",
        "bands": "₹1,200–2,500/sqft on child pages",
    },
    f"{BASE}/products/pergola/aluminium-pergola": {
        "prop_title": "Glass-Roof Aluminium Pergola | Live Estimate · ₹1,300–2,400/sqft",
        "prop_meta": "Glass-roof aluminium pergola — 6063-T6 powder-coated frame with toughened, laminated or polycarbonate roof. About ₹1,300–2,400/sqft on the live estimate. Manufacturer WoodenMax;",
        "prop_h1": "Aluminium Pergola — Glass-Roof Terrace Structure",
        "h2_h3": "H2: roof glass options · H2: size examples · H3: live estimate",
        "cue": "live estimate",
        "bands": "≈ ₹1,300–2,400/sqft",
    },
    f"{BASE}/products/shower-partitions": {
        "prop_title": "Shower Partitions for Bathrooms | Frameless, Sliding, Slim Frame | WoodenMax",
        "prop_meta": "Shower partitions for Indian bathrooms — frameless walk-in, black soft-close sliding, frosted fold-slide and slim fluted. Installed about ₹440–1,320/sqft by type. Open a child size tool.",
        "prop_h1": "Shower Partitions for Indian Bathrooms",
        "h2_h3": "H2: partition types · H2: glass thickness · H3: child calculators",
        "cue": "estimate",
        "bands": "₹440–1,320/sqft",
    },
    f"{BASE}/products/shower-partitions/frameless-shower-partition": {
        "prop_title": "Frameless Shower Partition | Live Cost · from ₹1,320/sqft | WoodenMax",
        "prop_meta": "Frameless walk-in shower — 10mm toughened, hinged or sliding, L-corner and straight. From ₹1,320/sqft planning on the live cost tool. Site measure before install. WoodenMax.",
        "prop_h1": "Frameless Shower Partition — Walk-in Glass Enclosure",
        "h2_h3": "H2: hinged vs sliding · H2: layouts · H3: thickness & hardware",
        "cue": "live cost",
        "bands": "from ₹1,320/sqft",
    },
    f"{BASE}/products/mirror-profiles": {
        "prop_title": "LED Mirror Profiles for Bathrooms | Backlit, Touch, Frame | WoodenMax",
        "prop_meta": "Aluminium LED mirror profiles — bathroom vanity, backlit, touch sensor and frame-only. Installed about ₹850–1,850/sqft by line. Browse types, then open a child calculator.",
        "prop_h1": "Mirror Profiles for Indian Homes",
        "h2_h3": "H2: mirror types · H2: LED vs plain · H3: child calculators",
        "cue": "estimate",
        "bands": "₹850–1,850/sqft",
    },
    f"{BASE}/products/mirror-profiles/led-mirror-profile-price": {
        "prop_title": "C-Type LED Mirror Price India | Instant Quote · from ₹950/sqft",
        "prop_meta": "C-type LED / backlit mirror price — planning from about ₹950/sqft on the live WoodenMax tool. Touch options available. Instant quote from size input;",
        "prop_h1": "C-Type LED Mirror Price — India (2026)",
        "h2_h3": "H2: size & lighting · H2: touch options · H3: quote next step",
        "cue": "instant quote",
        "bands": "from ≈ ₹950/sqft",
    },
}


def serp_block(title: str, url: str, desc: str) -> str:
    bc = breadcrumb(url)
    return (
        f'<div style="font:14px/1.4 Arial,sans-serif;max-width:600px;margin:0.4rem 0 0.8rem;">\n'
        f'  <div style="color:#202124;font-size:12px;">{bc}</div>\n'
        f'  <div style="color:#1a0dab;font-size:18px;line-height:1.3;"><a href="{url}" style="color:#1a0dab;text-decoration:none;">{html_lib.escape(title)}</a></div>\n'
        f'  <div style="color:#4d5156;font-size:13px;">{html_lib.escape(desc)}</div>\n'
        f"</div>"
    )


def md_serp(title: str, url: str, desc: str) -> str:
    bc = breadcrumb(url)
    return (
        f"```\n"
        f"{bc}\n"
        f"{title}\n"
        f"{desc}\n"
        f"```"
    )


def main() -> None:
    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8", errors="ignore")
    locs = re.findall(r"<loc>(.*?)</loc>", sitemap)
    # de-dupe preserve order
    seen = set()
    urls = []
    for u in locs:
        if u not in seen:
            seen.add(u)
            urls.append(u)

    # Prefer home first if present
    home = f"{BASE}/"
    if home in urls:
        urls.remove(home)
        urls.insert(0, home)
    elif BASE in urls:
        urls.remove(BASE)
        urls.insert(0, BASE)

    pages = []
    for i, url in enumerate(urls, start=1):
        fp = resolve_file(url)
        html = ""
        rel = ""
        if fp:
            html = fp.read_text(encoding="utf-8", errors="ignore")
            rel = str(fp.relative_to(ROOT)).replace("\\", "/")
        title = extract_title(html) if html else "(file missing — sitemap only)"
        meta = meta_content(html, name="description") if html else ""
        h1s = extract_headings(html, "h1", 2) if html else []
        h2s = extract_headings(html, "h2", 5) if html else []
        h3s = extract_headings(html, "h3", 5) if html else []
        h1 = h1s[0] if h1s else ""
        bands = rate_hints(html) if html else []
        og = og_twitter_status(html) if html else {
            "status": "MISSING",
            "present": [],
            "missing": [
                "og:title",
                "og:description",
                "og:image",
                "og:url",
                "og:type",
                "twitter:card",
                "twitter:title",
                "twitter:description",
                "twitter:image",
            ],
        }
        hist = git_hist_title(rel) if rel else "N/A"
        # Normalize URL key for curated (no trailing slash except home)
        key = url.rstrip("/") if urlparse(url).path.strip("/") else f"{BASE}"
        if key.endswith("woodenmax.in"):
            key = BASE
        # mirror hub often has trailing slash in sitemap
        curated_key = url.rstrip("/")
        prop = propose(i - 1, url, title, meta, h1, h2s, bands)
        if curated_key in CURATED or url in CURATED or (curated_key + "/") in CURATED:
            c = CURATED.get(curated_key) or CURATED.get(url) or CURATED.get(curated_key + "/")
            prop.update(
                {
                    "prop_title": c["prop_title"],
                    "prop_meta": c["prop_meta"],
                    "prop_h1": c["prop_h1"],
                    "cue": c["cue"],
                    "h2_note": c.get("h2_h3", prop["h2_note"]),
                }
            )
            if c.get("bands"):
                prop["band"] = c["bands"]

        pages.append(
            {
                "n": i,
                "url": url,
                "rel": rel,
                "title": title,
                "meta": meta,
                "h1": h1,
                "h2s": h2s,
                "h3s": h3s,
                "bands": bands,
                "og": og,
                "hist": hist,
                "prop": prop,
                "exists": bool(fp),
            }
        )

    # --- Write examples file ---
    ex_order = [
        f"{BASE}/products/aluminium-windows",
        f"{BASE}/products/aluminium-windows/3-track-sliding-window",
        f"{BASE}/products/aluminium-windows/2-track-aluminium-window-price",
        f"{BASE}/products/aluminium-windows/aluminium-sliding-window",
        f"{BASE}/products/aluminium-windows/aluminium-casement-window-price",
        f"{BASE}/products/aluminium-windows/domal-window-price",
        f"{BASE}/products/aluminium-windows/aluminium-window-price-hyderabad",
        f"{BASE}/products/aluminium-windows/aluminium-system-window-price",
        f"{BASE}/products/aluminium-windows/aluminium-window-price-per-sqft",
        f"{BASE}/aluminium-window-price-calculator",
        f"{BASE}/products/metal-louvers",
        f"{BASE}/products/metal-louvers/aluminium-facade-louver-price",
        f"{BASE}/products/pergola",
        f"{BASE}/products/pergola/aluminium-pergola",
        f"{BASE}/products/shower-partitions",
        f"{BASE}/products/shower-partitions/frameless-shower-partition",
        f"{BASE}/products/mirror-profiles",
        f"{BASE}/products/mirror-profiles/led-mirror-profile-price",
    ]
    by_url = {p["url"].rstrip("/"): p for p in pages}
    # also map trailing-slash variants
    for p in pages:
        by_url[p["url"]] = p
        by_url[p["url"].rstrip("/")] = p

    ex_lines = []
    ex_lines.append("# SERP CTR Title / Meta / H1 Examples — WoodenMax\n")
    ex_lines.append("**Status:** EXAMPLES ONLY — for user approval. Do **not** mass-edit HTML until approved.")
    ex_lines.append(f"**Date:** {TODAY}")
    ex_lines.append("**Source tree:** `D:\\Downloads\\woodenmax-live` (titles, metas, H1s, ₹ bands from page HTML)")
    ex_lines.append(
        "**Goal:** Beat competitor blue-links on CTR with natural search-intent titles, "
        "rotated live calculator / live estimate / live cost / instant quote / price / cost cues, "
        "and honest ₹/sqft bands when natural — **no “soft …” marketing jargon**."
    )
    ex_lines.append("")
    ex_lines.append("---")
    ex_lines.append("")
    ex_lines.append("## Competitor SERP patterns (user screenshots)")
    ex_lines.append("")
    ex_lines.append("| Brand | Title shape | What they lack vs WoodenMax |")
    ex_lines.append("|-------|-------------|------------------------------|")
    ex_lines.append(
        "| Encraft | “Best Aluminium Door Window Manufacturer Hyderabad” + city/product meta + Call now | No live calculator, no clear ₹/sqft start–end |"
    )
    ex_lines.append(
        "| Hindalco Eternia | “Premium Aluminium Windows & Doors \\| Eternia by Hindalco” | Premium only — no estimate tool, no price band |"
    )
    ex_lines.append(
        "| Weatherseal / BeautifulHomes | “Weatherseal: Aluminium and uPVC Windows and Doors” | Category brand line — no calculator, no ₹/sqft |"
    )
    ex_lines.append("")
    ex_lines.append(
        "**WoodenMax CTR edge (rotate — never clone one phrase on every URL):** "
        "live calculator / live estimate / live cost / instant quote / price / cost / size & cost tool / estimate — "
        "plus manufacturer/factory when it fits. ₹ bands OK as “from ₹850/sqft” or “₹650–1,400/sqft”."
    )
    ex_lines.append("")
    ex_lines.append("---")
    ex_lines.append("")
    ex_lines.append("## Reusable title formulas (mix — do not stamp one template)")
    ex_lines.append("")
    ex_lines.append("```")
    ex_lines.append("HUB:")
    ex_lines.append("  {Category} for Homes | {2–4 types} | WoodenMax")
    ex_lines.append("  {Category} Types for Indian Terraces/Facades | WoodenMax")
    ex_lines.append("")
    ex_lines.append("PRODUCT PDP:")
    ex_lines.append("  {Product people search} | Live Calculator · from ₹X/sqft | WoodenMax")
    ex_lines.append("  {Product} — Live Estimate for Your Size | WoodenMax")
    ex_lines.append("")
    ex_lines.append("PRICE GUIDE:")
    ex_lines.append("  {Product} Price (2026) | ₹A–B/sqft | WoodenMax")
    ex_lines.append("  {Product} Cost in India — Size & Cost Tool | WoodenMax")
    ex_lines.append("")
    ex_lines.append("CITY:")
    ex_lines.append("  {Product} Price in {City} | Instant Quote | WoodenMax")
    ex_lines.append("")
    ex_lines.append("CALCULATOR:")
    ex_lines.append("  {Category} Price Calculator | Size & Cost Tool | WoodenMax")
    ex_lines.append("```")
    ex_lines.append("")
    ex_lines.append("### Rotation cue map")
    ex_lines.append("")
    ex_lines.append("| Cue | Best on |")
    ex_lines.append("|-----|---------|")
    ex_lines.append("| live calculator | Strong PDP with on-page calc |")
    ex_lines.append("| live estimate | Premium / size-sensitive PDP |")
    ex_lines.append("| live cost | Casement / openable / hardware-heavy |")
    ex_lines.append("| instant quote | City or high-intent commercial |")
    ex_lines.append("| price | Master / series price guides |")
    ex_lines.append("| cost | System / premium package guides |")
    ex_lines.append("| size & cost tool | Calculator landings |")
    ex_lines.append("| estimate | Hubs (browse then child tool) |")
    ex_lines.append("")
    ex_lines.append("### Ownership lock (never blur)")
    ex_lines.append("")
    ex_lines.append("| Page owns | Must not steal |")
    ex_lines.append("|-----------|----------------|")
    ex_lines.append("| 3-track sliding | Domal series, hub browse, premium 29mm 2-track |")
    ex_lines.append("| Domal 27mm | Generic 3-track product title |")
    ex_lines.append("| Hub `/aluminium-windows` | Single SKU + exact child ₹ as if hub is that product |")
    ex_lines.append("| City Hyderabad | National-only wording with no city proof |")
    ex_lines.append("| System window | Everyday Domal / 3-track bands |")
    ex_lines.append("")
    ex_lines.append("### ₹ rules")
    ex_lines.append("")
    ex_lines.append("- Rates only from **that page’s** HTML / calculator / FAQ band — never invent.")
    ex_lines.append("- Prefer “from ₹X/sqft” or “₹A–B/sqft” — do not shout ₹ in every H1.")
    ex_lines.append("- Avoid the word **soft** as marketing jargon in titles/H1s.")
    ex_lines.append("- stays in meta/body, not every title.")
    ex_lines.append("")
    ex_lines.append("---")
    ex_lines.append("")
    ex_lines.append("## March–April title compare (git)")
    ex_lines.append("")
    ex_lines.append(
        f"**Source commit:** `{HIST_COMMIT}` (2026-04-30) — closest recoverable Mar–Apr era snapshot in `woodenmax-live`. "
        "If a file did not exist then → **N/A**."
    )
    ex_lines.append("")
    ex_lines.append("---")
    ex_lines.append("")
    ex_lines.append("## A. Ten aluminium window pages")
    ex_lines.append("")

    labels_a = [
        ("A1", "Aluminium windows hub"),
        ("A2", "3-track sliding (mesh identity)"),
        ("A3", "2-track aluminium window price guide"),
        ("A4", "Premium 2-track sliding (S29–S40)"),
        ("A5", "Casement / openable"),
        ("A6", "Domal series price"),
        ("A7", "Hyderabad city price"),
        ("A8", "System window price"),
        ("A9", "Master price per sqft"),
        ("A10", "Aluminium window price calculator"),
    ]
    for (code, name), u in zip(labels_a, ex_order[:10]):
        p = by_url.get(u) or by_url.get(u + "/")
        c = CURATED[u]
        hist = p["hist"] if p else "N/A"
        cur_t = p["title"] if p else "—"
        cur_m = p["meta"] if p else "—"
        cur_h = p["h1"] if p else "—"
        inv_n = p["n"] if p else "?"
        ex_lines.append(f"### {code}. {name}")
        ex_lines.append("")
        ex_lines.append(f"**Inventory #:** {inv_n} · **URL:** {u}")
        ex_lines.append("")
        ex_lines.append("**Google-style preview (PROPOSED)**")
        ex_lines.append("")
        ex_lines.append(md_serp(c["prop_title"], u, c["prop_meta"]))
        ex_lines.append("")
        ex_lines.append("| Field | Text |")
        ex_lines.append("|-------|------|")
        ex_lines.append(f"| **Mar–Apr title** (`{HIST_COMMIT}`) | {hist} |")
        ex_lines.append(f"| **CURRENT title** | {cur_t} |")
        ex_lines.append(f"| **PROPOSED title** | {c['prop_title']} |")
        ex_lines.append(f"| **CURRENT meta** | {cur_m[:180]}{'…' if len(cur_m)>180 else ''} |")
        ex_lines.append(f"| **PROPOSED meta** | {c['prop_meta']} |")
        ex_lines.append(f"| **CURRENT H1** | {cur_h} |")
        ex_lines.append(f"| **PROPOSED H1** | {c['prop_h1']} |")
        ex_lines.append(f"| **H2–H3 intent** | {c['h2_h3']} |")
        ex_lines.append(f"| **Primary SERP cue** | {c['cue']} |")
        if p:
            miss = ", ".join(p["og"]["missing"]) if p["og"]["missing"] else "—"
            ex_lines.append(f"| **OG/Twitter** | {p['og']['status']} — missing: {miss} |")
        ex_lines.append("")
        if c.get("bands"):
            ex_lines.append(f"**Verified bands on page:** {c['bands']}.")
            ex_lines.append("")
        ex_lines.append("---")
        ex_lines.append("")

    ex_lines.append("## B. Louvers, pergola, shower, mirror (hub + key child)")
    ex_lines.append("")
    labels_b = [
        ("B1", "Louvers hub"),
        ("B2", "Facade louver price (child)"),
        ("B3", "Pergola hub"),
        ("B4", "Aluminium glass-roof pergola (child)"),
        ("B5", "Shower partitions hub"),
        ("B6", "Frameless shower partition (child)"),
        ("B7", "Mirror profiles hub"),
        ("B8", "C-Type LED mirror price (child)"),
    ]
    for (code, name), u in zip(labels_b, ex_order[10:]):
        p = by_url.get(u) or by_url.get(u + "/")
        # mirror hub may be trailing slash in sitemap
        if not p and "mirror-profiles" in u:
            p = by_url.get(u + "/") or by_url.get(f"{BASE}/products/mirror-profiles/")
        c = CURATED[u]
        hist = p["hist"] if p else "N/A"
        cur_t = p["title"] if p else "—"
        cur_m = p["meta"] if p else "—"
        cur_h = p["h1"] if p else "—"
        inv_n = p["n"] if p else "?"
        ex_lines.append(f"### {code}. {name}")
        ex_lines.append("")
        ex_lines.append(f"**Inventory #:** {inv_n} · **URL:** {u}")
        ex_lines.append("")
        ex_lines.append("**Google-style preview (PROPOSED)**")
        ex_lines.append("")
        ex_lines.append(md_serp(c["prop_title"], u, c["prop_meta"]))
        ex_lines.append("")
        ex_lines.append("| Field | Text |")
        ex_lines.append("|-------|------|")
        ex_lines.append(f"| **Mar–Apr title** (`{HIST_COMMIT}`) | {hist} |")
        ex_lines.append(f"| **CURRENT title** | {cur_t} |")
        ex_lines.append(f"| **PROPOSED title** | {c['prop_title']} |")
        ex_lines.append(f"| **CURRENT meta** | {cur_m[:180]}{'…' if len(cur_m)>180 else ''} |")
        ex_lines.append(f"| **PROPOSED meta** | {c['prop_meta']} |")
        ex_lines.append(f"| **CURRENT H1** | {cur_h} |")
        ex_lines.append(f"| **PROPOSED H1** | {c['prop_h1']} |")
        ex_lines.append(f"| **H2–H3 intent** | {c['h2_h3']} |")
        ex_lines.append(f"| **Primary SERP cue** | {c['cue']} |")
        if p:
            miss = ", ".join(p["og"]["missing"]) if p["og"]["missing"] else "—"
            ex_lines.append(f"| **OG/Twitter** | {p['og']['status']} — missing: {miss} |")
        ex_lines.append("")
        if c.get("bands"):
            ex_lines.append(f"**Verified bands on page:** {c['bands']}.")
            ex_lines.append("")
        ex_lines.append("---")
        ex_lines.append("")

    ex_lines.append("## C. Cue rotation checklist (this batch)")
    ex_lines.append("")
    ex_lines.append("| # | Page | Primary SERP cue |")
    ex_lines.append("|---|------|------------------|")
    for (code, name), u in zip(labels_a + labels_b, ex_order):
        ex_lines.append(f"| {code} | {name} | {CURATED[u]['cue']} |")
    ex_lines.append("")
    ex_lines.append("---")
    ex_lines.append("")
    ex_lines.append("## D. Full site inventory")
    ex_lines.append("")
    ex_lines.append(
        f"See **`docs/SERP_PAGE_INVENTORY_GOOGLE_STYLE.md`** — numbered pages **1–{len(pages)}** from `sitemap.xml` "
        "(say “page 47 change X”)."
    )
    ex_lines.append("")
    ex_lines.append("## E. Approval next steps")
    ex_lines.append("")
    ex_lines.append("1. User picks preferred title/meta/H1 per URL (or mix variants).")
    ex_lines.append(
        "2. Only then apply SEO stack polish page-by-page (title, meta, H1, OG/Twitter, FAQ sync) — **no URL/slug changes**."
    )
    ex_lines.append("3. Keep calculator identity hooks and canonical rate source intact.")
    ex_lines.append("")
    ex_lines.append("**This file is examples-only. No HTML mass edit until approved.**")
    ex_lines.append("")

    (ROOT / "docs" / "SERP_CTR_TITLE_EXAMPLES.md").write_text(
        "\n".join(ex_lines), encoding="utf-8"
    )

    # --- Inventory file ---
    inv = []
    inv.append("# SERP Page Inventory — Google-style (WoodenMax)")
    inv.append("")
    inv.append(f"**Date:** {TODAY}")
    inv.append(f"**Source:** `sitemap.xml` ({len(pages)} URLs) + local HTML in `woodenmax-live`")
    inv.append(f"**Mar–Apr titles:** git `{HIST_COMMIT}` (2026-04-30) when file existed; else N/A")
    inv.append("**Status:** PROPOSALS for approval — do not mass-edit HTML until picked.")
    inv.append("**How to reference:** “page 47 …” = the numbered entry below.")
    inv.append("")
    inv.append("Ownership locks: 3-track ≠ Domal ≠ hub ≠ system. No URL/slug changes.")
    inv.append("")
    inv.append("---")
    inv.append("")
    inv.append("## Quick index")
    inv.append("")
    inv.append("| # | URL path | CURRENT title (short) | Cue |")
    inv.append("|---|----------|----------------------|-----|")
    for p in pages:
        path = urlparse(p["url"]).path or "/"
        short = (p["title"][:48] + "…") if len(p["title"]) > 48 else p["title"]
        short = short.replace("|", "\\|")
        inv.append(f"| {p['n']} | `{path}` | {short} | {p['prop']['cue']} |")
    inv.append("")
    inv.append("---")
    inv.append("")
    inv.append("## Pages (numbered)")
    inv.append("")

    for p in pages:
        n = p["n"]
        url = p["url"]
        prop = p["prop"]
        og = p["og"]
        miss = ", ".join(og["missing"]) if og["missing"] else "—"
        inv.append(f"### Page {n}")
        inv.append("")
        inv.append(f"**URL:** {url}")
        if not p["exists"]:
            inv.append("")
            inv.append("_Local HTML not resolved — sitemap URL only; proposals use URL/H1 heuristics._")
        inv.append("")
        inv.append("#### Google-style preview (PROPOSED)")
        inv.append("")
        inv.append(md_serp(prop["prop_title"], url, prop["prop_meta"]))
        inv.append("")
        inv.append("| Field | Text |")
        inv.append("|-------|------|")
        inv.append(f"| **Mar–Apr title** | {p['hist']} |")
        inv.append(f"| **CURRENT title** | {p['title']} |")
        inv.append(f"| **PROPOSED title** | {prop['prop_title']} |")
        meta_c = p["meta"] or "—"
        if len(meta_c) > 220:
            meta_c = meta_c[:217] + "…"
        inv.append(f"| **CURRENT meta** | {meta_c} |")
        inv.append(f"| **PROPOSED meta** | {prop['prop_meta']} |")
        inv.append(f"| **CURRENT H1** | {p['h1'] or '—'} |")
        inv.append(f"| **PROPOSED H1** | {prop['prop_h1']} |")
        h2s = "; ".join(p["h2s"][:3]) if p["h2s"] else "—"
        h3s = "; ".join(p["h3s"][:3]) if p["h3s"] else "—"
        inv.append(f"| **CURRENT H2 (sample)** | {h2s} |")
        inv.append(f"| **CURRENT H3 (sample)** | {h3s} |")
        inv.append(f"| **H2–H3 intent note** | {prop['h3_note']} |")
        inv.append(f"| **Primary SERP cue** | {prop['cue']} |")
        band = prop.get("band") or (", ".join(p["bands"][:3]) if p["bands"] else "—")
        inv.append(f"| **Verified ₹ cues on page** | {band} |")
        inv.append(f"| **OG/Twitter status** | **{og['status']}** |")
        inv.append(f"| **OG/Twitter missing** | {miss} |")
        inv.append("")
        inv.append("---")
        inv.append("")

    inv.append("## Legend")
    inv.append("")
    inv.append("- **OK** — all checked OG/Twitter tags present")
    inv.append("- **PARTIAL** — some present, some missing (list in missing column)")
    inv.append("- **MISSING** — none of the checked tags found (or HTML unresolved)")
    inv.append(
        "- Checked tags: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, "
        "`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`"
    )
    inv.append("")
    inv.append(f"**Total pages:** {len(pages)}")
    inv.append("")

    (ROOT / "docs" / "SERP_PAGE_INVENTORY_GOOGLE_STYLE.md").write_text(
        "\n".join(inv), encoding="utf-8"
    )
    print(f"Wrote examples + inventory for {len(pages)} pages")
    curated_ok = sum(1 for u in ex_order if (by_url.get(u) or by_url.get(u + "/")))
    print(f"Curated example pages resolved: {curated_ok}/{len(ex_order)}")
    print("Sample proposed titles:")
    for u in ex_order[:5]:
        print(" -", CURATED[u]["prop_title"])


if __name__ == "__main__":
    main()
