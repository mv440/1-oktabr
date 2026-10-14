#!/usr/bin/env python3
"""9:16 montaj (v2): sovuq ochilish (hook) -> zarba bilan musiqa -> taktga mos kesishlar.
Har bir kadr: stabilizatsiya, tezlik rampasi (time-remap), rang, sekin zoom.
Yakuniy bosqich: turli o'tishlar, taktga mos "zoom pulse", yumshoq bloom, nozik don, vinyetka.
Natija: out/04_maktab_montaj_9x16.mp4 (1080x1920, 30 fps, H.264 + AAC). Yozuv/subtitr yo'q."""
import os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC, WORK = os.path.join(HERE, "src"), os.path.join(HERE, "work")
os.makedirs(WORK, exist_ok=True)
sys.path.insert(0, HERE)
from build_music import BAR, HOOK, TAIL, TOTAL  # noqa: E402

FPS = 30
# Kadrlar: (fayl, kirish, chiqish, tezlik profili [(u_ulush, tezlik)], zoom (boshi, oxiri))
SHOTS = [
    ("IMG_0255.mov", 0.05, 1.25, [(0, 1), (1, 1)], (1.00, 1.12)),                  # hook: kulayotgan bola
    ("IMG_0251.mov", 0.90, 6.00, [(0, 2.4), (.12, 2.4), (.32, .85), (1, .85)], (1.10, 1.00)),  # zarba: hovli
    ("IMG_0243.mov", 0.15, 4.90, [(0, 1), (1, 1)], (1.00, 1.07)),                  # ustozlar stoli
    ("IMG_0247.mov", 0.20, 3.90, [(0, 1.3), (.15, 1.3), (.3, .5), (.7, .5), (.85, 1.3), (1, 1.3)], (1.02, 1.10)),  # qizcha
    ("IMG_0255.mov", 1.30, 4.40, [(0, 1), (1, 1)], (1.08, 1.00)),                  # stol atrofida quvonch
    ("IMG_0250.mov", 0.05, 3.47, [(0, 1), (1, 1)], (1.00, 1.08)),                  # cho'qqi: quvnoq qizlar
    ("IMG_0255.mov", 4.95, 6.60, [(0, 1), (1, 1)], (1.06, 1.00)),                  # yakun: keng reja
]
# O'tishlar: (xfade turi, davomiylik) — markazi takt chegarasiga tushadi
TRANS = [("fadewhite", .30), ("smoothup", .35), ("smoothleft", .35), ("fade", .45), ("fadewhite", .30), ("fade", .55)]
BOUNDS = [0, HOOK] + [HOOK + 2 * BAR * k for k in range(1, 6)] + [TOTAL]

GRADE = ("eq=contrast=1.08:saturation=1.16:gamma=0.97:brightness=0.012,"
         "colorbalance=rs=0.04:bs=-0.04:rm=0.03:bm=-0.03:rh=0.025:bh=-0.02,"
         "unsharp=5:5:0.4:5:5:0")


def run(cmd):
    subprocess.run(cmd, check=True)


def remap(profile, S, target):
    """Tezlik profili bo'yicha kirish vaqti -> chiqish vaqti (bo'lakli-chiziqli, 24 tugun)."""
    def sp(u):
        for (a, va), (b, vb) in zip(profile, profile[1:]):
            if a <= u <= b:
                x = (u - a) / (b - a) if b > a else 0
                x = x * x * (3 - 2 * x)
                return va + (vb - va) * x
        return profile[-1][1]
    K, steps = 24, 2400
    out, acc, knots = [0.0], 0.0, []
    for i in range(1, steps + 1):
        acc += (S / steps) / sp((i - .5) / steps)
        out.append(acc)
    c = target / acc
    for j in range(K + 1):
        i = round(j * steps / K)
        knots.append((S * i / steps, out[i] * c))
    expr = f"{knots[-1][1]:.5f}"
    for (t0, o0), (t1, o1) in reversed(list(zip(knots, knots[1:]))):
        k = (o1 - o0) / (t1 - t0)
        expr = f"if(lt(T,{t1:.5f}),{o0:.5f}+(T-{t0:.5f})*{k:.5f},{expr})"
    return expr


