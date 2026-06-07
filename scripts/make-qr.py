#!/usr/bin/env python3
"""Generate the Bisou Phuket menu QR code -> static/assets/qr-menu.png.

Bordeaux ink on cream paper, matching the brand. Encodes the photo menu URL
(the QR target a guest scans at the table). Re-run after the menu URL changes.

Requires: pip install "qrcode[pil]"
"""
import os
import qrcode
from qrcode.constants import ERROR_CORRECT_M

URL = "https://bisouphuket.com/menu"
CREAM = "#FFF8EF"
BORDEAUX = "#6E1F2A"
OUT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "static", "assets", "qr-menu.png")
)

qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=24, border=4)
qr.add_data(URL)
qr.make(fit=True)
img = qr.make_image(fill_color=BORDEAUX, back_color=CREAM)
img.save(OUT)
print("wrote", OUT, "->", URL)
