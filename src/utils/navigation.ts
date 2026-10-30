import { FLOORS, Floor, Exhibit, BUILDING_CONFIG } from '../data';

export interface NavWaypoint {
  x: number;
  y: number;
  z: number;
  floorId: string;
  name?: string;
}

export interface NavStep {
  instruction: string;
  distanceMeters: number;
  floorId: string;
  floorName: string;
  landmark?: string;
}

export interface NavRoute {
  start: NavWaypoint;
  destination: {
    exhibit: Exhibit;
    floor: Floor;
  };
  points: NavWaypoint[];
  steps: NavStep[];
  totalDistanceMeters: number;
  estimatedMinutes: number;
  usesStairs: boolean;
  stairName?: string;
}

export interface TourStop {
  stopIndex: number;
  exhibit: Exhibit;
  floor: Floor;
}

export interface TourPlan {
  start: NavWaypoint;
  stops: TourStop[];
  fullPathPoints: NavWaypoint[];
  totalExhibits: number;
  totalDistanceMeters: number;
  estimatedMinutes: number;
}

// Key Architectural Landmark Waypoints
export const PRESET_START_POINTS: Record<string, NavWaypoint> = {
  main_entrance: {
    x: BUILDING_CONFIG.STAGE.x,
    y: 6.5,
    z: BUILDING_CONFIG.STAGE.z,
    floorId: 'ground',
    name: 'Main Entrance Stage'
  },
  reception: {
    x: 0.0,
    y: 6.5,
    z: -18.0,
    floorId: 'ground',
    name: 'Main Entrance Foyer & Reception'
  },
  west_stairs_gf: {
    x: BUILDING_CONFIG.WEST_STAIRS.x,
    y: 6.5,
    z: BUILDING_CONFIG.WEST_STAIRS.z,
    floorId: 'ground',
    name: 'West Staircase (GF)'
  },
  east_stairs_gf: {
    x: BUILDING_CONFIG.EAST_STAIRS.x,
    y: 6.5,
    z: BUILDING_CONFIG.EAST_STAIRS.z,
    floorId: 'ground',
    name: 'East Staircase (GF)'
  },
  big_quad: {
    x: BUILDING_CONFIG.BIG_QUAD.x,
    y: 6.5,
    z: BUILDING_CONFIG.BIG_QUAD.z,
    floorId: 'ground',
    name: 'Big Quadrangle'
  },
  small_quad: {
    x: BUILDING_CONFIG.SMALL_QUAD.x,
    y: 6.5,
    z: BUILDING_CONFIG.SMALL_QUAD.z,
    floorId: 'ground',
    name: 'Small Quadrangle'
  },
  central_concourse_b: {
    x: -1.0,
    y: 0.0,
    z: 0.5,
    floorId: 'basement',
    name: 'Central Basement Concourse'
  },
  west_stairs_b: {
    x: BUILDING_CONFIG.WEST_STAIRS.x,
    y: 0.0,
    z: BUILDING_CONFIG.WEST_STAIRS.z,
    floorId: 'basement',
    name: 'West Staircase (Basement)'
  },
  east_stairs_b: {
    x: BUILDING_CONFIG.BASEMENT_STAIRS.x,
    y: 0.0,
    z: BUILDING_CONFIG.BASEMENT_STAIRS.z,
    floorId: 'basement',
    name: 'Central Staircase (Basement)'
  },
  west_stairs_f1: {
    x: BUILDING_CONFIG.WEST_STAIRS.x,
    y: 13.0,
    z: BUILDING_CONFIG.WEST_STAIRS.z,
    floorId: 'first',
    name: 'West Staircase (1F)'
  },
  east_stairs_f1: {
    x: BUILDING_CONFIG.EAST_STAIRS.x,
    y: 13.0,
    z: BUILDING_CONFIG.EAST_STAIRS.z,
    floorId: 'first',
    name: 'East Staircase (1F)'
  },
  west_stairs_f2: {
    x: BUILDING_CONFIG.WEST_STAIRS.x,
    y: 19.5,
    z: BUILDING_CONFIG.WEST_STAIRS.z,
    floorId: 'second',
    name: 'West Staircase (2F)'
  },
  east_stairs_f2: {
    x: BUILDING_CONFIG.EAST_STAIRS.x,
    y: 19.5,
    z: BUILDING_CONFIG.EAST_STAIRS.z,
    floorId: 'second',
    name: 'East Staircase (2F)'
  }
};

