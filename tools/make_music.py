"""Compose the original Capiday background music: eight soft loops
(lofi, piano, upbeat ukulele and a jazzy café trio).

Every note, drum and texture here is synthesised from code (FM electric
piano, plucked strings, music box, pads, noise-based drums, rain, waves and
vinyl crackle). No samples, recordings or third-party music are used, and no
song is copied: chords are common progressions and the melodies were written
for this file. Run once; the MP3s are committed to
Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Music together with
LittleDays-Original-Music.txt, and listed in library.json ("music").

    python3 tools/make_music.py              # all pieces; needs numpy and ffmpeg (libmp3lame)
    python3 tools/make_music.py sunny-day    # only the named pieces

The output is deterministic (fixed seeds) apart from encoder versions.
"""
import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Music'


def hz(note):
    return 440.0 * 2 ** ((note - 69) / 12)


def times(n):
    return np.arange(n) / SR


def shape(x, lo=None, hi=None, order=2):
    """Zero-phase Butterworth-shaped filter in the frequency domain."""
    if not len(x):
        return x
    size = 1 << int(np.ceil(np.log2(len(x) + 1)))
    spectrum = np.fft.rfft(x, size)
    f = np.fft.rfftfreq(size, 1 / SR)
    gain = np.ones_like(f)
    if hi:
        gain /= np.sqrt(1 + (f / hi) ** (2 * order))
    if lo:
        with np.errstate(divide='ignore'):
            gain /= np.sqrt(1 + (lo / np.maximum(f, 1e-6)) ** (2 * order))
    return np.fft.irfft(spectrum * gain, size)[: len(x)]


def release(t, amp, held, rate):
    off = t > held
    amp = amp.copy()
    amp[off] *= np.exp(-(t[off] - held) * rate)
    return amp


# ---------- Instruments ----------
def epiano(freq, held, vel=0.5):
    """Warm FM electric piano (Rhodes-like) with a soft tine."""
    n = int((held + 1.6) * SR)
    t = times(n)
    index = 1.7 * np.exp(-t * 2.6) + 0.3
    body = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * t))
    tine = 0.16 * np.sin(2 * np.pi * freq * 7.0 * t) * np.exp(-t * 11)
    amp = np.exp(-t * (0.9 + freq / 900)) * np.minimum(1, t / 0.004)
    amp = release(t, amp, held, 7)
    return (body + tine) * amp * vel


def bass(freq, held, vel=0.5):
    n = int((held + 0.4) * SR)
    t = times(n)
    tone = np.sin(2 * np.pi * freq * t) + 0.22 * np.sin(4 * np.pi * freq * t)
    amp = np.exp(-t * 1.1) * np.minimum(1, t / 0.012)
    amp = release(t, amp, held, 14)
    return shape(tone * amp, hi=420) * vel


def pluck(freq, held, vel=0.5, seed=0):
    """Plucked nylon-ish string (Karplus-Strong, vectorised per period)."""
    n = int((held + 1.2) * SR)
    period = max(2, int(round(SR / freq)))
    rng = np.random.default_rng(seed)
    out = np.zeros(n + period + 1)
    burst = shape(rng.uniform(-1, 1, period), hi=freq * 6)
    out[1 : period + 1] = burst
    decay = 0.996 ** (220 / freq)
    for start in range(period + 1, len(out), period):
        end = min(start + period, len(out))
        k = end - start
        out[start:end] = decay * 0.5 * (out[start - period : start - period + k] + out[start - period - 1 : start - period - 1 + k])
    sig = out[1 : n + 1]
    t = times(n)
    amp = release(t, np.ones(n), held, 6)
    return shape(sig * amp, hi=3500) * vel * 1.6


