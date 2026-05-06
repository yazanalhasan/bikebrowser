import { getDefaultBikeProfile } from '../bikeProfiles/profileLoader';
import { buildMechanicThinkingSteps } from '../education/mechanicThinkingMode';

export default function ThinkLikeMechanicPanel({ productSpecs, bikeProfile = getDefaultBikeProfile() }) {
  const steps = buildMechanicThinkingSteps(bikeProfile, productSpecs || {});

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold text-slate-900">Think Like a Mechanic</h3>
      <div className="mt-3 grid gap-2">
        {steps.map((step, index) => (
          <article key={step.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Step {index + 1}</p>
            <h4 className="mt-1 text-sm font-semibold text-slate-900">{step.question}</h4>
            <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
              <p className="rounded-md bg-white px-2 py-1"><span className="font-bold">Observed:</span> {step.observed}</p>
              <p className="rounded-md bg-white px-2 py-1"><span className="font-bold">Expected:</span> {step.expected}</p>
            </div>
            <p className="mt-2 text-xs text-slate-600">{step.principle}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
