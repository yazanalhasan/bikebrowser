// Prepared slides for the cell-microscopy bench (Ch4 biology). Each target
// structure declares whether it needs a stain and the minimum magnification at
// which it resolves — the player learns staining + magnification trade-offs.
export const SLIDES = [
  { id: 'onion_epidermis', name: 'Onion Epidermis', material: 'Allium cepa epidermis', color: '#f5f0e8', stainColor: '#c8a060', shape: 'brick',
    goodStains: ['iodine'], stains: ['none', 'iodine'],
    structures: [
      { id: 'cell_wall', label: 'Cell wall', needsStain: false, minMag: 4 },
      { id: 'cell_membrane', label: 'Cell membrane', needsStain: false, minMag: 10 },
      { id: 'vacuole', label: 'Vacuole', needsStain: false, minMag: 10 },
      { id: 'nucleus', label: 'Nucleus', needsStain: true, minMag: 10 },
    ],
    note: 'Brick-shaped epidermal cells. Iodine stains the nucleus and starch amber.' },
  { id: 'cheek_cells', name: 'Human Cheek Cells', material: 'Buccal mucosa scraping', color: '#f8ece0', stainColor: '#5588cc', shape: 'blob',
    goodStains: ['methylene_blue'], stains: ['none', 'methylene_blue'],
    structures: [
      { id: 'cell_membrane', label: 'Cell membrane', needsStain: false, minMag: 10 },
      { id: 'cytoplasm', label: 'Cytoplasm', needsStain: false, minMag: 10 },
      { id: 'nucleus', label: 'Nucleus', needsStain: true, minMag: 40 },
    ],
    note: 'Flat squamous epithelial cells. Methylene blue stains the nucleus deep blue.' },
  { id: 'leaf_section', name: 'Leaf Cross-Section', material: 'Dicot leaf, transverse', color: '#e7f0e0', stainColor: '#50b050', shape: 'tissue',
    goodStains: ['safranin_fast_green'], stains: ['none', 'safranin_fast_green'],
    structures: [
      { id: 'upper_epidermis', label: 'Upper epidermis', needsStain: false, minMag: 10 },
      { id: 'palisade', label: 'Palisade cells', needsStain: true, minMag: 10 },
      { id: 'chloroplasts', label: 'Chloroplasts', needsStain: false, minMag: 40 },
      { id: 'stomata', label: 'Stomata', needsStain: false, minMag: 40 },
    ],
    note: 'Safranin stains lignified walls red; chloroplasts show as green granules at 40×.' },
  { id: 'desert_cuticle', name: 'Desert Plant Cuticle', material: 'Xerophyte leaf surface', color: '#f0e4d4', stainColor: '#e87020', shape: 'tissue',
    goodStains: ['sudan_iv'], stains: ['none', 'sudan_iv'],
    structures: [
      { id: 'epidermal_cells', label: 'Epidermal cells', needsStain: false, minMag: 10 },
      { id: 'cuticle_layer', label: 'Cuticle layer', needsStain: true, minMag: 10 },
      { id: 'wax_deposits', label: 'Wax deposits', needsStain: true, minMag: 40 },
      { id: 'sunken_stomata', label: 'Sunken stomata', needsStain: false, minMag: 40 },
    ],
    note: 'Sudan IV stains the lipid cuticle and wax orange — an adaptation to arid climates.' },
];

export const MAGS = [4, 10, 40];
export const STAIN_LABEL = { none: 'No stain', iodine: 'Iodine', methylene_blue: 'Methylene blue', safranin_fast_green: 'Safranin/Fast-Green', sudan_iv: 'Sudan IV' };
export const getSlideById = (id) => SLIDES.find((s) => s.id === id) || SLIDES[0];
