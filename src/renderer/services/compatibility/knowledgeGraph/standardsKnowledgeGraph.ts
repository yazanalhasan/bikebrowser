export type StandardEntity = {
  id: string;
  type: string;
  label: string;
  compatible_with: string[];
  conflicts_with: string[];
  requires: string[];
  supersedes?: string[];
  deprecated_by?: string[];
};

export const STANDARD_ENTITIES: Record<string, StandardEntity> = {
  shimano_linkglide: {
    id: 'shimano_linkglide',
    type: 'drivetrain_standard',
    label: 'Shimano LINKGLIDE',
    compatible_with: ['cues_9', 'cues_10', 'cues_11', 'linkglide_chain'],
    conflicts_with: ['hyperglide_11', 'sram_eagle', 'sram_transmission'],
    requires: ['linkglide_chain', 'linkglide_cassette_spacing'],
  },
  cues_9: {
    id: 'cues_9',
    type: 'drivetrain_ecosystem',
    label: 'Shimano CUES 9-speed',
    compatible_with: ['shimano_linkglide', 'linkglide_chain'],
    conflicts_with: ['hyperglide_11', 'sram_eagle'],
    requires: ['linkglide_chain'],
  },
  hyperglide_11: {
    id: 'hyperglide_11',
    type: 'drivetrain_standard',
    label: 'Shimano Hyperglide 11-speed',
    compatible_with: ['hyperglide_chain'],
    conflicts_with: ['shimano_linkglide', 'cues_9'],
    requires: ['hyperglide_chain'],
  },
  sram_eagle: {
    id: 'sram_eagle',
    type: 'drivetrain_standard',
    label: 'SRAM Eagle',
    compatible_with: ['sram_xd', 'sram_eagle_chain'],
    conflicts_with: ['shimano_linkglide', 'cues_9'],
    requires: ['sram_eagle_chain'],
  },
  boost_148: {
    id: 'boost_148',
    type: 'hub_standard',
    label: 'Boost 148 Rear Hub',
    compatible_with: ['12x148_thru_axle'],
    conflicts_with: ['qr_135', 'super_boost_157'],
    requires: ['boost_frame_spacing'],
  },
  post_mount: {
    id: 'post_mount',
    type: 'brake_mount',
    label: 'Post Mount',
    compatible_with: ['mtb_disc_caliper'],
    conflicts_with: ['flat_mount'],
    requires: ['disc_brake_frame_mount'],
  },
  bsa_73: {
    id: 'bsa_73',
    type: 'bottom_bracket',
    label: 'BSA 73mm Threaded',
    compatible_with: ['external_73mm_bb'],
    conflicts_with: ['pf30', 'bb92'],
    requires: ['threaded_shell'],
  },
};

export function getStandardEntity(id: string): StandardEntity {
  return STANDARD_ENTITIES[id];
}

export function standardsAreCompatible(leftId: string, rightId: string): boolean {
  const left = getStandardEntity(leftId);
  const right = getStandardEntity(rightId);

  if (!left || !right) return false;
  if (left.conflicts_with.includes(rightId) || right.conflicts_with.includes(leftId)) return false;
  return left.compatible_with.includes(rightId) || right.compatible_with.includes(leftId);
}

export function listStandardsByType(type: string): StandardEntity[] {
  return Object.values(STANDARD_ENTITIES).filter((entry) => entry.type === type);
}

export default {
  STANDARD_ENTITIES,
  getStandardEntity,
  standardsAreCompatible,
  listStandardsByType,
};
