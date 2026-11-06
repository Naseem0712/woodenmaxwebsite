"""Rewrite products-feed.xml from a Merchant CSV (page-level products only).

Package SKUs live only in products-packages-feed.csv so the same id is never
uploaded through two primary feeds (GMC: "Item uploaded through multiple feeds").
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

from generate_merchant_feed import write_xml_feed  # noqa: E402


def main() -> None:
    csv_arg = sys.argv[1] if len(sys.argv) > 1 else "products-feed.csv"
    csv_path = Path(csv_arg)
    if not csv_path.is_absolute():
        csv_path = ROOT / csv_path
    if not csv_path.is_file():
        print(f"Missing CSV: {csv_path}", file=sys.stderr)
        sys.exit(1)
    with csv_path.open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    write_xml_feed(rows)
    print(f"Rewrote products-feed.xml from {csv_path.name} ({len(rows)} entries)")


if __name__ == "__main__":
    main()
