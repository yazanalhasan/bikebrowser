import { diagnoseRideSymptom } from '../diagnostics/interactiveDiagnostics';

export default function InteractiveDiagnosticsPanel({ symptom = 'My bike skips gears under load', answers = {} }) {
  const diagnosis = diagnoseRideSymptom(symptom, answers);

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50 p-4">
      <h3 className="text-sm font-bold text-slate-900">Interactive Diagnostics</h3>
      <p className="mt-1 text-sm text-violet-900">{symptom}</p>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Mechanic Questions</h4>
          <ul className="mt-2 grid gap-2 text-sm text-slate-700">
            {diagnosis.questions.map((question) => <li key={question.id}>{question.prompt}</li>)}
          </ul>
        </div>
        <div className="rounded-lg bg-white p-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Likely Causes</h4>
          <ol className="mt-2 grid gap-2 text-sm text-slate-700">
            {diagnosis.likelyCauses.slice(0, 3).map((cause) => (
              <li key={cause.id} className="rounded-md bg-slate-50 px-2 py-1">
                <span className="font-bold">{cause.id.replace(/-/g, ' ')}</span>
                {cause.evidence[0] && <p className="text-xs text-slate-500">{cause.evidence[0]}</p>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
