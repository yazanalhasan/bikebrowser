/**
 * MaterialLogEntry — structured journal entry for the Notebook panel.
 *
 * Renders one Materials-Lab snapshot: 3-column table (Material / Mass /
 * Density) with inline horizontal density bars, and a 📋 Copy button
 * that puts a tab-separated text version on the clipboard for parents
 * or teachers to paste into a worksheet.
 *
 * No external dependencies — pure inline-style + Tailwind classes +
 * `navigator.clipboard.writeText`.
 *
 * Data shape:
 *   {
 *     kind: 'materialLog',
 *     label: 'Materials Test Lab — 2026-04-26',
 *     rows: Array<{ id, name, massGrams, recordedAt }>,
 *     capturedAt: <ms>
 *   }
 */
import { useState } from 'react';

export default function MaterialLogEntry({ data }) {
  const [copied, setCopied] = useState(false);
  const rows = Array.isArray(data?.rows) ? data.rows : [];

  // Compute densities (uniform 10 cm³ coupons) and find the max for
  // bar-width normalization.
  const enriched = rows.map((r) => ({
    ...r,
    density: (Number.isFinite(r.massGrams) ? r.massGrams : 0) / 10,
  }));
  const maxDensity = enriched.reduce(
    (a, b) => (b.density > a ? b.density : a),
    0.001,
  );

  function handleCopy() {
    const lines = [
      data.label,
      'Material\tMass (g)\tDensity (g/cm³)',
      ...enriched.map(r =>
        `${r.name || r.id}\t${r.massGrams.toFixed(2)}\t${r.density.toFixed(2)}`),
    ];
    const text = lines.join('\n');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => { setCopied(true); setTimeout(() => setCopied(false), 1500); },
        () => { setCopied(false); },
      );
    }
  }

  return (
    <div className="text-xs text-gray-700 py-2 border-b border-gray-200 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <div className="font-bold text-gray-800">{data?.label || 'Materials Lab'}</div>
        <button
          type="button"
          onClick={handleCopy}
          className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
          aria-label="Copy measurements"
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>
      {enriched.length === 0 ? (
        <div className="italic text-gray-500">(no measurements recorded)</div>
      ) : (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left font-normal">Material</th>
              <th className="text-right font-normal">Mass</th>
              <th className="text-left font-normal pl-2">Density</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map((r, i) => {
              const pct = Math.round((r.density / maxDensity) * 100);
              return (
                <tr key={r.id || i}>
                  <td className="py-0.5">{r.name || r.id}</td>
                  <td className="py-0.5 text-right font-mono">{r.massGrams.toFixed(2)} g</td>
                  <td className="py-0.5 pl-2">
                    <div className="flex items-center gap-1">
                      <div
                        className="bg-amber-400 h-2 rounded-sm"
                        style={{ width: `${Math.max(4, pct)}%`, maxWidth: 60 }}
                      />
                      <span className="font-mono text-[10px] text-gray-600">
                        {r.density.toFixed(2)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
