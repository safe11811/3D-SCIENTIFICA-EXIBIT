import { describe, it, expect } from 'vitest';
import { FLOORS, BUILDING_CONFIG, SUBJECTS, ARCHITECTURAL_ROOM_OUTLINES } from './data';
import { parseTimeWindow } from './utils/schedule';

const isStairs = (id: string) => id.includes('_str') || id.includes('stairs');

/** Quads are open-air above ground: only ground-floor rooms must keep clear. */
const overlapsQuad = (x1: number, x2: number, z1: number, z2: number) => {
  const quads = [BUILDING_CONFIG.SMALL_QUAD, BUILDING_CONFIG.BIG_QUAD];
  return quads.some(q => {
    const qx1 = q.x - q.w / 2, qx2 = q.x + q.w / 2;
    const qz1 = q.z - q.d / 2, qz2 = q.z + q.d / 2;
    return x1 < qx2 - 0.01 && x2 > qx1 + 0.01 && z1 < qz2 - 0.01 && z2 > qz1 + 0.01;
  });
};

describe('exhibition data integrity (DXF-derived geometry)', () => {
  it('has globally unique exhibit ids', () => {
    const ids = FLOORS.flatMap(f => f.exhibits.map(e => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('references only defined subjects', () => {
    for (const f of FLOORS) {
      for (const ex of f.exhibits) {
        expect(SUBJECTS[ex.subject], `${ex.id} has subject "${ex.subject}"`).toBeDefined();
      }
    }
  });

  it('keeps every room inside the 46m × 42.5m slab (front-court venues excluded)', () => {
    const halfW = BUILDING_CONFIG.SLAB_W / 2;
    const halfD = BUILDING_CONFIG.SLAB_D / 2;
    // Covered entrance stage, cemented plaza, food truck & APD stall sit in the
    // open front court north of the building by design
    const outsideSlab = new Set(['g_stage', 'g_cemented', 'g_food_truck', 'g_apd_stall']);
    for (const f of FLOORS) {
      for (const ex of f.exhibits) {
        if (outsideSlab.has(ex.id)) continue;
        const x1 = ex.px - ex.w / 2, x2 = ex.px + ex.w / 2;
        const z1 = ex.pz - ex.d / 2, z2 = ex.pz + ex.d / 2;
        expect(
          x2 <= halfW + 0.01 && x1 >= -halfW - 0.01 && z2 <= halfD + 0.01 && z1 >= -halfD - 0.51,
          `${f.id}/${ex.id} extends outside the slab`
        ).toBe(true);
      }
    }
  });

  it('keeps ground-floor rooms clear of the open-air quadrangles', () => {
    for (const ex of FLOORS.find(f => f.id === 'ground')!.exhibits) {
      if (isStairs(ex.id) || ex.id.startsWith('g_quad')) continue; // the quads are themselves venues
      const x1 = ex.px - ex.w / 2, x2 = ex.px + ex.w / 2;
      const z1 = ex.pz - ex.d / 2, z2 = ex.pz + ex.d / 2;
      expect(overlapsQuad(x1, x2, z1, z2), `${ex.id} intersects a quadrangle`).toBe(false);
    }
  });

  it('guarantees quadrangles do not overlap or interfere with staircases', () => {
    const bq = BUILDING_CONFIG.BIG_QUAD;
    const sq = BUILDING_CONFIG.SMALL_QUAD;

    // West Stairs vs Small Quad (on West)
    const ws = BUILDING_CONFIG.WEST_STAIRS;
    const wsEastEdge = ws.x + ws.w / 2;
    const sqWestEdge = sq.x - sq.w / 2;
    expect(wsEastEdge).toBeLessThanOrEqual(sqWestEdge + 0.05);

    // East Stairs vs Big Quad (on East)
    const es = BUILDING_CONFIG.EAST_STAIRS;
    const esWestEdge = es.x - es.w / 2;
    const bqEastEdge = bq.x + bq.w / 2;
    expect(bqEastEdge).toBeLessThanOrEqual(esWestEdge + 0.05);

    // NOTE: BASEMENT_STAIRS also sits east of the Big Quad in X, but it is a
    // below-grade room under the solid ground slab — the 1F/2F courtyard
    // cutout may legally overhang it, so no edge constraint is asserted here.

    // g_quad_b exhibit boundary matches BUILDING_CONFIG
    const gQuad = FLOORS.find(f => f.id === 'ground')!.exhibits.find(e => e.id === 'g_quad_b')!;
    expect(gQuad.px).toBeCloseTo(bq.x, 3);
    expect(gQuad.w).toBeCloseTo(bq.w, 3);
    expect(gQuad.px + gQuad.w / 2).toBeLessThanOrEqual(esWestEdge + 0.05);
  });

  it('spaces floors by the configured level gap', () => {
    for (const f of FLOORS) {
      expect(f.baseY).toBeCloseTo(f.level * BUILDING_CONFIG.FLOOR_GAP, 5);
    }
  });

  it('gives every exhibit hours and a description', () => {
    for (const f of FLOORS) {
      for (const ex of f.exhibits) {
        expect(ex.time.trim().length, `${ex.id} time`).toBeGreaterThan(3);
        expect(ex.desc.trim().length, `${ex.id} desc`).toBeGreaterThan(10);
      }
    }
  });

  it('keeps time windows machine-parseable for most exhibits', () => {
    // Live-status badges derive from these strings; a dip below this share
    // means newly added data drifted from the "10:00 AM – 3:30 PM" convention.
    const all = FLOORS.flatMap(f => f.exhibits);
    const parseable = all.filter(ex => parseTimeWindow(ex.time) !== null).length;
    expect(parseable / all.length).toBeGreaterThanOrEqual(0.75);
  });

  it('validates architectural non-clickable room outlines for all floor slabs', () => {
    expect(ARCHITECTURAL_ROOM_OUTLINES.length).toBeGreaterThanOrEqual(40);
    const halfW = BUILDING_CONFIG.SLAB_W / 2;
    const halfD = BUILDING_CONFIG.SLAB_D / 2;

    const floorsCovered = new Set(ARCHITECTURAL_ROOM_OUTLINES.map(o => o.floorId));
    expect(floorsCovered.has('basement')).toBe(true);
    expect(floorsCovered.has('ground')).toBe(true);
    expect(floorsCovered.has('first')).toBe(true);
    expect(floorsCovered.has('second')).toBe(true);

    // First Floor must have full classroom skeleton outlines so it is not an empty floor plate
    const firstFloorOutlines = ARCHITECTURAL_ROOM_OUTLINES.filter(o => o.floorId === 'first');
    expect(firstFloorOutlines.length).toBeGreaterThanOrEqual(15);

    for (const outline of ARCHITECTURAL_ROOM_OUTLINES) {
      expect(outline.w).toBeGreaterThan(0);
      expect(outline.d).toBeGreaterThan(0);
      const x1 = outline.x - outline.w / 2;
      const x2 = outline.x + outline.w / 2;
      const z1 = outline.z - outline.d / 2;
      const z2 = outline.z + outline.d / 2;

      expect(x1).toBeGreaterThanOrEqual(-halfW - 0.01);
      expect(x2).toBeLessThanOrEqual(halfW + 0.01);
      expect(z1).toBeGreaterThanOrEqual(-halfD - 0.01);
      expect(z2).toBeLessThanOrEqual(halfD + 0.01);

      if (outline.floorId === 'ground') {
        expect(overlapsQuad(x1, x2, z1, z2)).toBe(false);
      }
    }
  });
});
