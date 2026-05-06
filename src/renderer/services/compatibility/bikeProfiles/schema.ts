export type CompatibilityStatus =
  | 'compatible'
  | 'likely-compatible'
  | 'needs-verification'
  | 'incompatible';

export interface BikeProfile {
  id: string;
  name?: string;

  frame: {
    wheelSize: string;
    rearSpacing: string;
    frontSpacing: string;
    seatpostDiameter: number;
    headsetType: string;
    bottomBracket: string;
    derailleurHanger: string;
  };

  drivetrain: {
    speeds: number;
    family: string;
    cassetteRange: string;
    chainType: string;
    crankInterface: string;
    chainline: string;
  };

  brakes: {
    type: string;
    rotorFront: number;
    rotorRear: number;
    mountType: string;
  };

  cockpit: {
    handlebarClamp: string;
    stemClamp: string;
  };

  electrical?: {
    batteryVoltage: number;
    controllerMaxCurrent: number;
  };
}

export interface ProductSpecs {
  category?: string;
  title?: string;
  description?: string;
  brand?: string;
  family?: string;
  pullRatio?: string;
  speeds?: number;
  cassetteRange?: string;
  maxCogTeeth?: number;
  cage?: string;
  rearSpacing?: string;
  frontSpacing?: string;
  axleType?: string;
  wheelSize?: string;
  rotorSize?: number;
  brakeType?: string;
  mountType?: string;
  seatpostDiameter?: number;
  handlebarClamp?: string;
  stemClamp?: string;
  bottomBracket?: string;
  extractionConfidence?: number;
  extractedSpecs?: Record<string, unknown>;
  raw?: unknown;
}

export interface CompatibilityResult {
  status: CompatibilityStatus;
  confidence: number;
  reasons: string[];
  warnings: string[];
  measurementsNeeded: string[];
  educationalConcepts: string[];
}

export interface CompatibilityTraceStep {
  rule: string;
  status: CompatibilityStatus;
  message: string;
  compared?: {
    bike?: unknown;
    product?: unknown;
  };
}

export interface BuildNode {
  id: string;
  type: string;
  label?: string;
  interfaces: {
    [key: string]: string | number;
  };
  dependencies: string[];
  dependents: string[];
}

export interface BuildEdge {
  from: string;
  to: string;
  relationship: string;
  explanation: string;
}

export interface MechanicalGraph {
  profileId: string;
  nodes: Record<string, BuildNode>;
  edges: BuildEdge[];
}
