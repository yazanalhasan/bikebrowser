/**
 * System Graph Engine — directed graph of components and their relationships.
 *
 * The backbone of the engineering gameplay. Every buildable machine
 * (bike, battery, e-bike) is a graph of nodes (components) connected
 * by edges (dependencies). The graph enforces:
 *
 *   - Dependency resolution: "wheels require frame"
 *   - Constraint propagation: voltage mismatch propagates errors
 *   - Conflict detection: incompatible components
 *   - Topological ordering: build sequence
 *
 * Node types:
 *   'component'  — a physical part (frame, wheel, cell, motor)
 *   'system'     — a logical subsystem (drivetrain, battery pack, power system)
 *   'slot'       — a mount point that accepts a component
 *
 * Edge relations:
 *   'requires'   — target must exist for source to function
 *   'supports'   — source enables optional capability on target
 *   'conflicts'  — source and target cannot coexist
 *   'feeds'      — source provides resource/signal to target (power, data)
 *
 * Pure functions — no side effects, no state mutation.
 */

// ── Graph Construction ───────────────────────────────────────────────────────

/**
 * Create an empty system graph.
 * @returns {{ nodes: Map, edges: object[] }}
 */
export function createGraph() {
  return { nodes: new Map(), edges: [] };
}

/**
 * Add a node to the graph.
 * @param {object} graph
 * @param {object} node - { id, type, properties }
 * @returns {object} new graph
 */
export function addNode(graph, node) {
  const nodes = new Map(graph.nodes);
  nodes.set(node.id, {
    id: node.id,
    type: node.type || 'component',
    properties: node.properties || {},
    installed: node.installed || false,
  });
  return { ...graph, nodes };
}

/**
 * Add an edge between two nodes.
 * @param {object} graph
 * @param {object} edge - { from, to, relation, properties? }
 * @returns {object} new graph
 */
export function addEdge(graph, edge) {
  return {
    ...graph,
    edges: [...graph.edges, {
      from: edge.from,
      to: edge.to,
      relation: edge.relation || 'requires',
      properties: edge.properties || {},
    }],
  };
}

/**
 * Remove a node and all connected edges.
 */
export function removeNode(graph, nodeId) {
  const nodes = new Map(graph.nodes);
  nodes.delete(nodeId);
  const edges = graph.edges.filter((e) => e.from !== nodeId && e.to !== nodeId);
  return { nodes, edges };
}

/**
 * Install/uninstall a component in a slot.
 */
export function setInstalled(graph, nodeId, installed) {
  const nodes = new Map(graph.nodes);
  const node = nodes.get(nodeId);
  if (!node) return graph;
  nodes.set(nodeId, { ...node, installed });
  return { ...graph, nodes };
}

// ── Graph Queries ────────────────────────────────────────────────────────────

/**
 * Get all nodes of a given type.
 */
export function getNodesByType(graph, type) {
  const result = [];
  for (const node of graph.nodes.values()) {
    if (node.type === type) result.push(node);
  }
  return result;
}

/**
 * Get direct dependencies of a node (what it requires).
 */
export function getDependencies(graph, nodeId) {
  return graph.edges
    .filter((e) => e.from === nodeId && e.relation === 'requires')
    .map((e) => ({ ...e, node: graph.nodes.get(e.to) }));
}

/**
 * Get what depends on a node (what requires it).
 */
export function getDependents(graph, nodeId) {
  return graph.edges
    .filter((e) => e.to === nodeId && e.relation === 'requires')
    .map((e) => ({ ...e, node: graph.nodes.get(e.from) }));
}

/**
 * Get conflicts for a node.
 */
export function getConflicts(graph, nodeId) {
  return graph.edges
    .filter((e) => e.relation === 'conflicts' && (e.from === nodeId || e.to === nodeId))
    .map((e) => {
      const otherId = e.from === nodeId ? e.to : e.from;
      return { ...e, node: graph.nodes.get(otherId) };
    });
}

/**
 * Get feed connections (power/signal flow).
 */
export function getFeeds(graph, nodeId) {
  return {
    provides: graph.edges.filter((e) => e.from === nodeId && e.relation === 'feeds'),
    receives: graph.edges.filter((e) => e.to === nodeId && e.relation === 'feeds'),
  };
}

/**
 * Get all installed nodes.
 */
export function getInstalledNodes(graph) {
  const result = [];
  for (const node of graph.nodes.values()) {
    if (node.installed) result.push(node);
  }
  return result;
}

// ── Dependency Resolution ────────────────────────────────────────────────────

/**
 * Check if all dependencies of a node are satisfied (installed).
 * @returns {{ satisfied: boolean, missing: string[] }}
 */
export function checkDependencies(graph, nodeId) {
  const deps = getDependencies(graph, nodeId);
  const missing = [];

  for (const dep of deps) {
    if (!dep.node || !dep.node.installed) {
      missing.push(dep.to);
    }
  }

  return { satisfied: missing.length === 0, missing };
}

/**
 * Get the full dependency tree for a node (recursive).
 */
