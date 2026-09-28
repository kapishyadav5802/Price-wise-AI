#!/usr/bin/env python3
"""
bgm.py — synthesises the 30 s music bed for the BGMI scrims ad.

Everything here is generated from oscillators and noise: no samples, no royalties.
Style: dark / cinematic trap-electro at 140 BPM, with risers, impacts and whooshes
placed on the ad's cut points.

    python3 bgm.py [out.wav]
"""
import os
import struct
import sys
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 30.0
N = int(SR * DUR)
BPM = 140.0
SPB = 60.0 / BPM          # seconds per beat
BAR = 4 * SPB             # seconds per bar
BARS = int(np.ceil(DUR / BAR))

rng = np.random.default_rng(20260928)
buf = np.zeros(N + SR)    # a little tail room


# ----------------------------------------------------------------- helpers
def add(sig, at, gain=1.0):
    i = int(round(at * SR))
    if i < 0 or i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def noise(n):
    return rng.standard_normal(n)


def fade_in(x, seconds=0.002):
    a = min(len(x), max(1, int(seconds * SR)))
    x[:a] *= np.linspace(0.0, 1.0, a)
    return x


def decay(n, tau, attack=0.002):
    t = np.arange(n) / SR
    return fade_in(np.exp(-t / tau), attack)


def lp(x, cut, order=2):
    return sosfilt(butter(order, min(cut, SR * 0.45), "low", fs=SR, output="sos"), x)


