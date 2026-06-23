import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import UTMScene from './UTMScene.jsx';
import StressStrainPanel from './StressStrainPanel.jsx';
import MaterialResultCard from './MaterialResultCard.jsx';
import MaterialTray, { DND_MIME } from './MaterialTray.jsx';
import ComparisonDrawer from './ComparisonDrawer.jsx';
import LibraryModal from './LibraryModal.jsx';
import { useMaterials } from './useMaterials.js';
import { useUTMSounds } from './useUTMSounds.js';
import { BUILD_TASKS, DEFAULT_BUILD_TASK, listBuildTasks } from './buildTasks.js';
import { rateSuitability } from './suitability.js';
import PredictBar from '../scenekit/PredictBar.jsx';
import './utm.css';

const VERDICTS = [
  { id: 'SUITABLE', label: 'Suitable', color: '#22C55E' },
  { id: 'MARGINAL', label: 'Marginal', color: '#EAB308' },
  { id: 'UNSUITABLE', label: 'Unsuitable', color: '#EF4444' },
];

const LIB_KEY = 'bikebrowser_material_results';

export default function UTMLab({ onMaterialTested } = {}) {
  const { materials, getMaterialById } = useMaterials();
  const sounds = useUTMSounds();

  const [selected, setSelected] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [result, setResult] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [library, setLibrary] = useState([]);
  const [taskId, setTaskId] = useState(DEFAULT_BUILD_TASK.id);
  const [dragActive, setDragActive] = useState(false);
  const [flash, setFlash] = useState(false);
  const [tip, setTip] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const progressRef = useRef({ t: 0, phase: 'idle' });
  const buildTask = BUILD_TASKS[taskId] || DEFAULT_BUILD_TASK;

  // load persisted library once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIB_KEY);
      if (raw) setLibrary(JSON.parse(raw));
    } catch { /* ignore corrupt storage */ }
  }, []);

  const persistLibrary = useCallback((next) => {
    setLibrary(next);
    try { localStorage.setItem(LIB_KEY, JSON.stringify(next)); } catch { /* quota / disabled */ }
  }, []);

  const loadMaterial = useCallback((m) => {
    if (!m) return;
    setSelected(m);
    setTestComplete(false);
    setResult(null);
    setIsRunning(false);
    progressRef.current = { t: 0, phase: 'idle' };
    setTip(false);
    setPredicted(null);
    setRevealed(false);
  }, []);

  const runTest = useCallback(() => {
    if (!selected) { setTip(true); setTimeout(() => setTip(false), 2200); return; }
    setResult(null);
    setTestComplete(false);
    progressRef.current = { t: 0, phase: 'idle' };
    setIsRunning(true);
    sounds.playHum();
  }, [selected, sounds]);

  const handleComplete = useCallback((res) => {
    if (!res) return;
    setResult(res);
    setTestComplete(true);
    setIsRunning(false);
    sounds.stopHum();
    // upsert into persisted library
    const next = [res, ...library.filter((r) => r.id !== res.id)].slice(0, 24);
    persistLibrary(next);
    setRevealed(true);
    // notify any host (e.g. the in-game overlay) that a material was tested
    onMaterialTested?.(res.id);
  }, [library, persistLibrary, sounds, onMaterialTested]);

  const handleFx = useCallback((kind) => {
    if (kind === 'creak') sounds.playCreak();
    else if (kind === 'fracture') {
      sounds.playFracture();
      setFlash(true);
      setTimeout(() => setFlash(false), 260);
    }
  }, [sounds]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTestComplete(false);
    setResult(null);
    progressRef.current = { t: 0, phase: 'idle' };
    setSceneKey((k) => k + 1); // remount the scene for a fresh specimen
    sounds.stopHum();
    setPredicted(null);
    setRevealed(false);
  }, [sounds]);

  const addToComparison = useCallback((res) => {
    const mat = res.material || res;
    setComparison((prev) => (prev.find((x) => x.id === mat.id) || prev.length >= 3 ? prev : [...prev, mat]));
    setDrawerOpen(true);
  }, []);

  const pickFromLibrary = useCallback((r) => {
    setSelected(r.material || getMaterialById(r.id));
    setResult(r);
    setTestComplete(true);
    setIsRunning(false);
    setLibraryOpen(false);
  }, [getMaterialById]);

  // drag-and-drop onto the grips
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const id = e.dataTransfer.getData(DND_MIME) || e.dataTransfer.getData('text/plain');
    const m = getMaterialById(id);
    if (m) loadMaterial(m);
  }, [getMaterialById, loadMaterial]);

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Universal Testing Machine</div>
        <div className="utm-lab__bar-right">
          <label className="utm-lab__task">
            Build task:
            <select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
              {listBuildTasks().map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <button type="button" className="utm-btn utm-btn--ghost" onClick={() => setDrawerOpen(true)}>Compare ({comparison.length})</button>
          <button type="button" className="utm-btn utm-btn--ghost" onClick={() => setLibraryOpen(true)} title="Material library">📚 Library</button>
        </div>
      </header>

      <div className="utm-lab__body">
        <MaterialTray materials={materials} selectedId={selected?.id} onSelect={(id) => loadMaterial(getMaterialById(id))} />

        <div className="utm-lab__stage">
          <div
            className={`utm-canvas-wrap ${dragActive ? 'utm-canvas-wrap--drop' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
          >
            <Canvas key={sceneKey} camera={{ position: [4.8, 3.0, 6.2], fov: 42 }} dpr={[1, 2]}>
              <color attach="background" args={['#e8edf4']} />
              <UTMScene
                material={selected}
                isRunning={isRunning}
                progressRef={progressRef}
                onTestComplete={handleComplete}
                onFx={handleFx}
              />
            </Canvas>
            {dragActive && <div className="utm-drop-hint">Release to load specimen</div>}
            {!selected && !dragActive && <div className="utm-empty-hint">Drag a material sample into the grips</div>}
          </div>

          <div className="utm-lab__controls">
            <button
              type="button"
              className="utm-btn utm-btn--run"
              onClick={runTest}
              disabled={isRunning || !selected || !predicted}
              title={selected && !predicted ? 'Make a prediction first' : ''}
            >
              ▶ Run Test
            </button>
            {testComplete && <button type="button" className="utm-btn utm-btn--ghost" onClick={reset}>↺ Reset</button>}
            {tip && <span className="utm-tip">Drop a material sample into the grips first</span>}
          </div>
        </div>

        <div className="utm-lab__side">
          {selected && (
            <PredictBar
              prompt={`Predict: is ${selected.name} suitable for the ${buildTask.name}?`}
              options={VERDICTS}
              predicted={predicted}
              onPredict={setPredicted}
              revealed={revealed}
              actual={result ? rateSuitability(selected, buildTask).label : null}
              disabled={isRunning}
            />
          )}
          {selected && (
            <StressStrainPanel
              material={selected}
              progressRef={progressRef}
              isRunning={isRunning}
              testComplete={testComplete}
              width={460}
              height={340}
            />
          )}
          {testComplete && result && (
            <MaterialResultCard result={result} buildTask={buildTask} onAddToComparison={addToComparison} />
          )}
        </div>
      </div>

      <ComparisonDrawer
        open={drawerOpen}
        items={comparison}
        onRemove={(id) => setComparison((prev) => prev.filter((m) => m.id !== id))}
        onClear={() => setComparison([])}
        onClose={() => setDrawerOpen(false)}
      />
      <LibraryModal
        open={libraryOpen}
        items={library}
        onPick={pickFromLibrary}
        onClose={() => setLibraryOpen(false)}
        onClear={() => persistLibrary([])}
      />

      {flash && <div className="utm-flash" />}
    </div>
  );
}
