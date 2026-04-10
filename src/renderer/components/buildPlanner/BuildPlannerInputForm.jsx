import { getTemplateOptions } from '../../services/buildPlanner/buildTemplates';

const BIKE_TYPES = [
  { value: 'mountain-bike', label: 'Mountain Bike' },
  { value: 'road-bike', label: 'Road Bike' },
  { value: 'bmx', label: 'BMX' },
  { value: 'e-bike', label: 'E-Bike' },
  { value: 'kids-bike', label: 'Kids Bike' },
];

const USE_CASES = [
  { value: 'trail', label: 'Trail Riding' },
  { value: 'commute', label: 'Commuting' },
  { value: 'downhill', label: 'Downhill' },
  { value: 'street-tricks', label: 'Street Tricks' },
  { value: 'neighborhood', label: 'Neighborhood Rides' },
];

const TEMPLATE_OPTIONS = getTemplateOptions();

function NumberInput({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-3 py-2"
      />
    </label>
  );
}

export default function BuildPlannerInputForm({ value, onChange, onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Project Input</h2>
      <p className="mt-1 text-sm text-slate-600">Enter build details to generate an AI checklist and compatibility review.</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Project Template</span>
          <select
            value={value.projectType || 'ebike_conversion'}
            onChange={(event) => onChange({ ...value, projectType: event.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            {TEMPLATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Project Name</span>
          <input
            value={value.projectName}
            onChange={(event) => onChange({ ...value, projectName: event.target.value })}
            placeholder="Example: Weekend Trail Build"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Bike Type</span>
          <select
            value={value.bikeType}
            onChange={(event) => onChange({ ...value, bikeType: event.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            {BIKE_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Intended Use</span>
          <select
            value={value.intendedUse}
            onChange={(event) => onChange({ ...value, intendedUse: event.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            {USE_CASES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <NumberInput
          label="Rider Height (cm)"
          value={value.riderHeightCm}
          onChange={(next) => onChange({ ...value, riderHeightCm: next })}
          placeholder="Example: 150"
        />

        <NumberInput
          label="Frame Size (cm)"
          value={value.frameSizeCm}
          onChange={(next) => onChange({ ...value, frameSizeCm: next })}
          placeholder="Example: 46"
        />

        <NumberInput
          label="Wheel Size (inches)"
          value={value.wheelSizeIn}
          onChange={(next) => onChange({ ...value, wheelSizeIn: next })}
          placeholder="Example: 26"
        />

        <NumberInput
          label="Budget (USD)"
          value={value.budgetUsd}
          onChange={(next) => onChange({ ...value, budgetUsd: next })}
          placeholder="Example: 600"
        />

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Freeform Project Description</span>
          <textarea
            value={value.userDescription || ''}
            onChange={(event) => onChange({ ...value, userDescription: event.target.value })}
            rows={3}
            placeholder="Example: convert small MTB for 5 ft rider, safe trail riding"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Notes</span>
          <textarea
            value={value.notes}
            onChange={(event) => onChange({ ...value, notes: event.target.value })}
            rows={3}
            placeholder="Any constraints, preferred brands, or goals"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
      >
        {loading ? 'Generating Plan...' : 'Generate Build Plan'}
      </button>
    </form>
  );
}
