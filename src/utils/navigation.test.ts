import { describe, it, expect } from 'vitest';
import {
  PRESET_START_POINTS,
  routeOrthogonal,
  simplifyOrthogonalPath,
  calculateOptimalRoute,
  calculatePathDistance,
  generateExhibitionTourPlan,
  NavWaypoint
} from './navigation';
import { FLOORS, Floor, Exhibit } from '../data';

const findExhibit = (id: string): { exhibit: Exhibit; floor: Floor } => {
  for (const floor of FLOORS) {
    const exhibit = floor.exhibits.find(e => e.id === id);
    if (exhibit) return { exhibit, floor };
  }
  throw new Error(`test setup: exhibit ${id} not found`);
};

const waypoint = (x: number, z: number, floorId: string): NavWaypoint => ({ x, y: 0, z, floorId });

describe('routeOrthogonal', () => {
  it('produces an axis-aligned corridor path between two points', () => {
    const points = routeOrthogonal(waypoint(-10, 5, 'ground'), waypoint(8, -3, 'ground'));
    expect(points.length).toBeGreaterThan(2);
    for (let i = 1; i < points.length; i++) {
      const dx = Math.abs(points[i].x - points[i - 1].x);
      const dz = Math.abs(points[i].z - points[i - 1].z);
      expect(dx === 0 || dz === 0).toBe(true);
    }
  });
});

describe('simplifyOrthogonalPath', () => {
  it('removes collinear intermediate points', () => {
    const path = [
      waypoint(0, 0, 'ground'),
      waypoint(0, 5, 'ground'),
      waypoint(0, 10, 'ground'),
      waypoint(4, 10, 'ground')
    ];
    const simplified = simplifyOrthogonalPath(path);
    expect(simplified.map(p => [p.x, p.z])).toEqual([[0, 0], [0, 10], [4, 10]]);
  });
});

describe('calculateOptimalRoute', () => {
  it('routes within a floor without stairs and with positive distance', () => {
    const { exhibit, floor } = findExhibit('b_sr_cs2');
    const route = calculateOptimalRoute(PRESET_START_POINTS.central_concourse_b, exhibit, floor);
    expect(route.usesStairs).toBe(false);
    expect(route.totalDistanceMeters).toBeGreaterThan(0);
    expect(route.points.every(p => p.floorId === 'basement')).toBe(true);
    expect(route.steps.length).toBeGreaterThan(0);
  });

  it('routes across floors through a staircase in level order', () => {
    const { exhibit, floor } = findExhibit('f2_cr12b');
    const route = calculateOptimalRoute(PRESET_START_POINTS.main_entrance, exhibit, floor);
    expect(route.usesStairs).toBe(true);
    expect(route.stairName).toBeTruthy();

    const levels = FLOORS.map(f => f.level);
    const sequence = route.points
      .map(p => FLOORS.find(f => f.id === p.floorId)!.level)
      .filter((lvl, i, arr) => i === 0 || lvl !== arr[i - 1]);
    // Walk monotonically from ground (1) through first (2) up to second (3) — never bounce back
    for (let i = 1; i < sequence.length; i++) {
      expect(Math.abs(sequence[i] - sequence[i - 1])).toBe(1);
      expect(levels).toContain(sequence[i]);
    }
    expect(sequence[0]).toBe(1);
    expect(sequence[sequence.length - 1]).toBe(3);
    expect(route.estimatedMinutes).toBeGreaterThan(0);
  });
});

describe('calculatePathDistance', () => {
  it('sums segment lengths including vertical travel between floors', () => {
    const pts = [waypoint(0, 0, 'ground'), waypoint(3, 4, 'ground'), { ...waypoint(3, 4, 'first') }];
    const first = FLOORS.find(f => f.id === 'first')!;
    pts[2].y = first.baseY;
    expect(Math.round(calculatePathDistance(pts))).toBe(5 + first.baseY);
  });
});

describe('generateExhibitionTourPlan', () => {
  const nonStairsCount = FLOORS.reduce(
    (n, f) => n + f.exhibits.filter(e => !e.id.includes('_str') && !e.id.includes('stairs')).length,
    0
  );
  const tour = generateExhibitionTourPlan(PRESET_START_POINTS.main_entrance);

  it('visits every non-stairs exhibit exactly once with sequential stop numbers', () => {
    expect(tour.stops).toHaveLength(nonStairsCount);
    const ids = tour.stops.map(s => s.exhibit.id);
    expect(new Set(ids).size).toBe(nonStairsCount);
    tour.stops.forEach((s, i) => expect(s.stopIndex).toBe(i + 1));
  });

  it('produces a connected path with sane totals', () => {
    expect(tour.fullPathPoints.length).toBeGreaterThan(tour.stops.length);
    expect(tour.totalDistanceMeters).toBeGreaterThan(0);
    expect(tour.estimatedMinutes).toBeGreaterThan(0);
    expect(tour.totalExhibits).toBe(nonStairsCount);
  });

  it('walks less distance on each floor than the old coordinate-sort ordering', () => {
    const walkDistance = (order: Exhibit[], from: { x: number; z: number }) => {
      let total = 0;
      let cur = from;
      for (const ex of order) {
        total += Math.hypot(ex.px - cur.x, ex.pz - cur.z);
        cur = { x: ex.px, z: ex.pz };
      }
      return total;
    };

    const startFloorIdx = FLOORS.findIndex(f => f.id === tour.start.floorId);
    const orderedFloors = [
      ...FLOORS.slice(startFloorIdx),
      ...FLOORS.slice(0, startFloorIdx)
    ];

    let nearestNeighborTotal = 0;
    let sortedTotal = 0;
    let cursor: { x: number; z: number } = { x: tour.start.x, z: tour.start.z };

    orderedFloors.forEach(floor => {
      const rooms = floor.exhibits.filter(e => !e.id.includes('_str') && !e.id.includes('stairs'));
      const nnOrder = tour.stops.filter(s => s.floor.id === floor.id).map(s => s.exhibit);
      nearestNeighborTotal += walkDistance(nnOrder, cursor);
      sortedTotal += walkDistance([...rooms].sort((a, b) => a.px - b.px || a.pz - b.pz), cursor);
      cursor = nnOrder.length
        ? { x: nnOrder[nnOrder.length - 1].px, z: nnOrder[nnOrder.length - 1].pz }
        : cursor;
    });

    expect(nearestNeighborTotal).toBeLessThanOrEqual(sortedTotal + 1e-6);
  });
});
