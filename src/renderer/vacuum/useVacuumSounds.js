import { useCallback, useEffect, useRef } from 'react';

// Pump whine (vacuum), re-entry roar, alarm on failure.
export function useVacuumSounds() {
  const ctxRef = useRef(null);
  const ctx = useCallback(() => {
    if (!ctxRef.current) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctxRef.current = new AC(); }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);

  const pump = useCallback((durationMs) => {
    const a = ctx(); if (!a) return;
    const now = a.currentTime; const dur = durationMs / 1000;
    const osc = a.createOscillator(); osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now); osc.frequency.linearRampToValueAtTime(220, now + dur);
    const g = a.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.05, now + 0.2); g.gain.linearRampToValueAtTime(0.05, now + dur - 0.2); g.gain.linearRampToValueAtTime(0, now + dur);
    osc.connect(g).connect(a.destination); osc.start(now); osc.stop(now + dur + 0.1);
  }, [ctx]);

  const roar = useCallback((durationMs) => {
    const a = ctx(); if (!a) return;
    const buf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
    const filt = a.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 400;
    const g = a.createGain(); const now = a.currentTime; const dur = durationMs / 1000;
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.09, now + dur * 0.25); g.gain.linearRampToValueAtTime(0.09, now + dur * 0.6); g.gain.linearRampToValueAtTime(0, now + dur);
    src.connect(filt).connect(g).connect(a.destination); src.start(now); src.stop(now + dur + 0.1);
  }, [ctx]);

  const alarm = useCallback(() => {
    const a = ctx(); if (!a) return;
    const now = a.currentTime;
    [0, 0.25].forEach((off) => {
      const osc = a.createOscillator(); osc.type = 'square'; osc.frequency.value = 660;
      const g = a.createGain(); g.gain.setValueAtTime(0.18, now + off); g.gain.linearRampToValueAtTime(0, now + off + 0.18);
      osc.connect(g).connect(a.destination); osc.start(now + off); osc.stop(now + off + 0.2);
    });
  }, [ctx]);

  useEffect(() => () => { try { ctxRef.current?.close(); } catch { /* noop */ } ctxRef.current = null; }, []);
  return { pump, roar, alarm };
}
