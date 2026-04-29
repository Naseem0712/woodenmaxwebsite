#!/usr/bin/env python3
"""Inject 3 India-first global tool FAQs at end of FAQ / Q&A section (faq-item pages)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SKIP_NAMES = frozenset(
    {
        "aluminium-window-price-calculator.html",
        "glass-elevation-price-calculator.html",
    }
)

SKIP_MARKERS = [
    "<span>Can I use this calculator if I live outside India?</span>",
    "<span>Can I use telescope or kitchen calculators if I live outside India?</span>",
    "Can I use grill or window calculators if I am not in India?",
    "<span>Can I use this glass elevation calculator from outside India?</span>",
    "<h3>Can I use this calculator if I live outside India?</h3>",
]

SNIPPET_A = """        <div class="faq-item">
          <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            <span>Can I use this calculator if I live outside India?</span>
            <div class="faq-toggle">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">Yes. The live calculator on this page runs in your browser with no login—enter sizes in feet, metres, inches, cm, or mm. In India you see ₹ pricing; outside India amounts may show in local currency as a planning guide on India base rates. Supply, site visits, and final quotes remain primarily for projects in India—contact us with your country for export or special cases.</div>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            <span>What can I use on WoodenMax without signing up?</span>
            <div class="faq-toggle">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">You can use the full live price calculator on this page, switch measurement units, add multiple sizes where available, and compare options in real time. Use the quote or contact form only when you want an exact figure or call-back—everything else works without an account.</div>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            <span>Are specs and tools clear for international projects?</span>
            <div class="faq-toggle">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">Yes. Technical details on this page are in English (profiles, glass, hardware, finishes) so architects and homeowners abroad can compare with local standards. India market rates in ₹ stay central for search; these lines only explain that tools are open to everyone.</div>
          </div>
        </div>"""

SNIPPET_B = """        <div class="faq-item">
          <div class="faq-question" onclick="toggleFaq(this)">
            <h3>Can I use this calculator if I live outside India?</h3>
            <svg class="faq-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          <div class="faq-answer">
            <p>Yes. Use the live calculator on this page with no login—enter area in feet, metres, inches, cm, or mm. In India you see ₹ pricing; outside India you may see local currency as a planning guide on India base rates. Facade supply and installation focus on Indian projects; contact us from abroad for special cases.</p>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question" onclick="toggleFaq(this)">
            <h3>What can I use on WoodenMax without signing up?</h3>
            <svg class="faq-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          <div class="faq-answer">
            <p>Switch units, try glass colours and frame options, and refresh totals in real time. Submit forms only when you want a detailed quote—no account for estimates.</p>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question" onclick="toggleFaq(this)">
            <h3>Are specifications in English for international reference?</h3>
            <svg class="faq-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          <div class="faq-answer">
            <p>Yes. Curtain wall, glazing, and glass options are documented in English. India ₹ bands and local SEO intent stay primary.</p>
          </div>
        </div>"""

TAIL_RE = re.compile(
    r"(        </div>)(\s*\n      </div>\s*\n    </div>\s*\n  </section>)",
    re.MULTILINE,
)


def faq_anchor(content: str) -> int:
    for label in ("<!-- FAQ SECTION -->", "<!-- Q&A SECTION -->"):
        i = content.find(label)
        if i >= 0:
            return i
    # e.g. <!-- FAQ SECTION (Mobile Only ...) -->
    i = content.find("<!-- FAQ SECTION ")
    if i >= 0:
        return i
    return -1


def extract_faq_section(content: str, start: int) -> str | None:
    sub = content[start:]
    e = sub.find("</section>")
    if e < 0:
        return None
    return sub[: e + len("</section>")]


def choose_variant(faq_section: str) -> str:
    first_item = faq_section.find('class="faq-item"')
    if first_item < 0:
        return "a"
    window = faq_section[first_item : first_item + 500]
    if "toggleFaq(this)" in window and "<h3>" in window:
        return "b"
    return "a"


def inject_snippet(faq_section: str, snippet: str) -> str | None:
    matches = list(TAIL_RE.finditer(faq_section))
    if not matches:
        return None
    last = matches[-1]
    return faq_section[: last.start()] + last.group(1) + "\n" + snippet + last.group(2)


def process_file(path: Path) -> bool:
    if path.name in SKIP_NAMES:
        return False
    text = path.read_text(encoding="utf-8")
    if 'class="faq-item"' not in text:
        return False
    if any(m in text for m in SKIP_MARKERS):
        return False
    start = faq_anchor(text)
    if start < 0:
        return False
    fs = extract_faq_section(text, start)
    if fs is None or 'class="faq-item"' not in fs:
        return False
    snippet = SNIPPET_B if choose_variant(fs) == "b" else SNIPPET_A
    new_fs = inject_snippet(fs, snippet)
    if new_fs is None:
        print("no tail match", path.relative_to(ROOT), file=sys.stderr)
        return False
    path.write_text(text[:start] + new_fs + text[start + len(fs) :], encoding="utf-8")
    return True


def main() -> None:
    seen: set[str] = set()
    n = 0
    for path in sorted(ROOT.rglob("*.html")):
        if "node_modules" in path.parts:
            continue
        key = str(path.resolve()).lower()
        if key in seen:
            continue
        seen.add(key)
        if process_file(path):
            print(path.relative_to(ROOT).as_posix())
            n += 1
    print("injected:", n, file=sys.stderr)


if __name__ == "__main__":
    main()
