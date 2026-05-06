import { getMeasurementSteps } from '../education/measurementTutor';

export default function MeasurementRequiredCard({ measurement = 'seatpostDiameter', title = 'Measurement Needed' }) {
  const steps = getMeasurementSteps(measurement);

  return (
    <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-sm font-bold text-amber-950">{title}</h3>
      <div className="mt-3 grid gap-4 lg:grid-cols-[220px_1fr]">
        <svg viewBox="0 0 220 180" className="h-44 w-full rounded-lg bg-white" role="img" aria-label="Interactive mechanic measurement diagram">
          <defs>
            <style>{`
              .caliper-slide { animation: caliperSlide 1.8s ease-in-out infinite; }
              @keyframes caliperSlide {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(16px); }
              }
            `}</style>
          </defs>
          <rect x="92" y="26" width="38" height="126" rx="16" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />
          <line x1="78" y1="38" x2="78" y2="150" stroke="#92400e" strokeWidth="6" />
          <line className="caliper-slide" x1="144" y1="38" x2="144" y2="150" stroke="#92400e" strokeWidth="6" />
          <line x1="78" y1="90" x2="144" y2="90" stroke="#f59e0b" strokeWidth="3" strokeDasharray="5 5" />
          <text x="111" y="82" textAnchor="middle" className="fill-amber-900 text-[11px] font-bold">diameter</text>
          <text x="111" y="168" textAnchor="middle" className="fill-slate-700 text-[10px]">Match the exact standard</text>
        </svg>

        <div>
          <ol className="grid gap-2 text-sm text-amber-900">
            {steps.map((step, index) => (
              <li key={step} className="rounded-lg bg-white px-3 py-2">
                <span className="font-bold">{index + 1}.</span> {step}
              </li>
            ))}
          </ol>
          <div className="mt-3 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-amber-900">
            Why it matters: a wrong size can slip, bind, or damage the frame. This card is ready for future camera-assisted measurement hooks.
          </div>
        </div>
      </div>
    </article>
  );
}
