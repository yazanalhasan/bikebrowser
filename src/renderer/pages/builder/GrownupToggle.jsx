/**
 * Grown-up details toggle.
 * Kid view is the default. This is the only place that flips the view,
 * so a PIN can wrap this component later without touching the rest of the page.
 * Phase 1 does not persist the toggle: a refresh returns to the kid view.
 */
export default function GrownupToggle({ on, onChange }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`min-h-11 rounded-xl px-4 py-2 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 ${
        on ? 'bg-slate-900 text-white' : 'border border-slate-400 bg-white text-slate-900'
      }`}
    >
      {on ? 'Grown-up details on' : 'Grown-up details'}
    </button>
  );
}
