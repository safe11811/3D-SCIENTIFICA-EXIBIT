import requests

query = """
[out:json];
(
  node["name"~"National Public School",i](around:5000, 13.0335, 77.5458);
  way["name"~"National Public School",i](around:5000, 13.0335, 77.5458);
  relation["name"~"National Public School",i](around:5000, 13.0335, 77.5458);
  way["amenity"="school"](around:2000, 13.0335, 77.5458);
);
out body geom;
"""
try:
    r = requests.post("https://overpass-api.de/api/interpreter", data={"data": query}, timeout=15)
    data = r.json()
    print("Found:", len(data.get("elements", [])))
    for elem in data.get("elements", []):
        tags = elem.get("tags", {})
        print(elem.get("id"), tags.get("name"), tags)
except Exception as e:
    print("Error:", e)
