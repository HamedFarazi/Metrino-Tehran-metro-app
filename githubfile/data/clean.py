import json

with open("pics.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for station in data.values():
    for key in list(station.keys()):
        if key not in ["name", "translations"]:
            del station[key]

with open("pics_clean.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("Done!")