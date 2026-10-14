#!/usr/bin/env python3
"""Montaj uchun original fon musiqasi (G-major, 104 BPM, 10 takt + yakuniy akkord).
Kesishlar taktlarga mos: 4-, 6- va 9-takt boshida. MIDI -> FluidSynth -> FluidR3_GM (MIT)."""
import os, random, subprocess, sys
import mido, numpy as np, soundfile as sf, pyloudnorm as pyln

HERE = os.path.dirname(os.path.abspath(__file__))
SR, BPM, TPB = 48000, 104, 480
BEAT = 60 / BPM
BAR = 4 * BEAT
TAIL = 1.2
TOTAL = 10 * BAR + TAIL
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
n = lambda s: 12 * (int(s[-1]) + 1) + NOTE[s[:-1]]

CH = {  # bas, arpedjio, akkord
    "G": ("G2", ["G3", "D4", "G4", "B4", "D5"], ["G3", "B3", "D4", "G4"]),
    "D/F#": ("F#2", ["F#3", "D4", "A4", "D5", "F#5"], ["F#3", "A3", "D4", "A4"]),
    "D": ("D2", ["D3", "A3", "D4", "F#4", "A4"], ["D3", "A3", "D4", "F#4"]),
    "Em": ("E2", ["E3", "B3", "E4", "G4", "B4"], ["E3", "B3", "E4", "G4"]),
    "C": ("C2", ["C3", "G3", "C4", "E4", "G4"], ["C3", "G3", "C4", "E4"]),
}
BARS = ["G", "D/F#", "Em", "C", "G", "D", "Em", "C", "G", "C"]
MEL = [(5, 0, "B5", 1), (5, 1, "D6", 1), (5, 2, "B5", .5), (5, 2.5, "A5", .5), (5, 3, "G5", 1),
       (6, 0, "A5", 1.5), (6, 1.5, "F#5", .5), (6, 2, "A5", 1), (6, 3, "D6", 1),
       (7, 0, "G5", 1), (7, 1, "B5", 1), (7, 2, "E6", 1.5), (7, 3.5, "D6", .5),
       (8, 0, "C6", 1), (8, 1, "B5", 1), (8, 2, "A5", 1), (8, 3, "F#5", 1),
       (9, 0, "G5", 1), (9, 1, "B5", 1), (9, 2, "D6", 1), (9, 3, "G6", 1),
       (10, 0, "E6", 1.5), (10, 1.5, "D6", .5), (10, 2, "C6", 1), (10, 3, "A5", 1)]


def dyn(t):
    pts = [(0, .5), (BAR * 2, .6), (BAR * 4, .7), (BAR * 8, .82), (BAR * 9, .9), (TOTAL, .8)]
    for (a, va), (b, vb) in zip(pts, pts[1:]):
        if a <= t <= b:
            return va + (vb - va) * (t - a) / (b - a)
    return pts[-1][1]


def main():
    rnd = random.Random(14)
    ev = []
    def note(t, ch, p, d, v):
        ev.append((t, ch, "on", p, max(1, min(127, int(v))))); ev.append((t + d, ch, "off", p, 0))
    for b, name in enumerate(BARS):
        bass, arp, pad = CH[name]; t0 = b * BAR; d = dyn(t0)
        for k, idx in enumerate([0, 1, 2, 3, 4, 3, 2, 1]):  # pianino 8-liklar
            note(t0 + k * BEAT / 2 + rnd.uniform(-.004, .004), 0, n(arp[idx]), BEAT * .9, (42 + 34 * d) * (1 if k % 2 == 0 else .82))
        if b >= 1:  # pizzicato
            for k in range(4):
                note(t0 + k * BEAT, 1, n(pad[(k + 1) % 4]) + 12, .25, 48 + 30 * d)
        if b >= 2:
            for p in pad:
                note(t0 + .01, 2, n(p), BAR + .05, 46 + 30 * d)  # torli fon
            note(t0, 3, n(bass), BEAT * 1.8, 70 + 30 * d); note(t0 + 2 * BEAT, 3, n(bass), BEAT * 1.8, 64 + 30 * d)
            for k in range(8):  # shaker
                note(t0 + k * BEAT / 2, 9, 82, .1, (40 if k % 2 else 55) + 20 * d)
            for k in (0, 2):
                note(t0 + k * BEAT, 9, 36, .2, 70 + 25 * d)
        if b >= 4:
            for k in (1, 3):
                note(t0 + k * BEAT, 9, 39, .2, 52 + 25 * d)  # qarsak
        if b in (4, 8):
            note(t0, 9, 49, 1.5, 48 + 20 * d)
    for bar, beat, p, dur in MEL:
        t = ((bar - 1) * 4 + beat) * BEAT
        note(t, 4, n(p), dur * BEAT * 1.1, 58 + 34 * dyn(t))
    tf = 10 * BAR  # yakuniy G akkord
    for j, p in enumerate(["G2", "G3", "D4", "G4", "B4", "D5", "G5"]):
        note(tf + j * .03, 0, n(p), 2.5, 70)
    for p in ["G5", "G6"]:
        note(tf, 4, n(p), 2.0, 80)
    note(tf, 3, n("G2"), 2.0, 90); note(tf, 9, 49, 2, 55); note(tf, 9, 36, .2, 85)
    for p in ["G3", "B3", "D4", "G4"]:
        note(tf, 2, n(p), 2.2, 70)

    mid = mido.MidiFile(ticks_per_beat=TPB); tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
    for ch, prog, vol, pan in [(0, 0, 100, 60), (1, 45, 72, 40), (2, 48, 64, 70), (3, 32, 92, 64), (4, 9, 76, 84)]:
        tr.append(mido.Message("program_change", channel=ch, program=prog))
        for cc, v in [(7, vol), (10, pan), (91, 70)]:
            tr.append(mido.Message("control_change", channel=ch, control=cc, value=v))
    tr.append(mido.Message("control_change", channel=9, control=7, value=84))
    tr.append(mido.Message("control_change", channel=9, control=91, value=40))
    ev.sort(key=lambda e: (e[0], e[2] != "off")); last = 0
    for t, ch, typ, p, v in ev:
        tick = max(last, int(round(max(0, t) / BEAT * TPB))); dt = tick - last; last = tick
        tr.append(mido.Message("note_on" if typ == "on" else "note_off", channel=ch, note=p, velocity=v, time=dt))
    mp = os.path.join(HERE, "music.mid"); raw = os.path.join(HERE, "music_raw.wav"); mid.save(mp)
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.5", "-r", str(SR), "-o", "synth.reverb.room-size=0.6",
                    "-o", "synth.reverb.level=0.6", "-F", raw, "/usr/share/sounds/sf2/FluidR3_GM.sf2", mp], check=True)
    x, _ = sf.read(raw, always_2d=True); os.remove(raw)
    N = int(round(TOTAL * SR)); x = np.vstack([x, np.zeros((max(0, N - len(x)), 2))])[:N]
    m = pyln.Meter(SR); x = pyln.normalize.loudness(x, m.integrated_loudness(x), -14.0)
    t = np.arange(N) / SR
    x *= (np.clip(t / .02, 0, 1) * (0.5 + 0.5 * np.cos(np.pi * np.clip((t - (TOTAL - 1.0)) / 1.0, 0, 1))))[:, None]
    if np.abs(x).max() > .89: x *= .89 / np.abs(x).max()
    sf.write(os.path.join(HERE, "music.wav"), x.astype(np.float32), SR, subtype="PCM_24")
    print(f"music.wav {TOTAL:.3f}s, bar={BAR:.4f}s")


if __name__ == "__main__":
    main()
