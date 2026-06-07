"""Trim transparent padding from the brand PNGs so the logos sit tight in the layout."""
from pathlib import Path
from PIL import Image

ASSETS = Path(__file__).parent
DOWNLOADS = Path("C:/Users/Edouard/Downloads")

JOBS = [
    (DOWNLOADS / "LOGO Bisou-21 (1).png", ASSETS / "b-logo.png"),       # stacked monogram
    (DOWNLOADS / "LOGO Bisou-20 (2).png", ASSETS / "b-mark.png"),       # single B mark
]

for src, dst in JOBS:
    if not src.exists():
        print(f"skip (missing): {src.name}")
        continue
    im = Image.open(src).convert("RGBA")
    bbox = im.getbbox()
    if bbox is None:
        print(f"skip (empty): {src.name}")
        continue
    cropped = im.crop(bbox)
    # Add a small padding (~3% of largest side) so the logo doesn't touch the edge
    pad = int(max(cropped.size) * 0.03)
    canvas = Image.new("RGBA", (cropped.width + pad * 2, cropped.height + pad * 2), (0, 0, 0, 0))
    canvas.paste(cropped, (pad, pad))
    canvas.save(dst, "PNG", optimize=True)
    print(f"{src.name}  ->  {dst.name}  ({canvas.width} x {canvas.height})")
