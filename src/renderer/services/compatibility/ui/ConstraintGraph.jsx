import { getAffectedSystems } from '../reasoning/constraintPropagation';

export default function ConstraintGraph({ category = 'rear-derailleur', propagation = null }) {
  const systems = propagation?.affectedNodeIds || getAffectedSystems(category);
  const paths = propagation?.dependencyPaths || systems.map((system) => [category, system]);

  return (
    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900">Constraint Graph</h3>
        {propagation?.issues?.length > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            {propagation.issues.length} cascading checks
          </span>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg bg-white p-3">
        <svg viewBox="0 0 640 180" className="min-h-44 w-full min-w-[620px]" role="img" aria-label="Mechanical dependency graph">
          <defs>
            <marker id="constraint-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#0891b2" />
            </marker>
            <style>{`
              .constraint-pulse { animation: constraintPulse 1.2s ease-in-out infinite; }
              @keyframes constraintPulse {
                0%, 100% { opacity: .72; }
                50% { opacity: 1; }
              }
            `}</style>
          </defs>
          <circle cx="88" cy="90" r="38" fill="#0891b2" />
          <text x="88" y="86" textAnchor="middle" className="fill-white text-[11px] font-bold">{category}</text>
          <text x="88" y="101" textAnchor="middle" className="fill-cyan-50 text-[9px]">changed</text>

          {systems.slice(0, 6).map((system, index) => {
            const x = 250 + (index % 3) * 150;
            const y = index < 3 ? 54 : 128;
            const issue = propagation?.issues?.find((entry) => entry.nodeId === system);
            const fill = issue?.status === 'incompatible' ? '#fecdd3' : issue?.status === 'needs-verification' ? '#fde68a' : '#cffafe';
            const stroke = issue?.status === 'incompatible' ? '#e11d48' : issue?.status === 'needs-verification' ? '#d97706' : '#0891b2';
            return (
              <g key={system} className={issue ? 'constraint-pulse' : ''}>
                <line x1="126" y1="90" x2={x - 44} y2={y} stroke="#0891b2" strokeWidth="3" markerEnd="url(#constraint-arrow)" />
                <rect x={x - 44} y={y - 23} width="88" height="46" rx="10" fill={fill} stroke={stroke} strokeWidth="2" />
                <text x={x} y={y - 2} textAnchor="middle" className="fill-slate-900 text-[10px] font-bold">{system}</text>
                {issue && <text x={x} y={y + 13} textAnchor="middle" className="fill-slate-700 text-[8px]">{issue.status}</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 grid gap-2">
        {paths.slice(0, 4).map((pathEntry) => (
          <p key={pathEntry.join('-')} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-cyan-950">
            {pathEntry.join(' -> ')}
          </p>
        ))}
      </div>
    </div>
  );
}
