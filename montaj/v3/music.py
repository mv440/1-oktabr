#!/usr/bin/env python3
"""v3 musiqa + SFX (original): 120 BPM, Em-C-G-D, four-on-the-floor + doira uslubidagi perkussiya.
Vaqt chizig'i (s): 0-2 ochilish (3 zarba + riser), 2 drop, 14-15 "freeze" to'xtash, 15-16 fill,
16 qayta drop, 22-26 cho'qqi, 26-28 yakun, 28 so'nggi zarba, 29.2 tugaydi.
MIDI -> FluidSynth -> FluidR3_GM (MIT); SFX numpy'da."""
import os, subprocess
import mido, numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
SR, BPM, TPB = 48000, 120, 480
BEAT, BAR = 0.5, 2.0
TOTAL = 29.2
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
n = lambda s: 12 * (int(s[-1]) + 1) + NOTE[s[:-1]]
CH = {"Em": ("E2", ["E4", "G4", "B4"], ["E3", "B3", "E4", "G4"]),
      "C": ("C2", ["E4", "G4", "C5"], ["C3", "G3", "C4", "E4"]),
      "G": ("G2", ["D4", "G4", "B4"], ["G2", "D3", "G3", "B3"]),
      "D": ("D2", ["D4", "F#4", "A4"], ["D3", "A3", "D4", "F#4"])}
BARS = {1: "Em", 2: "C", 3: "G", 4: "D", 5: "Em", 6: "C", 7: "D", 8: "Em", 9: "C", 10: "G", 11: "C", 12: "D", 13: "G"}
MOT = {"Em": [(0, "B4", 1), (1, "E5", 1), (2, "G5", .5), (2.5, "F#5", .5), (3, "E5", 1)],
       "C": [(0, "E5", 1), (1, "G5", 1), (2, "C6", 1), (3, "B5", .5), (3.5, "G5", .5)],
       "G": [(0, "D5", 1), (1, "G5", 1), (2, "B5", 1.5), (3.5, "A5", .5)],
       "D": [(0, "A5", 1.5), (1.5, "F#5", .5), (2, "D5", 1), (3, "E5", 1)]}


