import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import WindTunnel from './WindTunnel.jsx';
import CurvePanel from '../scenekit/CurvePanel.jsx';
import { AIRFOILS } from './airfoils.js';
import { getAeroCoeffs, buildAeroCurves } from './aeroModel.js';
import PredictBar from '../scenekit/PredictBar.jsx';
import { emitGameEvent } from '../scenekit/gameBridge.js';
import '../utm/utm.css';
import './tunnel.css';

const VERDICTS = [
  { id: 'flies', label: 'Flies', color: '#22C55E' },
  { id: 'stalls', label: 'Stalls', color: '#EF4444' },
];

export default function WindTunnelLab() {
  const [airfoil, setAirfoilState] = useState(AIRFOILS[0]);
  const [aoa, setAoaState] = useState(4);
  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [flown, setFlown] = useState(false);

  const coeffs = useMemo(() => getAeroCoeffs(airfoil, aoa), [airfoil, aoa]);
  const curves = useMemo(() => buildAeroCurves(airfoil), [airfoil]);
  const flies = !coeffs.stalled && coeffs.CL > 0.2;

  // changing the setup invalidates a prediction / flight
  const setAirfoil = (a) => { setAirfoilState(a); setPredicted(null); setRevealed(false); setFlown(false); };
  const setAoa = (v) => { setAoaState(v); setPredicted(null); setRevealed(false); setFlown(false); };
  const testFlight = () => { setRevealed(true); setFlown(true); if (flies) emitGameEvent('plane:built', { airfoil: airfoil.id, aoa }); };

  const annotations = [
    { label: `CL ${coeffs.CL}`, x: aoa, y: coeffs.CL, yAxis: 'left', color: '#4ea1ff' },
    { label: `CD ${coeffs.CD}`, x: aoa, y: coeffs.CD, yAxis: 'right', color: '#E8A020' },
  ];
  const zones = [{ xStart: airfoil.aero.stall, xEnd: 20, color: 'rgba(239,68,68,0.14)' }];

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">Wind Tunnel — Airfoil Aerodynamics</div>
      </header>

      <div className="utm-lab__body">
        <div className="utm-tray" role="list" aria-label="Airfoils">
          <div className="utm-tray__title">Airfoils</div>
          {AIRFOILS.map((a) => (
            <div key={a.id} role="listitem" className={`utm-chip ${airfoil.id === a.id ? 'utm-chip--sel' : ''}`}
              style={{ background: '#1b2330', backgroundImage: `linear-gradient(135deg, ${a.color}44, transparent 60%)` }}
              onClick={() => setAirfoil(a)} title={a.name}>
              <span className="utm-chip__name">{a.name}</span>
            </div>
          ))}
        </div>

        <div className="utm-lab__stage">
          <div className="utm-canvas-wrap" style={{ background: '#e8edf4' }}>
            <Canvas camera={{ position: [0, 1, 11], fov: 44 }} dpr={[1, 2]}>
              <color attach="background" args={['#e8edf4']} />
              <WindTunnel airfoil={airfoil} aoa={aoa} />
            </Canvas>
          </div>
          <div className="utm-lab__controls">
            <label className="tn-slider">Angle of Attack: <b>{aoa.toFixed(1)}°</b>
              <input type="range" min="-5" max="20" step="0.5" value={aoa} onChange={(e) => setAoa(Number(e.target.value))} />
            </label>
            {coeffs.stalled && <span className="tn-stall">STALL</span>}
            <button type="button" className="utm-btn utm-btn--run" onClick={testFlight} disabled={!predicted || flown} title={!predicted ? 'Make a prediction first' : ''}>✈ Test Flight</button>
            {flown && <span style={{ fontWeight: 800, color: flies ? '#22C55E' : '#EF4444' }}>{flies ? 'IT FLIES' : 'IT STALLS'}</span>}
          </div>
        </div>

        <div className="utm-lab__side">
          <PredictBar
            prompt={`Predict: will ${airfoil.name} fly at ${aoa.toFixed(1)}°?`}
            options={VERDICTS}
            predicted={predicted}
            onPredict={setPredicted}
            revealed={revealed}
            actual={flown ? (flies ? 'flies' : 'stalls') : null}
          />
          <CurvePanel
            xAxis={{ label: 'Angle of Attack', min: -5, max: 20, unit: '°' }}
            yAxisLeft={{ label: 'Lift Coeff', min: 0, max: 2, unit: 'CL', color: '#4ea1ff' }}
            yAxisRight={{ label: 'Drag Coeff', min: 0, max: 0.5, unit: 'CD', color: '#E8A020' }}
            series={[
              { id: 'cl', label: 'CL', color: '#4ea1ff', points: curves.cl, yAxis: 'left' },
              { id: 'cd', label: 'CD', color: '#E8A020', points: curves.cd, yAxis: 'right' },
            ]}
            zones={zones}
            annotations={annotations}
            complete
            isRunning={false}
            width={460}
            height={300}
          />
          <div className="utm-card utm-card--in" style={{ boxShadow: `0 8px 28px rgba(0,0,0,.45), 0 0 0 1px ${airfoil.color}44` }}>
            <div className="utm-card__header">
              <div><div className="utm-card__name">{airfoil.name}</div><div className="utm-card__cat">Subsonic airfoil</div></div>
              <div className="utm-card__swatch" style={{ background: airfoil.color }} />
            </div>
            <div className="utm-card__grid">
              <div className="utm-card__row"><span className="utm-card__label">Lift Coefficient (CL)</span><span className="utm-card__value">{coeffs.CL}</span></div>
              <div className="utm-card__row"><span className="utm-card__label">Drag Coefficient (CD)</span><span className="utm-card__value">{coeffs.CD}</span></div>
              <div className="utm-card__row"><span className="utm-card__label">Lift/Drag Ratio</span><span className="utm-card__value">{coeffs.LD}</span></div>
              <div className="utm-card__row"><span className="utm-card__label">Stall Angle</span><span className="utm-card__value">{airfoil.aero.stall}°</span></div>
            </div>
            <div className="utm-card__suit">
              <div className="utm-card__rating" style={{ color: coeffs.stalled ? '#EF4444' : '#22C55E' }}>
                {coeffs.stalled ? 'STALLED — flow separated, lift collapsing' : 'Attached flow — efficient lift'}
              </div>
              <p className="utm-card__reason">{coeffs.stalled
                ? `Past the ${airfoil.aero.stall}° stall angle the airflow separates over the top surface; lift drops and drag climbs sharply.`
                : `Lift rises ~linearly with angle of attack until the ${airfoil.aero.stall}° stall. Best L/D is the efficient cruise point.`}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
