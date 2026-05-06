import { buildLearnWhy } from '../education/learnWhyEngine';

export default function LearnWhyPanel({ result }) {
  const concepts = result ? buildLearnWhy(result) : [];

  if (!result) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold text-slate-900">Learn Why</h3>
      <div className="mt-3 grid gap-3">
        {concepts.map((entry) => (
          <article key={entry.concept} className="rounded-lg bg-slate-50 p-3">
            <h4 className="text-sm font-semibold text-slate-900">{entry.title}</h4>
            <p className="mt-1 text-sm text-slate-600">{entry.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
