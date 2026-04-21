"""Generate WAV audio files for the Zuzu bike game."""
import numpy as np
import wave
import os
from math import pi

sr = 44100
out_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'game', 'audio')
music_dir = os.path.join(out_dir, "music")
stinger_dir = os.path.join(out_dir, "stingers")
os.makedirs(music_dir, exist_ok=True)
os.makedirs(stinger_dir, exist_ok=True)

# ---------- Helpers ----------

def midi_to_freq(m):
    return 440.0 * (2 ** ((m - 69) / 12))

def normalize_stereo(x, peak=0.92):
    mx = np.max(np.abs(x))
    if mx < 1e-9:
        return x
    return x * (peak / mx)

def apply_fade(x, fade_in=0.02, fade_out=0.05):
    n = len(x)
    fi = int(sr * fade_in)
    fo = int(sr * fade_out)
    y = x.copy()
    if fi > 0:
        y[:fi] *= np.linspace(0, 1, fi)
    if fo > 0:
        y[-fo:] *= np.linspace(1, 0, fo)
    return y

def stereo(left, right=None):
    if right is None:
        right = left
    return np.column_stack([left, right])

def write_wav(path, audio):
    audio = np.asarray(audio, dtype=np.float32)
    if audio.ndim == 1:
        audio = stereo(audio)
    audio = normalize_stereo(audio)
    pcm = np.int16(np.clip(audio, -1, 1) * 32767)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())

def sine(freq, dur, amp=1.0, phase=0):
    t = np.arange(int(sr * dur)) / sr
    return amp * np.sin(2 * np.pi * freq * t + phase)

def triangle(freq, dur, amp=1.0):
    t = np.arange(int(sr * dur)) / sr
    return amp * (2/np.pi) * np.arcsin(np.sin(2*np.pi*freq*t))

def lowpass(x, cutoff=3000):
    if cutoff >= sr / 2:
        return x
    alpha = np.exp(-2 * np.pi * cutoff / sr)
    y = np.zeros_like(x)
    y[0] = x[0]
    for i in range(1, len(x)):
        y[i] = (1 - alpha) * x[i] + alpha * y[i - 1]
    return y

def highpass(x, cutoff=200):
    if cutoff <= 0:
        return x
    alpha = np.exp(-2 * np.pi * cutoff / sr)
    lp = np.zeros_like(x)
    lp[0] = x[0]
    for i in range(1, len(x)):
        lp[i] = (1 - alpha) * x[i] + alpha * lp[i - 1]
    return x - lp

def adsr(n, a=0.01, d=0.08, s=0.6, r=0.12):
    a_n = max(1, int(a * sr))
    d_n = max(1, int(d * sr))
    r_n = max(1, int(r * sr))
    s_n = max(0, n - a_n - d_n - r_n)
    env = np.concatenate([
        np.linspace(0, 1, a_n, endpoint=False),
        np.linspace(1, s, d_n, endpoint=False),
        np.full(s_n, s),
        np.linspace(s, 0, r_n, endpoint=True),
    ])
    if len(env) < n:
        env = np.pad(env, (0, n - len(env)))
    return env[:n]

def karplus_strong(freq, dur, decay=0.985, amp=1.0, brightness=0.6, seed=0):
    rng = np.random.default_rng(seed)
    n = int(sr * dur)
    N = max(2, int(sr / freq))
    buf = rng.uniform(-1, 1, N).astype(np.float32)
    buf = lowpass(buf, cutoff=1000 + brightness * 5000)
    out = np.zeros(n, dtype=np.float32)
    idx = 0
    for i in range(n):
        out[i] = buf[idx]
        nxt = decay * 0.5 * (buf[idx] + buf[(idx + 1) % N])
        buf[idx] = nxt
        idx = (idx + 1) % N
    env = adsr(n, a=0.002, d=0.06, s=0.75, r=0.18)
    return amp * out * env

def soft_pad(freq, dur, amp=1.0):
    t = np.arange(int(sr * dur)) / sr
    sig = (
        0.6*np.sin(2*np.pi*freq*t) +
        0.3*np.sin(2*np.pi*(freq*2.01)*t + 0.4) +
        0.15*np.sin(2*np.pi*(freq*3.0)*t + 1.1)
    )
    env = adsr(len(t), a=0.4, d=0.5, s=0.8, r=0.6)
    return amp * lowpass(sig * env, cutoff=1800)

