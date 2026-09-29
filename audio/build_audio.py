#!/usr/bin/env python3
"""
1-oktabr tabrik animatsiyasi uchun yagona 60 soniyalik audio asos.

1) Original instrumental musiqa yaratiladi (pianino + torli cholg'ular + kontrabas + arfa),
   MIDI -> FluidSynth -> FluidR3_GM soundfont (MIT litsenziyasi). Musiqa shu loyiha uchun
   yozilgan, uchinchi tomon asari ishlatilmagan.
2) Agar audio/voice/ ichida diktor yozuvi bo'lsa, u musiqa bilan aralashtiriladi (ducking).
3) Natija: public/audio/mix.wav — aynan 60.000 s, 48 kHz, stereo. Video ikki qismga
   bo'linganda audio ham aynan 30-soniyadan bo'linadi, qayta boshlanmaydi.

Ishga tushirish:  python3 audio/build_audio.py
Talablar: fluidsynth, FluidR3_GM.sf2, python: mido numpy soundfile pyloudnorm
"""
import json
import os
import random
import subprocess
import sys

import mido
import numpy as np
import pyloudnorm as pyln
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, "audio")
SR = 48000
DUR = 60.0
N = int(SR * DUR)
BPM = 72
BEAT = 60.0 / BPM  # 0.8333 s; 18 takt x 4 hissa = 60 s
TPB = 480
SF2_CANDIDATES = [
    os.environ.get("SOUNDFONT", ""),
    "/usr/share/sounds/sf2/FluidR3_GM.sf2",
    "/usr/share/soundfonts/FluidR3_GM.sf2",
]

# --- Garmoniya (D major), har takt uchun ---------------------------------
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def n(name):
    """'F#4' -> MIDI raqami."""
    p, o = name[:-1], int(name[-1])
    return 12 * (o + 1) + NOTE[p]


# (bas, arpedjio notalari, torli akkord)
CH = {
    "D": ("D2", ["D3", "A3", "D4", "F#4", "A4"], ["D3", "A3", "F#4", "D5"]),
    "A/C#": ("C#2", ["C#3", "A3", "C#4", "E4", "A4"], ["C#3", "A3", "E4", "C#5"]),
    "Bm": ("B1", ["B2", "F#3", "B3", "D4", "F#4"], ["B2", "F#3", "D4", "B4"]),
    "G": ("G1", ["G2", "D3", "G3", "B3", "D4"], ["G2", "D3", "B3", "G4"]),
    "D/F#": ("F#1", ["F#2", "A3", "D4", "F#4", "A4"], ["F#2", "A3", "D4", "A4"]),
    "Em7": ("E1", ["E2", "B2", "D3", "G3", "B3"], ["E3", "B3", "D4", "G4"]),
    "Asus": ("A1", ["A2", "E3", "A3", "D4", "E4"], ["A2", "E3", "D4", "A4"]),
    "A": ("A1", ["A2", "E3", "A3", "C#4", "E4"], ["A2", "E3", "C#4", "A4"]),
}
# 18 takt. 9-takt Bm, 10-takt G — 30-soniyada kadensiya (tugash hissi) yo'q.
BARS = ["D", "A/C#", "Bm", "G", "D/F#", "G", "Em7", "Asus", "Bm",
        "G", "D/F#", "Em7", "A", "Bm", "G", "A", "D", "D"]

