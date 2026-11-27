import { useEffect, useMemo, useState } from 'react';
import catalogFile from '../../../../data/builder/parts.json';
import rulesFile from '../../../../data/builder/rules.json';
import zuzuBike from '../../../../data/builder/bikes/zuzu-bike.json';
import midDriveKit from '../../../../data/builder/bikes/mid-drive-48.json';
import hubMotorKit from '../../../../data/builder/bikes/hub-motor-48.json';
import eDirtKit from '../../../../data/builder/bikes/e-dirt-light-bee.json';
import { checkBuild, classifyCandidates } from '../../../builder/engine.js';
import { formatGear, gearRange, WHEEL_SIZES } from '../../../builder/gearMath.js';
import { presentFinding } from '../../../builder/present.js';
import { describeActuation, SLOTS } from '../../../builder/standards.js';
import useProjectStore from '../../../store/projectStore';
import GrownupToggle from './GrownupToggle';
import PartPicker from './PartPicker';

const BUILD_KEY = 'bikebrowser_builder_builds_v1';
const PARTS = catalogFile.parts;
const PARTS_BY_ID = new Map(PARTS.map((part) => [part.id, part]));
const DRAFTS = PARTS.filter((part) => part.reviewStatus === 'draft');

const BIKE_TYPES = [
  { id: 'mountain', label: 'Mountain' },
  { id: 'road', label: 'Road' },
  { id: 'gravel', label: 'Gravel' },
  { id: 'ebike', label: 'E-bike' },
  { id: 'conversion-mid', label: 'Mid-drive kit' },
  { id: 'conversion-hub', label: 'Hub-motor kit' },
  { id: 'e-dirt', label: 'E-dirt' },
  { id: 'dirt', label: 'Gas dirt' },
];

const BANNER = {
  incompatible: { title: 'These parts do not fit yet', tone: 'bg-rose-100 text-rose-950 border-rose-300' },
  warnings: { title: 'These can fit, with a fix', tone: 'bg-amber-100 text-amber-950 border-amber-300' },
  cannot_verify: { title: 'We still need a few answers', tone: 'bg-slate-200 text-slate-950 border-slate-400' },
  compatible: { title: 'These parts fit', tone: 'bg-emerald-100 text-emerald-950 border-emerald-300' },
};

