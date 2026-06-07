"""
Compress private-event premium photos to web-optimized JPGs.

Source : static/assets/photos/*.jpg          (raw 5-17 MB each)
Output : static/assets/photos/web/<name>-1920.jpg  (desktop hero, q=82)
         static/assets/photos/web/<name>-960.jpg   (mobile, q=78)
Originals are moved to static/assets/photos/originals/ for archive.
"""

import sys
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "static" / "assets" / "photos"
WEB_DIR = SRC_DIR / "web"
ORIG_DIR = SRC_DIR / "originals"

WEB_DIR.mkdir(parents=True, exist_ok=True)
ORIG_DIR.mkdir(parents=True, exist_ok=True)

# Map raw filenames to clean semantic names
RENAME = {
    "BIS00977.jpg": "hero-dining-kisses",      # main dining + kiss wall (HERO)
    "BIS00992.jpg": "exterior-night",          # facade at night
    "BIS01196.jpg": "private-room-portrait",   # private dining w/ curtain
    "BI201195.jpg": "spiral-staircase",        # spiral view from above
    "BIS01160.jpg": "cellar-red",              # wine cellar red light
    "BI200603.jpg": "bathtub-wine",            # bathtub with wine bottles
    "BI201290.jpg": "founders",                # the two founders at the door
    "BIS00084.jpg": "antoine-portrait",        # Antoine at the kitchen pass
    "BIS00068.jpg": "antoine-kitchen",         # Antoine breaking down fish
    "BIS00972.jpg": "theo-portrait",           # Théo on the steps with a wine glass
}

VARIANTS = [
    ("1920", 1920, 82),  # desktop hero
    ("960",  960,  78),  # mobile
]

raws = sorted([p for p in SRC_DIR.glob("*.jpg") if p.name in RENAME])
if not raws:
    print(f"No source files in {SRC_DIR}")
    sys.exit(0)

for src in raws:
    semantic = RENAME[src.name]
    print(f"\n=== {src.name} -> {semantic} ===")

    im = Image.open(src)
    im = ImageOps.exif_transpose(im)  # respect EXIF rotation
    if im.mode != "RGB":
        im = im.convert("RGB")
    w0, h0 = im.size
    print(f"  source: {w0}x{h0}  {src.stat().st_size // 1024} KB")

    for suffix, target_w, quality in VARIANTS:
        if w0 <= target_w:
            scaled = im.copy()
        else:
            ratio = target_w / w0
            scaled = im.resize((target_w, int(h0 * ratio)), Image.LANCZOS)
        out = WEB_DIR / f"{semantic}-{suffix}.jpg"
        scaled.save(out, "JPEG", quality=quality, optimize=True, progressive=True)
        print(f"  -> {out.name}  {scaled.size[0]}x{scaled.size[1]}  {out.stat().st_size // 1024} KB")

    # Move original to archive
    archive = ORIG_DIR / src.name
    if not archive.exists():
        src.replace(archive)
        print(f"  archived to originals/{src.name}")

print(f"\nDone. Web variants in: {WEB_DIR}")
print(f"Originals archived in: {ORIG_DIR}")
