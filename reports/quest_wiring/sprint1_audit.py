from __future__ import annotations

import ast
import json
import re
from collections import Counter, defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "reports" / "quest_wiring"
OVERNIGHT = ROOT / "reports" / "overnight"
MISSION_DIR = ROOT / "BikeBrowserWorld" / "Data" / "missions"
WORLD = ROOT / "BikeBrowserWorld"
SCENE_ROOTS = [WORLD / "Regions", WORLD / "Prototypes", WORLD / "Systems"]
EXCLUDE_PARTS = {".godot", "addons", "backups", "reports", "references", "project_audit", "tests"}

PROPERTY_NAMES = {
    "quest_id",
    "objective_id",
    "objective_ids",
    "objective_sequence",
    "records_objective",
    "completes_objective",
    "starts_quest",
    "npc_id",
    "dialog_id",
    "prerequisite",
    "prerequisites",
    "required_quest_id",
    "required_flags",
    "layout_path",
}

NAMED_QUESTS = [
    "bridge_quest_3",
    "bridge_material_test",
    "algae_bloom_source",
    "mine_cart_repair",
    "track_the_animal",
    "water_sample_observation",
    "first_safety_check",
    "bridge_quest_2",
    "bridge_quest_1",
    "bridge_quest_4",
    "balance_the_flow",
    "copper_prospector",
    "desert_foraging_samples",
    "desert_water_management",
    "mine_stability_check",
    "river_ecosystem_survey",
    "flat_tire_repair",
]


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def log(action: str, files: list[str] | None, outcome: str, phase: str) -> None:
    OVERNIGHT.mkdir(parents=True, exist_ok=True)
    entry = {
        "time": utc(),
        "sprint": 1,
        "phase": phase,
        "action": action,
        "files_touched": files or [],
        "outcome": outcome,
    }
    with (OVERNIGHT / "run_log.jsonl").open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, separators=(",", ":")) + "\n")


