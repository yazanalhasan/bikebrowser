/**
 * Writes data/builder/parts.json and docs/bike-builder/DATA_REVIEW.md.
 * Facts are cited. Anything not copied from a manufacturer table in this
 * session stays reviewStatus draft. No prices and no shop links.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHECKED = '2026-11-27';
const SHIMANO_PDF = 'https://productinfo.shimano.com/pdfs/product/archive/2025-2026_Compatibility_v037_en.pdf';
const C731 = 'https://productinfo.shimano.com/en/compatibility/C-731';
const PEDAL = 'https://pedalbrief.com/data/road-gravel-groupsets-2026';
const SRAM_XD = 'https://support.sram.com/hc/en-us/sections/6129171904667';
const BIKEGREMLIN = 'https://bike.bikegremlin.com/1278/bicycle-rear-derailleur-compatibility/';

const parts = [];

function add(entry) {
  parts.push({
    years: null,
    reviewStatus: 'draft',
    checkedAt: CHECKED,
    quote: '',
    ...entry,
  });
}

const hg8910 = [
  { driver: 'hg-m', fit: 'native' },
  { driver: 'hg-l', fit: 'spacer', spacerMm: 1.85 },
];
const mtb11 = [
  { driver: 'hg-m', fit: 'native' },
  { driver: 'hg-l', fit: 'spacer', spacerMm: 1.85 },
];
const road11 = [{ driver: 'hg-l', fit: 'native' }];
const road11Wide = [
  { driver: 'hg-m', fit: 'native' },
  { driver: 'hg-l', fit: 'spacer', spacerMm: 1.85 },
];
const road12 = [
  { driver: 'hg-l2', fit: 'native' },
  { driver: 'hg-l', fit: 'native' },
];
const micro = [{ driver: 'microspline', fit: 'native' }];
const xd = [
  { driver: 'xd', fit: 'native' },
  { driver: 'xdr', fit: 'spacer', spacerMm: 1.85 },
];
const xdr = [{ driver: 'xdr', fit: 'native' }];
const linkglideFit = [{ driver: 'linkglide', fit: 'native' }];
const campy = [
  { driver: 'campagnolo', fit: 'native' },
  { driver: 'n3w', fit: 'unknown' },
];
const n3w = [{ driver: 'n3w', fit: 'native' }];

function cogSpec(smallest, largest) {
  const range = [];
  if (largest - smallest < 8) {
    range.push(smallest, largest);
  } else {
    range.push(smallest, largest);
  }
  return {
    smallestCog: smallest,
    largestCog: largest,
    cogs: [smallest, largest],
  };
}

add({
  id: 'hub-hg-m-6bolt',
  category: 'hub',
  brand: 'Standard',
  model: 'Rear hub, HG spline M, 6-bolt',
  modelCode: null,
  specs: { freehub: 'hg-m', rotorMount: '6-bolt' },
  sourceUrl: C731,
  sourceRef: 'Shimano C-731: HG spline M is the 10/9/8/7 and MTB 11-speed body, outer length 34.9 mm.',
  quote: 'HG spline M, outer body length 34.9 mm',
});
add({
  id: 'hub-hg-m-centerlock',
  category: 'hub',
  brand: 'Standard',
  model: 'Rear hub, HG spline M, Center Lock',
  modelCode: null,
  specs: { freehub: 'hg-m', rotorMount: 'center-lock' },
  sourceUrl: C731,
  sourceRef: 'Shimano C-731 HG spline M. Center Lock is Shimano\'s rotor spline.',
  quote: 'HG spline M',
});
add({
  id: 'hub-hg-l-centerlock',
  category: 'hub',
  brand: 'Standard',
  model: 'Rear hub, HG spline L, Center Lock',
  modelCode: null,
  specs: { freehub: 'hg-l', rotorMount: 'center-lock' },
  sourceUrl: C731,
  sourceRef: 'Shimano C-731: HG spline L, road 12/11-speed, outer length 36.75 mm.',
  quote: 'HG spline L, outer body length 36.75 mm',
});
add({
  id: 'hub-hg-l2-centerlock',
  category: 'hub',
  brand: 'Standard',
  model: 'Rear hub, HG spline L2, Center Lock',
  modelCode: null,
  specs: { freehub: 'hg-l2', rotorMount: 'center-lock' },
  sourceUrl: C731,
  sourceRef: 'Shimano C-731: HG spline L2, road 12-speed dedicated, outer length 37.65 mm.',
  quote: 'HG spline L2, outer body length 37.65 mm',
});
add({
  id: 'hub-hg-s-6bolt',
  category: 'hub',
  brand: 'Standard',
  model: 'Rear hub, HG spline S, 6-bolt',
  modelCode: null,
  specs: { freehub: 'hg-s', rotorMount: '6-bolt' },
  sourceUrl: C731,
  sourceRef: 'Shimano C-731: HG spline S, 7-speed, outer length 31 mm.',
  quote: 'HG spline S, outer body length 31 mm',
});
add({
  id: 'hub-microspline-centerlock',
  category: 'hub',
  brand: 'Standard',
  model: 'Rear hub, Micro Spline, Center Lock',
  modelCode: null,
  specs: { freehub: 'microspline', rotorMount: 'center-lock' },
  sourceUrl: C731,
  sourceRef: 'Shimano C-731: Micro Spline, 23 spline teeth, outer length 26 mm, MTB 12-speed.',
  quote: 'MICRO SPLINE, 23 effective spline teeth, 26 mm',
});
add({
  id: 'hub-microspline-6bolt',
  category: 'hub',
  brand: 'Standard',
  model: 'Rear hub, Micro Spline, 6-bolt',
  modelCode: null,
  specs: { freehub: 'microspline', rotorMount: '6-bolt' },
  sourceUrl: C731,
  sourceRef: 'Shimano C-731 Micro Spline body with a 6-bolt rotor mount.',
  quote: 'MICRO SPLINE',
});
add({
  id: 'hub-xd-6bolt',
  category: 'hub',
  brand: 'SRAM',
  model: 'XD driver rear hub, 6-bolt',
  modelCode: 'XD',
  specs: { freehub: 'xd', rotorMount: '6-bolt' },
  sourceUrl: SRAM_XD,
  sourceRef: 'SRAM XD driver. Draft: confirm the exact hub model before a real build.',
  quote: 'XD',
});
add({
  id: 'hub-xd-centerlock',
  category: 'hub',
  brand: 'SRAM',
  model: 'XD driver rear hub, Center Lock',
  modelCode: 'XD',
  specs: { freehub: 'xd', rotorMount: 'center-lock' },
  sourceUrl: SRAM_XD,
  sourceRef: 'SRAM XD driver. Draft.',
  quote: 'XD',
});
add({
  id: 'hub-xdr-centerlock',
  category: 'hub',
  brand: 'SRAM',
  model: 'XDR driver rear hub, Center Lock',
  modelCode: 'XDR',
  specs: { freehub: 'xdr', rotorMount: 'center-lock' },
  sourceUrl: SRAM_XD,
  sourceRef: 'SRAM XDR is the longer road driver. An XD cassette needs a 1.85 mm spacer.',
  quote: 'XDR',
});
add({
  id: 'hub-campagnolo-centerlock',
  category: 'hub',
  brand: 'Campagnolo',
  model: 'Campagnolo freehub, Center Lock',
  modelCode: null,
  specs: { freehub: 'campagnolo', rotorMount: 'center-lock' },
  sourceUrl: 'https://www.campagnolo.com/en',
  sourceRef: 'Campagnolo uses its own spline. Draft generic body, not a specific hub model.',
  quote: '',
});
add({
  id: 'hub-n3w-centerlock',
  category: 'hub',
  brand: 'Campagnolo',
  model: 'N3W freehub, Center Lock',
  modelCode: 'N3W',
  specs: { freehub: 'n3w', rotorMount: 'center-lock' },
  sourceUrl: 'https://www.campagnolo.com/en',
  sourceRef: 'Campagnolo N3W. Older Campagnolo cassettes are marked unknown here, not a pass.',
  quote: '',
});
add({
  id: 'hub-linkglide-centerlock',
  category: 'hub',
  brand: 'Shimano',
  model: 'Linkglide freehub, Center Lock',
  modelCode: null,
  specs: { freehub: 'linkglide', rotorMount: 'center-lock' },
  sourceUrl: C731,
  sourceRef: 'C-731 says its table does not include Linkglide cassettes. This body is separate from HG. Draft.',
  quote: 'The table below does not include LINKGLIDE cassette.',
});

function cassette(entry) {
  add({ category: 'cassette', ...entry, specs: { chainType: 'standard', ...entry.specs } });
}

cassette({
  id: 'cassette-vg-sports-9-11-42',
  brand: 'VG Sports',
  model: '9-speed cassette 11-42T',
  modelCode: null,
  specs: { speeds: 9, ...cogSpec(11, 42), freehubFit: hg8910, chainType: 'standard' },
  sourceUrl: C731,
  sourceRef: 'Tooth count 11-42T is the owner\'s VG Sports 9-speed kit (ASIN B09VBNTGCD). No shop link. Freehub: 9-speed HG uses HG spline M natively and HG spline L with a 1.85 mm spacer (C-731).',
  quote: '9-speed on HG spline M',
});
cassette({
  id: 'cassette-shimano-hg400-9-11-36',
  brand: 'Shimano',
  model: 'CS-HG400-9 11-36T',
  modelCode: 'CS-HG400-9',
  specs: { speeds: 9, ...cogSpec(11, 36), freehubFit: hg8910 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Shimano 2025-2026 compatibility v037 lists CS-HG400-9 11-36T with 9-speed HG derailleurs.',
  quote: 'CS-HG400-9 (11-36T)',
});
cassette({
  id: 'cassette-shimano-hg400-9-11-34',
  brand: 'Shimano',
  model: 'CS-HG400-9 11-34T',
  modelCode: 'CS-HG400-9',
  specs: { speeds: 9, ...cogSpec(11, 34), freehubFit: hg8910 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'CS-HG400-9 is a 9-speed HG cassette family. 11-34T is a common ratio in that family. Draft the exact tooth board.',
  quote: 'CS-HG400-9',
});
cassette({
  id: 'cassette-shimano-hg400-9-11-32',
  brand: 'Shimano',
  model: 'CS-HG400-9 11-32T',
  modelCode: 'CS-HG400-9',
  specs: { speeds: 9, ...cogSpec(11, 32), freehubFit: hg8910 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: '9-speed HG cassette. Draft exact ratio.',
  quote: 'CS-HG400-9',
});
cassette({
  id: 'cassette-shimano-hg-8-11-32',
  brand: 'Shimano',
  model: '8-speed HG cassette 11-32T',
  modelCode: 'CS-HG400-8',
  specs: { speeds: 8, ...cogSpec(11, 32), freehubFit: hg8910 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart lists CS-HG400-8. Draft the 11-32 ratio.',
  quote: 'CS-HG400-8',
});
cassette({
  id: 'cassette-shimano-hg-7-12-28',
  brand: 'Shimano',
  model: 'CS-HG400-7 12-28T',
  modelCode: 'CS-HG400-7',
  specs: {
    speeds: 7,
    ...cogSpec(12, 28),
    freehubFit: [
      { driver: 'hg-m', fit: 'native' },
      { driver: 'hg-s', fit: 'native' },
    ],
  },
  sourceUrl: C731,
  sourceRef: 'C-731 *6: CS-HG400-7 fits HG spline M. *7 lists other 7-speed cassettes on HG spline S. Draft which exact 7-speed model is native on S.',
  quote: 'Only CS-HG210-7 and CS-HG400-7 are compatible (HG spline M).',
});
cassette({
  id: 'cassette-shimano-hg-10-11-36',
  brand: 'Shimano',
  model: '10-speed HG cassette 11-36T',
  modelCode: 'CS-HG500-10',
  specs: { speeds: 10, ...cogSpec(11, 36), freehubFit: hg8910 },
  sourceUrl: C731,
  sourceRef: '10/9/8-speed cassettes are marked compatible with HG spline M, and with HG spline L using a 1.85 mm spacer (C-731 *2). Draft model code.',
  quote: '10/9/8-speed on HG spline M',
});
cassette({
  id: 'cassette-shimano-road-10-11-28',
  brand: 'Shimano',
  model: '10-speed road HG cassette 11-28T',
  modelCode: 'CS-5700',
  specs: {
    speeds: 10,
    ...cogSpec(11, 28),
    freehubFit: [
      { driver: 'hg-m', fit: 'spacer', spacerMm: 1.0, note: 'C-731 *5 1.0 mm spacer for named 10-speed road cassettes.' },
      { driver: 'hg-l', fit: 'spacer', spacerMm: 1.85, note: 'C-731 *2 also calls for the 1.0 mm spacer on the named cassettes.' },
    ],
  },
  sourceUrl: C731,
  sourceRef: 'C-731 *5 and *2 name CS-5700 among 10-speed road cassettes that need spacers. Draft.',
  quote: 'Need 1.0 mm spacer for the 10-speed road cassettes.',
});
cassette({
  id: 'cassette-shimano-mtb-11-11-42',
  brand: 'Shimano',
  model: 'CS-M5100-11 11-42T',
  modelCode: 'CS-M5100-11',
  specs: { speeds: 11, ...cogSpec(11, 42), freehubFit: mtb11 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart lists CS-M5100-11 (11-42T). MTB 11-speed uses the HG spline M body (C-731) and needs a 1.85 mm spacer on HG spline L.',
  quote: 'CS-M5100-11 (11-42T)',
});
cassette({
  id: 'cassette-shimano-mtb-11-11-46',
  brand: 'Shimano',
  model: '11-speed MTB cassette 11-46T',
  modelCode: 'CS-M7000-11',
  specs: { speeds: 11, ...cogSpec(11, 46), freehubFit: mtb11 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart lists CS-M7000-11 11-46T among 11-speed MTB cassettes. Draft which exact SKU.',
  quote: '11-46T',
});
cassette({
  id: 'cassette-shimano-mtb-11-11-51',
  brand: 'Shimano',
  model: 'CS-M5100-11 11-51T',
  modelCode: 'CS-M5100-11',
  specs: { speeds: 11, ...cogSpec(11, 51), freehubFit: mtb11 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart lists CS-M5100-11 (11-51T).',
  quote: 'CS-M5100-11 (11-51T)',
});
cassette({
  id: 'cassette-shimano-r7000-11-28',
  brand: 'Shimano',
  model: '105 CS-R7000 11-28T',
  modelCode: 'CS-R7000',
  specs: { speeds: 11, ...cogSpec(11, 28), freehubFit: road11 },
  sourceUrl: 'https://productinfo.shimano.com/en/lineup/105-r7000-2x11',
  sourceRef: 'Pedal Brief CC BY 4.0, groupset 105 R7000, Cassettes, checked 2026-10-20. stated: 11-28, 11-30, 11-32, 11-34, 12-25. Standard 11-speed road cassettes other than CS-HG700/HG800/RS400 need HG spline L (C-731).',
  quote: '11-28, 11-30, 11-32, 11-34, 12-25',
  attribution: 'Pedal Brief, CC BY 4.0',
});
cassette({
  id: 'cassette-shimano-r7000-11-32',
  brand: 'Shimano',
  model: '105 CS-R7000 11-32T',
  modelCode: 'CS-R7000',
  specs: { speeds: 11, ...cogSpec(11, 32), freehubFit: road11 },
  sourceUrl: 'https://productinfo.shimano.com/en/lineup/105-r7000-2x11',
  sourceRef: 'Pedal Brief CC BY 4.0, 105 R7000 cassettes include 11-32. HG spline L native.',
  quote: '11-32',
  attribution: 'Pedal Brief, CC BY 4.0',
});
cassette({
  id: 'cassette-shimano-hg700-11-34',
  brand: 'Shimano',
  model: 'CS-HG700-11 11-34T',
  modelCode: 'CS-HG700-11',
  specs: { speeds: 11, ...cogSpec(11, 34), freehubFit: road11Wide },
  sourceUrl: C731,
  sourceRef: 'C-731 *4: CS-HG700 of road 11-speed fits HG spline M. *3: the same cassette fits HG spline L with a 1.85 mm spacer. Pedal Brief lists 11-34 on the 105 R7000 chart as CS-HG700-11.',
  quote: 'CS-HG700 of ROAD 11-speed are compatible with HG spline M',
});
cassette({
  id: 'cassette-shimano-r7100-11-34',
  brand: 'Shimano',
  model: '105 12-speed cassette 11-34T',
  modelCode: 'CS-R7101',
  specs: { speeds: 12, ...cogSpec(11, 34), freehubFit: road12, chainType: 'standard' },
  sourceUrl: 'https://productinfo.shimano.com/en/lineup/105-r7100-2x12',
  sourceRef: 'Pedal Brief CC BY 4.0, 105 R7100 cassettes stated 11-34, 11-36. C-731: road 12-speed fits HG spline L2 and HG spline L.',
  quote: '11-34, 11-36',
  attribution: 'Pedal Brief, CC BY 4.0',
});
cassette({
  id: 'cassette-shimano-r7100-11-36',
  brand: 'Shimano',
  model: '105 12-speed cassette 11-36T',
  modelCode: 'CS-HG710-12',
  specs: { speeds: 12, ...cogSpec(11, 36), freehubFit: road12 },
  sourceUrl: 'https://productinfo.shimano.com/en/lineup/105-r7100-2x12',
  sourceRef: 'Pedal Brief CC BY 4.0, 105 R7100 cassettes include 11-36. Model code draft.',
  quote: '11-36',
  attribution: 'Pedal Brief, CC BY 4.0',
});
cassette({
  id: 'cassette-shimano-r8100-11-30',
  brand: 'Shimano',
  model: 'Ultegra 12-speed cassette 11-30T',
  modelCode: 'CS-R8101',
  specs: { speeds: 12, ...cogSpec(11, 30), freehubFit: road12 },
  sourceUrl: 'https://productinfo.shimano.com/en/lineup/ultegra-r8100-2x12-di2',
  sourceRef: 'Pedal Brief CC BY 4.0, Ultegra R8100 cassettes stated 11-30, 11-34. Road 12 freehubs per C-731.',
  quote: '11-30, 11-34',
  attribution: 'Pedal Brief, CC BY 4.0',
});
cassette({
  id: 'cassette-shimano-m6100-10-51',
  brand: 'Shimano',
  model: 'CS-M6100-12 10-51T',
  modelCode: 'CS-M6100-12',
  specs: { speeds: 12, ...cogSpec(10, 51), freehubFit: micro, chainType: 'standard' },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart lists CS-M6100-12 (10-51T) with 12-speed MTB derailleurs. Micro Spline only (C-731).',
  quote: 'CS-M6100-12 (10-51T)',
});
cassette({
  id: 'cassette-shimano-m7100-10-45',
  brand: 'Shimano',
  model: 'CS-M7100-12 10-45T',
  modelCode: 'CS-M7100-12',
  specs: { speeds: 12, ...cogSpec(10, 45), freehubFit: micro },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart lists CS-M7100-12 (10-45T). Micro Spline.',
  quote: 'CS-M7100-12 (10-45T)',
});
cassette({
  id: 'cassette-sram-nx-11-50',
  brand: 'SRAM',
  model: 'NX Eagle PG-1230 11-50T',
  modelCode: 'PG-1230',
  specs: { speeds: 12, ...cogSpec(11, 50), freehubFit: [{ driver: 'hg-m', fit: 'native' }], chainType: 'eagle' },
  sourceUrl: SRAM_XD,
  sourceRef: 'NX Eagle uses a Shimano HG driver, not XD. Draft: confirm 11-50 against the current SRAM PG-1230 page.',
  quote: '11-50',
});
cassette({
  id: 'cassette-sram-gx-10-52',
  brand: 'SRAM',
  model: 'GX Eagle XG-1275 10-52T',
  modelCode: 'XG-1275',
  specs: { speeds: 12, ...cogSpec(10, 52), freehubFit: xd, chainType: 'eagle' },
  sourceUrl: SRAM_XD,
  sourceRef: 'GX Eagle 10-52 uses an XD driver. XD on XDR needs a 1.85 mm spacer. Draft the current model code.',
  quote: '10-52 XD',
});
cassette({
  id: 'cassette-sram-xg-10-50',
  brand: 'SRAM',
  model: 'Eagle cassette 10-50T',
  modelCode: 'XG-1275',
  specs: { speeds: 12, ...cogSpec(10, 50), freehubFit: xd, chainType: 'eagle' },
  sourceUrl: SRAM_XD,
  sourceRef: 'Earlier Eagle 10-50 cassettes use XD. Draft.',
  quote: '10-50',
});
cassette({
  id: 'cassette-sram-force-xdr-10-36',
  brand: 'SRAM',
  model: 'Force AXS cassette 10-36T',
  modelCode: 'XG-1270',
  specs: { speeds: 12, ...cogSpec(10, 36), freehubFit: xdr, chainType: 'flattop' },
  sourceUrl: 'https://www.sram.com/globalassets/document-hierarchy/compatibility-map/road/axs-components-compatibility-map.pdf',
  sourceRef: 'Road AXS cassettes use XDR and a Flattop chain. Draft the 10-36 ratio.',
  quote: 'XDR',
});
cassette({
  id: 'cassette-sram-transmission-10-52',
  brand: 'SRAM',
  model: 'GX Eagle Transmission XS-1275 10-52T',
  modelCode: 'XS-1275',
  specs: { speeds: 12, ...cogSpec(10, 52), freehubFit: xd, chainType: 't-type' },
  sourceUrl: 'https://www.sram.com/en/learn/understanding-udh-and-full-mount',
  sourceRef: 'Transmission cassettes are T-Type and use an XD driver body. Draft model code.',
  quote: 'T-Type',
});
cassette({
  id: 'cassette-sram-flattop-10-33',
  brand: 'SRAM',
  model: 'Red/Force AXS cassette 10-33T',
  modelCode: 'XG-1290',
  specs: { speeds: 12, ...cogSpec(10, 33), freehubFit: xdr, chainType: 'flattop' },
  sourceUrl: 'https://www.sram.com/globalassets/document-hierarchy/compatibility-map/road/axs-components-compatibility-map.pdf',
  sourceRef: 'Flattop road cassette on XDR. Draft ratio.',
  quote: 'Flattop',
});
cassette({
  id: 'cassette-shimano-linkglide-11-46',
  brand: 'Shimano',
  model: 'Linkglide cassette 11-46T',
  modelCode: 'CS-LG400-11',
  specs: { speeds: 11, ...cogSpec(11, 46), freehubFit: linkglideFit, chainType: 'linkglide' },
  sourceUrl: C731,
  sourceRef: 'Linkglide is excluded from the C-731 HG table. Draft tooth count and model code.',
  quote: 'LINKGLIDE',
});
cassette({
  id: 'cassette-campagnolo-12-11-34',
  brand: 'Campagnolo',
  model: '12-speed cassette 11-34T',
  modelCode: null,
  specs: { speeds: 12, ...cogSpec(11, 34), freehubFit: campy, chainType: 'campagnolo' },
  sourceUrl: PEDAL,
  sourceRef: 'Pedal Brief CC BY 4.0 lists Chorus 12 cassettes including 11-34. N3W cross-fit is unknown, not a pass.',
  quote: '11-34',
  attribution: 'Pedal Brief, CC BY 4.0',
});
cassette({
  id: 'cassette-campagnolo-13-10-29',
  brand: 'Campagnolo',
  model: 'Super Record 13 cassette 10-29T',
  modelCode: null,
  specs: { speeds: 13, ...cogSpec(10, 29), freehubFit: n3w, chainType: 'campagnolo' },
  sourceUrl: PEDAL,
  sourceRef: 'Pedal Brief CC BY 4.0, Super Record 13 cassettes include 10-29. N3W native. Draft.',
  quote: '10-29',
  attribution: 'Pedal Brief, CC BY 4.0',
});

function chain(id, brand, model, speeds, chainType, sourceUrl, sourceRef) {
  add({
    id,
    category: 'chain',
    brand,
    model,
    modelCode: null,
    specs: { speeds, chainType },
    sourceUrl,
    sourceRef,
    quote: `${speeds}-speed ${chainType}`,
  });
}
chain('chain-shimano-hg-7', 'Shimano', '7-speed HG chain', 7, 'standard', 'https://www.parktool.com/en-us/blog/repair-help/chain-compatibility', 'Match chain speed to the drivetrain. Draft model.');
chain('chain-shimano-hg-8', 'Shimano', '8-speed HG chain', 8, 'standard', 'https://www.parktool.com/en-us/blog/repair-help/chain-compatibility', 'Match chain speed to the drivetrain. Draft model.');
chain('chain-shimano-hg-9', 'Shimano', 'CN-HG53 9-speed chain', 9, 'standard', 'https://www.parktool.com/en-us/blog/repair-help/chain-compatibility', '9-speed HG chain for the 9-speed kit. Draft the exact Shimano chain code on the bike.');
chain('chain-shimano-hg-10', 'Shimano', '10-speed HG chain', 10, 'standard', 'https://www.parktool.com/en-us/blog/repair-help/chain-compatibility', 'Draft model.');
chain('chain-shimano-hg-11', 'Shimano', 'CN-HG601-11 chain', 11, 'standard', SHIMANO_PDF, 'Chart lists CN-HG601-11 with 11-speed road groups.');
chain('chain-shimano-hg-12', 'Shimano', '12-speed HG chain', 12, 'standard', SHIMANO_PDF, '12-speed Shimano mountain and road HG chains. Draft the exact code (CN-M7100 / CN-M8100).');
chain('chain-sram-eagle-12', 'SRAM', 'Eagle 12-speed chain', 12, 'eagle', SRAM_XD, 'Eagle mechanical uses an Eagle chain. Draft model (GX/NX/SX).');
chain('chain-sram-flattop-12', 'SRAM', 'Flattop 12-speed chain', 12, 'flattop', 'https://www.sram.com/globalassets/document-hierarchy/compatibility-map/road/axs-components-compatibility-map.pdf', 'Road AXS uses a Flattop chain.');
chain('chain-sram-ttype-12', 'SRAM', 'T-Type Transmission chain', 12, 't-type', 'https://www.sram.com/en/learn/understanding-udh-and-full-mount', 'Eagle Transmission uses a T-Type chain.');
chain('chain-shimano-linkglide', 'Shimano', 'Linkglide chain', 11, 'linkglide', C731, 'Linkglide chain stays with Linkglide. Speed draft: many CUES bikes are 9, 10, or 11.');
chain('chain-campagnolo-12', 'Campagnolo', '12-speed chain', 12, 'campagnolo', PEDAL, 'Pedal Brief CC BY 4.0 Chorus / Super Record 12 mechanical. Draft.');
chain('chain-campagnolo-13', 'Campagnolo', '13-speed chain', 13, 'campagnolo', PEDAL, 'Pedal Brief CC BY 4.0 Super Record 13. Draft.');

function rd(entry) {
  add({
    category: 'rear_derailleur',
    ...entry,
    specs: {
      eEcosystem: null,
      chainType: 'standard',
      mount: 'hanger',
      maxCog: null,
      minLargestCog: null,
      capacity: null,
      maxFrontDiff: null,
      ...entry.specs,
    },
  });
}

rd({
  id: 'shimano-rd-m3100-sgs',
  brand: 'Shimano',
  model: 'Alivio RD-M3100-SGS',
  modelCode: 'RD-M3100-SGS',
  reviewStatus: 'approved',
  specs: {
    speeds: 9,
    actuationFamily: 'shimano-road-6-9-10',
    maxCog: 36,
    minLargestCog: 32,
    capacity: 45,
    maxFrontDiff: 22,
    cage: 'SGS',
  },
  sourceUrl: 'https://bike.shimano.com/en-EU/product/component/alivio-m3100/RD-M3100-SGS.html',
  sourceRef: 'PRODUCT SPECIFICATIONS table, copied 2026-11-27. Rear speeds 9. Max low sprocket 36T. Min low sprocket 32T. Total capacity 45T. Max front difference 22T.',
  quote: 'Max. low sprocket: 36T. Total capacity: 45T. Low sprocket min: 32T.',
});
rd({
  id: 'shimano-rd-m370-sgs',
  brand: 'Shimano',
  model: 'Altus RD-M370-SGS',
  modelCode: 'RD-M370-SGS',
  reviewStatus: 'approved',
  specs: {
    speeds: 9,
    actuationFamily: 'shimano-road-6-9-10',
    maxCog: 34,
    minLargestCog: 28,
    capacity: 45,
    maxFrontDiff: 22,
    cage: 'SGS',
  },
  sourceUrl: 'https://bike.shimano.com/en-EU/product/component/altus-m370/RD-M370-SGS.html',
  sourceRef: 'PRODUCT SPECIFICATIONS table, copied 2026-11-27. Max low sprocket 34T. Min 28T. Total capacity 45T. Max front difference 22T. Rear speeds 9.',
  quote: 'Low sprocket max 34T. Total capacity 45T.',
});
rd({
  id: 'shimano-rd-classic-8',
  brand: 'Shimano',
  model: '8-speed rear derailleur, classic cable pull',
  modelCode: null,
  specs: { speeds: 8, actuationFamily: 'shimano-road-6-9-10', maxCog: 34, minLargestCog: 28, capacity: 43 },
  sourceUrl: BIKEGREMLIN,
  sourceRef: 'Teaching part for the 6–9 speed interchange exception. Not a specific current model. Draft the max cog.',
  quote: '6-9 speed derailleurs share cable pull',
});
rd({
  id: 'shimano-rd-m5120-sgs',
  brand: 'Shimano',
  model: 'Deore RD-M5120-SGS',
  modelCode: 'RD-M5120-SGS',
  specs: { speeds: 11, actuationFamily: 'shimano-mtb-11', maxCog: 46, minLargestCog: 42 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart: RD-M5120-SGS, 42T ≤ largest sprocket ≤ 46T for 1x11 and 1x10. Seeded as 11-speed mountain actuation so a 10-speed mix does not pass. Needs review.',
  quote: '42T≤Largest sprocket≤46T',
});
rd({
  id: 'shimano-rd-m5100-sgs',
  brand: 'Shimano',
  model: 'Deore RD-M5100-SGS',
  modelCode: 'RD-M5100-SGS',
  specs: { speeds: 11, actuationFamily: 'shimano-mtb-11', maxCog: 51, minLargestCog: 51 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart: RD-M5100-SGS (51T ≤ largest sprocket ≤ 51T for 1x11-speed).',
  quote: '51T≤Largest sprocket≤51T',
});
rd({
  id: 'shimano-rd-m8000-sgs',
  brand: 'Shimano',
  model: 'XT RD-M8000-SGS',
  modelCode: 'RD-M8000-SGS',
  specs: { speeds: 11, actuationFamily: 'shimano-mtb-11', maxCog: 46, minLargestCog: 40 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart: RD-M8000-SGS, 40T ≤ largest ≤ 46T for 1x11-speed. Capacity not on that row, left blank.',
  quote: '40T≤Largest sprocket≤46T for 1x11-speed',
});
rd({
  id: 'shimano-rd-m6100-sgs',
  brand: 'Shimano',
  model: 'Deore RD-M6100-SGS',
  modelCode: 'RD-M6100-SGS',
  specs: { speeds: 12, actuationFamily: 'shimano-mtb-12', maxCog: 51 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart pairs RD-M6100-SGS (1x12-speed) with CS-M6100-12 (10-51T). Capacity not copied.',
  quote: 'RD-M6100-SGS (1x12-speed)',
});
rd({
  id: 'shimano-rd-m7100-sgs',
  brand: 'Shimano',
  model: 'SLX RD-M7100-SGS',
  modelCode: 'RD-M7100-SGS',
  specs: { speeds: 12, actuationFamily: 'shimano-mtb-12', maxCog: 51 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart pairs RD-M7100-SGS (1x12-speed) with 10-51 cassettes. Capacity blank.',
  quote: 'RD-M7100-SGS (1x12-speed)',
});
rd({
  id: 'shimano-rd-m8100-sgs',
  brand: 'Shimano',
  model: 'XT RD-M8100-SGS',
  modelCode: 'RD-M8100-SGS',
  specs: { speeds: 12, actuationFamily: 'shimano-mtb-12', maxCog: 51 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart pairs RD-M8100-SGS (1x12-speed) with 10-51 cassettes. Capacity blank.',
  quote: 'RD-M8100-SGS (1x12-speed)',
});
rd({
  id: 'shimano-rd-m4100-10',
  brand: 'Shimano',
  model: 'Deore 10-speed rear derailleur',
  modelCode: 'RD-M4100',
  specs: { speeds: 10, actuationFamily: 'shimano-mtb-10' },
  sourceUrl: BIKEGREMLIN,
  sourceRef: '10-speed mountain (Dyna-Sys) is its own actuation family. Max cog left blank on purpose.',
  quote: '',
});
rd({
  id: 'shimano-rd-r7000-ss',
  brand: 'Shimano',
  model: '105 RD-R7000-SS',
  modelCode: 'RD-R7000-SS',
  specs: { speeds: 11, actuationFamily: 'shimano-road-11', maxCog: 30, minLargestCog: 25, maxFrontDiff: 16 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart: RD-R7000-SS (25T ≤ largest sprocket ≤ 30T). Capacity not on that row.',
  quote: '25T≤Largest sprocket≤30T',
});
rd({
  id: 'shimano-rd-r7000-gs',
  brand: 'Shimano',
  model: '105 RD-R7000-GS',
  modelCode: 'RD-R7000-GS',
  specs: { speeds: 11, actuationFamily: 'shimano-road-11', maxCog: 34, minLargestCog: 30, maxFrontDiff: 16 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart lists RD-R7000-GS beside a 30–34T largest-sprocket note. The OCR of that row is messy, so capacity is blank and this stays draft.',
  quote: 'RD-R7000-GS',
});
rd({
  id: 'shimano-rd-r8000-ss',
  brand: 'Shimano',
  model: 'Ultegra RD-R8000-SS',
  modelCode: 'RD-R8000-SS',
  specs: { speeds: 11, actuationFamily: 'shimano-road-11', maxCog: 30, minLargestCog: 25, maxFrontDiff: 16 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart: RD-R8000-SS (25T ≤ largest sprocket ≤ 30T).',
  quote: '25T≤Largest sprocket≤30T',
});
rd({
  id: 'shimano-rd-r8000-gs',
  brand: 'Shimano',
  model: 'Ultegra RD-R8000-GS',
  modelCode: 'RD-R8000-GS',
  specs: { speeds: 11, actuationFamily: 'shimano-road-11', maxCog: 34, minLargestCog: 28, maxFrontDiff: 16 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart: RD-R8000-GS (28T ≤ largest sprocket ≤ 34T).',
  quote: '28T≤Largest sprocket≤34T',
});
rd({
  id: 'shimano-rd-4700-gs',
  brand: 'Shimano',
  model: 'Tiagra RD-4700-GS',
  modelCode: 'RD-4700-GS',
  specs: { speeds: 10, actuationFamily: 'shimano-tiagra-4700', maxCog: 34 },
  sourceUrl: BIKEGREMLIN,
  sourceRef: 'Tiagra 4700 uses the newer road cable pull, not classic 10-speed. Max cog draft.',
  quote: 'Tiagra 4700',
});
rd({
  id: 'shimano-rd-r7100',
  brand: 'Shimano',
  model: '105 RD-R7100',
  modelCode: 'RD-R7100',
  specs: { speeds: 12, actuationFamily: 'shimano-di2-12-wireless', eEcosystem: 'shimano-di2', maxCog: 36 },
  sourceUrl: 'https://productinfo.shimano.com/en/lineup/105-r7100-2x12',
  sourceRef: 'Pedal Brief CC BY 4.0: 105 R7100 is 12-speed. Mechanical and Di2 both exist; this record is the Di2 generation and stays draft until the mechanical twin is split out.',
  quote: '12',
  attribution: 'Pedal Brief, CC BY 4.0',
});
rd({
  id: 'shimano-rd-r8150',
  brand: 'Shimano',
  model: 'Ultegra RD-R8150',
  modelCode: 'RD-R8150',
  specs: { speeds: 12, actuationFamily: 'shimano-di2-12-wireless', eEcosystem: 'shimano-di2', maxCog: 34 },
  sourceUrl: 'https://productinfo.shimano.com/en/lineup/ultegra-r8100-2x12-di2',
  sourceRef: 'Pedal Brief CC BY 4.0: Ultegra R8100 Di2, 12-speed, cassettes to 11-34. Draft max cog.',
  quote: 'Electronic (Di2)',
  attribution: 'Pedal Brief, CC BY 4.0',
});
rd({
  id: 'shimano-rd-r8050',
  brand: 'Shimano',
  model: 'Ultegra RD-R8050-SS',
  modelCode: 'RD-R8050-SS',
  specs: { speeds: 11, actuationFamily: 'shimano-di2-etube', eEcosystem: 'shimano-di2', maxCog: 30, minLargestCog: 25 },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart: RD-R8050-SS (25T ≤ largest sprocket ≤ 30T). Wired Di2 generation.',
  quote: '25T≤Largest sprocket≤30T',
});
rd({
  id: 'shimano-rd-u6000',
  brand: 'Shimano',
  model: 'CUES RD-U6000',
  modelCode: 'RD-U6000',
  specs: { speeds: 10, actuationFamily: 'shimano-linkglide', chainType: 'linkglide', maxCog: null },
  sourceUrl: C731,
  sourceRef: 'CUES / Linkglide is its own family. Speed and max cog left for review. A 10-speed CUES derailleur measured pull ratio 1.06 in derailleur-analysis.',
  quote: 'LINKGLIDE',
});
rd({
  id: 'sram-rd-sx-eagle',
  brand: 'SRAM',
  model: 'SX Eagle rear derailleur',
  modelCode: 'RD-SX-1-B1',
  specs: { speeds: 12, actuationFamily: 'sram-eagle-12', chainType: 'eagle', maxCog: 50 },
  sourceUrl: 'https://github.com/boothinator/derailleur-analysis',
  sourceRef: 'Measured pull ratio 1.08 on RD-SX-1-B1 (MIT). Max cog 50T is draft.',
  quote: 'Pull Ratio: 1.08',
});
rd({
  id: 'sram-rd-nx-eagle',
  brand: 'SRAM',
  model: 'NX Eagle rear derailleur',
  modelCode: 'RD-NX-1',
  specs: { speeds: 12, actuationFamily: 'sram-eagle-12', chainType: 'eagle', maxCog: 50 },
  sourceUrl: SRAM_XD,
  sourceRef: 'NX Eagle mechanical 12-speed. Max cog draft 50T.',
  quote: 'Eagle',
});
rd({
  id: 'sram-rd-gx-eagle',
  brand: 'SRAM',
  model: 'GX Eagle rear derailleur',
  modelCode: 'RD-GX-1',
  specs: { speeds: 12, actuationFamily: 'sram-eagle-12', chainType: 'eagle', maxCog: 52 },
  sourceUrl: SRAM_XD,
  sourceRef: 'GX Eagle mechanical. Max cog draft 52T.',
  quote: 'Eagle',
});
rd({
  id: 'sram-rd-gx-axs',
  brand: 'SRAM',
  model: 'GX Eagle AXS rear derailleur',
  modelCode: 'RD-GX-1-E',
  specs: { speeds: 12, actuationFamily: 'sram-axs', eEcosystem: 'sram-axs', chainType: 'eagle', maxCog: 52 },
  sourceUrl: 'https://www.sram.com/globalassets/document-hierarchy/compatibility-map/road/axs-components-compatibility-map.pdf',
  sourceRef: 'AXS ecosystem. Eagle AXS uses an Eagle chain, not Flattop. Draft max cog.',
  quote: 'AXS',
});
rd({
  id: 'sram-rd-xx-transmission',
  brand: 'SRAM',
  model: 'GX Eagle Transmission rear derailleur',
  modelCode: 'RD-GX-ES1',
  specs: { speeds: 12, actuationFamily: 'sram-axs', eEcosystem: 'sram-axs', chainType: 't-type', mount: 'full-mount', maxCog: 52 },
  sourceUrl: 'https://www.sram.com/en/learn/understanding-udh-and-full-mount',
  sourceRef: 'Full Mount Transmission derailleur requires a UDH frame and a T-Type chain.',
  quote: 'Full Mount',
});
rd({
  id: 'sram-rd-apex-xplr-axs',
  brand: 'SRAM',
  model: 'Apex XPLR AXS rear derailleur',
  modelCode: null,
  specs: { speeds: 12, actuationFamily: 'sram-axs', eEcosystem: 'sram-axs', chainType: 'flattop', mount: 'full-mount', maxCog: 44 },
  sourceUrl: PEDAL,
  sourceRef: 'Pedal Brief CC BY 4.0: Apex AXS XPLR is 12-speed electronic, cassette 11-44. Newer XPLR derailleurs are Full Mount. Draft the mount if this exact Apex is hanger-mount.',
  quote: '12',
  attribution: 'Pedal Brief, CC BY 4.0',
});
rd({
  id: 'sram-rd-gx-10',
  brand: 'SRAM',
  model: 'GX 10-speed rear derailleur',
  modelCode: 'RD-GX-T21-A1',
  specs: { speeds: 10, actuationFamily: 'sram-1to1-exact', maxCog: 36 },
  sourceUrl: 'https://github.com/boothinator/derailleur-analysis',
  sourceRef: 'Measured pull ratio 1.33 (MIT). Max cog draft.',
  quote: 'Pull Ratio: 1.33',
});
rd({
  id: 'sram-rd-apex-11',
  brand: 'SRAM',
  model: 'Apex 1 rear derailleur',
  modelCode: 'RD-APX-1-A1',
  specs: { speeds: 11, actuationFamily: 'sram-x-actuation-11', maxCog: 42 },
  sourceUrl: 'https://github.com/boothinator/derailleur-analysis',
  sourceRef: 'Measured pull ratio 1.22 (MIT). Max cog draft.',
  quote: 'Pull Ratio: 1.22',
});
rd({
  id: 'campagnolo-rd-chorus-12',
  brand: 'Campagnolo',
  model: 'Chorus 12 mechanical rear derailleur',
  modelCode: null,
  specs: { speeds: 12, actuationFamily: 'campagnolo-mech-12', chainType: 'campagnolo', maxCog: 34 },
  sourceUrl: PEDAL,
  sourceRef: 'Pedal Brief CC BY 4.0: Chorus 12 mechanical, cassettes include 11-34. Draft max cog.',
  quote: 'Mechanical',
  attribution: 'Pedal Brief, CC BY 4.0',
});
rd({
  id: 'microshift-rd-advent',
  brand: 'microSHIFT',
  model: 'Advent 9-speed rear derailleur',
  modelCode: 'RD-M6195M',
  specs: { speeds: 9, actuationFamily: 'microshift-advent', maxCog: 46 },
  sourceUrl: BIKEGREMLIN,
  sourceRef: 'Advent is not Shimano 9-speed actuation. Max cog draft.',
  quote: 'Advent',
});
rd({
  id: 'microshift-rd-advent-x',
  brand: 'microSHIFT',
  model: 'Advent X RD-M6205AM',
  modelCode: 'RD-M6205AM',
  specs: { speeds: 10, actuationFamily: 'microshift-advent-x', maxCog: 48 },
  sourceUrl: 'https://github.com/boothinator/derailleur-analysis',
  sourceRef: 'Measured pull ratio 1.05 (MIT). Max cog draft.',
  quote: 'Pull Ratio: 1.05',
});

function shifter(entry) {
  add({
    category: 'shifter',
    ...entry,
    specs: { eEcosystem: null, chainType: 'standard', ...entry.specs },
  });
}
shifter({
  id: 'shifter-shimano-altus-m370-9',
  brand: 'Shimano',
  model: 'Altus SL-M370 9-speed',
  modelCode: 'SL-M370-R',
  specs: { speeds: 9, actuationFamily: 'shimano-road-6-9-10' },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart lists SL-M370-R with 9-speed Altus derailleurs. Used as the 9-speed Shimano shifter stand-in. Confirm the shifter actually on Zuzu\'s bike.',
  quote: 'SL-M370-R',
});
shifter({
  id: 'shifter-shimano-alivio-m3100-9',
  brand: 'Shimano',
  model: 'Alivio SL-M3100 9-speed',
  modelCode: 'SL-M3100-R',
  specs: { speeds: 9, actuationFamily: 'shimano-road-6-9-10' },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart lists SL-M3100-R with RD-M3100-SGS.',
  quote: 'SL-M3100-R',
});
shifter({
  id: 'shifter-shimano-classic-8',
  brand: 'Shimano',
  model: '8-speed Shimano shifter, classic cable',
  modelCode: null,
  specs: { speeds: 8, actuationFamily: 'shimano-road-6-9-10' },
  sourceUrl: BIKEGREMLIN,
  sourceRef: 'Teaching shifter for the 6–9 interchange. Draft.',
  quote: '',
});
shifter({
  id: 'shifter-shimano-deore-m4100-10',
  brand: 'Shimano',
  model: 'Deore SL-M4100 10-speed',
  modelCode: 'SL-M4100',
  specs: { speeds: 10, actuationFamily: 'shimano-mtb-10' },
  sourceUrl: 'https://github.com/boothinator/derailleur-analysis',
  sourceRef: 'Cable pull about 3.48 mm/shift measured on SL-M4100 (MIT).',
  quote: 'Cable Pull: 3.48 mm/shift',
});
shifter({
  id: 'shifter-shimano-deore-m5100-11',
  brand: 'Shimano',
  model: 'Deore SL-M5100 11-speed',
  modelCode: 'SL-M5100',
  specs: { speeds: 11, actuationFamily: 'shimano-mtb-11' },
  sourceUrl: 'https://github.com/boothinator/derailleur-analysis',
  sourceRef: 'Cable pull about 3.40 mm/shift measured on SL-M5100 (MIT).',
  quote: 'Cable Pull: 3.40 mm/shift',
});
shifter({
  id: 'shifter-shimano-slx-m7100-12',
  brand: 'Shimano',
  model: 'SLX SL-M7100 12-speed',
  modelCode: 'SL-M7100',
  specs: { speeds: 12, actuationFamily: 'shimano-mtb-12' },
  sourceUrl: 'https://github.com/boothinator/derailleur-analysis',
  sourceRef: 'Cable pull about 3.19 mm/shift measured on SL-M7100 (MIT).',
  quote: 'Cable Pull: 3.19 mm/shift',
});
shifter({
  id: 'shifter-shimano-deore-m6100-12',
  brand: 'Shimano',
  model: 'Deore SL-M6100 12-speed',
  modelCode: 'SL-M6100',
  specs: { speeds: 12, actuationFamily: 'shimano-mtb-12' },
  sourceUrl: SHIMANO_PDF,
  sourceRef: 'Chart lists SL-M6100 with RD-M6100.',
  quote: 'SL-M6100',
});
shifter({
  id: 'shifter-shimano-105-r7000',
  brand: 'Shimano',
  model: '105 ST-R7000 11-speed',
  modelCode: 'ST-R7000',
  specs: { speeds: 11, actuationFamily: 'shimano-road-11' },
  sourceUrl: 'https://productinfo.shimano.com/en/lineup/105-r7000-2x11',
  sourceRef: 'Pedal Brief CC BY 4.0: 105 R7000 mechanical, 11-speed. maker_wording names ST-R7000-R.',
  quote: 'Mechanical',
  attribution: 'Pedal Brief, CC BY 4.0',
});
shifter({
  id: 'shifter-shimano-tiagra-4700',
  brand: 'Shimano',
  model: 'Tiagra ST-4700',
  modelCode: 'ST-4700',
  specs: { speeds: 10, actuationFamily: 'shimano-tiagra-4700' },
  sourceUrl: 'https://github.com/boothinator/derailleur-analysis',
  sourceRef: 'Cable pull about 2.65 mm/shift measured on ST-4700 (MIT).',
  quote: 'Cable Pull: 2.65 mm/shift',
});
shifter({
  id: 'shifter-shimano-ultegra-r8170',
  brand: 'Shimano',
  model: 'Ultegra ST-R8170 Di2',
  modelCode: 'ST-R8170',
  specs: { speeds: 12, actuationFamily: 'shimano-di2-12-wireless', eEcosystem: 'shimano-di2' },
  sourceUrl: 'https://productinfo.shimano.com/en/lineup/ultegra-r8100-2x12-di2',
  sourceRef: 'Pedal Brief CC BY 4.0: Ultegra R8100 Di2, 12-speed, wireless disc levers.',
  quote: 'Electronic (Di2)',
  attribution: 'Pedal Brief, CC BY 4.0',
});
shifter({
  id: 'shifter-shimano-ultegra-r8050',
  brand: 'Shimano',
  model: 'Ultegra ST-R8050 Di2',
  modelCode: 'ST-R8050',
  specs: { speeds: 11, actuationFamily: 'shimano-di2-etube', eEcosystem: 'shimano-di2' },
  sourceUrl: SHIMANO_PDF,
  sourceRef: '11-speed wired Di2 shifter. Draft the exact lever code.',
  quote: 'Di2',
});
shifter({
  id: 'shifter-shimano-cues-u6000',
  brand: 'Shimano',
  model: 'CUES SL-U6000 10-speed',
  modelCode: 'SL-U6000-10R',
  specs: { speeds: 10, actuationFamily: 'shimano-linkglide', chainType: 'linkglide' },
  sourceUrl: 'https://github.com/boothinator/derailleur-analysis',
  sourceRef: 'Cable pull about 3.58 mm/shift measured on SL-U6000-10R (MIT).',
  quote: 'Cable Pull: 3.58 mm/shift',
});
shifter({
  id: 'shifter-sram-sx-eagle',
  brand: 'SRAM',
  model: 'SX Eagle shifter',
  modelCode: 'SL-SX-1-A1',
  specs: { speeds: 12, actuationFamily: 'sram-eagle-12', chainType: 'eagle' },
  sourceUrl: 'https://github.com/boothinator/derailleur-analysis',
  sourceRef: 'Cable pull about 3.25 mm/shift measured on SL-SX-1-A1 (MIT).',
  quote: 'Cable Pull: 3.25 mm/shift',
});
shifter({
  id: 'shifter-sram-gx-eagle',
  brand: 'SRAM',
  model: 'GX Eagle shifter',
  modelCode: 'SL-GX-1',
  specs: { speeds: 12, actuationFamily: 'sram-eagle-12', chainType: 'eagle' },
  sourceUrl: SRAM_XD,
  sourceRef: 'Mechanical Eagle 12-speed shifter. Draft.',
  quote: 'Eagle',
});
shifter({
  id: 'shifter-sram-nx-eagle',
  brand: 'SRAM',
  model: 'NX Eagle shifter',
  modelCode: 'SL-NX-1',
  specs: { speeds: 12, actuationFamily: 'sram-eagle-12', chainType: 'eagle' },
  sourceUrl: SRAM_XD,
  sourceRef: 'Mechanical Eagle 12-speed shifter. Draft.',
  quote: 'Eagle',
});
shifter({
  id: 'shifter-sram-gx-axs',
  brand: 'SRAM',
  model: 'GX Eagle AXS controller',
  modelCode: null,
  specs: { speeds: 12, actuationFamily: 'sram-axs', eEcosystem: 'sram-axs', chainType: 'eagle' },
  sourceUrl: 'https://www.sram.com/globalassets/document-hierarchy/compatibility-map/road/axs-components-compatibility-map.pdf',
  sourceRef: 'AXS pod. Eagle AXS, not road Flattop.',
  quote: 'AXS',
});
shifter({
  id: 'shifter-sram-force-axs',
  brand: 'SRAM',
  model: 'Force AXS shifter',
  modelCode: null,
  specs: { speeds: 12, actuationFamily: 'sram-axs', eEcosystem: 'sram-axs', chainType: 'flattop' },
  sourceUrl: 'https://www.sram.com/globalassets/document-hierarchy/compatibility-map/road/axs-components-compatibility-map.pdf',
  sourceRef: 'Road AXS, Flattop chain. Draft.',
  quote: 'AXS',
});
shifter({
  id: 'shifter-sram-transmission',
  brand: 'SRAM',
  model: 'Eagle Transmission AXS controller',
  modelCode: null,
  specs: { speeds: 12, actuationFamily: 'sram-axs', eEcosystem: 'sram-axs', chainType: 't-type' },
  sourceUrl: 'https://www.sram.com/en/learn/understanding-udh-and-full-mount',
  sourceRef: 'Transmission pod. T-Type chain and Full Mount derailleur.',
  quote: 'Transmission',
});
shifter({
  id: 'shifter-sram-gx-10',
  brand: 'SRAM',
  model: 'GX 10-speed shifter',
  modelCode: 'SL-GX-A1',
  specs: { speeds: 10, actuationFamily: 'sram-1to1-exact' },
  sourceUrl: 'https://github.com/boothinator/derailleur-analysis',
  sourceRef: 'Cable pull about 3.00 mm/shift measured on SL-GX-A1 (MIT).',
  quote: 'Cable Pull: 3.00 mm/shift',
});
shifter({
  id: 'shifter-campagnolo-chorus-12',
  brand: 'Campagnolo',
  model: 'Chorus 12 mechanical shifter',
  modelCode: null,
  specs: { speeds: 12, actuationFamily: 'campagnolo-mech-12', chainType: 'campagnolo' },
  sourceUrl: PEDAL,
  sourceRef: 'Pedal Brief CC BY 4.0: Chorus 12 mechanical.',
  quote: 'Mechanical',
  attribution: 'Pedal Brief, CC BY 4.0',
});
shifter({
  id: 'shifter-microshift-advent',
  brand: 'microSHIFT',
  model: 'Advent 9-speed shifter',
  modelCode: null,
  specs: { speeds: 9, actuationFamily: 'microshift-advent' },
  sourceUrl: BIKEGREMLIN,
  sourceRef: 'Not a Shimano 9-speed match. Draft.',
  quote: 'Advent',
});
shifter({
  id: 'shifter-microshift-advent-x',
  brand: 'microSHIFT',
  model: 'Advent X shifter',
  modelCode: 'SB-M100A',
  specs: { speeds: 10, actuationFamily: 'microshift-advent-x' },
  sourceUrl: 'https://github.com/boothinator/derailleur-analysis',
  sourceRef: 'Cable pull about 3.41 mm/shift (MIT).',
  quote: 'Cable Pull: 3.41 mm/shift',
});

function crank(id, brand, model, speeds, chainrings, chainType, sourceUrl, sourceRef, extra = {}) {
  const teeth = chainrings.filter((tooth) => Number.isFinite(tooth));
  add({
    id,
    category: 'crankset',
    brand,
    model,
    modelCode: extra.modelCode || null,
    specs: {
      speeds,
      ringCount: extra.ringCount ?? (teeth.length || 1),
      chainrings: teeth,
      chainType,
    },
    sourceUrl,
    sourceRef,
    quote: extra.quote || '',
    attribution: extra.attribution,
    reviewStatus: extra.reviewStatus || 'draft',
  });
}
crank('crank-1x-32', 'Teaching', 'Single 32T chainring', 9, [32], 'standard', 'https://wisewheeling.com/rear-derailleur-capacity/', 'Teaching 1x ring. Front difference is 0. Not a branded crank.', { quote: '32T' });
crank('crank-zuzu-1x-unknown', 'Unknown', 'Single chainring, tooth count not recorded', 9, [], 'standard', C731, 'Zuzu\'s VG Sports kit did not record the chainring size. ringCount 1 is an assumption from the 11-42 wide-range cassette. Confirm on the bike.', { ringCount: 1, quote: '' });
crank('crank-shimano-105-50-34', 'Shimano', '105 FC-R7000 50-34T', 11, [50, 34], 'standard', 'https://productinfo.shimano.com/en/lineup/105-r7000-2x11', 'Pedal Brief CC BY 4.0: 105 R7000 chainrings include 50-34.', { quote: '50-34', attribution: 'Pedal Brief, CC BY 4.0', modelCode: 'FC-R7000' });
crank('crank-shimano-105-52-36', 'Shimano', '105 FC-R7000 52-36T', 11, [52, 36], 'standard', 'https://productinfo.shimano.com/en/lineup/105-r7000-2x11', 'Pedal Brief CC BY 4.0: 105 R7000 chainrings include 52-36.', { quote: '52-36', attribution: 'Pedal Brief, CC BY 4.0', modelCode: 'FC-R7000' });
crank('crank-shimano-105-46-36', 'Shimano', '105 FC-RS510 46-36T', 11, [46, 36], 'standard', 'https://productinfo.shimano.com/en/lineup/105-r7000-2x11', 'Pedal Brief maker_wording includes FC-RS510 46-36T.', { quote: '46-36', attribution: 'Pedal Brief, CC BY 4.0', modelCode: 'FC-RS510' });
crank('crank-shimano-grx-46-30', 'Shimano', 'GRX 46-30T', 11, [46, 30], 'standard', PEDAL, 'Common GRX 2x ratio. Draft against the current GRX lineup page.', { quote: '46-30' });
crank('crank-mtb-36', 'Teaching', 'Single 36T chainring', 12, [36], 'standard', 'https://wisewheeling.com/rear-derailleur-capacity/', 'Teaching 1x ring.', { quote: '36T' });
crank('crank-mtb-30', 'Teaching', 'Single 30T chainring', 12, [30], 'eagle', SRAM_XD, 'Teaching Eagle 1x ring. Draft.', { quote: '30T' });
crank('crank-sram-gx-32', 'SRAM', 'GX Eagle 32T', 12, [32], 'eagle', SRAM_XD, 'Draft Eagle chainring.', { quote: '32T' });
crank('crank-sram-transmission-32', 'SRAM', 'Transmission 32T', 12, [32], 't-type', 'https://www.sram.com/en/learn/understanding-udh-and-full-mount', 'Draft T-Type ring.', { quote: '32T' });
crank('crank-road-48-31', 'Teaching', 'Gravel 48-31T', 11, [48, 31], 'standard', PEDAL, 'Teaching sub-compact. Not a specific groupset row.', { quote: '48-31' });
crank('crank-campagnolo-50-34', 'Campagnolo', '50-34T', 12, [50, 34], 'campagnolo', PEDAL, 'Pedal Brief lists 50/34 on several Campagnolo road groups. Draft.', { quote: '50/34', attribution: 'Pedal Brief, CC BY 4.0' });

function fd(id, brand, model, speeds, maxRing, chainType, sourceUrl, sourceRef) {
  add({
    id,
    category: 'front_derailleur',
    brand,
    model,
    modelCode: null,
    specs: { speeds, maxRing, chainType },
    sourceUrl,
    sourceRef,
    quote: `${speeds}-speed`,
  });
}
fd('fd-shimano-r7000', 'Shimano', '105 FD-R7000', 11, 53, 'standard', 'https://productinfo.shimano.com/en/lineup/105-r7000-2x11', 'Pedal Brief: 105 R7000 is 2x11 mechanical.');
fd('fd-shimano-r7100', 'Shimano', '105 12-speed front derailleur', 12, 52, 'standard', 'https://productinfo.shimano.com/en/lineup/105-r7100-2x12', 'Pedal Brief: 105 R7100 is 2x12. Draft model code.');
fd('fd-shimano-grx-rx810', 'Shimano', 'GRX FD-RX810', 11, 48, 'standard', PEDAL, 'Draft GRX front derailleur for 2x.');
fd('fd-shimano-deore-m5100', 'Shimano', 'Deore 2x11 front derailleur', 11, 38, 'standard', SHIMANO_PDF, 'Draft. Only for a 2x mountain crank.');
fd('fd-sram-force-axs', 'SRAM', 'Force AXS front derailleur', 12, 50, 'flattop', 'https://www.sram.com/globalassets/document-hierarchy/compatibility-map/road/axs-components-compatibility-map.pdf', 'Road AXS front derailleur. Draft.');
fd('fd-campagnolo-chorus-12', 'Campagnolo', 'Chorus 12 front derailleur', 12, 52, 'campagnolo', PEDAL, 'Pedal Brief Chorus 12 mechanical. Draft.');

function lever(id, brand, model, brakeType, fluid, sourceUrl, sourceRef) {
  add({
    id,
    category: 'brake_lever',
    brand,
    model,
    modelCode: null,
    specs: { brakeType, fluid },
    sourceUrl,
    sourceRef,
    quote: fluid ? `${brakeType} ${fluid}` : brakeType,
  });
}
function caliper(id, brand, model, brakeType, fluid, caliperMount, sourceUrl, sourceRef) {
  add({
    id,
    category: 'brake_caliper',
    brand,
    model,
    modelCode: null,
    specs: { brakeType, fluid, caliperMount },
    sourceUrl,
    sourceRef,
    quote: caliperMount || brakeType,
  });
}
const SRAM_BRAKE = 'https://www.sram.com/globalassets/document-hierarchy/compatibility-map/mtb-and-road-hydraulic-disc-brake-lever-and-caliper-compatibility.pdf';
lever('lever-shimano-bl-mt200', 'Shimano', 'BL-MT200', 'hydraulic-disc', 'mineral', SHIMANO_PDF, 'Shimano MT200 lever. Mineral oil. Draft until the product page is re-opened.');
caliper('caliper-shimano-br-mt200', 'Shimano', 'BR-MT200', 'hydraulic-disc', 'mineral', 'post-mount', SHIMANO_PDF, 'Chart lists BR-MT200 as hydraulic with BL-MT200. Mineral oil. Post mount. Draft.');
lever('lever-shimano-bl-m6100', 'Shimano', 'Deore BL-M6100', 'hydraulic-disc', 'mineral', SHIMANO_PDF, 'Deore hydraulic lever. Mineral oil. Draft.');
caliper('caliper-shimano-br-m6100', 'Shimano', 'Deore BR-M6100', 'hydraulic-disc', 'mineral', 'post-mount', SHIMANO_PDF, 'Deore hydraulic caliper. Mineral oil. Draft.');
lever('lever-shimano-bl-mt401', 'Shimano', 'BL-MT401', 'hydraulic-disc', 'mineral', SHIMANO_PDF, 'Shimano MT401-series lever. Mineral oil. Draft the exact code.');
caliper('caliper-shimano-br-mt410', 'Shimano', 'BR-MT410', 'hydraulic-disc', 'mineral', 'post-mount', SHIMANO_PDF, 'Draft mineral-oil caliper in the MT400 family.');
lever('lever-sram-level', 'SRAM', 'Level brake lever', 'hydraulic-disc', 'dot', SRAM_BRAKE, 'SRAM Level uses DOT fluid. Draft.');
caliper('caliper-sram-level', 'SRAM', 'Level caliper', 'hydraulic-disc', 'dot', 'post-mount', SRAM_BRAKE, 'SRAM Level DOT, post mount. Draft.');
lever('lever-sram-code', 'SRAM', 'Code brake lever', 'hydraulic-disc', 'dot', SRAM_BRAKE, 'SRAM Code uses DOT fluid. Draft.');
caliper('caliper-sram-code', 'SRAM', 'Code caliper', 'hydraulic-disc', 'dot', 'post-mount', SRAM_BRAKE, 'SRAM Code DOT, post mount. Draft.');
lever('lever-sram-maven', 'SRAM', 'Maven brake lever', 'hydraulic-disc', 'mineral', SRAM_BRAKE, 'SRAM Maven uses mineral oil, unlike Code and Level. Draft.');
caliper('caliper-sram-maven', 'SRAM', 'Maven caliper', 'hydraulic-disc', 'mineral', 'post-mount', SRAM_BRAKE, 'SRAM Maven mineral oil. Draft.');
lever('lever-tektro-hd-m275', 'Tektro', 'HD-M275 lever', 'hydraulic-disc', null, 'https://www.tektro.com/', 'Fluid left blank so a missing fluid cannot pass as mineral or DOT. Draft.');
caliper('caliper-tektro-hd-m275', 'Tektro', 'HD-M275 caliper', 'hydraulic-disc', null, 'post-mount', 'https://www.tektro.com/', 'Fluid blank on purpose. Draft.');
lever('lever-avid-bb7', 'Avid', 'BB7 lever', 'mechanical-disc', null, 'https://www.sram.com/en/sram', 'Avid BB7 is a cable disc brake. No fluid.');
caliper('caliper-avid-bb7', 'Avid', 'BB7 mechanical caliper', 'mechanical-disc', null, 'post-mount', 'https://www.sram.com/en/sram', 'Cable-actuated disc caliper. Draft mount: post-mount version.');
lever('lever-shimano-st-r7020', 'Shimano', '105 ST-R7020 hydraulic', 'hydraulic-disc', 'mineral', 'https://productinfo.shimano.com/en/lineup/105-r7000-2x11', 'Pedal Brief: 105 R7000 offers hydraulic disc. Mineral oil. Draft the lever code.');
caliper('caliper-shimano-br-flat-105', 'Shimano', '105 hydraulic flat-mount caliper', 'hydraulic-disc', 'mineral', 'flat-mount', 'https://productinfo.shimano.com/en/lineup/105-r7000-2x11', 'Flat-mount road caliper. Draft model code. Pedal Brief says the R7000 chart mentions a hydraulic disc brake.');
caliper('caliper-shimano-br-r7000-rim', 'Shimano', '105 BR-R7000 rim caliper', 'rim-caliper', null, null, 'https://productinfo.shimano.com/en/lineup/105-r7000-2x11', 'Pedal Brief maker_wording: Caliper Brake BR-R7000.');
lever('lever-shimano-st-r7000-rim', 'Shimano', '105 ST-R7000 rim', 'rim-caliper', null, 'https://productinfo.shimano.com/en/lineup/105-r7000-2x11', 'Mechanical rim-brake lever pairing for BR-R7000. Draft.');
lever('lever-vbrake', 'Shimano', 'V-brake lever', 'v-brake', null, SHIMANO_PDF, 'Linear-pull V-brake lever. Draft.');
caliper('caliper-vbrake', 'Shimano', 'V-brake', 'v-brake', null, null, SHIMANO_PDF, 'V-brake arms. No disc mount.');
caliper('caliper-shimano-br-post-105', 'Shimano', '105 hydraulic post-mount caliper', 'hydraulic-disc', 'mineral', 'post-mount', SHIMANO_PDF, 'Post-mount mineral caliper used so a flat-mount frame can show the adapter warning. Draft.');

for (const size of [140, 160, 180, 203, 220]) {
  for (const mount of ['6-bolt', 'center-lock']) {
    const slug = mount === '6-bolt' ? '6bolt' : 'centerlock';
    add({
      id: `rotor-${slug}-${size}`,
      category: 'rotor',
      brand: 'Standard',
      model: `${size} mm ${mount} rotor`,
      modelCode: null,
      specs: { sizeMm: size, rotorMount: mount },
      sourceUrl: SHIMANO_PDF,
      sourceRef: `Generic ${size} mm ${mount} rotor. Common disc size, not a specific Shimano or SRAM model number. Draft.`,
      quote: `${size} mm`,
    });
  }
}

function frame(id, model, hanger, brakeStyle, caliperMount, maxRotorMm, sourceRef, fit = {}) {
  add({
    id,
    category: 'frame',
    brand: 'Teaching',
    model,
    modelCode: null,
    specs: {
      hanger,
      brakeStyle,
      caliperMount,
      maxRotorMm,
      phase: 'minimal',
      bbShell: fit.bbShell ?? 'bsa',
      bbWidthMm: fit.bbWidthMm ?? 73,
      rearAxle: fit.rearAxle ?? 'qr-135',
      frontAxle: fit.frontAxle ?? 'qr-100',
      headset: fit.headset ?? 'zs44-ec44',
      seatpostMm: fit.seatpostMm ?? 30.9,
      wheelSize: fit.wheelSize ?? null,
    },
    sourceUrl: 'https://www.sram.com/en/learn/understanding-udh-and-full-mount',
    sourceRef,
    quote: hanger,
  });
}
const mtbFit = { bbShell: 'bsa', bbWidthMm: 73, rearAxle: 'qr-135', frontAxle: 'qr-100', headset: 'zs44-ec44', seatpostMm: 30.9 };
frame('frame-mtb-standard-post-180', 'Mountain frame, standard hanger, post mount, 180 mm max', 'standard', 'disc', 'post-mount', 180, 'Teaching hardtail. BSA 73 mm, QR 135 rear, QR 100 front. Not a measured bike.', mtbFit);
frame('frame-mtb-standard-post-203', 'Mountain frame, standard hanger, post mount, 203 mm max', 'standard', 'disc', 'post-mount', 203, 'Teaching hardtail. BSA 73 mm, QR 135 rear.', mtbFit);
frame('frame-mtb-udh-post-203', 'Mountain frame, UDH, post mount, 203 mm max', 'udh', 'disc', 'post-mount', 203, 'UDH boost teaching frame. 12x148 rear, 15x110 front, BSA 73 mm.', { bbShell: 'bsa', bbWidthMm: 73, rearAxle: '12x148', frontAxle: '15x110', headset: 'zs44-ec44', seatpostMm: 31.6 });
frame('frame-road-flat-160', 'Road frame, standard hanger, flat mount, 160 mm max', 'standard', 'disc', 'flat-mount', 160, 'Teaching road disc frame. BB86, 12x142 rear, 12x100 front, 27.2 mm post.', { bbShell: 'bb86', bbWidthMm: 86, rearAxle: '12x142', frontAxle: '12x100', headset: 'integrated-is42', seatpostMm: 27.2 });
frame('frame-road-rim', 'Road frame, rim brakes, standard hanger', 'standard', 'rim', null, null, 'Teaching rim-brake road frame. BSA 68 mm, QR 130 rear.', { bbShell: 'bsa', bbWidthMm: 68, rearAxle: 'qr-130', frontAxle: 'qr-100', headset: 'ec34', seatpostMm: 27.2 });
frame('frame-direct-mount-post-180', 'Frame, direct-mount hanger, post mount, 180 mm max', 'direct-mount', 'disc', 'post-mount', 180, 'Direct-mount hanger is not UDH. BSA 73, QR 135.', mtbFit);
frame('frame-gravel-flat-180', 'Gravel frame, standard hanger, flat mount, 180 mm max', 'standard', 'disc', 'flat-mount', 180, 'Teaching gravel frame. T47 internal, 12x142, 12x100.', { bbShell: 't47', bbWidthMm: 86, rearAxle: '12x142', frontAxle: '12x100', headset: 'integrated-is42', seatpostMm: 27.2 });
frame('frame-mtb-post-140', 'Mountain frame, standard hanger, post mount, 140 mm max', 'standard', 'disc', 'post-mount', 140, 'Small-rotor teaching frame. BSA 73, QR 135.', mtbFit);
frame('frame-pf30-135', 'Press-fit PF30 frame, QR 135', 'standard', 'disc', 'post-mount', 180, 'PF30 shell. A BSA mid-drive does not pass on this frame.', { bbShell: 'pf30', bbWidthMm: 73, rearAxle: 'qr-135', frontAxle: 'qr-100', headset: 'zs44-ec44', seatpostMm: 30.9 });
frame('frame-bb100', 'BSA 100 mm shell frame, QR 135', 'standard', 'disc', 'post-mount', 180, 'Teaching 100 mm BSA shell for a 100 mm mid-drive. Draft width.', { bbShell: 'bsa', bbWidthMm: 100, rearAxle: 'qr-135', frontAxle: 'qr-100', headset: 'zs44-ec44', seatpostMm: 30.9 });

add({
  id: 'extender-vg-sports',
  category: 'hanger_extender',
  brand: 'VG Sports',
  model: 'Derailleur hanger extender from the 9-speed kit',
  modelCode: null,
  specs: { style: 'hanger-extender' },
  sourceUrl: C731,
  sourceRef: 'The owner\'s VG Sports 9-speed kit (ASIN B09VBNTGCD) includes a derailleur hanger extender. No shop link. The extender does not change the published max cog; the 8-tooth window is a practitioner rule.',
  quote: 'hanger extender',
});
add({
  id: 'extender-roadlink-style',
  category: 'hanger_extender',
  brand: 'Teaching',
  model: 'RoadLink-style hanger extender',
  modelCode: null,
  specs: { style: 'hanger-extender' },
  sourceUrl: BIKEGREMLIN,
  sourceRef: 'Teaching name for a road hanger extender. Not a shop listing.',
  quote: 'hanger extender',
});

const HUB_AXLE = {
  'hub-hg-m-6bolt': 'qr-135',
  'hub-hg-m-centerlock': '12x142',
  'hub-hg-l-centerlock': '12x142',
  'hub-hg-l2-centerlock': '12x142',
  'hub-hg-s-6bolt': 'qr-135',
  'hub-microspline-centerlock': '12x148',
  'hub-microspline-6bolt': '12x148',
  'hub-xd-6bolt': '12x148',
  'hub-xd-centerlock': '12x148',
  'hub-xdr-centerlock': '12x142',
  'hub-campagnolo-centerlock': '12x142',
  'hub-n3w-centerlock': '12x142',
  'hub-linkglide-centerlock': 'qr-135',
};
for (const part of parts) {
  if (HUB_AXLE[part.id]) part.specs.axle = HUB_AXLE[part.id];
  if (part.category === 'crankset' && part.specs.spindle == null) {
    if (part.id.includes('campagnolo')) part.specs.spindle = 'campagnolo';
    else if (part.id.includes('sram') || part.id.includes('mtb-30')) part.specs.spindle = 'sram-dub';
    else part.specs.spindle = 'shimano-24';
  }
}

const BAFANG = 'https://www.bafang-e.com/';
const PARK_BB = 'https://www.parktool.com/en-us/blog/repair-help/bottom-bracket-standards';
const PARK_WHEEL = 'https://www.parktool.com/en-us/blog/repair-help/wheel-removal-and-installation';

function motor(entry) {
  add({
    category: 'motor',
    reviewStatus: 'draft',
    sourceUrl: BAFANG,
    ...entry,
    specs: {
      chainrings: [],
      ringCount: 1,
      speeds: null,
      chainType: 'standard',
      spindle: null,
      freehub: null,
      rotorMount: null,
      axle: null,
      sprocket: null,
      protocol: null,
      connector: null,
      bbShells: [],
      bbWidths: [],
      position: entry.specs?.motorType === 'mid-drive' ? 'bottom' : 'rear',
      ...entry.specs,
    },
  });
}
motor({
  id: 'motor-bbs02-48',
  brand: 'Bafang',
  model: 'BBS02 48 V mid-drive',
  modelCode: 'BBS02',
  specs: { motorType: 'mid-drive', voltage: 48, powerW: 750, protocol: 'uart', bbShells: ['bsa'], bbWidths: [68, 73], chainrings: [46], ringCount: 1, speeds: 9, chainType: 'standard' },
  sourceRef: 'Draft. BBS02 is a mid-drive for a threaded BSA shell, 68 or 73 mm, in a 48 V version. It replaces the crank. Confirm the label on the unit. 36 V BBS02 is a different motor.',
  quote: 'BSA 68-73 mm, 48 V',
});
motor({
  id: 'motor-bbs02-36',
  brand: 'Bafang',
  model: 'BBS02 36 V mid-drive',
  modelCode: 'BBS02',
  specs: { motorType: 'mid-drive', voltage: 36, powerW: 500, protocol: 'uart', bbShells: ['bsa'], bbWidths: [68, 73], chainrings: [44], ringCount: 1, speeds: 9, chainType: 'standard' },
  sourceRef: 'Draft. 36 V BBS02 is not the 48 V motor. Same BSA 68/73 shell.',
  quote: '36 V',
});
motor({
  id: 'motor-bbshd-100',
  brand: 'Bafang',
  model: 'BBSHD 100 mm 48 V mid-drive',
  modelCode: 'BBSHD',
  specs: { motorType: 'mid-drive', voltage: 48, powerW: 1000, protocol: 'uart', bbShells: ['bsa'], bbWidths: [100], chainrings: [42], ringCount: 1, speeds: 9, chainType: 'standard' },
  sourceRef: 'Draft. This record is the 100 mm BBSHD only. It does not pass on a 68 or 73 mm shell.',
  quote: '100 mm',
});
motor({
  id: 'motor-tsdz2-48',
  brand: 'Tongsheng',
  model: 'TSDZ2 48 V mid-drive',
  modelCode: 'TSDZ2',
  specs: { motorType: 'mid-drive', voltage: 48, powerW: 500, protocol: 'tongsheng', bbShells: ['bsa'], bbWidths: [68, 73], chainrings: [42], ringCount: 1, speeds: 9, chainType: 'standard' },
  sourceRef: 'Draft. TSDZ2 installs in a BSA 68/73 mm shell and uses its own protocol, not Bafang UART.',
  quote: 'BSA 68-73',
});
motor({
  id: 'motor-hub-geared-135',
  brand: 'Bafang',
  model: '48 V geared rear hub, QR 135, HG',
  modelCode: null,
  specs: { motorType: 'geared-hub', voltage: 48, powerW: 500, protocol: 'uart', axle: 'qr-135', freehub: 'hg-m', rotorMount: '6-bolt', sprocket: 'cassette', speeds: 9 },
  sourceRef: 'Draft teaching geared hub motor: 135 mm quick release, HG cassette body, 6-bolt rotor, 48 V. Confirm the axle stamped on the real motor.',
  quote: 'QR 135, HG',
});
motor({
  id: 'motor-hub-geared-148',
  brand: 'Bafang',
  model: '48 V geared rear hub, 12x148 Boost, HG',
  modelCode: null,
  specs: { motorType: 'geared-hub', voltage: 48, powerW: 750, protocol: 'uart', axle: '12x148', freehub: 'hg-m', rotorMount: '6-bolt', sprocket: 'cassette', speeds: 9 },
  sourceRef: 'Draft. 12x148 Boost hub motor. It does not fit a QR 135 frame.',
  quote: '12x148',
});
motor({
  id: 'motor-hub-direct-135',
  brand: 'Teaching',
  model: '48 V direct-drive rear hub, QR 135, HG',
  modelCode: null,
  specs: { motorType: 'direct-drive-hub', voltage: 48, powerW: 1000, protocol: 'uart', axle: 'qr-135', freehub: 'hg-m', rotorMount: '6-bolt', sprocket: 'cassette', speeds: 9 },
  sourceRef: 'Draft direct-drive hub. Same axle and cassette checks as a geared hub. Torque arm still applies.',
  quote: 'direct-drive QR 135',
});
motor({
  id: 'motor-hub-single-135',
  brand: 'Teaching',
  model: '48 V rear hub, single sprocket, QR 135',
  modelCode: null,
  specs: { motorType: 'geared-hub', voltage: 48, powerW: 350, protocol: 'uart', axle: 'qr-135', freehub: null, rotorMount: '6-bolt', sprocket: 'single', speeds: 1, chainType: 'standard' },
  sourceRef: 'Draft single-sprocket hub motor. A cassette does not mount. Shifter and derailleur are not required.',
  quote: 'single sprocket',
});

function battery(id, voltage, amps, connector, model) {
  add({
    id,
    category: 'battery',
    brand: 'Teaching',
    model,
    modelCode: null,
    specs: { voltage, maxCurrent: amps, connector },
    sourceUrl: BAFANG,
    sourceRef: `Draft pack. Nominal ${voltage} V, BMS ${amps} A, ${connector} plug. No capacity claim and no shop listing.`,
    quote: `${voltage} V ${connector}`,
  });
}
battery('battery-36-xt60', 36, 20, 'xt60', '36 V pack, XT60, 20 A BMS');
battery('battery-48-xt60', 48, 30, 'xt60', '48 V pack, XT60, 30 A BMS');
battery('battery-48-xt90', 48, 40, 'xt90', '48 V pack, XT90, 40 A BMS');
battery('battery-52-xt60', 52, 30, 'xt60', '52 V pack, XT60, 30 A BMS');

function controller(id, voltages, amps, powerW, connector, protocol, model, ports = {}) {
  const uartPorts = {
    throttleSignal: 'hall',
    throttleConnector: 'julet-3',
    throttleProtocol: 'analog',
    displayConnector: 'julet-5',
    pasKind: 'magnet',
    pasMagnets: [8, 12],
    pasConnector: 'julet-3',
    brakeSwitch: 'normally-open',
    brakeConnector: 'julet-2',
    speedSensor: 'spoke-magnet',
    speedConnector: 'julet-2',
    lightVoltage: 6,
    lightConnector: 'julet-2',
  };
  const presets = {
    uart: uartPorts,
    can: { ...uartPorts, throttleConnector: 'bafang-can-3', displayConnector: 'bafang-can-5' },
    tongsheng: {
      ...uartPorts,
      throttleConnector: 'tongsheng',
      displayConnector: 'tongsheng',
      pasKind: 'torque',
      pasMagnets: [],
      pasConnector: 'tongsheng',
      brakeConnector: 'tongsheng',
      speedConnector: 'tongsheng',
      lightConnector: 'tongsheng',
    },
  };
  add({
    id,
    category: 'controller',
    brand: 'Teaching',
    model,
    modelCode: null,
    specs: {
      acceptedVoltages: voltages,
      maxCurrent: amps,
      powerW,
      batteryConnector: connector,
      protocol,
      ...(presets[protocol] || uartPorts),
      ...ports,
    },
    sourceUrl: BAFANG,
    sourceRef: `Draft controller. Accepts ${voltages.join('/')} V, ${amps} A, ${powerW} W, battery plug ${connector}, data protocol ${protocol}. Throttle fit is signal + plug + analog-or-bus, not pack voltage.`,
    quote: voltages.join('/'),
  });
}
controller('controller-48-uart-xt60', [48], 25, 1000, 'xt60', 'uart', '48 V UART controller, 25 A, XT60');
controller('controller-36-uart-xt60', [36], 15, 500, 'xt60', 'uart', '36 V UART controller, 15 A, XT60');
controller('controller-48-can-xt60', [48], 25, 1000, 'xt60', 'can', '48 V CAN controller, 25 A, XT60');
controller('controller-48-uart-xt90', [48], 35, 1500, 'xt90', 'uart', '48 V UART controller, 35 A, XT90');
controller('controller-tongsheng-48', [48], 18, 500, 'xt60', 'tongsheng', '48 V Tongsheng controller, 18 A, XT60');
controller('controller-kt-36', [36], 15, 500, 'xt60', 'kt', 'KT 36 V controller', {
  throttleSignal: 'hall', throttleConnector: 'kt-3', throttleProtocol: 'analog', displayConnector: 'kt-5',
  pasKind: 'magnet', pasMagnets: [12], pasConnector: 'kt-3', brakeSwitch: 'normally-open', brakeConnector: 'kt-2',
  speedSensor: 'spoke-magnet', speedConnector: 'kt-2', lightVoltage: 6, lightConnector: 'kt-2',
});
controller('controller-kt-48', [48], 22, 750, 'xt60', 'kt', 'KT 48 V controller', {
  throttleSignal: 'hall', throttleConnector: 'kt-3', throttleProtocol: 'analog', displayConnector: 'kt-5',
  pasKind: 'magnet', pasMagnets: [12], pasConnector: 'kt-3', brakeSwitch: 'normally-open', brakeConnector: 'kt-2',
  speedSensor: 'spoke-magnet', speedConnector: 'kt-2', lightVoltage: 6, lightConnector: 'kt-2',
});
controller('controller-kt-48-nc', [48], 22, 750, 'xt60', 'kt', 'KT 48 V controller, normally-closed brakes', {
  throttleSignal: 'hall', throttleConnector: 'kt-3', throttleProtocol: 'analog', displayConnector: 'kt-5',
  pasKind: 'magnet', pasMagnets: [12], pasConnector: 'kt-3', brakeSwitch: 'normally-closed', brakeConnector: 'kt-2',
  speedSensor: 'spoke-magnet', speedConnector: 'kt-2', lightVoltage: 6, lightConnector: 'kt-2',
});
controller('controller-km5s-48', [48], 18, 500, 'xt60', 'km5s', 'Generic 48 V KM5S controller', {
  throttleSignal: 'hall', throttleConnector: 'sm-3', throttleProtocol: 'analog', displayConnector: 'sm-5',
  pasKind: 'magnet', pasMagnets: [5, 12], pasConnector: 'sm-3', brakeSwitch: 'normally-open', brakeConnector: 'sm-2',
  speedSensor: 'spoke-magnet', speedConnector: 'sm-2', lightVoltage: 12, lightConnector: 'sm-2',
});
controller('controller-km5s-36', [36], 15, 350, 'xt60', 'km5s', 'Generic 36 V KM5S controller', {
  throttleSignal: 'hall', throttleConnector: 'sm-3', throttleProtocol: 'analog', displayConnector: 'sm-5',
  pasKind: 'magnet', pasMagnets: [5, 12], pasConnector: 'sm-3', brakeSwitch: 'normally-open', brakeConnector: 'sm-2',
  speedSensor: 'spoke-magnet', speedConnector: 'sm-2', lightVoltage: 12, lightConnector: 'sm-2',
});
controller('controller-bullet-36', [36], 12, 350, 'bullet', 'km5s', '36 V controller, bullet plugs', {
  throttleSignal: 'hall', throttleConnector: 'bullet', throttleProtocol: 'analog', displayConnector: 'sm-5',
  pasKind: 'magnet', pasMagnets: [5], pasConnector: 'bullet', brakeSwitch: 'normally-open', brakeConnector: 'bullet',
  speedSensor: 'spoke-magnet', speedConnector: 'bullet', lightVoltage: 36, lightConnector: 'bullet',
});
controller('controller-pot-48', [48], 15, 500, 'xt60', 'km5s', '48 V controller, potentiometer throttle', {
  throttleSignal: 'potentiometer', throttleConnector: 'sm-3', throttleProtocol: 'analog', displayConnector: 'sm-5',
  pasKind: 'magnet', pasMagnets: [8], pasConnector: 'sm-3', brakeSwitch: 'normally-closed', brakeConnector: 'sm-2',
  speedSensor: 'spoke-magnet', speedConnector: 'sm-2', lightVoltage: 6, lightConnector: 'sm-2',
});
controller('controller-uart-bus-throttle', [48], 25, 1000, 'xt60', 'uart', '48 V UART controller, bus throttle port', {
  throttleSignal: 'hall', throttleConnector: 'julet-3', throttleProtocol: 'uart', displayConnector: 'julet-5',
});

function display(id, protocol, connector, model) {
  add({
    id,
    category: 'display',
    brand: 'Teaching',
    model,
    modelCode: null,
    specs: { protocol, connector },
    sourceUrl: BAFANG,
    sourceRef: `Draft display. Protocol ${protocol}, plug ${connector}. Both have to match the controller.`,
    quote: protocol,
  });
}
display('display-uart', 'uart', 'julet-5', 'UART display, Julet 5-pin');
display('display-can', 'can', 'bafang-can-5', 'CAN display, Bafang CAN plug');
display('display-tongsheng', 'tongsheng', 'tongsheng', 'Tongsheng display');
display('display-850c', 'uart', 'julet-5', '850C-style UART display');
display('display-500c', 'uart', 'julet-5', '500C-style UART display');
display('display-dpc14', 'uart', 'julet-5', 'DPC-14-style UART display');
display('display-dpc18', 'can', 'bafang-can-5', 'DP C18-style CAN display');
display('display-uart-sm', 'uart', 'sm-5', 'UART display with an SM plug');
display('display-kt-lcd3', 'kt', 'kt-5', 'KT LCD3');
display('display-kt-lcd8', 'kt', 'kt-5', 'KT LCD8H');
display('display-kt-lcd1', 'kt', 'kt-5', 'KT LCD1');
display('display-sw900', 'km5s', 'sm-5', 'SW900-style KM5S display');

function bb(id, shell, spindle, widths, model) {
  add({
    id,
    category: 'bottom_bracket',
    brand: 'Teaching',
    model,
    modelCode: null,
    specs: { shell, spindle, widths },
    sourceUrl: PARK_BB,
    sourceRef: `Draft bottom bracket. Shell ${shell}, spindle ${spindle}, widths ${widths.join('/')} mm.`,
    quote: `${shell} ${spindle}`,
  });
}
bb('bb-bsa-shimano-24', 'bsa', 'shimano-24', [68, 73], 'BSA bottom bracket for 24 mm spindle');
bb('bb-bsa-68-shimano-24', 'bsa', 'shimano-24', [68], 'BSA 68 mm bottom bracket for 24 mm spindle');
bb('bb-bsa-dub', 'bsa', 'sram-dub', [68, 73], 'BSA bottom bracket for SRAM DUB');
bb('bb-bb86-shimano-24', 'bb86', 'shimano-24', [86], 'BB86 bottom bracket for 24 mm spindle');
bb('bb-t47-shimano-24', 't47', 'shimano-24', [86], 'T47 bottom bracket for 24 mm spindle');
bb('bb-pf30-30', 'pf30', '30mm', [68, 73], 'PF30 bottom bracket for 30 mm spindle');
bb('bb-bsa-square', 'bsa', 'square-taper', [68, 73], 'BSA square-taper bottom bracket');

for (const [id, axle, model] of [
  ['front-hub-qr-100', 'qr-100', 'Front hub, quick release 100 mm'],
  ['front-hub-12x100', '12x100', 'Front hub, 12x100 thru-axle'],
  ['front-hub-15x100', '15x100', 'Front hub, 15x100 thru-axle'],
  ['front-hub-15x110', '15x110', 'Front hub, 15x110 Boost'],
]) {
  add({
    id,
    category: 'front_hub',
    brand: 'Teaching',
    model,
    modelCode: null,
    specs: { axle },
    sourceUrl: PARK_WHEEL,
    sourceRef: `Draft front hub. Axle ${axle}.`,
    quote: axle,
  });
}

for (const [id, standard, model] of [
  ['headset-zs44-ec44', 'zs44-ec44', 'Headset, ZS44 upper / EC44 lower'],
  ['headset-integrated-is42', 'integrated-is42', 'Integrated headset, IS42'],
  ['headset-ec34', 'ec34', 'Headset, EC34 threaded-style external'],
]) {
  add({
    id,
    category: 'headset',
    brand: 'Teaching',
    model,
    modelCode: null,
    specs: { standard },
    sourceUrl: 'https://www.parktool.com/en-us/blog/repair-help/headset-standards',
    sourceRef: `Draft headset. SHIS-style id ${standard}.`,
    quote: standard,
  });
}

for (const diameter of [27.2, 30.9, 31.6]) {
  add({
    id: `seatpost-${String(diameter).replace('.', '-')}`,
    category: 'seatpost',
    brand: 'Teaching',
    model: `${diameter} mm seatpost`,
    modelCode: null,
    specs: { diameterMm: diameter },
    sourceUrl: 'https://www.parktool.com/en-us/blog/repair-help/seatpost-installation',
    sourceRef: `Draft seatpost diameter ${diameter} mm. A larger post does not fit. A smaller post is a shim warning.`,
    quote: `${diameter} mm`,
  });
}

add({
  id: 'torque-arm-qr-135',
  category: 'torque_arm',
  brand: 'Teaching',
  model: 'Torque arm for a QR 135 hub motor',
  modelCode: null,
  specs: { style: 'torque-arm', axle: 'qr-135' },
  sourceUrl: PARK_WHEEL,
  sourceRef: 'Draft torque arm for a quick-release hub motor. The checker treats any torque arm as present. The axle match is still the frame rule.',
  quote: 'torque arm',
});
add({
  id: 'torque-arm-12x148',
  category: 'torque_arm',
  brand: 'Teaching',
  model: 'Torque arm for a 12x148 hub motor',
  modelCode: null,
  specs: { style: 'torque-arm', axle: '12x148' },
  sourceUrl: PARK_WHEEL,
  sourceRef: 'Draft torque arm noted for a Boost thru-axle hub motor.',
  quote: 'torque arm',
});

motor({
  id: 'motor-hub-geared-36',
  brand: 'Bafang',
  model: '36 V geared rear hub, QR 135, HG',
  modelCode: null,
  specs: { motorType: 'geared-hub', voltage: 36, powerW: 350, protocol: 'uart', position: 'rear', axle: 'qr-135', freehub: 'hg-m', rotorMount: '6-bolt', sprocket: 'cassette', speeds: 9 },
  sourceRef: 'Draft 36 V geared hub. It does not match a 48 V-only controller.',
  quote: '36 V QR 135',
});
motor({
  id: 'motor-m620-can',
  brand: 'Bafang',
  model: 'M620-style 48 V CAN mid-drive',
  modelCode: 'M620',
  specs: { motorType: 'mid-drive', voltage: 48, powerW: 1000, protocol: 'can', position: 'bottom', bbShells: null, bbWidths: null, chainrings: [46], ringCount: 1, speeds: 9 },
  sourceRef: 'Draft. CAN mid-drive. Shell and width are left blank so a guessed bottom bracket cannot pass.',
  quote: 'CAN mid-drive',
});
motor({
  id: 'motor-front-hub-36',
  brand: 'Teaching',
  model: '36 V geared front hub, QR 100',
  modelCode: null,
  specs: { motorType: 'geared-hub', voltage: 36, powerW: 250, protocol: 'uart', position: 'front', axle: 'qr-100', freehub: null, rotorMount: '6-bolt', sprocket: 'single', speeds: 1 },
  sourceRef: 'Draft front hub motor. It covers the front hub, not the rear hub. QR 100.',
  quote: 'front hub QR 100',
});
motor({
  id: 'motor-hub-kt-48',
  brand: 'Teaching',
  model: '48 V geared rear hub, KT protocol, QR 135',
  modelCode: null,
  specs: { motorType: 'geared-hub', voltage: 48, powerW: 500, protocol: 'kt', position: 'rear', axle: 'qr-135', freehub: 'hg-m', rotorMount: '6-bolt', sprocket: 'cassette', speeds: 9 },
  sourceRef: 'Draft hub motor that speaks KT, not Bafang UART.',
  quote: 'KT hub',
});

function accessory(category, rows, specNote) {
  for (const row of rows) {
    add({
      id: row.id,
      category,
      brand: 'Teaching',
      model: row.model,
      modelCode: null,
      specs: row.specs,
      sourceUrl: BAFANG,
      sourceRef: `Draft ${category}. ${specNote} ${row.note || ''}`.trim(),
      quote: row.quote || '',
    });
  }
}

accessory('throttle', [
  { id: 'throttle-hall-thumb-julet', model: 'Hall thumb throttle, Julet 3-pin', specs: { signal: 'hall', connector: 'julet-3', protocol: 'analog', style: 'thumb' }, quote: 'hall julet-3 analog' },
  { id: 'throttle-hall-twist-julet', model: 'Hall twist throttle, Julet 3-pin', specs: { signal: 'hall', connector: 'julet-3', protocol: 'analog', style: 'twist' }, quote: 'hall julet-3 analog' },
  { id: 'throttle-hall-half-julet', model: 'Hall half-twist throttle, Julet 3-pin', specs: { signal: 'hall', connector: 'julet-3', protocol: 'analog', style: 'half-twist' }, quote: 'hall julet-3 analog' },
  { id: 'throttle-hall-thumb-can', model: 'Hall thumb throttle, Bafang CAN plug', specs: { signal: 'hall', connector: 'bafang-can-3', protocol: 'analog', style: 'thumb' }, quote: 'hall can analog' },
  { id: 'throttle-hall-twist-can', model: 'Hall twist throttle, Bafang CAN plug', specs: { signal: 'hall', connector: 'bafang-can-3', protocol: 'analog', style: 'twist' }, quote: 'hall can analog' },
  { id: 'throttle-hall-thumb-kt', model: 'Hall thumb throttle, KT 3-pin', specs: { signal: 'hall', connector: 'kt-3', protocol: 'analog', style: 'thumb' }, quote: 'hall kt-3 analog' },
  { id: 'throttle-hall-twist-kt', model: 'Hall twist throttle, KT 3-pin', specs: { signal: 'hall', connector: 'kt-3', protocol: 'analog', style: 'twist' }, quote: 'hall kt-3 analog' },
  { id: 'throttle-hall-thumb-sm', model: 'Hall thumb throttle, SM 3-pin', specs: { signal: 'hall', connector: 'sm-3', protocol: 'analog', style: 'thumb' }, quote: 'hall sm-3 analog' },
  { id: 'throttle-hall-thumb-bullet', model: 'Hall thumb throttle, bullet wires', specs: { signal: 'hall', connector: 'bullet', protocol: 'analog', style: 'thumb' }, quote: 'hall bullet analog' },
  { id: 'throttle-pot-twist-sm', model: 'Potentiometer twist throttle, SM 3-pin', specs: { signal: 'potentiometer', connector: 'sm-3', protocol: 'analog', style: 'twist' }, quote: 'potentiometer sm-3' },
  { id: 'throttle-hall-tongsheng', model: 'Hall thumb throttle, Tongsheng plug', specs: { signal: 'hall', connector: 'tongsheng', protocol: 'analog', style: 'thumb' }, quote: 'hall tongsheng analog' },
  { id: 'throttle-uart-bus', model: 'UART bus thumb throttle', specs: { signal: 'hall', connector: 'julet-3', protocol: 'uart', style: 'thumb' }, note: 'This one speaks UART. It does not fit an analog throttle port.', quote: 'uart bus' },
], 'Fit is signal (hall or potentiometer), plug, and analog versus bus. Thumb versus twist is only the shape in the hand.');

accessory('pas', [
  { id: 'pas-8-julet', model: '8-magnet PAS, Julet', specs: { kind: 'magnet', magnetCount: 8, connector: 'julet-3' }, quote: '8 julet' },
  { id: 'pas-12-julet', model: '12-magnet PAS, Julet', specs: { kind: 'magnet', magnetCount: 12, connector: 'julet-3' }, quote: '12 julet' },
  { id: 'pas-5-julet', model: '5-magnet PAS, Julet', specs: { kind: 'magnet', magnetCount: 5, connector: 'julet-3' }, quote: '5 julet' },
  { id: 'pas-12-kt', model: '12-magnet PAS, KT plug', specs: { kind: 'magnet', magnetCount: 12, connector: 'kt-3' }, quote: '12 kt' },
  { id: 'pas-8-kt', model: '8-magnet PAS, KT plug', specs: { kind: 'magnet', magnetCount: 8, connector: 'kt-3' }, quote: '8 kt' },
  { id: 'pas-12-sm', model: '12-magnet PAS, SM plug', specs: { kind: 'magnet', magnetCount: 12, connector: 'sm-3' }, quote: '12 sm' },
  { id: 'pas-5-sm', model: '5-magnet PAS, SM plug', specs: { kind: 'magnet', magnetCount: 5, connector: 'sm-3' }, quote: '5 sm' },
  { id: 'pas-8-sm', model: '8-magnet PAS, SM plug', specs: { kind: 'magnet', magnetCount: 8, connector: 'sm-3' }, quote: '8 sm' },
  { id: 'pas-5-bullet', model: '5-magnet PAS, bullet wires', specs: { kind: 'magnet', magnetCount: 5, connector: 'bullet' }, quote: '5 bullet' },
  { id: 'pas-torque-tongsheng', model: 'Tongsheng torque sensor lead', specs: { kind: 'torque', magnetCount: null, connector: 'tongsheng' }, quote: 'torque' },
], 'Magnet discs have to be a count the controller lists. A torque sensor is a different kind.');

accessory('brake_sensor', [
  { id: 'brake-sensor-no-julet', model: 'Normally-open brake cutoff, Julet', specs: { switchType: 'normally-open', connector: 'julet-2', style: 'lever' }, quote: 'NO julet' },
  { id: 'brake-sensor-nc-julet', model: 'Normally-closed brake cutoff, Julet', specs: { switchType: 'normally-closed', connector: 'julet-2', style: 'lever' }, quote: 'NC julet' },
  { id: 'brake-sensor-no-sm', model: 'Normally-open brake cutoff, SM', specs: { switchType: 'normally-open', connector: 'sm-2', style: 'lever' }, quote: 'NO sm' },
  { id: 'brake-sensor-nc-sm', model: 'Normally-closed brake cutoff, SM', specs: { switchType: 'normally-closed', connector: 'sm-2', style: 'lever' }, quote: 'NC sm' },
  { id: 'brake-sensor-no-kt', model: 'Normally-open brake cutoff, KT', specs: { switchType: 'normally-open', connector: 'kt-2', style: 'lever' }, quote: 'NO kt' },
  { id: 'brake-sensor-nc-kt', model: 'Normally-closed brake cutoff, KT', specs: { switchType: 'normally-closed', connector: 'kt-2', style: 'lever' }, quote: 'NC kt' },
  { id: 'brake-sensor-no-hydraulic', model: 'Hydraulic reed cutoff, normally-open, Julet', specs: { switchType: 'normally-open', connector: 'julet-2', style: 'hydraulic' }, quote: 'NO hydraulic' },
  { id: 'brake-sensor-nc-hydraulic', model: 'Hydraulic reed cutoff, normally-closed, Julet', specs: { switchType: 'normally-closed', connector: 'julet-2', style: 'hydraulic' }, quote: 'NC hydraulic' },
  { id: 'brake-sensor-no-bullet', model: 'Normally-open brake cutoff, bullets', specs: { switchType: 'normally-open', connector: 'bullet', style: 'lever' }, quote: 'NO bullet' },
  { id: 'brake-sensor-tongsheng', model: 'Tongsheng brake cutoff, normally-open', specs: { switchType: 'normally-open', connector: 'tongsheng', style: 'lever' }, quote: 'NO tongsheng' },
], 'Open versus closed has to match the controller. The plug is a second check. Hydraulic versus lever is the shape, not a separate electrical family.');

accessory('speed_sensor', [
  { id: 'speed-julet', model: 'Spoke-magnet speed sensor, Julet', specs: { sensorType: 'spoke-magnet', connector: 'julet-2' }, quote: 'spoke julet' },
  { id: 'speed-sm', model: 'Spoke-magnet speed sensor, SM', specs: { sensorType: 'spoke-magnet', connector: 'sm-2' }, quote: 'spoke sm' },
  { id: 'speed-kt', model: 'Spoke-magnet speed sensor, KT', specs: { sensorType: 'spoke-magnet', connector: 'kt-2' }, quote: 'spoke kt' },
  { id: 'speed-bullet', model: 'Spoke-magnet speed sensor, bullets', specs: { sensorType: 'spoke-magnet', connector: 'bullet' }, quote: 'spoke bullet' },
  { id: 'speed-tongsheng', model: 'Spoke-magnet speed sensor, Tongsheng', specs: { sensorType: 'spoke-magnet', connector: 'tongsheng' }, quote: 'spoke tongsheng' },
  { id: 'speed-disc-julet', model: 'Disc-magnet speed sensor, Julet', specs: { sensorType: 'disc-magnet', connector: 'julet-2' }, quote: 'disc julet' },
  { id: 'speed-disc-sm', model: 'Disc-magnet speed sensor, SM', specs: { sensorType: 'disc-magnet', connector: 'sm-2' }, quote: 'disc sm' },
  { id: 'speed-internal-hall', model: 'Motor-hall speed tap, Julet', specs: { sensorType: 'motor-hall', connector: 'julet-2' }, quote: 'motor-hall' },
  { id: 'speed-internal-hall-sm', model: 'Motor-hall speed tap, SM', specs: { sensorType: 'motor-hall', connector: 'sm-2' }, quote: 'motor-hall sm' },
  { id: 'speed-wheel-12', model: '12-magnet wheel sensor, Julet', specs: { sensorType: 'spoke-magnet', connector: 'julet-2' }, note: 'Still a spoke-magnet type. Magnet count on the wheel is not a second protocol.', quote: 'spoke julet' },
], 'The sensor type and the plug both have to match. This part is optional.');

accessory('light', [
  { id: 'light-6v-julet', model: '6 V light, Julet', specs: { voltage: 6, connector: 'julet-2' }, quote: '6 V julet' },
  { id: 'light-6v-sm', model: '6 V light, SM', specs: { voltage: 6, connector: 'sm-2' }, quote: '6 V sm' },
  { id: 'light-6v-kt', model: '6 V light, KT', specs: { voltage: 6, connector: 'kt-2' }, quote: '6 V kt' },
  { id: 'light-6v-tongsheng', model: '6 V light, Tongsheng', specs: { voltage: 6, connector: 'tongsheng' }, quote: '6 V tongsheng' },
  { id: 'light-12v-sm', model: '12 V light, SM', specs: { voltage: 12, connector: 'sm-2' }, quote: '12 V sm' },
  { id: 'light-12v-julet', model: '12 V light, Julet', specs: { voltage: 12, connector: 'julet-2' }, quote: '12 V julet' },
  { id: 'light-36v-bullet', model: '36 V pack-voltage light, bullets', specs: { voltage: 36, connector: 'bullet' }, quote: '36 V bullet' },
  { id: 'light-48v-bullet', model: '48 V pack-voltage light, bullets', specs: { voltage: 48, connector: 'bullet' }, quote: '48 V bullet' },
  { id: 'light-6v-bullet', model: '6 V light, bullets', specs: { voltage: 6, connector: 'bullet' }, quote: '6 V bullet' },
  { id: 'light-12v-kt', model: '12 V light, KT plug', specs: { voltage: 12, connector: 'kt-2' }, quote: '12 V kt' },
], 'Light voltage has to match the controller light port. A 6 V port is not pack voltage.');

const ids = parts.map((part) => part.id);
const dupes = ids.filter((id, index) => ids.indexOf(id) !== index);
if (dupes.length) {
  console.error('Duplicate ids', dupes);
  process.exit(1);
}

const outPath = join(root, 'data', 'builder', 'parts.json');
writeFileSync(outPath, `${JSON.stringify({ version: 1, parts }, null, 2)}\n`);

const lines = [
  '# Parts needing review',
  '',
  `Generated ${CHECKED}. ${parts.length} parts. Approved means the numbers were copied from a manufacturer specification table during this build. Draft means a person still needs to check them before anyone trusts a real build.`,
  '',
  'A draft part can still appear in the builder. If a number is blank, the engine says "can\'t verify" instead of "fits".',
  '',
  '## Approved',
  '',
];
for (const part of parts.filter((item) => item.reviewStatus === 'approved')) {
  lines.push(`- \`${part.id}\` ${part.brand} ${part.model} — ${part.sourceUrl}`);
}
lines.push('', '## Draft', '');
for (const part of parts.filter((item) => item.reviewStatus !== 'approved')) {
  lines.push(`- \`${part.id}\` (${part.category}) ${part.brand} ${part.model} — ${part.sourceRef}`);
}
lines.push(
  '',
  '## Open questions for Dr. Yazan',
  '',
  '- Zuzu\'s chainring tooth count was not recorded. The baseline uses one chainring and an unknown tooth count so capacity can be checked (front difference 0) and gear inches stay "can\'t verify" until the size is entered.',
  '- The exact 9-speed shifter on his bike was not recorded. The baseline uses an Altus SL-M370 stand-in. Please replace it with the model on the bike.',
  '- The rear derailleur model is owned-unknown on purpose.',
  '- Shimano mountain 10-speed and 11-speed are separate actuation families, even though one planning note wrote them as a single label. Mixing them does not pass.',
  '- Eagle, T-Type, Flattop, Linkglide, and Campagnolo are separate chain types. A blank chain type does not pass.',
  '- Most derailleur capacities are blank. Only RD-M3100-SGS and RD-M370-SGS capacities were copied from the product pages.',
  '- The 8-tooth hanger-extender window is a practitioner rule, not a manufacturer spec.',
  '- Campagnolo N3W with older cassettes is "can\'t verify", not a pass.',
  '- RD-M5120\'s chart mentions 10-speed and 11-speed cog ranges. It is seeded as 11-speed only so a 10-speed mix cannot pass by accident.',
  '- Gear inches use nominal wheel diameters (700c assumes a 28 mm tire).',
  '- E-bike voltages, BB shells, and axle sizes on the new motor, battery, and frame records are draft. A 52 V pack does not pass on a 48 V-only controller. BBS02 is BSA 68/73 only. The 100 mm BBSHD does not pass on a 73 mm shell.',
  '- Hub motors cover the rear hub slot when no separate hub is chosen, so the cassette, axle, and rotor checks use the motor. A torque arm is a warning, not optional silence.',
  '- Headset, seatpost, front axle, and bottom bracket are checked when those parts are chosen. Tire clearance is still not measured.',
  '',
);
writeFileSync(join(root, 'docs', 'bike-builder', 'DATA_REVIEW.md'), lines.join('\n'));
console.log(`Wrote ${parts.length} parts to ${outPath}`);