def piano(freq, held, vel=0.5):
    """Acoustic-ish piano: two slightly detuned strings, stretched partials
    that fade faster the higher they are, a soft hammer knock."""
    n = int((held + 2.4) * SR)
    t = times(n)
    sig = np.zeros(n)
    for detune in (0.0, 0.7):
        f0 = freq * 2 ** (detune / 1200)
        for k in range(1, 10):
            fk = f0 * k * np.sqrt(1 + 0.00035 * k * k)
            if fk > 11000:
                break
            level = (1 / k**1.15) * (0.35 + vel) ** (k * 0.35)
            rate = 0.55 + 0.32 * k + freq / 700
            sig += level * np.sin(2 * np.pi * fk * t + k * 0.7) * (0.7 * np.exp(-t * rate) + 0.3 * np.exp(-t * rate * 0.22))
    rng = np.random.default_rng(int(freq * 10))
    knock = shape(rng.uniform(-1, 1, n), lo=600, hi=4000) * np.exp(-t * 90) * 0.04
    amp = release(t, np.minimum(1, t / 0.0025), held, 8)
    return (sig * 0.5 + knock) * amp * vel


def glock(freq, vel=0.3):
    n = int(1.8 * SR)
    t = times(n)
    sig = np.sin(2 * np.pi * freq * t) * np.exp(-t * 2.8) + 0.25 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * 7) + 0.1 * np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-t * 14)
    return sig * np.minimum(1, t / 0.001) * vel


def upright(freq, held, vel=0.5):
    """Plucked upright bass: a short string pluck over a round sine body."""
    n = int((held + 0.5) * SR)
    t = times(n)
    body = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(4 * np.pi * freq * t) * np.exp(-t * 6)
    amp = release(t, np.exp(-t * 2.2) * np.minimum(1, t / 0.006), held, 12)
    thump = shape(pluck(freq * 2, held, 0.4, seed=int(freq)), hi=900)[:n]
    return shape(body * amp, hi=700) * vel + thump * vel * 0.5


def clap(rng, vel=0.35):
    n = int(0.2 * SR)
    t = times(n)
    noise = shape(rng.uniform(-1, 1, n), lo=900, hi=3500)
    env = np.zeros(n)
    for k, off in enumerate((0.0, 0.009, 0.018)):
        i = int(off * SR)
        env[i:] += np.exp(-(t[: n - i]) * (140 if k < 2 else 30)) * (0.7 if k < 2 else 1)
    return noise * env * vel


def brush(rng, vel=0.2, swirl=False):
    n = int((0.35 if swirl else 0.12) * SR)
    t = times(n)
    env = (np.minimum(1, t / 0.04) * np.exp(-t * 9)) if swirl else np.exp(-t * 40)
    return shape(rng.uniform(-1, 1, n), lo=2200, hi=9000) * env * vel


def ride(rng, vel=0.12):
    n = int(0.6 * SR)
    t = times(n)
    bell = sum(np.sin(2 * np.pi * f * t) for f in (3150, 4420, 5310)) / 3 * np.exp(-t * 7)
    hiss = shape(rng.uniform(-1, 1, n), lo=6000, hi=12000) * np.exp(-t * 12)
    return (bell * 0.5 + hiss) * vel


def music_box(freq, vel=0.4):
    n = int(2.6 * SR)
    t = times(n)
    sig = (
        np.sin(2 * np.pi * freq * t) * np.exp(-t * 1.6)
        + 0.30 * np.sin(2 * np.pi * freq * 4.2 * t) * np.exp(-t * 5)
        + 0.12 * np.sin(2 * np.pi * freq * 9.1 * t) * np.exp(-t * 11)
    )
    return sig * np.minimum(1, t / 0.002) * vel


def pad(notes, held, vel=0.25):
    n = int((held + 2.0) * SR)
    t = times(n)
    sig = np.zeros(n)
    for note in notes:
        for cents in (-7, 0, 6):
            f = hz(note) * 2 ** (cents / 1200)
            for h in range(1, 7):
                sig += np.sin(2 * np.pi * f * h * t + h) / h ** 1.6
    amp = np.minimum(1, t / 1.4)
    amp = release(t, amp, held, 1.6)
    return shape(sig * amp, hi=1300) * vel / (len(notes) * 3)


def kick(vel=0.8):
    n = int(0.5 * SR)
    t = times(n)
    f = 46 + 80 * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    return np.tanh(body * 1.4) * vel