/**
 * Gets the corridor access point right outside a room door
 */
export function getRoomCorridorPoint(exhibit: Exhibit, floor: Floor): NavWaypoint {
  const y = floor.baseY + 0.15;
  let cx = exhibit.px;
  let cz = exhibit.pz;

  if (exhibit.id === 'g_stage') {
    cz = -21.0;
  } else if (exhibit.id === 'g_cemented' || exhibit.id.includes('cemented')) {
    cx = -1.5;
    cz = -34.0;
  } else if (cz <= -15.0) {
    cz = -13.5; // North hallway
  } else if (cz >= 15.0) {
    cz = 13.5; // South hallway
  } else if (cx <= -16.0) {
    cx = -14.5; // West hallway
  } else if (cx >= 16.0) {
    cx = 14.5; // East hallway
  }

  return {
    x: cx,
    y,
    z: cz,
    floorId: floor.id,
    name: `${exhibit.room} Corridor Access`
  };
}

/**
 * Architectural corridor graph nodes matching 46m x 42.5m blueprint:
 * North Hallway: Z = -13.5
 * South Hallway: Z = 13.5
 * West Hallway: X = -14.5
 * Central Corridor: X = -1.6
 * East Hallway: X = 14.5
 * East Stairs: X = 11.0, Z = -7.25
 * West Stairs: X = -19.25, Z = -11.0
 */
const CORRIDOR_NODES: Record<string, { x: number; z: number }> = {
  NW: { x: -14.5, z: -13.5 },
  NC: { x: -1.6, z: -13.5 },
  NE: { x: 14.5, z: -13.5 },
  SW: { x: -14.5, z: 13.5 },
  SC: { x: -1.6, z: 13.5 },
  SE: { x: 14.5, z: 13.5 },
  W_STAIRS: { x: BUILDING_CONFIG.WEST_STAIRS.x, z: BUILDING_CONFIG.WEST_STAIRS.z },
  W_STAIRS_HALL: { x: -14.5, z: BUILDING_CONFIG.WEST_STAIRS.z },
  E_STAIRS: { x: BUILDING_CONFIG.EAST_STAIRS.x, z: BUILDING_CONFIG.EAST_STAIRS.z },
  E_STAIRS_HALL: { x: 14.5, z: BUILDING_CONFIG.EAST_STAIRS.z },
  RECEPTION: { x: 0.0, z: -18.0 },
  FRONT_STAGE: { x: 0.0, z: -24.25 },
  CEMENTED_PLAZA: { x: -1.5, z: -38.0 },
  MID_C: { x: -1.6, z: -0.25 },
  MID_W: { x: -14.5, z: -0.25 },
  MID_E: { x: 14.5, z: -0.25 },
  BQ_NORTH: { x: BUILDING_CONFIG.BIG_QUAD.x, z: -13.5 },
  BQ_SOUTH: { x: BUILDING_CONFIG.BIG_QUAD.x, z: 13.5 },
  SQ_NORTH: { x: BUILDING_CONFIG.SMALL_QUAD.x, z: -13.5 },
  SQ_SOUTH: { x: BUILDING_CONFIG.SMALL_QUAD.x, z: 13.5 }
};

