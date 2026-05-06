import { createMechanicalGraph } from '../graph/mechanicalGraphEngine';
import { getDefaultBikeProfile } from '../bikeProfiles/profileLoader';

export default function BuildGenomeMap({ bikeProfile = getDefaultBikeProfile(), hotNodeIds = [] }) {
  const graph = createMechanicalGraph(bikeProfile);
  const nodes = Object.values(graph.nodes);
  const hot = new Set(hotNodeIds);

  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <h3 className="text-sm font-bold text-slate-900">Build Genome</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {nodes.map((node) => (
          <article
            key={node.id}
            className={`rounded-lg border p-3 ${
              hot.has(node.id)
                ? 'border-amber-300 bg-amber-50 shadow-[0_0_0_2px_rgba(245,158,11,0.24)]'
                : 'border-emerald-100 bg-white'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{node.type}</p>
            <h4 className="mt-1 text-sm font-semibold text-slate-900">{node.label || node.id}</h4>
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(node.interfaces).slice(0, 4).map(([key, value]) => (
                <span key={key} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  {key}: {value}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
