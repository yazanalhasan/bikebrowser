import { useCallback, useRef, useEffect } from 'react';

// Bridge-specific Web Audio: a high cable-snap twang and a low concrete crack.
// Same lazy-on-gesture pattern as useUTMSounds.
export function useBridgeSounds() {
  const ctxRef = useRef(null);
  const ctx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);

  const cableSnap = useCallback(() => {
    const a = ctx(); if (!a) return;
    const osc = a.createOscillator(); const gain = a.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, a.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, a.currentTime + 0.2);
    gain.gain.setValueAtTime(0.35, a.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.26);
    osc.connect(gain).connect(a.destination);
    osc.start(); osc.stop(a.currentTime + 0.28);
  }, [ctx]);

  const concreteCrack = useCallback(() => {
    const a = ctx(); if (!a) return;
    const now = a.currentTime;
    // low thud
    const osc = a.createOscillator(); const g = a.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);
    g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(g).connect(a.destination); osc.start(now); osc.stop(now + 0.22);
    // rubble noise
    const buf = a.createBuffer(1, Math.floor(a.sampleRate * 0.25), a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = a.createBufferSource(); src.buffer = buf;
    const filt = a.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 700;
    const ng = a.createGain(); ng.gain.setValueAtTime(0.3, now); ng.gain.linearRampToValueAtTime(0, now + 0.25);
    src.connect(filt).connect(ng).connect(a.destination); src.start(now);
  }, [ctx]);

  useEffect(() => () => { try { ctxRef.current?.close(); } catch { /* noop */ } ctxRef.current = null; }, []);
  return { cableSnap, concreteCrack };
}