def snare(rng, vel=0.5):
    n = int(0.3 * SR)
    t = times(n)
    noise = shape(rng.uniform(-1, 1, n), lo=900, hi=6000) * np.exp(-t * 20)
    tone = 0.45 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28)
    return (noise * 1.4 + tone) * vel


def rim(rng, vel=0.35):
    n = int(0.12 * SR)
    t = times(n)
    click = np.sin(2 * np.pi * 1650 * t) * np.exp(-t * 70) + 0.4 * shape(rng.uniform(-1, 1, n), lo=2000) * np.exp(-t * 90)
    return click * vel


def hat(rng, vel=0.3, open_=False):
    n = int((0.25 if open_ else 0.09) * SR)
    t = times(n)
    return shape(rng.uniform(-1, 1, n), lo=5000, hi=13000) * np.exp(-t * (14 if open_ else 38)) * vel


def shaker(rng, vel=0.3):
    n = int(0.14 * SR)
    t = times(n)
    env = np.minimum(1, t / 0.02) * np.exp(-t * 30)
    return shape(rng.uniform(-1, 1, n), lo=4500, hi=11000) * env * vel


# ---------- Beds (exactly one loop long, so they repeat seamlessly) ----------
def vinyl(n, rng, level=0.035):
    hiss = shape(rng.normal(0, 1, n), lo=1500, hi=7000) * level * 0.35
    pops = np.zeros(n)
    count = int(n / SR * 7)
    at = rng.integers(0, n - 200, count)
    pops[at] = rng.uniform(-1, 1, count) * rng.uniform(0.2, 1, count) ** 3
    pops = shape(pops, lo=800, hi=6000) * level * 9
    return hiss + pops


def rain(n, rng, level=0.2):
    t = times(n)
    length = n / SR
    swell = 0.75 + 0.25 * np.sin(2 * np.pi * 3 * t / length) * np.sin(2 * np.pi * 5 * t / length + 1)
    wash = shape(rng.normal(0, 1, n), lo=700, hi=7000) * swell
    drops = np.zeros(n)
    count = int(length * 22)
    at = rng.integers(0, n - 100, count)
    drops[at] = rng.uniform(0.2, 1, count)
    drops = shape(drops, lo=2500, hi=9000) * 3
    return (wash * 0.22 + drops) * level


def cafe(n, rng, level=0.05):
    """A quiet café: soft murmur and the odd cup."""
    t = times(n)
    length = n / SR
    swell = 0.7 + 0.3 * np.sin(2 * np.pi * 4 * t / length) * np.sin(2 * np.pi * 7 * t / length + 2)
    murmur = shape(rng.normal(0, 1, n), lo=250, hi=1600) * swell * 0.25
    cups = np.zeros(n)
    for at in rng.integers(0, n - SR, int(length / 6)):
        k = int(0.5 * SR)
        tt = times(k)
        f = rng.uniform(2600, 3400)
        cups[at : at + k] += (np.sin(2 * np.pi * f * tt) + 0.6 * np.sin(2 * np.pi * f * 1.48 * tt)) * np.exp(-tt * 18) * rng.uniform(0.15, 0.4)
    return (murmur + cups) * level


def waves(n, rng, level=0.07):
    t = times(n)
    length = n / SR
    cycles = max(1, round(length / 8.5))
    swell = (0.5 - 0.5 * np.cos(2 * np.pi * cycles * t / length)) ** 2
    return shape(rng.normal(0, 1, n), lo=180, hi=3000) * (0.15 + 0.85 * swell) * level


