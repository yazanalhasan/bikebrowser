from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
WORLD = ROOT / "BikeBrowserWorld"
DATA = WORLD / "Data"
OUT = ROOT / "reports" / "region_audit"
OVERNIGHT = ROOT / "reports" / "overnight"


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def log(phase: str, action: str, files: list[str], result: str, telegram: str = "none") -> None:
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sprint": "3",
        "phase": phase,
        "action": action,
        "files_touched": files,
        "result": result,
        "telegram": telegram,
    }
    OVERNIGHT.mkdir(parents=True, exist_ok=True)
    with (OVERNIGHT / "run_log.jsonl").open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, separators=(",", ":")) + "\n")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, data: Any, phase: str, action: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")
    log(phase, action, [rel(path)], "written")


def regions() -> dict[str, dict[str, Any]]:
    raw = read_json(DATA / "regions" / "regions.json")
    return {str(k): v for k, v in raw.items() if isinstance(v, dict)}


def scene_path(res: str) -> Path:
    return WORLD / res[len("res://") :] if res.startswith("res://") else WORLD / res


def parse_nodes(text: str) -> list[dict[str, Any]]:
    nodes = []
    for m in re.finditer(r'\[node name="([^"]+)"(?: type="([^"]+)")?(?: parent="([^"]*)")?(?: instance=ExtResource\("([^"]+)"\))?\](.*?)(?=\n\[node |\Z)', text, re.S):
        nodes.append({"name": m.group(1), "type": m.group(2) or "PackedSceneInstance", "parent": m.group(3) if m.group(3) is not None else ".", "body": m.group(5)})
    return nodes


def structural_for(region_id: str, region: dict[str, Any]) -> dict[str, Any]:
    path = scene_path(str(region.get("scenePath", "")))
    text = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
    nodes = parse_nodes(text)
    root_children = [n["name"] for n in nodes if n["parent"] == "."]
    layer_names = {"Sky", "MountainsFar", "MountainsMid", "Background", "Props", "Interactables", "NPCs", "Stations", "Pickups", "Foreground", "Lighting", "Overlays", "UI"}
    visible_false_polygon = 0
    total_polygon = 0
    for n in nodes:
        if n["type"] == "Polygon2D":
            total_polygon += 1
            if re.search(r"visible\s*=\s*false", n["body"]):
                visible_false_polygon += 1
    parallax = [n["name"] for n in nodes if n["type"] in {"ParallaxBackground", "ParallaxLayer", "Parallax2D"}]
    sprite_y = []
    for m in re.finditer(r'position\s*=\s*Vector2\([^,]+,\s*([-0-9.]+)\)', text):
        try:
            sprite_y.append(float(m.group(1)))
        except ValueError:
            pass
    horizon_estimate = "unknown"
    if sprite_y:
        y_sorted = sorted(sprite_y)
        horizon_estimate = f"approx y={y_sorted[max(0, len(y_sorted)//4)]:.0f} from upper-quartile scene node positions"
    outdoor = region_id not in {"garage", "boot", "system_showcase"}
    depth_layer_count = len([x for x in root_children if x in layer_names]) or len(parallax)
    flags = []
    if "Hud.tscn" not in text and 'name="Hud"' not in text:
        flags.append("MISSING_HUD")
    if "DialogBox.tscn" not in text and 'name="DialogBox"' not in text:
        flags.append("MISSING_DIALOGBOX")
    if outdoor and depth_layer_count < 4:
        flags.append("LAYERS_MISSING")
    if visible_false_polygon > 10:
        flags.append("PLACEHOLDER_DEBT_HIGH")
    if outdoor and "shadow" not in text.lower() and "light" not in text.lower():
        flags.append("PERSPECTIVE_DRIFT_LIGHTING_UNCLEAR")
    status = "PERSPECTIVE_CONFORMS" if not flags else "PERSPECTIVE_DRIFT"
    return {
        "region_id": region_id,
        "scene": rel(path) if path.exists() else str(path),
        "scene_exists": path.exists(),
        "root_children": root_children,
        "canonical_layer_groups_present": [x for x in root_children if x in layer_names],
        "node_count": len(nodes),
        "polygon2d_total": total_polygon,
        "polygon2d_hidden": visible_false_polygon,
        "dialogbox_present": "DialogBox.tscn" in text or 'name="DialogBox"' in text,
        "hud_present": "Hud.tscn" in text or 'name="Hud"' in text,
        "parallax_layers": parallax,
        "depth_layer_count_estimate": depth_layer_count,
        "dominant_light_direction_estimate": "upper-right if existing warm light/shadow assets are used; otherwise unclear",
        "horizon_line_estimate": horizon_estimate,
        "conformance": status,
        "flags": flags,
    }


def main() -> None:
    refs = {
        "brief_exists": (ROOT / "references" / "region_art_direction_brief.md").exists(),
        "regions_reference_dir_exists": (ROOT / "references" / "regions").exists(),
        "master_reference_exists": (ROOT / "references" / "regions" / "00_MASTER_PERSPECTIVE_camelback_scottsdale_aerial.jpg").exists(),
    }
    write_json(OUT / "references.json", refs, "0", "write reference availability")
    rows = []
    for rid, region in regions().items():
        row = structural_for(rid, region)
        rows.append(row)
        write_json(OUT / "structural" / f"{rid}.json", row, "2", f"write structural audit for {rid}")
    conformance = {"regions": rows}
    write_json(OUT / "conformance.json", conformance, "3", "write conformance report")
    lines = ["# Sprint 3 Region & Perspective Audit Summary", "", "## Reference Availability"]
    lines.extend([f"- {k}: {v}" for k, v in refs.items()])
    lines.extend(["", "## Per-region Report Card"])
    for row in rows:
        flags = ", ".join(row["flags"]) if row["flags"] else "OK"
        lines.append(f"- {row['region_id']}: {row['conformance']} ({flags}); hidden Polygon2D={row['polygon2d_hidden']}; layer estimate={row['depth_layer_count_estimate']}")
    lines.extend(["", "## Aggregate Placeholder Debt", f"- Hidden Polygon2D total: {sum(r['polygon2d_hidden'] for r in rows)}", "", "## Regions Needing Perspective/Template Work"])
    need = [r["region_id"] for r in rows if r["flags"]]
    lines.extend([f"- {x}" for x in need] or ["- None"])
    lines.extend(["", "## Recommended Cleanup Order For Sprint 4", "- Start with missing HUD/DialogBox regions: copper_mine, desert_trail, salt_river, dry_wash, system_showcase.", "- Avoid structural churn in garage and neighborhood_street beyond what validation requires.", "- Treat boot and system_showcase as special-case/stub regions."])
    path = OUT / "SUMMARY.md"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("4", "write Sprint 3 summary", [rel(path)], "written")


if __name__ == "__main__":
    main()
