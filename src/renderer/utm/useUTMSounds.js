import { useCallback, useEffect, useRef } from 'react';

// Web Audio UTM sound effects (Section 6). No external library. All nodes are
// created lazily on first use (after a user gesture) so autoplay policy is
// satisfied, and the hum oscillator is tracked in a ref for clean teardown.
export function useUTMSounds() {
  const ctxRef = useRef(null);
  const humRef = useRef(null); // { osc, gain }
  const noiseBufferRef = useRef(null);

  const ctx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);

  // Shared 0.5s white-noise buffer for creak/fracture bursts.
  const noiseBuffer = useCallback((audio) => {
    if (noiseBufferRef.current) return noiseBufferRef.current;
    const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.5), audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBufferRef.current = buffer;
    return buffer;
  }, []);

  const playHum = useCallback(() => {
    const audio = ctx();
    if (!audio || humRef.current) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = 60;
    gain.gain.setValueAtTime(0, audio.currentTime);
    gain.gain.linearRampToValueAtTime(0.03, audio.currentTime + 0.5);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    humRef.current = { osc, gain };
  }, [ctx]);

  const stopHum = useCallback(() => {
    const audio = ctxRef.current;
    const hum = humRef.current;
    if (!audio || !hum) return;
    humRef.current = null;
    hum.gain.gain.cancelScheduledValues(audio.currentTime);
    hum.gain.gain.setValueAtTime(hum.gain.gain.value, audio.currentTime);
    hum.gain.gain.linearRampToValueAtTime(0, audio.currentTime + 0.3);
    setTimeout(() => {
      try { hum.osc.stop(); hum.osc.disconnect(); hum.gain.disconnect(); } catch { /* already gone */ }
    }, 320);
  }, []);

  const playCreak = useCallback(() => {
    const audio = ctx();
    if (!audio) return;
    const src = audio.createBufferSource();
    src.buffer = noiseBuffer(audio);
    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;
    const gain = audio.createGain();
    gain.gain.value = 0.15;
    src.connect(filter).connect(gain).connect(audio.destination);
    src.start();
    src.stop(audio.currentTime + 0.5);
  }, [ctx, noiseBuffer]);

  const playFracture = useCallback(() => {
    const audio = ctx();
    if (!audio) return;
    const now = audio.currentTime;
    // 1) sharp click
    const osc = audio.createOscillator();
    const clickGain = audio.createGain();
    osc.type = 'square';
    osc.frequency.value = 200;
    clickGain.gain.setValueAtTime(0.4, now);
    clickGain.gain.linearRampToValueAtTime(0, now + 0.08);
    osc.connect(clickGain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.1);
    // 2) wider noise burst
    const src = audio.createBufferSource();
    src.buffer = noiseBuffer(audio);
    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1100; // centre of 200–2000Hz
    filter.Q.value = 0.7;
    const noiseGain = audio.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.linearRampToValueAtTime(0, now + 0.15);
    src.connect(filter).connect(noiseGain).connect(audio.destination);
    src.start(now);
    src.stop(now + 0.15);
  }, [ctx, noiseBuffer]);

  // Tear down on unmount.
  useEffect(() => () => {
    try { humRef.current?.osc.stop(); } catch { /* noop */ }
    try { ctxRef.current?.close(); } catch { /* noop */ }
    humRef.current = null;
    ctxRef.current = null;
  }, []);

  return { playHum, stopHum, playCreak, playFracture };
}
