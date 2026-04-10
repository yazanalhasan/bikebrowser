import { useMemo, useState } from 'react';
import ProjectShoppingPanel from '../components/ProjectShoppingPanel';

const SUGGESTED_MATERIALS = [
  'chain',
  'tube',
  'tire',
  'brake pads',
  'grease',
  'wrench',
  'helmet',
  'wheel',
];

export default function ShoppingPage() {
  const [input, setInput] = useState('');
  const [materials, setMaterials] = useState(['chain', 'tube', 'brake pads']);

  const projectId = useMemo(() => `shop-${materials.join('-') || 'default'}`.toLowerCase(), [materials]);

  const addMaterial = () => {
    const normalized = input.trim().toLowerCase();
    if (!normalized || materials.includes(normalized)) {
      return;
    }
    setMaterials((current) => [...current, normalized]);
    setInput('');
  };

  const removeMaterial = (material) => {
    setMaterials((current) => current.filter((entry) => entry !== material));
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-cyan-50 to-white px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Shop Materials</h1>
          <p className="mt-2 text-slate-600">
            Find kid-safe bike project parts and add them to your project cart.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTED_MATERIALS.map((material) => (
              <button
                key={material}
                onClick={() => {
                  if (!materials.includes(material)) {
                    setMaterials((current) => [...current, material]);
                  }
                }}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                + {material}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addMaterial();
                }
              }}
              placeholder="Add material (example: wheel)"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3"
            />
            <button
              onClick={addMaterial}
              className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              Add Material
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {materials.map((material) => (
              <button
                key={material}
                onClick={() => removeMaterial(material)}
                className="rounded-full bg-slate-900 px-3 py-1.5 text-sm text-white"
              >
                {material} x
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <ProjectShoppingPanel projectId={projectId} materials={materials} />
        </div>
      </div>
    </div>
  );
}