# Kuy: (takt 1..18, hissa, nota, davomiylik hissada)
MELODY = [
    (4, 2, "D5", 1), (4, 3, "E5", 1),
    (5, 0, "F#5", 2), (5, 2, "E5", 1.5), (5, 3.5, "D5", 0.5),
    (6, 0, "D5", 2), (6, 2, "B4", 1), (6, 3, "D5", 1),
    (7, 0, "G5", 1.5), (7, 1.5, "F#5", 0.5), (7, 2, "E5", 2),
    (8, 0, "E5", 1), (8, 1, "D5", 1), (8, 2, "A4", 2),
    (9, 0, "D5", 1.5), (9, 1.5, "C#5", 0.5), (9, 2, "B4", 1.5),
    (9, 3.5, "F#5", 1.0),  # 29.58 s — 30-soniya chegarasidan o'tib ketadi (ibora uzilmaydi)
    (10, 0.5, "G5", 1.5), (10, 2, "A5", 1), (10, 3, "B5", 1),
    (11, 0, "A5", 2), (11, 2, "F#5", 1), (11, 3, "D5", 1),
    (12, 0, "E5", 1.5), (12, 1.5, "F#5", 0.5), (12, 2, "G5", 2),
    (13, 0, "A5", 1), (13, 1, "G5", 1), (13, 2, "F#5", 1), (13, 3, "E5", 1),
    (14, 0, "F#5", 3), (14, 3, "D5", 1),
    (15, 0, "B5", 2), (15, 2, "A5", 1), (15, 3, "G5", 1),
    (16, 0, "A5", 1.5), (16, 1.5, "G5", 0.5), (16, 2, "F#5", 1), (16, 3, "E5", 1),
    (17, 0, "F#5", 2), (17, 2, "E5", 1), (17, 3, "D5", 1),
    (18, 0, "D5", 4),
]

# Arfa arpedjiolari (sahnadagi nur lahzalari): (soniya, akkord)
HARP = [(0.55, "D"), (8.15, "Bm"), (21.75, "Em7"), (33.36, "D/F#"), (46.75, "G"), (53.4, "D")]


def dyn(t):
    """Umumiy dinamika (0..1): sokin boshlanish, 46-53 s da cho'qqi, oxirida pasayish."""
    pts = [(0, 0.45), (6.6, 0.55), (13.3, 0.62), (26, 0.68), (40, 0.74), (47, 0.84), (52, 0.8), (56.7, 0.62), (60, 0.5)]
    for (t0, v0), (t1, v1) in zip(pts, pts[1:]):
        if t0 <= t <= t1:
            return v0 + (v1 - v0) * (t - t0) / (t1 - t0)
    return pts[-1][1]


