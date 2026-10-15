#!/usr/bin/env python3
"""Génère le CSV et l'API statique à partir de data/items.json (source de vérité).

Usage : python3 scripts/build.py
"""
import csv
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
API = ROOT / "docs" / "api" / "v1"

PRICE_KEYS = ["price", "eggs", "young", "price_raw", "price_prepared"]


def dump(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=1 if path.parent.name == "items" else None, separators=None if path.parent.name == "items" else (",", ":")) + "\n", encoding="utf-8")


def main():
    db = json.loads((DATA / "items.json").read_text(encoding="utf-8"))
    items, cats, coins, meta = db["items"], db["categories"], db["currencies"], db["meta"]

    # CSV (une ligne par objet, prix en pièces de cuivre)
    with open(DATA / "items.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        head = ["id", "category", "table", "name_fr", "name_en", "full_name_fr", "full_name_en"]
        for k in PRICE_KEYS:
            head += [f"{k}_text_fr", f"{k}_text_en", f"{k}_min_cp", f"{k}_max_cp"]
        head += ["weight_text", "weight_lb", "notes_fr"]
        w.writerow(head)
        for it in items:
            row = [it["id"], it["category"], it["source"]["table"], it["name"]["fr"], it["name"]["en"],
                   it["full_name"]["fr"], it["full_name"]["en"]]
            for k in PRICE_KEYS:
                p = it.get(k)
                row += [p["text"]["fr"], p["text"]["en"], p["min_cp"], p["max_cp"]] if p else ["", "", "", ""]
            wt = it.get("weight")
            row += [wt["text"], wt["lb"]] if wt else ["", ""]
            row.append(" | ".join(it["notes"]["fr"]))
            w.writerow(row)

    # API statique
    if API.exists():
        shutil.rmtree(API)
    by_cat = {}
    for it in items:
        by_cat.setdefault(it["category"], []).append(it)
        dump(API / "items" / f"{it['id']}.json", it)
    dump(API / "items.json", {"count": len(items), "items": items})
    dump(API / "categories.json", {"count": len(cats), "categories": cats})
    for c in cats:
        dump(API / "categories" / f"{c['id']}.json", {**c, "items": by_cat.get(c["id"], [])})
    dump(API / "currencies.json", {"count": len(coins), "currencies": coins})
    # index léger pour la recherche
    # p/pe : prix affiché (fr/en), m : prix minimal en pc (tri et budget), n : l'objet a des notes
    # x : prix maximal en pc s'il diffère, pl : prix « à partir de », w : poids en livres (le sac)
    def entry(it):
        pr = it.get("price") or it.get("eggs") or it.get("price_raw") or {}
        e = {"id": it["id"], "c": it["category"], "fr": it["full_name"]["fr"], "en": it["full_name"]["en"],
             "p": pr.get("text", {}).get("fr"), "pe": pr.get("text", {}).get("en"), "m": pr.get("min_cp")}
        if pr.get("max_cp") not in (None, pr.get("min_cp")):
            e["x"] = pr["max_cp"]
        if pr.get("plus"):
            e["pl"] = 1
        if (it.get("weight") or {}).get("lb") is not None:
            e["w"] = it["weight"]["lb"]
        if it["notes"]["fr"]:
            e["n"] = 1
        return e
    dump(API / "search.json", [entry(it) for it in items])
    dump(API / "index.json", {
        **meta,
        "endpoints": {
            "items": "items.json",
            "item": "items/{id}.json",
            "categories": "categories.json",
            "category": "categories/{id}.json",
            "currencies": "currencies.json",
            "search_index": "search.json",
        },
        "counts": {"items": len(items), "categories": len(cats)},
    })
    # textes servis par GitHub Pages, pour la page « Texte »
    (ROOT / "docs" / "textes").mkdir(exist_ok=True)
    for name in ["the-great-net-equipment-list.en.txt", "la-grande-liste-d-equipement-du-net.fr.txt"]:
        shutil.copyfile(ROOT / "textes" / name, ROOT / "docs" / "textes" / name)
    print(f"{len(items)} objets, {len(cats)} catégories → {API.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
