import { useCallback, useEffect, useRef } from 'react';

// Impact bang + metal groan for the crash/load facility.
export function useCrashSounds() {
  const ctxRef = useRef(null);
  const ctx = useCallback(() => {
    if (!ctxRef.current) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctxRef.current = new AC(); }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);

  const impact = useCallback((intensity = 1) => {
    const a = ctx(); if (!a) return;
    const now = a.currentTime;
    // low boom
    const osc = a.createOscillator(); const g = a.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(140, now); osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);
    g.gain.setValueAtTime(0.5 * intensity, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(g).connect(a.destination); osc.start(now); osc.stop(now + 0.38);
    // metal crunch noise
    const buf = a.createBuffer(1, Math.floor(a.sampleRate * 0.3), a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (a.sampleRate * 0.08));
    const src = a.createBufferSource(); src.buffer = buf;
    const filt = a.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 1600; filt.Q.value = 0.6;
    const ng = a.createGain(); ng.gain.value = 0.3 * intensity;
    src.connect(filt).connect(ng).connect(a.destination); src.start(now);
  }, [ctx]);

  const groan = useCallback(() => {
    const a = ctx(); if (!a) return;
    const now = a.currentTime;
    const osc = a.createOscillator(); const g = a.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, now); osc.frequency.linearRampToValueAtTime(120, now + 0.5);
    const filt = a.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 400; filt.Q.value = 4;
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.12, now + 0.1); g.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.connect(filt).connect(g).connect(a.destination); osc.start(now); osc.stop(now + 0.52);
  }, [ctx]);

  useEffect(() => () => { try { ctxRef.current?.close(); } catch { /* noop */ } ctxRef.current = null; }, []);
  return { impact, groan };
}
