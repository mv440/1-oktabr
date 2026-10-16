#!/usr/bin/env python3
"""Asosiy olimpiada II (shahar) bosqichi — fotomontaj.
9 ta fotosurat -> kamera harakati (pan/zoom, subpiksel aniqlik), kino rang korreksiyasi,
animatsion sarlavhalar, musiqa taktiga mos montaj. Chiqish: 16:9 (1920x1080) va 9:16 (1080x1920), 30 fps.
Ishlatish: python3 montaj/olimpiada/build.py [16x9|9x16] [--stills]"""
import math, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SRC, FONTS = os.path.join(HERE, "src"), os.path.join(HERE, "fonts")
OUT = os.path.join(ROOT, "out")
FPS, BEAT = 30, 20                    # 90 BPM -> 1 urg'u = 20 kadr
TOTAL = 64 * BEAT                     # 1280 kadr = 42.667 s
GOLD, WHITE = (234, 196, 110), (255, 255, 255)

# Kadrlar: (fayl, urg'u boshlanishi, urg'u oxiri, kamera boshi, kamera oxiri, vertikal kamera boshi/oxiri, o'tish)
# kamera = (cx, cy, w): markaz va oyna kengligi — rasm o'lchamiga nisbatan (0..1).
# vertikal = (cx, cy, h): oyna balandligi bo'yicha. o'tish — oldingi kadrdan bu kadrga: (tur, kadr).
SHOTS = [
    ("08_xiyobon",        0,  8, (.50, .47, 1.00), (.44, .52, .80), (.44, .50, 1.0), (.42, .52, .86), ("fade", 0)),
    ("03_saf",            8, 12, (.36, .46, .74), (.58, .50, .70), (.30, .50, .96), (.68, .50, .92), ("flash", 8)),
    ("07_ortdan",        12, 16, (.56, .52, .86), (.40, .50, .74), (.22, .52, .96), (.44, .52, .90), ("mix", 10)),
    ("04_umumiy",        16, 20, (.50, .50, 1.00), (.66, .52, .74), (.22, .52, .98), (.74, .52, .90), ("mix", 10)),
    ("09_oquvchilar",    20, 24, (.62, .25, .62), (.60, .42, .72), (.62, .36, .72), (.60, .50, .80), ("mix", 10)),
    ("06_madhiya_umumiy", 24, 28, (.55, .50, .96), (.60, .50, .76), (.14, .50, .96), (.66, .50, .90), ("mix", 18)),
    ("05_madhiya_hayat", 28, 32, (.50, .50, 1.00), (.58, .46, .70), (.50, .50, 1.0), (.60, .48, .86), ("mix", 12)),
    ("09_oquvchilar",    32, 36, (.60, .50, .72), (.36, .50, .74), (.58, .52, .96), (.30, .52, .92), ("mix", 12)),
    ("08_xiyobon",       36, 40, (.78, .60, .58), (.64, .58, .62), (.80, .58, .82), (.66, .58, .86), ("mix", 12)),
    ("02_hayat",         40, 44, (.50, .50, 1.00), (.60, .47, .82), (.44, .50, 1.0), (.75, .48, .92), ("flash", 8)),
    ("01_nutq",          44, 48, (.56, .45, .84), (.63, .42, .56), (.62, .50, .94), (.65, .46, .76), ("cut", 0)),
    ("03_saf",           48, 52, (.62, .43, .56), (.68, .39, .46), (.69, .46, .78), (.69, .42, .66), ("mix", 10)),
    ("08_xiyobon",       52, 64, (.45, .52, .84), (.50, .48, 1.00), (.43, .52, .88), (.45, .50, 1.0), ("mix", 16)),
]

# Matnlar: (kadr kirish, kadr chiqish, tur, matn(lar))
KICK = [
    (172, 238, "lower", ("SAFLANISH", "Bilim bellashuvi ishtirokchilari")),
    (330, 398, "lower", ("TANTANALI OCHILISH", "Ishtirokchilar va tashkilotchilar")),
    (494, 636, "lower", ("DAVLAT MADHIYASI", "Ona Vatanga hurmat va sadoqat bilan")),
    (810, 878, "lower", ("OCHILISH SO‘ZI", "Ishtirokchilarga yo‘l-yo‘riq va tilaklar")),
    (968, 1036, "lower", ("HAL QILUVCHI LAHZA", "Diqqat, ishonch va bilim")),
]


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), int(round(size)))

