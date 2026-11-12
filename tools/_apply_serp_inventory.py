"""Parse SERP inventory (preview blocks) + apply titles/meta/H1/OG/Twitter sitewide."""
from __future__ import annotations

import html as html_lib
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(r"D:\Downloads\woodenmax-live")
INV = ROOT / "docs" / "SERP_PAGE_INVENTORY_GOOGLE_STYLE.md"
BASE = "https://woodenmax.in"

sys.path.insert(0, str(ROOT / "tools"))
from _gen_serp_inventory import (  # type: ignore
    CURATED,
    resolve_file,
    extract_title,
    extract_headings,
    meta_content,
    clean_ws,
)

SKIP_PATHS = {"about", "partner", "return-policy", "contact", "catalog"}


def parse_inventory(md: str) -> list[dict]:
    blocks = re.split(r"\n### Page (\d+)\n", md)[1:]
    pages = []
    for i in range(0, len(blocks), 2):
        num = int(blocks[i])
        body = blocks[i + 1]
        url_m = re.search(r"\*\*URL:\*\* (\S+)", body)
        if not url_m:
            continue
        url = url_m.group(1).strip()
        prev = re.search(r"#### Google-style preview \(PROPOSED\)\s*```\n(.*?)\n```", body, re.S)
        pt = pm = ""
        if prev:
            lines = [ln for ln in prev.group(1).splitlines() if ln.strip()]
            if len(lines) >= 2:
                pt = clean_ws(html_lib.unescape(lines[1]))
            if len(lines) >= 3:
                pm = clean_ws(html_lib.unescape(" ".join(lines[2:])))

        def cell(label: str) -> str:
            m = re.search(
                rf"\|\s*\*\*{re.escape(label)}\*\*\s*\|\s*(.*?)\s*\|\s*$",
                body,
                re.M,
            )
            if not m:
                return ""
            # Titles may contain | — take full remainder of row minus trailing pipe already in pattern
            raw = m.group(1)
            # If markdown split early, raw may be short; still unescape
            return clean_ws(html_lib.unescape(raw.replace(" | ", " | ")))

        if not pt:
            pt = cell("PROPOSED title")
        if not pm:
            pm = cell("PROPOSED meta")
        pages.append(
            {
                "n": num,
                "url": url,
                "pt": pt,
                "pm": pm,
                "ph": html_lib.unescape(cell("PROPOSED H1")),
                "ct": html_lib.unescape(cell("CURRENT title")),
                "cm": html_lib.unescape(cell("CURRENT meta")),
                "ch": html_lib.unescape(cell("CURRENT H1")),
                "cue": cell("Primary SERP cue").lower().strip(),
                "bands": cell("Verified ₹ cues on page"),
                "og_missing": cell("OG/Twitter missing"),
            }
        )
    return pages


def path_of(url: str) -> str:
    return urlparse(url).path.strip("/")


def is_info_page(url: str) -> bool:
    p = path_of(url)
    if p in SKIP_PATHS or p.startswith("about/") or p.startswith("policies") or p.startswith("blog"):
        return True
    return False


def strip_soft(s: str) -> str:
    s = html_lib.unescape(s or "")
    # Protect product term soft-close before stripping marketing "soft …"
    s = re.sub(r"\b[Ss]oft\s*[-\s]?[Cc]lose\b", "SOFTCLOSE_TOKEN", s)
    s = re.sub(r"\b[Ss]oft\s+[Pp]rice\s+[Bb]ands?\b", "price bands", s)
    s = re.sub(r"\b[Ss]oft\s+[Bb]ands?\b", "bands", s)
    s = re.sub(r"\b[Ss]oft\s+[Dd]esigns?\b", "designs", s)
    s = re.sub(r"\b[Ss]oft\s+", "", s)
    s = s.replace("SOFTCLOSE_TOKEN", "soft-close")
    return clean_ws(s)


def strip_serp_junk(s: str) -> str:
    """Remove GST / pls / filler from SERP-facing copy (never invent tax language)."""
    s = html_lib.unescape(s or "")
    s = re.sub(r"(?i)\s*[;,]?\s*GST\s+extra\.?", "", s)
    # Do not strip standalone GST on the dedicated GST policy page titles elsewhere;
    # only remove trailing tax filler phrases from commercial metas.
    s = re.sub(r"(?i)\s*[;,]?\s*\bGST\s+extra\b\.?", "", s)
    s = re.sub(r"(?i)\bpls\b\.?", "", s)
    s = re.sub(r"\s{2,}", " ", s)
    s = re.sub(r"\s+([.,;:])", r"\1", s)
    return clean_ws(s).strip(" ;,")


