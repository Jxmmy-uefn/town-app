"""Generates the placeholder sound effects in assets/sounds.

Run with: python3 scripts/make-sounds.py
Swap these for real recorded sounds whenever you like; keep the file names.
"""

import math
import random
import struct
import wave
from pathlib import Path

RATE = 22050
OUT = Path(__file__).resolve().parent.parent / "assets" / "sounds"


def tone(freq_start, freq_end, ms, volume=0.5, wave_shape="sine"):
    count = int(RATE * ms / 1000)
    samples = []
    phase = 0.0
    for i in range(count):
        t = i / count
        freq = freq_start + (freq_end - freq_start) * t
        phase += 2 * math.pi * freq / RATE
        value = math.sin(phase) if wave_shape == "sine" else (1.0 if math.sin(phase) >= 0 else -1.0) * 0.6
        # Quick attack, smooth fade so nothing clicks.
        envelope = min(1.0, i / (RATE * 0.004)) * (1 - t) ** 1.5
        samples.append(value * envelope * volume)
    return samples


def noise(ms, volume=0.5, low_pass=0.15):
    count = int(RATE * ms / 1000)
    rng = random.Random(7)
    samples, last = [], 0.0
    for i in range(count):
        last += low_pass * (rng.uniform(-1, 1) - last)
        samples.append(last * volume * 3 * (1 - i / count) ** 2)
    return samples


def mix(*parts):
    length = max(len(p) for p in parts)
    return [sum(p[i] for p in parts if i < len(p)) for i in range(length)]


def write(name, samples):
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in samples))


write("catch", tone(700, 1300, 70, 0.4))
write("golden", tone(880, 880, 70, 0.35) + tone(1175, 1175, 70, 0.35) + tone(1568, 1568, 140, 0.4))
write("combo", tone(1047, 1047, 90, 0.35) + tone(1568, 1568, 160, 0.35))
write("power", tone(400, 1600, 260, 0.35, "square"))
write("rock", mix(tone(140, 60, 160, 0.6), noise(120, 0.5)))
write("life", tone(500, 180, 320, 0.4, "square"))
write("phase", tone(784, 784, 110, 0.35) + tone(988, 988, 110, 0.35) + tone(1319, 1319, 260, 0.4))
write("beep", tone(660, 660, 110, 0.35))
write("go", tone(990, 990, 240, 0.4))
