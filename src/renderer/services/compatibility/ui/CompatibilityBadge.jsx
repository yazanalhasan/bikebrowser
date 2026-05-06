const STYLES = {
  compatible: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'likely-compatible': 'bg-blue-100 text-blue-800 border-blue-200',
  'needs-verification': 'bg-amber-100 text-amber-800 border-amber-200',
  incompatible: 'bg-rose-100 text-rose-800 border-rose-200',
};

const LABELS = {
  compatible: 'Compatible',
  'likely-compatible': 'Likely Compatible',
  'needs-verification': 'Needs Verification',
  incompatible: 'Incompatible',
};

export default function CompatibilityBadge({ status = 'needs-verification', confidence }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${STYLES[status] || STYLES['needs-verification']}`}>
      {LABELS[status] || LABELS['needs-verification']}
      {typeof confidence === 'number' && <span className="font-semibold opacity-75">{Math.round(confidence * 100)}%</span>}
    </span>
  );
}