def looks_bad_title(title: str) -> bool:
    if not title or len(title) < 12:
        return True
    if "📜" in title:
        return True
    if re.search(r"[—\-]\s*\|\s*", title) or "| |" in title:
        return True
    # tiny rupee artifact ₹15 / ₹1 without sqft context
    if re.search(r"₹\s*\d{1,2}(?!\d)", title) and not re.search(r"/?\s*sqft|sq\.?\s*ft|rft", title, re.I):
        return True
    if re.search(
        r"\b(with|for|and|the|in|of|,)\s*\|\s*(WoodenMax|₹|Aluminium|Hyderabad|Get|Live|Instant|Size|Glass|Modern)\b",
        title,
    ):
        return True
    return False


def ensure_brand(title: str, force: bool = True) -> str:
    title = clean_ws(title)
    title = re.sub(r"(\s*\|\s*WoodenMax)+\s*$", " | WoodenMax", title, flags=re.I)
    if force and "woodenmax" not in title.lower():
        title = title.rstrip(" |") + " | WoodenMax"
    title = re.sub(r"(\|\s*WoodenMax)(?:\s*\|\s*WoodenMax)+", r"\1", title, flags=re.I)
    return clean_ws(title)


def pick_band_snippet(bands: str) -> str:
    if not bands or bands.strip() in {"—", "-", ""}:
        return ""
    parts = re.split(r"\s*[·•]\s*", bands)
    for p in parts:
        p = clean_ws(p)
        m = re.search(
            r"(?:from\s*)?₹\s*[\d,]+(?:\s*[–—-]\s*₹?\s*[\d,]+)?(?:\s*/\s*(?:sq\.?\s*ft|sqft|rft))?",
            p,
            re.I,
        )
        if m and (re.search(r"sqft|sq\.?\s*ft|rft", p, re.I) or "from" in p.lower() or "–" in m.group(0) or "-" in m.group(0)):
            sn = clean_ws(m.group(0)).replace("—", "–")
            sn = re.sub(r"\s*/\s*", "/", sn)
            if "sqft" not in sn.lower() and "rft" not in sn.lower() and re.search(r"sqft|rft", p, re.I):
                unit = "sqft" if "sqft" in p.lower() else "rft"
                sn = sn.rstrip("/") + f"/{unit}"
            if "from" not in sn.lower() and "–" not in sn and re.search(r"\d", sn):
                if "/sqft" in sn.lower() or "/rft" in sn.lower():
                    sn = "from " + sn
            return sn
    return ""


def cue_in_title(title: str, cue: str) -> bool:
    low = title.lower()
    cue = (cue or "").lower()
    mapping = {
        "live calculator": ("live calculator", "calculator"),
        "live estimate": ("live estimate", "estimate"),
        "live cost": ("live cost",),
        "instant quote": ("instant quote",),
        "size & cost tool": ("size & cost", "size and cost", "calculator"),
        "price": ("price",),
        "cost": ("cost", "price"),
        "estimate": ("estimate", "types", "for homes", "for indian", "for bathrooms", "for facades", "for terrace"),
    }
    keys = mapping.get(cue, ())
    return any(k in low for k in keys) if keys else True


def cue_phrase(cue: str) -> str:
    return {
        "live calculator": "Live Calculator",
        "live estimate": "Live Estimate",
        "live cost": "Live Cost",
        "instant quote": "Instant Quote",
        "size & cost tool": "Size & Cost Tool",
        "price": "Price",
        "cost": "Cost",
        "estimate": "Estimate",
    }.get((cue or "").lower(), "")


def _cue_score(mid: str) -> int:
    low = mid.lower()
    s = 0
    if "live calculator" in low or "live estimate" in low or "live cost" in low:
        s += 50
    if "instant quote" in low:
        s += 40
    if "size & cost" in low:
        s += 40
    if "₹" in mid or "sqft" in low:
        s += 45
    if any(k in low for k in ("sliding", "casement", "slim", "glass roof", "louver", "frameless", "types")):
        s += 15
    return s