def build_midi(path):
    rnd = random.Random(2026)
    mid = mido.MidiFile(ticks_per_beat=TPB)
    events = []  # (time_s, channel, type, a, b)

    def note(t, ch, pitch, dur, vel):
        vel = max(1, min(127, int(vel)))
        events.append((t, ch, "on", pitch, vel))
        events.append((t + dur, ch, "off", pitch, 0))

    # Kanallar: 0 pianino, 1 torli (String Ensemble 1), 2 kontrabas, 3 arfa, 4 torli (Slow strings)
    programs = {0: 0, 1: 48, 2: 43, 3: 46, 4: 49}

    for b, name in enumerate(BARS):
        bass, arp, pad = CH[name]
        t0 = b * 4 * BEAT
        d = dyn(t0)
        # Pianino arpedjio (8-liklar). 1-takt siyrakroq.
        pattern = [0, 1, 2, 3, 4, 3, 2, 1]
        for k, idx in enumerate(pattern):
            if b == 0 and k % 2 == 1:
                continue
            if b == 17 and k > 3:
                continue  # oxirgi takt: faqat yoyilgan akkord
            t = t0 + k * BEAT / 2 + 0.25 * (b == 0 and k == 0) + rnd.uniform(-0.006, 0.006)
            accent = 1.0 if k == 0 else (0.86 if k == 4 else 0.78)
            note(t, 0, n(arp[idx]), BEAT * 1.6, (40 + 34 * d) * accent + rnd.uniform(-3, 3))
        # Chap qo'l basi (piano)
        note(t0 + 0.25 * (b == 0) + 0.004, 0, n(bass) + 12, BEAT * 3.8, 34 + 30 * d)
        # Oxirgi takt: yoyilgan yakuniy akkord
        if b == 17:
            for j, p in enumerate(["D3", "A3", "D4", "F#4", "A4", "D5"]):
                note(t0 + 2 * BEAT + j * 0.07, 0, n(p), 3.2, 36 + 18 * d)
        # Torli cholg'ular 3-taktdan (kitob ochilishi) boshlab
        if b >= 2:
            for p in pad:
                note(t0 + 0.02, 1, n(p), 4 * BEAT + 0.12, 58 + 30 * d)
            if b >= 8:
                for p in pad[1:3]:
                    note(t0 + 0.03, 4, n(p) + 12, 4 * BEAT + 0.12, 44 + 30 * d)
        # Kontrabas 5-taktdan
        if b >= 4:
            note(t0 + 0.01, 2, n(bass) + 12, 4 * BEAT + 0.1, 46 + 30 * d)

    for bar, beat, p, dur in MELODY:
        t = ((bar - 1) * 4 + beat) * BEAT + rnd.uniform(-0.005, 0.005)
        note(t, 0, n(p), dur * BEAT * 1.05, 52 + 34 * dyn(t) + rnd.uniform(-2, 2))

    for t0, name in HARP:
        _, arp, _ = CH[name]
        seq = [n(x) + 12 for x in arp] + [n(x) + 24 for x in arp[1:]]
        for j, p in enumerate(seq):
            note(t0 + j * 0.085, 3, p, 2.2, 34 + 22 * dyn(t0) - j * 0.8)

    # Ifoda (CC11) egri chiziqlari — torli cholg'ular uchun
    def expr(ch, pts):
        for i in range(len(pts) - 1):
            (ta, va), (tb, vb) = pts[i], pts[i + 1]
            steps = max(1, int((tb - ta) * 10))
            for s in range(steps):
                tt = ta + (tb - ta) * s / steps
                events.append((tt, ch, "cc", 11, int(va + (vb - va) * s / steps)))

    expr(1, [(0, 0), (6.6, 20), (10.5, 88), (24, 96), (40, 104), (47, 118), (53, 108), (57, 90), (60, 80)])
    expr(4, [(0, 0), (26.6, 30), (33, 80), (47, 112), (53, 96), (60, 70)])
    expr(2, [(0, 90), (60, 100)])

    track = mido.MidiTrack()
    mid.tracks.append(track)
    track.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    for ch, prog in programs.items():
        track.append(mido.Message("program_change", channel=ch, program=prog, time=0))
        track.append(mido.Message("control_change", channel=ch, control=91, value=92 if ch != 2 else 70, time=0))
        track.append(mido.Message("control_change", channel=ch, control=93, value=24 if ch in (1, 4) else 0, time=0))
        vol = {0: 100, 1: 76, 2: 70, 3: 70, 4: 58}[ch]
        track.append(mido.Message("control_change", channel=ch, control=7, value=vol, time=0))
        pan = {0: 64, 1: 52, 2: 64, 3: 84, 4: 76}[ch]
        track.append(mido.Message("control_change", channel=ch, control=10, value=pan, time=0))

    order = {"off": 0, "cc": 1, "on": 2}
    events.sort(key=lambda e: (e[0], order[e[2]]))
    last_tick = 0
    for t, ch, typ, a, bval in events:
        tick = int(round(max(0.0, t) / BEAT * TPB))
        delta = tick - last_tick
        last_tick = tick
        if typ == "on":
            track.append(mido.Message("note_on", channel=ch, note=a, velocity=bval, time=delta))
        elif typ == "off":
            track.append(mido.Message("note_off", channel=ch, note=a, velocity=0, time=delta))
        else:
            track.append(mido.Message("control_change", channel=ch, control=a, value=bval, time=delta))
    mid.save(path)


def render_music(mid_path, wav_path):
    sf2 = next((p for p in SF2_CANDIDATES if p and os.path.exists(p)), None)
    if not sf2:
        sys.exit("FluidR3_GM.sf2 topilmadi (apt install fluid-soundfont-gm yoki SOUNDFONT=... bering)")
    cmd = [
        "fluidsynth", "-ni", "-q", "-g", "0.45", "-r", str(SR),
        "-o", "synth.reverb.room-size=0.78", "-o", "synth.reverb.damp=0.35",
        "-o", "synth.reverb.width=0.95", "-o", "synth.reverb.level=0.75",
        "-o", "synth.chorus.level=0.6",
        "-F", wav_path, sf2, mid_path,
    ]
    subprocess.run(cmd, check=True)


