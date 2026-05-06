import { buildFailurePropagationTree } from '../simulation/failurePropagationTree';

function flattenTree(node, depth = 0, rows = []) {
  rows.push({ ...node, depth });
  (node.children || []).forEach((child) => flattenTree(child, depth + 1, rows));
  return rows;
}

export default function FailurePropagationGraph({ failureType = 'pull-ratio-mismatch' }) {
  const tree = buildFailurePropagationTree(failureType);
  const rows = tree.children.flatMap((child) => flattenTree(child, 1));

  return (
    <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
      <h3 className="text-sm font-bold text-slate-900">Failure Propagation</h3>
      <p className="mt-1 text-sm text-rose-900">{tree.rootCause}: {tree.explanation}</p>
      <div className="mt-4 grid gap-2">
        {rows.map((row, index) => (
          <div
            key={`${row.effect}-${index}`}
            className="relative rounded-lg border border-rose-100 bg-white px-3 py-2 text-sm"
            style={{ marginLeft: `${Math.min(row.depth - 1, 4) * 24}px` }}
          >
            {row.depth > 1 && <span className="absolute -left-5 top-1/2 h-px w-5 bg-rose-300" />}
            <p className="font-bold text-rose-950">{row.effect}</p>
            <p className="mt-1 text-xs text-slate-600">{row.explanation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