def shorten_title(title: str, limit: int = 72) -> str:
    """Shorten without chopping product identity or CTR cues (calc/₹)."""
    title = clean_ws(title)
    if len(title) <= limit:
        return ensure_brand(title, force=True)

    for drop in (
        " | Aluminium Design",
        " | Modern Design",
        " | Manufacturer WoodenMax",
    ):
        if drop in title:
            title = title.replace(drop, " | WoodenMax" if "WoodenMax" in drop else "")
            title = clean_ws(title)
            if len(title) <= limit:
                return ensure_brand(title, force=True)

    parts = [p.strip() for p in title.split("|") if p.strip()]
    if not parts:
        return title[:limit]

    core = parts[0]
    rest = [p for p in parts[1:] if "woodenmax" not in p.lower()]
    rest_sorted = sorted(rest, key=_cue_score, reverse=True)

    def pack(use_brand: bool) -> str:
        chosen = []
        for mid in rest_sorted:
            trial = [core] + chosen + [mid] + (["WoodenMax"] if use_brand else [])
            if len(" | ".join(trial)) <= limit:
                chosen.append(mid)
        return " | ".join([core] + chosen + (["WoodenMax"] if use_brand else []))

    with_brand = pack(True)
    has_high = any(_cue_score(x) >= 40 for x in rest)
    kept_high = any(_cue_score(x) >= 40 for x in with_brand.split("|")[1:])
    if has_high and not kept_high:
        no_brand = pack(False)
        if any(_cue_score(x) >= 40 for x in no_brand.split("|")[1:] if x.strip()):
            return clean_ws(no_brand)
    if len(with_brand) <= limit:
        return with_brand if "woodenmax" in with_brand.lower() else ensure_brand(with_brand, force=True)

    top = rest_sorted[0] if rest_sorted else ""
    cue_bit = f" | {top}" if top else ""
    brand_bit = " | WoodenMax"
    budget = limit - len(cue_bit) - len(brand_bit)
    if top and budget >= 24:
        core2 = core if len(core) <= budget else core[:budget].rsplit(" ", 1)[0]
        return clean_ws(f"{core2}{cue_bit}{brand_bit}")
    if top:
        budget = limit - len(f" | {top}")
        core2 = core if len(core) <= budget else core[:budget].rsplit(" ", 1)[0]
        return clean_ws(f"{core2} | {top}")
    return ensure_brand(core[: max(24, limit - 12)].rsplit(" ", 1)[0], force=True)


def enrich_title(title: str, cue: str, bands: str, url: str, current: str, curated: bool) -> str:
    title = strip_soft(html_lib.unescape(title or ""))
    current = strip_soft(html_lib.unescape(current or ""))
    if "gst-transport" not in path_of(url):
        title = strip_serp_junk(title)
        current = strip_serp_junk(current)

    if looks_bad_title(title):
        title = current or title

    if is_info_page(url):
        # Prefer CURRENT for about/policy/blog unless proposed clearly better & not truncated
        if looks_bad_title(title) or len(title) < len(current) - 10:
            title = current or title
        if "gst-transport" in path_of(url):
            return shorten_title(ensure_brand(title), 70)
        return shorten_title(ensure_brand(strip_serp_junk(title)), 70)

    # Curated: light touch only — brand + soft strip already done
    if curated:
        title = ensure_brand(title)
        # optional enhancers if short
        rot = sum(ord(c) for c in path_of(url)) % 5
        low = title.lower()
        if rot == 0 and "manufacturer" not in low and len(title) < 58:
            title = title.replace("| WoodenMax", "| Manufacturer WoodenMax")
        elif rot == 1 and "design" not in low and len(title) < 52 and cue == "estimate":
            title = title.replace("| WoodenMax", "| Modern Design | WoodenMax")
        return shorten_title(ensure_brand(title), 82)

    # Auto proposals: ensure cue + honest band where natural
    band_sn = pick_band_snippet(bands)
    low = title.lower()
    has_rupee = "₹" in title
    need_rebuild = (not cue_in_title(title, cue)) or (
        band_sn
        and not has_rupee
        and cue in ("live calculator", "live estimate", "live cost", "price", "cost", "instant quote")
    )

    if need_rebuild:
        base = re.sub(
            r"\s*[|—–]\s*(Live Calculator|Live Estimate|Live Cost|Instant Quote|Size & Cost Tool|Get an Estimate|Manufacturer WoodenMax|WoodenMax).*$",
            "",
            title,
            flags=re.I,
        )
        base = clean_ws(base)
        phrase = cue_phrase(cue)
        if cue == "price" and "price" in base.lower():
            title = f"{base} | {band_sn} | WoodenMax" if band_sn else ensure_brand(base)
        elif cue in ("live calculator", "live estimate", "live cost") and band_sn:
            title = f"{base} | {phrase} · {band_sn} | WoodenMax"
        elif cue == "instant quote":
            extra = f" · {band_sn}" if band_sn and not has_rupee else ""
            title = f"{base} | Instant Quote{extra} | WoodenMax"
        elif phrase:
            title = f"{base} | {phrase} | WoodenMax"
        else:
            title = ensure_brand(base)

    # Enhancers rotation
    rot = sum(ord(c) for c in path_of(url)) % 5
    low = title.lower()
    if rot == 0 and "manufacturer" not in low and len(title) < 56:
        title = ensure_brand(title).replace("| WoodenMax", "| Manufacturer WoodenMax")
    elif rot == 1 and "design" not in low and cue == "estimate" and len(title) < 50:
        title = ensure_brand(title).replace("| WoodenMax", "| Modern Design | WoodenMax")
    elif rot == 2 and "design" not in low and "window" in low and cue in ("live cost", "live estimate") and len(title) < 52:
        title = ensure_brand(title).replace("| WoodenMax", "| Aluminium Design | WoodenMax")

    return shorten_title(ensure_brand(title), 80)


