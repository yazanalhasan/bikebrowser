// cellular.js — Chapter 4 biology pillar (arc.md §3 biological spine).
//
// Cellular biology: what living systems are made of at the cell scale. The
// Microscope is the new instrument. The lesson is that to SEE life's building
// blocks you need three things at once — a thin enough sample for light to pass,
// enough magnification to resolve a cell, and a stain for contrast (cells are
// nearly transparent). Get all three right and the same building blocks (cell
// walls, nuclei, organelles) appear across every living thing. Data-driven.

// What you're examining; each sample reveals different structures when resolved.
export const SAMPLE_OPTIONS = [
  { id: 'leaf', name: 'Leaf tissue', structures: ['cell walls', 'nuclei', 'chloroplasts'], alive: true, note: 'Plant cells — walls and green chloroplasts.' },
  { id: 'root', name: 'Root tissue', structures: ['cell walls', 'nuclei'], alive: true, note: 'Plant cells without chloroplasts.' },
  { id: 'soil', name: 'Living soil', structures: ['bacterial cells', 'fungal threads'], alive: true, note: 'Why soil supports life — it is full of microbes.' },
];

// Stain provides contrast; without it the cell is transparent.
export const STAIN_OPTIONS = [
  { id: 'none', name: 'No stain', contrast: false, note: 'Cells are nearly transparent — almost nothing shows.' },
  { id: 'iodine', name: 'Iodine', contrast: true, note: 'Stains starch and cell walls.' },
  { id: 'methylene', name: 'Methylene blue', contrast: true, note: 'Stains nuclei and cell membranes.' },
];

// Magnification must out-resolve a cell (~tens of microns).
export const MAG_OPTIONS = [
  { id: 'low', name: '10× (hand lens)', resolves: false, note: 'Sees tissue, not individual cells.' },
  { id: 'high', name: '400× (objective)', resolves: true, note: 'Resolves individual cells and nuclei.' },
  { id: 'oil', name: '1000× (oil immersion)', resolves: true, note: 'Resolves the smallest cells and bacteria.' },
];

// The light has to pass through — a thick chunk is opaque.
export const PREP_OPTIONS = [
  { id: 'thin', name: 'Thin section', translucent: true, note: 'Light passes — you can see through it.' },
  { id: 'thick', name: 'Thick chunk', translucent: false, note: 'Opaque — no light reaches the eyepiece.' },
];

export const CELL_SLOTS = ['sample', 'stain', 'mag', 'prep'];

export const CELL_CATALOG = {
  sample: SAMPLE_OPTIONS,
  stain: STAIN_OPTIONS,
  mag: MAG_OPTIONS,
  prep: PREP_OPTIONS,
};

export const CELL_CHALLENGE = {
  id: 'microscope_cells',
  title: 'See what living tissue is made of',
  vehicle: 'Car',
  goal: 'Prepare a slide so you can actually SEE cells: a thin section (light passes), enough magnification to resolve a cell, and a stain for contrast.',
  predictPrompt: 'Look down the microscope: will you RESOLVE the cells, see nothing (OPAQUE slide), see only mush (TOO COARSE), or a colourless blur (NO CONTRAST)?',
  predictOptions: ['resolved', 'opaque', 'too_coarse', 'no_contrast'],
  idealSelection: { sample: 'leaf', stain: 'methylene', mag: 'high', prep: 'thin' },
  teaches: 'Life shares building blocks: cell walls, nuclei, organelles. Seeing them needs a thin sample, resolution, and contrast — all three.',
};

export function cellOptionById(slot, id) {
  return (CELL_CATALOG[slot] || []).find((o) => o.id === id) || null;
}

export default { SAMPLE_OPTIONS, STAIN_OPTIONS, MAG_OPTIONS, PREP_OPTIONS, CELL_SLOTS, CELL_CATALOG, CELL_CHALLENGE, cellOptionById };
