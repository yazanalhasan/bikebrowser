import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import HabitatDiorama3D from './HabitatDiorama3D.jsx';
import ResultCard from '../scenekit/ResultCard.jsx';
import PredictBar from '../scenekit/PredictBar.jsx';
import { emitGameEvent } from '../scenekit/gameBridge.js';
import { useLabSounds } from '../scenekit/useLabSounds.js';
import { DATASETS } from './habitatData.js';
import '../utm/utm.css';
import './habitat.css';

const GROW_MS = 1900;

// Shared OBSERVE → PREDICT → RESULT habitat-fit loop. `dataset` selects the
// ecology (desert wash) or biome (Salt River) placement set.
export default function HabitatLab({ dataset = 'ecology' }) {
  const cfg = DATASETS[dataset] || DATASETS.ecology;
  const placements = cfg.placements;

  const [idx, setIdx] = useState(0);
  const [predicted, setPredicted] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);

  const dioRef = useRef({ grow: 0, thrives: false, decided: false, t: 0 });
  const rafRef = useRef(0);
  const sounds = useLabSounds();

  const place = placements[idx];
  const chosenOption = place?.options.find((o) => o.id === predicted) || null;
  const options = useMemo(() => place ? place.options.map((o) => ({ id: o.id, label: o.label, color: o.vis.color })) : [], [place]);

  const plant = useCallback(() => {
    if (!place || isRunning || !predicted || revealed) return;
    const thrives = predicted === place.correct;
    setIsRunning(true);
    dioRef.current = { grow: 0, thrives, decided: true, t: 0 };
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / GROW_MS, 1);
      dioRef.current.grow = t; dioRef.current.t = t;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        dioRef.current.grow = 1;
        setIsRunning(false); setRevealed(true);
        setResults((r) => [...r, { id: place.id, thrives, predicted }]);
        if (thrives) sounds.ping(); else sounds.buzz();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [place, isRunning, predicted, revealed, sounds]);

  const next = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (idx < placements.length - 1) {
      setIdx((i) => i + 1); setPredicted(null); setRevealed(false);
      dioRef.current = { grow: 0, thrives: false, decided: false, t: 0 };
    } else {
      setFinished(true);
      const good = results.filter((r) => r.thrives).length;
      if (cfg.completeEvent) emitGameEvent(cfg.completeEvent, { results });
      emitGameEvent(cfg.doneEvent, { good, total: placements.length, results });
    }
  }, [idx, placements.length, results, cfg]);

  const good = results.filter((r) => r.thrives).length;
  const rating = useMemo(() => {
    if (good === placements.length) return rate('SUITABLE', `Every site matched on your first pick (${good}/${placements.length}). You read each habitat's conditions and chose what truly fits.`);
    if (good >= Math.ceil(placements.length / 2)) return rate('MARGINAL', `${good}/${placements.length} fits. Some sites fooled you — re-read the conditions vs each option's needs.`);
    return rate('UNSUITABLE', `${good}/${placements.length} fits. Match the species/material traits to the site conditions: salt-shedding for brackish, deep roots for dry, corrosion-proof for salt water.`);
  }, [good, placements.length]);

  // restart for replay
  const restart = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setIdx(0); setPredicted(null); setRevealed(false); setResults([]); setFinished(false);
    dioRef.current = { grow: 0, thrives: false, decided: false, t: 0 };
  }, []);

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">{cfg.title}</div>
        <div className="utm-lab__bar-right"><span className="hb-progress">Site {Math.min(idx + 1, placements.length)} / {placements.length} · {good} fit</span></div>
      </header>

      <div className="utm-lab__body">
        <div className="utm-tray hb-tray" role="group" aria-label="Site">
          <div className="utm-tray__title">{finished ? 'Field Notes' : 'Observe the site'}</div>
          {!finished && place && (
            <>
              <div className="hb-site">{place.site}</div>
              <div className="hb-cond">
                {place.conditions.map((c) => <span key={c} className="hb-chip">{c}</span>)}
              </div>
              {chosenOption && <div className="hb-trait"><b>{chosenOption.label}</b>: {chosenOption.vis.trait}</div>}
            </>
          )}
          {finished && <div className="hb-site">{cfg.summary}</div>}
        </div>

        <div className="utm-lab__stage">
          <div className="utm-canvas-wrap" style={{ background: '#dfeaf0' }}>
            <Canvas shadows camera={{ position: [3, 2, 6], fov: 45 }} dpr={[1, 2]}>
              <color attach="background" args={['#dfeaf0']} />
              <HabitatDiorama3D theme={cfg.theme} option={finished ? null : chosenOption} conditions={finished ? [] : place?.conditions || []} dioRef={dioRef} />
            </Canvas>
            {!finished && !predicted && <div className="utm-empty-hint">Pick the option you think fits, then plant it</div>}
          </div>
          <div className="utm-lab__controls">
            {!finished && !revealed && <button type="button" className="utm-btn utm-btn--run" onClick={plant} disabled={isRunning || !predicted} title={!predicted ? 'Pick an option first' : ''}>▶ Plant it</button>}
            {!finished && revealed && <button type="button" className="utm-btn utm-btn--run" onClick={next}>{idx < placements.length - 1 ? 'Next site ▶' : 'Field notes ▶'}</button>}
            {finished && <button type="button" className="utm-btn utm-btn--run" onClick={restart}>↻ Replay</button>}
          </div>
        </div>

        <div className="utm-lab__side">
          {!finished && place && (
            <PredictBar prompt={place.kind === 'engineering' ? 'Which material survives this site?' : 'Which plant thrives here?'} options={options} predicted={predicted} onPredict={setPredicted} revealed={revealed} actual={place.correct} disabled={isRunning} />
          )}
          {!finished && revealed && place && (
            <div className={`hb-why ${predicted === place.correct ? 'is-good' : 'is-bad'}`}>
              {predicted === place.correct
                ? place.why
                : <><b>{chosenOption?.label} struggles here.</b> {place.wrongWhy[predicted] || ''} <br />Why {place.options.find((o) => o.id === place.correct)?.label} fits: {place.why}</>}
            </div>
          )}
          {finished && <ResultCard name={cfg.title} category="Habitat fit" color={rating.color} rows={results.map((r, i) => ({ label: `Site ${i + 1}`, value: r.thrives ? '✓ thrived' : '✗ struggled' }))} rating={rating} badge={`${good}/${placements.length}`} />}
        </div>
      </div>
    </div>
  );
}

function rate(label, reason) {
  const color = label === 'SUITABLE' ? '#22C55E' : label === 'MARGINAL' ? '#EAB308' : '#EF4444';
  return { label, color, icon: label === 'SUITABLE' ? 'check' : label === 'MARGINAL' ? 'warn' : 'x', reason };
}
