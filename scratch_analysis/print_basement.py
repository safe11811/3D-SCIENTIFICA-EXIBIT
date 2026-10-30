import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from analyze_rooms_detail import analyze_floor
res = analyze_floor('basement_floor_plan_meters.dxf')
for p in sorted(res['polys'], key=lambda x: (x['layer'], -x['cy'], x['cx'])):
    labs = [t['text'] for t in res['room_labels'] if p['min_x'] - 0.2 <= t['x'] <= p['max_x'] + 0.2 and p['min_y'] - 0.2 <= t['y'] <= p['max_y'] + 0.2]
    dims = [t['text'] for t in res['dim_labels'] if p['min_x'] - 0.2 <= t['x'] <= p['max_x'] + 0.2 and p['min_y'] - 0.2 <= t['y'] <= p['max_y'] + 0.2]
    print(f"[{p['layer']:14}] X:[{p['min_x']:5.2f}, {p['max_x']:5.2f}] Y:[{p['min_y']:5.2f}, {p['max_y']:5.2f}] W:{p['w']:4.1f} D:{p['d']:4.1f} Center:({p['cx']:5.2f}, {p['cy']:5.2f}) -> {labs} ({dims})")