MONT = lambda w, s: font(f"montserrat-latin-{w}-normal.ttf", s)
CORM = lambda w, s, it=True: font(f"cormorant-garamond-latin-{w}-{'italic' if it else 'normal'}.ttf", s)


# ---------- rang ----------
def grade(im):
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255
    # yorug'likni siqish (osmon/oq devor kuyib ketmasin) + yumshoq S-egri
    a = np.where(a > .78, .78 + (a - .78) * .62, a)
    a = a * 1.04 - .012
    a = np.clip(a, 0, 1)
    a = a + .10 * np.sin(np.pi * a) * (a - .5) * 2 * .5
    lum = (a * [.2126, .7152, .0722]).sum(2, keepdims=True)
    a = lum + (a - lum) * 1.10                              # to'yinganlik +10%
    sh, hi = np.clip(1 - lum * 2.2, 0, 1), np.clip((lum - .5) * 2, 0, 1)
    a = a + sh * [-.006, .004, .018] + hi * [.022, .010, -.020]   # soyalar sovuq, yorug'lar iliq
    a = np.clip(a, .012, 1) ** 1.02
    return Image.fromarray((np.clip(a, 0, 1) * 255 + .5).astype(np.uint8))


_cache = {}
def source(name):
    if name not in _cache:
        g = grade(Image.open(os.path.join(SRC, name + ".jpg")))
        _cache[name] = (g, g.filter(ImageFilter.GaussianBlur(18)))
    return _cache[name]


# ---------- harakat ----------
def ease(u):
    u = min(1, max(0, u))
    return .45 * u + .55 * (.5 - .5 * math.cos(math.pi * u))


def window(spec0, spec1, u, W, H, iw, ih, vertical):
    a = ease(u)
    cx, cy, s = (spec0[i] + (spec1[i] - spec0[i]) * a for i in range(3))
    asp = W / H
    if vertical:
        h = s * ih; w = h * asp
    else:
        w = s * iw; h = w / asp
    w, h = min(w, iw), min(h, ih)
    if w / h > asp + 1e-6: w = h * asp
    else: h = w / asp
    x0 = min(max(cx * iw - w / 2, 0), iw - w)
    y0 = min(max(cy * ih - h / 2, 0), ih - h)
    return (x0, y0, x0 + w, y0 + h)


# ---------- matn ----------
def text_img(txt, f, fill, track=0.0, shadow=True):
    chars = list(txt)
    adv = [f.getlength(c) + track * f.size for c in chars]
    width = int(sum(adv) - track * f.size) + 8
    asc, desc = f.getmetrics()
    pad = int(f.size * .5)
    img = Image.new("RGBA", (width + 2 * pad, asc + desc + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(img); x = pad
    for c, a in zip(chars, adv):
        d.text((x, pad), c, font=f, fill=fill); x += a
    if shadow:
        al = img.split()[3]
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0)); sh.putalpha(al.point(lambda v: v * .55))
        sh = sh.filter(ImageFilter.GaussianBlur(max(2, f.size * .09)))
        base = Image.new("RGBA", img.size, (0, 0, 0, 0))
        base.alpha_composite(sh, (0, int(f.size * .04))); base.alpha_composite(img)
        img = base
    return img, pad


def paste(canvas, img, x, y, alpha=1.0, clip=None):
    """img chap-yuqori burchagi (x, y); clip — chapdan o'ngga ochilish ulushi."""
    if alpha <= 0: return
    im = img
    if alpha < 1:
        im = img.copy(); im.putalpha(img.split()[3].point(lambda v: int(v * alpha)))
    if clip is not None and clip < 1:
        cw = int(im.width * max(0, clip))
        if cw <= 0: return
        im = im.crop((0, 0, cw, im.height))
    canvas.alpha_composite(im, (int(round(x)), int(round(y))))


def sm(t):  # smoothstep 0..1
    t = min(1, max(0, t)); return t * t * (3 - 2 * t)

