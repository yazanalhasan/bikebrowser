import type { BikeProfile, BuildEdge, BuildNode, MechanicalGraph } from '../bikeProfiles/schema';
import { maxCassetteTooth } from '../extraction/normalization';

type ComponentChange = {
  [key: string]: string | number | undefined;
};

type PropagationIssue = {
  nodeId: string;
  status: 'compatible' | 'needs-verification' | 'incompatible';
  reason: string;
  educationalConcepts: string[];
};

function node(id: string, type: string, interfaces: BuildNode['interfaces'] = {}): BuildNode {
  return {
    id,
    type,
    label: id.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
    interfaces,
    dependencies: [],
    dependents: [],
  };
}

function connect(nodes: Record<string, BuildNode>, edges: BuildEdge[], from: string, to: string, relationship: string, explanation: string) {
  edges.push({ from, to, relationship, explanation });
  if (relationship === 'depends_on') {
    if (nodes[from] && !nodes[from].dependencies.includes(to)) {
      nodes[from].dependencies.push(to);
    }
    if (nodes[to] && !nodes[to].dependents.includes(from)) {
      nodes[to].dependents.push(from);
    }
    return;
  }

  if (nodes[from] && !nodes[from].dependents.includes(to)) {
    nodes[from].dependents.push(to);
  }
  if (nodes[to] && !nodes[to].dependencies.includes(from)) {
    nodes[to].dependencies.push(from);
  }
}

export function createMechanicalGraph(profile: BikeProfile): MechanicalGraph {
  const nodes: Record<string, BuildNode> = {
    frame: node('frame', 'frame', {
      wheelSize: profile.frame.wheelSize,
      rearSpacing: profile.frame.rearSpacing,
      frontSpacing: profile.frame.frontSpacing,
      derailleurHanger: profile.frame.derailleurHanger,
    }),
    freehub: node('freehub', 'hub-interface', {
      spacing: profile.frame.rearSpacing,
      standard: 'HG/LINKGLIDE compatible',
    }),
    cassette: node('cassette', 'drivetrain', {
      range: profile.drivetrain.cassetteRange,
      speeds: profile.drivetrain.speeds,
      maxCogTeeth: maxCassetteTooth(profile.drivetrain.cassetteRange) || 46,
      family: profile.drivetrain.family,
    }),
    'rear-derailleur': node('rear-derailleur', 'drivetrain', {
      family: profile.drivetrain.family,
      speeds: profile.drivetrain.speeds,
      maxCogTeeth: maxCassetteTooth(profile.drivetrain.cassetteRange) || 46,
      hanger: profile.frame.derailleurHanger,
    }),
    chain: node('chain', 'drivetrain', {
      type: profile.drivetrain.chainType,
      speeds: profile.drivetrain.speeds,
    }),
    shifter: node('shifter', 'drivetrain-control', {
      family: profile.drivetrain.family,
      speeds: profile.drivetrain.speeds,
    }),
    'b-gap': node('b-gap', 'adjustment', {
      requiredBy: profile.drivetrain.cassetteRange,
    }),
    'chain-wrap-capacity': node('chain-wrap-capacity', 'capacity', {
      cassetteRange: profile.drivetrain.cassetteRange,
    }),
    brakes: node('brakes', 'braking', {
      type: profile.brakes.type,
      mountType: profile.brakes.mountType,
      rotorFront: profile.brakes.rotorFront,
      rotorRear: profile.brakes.rotorRear,
    }),
    cockpit: node('cockpit', 'control', {
      handlebarClamp: profile.cockpit.handlebarClamp,
      stemClamp: profile.cockpit.stemClamp,
    }),
  };

  const edges: BuildEdge[] = [];
  connect(nodes, edges, 'cassette', 'freehub', 'depends_on', 'Cassette spline standard must match the freehub body.');
  connect(nodes, edges, 'cassette', 'rear-derailleur', 'affects', 'Cassette range sets required derailleur max cog and capacity.');
  connect(nodes, edges, 'cassette', 'chain', 'affects', 'Cassette speed and range affect chain width and length.');
  connect(nodes, edges, 'cassette', 'shifter', 'affects', 'Cassette speed must match indexed shifter spacing.');
  connect(nodes, edges, 'cassette', 'b-gap', 'affects', 'Larger cogs require different upper pulley clearance.');
  connect(nodes, edges, 'cassette', 'chain-wrap-capacity', 'affects', 'Wider gear range increases chain wrap requirement.');
  connect(nodes, edges, 'frame', 'freehub', 'constrains', 'Frame dropout spacing constrains rear hub spacing.');
  connect(nodes, edges, 'frame', 'rear-derailleur', 'constrains', 'Hanger type constrains derailleur mounting.');
  connect(nodes, edges, 'shifter', 'rear-derailleur', 'controls', 'Shifter cable pull must match derailleur movement ratio.');
  connect(nodes, edges, 'rear-derailleur', 'chain', 'guides', 'Derailleur pulley alignment guides the chain across cassette sprockets.');

  return {
    profileId: profile.id,
    nodes,
    edges,
  };
}

