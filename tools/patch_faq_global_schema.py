#!/usr/bin/env python3
"""Append India-first global calculator FAQs to FAQPage JSON-LD (all matching HTML)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

GLOBAL_FAQS = [
    {
        "@type": "Question",
        "name": "Can I use this calculator if I live outside India?",
        "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. WoodenMax calculators work in the browser with no login—enter sizes in feet, metres, inches, cm, or mm for instant estimates. In India you see ₹ pricing; outside India amounts may show in local currency as a planning guide on India base rates. On-site supply, site visits, and final quotes are primarily for projects in India—contact us with your country for export or special cases.",
        },
    },
    {
        "@type": "Question",
        "name": "What can I use on WoodenMax without signing up?",
        "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can run live price calculators on our product pages, switch units, add multiple sizes where the tool allows, and compare options in real time. Use quote or contact forms only when you want a firm quote or call-back—no account is required for estimates.",
        },
    },
    {
        "@type": "Question",
        "name": "Are product specs in English for international reference?",
        "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Profiles, glass, hardware, and finishes are described in English so architects, consultants, and homeowners abroad can compare with local standards. India market rates in ₹ and brands such as Hindalco or Saint-Gobain remain central; the tools help you budget before you speak to our team.",
        },
    },
]


def _iter_ld_json_chunks(html: str):
    needle = '<script type="application/ld+json">'
    i = 0
    while True:
        s = html.find(needle, i)
        if s == -1:
            break
        start = s + len(needle)
        e = html.find("</script>", start)
        if e == -1:
            break
        yield s, e, html[start:e].strip()
        i = e + len("</script>")


def _faq_already_global(names: list[str]) -> bool:
    for n in names:
        if "live outside India" in n:
            return True
    return False


def patch_html_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    changed = False
    segments: list[str] = []
    last = 0
    for s, e, json_raw in _iter_ld_json_chunks(text):
        segments.append(text[last:s])
        try:
            data = json.loads(json_raw)
        except json.JSONDecodeError:
            segments.append(text[s : e + len("</script>")])
            last = e + len("</script>")
            continue
        if data.get("@type") == "FAQPage" and isinstance(data.get("mainEntity"), list):
            names = [
                str(ent["name"])
                for ent in data["mainEntity"]
                if isinstance(ent, dict) and ent.get("name")
            ]
            if _faq_already_global(names):
                segments.append(text[s : e + len("</script>")])
                last = e + len("</script>")
                continue
            data["mainEntity"] = list(data["mainEntity"]) + GLOBAL_FAQS
            new_inner = json.dumps(data, ensure_ascii=False, indent=2)
            indented = "\n  " + new_inner.replace("\n", "\n  ") + "\n  "
            segments.append(f'<script type="application/ld+json">{indented}</script>')
            last = e + len("</script>")
            changed = True
        else:
            segments.append(text[s : e + len("</script>")])
            last = e + len("</script>")
    segments.append(text[last:])
    if changed:
        path.write_text("".join(segments), encoding="utf-8")
    return changed


def main() -> None:
    n = 0
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        if "node_modules" in rel.parts or ".git" in rel.parts:
            continue
        if patch_html_file(path):
            print("patched", rel.as_posix())
            n += 1
    print("total patched:", n)


if __name__ == "__main__":
    main()
