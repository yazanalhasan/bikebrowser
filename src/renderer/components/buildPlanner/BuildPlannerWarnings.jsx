export default function BuildPlannerWarnings({ warnings, missingMeasurements }) {
  const safeWarnings = Array.isArray(warnings) ? warnings : [];
  const safeMissingMeasurements = Array.isArray(missingMeasurements) ? missingMeasurements : [];

  if (safeWarnings.length === 0 && safeMissingMeasurements.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h3 className="text-lg font-bold text-amber-900">Warnings and Missing Measurements</h3>

      {safeWarnings.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-semibold text-amber-900">Warnings</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-amber-900">
            {safeWarnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {safeMissingMeasurements.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-semibold text-amber-900">Missing Measurements</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-amber-900">
            {safeMissingMeasurements.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
