#!/usr/bin/env python3
"""Convert all PDF and DOCX files in the repository root to Markdown in sources-md/."""

import os
import sys
from pathlib import Path

try:
    from markitdown import MarkItDown
except ImportError:
    print("Error: markitdown not installed. Run: pip install 'markitdown[all]'", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).parent
OUTPUT_DIR = ROOT / "sources-md"
OUTPUT_DIR.mkdir(exist_ok=True)

EXTENSIONS = {".pdf", ".docx"}

md_converter = MarkItDown()
errors = []

sources = sorted(p for p in ROOT.iterdir() if p.suffix.lower() in EXTENSIONS)

if not sources:
    print("No PDF or DOCX files found in the repository root.")
    sys.exit(0)

for source in sources:
    output = OUTPUT_DIR / (source.stem + ".md")
    print(f"Converting: {source.name} -> sources-md/{output.name}")
    try:
        result = md_converter.convert(str(source))
        text = result.text_content.strip()
        if not text:
            print(f"  WARNING: {source.name} produced empty output (may be a scanned PDF without OCR).")
        output.write_text(text, encoding="utf-8")
    except Exception as exc:
        print(f"  ERROR converting {source.name}: {exc}", file=sys.stderr)
        errors.append(source.name)

if errors:
    print(f"\nConversion failed for {len(errors)} file(s):", file=sys.stderr)
    for name in errors:
        print(f"  - {name}", file=sys.stderr)
    sys.exit(1)

print(f"\nDone. {len(sources) - len(errors)} file(s) converted to sources-md/.")