def enrich_meta(meta: str, cue: str, bands: str, url: str, title: str, current_meta: str) -> str:
    meta = strip_serp_junk(strip_soft(html_lib.unescape(meta or "")))
    current_meta = strip_serp_junk(strip_soft(html_lib.unescape(current_meta or "")))
    # GST policy page may legitimately mention GST in body/title — keep CURRENT wording
    if "gst-transport" in path_of(url):
        meta = current_meta or meta
        if len(meta) > 165:
            meta = meta[:162].rsplit(" ", 1)[0] + "…"
        return meta
    if is_info_page(url):
        meta = current_meta or meta
        meta = re.sub(r"\bfree quote\b", "quote", meta, flags=re.I)
        meta = strip_serp_junk(meta)
        if len(meta) > 165:
            meta = meta[:162].rsplit(" ", 1)[0] + "…"
        return meta

    if not meta or len(meta) < 40 or looks_bad_title(meta[:50]):
        meta = current_meta or meta
    if not meta or len(meta) < 40:
        band_sn = pick_band_snippet(bands)
        label = re.sub(r"\s*\|\s*.*$", "", title)
        meta = f"{label}."
        if band_sn:
            meta += f" Planning {band_sn}."
        if cue:
            meta += f" {cue[0].upper() + cue[1:]} available on WoodenMax."
        meta += " Manufacturer WoodenMax."

    if "manufacturer" not in meta.lower() and not is_info_page(url):
        if sum(ord(c) for c in path_of(url)) % 2 == 0:
            meta = meta.rstrip(".…") + ". Manufacturer WoodenMax."
    meta = re.sub(r"\bfree quote\b", "quote", meta, flags=re.I)
    meta = re.sub(r"\bfree tips\b", "tips", meta, flags=re.I)
    meta = strip_serp_junk(meta)
    if len(meta) > 165:
        meta = meta[:162].rsplit(" ", 1)[0] + "…"
    return meta


def enrich_h1(proposed: str, current: str, url: str) -> str:
    h1 = strip_serp_junk(strip_soft(html_lib.unescape(proposed or current or "")))
    if is_info_page(url) and current:
        h1 = strip_soft(current) if "gst-transport" in path_of(url) else strip_serp_junk(strip_soft(current))
    if not h1:
        h1 = strip_soft(current)
    return clean_ws(h1)


def set_title(html: str, title: str) -> str:
    esc = html_lib.escape(title, quote=False)
    if re.search(r"<title[^>]*>.*?</title>", html, re.I | re.S):
        return re.sub(r"<title[^>]*>.*?</title>", f"<title>{esc}</title>", html, count=1, flags=re.I | re.S)
    return html.replace("</head>", f"<title>{esc}</title>\n</head>", 1)


def set_meta_name(html: str, name: str, content: str) -> str:
    esc = html_lib.escape(content, quote=True)
    pats = [
        rf'(<meta[^>]+name=["\']{re.escape(name)}["\'][^>]+content=["\'])([^"\']*)(["\'])',
        rf'(<meta[^>]+content=["\'])([^"\']*)(["\'][^>]+name=["\']{re.escape(name)}["\'])',
    ]
    for p in pats:
        if re.search(p, html, re.I):
            return re.sub(p, lambda m: m.group(1) + esc + m.group(3), html, count=1, flags=re.I)
    tag = f'<meta name="{name}" content="{esc}" />'
    if re.search(r"</title>", html, re.I):
        return re.sub(r"</title>", f"</title>\n {tag}", html, count=1, flags=re.I)
    return html.replace("</head>", f"{tag}\n</head>", 1)


