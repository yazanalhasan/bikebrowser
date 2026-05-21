from __future__ import annotations

import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
WORLD = ROOT / "BikeBrowserWorld"
DATA = WORLD / "Data"
OUT = ROOT / "reports" / "content_audit"
OVERNIGHT = ROOT / "reports" / "overnight"
EXCLUDES = {".git", ".godot", "node_modules", "backups", "reports", "project_audit", "references"}


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def log(phase: str, action: str, files: list[str], result: str, telegram: str = "none") -> None:
    OVERNIGHT.mkdir(parents=True, exist_ok=True)
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sprint": "2",
        "phase": phase,
        "action": action,
        "files_touched": files,
        "result": result,
        "telegram": telegram,
    }
    with (OVERNIGHT / "run_log.jsonl").open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, separators=(",", ":")) + "\n")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, data: Any, phase: str, action: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")
    log(phase, action, [rel(path)], "written")


def scan_files() -> list[Path]:
    files = []
    for ext in ("*.tscn", "*.gd", "*.json", "*.tres"):
        for path in WORLD.rglob(ext):
            if any(part in EXCLUDES for part in path.parts):
                continue
            files.append(path)
    return sorted(files)


def text_index() -> list[tuple[str, str]]:
    out = []
    for path in scan_files():
        out.append((rel(path), path.read_text(encoding="utf-8", errors="ignore")))
    return out


def inventory_dialogue() -> list[dict[str, Any]]:
    rows = []
    for path in sorted((DATA / "dialogue").glob("*.json")) if (DATA / "dialogue").exists() else []:
        data = read_json(path)
        voices = []
        for match in re.finditer(r'"voice"\s*:\s*"([^"]+)"', path.read_text(encoding="utf-8")):
            voices.append(match.group(1))
        rows.append({"dialog_id": data.get("id", path.stem), "npc_id": data.get("npc_id", ""), "speaker": data.get("speaker", ""), "voices": sorted(set(voices)), "file": rel(path)})
    return rows


def inventory_voice() -> list[dict[str, Any]]:
    path = DATA / "audio" / "voice_profiles.json"
    if not path.exists():
        return []
    data = read_json(path)
    if isinstance(data, dict) and isinstance(data.get("profiles"), list):
        profiles = data["profiles"]
    elif isinstance(data, dict):
        profiles = [{"voice_id": k, **(v if isinstance(v, dict) else {})} for k, v in data.items()]
    else:
        profiles = []
    return [{"voice_id": str(p.get("voice_id") or p.get("id") or p.get("npc_id") or ""), "npc_id": str(p.get("npc_id", "")), "file": rel(path)} for p in profiles]


def inventory_npcs() -> list[dict[str, Any]]:
    rows = []
    npc_dir = DATA / "npcs"
    for path in sorted(npc_dir.glob("*.json")) if npc_dir.exists() else []:
        data = read_json(path)
        rows.append({"npc_id": data.get("id", path.stem), "dialogue": data.get("dialogue", data.get("dialogue_id", "")), "file": rel(path)})
    for path in sorted((WORLD / "Regions" / "NPCs").glob("*.tscn")) if (WORLD / "Regions" / "NPCs").exists() else []:
        text = path.read_text(encoding="utf-8", errors="ignore")
        ids = re.findall(r'npc_id\s*=\s*"([^"]+)"', text)
        rows.append({"npc_id": ids[0] if ids else path.stem, "scene": rel(path), "file": rel(path)})
    return rows


def inventory_items() -> list[dict[str, Any]]:
    path = DATA / "items" / "items.json"
    if not path.exists():
        return []
    data = read_json(path)
    raw = data.get("items", data if isinstance(data, list) else [])
    if isinstance(raw, dict):
        raw = [{"id": k, **(v if isinstance(v, dict) else {})} for k, v in raw.items()]
    return [{"item_id": str(x.get("id", "")), "file": rel(path)} for x in raw if isinstance(x, dict)]


def inventory_layouts() -> list[dict[str, Any]]:
    rows = []
    for path in sorted((DATA / "layouts").glob("*.json")) if (DATA / "layouts").exists() else []:
        rows.append({"layout_id": path.stem, "file": rel(path)})
    return rows