def out_cubic(t):
    t = min(1, max(0, t)); return 1 - (1 - t) ** 3


class Overlay:
    def __init__(self, W, H):
        self.W, self.H, self.v = W, H, H > W
        k = self.k = min(W, H) / 1080
        v = self.v
        # sarlavha
        self.t_label, self.p_label = text_img("QO‘QON SHAHRI", MONT(600, 26 * k), GOLD, .42)
        self.t_title1, self.p_t1 = text_img("ASOSIY", MONT(800, (92 if v else 84) * k), WHITE, .16)
        self.t_title2, self.p_t2 = text_img("OLIMPIADA", MONT(800, (92 if v else 84) * k), WHITE, .16)
        self.t_sub, self.p_sub = text_img("ikkinchi — shahar bosqichi", CORM(700, (72 if v else 66) * k), WHITE, .01)
        # burchak belgisi
        self.t_bug, self.p_bug = text_img("ASOSIY OLIMPIADA  ·  II BOSQICH", MONT(600, 18 * k), WHITE, .28)
        # pastki yozuvlar
        self.kicks = []
        for f0, f1, _, (a, b) in KICK:
            ta = text_img(a, MONT(700, 24 * k), GOLD, .30)
            tb = text_img(b, CORM(600, (50 if v else 46) * k), WHITE, .0)
            self.kicks.append((f0, f1, ta, tb))
        # yakun
        self.t_end1, self.p_e1 = text_img("Barcha ishtirokchilarga", CORM(600, (70 if v else 62) * k), WHITE)
        self.t_end2, self.p_e2 = text_img("OMAD!", MONT(800, (150 if v else 132) * k), GOLD, .12)
        self.t_end3, self.p_e3 = text_img("Asosiy olimpiada  ·  II — shahar bosqichi  ·  Qo‘qon",
                                          MONT(500, (19 if v else 20) * k), WHITE, .2)
        # gradientlar
        self.grad_bottom = self._grad(.0, .50, 205)
        self.grad_title = self._grad(.0, .62 if v else .70, 200)
        self.grad_top = self._grad_top(.16 if not v else .14, 120)
        self.vign = self._ellipse(.36 if v else .38, 150)

    def _grad_top(self, end, maxa):
        W, H = self.W, self.H
        y = np.linspace(0, 1, H)[:, None]
        a = (np.clip(1 - y / end, 0, 1) ** 1.6 * maxa).repeat(W, 1).astype(np.uint8)
        g = Image.new("RGBA", (W, H), (8, 10, 18, 0)); g.putalpha(Image.fromarray(a)); return g

    def _ellipse(self, cyf, maxa):
        # sarlavha ortidagi yumshoq qorong'i dog' + umumiy xiralashtirish
        W, H = self.W, self.H
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        rx, ry = W * (.62 if self.v else .46), H * (.16 if self.v else .24)
        r = ((xx - W / 2) / rx) ** 2 + ((yy - H * cyf) / ry) ** 2
        a = np.clip(95 + maxa * np.exp(-r * 1.3), 0, 255).astype(np.uint8)
        g = Image.new("RGBA", (W, H), (6, 8, 16, 0)); g.putalpha(Image.fromarray(a)); return g

    def _grad(self, top_alpha, start, maxa):
        W, H = self.W, self.H
        y = np.linspace(0, 1, H)[:, None]
        a = np.clip((y - start) / (1 - start), 0, 1) ** 1.4 * maxa
        a = np.repeat(a, W, 1).astype(np.uint8)
        g = Image.new("RGBA", (W, H), (8, 10, 18, 0)); g.putalpha(Image.fromarray(a))
        return g

    def line(self, c, x, y, w, alpha, thick):
        if w <= 1 or alpha <= 0: return
        d = ImageDraw.Draw(c)
        d.rectangle([x, y, x + w, y + thick], fill=GOLD + (int(255 * alpha),))

    def center_x(self, img, pad):
        return (self.W - (img.width - 2 * pad)) / 2 - pad

    def draw(self, c, f):
        W, H, k, v = self.W, self.H, self.k, self.v
        # --- sarlavha (0..150) ---
        if f < 168:
            fade_out = 1 - sm((f - 138) / 22)
            paste(c, self.vign, 0, 0, sm(f / 18) * fade_out)
            yb = H * (.36 if v else .38) + 30 * k
            a = sm((f - 14) / 16) * fade_out
            lw = 120 * k * out_cubic((f - 10) / 26)
            self.line(c, W / 2 - lw / 2, yb - 112 * k, lw, a, max(2, int(3 * k)))
            paste(c, self.t_label, self.center_x(self.t_label, self.p_label), yb - 104 * k - self.p_label + 14 * k * (1 - out_cubic((f - 14) / 20)), a)
            for i, (img, p) in enumerate(((self.t_title1, self.p_t1), (self.t_title2, self.p_t2))):
                ff = f - 24 - i * 7
                aa = sm(ff / 16) * fade_out
                dy = 40 * k * (1 - out_cubic(ff / 24))
                yy = yb - 60 * k + i * (100 if v else 0) * k - (50 if v else 0) * k
                if not v:   # gorizontal: bitta qatorda
                    if i == 1: continue
                    img, p = self._title_line()
                paste(c, img, self.center_x(img, p), yy - p + dy, aa)
            ys = yb + (100 if v else 56) * k
            ff = f - 46
            paste(c, self.t_sub, self.center_x(self.t_sub, self.p_sub), ys - self.p_sub + 18 * k * (1 - out_cubic(ff / 24)), sm(ff / 18) * fade_out)
        # --- burchak belgisi ---
        if 170 <= f <= 1046:
            a = sm((f - 170) / 20) * (1 - sm((f - 1026) / 20)) * .9
            mx, my = (54 if v else 64) * k, (150 if v else 52) * k
            paste(c, self.grad_top, 0, 0, a)
            self.line(c, mx, my + 6 * k, 4 * k, a, int(22 * k))
            paste(c, self.t_bug, mx + 14 * k - self.p_bug, my - self.p_bug + 2 * k, a)
        # --- pastki yozuvlar ---
        for f0, f1, (ta, pa), (tb, pb) in self.kicks:
            if not (f0 - 2 <= f <= f1 + 2): continue
            t, L = f - f0, f1 - f0
            out = 1 - sm((f - (f1 - 12)) / 12)
            paste(c, self.grad_bottom, 0, 0, sm(t / 14) * out * .9)
            mx = (60 if v else 96) * k
            yb = H * (.73 if v else .80)
            bar_h = 92 * k * out_cubic(t / 14)
            self.line(c, mx, yb - 4 * k, 5 * k, out, int(bar_h)) if bar_h > 1 else None
            paste(c, ta, mx + 26 * k - pa, yb - pa - 2 * k, out * sm((t - 4) / 10), clip=out_cubic((t - 4) / 16))
            paste(c, tb, mx + 24 * k - pb + 16 * k * (1 - out_cubic((t - 8) / 18)), yb + 30 * k - pb, out * sm((t - 8) / 14))
        # --- yakun ---
        if f >= 1048:
            t = f - 1048
            g = sm(t / 24) * (1 - sm((f - 1250) / 30))
            paste(c, self.grad_title, 0, 0, g)
            yb = H * (.50 if v else .48)
            paste(c, self.t_end1, self.center_x(self.t_end1, self.p_e1), yb - 120 * k - self.p_e1 + 16 * k * (1 - out_cubic((t - 6) / 22)), g * sm((t - 6) / 16))
            sc = .86 + .14 * out_cubic((t - 20) / 26)
            e2 = self.t_end2
            if sc < .999:
                e2 = e2.resize((int(e2.width * sc), int(e2.height * sc)), Image.LANCZOS)
            paste(c, e2, (W - e2.width) / 2, yb - 40 * k - e2.height / 2 + 30 * k, g * sm((t - 20) / 14))
            lw = 220 * k * out_cubic((t - 34) / 26)
            self.line(c, W / 2 - lw / 2, yb + 108 * k, lw, g, max(2, int(3 * k)))
            paste(c, self.t_end3, self.center_x(self.t_end3, self.p_e3), yb + 128 * k - self.p_e3, g * sm((t - 44) / 18) * .9)

    def _title_line(self):
        if not hasattr(self, "_tl"):
            self._tl = text_img("ASOSIY OLIMPIADA", MONT(800, 96 * self.k), WHITE, .14)
        return self._tl