def darbuka_hit(dur=0.25, amp=1.0, kind="dum", seed=0):
    n = int(sr * dur)
    t = np.arange(n) / sr
    rng = np.random.default_rng(seed)
    noise = rng.standard_normal(n).astype(np.float32)
    tone = np.zeros(n, dtype=np.float32)
    if kind == "dum":
        tone += np.sin(2*np.pi*90*t) * np.exp(-18*t)
        tone += 0.5*np.sin(2*np.pi*180*t) * np.exp(-24*t)
        noise = lowpass(noise, cutoff=600) * np.exp(-28*t)
        sig = 0.8*tone + 0.25*noise
    elif kind == "tek":
        noise = highpass(noise, cutoff=1800) * np.exp(-50*t)
        tone += np.sin(2*np.pi*700*t) * np.exp(-70*t)
        sig = 0.7*noise + 0.18*tone
    else:  # ka
        noise = highpass(noise, cutoff=1200) * np.exp(-32*t)
        tone += np.sin(2*np.pi*350*t) * np.exp(-40*t)
        sig = 0.55*noise + 0.22*tone
    return amp * sig

def shaker(dur=0.12, amp=1.0, seed=0):
    n = int(sr * dur)
    t = np.arange(n) / sr
    rng = np.random.default_rng(seed)
    noise = rng.standard_normal(n).astype(np.float32)
    sig = highpass(noise, cutoff=5000) * np.exp(-60*t)
    return amp * sig

def simple_reverb(x, delay_s=0.17, decay=0.35, taps=4):
    y = x.copy()
    delay_n = int(delay_s * sr)
    for k in range(1, taps + 1):
        d = delay_n * k
        if d < len(x):
            y[d:] += (decay ** k) * x[:-d]
    return y

def pan(sig, pos=0.0):
    left = np.sqrt((1 - pos) / 2) * sig
    right = np.sqrt((1 + pos) / 2) * sig
    return stereo(left, right)

def mix_timeline(duration):
    return np.zeros((int(sr * duration), 2), dtype=np.float32)

def add_clip(timeline, clip, start):
    i = int(start * sr)
    if clip.ndim == 1:
        clip = stereo(clip)
    end = min(len(timeline), i + len(clip))
    if i < len(timeline):
        timeline[i:end] += clip[:end-i]

# ---------- Composition helpers ----------

bayati = [0, 2, 3, 5, 7, 8, 10]
hijaz = [0, 1, 4, 5, 7, 8, 10]
nahawand = [0, 2, 3, 5, 7, 8, 11]