def hp(x, cut, order=2):
    return sosfilt(butter(order, max(cut, 20.0), "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    lo = max(lo, 20.0)
    hi = min(hi, SR * 0.45)
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def sweep_filter(x, f_start, f_end, block=0.02):
    """Cheap time-varying low-pass: filter successive blocks with a moving cutoff."""
    out = np.zeros_like(x)
    n = int(block * SR)
    for i in range(0, len(x), n):
        p = i / max(1, len(x) - 1)
        cut = f_start * (f_end / f_start) ** p
        seg = x[i: i + n]
        out[i: i + n] = lp(seg, cut)
    return out


# ----------------------------------------------------------------- drums
def kick(dur=0.45, f0=185.0, f1=47.0, tau=0.105, click=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.026)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * decay(n, tau, 0.0012)
    cl = hp(noise(n) * decay(n, 0.004, 0.0004), 2600) * click * 0.30
    return np.tanh((body + cl) * 1.7)


def clap(dur=0.34, tau=0.105):
    n = int(dur * SR)
    out = np.zeros(n)
    for i, off in enumerate((0.0, 0.011, 0.023)):          # three quick taps
        s = int(off * SR)
        seg = noise(n - s) * decay(n - s, tau * (1.0 - 0.25 * i), 0.0008)
        out[s:] += seg
    return bp(out, 1100, 4200) * 0.9 + bp(out, 300, 900) * 0.25


def hat(dur=0.09, tau=0.026, open_=False):
    n = int(dur * SR)
    return hp(noise(n) * decay(n, 0.12 if open_ else tau, 0.0006), 7800)


def crash(dur=1.6):
    n = int(dur * SR)
    return hp(noise(n) * decay(n, 0.72, 0.0015), 3200) * 0.9 + hp(noise(n) * decay(n, 0.16), 9000) * 0.5


def impact(dur=1.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * 54 * t) * decay(n, 0.42, 0.002)
    sub = np.sin(2 * np.pi * 38 * t) * decay(n, 0.65, 0.004)
    return np.tanh((thump + 0.8 * sub) * 1.4)


def whoosh(dur=0.62):
    n = int(dur * SR)
    t = np.arange(n) / SR
    raw = noise(n)
    sw = sweep_filter(raw, 7000, 420, block=0.015)
    hump = np.sin(np.pi * (t / dur) ** 0.85) ** 1.6
    return sw * hump


def riser(dur=4.1):
    """Tension builder: rising filtered noise + rising tone + accelerating ticks."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    p = t / dur
    nz = sweep_filter(noise(n), 320, 9000, block=0.05) * (p ** 1.5)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 1000 * p ** 2) / SR) * (p ** 2) * 0.35
    ticks = np.zeros(n)
    tt, step, guard = 0.0, 0.24, 0
    while tt < dur and guard < 400:
        s = int(tt * SR)
        seg = int(0.05 * SR)
        if s < n:
            chunk = hp(noise(seg) * decay(seg, 0.012, 0.0004), 6000)
            ticks[s: s + seg] += chunk[: max(0, min(seg, n - s))]
        tt += step
        step = max(0.055, step * 0.87)
        guard += 1
    return nz * 0.55 + tone + ticks * 0.35


# ----------------------------------------------------------------- tonal
def sub_note(freq, dur, gain=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    wave_ = np.sin(2 * np.pi * freq * t) + 0.22 * np.sin(4 * np.pi * freq * t)
    env = np.clip(np.minimum(t / 0.012, 1.0), 0, 1) * np.exp(-t / (dur * 0.8))
    return np.tanh(wave_ * 1.25) * env * gain


def saw(ph):
    return 2.0 * (ph / (2 * np.pi) % 1.0) - 1.0


def pad_chord(freqs, dur, cutoff=1250, gain=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        for det in (-0.0055, 0.0055):
            out += saw(2 * np.pi * f * (1 + det) * t)
    out /= max(1, len(freqs) * 2)
    out = lp(out, cutoff)
    a = int(0.42 * SR)
    r = int(0.34 * SR)
    env = np.ones(n)
    env[:a] = np.linspace(0, 1, a) ** 1.5
    env[-r:] *= np.linspace(1, 0, r) ** 1.3
    lfo = 1 + 0.10 * np.sin(2 * np.pi * 0.33 * t)
    return out * env * lfo * gain


def pluck(freq, dur=0.30, gain=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * freq * t
    # soft triangle-ish tone
    tone = np.sin(ph) + 0.30 * np.sin(3 * ph) + 0.12 * np.sin(5 * ph)
    return tone * decay(n, 0.085, 0.0015) * gain


# ----------------------------------------------------------------- arrangement
LEVEL = {0: 1, 1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 2, 7: 2,
         8: 3, 9: 3, 10: 3, 11: 3, 12: 2, 13: 2, 14: 2, 15: 3, 16: 3, 17: 3}

ROOTS = [55.00, 43.65, 65.41, 49.00]      # A1  F1  C2  G1
CHORDS = [
    [220.00, 261.63, 329.63],              # Am
    [174.61, 220.00, 261.63],              # F
    [261.63, 329.63, 392.00],              # C
    [196.00, 246.94, 293.66],              # G
]

kick_times, clap_times, hat_times, open_times = [], [], [], []
for bar in range(BARS):
    lvl = LEVEL.get(bar, 2)
    t0 = bar * BAR
    kick_times += [(t0, 1.0), (t0 + 2 * SPB, 1.0)]
    if lvl >= 2:
        kick_times.append((t0 + 3.5 * SPB, 0.8))
    if lvl >= 3:
        kick_times.append((t0 + 1.5 * SPB, 0.7))
        kick_times.append((t0 + 2.75 * SPB, 0.65))
    if lvl >= 2:
        clap_times += [(t0 + SPB, 1.0), (t0 + 3 * SPB, 1.0)]
        for i in range(16):
            tt = t0 + i * SPB / 4
            hat_times.append((tt, 1.0 if i % 4 == 0 else (0.75 if i % 2 == 0 else 0.5)))
            if i % 4 == 2:
                open_times.append((tt, 0.5))
    else:
        for i in range(0, 16, 2):
            hat_times.append((t0 + i * SPB / 4, 0.6))

for at, g in kick_times:
    if at < DUR:
        add(kick(), at, 0.95 * g)
for at, g in clap_times:
    if at < DUR:
        add(clap(), at, 0.30 * g)
for at, g in hat_times:
    if at < DUR:
        add(hat(), at, 0.115 * g)
for at, g in open_times:
    if at < DUR:
        add(hat(open_=True), at, 0.075 * g)

# bass + pad + arp follow Am - F - C - G
for bar in range(BARS):
    t0 = bar * BAR
    if t0 >= DUR:
        break
    root = ROOTS[bar % 4]
    chord = CHORDS[bar % 4]
    bar_len = min(BAR, DUR - t0)
    add(pad_chord(chord, bar_len, cutoff=1150, gain=1.0), t0, 0.20)
    add(pad_chord([f * 2 for f in chord], bar_len, cutoff=2600, gain=1.0), t0, 0.055)
    lvl = LEVEL.get(bar, 2)
    if lvl >= 1:
        add(sub_note(root, min(bar_len * 0.9, 1.5), 1.0), t0, 0.42)
        add(sub_note(root, 0.85, 1.0), t0 + 2 * SPB, 0.36)
        if lvl >= 3:
            add(sub_note(root, 0.55, 1.0), t0 + 3.5 * SPB, 0.30)
    if lvl >= 2:
        pattern = [0, 1, 2, 1, 0, 1, 2, 1]
        for i, idx in enumerate(pattern):
            at = t0 + i * SPB / 2
            if at >= DUR:
                break
            note = chord[idx % len(chord)] * 2
            add(pluck(note, 0.30, 1.0), at, 0.135)
            # simple echo for depth
            if at + 0.2143 < DUR:
                add(pluck(note, 0.30, 1.0), at + 0.2143, 0.055)

# hits on the cut points: open / S6 chicken dinner / end card
add(impact(), 0.0, 0.85)
add(crash(), 0.0, 0.42)
for at, ig, cg in ((13.6, 0.6, 0.26), (17.7, 0.75, 0.30), (25.6, 0.95, 0.46)):
    add(impact(), at, ig)
    add(crash(), at, cg)

# riser into the end card
add(riser(4.1), 21.6, 0.34)

# whooshes on the scene transitions
for at in (3.1, 6.4, 10.1, 13.6, 17.7, 21.7):
    add(whoosh(), at - 0.30, 0.30)

# ----------------------------------------------------------------- master
out = buf[:N].copy()
out = hp(out, 26)
peak = np.max(np.abs(out)) or 1.0
out = np.tanh(out / peak * 1.35) / np.tanh(1.35)      # gentle glue / soft clip
# short fade at the very end so nothing clicks
tail = int(0.25 * SR)
out[-tail:] *= np.linspace(1, 0, tail)
out *= 0.92 / (np.max(np.abs(out)) or 1.0)

stereo = np.stack([out, np.roll(out, 26)], axis=1)    # tiny haas widen on the right
stereo = np.clip(stereo, -1.0, 1.0)

dest = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "audio", "bgm.wav")
os.makedirs(os.path.dirname(dest), exist_ok=True)
with wave.open(dest, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((stereo * 32767.0).astype("<i2").tobytes())

rms = float(np.sqrt(np.mean(out ** 2)))
print(f"wrote {dest}  ({DUR:.1f}s, {BARS} bars @ {BPM:.0f} BPM, peak {np.max(np.abs(out)):.3f}, rms {rms:.4f})")
# structural sanity print: energy per 2 s block
blocks = [round(float(np.sqrt(np.mean(out[i * SR: (i + 2) * SR] ** 2))), 3) for i in range(15)]
print("energy per 2s:", blocks)