def set_meta_prop(html: str, prop: str, content: str) -> str:
    esc = html_lib.escape(content, quote=True)
    pats = [
        rf'(<meta[^>]+property=["\']{re.escape(prop)}["\'][^>]+content=["\'])([^"\']*)(["\'])',
        rf'(<meta[^>]+content=["\'])([^"\']*)(["\'][^>]+property=["\']{re.escape(prop)}["\'])',
    ]
    for p in pats:
        if re.search(p, html, re.I):
            return re.sub(p, lambda m: m.group(1) + esc + m.group(3), html, count=1, flags=re.I)
    tag = f'<meta property="{prop}" content="{esc}" />'
    if re.search(r"</title>", html, re.I):
        return re.sub(r"</title>", f"</title>\n {tag}", html, count=1, flags=re.I)
    return html.replace("</head>", f"{tag}\n</head>", 1)


def set_first_h1(html: str, new_h1: str) -> str:
    m = re.search(r"(<h1\b[^>]*>)([\s\S]*?)(</h1>)", html, re.I)
    if not m:
        return html
    repl = m.group(1) + html_lib.escape(new_h1, quote=False) + m.group(3)
    return html[: m.start()] + repl + html[m.end() :]


def existing_og_image(html: str) -> str:
    return meta_content(html, prop="og:image") or meta_content(html, name="twitter:image")


def apply_page(p: dict, dry: bool = False) -> dict:
    fp = resolve_file(p["url"])
    if not fp or not fp.is_file():
        return {"n": p["n"], "url": p["url"], "status": "MISSING_FILE"}

    html = fp.read_text(encoding="utf-8", errors="ignore")
    before_title = extract_title(html)
    before_meta = meta_content(html, name="description")
    before_h1 = (extract_headings(html, "h1", 1) or [""])[0]

    key = p["url"].rstrip("/")
    curated = CURATED.get(key) or CURATED.get(p["url"]) or CURATED.get(key + "/")
    if curated:
        title = curated["prop_title"]
        meta = curated["prop_meta"]
        h1 = curated["prop_h1"]
        cue = curated.get("cue", p["cue"])
        bands = curated.get("bands") or p["bands"]
        is_curated = True
    else:
        title = p["pt"]
        meta = p["pm"]
        h1 = p["ph"] or p["ch"]
        cue = p["cue"]
        bands = p["bands"]
        is_curated = False

    # Home: keep brand-first title
    if path_of(p["url"]) == "":
        title = "WoodenMax | Premium Aluminium Windows, Glass Facades & Door Systems India"
        meta = strip_soft(p["cm"] or before_meta)
        if "live calculator" not in meta.lower():
            meta = (meta.rstrip(".") + ". Live calculators and ₹/sqft planning guides.")[:165]
        h1 = before_h1 or p["ch"]
        is_curated = True

    title = enrich_title(title, cue, bands, p["url"], p["ct"] or before_title, curated=is_curated)
    meta = enrich_meta(meta, cue, bands, p["url"], title, p["cm"] or before_meta)
    h1 = enrich_h1(h1, before_h1, p["url"])

    new_html = html
    new_html = set_title(new_html, title)
    new_html = set_meta_name(new_html, "description", meta)
    new_html = set_meta_prop(new_html, "og:title", title)
    new_html = set_meta_prop(new_html, "og:description", meta)
    new_html = set_meta_name(new_html, "twitter:title", title)
    new_html = set_meta_name(new_html, "twitter:description", meta)
    if not meta_content(new_html, name="twitter:card"):
        new_html = set_meta_name(new_html, "twitter:card", "summary_large_image")
    if not meta_content(new_html, prop="og:type"):
        og_type = "article" if path_of(p["url"]).startswith("blog") else "website"
        new_html = set_meta_prop(new_html, "og:type", og_type)
    img = existing_og_image(new_html)
    if img:
        if not img.startswith("http"):
            img = BASE + (img if img.startswith("/") else "/" + img)
            new_html = set_meta_prop(new_html, "og:image", img)
        if not meta_content(new_html, name="twitter:image"):
            new_html = set_meta_name(new_html, "twitter:image", img if img.startswith("http") else BASE + img)
        if not meta_content(new_html, prop="og:image"):
            new_html = set_meta_prop(new_html, "og:image", img if img.startswith("http") else BASE + "/" + img.lstrip("/"))
    if not meta_content(new_html, prop="og:url"):
        og_url = p["url"] if path_of(p["url"]) else BASE + "/"
        new_html = set_meta_prop(new_html, "og:url", og_url)

    if h1 and clean_ws(h1) != clean_ws(before_h1) and "📜" not in h1:
        new_html = set_first_h1(new_html, h1)

    changed = new_html != html
    if changed and not dry:
        # Preserve original newline style roughly
        fp.write_text(new_html, encoding="utf-8", newline="\n")

    return {
        "n": p["n"],
        "url": p["url"],
        "file": str(fp.relative_to(ROOT)).replace("\\", "/"),
        "status": "UPDATED" if changed else "UNCHANGED",
        "before_title": before_title,
        "after_title": title,
        "before_meta": (before_meta or "")[:100],
        "after_meta": meta[:100],
        "before_h1": before_h1,
        "after_h1": h1,
        "cue": cue,
        "curated": is_curated,
        "segment": segment_of(p["url"]),
    }