function emptyBuild() {
  return { name: 'My bike', bikeType: 'mountain', wheelSize: null, slots: {} };
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(BUILD_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function slotState(build, slotId) {
  const value = build.slots?.[slotId];
  if (value && typeof value === 'object' && value.status === 'owned-unknown') {
    return { kind: 'unknown', label: 'On the bike — model not written down yet' };
  }
  if (typeof value === 'string' && PARTS_BY_ID.has(value)) {
    const part = PARTS_BY_ID.get(value);
    return { kind: 'part', part, label: `${part.brand} ${part.model}` };
  }
  return { kind: 'empty', label: 'Choose a part' };
}

function partBySlot(build, slot) {
  const value = build.slots?.[slot];
  return typeof value === 'string' ? PARTS_BY_ID.get(value) : null;
}

function gearInput(build) {
  const motor = partBySlot(build, 'motor');
  const crank = partBySlot(build, 'crankset') || (motor?.specs?.motorType === 'mid-drive' ? motor : null);
  const cassette = partBySlot(build, 'cassette');
  const chainrings = crank?.specs?.chainrings || [];
  const cogs = cassette?.specs?.cogs || (motor?.specs?.sprocket === 'single' ? [motor.specs.cogTeeth || 16] : []);
  return gearRange({ chainrings, cogs, wheelSize: build.wheelSize });
}

export default function BuilderPage() {
  const [build, setBuild] = useState(emptyBuild);
  const [grownup, setGrownup] = useState(false);
  const [pickerSlot, setPickerSlot] = useState(null);
  const [saved, setSaved] = useState([]);
  const [note, setNote] = useState('');
  const createProject = useProjectStore((state) => state.createProject);
  const addItemToProject = useProjectStore((state) => state.addItemToProject);

  useEffect(() => {
    setSaved(loadSaved());
  }, []);

  const result = useMemo(() => checkBuild(build, catalogFile, rulesFile), [build]);
  const banner = BANNER[result.verdict] || BANNER.cannot_verify;
  const gears = useMemo(() => gearInput(build), [build]);

  const grouped = {
    incompatible: result.findings.filter((finding) => finding.severity === 'incompatible'),
    warning: result.findings.filter((finding) => finding.severity === 'warning'),
    cannot_verify: result.findings.filter((finding) => finding.severity === 'cannot_verify'),
  };

  const pickerParts = useMemo(() => {
    if (!pickerSlot) return [];
    return PARTS.filter((part) => part.category === pickerSlot.category);
  }, [pickerSlot]);

  const groupedParts = useMemo(() => {
    if (!pickerSlot) return { fits: [], cannotCheck: [], blocked: [] };
    return classifyCandidates(pickerSlot.id, build, catalogFile, rulesFile);
  }, [pickerSlot, build]);

  const reasons = useMemo(() => {
    if (!pickerSlot) return {};
    const next = {};
    for (const part of [...groupedParts.cannotCheck, ...groupedParts.blocked]) {
      const trial = checkBuild(
        { ...build, slots: { ...build.slots, [pickerSlot.id]: part.id } },
        catalogFile,
        rulesFile,
      );
      const open = trial.findings.find((finding) => finding.slots.includes(pickerSlot.id) && (finding.severity === 'cannot_verify' || finding.severity === 'incompatible'));
      next[part.id] = open ? (grownup ? open.messageAdult : open.messageKid) : '';
    }
    return next;
  }, [pickerSlot, groupedParts, build, grownup]);

  function choosePart(partId) {
    setBuild((current) => ({ ...current, slots: { ...current.slots, [pickerSlot.id]: partId } }));
    setPickerSlot(null);
    setNote('');
  }

  function clearSlot(slotId) {
    setBuild((current) => {
      const slots = { ...current.slots };
      delete slots[slotId];
      return { ...current, slots };
    });
  }

  function loadBike(bike, noteText) {
    setBuild({
      name: bike.name,
      bikeType: bike.bikeType,
      wheelSize: bike.wheelSize,
      slots: { ...bike.slots },
    });
    setNote(noteText);
  }

  function startFromZuzu() {
    loadBike(zuzuBike, 'Loaded Zuzu’s bike. The rear derailleur model is still blank, so nothing about it can pass yet.');
  }

  function saveBuild() {
    const entry = { ...build, id: `${Date.now()}`, savedAt: new Date().toISOString() };
    const next = [entry, ...saved].slice(0, 12);
    setSaved(next);
    localStorage.setItem(BUILD_KEY, JSON.stringify(next));
    setNote('Saved on this device.');
  }

  function addToProjects() {
    const chosen = Object.values(build.slots)
      .filter((value) => typeof value === 'string')
      .map((id) => PARTS_BY_ID.get(id))
      .filter(Boolean);
    if (chosen.length === 0) {
      setNote('Pick a part first, then add the build to your projects.');
      return;
    }
    createProject(build.name || 'Bike build', 'Saved from the Bike Builder on this device.');
    for (const part of chosen) {
      addItemToProject({
        name: `${part.brand} ${part.model}`,
        category: 'other',
        specs: { builderPartId: part.id, builderCategory: part.category },
        compatibility: [],
      });
    }
    setNote('Added to your projects on this device.');
  }

  const lowLabel = gears.status === 'ok' ? formatGear(gears.low) : '';
  const highLabel = gears.status === 'ok' ? formatGear(gears.high) : '';
  const barMax = gears.status === 'ok' ? Math.max(gears.high.gearInches, 1) : 1;

  return (
    <div className="bg-sky-50 px-4 py-6 text-slate-950 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">Bike Builder</h1>
          <p className="mt-2 text-lg text-slate-800">
            See whether bike parts fit before anyone installs them. If a number is missing, we say so. We never pretend it fits.
          </p>
          <p className="mt-2 text-base font-semibold text-amber-950">
            {DRAFTS.length} parts still need a grown-up to check the numbers.
          </p>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Bike type">
            {BIKE_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                aria-pressed={build.bikeType === type.id}
                onClick={() => setBuild((current) => ({ ...current, bikeType: type.id }))}
                className={`min-h-11 rounded-xl px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                  build.bikeType === type.id ? 'bg-sky-800 text-white' : 'border border-slate-400 bg-white text-slate-900'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={startFromZuzu} className="min-h-11 rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-900">
              Start from Zuzu’s bike
            </button>
            <button type="button" onClick={() => loadBike(midDriveKit, 'Loaded a 48 V mid-drive kit. The motor takes the place of the crank.')} className="min-h-11 rounded-xl border border-slate-400 bg-white px-4 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900">
              Start from a mid-drive
            </button>
            <button type="button" onClick={() => loadBike(hubMotorKit, 'Loaded a 48 V hub-motor kit. The motor is the rear hub, and a torque arm is included.')} className="min-h-11 rounded-xl border border-slate-400 bg-white px-4 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900">
              Start from a hub motor
            </button>
            <button type="button" onClick={() => loadBike(eDirtKit, 'Loaded an e-dirt teaching kit. The numbers are still drafts. A grown-up confirms them before a real bike is built.')} className="min-h-11 rounded-xl border border-slate-400 bg-white px-4 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900">
              Start from an e-dirt bike
            </button>
            <button type="button" onClick={saveBuild} className="min-h-11 rounded-xl border border-slate-400 bg-white px-4 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900">
              Save this build
            </button>
            <button type="button" onClick={addToProjects} className="min-h-11 rounded-xl border border-slate-400 bg-white px-4 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900">
              Add to my projects
            </button>
            <GrownupToggle on={grownup} onChange={setGrownup} />
          </div>
          {note && <p className="mt-3 text-base text-slate-800" role="status">{note}</p>}
        </header>

        <section aria-live="polite" className={`rounded-2xl border p-5 ${banner.tone}`}>
          <h2 className="text-2xl font-bold">{banner.title}</h2>
          <p className="mt-2 text-base font-semibold">
            {grouped.incompatible.length} problems · {grouped.warning.length} warnings · {grouped.cannot_verify.length} can’t check yet
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Parts on this bike">
            <h2 className="px-1 text-xl font-bold">Parts</h2>
            <ul className="mt-2">
              {SLOTS.filter((slot) => !slot.bikes || slot.bikes.includes(build.bikeType)).map((slot) => {
                const state = slotState(build, slot.id);
                return (
                  <li key={slot.id} className="border-t border-slate-100 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPickerSlot(slot)}
                        className="min-h-11 flex-1 rounded-xl px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-slate-900 hover:bg-sky-50"
                      >
                        <span className="block text-sm font-semibold uppercase tracking-wide text-slate-600">{slot.label}</span>
                        <span className="block text-base font-bold text-slate-950">
                          {state.kind === 'empty' ? `Choose a ${slot.label.toLowerCase()}` : state.label}
                        </span>
                        <span className="block text-sm text-slate-700">{slot.kid}</span>
                      </button>
                      {state.kind !== 'empty' && (
                        <button type="button" onClick={() => clearSlot(slot.id)} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-800 underline">
                          Clear
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Gear range">
            <h2 className="text-xl font-bold">Gear range</h2>
            <p className="mt-1 text-sm text-slate-700">Easiest gear to hardest gear, from the chainring, the cassette, and the wheel size.</p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Wheel size">
              {Object.entries(WHEEL_SIZES).map(([id, wheel]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={build.wheelSize === id}
                  onClick={() => setBuild((current) => ({ ...current, wheelSize: id }))}
                  className={`min-h-11 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                    build.wheelSize === id ? 'bg-slate-900 text-white' : 'border border-slate-400 bg-white text-slate-900'
                  }`}
                >
                  {wheel.label}
                </button>
              ))}
            </div>
            {gears.status !== 'ok' ? (
              <p className="mt-4 text-base text-slate-800">{grownup ? gears.messageAdult : gears.messageKid}</p>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Easiest</p>
                  <div className="mt-1 h-4 rounded-full bg-slate-200">
                    <div className="h-4 rounded-full bg-sky-700" style={{ width: `${Math.max(8, (gears.low.gearInches / barMax) * 100)}%` }} />
                  </div>
                  <p className="mt-1 text-base font-bold">{lowLabel}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Hardest</p>
                  <div className="mt-1 h-4 rounded-full bg-slate-200">
                    <div className="h-4 rounded-full bg-indigo-700" style={{ width: '100%' }} />
                  </div>
                  <p className="mt-1 text-base font-bold">{highLabel}</p>
                </div>
                <p className="text-sm text-slate-700">{gears.wheelNote}</p>
              </div>
            )}
            {grownup && build.slots?.rear_derailleur && PARTS_BY_ID.get(build.slots.rear_derailleur) && (
              <p className="mt-4 text-sm text-slate-700">
                {(() => {
                  const family = describeActuation(PARTS_BY_ID.get(build.slots.rear_derailleur).specs.actuationFamily);
                  if (!family?.pullNote) return null;
                  return family.pullNote;
                })()}
              </p>
            )}
          </section>
        </div>

        <FindingGroup title="Problems" items={grouped.incompatible} grownup={grownup} empty="No hard stops." />
        <FindingGroup title="Fixes to try" items={grouped.warning} grownup={grownup} empty="No warnings." />
        <FindingGroup title="Still to check" items={grouped.cannot_verify} grownup={grownup} empty="Nothing left open." />

        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-xl font-bold text-amber-950">Parts still being checked</h2>
          <p className="mt-1 text-base text-amber-950">
            A grown-up still needs to confirm {DRAFTS.length} draft parts. Until then, treat their numbers as unfinished.
          </p>
          {grownup && (
            <ul className="mt-3 max-h-64 overflow-y-auto rounded-xl bg-white p-3 text-sm text-slate-900">
              {DRAFTS.map((part) => (
                <li key={part.id} className="border-b border-slate-100 py-1">
                  <span className="font-semibold">{part.id}</span> — {part.brand} {part.model}
                </li>
              ))}
            </ul>
          )}
        </section>

        {saved.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-xl font-bold">Saved on this device</h2>
            <ul className="mt-2">
              {saved.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => setBuild({ name: entry.name, bikeType: entry.bikeType, wheelSize: entry.wheelSize, slots: entry.slots })}
                    className="min-h-11 w-full rounded-xl px-3 py-2 text-left font-semibold text-slate-900 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {entry.name} · {entry.bikeType}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800">
          <h2 className="text-lg font-bold text-slate-950">Data sources</h2>
          {grownup ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Shimano product specifications and compatibility chart C-731. Facts cited on each rule. The PDF is not copied into this app.</li>
              <li>SRAM support notes for XD/XDR, AXS, hydraulic brakes, capacity, and Full Mount / UDH.</li>
              <li>
                Pedal Brief, road and gravel groupsets 2026, CC BY 4.0.{' '}
                <a className="font-semibold text-sky-900 underline" href="https://pedalbrief.com/data/road-gravel-groupsets-2026" target="_blank" rel="noreferrer noopener">Dataset page</a>
              </li>
              <li>
                Pull ratios from boothinator/derailleur-analysis, MIT.{' '}
                <a className="font-semibold text-sky-900 underline" href="https://github.com/boothinator/derailleur-analysis" target="_blank" rel="noreferrer noopener">Project</a>
              </li>
              <li>
                Adapter model pattern from isaacrowntree/bike-part-planner, MIT.{' '}
                <a className="font-semibold text-sky-900 underline" href="https://github.com/isaacrowntree/bike-part-planner" target="_blank" rel="noreferrer noopener">Project</a>
              </li>
            </ul>
          ) : (
            <p className="mt-2">
              The numbers come from the companies that make the parts, plus a few open notes we are allowed to share. Turn on Grown-up details to see the source list.
            </p>
          )}
        </footer>
      </div>

      {pickerSlot && (
        <PartPicker
          slot={pickerSlot}
          parts={pickerParts}
          fittingIds={groupedParts.fits.map((part) => part.id)}
          cannotCheckIds={groupedParts.cannotCheck.map((part) => part.id)}
          reasons={reasons}
          grownup={grownup}
          onChoose={choosePart}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </div>
  );
}

function FindingGroup({ title, items, grownup, empty }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-bold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-slate-700">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-3">
          {items.map((finding, index) => {
            const view = presentFinding(finding, { grownup });
            return (
              <li key={`${finding.ruleId}-${index}`} className="rounded-xl bg-slate-50 p-3">
                <p className="text-base font-semibold text-slate-950">{view.message}</p>
                {view.fix && <p className="mt-1 text-sm text-slate-800">Try this: {view.fix}</p>}
                {grownup && (
                  <p className="mt-1 text-sm text-slate-700">
                    {view.ruleId}
                    {view.sourceUrl && (
                      <>
                        {' · '}
                        <a href={view.sourceUrl} className="font-semibold text-sky-900 underline" target="_blank" rel="noreferrer noopener">
                          Source
                        </a>
                      </>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
