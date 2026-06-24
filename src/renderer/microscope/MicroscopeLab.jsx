import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Microscope3D from './Microscope3D.jsx';
import EyepieceView from './EyepieceView.jsx';
import PredictBar from '../scenekit/PredictBar.jsx';
import ResultCard from '../scenekit/ResultCard.jsx';
import { emitGameEvent } from '../scenekit/gameBridge.js';
import { useLabSounds } from '../scenekit/useLabSounds.js';
import { SLIDES, MAGS, STAIN_LABEL, getSlideById } from './slides.js';
import { microscopeResult } from './microscopeModel.js';
import '../utm/utm.css';
import './microscope.css';

const VERDICTS = [
  { id: 'SUITABLE', label: 'Fully resolved', color: '#22C55E' },
  { id: 'MARGINAL', label: 'Partial', color: '#EAB308' },
  { id: 'UNSUITABLE', label: 'Blurred', color: '#EF4444' },
];
const FOCUS_MS = 3200;

export default function MicroscopeLab() {
  const [slide, setSlide] = useState(null);
  const [stain, setStain] = useState('none');
  const [mag, setMag] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const scopeRef = useRef({ focus: 0, mag: 10, stained: false, slideLoaded: false, lampOn: true, focusing: false });
  const rafRef = useRef(0);
  const sounds = useLabSounds();
  const result = useMemo(() => (slide ? microscopeResult(slide, stain, mag) : null), [slide, stain, mag]);

  const sync = useCallback((sl, st, mg) => {
    scopeRef.current.mag = mg; scopeRef.current.stained = !!(st && st !== 'none' && sl?.goodStains.includes(st)); scopeRef.current.slideLoaded = !!sl;
  }, []);

  const pickSlide = useCallback((s) => {
    cancelAnimationFrame(rafRef.current);
    setSlide(s); setStain(s.stains[0]); setMag(10); setComplete(false); setIsRunning(false); setPredicted(null); setRevealed(false);
    scopeRef.current = { focus: 0, mag: 10, stained: false, slideLoaded: true, lampOn: true, focusing: false };
  }, []);
  const pickStain = useCallback((v) => { setStain(v); setComplete(false); setRevealed(false); sync(slide, v, mag); }, [slide, mag, sync]);
  const pickMag = useCallback((v) => { setMag(v); setComplete(false); setRevealed(false); sync(slide, stain, v); }, [slide, stain, sync]);

  const run = useCallback(() => {
    if (!slide || isRunning || !predicted) return;
    setComplete(false); setIsRunning(true); setRevealed(false); sounds.hum(FOCUS_MS, 130);
    sync(slide, stain, mag); scopeRef.current.focus = 0; scopeRef.current.focusing = true;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / FOCUS_MS, 1);
      // ease focus toward 1 (sharp) with a slight overshoot wobble early on
      scopeRef.current.focus = t < 0.7 ? t / 0.7 * 0.9 + Math.sin(t * 18) * 0.05 * (1 - t) : 0.9 + (t - 0.7) / 0.3 * 0.1;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        scopeRef.current.focus = 1; scopeRef.current.focusing = false;
        setIsRunning(false); setComplete(true); setRevealed(true);
        if (result.rating.label === 'UNSUITABLE') sounds.buzz(); else sounds.ping();
        if (result.rating.label === 'SUITABLE') emitGameEvent('cell:built', { slide: slide.id, resolved: result.resolved.map((r) => r.id) });
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [slide, stain, mag, isRunning, predicted, result, sounds, sync]);

  const rows = result ? [
    { label: 'Stain', value: STAIN_LABEL[stain] || stain },
    { label: 'Magnification', value: `${mag}×` },
    { label: 'Resolved', value: `${result.count} / ${result.total}` },
    { label: 'Structures', value: result.resolved.map((r) => r.label).join(', ') || '—' },
  ] : [];

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Microscope — Cell Observation</div>
        <div className="utm-lab__bar-right">
          {slide && (
            <>
              <label className="utm-lab__task">Stain:
                <select value={stain} onChange={(e) => pickStain(e.target.value)}>
                  {slide.stains.map((s) => <option key={s} value={s}>{STAIN_LABEL[s] || s}</option>)}
                </select>
              </label>
              <span className="scope-mag">
                {MAGS.map((m) => <button key={m} type="button" className={`scope-mag__btn ${mag === m ? 'is-on' : ''}`} onClick={() => pickMag(m)}>{m}×</button>)}
              </span>
            </>
          )}
        </div>
      </header>

      <div className="utm-lab__body">
        <div className="utm-tray" role="list" aria-label="Slides">
          <div className="utm-tray__title">Prepared Slides</div>
          {SLIDES.map((s) => (
            <div key={s.id} role="listitem" className={`utm-chip ${slide?.id === s.id ? 'utm-chip--sel' : ''}`}
              style={{ background: '#1b2330', backgroundImage: `linear-gradient(135deg, ${s.stainColor}66, transparent 60%)` }}
              onClick={() => pickSlide(s)} title={s.material}>
              <span className="utm-chip__name">{s.name}</span>
              <span className="utm-chip__sub">{s.material}</span>
            </div>
          ))}
        </div>

        <div className="utm-lab__stage">
          <div className="utm-canvas-wrap scope-split">
            <Canvas camera={{ position: [3, 2, 5], fov: 40 }} dpr={[1, 2]}>
              <color attach="background" args={['#1a1e24']} />
              {slide && <Microscope3D scopeRef={scopeRef} />}
            </Canvas>
            {slide && <div className="scope-eye-wrap"><EyepieceView slide={slide} stain={stain} scopeRef={scopeRef} /><div className="scope-eye-cap">{mag}× eyepiece</div></div>}
            {!slide && <div className="utm-empty-hint">Pick a slide to observe</div>}
          </div>
          <div className="utm-lab__controls">
            <button type="button" className={`utm-btn utm-btn--run ${slide && !predicted ? 'utm-btn--needs-predict' : ''}`} onClick={run} disabled={isRunning || !slide || !predicted} title={slide && !predicted ? 'Make a prediction first' : ''}>{!slide ? '▶ Pick a slide' : !predicted ? '⤴ Predict first to run' : '▶ Focus & Observe'}</button>
          </div>
        </div>

        <div className="utm-lab__side">
          {slide && (
            <PredictBar prompt={`Predict: will ${STAIN_LABEL[stain]} at ${mag}× resolve all of ${slide.name}?`} options={VERDICTS} predicted={predicted} onPredict={setPredicted} revealed={revealed} actual={complete && result ? result.rating.label : null} disabled={isRunning} />
          )}
          {slide && (
            <div className="scope-checklist">
              <div className="scope-checklist__title">Target structures</div>
              {slide.structures.map((st) => {
                const seen = complete && result.resolved.some((r) => r.id === st.id);
                return <div key={st.id} className={`scope-item ${seen ? 'is-seen' : ''}`}><span>{seen ? '✓' : '○'}</span> {st.label}{st.needsStain ? ' (needs stain)' : ''}{st.minMag >= 40 ? ' · 40×' : ''}</div>;
              })}
            </div>
          )}
          {complete && result && <ResultCard name={slide.name} category="Cell observation" color={slide.stainColor} rows={rows} rating={result.rating} badge={`${result.count}/${result.total} structures`} />}
        </div>
      </div>
    </div>
  );
}