const CORRIDOR_EDGES: [string, string][] = [
  ['NW', 'SQ_NORTH'],
  ['SQ_NORTH', 'NC'],
  ['NC', 'BQ_NORTH'],
  ['BQ_NORTH', 'NE'],
  ['SW', 'SQ_SOUTH'],
  ['SQ_SOUTH', 'SC'],
  ['SC', 'BQ_SOUTH'],
  ['BQ_SOUTH', 'SE'],
  ['NW', 'W_STAIRS_HALL'],
  ['W_STAIRS_HALL', 'MID_W'],
  ['MID_W', 'SW'],
  ['W_STAIRS_HALL', 'W_STAIRS'],
  ['NE', 'E_STAIRS_HALL'],
  ['E_STAIRS_HALL', 'MID_E'],
  ['MID_E', 'SE'],
  ['E_STAIRS_HALL', 'E_STAIRS'],
  ['NC', 'MID_C'],
  ['MID_C', 'SC'],
  ['RECEPTION', 'NC'],
  ['FRONT_STAGE', 'RECEPTION'],
  ['CEMENTED_PLAZA', 'FRONT_STAGE']
];

// Precompute corridor graph adjacency
const CORRIDOR_ADJ: Record<string, { node: string; cost: number }[]> = {};
for (const k of Object.keys(CORRIDOR_NODES)) CORRIDOR_ADJ[k] = [];
for (const [u, v] of CORRIDOR_EDGES) {
  const d = Math.abs(CORRIDOR_NODES[u].x - CORRIDOR_NODES[v].x) + Math.abs(CORRIDOR_NODES[u].z - CORRIDOR_NODES[v].z);
  CORRIDOR_ADJ[u].push({ node: v, cost: d });
  CORRIDOR_ADJ[v].push({ node: u, cost: d });
}

function findGraphShortestPath(startKey: string, endKey: string): string[] {
  const distances: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const pq = [startKey];
  for (const k of Object.keys(CORRIDOR_NODES)) distances[k] = Infinity;
  distances[startKey] = 0;

  while (pq.length > 0) {
    pq.sort((a, b) => distances[a] - distances[b]);
    const u = pq.shift()!;
    if (u === endKey) break;

    for (const edge of CORRIDOR_ADJ[u]) {
      const alt = distances[u] + edge.cost;
      if (alt < distances[edge.node]) {
        distances[edge.node] = alt;
        prev[edge.node] = u;
        if (!pq.includes(edge.node)) pq.push(edge.node);
      }
    }
  }

  const path: string[] = [];
  let curr: string | null = endKey;
  while (curr) {
    path.unshift(curr);
    curr = prev[curr] || null;
  }
  return path;
}

function findClosestCorridorNode(p: { x: number; z: number }): string {
  // If inside Big Quad on West (X: -13.5..-2.5, Z: -10.25..9.75)
  if (p.x >= -13.5 && p.x <= -2.5 && p.z >= -10.25 && p.z <= 9.75) {
    if (p.z < -4.0) return 'BQ_NORTH';
    if (p.z > 5.0) return 'BQ_SOUTH';
    return 'MID_C';
  }

  // If inside Small Quad on East (X: -0.2..7.0, Z: -10.25..9.75)
  if (p.x >= -0.2 && p.x <= 7.0 && p.z >= -10.25 && p.z <= 9.75) {
    if (p.z < -4.0) return 'SQ_NORTH';
    if (p.z > 5.0) return 'SQ_SOUTH';
    return 'MID_C';
  }

  let best = 'NC';
  let minD = Infinity;
  for (const [k, node] of Object.entries(CORRIDOR_NODES)) {
    const d = Math.abs(p.x - node.x) + Math.abs(p.z - node.z);
    if (d < minD) {
      minD = d;
      best = k;
    }
  }
  return best;
}

/**
 * Eliminates redundant collinear points so every turn is a clean 90-degree right angle.
 */
export function simplifyOrthogonalPath(points: NavWaypoint[]): NavWaypoint[] {
  if (points.length <= 2) return points;
  const result: NavWaypoint[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Collinear planar checks ONLY apply if all 3 points are on the SAME floor (same Y height)
    const sameHeight = Math.abs(prev.y - curr.y) < 0.05 && Math.abs(curr.y - next.y) < 0.05;

    const isCollinearX = sameHeight && Math.abs(prev.x - curr.x) < 0.05 && Math.abs(curr.x - next.x) < 0.05;
    const isCollinearZ = sameHeight && Math.abs(prev.z - curr.z) < 0.05 && Math.abs(curr.z - next.z) < 0.05;
    const isZero = Math.hypot(curr.x - prev.x, curr.y - prev.y, curr.z - prev.z) < 0.05;

    if (isZero || isCollinearX || isCollinearZ) {
      continue;
    }
    result.push(curr);
  }

  const last = points[points.length - 1];
  const prev = result[result.length - 1];
  if (Math.hypot(last.x - prev.x, last.y - prev.y, last.z - prev.z) > 0.05) {
    result.push(last);
  } else {
    result[result.length - 1] = last;
  }

  return result;
}