def dump_json(path: Path, data: Any, phase: str, action: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")
    log(action, [rel(path)], "written", phase)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def mission_objectives(data: dict[str, Any]) -> list[str]:
    if isinstance(data.get("steps"), list):
        return [str(step.get("id", "")) for step in data["steps"] if step.get("id")]
    if isinstance(data.get("objectives"), list):
        out = []
        for obj in data["objectives"]:
            out.append(str(obj.get("id", obj)) if isinstance(obj, dict) else str(obj))
        return [x for x in out if x]
    return []


def build_truth_table() -> dict[str, Any]:
    quests = []
    for path in sorted(MISSION_DIR.glob("*.json")):
        data = load_json(path)
        quest_id = str(data.get("id") or data.get("quest_id") or path.stem)
        quests.append(
            {
                "quest_id": quest_id,
                "title": str(data.get("title") or data.get("name") or quest_id),
                "objectives": mission_objectives(data),
                "prerequisites": [str(x) for x in data.get("prerequisites", [])],
                "unlocks": [str(x) for x in data.get("unlocks", [])],
                "region_hint": str(data.get("region_hint") or data.get("region") or ""),
                "deprecated": bool(data.get("deprecated", False)),
                "supersededBy": data.get("supersededBy", ""),
                "file": rel(path),
            }
        )
    out = {"source_dir": rel(MISSION_DIR), "quests": quests}
    dump_json(OUT / "quest_truth_table.json", out, "1", "build quest-objective truth table")
    return out


def parse_value(raw: str) -> Any:
    raw = raw.strip()
    if raw.startswith('"') and raw.endswith('"'):
        return raw[1:-1]
    arr = re.match(r"Array\[String\]\(\[(.*)\]\)", raw)
    if arr:
        return re.findall(r'"([^"]*)"', arr.group(1))
    packed = re.match(r"PackedStringArray\((.*)\)", raw)
    if packed:
        return re.findall(r'"([^"]*)"', packed.group(1))
    if raw in {"true", "false"}:
        return raw == "true"
    return raw


def resource_path(res: str) -> str:
    if res.startswith("res://"):
        return str((WORLD / res[len("res://") :]).resolve())
    return res


def script_class_map() -> dict[str, dict[str, str]]:
    classes: dict[str, dict[str, str]] = {}
    for path in WORLD.rglob("*.gd"):
        if any(part in EXCLUDE_PARTS for part in path.parts):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        cls = re.search(r"^class_name\s+([A-Za-z0-9_]+)", text, re.M)
        ext = re.search(r"^extends\s+(.+)$", text, re.M)
        classes[rel(path)] = {
            "class_name": cls.group(1) if cls else path.stem,
            "extends": ext.group(1).strip().strip('"') if ext else "",
            "has_record_logic": "QuestRegistry.record_objective" in text,
            "has_start_logic": "QuestRegistry.start_quest" in text,
            "lines": str(text.count("\n") + 1),
        }
    return classes


def scene_files() -> list[Path]:
    files: list[Path] = []
    for base in SCENE_ROOTS:
        if base.exists():
            files.extend(base.rglob("*.tscn"))
    return sorted({p for p in files if not any(part in EXCLUDE_PARTS for part in p.parts)})


def parse_scene(path: Path, scripts: dict[str, dict[str, str]]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    ext: dict[str, dict[str, str]] = {}
    nodes: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    for line in lines:
        m = re.match(r'\[ext_resource type="([^"]+)" path="([^"]+)" id="([^"]+)"\]', line)
        if m:
            ext[m.group(3)] = {"type": m.group(1), "path": m.group(2)}
            continue
        m = re.match(r'\[node name="([^"]+)"(?: type="([^"]+)")?(?: parent="([^"]*)")?(?: instance=ExtResource\("([^"]+)"\))?\]', line)
        if m:
            current = {
                "name": m.group(1),
                "type": m.group(2) or "PackedSceneInstance",
                "parent": m.group(3) if m.group(3) is not None else ".",
                "instance_id": m.group(4) or "",
                "props": {},
                "script_path": "",
                "script_class": "",
            }
            if current["instance_id"] in ext:
                current["instance_path"] = ext[current["instance_id"]]["path"]
            nodes.append(current)
            continue
        if current and "=" in line and not line.startswith("["):
            key, value = line.split("=", 1)
            key = key.strip()
            parsed = parse_value(value)
            if key == "script":
                rid = re.search(r'ExtResource\("([^"]+)"\)', value)
                if rid and rid.group(1) in ext:
                    sp = ext[rid.group(1)]["path"]
                    current["script_path"] = sp
                    info = scripts.get(rel(Path(resource_path(sp))), {})
                    current["script_class"] = info.get("class_name", Path(sp).stem)
                    current["script_has_record_logic"] = bool(info.get("has_record_logic"))
                    current["script_has_start_logic"] = bool(info.get("has_start_logic"))
            if key in PROPERTY_NAMES or "quest_id" in key or "objective" in key or key.endswith("_id"):
                current["props"][key] = parsed
    producers: list[dict[str, Any]] = []
    for node in nodes:
        props = node["props"]
        qid = props.get("quest_id") or props.get("starts_quest")
        obj_values: list[str] = []
        for key in ("objective_id", "records_objective", "completes_objective"):
            if props.get(key):
                obj_values.append(str(props[key]))
        if isinstance(props.get("objective_ids"), list):
            obj_values.extend(str(x) for x in props["objective_ids"])
        elif props.get("objective_ids"):
            obj_values.append(str(props["objective_ids"]))
        if qid and obj_values:
            for oid in obj_values:
                producers.append(
                    {
                        "quest_id": str(qid),
                        "objective_id": oid,
                        "producer_node_path": node_path(node),
                        "producer_node_type": node.get("script_class") or node["type"],
                        "scene_file": rel(path),
                        "starts_quest_too": bool(props.get("starts_quest") or node.get("script_has_start_logic")),
                        "prerequisites_declared": [str(props.get("prerequisite") or props.get("required_quest_id") or "")] if (props.get("prerequisite") or props.get("required_quest_id")) else [],
                        "node_has_real_logic_script": bool(node.get("script_has_record_logic")),
                        "linked_npc": str(props.get("npc_id", "")),
                        "linked_dialog": str(props.get("dialog_id", "")),
                    }
                )
    meta = {"scene_file": rel(path), "nodes": len(nodes), "matched_properties": sum(len(n["props"]) for n in nodes), "producer_records": len(producers)}
    return producers, meta


def node_path(node: dict[str, Any]) -> str:
    parent = node.get("parent") or "."
    name = node["name"]
    return "/" + name if parent == "." else "/" + parent.strip("./") + "/" + name


def script_call_producers() -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    call = re.compile(r"QuestRegistry\.(start_quest|record_objective)\(([^\)]*)\)")
    for path in WORLD.rglob("*.gd"):
        if any(part in EXCLUDE_PARTS for part in path.parts):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        default_q = ""
        qm = re.search(r'@export var quest_id\s*:?=?[^"]*"([^"]+)"', text)
        if qm:
            default_q = qm.group(1)
        for idx, line in enumerate(text.splitlines(), 1):
            for m in call.finditer(line):
                args = re.findall(r'"([^"]+)"', m.group(2))
                if m.group(1) == "record_objective":
                    qid = args[0] if len(args) >= 2 else default_q
                    oid = args[1] if len(args) >= 2 else (args[0] if args else "<dynamic>")
                    records.append({"quest_id": qid or "<dynamic>", "objective_id": oid, "producer_node_path": f"{rel(path)}:{idx}", "producer_node_type": "ScriptCall", "scene_file": "", "starts_quest_too": False, "prerequisites_declared": [], "node_has_real_logic_script": True, "linked_npc": "", "linked_dialog": ""})
    return records


def build_producers() -> dict[str, Any]:
    scripts = script_class_map()
    records: list[dict[str, Any]] = []
    scene_meta: list[dict[str, Any]] = []
    for scene in scene_files():
        producers, meta = parse_scene(scene, scripts)
        records.extend(producers)
        scene_meta.append(meta)
    records.extend(script_call_producers())
    out = {"producers": records, "scene_parse": scene_meta, "producer_classes": producer_classes(scripts)}
    dump_json(OUT / "producers.json", out, "2", "parse scene and script objective producers")
    return out


def producer_classes(scripts: dict[str, dict[str, str]]) -> list[dict[str, str]]:
    out = []
    for path, info in scripts.items():
        cls = info.get("class_name", "")
        if any(token in cls for token in ("Station", "Inspectable", "Pickup", "NPC", "Npc", "Hotspot", "Rig")) or info.get("has_record_logic"):
            out.append({"class_name": cls, "path": path, "extends": info.get("extends", "")})
    return sorted(out, key=lambda x: x["class_name"])


def reachability() -> dict[str, Any]:
    regions_path = WORLD / "Data" / "regions" / "regions.json"
    regions = load_json(regions_path).get("regions", []) if regions_path.exists() else []
    scene_by_id = {str(r.get("id")): str(r.get("scene")) for r in regions}
    edges: list[dict[str, str]] = []
    for scene in scene_files():
        if "Regions" not in scene.parts:
            continue
        text = scene.read_text(encoding="utf-8", errors="ignore")
        targets = re.findall(r'target_region\s*=\s*"([^"]+)"', text)
        required = re.findall(r'required_quest_id\s*=\s*"([^"]*)"', text)
        source = next((rid for rid, sp in scene_by_id.items() if sp and sp.replace("res://", "").replace("/", "\\") in str(scene)), scene.stem)
        for i, target in enumerate(targets):
            edges.append({"from": source, "to": target, "required_quest_id": required[i] if i < len(required) else ""})
    def walk(done: set[str]) -> list[str]:
        start = "neighborhood_street" if "neighborhood_street" in scene_by_id else (next(iter(scene_by_id), ""))
        seen = {start} if start else set()
        q = deque(seen)
        while q:
            cur = q.popleft()
            for e in edges:
                if e["from"] == cur and (not e["required_quest_id"] or e["required_quest_id"] in done) and e["to"] not in seen:
                    seen.add(e["to"]); q.append(e["to"])
        return sorted(seen)
    out = {
        "regions": scene_by_id,
        "edges": edges,
        "states": {
            "fresh_save": walk(set()),
            "after_chain_repair_complete": walk({"chain_repair"}),
            "after_act1_capstone_complete": walk({"chain_repair", "act1_regional_readiness"}),
        },
    }
    dump_json(OUT / "scene_reachability.json", out, "3", "compute scene reachability graph")
    return out


def grade(producers: dict[str, Any]) -> dict[str, Any]:
    graded = []
    for p in producers["producers"]:
        typ = p.get("producer_node_type", "")
        if typ == "ScriptCall":
            quality = "SCRIPT_CALL_ONLY"
        elif "Pickup" in typ:
            quality = "PICKUP"
        elif "Inspectable" in typ:
            quality = "GENERIC_STATION"
        elif typ in {"QuestObjectiveStation", "ChallengeStation"}:
            quality = "GENERIC_STATION"
        elif typ in {"WaterQualityStation", "PlantObservationStation", "SafetyCheckStation", "TireRepairStation", "ChainHotspot"} or p.get("node_has_real_logic_script"):
            quality = "REAL_GAMEPLAY"
        elif "Npc" in typ or "NPC" in typ:
            quality = "DIALOG_ONLY"
        else:
            quality = "PLACEHOLDER"
        x = dict(p)
        x["producer_quality"] = quality
        graded.append(x)
    out = {"producers": graded, "quality_distribution": Counter(p["producer_quality"] for p in graded)}
    dump_json(OUT / "producers_graded.json", out, "4", "grade objective producers")
    return out


def build_matrix(truth: dict[str, Any], graded: dict[str, Any], reach: dict[str, Any]) -> dict[str, Any]:
    by_pair: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    scenes_any = set()
    for state in reach["states"].values():
        for rid in state:
            sp = reach["regions"].get(rid, "")
            if sp:
                scenes_any.add(sp.replace("res://", "BikeBrowserWorld/"))
    for p in graded["producers"]:
        by_pair[(p["quest_id"], p["objective_id"])].append(p)
    quests = []
    stale_refs = []
    truth_pairs = {(q["quest_id"], oid) for q in truth["quests"] for oid in q["objectives"]}
    for (qid, oid), ps in by_pair.items():
        if qid and oid and qid != "<dynamic>" and oid != "<dynamic>" and (qid, oid) not in truth_pairs:
            stale_refs.append({"quest_id": qid, "objective_id": oid, "producers": len(ps)})
    for q in truth["quests"]:
        rows = []
        qualities = []
        for oid in q["objectives"]:
            ps = by_pair.get((q["quest_id"], oid), [])
            qualities.extend(p["producer_quality"] for p in ps)
            if not ps:
                status = "NO_PRODUCER"
            elif all(p["producer_quality"] == "SCRIPT_CALL_ONLY" for p in ps):
                status = "SCRIPT_ONLY"
            elif any(p["producer_quality"] == "REAL_GAMEPLAY" for p in ps):
                status = "PLAYABLE_REAL"
            elif any(p["producer_quality"] == "DIALOG_ONLY" for p in ps):
                status = "PLAYABLE_DIALOG"
            elif any(p["producer_quality"] == "PICKUP" for p in ps):
                status = "PLAYABLE_REAL"
            elif any(p["producer_quality"] == "GENERIC_STATION" for p in ps):
                status = "PLAYABLE_GENERIC"
            elif any(p["producer_quality"] == "PLACEHOLDER" for p in ps):
                status = "PLACEHOLDER"
            else:
                status = "NO_PRODUCER"
            rows.append({"objective_id": oid, "objective_status": status, "producer_count": len(ps), "producers": ps})
        statuses = [r["objective_status"] for r in rows]
        if q.get("deprecated"):
            qs = "STALE_DUPLICATE"
        elif statuses and all(s == "NO_PRODUCER" for s in statuses):
            qs = "DATA_ONLY"
        elif any(s in {"NO_PRODUCER", "SCRIPT_ONLY", "PLACEHOLDER", "UNREACHABLE_SCENE", "PREREQUISITE_BROKEN"} for s in statuses):
            qs = "PARTIAL"
        elif any(s == "PLAYABLE_GENERIC" for s in statuses):
            qs = "PLAYABLE_DEGRADED"
        else:
            qs = "PLAYABLE"
        quests.append({"quest_id": q["quest_id"], "quest_status": qs, "objectives": rows, "file": q["file"], "deprecated": q["deprecated"], "prerequisites": q["prerequisites"], "unlocks": q["unlocks"]})
    out = {"quests": quests, "stale_references": stale_refs}
    dump_json(OUT / "MATRIX.json", out, "5", "compute per-quest objective matrix")
    return out


def exposure(matrix: dict[str, Any], truth: dict[str, Any]) -> dict[str, Any]:
    texts = []
    for p in list((WORLD / "Data").rglob("*.json")) + list((WORLD / "Regions").rglob("*.tscn")) + list((WORLD / "Systems").rglob("*.gd")):
        if any(part in EXCLUDE_PARTS for part in p.parts):
            continue
        texts.append((rel(p), p.read_text(encoding="utf-8", errors="ignore")))
    rows = []
    for q in matrix["quests"]:
        if q["quest_status"] not in {"PLAYABLE", "PLAYABLE_DEGRADED"}:
            continue
        refs = [path for path, text in texts if q["quest_id"] in text]
        hidden = len(refs) <= 1
        rows.append({"quest_id": q["quest_id"], "exposure_status": "PLAYABLE_BUT_HIDDEN" if hidden else "EXPOSED", "reference_files": refs[:20]})
    out = {"quests": rows}
    dump_json(OUT / "frontend_exposure.json", out, "6", "check playable quest exposure")
    return out


def dependencies(truth: dict[str, Any]) -> dict[str, Any]:
    ids = {q["quest_id"] for q in truth["quests"]}
    edges = []
    issues = []
    for q in truth["quests"]:
        for p in q["prerequisites"]:
            edges.append({"from": p, "to": q["quest_id"], "type": "prerequisite"})
            if p not in ids:
                issues.append({"type": "MISSING_PREREQUISITE", "quest_id": q["quest_id"], "reference": p})
        for u in q["unlocks"]:
            edges.append({"from": q["quest_id"], "to": u, "type": "unlock"})
            if u not in ids:
                issues.append({"type": "STALE_UNLOCK", "quest_id": q["quest_id"], "reference": u})
    dot = ["digraph quest_dependencies {"]
    for e in edges:
        dot.append(f'  "{e["from"]}" -> "{e["to"]}" [label="{e["type"]}"];')
    dot.append("}")
    (OUT / "dependency_graph.dot").write_text("\n".join(dot) + "\n", encoding="utf-8")
    log("write dependency graph dot", ["reports/quest_wiring/dependency_graph.dot"], "written", "7")
    out = {"edges": edges, "issues": issues}
    dump_json(OUT / "dependency_graph.json", out, "7", "write dependency graph json")
    return out


def coverage(truth: dict[str, Any], matrix: dict[str, Any]) -> dict[str, Any]:
    ids = {q["quest_id"] for q in truth["quests"]}
    rows = []
    for qid in NAMED_QUESTS:
        rows.append({"quest_id": qid, "present_in_truth_table": qid in ids, "present_in_matrix": any(q["quest_id"] == qid for q in matrix["quests"])})
    out = {"named_quest_coverage": rows}
    dump_json(OUT / "named_quest_coverage.json", out, "8", "verify named quest coverage")
    return out


def summary(matrix: dict[str, Any], graded: dict[str, Any], deps: dict[str, Any], exposure_data: dict[str, Any]) -> dict[str, Any]:
    counts = Counter(q["quest_status"] for q in matrix["quests"])
    def qids(status: str) -> list[str]:
        return [q["quest_id"] for q in matrix["quests"] if q["quest_status"] == status]
    data_only = qids("DATA_ONLY")
    partial = qids("PARTIAL")
    degraded = qids("PLAYABLE_DEGRADED")
    stale_duplicate = qids("STALE_DUPLICATE")
    stale_refs = [f"- {x['quest_id']} / {x['objective_id']} ({x['producers']} producers)" for x in matrix["stale_references"][:50]]
    hidden = [f"- {x['quest_id']}" for x in exposure_data["quests"] if x["exposure_status"] == "PLAYABLE_BUT_HIDDEN"]
    dep_issues = [f"- {x['type']}: {x['quest_id']} -> {x['reference']}" for x in deps["issues"]]
    lines = [
        "# Sprint 1 Quest Wiring Matrix Summary",
        "",
        "## Headline Numbers",
        f"- Total quests: {len(matrix['quests'])}",
        *[f"- {k}: {v}" for k, v in sorted(counts.items())],
        "",
        "## DATA_ONLY Quests",
        *( [f"- {x}" for x in data_only] or ["- None"] ),
        "",
        "## PARTIAL Quests",
        *( [f"- {x}" for x in partial] or ["- None"] ),
        "",
        "## PLAYABLE_DEGRADED Quests",
        *( [f"- {x}" for x in degraded] or ["- None"] ),
        "",
        "## STALE_DUPLICATE Quests",
        *( [f"- {x}" for x in stale_duplicate] or ["- None"] ),
        "",
        "## STALE_REFERENCE Objectives",
        *( stale_refs or ["- None"] ),
        "",
        "## PLAYABLE_BUT_HIDDEN Quests",
        *( hidden or ["- None"] ),
        "",
        "## Dependency Graph Issues",
        *( dep_issues or ["- None"] ),
        "",
        "## Producer Quality Distribution",
        *[f"- {k}: {v}" for k, v in sorted(graded["quality_distribution"].items())],
        "",
        "## Recommended Fix Order",
        *( [f"- {x}" for x in data_only + partial] or ["- None"] ),
    ]
    path = OUT / "SUMMARY.md"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("write Sprint 1 summary", [rel(path)], "written", "9")
    return {"counts": counts, "summary_path": rel(path)}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    truth = build_truth_table()
    producers = build_producers()
    reach = reachability()
    graded = grade(producers)
    matrix = build_matrix(truth, graded, reach)
    exposure_data = exposure(matrix, truth)
    deps = dependencies(truth)
    coverage(truth, matrix)
    summary(matrix, graded, deps, exposure_data)


if __name__ == "__main__":
    main()
