import { useCallback, useEffect, useRef } from 'react';

// Generic lab sound cues reused across the biology benches: a process hum, a
// bubbling burst, a success ping and a fail buzz. Web Audio, lazy on gesture.
export function useLabSounds() {
  const ctxRef = useRef(null);
  const ctx = useCallback(() => {
    if (!ctxRef.current) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctxRef.current = new AC(); }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);

  const hum = useCallback((durationMs = 4000, freq = 90) => {
    const a = ctx(); if (!a) return; const now = a.currentTime; const dur = durationMs / 1000;
    const osc = a.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
    const g = a.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.04, now + 0.3); g.gain.linearRampToValueAtTime(0.04, now + dur - 0.3); g.gain.linearRampToValueAtTime(0, now + dur);
    osc.connect(g).connect(a.destination); osc.start(now); osc.stop(now + dur + 0.1);
  }, [ctx]);

  const bubble = useCallback(() => {
    const a = ctx(); if (!a) return; const now = a.currentTime;
    for (let i = 0; i < 6; i++) {
      const t = now + i * 0.08; const osc = a.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + Math.random() * 300, t); osc.frequency.exponentialRampToValueAtTime(600, t + 0.05);
      const g = a.createGain(); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(g).connect(a.destination); osc.start(t); osc.stop(t + 0.1);
    }
  }, [ctx]);

  const ping = useCallback(() => {
    const a = ctx(); if (!a) return; const now = a.currentTime;
    [660, 880, 1100].forEach((f, i) => { const t = now + i * 0.09; const osc = a.createOscillator(); osc.type = 'sine'; osc.frequency.value = f; const g = a.createGain(); g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25); osc.connect(g).connect(a.destination); osc.start(t); osc.stop(t + 0.3); });
  }, [ctx]);

  const buzz = useCallback(() => {
    const a = ctx(); if (!a) return; const now = a.currentTime;
    const osc = a.createOscillator(); osc.type = 'square'; osc.frequency.setValueAtTime(160, now); osc.frequency.linearRampToValueAtTime(90, now + 0.3);
    const g = a.createGain(); g.gain.setValueAtTime(0.16, now); g.gain.linearRampToValueAtTime(0, now + 0.32);
    osc.connect(g).connect(a.destination); osc.start(now); osc.stop(now + 0.34);
  }, [ctx]);

  useEffect(() => () => { try { ctxRef.current?.close(); } catch { /* noop */ } ctxRef.current = null; }, []);
  return { hum, bubble, ping, buzz };
}