segs = []
n = len(SHOTS)
for i, (f, a, b, prof, (z0, z1)) in enumerate(SHOTS):
    d_prev = TRANS[i - 1][1] if i > 0 else 0
    d_next = TRANS[i][1] if i < n - 1 else 0
    L = BOUNDS[i + 1] - BOUNDS[i] + d_prev / 2 + d_next / 2
    frames = int(round(L * FPS))
    src = os.path.join(SRC, f)
    trf = os.path.join(WORK, f"shot{i}.trf")
    if not (os.environ.get("REUSE") and os.path.exists(trf)):
      run(["ffmpeg", "-v", "error", "-y", "-ss", str(a), "-to", str(b), "-i", src,
         "-vf", f"vidstabdetect=shakiness=6:accuracy=12:result={trf}", "-f", "null", "-"])
    expr = remap(prof, b - a, frames / FPS + 0.05)
    vf = (f"vidstabtransform=input={trf}:smoothing=26:zoom=4:optzoom=0:interpol=bicubic,"
          f"setpts='({expr})/TB',fps={FPS},{GRADE},scale=2160:3840:flags=lanczos,"
          f"zoompan=z='{z0}+({z1}-{z0})*on/{frames}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1080x1920:fps={FPS},"
          f"trim=end_frame={frames},setsar=1,format=yuv420p")
    seg = os.path.join(WORK, f"seg{i}.mp4")
    segs.append(seg)
    if os.environ.get("REUSE") and os.path.exists(seg):
        continue
    run(["ffmpeg", "-v", "error", "-y", "-ss", str(a), "-to", str(b), "-i", src, "-an", "-vf", vf,
         "-c:v", "libx264", "-preset", "slow", "-crf", "12", seg])
    print(f"{i}: {f} {a}-{b} -> {L:.3f}s ({frames} kadr)")

# Yig'ish: o'tishlar + zoom pulse + bloom + don + vinyetka
inputs = sum([["-i", s] for s in segs], [])
filt, last = [], "[0:v]"
for i in range(1, n):
    kind, d = TRANS[i - 1]
    off = BOUNDS[i] - d / 2
    filt.append(f"{last}[{i}:v]xfade=transition={kind}:duration={d}:offset={off:.4f}[x{i}]")
    last = f"[x{i}]"
pulse = f"if(gte(on/{FPS},{HOOK}),0.028*exp(-mod(on/{FPS}-{HOOK},{BAR:.5f})/0.13),0)"
filt.append(
    f"{last}scale=2160:3840:flags=lanczos,"
    f"zoompan=z='1+{pulse}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1080x1920:fps={FPS},"
    f"split[a][b];[b]gblur=sigma=28[g];[a][g]blend=all_mode=screen:all_opacity=0.13,"
    f"vignette=angle=PI/5.5,noise=alls=2:allf=t,"
    f"fade=t=in:st=0:d=0.25,fade=t=out:st={TOTAL - 1.1:.3f}:d=1.1,format=yuv420p[v]")
# Ovoz: musiqa + hook paytida asl hovli shovqini (pasayib boradi)
amb = os.path.join(SRC, "IMG_0255.mov")
filt.append(f"[{n + 1}:a]atrim=0:{HOOK + 0.8},asetpts=PTS-STARTPTS,highpass=f=150,volume=0.55,"
            f"afade=t=in:st=0:d=0.15,afade=t=out:st={HOOK - 0.2}:d=1.0,pan=stereo|c0=c0|c1=c0[amb]")
filt.append(f"[{n}:a][amb]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.84:level=0[aout]")
out = os.path.join(ROOT, "out", "04_maktab_montaj_9x16.mp4")
run(["ffmpeg", "-v", "error", "-y", *inputs, "-i", os.path.join(HERE, "music.wav"), "-i", amb,
     "-filter_complex", ";".join(filt), "-map", "[v]", "-map", "[aout]",
     "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-pix_fmt", "yuv420p",
     "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
     "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", f"{TOTAL:.3f}", "-movflags", "+faststart", out])
print(f"{out}: {TOTAL:.3f}s")