def arpeggio_track(duration, bpm, root_midi, scale, motif, amp=0.22, pan_pos=-0.2, seed=0):
    beat = 60 / bpm
    timeline = mix_timeline(duration)
    rng = np.random.default_rng(seed)
    for idx, step in enumerate(np.arange(0, duration, beat/2)):
        degree = motif[idx % len(motif)]
        midi = root_midi + scale[degree % len(scale)] + 12 * ((degree // len(scale)) % 2)
        freq = midi_to_freq(midi)
        note_dur = beat * 0.42
        sig = karplus_strong(freq, note_dur, decay=0.988, amp=amp, brightness=0.75, seed=rng.integers(0, 1_000_000))
        sig = simple_reverb(sig, delay_s=0.11, decay=0.24, taps=3)
        add_clip(timeline, pan(sig, pan_pos + 0.12*np.sin(idx*0.37)), step)
    return timeline

def bass_track(duration, bpm, root_midi, progression, amp=0.18):
    beat = 60 / bpm
    timeline = mix_timeline(duration)
    for bar, start in enumerate(np.arange(0, duration, beat*4)):
        prog = progression[bar % len(progression)]
        freq = midi_to_freq(root_midi + prog)
        note = triangle(freq, beat*3.6, amp=amp) * adsr(int(sr*beat*3.6), a=0.01, d=0.2, s=0.55, r=0.2)
        note = lowpass(note, cutoff=220)
        add_clip(timeline, pan(note, 0), start)
    return timeline

def pad_track(duration, bpm, roots, amp=0.12):
    beat = 60 / bpm
    timeline = mix_timeline(duration)
    for bar, start in enumerate(np.arange(0, duration, beat*4)):
        root = roots[bar % len(roots)]
        chord = np.zeros(int(sr*beat*4), dtype=np.float32)
        for interval in [0, 7, 12]:
            chord += soft_pad(midi_to_freq(root + interval), beat*4, amp=amp/3)
        chord = simple_reverb(chord, delay_s=0.21, decay=0.28, taps=3)
        add_clip(timeline, pan(chord, 0.1 if bar % 2 == 0 else -0.1), start)
    return timeline

def percussion_track(duration, bpm, energetic=False, seed=0):
    beat = 60 / bpm
    timeline = mix_timeline(duration)
    rng = np.random.default_rng(seed)
    steps = np.arange(0, duration, beat/2)
    for i, t0 in enumerate(steps):
        half = i % 8
        if half in (0, 4):
            add_clip(timeline, pan(darbuka_hit(0.28, amp=0.32 if energetic else 0.24, kind="dum", seed=rng.integers(0, 1_000_000)), 0), t0)
        if half in (2, 6):
            add_clip(timeline, pan(darbuka_hit(0.18, amp=0.22, kind="tek", seed=rng.integers(0, 1_000_000)), 0.12), t0)
        if half in (1, 3, 5, 7):
            add_clip(timeline, pan(shaker(0.1, amp=0.06 if energetic else 0.045, seed=rng.integers(0,1_000_000)), -0.1 + 0.2*((i%2)*2-1)), t0 + beat*0.08)
        if energetic and half == 7:
            add_clip(timeline, pan(darbuka_hit(0.16, amp=0.12, kind="ka", seed=rng.integers(0,1_000_000)), -0.15), t0 + beat*0.15)
    return timeline

def melody_track(duration, bpm, root_midi, scale, seq, amp=0.17, instrument="nay", seed=0):
    beat = 60 / bpm
    timeline = mix_timeline(duration)
    rng = np.random.default_rng(seed)
    for i, start in enumerate(np.arange(0, duration, beat)):
        degree = seq[i % len(seq)]
        if degree is None:
            continue
        midi = root_midi + scale[degree % len(scale)] + 12 * (degree // len(scale))
        freq = midi_to_freq(midi)
        dur = beat*0.8 if instrument == "nay" else beat*0.55
        t = np.arange(int(sr*dur)) / sr
        if instrument == "nay":
            sig = (
                0.75*np.sin(2*np.pi*freq*t) +
                0.15*np.sin(2*np.pi*(freq*2.01)*t + 0.8)
            )
            noise = highpass(np.random.default_rng(rng.integers(0,1_000_000)).standard_normal(len(t)).astype(np.float32), cutoff=3000)
            sig += 0.03*noise
            env = adsr(len(t), a=0.05, d=0.1, s=0.75, r=0.16)
            sig = lowpass(sig * env, cutoff=2200)
        else:
            sig = (
                0.55*np.sin(2*np.pi*freq*t) +
                0.32*np.sin(2*np.pi*(freq*2)*t + 0.2) +
                0.10*np.sin(2*np.pi*(freq*3)*t + 0.5)
            )
            env = adsr(len(t), a=0.03, d=0.09, s=0.8, r=0.15)
            sig = lowpass(sig * env, cutoff=2600)
        sig = simple_reverb(sig, delay_s=0.19, decay=0.25, taps=4)
        add_clip(timeline, pan(sig * amp, 0.22 if i % 2 == 0 else -0.15), start + beat*0.08)
    return timeline

def make_loop(duration, parts):
    mix = np.zeros((int(sr*duration), 2), dtype=np.float32)
    for p in parts:
        mix += p
    mix = np.tanh(mix * 1.1)
    return normalize_stereo(mix, peak=0.9)

# ---------- Compose tracks ----------

tracks = []

# 1) Garage warm oud
print("Generating garage_warm_oud.wav...")
dur = 16.0
bpm = 92
parts = [
    arpeggio_track(dur, bpm, 62, bayati, motif=[0,2,3,2, 4,3,2,1], amp=0.17, pan_pos=-0.22, seed=1),
    bass_track(dur, bpm, 38, progression=[0, 5, 3, 5], amp=0.14),
    pad_track(dur, bpm, roots=[50, 55, 53, 55], amp=0.09),
    percussion_track(dur, bpm, energetic=False, seed=2),
    melody_track(dur, bpm, 62, bayati, seq=[0,None,2,None,3,None,2,None,4,None,3,None,2,None,1,None], amp=0.11, instrument="nay", seed=3)
]
garage = make_loop(dur, parts)
write_wav(os.path.join(music_dir, "garage_warm_oud.wav"), garage)
tracks.append("garage_warm_oud.wav")

# 2) Neighborhood hybrid ride
print("Generating neighborhood_hybrid_ride.wav...")
dur = 16.0
bpm = 118
parts = [
    arpeggio_track(dur, bpm, 62, nahawand, motif=[0,2,4,2, 3,5,4,2], amp=0.18, pan_pos=-0.18, seed=4),
    bass_track(dur, bpm, 38, progression=[0, 7, 5, 7], amp=0.17),
    pad_track(dur, bpm, roots=[50, 57, 55, 57], amp=0.07),
    percussion_track(dur, bpm, energetic=True, seed=5),
    melody_track(dur, bpm, 62, nahawand, seq=[0,2,3,2,4,5,4,2,3,4,5,4,3,2,1,None], amp=0.11, instrument="strings", seed=6)
]
ride = make_loop(dur, parts)
write_wav(os.path.join(music_dir, "neighborhood_hybrid_ride.wav"), ride)
tracks.append("neighborhood_hybrid_ride.wav")

# 3) Quest focus hybrid
print("Generating quest_focus_hybrid.wav...")
dur = 12.0
bpm = 100
parts = [
    arpeggio_track(dur, bpm, 60, hijaz, motif=[0,1,4,1, 0,1,3,1], amp=0.14, pan_pos=-0.25, seed=7),
    bass_track(dur, bpm, 36, progression=[0, 5, 0], amp=0.11),
    percussion_track(dur, bpm, energetic=False, seed=8),
    melody_track(dur, bpm, 60, hijaz, seq=[0,None,1,None,4,None,3,None,1,None,0,None], amp=0.09, instrument="nay", seed=9)
]
quest = make_loop(dur, parts)
write_wav(os.path.join(music_dir, "quest_focus_hybrid.wav"), quest)
tracks.append("quest_focus_hybrid.wav")

# 4) Reward tarabi stinger
print("Generating reward_tarabi_stinger.wav...")
dur = 2.2
timeline = mix_timeline(dur)
notes = [74, 77, 79, 81, 84]
times = [0.0, 0.16, 0.32, 0.48, 0.65]
for i, (m, t0) in enumerate(zip(notes, times)):
    sig = karplus_strong(midi_to_freq(m), 0.7, decay=0.989, amp=0.18, brightness=0.9, seed=20+i)
    sig = simple_reverb(sig, delay_s=0.12, decay=0.25, taps=3)
    add_clip(timeline, pan(sig, -0.1 + 0.05*i), t0)
chord = np.zeros(int(sr*1.4), dtype=np.float32)
for m in [62, 69, 74]:
    chord += soft_pad(midi_to_freq(m), 1.4, amp=0.08)
add_clip(timeline, pan(chord, 0), 0.55)
add_clip(timeline, pan(darbuka_hit(0.18, amp=0.12, kind="tek", seed=40), 0.2), 0.62)
reward = normalize_stereo(np.tanh(timeline*1.2), peak=0.9)
write_wav(os.path.join(stinger_dir, "reward_tarabi_stinger.wav"), reward)
tracks.append("reward_tarabi_stinger.wav")

# 5) Upgrade unlock hybrid
print("Generating upgrade_unlock_hybrid.wav...")
dur = 2.6
timeline = mix_timeline(dur)
low = triangle(130.81, 0.45, amp=0.10) * adsr(int(sr*0.45), a=0.005, d=0.08, s=0.3, r=0.15)
add_clip(timeline, pan(low, 0), 0.0)
add_clip(timeline, pan(darbuka_hit(0.22, amp=0.18, kind="dum", seed=50), 0), 0.0)
for i, m in enumerate([67, 71, 74, 79]):
    sig = karplus_strong(midi_to_freq(m), 0.55, decay=0.988, amp=0.16, brightness=0.8, seed=60+i)
    add_clip(timeline, pan(sig, -0.15 + 0.1*i), 0.22 + i*0.12)
for i, f in enumerate([880, 1174.66, 1567.98]):
    sig = sine(f, 0.42, amp=0.05) * adsr(int(sr*0.42), a=0.005, d=0.06, s=0.55, r=0.12)
    add_clip(timeline, pan(sig, 0.05*i), 0.88 + i*0.02)
upgrade = normalize_stereo(np.tanh(timeline*1.25), peak=0.9)
write_wav(os.path.join(stinger_dir, "upgrade_unlock_hybrid.wav"), upgrade)
tracks.append("upgrade_unlock_hybrid.wav")

print("\nGenerated files:")
for t in tracks:
    print(f"  - {t}")
print(f"\nOutput directory: {os.path.abspath(out_dir)}")
