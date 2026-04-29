"""Convert static city page FAQ cards to .faq-item accordion markup."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CITY_DIR = ROOT / "city"

SVG = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" '
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    '<path d="m6 9 6 6 6-6"/></svg>'
)

PATTERN = re.compile(
    r'        <div style="(?:margin-bottom: 1\.5rem; )?padding: 1\.5rem; background: #FFFFFF; border-radius: \d+px; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px 0 rgba\(0,\s*0,\s*0,\s*0\.05\);">\s*'
    r'<h3 style="color: #0F172A; font-size: 1\.1rem; margin-bottom: 0\.75rem;(?: font-weight: 600;)?">(?P<q>.*?)</h3>\s*'
    r'<p style="color: #(?:111111|475569); line-height: 1\.7;(?: margin: 0;)?">(?P<a>.*?)</p>\s*'
    r'</div>',
    re.DOTALL,
)


def to_faq(m: re.Match[str]) -> str:
    q = m.group("q").strip()
    a = m.group("a").strip()
    return (
        "        <div class=\"faq-item\">\n"
        "          <div class=\"faq-question\" onclick=\"this.parentElement.classList.toggle('active')\">\n"
        f"            <span>{q}</span>\n"
        "            <div class=\"faq-toggle\">\n"
        f"              {SVG}\n"
        "            </div>\n"
        "          </div>\n"
        "          <div class=\"faq-answer\">\n"
        f"            <div class=\"faq-answer-content\">{a}</div>\n"
        "          </div>\n"
        "        </div>"
    )


def main() -> None:
    for path in sorted(CITY_DIR.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        if "<!-- FAQ SECTION -->" not in text:
            continue
        new_text, n = PATTERN.subn(to_faq, text)
        if n == 0:
            print(f"No matches: {path.name}")
            continue
        path.write_text(new_text, encoding="utf-8")
        print(f"Converted {n} FAQs in {path.name}")


if __name__ == "__main__":
    main()
