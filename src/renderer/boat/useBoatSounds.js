import { useCallback, useEffect, useRef } from 'react';

// Water rush during the tow + a splash on capsize/launch.
export function useBoatSounds() {
  const ctxRef = useRef(null);
  const rushRef = useRef(null);
  const ctx = useCallback(() => {
    if (!ctxRef.current) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctxRef.current = new AC(); }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);

  const startRush = useCallback((durationMs) => {
    const a = ctx(); if (!a || rushRef.current) return;
    const buf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
    const filt = a.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 600;
    const g = a.createGain(); const now = a.currentTime; const dur = durationMs / 1000;
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.07, now + dur * 0.3); g.gain.linearRampToValueAtTime(0, now + dur);
    src.connect(filt).connect(g).connect(a.destination); src.start(now); src.stop(now + dur + 0.1);
    rushRef.current = src; setTimeout(() => { rushRef.current = null; }, durationMs + 150);
  }, [ctx]);

  const splash = useCallback(() => {
    const a = ctx(); if (!a) return;
    const now = a.currentTime;
    const buf = a.createBuffer(1, Math.floor(a.sampleRate * 0.4), a.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (a.sampleRate * 0.12));
    const src = a.createBufferSource(); src.buffer = buf;
    const filt = a.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 1400; filt.Q.value = 0.5;
    const g = a.createGain(); g.gain.setValueAtTime(0.3, now); g.gain.linearRampToValueAtTime(0, now + 0.4);
    src.connect(filt).connect(g).connect(a.destination); src.start(now);
  }, [ctx]);

  useEffect(() => () => { try { ctxRef.current?.close(); } catch { /* noop */ } ctxRef.current = null; }, []);
  return { startRush, splash };
}