# ---------- A track ----------
class Track:
    def __init__(self, bpm, bars, seed):
        self.beat = 60 / bpm
        self.bars = bars
        self.length = int(round(bars * 4 * self.beat * SR))
        self.buf = np.zeros((2, self.length + 5 * SR))
        self.rng = np.random.default_rng(seed)

    def at(self, bar, beat):
        return (bar * 4 + beat) * self.beat

    def add(self, sig, start, gain=1.0, pan=0.0, humanize=0.006):
        start += self.rng.uniform(-humanize, humanize) if humanize else 0
        i = max(0, int(round(start * SR)))
        k = min(len(sig), self.buf.shape[1] - i)
        if k <= 0:
            return
        angle = (pan + 1) * np.pi / 4
        self.buf[0, i : i + k] += sig[:k] * gain * np.cos(angle) * np.sqrt(2)
        self.buf[1, i : i + k] += sig[:k] * gain * np.sin(angle) * np.sqrt(2)

    def vel(self, v, spread=0.12):
        return v * (1 + self.rng.uniform(-spread, spread))

    def chords(self, bar, notes, hits, vel=0.32, strum=0.014, spread=0.5):
        for beat, length in hits:
            for j, note in enumerate(notes):
                pan = (j / max(1, len(notes) - 1) - 0.5) * spread
                self.add(epiano(hz(note), length * self.beat, self.vel(vel)), self.at(bar, beat) + j * strum, pan=pan)

    def drums(self, bar, kicks=(0, 2.5), snares=(1, 3), swing=0.58, hats=True, rimshot=False, k=0.5, s=0.4, h=0.3):
        for b in kicks:
            self.add(kick(self.vel(k)), self.at(bar, b))
        for b in snares:
            self.add((rim if rimshot else snare)(self.rng, self.vel(s)), self.at(bar, b), pan=0.05)
        if hats:
            for step in range(4):
                self.add(hat(self.rng, self.vel(h)), self.at(bar, step), pan=0.25)
                self.add(hat(self.rng, self.vel(h * 0.6)), self.at(bar, step + swing), pan=0.25)

    def melody(self, notes, voice, gain=1.0, pan=0.0):
        for bar, beat, note, length in notes:
            self.add(voice(hz(note), length * self.beat) * gain, self.at(bar, beat), pan=pan)

    def master(self, beds=(), lowpass=9000, wobble_cents=3.0, reverb=0.0):
        n = self.length
        mix = self.buf[:, :n].copy()
        tail = self.buf.shape[1] - n
        mix[:, :tail] += self.buf[:, n:]  # wrap the ringing tails round: seamless loop
        if reverb:
            # A small room: decaying noise, convolved circularly (loops cleanly).
            seconds = 1.8
            k = int(seconds * SR)
            for ch in range(2):
                ir = np.zeros(n)
                tt = times(k)
                ir[:k] = shape(self.rng.normal(0, 1, k), lo=200, hi=6000) * np.exp(-tt * 6.9 / seconds)
                ir /= np.sqrt(np.sum(ir**2))
                wet = np.fft.irfft(np.fft.rfft(mix[ch]) * np.fft.rfft(ir), n)
                mix[ch] = mix[ch] + wet * reverb
        for bed, pan in beds:
            angle = (pan + 1) * np.pi / 4
            mix[0] += bed[:n] * np.cos(angle) * np.sqrt(2)
            mix[1] += bed[:n] * np.sin(angle) * np.sqrt(2)
        # Tape wobble with a whole number of cycles per loop.
        length = n / SR
        cycles = max(1, round(length * 0.45))
        depth = (2 ** (wobble_cents / 1200) - 1) * SR / (2 * np.pi * cycles / length)
        idx = np.arange(n) + depth * np.sin(2 * np.pi * cycles * np.arange(n) / n)
        mix = np.stack([np.interp(idx, np.arange(n), ch, period=n) for ch in mix])
        mix = np.stack([shape(ch, lo=35, hi=lowpass) for ch in mix])
        rms = np.sqrt(np.mean(mix**2))
        mix *= 10 ** (-19 / 20) / max(rms, 1e-9)
        return np.tanh(mix * 1.1) / 1.1


