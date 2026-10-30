import ezdxf
import os

files = [
    "basement_floor_plan_meters.dxf",
    "ground_floor_plan_meters.dxf",
    "first_floor_plan_meters.dxf"
]

for fname in files:
    path = os.path.join("floorplans", fname)
    doc = ezdxf.readfile(path)
    msp = doc.modelspace()
    print("=" * 60)
    print(f"FILE: {fname}")
    
    layer_entities = {}
    for e in msp:
        layer = e.dxf.layer
        if layer not in layer_entities:
            layer_entities[layer] = []
        layer_entities[layer].append(e)
        
    for layer, ents in sorted(layer_entities.items()):
        types = {}
        for ent in ents:
            t = ent.dxftype()
            types[t] = types.get(t, 0) + 1
        print(f"Layer '{layer}': {len(ents)} entities -> {types}")
        if layer in ('ROOM_LABELS', 'DIMENSIONS', 'COMPASS'):
            continue
        # Print sample or vertices of polylines/lines
        for ent in ents[:10]:
            if ent.dxftype() == 'LWPOLYLINE':
                pts = [ (round(p[0], 2), round(p[1], 2)) for p in ent.get_points() ]
                print(f"   Polyline (closed={ent.is_closed}): {pts}")
            elif ent.dxftype() == 'LINE':
                s = (round(ent.dxf.start.x, 2), round(ent.dxf.start.y, 2))
                e = (round(ent.dxf.end.x, 2), round(ent.dxf.end.y, 2))
                print(f"   Line: {s} -> {e}")