def main():
    ev = []
    def note(t, ch, p, d, v):
        ev.append((t, ch, 1, p, max(1, min(127, int(v))))); ev.append((t + d, ch, 0, p, 0))
    dr = lambda t, p, v: note(t, 9, p, .12, v)
    # Ochilish: 3 zarba (panel kirishi) + baraban "roll"
    for k, chn in enumerate(["Em", "C", "D"]):
        t = k * BEAT
        dr(t, 41, 100); dr(t, 39, 90); dr(t, 49 if k == 0 else 57, 60)
        for p in CH[chn][2]:
            note(t, 0, n(p) + 12, .35, 92)
        note(t, 3, n(CH[chn][0]), .4, 105)
    for k in range(8):
        dr(1.5 + k * BEAT / 8, 38, 45 + k * 9)
    for b, chn in BARS.items():
        t0 = b * BAR; bass, stab, pad = CH[chn]
        stop = b == 7; outro = b == 13; peak = b in (11, 12); light = b in (5, 6)
        if stop:   # freeze: 14.0 zarba, 15.0-16.0 fill
            dr(t0, 36, 115); dr(t0, 49, 90); dr(t0, 39, 100)
            for p in pad: note(t0, 0, n(p) + 12, 1.0, 95)
            note(t0, 3, n(bass), .9, 110)
            for k in range(8):
                dr(t0 + 1.0 + k * .125, 38 if k % 2 == 0 else 45, 60 + k * 7)
            for k in range(4):
                note(t0 + 1.0 + k * .25, 0, n(stab[k % 3]) + (12 if k > 1 else 0), .2, 70 + k * 8)
            continue
        for k in range(4):  # kick
            if outro and k > 0: break
            if light and b == 6 and k % 2: continue
            dr(t0 + k * BEAT, 36, 108 if k == 0 else 96)
        if not outro:
            for k in (1, 3): dr(t0 + k * BEAT, 39, 92 if not light else 70); dr(t0 + k * BEAT, 38, 60)
            for k in range(4): dr(t0 + k * BEAT + .25, 46 if peak else 42, 70 if peak else 58)
            # doira uslubi: konga/bongo/tambur (16-lik to'r)
            for s in range(16):
                ts = t0 + s * .125
                if s in (0, 6, 8, 14): dr(ts, 64, 80)
                if s in (3, 5, 11, 13): dr(ts, 60 if s % 2 else 62, 66)
                if s in (2, 10): dr(ts, 63, 74)
                if s % 2 == 1: dr(ts, 54, 38 + (14 if s in (7, 15) else 0))
        if b in (1, 8, 11): dr(t0, 49, 90)
        for k in range(4):  # pianino: off-beat akkord
            for p in stab: note(t0 + k * BEAT + .25, 0, n(p), .18, 66 if not outro else 50)
        for k in range(8):  # bas
            if outro and k > 1: break
            note(t0 + k * .25 * 2 / 2 * 1, 3, n(bass) + (12 if k % 2 else 0), .22, 98)
        if peak or outro or b >= 8:
            for p in pad: note(t0 + .02, 2, n(p), BAR, 70 if peak else 55)
        if b >= 3 and not light or b >= 8:  # marimba kuy
            for bt, p, d in MOT[chn]:
                note(t0 + bt * BEAT, 4, n(p), d * BEAT, 88)
                if peak: note(t0 + bt * BEAT, 5, n(p) + 12, d * BEAT, 70)
    tf = 28.0
    for p in ["G2", "G3", "D4", "G4", "B4", "D5", "G5"]: note(tf + .01, 0, n(p), 1.2, 96)
    for p in ["G3", "B3", "D4", "G4"]: note(tf, 2, n(p), 1.2, 80)
    note(tf, 3, n("G1"), 1.0, 115); dr(tf, 36, 120); dr(tf, 49, 100); dr(tf, 39, 100)
    note(tf, 4, n("G5"), 1.0, 95); note(tf, 5, n("G6"), 1.0, 80)

    mid = mido.MidiFile(ticks_per_beat=TPB); tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
    for ch, prog, vol, pan in [(0, 0, 96, 58), (2, 48, 70, 72), (3, 33, 100, 64), (4, 12, 92, 76), (5, 9, 66, 50)]:
        tr.append(mido.Message("program_change", channel=ch, program=prog))
        for cc, v in [(7, vol), (10, pan), (91, 55)]: tr.append(mido.Message("control_change", channel=ch, control=cc, value=v))
    for cc, v in [(7, 100), (91, 30)]: tr.append(mido.Message("control_change", channel=9, control=cc, value=v))
    ev.sort(key=lambda e: (e[0], e[2])); last = 0
    for t, ch, on, p, v in ev:
        tick = max(last, int(round(max(0, t) / BEAT * TPB))); dt = tick - last; last = tick
        tr.append(mido.Message("note_on" if on else "note_off", channel=ch, note=p, velocity=v, time=dt))
    mp, raw = os.path.join(HERE, "music.mid"), os.path.join(HERE, "music_raw.wav"); mid.save(mp)
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.5", "-r", str(SR), "-o", "synth.reverb.room-size=0.5",
                    "-o", "synth.reverb.level=0.5", "-F", raw, "/usr/share/sounds/sf2/FluidR3_GM.sf2", mp], check=True)
    x, _ = sf.read(raw, always_2d=True); os.remove(raw)
    N = int(TOTAL * SR); x = np.vstack([x, np.zeros((max(0, N - len(x)), 2))])[:N]
    meter = pyln.Meter(SR); x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -15.0)
    rng = np.random.default_rng(7)
    hp = lambda s, f: sosfilt(butter(2, f, 'hp', fs=SR, output='sos'), s)
    def put(at, sig, pan=None):
        i = int(at * SR); sig = sig[:max(0, N - i)]
        x[i:i + len(sig)] += sig[:, None] if pan is None else sig[:, None] * pan[:len(sig)]
    def boom(L=1.0, f0=60, a=.5):
        u = np.arange(int(L * SR)) / SR
        return np.sin(2 * np.pi * (f0 * u + 50 * (1 - np.exp(-u * 20)) / 20)) * np.exp(-u * 4) * a + hp(rng.standard_normal(len(u)), 1800) * np.exp(-u * 12) * .1
    def riser(L, a=.1):
        u = np.arange(int(L * SR)) / SR; k = u / L
        return hp(rng.standard_normal(len(u)), 500) * k ** 2.4 * a + np.sin(2 * np.pi * np.cumsum(300 * 2 ** (2 * k)) / SR) * k ** 3 * a * .5
    def whoosh(L=.45, a=.08):
        m = int(L * SR); u = np.arange(m) / m
        w = sosfilt(butter(2, [700, 6000], 'bp', fs=SR, output='sos'), rng.standard_normal(m)) * np.sin(np.pi * u) ** 2 * a
        return w, np.stack([1 - .5 * u, .5 + .5 * u], 1)
    put(0.6, riser(1.4, .09)); put(2.0, boom(1.3, 55, .55))
    for c in (4.0, 10.0, 20.0):
        w, pan = whoosh(); put(c - .22, w, pan)
    put(14.0, boom(1.0, 70, .4))
    click = hp(rng.standard_normal(int(.03 * SR)), 3000) * np.exp(-np.arange(int(.03 * SR)) / SR * 150) * .35
    put(14.0, click)  # "kamera zatvori"
    put(15.0, riser(1.0, .08)); put(16.0, boom(1.0, 60, .45)); put(22.0, boom(1.0, 58, .45)); put(28.0, boom(1.2, 50, .55))
    t = np.arange(N) / SR
    x *= (np.clip(t / .01, 0, 1) * (0.5 + 0.5 * np.cos(np.pi * np.clip((t - 28.3) / .9, 0, 1))))[:, None]
    x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -14.0)
    pk = np.abs(x).max()
    if pk > .85: x *= .85 / pk
    tmp = os.path.join(HERE, "music_pre.wav"); out = os.path.join(ROOT_PUBLIC, "music.wav")
    sf.write(tmp, x.astype(np.float32), SR, subtype="FLOAT")
    gain = -14.0 - meter.integrated_loudness(x)
    for _ in range(3):  # limiter bilan -14 LUFS ga yaqinlashtirish
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af",
                        f"volume={gain:.2f}dB,alimiter=limit=0.85:level=0:attack=3:release=80:asc=1",
                        "-c:a", "pcm_s24le", out], check=True)
        y, _ = sf.read(out, always_2d=True); lu = meter.integrated_loudness(y)
        if abs(lu + 14) < 0.3: break
        gain += -14 - lu
    os.remove(tmp); x = y
    print("music.wav", TOTAL, "s; LUFS", round(meter.integrated_loudness(x), 1), "peak", round(20 * np.log10(np.abs(x).max()), 2))


ROOT_PUBLIC = os.path.join(os.path.dirname(os.path.dirname(HERE)), "public", "montaj")
if __name__ == "__main__":
    os.makedirs(ROOT_PUBLIC, exist_ok=True); main()