# ---------- The five pieces ----------
def afternoon_coffee():
    tr = Track(bpm=78, bars=16, seed=11)
    prog = [([53, 57, 60, 64, 67], 41), ([52, 55, 59, 62], 40), ([50, 53, 57, 60, 64], 38), ([48, 52, 55, 59, 62], 36)]
    for bar in range(16):
        notes, root = prog[bar % 4]
        tr.chords(bar, notes, [(0, 1.5), (2.5, 1.2)] if bar % 2 == 0 else [(0, 1.0), (1.5, 1.0), (3, 0.9)])
        tr.add(bass(hz(root), 1.6 * tr.beat, tr.vel(0.5)), tr.at(bar, 0))
        tr.add(bass(hz(root + 7), 0.8 * tr.beat, tr.vel(0.38)), tr.at(bar, 2.5))
        if bar >= 2:
            tr.drums(bar)
    phrase = [
        (0, 0, 76, 1.5), (0, 1.5, 74, 0.5), (0, 2, 72, 1.5),
        (1, 0.5, 71, 1), (1, 2, 67, 2),
        (2, 0, 69, 1), (2, 1, 72, 1), (2, 2, 77, 1.5), (2, 3.5, 76, 0.5),
        (3, 0, 74, 1), (3, 1, 72, 2.5),
    ]
    for start in (4, 12):
        tr.melody([(start + b, beat, n, d) for b, beat, n, d in phrase], lambda f, h: epiano(f, h, 0.42), pan=0.15)
    tr.melody([(8, 0, 79, 1), (8, 1.5, 76, 1), (9, 0, 74, 2), (10, 0, 72, 1), (10, 1, 74, 1), (10, 2, 76, 2), (11, 0.5, 74, 3)], lambda f, h: epiano(f, h, 0.36), pan=-0.15)
    return tr.master([(vinyl(tr.length, tr.rng), 0.0)])


