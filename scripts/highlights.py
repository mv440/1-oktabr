#!/usr/bin/env python3
"""Instagram Highlights muqovalari: 1080x1920, ikona markazda (Instagram markaziy doirani ko'rsatadi)."""
import os, cairosvg
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "out", "highlights")
os.makedirs(OUT, exist_ok=True)
GOLD = "url(#gold)"

ICONS = {
    "1_maktab_hayoti": """
      <path d="M -215 -35 L 0 -175 L 215 -35" />
      <rect x="-180" y="-35" width="360" height="225" rx="10" />
      <path d="M -45 190 L -45 110 Q -45 65 0 65 Q 45 65 45 110 L 45 190" />
      <rect x="-140" y="5" width="60" height="55" rx="8" /><rect x="80" y="5" width="60" height="55" rx="8" />
      <rect x="-140" y="105" width="60" height="55" rx="8" /><rect x="80" y="105" width="60" height="55" rx="8" />
      <circle cx="0" cy="-60" r="28" />
      <path d="M 0 -175 L 0 -275" /><path d="M 0 -275 L 85 -250 L 0 -222" fill="url(#gold)" />
      <path d="M -240 190 L 240 190" />""",
    "2_ota_onalarga": """
      <circle cx="-75" cy="-5" r="60" />
      <path d="M -210 185 C -210 70 60 70 60 185" />
      <circle cx="110" cy="62" r="42" />
      <path d="M 28 185 C 28 112 192 112 192 185 Z" fill="#17325f" />
      <path d="M 28 185 C 28 112 192 112 192 185" />
      <path d="M 20 -150 C -3 -182 -55 -171 -55 -131 C -55 -99 -13 -76 20 -51 C 53 -76 95 -99 95 -131 C 95 -171 43 -182 20 -150 Z" fill="url(#gold)" stroke-width="0" />
      <path d="M -245 185 L 235 185" />""",
    "3_savol_javob": """
      <path d="M -170 -185 L 60 -185 Q 105 -185 105 -140 L 105 -10 Q 105 35 60 35 L -95 35 L -150 85 L -150 35 L -170 35 Q -215 35 -215 -10 L -215 -140 Q -215 -185 -170 -185 Z" />
      <path d="M -95 -115 C -95 -160 -15 -160 -15 -112 C -15 -78 -55 -75 -55 -40" />
      <circle cx="-55" cy="-5" r="11" fill="url(#gold)" stroke="none" />
      <path d="M 145 -60 Q 215 -60 215 -15 L 215 105 Q 215 150 170 150 L 160 150 L 160 200 L 105 150 L 0 150 Q -45 150 -45 105 L -45 75" />
      <circle cx="40" cy="95" r="13" fill="url(#gold)" stroke="none" /><circle cx="90" cy="95" r="13" fill="url(#gold)" stroke="none" /><circle cx="140" cy="95" r="13" fill="url(#gold)" stroke="none" />""",
}


def star(cx, cy, R):
    import math
    pts = []
    for k in range(16):
        a = k * math.pi / 8 - math.pi / 2
        r = R if k % 2 == 0 else R * 0.7654
        pts.append(f"{cx + r * math.cos(a):.1f},{cy + r * math.sin(a):.1f}")
    return " ".join(pts)


def svg(icon):
    pattern = "".join(f'<polygon points="{star(x, y, 46)}" />' for x in range(0, 1201, 150) for y in range(0, 2001, 150))
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <radialGradient id="bg" cx="540" cy="960" r="1150" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#21437a"/><stop offset="0.45" stop-color="#132b55"/><stop offset="1" stop-color="#070f22"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="-300" x2="0" y2="300" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff0c8"/><stop offset="0.5" stop-color="#e2bf78"/><stop offset="1" stop-color="#b08a45"/>
    </linearGradient>
    <radialGradient id="glow" cx="540" cy="960" r="420" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#f3c979" stop-opacity="0.22"/><stop offset="1" stop-color="#f3c979" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#bg)"/>
  <g fill="none" stroke="#d8b36a" stroke-width="2" opacity="0.07">{pattern}</g>
  <rect width="1080" height="1920" fill="url(#glow)"/>
  <circle cx="540" cy="960" r="420" fill="none" stroke="#e2bf78" stroke-width="5" opacity="0.9"/>
  <circle cx="540" cy="960" r="398" fill="none" stroke="#e2bf78" stroke-width="1.6" opacity="0.6"/>
  <g transform="translate(540 960)" fill="none" stroke="{GOLD}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round">{icon}</g>
</svg>"""


previews = []
for name, icon in ICONS.items():
    png = os.path.join(OUT, f"{name}.png")
    cairosvg.svg2png(bytestring=svg(icon).encode(), write_to=png)
    previews.append(Image.open(png).convert("RGB"))
    print(png)

# Profildagi ko'rinish (doira) namunasi
W = 420
sheet = Image.new("RGB", (W * 3 + 80, W + 80), "white")
for i, im in enumerate(previews):
    c = im.crop((0, 420, 1080, 1500)).resize((W - 40, W - 40), Image.LANCZOS)
    m = Image.new("L", c.size, 0); ImageDraw.Draw(m).ellipse((0, 0, c.size[0], c.size[1]), fill=255)
    sheet.paste(c, (40 + i * W + 20, 40), m)
sheet.save(os.path.join(OUT, "korinish_namuna.png"))
