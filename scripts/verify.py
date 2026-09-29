#!/usr/bin/env python3
"""Tayyor videolarni tekshirish: format, kadrlar soni, 29–31 s ulanish (tasvir va audio)."""
import json
import subprocess
import sys

import numpy as np
import soundfile as sf

P1, P2, FULL = "out/01_ustozlar_0-30.mp4", "out/02_ustozlar_30-60.mp4", "out/03_ustozlar_toliq_60s.mp4"
MASTER = "public/audio/mix.wav"
ok = True


def check(cond, msg):
    global ok
    print(("  OK   " if cond else "  XATO ") + msg)
    ok &= bool(cond)


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-show_streams", "-show_format", "-of", "json", path],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def frames(path, start=None, dur=None, w=480, h=270):
    cmd = ["ffmpeg", "-v", "error"]
    if start is not None:
        cmd += ["-ss", str(start)]
    cmd += ["-i", path]
    if dur is not None:
        cmd += ["-t", str(dur)]
    cmd += ["-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "gray", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)


def audio(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-f", "f32le", "-ac", "2", "-ar", "48000", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2)


params = {}
for path, expect_frames in [(P1, 900), (P2, 900), (FULL, 1800)]:
    try:
        info = probe(path)
    except Exception as e:  # noqa
        check(False, f"{path}: topilmadi ({e})")
        continue
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    a = next(s for s in info["streams"] if s["codec_type"] == "audio")
    nb = int(v["nb_read_packets"])
    vd = float(v["duration"])
    print(f"{path}: {v['codec_name']} {v['width']}x{v['height']} {v['r_frame_rate']} {v['pix_fmt']} | "
          f"{nb} kadr, video {vd:.3f} s | audio {a['codec_name']} {a['sample_rate']} Hz {a['channels']}ch "
          f"{int(a.get('bit_rate', 0)) // 1000} kbps, {float(a['duration']):.3f} s")
    check(v["width"] == 1920 and v["height"] == 1080, "1920x1080")
    check(v["r_frame_rate"] == "30/1", "30 fps")
    check(nb == expect_frames, f"{expect_frames} kadr")
    check(abs(vd - expect_frames / 30) < 1e-3, f"davomiylik {expect_frames / 30:.3f} s")
    params[path] = (v["codec_name"], v["profile"], v["pix_fmt"], v["width"], v["height"], v["r_frame_rate"],
                    a["codec_name"], a["sample_rate"], a["channels"])

if P1 in params and P2 in params:
    check(params[P1] == params[P2], "ikkala qismning video/audio parametrlari bir xil")

print("\n29–31 s ulanishi (tasvir):")
f1 = frames(P1, 29.0)
f2 = frames(P2, None, 1.0)
seq = np.concatenate([f1, f2])
check(len(f1) == 30 and len(f2) == 30, f"29–30 s: {len(f1)} kadr, 30–31 s: {len(f2)} kadr")
luma = seq.mean(axis=(1, 2))
diffs = np.abs(np.diff(seq, axis=0)).mean(axis=(1, 2))
print("  o'rtacha yorqinlik:", " ".join(f"{x:.1f}" for x in luma))
print("  ketma-ket kadr farqi:", " ".join(f"{x:.2f}" for x in diffs))
check(luma.min() > 15, f"qora kadr yo'q (eng past yorqinlik {luma.min():.1f})")
check(diffs.min() > 0.02, f"takroriy kadr yo'q (eng kichik farq {diffs.min():.3f})")
seam = diffs[29]
neigh = np.median(np.concatenate([diffs[20:29], diffs[30:40]]))
check(seam < 3 * neigh + 0.3, f"sakrash yo'q: chegaradagi farq {seam:.2f}, qo'shnilar medianasi {neigh:.2f}")

if FULL in params:
    ff = frames(FULL, 29.0, 2.0)
    check(len(ff) == 60 and np.abs(ff - seq).mean() < 0.5, "60 s fayldagi 29–31 s kadrlar qismlar bilan bir xil")

print("\n29–31 s ulanishi (audio):")
m, sr = sf.read(MASTER, dtype="float32")
a1, a2 = audio(P1), audio(P2)
check(len(a1) >= 1440000 and len(a2) >= 1440000, f"audio: {len(a1) / 48000:.3f} s + {len(a2) / 48000:.3f} s (dekoder oxiridagi to'ldirish bilan)")


def lag_of(x, ref, start):
    seg = ref[start:start + 48000 * 3, 0]
    return max((float(np.dot(x[start + l:start + l + len(seg), 0], seg)), l) for l in range(-2500, 2501, 1))[1]


l1, l2 = lag_of(a1, m[:1440000], 48000), lag_of(a2, m[1440000:], 48000)
check(l1 == 0 and l2 == 0, f"audio videoga aniq mos (siljish: 1-qism {l1}, 2-qism {l2} namuna)")
a1, a2 = a1[:1440000], a2[:1440000]
joined = np.concatenate([a1, a2])
n = min(len(joined), len(m))
seg = slice(int(29 * 48000), int(31 * 48000))
err = np.abs(joined[seg] - m[seg]).max()
corr = np.corrcoef(joined[seg, 0], m[seg, 0])[0, 1]
check(corr > 0.98, f"qismlar audiosi yagona 60 s asos bilan mos (29–31 s korrelyatsiya {corr:.4f}, maks. farq {err:.3f})")
w = 480  # 10 ms
rms = [np.sqrt(np.mean(joined[i:i + w] ** 2)) for i in range(int(29.8 * 48000), int(30.2 * 48000), w)]
rms_db = 20 * np.log10(np.array(rms) + 1e-9)
print("  29.8–30.2 s RMS (10 ms):", " ".join(f"{x:.0f}" for x in rms_db))
check(rms_db.min() > rms_db.max() - 12, "30-soniyada audio uzilishi / sukunat yo'q")
if FULL in params:
    af = audio(FULL)
    c2 = np.corrcoef(af[seg, 0], m[seg, 0])[0, 1]
    check(c2 > 0.98, f"60 s fayl audiosi uzluksiz (29–31 s korrelyatsiya {c2:.4f})")

print("\nNATIJA:", "HAMMASI TO'G'RI" if ok else "MUAMMO BOR")
sys.exit(0 if ok else 1)
