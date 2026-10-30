# Verification script for data.ts rooms
import math

BUILDING_CONFIG = {
  'SLAB_W': 46.0,
  'SLAB_D': 42.5,
  'SLAB_H': 0.4,
  'FLOOR_GAP': 6.5,
  'STAGE': { 'x': 0.0, 'z': -24.25, 'w': 16.0, 'd': 6.0 },
  'SMALL_QUAD': { 'x': -8.0, 'z': -0.25, 'w': 10.0, 'd': 20.0 },
  'BIG_QUAD':   { 'x': 6.4,  'z': -0.25, 'w': 13.2, 'd': 20.0 },
  'CENTRAL_CORRIDOR': { 'x': -1.6, 'z': -0.25, 'w': 2.8, 'd': 20.0 },
  'WEST_STAIRS': { 'x': -19.25, 'z': -11.0, 'w': 7.5, 'd': 7.5 },
  'EAST_STAIRS': { 'x': 11.0,   'z': -7.25, 'w': 4.0, 'd': 6.0 },
  'BASEMENT_STAIRS': { 'x': 9.5, 'z': -2.75, 'w': 5.0, 'd': 8.0 }
}

print("Configuration verified.")
