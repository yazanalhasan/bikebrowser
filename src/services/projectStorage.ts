import type { Project } from '../types/project';

const STORAGE_KEY = 'bikebrowser_projects';
const CURRENT_DRIVETRAIN_PROJECT_ID = 'current-drivetrain-upgrade';

const currentDrivetrainProject: Project = {
  id: CURRENT_DRIVETRAIN_PROJECT_ID,
  name: 'Current Project: Drivetrain Upgrade',
  description: 'Install and learn to use the VG SPORTS wide-range MTB cassette, chain, hanger extender, and master-link pliers.',
  items: [
    {
      id: 'vg-sports-b09vbntgcd',
      name: 'VG SPORTS 9-speed MTB groupset kit, 11-42T rainbow',
      category: 'other',
      price: 59.99,
      source: 'https://www.amazon.com/dp/B09VBNTGCD?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1',
      compatibility: [
        'Confirm the bike is using a 9-speed drivetrain before installation.',
        'Check derailleur capacity and B-screw clearance for the 42T large cog.',
        'Size the new chain after the cassette is installed.'
      ],
      addedAt: 1762041600000,
      fingerprint: 'vg-sports-b09vbntgcd-drivetrain-kit'
    }
  ],
  notes: [
    {
      id: 'vg-sports-source-link',
      title: 'Purchased drivetrain kit',
      content: 'VG SPORTS wide-range MTB drivetrain kit purchased for the current drivetrain maintenance project.',
      links: ['https://www.amazon.com/dp/B09VBNTGCD?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1'],
      relatedItemIds: ['vg-sports-b09vbntgcd'],
      category: 'drivetrain',
      url: 'https://www.amazon.com/dp/B09VBNTGCD?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1',
      selected: true,
      createdAt: 1762041600000
    }
  ],
  compatibility: [],
  tags: ['current', 'drivetrain', 'cassette', 'chain', 'maintenance'],
  createdAt: 1762041600000,
  updatedAt: 1762041600000
};

function mergeCurrentProject(projects: Project[]): Project[] {
  const existingIndex = projects.findIndex((project) => project.id === CURRENT_DRIVETRAIN_PROJECT_ID);
  if (existingIndex < 0) {
    return [currentDrivetrainProject, ...projects];
  }

  const existing = projects[existingIndex];
  const hasKit = (existing.items || []).some((item) => item.id === 'vg-sports-b09vbntgcd');
  const hasSourceNote = (existing.notes || []).some((note) => note.id === 'vg-sports-source-link');
  const merged: Project = {
    ...currentDrivetrainProject,
    ...existing,
    description: existing.description || currentDrivetrainProject.description,
    tags: [...new Set([...(existing.tags || []), ...currentDrivetrainProject.tags])],
    items: hasKit ? existing.items : [...currentDrivetrainProject.items, ...(existing.items || [])],
    notes: hasSourceNote ? existing.notes : [...currentDrivetrainProject.notes, ...(existing.notes || [])],
    updatedAt: Math.max(existing.updatedAt || 0, currentDrivetrainProject.updatedAt)
  };

  return projects.map((project, index) => (index === existingIndex ? merged : project));
}

export const loadProjects = (): Project[] => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [currentDrivetrainProject];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [currentDrivetrainProject];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? mergeCurrentProject(parsed) : [currentDrivetrainProject];
  } catch {
    return [currentDrivetrainProject];
  }
};

export const saveProjects = (projects: Project[]): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};