# ---------- montaj ----------
def shot_ranges():
    res = []
    for i, s in enumerate(SHOTS):
        f0, f1 = s[1] * BEAT, s[2] * BEAT
        tin = s[7][1] if s[7][0] == "mix" else 0
        nxt = SHOTS[i + 1][7] if i + 1 < len(SHOTS) else ("cut", 0)
        tout = nxt[1] if nxt[0] == "mix" else 0
        res.append((f0 - tin // 2, f1 + (tout - tout // 2), f0, f1))
    return res


def render_shot(i, f, W, H, vertical):
    name, _, _, c0, c1, v0, v1, _ = SHOTS[i]
    a0, a1, _, _ = shot_ranges()[i]
    im, blur = source(name)
    s0, s1 = (v0, v1) if vertical else (c0, c1)
    u = (f - a0) / max(1, (a1 - a0))
    box = window(s0, s1, u, W, H, im.width, im.height, vertical)
    fr = im.resize((W, H), Image.BICUBIC, box=box, reducing_gap=2.0)
    if i == len(SHOTS) - 1:       # yakun: matn uchun fon yumshoq xiralashadi
        b = sm((f - 1060) / 40) * .85
        if b > 0:
            fb = blur.resize((W, H), Image.BICUBIC, box=box, reducing_gap=2.0)
            fr = Image.blend(fr, fb, b)
    return fr


def frame(f, W, H, vertical, ov):
    rngs = shot_ranges()
    active = [i for i, (a, b, _, _) in enumerate(rngs) if a <= f < b]
    base = render_shot(active[0], f, W, H, vertical)
    if len(active) > 1:
        j = active[1]
        a, _, f0, _ = rngs[j]
        L = SHOTS[j][7][1]
        base = Image.blend(base, render_shot(j, f, W, H, vertical), sm((f - a + .5) / L))
    c = base.convert("RGBA")
    # oq "flash" o'tishlar
    for i, s in enumerate(SHOTS):
        if s[7][0] == "flash":
            d = f - s[1] * BEAT
            if -3 <= d < s[7][1]:
                x = (d + 3) / 3 if d < 0 else 1 - d / s[7][1]
                c.alpha_composite(Image.new("RGBA", (W, H), (255, 246, 230, int(170 * sm(x) ** 1.3))))
    ov.draw(c, f)
    return c.convert("RGB")


def build(fmt, stills=False):
    vertical = fmt == "9x16"
    W, H = (1080, 1920) if vertical else (1920, 1080)
    ov = Overlay(W, H)
    os.makedirs(OUT, exist_ok=True)
    if stills:
        d = os.path.join(HERE, "work", "stills", fmt); os.makedirs(d, exist_ok=True)
        for f in [int(x) for x in os.environ.get("FRAMES", "40,120,150,200,280,360,440,520,600,680,760,840,920,1000,1100,1180,1240").split(",")]:
            frame(f, W, H, vertical, ov).save(os.path.join(d, f"{f:04d}.jpg"), quality=88)
        print("stills ->", d); return
    name = f"07_olimpiada_{fmt}.mp4"
    out = os.path.join(OUT, name)
    music = os.path.join(HERE, "music.wav")
    vf = ("vignette=angle=0.42:mode=forward,noise=alls=4:allf=t,"
          f"fade=t=in:st=0:d=0.5,fade=t=out:st={TOTAL / FPS - 0.9:.3f}:d=0.9,"
          "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p")
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-i", music, "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "20",
           "-profile:v", "high", "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709",
           "-color_trc", "bt709", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
           "-frames:v", str(TOTAL), "-shortest", "-movflags", "+faststart", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(TOTAL):
        p.stdin.write(frame(f, W, H, vertical, ov).tobytes())
        if f % 160 == 0: print(f"{fmt}: {f}/{TOTAL}", flush=True)
    p.stdin.close(); p.wait()
    print("->", out)


if __name__ == "__main__":
    args = sys.argv[1:]
    fmts = [a for a in args if a in ("16x9", "9x16")] or ["16x9", "9x16"]
    for fm in fmts:
        build(fm, "--stills" in args)
