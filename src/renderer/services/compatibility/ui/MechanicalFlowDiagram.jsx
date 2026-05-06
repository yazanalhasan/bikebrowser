import { MECHANICAL_FLOWS } from '../education/animatedMechanicalFlows';

const FLOW_POINTS = [
  { x: 58, y: 88 },
  { x: 178, y: 88 },
  { x: 298, y: 88 },
  { x: 418, y: 88 },
  { x: 538, y: 88 },
];

export default function MechanicalFlowDiagram({ flow = 'drivetrainIndexing', activeStep = '', comparison = 'linkglide' }) {
  const steps = MECHANICAL_FLOWS[flow] || MECHANICAL_FLOWS.drivetrainIndexing;
  const activeIndex = steps.findIndex((step) => step.toLowerCase().includes(String(activeStep || '').toLowerCase()));
  const highlightIndex = activeIndex >= 0 ? activeIndex : 1;

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900">Mechanical Flow</h3>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-900">
          {comparison === 'hyperglide' ? 'Hyperglide comparison' : 'LINKGLIDE path'}
        </span>
      </div>

      <svg viewBox="0 0 600 150" role="img" aria-label="Animated mechanical dependency flow" className="mt-4 h-40 w-full">
        <defs>
          <marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#4f46e5" />
          </marker>
          <style>{`
            .flow-pulse {
              animation: flowPulse 1.4s ease-in-out infinite;
              transform-origin: center;
            }
            .flow-dash {
              stroke-dasharray: 8 8;
              animation: dashMove 1.6s linear infinite;
            }
            @keyframes flowPulse {
              0%, 100% { opacity: 0.72; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.08); }
            }
            @keyframes dashMove {
              to { stroke-dashoffset: -32; }
            }
          `}</style>
        </defs>

        {FLOW_POINTS.slice(0, steps.length - 1).map((point, index) => {
          const next = FLOW_POINTS[index + 1];
          const active = index <= highlightIndex;
          return (
            <line
              key={`${point.x}-${next.x}`}
              x1={point.x + 34}
              y1={point.y}
              x2={next.x - 34}
              y2={next.y}
              stroke={active ? '#4f46e5' : '#cbd5e1'}
              strokeWidth="4"
              markerEnd="url(#flow-arrow)"
              className={active ? 'flow-dash' : ''}
            />
          );
        })}

        {steps.map((step, index) => {
          const point = FLOW_POINTS[index] || FLOW_POINTS[FLOW_POINTS.length - 1];
          const active = index === highlightIndex;
          return (
            <g key={step} className={active ? 'flow-pulse' : ''}>
              <circle cx={point.x} cy={point.y} r="34" fill={active ? '#c7d2fe' : '#ffffff'} stroke={active ? '#4f46e5' : '#a5b4fc'} strokeWidth="3" />
              <text x={point.x} y={point.y - 4} textAnchor="middle" className="fill-slate-900 text-[10px] font-bold">
                {step.split(' ')[0]}
              </text>
              <text x={point.x} y={point.y + 10} textAnchor="middle" className="fill-slate-600 text-[9px]">
                {step.split(' ').slice(1).join(' ')}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="grid gap-2 sm:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`min-h-16 flex-1 rounded-lg border p-3 text-center text-xs font-bold shadow-sm ${
              index === highlightIndex
                ? 'border-indigo-400 bg-indigo-100 text-indigo-950'
                : 'border-indigo-200 bg-white text-indigo-950'
            }`}>
              {step}
            </div>
            {index < steps.length - 1 && <span className="hidden text-indigo-500 sm:inline">-&gt;</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
