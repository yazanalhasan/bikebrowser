import { useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';
import { runCompatibilityCheck, summarizeCompatibility } from '../compatibility/engine';
import { generateSuggestions } from '../compatibility/suggestions';
import { scoreBuild } from '../compatibility/scoring';

export default function CompatibilityPanel() {
  const project = useProjectStore((state) => state.getActiveProject());

  const computed = useMemo(() => {
    if (!project) {
      return null;
    }

    const results = runCompatibilityCheck(project.items || []);
    const summary = summarizeCompatibility(results);
    const suggestions = generateSuggestions(project.items || [], results);
    const score = scoreBuild(project.items || [], results);

    return {
      results,
      summary,
      suggestions,
      score,
    };
  }, [project]);

  if (!project || !computed) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Compatibility Intelligence</h3>
      <p className="mt-1 text-sm text-slate-600">Project-level compatibility checks and suggested fixes.</p>

      <div className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-white">
        <p className="text-sm font-semibold">Compatibility Score: {computed.score}</p>
      </div>

      <div className="mt-3 space-y-2">
        {computed.summary.errors.map((entry, index) => (
          <p key={`error-${index + 1}`} className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {entry.message}
          </p>
        ))}

        {computed.summary.warnings.map((entry, index) => (
          <p key={`warning-${index + 1}`} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {entry.message}
          </p>
        ))}

        {computed.summary.errors.length === 0 && computed.summary.warnings.length === 0 && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            No critical compatibility conflicts detected.
          </p>
        )}
      </div>

      {computed.suggestions.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-bold text-slate-900">Suggestions</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {computed.suggestions.map((suggestion, index) => (
              <li key={`suggestion-${index + 1}`}>
                {suggestion.message} ({suggestion.targetCategory})
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