def inventory_materials() -> list[dict[str, Any]]:
    rows = []
    mat_dir = DATA / "materials"
    for path in sorted(mat_dir.glob("*.json")) if mat_dir.exists() else []:
        data = read_json(path)
        raw = data.get("materials", data if isinstance(data, list) else [])
        if isinstance(raw, dict):
            raw = [{"id": k, **(v if isinstance(v, dict) else {})} for k, v in raw.items()]
        for item in raw:
            if isinstance(item, dict):
                rows.append({"material_id": str(item.get("id", "")), "file": rel(path)})
    return rows


def inventory_audio_cues() -> list[dict[str, Any]]:
    rows = []
    for base in [WORLD / "Assets" / "Audio", WORLD / "assets" / "audio", ROOT / "assets" / "audio"]:
        if base.exists():
            for path in sorted(list(base.rglob("*.wav")) + list(base.rglob("*.ogg")) + list(base.rglob("*.mp3"))):
                rows.append({"cue_id": path.stem, "file": rel(path)})
    return rows


def inventory_scripts(kind: str) -> list[dict[str, Any]]:
    rows = []
    token = "Station" if kind == "station" else "Inspectable"
    for path in sorted(WORLD.rglob("*.gd")):
        if any(part in EXCLUDES for part in path.parts):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        if token in path.stem or re.search(r"class_name\s+.*" + token, text):
            cls = re.search(r"class_name\s+([A-Za-z0-9_]+)", text)
            rows.append({"class_name": cls.group(1) if cls else path.stem, "file": rel(path)})
    return rows


def references_for(id_value: str, index: list[tuple[str, str]], own_file: str = "") -> list[str]:
    if not id_value:
        return []
    return [path for path, text in index if path != own_file and id_value in text]


def findings(name: str, id_key: str, rows: list[dict[str, Any]], index: list[tuple[str, str]]) -> list[dict[str, Any]]:
    out = []
    for row in rows:
        idv = str(row.get(id_key, ""))
        refs = references_for(idv, index, row.get("file", ""))
        out.append({**row, "reference_count": len(refs), "references": refs[:30], "status": "REFERENCED" if refs else "UNREFERENCED"})
    return out


def registered_regions() -> dict[str, dict[str, Any]]:
    path = DATA / "regions" / "regions.json"
    raw = read_json(path)
    return {str(k): v for k, v in raw.items() if isinstance(v, dict)}


def scene_path(res: str) -> Path:
    return WORLD / res[len("res://") :] if res.startswith("res://") else WORLD / res


def region_coverage(mission_ids: set[str], dialogue_ids: set[str]) -> list[dict[str, Any]]:
    rows = []
    for rid, region in registered_regions().items():
        path = scene_path(str(region.get("scenePath", "")))
        text = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
        stations = []
        for block in re.finditer(r'\[node name="([^"]+)"[^\]]*\](.*?)(?=\n\[node |\Z)', text, re.S):
            body = block.group(2)
            name = block.group(1)
            if "quest_id" in body or "objective_id" in body:
                q = re.search(r'quest_id\s*=\s*"([^"]+)"', body)
                stations.append({"node": name, "quest_id": q.group(1) if q else "", "quest_valid": (q.group(1) in mission_ids) if q else False})
        npc_refs = sorted(set(re.findall(r'Regions/NPCs/([^".]+)', text) + re.findall(r'npc_id\s*=\s*"([^"]+)"', text)))
        dialog_refs = sorted(set(re.findall(r'dialog(?:ue)?_id\s*=\s*"([^"]+)"', text)))
        rows.append({
            "region_id": rid,
            "scene": rel(path) if path.exists() else str(path),
            "scene_exists": path.exists(),
            "hud_present": "Hud.tscn" in text or 'name="Hud"' in text,
            "dialogbox_present": "DialogBox.tscn" in text or 'name="DialogBox"' in text,
            "npc_refs": npc_refs,
            "dialog_refs": dialog_refs,
            "dialog_refs_valid": {d: d in dialogue_ids for d in dialog_refs},
            "stations": stations,
            "station_count": len(stations),
            "pickup_count": len(re.findall(r"ResourcePickup|Pickup", text)),
        })
    return rows


