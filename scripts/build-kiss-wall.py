"""
Build the kiss-wall composite from the high-res Kiss Posters PDF.

Layout: 4 cols x 2 rows of portrait posters on a cream background,
matching the proportions of the legacy WhatsApp source (754x514).

Outputs the master PNG plus the 1920/1280 jpg+webp web variants.
"""

import os
from io import BytesIO

import fitz
from PIL import Image

PDF_PATH = r"C:\Users\Edouard\Downloads\Kiss Posters .pdf"
WEB_DIR = r"C:\Users\Edouard\Desktop\bisou-phuket\static\assets\photos\web"
ORIG_DIR = r"C:\Users\Edouard\Desktop\bisou-phuket\static\assets\photos\originals"

# Tile selection matches the legacy composite, recovered from the same source set.
# Row-major, 4 cols x 2 rows.
# Alternating one-with-logo / one-clean ("un sur deux"), per the owner's brief.
# Row-major, 4 cols x 2 rows. T6 (V-J Day) is the clean tile requested logo-free.
TILE_PAGES = [
    0,   # T1: brunette couple (with Bisou wordmark)
    49,  # T2: Marilyn Monroe kiss (clean, no logo)
    4,   # T3: Snow White Disney (with Bisou wordmark)
    50,  # T4: couple in red plaid (clean, no logo)
    5,   # T5: Simpsons (with Bisou wordmark)
    57,  # T6: V-J Day Times Square (clean, no logo)
    2,   # T7: B&W close-up (with Bisou wordmark)
    59,  # T8: two women kissing (clean, no logo)
]

# Canvas (16:11ish - matches legacy 1.467 ratio at higher resolution)
CANVAS_W, CANVAS_H = 3840, 2616
COLS, ROWS = 4, 2
OUTER = 30
GUTTER = 60
BG_COLOR = (255, 248, 239)  # site cream --cream #FFF8EF

# Derived
TILE_W = (CANVAS_W - 2 * OUTER - (COLS - 1) * GUTTER) // COLS
TILE_H = (CANVAS_H - 2 * OUTER - (ROWS - 1) * GUTTER) // ROWS


def extract_page_image(doc: fitz.Document, page_index: int) -> Image.Image:
    """Render the full page so the Bisou wordmark vector overlay is baked in."""
    page = doc[page_index]
    # Render at ~4x = roughly 288 DPI, gives a 3367x4762 image from an A3 page
    pix = page.get_pixmap(matrix=fitz.Matrix(4.0, 4.0), alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def fit_cover(im: Image.Image, w: int, h: int) -> Image.Image:
    """Center-crop + resize to exactly (w, h)."""
    target = w / h
    src = im.width / im.height
    if src > target:
        new_w = int(im.height * target)
        x0 = (im.width - new_w) // 2
        im = im.crop((x0, 0, x0 + new_w, im.height))
    else:
        new_h = int(im.width / target)
        y0 = (im.height - new_h) // 2
        im = im.crop((0, y0, im.width, y0 + new_h))
    return im.resize((w, h), Image.LANCZOS)


def main():
    print(f"Canvas {CANVAS_W}x{CANVAS_H}, tile {TILE_W}x{TILE_H}, outer {OUTER}, gutter {GUTTER}")
    doc = fitz.open(PDF_PATH)

    canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), BG_COLOR)
    for i, page_idx in enumerate(TILE_PAGES):
        col, row = i % COLS, i // COLS
        x = OUTER + col * (TILE_W + GUTTER)
        y = OUTER + row * (TILE_H + GUTTER)
        src = extract_page_image(doc, page_idx)
        tile = fit_cover(src, TILE_W, TILE_H)
        canvas.paste(tile, (x, y))
        print(f"  T{i+1} (page {page_idx}): src {src.size}, placed at ({x},{y})")

    # Save master PNG (lossless reference)
    master_path = os.path.join(ORIG_DIR, "kiss-wall-master.png")
    canvas.save(master_path, optimize=True)
    print(f"Master saved: {master_path}")

    # Web variants
    for width in (1920, 1280):
        height = round(width / (CANVAS_W / CANVAS_H))
        small = canvas.resize((width, height), Image.LANCZOS)
        jpg_path = os.path.join(WEB_DIR, f"kiss-wall-{width}.jpg")
        webp_path = os.path.join(WEB_DIR, f"kiss-wall-{width}.webp")
        small.save(jpg_path, "JPEG", quality=88, optimize=True, progressive=True)
        small.save(webp_path, "WEBP", quality=86, method=6)
        kb_jpg = os.path.getsize(jpg_path) // 1024
        kb_webp = os.path.getsize(webp_path) // 1024
        print(f"  {width}px -> jpg {kb_jpg}KB, webp {kb_webp}KB")

    print("Done.")


if __name__ == "__main__":
    main()
