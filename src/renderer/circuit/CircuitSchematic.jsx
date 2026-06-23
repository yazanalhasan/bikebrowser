import React from 'react';

// Inline-SVG e-bike powertrain loop. Current "marching ants" speed ∝ current.
export default function CircuitSchematic({ components, circuit }) {
  const { battery, controller, motor, load } = components;
  const flowDur = Math.max(0.3, Math.min(4, 4 / Math.max(circuit.I, 0.3)));
  const node = (x, y, fill) => <circle cx={x} cy={y} r={5} fill="#0b0f17" stroke={fill} strokeWidth={2} />;

  return (
    <svg viewBox="0 0 640 380" className="cir-svg" preserveAspectRatio="xMidYMid meet">
      {/* wire loop */}
      <path d="M120 90 L520 90 L520 290 L120 290 Z" fill="none" stroke="#475569" strokeWidth={4} />
      {/* animated current */}
      <path d="M120 90 L520 90 L520 290 L120 290 Z" fill="none" stroke={circuit.limited ? '#EAB308' : '#38BDF8'} strokeWidth={2.5}
        strokeDasharray="10 12" className="cir-flow" style={{ animationDuration: `${flowDur}s` }} />

      {/* nodes */}
      {node(120, 90, '#94a3b8')}{node(520, 90, '#94a3b8')}{node(520, 290, '#94a3b8')}{node(120, 290, '#94a3b8')}

      {/* Battery (left wire) */}
      <g transform="translate(120,190)">
        <rect x={-46} y={-34} width={92} height={68} rx={8} fill="#0f1623" stroke={battery.color} strokeWidth={2} />
        <line x1={-14} y1={-16} x2={-14} y2={16} stroke={battery.color} strokeWidth={5} />
        <line x1={6} y1={-9} x2={6} y2={9} stroke={battery.color} strokeWidth={2.5} />
        <text x={0} y={-40} textAnchor="middle" className="cir-name">{battery.name}</text>
        <text x={0} y={50} textAnchor="middle" className="cir-val">{battery.voltage} V · {battery.R} Ω</text>
      </g>

      {/* Controller (top wire) */}
      <g transform="translate(320,90)">
        <rect x={-52} y={-26} width={104} height={52} rx={8} fill="#0f1623" stroke={controller.color} strokeWidth={2} />
        <text x={0} y={4} textAnchor="middle" className="cir-glyph">⚡</text>
        <text x={0} y={-34} textAnchor="middle" className="cir-name">Controller</text>
        <text x={0} y={44} textAnchor="middle" className="cir-val">≤ {controller.currentLimit} A</text>
      </g>

      {/* Motor (right wire) */}
      <g transform="translate(520,190)">
        <circle r={32} fill="#0f1623" stroke={motor.color} strokeWidth={2} />
        <text x={0} y={7} textAnchor="middle" className="cir-glyph" style={{ fill: motor.color }}>M</text>
        <text x={0} y={-42} textAnchor="middle" className="cir-name">{motor.name}</text>
        <text x={0} y={50} textAnchor="middle" className="cir-val">{motor.rated} W · {motor.winding} Ω</text>
      </g>

      {/* Load / road (bottom wire) — resistor zigzag */}
      <g transform="translate(320,290)">
        <rect x={-58} y={-22} width={116} height={44} rx={8} fill="#0f1623" stroke={load.color} strokeWidth={2} />
        <polyline points="-40,0 -30,-12 -18,12 -6,-12 6,12 18,-12 30,12 40,0" fill="none" stroke={load.color} strokeWidth={2.5} />
        <text x={0} y={-30} textAnchor="middle" className="cir-name">{load.name}</text>
        <text x={0} y={40} textAnchor="middle" className="cir-val">{load.R} Ω road load</text>
      </g>

      {/* current direction arrow */}
      <g transform="translate(320,72)">
        <text x={0} y={0} textAnchor="middle" className="cir-flowlabel" fill={circuit.limited ? '#EAB308' : '#38BDF8'}>▶ {circuit.I} A</text>
      </g>
    </svg>
  );
}
