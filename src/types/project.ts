export type ComponentCategory =
  | 'battery'
  | 'motor'
  | 'controller'
  | 'frame'
  | 'display'
  | 'bms'
  | 'charger'
  | 'wheel'
  | 'other';

export type ComponentSpecs = {
  voltage?: number;
  maxVoltage?: number;
  minVoltage?: number;
  current?: number;
  maxCurrent?: number;
  power?: number;
  connectorType?: string;
  motorType?: 'hub' | 'mid-drive';
  mountType?: string;
  geometry?: {
    triangleSpace?: {
      width: number;
      height: number;
      depth: number;
    };
  };
};

export type CompatibilityIssue = {
  rule: string;
  type: 'error' | 'warning';
  message: string;
};

export type ProjectItem = {
  id: string;
  name: string;
  category: ComponentCategory;
  specs?: ComponentSpecs;
  price?: number;
  source?: string;
  compatibility?: string[];
  isPreferred?: boolean;
  isDeprioritized?: boolean;
  relatedItemIds?: string[];
  addedAt: number;
  fingerprint: string;
};

export type ProjectNote = {
  id: string;
  content: string;
  links: string[];
  relatedItemIds?: string[];
  title?: string;
  url?: string;
  category?: string;
  comment?: string;
  normalizedName?: string;
  groupKey?: string;
  variantHash?: string;
  price?: number | null;
  selected?: boolean;
  createdAt: number;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  items: ProjectItem[];
  notes: ProjectNote[];
  compatibility?: CompatibilityIssue[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
};