def scene_orphans(index: list[tuple[str, str]], known_ids: set[str]) -> list[dict[str, Any]]:
    out = []
    id_patterns = [r'\b(?:dialogue_id|dialog_id|npc_id|voice_id|item_id|material_id|layout_id)\s*=\s*"([^"]+)"', r'"(?:dialogue_id|dialog_id|npc_id|voice_id|item_id|material_id|layout_id)"\s*:\s*"([^"]+)"']
    for path, text in index:
        for pat in id_patterns:
            for found in re.findall(pat, text):
                if found and found not in known_ids:
                    out.append({"file": path, "id": found, "status": "REFERENCE_WITHOUT_INVENTORY_MATCH"})
    return out


def main() -> None:
    index = text_index()
    inventories = {
        "dialogue": ("dialog_id", inventory_dialogue()),
        "voice": ("voice_id", inventory_voice()),
        "npcs": ("npc_id", inventory_npcs()),
        "items": ("item_id", inventory_items()),
        "materials": ("material_id", inventory_materials()),
        "audio_cues": ("cue_id", inventory_audio_cues()),
        "layouts": ("layout_id", inventory_layouts()),
        "station_scripts": ("class_name", inventory_scripts("station")),
        "inspectable_scripts": ("class_name", inventory_scripts("inspectable")),
    }
    known_ids = set()
    for system, (id_key, rows) in inventories.items():
        write_json(OUT / "inventory" / f"{system}.json", rows, "1", f"write {system} inventory")
        known_ids.update(str(r.get(id_key, "")) for r in rows if r.get(id_key))
    for system, (id_key, rows) in inventories.items():
        write_json(OUT / "findings" / f"{system}_findings.json", findings(system, id_key, rows, index), "2", f"write {system} findings")
    orphans = scene_orphans(index, known_ids)
    write_json(OUT / "findings" / "scene_orphans.json", orphans, "3", "write reverse scene orphan findings")
    mission_ids = {json.loads(p.read_text(encoding="utf-8-sig")).get("id", p.stem) for p in (DATA / "missions").glob("*.json")}
    dialogue_ids = {r["dialog_id"] for r in inventories["dialogue"][1]}
    coverage = region_coverage(mission_ids, dialogue_ids)
    write_json(OUT / "region_coverage.json", coverage, "4", "write region coverage")
    inv_counts = {k: len(v[1]) for k, v in inventories.items()}
    critical = []
    for system, (id_key, rows) in inventories.items():
        for row in findings(system, id_key, rows, index):
            if row["status"] == "UNREFERENCED":
                critical.append(f"{system}: {row.get(id_key)}")
    critical_lines = [f"- {x}" for x in critical[:80]] or ["- None"]
    orphan_lines = [f"- {x['file']}: {x['id']}" for x in orphans[:80]] or ["- None"]
    lines = [
        "# Sprint 2 Content Reachability Summary",
        "",
        "## Inventory Counts",
        *[f"- {k}: {v}" for k, v in sorted(inv_counts.items())],
        "",
        "## Critical Orphans",
        *critical_lines,
        "",
        "## Scene-side Orphans",
        *orphan_lines,
        "",
        "## Region Coverage Gaps",
    ]
    for row in coverage:
        gaps = []
        if not row["hud_present"]:
            gaps.append("MISSING_HUD")
        if not row["dialogbox_present"]:
            gaps.append("MISSING_DIALOGBOX")
        bad_stations = [s["node"] for s in row["stations"] if s["quest_id"] and not s["quest_valid"]]
        if bad_stations:
            gaps.append("INVALID_STATION_QUEST:" + ",".join(bad_stations))
        lines.append(f"- {row['region_id']}: {', '.join(gaps) if gaps else 'OK'}")
    lines.extend(["", "## Recommended Sprint Order", "- Use Sprint 1 DATA_ONLY order for quest wiring.", "- Fix missing HUD/DialogBox during Sprint 4 structural cleanup.", "- Resolve unreferenced dialogue/NPC ids after core objective producers are wired."])
    summary_path = OUT / "SUMMARY.md"
    summary_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("5", "write Sprint 2 summary", [rel(summary_path)], "written")


if __name__ == "__main__":
    main()