/**
 * Computes strictly orthogonal (Manhattan) corridor navigation waypoints between two points
 * on the SAME floor.
 * 
 * Guarantees:
 * 1. Every path segment is strictly horizontal (along X) or vertical (along Z).
 * 2. All corners are clean 90-degree right angles with zero diagonal cutting or looping.
 * 3. When starting in Big Quadrangle, routes straight to adjacent East Stairs (x: 9.0, z: -7.0)
 *    in only 2 right-angled segments (min distance ~11m) with no south detours.
 */
export function routeOrthogonal(p1: NavWaypoint, p2: NavWaypoint): NavWaypoint[] {
  const y = p1.y;
  const floorId = p1.floorId;

  // Direct proximity
  if (Math.hypot(p2.x - p1.x, p2.z - p1.z) < 0.3) {
    return [{ ...p1 }, { ...p2, y, floorId }];
  }

  // 1. Direct East Stairs <-> Big Quadrangle
  const isBQ1 = p1.x >= -0.2 && p1.x <= 13.0 && p1.z >= -10.25 && p1.z <= 9.75;
  const isES2 = Math.hypot(p2.x - BUILDING_CONFIG.EAST_STAIRS.x, p2.z - BUILDING_CONFIG.EAST_STAIRS.z) < 2.0;
  if (isBQ1 && isES2) {
    const pts: NavWaypoint[] = [
      { ...p1 },
      { x: BUILDING_CONFIG.EAST_STAIRS.x, y, z: p1.z, floorId },
      { x: BUILDING_CONFIG.EAST_STAIRS.x, y, z: BUILDING_CONFIG.EAST_STAIRS.z, floorId },
      { ...p2, y, floorId }
    ];
    return simplifyOrthogonalPath(pts);
  }

  const isES1 = Math.hypot(p1.x - BUILDING_CONFIG.EAST_STAIRS.x, p1.z - BUILDING_CONFIG.EAST_STAIRS.z) < 2.0;
  const isBQ2 = p2.x >= -0.2 && p2.x <= 13.0 && p2.z >= -10.25 && p2.z <= 9.75;
  if (isES1 && isBQ2) {
    const pts: NavWaypoint[] = [
      { ...p1 },
      { x: BUILDING_CONFIG.EAST_STAIRS.x, y, z: BUILDING_CONFIG.EAST_STAIRS.z, floorId },
      { x: BUILDING_CONFIG.EAST_STAIRS.x, y, z: p2.z, floorId },
      { ...p2, y, floorId }
    ];
    return simplifyOrthogonalPath(pts);
  }

  // 2. Direct pure X or pure Z alignment
  if (Math.abs(p1.x - p2.x) < 0.2) {
    return [{ ...p1 }, { x: p1.x, y, z: p2.z, floorId }, { ...p2, y, floorId }];
  }
  if (Math.abs(p1.z - p2.z) < 0.2) {
    return [{ ...p1 }, { x: p2.x, y, z: p1.z, floorId }, { ...p2, y, floorId }];
  }

  // 3. Hallway Graph Routing (Guaranteed strictly orthogonal Manhattan paths)
  const n1 = findClosestCorridorNode(p1);
  const n2 = findClosestCorridorNode(p2);

  const rawPts: NavWaypoint[] = [{ ...p1 }];
  const node1 = CORRIDOR_NODES[n1];

  // Orthogonal step from p1 to node1
  if (Math.abs(p1.x - node1.x) > 0.05 && Math.abs(p1.z - node1.z) > 0.05) {
    rawPts.push({ x: node1.x, y, z: p1.z, floorId });
  }
  rawPts.push({ x: node1.x, y, z: node1.z, floorId });

  if (n1 !== n2) {
    const graphPath = findGraphShortestPath(n1, n2);
    for (let i = 1; i < graphPath.length; i++) {
      const prevKey = graphPath[i - 1];
      const currKey = graphPath[i];
      const pNode = CORRIDOR_NODES[prevKey];
      const cNode = CORRIDOR_NODES[currKey];
      if (Math.abs(pNode.x - cNode.x) > 0.05 && Math.abs(pNode.z - cNode.z) > 0.05) {
        rawPts.push({ x: cNode.x, y, z: pNode.z, floorId });
      }
      rawPts.push({ x: cNode.x, y, z: cNode.z, floorId });
    }
  }

  const node2 = CORRIDOR_NODES[n2];
  if (Math.abs(p2.x - node2.x) > 0.05 && Math.abs(p2.z - node2.z) > 0.05) {
    rawPts.push({ x: node2.x, y, z: p2.z, floorId });
  }
  rawPts.push({ ...p2, y, floorId });

  return simplifyOrthogonalPath(rawPts);
}