def fit(x):
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    if len(x) < N:
        x = np.concatenate([x, np.zeros((N - len(x), x.shape[1]), dtype=x.dtype)])
    return x[:N].astype(np.float64)


def load_voice():
    """Diktor yozuvi: audio/voice/voice_full.wav (60 s, tayyor joylashtirilgan) yoki
    cues.json dagi har bir ibora uchun alohida fayllar (v01.wav ...)."""
    vdir = os.path.join(AUDIO, "voice")
    full = os.path.join(vdir, "voice_full.wav")
    if os.path.exists(full):
        v, sr = sf.read(full, always_2d=True)
        assert sr == SR, f"voice_full.wav {SR} Hz bo'lishi kerak"
        return fit(v)
    cues = json.load(open(os.path.join(vdir, "cues.json"), encoding="utf-8"))
    out = np.zeros((N, 2))
    found = False
    for c in cues["cues"]:
        path = os.path.join(vdir, c["file"])
        if not os.path.exists(path):
            continue
        found = True
        v, sr = sf.read(path, always_2d=True)
        assert sr == SR, f"{c['file']} {SR} Hz bo'lishi kerak"
        v = fit(v)[: int(len(v))] if len(v) < N else fit(v)
        start = int(c["start"] * SR)
        end = start + len(v)
        limit = int(c["must_end_before"] * SR)
        if end > limit:
            print(f"OGOHLANTIRISH: {c['file']} {end / SR:.2f} s da tugaydi (chegara {c['must_end_before']} s)")
        end = min(end, N)
        out[start:end] += v[: end - start]
    return out if found else None


def envelope(x, attack=0.04, release=0.45):
    mono = np.abs(x).max(axis=1)
    a = np.exp(-1.0 / (attack * SR))
    r = np.exp(-1.0 / (release * SR))
    env = np.zeros_like(mono)
    e = 0.0
    for i, s in enumerate(mono):
        e = a * e + (1 - a) * s if s > e else r * e + (1 - r) * s
        env[i] = e
    return env


def main():
    os.makedirs(os.path.join(ROOT, "public", "audio"), exist_ok=True)
    mid_path = os.path.join(AUDIO, "music.mid")
    raw = os.path.join(AUDIO, "music_raw.wav")
    build_midi(mid_path)
    render_music(mid_path, raw)
    m, sr = sf.read(raw, always_2d=True)
    assert sr == SR
    m = fit(m)

    meter = pyln.Meter(SR)
    m = pyln.normalize.loudness(m, meter.integrated_loudness(m), -17.0)

    voice = load_voice()
    if voice is not None:
        voice = pyln.normalize.loudness(voice, meter.integrated_loudness(voice[np.abs(voice).max(axis=1) > 1e-4]), -16.0)
        env = envelope(voice)
        duck = 1.0 - 0.62 * np.clip(env / (np.percentile(env[env > 1e-4], 90) + 1e-9), 0, 1)
        mix = m * duck[:, None] * 0.9 + voice
        print("Diktor ovozi qo'shildi (musiqa ovoz ostida ~8 dB pasaytiriladi).")
    else:
        mix = m
        print("Diktor yozuvi topilmadi — faqat musiqa (audio/voice/README.md ga qarang).")

    # Boshlanishdagi klikdan himoya va oxirgi soniyada muloyim pasayish (59-60 s).
    t = np.arange(N) / SR
    fade_in = np.clip(t / 0.03, 0, 1)
    fo = np.clip((t - 59.0) / 1.0, 0, 1)
    fade_out = 0.5 + 0.5 * np.cos(np.pi * fo)
    mix = mix * (fade_in * fade_out)[:, None]

    peak = np.abs(mix).max()
    if peak > 0.89:  # ~ -1 dBFS
        mix *= 0.89 / peak
    out = os.path.join(ROOT, "public", "audio", "mix.wav")
    sf.write(out, mix.astype(np.float32), SR, subtype="PCM_24")
    print(f"{out}: {len(mix) / SR:.3f} s, LUFS={meter.integrated_loudness(mix):.1f}, peak={20 * np.log10(np.abs(mix).max()):.1f} dBFS")
    os.remove(raw)


if __name__ == "__main__":
    main()
