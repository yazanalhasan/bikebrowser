import { getEvolutionMap, getStandardStory } from '../education/standardsEducation';

export default function StandardStoryPanel({ standardId = 'shimano_linkglide', evolutionId = 'drivetrain' }) {
  const story = getStandardStory(standardId);
  const evolution = getEvolutionMap(evolutionId);

  return (
    <section className="rounded-xl border border-orange-200 bg-orange-50 p-4">
      <h3 className="text-sm font-bold text-slate-900">{story?.title || 'Why This Standard Exists'}</h3>
      {story && <p className="mt-1 text-sm text-orange-950">{story.summary}</p>}
      {story?.reasons?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {story.reasons.map((reason) => (
            <span key={reason} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-900">{reason}</span>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {evolution.map((item, index) => (
          <article key={item.id} className="rounded-lg bg-white p-3">
            <p className="text-xs font-bold text-orange-700">Stage {index + 1}</p>
            <h4 className="mt-1 text-sm font-bold text-slate-900">{item.label}</h4>
            <p className="mt-1 text-xs text-slate-600">{item.tradeoff}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
