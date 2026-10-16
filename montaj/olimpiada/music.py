#!/usr/bin/env python3
"""Olimpiada montaji uchun original musiqa: tantanali-ilhomli, D-major, 90 BPM, 16 takt (42.67 s).
Takt chizig'i (videodagi kadrlarga mos):
  1-2   (0-5.3 s)   sarlavha: pianino arpedjio + pad
  3-6   (5.3-16 s)  saflanish, maydon: torli cholg'ular kiradi, timpani zarbasi
  7-10  (16-26.7 s) madhiya sahnalari: valtorna kuyi, sokin va salobatli
  11-13 (26.7-34.7) ochilish so'zi: to'liq orkestr, 8-lik ostinato
  14-16 (34.7-42.7) yakun: kulminatsiya, so'nggi D akkordi
MIDI -> FluidSynth (FluidR3_GM, MIT) -> numpy SFX (riser, boom) -> -15 LUFS."""
import os, subprocess
import mido, numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
SR, BPM, TPB = 48000, 90, 480
BEAT = 60 / BPM
BAR = 4 * BEAT
TOTAL = 16 * BAR            # 42.667 s
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
n = lambda s: 12 * (int(s[-1]) + 1) + NOTE[s[:-1]]

# akkord: (bas, akkord tovushlari)
CH = {"D": ("D2", ["D3", "A3", "D4", "F#4", "A4"]), "Bm": ("B1", ["B2", "F#3", "B3", "D4", "F#4"]),
      "G": ("G1", ["G2", "D3", "G3", "B3", "D4"]), "D/F#": ("F#1", ["F#2", "A3", "D4", "F#4", "A4"]),
      "Em": ("E2", ["E3", "B3", "E4", "G4", "B4"]), "A": ("A1", ["A2", "E3", "A3", "C#4", "E4"]),
      "Asus": ("A1", ["A2", "E3", "A3", "D4", "E4"])}
PROG = ["D", "Bm", "G", "D/F#", "Em", "A", "Bm", "G", "D", "A", "G", "D/F#", "Em", "G", "Asus", "D"]
# kuy (valtorna / skripka): takt -> [(boshlanish urg'u, nota, uzunlik urg'u)]
MEL = {
    3: [(0, "D5", 1.5), (1.5, "E5", .5), (2, "F#5", 2)],
    4: [(0, "A5", 1.5), (1.5, "G5", .5), (2, "F#5", 2)],
    5: [(0, "G5", 1), (1, "F#5", 1), (2, "E5", 1), (3, "B4", 1)],
    6: [(0, "C#5", 2), (2, "E5", 2)],
    7: [(0, "F#5", 2), (2, "D5", 1), (3, "B4", 1)],
    8: [(0, "D5", 1.5), (1.5, "E5", .5), (2, "D5", 1), (3, "B4", 1)],
    9: [(0, "A4", 2), (2, "D5", 1), (3, "F#5", 1)],
    10: [(0, "E5", 3), (3, "C#5", 1)],
    11: [(0, "D5", 1), (1, "G5", 1), (2, "B5", 1.5), (3.5, "A5", .5)],
    12: [(0, "A5", 1.5), (1.5, "F#5", .5), (2, "D6", 2)],
    13: [(0, "B5", 1), (1, "G5", 1), (2, "E5", 1), (3, "G5", 1)],
    14: [(0, "B5", 1.5), (1.5, "A5", .5), (2, "G5", 1), (3, "D6", 1)],
    15: [(0, "E6", 2), (2, "C#6", 1), (3, "A5", 1)],
    16: [(0, "D6", 4)],
}
PIANO, STR, CELLO, HORN, TIMP, HARP, PAD, BASS, VIOL = range(9)
PROGRAMS = {PIANO: 0, STR: 48, CELLO: 42, HORN: 60, TIMP: 47, HARP: 46, PAD: 89, BASS: 43, VIOL: 40}


