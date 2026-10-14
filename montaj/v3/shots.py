#!/usr/bin/env python3
"""v3: kadrlarni tayyorlash -> public/montaj/*.mp4 (1080x1920, 30 fps, aniq kadr soni, H.264).
Stabilizatsiya (vidstab), tezlik rampasi (time-remap), zamonaviy kino rangi (teal & orange, matte).
Kompozitsiya va effektlar Remotion'da (src/montaj/)."""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(ROOT, "montaj", "src")
WORK = os.path.join(ROOT, "montaj", "work", "v3")
OUT = os.path.join(ROOT, "public", "montaj")
os.makedirs(WORK, exist_ok=True); os.makedirs(OUT, exist_ok=True)
FPS, H = 30, 0.3  # H — o'tishlar uchun har ikki tomondagi zaxira (soniya)
C = [(0, 1), (1, 1)]
# id: (fayl, kirish, chiqish, ko'rinadigan uzunlik (s), tezlik profili, zaxira bormi)
SHOTS = {
    "p1": ("IMG_0255.mov", 2.00, 3.20, 2.0, C, False),
    "p2": ("IMG_0247.mov", 0.60, 1.80, 2.0, C, False),
    "p3": ("IMG_0250.mov", 0.40, 1.60, 2.0, C, False),
    "s1": ("IMG_0255.mov", 0.00, 1.45, 2.0, C, True),
    "s2": ("IMG_0251.mov", 0.90, 6.00, 4.0, [(0, 2.4), (.12, 2.4), (.32, .8), (1, .8)], True),
    "s3": ("IMG_0243.mov", 0.15, 3.00, 2.0, C, True),
    "s4": ("IMG_0245.mov", 0.00, 2.40, 2.0, C, True),
    "s5": ("IMG_0245.mov", 6.30, 9.30, 3.0, C, True),    # 2.0 s da topshirish lahzasi (1 s freeze)
    "s6": ("IMG_0247.mov", 0.20, 3.90, 4.0, [(0, 1.3), (.15, 1.3), (.3, .5), (.7, .5), (.85, 1.3), (1, 1.3)], True),
    "s7": ("IMG_0255.mov", 1.30, 4.40, 2.0, C, True),
    "s8": ("IMG_0250.mov", 0.05, 3.47, 4.0, C, True),
    "s9": ("IMG_0255.mov", 4.95, 6.60, 3.2, C, True),
}
GRADE = ("curves=all='0/0.035 0.25/0.235 0.5/0.505 0.75/0.77 1/0.975',"
         "eq=contrast=1.1:saturation=1.12:gamma=0.98,"
         "colorbalance=rs=-0.045:gs=-0.005:bs=0.05:rm=0.01:bm=-0.01:rh=0.05:gh=0.01:bh=-0.05,"
         "unsharp=5:5:0.45:5:5:0")


def remap(profile, S, target):
    def sp(u):
        for (a, va), (b, vb) in zip(profile, profile[1:]):
            if a <= u <= b:
                x = (u - a) / (b - a) if b > a else 0
                return va + (vb - va) * x * x * (3 - 2 * x)
        return profile[-1][1]
    steps, K = 2400, 24
    acc, out = 0.0, [0.0]
    for i in range(1, steps + 1):
        acc += (S / steps) / sp((i - .5) / steps); out.append(acc)
    c = target / acc
    kn = [(S * round(j * steps / K) / steps, out[round(j * steps / K)] * c) for j in range(K + 1)]
    e = f"{kn[-1][1]:.5f}"
    for (t0, o0), (t1, o1) in reversed(list(zip(kn, kn[1:]))):
        e = f"if(lt(T,{t1:.5f}),{o0:.5f}+(T-{t0:.5f})*{(o1 - o0) / (t1 - t0):.5f},{e})"
    return e


meta = {}
only = sys.argv[1:]
for sid, (f, a, b, vis, prof, handles) in SHOTS.items():
    L = vis + (2 * H if handles else 0)
    frames = int(round(L * FPS))
    meta[sid] = {"frames": frames, "handle": int(round(H * FPS)) if handles else 0, "visible": int(round(vis * FPS))}
    if only and sid not in only:
        continue
    src = os.path.join(SRC, f)
    trf = os.path.join(WORK, f"{sid}.trf")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(a), "-to", str(b), "-i", src,
                    "-vf", f"vidstabdetect=shakiness=6:accuracy=12:result={trf}", "-f", "null", "-"], check=True)
    vf = (f"format=yuv420p,vidstabtransform=input={trf}:smoothing=26:zoom=4:optzoom=0:interpol=bicubic,format=yuv420p,"
          f"setpts='({remap(prof, b - a, frames / FPS + 0.05)})/TB',fps={FPS},{GRADE},"
          f"scale=1080:1920:flags=lanczos,trim=end_frame={frames},setsar=1,format=yuv420p")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(a), "-to", str(b), "-i", src, "-an", "-vf", vf,
                    "-c:v", "libx264", "-preset", "slow", "-crf", "13", "-g", "15", os.path.join(OUT, f"{sid}.mp4")], check=True)
    print(sid, f, f"{a}-{b}", f"{frames} kadr")
json.dump(meta, open(os.path.join(HERE, "shots.json"), "w"), indent=1)