def rainy_window():
    tr = Track(bpm=70, bars=14, seed=23)
    prog = [([57, 60, 64, 67, 71], 45), ([50, 53, 57, 60, 64], 38), ([53, 57, 60, 64], 41), ([52, 55, 59, 62], 40)]
    for bar in range(14):
        notes, root = prog[(bar // 1) % 4]
        tr.chords(bar, notes, [(0, 2.8), (3, 0.9)], vel=0.28, strum=0.022)
        tr.add(bass(hz(root), 3 * tr.beat, tr.vel(0.45)), tr.at(bar, 0))
        if 2 <= bar < 12:
            tr.drums(bar, kicks=(0, 1.75, 2.5), snares=(1, 3), rimshot=True, swing=0.6, k=0.42, s=0.34, h=0.22)
    tr.melody([(4, 0.5, 72, 1), (4, 2, 71, 1.5), (5, 0, 69, 3), (6, 1, 67, 1), (6, 2, 69, 1), (6, 3, 72, 1), (7, 0, 71, 3)], lambda f, h: epiano(f, h, 0.34), pan=0.2)
    tr.melody([(9, 0.5, 76, 1), (9, 2, 74, 1), (9, 3, 72, 1), (10, 0, 74, 3), (11, 1, 72, 1), (11, 2, 71, 2)], lambda f, h: epiano(f, h, 0.32), pan=-0.2)
    return tr.master([(rain(tr.length, tr.rng), 0.1), (vinyl(tr.length, tr.rng, 0.012), 0.0)], lowpass=7500)


def little_walk():
    tr = Track(bpm=90, bars=16, seed=37)
    prog = [([48, 52, 55, 59], 36), ([52, 55, 59, 62], 40), ([53, 57, 60, 64], 41), ([55, 59, 62, 64], 43)]
    order = [0, 2, 1, 3]
    for bar in range(16):
        notes, root = prog[bar % 4]
        arp = [notes[i] + 12 * (i // len(notes)) for i in order + [3, 2, 1, 0]]
        for step, note in enumerate(arp):
            beat = step * 0.5 + (0.06 if step % 2 else 0)
            tr.add(pluck(hz(note), 0.9 * tr.beat, tr.vel(0.34), seed=bar * 8 + step), tr.at(bar, beat), pan=0.3 - (step % 4) * 0.15)
        tr.add(bass(hz(root), 1.8 * tr.beat, tr.vel(0.32)), tr.at(bar, 0))
        tr.add(bass(hz(root + 7), 0.9 * tr.beat, tr.vel(0.24)), tr.at(bar, 3))
        if bar >= 1:
            tr.drums(bar, kicks=(0, 2.5), snares=(1, 3), hats=False, k=0.36, s=0.32)
            for step in range(8):
                tr.add(shaker(tr.rng, tr.vel(0.3 if step % 2 else 0.22)), tr.at(bar, step * 0.5 + (0.06 if step % 2 else 0)), pan=-0.3)
    whistle = lambda f, h: epiano(f, h, 0.36)
    tune = [(0, 0, 76, 1), (0, 1, 79, 1), (0, 2, 76, 2), (1, 0, 74, 1), (1, 1, 76, 1), (1, 2, 79, 2), (2, 0, 81, 1.5), (2, 1.5, 79, 0.5), (2, 2, 77, 2), (3, 0, 76, 1), (3, 1, 74, 3)]
    for start in (4, 12):
        tr.melody([(start + b, beat, n, d) for b, beat, n, d in tune], whistle, pan=0.1)
    return tr.master([(vinyl(tr.length, tr.rng, 0.01), 0.0)], lowpass=10000, wobble_cents=2)


def good_night():
    tr = Track(bpm=62, bars=12, seed=41)
    prog = [[53, 57, 60, 64], [52, 55, 60, 64], [50, 53, 57, 60], [46, 50, 53, 57]]
    roots = [41, 40, 38, 34]
    for bar in range(12):
        notes = prog[bar % 4]
        tr.add(pad(notes, 4 * tr.beat), tr.at(bar, 0), humanize=0)
        tr.add(bass(hz(roots[bar % 4]), 3.5 * tr.beat, 0.3), tr.at(bar, 0), humanize=0)
        tones = [n + 12 for n in notes] + [notes[2] + 24]
        if bar >= 2:
            for step in range(6):
                note = tones[[0, 1, 2, 4, 2, 1][step]]
                tr.add(music_box(hz(note), tr.vel(0.22, 0.2)), tr.at(bar, step * 2 / 3), pan=0.35 * np.sin(step))
    tr.melody([(4, 0, 84, 2), (4, 2, 81, 2), (5, 0, 79, 4), (8, 0, 84, 2), (8, 2, 86, 2), (9, 0, 84, 4)], lambda f, h: music_box(f, 0.3), pan=-0.1)
    return tr.master([(vinyl(tr.length, tr.rng, 0.006), 0.0)], lowpass=8000, wobble_cents=2.5)


def seaside():
    tr = Track(bpm=74, bars=14, seed=53)
    prog = [([50, 54, 57, 61], 38), ([47, 50, 54, 57], 35), ([43, 47, 50, 54], 31), ([45, 49, 52, 54], 33)]
    for bar in range(14):
        notes, root = prog[bar % 4]
        tr.chords(bar, notes, [(0, 3.5)], vel=0.26, strum=0.03, spread=0.7)
        for step, i in enumerate([0, 1, 2, 3, 2, 1]):
            tr.add(pluck(hz(notes[i] + 12), 0.7 * tr.beat, tr.vel(0.22), seed=bar * 6 + step), tr.at(bar, step * 2 / 3), pan=0.4)
        tr.add(bass(hz(root), 3.2 * tr.beat, tr.vel(0.4)), tr.at(bar, 0))
        if 2 <= bar < 13:
            tr.add(kick(tr.vel(0.4)), tr.at(bar, 0))
            tr.add(kick(tr.vel(0.3)), tr.at(bar, 2.5))
            tr.add(rim(tr.rng, tr.vel(0.22)), tr.at(bar, 3))
    tr.melody([(4, 0, 78, 2), (4, 2, 76, 1), (4, 3, 74, 1), (5, 0, 73, 3), (6, 0, 74, 1), (6, 1, 76, 1), (6, 2, 78, 2), (7, 0, 81, 3)], lambda f, h: epiano(f, h, 0.32), pan=-0.15)
    tr.melody([(10, 0, 81, 2), (10, 2, 78, 2), (11, 0, 76, 1.5), (11, 1.5, 74, 2.5)], lambda f, h: epiano(f, h, 0.3), pan=-0.15)
    return tr.master([(waves(tr.length, tr.rng), 0.0), (vinyl(tr.length, tr.rng, 0.008), 0.0)], lowpass=8500)


def morning_piano():
    tr = Track(bpm=72, bars=16, seed=61)
    arps = {
        0: [48, 55, 64, 55, 60, 55, 64, 55],
        1: [47, 55, 62, 55, 59, 55, 62, 55],
        2: [45, 52, 60, 52, 57, 52, 60, 52],
        3: [41, 48, 57, 48, 53, 48, 57, 48],
    }
    for bar in range(16):
        for step, note in enumerate(arps[bar % 4]):
            tr.add(piano(hz(note), 0.9 * tr.beat, tr.vel(0.3 if step % 2 else 0.36, 0.1)), tr.at(bar, step * 0.5), pan=-0.15)
    a = [(0, 0, 76, 1.5), (0, 1.5, 74, 0.5), (0, 2, 72, 1), (0, 3, 74, 1), (1, 0, 74, 2), (1, 2, 71, 1), (1, 3, 67, 1),
         (2, 0, 72, 1.5), (2, 1.5, 76, 0.5), (2, 2, 81, 2), (3, 0, 79, 1), (3, 1, 77, 1), (3, 2, 76, 2)]
    b = [(0, 0, 79, 1), (0, 1, 76, 1), (0, 2, 79, 1), (0, 3, 84, 1), (1, 0, 83, 2), (1, 2, 79, 2),
         (2, 0, 81, 1), (2, 1, 84, 1), (2, 2, 76, 2), (3, 0, 77, 1.5), (3, 1.5, 76, 0.5), (3, 2, 72, 2)]
    voice = lambda f, h: piano(f, h, 0.52)
    for start, phrase in ((4, a), (8, b), (12, a)):
        tr.melody([(start + bar, beat, n, d) for bar, beat, n, d in phrase], voice, pan=0.12)
    return tr.master([(vinyl(tr.length, tr.rng, 0.006), 0.0)], lowpass=11000, wobble_cents=1.0, reverb=0.32)


def sunny_day():
    tr = Track(bpm=108, bars=20, seed=71)
    uke = {0: [67, 60, 64, 72], 1: [69, 60, 64, 69], 2: [69, 60, 65, 69], 3: [67, 62, 67, 71]}
    roots = {0: 36, 1: 33, 2: 41, 3: 43}
    strum = [(0, 1.0, 1), (1, 0.7, 1), (1.5, 0.55, -1), (2.5, 0.55, -1), (3, 0.75, 1), (3.5, 0.55, -1)]
    for bar in range(20):
        chord, root = uke[bar % 4], roots[bar % 4]
        for beat, level, direction in strum:
            notes = chord if direction > 0 else chord[::-1]
            for j, note in enumerate(notes):
                tr.add(pluck(hz(note), 0.45 * tr.beat, tr.vel(0.3 * level), seed=bar * 40 + int(beat * 8) + j), tr.at(bar, beat) + j * 0.009, pan=0.25)
        for beat, note, length in ((0, root, 0.45), (1, root + 7, 0.4), (2, root + 12, 0.45), (2.5, root + 7, 0.3), (3, root + 4 if bar % 4 != 1 else root + 3, 0.4)):
            tr.add(bass(hz(note), length * tr.beat, tr.vel(0.3)), tr.at(bar, beat))
        if bar >= 4:
            tr.add(kick(tr.vel(0.32)), tr.at(bar, 0))
            tr.add(kick(tr.vel(0.26)), tr.at(bar, 2))
            for beat in (1, 3):
                tr.add(clap(tr.rng, tr.vel(0.3)), tr.at(bar, beat), pan=-0.05)
            for step in range(8):
                tr.add(shaker(tr.rng, tr.vel(0.26 if step % 2 else 0.18)), tr.at(bar, step * 0.5), pan=-0.35)
    tune = [(0, 0, 72, 0.5), (0, 0.5, 76, 0.5), (0, 1, 79, 1), (0, 2, 76, 0.5), (0, 2.5, 79, 0.5), (0, 3, 81, 1),
            (1, 0, 79, 1.5), (1, 1.5, 76, 0.5), (1, 2, 72, 2),
            (2, 0, 77, 0.5), (2, 0.5, 76, 0.5), (2, 1, 77, 1), (2, 2, 81, 1), (2, 3, 79, 1),
            (3, 0, 79, 1), (3, 1, 74, 1), (3, 2, 71, 1), (3, 3, 74, 1)]
    for start in (4, 12):
        tr.melody([(start + bar, beat, n + 12, d) for bar, beat, n, d in tune], lambda f, h: glock(f, 0.3), pan=0.15)
    return tr.master([], lowpass=12000, wobble_cents=0.8, reverb=0.12)


def cafe_corner():
    tr = Track(bpm=100, bars=16, seed=83)
    swing = 2 / 3
    chords = [([58, 62, 65, 69], 43, "m"), ([58, 64, 69, 74], 36, "7"), ([57, 64, 67, 72], 41, "M"), ([60, 66, 71], 38, "7")]
    for bar in range(16):
        notes, root, kind = chords[bar % 4]
        nxt = chords[(bar + 1) % 4][1]
        for beat, length in ((0, 0.9), (1 + swing, 0.6)) if bar % 2 == 0 else ((0.0 + swing, 0.6), (2, 1.2)):
            for j, note in enumerate(notes):
                tr.add(epiano(hz(note), length * tr.beat, tr.vel(0.24)), tr.at(bar, beat) + j * 0.008, pan=-0.2 + j * 0.12)
        third = 3 if kind == "m" else 4
        walk = [root, root + third, root + 7, nxt + (1 if (bar % 2) else -1)]
        for beat, note in enumerate(walk):
            tr.add(upright(hz(note), 0.85 * tr.beat, tr.vel(0.36)), tr.at(bar, beat), pan=0.05)
        if bar >= 2:
            for beat in (0, 2):
                tr.add(brush(tr.rng, tr.vel(0.16), swirl=True), tr.at(bar, beat), pan=-0.2)
            for beat in (1, 3):
                tr.add(brush(tr.rng, tr.vel(0.22)), tr.at(bar, beat), pan=-0.2)
            for beat in (0, 1, 1 + swing, 2, 3, 3 + swing):
                tr.add(ride(tr.rng, tr.vel(0.1 if beat % 1 else 0.13)), tr.at(bar, beat), pan=0.35)
    line = [(0, 0, 74, 1), (0, 1, 77, 0.66), (0, 1.66, 81, 0.34), (0, 2, 79, 2),
            (1, 0, 76, 1), (1, 1, 74, 0.66), (1, 1.66, 72, 0.34), (1, 2, 70, 2),
            (2, 0, 69, 1.5), (2, 1.66, 72, 0.34), (2, 2, 76, 2),
            (3, 0, 78, 1), (3, 1, 77, 0.66), (3, 1.66, 74, 0.34), (3, 2, 72, 2)]
    for start in (4, 12):
        tr.melody([(start + bar, beat, n, d) for bar, beat, n, d in line], lambda f, h: piano(f, h, 0.45), pan=0.2)
    return tr.master([(cafe(tr.length, tr.rng), 0.15), (vinyl(tr.length, tr.rng, 0.01), 0.0)], lowpass=9500, wobble_cents=1.5, reverb=0.18)


PIECES = [
    ('afternoon-coffee', afternoon_coffee, 78),
    ('rainy-window', rainy_window, 70),
    ('little-walk', little_walk, 90),
    ('good-night', good_night, 62),
    ('seaside', seaside, 74),
    ('morning-piano', morning_piano, 72),
    ('sunny-day', sunny_day, 108),
    ('cafe-corner', cafe_corner, 100),
]


def encode(mix, target):
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / 'in.wav'
        with wave.open(str(wav), 'wb') as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-codec:a', 'libmp3lame', '-b:a', '96k', '-map_metadata', '-1', str(target)], check=True)


def main(only=()):
    OUT.mkdir(parents=True, exist_ok=True)
    report = {}
    for name, compose, bpm in PIECES:
        if only and name not in only:
            continue
        mix = compose()
        target = OUT / f'LD-music-{name}.mp3'
        encode(mix, target)
        report[name] = {'seconds': round(mix.shape[1] / SR, 1), 'bpm': bpm, 'kb': target.stat().st_size // 1024}
        print(name, report[name])
    return report


if __name__ == '__main__':
    import sys
    print(json.dumps(main(sys.argv[1:]), indent=1))