function walkAffected(graph: MechanicalGraph, startId: string): string[] {
  const visited = new Set<string>();
  const queue = [...(graph.nodes[startId]?.dependencies || []), ...(graph.nodes[startId]?.dependents || [])];
  const ordered: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (visited.has(current)) continue;
    visited.add(current);
    ordered.push(current);

    const currentNode = graph.nodes[current];
    if (!currentNode) continue;

    currentNode.dependents.forEach((id) => {
      if (!visited.has(id) && id !== startId) queue.push(id);
    });
  }

  return ordered;
}

function pathFromStart(graph: MechanicalGraph, startId: string, targetId: string): string[] {
  if (graph.edges.some((edge) => edge.from === startId && edge.to === targetId)) {
    return [startId, targetId];
  }

  const bridge = graph.edges.find((edge) => edge.from === startId && graph.edges.some((next) => next.from === edge.to && next.to === targetId));
  if (bridge) {
    return [startId, bridge.to, targetId];
  }

  return [startId, targetId];
}

function cassetteIssues(change: ComponentChange): PropagationIssue[] {
  const maxCog = Number(change.maxCogTeeth || 0);
  const speeds = Number(change.speeds || 0);
  const freehub = String(change.freehub || '');
  const issues: PropagationIssue[] = [];

  if (maxCog > 46) {
    issues.push({
      nodeId: 'rear-derailleur',
      status: 'incompatible',
      reason: `Cassette max cog ${maxCog}T exceeds current derailleur 46T capacity.`,
      educationalConcepts: ['Cassette range', 'Chain wrap capacity', 'B-gap'],
    });
    issues.push({
      nodeId: 'chain-wrap-capacity',
      status: 'incompatible',
      reason: 'Chain wrap capacity is exceeded by the wider cassette range.',
      educationalConcepts: ['Chain wrap capacity'],
    });
    issues.push({
      nodeId: 'b-gap',
      status: 'needs-verification',
      reason: 'B-gap must be reset so the upper pulley clears the larger cassette cog.',
      educationalConcepts: ['B-gap adjustment'],
    });
    issues.push({
      nodeId: 'chain',
      status: 'needs-verification',
      reason: 'Chain may be too short after increasing cassette range.',
      educationalConcepts: ['Chain length'],
    });
  }

  if (speeds && speeds !== 9) {
    issues.push({
      nodeId: 'shifter',
      status: 'incompatible',
      reason: `Cassette is ${speeds}-speed but current shifter indexes 9-speed.`,
      educationalConcepts: ['Indexing', 'Cassette spacing'],
    });
    issues.push({
      nodeId: 'chain',
      status: 'incompatible',
      reason: `${speeds}-speed cassette requires a different chain width than the current 9-speed setup.`,
      educationalConcepts: ['Chain width', 'Cassette spacing'],
    });
  }

  if (freehub && !/hg|linkglide/i.test(freehub)) {
    issues.push({
      nodeId: 'freehub',
      status: 'incompatible',
      reason: `Freehub standard ${freehub} conflicts with the current HG/LINKGLIDE-compatible hub body.`,
      educationalConcepts: ['Freehub spline standards'],
    });
  }

  return issues;
}

export function propagateComponentChange(graph: MechanicalGraph, componentId: string, change: ComponentChange) {
  const affectedNodeIds = walkAffected(graph, componentId);
  const issues = componentId === 'cassette' ? cassetteIssues(change) : [];
  const dependencyPaths = affectedNodeIds.map((id) => pathFromStart(graph, componentId, id));

  return {
    changedNodeId: componentId,
    affectedNodeIds,
    dependencyPaths,
    issues,
  };
}

export default {
  createMechanicalGraph,
  propagateComponentChange,
};