export const routeSameFloor = routeOrthogonal;

/**
 * Calculates optimal route from any start point to an exhibit room across floors.
 * Evaluates both East and West staircases dynamically to ALWAYS select the shortest path.
 */
export function calculateOptimalRoute(
  start: NavWaypoint,
  destinationExhibit: Exhibit,
  destinationFloor: Floor
): NavRoute {
  const destCorridorPt = getRoomCorridorPoint(destinationExhibit, destinationFloor);
  const destRoomPt: NavWaypoint = {
    x: destinationExhibit.px,
    y: destinationFloor.baseY + 0.15,
    z: destinationExhibit.pz,
    floorId: destinationFloor.id,
    name: destinationExhibit.room
  };

  const steps: NavStep[] = [];
  const allPoints: NavWaypoint[] = [];

  const startFloor = FLOORS.find(f => f.id === start.floorId) || FLOORS[1];
  const sameFloor = start.floorId === destinationFloor.id;

  if (sameFloor) {
    const floorPath = routeOrthogonal(start, destCorridorPt);
    floorPath.push(destRoomPt);
    const cleanFloorPath = simplifyOrthogonalPath(floorPath);
    allPoints.push(...cleanFloorPath);

    const dist = calculatePathDistance(cleanFloorPath);
    steps.push({
      instruction: `From ${start.name || 'your position'}, follow corridor directly to ${destinationExhibit.room}.`,
      distanceMeters: Math.round(dist),
      floorId: start.floorId,
      floorName: startFloor.name,
      landmark: destinationExhibit.nearbyLandmark || destinationExhibit.wing
    });

    return {
      start,
      destination: { exhibit: destinationExhibit, floor: destinationFloor },
      points: allPoints,
      steps,
      totalDistanceMeters: Math.round(dist),
      estimatedMinutes: Math.max(1, Math.round(dist / 35)),
      usesStairs: false
    };
  }

  // DIFFERENT FLOORS: Evaluate all available staircases
  // West Stairs connects Basement, Ground, and 1F.
  // East Stairs connects Ground and 1F. Basement Central Stairs connects Basement and Ground.
  const stairOptions = [
    {
      name: (startFloor.id === 'basement' || destinationFloor.id === 'basement') ? 'Central Staircase' : 'East Staircase',
      landmark: (startFloor.id === 'basement' || destinationFloor.id === 'basement') ? 'Central Basement Lobby' : 'East Wing near Quadrangle',
      x: (startFloor.id === 'basement' || destinationFloor.id === 'basement') ? BUILDING_CONFIG.BASEMENT_STAIRS.x : BUILDING_CONFIG.EAST_STAIRS.x,
      z: (startFloor.id === 'basement' || destinationFloor.id === 'basement') ? BUILDING_CONFIG.BASEMENT_STAIRS.z : BUILDING_CONFIG.EAST_STAIRS.z
    },
    {
      name: 'West Staircase',
      landmark: 'West Wing Core',
      x: BUILDING_CONFIG.WEST_STAIRS.x,
      z: BUILDING_CONFIG.WEST_STAIRS.z
    }
  ];

  let bestStair = stairOptions[0];
  let minTotalDist = Infinity;
  let bestToPath: NavWaypoint[] = [];
  let bestFromPath: NavWaypoint[] = [];

  for (const stair of stairOptions) {
    const sStart: NavWaypoint = {
      x: stair.x,
      y: startFloor.baseY + 0.15,
      z: stair.z,
      floorId: startFloor.id,
      name: `${stair.name} (${startFloor.shortName})`
    };
    const sDest: NavWaypoint = {
      x: stair.x,
      y: destinationFloor.baseY + 0.15,
      z: stair.z,
      floorId: destinationFloor.id,
      name: `${stair.name} (${destinationFloor.shortName})`
    };

    const toPath = routeOrthogonal(start, sStart);
    const fromPath = routeOrthogonal(sDest, destCorridorPt);
    const dTo = calculatePathDistance(toPath);
    const dFrom = calculatePathDistance(fromPath);
    const totalD = dTo + dFrom;

    if (totalD < minTotalDist) {
      minTotalDist = totalD;
      bestStair = stair;
      bestToPath = toPath;
      bestFromPath = fromPath;
    }
  }

  const stairName = bestStair.name;
  const stairX = bestStair.x;
  const stairZ = bestStair.z;

  // 1. Path to staircase on start floor
  allPoints.push(...bestToPath);

  const distToStairs = calculatePathDistance(bestToPath);
  steps.push({
    instruction: `Walk ${Math.round(distToStairs)}m from ${start.name || 'current position'} along corridor to ${stairName}.`,
    distanceMeters: Math.round(distToStairs),
    floorId: start.floorId,
    floorName: startFloor.name,
    landmark: bestStair.landmark
  });

  // 2. Clean straight vertical stair transition (No janky spirals or wobbles)
  const goingUp = destinationFloor.level > startFloor.level;

  // Insert intermediate stair landings when traversing across multi-floor jumps (e.g. Level 1 -> Level 2 -> Level 3)
  const minLvl = Math.min(startFloor.level, destinationFloor.level);
  const maxLvl = Math.max(startFloor.level, destinationFloor.level);
  if (maxLvl - minLvl > 1) {
    const intermediateFloors = FLOORS.filter(f => f.level > minLvl && f.level < maxLvl)
      .sort((a, b) => goingUp ? a.level - b.level : b.level - a.level);

    intermediateFloors.forEach(midFloor => {
      allPoints.push({
        x: stairX,
        y: midFloor.baseY + 0.15,
        z: stairZ,
        floorId: midFloor.id,
        name: `${stairName} (${midFloor.shortName} landing)`
      });
    });
  }

  const stairDestPt: NavWaypoint = {
    x: stairX,
    y: destinationFloor.baseY + 0.15,
    z: stairZ,
    floorId: destinationFloor.id,
    name: `${stairName} (${destinationFloor.shortName})`
  };
  allPoints.push(stairDestPt);

  const verticalDist = Math.abs(destinationFloor.baseY - startFloor.baseY);
  steps.push({
    instruction: `Take ${stairName} ${goingUp ? 'UP' : 'DOWN'} to ${destinationFloor.name} (${destinationFloor.shortName}).`,
    distanceMeters: Math.round(verticalDist * 2),
    floorId: destinationFloor.id,
    floorName: destinationFloor.name,
    landmark: `${stairName} core`
  });

  // 3. Path from staircase on destination floor to destination room
  allPoints.push(...bestFromPath.slice(1));
  allPoints.push(destRoomPt);

  const distFromStairs = calculatePathDistance(bestFromPath);
  steps.push({
    instruction: `Exit ${stairName} on ${destinationFloor.name}, walk along hallway into ${destinationExhibit.room}.`,
    distanceMeters: Math.round(distFromStairs),
    floorId: destinationFloor.id,
    floorName: destinationFloor.name,
    landmark: destinationExhibit.nearbyLandmark || destinationExhibit.wing
  });

  const totalDist = distToStairs + verticalDist * 2 + distFromStairs;

  return {
    start,
    destination: { exhibit: destinationExhibit, floor: destinationFloor },
    points: simplifyOrthogonalPath(allPoints),
    steps,
    totalDistanceMeters: Math.round(totalDist),
    estimatedMinutes: Math.max(1, Math.round(totalDist / 35)),
    usesStairs: true,
    stairName
  };
}

