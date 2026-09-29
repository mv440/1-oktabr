#!/usr/bin/env python3
"""
Portretni yakuniy sahnadagi ravoq uchun tayyorlaydi -> public/photo.jpg

- Bosh va yelka qismi ravoq nisbatida (330:468) kesiladi, tepada bo'sh joy qoldiriladi.
- Oq studiya foni (chetlarga tutashgan oq soha) iliq fil suyagi rangidagi yorug'likka
  almashtiriladi — to'q ko'k kostyum to'q ko'k sahnada yo'qolib qolmaydi.

Ishga tushirish: python3 scripts/prepare_photo.py <rasm.jpg> [--box x0 y0 width]
"""
import argparse
import os

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASPECT = 330 / 468
OUT_W, OUT_H = 660, 936


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--box", nargs=3, type=int, default=[195, -200, 760], help="kesish: x0 y0 kenglik (asl rasm pikselida)")
    args = ap.parse_args()

    img = np.asarray(Image.open(args.src).convert("RGB")).astype(np.float32)
    H, W, _ = img.shape
    mn, mx = img.min(axis=2), img.max(axis=2)

    # Fon: chetlarga tutashgan deyarli oq soha
    white = (mn >= 232) & (mx - mn <= 14)
    lab, _ = ndimage.label(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    # Yumshoq chegara: fon yonidagi och piksellar qisman almashtiriladi (soch/yuz qirrasi)
    near = ndimage.binary_dilation(bg, iterations=4)
    soft = np.clip((mn - 200) / 45, 0, 1) * near
    m = np.maximum(bg.astype(np.float32), soft)
    m = ndimage.gaussian_filter(m, 0.9)[..., None]

    x0, y0, cw = args.box
    ch = int(round(cw / ASPECT))
    yy, xx = np.mgrid[0:ch, 0:cw].astype(np.float32)
    # Iliq radial yorug'lik (bosh orqasida yorqinroq)
    d = np.sqrt(((xx - cw * 0.5) / (cw * 0.62)) ** 2 + ((yy - ch * 0.34) / (ch * 0.62)) ** 2)
    c0, c1, c2 = np.array([253, 247, 234.0]), np.array([242, 226, 193.0]), np.array([214, 188, 139.0])
    t1 = np.clip(d / 0.55, 0, 1)[..., None]
    t2 = np.clip((d - 0.55) / 0.6, 0, 1)[..., None]
    backdrop = c0 * (1 - t1) + c1 * t1
    backdrop = backdrop * (1 - t2) + c2 * t2

    out = backdrop.copy()
    sy0, sy1 = max(0, y0), min(H, y0 + ch)
    sx0, sx1 = max(0, x0), min(W, x0 + cw)
    dy0, dx0 = sy0 - y0, sx0 - x0
    region = img[sy0:sy1, sx0:sx1]
    mm = m[sy0:sy1, sx0:sx1]
    bd = backdrop[dy0:dy0 + (sy1 - sy0), dx0:dx0 + (sx1 - sx0)]
    out[dy0:dy0 + (sy1 - sy0), dx0:dx0 + (sx1 - sx0)] = region * (1 - mm) + bd * mm

    res = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).resize((OUT_W, OUT_H), Image.LANCZOS)
    dst = os.path.join(ROOT, "public", "photo.jpg")
    res.save(dst, quality=93)
    print(f"{dst}: {OUT_W}x{OUT_H} (kesish x0={x0} y0={y0} {cw}x{ch})")


if __name__ == "__main__":
    main()
