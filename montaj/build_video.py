#!/usr/bin/env python3
"""9:16 montaj: stabilizatsiya -> sekinlashtirish -> rang -> sekin yaqinlashish -> taktga mos o'tishlar -> musiqa.
Natija: out/04_maktab_montaj_9x16.mp4 (1080x1920, 30 fps, H.264 + AAC). Subtitr/yozuv yo'q."""
import os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC, WORK = os.path.join(HERE, "src"), os.path.join(HERE, "work")
os.makedirs(WORK, exist_ok=True)
BAR = 4 * 60 / 104
XF = 0.4      # o'tish davomiyligi
TAIL = 1.2    # yakuniy akkord uchun
# (fayl, kirish, chiqish, taktlar, zoom yo'nalishi)
CLIPS = [
    ("IMG_0251.mov", 0.15, 5.95, 3, +1),   # keng reja: maktab hovlisi
    ("IMG_0243.mov", 0.15, 4.90, 2, -1),   # ustozlar stoli
    ("IMG_0247.mov", 0.10, 5.50, 3, +1),   # qizcha shirinlik tanlaydi
    ("IMG_0250.mov", 0.05, 3.47, 2, +1),   # quvnoq o'quvchilar
]
GRADE = ("eq=contrast=1.07:saturation=1.14:gamma=0.97:brightness=0.01,"
         "colorbalance=rs=0.035:bs=-0.035:rm=0.025:bm=-0.025:rh=0.02:bh=-0.02,"
         "unsharp=5:5:0.35:5:5:0,vignette=angle=PI/6")


def run(cmd):
    subprocess.run(cmd, check=True)


segs = []
n = len(CLIPS)
for i, (f, a, b, bars, zdir) in enumerate(CLIPS):
    src = os.path.join(SRC, f)
    out_len = bars * BAR + (XF / 2 if i in (0, n - 1) else XF) + (TAIL if i == n - 1 else 0)
    k = out_len / (b - a)              # sekinlashtirish koeffitsiyenti
    frames = int(round(out_len * 30))
    trf = os.path.join(WORK, f + ".trf")
    run(["ffmpeg", "-v", "error", "-y", "-ss", str(a), "-to", str(b), "-i", src,
         "-vf", f"vidstabdetect=shakiness=6:accuracy=12:result={trf}", "-f", "null", "-"])
    z0, z1 = (1.0, 1.08) if zdir > 0 else (1.08, 1.0)
    zexpr = f"{z0}+({z1}-{z0})*on/{frames}"
    vf = (f"vidstabtransform=input={trf}:smoothing=24:zoom=4:optzoom=0:interpol=bicubic,"
          f"setpts={k:.6f}*PTS,fps=30,{GRADE},scale=2160:3840:flags=lanczos,"
          f"zoompan=z='{zexpr}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1080x1920:fps=30,"
          f"trim=end_frame={frames},setsar=1,format=yuv420p")
    seg = os.path.join(WORK, f"seg{i}.mp4")
    run(["ffmpeg", "-v", "error", "-y", "-ss", str(a), "-to", str(b), "-i", src, "-an", "-vf", vf,
         "-c:v", "libx264", "-preset", "slow", "-crf", "12", seg])
    segs.append((seg, out_len))
    print(f"{f}: {b - a:.2f}s -> {out_len:.3f}s (x{k:.2f} sekin)")

# Taktga mos o'tishlar: har bir o'tish markazi takt chegarasiga tushadi
inputs, filt, last, acc = [], [], "[0:v]", 0.0
for i, (seg, L) in enumerate(segs):
    inputs += ["-i", seg]
for i in range(1, n):
    acc += segs[i - 1][1] - (XF if i > 1 else 0)
    off = acc - XF
    lbl = f"[x{i}]"
    filt.append(f"{last}[{i}:v]xfade=transition=fade:duration={XF}:offset={off:.4f}{lbl}")
    last = lbl
total = sum(L for _, L in segs) - (n - 1) * XF
filt.append(f"{last}fade=t=in:st=0:d=0.35,fade=t=out:st={total - 0.9:.3f}:d=0.9,format=yuv420p[v]")
music = os.path.join(HERE, "music.wav")
out = os.path.join(ROOT, "out", "04_maktab_montaj_9x16.mp4")
run(["ffmpeg", "-v", "error", "-y", *inputs, "-i", music, "-filter_complex", ";".join(filt),
     "-map", "[v]", "-map", f"{n}:a", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-profile:v", "high",
     "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
     "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", f"{total:.3f}", "-movflags", "+faststart", out])
print(f"{out}: {total:.3f}s")
