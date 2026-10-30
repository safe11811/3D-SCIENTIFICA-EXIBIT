import { describe, it } from 'vitest';
import { FLOORS, ARCHITECTURAL_ROOM_OUTLINES, BUILDING_CONFIG } from './data';

describe('Comprehensive Geometry & Clipping Audit', () => {
  it('checks all rooms against staircases, courtyards, and each other', () => {
    const stairs = [
      { id: 'west_stairs', ...BUILDING_CONFIG.WEST_STAIRS },
      { id: 'east_stairs', ...BUILDING_CONFIG.EAST_STAIRS },
      { id: 'basement_stairs', ...BUILDING_CONFIG.BASEMENT_STAIRS }
    ];

    for (const floor of FLOORS) {
      console.log(`\n=================== FLOOR: ${floor.id} ===================`);
      const exhibits = floor.exhibits;
      const outlines = ARCHITECTURAL_ROOM_OUTLINES.filter(o => o.floorId === floor.id);

      // Check exhibits vs exhibits
      for (let i = 0; i < exhibits.length; i++) {
        for (let j = i + 1; j < exhibits.length; j++) {
          const a = exhibits[i];
          const b = exhibits[j];
          if (a.id.includes('quad') || b.id.includes('quad')) continue;
          if (a.id === 'g_cemented' || b.id === 'g_cemented') continue;
          if (a.id === 'g_stage' || b.id === 'g_stage') continue;
          const ax1 = a.px - a.w / 2, ax2 = a.px + a.w / 2;
          const az1 = a.pz - a.d / 2, az2 = a.pz + a.d / 2;
          const bx1 = b.px - b.w / 2, bx2 = b.px + b.w / 2;
          const bz1 = b.pz - b.d / 2, bz2 = b.pz + b.d / 2;
          const ox = Math.min(ax2, bx2) - Math.max(ax1, bx1);
          const oz = Math.min(az2, bz2) - Math.max(az1, bz1);
          if (ox > 0.05 && oz > 0.05) {
            console.warn(`[EXHIBIT-EXHIBIT CLIPPING] ${floor.id}: ${a.id} (${a.room}) overlaps ${b.id} (${b.room}) by (${ox.toFixed(2)}m x ${oz.toFixed(2)}m)`);
          }
        }
      }

      // Check outlines vs exhibits
      for (let i = 0; i < outlines.length; i++) {
        const out = outlines[i];
        const ox1 = out.x - out.w / 2, ox2 = out.x + out.w / 2;
        const oz1 = out.z - out.d / 2, oz2 = out.z + out.d / 2;
        for (const ex of exhibits) {
          if (ex.id.includes('quad') || ex.id === 'g_cemented' || ex.id === 'g_stage') continue;
          const ex1 = ex.px - ex.w / 2, ex2 = ex.px + ex.w / 2;
          const ez1 = ex.pz - ex.d / 2, ez2 = ex.pz + ex.d / 2;
          const ox = Math.min(ox2, ex2) - Math.max(ox1, ex1);
          const oz = Math.min(oz2, ez2) - Math.max(oz1, ez1);
          if (ox > 0.05 && oz > 0.05) {
            console.warn(`[OUTLINE-EXHIBIT CLIPPING] ${floor.id}: Outline #${i} at (${out.x}, ${out.z}) overlaps ${ex.id} (${ex.room}) by (${ox.toFixed(2)}m x ${oz.toFixed(2)}m)`);
          }
        }
      }

      // Check outlines vs outlines
      for (let i = 0; i < outlines.length; i++) {
        for (let j = i + 1; j < outlines.length; j++) {
          const a = outlines[i];
          const b = outlines[j];
          const ax1 = a.x - a.w / 2, ax2 = a.x + a.w / 2;
          const az1 = a.z - a.d / 2, az2 = a.z + a.d / 2;
          const bx1 = b.x - b.w / 2, bx2 = b.x + b.w / 2;
          const bz1 = b.z - b.d / 2, bz2 = b.z + b.d / 2;
          const ox = Math.min(ax2, bx2) - Math.max(ax1, bx1);
          const oz = Math.min(az2, bz2) - Math.max(az1, bz1);
          if (ox > 0.05 && oz > 0.05) {
            console.warn(`[OUTLINE-OUTLINE CLIPPING] ${floor.id}: Outline #${i} at (${a.x}, ${a.z}) overlaps Outline #${j} at (${b.x}, ${b.z}) by (${ox.toFixed(2)}m x ${oz.toFixed(2)}m)`);
          }
        }
      }

      // Check stairs relevant to this floor
      const floorStairs = stairs.filter(st => {
        if (floor.id === 'basement') return st.id !== 'east_stairs';
        if (floor.id === 'first' || floor.id === 'second') return st.id !== 'basement_stairs';
        return true; // ground floor has all
      });

      for (const st of floorStairs) {
        const sx1 = st.x - st.w / 2, sx2 = st.x + st.w / 2;
        const sz1 = st.z - st.d / 2, sz2 = st.z + st.d / 2;
        for (let i = 0; i < outlines.length; i++) {
          const out = outlines[i];
          const ox1 = out.x - out.w / 2, ox2 = out.x + out.w / 2;
          const oz1 = out.z - out.d / 2, oz2 = out.z + out.d / 2;
          const ox = Math.min(ox2, sx2) - Math.max(ox1, sx1);
          const oz = Math.min(oz2, sz2) - Math.max(oz1, sz1);
          if (ox > 0.05 && oz > 0.05) {
            console.warn(`[STAIRS-OUTLINE CLIPPING] ${floor.id}: Outline #${i} at (${out.x}, ${out.z}) overlaps ${st.id} by (${ox.toFixed(2)}m x ${oz.toFixed(2)}m)`);
          }
        }
      }
    }
  });
});