/**
 * Computes Euclidean distance along an array of waypoints
 */
export function calculatePathDistance(points: NavWaypoint[]): number {
  let dist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    dist += Math.hypot(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
  }
  return dist;
}

/**
 * Builds an optimal sequential "Flow of Plan" visiting all exhibits efficiently.
 * Orders rooms floor-by-floor in a logical circular tour without backtracking.
 */
export function generateExhibitionTourPlan(start: NavWaypoint): TourPlan {
  const orderedStops: TourStop[] = [];

  const filterNonStairs = (fl: Floor) =>
    fl.exhibits.filter(e => !e.id.includes('_str') && !e.id.includes('stairs'));

  // Sequence floors starting from user's current floor
  const allFloors = [...FLOORS];
  const startFloorIdx = allFloors.findIndex(f => f.id === start.floorId);
  const orderedFloors = startFloorIdx >= 0
    ? [...allFloors.slice(startFloorIdx), ...allFloors.slice(0, startFloorIdx)]
    : allFloors;

  let currentOrder = 1;
  let previousStop: { x: number; z: number } = { x: start.x, z: start.z };

  orderedFloors.forEach((floor) => {
    const remaining = filterNonStairs(floor);

    // Entry anchor for the walking order: the user's start pin on the first
    // floor; on later floors, whichever staircase (vertically aligned between
    // levels) sits nearest the last visited room on the floor below.
    let cursor = { ...previousStop };
    if (floor.id !== start.floorId) {
      const stairAnchors = [
        BUILDING_CONFIG.WEST_STAIRS,
        BUILDING_CONFIG.EAST_STAIRS,
        BUILDING_CONFIG.BASEMENT_STAIRS
      ];
      cursor = stairAnchors.reduce((best, s) =>
        Math.hypot(s.x - previousStop.x, s.z - previousStop.z) <
        Math.hypot(best.x - previousStop.x, best.z - previousStop.z)
          ? s
          : best
      );
    }

    // Greedy nearest-neighbor: always walk to the closest remaining room so
    // the tour loops through the floor instead of zigzagging across it.
    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const ex = remaining[i];
        const d = Math.hypot(ex.px - cursor.x, ex.pz - cursor.z);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      const [next] = remaining.splice(bestIdx, 1);
      orderedStops.push({ stopIndex: currentOrder++, exhibit: next, floor });
      cursor = { x: next.px, z: next.pz };
      previousStop = cursor;
    }
  });

  // Calculate composite 3D path through all stops
  const fullPathPoints: NavWaypoint[] = [{ ...start }];
  let currentPt = start;
  let totalDistance = 0;

  orderedStops.forEach(stop => {
    const route = calculateOptimalRoute(currentPt, stop.exhibit, stop.floor);
    // Append points skipping first (duplicate)
    fullPathPoints.push(...route.points.slice(1));
    totalDistance += route.totalDistanceMeters;
    currentPt = {
      x: stop.exhibit.px,
      y: stop.floor.baseY + 0.15,
      z: stop.exhibit.pz,
      floorId: stop.floor.id,
      name: stop.exhibit.room
    };
  });

  return {
    start,
    stops: orderedStops,
    fullPathPoints: simplifyOrthogonalPath(fullPathPoints),
    totalExhibits: orderedStops.length,
    totalDistanceMeters: Math.round(totalDistance),
    estimatedMinutes: Math.round(orderedStops.length * 3 + totalDistance / 35)
  };
}
