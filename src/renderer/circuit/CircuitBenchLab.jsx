import React, { useMemo, useState } from 'react';
import CircuitSchematic from './CircuitSchematic.jsx';
import { SLOT_OPTIONS, DEFAULT_CIRCUIT, findComponent } from './components.js';
import { computeCircuit, circuitInsight } from './circuitModel.js';
import PredictBar from '../scenekit/PredictBar.jsx';
import { emitGameEvent } from '../scenekit/gameBridge.js';
import '../utm/utm.css';
import './circuit.css';

const VERDICTS = [
  { id: 'ok', label: 'Works well', color: '#22C55E' },
  { id: 'problem', label: 'Has a problem', color: '#EF4444' },
];

const SLOT_LABEL = { battery: 'Battery', controller: 'Controller', motor: 'Motor', load: 'Road Load' };

function Icon({ icon }) {
  const c = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (icon === 'check') return (<svg {...c}><path d="M20 6 9 17l-5-5" /></svg>);
  if (icon === 'warn') return (<svg {...c}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>);
  return (<svg {...c}><path d="M18 6 6 18M6 6l12 12" /></svg>);
}

export default function CircuitBenchLab() {
  const [sel, setSel] = useState(DEFAULT_CIRCUIT);
  const components = useMemo(() => ({
    battery: findComponent('battery', sel.battery),
    controller: findComponent('controller', sel.controller),
    motor: findComponent('motor', sel.motor),
    load: findComponent('load', sel.load),
  }), [sel]);
  const circuit = useMemo(() => computeCircuit(components), [components]);
  const insight = useMemo(() => circuitInsight(circuit, components.motor), [circuit, components]);

  const [predicted, setPredicted] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [built, setBuilt] = useState(false);

  const choose = (slot, id) => { setSel((p) => ({ ...p, [slot]: id })); setPredicted(null); setRevealed(false); setBuilt(false); };
  const build = () => {
    setRevealed(true); setBuilt(true);
    if (insight.label === 'WELL MATCHED') emitGameEvent('circuit:built', {});
  };
  const actual = built ? (insight.label === 'WELL MATCHED' ? 'ok' : 'problem') : null;

  const meters = [
    { label: 'Voltage', value: `${circuit.V} V`, color: '#22C55E' },
    { label: 'Current', value: `${circuit.I} A`, color: circuit.limited ? '#EAB308' : '#38BDF8' },
    { label: 'Total Resistance', value: `${circuit.Rtotal} Ω`, color: '#cbd5e1' },
    { label: 'Total Power', value: `${circuit.Ptotal} W`, color: '#E8A020' },
    { label: 'Power to Road', value: `${circuit.Puseful} W`, color: '#A855F7' },
    { label: 'Efficiency', value: `${circuit.efficiency} %`, color: '#22C55E' },
  ];

  return (
    <div className="utm-lab">
      <header className="utm-lab__bar">
        <div className="utm-lab__title">E-Bike Circuit Bench</div>
      </header>

      <div className="cir-body">
        {/* component slots */}
        <div className="cir-tray">
          {Object.keys(SLOT_OPTIONS).map((slot) => (
            <div className="cir-slot" key={slot}>
              <div className="utm-tray__title">{SLOT_LABEL[slot]}</div>
              {SLOT_OPTIONS[slot].map((opt) => (
                <div key={opt.id} className={`utm-chip cir-chip ${sel[slot] === opt.id ? 'utm-chip--sel' : ''}`}
                  style={{ background: '#1b2330', backgroundImage: `linear-gradient(135deg, ${opt.color}44, transparent 60%)` }}
                  onClick={() => choose(slot, opt.id)}>
                  <span className="utm-chip__name">{opt.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* schematic */}
        <div className="cir-stage">
          <CircuitSchematic components={components} circuit={circuit} />
        </div>

        {/* meters + insight */}
        <div className="cir-side">
          <div className="cir-meters">
            {meters.map((m) => (
              <div className="cir-meter" key={m.label}>
                <div className="cir-meter__val" style={{ color: m.color }}>{m.value}</div>
                <div className="cir-meter__lbl">{m.label}</div>
              </div>
            ))}
          </div>
          <PredictBar
            prompt="Tune the parts, then predict before you build:"
            options={VERDICTS}
            predicted={predicted}
            onPredict={setPredicted}
            revealed={revealed}
            actual={actual}
            disabled={built}
          />
          {!built && (
            <button type="button" className={`utm-btn utm-btn--run ${!predicted ? 'utm-btn--needs-predict' : ''}`} onClick={build} disabled={!predicted} title={!predicted ? 'Make a prediction first' : ''}>{!predicted ? '⤴ Predict first to build' : '⚡ Build E-Bike'}</button>
          )}
          {built && (
            <>
              <div className="utm-card utm-card--in" style={{ boxShadow: `0 8px 28px rgba(0,0,0,.45), 0 0 0 1px ${components.motor.color}44` }}>
                <div className="utm-card__header">
                  <div><div className="utm-card__name">Powertrain</div><div className="utm-card__cat">{components.battery.name} · {components.motor.name}</div></div>
                </div>
                <div className="utm-card__suit" style={{ borderTop: 'none', paddingTop: 0 }}>
                  <div className="utm-card__rating" style={{ color: insight.color }}><Icon icon={insight.icon} /><span>{insight.label}</span></div>
                  <p className="utm-card__reason">{insight.reason}</p>
                </div>
              </div>
              <button type="button" className="utm-btn utm-btn--ghost" onClick={() => { setBuilt(false); setRevealed(false); setPredicted(null); }}>↺ Tweak &amp; retry</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