def segment_of(url: str) -> str:
    p = path_of(url)
    if not p:
        return "home"
    if p.startswith("products/aluminium-windows") or p in (
        "aluminium-window-price-calculator",
        "glass-elevation-price-calculator",
        "calculators",
    ):
        return "windows"
    if p.startswith("products/shower") or "shower" in p.split("/")[-1]:
        return "shower"
    if p.startswith("products/pergola"):
        return "pergola"
    if p.startswith("products/metal-louvers"):
        return "louvers"
    if p.startswith("products/mirror"):
        return "mirrors"
    if p.startswith("products/glass-railing") or p.startswith("products/grills"):
        return "railing_grills"
    if p.startswith("products/folding") or p.startswith("products/telescope"):
        return "folding_telescope"
    if p.startswith("products/elevation") or p.startswith("products/glass-elevation"):
        return "elevation"
    if p.startswith("city/"):
        return "city"
    if p.startswith("blog"):
        return "blog"
    if p.startswith("about") or p.startswith("policies") or p in ("contact", "partner", "catalog", "return-policy"):
        return "info"
    return "other"


def main():
    dry = "--dry" in sys.argv
    only = None
    only_pages = None
    for a in sys.argv[1:]:
        if a.startswith("--segment="):
            only = a.split("=", 1)[1]
        if a.startswith("--pages="):
            only_pages = {int(x) for x in a.split("=", 1)[1].split(",") if x.isdigit()}

    pages = parse_inventory(INV.read_text(encoding="utf-8"))
    results = []
    for p in pages:
        if only and segment_of(p["url"]) != only:
            continue
        if only_pages is not None and p["n"] not in only_pages:
            continue
        results.append(apply_page(p, dry=dry))

    updated = [r for r in results if r.get("status") == "UPDATED"]
    missing = [r for r in results if r.get("status") == "MISSING_FILE"]
    unchanged = [r for r in results if r.get("status") == "UNCHANGED"]
    out = {
        "dry": dry,
        "processed": len(results),
        "updated": len(updated),
        "unchanged": len(unchanged),
        "missing": len(missing),
        "by_segment": {},
        "samples_dual": [],
        "all": results,
    }
    for r in results:
        seg = r.get("segment") or segment_of(r["url"])
        out["by_segment"].setdefault(seg, {"updated": 0, "unchanged": 0})
        out["by_segment"][seg]["updated" if r["status"] == "UPDATED" else "unchanged"] += 1

    dual_ns = [42, 45, 46, 57, 14, 106, 128, 140, 157, 26, 84]
    by = {r["n"]: r for r in results}
    for n in dual_ns:
        if n in by:
            r = by[n]
            out["samples_dual"].append(
                {"n": n, "before": r.get("before_title"), "after": r.get("after_title"), "h1": r.get("after_h1")}
            )

    (ROOT / "tools" / "_serp_apply_report.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"processed={len(results)} updated={len(updated)} unchanged={len(unchanged)} missing={len(missing)} dry={dry}")
    print("by_segment", json.dumps(out["by_segment"]))
    for s in out["samples_dual"]:
        print(f"#{s['n']}")
        print(f"  BEFORE: {s['before']}")
        print(f"  AFTER:  {s['after']}")
        print(f"  H1:     {s['h1']}")


if __name__ == "__main__":
    main()