def main():
    ev = []
    def note(t, ch, p, d, v):
        ev.append((t, ch, 1, p, max(1, min(127, int(v))))); ev.append((t + d, ch, 0, p, 0))
    dr = lambda t, p, v: note(t, 9, p, .3, v)

    for b, chn in enumerate(PROG, start=1):
        t0 = (b - 1) * BAR
        bass, tones = CH[chn]
        intro, build, anthem, full, fin = b <= 2, 3 <= b <= 6, 7 <= b <= 10, 11 <= b <= 13, b >= 14
        last = b == 16
        # pad — doim, sokin
        for p in tones[1:4]:
            note(t0 + .01, PAD, n(p), BAR, 46 if intro else 40)
        # pianino arpedjio (8-lik), yakunda — akkord
        if not last:
            seq = tones + tones[-2:0:-1]
            for k in range(8):
                vel = (58 if intro else 50) + (8 if k % 4 == 0 else 0)
                note(t0 + k * BEAT / 2, PIANO, n(seq[k % len(seq)]) + 12, BEAT * .9, vel)
        else:
            for p in tones: note(t0, PIANO, n(p) + 12, BAR * 1.6, 70)
        if intro:
            note(t0, BASS, n(bass) + 12, BAR, 50)
            continue
        # torli cholg'ular: uzun akkordlar
        sv = {True: 62}.get(build, 70 if anthem else 84 if full else 92)
        for p in tones[1:]:
            note(t0 + .02, STR, n(p) + 12, BAR * (1.6 if last else 1.0), sv)
        note(t0, CELLO, n(bass) + 12, BAR * (1.6 if last else 1.0), sv + 4)
        note(t0, BASS, n(bass) + 12, BAR * (1.6 if last else 1.0), sv)
        # ostinato (alt) — to'liq qism va yakunda
        if full or (fin and not last):
            for k in range(8):
                note(t0 + k * BEAT / 2, VIOL, n(tones[1]) + 12 + (0 if k % 2 else 7), BEAT * .4, 64 + (10 if k % 2 == 0 else 0))
        # arfa: madhiya qismida glissando-arpedjio
        if anthem:
            for k, p in enumerate(tones + [x[:-1] + str(int(x[-1]) + 1) for x in tones[:3]]):
                note(t0 + k * .085, HARP, n(p) + 12, 1.2, 60)
        # kuy
        for bt, p, d in MEL.get(b, []):
            note(t0 + bt * BEAT, HORN, n(p) - 12, d * BEAT, 84 if not anthem else 74)
            if full or fin:
                note(t0 + bt * BEAT, VIOL, n(p), d * BEAT, 72 if full else 88)
        # timpani
        if b in (3, 7, 11, 14):
            note(t0, TIMP, n(bass) + 12, 1.5, 115); dr(t0, 49, 82 if b != 7 else 62)
        if full or fin:
            for k in (0, 2):
                if not last: note(t0 + k * BEAT, TIMP, n(bass) + 12, .5, 78 if k else 92)
        if b in (6, 10, 13):   # kirish oldidan timpani "roll"
            for k in range(12):
                note(t0 + 3 * BEAT + k * BEAT / 12, TIMP, n(CH[PROG[b]][0]) + 12, .1, 50 + k * 5)
        if last:
            note(t0, TIMP, n(bass) + 12, 3, 112); dr(t0, 49, 92); dr(t0, 57, 70)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
    for ch, pg in PROGRAMS.items():
        tr.append(mido.Message("program_change", channel=ch, program=pg, time=0))
        tr.append(mido.Message("control_change", channel=ch, control=91, value=70, time=0))   # reverb
    for ch, pan in {HORN: 50, VIOL: 76, CELLO: 54, HARP: 84, PIANO: 60}.items():
        tr.append(mido.Message("control_change", channel=ch, control=10, value=pan, time=0))
    tr.append(mido.Message("control_change", channel=PAD, control=7, value=70, time=0))
    ev.sort(key=lambda e: (e[0], e[2]))
    cur = 0
    for t, ch, on, p, v in ev:
        tick = int(round(t / BEAT * TPB))
        tr.append(mido.Message("note_on" if on else "note_off", channel=ch, note=p, velocity=v, time=tick - cur))
        cur = tick
    mp = os.path.join(HERE, "music.mid"); mid.save(mp)
    raw = os.path.join(HERE, "work_music_raw.wav")
    subprocess.run(["fluidsynth", "-ni", "-g", "0.7", "-r", str(SR), "-R", "1", "-C", "1",
                    "-F", raw, "/usr/share/sounds/sf2/FluidR3_GM.sf2", mp], check=True, capture_output=True)
    x, _ = sf.read(raw)
    if x.ndim == 1: x = np.stack([x, x], 1)
    N = int(TOTAL * SR)
    x = np.pad(x, ((0, max(0, N - len(x))), (0, 0)))[:N]

    rng = np.random.default_rng(7)
    def riser(t_end, dur, gain):
        L = int(dur * SR); s = int(t_end * SR) - L
        nz = rng.standard_normal(L)
        env = np.linspace(0, 1, L) ** 2.2
        hp = sosfilt(butter(2, [400, 6000], "bandpass", fs=SR, output="sos"), nz)
        x[s:s + L] += np.stack([hp, np.roll(hp, 97)], 1) * env[:, None] * gain
    def boom(t, gain):
        L = int(1.6 * SR); s = int(t * SR)
        tt = np.arange(L) / SR
        f = 55 * np.exp(-tt * 1.4) + 30
        sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3.2)
        e = min(L, N - s); x[s:s + e] += np.stack([sig, sig], 1)[:e] * gain
    for t in (2 * BAR, 6 * BAR, 10 * BAR, 13 * BAR):
        riser(t, 1.6, .05); boom(t, .32)
    boom(15 * BAR, .38)

    # yakunda muloyim pasayish
    f = int(1.8 * SR); x[-f:] *= np.linspace(1, 0, f)[:, None] ** 1.5
    x[:int(.02 * SR)] *= np.linspace(0, 1, int(.02 * SR))[:, None]
    meter = pyln.Meter(SR)
    x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -15.0)
    peak = np.abs(x).max()
    if peak > .89: x *= .89 / peak
    sf.write(os.path.join(HERE, "music.wav"), x, SR, subtype="PCM_24")
    os.remove(raw)
    print(f"music.wav: {TOTAL:.3f} s, LUFS={meter.integrated_loudness(x):.1f}, peak={np.abs(x).max():.2f}")


if __name__ == "__main__":
    main()
