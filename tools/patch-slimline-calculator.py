"""One-off: embed live calculator on slimline-aluminium-window.html"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
lux = (ROOT / "products/aluminium-windows/slim-aluminium-window-price-luxury.html").read_text(
    encoding="utf-8"
)
slim_path = ROOT / "products/aluminium-windows/slimline-aluminium-window.html"
slim = slim_path.read_text(encoding="utf-8")

start = lux.index('<section style="padding:3rem 0;background:#f8fafc;" id="window-price-calculator">')
end = lux.index(
    "</section>",
    lux.index("      </div>\n    </div>\n  </section>", start),
) + len("</section>")
calc_block = lux[start:end]
calc_block = calc_block.replace(
    "price-calculator-seo-slim-luxury", "price-calculator-slimline-aluminium-window"
)
calc_block = calc_block.replace(
    'data-product="top-hung-casement"', 'data-product="slimline-aluminium-window"'
)
calc_block = calc_block.replace('id="window-price-calculator"', 'id="price-calculator"')
calc_block = calc_block.replace(
    "<h2 class=\"section-title\">Price Calculator (Interactive Section)</h2>",
    '<h2 class="section-title" style="color:#0f172a;">Live Slimline Window Price Calculator</h2>',
)
calc_block = calc_block.replace(
    "<p><strong>Profile:</strong> 40mm Casement Profile</p>",
    "<p><strong>Profile:</strong> Slimline casement — Hindalco / imported, black powder coat</p>",
)
calc_block = calc_block.replace(
    "<p><strong>Base Rate:</strong> Includes 6mm clear toughened glass, single point lock (handle type), friction stay</p>",
    "<p><strong>Base Rate:</strong> From ₹900/sq.ft (single glass) to ₹1400/sq.ft (DGU) — Saint-Gobain glass, imported hardware</p>",
)

fake_start = slim.index("          <!-- Product Options -->")
fake_end = slim.index("          <!-- Key Features -->", fake_start)
slim = slim[:fake_start] + slim[fake_end:]

marker = "  <!-- DETAILED DESCRIPTION -->"
slim = slim.replace(marker, calc_block + "\n\n" + marker, 1)

inq_start = slim.index("  <!-- Quick inquiry:")
inq_end = slim.index("  <!-- FOOTER -->", inq_start)
slim = slim[:inq_start] + slim[inq_end:]

css_insert = (
    '  <link rel="stylesheet" href="../../css/calculator-global.css">\n'
    '  <link rel="stylesheet" href="../../css/calculator-mobile-ux.css?v=20260531">\n'
)
if "calculator-global.css" not in slim:
    slim = slim.replace(
        '  <link rel="stylesheet" href="../../css/site-footer.css">',
        '  <link rel="stylesheet" href="../../css/site-footer.css">\n' + css_insert,
    )

slim = slim.replace(
    "Get a quote via enquiry form on this page.",
    "Live calculator for instant ₹/sq.ft quote. Book online with Razorpay.",
)

script_block = """  <a href="#price-calculator-slimline-aluminium-window" class="floating-calc-button" aria-label="Scroll to calculator">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
      <rect width="16" height="20" x="4" y="2" rx="2"/><path d="M8 6h8"/><path d="M16 14v4"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/>
    </svg>
    <span class="floating-calc-button-text">Calculator</span>
  </a>
  <script src="../../js/calculator/configs.js" defer></script>
  <script src="../../js/calculator/base.js" defer></script>
  <script src="../../js/calculator/extensions/top-hung-casement.js" defer></script>
  <script src="../../js/calculator/loader.js" defer></script>
  <script src="../../js/calculator/smooth-typing-indicator.js" defer></script>
  <script src="../../js/calculator/multiple-sizes-calculator.js" defer></script>
  <script src="../../js/floating-calc-button.js" defer></script>
  <script src="../../js/calculator-mobile-ux.js?v=20260531" defer></script>
"""
script_start = slim.index('  <script defer src="../../js/email-submitter.js"></script>')
script_end = slim.index('  <script src="../../js/mobile-collapsible-sections.js"', script_start)
slim = slim[:script_start] + script_block + slim[script_end:]

slim_path.write_text(slim, encoding="utf-8")
print("OK:", slim_path)
