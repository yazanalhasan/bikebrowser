import { useCallback, useEffect, useRef } from 'react';

// Web Audio engine sounds: idle hum (per cylinder layout), exhaust rumble, an RPM
// sweep during the run, and a backfire pop near redline. Same lazy-on-gesture
// pattern as useUTMSounds.
export function useEngineSounds(engine) {
  const ctxRef = useRef(null);
  const idleRef = useRef(null); // { osc }
  const rumbleGainRef = useRef(null);

  const ctx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);

  const init = useCallback(() => {
    const audio = ctx();
    if (!audio || idleRef.current) return;
    const sound = engine?.engineSound;
    const idleFreq = sound === 'inline_four' ? 60 : sound === 'parallel_twin' ? 35 : sound === 'single_cylinder' ? 25 : 22;

    const idleOsc = audio.createOscillator();
    idleOsc.type = 'sawtooth';
    idleOsc.frequency.value = idleFreq;
    const idleGain = audio.createGain();
    idleGain.gain.value = 0.04;
    const idleFilter = audio.createBiquadFilter();
    idleFilter.type = 'lowpass';
    idleFilter.frequency.value = 300;
    idleOsc.connect(idleFilter).connect(idleGain).connect(audio.destination);
    idleOsc.start();
    idleRef.current = { osc: idleOsc, gain: idleGain };

    // looping low-passed noise = exhaust rumble (gain ramped during the run)
    const buffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = audio.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const rumbleFilter = audio.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 120;
    const rumbleGain = audio.createGain();
    rumbleGain.gain.value = 0;
    rumbleGainRef.current = rumbleGain;
    noise.connect(rumbleFilter).connect(rumbleGain).connect(audio.destination);
    noise.start();
  }, [ctx, engine]);

  const startTest = useCallback((durationMs) => {
    const audio = ctx();
    if (!audio) return;
    const now = audio.currentTime;
    const dur = durationMs / 1000;

    if (rumbleGainRef.current) {
      const g = rumbleGainRef.current.gain;
      g.setValueAtTime(0, now);
      g.linearRampToValueAtTime(0.06, now + dur * 0.1);
      g.linearRampToValueAtTime(0.06, now + dur * 0.85);
      g.linearRampToValueAtTime(0, now + dur);
    }

    // RPM sweep
    const rpmOsc = audio.createOscillator();
    rpmOsc.type = 'sawtooth';
    const startF = engine.idleRPM / 100;
    const peakF = engine.maxRPM / 100;
    rpmOsc.frequency.setValueAtTime(startF, now);
    rpmOsc.frequency.linearRampToValueAtTime(peakF, now + dur * 0.8);
    rpmOsc.frequency.linearRampToValueAtTime(startF * 1.5, now + dur);
    const rpmGain = audio.createGain();
    rpmGain.gain.setValueAtTime(0, now);
    rpmGain.gain.linearRampToValueAtTime(0.08, now + 0.2);
    rpmGain.gain.linearRampToValueAtTime(0.08, now + dur * 0.8);
    rpmGain.gain.linearRampToValueAtTime(0, now + dur);
    rpmOsc.connect(rpmGain).connect(audio.destination);
    rpmOsc.start(now);
    rpmOsc.stop(now + dur + 0.1);

    // backfire pop near redline
    const popTime = now + dur * 0.82;
    const popBuf = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.05), audio.sampleRate);
    const pop = popBuf.getChannelData(0);
    for (let i = 0; i < pop.length; i++) pop[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audio.sampleRate * 0.01));
    const popSrc = audio.createBufferSource();
    popSrc.buffer = popBuf;
    const popGain = audio.createGain();
    popGain.gain.value = 0.2;
    popSrc.connect(popGain).connect(audio.destination);
    popSrc.start(popTime);
  }, [ctx, engine]);

  const stop = useCallback(() => {
    try { idleRef.current?.osc.stop(); } catch { /* noop */ }
    idleRef.current = null;
    rumbleGainRef.current = null;
    try { ctxRef.current?.close(); } catch { /* noop */ }
    ctxRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { init, startTest, stop };
}