export function getDependencyTree(graph, nodeId, visited = new Set()) {
  if (visited.has(nodeId)) return []; // cycle protection
  visited.add(nodeId);

  const deps = getDependencies(graph, nodeId);
  const tree = [];

  for (const dep of deps) {
    tree.push(dep.to);
    tree.push(...getDependencyTree(graph, dep.to, visited));
  }

  return tree;
}

// ── Constraint Propagation ───────────────────────────────────────────────────

/**
 * Validate the entire graph. Returns all errors, warnings, and info.
 *
 * Checks:
 *   - Missing dependencies for installed components
 *   - Active conflicts between installed components
 *   - Feed chain integrity (power/signal flow)
 *   - Property constraints (voltage match, etc.)
 *
 * @returns {{ errors: object[], warnings: object[], info: object[] }}
 */
export function validateGraph(graph) {
  const errors = [];
  const warnings = [];
  const info = [];

  const installed = getInstalledNodes(graph);

  for (const node of installed) {
    // Check dependencies
    const { satisfied, missing } = checkDependencies(graph, node.id);
    if (!satisfied) {
      errors.push({
        type: 'missing_dependency',
        nodeId: node.id,
        missing,
        message: `${node.properties.label || node.id} requires: ${missing.join(', ')}`,
        explanation: `Install ${missing.join(' and ')} before ${node.properties.label || node.id} can work.`,
      });
    }

    // Check conflicts
    const conflicts = getConflicts(graph, node.id);
    for (const conflict of conflicts) {
      if (conflict.node?.installed) {
        errors.push({
          type: 'conflict',
          nodeId: node.id,
          conflictsWith: conflict.node.id,
          message: `${node.properties.label || node.id} conflicts with ${conflict.node.properties.label || conflict.node.id}`,
          explanation: conflict.properties?.reason || 'These components are incompatible.',
        });
      }
    }

    // Check feed constraints (voltage, current matching)
    const feeds = getFeeds(graph, node.id);
    for (const feed of feeds.receives) {
      const source = graph.nodes.get(feed.from);
      if (!source?.installed) {
        warnings.push({
          type: 'disconnected_feed',
          nodeId: node.id,
          feedFrom: feed.from,
          message: `${node.properties.label || node.id} has no power/signal from ${feed.from}`,
          explanation: `Connect a ${feed.properties?.feedType || 'source'} to ${node.properties.label || node.id}.`,
        });
        continue;
      }

      // Property matching (e.g., voltage)
      if (feed.properties?.matchProperty) {
        const prop = feed.properties.matchProperty;
        const sourceVal = source.properties[prop];
        const targetVal = node.properties[prop];
        if (sourceVal !== undefined && targetVal !== undefined && sourceVal !== targetVal) {
          errors.push({
            type: 'property_mismatch',
            nodeId: node.id,
            feedFrom: feed.from,
            property: prop,
            sourceValue: sourceVal,
            targetValue: targetVal,
            message: `${prop} mismatch: ${source.properties.label || feed.from} (${sourceVal}) → ${node.properties.label || node.id} (${targetVal})`,
            explanation: `The ${prop} of ${source.properties.label || feed.from} must match ${node.properties.label || node.id}. Got ${sourceVal} vs ${targetVal}.`,
          });
        }
      }
    }
  }

  // Check for uninstalled required components (warnings)
  for (const node of graph.nodes.values()) {
    if (!node.installed && node.properties?.required) {
      warnings.push({
        type: 'missing_required',
        nodeId: node.id,
        message: `${node.properties.label || node.id} is required but not installed`,
        explanation: `This component is essential for the system to function.`,
      });
    }
  }

  return { errors, warnings, info };
}

// ── Topological Sort ─────────────────────────────────────────────────────────

/**
 * Get the build order (topological sort of dependency graph).
 * Components with no dependencies come first.
 */
export function getBuildOrder(graph) {
  const visited = new Set();
  const order = [];

  function visit(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const deps = getDependencies(graph, nodeId);
    for (const dep of deps) {
      visit(dep.to);
    }
    order.push(nodeId);
  }

  for (const nodeId of graph.nodes.keys()) {
    visit(nodeId);
  }

  return order;
}

// ── Graph Serialization ──────────────────────────────────────────────────────

/**
 * Serialize graph to a plain object (for save state).
 */
export function serializeGraph(graph) {
  return {
    nodes: Array.from(graph.nodes.entries()),
    edges: graph.edges,
  };
}

/**
 * Deserialize graph from a plain object.
 */
export function deserializeGraph(data) {
  if (!data) return createGraph();
  return {
    nodes: new Map(data.nodes || []),
    edges: data.edges || [],
  };
}

// ── Predefined Graph Builders ────────────────────────────────────────────────

/**
 * Build a system graph from a parts definition + rules definition.
 * This is the standard way to create machine-specific graphs.
 *
 * @param {object[]} parts - array of { id, type, properties, required? }
 * @param {object[]} rules - array of { from, to, relation, properties? }
 * @returns {object} graph
 */
export function buildGraphFromDefinition(parts, rules) {
  let graph = createGraph();

  for (const part of parts) {
    graph = addNode(graph, {
      id: part.id,
      type: part.type || 'component',
      properties: { ...part.properties, required: part.required },
      installed: false,
    });
  }

  for (const rule of rules) {
    graph = addEdge(graph, rule);
  }

  return graph;
}
